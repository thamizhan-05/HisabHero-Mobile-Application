import { transactionsRepo } from '../../db/supabaseDb.js';
import { safeRound } from '../../utils/currency.js';
import { normalizeDate } from '../../services/documentIntelligenceService.js';

export async function getTransactions(workspaceId, { limit = 100, offset = 0, type, category, startDate, endDate } = {}) {
  const transactions = await transactionsRepo.findByWorkspace(workspaceId);
  let filtered = Array.isArray(transactions) ? transactions : [];

  if (type) {
    filtered = filtered.filter(t => t.type === type);
  }
  if (category) {
    filtered = filtered.filter(t => t.category === category);
  }
  if (startDate) {
    filtered = filtered.filter(t => t.date >= startDate);
  }
  if (endDate) {
    filtered = filtered.filter(t => t.date <= endDate);
  }

  // Sort descending by date
  filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const paginated = filtered.slice(offset, offset + limit);
  return {
    total: filtered.length,
    limit,
    offset,
    transactions: paginated
  };
}

export async function createTransaction(userId, workspaceId, data) {
  const amount = safeRound(data.amount);
  if (amount <= 0) {
    throw new Error('Transaction amount must be greater than zero.');
  }

  const rawType = String(data.type || 'expense').toLowerCase();
  const type = rawType.includes('in') || rawType === 'credit' ? 'income' : 'expense';
  const date = normalizeDate(data.date);

  const tx = await transactionsRepo.create({
    userId,
    workspaceId,
    amount,
    type,
    category: data.category || 'Other',
    description: data.description || 'Transaction',
    merchant: data.merchant || data.merchantName || '',
    date,
    paymentMethod: data.paymentMethod || 'Cash',
    source: data.source || 'Manual',
    isVerified: data.isVerified ?? true
  });

  return tx;
}

export async function updateTransaction(id, workspaceId, updates) {
  const existing = await transactionsRepo.findById(id);
  if (!existing || (workspaceId && workspaceId !== 'personal' && existing.workspaceId !== workspaceId)) {
    throw new Error('Transaction not found or unauthorized.');
  }
  if (updates.amount !== undefined) {
    updates.amount = safeRound(updates.amount);
  }
  if (updates.date) {
    updates.date = normalizeDate(updates.date);
  }
  return await transactionsRepo.update(id, updates);
}

export async function deleteTransaction(id, workspaceId) {
  const existing = await transactionsRepo.findById(id);
  if (!existing || (workspaceId && workspaceId !== 'personal' && existing.workspaceId !== workspaceId)) {
    throw new Error('Transaction not found or unauthorized.');
  }
  return await transactionsRepo.delete(id);
}
