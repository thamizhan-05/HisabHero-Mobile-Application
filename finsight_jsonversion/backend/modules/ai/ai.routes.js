import express from 'express';
import * as aiController from './ai.controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { requireWorkspaceAccess } from '../../middleware/workspaceAuth.js';

const router = express.Router();

router.use(authMiddleware);
router.use(requireWorkspaceAccess);

router.post('/chat', aiController.chat);
router.post(['/voice-copilot', '/copilot/voice'], aiController.voiceCopilot);

export default router;
