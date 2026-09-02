const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cloudshield';

  mongoose.set('strictQuery', true);

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 6000,
    });

    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      console.error(`MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to app termination');
      process.exit(0);
    });

    return conn;
  } catch (err) {
    console.error(`\n[MongoDB Atlas Warning] Failed to connect to remote MongoDB URI:\n  -> ${err.message}`);

    if (err.message.includes('whitelist') || err.message.includes('Could not connect to any servers') || err.message.includes('timed out')) {
      console.warn('\n===============================================================');
      console.warn('⚡ TO CONNECT TO YOUR MONGODB ATLAS CLUSTER:');
      console.warn('1. Log in to https://cloud.mongodb.com');
      console.warn('2. Navigate to "Network Access" under Security in the left sidebar.');
      console.warn('3. Click "+ Add IP Address" and select "Allow Access From Anywhere" (0.0.0.0/0) or add your current IP.');
      console.warn('4. Save and give Atlas ~1 minute to update the firewall.');
      console.warn('===============================================================\n');
    }

    // Fallback to local MongoDB so backend continues to function reliably
    try {
      const fallbackUri = 'mongodb://127.0.0.1:27017/cloudshield';
      console.log(`Attempting fallback connection to local MongoDB (${fallbackUri})...`);
      const fallbackConn = await mongoose.connect(fallbackUri, {
        serverSelectionTimeoutMS: 3000,
      });
      console.log(`Fallback connected to local MongoDB: ${fallbackConn.connection.host}/${fallbackConn.connection.name}`);
      return fallbackConn;
    } catch (fallbackErr) {
      console.error(`Fatal: Unable to connect to both Atlas and local MongoDB: ${fallbackErr.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;