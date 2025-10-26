import { validationResult } from 'express-validator';
import User from '../models/User.js';
import { generateToken } from '../middleware/authMiddleware.js';
import { generateOTP, generateOTPExpiry, verifyOTP as verifyOTPUtil } from '../utils/otpGenerator.js';
import { sendOTPEmail } from '../utils/emailService.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { username, email, mobile, password, address, ward, locality } = req.body;

  // Check if user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({
      success: false,
      message: 'User with this email already exists',
    });
  }

  // Create user
  const user = await User.create({
    username,
    email,
    mobile,
    password,
    address,
    ward,
    locality,
    role: 'user',
  });

  if (user) {
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: user.getSafeUser(),
        token: generateToken(user._id),
      },
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'Invalid user data',
    });
  }
});

// @desc    User login (step 1 - validate credentials and send OTP)
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { email, password } = req.body;

  // Find user and include password field
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  // Check if password matches
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  // Generate OTP
  const otp = generateOTP();
  const otpExpiry = generateOTPExpiry();

  // Save OTP to user document
  user.otp = {
    code: otp,
    expiresAt: otpExpiry,
  };
  await user.save();

  // Send OTP via email
  try {
    await sendOTPEmail(user.email, user.username, otp);

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email. Please verify to complete login.',
      data: {
        email: user.email,
        otpSent: true,
      },
    });
  } catch (error) {
    console.error('Error sending OTP email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP. Please try again.',
    });
  }
});

// @desc    Admin login (direct login without OTP)
// @route   POST /api/auth/admin-login
// @access  Public
export const adminLogin = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { email, password } = req.body;

  // Find user and include password field
  const user = await User.findOne({ email }).select('+password');

  if (!user || user.role !== 'admin') {
    return res.status(401).json({
      success: false,
      message: 'Invalid admin credentials',
    });
  }

  // Check if password matches
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid admin credentials',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Admin login successful',
    data: {
      user: user.getSafeUser(),
      token: generateToken(user._id),
    },
  });
});

// @desc    Send OTP to user's email
// @route   POST /api/auth/send-otp
// @access  Public
export const sendOTP = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Generate OTP
  const otp = generateOTP();
  const otpExpiry = generateOTPExpiry();

  // Save OTP to user document
  user.otp = {
    code: otp,
    expiresAt: otpExpiry,
  };
  await user.save();

  // Send OTP via email
  try {
    await sendOTPEmail(user.email, user.username, otp);

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email',
    });
  } catch (error) {
    console.error('Error sending OTP email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP. Please try again.',
    });
  }
});

// @desc    Verify OTP and complete login
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOTP = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { email, otp } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Verify OTP
  const isOTPValid = verifyOTPUtil(otp, user.otp?.code, user.otp?.expiresAt);

  if (!isOTPValid) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired OTP',
    });
  }

  // Clear OTP from user document
  user.otp = undefined;
  user.isVerified = true;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: user.getSafeUser(),
      token: generateToken(user._id),
    },
  });
});

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  res.status(200).json({
    success: true,
    data: {
      user: user.getSafeUser(),
    },
  });
});
