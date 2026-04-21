import express from 'express';
import { getSubjects, createSubject, updateSubject, deleteSubject  } from '../controllers/subjectController.js';
import { protect  } from '../middleware/auth.js';
import { cacheMiddleware, clearCacheMiddleware } from '../middleware/cache.js';

const router = express.Router();
router.use(protect);

router.get('/', cacheMiddleware, getSubjects);
router.post('/', clearCacheMiddleware, createSubject);
router.put('/:id', clearCacheMiddleware, updateSubject);
router.delete('/:id', clearCacheMiddleware, deleteSubject);

export default router;
