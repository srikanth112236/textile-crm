import mongoose, { Schema, Document } from 'mongoose';

export interface IPayroll extends Document {
  payrollNumber: string;
  employee: mongoose.Types.ObjectId;
  employeeCode: string;
  employeeName: string;
  month: number; // 1-12
  year: number;
  totalWorkingDays: number;
  daysPresent: number;
  daysAbsent: number;
  totalHoursWorked: number;
  requiredHours: number;
  baseSalary: number;
  hourlyDeductions: number;
  unpaidLeaveDeductions: number;
  netSalary: number;
  status: 'draft' | 'approved' | 'paid';
  paidAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PayrollSchema: Schema = new Schema(
  {
    payrollNumber: { type: String, required: true, unique: true, uppercase: true },
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    employeeCode: { type: String, required: true },
    employeeName: { type: String, required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    totalWorkingDays: { type: Number, required: true, default: 26 },
    daysPresent: { type: Number, required: true, default: 0 },
    daysAbsent: { type: Number, required: true, default: 0 },
    totalHoursWorked: { type: Number, required: true, default: 0 },
    requiredHours: { type: Number, required: true, default: 208 },
    baseSalary: { type: Number, required: true },
    hourlyDeductions: { type: Number, default: 0 },
    unpaidLeaveDeductions: { type: Number, default: 0 },
    netSalary: { type: Number, required: true },
    status: { type: String, enum: ['draft', 'approved', 'paid'], default: 'draft' },
    paidAt: { type: Date },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

PayrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.model<IPayroll>('Payroll', PayrollSchema);
