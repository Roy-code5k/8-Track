const Schedule = require('../models/Schedule');

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// GET /api/schedule – return all 7 days for this user (create missing days on-the-fly)
const getSchedule = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const upserts = DAYS.map(day =>
            Schedule.findOneAndUpdate(
                { userId, day },
                { $setOnInsert: { userId, day, isHoliday: false, slots: [] } },
                { upsert: true, new: true }
            )
        );
        const docs = await Promise.all(upserts);
        docs.sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day));

        res.json({ schedule: docs });
    } catch (err) {
        next(err);
    }
};

// POST /api/schedule/:day/slots – add a slot to a day
const addSlot = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { day } = req.params;
        const { subjectName, startTime, endTime, room } = req.body;

        if (!DAYS.includes(day)) return res.status(400).json({ message: 'Invalid day' });
        if (!subjectName || !startTime || !endTime)
            return res.status(400).json({ message: 'subjectName, startTime and endTime are required' });

        const doc = await Schedule.findOneAndUpdate(
            { userId, day },
            { $push: { slots: { subjectName, startTime, endTime, room: room || '' } } },
            { new: true, upsert: true }
        );
        res.status(201).json({ day: doc });
    } catch (err) {
        next(err);
    }
};

// DELETE /api/schedule/:day/slots/:slotId – remove a slot
const deleteSlot = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { day, slotId } = req.params;

        const doc = await Schedule.findOneAndUpdate(
            { userId, day },
            { $pull: { slots: { _id: slotId } } },
            { new: true }
        );
        if (!doc) return res.status(404).json({ message: 'Day not found' });
        res.json({ day: doc });
    } catch (err) {
        next(err);
    }
};

// PATCH /api/schedule/:day/holiday – toggle holiday flag
const toggleHoliday = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { day } = req.params;
        const { isHoliday } = req.body;

        const doc = await Schedule.findOneAndUpdate(
            { userId, day },
            { isHoliday: !!isHoliday },
            { new: true, upsert: true }
        );
        res.json({ day: doc });
    } catch (err) {
        next(err);
    }
};

module.exports = { getSchedule, addSlot, deleteSlot, toggleHoliday };
