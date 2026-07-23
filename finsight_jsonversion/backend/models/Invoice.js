import mongoose from 'mongoose';

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true },
  businessId: { type: String, ref: 'Business', default: null },
  customerId: { type: String, ref: 'Contact', required: true },
  invoiceDate: { type: String, required: true },
  dueDate: { type: String, required: true },
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
    enum: ['draft', 'sent', 'viewed', 'partially_paid', 'paid', 'overdue', 'cancelled'], 
    default: 'draft' 
  },
  notes: { type: String },
  payments: [{
    date: { type: String, required: true },
    amount: { type: Number, required: true },
    paymentMethod: { type: String },
    reference: { type: String }
  }],
  createdBy: { type: String, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model('Invoice', InvoiceSchema);
