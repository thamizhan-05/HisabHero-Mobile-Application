import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: String,
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'],
      required: true,
    },
    subType: {
      type: String,
      default: 'General',
    },
    balance: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    description: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

accountSchema.index({ workspaceId: 1, code: 1 }, { unique: true });

export default mongoose.models.Account || mongoose.model('Account', accountSchema);
