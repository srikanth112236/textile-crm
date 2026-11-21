import mongoose, { Document, Schema } from 'mongoose';

export type ImportJobStatus =
  | 'queued'
  | 'validating'
  | 'validated'
  | 'importing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type ImportRowStatus = 'valid' | 'update' | 'created' | 'updated' | 'skipped' | 'failed';

export interface IImportRowIssue {
  field?: string;
  message: string;
}

export interface IImportRowResult {
  row: number;
  sku: string;
  status: ImportRowStatus;
  productId?: string;
  issues: IImportRowIssue[];
  warnings: string[];
}

export interface IImportPreviewRow {
  row: number;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  status: string;
  imageCount: number;
  tagCount: number;
}

export interface IImportSummary {
  validRows: number;
  updateRows?: number;
  errorRows: number;
  warningRows: number;
  durationMs?: number;
}

export interface IImportJob extends Document {
  type: 'products';
  mode: 'create' | 'upsert';
  fileName: string;
  fileSize: number;
  fileHash: string;
  status: ImportJobStatus;
  totalRows: number;
  processedRows: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  headers: string[];
  preview: IImportPreviewRow[];
  rows: IImportRowResult[];
  summary: IImportSummary;
  payloadPath?: string;
  rollbackPath?: string;
  rollbackExpiresAt?: Date;
  cancelRequested?: boolean;
  rolledBackAt?: Date;
  resumedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  startedAt?: Date;
  completedAt?: Date;
  expiresAt: Date;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const IssueSchema = new Schema<IImportRowIssue>(
  {
    field: { type: String, trim: true },
    message: { type: String, trim: true, required: true },
  },
  { _id: false }
);

const RowResultSchema = new Schema<IImportRowResult>(
  {
    row: { type: Number, required: true, min: 1 },
    sku: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['valid', 'update', 'created', 'updated', 'skipped', 'failed'],
      required: true,
    },
    productId: { type: String, trim: true },
    issues: { type: [IssueSchema], default: [] },
    warnings: { type: [String], default: [] },
  },
  { _id: false }
);

const PreviewRowSchema = new Schema<IImportPreviewRow>(
  {
    row: { type: Number, required: true },
    name: { type: String, trim: true, default: '' },
    sku: { type: String, trim: true, default: '' },
    category: { type: String, trim: true, default: '' },
    price: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    status: { type: String, default: 'draft' },
    imageCount: { type: Number, default: 0 },
    tagCount: { type: Number, default: 0 },
  },
  { _id: false }
);

const ImportJobSchema = new Schema<IImportJob>(
  {
    type: { type: String, enum: ['products'], default: 'products', required: true },
    mode: { type: String, enum: ['create', 'upsert'], default: 'create', required: true },
    fileName: { type: String, trim: true, required: true },
    fileSize: { type: Number, min: 0, default: 0 },
    fileHash: { type: String, trim: true, required: true },
    status: {
      type: String,
      enum: ['queued', 'validating', 'validated', 'importing', 'completed', 'failed', 'cancelled'],
      default: 'queued',
      index: true,
    },
    totalRows: { type: Number, min: 0, default: 0 },
    processedRows: { type: Number, min: 0, default: 0 },
    created: { type: Number, min: 0, default: 0 },
    updated: { type: Number, min: 0, default: 0 },
    skipped: { type: Number, min: 0, default: 0 },
    failed: { type: Number, min: 0, default: 0 },
    headers: { type: [String], default: [] },
    preview: { type: [PreviewRowSchema], default: [] },
    rows: { type: [RowResultSchema], default: [] },
    summary: {
      validRows: { type: Number, default: 0 },
      updateRows: { type: Number, default: 0 },
      errorRows: { type: Number, default: 0 },
      warningRows: { type: Number, default: 0 },
      durationMs: { type: Number },
    },
    payloadPath: { type: String, trim: true },
    rollbackPath: { type: String, trim: true },
    rollbackExpiresAt: { type: Date },
    cancelRequested: { type: Boolean, default: false },
    rolledBackAt: { type: Date },
    resumedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    startedAt: { type: Date },
    completedAt: { type: Date },
    expiresAt: { type: Date, required: true },
    error: { type: String, trim: true },
  },
  { timestamps: true }
);

ImportJobSchema.index({ createdBy: 1, createdAt: -1 });
ImportJobSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const ImportJob = mongoose.model<IImportJob>('ImportJob', ImportJobSchema);
