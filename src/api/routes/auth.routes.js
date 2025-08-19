import { Router } from 'express';
import { signup, loginUser, logoutUser } from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { signupSchema, loginSchema } from '../validation/auth.validation.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/signup', validate(signupSchema), signup);
router.post('/login', validate(loginSchema), loginUser);
router.post('/logout', verifyJWT, logoutUser);

export default router;