import mongoose from 'mongoose';

const SlotSchema = new mongoose.Schema({
    subjectName: { type: String, required: true, trim: true },
    startTime: { type: String, required: true },   // e.g. "09:00"
    endTime: { type: String, required: true },     // e.g. "10:00"
    room: { type: String, trim: true, default: '' },
});

const DayScheduleSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    day: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        required: true,
    },
    // The Monday date of the week this schedule belongs to (week anchor).
    // All 7 days in a week share the same weekOf value (the Monday of that week).
    weekOf: { type: Date, required: true },
    isHoliday: { type: Boolean, default: false },
    slots: [SlotSchema],
}, { timestamps: true });

// One document per user, per day, per week
DayScheduleSchema.index({ userId: 1, day: 1, weekOf: 1 }, { unique: true });

export default mongoose.model('Schedule', DayScheduleSchema);
