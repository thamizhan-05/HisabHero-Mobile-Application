import mongoose from 'mongoose';

const ContactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String },
  email: { type: String },
  address: { type: String },
  type: { type: String, enum: ['customer', 'supplier', 'both'], required: true },
  businessId: { type: String, ref: 'Business', default: null }, // Null for personal
  userId: { type: String, ref: 'User', required: true },
  createdBy: { type: String, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model('Contact', ContactSchema);
