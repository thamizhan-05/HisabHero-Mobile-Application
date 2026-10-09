import express from 'express';
import * as aiController from './ai.controller.js';
import { authMiddleware } from '../../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/chat', aiController.chat);
router.post(['/voice-copilot', '/copilot/voice'], aiController.voiceCopilot);

export default router;
