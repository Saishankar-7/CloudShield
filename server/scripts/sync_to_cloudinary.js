const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
dotenv.config();
const { cloudinary } = require('../config/cloudinary');
const Resource = require('../models/Resource');

async function syncLocalFilesToCloudinary() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const filePath = path.join(__dirname, '../uploads/Sai_Shankar_s_Resume-1788352211046-927818025.pdf');
  if (fs.existsSync(filePath)) {
    console.log('Uploading Resume PDF to Cloudinary...');
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'raw',
      folder: 'cloudshield_documents',
      use_filename: true,
      unique_filename: true,
    });
    console.log('Uploaded to Cloudinary:', result.secure_url);

    // Update Resume resource
    const resumeRes = await Resource.findOne({ name: 'Resume' });
    if (resumeRes) {
      resumeRes.cloudStorage = {
        ...resumeRes.cloudStorage,
        fileUrl: result.secure_url,
        cloudinaryUrl: result.secure_url,
        cloudUri: `cloudinary://${result.public_id}`,
        provider: 'Cloudinary Cloud',
        bucketName: process.env.CLOUDINARY_CLOUD_NAME || 'dlxueeeau',
        encryption: 'AES-256 Cloudinary Secure CDN (HTTPS / TLS 1.3)',
        isCloudPdf: true,
      };
      await resumeRes.save();
      console.log('Updated Resume in MongoDB with Cloudinary HTTPS URL:', result.secure_url);
    }
  }

  await mongoose.disconnect();
}

syncLocalFilesToCloudinary();
