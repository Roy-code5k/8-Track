const Task = require('../models/Task');

const getTasks = async (req, res, next) => {
    try {
        const tasks = await Task.find({ userId: req.user.id }).sort({ completed: 1, dueDate: 1 });
        res.json({ tasks });
    } catch (err) {
        next(err);
    }
};

const createTask = async (req, res, next) => {
    const { title, priority, dueDate, subject, estimatedMinutes } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });
    try {
        const task = await Task.create({ userId: req.user.id, title, priority, dueDate, subject, estimatedMinutes });
        res.status(201).json({ task });
    } catch (err) {
        next(err);
    }
};

const updateTask = async (req, res, next) => {
    try {
        const task = await Task.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            req.body,
            { new: true }
        );
        if (!task) return res.status(404).json({ message: 'Task not found' });
        res.json({ task });
    } catch (err) {
        next(err);
    }
};

const deleteTask = async (req, res, next) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!task) return res.status(404).json({ message: 'Task not found' });
        res.json({ message: 'Task deleted' });
    } catch (err) {
        next(err);
    }
};

module.exports = { getTasks, createTask, updateTask, deleteTask };
