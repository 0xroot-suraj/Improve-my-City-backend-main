import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    mobile: {
      type: String,
      required: [true, 'Please provide your phone number'],
      match: [/^[+]?[\d\s-()]+$/, 'Please provide a valid phone number'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false, // Don't include password by default in queries
    },
    address: {
      type: String,
      required: [true, 'Please provide your address'],
    },
    ward: {
      type: String,
    },
    locality: {
      type: String,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    profilePicture: {
      public_id: String,
      url: String,
    },
    // For admin users
    designation: {
      type: String,
    },
    department: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      code: String,
      expiresAt: Date,
    },
    complaintStats: {
      total: { type: Number, default: 0 },
      pending: { type: Number, default: 0 },
      inProgress: { type: Number, default: 0 },
      resolved: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to get safe user object (without password)
userSchema.methods.getSafeUser = function () {
  const { password, otp, __v, ...safeUser } = this.toObject();
  return safeUser;
};

const User = mongoose.model('User', userSchema);

export default User;
