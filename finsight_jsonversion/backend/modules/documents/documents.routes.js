import express from 'express';
import multer from 'multer';
import * as documentsController from './documents.controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { requireWorkspaceAccess } from '../../middleware/workspaceAuth.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max
});

const router = express.Router();

router.use(authMiddleware);
router.use(requireWorkspaceAccess);

router.post('/preview', upload.single('file'), documentsController.uploadPreview);
router.post('/commit', documentsController.uploadCommit);

router.get('/', documentsController.getDocuments);
router.delete('/:id', documentsController.deleteDocument);

export default router;
