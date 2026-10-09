import express from 'express';
import * as workspacesController from './workspaces.controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { requireWorkspaceAccess } from '../../middleware/workspaceAuth.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', workspacesController.getWorkspaces);
router.post('/', workspacesController.createWorkspace);
router.post('/personal', (req, res, next) => {
  req.body = { ...req.body, type: 'personal' };
  return workspacesController.createWorkspace(req, res, next);
});
router.post('/business', (req, res, next) => {
  req.body = { ...req.body, type: 'business' };
  return workspacesController.createWorkspace(req, res, next);
});
router.post('/join', workspacesController.joinWorkspace);

router.get('/:workspaceId', requireWorkspaceAccess, workspacesController.getWorkspaceById);
router.get('/:workspaceId/members', requireWorkspaceAccess, workspacesController.getMembers);
router.post('/:workspaceId/members', requireWorkspaceAccess, workspacesController.addMember);
router.post('/:workspaceId/reset-data', requireWorkspaceAccess, workspacesController.resetData);

export default router;
