import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide an announcement title'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    body: {
      type: String,
      required: [true, 'Please provide announcement content'],
      maxlength: [5000, 'Body cannot exceed 5000 characters'],
    },
    category: {
      type: String,
      enum: ['Awareness', 'Maintenance', 'Public Event', 'Alert', 'Other'],
      default: 'Awareness',
    },
    image: {
      public_id: String,
      url: String,
    },
    likes: {
      type: Number,
      default: 0,
    },
    likedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
announcementSchema.index({ createdAt: -1 });
announcementSchema.index({ isActive: 1, createdAt: -1 });

const Announcement = mongoose.model('Announcement', announcementSchema);

export default Announcement;
