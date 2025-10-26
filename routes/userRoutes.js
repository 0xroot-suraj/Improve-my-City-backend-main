import express from 'express';
import {
  getProfile,
  updateProfile,
  updateProfilePicture,
  changePassword,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadProfilePicture } from '../middleware/uploadMiddleware.js';
import { body } from 'express-validator';

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', getProfile);

// @route   PATCH /api/users/profile
// @desc    Update user profile
// @access  Private
router.patch(
  '/profile',
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('phone').optional().trim().notEmpty().withMessage('Phone cannot be empty'),
    body('address').optional().trim().notEmpty().withMessage('Address cannot be empty'),
  ],
  updateProfile
);

// @route   POST /api/users/profile-picture
// @desc    Update profile picture
// @access  Private
router.post('/profile-picture', uploadProfilePicture, updateProfilePicture);

// @route   PATCH /api/users/change-password
// @desc    Change user password
// @access  Private
router.patch(
  '/change-password',
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters'),
  ],
  changePassword
);

export default router;
