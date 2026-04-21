import express from 'express';
import { getExams, createExam, deleteExam  } from '../controllers/examController.js';
import { protect  } from '../middleware/auth.js';
import { cacheMiddleware, clearCacheMiddleware } from '../middleware/cache.js';

const router = express.Router();
router.use(protect);

router.get('/', cacheMiddleware, getExams);
router.post('/', clearCacheMiddleware, createExam);
router.delete('/:id', clearCacheMiddleware, deleteExam);

export default router;
