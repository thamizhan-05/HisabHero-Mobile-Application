import mongoose from 'mongoose';

const PurchaseOrderItemSchema = new mongoose.Schema({
  inventoryItemId: { type: String, ref: 'InventoryItem', required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  receivedQuantity: { type: Number, default: 0 },
});

const PurchaseOrderSchema = new mongoose.Schema({
  businessId: { type: String, ref: 'Business', required: true },
  poNumber: { type: String, required: true },
  supplierId: { type: String, ref: 'Contact', required: true },
  items: [PurchaseOrderItemSchema],
  total: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['draft', 'sent', 'partially_received', 'received', 'cancelled'], 
    default: 'draft' 
  },
  orderDate: { type: String, required: true }, // Format matching setups (YYYY-MM-DD string)
  notes: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('PurchaseOrder', PurchaseOrderSchema);
