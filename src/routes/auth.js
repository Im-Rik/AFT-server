import { Router } from 'express';
import { loginUser } from '../controllers/auth.js';

const router = Router();

router.post('/manual-login', loginUser);

export default router;