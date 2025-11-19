// src/routes/tasks.ts
import express from 'express';
import { 
  createTask, 
  getTasks, 
  updateTask, 
  deleteTask,
  reassignTasks,
  autoAssignTask
} from '../controllers/taskController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

router.post('/', createTask);
router.get('/', getTasks);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.post('/reassign', reassignTasks);
router.post('/auto-assign', autoAssignTask);

export default router;