import mongoose from 'mongoose';

const FixedAssetSchema = new mongoose.Schema({
  workspaceId: { type: String, ref: 'Workspace', index: true },
  workspaceType: { type: String, enum: ['personal', 'business'] },
  businessId: { type: String, ref: 'Business', required: true },
  name: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['computers', 'vehicles', 'machinery', 'furniture', 'office', 'other'], 
    default: 'other' 
  },
  purchaseDate: { type: String, required: true }, // Format matching setups (YYYY-MM-DD string)
  purchaseCost: { type: Number, required: true },
  usefulLife: { type: Number, required: true }, // In years
  currentValue: { type: Number, required: true },
  depreciationMethod: { type: String, default: 'straight_line' },
  accumulatedDepreciation: { type: Number, default: 0 },
}, { timestamps: true });


FixedAssetSchema.index({ workspaceId: 1, createdAt: -1 });
export default mongoose.model('FixedAsset', FixedAssetSchema);
