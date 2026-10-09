import express from 'express';
import * as dashboardController from './dashboard.controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { requireWorkspaceAccess } from '../../middleware/workspaceAuth.js';

const router = express.Router();

router.use(authMiddleware);
router.use(requireWorkspaceAccess);

router.get('/stats', dashboardController.getStats);
router.get('/health', dashboardController.getHealth);
router.get('/high-value-pending', dashboardController.getHighValuePending);

export default router;
