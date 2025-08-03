import { Router } from 'express';
import { addPayment } from '../controllers/payment.js';
import { verifyToken } from '../middlewares/auth.js';

const router = Router();

router.post('/payments', verifyToken, addPayment);

export default router;