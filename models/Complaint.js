import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    trackingId: {
      type: String,
      unique: true,
      required: true,
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      enum: [
        'Public Works (roads, potholes, drainage)',
        'Water Supply & Sanitation',
        'Electricity & Streetlights',
        'Environment & Waste Management',
        'Traffic & Transport',
        'Public Amenities (parks, toilets, bus stops)',
        'Law & Order / Safety',
        'Urban Planning / Construction',
        'Health & Hygiene',
        'Animal Welfare',
        'Citizen Services (documents, offices)',
        'Other',
      ],
    },
    title: {
      type: String,
      required: [true, 'Please provide a complaint title'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    location: {
      address: {
        type: String,
        required: false,
      },
      ward: String,
      locality: String,
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    media: {
      images: [
        {
          public_id: String,
          url: String,
        },
      ],
      videos: [
        {
          public_id: String,
          url: String,
        },
      ],
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'resolved'],
      default: 'pending',
    },
    upvotes: {
      type: Number,
      default: 0,
    },
    upvotedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    timestamps: {
      filed: {
        type: Date,
        default: Date.now,
      },
      inProgress: Date,
      resolved: Date,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    adminNotes: {
      type: String,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
complaintSchema.index({ status: 1, createdAt: -1 });
complaintSchema.index({ category: 1, status: 1 });
complaintSchema.index({ user: 1, status: 1 });
complaintSchema.index({ trackingId: 1 });
complaintSchema.index({ upvotes: -1 });

// Virtual for upvote count (already stored, but keeping for reference)
complaintSchema.virtual('upvoteCount').get(function () {
  return this.upvotedBy.length;
});

// Update priority based on upvotes
complaintSchema.pre('save', function (next) {
  if (this.upvotes >= 100) {
    this.priority = 'high';
  } else if (this.upvotes >= 50) {
    this.priority = 'medium';
  } else {
    this.priority = 'low';
  }
  next();
});

const Complaint = mongoose.model('Complaint', complaintSchema);

export default Complaint;
