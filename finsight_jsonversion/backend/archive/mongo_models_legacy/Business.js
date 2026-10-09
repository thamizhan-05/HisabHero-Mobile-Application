import mongoose from 'mongoose';

const BusinessSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  logo: { type: String },
  currency: { type: String, default: 'INR' },
  joinCode: { type: String, required: true, unique: true, index: true },
  joinEnabled: { type: Boolean, default: true },
  primaryOwnerId: { type: String, ref: 'User', required: true },
  owners: [{ type: String, ref: 'User' }],
  employees: [{ type: String, ref: 'User' }],
  createdBy: { type: String, ref: 'User', required: true },
  budgets: { type: Map, of: Number, default: {} },
  // Extended business profile fields
  phone: { type: String, default: '' },
  gstNumber: { type: String, default: '' },
  businessCategory: { type: String, default: '' },
  companyAddress: { type: String, default: '' },
  // Approval policy: 'single' = any one owner, 'majority' = >50% owners, 'all' = all owners
  approvalPolicy: { type: String, enum: ['single', 'majority', 'all'], default: 'single' },
  // Role Permission Matrix Overrides (e.g. rolePermissions: { "admin": ["view_transactions", "create_invoices"], "employee": ["view_transactions"] })
  rolePermissions: { type: Map, of: [String], default: {} },
  // Multi-Owner Approval Thresholds (Tier 1: 1 Owner + Biometric, Tier 2: 2 Owners + Biometrics)
  approvalPolicyConfig: {
    tier1Threshold: { type: Number, default: 5000 },
    tier2Threshold: { type: Number, default: 50000 },
    requireTier1Biometric: { type: Boolean, default: true },
    requireTier2MultiOwner: { type: Boolean, default: true }
  }
}, { timestamps: true, autoIndex: false });

BusinessSchema.index({ joinCode: 1 }, { unique: true, sparse: true });

export default mongoose.model('Business', BusinessSchema);
