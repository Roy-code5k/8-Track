import express from 'express';
import { getSchedule, addSlot, deleteSlot, toggleHoliday, getScheduleHistory } from '../controllers/scheduleController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/', getSchedule);
router.get('/history', getScheduleHistory);   // <-- historical schedule docs for heatmap
router.post('/:day/slots', addSlot);
router.delete('/:day/slots/:slotId', deleteSlot);
router.patch('/:day/holiday', toggleHoliday);

export default router;
