import mongoose from 'mongoose';

const BranchSchema = new mongoose.Schema({
  businessId: { type: String, ref: 'Business', required: true, index: true },
  name: { type: String, required: true },
  code: { type: String, required: true }, // e.g. "HO-01", "BLR-SOUTH"
  location: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  gstin: { type: String, default: '' },
  managerId: { type: String, ref: 'User' },
  managerName: { type: String, default: '' },
  monthlyBudgetCap: { type: Number, default: 0 },
  currentMonthExpenses: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true });

BranchSchema.index({ businessId: 1, code: 1 }, { unique: true });

export default mongoose.model('Branch', BranchSchema);
