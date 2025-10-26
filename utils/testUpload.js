import { uploadToCloudinary } from '../utils/cloudinary.js';
import fs from 'fs';
import path from 'path';

// Create a simple test buffer (a 1x1 red pixel PNG)
const testImageBuffer = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00,
  0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
  0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xdd, 0x8d, 0xb4, 0x00, 0x00, 0x00,
  0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
]);

async function testUpload() {
  console.log('🧪 Testing Cloudinary Upload Function...\n');
  
  try {
    console.log('📤 Uploading test image...');
    const result = await uploadToCloudinary(testImageBuffer, 'test-complaints', 'image');
    
    console.log('✅ Upload Successful!');
    console.log('\nUpload Details:');
    console.log('Public ID:', result.public_id);
    console.log('URL:', result.secure_url);
    console.log('Format:', result.format);
    console.log('Resource Type:', result.resource_type);
    console.log('Width:', result.width);
    console.log('Height:', result.height);
    console.log('Size:', result.bytes, 'bytes');
    
    console.log('\n✨ Cloudinary upload is working correctly!');
    
  } catch (error) {
    console.error('❌ Upload Failed!');
    console.error('Error:', error.message);
    if (error.http_code) {
      console.error('HTTP Code:', error.http_code);
    }
    if (error.error) {
      console.error('Details:', error.error);
    }
  }
}

testUpload();
