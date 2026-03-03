const mongoose = require('mongoose');

const ExamSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
        examName: { type: String, required: true, trim: true },
        marksObtained: { type: Number, required: true, min: 0 },
        maxMarks: { type: Number, required: true, min: 1 },
        percentage: { type: Number, default: 0 },
        date: { type: Date, required: true, default: Date.now },
    },
    { timestamps: true }
);

// Auto-calculate percentage before save
ExamSchema.pre('save', function (next) {
    this.percentage = parseFloat(((this.marksObtained / this.maxMarks) * 100).toFixed(2));
    next();
});

ExamSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('Exam', ExamSchema);
