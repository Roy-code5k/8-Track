import Assignment from '../models/Assignment.js';

const getAssignments = async (req, res, next) => {
    try {
        await Assignment.updateMany(
            { userId: req.user._id, status: 'pending', dueDate: { $lt: new Date() } },
            { status: 'overdue' }
        );
        const assignments = await Assignment.find({ userId: req.user._id })
            .populate('subjectId', 'name')
            .sort({ dueDate: 1 })
            .lean();
        res.json({ assignments });
    } catch (err) {
        next(err);
    }
};

const createAssignment = async (req, res, next) => {
    const { title, subjectId, dueDate, priority, status } = req.body;
    if (!title || !dueDate) return res.status(400).json({ message: 'Title and due date are required' });
    try {
        const assignment = await Assignment.create({ 
            userId: req.user._id, 
            subjectId, 
            title, 
            dueDate,
            priority: priority || 'medium',
            status: status || 'pending'
        });
        res.status(201).json({ assignment });
    } catch (err) {
        next(err);
    }
};

const updateAssignment = async (req, res, next) => {
    try {
        const assignment = await Assignment.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            req.body,
            { new: true }
        );
        if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
        res.json({ assignment });
    } catch (err) {
        next(err);
    }
};

const deleteAssignment = async (req, res, next) => {
    try {
        const assignment = await Assignment.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
        res.json({ message: 'Assignment deleted' });
    } catch (err) {
        next(err);
    }
};

export {  getAssignments, createAssignment, updateAssignment, deleteAssignment  };
