import { Router } from 'express';
import { addSettlement } from '../controllers/settlement.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { addSettlementSchema } from '../validation/settlement.validation.js';

const router = Router({ mergeParams: true });

router.post('/', validate(addSettlementSchema), addSettlement);

export default router;