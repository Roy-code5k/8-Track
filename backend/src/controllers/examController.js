const Exam = require('../models/Exam');

const getExams = async (req, res) => {
    try {
        const exams = await Exam.find({ userId: req.user.id })
            .populate('subjectId', 'name')
            .sort({ date: -1 });
        res.json({ exams });
    } catch {
        res.status(500).json({ message: 'Failed to fetch exams' });
    }
};

const createExam = async (req, res) => {
    const { examName, subjectId, marksObtained, maxMarks, date } = req.body;
    if (!examName || marksObtained === undefined || !maxMarks) {
        return res.status(400).json({ message: 'examName, marksObtained, maxMarks are required' });
    }
    try {
        const exam = await Exam.create({ userId: req.user.id, examName, subjectId, marksObtained, maxMarks, date });
        res.status(201).json({ exam });
    } catch {
        res.status(500).json({ message: 'Failed to create exam record' });
    }
};

const deleteExam = async (req, res) => {
    try {
        const exam = await Exam.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!exam) return res.status(404).json({ message: 'Exam not found' });
        res.json({ message: 'Exam record deleted' });
    } catch {
        res.status(500).json({ message: 'Failed to delete exam' });
    }
};

module.exports = { getExams, createExam, deleteExam };
