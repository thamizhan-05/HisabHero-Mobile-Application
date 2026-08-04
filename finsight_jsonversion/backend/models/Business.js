import mongoose from 'mongoose';

const BusinessSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  logo: { type: String },
  currency: { type: String, default: 'INR' },
  joinCode: { type: String, unique: true, index: true },
  primaryOwnerId: { type: String, ref: 'User', required: true },
  owners: [{ type: String, ref: 'User' }],
  employees: [{ type: String, ref: 'User' }],
  createdBy: { type: String, ref: 'User', required: true },
  budgets: { type: Map, of: Number, default: {} },
}, { timestamps: true });

export default mongoose.model('Business', BusinessSchema);
