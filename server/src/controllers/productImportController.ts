import { Request, Response } from 'express';
import {
  ImportError,
  buildImportReportCsv,
  buildImportTemplateCsv,
  startProductImport,
  getImportJob,
  validateProductImport,
  cancelProductImport,
  resumeProductImport,
  rollbackProductImport,
  exportProductsCsv,
} from '../services/productImport';
import { ImportJob } from '../models/ImportJob';

function importError(res: Response, error: unknown): void {
  if (error instanceof ImportError) {
    res.status(error.status).json({ error: error.message, details: error.details });
    return;
  }
  console.error('Product import error:', error);
  res.status(500).json({ error: 'The import could not be completed. Please try again.' });
}

// GET /api/admin/imports/products/template
export const downloadImportTemplate = async (_req: Request, res: Response): Promise<void> => {
  const csv = buildImportTemplateCsv();
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="product-import-template.csv"');
  res.status(200).send(csv);
};

// POST /api/admin/imports/products/validate
export const validateImport = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const files = (req.files || {}) as Record<string, Express.Multer.File[]>;
    const file = files.file?.[0];
    const imagesZip = files.imagesZip?.[0];

    if (!file) {
      res.status(400).json({ error: 'Please choose a CSV or XLSX file to upload.' });
      return;
    }

    const fileName = file.originalname || 'products.csv';
    if (!/\.(csv|xlsx)$/i.test(fileName)) {
      res.status(400).json({ error: 'Only CSV and XLSX files are supported.' });
      return;
    }
    if (imagesZip && !/\.zip$/i.test(imagesZip.originalname || '')) {
      res.status(400).json({ error: 'Optional product images must be uploaded as a .zip file.' });
      return;
    }

    const mode = String(req.body?.mode || 'create') === 'upsert' ? 'upsert' : 'create';
    const { job } = await validateProductImport({
      buffer: file.buffer,
      fileName,
      fileSize: file.size,
      userId,
      mode,
      imagesZip: imagesZip
        ? { buffer: imagesZip.buffer, size: imagesZip.size, fileName: imagesZip.originalname }
        : null,
    });

    res.status(200).json({
      success: true,
      data: {
        jobId: job._id.toString(),
        status: job.status,
        fileName: job.fileName,
        mode: job.mode,
        totalRows: job.totalRows,
        validRows: job.summary.validRows,
        updateRows: job.summary.updateRows || 0,
        errorRows: job.summary.errorRows,
        warningRows: job.summary.warningRows,
        headers: job.headers,
        preview: job.preview,
        errors: job.rows
          .filter((row) => row.issues.length > 0)
          .slice(0, 100)
          .map((row) => ({ row: row.row, sku: row.sku, errors: row.issues })),
        warnings: job.rows
          .filter((row) => row.warnings.length > 0)
          .slice(0, 100)
          .map((row) => ({ row: row.row, sku: row.sku, warnings: row.warnings })),
      },
    });
  } catch (error) {
    importError(res, error);
  }
};

// POST /api/admin/imports/products/:jobId/commit
export const commitImport = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const requested = String(req.body?.defaultStatus || 'draft');
    const defaultStatus = requested === 'keep' ? 'keep' : 'draft';

    const job = await startProductImport(req.params.jobId, userId, { defaultStatus });
    res.status(200).json({
      success: true,
      data: serializeJob(job),
    });
  } catch (error) {
    importError(res, error);
  }
};

// GET /api/admin/imports/products/:jobId
export const getImport = async (req: Request, res: Response): Promise<void> => {
  try {
    const job = await getImportJob(req.params.jobId);
    res.status(200).json({ success: true, data: serializeJob(job) });
  } catch (error) {
    importError(res, error);
  }
};

// POST /api/admin/imports/products/:jobId/cancel
export const cancelImport = async (req: Request, res: Response): Promise<void> => {
  try {
    const job = await cancelProductImport(req.params.jobId);
    res.status(200).json({ success: true, data: serializeJob(job) });
  } catch (error) {
    importError(res, error);
  }
};

// POST /api/admin/imports/products/:jobId/resume
export const resumeImport = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const requested = String(req.body?.defaultStatus || 'draft');
    const defaultStatus = requested === 'keep' ? 'keep' : 'draft';
    const job = await resumeProductImport(req.params.jobId, userId, { defaultStatus });
    res.status(200).json({ success: true, data: serializeJob(job) });
  } catch (error) {
    importError(res, error);
  }
};

// POST /api/admin/imports/products/:jobId/rollback (superadmin only)
export const rollbackImport = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const job = await rollbackProductImport(req.params.jobId, userId);
    res.status(200).json({ success: true, data: serializeJob(job) });
  } catch (error) {
    importError(res, error);
  }
};

// GET /api/admin/imports/products/export
export const exportCatalogue = async (req: Request, res: Response): Promise<void> => {
  try {
    const csv = await exportProductsCsv(req.query as Record<string, any>);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="mentoos-products-export.csv"');
    res.status(200).send(csv);
  } catch (error) {
    importError(res, error);
  }
};

// GET /api/admin/imports/products/:jobId/report.csv
export const downloadImportReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const job = await getImportJob(req.params.jobId);
    const csv = buildImportReportCsv(job);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="product-import-${job._id.toString()}-report.csv"`
    );
    res.status(200).send(csv);
  } catch (error) {
    importError(res, error);
  }
};

// GET /api/admin/imports/products
export const listImports = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const jobs = await ImportJob.find(userId ? { createdBy: userId } : {})
      .sort({ createdAt: -1 })
      .limit(10)
      .select('fileName status mode totalRows created updated failed summary createdAt completedAt rolledBackAt payloadPath rollbackExpiresAt')
      .lean();

    res.status(200).json({
      success: true,
      data: (jobs as any[]).map((job) => ({
        jobId: String(job._id),
        fileName: job.fileName,
        status: job.status,
        mode: job.mode,
        totalRows: job.totalRows,
        created: job.created,
        updated: job.updated,
        failed: job.failed,
        errorRows: job.summary?.errorRows || 0,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
        rolledBackAt: job.rolledBackAt,
        canResume: Boolean(job.payloadPath) && ['failed', 'cancelled'].includes(job.status),
        rollbackExpiresAt: job.rollbackExpiresAt,
      })),
    });
  } catch (error) {
    importError(res, error);
  }
};

function serializeJob(job: any) {
  return {
    jobId: job._id.toString(),
    status: job.status,
    mode: job.mode,
    fileName: job.fileName,
    fileSize: job.fileSize,
    totalRows: job.totalRows,
    processedRows: job.processedRows,
    created: job.created,
    updated: job.updated,
    skipped: job.skipped,
    failed: job.failed,
    headers: job.headers,
    preview: job.preview,
    summary: job.summary,
    rows: (job.rows || []).map((row: any) => ({
      row: row.row,
      sku: row.sku,
      status: row.status,
      productId: row.productId,
      errors: row.issues || [],
      warnings: row.warnings || [],
    })),
    error: job.error,
    cancelRequested: job.cancelRequested,
    canResume: Boolean(job.payloadPath) && ['failed', 'cancelled'].includes(job.status),
    rollbackExpiresAt: job.rollbackExpiresAt,
    rolledBackAt: job.rolledBackAt,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    createdAt: job.createdAt,
  };
}
