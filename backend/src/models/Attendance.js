const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
        date: { type: Date, required: true, default: Date.now },
        status: { type: String, enum: ['present', 'absent'], required: true },
    },
    { timestamps: true }
);

AttendanceSchema.index({ userId: 1, subjectId: 1, date: -1 });

module.exports = mongoose.model('Attendance', AttendanceSchema);
