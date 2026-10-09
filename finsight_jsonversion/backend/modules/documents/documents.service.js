import { documentsRepo, transactionsRepo } from '../../db/supabaseDb.js';
import {
  processPDFOrImageWithAI,
  processCSVBuffer,
  processXLSXBuffer
} from '../../services/documentIntelligenceService.js';
import { safeRound } from '../../utils/currency.js';
import { normalizeDate } from '../../services/documentIntelligenceService.js';

export async function processDocumentBuffer(fileBuffer, mimeType, originalName, workspaceId) {
  const ext = (originalName || '').split('.').pop().toLowerCase();

  if (ext === 'csv') {
    const extracted = await processCSVBuffer(fileBuffer, workspaceId);
    return { documentType: 'csv_statement', parserUsed: 'csv_parser', extracted };
  }

  if (ext === 'xlsx' || ext === 'xls') {
    const extracted = await processXLSXBuffer(fileBuffer, workspaceId);
    return { documentType: 'excel_statement', parserUsed: 'xlsx_parser', extracted };
  }

  return await processPDFOrImageWithAI(fileBuffer, mimeType, originalName, workspaceId);
}

export async function commitExtractedTransactions(userId, workspaceId, { fileName, parserUsed, transactions = [] }) {
  const committed = [];

  for (const t of transactions) {
    const amt = safeRound(t.amount || t.debit || t.credit);
    if (amt <= 0) continue;

    const tx = await transactionsRepo.create({
      userId,
      workspaceId,
      amount: amt,
      type: t.type || (t.credit > 0 ? 'income' : 'expense'),
      category: t.category || 'Other',
      description: t.description || 'Imported Transaction',
      merchant: t.merchantName || t.merchant || '',
      date: normalizeDate(t.date),
      source: 'Document Import',
      isVerified: true
    });
    committed.push(tx);
  }

  // Create document record
  const doc = await documentsRepo.create({
    workspaceId,
    fileName: fileName || 'Imported Document',
    parserUsed: parserUsed || 'native_parser',
    status: 'committed',
    summary: { count: committed.length }
  });

  return {
    document: doc,
    committedCount: committed.length,
    transactions: committed
  };
}

export async function getDocuments(workspaceId) {
  return await documentsRepo.findByWorkspace(workspaceId);
}

export async function deleteDocument(id, workspaceId) {
  const existing = await documentsRepo.findById(id);
  if (!existing || (workspaceId && workspaceId !== 'personal' && existing.workspaceId !== workspaceId)) {
    throw new Error('Document not found or unauthorized.');
  }
  return await documentsRepo.delete(id);
}
