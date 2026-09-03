const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const Resource = require('../models/Resource');

async function updateDbResources() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const resources = await Resource.find({});
  for (const res of resources) {
    let changed = false;
    const cloud = res.cloudStorage || {};

    // If fileUrl contains localhost:5000 and cloudinaryUrl exists
    if (cloud.fileUrl && cloud.fileUrl.includes('localhost:5000')) {
      if (cloud.cloudinaryUrl) {
        cloud.fileUrl = cloud.cloudinaryUrl;
        changed = true;
      } else if (cloud.cloudUri && cloud.cloudUri.startsWith('cloudinary://')) {
        const publicId = cloud.cloudUri.replace('cloudinary://', '');
        cloud.fileUrl = `https://res.cloudinary.com/dlxueeeau/raw/upload/${publicId}`;
        cloud.cloudinaryUrl = cloud.fileUrl;
        changed = true;
      }
    }

    if (changed) {
      res.cloudStorage = cloud;
      await res.save();
      console.log(`Updated resource "${res.name}" with cloud URL:`, cloud.fileUrl);
    }
  }

  console.log('Resource migration finished');
  await mongoose.disconnect();
}

updateDbResources();
