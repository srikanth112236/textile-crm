import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId; // Employee or User ID
  recipientRole?: 'admin' | 'employee';
  title: string;
  message: string;
  type: 'payroll' | 'leave' | 'attendance' | 'system';
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recipientRole: { type: String, enum: ['admin', 'employee'], default: 'employee' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['payroll', 'leave', 'attendance', 'system'], default: 'system' },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<INotification>('Notification', NotificationSchema);
