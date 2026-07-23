import mongoose from 'mongoose';

export let isMongoConnected = false;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`📡 MongoDB Connected: ${conn.connection.host}`);
    isMongoConnected = true;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.log(`⚠️ Local network blocks MongoDB Atlas outbound traffic. Gracefully falling back to Local JSON Database mode...`);
    isMongoConnected = false;
  }
};

export default connectDB;
