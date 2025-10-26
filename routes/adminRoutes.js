import express from 'express';
import {
  getAllComplaintsAdmin,
  getPendingComplaints,
  getInProgressComplaints,
  getResolvedComplaints,
  takeComplaint,
  updateComplaintStatus,
  addAdminNotes,
} from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply protect and adminOnly middleware to all admin routes
router.use(protect);
router.use(adminOnly);

// @route   GET /api/admin/complaints
// @desc    Get all complaints (with filters)
// @access  Private/Admin
router.get('/complaints', getAllComplaintsAdmin);

// @route   GET /api/admin/complaints/pending
// @desc    Get all pending complaints
// @access  Private/Admin
router.get('/complaints/pending', getPendingComplaints);

// @route   GET /api/admin/complaints/in-progress
// @desc    Get all in-progress complaints (assigned to current admin)
// @access  Private/Admin
router.get('/complaints/in-progress', getInProgressComplaints);

// @route   GET /api/admin/complaints/resolved
// @desc    Get all resolved complaints
// @access  Private/Admin
router.get('/complaints/resolved', getResolvedComplaints);

// @route   POST /api/admin/complaints/:id/take
// @desc    Take/assign a complaint to admin
// @access  Private/Admin
router.post('/complaints/:id/take', takeComplaint);

// @route   PUT /api/admin/complaints/:id/status
// @desc    Update complaint status
// @access  Private/Admin
router.put('/complaints/:id/status', updateComplaintStatus);

// @route   PATCH /api/admin/complaints/:id/notes
// @desc    Add admin notes to complaint
// @access  Private/Admin
router.patch('/complaints/:id/notes', addAdminNotes);

export default router;
