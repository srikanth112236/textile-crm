import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'employee' | 'customer';
  mustChangePassword: boolean;
  employeeId?: mongoose.Types.ObjectId;
  customerId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'employee', 'customer'], default: 'employee' },
    mustChangePassword: { type: Boolean, default: false },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee' },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
