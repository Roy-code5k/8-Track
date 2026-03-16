const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        name: { type: String, required: true, trim: true },
        totalClasses: { type: Number, default: 0, min: 0 },
        attendedClasses: { type: Number, default: 0, min: 0 },
        totalExpectedClasses: { type: Number, default: 0, min: 0 },
        percentage: { type: Number, default: 0 },
        status: {
            type: String,
            enum: ['safe', 'warning', 'danger'],
            default: 'safe',
        },
    },
    { timestamps: true }
);

// One subject name per user
SubjectSchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Subject', SubjectSchema);
