import express from 'express';
import { getSchedule, addSlot, deleteSlot, toggleHoliday, getScheduleHistory } from '../controllers/scheduleController.js';
import { protect } from '../middleware/auth.js';
import { cacheMiddleware, clearCacheMiddleware } from '../middleware/cache.js';

const router = express.Router();
router.use(protect);

router.get('/', cacheMiddleware, getSchedule);
router.get('/history', cacheMiddleware, getScheduleHistory);   // <-- historical schedule docs for heatmap
router.post('/:day/slots', clearCacheMiddleware, addSlot);
router.delete('/:day/slots/:slotId', clearCacheMiddleware, deleteSlot);
router.patch('/:day/holiday', clearCacheMiddleware, toggleHoliday);

export default router;
