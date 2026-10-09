import express from 'express';
import * as businessController from './business.controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { requireWorkspaceAccess } from '../../middleware/workspaceAuth.js';

const router = express.Router();
const auth = [authMiddleware, requireWorkspaceAccess];

// Invoices
router.get('/invoices', auth, businessController.getInvoices);

// Khata
router.get('/khata', auth, businessController.getKhata);
router.post('/khata', auth, businessController.createKhata);
router.delete('/khata/:id', auth, businessController.deleteKhata);

// Inventory
router.get('/inventory', auth, businessController.getInventory);
router.post('/inventory', auth, businessController.createInventory);
router.delete('/inventory/:id', auth, businessController.deleteInventory);

// Subscriptions
router.get('/subscriptions', auth, businessController.getSubscriptions);
router.post('/subscriptions', auth, businessController.createSubscription);
router.delete('/subscriptions/:id', auth, businessController.deleteSubscription);

// Specialized SME Endpoints
router.get('/business/cashflow-radar', auth, businessController.getCashflowRadar);
router.get(['/business/pagar-khata', '/payroll'], auth, businessController.getPagarKhata);
router.get('/business/dead-stock-analysis', auth, businessController.getDeadStock);
router.get('/business/gstr2b-itc-safeguard', auth, businessController.getGstr2bItc);
router.get('/business/shutter-down-summary', auth, businessController.getShutterDown);
router.get('/business/supplier-price-hikes', auth, businessController.getPriceHikes);
router.get('/business/tds-tcs-watchdog', auth, businessController.getTdsWatchdog);

router.post('/business/smart-recovery-sequence', auth, businessController.postSmartRecovery);
router.post(['/business/cheque-bounce-notice', '/khata/cheque-bounce'], auth, businessController.postChequeBounce);
router.post(['/business/eway-bill', '/invoices/eway-bill'], auth, businessController.postEWayBill);

export default router;
