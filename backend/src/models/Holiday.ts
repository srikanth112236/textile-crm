import mongoose, { Schema, Document } from 'mongoose';

export interface IHoliday extends Document {
  name: string;
  date: string; // YYYY-MM-DD
  type: 'festive' | 'public_holiday' | 'weekend';
  isPaid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HolidaySchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    date: { type: String, required: true, unique: true },
    type: { type: String, enum: ['festive', 'public_holiday', 'weekend'], default: 'festive' },
    isPaid: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IHoliday>('Holiday', HolidaySchema);
