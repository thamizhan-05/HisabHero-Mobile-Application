import mongoose from 'mongoose';

const AnomalyAlertSchema = new mongoose.Schema({
  workspaceId: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  anomalyType: {
    type: String,
    enum: ['duplicate_transaction', 'weekend_disbursement', 'unusual_amount_spike', 'suspicious_vendor', 'unusual_time'],
    required: true
  },
  relatedTransactionId: String,
  amount: Number,
  isResolved: {
    type: Boolean,
    default: false
  },
  detectedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const AnomalyAlert = mongoose.models.AnomalyAlert || mongoose.model('AnomalyAlert', AnomalyAlertSchema);
export default AnomalyAlert;
