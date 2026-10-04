import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendanceRequest extends Document {
  employee: mongoose.Types.ObjectId;
  employeeCode: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  requestType: 'break' | 'adjustment';
  breakType?: 'lunch' | 'official_out' | 'personal_break' | 'shift_adjustment';
  startTime?: string;
  endTime?: string;
  durationHours: number;
  reason: string;
  status: 'pending' | 'approved_paid' | 'approved_deduction' | 'rejected';
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceRequestSchema: Schema = new Schema(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    employeeCode: { type: String, required: true },
    employeeName: { type: String, required: true },
    date: { type: String, required: true },
    requestType: { type: String, enum: ['break', 'adjustment'], default: 'break' },
    breakType: { type: String, enum: ['lunch', 'official_out', 'personal_break', 'shift_adjustment'], default: 'official_out' },
    startTime: { type: String },
    endTime: { type: String },
    durationHours: { type: Number, default: 1 },
    reason: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved_paid', 'approved_deduction', 'rejected'], default: 'pending' },
    adminNote: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model<IAttendanceRequest>('AttendanceRequest', AttendanceRequestSchema);
