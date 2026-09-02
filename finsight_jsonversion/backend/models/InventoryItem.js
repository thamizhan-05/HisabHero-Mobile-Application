import mongoose from 'mongoose';

const InventoryItemSchema = new mongoose.Schema({
  workspaceId: { type: String, ref: 'Workspace', index: true },
  workspaceType: { type: String, enum: ['personal', 'business'] },
  businessId: { type: String, ref: 'Business', required: true },
  name: { type: String, required: true },
  sku: { type: String, required: true },
  category: { type: String, default: 'General' },
  purchasePrice: { type: Number, default: 0 },
  sellingPrice: { type: Number, default: 0 },
  stockQuantity: { type: Number, default: 0 },
  reorderLevel: { type: Number, default: 5 },
}, { timestamps: true });


InventoryItemSchema.index({ workspaceId: 1, createdAt: -1 });
export default mongoose.model('InventoryItem', InventoryItemSchema);
