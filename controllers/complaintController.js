import { validationResult } from 'express-validator';
import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { generateTrackingId, calculateDistance } from '../utils/helpers.js';
import { sendComplaintReceivedEmail } from '../utils/emailService.js';

// @desc    Create a new complaint
// @route   POST /api/complaints
// @access  Private
export const createComplaint = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const {
    category,
    title,
    description,
    isAnonymous,
    location,
  } = req.body;

  // Parse location if it's provided and is a string
  const locationData = location 
    ? (typeof location === 'string' ? JSON.parse(location) : location)
    : null;

  // Generate unique tracking ID
  let trackingId;
  let isUnique = false;
  
  while (!isUnique) {
    trackingId = generateTrackingId();
    const existing = await Complaint.findOne({ trackingId });
    if (!existing) isUnique = true;
  }

  // Process file uploads
  const mediaData = {
    images: [],
    videos: [],
  };

  if (req.files) {
    // Upload images
    if (req.files.images) {
      for (const file of req.files.images) {
        try {
          const result = await uploadToCloudinary(file.buffer, 'complaints', 'image');
          mediaData.images.push({
            public_id: result.public_id,
            url: result.secure_url,
          });
        } catch (error) {
          console.error('Image upload error:', error);
        }
      }
    }

    // Upload videos
    if (req.files.videos) {
      for (const file of req.files.videos) {
        try {
          const result = await uploadToCloudinary(file.buffer, 'complaints', 'video');
          mediaData.videos.push({
            public_id: result.public_id,
            url: result.secure_url,
          });
        } catch (error) {
          console.error('Video upload error:', error);
        }
      }
    }
  }

  // Create complaint
  const complaint = await Complaint.create({
    user: req.user._id,
    trackingId,
    category,
    title,
    description,
    isAnonymous: isAnonymous === 'true' || isAnonymous === true,
    location: locationData,
    media: mediaData,
    status: 'pending',
  });

  // Update user's complaint stats
  await User.findByIdAndUpdate(req.user._id, {
    $inc: {
      'complaintStats.total': 1,
      'complaintStats.pending': 1,
    },
  });

  // Send confirmation email (if not anonymous)
  if (!isAnonymous) {
    try {
      await sendComplaintReceivedEmail(
        req.user.email,
        req.user.name,
        trackingId,
        title
      );
    } catch (error) {
      console.error('Email sending error:', error);
    }
  }

  // Populate user data
  const populatedComplaint = await Complaint.findById(complaint._id)
    .populate('user', 'name email profilePicture address ward locality');

  res.status(201).json({
    success: true,
    message: 'Complaint registered successfully',
    data: {
      complaint: populatedComplaint,
    },
  });
});

// @desc    Get all complaints (with filters)
// @route   GET /api/complaints
// @access  Public
export const getAllComplaints = asyncHandler(async (req, res) => {
  const {
    status,
    category,
    ward,
    locality,
    sortBy = 'upvotes',
    page = 1,
    limit = 10,
  } = req.query;

  // Build filter object
  const filter = {};
  
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (ward) filter['location.ward'] = ward;
  if (locality) filter['location.locality'] = locality;

  // Build sort object
  const sortOptions = {};
  if (sortBy === 'upvotes') {
    sortOptions.upvotes = -1; // Most upvoted first
    sortOptions.createdAt = -1; // Then by newest
  } else if (sortBy === 'recent') {
    sortOptions.createdAt = -1;
  } else {
    sortOptions.upvotes = -1;
  }

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Get complaints
  const complaints = await Complaint.find(filter)
    .populate('user', 'name email profilePicture address ward locality')
    .populate('assignedTo', 'name designation department email')
    .sort(sortOptions)
    .limit(parseInt(limit))
    .skip(skip);

  // Get total count for pagination
  const total = await Complaint.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: {
      complaints,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    },
  });
});

// @desc    Get complaint by ID
// @route   GET /api/complaints/:id
// @access  Public
export const getComplaintById = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate('user', 'name email profilePicture address ward locality')
    .populate('assignedTo', 'name designation department email');

  if (!complaint) {
    return res.status(404).json({
      success: false,
      message: 'Complaint not found',
    });
  }

  res.status(200).json({
    success: true,
    data: {
      complaint,
    },
  });
});

// @desc    Get logged-in user's complaints
// @route   GET /api/complaints/my-complaints
// @access  Private
export const getMyComplaints = asyncHandler(async (req, res) => {
  const { status } = req.query;

  const filter = { user: req.user._id };
  if (status) filter.status = status;

  const complaints = await Complaint.find(filter)
    .populate('assignedTo', 'name designation department email')
    .sort({ createdAt: -1 });

  // Group complaints by status
  const grouped = {
    pending: [],
    inProgress: [],
    resolved: [],
  };

  complaints.forEach((complaint) => {
    if (complaint.status === 'pending') {
      grouped.pending.push(complaint);
    } else if (complaint.status === 'in-progress') {
      grouped.inProgress.push(complaint);
    } else if (complaint.status === 'resolved') {
      grouped.resolved.push(complaint);
    }
  });

  res.status(200).json({
    success: true,
    data: {
      complaints,
      grouped,
      stats: {
        total: complaints.length,
        pending: grouped.pending.length,
        inProgress: grouped.inProgress.length,
        resolved: grouped.resolved.length,
      },
    },
  });
});

// @desc    Upvote a complaint
// @route   POST /api/complaints/:id/upvote
// @access  Private
export const upvoteComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    return res.status(404).json({
      success: false,
      message: 'Complaint not found',
    });
  }

  // Check if user already upvoted
  if (complaint.upvotedBy.includes(req.user._id)) {
    return res.status(400).json({
      success: false,
      message: 'You have already upvoted this complaint',
    });
  }

  // Add upvote
  complaint.upvotedBy.push(req.user._id);
  complaint.upvotes += 1;
  await complaint.save();

  res.status(200).json({
    success: true,
    message: 'Complaint upvoted successfully',
    data: {
      upvotes: complaint.upvotes,
    },
  });
});

// @desc    Remove upvote from a complaint
// @route   DELETE /api/complaints/:id/upvote
// @access  Private
export const removeUpvote = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    return res.status(404).json({
      success: false,
      message: 'Complaint not found',
    });
  }

  // Check if user has upvoted
  const upvoteIndex = complaint.upvotedBy.indexOf(req.user._id);
  if (upvoteIndex === -1) {
    return res.status(400).json({
      success: false,
      message: 'You have not upvoted this complaint',
    });
  }

  // Remove upvote
  complaint.upvotedBy.splice(upvoteIndex, 1);
  complaint.upvotes -= 1;
  await complaint.save();

  res.status(200).json({
    success: true,
    message: 'Upvote removed successfully',
    data: {
      upvotes: complaint.upvotes,
    },
  });
});

// @desc    Get complaints near a location
// @route   GET /api/complaints/nearby
// @access  Public
export const getNearbyComplaints = asyncHandler(async (req, res) => {
  const { latitude, longitude, radius = 5 } = req.query;

  if (!latitude || !longitude) {
    return res.status(400).json({
      success: false,
      message: 'Latitude and longitude are required',
    });
  }

  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);
  const maxDistance = parseFloat(radius); // in kilometers

  // Get all complaints with coordinates
  const allComplaints = await Complaint.find({
    'location.coordinates.latitude': { $exists: true },
    'location.coordinates.longitude': { $exists: true },
  })
    .populate('user', 'name profilePicture')
    .populate('assignedTo', 'name designation department');

  // Filter complaints within radius
  const nearbyComplaints = allComplaints.filter((complaint) => {
    const distance = calculateDistance(
      lat,
      lon,
      complaint.location.coordinates.latitude,
      complaint.location.coordinates.longitude
    );
    return distance <= maxDistance;
  });

  res.status(200).json({
    success: true,
    data: {
      complaints: nearbyComplaints,
      count: nearbyComplaints.length,
    },
  });
});
