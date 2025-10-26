import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const adminUsers = [
  {
    username: 'admin1',
    email: 'admin1@mumbai.gov.in',
    mobile: '9876543210',
    password: 'Admin@123',
    address: 'Mumbai Municipal Corporation, CST, Mumbai',
    role: 'admin',
    designation: 'Chief Municipal Officer',
    department: 'Administration',
  },
  {
    username: 'admin2',
    email: 'admin2@mumbai.gov.in',
    mobile: '9876543211',
    password: 'Admin@123',
    address: 'Mumbai Municipal Corporation, CST, Mumbai',
    role: 'admin',
    designation: 'Public Works Engineer',
    department: 'Public Works',
  },
  {
    username: 'admin3',
    email: 'admin3@mumbai.gov.in',
    mobile: '9876543212',
    password: 'Admin@123',
    address: 'Mumbai Municipal Corporation, CST, Mumbai',
    role: 'admin',
    designation: 'Health Officer',
    department: 'Health & Sanitation',
  },
  {
    username: 'admin4',
    email: 'admin4@mumbai.gov.in',
    mobile: '9876543213',
    password: 'Admin@123',
    address: 'Mumbai Municipal Corporation, CST, Mumbai',
    role: 'admin',
    designation: 'Traffic Manager',
    department: 'Traffic & Transport',
  },
  {
    username: 'admin5',
    email: 'admin5@mumbai.gov.in',
    mobile: '9876543214',
    password: 'Admin@123',
    address: 'Mumbai Municipal Corporation, CST, Mumbai',
    role: 'admin',
    designation: 'Environment Officer',
    department: 'Environment & Waste Management',
  },
];

const seedAdmins = async () => {
  try {
    console.log('🌱 Starting admin seed process...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admins already exist
    const existingAdmins = await User.find({ role: 'admin' });
    
    if (existingAdmins.length > 0) {
      console.log(`⚠️  Found ${existingAdmins.length} existing admin(s).`);
      console.log('Do you want to:');
      console.log('1. Keep existing and add new (default)');
      console.log('2. Delete all and recreate');
      console.log('\nProceeding with option 1 (keep existing)...');
    }

    let createdCount = 0;
    let skippedCount = 0;

    for (const adminData of adminUsers) {
      // Check if admin with this email already exists
      const existingAdmin = await User.findOne({ 
        $or: [
          { email: adminData.email },
          { username: adminData.username },
          { mobile: adminData.mobile }
        ]
      });

      if (existingAdmin) {
        console.log(`⏭️  Skipping ${adminData.username} - already exists`);
        skippedCount++;
        continue;
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminData.password, salt);

      // Create admin user
      const admin = await User.create({
        ...adminData,
        password: hashedPassword,
        isVerified: true,
      });

      console.log(`✅ Created admin: ${admin.username} (${admin.email})`);
      createdCount++;
    }

    console.log('\n📊 Seed Summary:');
    console.log(`✅ Created: ${createdCount} admin(s)`);
    console.log(`⏭️  Skipped: ${skippedCount} admin(s)`);
    console.log(`📋 Total admins in database: ${await User.countDocuments({ role: 'admin' })}`);
    
    console.log('\n🔐 Admin Login Credentials:');
    console.log('─────────────────────────────────────────');
    adminUsers.forEach((admin) => {
      console.log(`Email: ${admin.email}`);
      console.log(`Password: ${admin.password}`);
      console.log(`Department: ${admin.department}`);
      console.log('─────────────────────────────────────────');
    });

    console.log('\n✨ Seed process completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admins:', error.message);
    process.exit(1);
  }
};

// Run the seed function
seedAdmins();
