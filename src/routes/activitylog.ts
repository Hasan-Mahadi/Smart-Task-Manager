
import express, { Request, Response } from 'express';
import ActivityLog from '../models/ActivityLog';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

interface AuthRequest extends Request {
  user?: { userId?: string };
}

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { limit = 10 } = req.query;

    const logs = await ActivityLog.find({ userId })
      .sort({ timestamp: -1 })
      .limit(Number(limit))
      .select('action details timestamp');

    res.json({
      logs,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;