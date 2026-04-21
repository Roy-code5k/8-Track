import express from 'express';
import { markAttendance, getGlobalAttendance, getAttendanceHistory, updateAttendance, deleteAttendance  } from '../controllers/attendanceController.js';
import { protect  } from '../middleware/auth.js';
import { cacheMiddleware, clearCacheMiddleware } from '../middleware/cache.js';

const router = express.Router();
router.use(protect);

router.post('/', clearCacheMiddleware, markAttendance);
router.post('/mark', clearCacheMiddleware, markAttendance);
router.get('/', cacheMiddleware, getGlobalAttendance);
router.get('/:subjectId', cacheMiddleware, getAttendanceHistory);
router.put('/:id', clearCacheMiddleware, updateAttendance);
router.delete('/:id', clearCacheMiddleware, deleteAttendance);

export default router;
