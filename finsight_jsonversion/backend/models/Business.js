import mongoose from 'mongoose';

const BusinessSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  logo: { type: String },
  currency: { type: String, default: 'INR' },
  createdBy: { type: String, ref: 'User', required: true },
  budgets: { type: Map, of: Number, default: {} },
}, { timestamps: true });

export default mongoose.model('Business', BusinessSchema);
