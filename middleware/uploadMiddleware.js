import multer from 'multer';
import path from 'path';

// Configure multer for memory storage (we'll upload to Cloudinary)
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
  const allowedVideoTypes = /mp4|avi|mov|wmv|webm/;
  
  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;

  // Check if it's an image
  if (
    allowedImageTypes.test(extname.slice(1)) &&
    mimetype.startsWith('image/')
  ) {
    return cb(null, true);
  }
  
  // Check if it's a video
  if (
    allowedVideoTypes.test(extname.slice(1)) &&
    mimetype.startsWith('video/')
  ) {
    return cb(null, true);
  }

  cb(new Error('Invalid file type. Only images and videos are allowed.'));
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
  fileFilter: fileFilter,
});

// Middleware for single file upload
export const uploadSingle = upload.single('file');

// Middleware for multiple files (images and videos)
export const uploadComplaintFiles = upload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'videos', maxCount: 2 },
]);

// Middleware for profile picture
export const uploadProfilePicture = upload.single('profilePicture');

// Middleware for announcement image
export const uploadAnnouncementImage = upload.single('image');

export default upload;
