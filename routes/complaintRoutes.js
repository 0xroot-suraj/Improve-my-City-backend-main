import express from 'express';
import { body } from 'express-validator';
import {
  createComplaint,
  getAllComplaints,
  getComplaintById,
  getMyComplaints,
  upvoteComplaint,
  removeUpvote,
  getNearbyComplaints,
} from '../controllers/complaintController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadComplaintFiles } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// @route   POST /api/complaints
// @desc    Create a new complaint
// @access  Private
router.post(
  '/',
  protect,
  uploadComplaintFiles,
  [
    body('category').notEmpty().withMessage('Category is required'),
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ max: 200 })
      .withMessage('Title cannot exceed 200 characters'),
    body('description')
      .trim()
      .notEmpty()
      .withMessage('Description is required')
      .isLength({ max: 2000 })
      .withMessage('Description cannot exceed 2000 characters'),
  ],
  createComplaint
);

// @route   GET /api/complaints
// @desc    Get all complaints (with filters)
// @access  Public
router.get('/', getAllComplaints);

// @route   GET /api/complaints/my-complaints
// @desc    Get logged-in user's complaints
// @access  Private
router.get('/my-complaints', protect, getMyComplaints);

// @route   GET /api/complaints/nearby
// @desc    Get complaints near a location
// @access  Public
router.get('/nearby', getNearbyComplaints);

// @route   GET /api/complaints/:id
// @desc    Get complaint by ID
// @access  Public
router.get('/:id', getComplaintById);

// @route   POST /api/complaints/:id/upvote
// @desc    Upvote a complaint
// @access  Private
router.post('/:id/upvote', protect, upvoteComplaint);

// @route   DELETE /api/complaints/:id/upvote
// @desc    Remove upvote from a complaint
// @access  Private
router.delete('/:id/upvote', protect, removeUpvote);

export default router;
