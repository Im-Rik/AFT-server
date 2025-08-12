import { Router } from 'express';
import { getDashboardData } from '../controllers/dashboard.controller.js';

const router = Router({ mergeParams: true });

router.get('/', getDashboardData);

export default router;