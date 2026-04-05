const webpush = require('web-push');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Initialize VAPID
const isValidVapidKey = (key) => key && key !== 'placeholder' && key.length > 20;
if (isValidVapidKey(process.env.VAPID_PUBLIC_KEY) && isValidVapidKey(process.env.VAPID_PRIVATE_KEY)) {
    webpush.setVapidDetails(
        process.env.VAPID_EMAIL || 'mailto:admin@8track.app',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

const getNotifications = async (req, res, next) => {
    try {
        const notifications = await Notification.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json({ notifications });
    } catch (err) {
        next(err);
    }
};

const markAsRead = async (req, res, next) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { $set: { read: true } },
            { new: true }
        );
        if (!notification) return res.status(404).json({ message: 'Notification not found' });
        res.json({ notification });
    } catch (err) {
        next(err);
    }
};

const markAllAsRead = async (req, res, next) => {
    try {
        await Notification.updateMany(
            { userId: req.user.id, read: false },
            { $set: { read: true } }
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (err) {
        next(err);
    }
};

const deleteNotification = async (req, res, next) => {
    try {
        const notification = await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!notification) return res.status(404).json({ message: 'Notification not found' });
        res.json({ message: 'Notification deleted' });
    } catch (err) {
        next(err);
    }
};

const clearHistory = async (req, res, next) => {
    try {
        await Notification.deleteMany({ userId: req.user.id, read: true });
        res.json({ message: 'Read notification history cleared' });
    } catch (err) {
        next(err);
    }
};

// System function to create notifications (not exported as route)
const createNotification = async (userId, title, message, type = 'info', link = '/') => {
    try {
        const notif = await Notification.create({ userId, title, message, type, link });

        // Trigger Real-Time Push Notification
        const user = await User.findById(userId);
        if (user?.pushSubscription) {
            try {
                await webpush.sendNotification(
                    user.pushSubscription,
                    JSON.stringify({ title, body: message, link })
                );
            } catch (pushErr) {
                console.error('Web Push failed:', pushErr.message);
                if (pushErr.statusCode === 410) {
                    // Subscription expired/invalid -> remove it
                    await User.findByIdAndUpdate(userId, { $unset: { pushSubscription: 1 } });
                }
            }
        }
        return notif;
    } catch (err) {
        console.error('Failed to create notification:', err.message);
    }
};

module.exports = { 
    getNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    clearHistory,
    createNotification
};
