import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import { requireAdmin, requireSuperadmin } from '../middleware/rbac';
import {
  cancelImport,
  commitImport,
  downloadImportReport,
  downloadImportTemplate,
  exportCatalogue,
  getImport,
  listImports,
  resumeImport,
  rollbackImport,
  validateImport,
} from '../controllers/productImportController';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024, files: 2 },
});

const uploadSingle = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'imagesZip', maxCount: 1 },
  ])(req, res, (error: any) => {
    if (error) {
      const message = error.code === 'LIMIT_FILE_SIZE'
        ? 'A file is too large. CSV/XLSX max 10 MB, ZIP images max 50 MB.'
        : 'The files could not be uploaded. Please choose a CSV/XLSX and an optional ZIP.';
      res.status(400).json({ error: message });
      return;
    }
    next();
  });
};

// Admin-only catalogue import. Mounted separately from /api/products so the
// :id route can never shadow these endpoints.
router.use(authenticate);

router.get('/template', requireAdmin, downloadImportTemplate);
router.get('/export', requireAdmin, exportCatalogue);
router.get('/:jobId/report.csv', requireAdmin, downloadImportReport);
router.get('/:jobId', requireAdmin, getImport);
router.get('/', requireAdmin, listImports);
router.post('/validate', requireAdmin, uploadSingle, validateImport);
router.post('/:jobId/commit', requireAdmin, commitImport);
router.post('/:jobId/cancel', requireAdmin, cancelImport);
router.post('/:jobId/resume', requireAdmin, resumeImport);
router.post('/:jobId/rollback', requireSuperadmin, rollbackImport);

export default router;
