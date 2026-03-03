const Task = require('../models/Task');

const getTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ userId: req.user.id }).sort({ completed: 1, dueDate: 1 });
        res.json({ tasks });
    } catch {
        res.status(500).json({ message: 'Failed to fetch tasks' });
    }
};

const createTask = async (req, res) => {
    const { title, priority, dueDate } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });
    try {
        const task = await Task.create({ userId: req.user.id, title, priority, dueDate });
        res.status(201).json({ task });
    } catch {
        res.status(500).json({ message: 'Failed to create task' });
    }
};

const updateTask = async (req, res) => {
    try {
        const task = await Task.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            req.body,
            { new: true }
        );
        if (!task) return res.status(404).json({ message: 'Task not found' });
        res.json({ task });
    } catch {
        res.status(500).json({ message: 'Failed to update task' });
    }
};

const deleteTask = async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!task) return res.status(404).json({ message: 'Task not found' });
        res.json({ message: 'Task deleted' });
    } catch {
        res.status(500).json({ message: 'Failed to delete task' });
    }
};

module.exports = { getTasks, createTask, updateTask, deleteTask };
