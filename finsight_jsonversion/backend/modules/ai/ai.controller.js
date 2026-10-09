import * as aiService from './ai.service.js';
import { HTTP_STATUS } from '../../config/constants.js';

export async function chat(req, res, next) {
  try {
    const { message, context } = req.body;
    if (!message) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Message is required.'
      });
    }

    const result = await aiService.processAiChat(message, context);
    return res.status(HTTP_STATUS.OK).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function voiceCopilot(req, res, next) {
  try {
    const prompt = req.body.spokenPrompt || req.body.prompt || req.body.text;
    const result = aiService.parseVoiceCommand(prompt);
    return res.status(HTTP_STATUS.OK).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}
