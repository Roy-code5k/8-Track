const Attendance = require('../models/Attendance');
const Subject = require('../models/Subject');
const { calcPercentage, calcStatus, safeToMiss, recoveryNeeded } = require('../utils/prediction');

const markAttendance = async (req, res) => {
    const { subjectId, status, date } = req.body;
    if (!subjectId || !status) {
        return res.status(400).json({ message: 'subjectId and status are required' });
    }

    try {
        const subject = await Subject.findOne({ _id: subjectId, userId: req.user.id });
        if (!subject) return res.status(404).json({ message: 'Subject not found' });

        const attendance = await Attendance.create({
            userId: req.user.id,
            subjectId,
            date: date || new Date(),
            status,
        });

        subject.totalClasses += 1;
        if (status === 'present') subject.attendedClasses += 1;
        subject.percentage = calcPercentage(subject.attendedClasses, subject.totalClasses);
        subject.status = calcStatus(subject.percentage);
        await subject.save();

        const prediction = {
            safeToMiss: safeToMiss(subject.attendedClasses, subject.totalClasses),
            recoveryNeeded: recoveryNeeded(subject.attendedClasses, subject.totalClasses),
        };

        res.status(201).json({ attendance, subject, prediction });
    } catch {
        res.status(500).json({ message: 'Failed to mark attendance' });
    }
};

const getAttendanceHistory = async (req, res) => {
    const { subjectId } = req.params;
    try {
        const history = await Attendance.find({ userId: req.user.id, subjectId }).sort({ date: -1 });
        const subject = await Subject.findById(subjectId);
        const prediction = subject
            ? {
                safeToMiss: safeToMiss(subject.attendedClasses, subject.totalClasses),
                recoveryNeeded: recoveryNeeded(subject.attendedClasses, subject.totalClasses),
            }
            : null;

        res.json({ history, subject, prediction });
    } catch {
        res.status(500).json({ message: 'Failed to fetch attendance history' });
    }
};

const updateAttendance = async (req, res) => {
    const { status } = req.body;
    try {
        const record = await Attendance.findOne({ _id: req.params.id, userId: req.user.id });
        if (!record) return res.status(404).json({ message: 'Record not found' });

        const oldStatus = record.status;
        record.status = status;
        await record.save();

        const subject = await Subject.findById(record.subjectId);
        if (subject) {
            if (oldStatus === 'present' && status === 'absent') subject.attendedClasses -= 1;
            if (oldStatus === 'absent' && status === 'present') subject.attendedClasses += 1;
            subject.percentage = calcPercentage(subject.attendedClasses, subject.totalClasses);
            subject.status = calcStatus(subject.percentage);
            await subject.save();
        }

        res.json({ record, subject });
    } catch {
        res.status(500).json({ message: 'Failed to update attendance' });
    }
};

const deleteAttendance = async (req, res) => {
    try {
        const record = await Attendance.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!record) return res.status(404).json({ message: 'Record not found' });

        const subject = await Subject.findById(record.subjectId);
        if (subject) {
            subject.totalClasses -= 1;
            if (record.status === 'present') subject.attendedClasses -= 1;
            subject.percentage = calcPercentage(subject.attendedClasses, subject.totalClasses);
            subject.status = calcStatus(subject.percentage);
            await subject.save();
        }

        res.json({ message: 'Attendance record deleted' });
    } catch {
        res.status(500).json({ message: 'Failed to delete attendance' });
    }
};

module.exports = { markAttendance, getAttendanceHistory, updateAttendance, deleteAttendance };
