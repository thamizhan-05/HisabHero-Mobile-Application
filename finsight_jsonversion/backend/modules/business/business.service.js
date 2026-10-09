import {
  invoicesRepo,
  khataRepo,
  inventoryRepo,
  subscriptionsRepo
} from '../../db/supabaseDb.js';
import {
  calculateCashFlowRadar,
  generateSmartRecoverySequence,
  analyzeDeadStockAndReorder,
  reconcileGstr2bItc,
  calculatePagarKhata
} from '../../services/businessOwnerEngine.js';
import {
  generateDailyShutterDownSummary,
  analyzeSupplierPriceHikes,
  generateChequeBounceNotice,
  generateEWayBillPayload,
  calculateTdsTcsWatchdog
} from '../../services/businessTier12Engine.js';

// Invoices
export async function getInvoices(workspaceId) {
  return await invoicesRepo.findByWorkspace(workspaceId);
}

export async function createInvoice(workspaceId, data) {
  return await invoicesRepo.create({ workspaceId, ...data });
}

// Khata
export async function getKhataLedgers(workspaceId) {
  return await khataRepo.findByWorkspace(workspaceId);
}

export async function createKhataEntry(workspaceId, data) {
  return await khataRepo.create({ workspaceId, ...data });
}

export async function deleteKhataEntry(id, workspaceId) {
  return await khataRepo.delete(id);
}

// Inventory
export async function getInventory(workspaceId) {
  return await inventoryRepo.findByWorkspace(workspaceId);
}

export async function createInventoryItem(workspaceId, data) {
  return await inventoryRepo.create({ workspaceId, ...data });
}

export async function deleteInventoryItem(id, workspaceId) {
  return await inventoryRepo.delete(id);
}

// Subscriptions
export async function getSubscriptions(workspaceId) {
  return await subscriptionsRepo.findByWorkspace(workspaceId);
}

export async function createSubscription(workspaceId, data) {
  return await subscriptionsRepo.create({ workspaceId, ...data });
}

export async function deleteSubscription(id, workspaceId) {
  return await subscriptionsRepo.delete(id);
}

// Specialized SME Engines
export {
  calculateCashFlowRadar,
  generateSmartRecoverySequence,
  analyzeDeadStockAndReorder,
  reconcileGstr2bItc,
  calculatePagarKhata,
  generateDailyShutterDownSummary,
  analyzeSupplierPriceHikes,
  generateChequeBounceNotice,
  generateEWayBillPayload,
  calculateTdsTcsWatchdog
};
