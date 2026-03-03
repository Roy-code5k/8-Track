const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const Assignment = require('../models/Assignment');
const Exam = require('../models/Exam');

const getSubjects = async (req, res) => {
    try {
        const subjects = await Subject.find({ userId: req.user.id }).sort({ name: 1 });
        res.json({ subjects });
    } catch {
        res.status(500).json({ message: 'Failed to fetch subjects' });
    }
};

const createSubject = async (req, res) => {
    const { name } = req.body;
    if (!name || !name.trim()) {
        return res.status(400).json({ message: 'Subject name is required' });
    }
    try {
        const subject = await Subject.create({ userId: req.user.id, name: name.trim() });
        res.status(201).json({ subject });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ message: 'Subject name already exists' });
        }
        res.status(500).json({ message: 'Failed to create subject' });
    }
};

const updateSubject = async (req, res) => {
    const { name } = req.body;
    try {
        const subject = await Subject.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { name },
            { new: true }
        );
        if (!subject) return res.status(404).json({ message: 'Subject not found' });
        res.json({ subject });
    } catch {
        res.status(500).json({ message: 'Failed to update subject' });
    }
};

const deleteSubject = async (req, res) => {
    try {
        const subject = await Subject.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!subject) return res.status(404).json({ message: 'Subject not found' });

        // Cascade delete
        await Attendance.deleteMany({ subjectId: req.params.id });
        await Assignment.deleteMany({ subjectId: req.params.id });
        await Exam.deleteMany({ subjectId: req.params.id });

        res.json({ message: 'Subject and all related data deleted' });
    } catch {
        res.status(500).json({ message: 'Failed to delete subject' });
    }
};

module.exports = { getSubjects, createSubject, updateSubject, deleteSubject };
