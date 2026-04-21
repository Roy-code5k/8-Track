import express from 'express';
import { getAssignments, createAssignment, updateAssignment, deleteAssignment  } from '../controllers/assignmentController.js';
import { protect  } from '../middleware/auth.js';
import { cacheMiddleware, clearCacheMiddleware } from '../middleware/cache.js';

const router = express.Router();
router.use(protect);

router.get('/', cacheMiddleware, getAssignments);
router.post('/', clearCacheMiddleware, createAssignment);
router.put('/:id', clearCacheMiddleware, updateAssignment);
router.delete('/:id', clearCacheMiddleware, deleteAssignment);

export default router;
