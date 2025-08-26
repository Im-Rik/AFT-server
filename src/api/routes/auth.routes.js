import { Router } from 'express';
import {
    registerStepOne,
    verifyOtp,
    checkUsernameAvailability,
    registerStepTwo,
    loginUser,
    logoutUser,
    forgotPassword,
    resetPassword,
} from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
    registerStepOneSchema,
    verifyOtpSchema,
    checkUsernameSchema,
    registerStepTwoSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
} from '../validation/auth.validation.js';
import { verifyJWT, verifyRegistrationToken } from '../middlewares/auth.middleware.js';

const router = Router();

// --- MULTI-STEP REGISTRATION ROUTES ---
router.post('/register-step-one', validate(registerStepOneSchema), registerStepOne);
router.post('/verify-otp', validate(verifyOtpSchema), verifyOtp);
router.post('/check-username', validate(checkUsernameSchema), checkUsernameAvailability);
router.post('/register-step-two', verifyRegistrationToken, validate(registerStepTwoSchema), registerStepTwo);

// --- STANDARD AUTH ROUTES ---
router.post('/login', validate(loginSchema), loginUser);
router.post('/logout', verifyJWT, logoutUser);

// --- PASSWORD RESET ROUTES ---
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

export default router;