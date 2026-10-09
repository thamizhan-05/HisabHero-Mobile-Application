import express from 'express';
import * as authController from './auth.controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { createRateLimiter } from '../../middleware/rateLimiter.js';

const router = express.Router();

// Strict rate limiters for authentication endpoints
const authLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 20, message: 'Too many authentication attempts. Please try again later.' });
const otpLimiter = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 10, message: 'Too many OTP requests. Please wait a few minutes.' });
const verifyLimiter = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 10, message: 'Too many verification attempts. Please wait a few minutes.' });

router.post('/signup', authLimiter, authController.signup);
router.post(['/verify-code', '/verify-otp', '/verify-email-otp', '/verify-email'], verifyLimiter, authController.verifyCode);
router.post(['/resend-code', '/resend-otp', '/resend-email-otp'], otpLimiter, authController.resendCode);
router.post('/login', authLimiter, authController.login);
router.post(['/google', '/google-login'], authLimiter, authController.googleLogin);
router.post('/logout', authMiddleware, authController.logout);
router.post('/forgot-password', otpLimiter, authController.forgotPassword);
router.post('/reset-password', verifyLimiter, authController.resetPassword);

router.get(['/me', '/verify'], authMiddleware, authController.getProfile);
router.delete('/account', authMiddleware, authController.deleteAccount);

export default router;
