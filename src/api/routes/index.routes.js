import { Router } from 'express';
import authRouter from './auth.routes.js';
import userRouter from './user.routes.js';
import tripRouter from './trip.routes.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/trips', tripRouter);

export default router;