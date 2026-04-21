import express from 'express';
import { getTasks, createTask, updateTask, deleteTask  } from '../controllers/taskController.js';
import { protect  } from '../middleware/auth.js';
import { cacheMiddleware, clearCacheMiddleware } from '../middleware/cache.js';

const router = express.Router();
router.use(protect);

router.get('/', cacheMiddleware, getTasks);
router.post('/', clearCacheMiddleware, createTask);
router.put('/:id', clearCacheMiddleware, updateTask);
router.delete('/:id', clearCacheMiddleware, deleteTask);

export default router;
