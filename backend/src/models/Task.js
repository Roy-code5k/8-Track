const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        title: { type: String, required: true, trim: true },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium',
        },
        subject: { type: String, trim: true },
        estimatedMinutes: { type: Number, default: 25 },
        dueDate: { type: Date },
        completed: { type: Boolean, default: false },
    },
    { timestamps: true }
);

TaskSchema.index({ userId: 1, completed: 1 });

module.exports = mongoose.model('Task', TaskSchema);
