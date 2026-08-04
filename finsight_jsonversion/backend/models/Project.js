import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    customerName: {
      type: String,
      default: '',
    },
    budget: {
      type: Number,
      default: 0,
    },
    totalExpenses: {
      type: Number,
      default: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Planning', 'In Progress', 'Completed', 'On Hold'],
      default: 'In Progress',
    },
    startDate: Date,
    endDate: Date,
    assignedEmployees: [String],
    description: String,
  },
  { timestamps: true }
);

export default mongoose.models.Project || mongoose.model('Project', projectSchema);
