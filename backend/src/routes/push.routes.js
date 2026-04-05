const express = require('express');
const { saveSubscription, sendTestNotification, unsubscribePush } = require('../controllers/pushController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);
router.post('/subscribe', saveSubscription);
router.delete('/unsubscribe', unsubscribePush);
router.post('/test', sendTestNotification);

module.exports = router;
