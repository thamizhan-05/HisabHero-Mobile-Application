import mongoose from 'mongoose';

const RecurringSubscriptionSchema = new mongoose.Schema({
  workspaceId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  vendorName: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    default: 'Software & SaaS'
  },
  amount: {
    type: Number,
    required: true
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly'],
    default: 'monthly'
  },
  nextBillingDate: {
    type: Date,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  autoLogTransaction: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'cancelled'],
    default: 'active'
  },
  notes: String
}, { timestamps: true });

const RecurringSubscription = mongoose.models.RecurringSubscription || mongoose.model('RecurringSubscription', RecurringSubscriptionSchema);
export default RecurringSubscription;
