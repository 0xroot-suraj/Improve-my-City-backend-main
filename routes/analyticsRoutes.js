import express from 'express';
import {
  getDashboardStats,
  getComplaintsByCategory,
  getComplaintsByStatus,
  getTopUsers,
  getRecentActivity,
} from '../controllers/analyticsController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   GET /api/analytics/dashboard
// @desc    Get dashboard statistics
// @access  Private/Admin
router.get('/dashboard', protect, adminOnly, getDashboardStats);

// @route   GET /api/analytics/complaints-by-category
// @desc    Get complaints grouped by category
// @access  Private/Admin
router.get('/complaints-by-category', protect, adminOnly, getComplaintsByCategory);

// @route   GET /api/analytics/complaints-by-status
// @desc    Get complaints grouped by status
// @access  Private/Admin
router.get('/complaints-by-status', protect, adminOnly, getComplaintsByStatus);

// @route   GET /api/analytics/top-users
// @desc    Get most active users
// @access  Private/Admin
router.get('/top-users', protect, adminOnly, getTopUsers);

// @route   GET /api/analytics/recent-activity
// @desc    Get recent activities
// @access  Private/Admin
router.get('/recent-activity', protect, adminOnly, getRecentActivity);

export default router;
