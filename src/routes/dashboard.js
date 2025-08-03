import { Router } from 'express';
import { getDashboardData } from '../controllers/dashboard.js';
import { verifyToken } from '../middlewares/auth.js';

const router = Router();

router.get('/dashboard-data', verifyToken, getDashboardData);

export default router;