import mongoose from 'mongoose';

export let isMongoConnected = true;

const connectDB = async () => {
  const DEFAULT_ATLAS_URI = 'mongodb+srv://nebulonhackathon2026:manimau28@hisabhero.kies5xc.mongodb.net/hisabhero?retryWrites=true&w=majority';
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || DEFAULT_ATLAS_URI;

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`📡 MongoDB Atlas Connected Successfully: ${conn.connection.host}`);
    isMongoConnected = true;
  } catch (error) {
    console.error(`❌ CRITICAL: MongoDB Atlas Connection Error: ${error.message}`);
    isMongoConnected = false;
    // Retry connection after 3 seconds
    setTimeout(connectDB, 3000);
  }
};

export default connectDB;
