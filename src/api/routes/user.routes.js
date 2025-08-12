import { Router } from 'express';
import { getUserProfile, getAllUsers } from '../controllers/user.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

router.get('/profile', getUserProfile);
router.get('/', getAllUsers);

export default router;