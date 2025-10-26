import { validationResult } from 'express-validator';
import Announcement from '../models/Announcement.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';

// @desc    Create a new announcement
// @route   POST /api/announcements
// @access  Private/Admin
export const createAnnouncement = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { title, body, category } = req.body;

  // Process image upload if provided
  let imageData = null;
  if (req.file) {
    try {
      const result = await uploadToCloudinary(req.file.buffer, 'announcements', 'image');
      imageData = {
        public_id: result.public_id,
        url: result.secure_url,
      };
    } catch (error) {
      console.error('Image upload error:', error);
    }
  }

  // Create announcement
  const announcement = await Announcement.create({
    admin: req.user._id,
    title,
    body,
    category: category || 'Awareness',
    image: imageData,
  });

  // Populate admin details
  await announcement.populate('admin', 'name designation department profilePicture');

  res.status(201).json({
    success: true,
    message: 'Announcement created successfully',
    data: {
      announcement,
    },
  });
});

// @desc    Get all announcements
// @route   GET /api/announcements
// @access  Public
export const getAllAnnouncements = asyncHandler(async (req, res) => {
  const { category, page = 1, limit = 10 } = req.query;

  const filter = { isActive: true };
  if (category) filter.category = category;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const announcements = await Announcement.find(filter)
    .populate('admin', 'name designation department profilePicture')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(skip);

  const total = await Announcement.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: {
      announcements,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    },
  });
});

// @desc    Get announcement by ID
// @route   GET /api/announcements/:id
// @access  Public
export const getAnnouncementById = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id)
    .populate('admin', 'name designation department profilePicture email');

  if (!announcement) {
    return res.status(404).json({
      success: false,
      message: 'Announcement not found',
    });
  }

  res.status(200).json({
    success: true,
    data: {
      announcement,
    },
  });
});

// @desc    Update announcement
// @route   PATCH /api/announcements/:id
// @access  Private/Admin
export const updateAnnouncement = asyncHandler(async (req, res) => {
  const { title, body, category, isActive } = req.body;

  const announcement = await Announcement.findById(req.params.id);

  if (!announcement) {
    return res.status(404).json({
      success: false,
      message: 'Announcement not found',
    });
  }

  // Update fields
  if (title) announcement.title = title;
  if (body) announcement.body = body;
  if (category) announcement.category = category;
  if (typeof isActive !== 'undefined') announcement.isActive = isActive;

  // Update image if provided
  if (req.file) {
    try {
      // Delete old image if exists
      if (announcement.image && announcement.image.public_id) {
        await deleteFromCloudinary(announcement.image.public_id);
      }

      // Upload new image
      const result = await uploadToCloudinary(req.file.buffer, 'announcements', 'image');
      announcement.image = {
        public_id: result.public_id,
        url: result.secure_url,
      };
    } catch (error) {
      console.error('Image upload error:', error);
    }
  }

  await announcement.save();
  await announcement.populate('admin', 'name designation department profilePicture');

  res.status(200).json({
    success: true,
    message: 'Announcement updated successfully',
    data: {
      announcement,
    },
  });
});

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
// @access  Private/Admin
export const deleteAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);

  if (!announcement) {
    return res.status(404).json({
      success: false,
      message: 'Announcement not found',
    });
  }

  // Delete image from Cloudinary if exists
  if (announcement.image && announcement.image.public_id) {
    try {
      await deleteFromCloudinary(announcement.image.public_id);
    } catch (error) {
      console.error('Image deletion error:', error);
    }
  }

  await announcement.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Announcement deleted successfully',
  });
});

// @desc    Like an announcement
// @route   POST /api/announcements/:id/like
// @access  Private
export const likeAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);

  if (!announcement) {
    return res.status(404).json({
      success: false,
      message: 'Announcement not found',
    });
  }

  // Check if user already liked
  if (announcement.likedBy.includes(req.user._id)) {
    return res.status(400).json({
      success: false,
      message: 'You have already liked this announcement',
    });
  }

  // Add like
  announcement.likedBy.push(req.user._id);
  announcement.likes += 1;
  await announcement.save();

  res.status(200).json({
    success: true,
    message: 'Announcement liked successfully',
    data: {
      likes: announcement.likes,
    },
  });
});

// @desc    Unlike an announcement
// @route   DELETE /api/announcements/:id/like
// @access  Private
export const unlikeAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);

  if (!announcement) {
    return res.status(404).json({
      success: false,
      message: 'Announcement not found',
    });
  }

  // Check if user has liked
  const likeIndex = announcement.likedBy.indexOf(req.user._id);
  if (likeIndex === -1) {
    return res.status(400).json({
      success: false,
      message: 'You have not liked this announcement',
    });
  }

  // Remove like
  announcement.likedBy.splice(likeIndex, 1);
  announcement.likes -= 1;
  await announcement.save();

  res.status(200).json({
    success: true,
    message: 'Like removed successfully',
    data: {
      likes: announcement.likes,
    },
  });
});
