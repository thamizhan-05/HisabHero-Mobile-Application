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

export async function deleteInvoice(id, workspaceId) {
  const existing = await invoicesRepo.findById(id);
  if (!existing || (workspaceId && workspaceId !== 'personal' && existing.workspaceId !== workspaceId && existing.workspace_id !== workspaceId)) {
    throw new Error('Invoice not found or unauthorized.');
  }
  return await invoicesRepo.delete(id);
}

// Khata
export async function getKhataLedgers(workspaceId) {
  return await khataRepo.findByWorkspace(workspaceId);
}

export async function createKhataEntry(workspaceId, data) {
  return await khataRepo.create({ workspaceId, ...data });
}

export async function deleteKhataEntry(id, workspaceId) {
  const existing = await khataRepo.findById(id);
  if (!existing || (workspaceId && workspaceId !== 'personal' && existing.workspaceId !== workspaceId && existing.workspace_id !== workspaceId)) {
    throw new Error('Khata entry not found or unauthorized.');
  }
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
  const existing = await inventoryRepo.findById(id);
  if (!existing || (workspaceId && workspaceId !== 'personal' && existing.workspaceId !== workspaceId && existing.workspace_id !== workspaceId)) {
    throw new Error('Inventory item not found or unauthorized.');
  }
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
  const existing = await subscriptionsRepo.findById(id);
  if (!existing || (workspaceId && workspaceId !== 'personal' && existing.workspaceId !== workspaceId && existing.workspace_id !== workspaceId)) {
    throw new Error('Subscription not found or unauthorized.');
  }
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
