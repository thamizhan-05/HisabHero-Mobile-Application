import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  userId: { type: String, ref: 'User' },
  businessId: { type: String, ref: 'Business', default: null },
  createdBy: { type: String, ref: 'User' },
  uploadId: { type: String, required: true },
  date: { type: String, required: true }, // Format matching current setup (YYYY-MM-DD string)
  description: { type: String, required: true },
  category: { type: String, default: 'Other' },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['income', 'expense'], default: 'expense' },
  merchant: { type: String },
  paymentMethod: { type: String },
  receiptUrl: { type: String },
  taxAmount: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['draft', 'pending_approval', 'approved', 'rejected', 'reimbursed'], 
    default: 'approved' 
  },
  approvedBy: { type: String, ref: 'User' },
  approvalNotes: { type: String },
  originalAmount: { type: Number },
  originalCurrency: { type: String },
  exchangeRate: { type: Number },
}, { timestamps: true });

export default mongoose.model('Transaction', TransactionSchema);
