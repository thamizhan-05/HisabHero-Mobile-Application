import mongoose from 'mongoose';

const HeroInsightSchema = new mongoose.Schema({
  userId: { type: String, ref: 'User', required: true, index: true },
  businessId: { type: String, ref: 'Business' },
  insightKey: { type: String, required: true },
  title: { type: String, required: true },
  explanation: { type: String, required: true },
  supportingMetric: { type: String },
  severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'info' },
  recommendedAction: { type: String },
  targetScreen: { type: String },
  dismissed: { type: Boolean, default: false },
  calculatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('HeroInsight', HeroInsightSchema);
