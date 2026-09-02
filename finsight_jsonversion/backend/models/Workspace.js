import mongoose from 'mongoose';

const WorkspaceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['personal', 'business'], required: true, default: 'personal' },
    isDefault: { type: Boolean, default: false },
    ownerId: { type: String, ref: 'User', required: true, index: true },
    joinCode: { type: String, default: null },
    joinEnabled: { type: Boolean, default: true },
    description: { type: String, default: '' },
    currency: { type: String, default: 'INR' },
    businessType: { type: String, default: '' },
    industry: { type: String, default: '' },
    country: { type: String, default: 'India' },
    companyAddress: { type: String, default: '' },
    phone: { type: String, default: '' },
    gstNumber: { type: String, default: '' },
    logo: { type: String, default: '' },
    budgets: { type: Map, of: Number, default: {} },
    approvalPolicy: { type: String, enum: ['single', 'majority', 'all'], default: 'single' },
    rolePermissions: { type: Map, of: [String], default: {} },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: String, ref: 'User', default: null }
  },
  { timestamps: true }
);

// Safe partial unique index: Only indexes when joinCode is a non-null string
WorkspaceSchema.index(
  { joinCode: 1 },
  { 
    unique: true, 
    sparse: true,
    partialFilterExpression: { joinCode: { $type: 'string' } }
  }
);
WorkspaceSchema.index({ ownerId: 1, deletedAt: 1 });
WorkspaceSchema.index({ type: 1, deletedAt: 1 });

export default mongoose.model('Workspace', WorkspaceSchema);
