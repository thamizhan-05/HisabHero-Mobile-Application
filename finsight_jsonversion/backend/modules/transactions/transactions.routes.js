import express from 'express';
import * as transactionsController from './transactions.controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { requireWorkspaceAccess } from '../../middleware/workspaceAuth.js';

const router = express.Router();

router.use(authMiddleware);
router.use(requireWorkspaceAccess);

router.get('/', transactionsController.getTransactions);
router.post('/', transactionsController.createTransaction);
router.patch('/:id', transactionsController.updateTransaction);
router.put('/:id', transactionsController.updateTransaction);
router.delete('/:id', transactionsController.deleteTransaction);

export default router;
