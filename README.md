# Improve My City - Backend API

Backend API for **Improve My City Mumbai** - A civic complaint management system developed for hackathon.

## 🚀 Features

- ✅ **User Authentication** with JWT and OTP-based email verification
- ✅ **Role-based Access Control** (User & Admin)
- ✅ **Complaint Management System** with file uploads (images & videos)
- ✅ **Upvoting System** to prioritize complaints
- ✅ **Real-time Status Updates** with email notifications
- ✅ **Announcement System** for admins
- ✅ **Profile Management** with profile picture upload
- ✅ **Analytics Dashboard** for admins
- ✅ **Cloud Storage** integration with Cloudinary
- ✅ **Email Notifications** using Nodemailer
- ✅ **Rate Limiting** and security best practices

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

## 🛠️ Installation

### 1. Clone the repository

```bash
cd Improve-my-City-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory and copy the contents from `.env.example`:

```bash
cp .env.example .env
```

Update the `.env` file with your configuration:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/improve-my-city

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:8080

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=Mumbai Civic Portal <noreply@improvemycity.in>
```

### 4. Setup Services

#### MongoDB
- **Local**: Install MongoDB and start the service
- **Cloud**: Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

#### Cloudinary
1. Sign up at [Cloudinary](https://cloudinary.com/)
2. Get your Cloud Name, API Key, and API Secret from the dashboard
3. Update the `.env` file

#### Email (Gmail)
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an **App Password**: Google Account → Security → 2-Step Verification → App Passwords
3. Use the generated password in `EMAIL_PASSWORD`

## 🚀 Running the Application

### Development Mode

```bash
npm run dev
```

The server will start on `http://localhost:5000` with auto-reload enabled.

### Production Mode

```bash
npm start
```

## 📁 Project Structure

```
Improve-my-City-backend/
├── config/
│   └── database.js          # MongoDB connection
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── complaintController.js
│   ├── adminController.js
│   ├── announcementController.js
│   ├── userController.js
│   └── analyticsController.js
├── middleware/
│   ├── authMiddleware.js    # JWT & role-based auth
│   ├── errorMiddleware.js   # Error handling
│   ├── uploadMiddleware.js  # Multer file upload
│   └── rateLimitMiddleware.js
├── models/
│   ├── User.js              # User schema
│   ├── Complaint.js         # Complaint schema
│   └── Announcement.js      # Announcement schema
├── routes/
│   ├── authRoutes.js
│   ├── complaintRoutes.js
│   ├── adminRoutes.js
│   ├── announcementRoutes.js
│   ├── userRoutes.js
│   └── analyticsRoutes.js
├── utils/
│   ├── cloudinary.js        # Cloudinary helper
│   ├── emailService.js      # Email templates
│   ├── otpGenerator.js      # OTP generation
│   └── helpers.js           # Utility functions
├── .env                     # Environment variables
├── .env.example
├── .gitignore
├── package.json
├── server.js                # Entry point
└── README.md
```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### 1. Register User
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+91 9876543210",
  "password": "password123",
  "address": "Andheri West, Mumbai",
  "ward": "K/West",
  "locality": "Andheri"
}
```

#### 2. Login (Step 1 - Send OTP)
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### 3. Verify OTP (Step 2 - Complete Login)
```http
POST /auth/verify-otp
Content-Type: application/json

{
  "email": "john@example.com",
  "otp": "123456"
}
```

#### 4. Admin Login
```http
POST /auth/admin-login
Content-Type: application/json

{
  "email": "admin@mcgm.gov.in",
  "password": "adminpass"
}
```

#### 5. Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

### Complaint Endpoints

#### 1. Create Complaint
```http
POST /complaints
Authorization: Bearer <token>
Content-Type: multipart/form-data

Fields:
- category: string (required)
- title: string (required)
- description: string (required)
- isAnonymous: boolean
- location: JSON string { address, ward, locality, coordinates: { latitude, longitude } }
- images: files (max 5)
- videos: files (max 2)
```

#### 2. Get All Complaints
```http
GET /complaints?status=pending&category=Public Works&sortBy=upvotes&page=1&limit=10
```

#### 3. Get My Complaints
```http
GET /complaints/my-complaints?status=pending
Authorization: Bearer <token>
```

#### 4. Get Complaint by ID
```http
GET /complaints/:id
```

#### 5. Upvote Complaint
```http
POST /complaints/:id/upvote
Authorization: Bearer <token>
```

#### 6. Remove Upvote
```http
DELETE /complaints/:id/upvote
Authorization: Bearer <token>
```

### Admin Endpoints

#### 1. Get Pending Complaints
```http
GET /admin/complaints/pending?category=Water Supply
Authorization: Bearer <admin_token>
```

#### 2. Get In-Progress Complaints
```http
GET /admin/complaints/in-progress?assignedToMe=true
Authorization: Bearer <admin_token>
```

#### 3. Take Complaint
```http
POST /admin/complaints/:id/take
Authorization: Bearer <admin_token>
```

#### 4. Update Complaint Status
```http
PATCH /admin/complaints/:id/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "resolved"
}
```

### Announcement Endpoints

#### 1. Create Announcement (Admin)
```http
POST /announcements
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

Fields:
- title: string (required)
- body: string (required)
- category: string (Awareness, Maintenance, Public Event, Alert)
- image: file
```

#### 2. Get All Announcements
```http
GET /announcements?category=Public Event&page=1&limit=10
```

#### 3. Like Announcement
```http
POST /announcements/:id/like
Authorization: Bearer <token>
```

### User Profile Endpoints

#### 1. Get Profile
```http
GET /users/profile
Authorization: Bearer <token>
```

#### 2. Update Profile
```http
PATCH /users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Updated",
  "phone": "+91 9876543210",
  "address": "New Address"
}
```

#### 3. Update Profile Picture
```http
POST /users/profile-picture
Authorization: Bearer <token>
Content-Type: multipart/form-data

Field: profilePicture (file)
```

#### 4. Change Password
```http
PATCH /users/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "oldpass",
  "newPassword": "newpass"
}
```

### Analytics Endpoints (Admin)

#### 1. Dashboard Statistics
```http
GET /analytics/dashboard
Authorization: Bearer <admin_token>
```

#### 2. Complaints by Category
```http
GET /analytics/complaints-by-category
Authorization: Bearer <admin_token>
```

#### 3. Recent Activity
```http
GET /analytics/recent-activity?limit=20
Authorization: Bearer <admin_token>
```

## 🔐 Security Features

- **JWT Authentication** with token expiration
- **Password Hashing** using bcryptjs
- **OTP-based Email Verification**
- **Rate Limiting** on auth routes (10 requests per 15 min)
- **OTP Rate Limiting** (3 requests per 5 min)
- **Input Validation** using express-validator
- **Helmet.js** for security headers
- **CORS** configuration
- **File Type & Size Validation**

## 📧 Email Notifications

The system sends automated emails for:

1. **OTP Verification** - Login OTP code
2. **Complaint Registered** - Confirmation with tracking ID
3. **Status Update** - When complaint moves to "In Progress"
4. **Complaint Resolved** - When complaint is marked resolved

## 📊 Database Schema

### User Schema
- name, email, phone, password (hashed)
- address, ward, locality
- role (user/admin)
- profilePicture (Cloudinary)
- designation, department (for admins)
- complaintStats (total, pending, inProgress, resolved)
- otp (code, expiresAt)

### Complaint Schema
- user (ref to User)
- trackingId (unique - IMC12345 format)
- category, title, description
- isAnonymous
- location (address, ward, locality, coordinates)
- media (images[], videos[])
- status (pending/in-progress/resolved)
- upvotes, upvotedBy[]
- timestamps (filed, inProgress, resolved)
- assignedTo (ref to Admin)
- priority (auto-calculated based on upvotes)

### Announcement Schema
- admin (ref to User)
- title, body, category
- image (Cloudinary)
- likes, likedBy[]
- isActive

## 🎯 Key Features Explained

### Upvoting & Priority System
- Users can upvote complaints to show support
- Prevents duplicate upvotes
- Complaints are sorted by upvotes (most voted first)
- Priority is auto-calculated:
  - **High**: 100+ upvotes
  - **Medium**: 50-99 upvotes
  - **Low**: < 50 upvotes

### Status Workflow
1. **Pending**: Initial state when complaint is created
2. **In Progress**: Admin takes the complaint
3. **Resolved**: Admin marks it as resolved

### Email Notifications
- Sent automatically on status changes
- Beautiful HTML email templates
- Uses Nodemailer with SMTP

## 🧪 Testing

Test the API using:
- **Postman**: Import the endpoints from this README
- **Thunder Client**: VS Code extension
- **cURL**: Command line

### Create a Test Admin User

Use MongoDB Compass or mongosh:

```javascript
db.users.insertOne({
  name: "Admin User",
  email: "admin@mcgm.gov.in",
  phone: "+91 9876543210",
  password: "$2a$10$HASH", // Use bcrypt to hash password
  address: "Mumbai Municipal Corporation",
  role: "admin",
  designation: "Municipal Officer",
  department: "Public Works",
  isVerified: true
})
```

## 🐛 Troubleshooting

### MongoDB Connection Error
- Check if MongoDB is running
- Verify `MONGODB_URI` in `.env`

### Email Not Sending
- Verify Gmail App Password
- Check `EMAIL_*` variables in `.env`
- Ensure 2FA is enabled on Gmail

### Cloudinary Upload Failing
- Verify Cloudinary credentials
- Check file size (max 50MB)

### CORS Error
- Update `FRONTEND_URL` in `.env`
- Check if frontend is running on correct port

## 📝 License

This project is created for educational/hackathon purposes.

## 👥 Support

For issues or questions, please create an issue in the repository.

---

**Built with ❤️ for Improve My City Mumbai Hackathon**
