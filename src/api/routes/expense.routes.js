import { Router } from 'express';
import { addExpense } from '../controllers/expense.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { addExpenseSchema } from '../validation/expense.validation.js';

const router = Router({ mergeParams: true });

router.post('/', validate(addExpenseSchema), addExpense);

export default router;