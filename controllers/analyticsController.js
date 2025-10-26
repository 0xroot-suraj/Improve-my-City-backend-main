import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import Announcement from '../models/Announcement.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

// @desc    Get dashboard statistics
// @route   GET /api/analytics/dashboard
// @access  Private/Admin
export const getDashboardStats = asyncHandler(async (req, res) => {
  // Get complaint counts by status
  const totalComplaints = await Complaint.countDocuments();
  const pendingComplaints = await Complaint.countDocuments({ status: 'pending' });
  const inProgressComplaints = await Complaint.countDocuments({ status: 'in-progress' });
  const resolvedComplaints = await Complaint.countDocuments({ status: 'resolved' });

  // Calculate resolution rate
  const resolutionRate = totalComplaints > 0 
    ? ((resolvedComplaints / totalComplaints) * 100).toFixed(1)
    : 0;

  // Get total upvotes
  const upvotesResult = await Complaint.aggregate([
    { $group: { _id: null, totalUpvotes: { $sum: '$upvotes' } } },
  ]);
  const totalUpvotes = upvotesResult[0]?.totalUpvotes || 0;

  // Get total users
  const totalUsers = await User.countDocuments({ role: 'user' });
  const totalAdmins = await User.countDocuments({ role: 'admin' });

  // Get complaints created in last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const complaintsThisMonth = await Complaint.countDocuments({
    createdAt: { $gte: thirtyDaysAgo },
  });

  const resolvedThisMonth = await Complaint.countDocuments({
    status: 'resolved',
    'timestamps.resolved': { $gte: thirtyDaysAgo },
  });

  // Calculate average response time
  const resolvedWithTimestamps = await Complaint.find({
    status: 'resolved',
    'timestamps.inProgress': { $exists: true },
    'timestamps.resolved': { $exists: true },
  }).select('timestamps');

  let avgResponseTime = 0;
  if (resolvedWithTimestamps.length > 0) {
    const totalTime = resolvedWithTimestamps.reduce((sum, complaint) => {
      const start = new Date(complaint.timestamps.filed);
      const end = new Date(complaint.timestamps.resolved);
      return sum + (end - start);
    }, 0);
    
    avgResponseTime = (totalTime / resolvedWithTimestamps.length / (1000 * 60 * 60 * 24)).toFixed(1);
  }

  res.status(200).json({
    success: true,
    data: {
      complaints: {
        total: totalComplaints,
        pending: pendingComplaints,
        inProgress: inProgressComplaints,
        resolved: resolvedComplaints,
        thisMonth: complaintsThisMonth,
        resolvedThisMonth,
      },
      metrics: {
        resolutionRate: parseFloat(resolutionRate),
        avgResponseTime: parseFloat(avgResponseTime),
        totalUpvotes,
      },
      users: {
        total: totalUsers,
        admins: totalAdmins,
      },
    },
  });
});

// @desc    Get complaints grouped by category
// @route   GET /api/analytics/complaints-by-category
// @access  Private/Admin
export const getComplaintsByCategory = asyncHandler(async (req, res) => {
  const complaintsByCategory = await Complaint.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        resolved: {
          $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] },
        },
        pending: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
        },
        inProgress: {
          $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] },
        },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      categories: complaintsByCategory,
    },
  });
});

// @desc    Get complaints grouped by status
// @route   GET /api/analytics/complaints-by-status
// @access  Private/Admin
export const getComplaintsByStatus = asyncHandler(async (req, res) => {
  const complaintsByStatus = await Complaint.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgUpvotes: { $avg: '$upvotes' },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      statusGroups: complaintsByStatus,
    },
  });
});

// @desc    Get most active users
// @route   GET /api/analytics/top-users
// @access  Private/Admin
export const getTopUsers = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const topUsers = await User.find({ role: 'user' })
    .select('name email profilePicture complaintStats')
    .sort({ 'complaintStats.total': -1 })
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    data: {
      users: topUsers,
    },
  });
});

// @desc    Get recent activities
// @route   GET /api/analytics/recent-activity
// @access  Private/Admin
export const getRecentActivity = asyncHandler(async (req, res) => {
  const { limit = 20 } = req.query;

  // Get recent complaints
  const recentComplaints = await Complaint.find()
    .select('trackingId title status user createdAt')
    .populate('user', 'name')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit) / 2);

  // Get recent status changes
  const recentResolvedComplaints = await Complaint.find({ status: 'resolved' })
    .select('trackingId title status timestamps.resolved assignedTo')
    .populate('assignedTo', 'name')
    .sort({ 'timestamps.resolved': -1 })
    .limit(parseInt(limit) / 4);

  const recentInProgressComplaints = await Complaint.find({ status: 'in-progress' })
    .select('trackingId title status timestamps.inProgress assignedTo')
    .populate('assignedTo', 'name')
    .sort({ 'timestamps.inProgress': -1 })
    .limit(parseInt(limit) / 4);

  // Combine and format activities
  const activities = [
    ...recentComplaints.map((c) => ({
      type: 'new_complaint',
      id: c._id,
      trackingId: c.trackingId,
      title: c.title,
      user: c.user?.name || 'Anonymous',
      timestamp: c.createdAt,
    })),
    ...recentResolvedComplaints.map((c) => ({
      type: 'resolved',
      id: c._id,
      trackingId: c.trackingId,
      title: c.title,
      admin: c.assignedTo?.name || 'Admin',
      timestamp: c.timestamps.resolved,
    })),
    ...recentInProgressComplaints.map((c) => ({
      type: 'in_progress',
      id: c._id,
      trackingId: c.trackingId,
      title: c.title,
      admin: c.assignedTo?.name || 'Admin',
      timestamp: c.timestamps.inProgress,
    })),
  ];

  // Sort by timestamp and limit
  activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const limitedActivities = activities.slice(0, parseInt(limit));

  res.status(200).json({
    success: true,
    data: {
      activities: limitedActivities,
    },
  });
});
