🔴 Bottleneck 1 — DB Query On Every Auth Request (N+1 on Auth Middleware)
Code Evidence → 

auth.js:L15

js
const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
const user = await User.findById(decoded.id).select('-password -refreshToken');
The Problem: Every single protected API route (attendance, subjects, schedule, etc.) fires a full User.findById() MongoDB query just to confirm the user exists. On a dashboard load that fires 5 simultaneous API calls, that's 5 unnecessary DB round trips per request.

Solution:

js
// ✅ Stop doing a DB lookup if the JWT is valid — trust the token payload
const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
req.user = { id: decoded.id, email: decoded.email }; // Use token claims directly
next();
// Only do DB lookup in specific routes where full user document is needed
JWT is a signed, tamper-proof payload. If the signature verifies, trust it. Reserve the DB call for profile-critical endpoints only.

🔴 Bottleneck 2 — N+1 Sequential DB Queries in Schedule Fetching
Code Evidence → 

scheduleController.js:L64-L85

js
// ❌ Fires 7 separate DB queries in a sequential loop — one per day of the week
for (const day of DAYS) {
    let doc = await Schedule.findOne({ userId, day, weekOf });
    if (!doc) {
        doc = await Schedule.create({ ... });
    }
    docs.push(doc);
}
The Problem: For every GET /api/schedule request, the backend fires 7 sequential MongoDB queries (one for each weekday). On a slow connection with a 10ms round-trip to Atlas, this alone adds 70ms+ of database latency before any response is sent.

Solution — Single Query + Bulk Insert:

js
// ✅ Fetch all 7 days in one round trip
const existingDocs = await Schedule.find({ userId, weekOf });
const existingDays = new Set(existingDocs.map(d => d.day));
// Create only the missing days in one bulk write
const missing = DAYS.filter(d => !existingDays.has(d));
if (missing.length > 0) {
    await Schedule.insertMany(
        missing.map(day => ({ userId, day, weekOf, isHoliday: false, slots: [] }))
    );
}
// One final query to get all 7 properly sorted
const docs = await Schedule.find({ userId, weekOf }).sort(...);
🔴 Bottleneck 3 — syncMissedAttendance() Runs Synchronously on Every Read Request
Code Evidence → 

attendanceController.js:L196
 and 

L273

js
// ❌ Called BEFORE every attendance read — blocks the HTTP response
const getAttendanceHistory = async (req, res, next) => {
    await syncMissedAttendance(req.user._id); // 3 DB queries + loops + writes
    const history = await Attendance.find({ ... });
    ...
};
const getGlobalAttendance = async (req, res, next) => {
    await syncMissedAttendance(req.user._id); // Same cost — runs again
    ...
};
The Problem: syncMissedAttendance() internally runs at minimum 3 DB queries (schedule fetch, attendance fetch, subjects fetch) plus individual subject.save() writes per missed slot — all synchronously blocking the response. Every attendance page load incurs this full cost even when nothing has changed.

Solution — Background Job with Debounce Timestamp:

js
// ✅ Track the last sync time in the User document
// Only run sync if it hasn't run in the last 30 minutes
const SYNC_COOLDOWN_MS = 30 * 60 * 1000;
const getAttendanceHistory = async (req, res, next) => {
    const lastSync = req.user.lastSyncedAt;
    if (!lastSync || Date.now() - lastSync > SYNC_COOLDOWN_MS) {
        // Fire and forget — don't block the response
        syncMissedAttendance(req.user._id).catch(console.error);
        User.findByIdAndUpdate(req.user._id, { lastSyncedAt: new Date() }).exec();
    }
    // Serve the current history immediately
    const history = await Attendance.find({ ... });
    ...
};
🟡 Bottleneck 4 — In-Memory Cache (node-cache) Doesn't Scale Horizontally
Code Evidence → 

cache.js:L1-L4

js
import NodeCache from 'node-cache';
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
The Problem: node-cache stores data in the Node.js process heap. When the application is deployed with multiple server instances (e.g., 2 replicas on Render or Railway for load balancing), each instance has its own isolated cache. User A's request hitting Instance 1 won't benefit from data cached by Instance 2. Additionally, when the server restarts (deployment, crash), the entire cache is wiped.

Solution — Replace with Redis:

js
// ✅ Redis is an external, shared, persistent cache store
import { createClient } from 'redis';
const redis = createClient({ url: process.env.REDIS_URL });
export const cacheMiddleware = async (req, res, next) => {
    const key = `cache:${req.user.id}:${req.originalUrl}`;
    const cached = await redis.get(key);
    if (cached) return res.json(JSON.parse(cached));
    const originalJson = res.json.bind(res);
    res.json = (body) => {
        redis.setEx(key, 300, JSON.stringify(body)); // TTL = 300s
        return originalJson(body);
    };
    next();
};
🟡 Bottleneck 5 — OTP Generation Uses Math.random() (Not Cryptographically Secure)
Code Evidence → 

authController.js:L226

js
// ❌ Math.random() is not cryptographically secure
const otp = Math.floor(100000 + Math.random() * 900000).toString();
The Problem: Math.random() uses a seeded Pseudo-Random Number Generator (PRNG). While it's fine for UI animations, it is not suitable for security tokens. Sophisticated attackers can potentially predict values if they know the seed state.

Solution — Node.js crypto module:

js
// ✅ crypto.randomInt() uses the OS entropy pool — truly unpredictable
import { randomInt } from 'crypto';
const otp = randomInt(100000, 999999).toString();
🟡 Bottleneck 6 — No Rate Limiting on Auth or OTP Endpoints
Code Evidence → 

index.js
 — No express-rate-limit middleware applied.

The Problem: The endpoints POST /api/auth/send-otp, POST /api/auth/login, and POST /api/auth/forgot-password are exposed without any request throttling. An attacker can:

Brute-force OTP codes (only 900,000 possibilities for a 6-digit code).
Spam send-otp to trigger thousands of Gmail SMTP requests, hitting Gmail's rate limit and blocking all real users from receiving emails.
Solution:

js
import rateLimit from 'express-rate-limit';
const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15-minute window
    max: 5,                    // Max 5 OTP requests per IP per window
    message: { message: 'Too many OTP requests, please try again later.' },
});
const loginLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 10,
});
app.use('/api/auth/send-otp', otpLimiter);
app.use('/api/auth/forgot-password', otpLimiter);
app.use('/api/auth/login', loginLimiter);
🟡 Bottleneck 7 — Subject Stats are Denormalized Counters (Data Integrity Risk)
Code Evidence → 

attendanceController.js:L85-L88

js
// These counters can drift out of sync if any write partially fails
subject.totalClasses += 1;
subject.percentage = calcPercentage(subject.attendedClasses, subject.totalClasses);
subject.status = calcStatus(subject.percentage);
await subject.save();
The Problem: totalClasses and attendedClasses are stored as running counters directly on the Subject document. If any intermediate write fails (network blip, crash between Attendance.create() and subject.save()), the counters diverge from reality. This becomes a silent data consistency bug that is very hard to debug.

Solution — Derive Stats from the Ground Truth:

js
// ✅ Recalculate percentage live from actual attendance records
// Use MongoDB aggregation to count, not pre-stored counters
const stats = await Attendance.aggregate([
    { $match: { subjectId: subject._id, userId: req.user._id } },
    {
        $group: {
            _id: null,
            total: { $sum: 1 },
            attended: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } }
        }
    }
]);
const { total = 0, attended = 0 } = stats[0] || {};
subject.percentage = calcPercentage(attended, total);
Summary Table
#	Bottleneck	Severity	Current Code	Fix
1	DB query on every auth request	🔴 High	User.findById() in every middleware call	Trust JWT claims directly
2	7 sequential DB queries for schedule	🔴 High	for loop with await findOne per day	Single find() + insertMany()
3	syncMissedAttendance blocks every read	🔴 High	await syncMissed() before every response	Background job with cooldown
4	In-memory cache won't scale	🟡 Medium	node-cache (process-local)	Migrate to Redis
5	Math.random() for OTP	🟡 Medium	Math.floor(Math.random() * ...)	Use crypto.randomInt()
6	No rate limiting on auth endpoints	🟡 Medium	No express-rate-limit	Add per-IP throttling
7	Denormalized attendance counters	🟡 Medium	subject.totalClasses += 1 increments	Derive from Attendance.aggregate()
