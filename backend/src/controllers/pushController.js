const webpush = require('web-push');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

// Initialize VAPID on module load
const isValidVapidKey = (key) => key && key !== 'placeholder' && key.length > 20;

if (isValidVapidKey(process.env.VAPID_PUBLIC_KEY) && isValidVapidKey(process.env.VAPID_PRIVATE_KEY)) {
    webpush.setVapidDetails(
        process.env.VAPID_EMAIL || 'mailto:admin@8track.app',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

const saveSubscription = async (req, res, next) => {
    const { subscription } = req.body;
    if (!subscription) return res.status(400).json({ message: 'Subscription is required' });
    try {
        await User.findByIdAndUpdate(req.user.id, { pushSubscription: subscription });
        res.status(201).json({ message: 'Subscription saved' });
    } catch (err) {
        next(err);
    }
};

const sendTestNotification = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user?.pushSubscription) {
            return res.status(400).json({ message: 'No push subscription found' });
        }
        await webpush.sendNotification(
            user.pushSubscription,
            JSON.stringify({ title: '8Track', body: 'Push notifications are working! 🎉' })
        );
        await createNotification(req.user.id, 'Push Active', 'Web push notifications are now configured! 🎉', 'success');
        res.json({ message: 'Test notification sent' });
    } catch (err) {
        next(err);
    }
};
const unsubscribePush = async (req, res, next) => {
    try {
        await User.findByIdAndUpdate(req.user.id, { $unset: { pushSubscription: 1 } });
        res.json({ message: 'Push subscription removed' });
    } catch (err) {
        next(err);
    }
};

module.exports = { saveSubscription, sendTestNotification, unsubscribePush };
