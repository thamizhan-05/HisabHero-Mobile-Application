import mongoose from 'mongoose';

const AchievementSchema = new mongoose.Schema({
  userId: { type: String, ref: 'User', required: true, index: true },
  achievementKey: {
    type: String,
    enum: ['expense_master', 'saving_starter', 'budget_guardian', 'consistent_saver'],
    required: true,
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, default: 'trophy' },
  unlockedAt: { type: Date, default: Date.now },
  progress: { type: Number, default: 100 },
}, { timestamps: true });

AchievementSchema.index({ userId: 1, achievementKey: 1 }, { unique: true });

export default mongoose.model('Achievement', AchievementSchema);
