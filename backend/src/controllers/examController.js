const Exam = require('../models/Exam');

const getExams = async (req, res, next) => {
    try {
        const exams = await Exam.find({ userId: req.user.id })
            .populate('subjectId', 'name')
            .sort({ date: -1 });
        res.json({ exams });
    } catch (err) {
        next(err);
    }
};

const createExam = async (req, res, next) => {
    const { examName, subjectId, marksObtained, maxMarks, date } = req.body;
    if (!examName || marksObtained === undefined || !maxMarks) {
        return res.status(400).json({ message: 'examName, marksObtained, maxMarks are required' });
    }
    try {
        const exam = await Exam.create({ userId: req.user.id, examName, subjectId, marksObtained, maxMarks, date });
        res.status(201).json({ exam });
    } catch (err) {
        next(err);
    }
};

const deleteExam = async (req, res, next) => {
    try {
        const exam = await Exam.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!exam) return res.status(404).json({ message: 'Exam not found' });
        res.json({ message: 'Exam record deleted' });
    } catch (err) {
        next(err);
    }
};

module.exports = { getExams, createExam, deleteExam };
