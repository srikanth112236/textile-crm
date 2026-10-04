import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendanceLog {
  clockIn: Date;
  clockOut?: Date;
  durationHours: number;
}

export interface IAttendance extends Document {
  employee: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  clockIn?: Date;
  clockOut?: Date;
  totalHours: number;
  mandatoryHours: number;
  metMandatoryHours: boolean;
  status: 'present' | 'absent' | 'half_day' | 'leave';
  notes?: string;
  logs: IAttendanceLog[];
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceLogSchema = new Schema({
  clockIn: { type: Date, required: true },
  clockOut: { type: Date },
  durationHours: { type: Number, default: 0 },
});

const AttendanceSchema: Schema = new Schema(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    clockIn: { type: Date },
    clockOut: { type: Date },
    totalHours: { type: Number, default: 0 },
    mandatoryHours: { type: Number, default: 8 },
    metMandatoryHours: { type: Boolean, default: false },
    status: { type: String, enum: ['present', 'absent', 'half_day', 'leave'], default: 'present' },
    notes: { type: String, default: '' },
    logs: [AttendanceLogSchema],
  },
  { timestamps: true }
);

AttendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

export default mongoose.model<IAttendance>('Attendance', AttendanceSchema);
