import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployee extends Document {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  joiningDate: Date;
  baseSalary: number;
  mandatoryWorkingHours: number;
  status: 'active' | 'inactive';
  userId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema: Schema = new Schema(
  {
    employeeCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    department: { type: String, required: true },
    designation: { type: String, required: true },
    joiningDate: { type: Date, default: Date.now },
    baseSalary: { type: Number, required: true, min: 0 },
    mandatoryWorkingHours: { type: Number, default: 8, min: 1, max: 24 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model<IEmployee>('Employee', EmployeeSchema);
