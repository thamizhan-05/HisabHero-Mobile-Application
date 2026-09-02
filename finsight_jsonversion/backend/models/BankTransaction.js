import mongoose from 'mongoose';

const BankTransactionSchema = new mongoose.Schema({
  workspaceId: { type: String, ref: 'Workspace', index: true },
  workspaceType: { type: String, enum: ['personal', 'business'] },
  userId: { type: String, ref: 'User', required: true },
  businessId: { type: String, ref: 'Business', default: null },
  date: { type: String, required: true }, // Format matching setup (YYYY-MM-DD string)
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['credit', 'debit'], required: true }, // Credit = inflow, Debit = outflow
  reference: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['unmatched', 'matched', 'possible_match', 'ignored'], 
    default: 'unmatched' 
  },
  matchedTransactionId: { type: String, default: null },
  aiSuggestedCategory: { type: String, default: 'Other' },
}, { timestamps: true });


BankTransactionSchema.index({ workspaceId: 1, createdAt: -1 });
export default mongoose.model('BankTransaction', BankTransactionSchema);
