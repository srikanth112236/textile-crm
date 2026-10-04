import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoiceItem {
  product?: mongoose.Types.ObjectId;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discountPercentage: number;
  totalPrice: number;
}

export interface IInvoice extends Document {
  invoiceNumber: string;
  customer?: mongoose.Types.ObjectId;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  items: IInvoiceItem[];
  subTotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  grandTotal: number;
  amountPaid?: number;
  status: 'paid' | 'pending' | 'partially_paid' | 'cancelled';
  issueDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product' },
  sku: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  discountPercentage: { type: Number, default: 0, min: 0, max: 100 },
  totalPrice: { type: Number, required: true, min: 0 },
});

const InvoiceSchema: Schema = new Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer' },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerAddress: { type: String, required: true },
    items: [InvoiceItemSchema],
    subTotal: { type: Number, required: true, min: 0 },
    taxRate: { type: Number, default: 18 },
    taxAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['paid', 'pending', 'partially_paid', 'cancelled'], default: 'pending' },
    issueDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model<IInvoice>('Invoice', InvoiceSchema);
