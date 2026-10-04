import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
  customerCode: string;
  name: string;
  contactPerson?: string;
  email: string;
  phone: string;
  address: string;
  gstNumber?: string;
  goodsCategory?: string;
  creditLimit?: number;
  paymentTerms?: string;
  status?: 'active' | 'inactive';
  userId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema: Schema = new Schema(
  {
    customerCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    contactPerson: { type: String, default: '' },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    gstNumber: { type: String, default: '' },
    goodsCategory: { type: String, default: 'Fabrics & Textiles' },
    creditLimit: { type: Number, default: 100000, min: 0 },
    paymentTerms: { type: String, default: 'Net 30 Days' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model<ICustomer>('Customer', CustomerSchema);
