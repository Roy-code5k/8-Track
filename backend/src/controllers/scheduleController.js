import Schedule from '../models/Schedule.js';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// ── Week Helpers ──────────────────────────────────────────────────────────────

/**
 * Returns the Monday (00:00:00 UTC) of the week that contains `date`.
 * Week anchor: Monday = day 1. If today is Sunday (0), go back 6 days.
 */
function getMondayOfWeek(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay(); // 0=Sun, 1=Mon, 2=Tue ... 6=Sat
    const diff = day === 0 ? -6 : 1 - day; // rewind to Monday
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

/**
 * Returns the Monday of the NEXT week (used for Saturday-triggered reset).
 * On Saturday the user sees a clean schedule so Monday starts fresh.
 */
function getMondayOfNextWeek(date = new Date()) {
    const monday = getMondayOfWeek(date);
    monday.setDate(monday.getDate() + 7);
    return monday;
}

/**
 * Determine which weekOf to use:
 *  - If today is Saturday (day 6), return next Monday (upcoming week).
 *  - Otherwise return this Monday (current week).
 *
 * This way:
 *   • Mon–Fri → current week's schedule
 *   • Saturday → triggers the reset; shows next week (empty) so user can plan ahead
 *   • Sunday   → next week starts Monday, so we still show *this* Mon's week
 *              (Sunday is still part of the setup phase before the new week)
 *
 * NOTE: Per the spec "new week starts on Monday, Saturday triggers reset for
 * the upcoming week." So on Saturday we flip to the next week's anchor.
 */
function getActiveWeekOf(date = new Date()) {
    const day = date.getDay();
    if (day === 6) {
        // Saturday → show upcoming week so user can plan
        return getMondayOfNextWeek(date);
    }
    return getMondayOfWeek(date);
}

// ── Controllers ───────────────────────────────────────────────────────────────

// GET /api/schedule – return all 7 days for the active week (create missing days on-the-fly)
const getSchedule = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const weekOf = getActiveWeekOf();

        const docs = [];
        for (const day of DAYS) {
            let doc = await Schedule.findOneAndUpdate(
                { userId, day, weekOf },
                { $setOnInsert: { userId, day, weekOf, isHoliday: false, slots: [] } },
                { upsert: false, new: true }
            );

            if (!doc) {
                try {
                    doc = await Schedule.findOneAndUpdate(
                        { userId, day, weekOf },
                        { $setOnInsert: { userId, day, weekOf, isHoliday: false, slots: [] } },
                        { upsert: true, new: true }
                    );
                } catch (err) {
                    if (err.code === 11000) {
                        doc = await Schedule.findOne({ userId, day, weekOf });
                    } else {
                        throw err;
                    }
                }
            }
            if (doc) docs.push(doc);
        }
        docs.sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day));

        res.json({ schedule: docs });
    } catch (err) {
        next(err);
    }
};

// POST /api/schedule/:day/slots – add a slot to a day (current active week only)
const addSlot = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { day } = req.params;
        const { subjectName, startTime, endTime, room } = req.body;
        const weekOf = getActiveWeekOf();

        if (!DAYS.includes(day)) return res.status(400).json({ message: 'Invalid day' });
        if (!subjectName || !startTime || !endTime)
            return res.status(400).json({ message: 'subjectName, startTime and endTime are required' });

        const filter = { userId, day, weekOf };
        const update = { $push: { slots: { subjectName, startTime, endTime, room: room || '' } } };

        let doc = await Schedule.findOneAndUpdate(filter, update, { new: true });

        if (!doc) {
            try {
                doc = await Schedule.findOneAndUpdate(filter, update, { new: true, upsert: true });
            } catch (err) {
                if (err.code === 11000) {
                    doc = await Schedule.findOneAndUpdate(filter, update, { new: true });
                } else {
                    throw err;
                }
            }
        }
        res.status(201).json({ day: doc });
    } catch (err) {
        next(err);
    }
};

// DELETE /api/schedule/:day/slots/:slotId – remove a slot (current active week only)
const deleteSlot = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { day, slotId } = req.params;
        const weekOf = getActiveWeekOf();

        const doc = await Schedule.findOneAndUpdate(
            { userId, day, weekOf },
            { $pull: { slots: { _id: slotId } } },
            { new: true }
        );
        if (!doc) return res.status(404).json({ message: 'Day not found' });
        res.json({ day: doc });
    } catch (err) {
        next(err);
    }
};

// PATCH /api/schedule/:day/holiday – toggle holiday flag (current active week only)
const toggleHoliday = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { day } = req.params;
        const { isHoliday } = req.body;
        const weekOf = getActiveWeekOf();

        const filter = { userId, day, weekOf };
        const update = { isHoliday: !!isHoliday };

        let doc = await Schedule.findOneAndUpdate(filter, update, { new: true });

        if (!doc) {
            try {
                doc = await Schedule.findOneAndUpdate(filter, update, { new: true, upsert: true });
            } catch (err) {
                if (err.code === 11000) {
                    doc = await Schedule.findOneAndUpdate(filter, update, { new: true });
                } else {
                    throw err;
                }
            }
        }
        res.json({ day: doc });
    } catch (err) {
        next(err);
    }
};

// GET /api/schedule/history?from=<ISO>&to=<ISO>
// Returns ALL schedule docs for this user within the given weekOf range.
// Used by the Progress page heatmap to get per-week schedule data historically.
const getScheduleHistory = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { from, to } = req.query;

        const query = { userId };
        if (from || to) {
            query.weekOf = {};
            if (from) query.weekOf.$gte = new Date(from);
            if (to)   query.weekOf.$lte = new Date(to);
        }

        const docs = await Schedule.find(query).lean();
        res.json({ schedule: docs });
    } catch (err) {
        next(err);
    }
};

export { getSchedule, addSlot, deleteSlot, toggleHoliday, getMondayOfWeek, getActiveWeekOf, getScheduleHistory };
