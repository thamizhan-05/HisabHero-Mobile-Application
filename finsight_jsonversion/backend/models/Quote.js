import mongoose from 'mongoose';

const QuoteSchema = new mongoose.Schema({
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

export default mongoose.model('Quote', QuoteSchema);
