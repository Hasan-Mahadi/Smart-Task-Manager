// src/routes/dashboard.ts
import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

router.get('/stats', getDashboardStats);

export default router;