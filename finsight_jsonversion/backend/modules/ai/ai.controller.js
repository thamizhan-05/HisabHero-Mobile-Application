import * as aiService from './ai.service.js';
import { HTTP_STATUS } from '../../config/constants.js';
import { transactionsRepo, workspacesRepo, khataRepo } from '../../db/supabaseDb.js';

export async function chat(req, res, next) {
  try {
    const { message, context } = req.body;
    if (!message) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Message is required.'
      });
    }

    const wsId = req.headers['x-workspace-id'] || 'personal';
    let financialContext = context;
    if (!financialContext || !financialContext.transactions) {
      try {
        const [ws, txList] = await Promise.all([
          workspacesRepo.findById(wsId),
          transactionsRepo.findByWorkspace(wsId)
        ]);
        financialContext = {
          workspace: ws || { name: 'Active Workspace' },
          transactions: txList || [],
          ...(context || {})
        };
      } catch (err) {
        financialContext = context || {};
      }
    }

    const result = await aiService.processAiChat(message, financialContext);
    return res.status(HTTP_STATUS.OK).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function voiceCopilot(req, res, next) {
  try {
    const prompt = req.body.transcript || req.body.spokenPrompt || req.body.prompt || req.body.text;
    const result = aiService.parseVoiceCommand(prompt);

    let committed = null;
    if (req.body.autoCommit && result.amount > 0) {
      const wsId = req.headers['x-workspace-id'] || 'personal';
      try {
        const isExp = result.type === 'expense' || result.type === 'khata_credit';
        const tx = await transactionsRepo.create({
          userId: req.userId || 'demo_user',
          workspaceId: wsId,
          type: isExp ? 'expense' : 'income',
          amount: result.amount,
          category: result.category || 'General',
          description: `Voice Bookkeeper: ${result.partyName} - ${result.itemDescription}`,
          date: new Date().toISOString().split('T')[0],
          source: 'Voice Bookkeeper',
          isVerified: true
        });

        if (result.type === 'khata_credit') {
          await khataRepo.create({
            workspaceId: wsId,
            partyName: result.partyName,
            party_name: result.partyName,
            partyType: 'customer',
            party_type: 'customer',
            balance: result.amount,
            net_balance: result.amount,
            notes: result.itemDescription || 'Voice Credit Udhari'
          });
        }
        committed = tx;
      } catch (commitErr) {
        console.warn('[Voice Copilot] Auto-commit error:', commitErr.message);
      }
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      parsed: result,
      ...result,
      committed
    });
  } catch (err) {
    next(err);
  }
}
