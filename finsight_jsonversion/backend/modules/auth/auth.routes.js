import express from 'express';
import * as authController from './auth.controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { createRateLimiter } from '../../middleware/rateLimiter.js';

const router = express.Router();

// Strict rate limiters for authentication endpoints
const authLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 20, message: 'Too many authentication attempts. Please try again later.' });
const otpLimiter = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 10, message: 'Too many OTP requests. Please wait a few minutes.' });

router.post('/signup', authLimiter, authController.signup);
router.post(['/verify-code', '/verify-otp', '/verify-email-otp', '/verify-email'], authController.verifyCode);
router.post(['/resend-code', '/resend-otp', '/resend-email-otp'], otpLimiter, authController.resendCode);
router.post('/login', authLimiter, authController.login);

router.get('/me', authMiddleware, authController.getProfile);
router.delete('/account', authMiddleware, authController.deleteAccount);

export default router;
