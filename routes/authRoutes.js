import express from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  sendOTP,
  verifyOTP,
  getCurrentUser,
  adminLogin,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authLimiter, otpLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  '/register',
  authLimiter,
  [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('mobile').trim().notEmpty().withMessage('Mobile number is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('address').trim().notEmpty().withMessage('Address is required'),
  ],
  register
);

// @route   POST /api/auth/login
// @desc    User login (step 1 - credentials)
// @access  Public
router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  login
);

// @route   POST /api/auth/admin-login
// @desc    Admin login (direct login with credentials)
// @access  Public
router.post(
  '/admin-login',
  authLimiter,
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  adminLogin
);

// @route   POST /api/auth/send-otp
// @desc    Send OTP to user's email
// @access  Public
router.post(
  '/send-otp',
  otpLimiter,
  [body('email').isEmail().withMessage('Please provide a valid email')],
  sendOTP
);

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and complete login
// @access  Public
router.post(
  '/verify-otp',
  authLimiter,
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  ],
  verifyOTP
);

// @route   GET /api/auth/me
// @desc    Get current logged-in user
// @access  Private
router.get('/me', protect, getCurrentUser);

export default router;
