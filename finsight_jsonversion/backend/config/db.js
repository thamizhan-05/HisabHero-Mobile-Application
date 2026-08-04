import mongoose from 'mongoose';

export let isMongoConnected = false;

const connectDB = async () => {
  const DEFAULT_ATLAS_URI = 'mongodb+srv://nebulonhackathon2026:manimau28@hisabhero.kies5xc.mongodb.net/hisabhero?retryWrites=true&w=majority';
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || DEFAULT_ATLAS_URI;

  try {
    const conn = await mongoose.connect(mongoUri);
    console.log(`📡 MongoDB Connected: ${conn.connection.host}`);
    isMongoConnected = true;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    if (process.env.NODE_ENV === 'production') {
      console.error(`💥 Production environment requires MongoDB connection. Connection failed.`);
      isMongoConnected = false;
      throw error;
    }
    console.log(`⚠️ Gracefully falling back to Local JSON Database mode for local development...`);
    isMongoConnected = false;
  }
};

export default connectDB;
