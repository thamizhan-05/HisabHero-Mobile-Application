import mongoose from 'mongoose';

const QuoteSchema = new mongoose.Schema({
  workspaceId: { type: String, ref: 'Workspace', index: true },
  workspaceType: { type: String, enum: ['personal', 'business'] },
  quoteNumber: { type: String, required: true },
  businessId: { type: String, ref: 'Business', default: null },
  customerId: { type: String, ref: 'Contact', required: true },
  quoteDate: { type: String, required: true },
  expiryDate: { type: String, required: true },
  lineItems: [{
    description: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 }
  }],
  subtotal: { type: Number, required: true },
  total: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['draft', 'sent', 'accepted', 'rejected', 'expired'], 
    default: 'draft' 
  },
  createdBy: { type: String, ref: 'User', required: true }
}, { timestamps: true });


QuoteSchema.index({ workspaceId: 1, createdAt: -1 });
export default mongoose.model('Quote', QuoteSchema);
