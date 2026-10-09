import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    default: 'Business Owner',
    trim: true,
  },
  company: {
    type: String,
    default: 'Independent Enterprise',
    trim: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    default: 5,
  },
  comment: {
    type: String,
    required: true,
    trim: true,
  },
  verified: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Review', reviewSchema);
