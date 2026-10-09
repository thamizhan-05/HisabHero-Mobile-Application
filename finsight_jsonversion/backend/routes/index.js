import express from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import workspacesRoutes from '../modules/workspaces/workspaces.routes.js';
import transactionsRoutes from '../modules/transactions/transactions.routes.js';
import dashboardRoutes from '../modules/dashboard/dashboard.routes.js';
import documentsRoutes from '../modules/documents/documents.routes.js';
import businessRoutes from '../modules/business/business.routes.js';
import aiRoutes from '../modules/ai/ai.routes.js';

import { authMiddleware } from '../middleware/auth.js';
import { deviceSessionsRepo } from '../db/supabaseDb.js';
import { supabase } from '../db/supabaseClient.js';
import { HTTP_STATUS } from '../config/constants.js';

const router = express.Router();

// Health Check
router.get('/health', async (req, res) => {
  try {
    const { error } = await supabase.from('users').select('id', { count: 'exact', head: true });
    return res.status(HTTP_STATUS.OK).json({
      status: 'ok',
      database: error ? 'offline_fallback' : 'connected (Supabase PostgreSQL)',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return res.status(HTTP_STATUS.OK).json({
      status: 'ok',
      database: 'resilient_local_fallback',
      timestamp: new Date().toISOString()
    });
  }
});

// Mount Feature Modules
router.use('/auth', authRoutes);
router.use('/workspaces', workspacesRoutes);
router.use('/businesses', workspacesRoutes); // Alias for business workspaces
router.use('/transactions', transactionsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/upload', documentsRoutes);
router.use('/documents', documentsRoutes);
router.use('/ai', aiRoutes);
router.use('/', businessRoutes); // Mounts /invoices, /khata, /inventory, /subscriptions, /business/...

// Device Sessions Management
router.get('/devices/sessions', authMiddleware, async (req, res, next) => {
  try {
    const sessions = await deviceSessionsRepo.listByUser(req.userId);
    return res.status(HTTP_STATUS.OK).json({ success: true, sessions });
  } catch (err) {
    next(err);
  }
});

router.delete('/devices/sessions/:deviceId', authMiddleware, async (req, res, next) => {
  try {
    await deviceSessionsRepo.revoke(req.userId, req.params.deviceId);
    return res.status(HTTP_STATUS.OK).json({ success: true, message: 'Device session revoked.' });
  } catch (err) {
    next(err);
  }
});

// Contact Support
router.post('/contact', async (req, res) => {
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Support request received. Our team will contact you shortly.'
  });
});

export default router;
