import mongoose from 'mongoose';

const MerchantMappingSchema = new mongoose.Schema({
  workspaceId: {
    type: String,
    required: true,
    index: true
  },
  merchantPattern: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },
  assignedCategory: {
    type: String,
    required: true
  },
  assignedSubcategory: {
    type: String,
    default: ''
  },
  confidenceScore: {
    type: Number,
    default: 1.0
  },
  learnedFrom: {
    type: String,
    enum: ['user_override', 'manual_edit', 'staging_review', 'ai_suggestion'],
    default: 'user_override'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

MerchantMappingSchema.index({ workspaceId: 1, merchantPattern: 1 }, { unique: true });

export default mongoose.models.MerchantMapping || mongoose.model('MerchantMapping', MerchantMappingSchema);
