import express from 'express';
import { body } from 'express-validator';
import {
  createAnnouncement,
  getAllAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
  likeAnnouncement,
  unlikeAnnouncement,
} from '../controllers/announcementController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { uploadAnnouncementImage } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// @route   GET /api/announcements
// @desc    Get all announcements
// @access  Public
router.get('/', getAllAnnouncements);

// @route   GET /api/announcements/:id
// @desc    Get announcement by ID
// @access  Public
router.get('/:id', getAnnouncementById);

// @route   POST /api/announcements
// @desc    Create a new announcement (Admin only)
// @access  Private/Admin
router.post(
  '/',
  protect,
  adminOnly,
  uploadAnnouncementImage,
  [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ max: 200 })
      .withMessage('Title cannot exceed 200 characters'),
    body('body')
      .trim()
      .notEmpty()
      .withMessage('Body is required')
      .isLength({ max: 5000 })
      .withMessage('Body cannot exceed 5000 characters'),
  ],
  createAnnouncement
);

// @route   PATCH /api/announcements/:id
// @desc    Update announcement (Admin only)
// @access  Private/Admin
router.patch('/:id', protect, adminOnly, uploadAnnouncementImage, updateAnnouncement);

// @route   DELETE /api/announcements/:id
// @desc    Delete announcement (Admin only)
// @access  Private/Admin
router.delete('/:id', protect, adminOnly, deleteAnnouncement);

// @route   POST /api/announcements/:id/like
// @desc    Like an announcement
// @access  Private
router.post('/:id/like', protect, likeAnnouncement);

// @route   DELETE /api/announcements/:id/like
// @desc    Unlike an announcement
// @access  Private
router.delete('/:id/like', protect, unlikeAnnouncement);

export default router;
