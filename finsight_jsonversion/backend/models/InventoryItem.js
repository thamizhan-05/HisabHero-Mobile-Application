import mongoose from 'mongoose';

const InventoryItemSchema = new mongoose.Schema({
  businessId: { type: String, ref: 'Business', required: true },
  name: { type: String, required: true },
  sku: { type: String, required: true },
  category: { type: String, default: 'General' },
  purchasePrice: { type: Number, default: 0 },
  sellingPrice: { type: Number, default: 0 },
  stockQuantity: { type: Number, default: 0 },
  reorderLevel: { type: Number, default: 5 },
}, { timestamps: true });

export default mongoose.model('InventoryItem', InventoryItemSchema);
