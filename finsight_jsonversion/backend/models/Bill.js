import mongoose from 'mongoose';

const BillSchema = new mongoose.Schema({
  workspaceId: { type: String, ref: 'Workspace', index: true },
  workspaceType: { type: String, enum: ['personal', 'business'] },
  billNumber: { type: String, required: true },
  businessId: { type: String, ref: 'Business', default: null },
  supplierId: { type: String, ref: 'Contact', required: true },
  billDate: { type: String, required: true },
  dueDate: { type: String, required: true },
  amount: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['unpaid', 'partially_paid', 'paid', 'overdue'], 
    default: 'unpaid' 
  },
  receiptUrl: { type: String },
  lineItems: [{
    description: { type: String, required: true },
    amount: { type: Number, required: true }
  }],
  payments: [{
    date: { type: String, required: true },
    amount: { type: Number, required: true },
    paymentMethod: { type: String }
  }],
  createdBy: { type: String, ref: 'User', required: true }
}, { timestamps: true });


BillSchema.index({ workspaceId: 1, createdAt: -1 });
export default mongoose.model('Bill', BillSchema);
