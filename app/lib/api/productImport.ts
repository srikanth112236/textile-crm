import apiClient from './client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://textile-crm-backend.onrender.com';

export interface ImportRowIssue {
  field?: string;
  message: string;
}

export interface ImportPreviewRow {
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

export interface ImportRowResult {
  row: number;
  sku: string;
  status: 'valid' | 'update' | 'created' | 'updated' | 'skipped' | 'failed';
  productId?: string;
  errors: ImportRowIssue[];
  warnings: string[];
}

export interface ImportJob {
  jobId: string;
  status: 'queued' | 'validating' | 'validated' | 'importing' | 'completed' | 'failed' | 'cancelled';
  mode?: 'create' | 'upsert';
  fileName: string;
  fileSize?: number;
  totalRows: number;
  processedRows: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  headers?: string[];
  preview: ImportPreviewRow[];
  summary?: {
    validRows: number;
    updateRows?: number;
    errorRows: number;
    warningRows: number;
    durationMs?: number;
  };
  rows?: ImportRowResult[];
  error?: string;
  cancelRequested?: boolean;
  canResume?: boolean;
  rollbackExpiresAt?: string;
  rolledBackAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt?: string;
}

export interface ValidateImportResponse {
  jobId: string;
  status: string;
  mode: 'create' | 'upsert';
  fileName: string;
  totalRows: number;
  validRows: number;
  updateRows: number;
  errorRows: number;
  warningRows: number;
  headers: string[];
  preview: ImportPreviewRow[];
  errors: Array<{ row: number; sku: string; errors: ImportRowIssue[] }>;
  warnings: Array<{ row: number; sku: string; warnings: string[] }>;
}

export interface ImportHistoryItem {
  jobId: string;
  fileName: string;
  status: ImportJob['status'];
  mode?: 'create' | 'upsert';
  totalRows: number;
  created: number;
  updated: number;
  failed: number;
  errorRows: number;
  createdAt: string;
  completedAt?: string;
  rolledBackAt?: string;
  canResume?: boolean;
  rollbackExpiresAt?: string;
}

export const productImportApi = {
  validate: async (
    file: File,
    mode: 'create' | 'upsert' = 'create',
    imagesZip?: File | null
  ): Promise<ValidateImportResponse> => {
    // Native fetch keeps the browser-generated multipart boundary intact.
    // The shared axios instance defaults to application/json, which made
    // multer see an empty body for this one endpoint.
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', mode);
    if (imagesZip) formData.append('imagesZip', imagesZip);
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    const response = await fetch(`${API_URL}/api/admin/imports/products/validate`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body?.error || 'Could not validate the CSV file.');
    }
    return body.data as ValidateImportResponse;
  },

  commit: async (
    jobId: string,
    defaultStatus: 'draft' | 'keep' = 'draft'
  ): Promise<ImportJob> => {
    const response = await apiClient.post(
      `/admin/imports/products/${jobId}/commit`,
      { defaultStatus },
      { timeout: 120_000 }
    );
    return response.data.data;
  },

  getJob: async (jobId: string): Promise<ImportJob> => {
    const response = await apiClient.get(`/admin/imports/products/${jobId}`);
    return response.data.data;
  },

  list: async (): Promise<ImportHistoryItem[]> => {
    const response = await apiClient.get('/admin/imports/products');
    return response.data.data;
  },

  downloadReport: async (jobId: string): Promise<Blob> => {
    const response = await apiClient.get(`/admin/imports/products/${jobId}/report.csv`, {
      responseType: 'blob',
    });
    return response.data;
  },

  cancel: async (jobId: string): Promise<ImportJob> => {
    const response = await apiClient.post(`/admin/imports/products/${jobId}/cancel`);
    return response.data.data;
  },

  resume: async (jobId: string, defaultStatus: 'draft' | 'keep' = 'draft'): Promise<ImportJob> => {
    const response = await apiClient.post(
      `/admin/imports/products/${jobId}/resume`,
      { defaultStatus }
    );
    return response.data.data;
  },

  rollback: async (jobId: string): Promise<ImportJob> => {
    const response = await apiClient.post(`/admin/imports/products/${jobId}/rollback`);
    return response.data.data;
  },

  exportCatalogue: async (filters: Record<string, string | number | boolean | undefined> = {}): Promise<Blob> => {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') query.set(key, String(value));
    });
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const response = await fetch(
      `${API_URL}/api/admin/imports/products/export?${query.toString()}`,
      { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
    );
    if (!response.ok) throw new Error('Could not export the catalogue.');
    return response.blob();
  },
};
