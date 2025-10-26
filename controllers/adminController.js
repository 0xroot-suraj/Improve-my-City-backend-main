import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';
import { sendStatusUpdateEmail } from '../utils/emailService.js';

// @desc    Get all complaints (for admin dashboard)
// @route   GET /api/admin/complaints
// @access  Private/Admin
export const getAllComplaintsAdmin = asyncHandler(async (req, res) => {
  const { category, status, priority, sortBy = 'priority' } = req.query;

  const filter = {};
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (priority) filter.priority = priority;

  let sortOptions = {};
  if (sortBy === 'priority') {
    // Custom sort: high > medium > low, then by upvotes, then by date
    const complaints = await Complaint.find(filter)
      .populate('user', 'username email mobile profilePicture')
      .populate('assignedTo', 'username designation department email')
      .sort({ upvotes: -1, createdAt: -1 });

    // Sort by priority manually
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    complaints.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      if (b.upvotes !== a.upvotes) return b.upvotes - a.upvotes;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return res.status(200).json({
      success: true,
      data: {
        complaints,
        count: complaints.length,
      },
    });
  } else if (sortBy === 'upvotes') {
    sortOptions = { upvotes: -1, createdAt: -1 };
  } else {
    sortOptions = { createdAt: -1 };
  }

  const complaints = await Complaint.find(filter)
    .populate('user', 'username email mobile profilePicture')
    .populate('assignedTo', 'username designation department email')
    .sort(sortOptions);

  res.status(200).json({
    success: true,
    data: {
      complaints,
      count: complaints.length,
    },
  });
});

// @desc    Get all pending complaints
// @route   GET /api/admin/complaints/pending
// @access  Private/Admin
export const getPendingComplaints = asyncHandler(async (req, res) => {
  const { category, sortBy = 'upvotes' } = req.query;

  const filter = { status: 'pending' };
  if (category) filter.category = category;

  const sortOptions = sortBy === 'upvotes' ? { upvotes: -1, createdAt: -1 } : { createdAt: -1 };

  const complaints = await Complaint.find(filter)
    .populate('user', 'name email phone profilePicture address ward locality')
    .sort(sortOptions);

  res.status(200).json({
    success: true,
    data: {
      complaints,
      count: complaints.length,
    },
  });
});

// @desc    Get all in-progress complaints
// @route   GET /api/admin/complaints/in-progress
// @access  Private/Admin
export const getInProgressComplaints = asyncHandler(async (req, res) => {
  const { assignedToMe } = req.query;

  const filter = { status: 'in-progress' };
  
  // If assignedToMe is true, filter by current admin
  if (assignedToMe === 'true') {
    filter.assignedTo = req.user._id;
  }

  const complaints = await Complaint.find(filter)
    .populate('user', 'name email phone profilePicture address ward locality')
    .populate('assignedTo', 'name designation department email')
    .sort({ 'timestamps.inProgress': -1 });

  res.status(200).json({
    success: true,
    data: {
      complaints,
      count: complaints.length,
    },
  });
});

// @desc    Get all resolved complaints
// @route   GET /api/admin/complaints/resolved
// @access  Private/Admin
export const getResolvedComplaints = asyncHandler(async (req, res) => {
  const { category, resolvedBy } = req.query;

  const filter = { status: 'resolved' };
  if (category) filter.category = category;
  if (resolvedBy) filter.assignedTo = resolvedBy;

  const complaints = await Complaint.find(filter)
    .populate('user', 'name email profilePicture')
    .populate('assignedTo', 'name designation department')
    .sort({ 'timestamps.resolved': -1 });

  res.status(200).json({
    success: true,
    data: {
      complaints,
      count: complaints.length,
    },
  });
});

// @desc    Take/assign a complaint to admin
// @route   POST /api/admin/complaints/:id/take
// @access  Private/Admin
export const takeComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate('user', 'name email');

  if (!complaint) {
    return res.status(404).json({
      success: false,
      message: 'Complaint not found',
    });
  }

  if (complaint.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Only pending complaints can be taken',
    });
  }

  // Update complaint
  complaint.status = 'in-progress';
  complaint.assignedTo = req.user._id;
  complaint.timestamps.inProgress = new Date();
  await complaint.save();

  // Update user complaint stats
  await User.findByIdAndUpdate(complaint.user._id, {
    $inc: {
      'complaintStats.pending': -1,
      'complaintStats.inProgress': 1,
    },
  });

  // Send email notification to user
  try {
    await sendStatusUpdateEmail(
      complaint.user.email,
      complaint.user.name,
      complaint.trackingId,
      complaint.title,
      'in-progress',
      req.user.name
    );
  } catch (error) {
    console.error('Email sending error:', error);
  }

  // Populate admin details
  await complaint.populate('assignedTo', 'name designation department email');

  res.status(200).json({
    success: true,
    message: 'Complaint assigned successfully. User has been notified via email.',
    data: {
      complaint,
    },
  });
});

// @desc    Update complaint status
// @route   PATCH /api/admin/complaints/:id/status
// @access  Private/Admin
export const updateComplaintStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!['pending', 'in-progress', 'resolved'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status value',
    });
  }

  const complaint = await Complaint.findById(req.params.id)
    .populate('user', 'name email');

  if (!complaint) {
    return res.status(404).json({
      success: false,
      message: 'Complaint not found',
    });
  }

  const oldStatus = complaint.status;

  // Update status
  complaint.status = status;

  // Update timestamps
  if (status === 'in-progress' && !complaint.timestamps.inProgress) {
    complaint.timestamps.inProgress = new Date();
    complaint.assignedTo = req.user._id;
  } else if (status === 'resolved' && !complaint.timestamps.resolved) {
    complaint.timestamps.resolved = new Date();
  }

  await complaint.save();

  // Update user complaint stats
  const statUpdates = {};
  
  // Decrement old status count
  if (oldStatus === 'pending') {
    statUpdates['complaintStats.pending'] = -1;
  } else if (oldStatus === 'in-progress') {
    statUpdates['complaintStats.inProgress'] = -1;
  }

  // Increment new status count
  if (status === 'pending') {
    statUpdates['complaintStats.pending'] = (statUpdates['complaintStats.pending'] || 0) + 1;
  } else if (status === 'in-progress') {
    statUpdates['complaintStats.inProgress'] = (statUpdates['complaintStats.inProgress'] || 0) + 1;
  } else if (status === 'resolved') {
    statUpdates['complaintStats.resolved'] = (statUpdates['complaintStats.resolved'] || 0) + 1;
  }

  await User.findByIdAndUpdate(complaint.user._id, { $inc: statUpdates });

  // Send email notification to user
  try {
    await sendStatusUpdateEmail(
      complaint.user.email,
      complaint.user.name,
      complaint.trackingId,
      complaint.title,
      status,
      req.user.name
    );
  } catch (error) {
    console.error('Email sending error:', error);
  }

  res.status(200).json({
    success: true,
    message: `Complaint status updated to ${status}. User has been notified.`,
    data: {
      complaint,
    },
  });
});

// @desc    Add admin notes to complaint
// @route   PATCH /api/admin/complaints/:id/notes
// @access  Private/Admin
export const addAdminNotes = asyncHandler(async (req, res) => {
  const { notes } = req.body;

  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    return res.status(404).json({
      success: false,
      message: 'Complaint not found',
    });
  }

  complaint.adminNotes = notes;
  await complaint.save();

  res.status(200).json({
    success: true,
    message: 'Admin notes added successfully',
    data: {
      complaint,
    },
  });
});
