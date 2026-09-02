import mongoose from 'mongoose';

const FinancialGoalSchema = new mongoose.Schema({
  workspaceId: { type: String, ref: 'Workspace', index: true },
  workspaceType: { type: String, enum: ['personal', 'business'] },
  userId: { type: String, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  category: {
    type: String,
    enum: ['emergency_fund', 'savings', 'spending_limit', 'custom'],
    default: 'savings',
  },
  targetAmount: { type: Number, required: true },
  currentAmount: { type: Number, default: 0 },
  monthlyContribution: { type: Number, default: 0 },
  targetDate: { type: Date, required: true },
  status: { type: String, enum: ['in_progress', 'completed', 'paused'], default: 'in_progress' },
  notes: { type: String, default: '' },
}, { timestamps: true });


FinancialGoalSchema.index({ workspaceId: 1, createdAt: -1 });
export default mongoose.model('FinancialGoal', FinancialGoalSchema);
