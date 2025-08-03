import { Router } from 'express';
import { getUserProfile, getAllUsers } from '../controllers/user.js';
import { verifyToken } from '../middlewares/auth.js';

const router = Router();

// All routes in this file are protected
router.use(verifyToken);

router.get('/profile', getUserProfile);
router.get('/users', getAllUsers);

export default router;