import { Router } from 'express';
import authRouter from './auth.js';
import userRouter from './user.js';
import expenseRouter from './expense.js';
import paymentRouter from './payment.js';
import dashboardRouter from './dashboard.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/api', userRouter);
router.use('/api', expenseRouter);
router.use('/api', paymentRouter);
router.use('/api', dashboardRouter);

export default router;