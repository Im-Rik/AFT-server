import { Router } from 'express';
import { addExpense } from '../controllers/expense.js';
import { verifyToken, isAdmin } from '../middlewares/auth.js';

const router = Router();

router.post('/expenses', verifyToken, isAdmin, addExpense);

export default router;