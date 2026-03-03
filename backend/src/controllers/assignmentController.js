const Assignment = require('../models/Assignment');

const getAssignments = async (req, res) => {
    try {
        await Assignment.updateMany(
            { userId: req.user.id, status: 'pending', dueDate: { $lt: new Date() } },
            { status: 'overdue' }
        );
        const assignments = await Assignment.find({ userId: req.user.id })
            .populate('subjectId', 'name')
            .sort({ dueDate: 1 });
        res.json({ assignments });
    } catch {
        res.status(500).json({ message: 'Failed to fetch assignments' });
    }
};

const createAssignment = async (req, res) => {
    const { title, subjectId, dueDate } = req.body;
    if (!title || !dueDate) return res.status(400).json({ message: 'Title and due date are required' });
    try {
        const assignment = await Assignment.create({ userId: req.user.id, subjectId, title, dueDate });
        res.status(201).json({ assignment });
    } catch {
        res.status(500).json({ message: 'Failed to create assignment' });
    }
};

const updateAssignment = async (req, res) => {
    try {
        const assignment = await Assignment.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            req.body,
            { new: true }
        );
        if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
        res.json({ assignment });
    } catch {
        res.status(500).json({ message: 'Failed to update assignment' });
    }
};

const deleteAssignment = async (req, res) => {
    try {
        const assignment = await Assignment.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
        res.json({ message: 'Assignment deleted' });
    } catch {
        res.status(500).json({ message: 'Failed to delete assignment' });
    }
};

module.exports = { getAssignments, createAssignment, updateAssignment, deleteAssignment };
