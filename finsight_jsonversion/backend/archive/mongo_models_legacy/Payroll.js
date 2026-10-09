import mongoose from 'mongoose';

const payrollRecordSchema = new mongoose.Schema({
  employeeName: {
    type: String,
    required: true,
  },
  employeeEmail: String,
  designation: String,
  basicSalary: {
    type: Number,
    required: true,
  },
  allowances: {
    type: Number,
    default: 0,
  },
  deductions: {
    type: Number,
    default: 0,
  },
  netSalary: {
    type: Number,
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid'],
    default: 'Pending',
  },
  paidDate: Date,
});

const payrollSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: String,
      required: true,
      index: true,
    },
    month: {
      type: String, // e.g. "2026-08"
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    records: [payrollRecordSchema],
    status: {
      type: String,
      enum: ['Draft', 'Approved', 'Processed'],
      default: 'Draft',
    },
    processedBy: String,
  },
  { timestamps: true }
);

export default mongoose.models.Payroll || mongoose.model('Payroll', payrollSchema);
