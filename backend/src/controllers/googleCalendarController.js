import { google } from 'googleapis';
import User from '../models/User.js';
import Schedule from '../models/Schedule.js';
import { getActiveWeekOf } from './scheduleController.js';

// Day name → offset from Monday (0=Mon, 1=Tue, … 6=Sun)
const DAY_OFFSET = {
    Monday:    0,
    Tuesday:   1,
    Wednesday: 2,
    Thursday:  3,
    Friday:    4,
    Saturday:  5,
    Sunday:    6,
};

/**
 * Given the weekOf (a Monday date) and a day name, return the exact Date
 * for that specific day in that week.
 */
function getExactDate(weekOf, dayName) {
    const d = new Date(weekOf);
    d.setDate(d.getDate() + DAY_OFFSET[dayName]);
    return d;
}

// ── Build an OAuth2 client using env vars ─────────────────────────────────────
function buildOAuth2Client() {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI,
    );
}

// ── GET /api/google/auth-url ──────────────────────────────────────────────────
// Returns the consent screen URL. The frontend opens this in a new tab.
const getAuthUrl = (req, res) => {
    const oauth2Client = buildOAuth2Client();
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',   // gets refresh_token
        prompt: 'consent',        // always show consent screen so refresh_token is returned
        scope: [
            'https://www.googleapis.com/auth/calendar.events',
        ],
        state: req.user._id.toString(), // pass userId so callback can save tokens to the right user
    });
    res.json({ url });
};

// ── GET /api/google/callback?code=... ────────────────────────────────────────
// Google redirects here after the user approves.
// We exchange the one-time `code` for tokens and persist them.
const handleCallback = async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).json({ message: 'Missing code parameter' });

    try {
        const oauth2Client = buildOAuth2Client();
        const { tokens } = await oauth2Client.getToken(code);

        // Persist tokens to the currently logged-in user.
        // Note: the callback URL is visited by the browser, so we cannot rely on
        // the Authorization header here; we use a short-lived `state` param instead.
        // For simplicity we store userId in the state query param (set during auth-url).
        const { state: userId } = req.query;
        if (!userId) return res.status(400).json({ message: 'Missing state (userId)' });

        await User.findByIdAndUpdate(userId, { googleTokens: tokens });

        // Close the popup / redirect back to the app
        res.send(`
            <html>
              <body style="background:#0f0f14;color:white;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
                <div style="text-align:center;">
                  <h2>✅ Google Calendar Connected!</h2>
                  <p style="color:#aaa">You can close this tab now.</p>
                  <script>
                    window.opener && window.opener.postMessage('google-auth-success', '*');
                    setTimeout(() => window.close(), 1500);
                  </script>
                </div>
              </body>
            </html>
        `);
    } catch (err) {
        console.error('Google OAuth callback error:', err.message);
        res.status(500).json({ message: 'OAuth callback failed', error: err.message });
    }
};

// ── GET /api/google/status ────────────────────────────────────────────────────
// Tells the frontend whether the current user has connected Google Calendar.
const getStatus = async (req, res) => {
    const user = await User.findById(req.user._id).select('googleTokens');
    const connected = !!(user?.googleTokens?.refresh_token);
    res.json({ connected });
};

// ── DELETE /api/google/disconnect ────────────────────────────────────────────
// Removes stored tokens so the user can re-connect or revoke access.
const disconnect = async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, { googleTokens: {} });
    res.json({ message: 'Google Calendar disconnected' });
};

// ── POST /api/google/sync ─────────────────────────────────────────────────────
// Reads the user's 8-Track schedule for the ACTIVE WEEK and creates single
// (non-recurring) events in their Google Calendar for each class slot.
// Auto-cleans up events from the previous week and any already-synced events
// from the active week to avoid duplicates.
const syncSchedule = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('googleTokens');
        if (!user?.googleTokens?.refresh_token) {
            return res.status(400).json({ message: 'Google Calendar not connected. Please connect first.' });
        }

        const oauth2Client = buildOAuth2Client();
        oauth2Client.setCredentials(user.googleTokens);

        // Auto-refresh tokens when they expire
        oauth2Client.on('tokens', async (tokens) => {
            if (tokens.refresh_token) {
                await User.findByIdAndUpdate(req.user._id, { googleTokens: tokens });
            }
        });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        // Fetch schedule for the active week only
        const weekOf = getActiveWeekOf();
        const scheduleDocs = await Schedule.find({ userId: req.user._id, weekOf });

        // Compute timeframe for cleanup: [Previous Monday to Next Monday]
        const previousWeekMonday = new Date(weekOf);
        previousWeekMonday.setDate(previousWeekMonday.getDate() - 7);

        const nextWeekMonday = new Date(weekOf);
        nextWeekMonday.setDate(nextWeekMonday.getDate() + 7);

        // --- STEP 1: CLEANUP PREVIOUS & CURRENT WEEK ---
        // We find all events in the target timeframe and wipe out the ones 
        // that were synced by 8-Track. This handles both the previous week cleanup
        // and duplicate-prevention for the current week.
        let pageToken = null;
        let eventsToDelete = [];
        
        do {
            const listRes = await calendar.events.list({
                calendarId: 'primary',
                timeMin: previousWeekMonday.toISOString(),
                timeMax: nextWeekMonday.toISOString(),
                maxResults: 2500,
                singleEvents: true, // Expand recurring events if any still exist
                pageToken: pageToken
            });
            
            const items = listRes.data.items || [];
            for (const item of items) {
                if (item.description && item.description.includes('Class synced from 8-Track')) {
                    eventsToDelete.push(item.id);
                }
            }
            pageToken = listRes.data.nextPageToken;
        } while (pageToken);

        let deletedCount = 0;
        if (eventsToDelete.length > 0) {
            // Delete in parallel
            await Promise.allSettled(eventsToDelete.map(eventId => 
                calendar.events.delete({ calendarId: 'primary', eventId })
            )).then(results => {
                deletedCount = results.filter(r => r.status === 'fulfilled').length;
            });
        }

        // --- STEP 2: RECREATE CURRENT WEEK ---
        // Compute the week range label for the event description
        const weekEnd = new Date(weekOf);
        weekEnd.setDate(weekEnd.getDate() + 6); // Sunday of this week
        const weekLabel = `${weekOf.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} – ${weekEnd.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;

        let created = 0;
        let skipped = 0;

        for (const dayDoc of scheduleDocs) {
            if (dayDoc.isHoliday || !dayDoc.slots || dayDoc.slots.length === 0) {
                skipped++;
                continue;
            }

            // Get the exact calendar date for this slot (e.g. specific Monday, specific Tuesday)
            const exactDate = getExactDate(weekOf, dayDoc.day);

            for (const slot of dayDoc.slots) {
                const [startHour, startMin] = slot.startTime.split(':').map(Number);
                const [endHour, endMin]     = slot.endTime.split(':').map(Number);

                // Build Date objects for the event's start/end on the exact day
                const startDate = new Date(exactDate);
                startDate.setHours(startHour, startMin, 0, 0);

                const endDate = new Date(exactDate);
                endDate.setHours(endHour, endMin, 0, 0);

                const event = {
                    summary: slot.subjectName,
                    location: slot.room || '',
                    description: `Class synced from 8-Track | Week of ${weekLabel} | Synced on ${new Date().toLocaleDateString('en-IN')}`,
                    start: {
                        dateTime: startDate.toISOString(),
                        timeZone: process.env.TIMEZONE || 'Asia/Kolkata',
                    },
                    end: {
                        dateTime: endDate.toISOString(),
                        timeZone: process.env.TIMEZONE || 'Asia/Kolkata',
                    },
                    // No recurrence — this is a one-time event for this specific date
                    colorId: '5', // banana yellow – closest to 8-Track's theme
                };

                await calendar.events.insert({
                    calendarId: 'primary',
                    resource: event,
                });

                created++;
            }
        }

        res.json({
            message: `Sync complete! Cleaned up ${deletedCount} past records. Created ${created} events for the week of ${weekLabel}.`,
            created,
            skipped,
            deleted: deletedCount,
            weekOf: weekOf.toISOString(),
        });
    } catch (err) {
        console.error('Google Calendar sync error:', err.message);
        res.status(500).json({ message: 'Sync failed', error: err.message });
    }
};

export { getAuthUrl, handleCallback, getStatus, disconnect, syncSchedule };
