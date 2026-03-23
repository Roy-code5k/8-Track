const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const Assignment = require('../models/Assignment');
const Exam = require('../models/Exam');

const getSubjects = async (req, res, next) => {
    try {
        const subjects = await Subject.find({ userId: req.user.id }).sort({ name: 1 });
        res.json({ subjects });
    } catch (err) {
        next(err);
    }
};

const createSubject = async (req, res, next) => {
    const { name, totalExpectedClasses } = req.body;
    if (!name || !name.trim()) {
        return res.status(400).json({ message: 'Subject name is required' });
    }
    try {
        const subject = await Subject.create({
            userId: req.user.id,
            name: name.trim(),
            totalExpectedClasses: totalExpectedClasses || 0,
        });
        res.status(201).json({ subject });
    } catch (err) {
        next(err);
    }
};

const updateSubject = async (req, res, next) => {
    const { name, totalExpectedClasses } = req.body;
    try {
        const subject = await Subject.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { name, totalExpectedClasses },
            { new: true }
        );
        if (!subject) return res.status(404).json({ message: 'Subject not found' });
        res.json({ subject });
    } catch (err) {
        next(err);
    }
};

const deleteSubject = async (req, res, next) => {
    try {
        const subject = await Subject.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!subject) return res.status(404).json({ message: 'Subject not found' });

        // Cascade delete
        await Attendance.deleteMany({ subjectId: req.params.id });
        await Assignment.deleteMany({ subjectId: req.params.id });
        await Exam.deleteMany({ subjectId: req.params.id });

        res.json({ message: 'Subject and all related data deleted' });
    } catch (err) {
        next(err);
    }
};

module.exports = { getSubjects, createSubject, updateSubject, deleteSubject };
