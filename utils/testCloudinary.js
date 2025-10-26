import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

console.log('Testing Cloudinary Configuration...\n');

// Check environment variables
console.log('Environment Variables:');
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? '✓ Set' : '✗ Not Set');
console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? '✓ Set' : '✗ Not Set');
console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '✓ Set' : '✗ Not Set');
console.log('');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Test connection by pinging the API
async function testCloudinary() {
  try {
    console.log('Testing Cloudinary Connection...');
    
    // Try to get account usage info as a test
    const result = await cloudinary.api.ping();
    
    console.log('✅ Cloudinary Connection Successful!');
    console.log('Status:', result.status);
    
    // Get cloud information
    const cloudInfo = await cloudinary.api.usage();
    console.log('\nAccount Info:');
    console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
    console.log('Plan:', cloudInfo.plan || 'Free');
    console.log('Bandwidth Used:', Math.round(cloudInfo.bandwidth.used_percent) + '%');
    console.log('Storage Used:', Math.round(cloudInfo.storage.used_percent) + '%');
    
  } catch (error) {
    console.error('❌ Cloudinary Connection Failed!');
    console.error('Error:', error.message);
    if (error.error) {
      console.error('Details:', error.error.message || error.error);
    }
  }
}

testCloudinary();
