import { supabase } from '../db/supabaseClient.js';

/**
 * Indian GSTIN Regex Validator (e.g. 27AAAAA0000A1Z5)
 */
export function validateGSTIN(gstin) {
  if (!gstin || typeof gstin !== 'string') return false;
  const pattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return pattern.test(gstin.trim().toUpperCase());
}

/**
 * HSN/SAC Code Validator (4 to 8 digits)
 */
export function validateHSNCode(hsn) {
  if (!hsn) return true; // Optional field
  const pattern = /^[0-9]{4,8}$/;
  return pattern.test(String(hsn).trim());
}

/**
 * 📄 3-Way Automated Intelligent Document Reconciliation Engine
 * Matches Invoices <-> Bills/POs <-> Transactions in Supabase
 */
export async function runThreeWayReconciliation(userId, workspaceId = null) {
  try {
    const wsId = workspaceId;
    let invQuery = supabase.from('invoices').select('*');
    let billQuery = supabase.from('bills').select('*');
    let txQuery = supabase.from('transactions').select('*');

    if (wsId) {
      invQuery = invQuery.eq('workspace_id', wsId);
      billQuery = billQuery.eq('workspace_id', wsId);
      txQuery = txQuery.eq('workspace_id', wsId);
    }

    const [{ data: invoices }, { data: bills }, { data: transactions }] = await Promise.all([
      invQuery,
      billQuery,
      txQuery
    ]);

    const invList = invoices || [];
    const billList = bills || [];
    const txList = transactions || [];

    const results = [];
    let matchedCount = 0;
    let discrepancyCount = 0;

    for (const inv of invList) {
      const invNum = inv.invoice_number || '';
      const invTotal = Number(inv.total_amount) || 0;
      const invCustomer = (inv.customer_name || '').toLowerCase().trim();

      // 1. Find matching Bill/PO
      const matchingBill = billList.find((b) => {
        const numMatch = b.bill_number && invNum.toLowerCase().includes(b.bill_number.toLowerCase());
        const totalMatch = Math.abs((Number(b.total_amount) || 0) - invTotal) < 5;
        return numMatch || totalMatch;
      });

      // 2. Find matching Transaction
      const matchingTx = txList.find((t) => {
        const amountMatch = Math.abs(Math.abs(Number(t.amount) || 0) - invTotal) < 5;
        const descMatch = invCustomer && (t.description || '').toLowerCase().includes(invCustomer);
        return amountMatch || descMatch;
      });

      // Calculate 3-Way Matching Score
      let matchScore = 0;
      if (matchingBill) matchScore += 45;
      if (matchingTx) matchScore += 45;
      if (inv.customer_gstin && validateGSTIN(inv.customer_gstin)) matchScore += 10;

      const isFullyMatched = matchScore >= 80;
      const hasDiscrepancy = (matchingBill && Math.abs(Number(matchingBill.total_amount) - invTotal) > 5) ||
                             (matchingTx && Math.abs(Math.abs(Number(matchingTx.amount)) - invTotal) > 5);

      if (isFullyMatched && !hasDiscrepancy) matchedCount++;
      else discrepancyCount++;

      results.push({
        invoiceId: inv.id,
        invoiceNumber: invNum,
        invoiceTotal: invTotal,
        customerName: inv.customer_name,
        matchedBill: matchingBill ? { id: matchingBill.id, billNumber: matchingBill.bill_number, total: matchingBill.total_amount } : null,
        matchedTransaction: matchingTx ? { id: matchingTx.id, amount: matchingTx.amount, description: matchingTx.description } : null,
        matchScore,
        status: isFullyMatched ? 'RECONCILED' : hasDiscrepancy ? 'DISCREPANCY_FLAGGED' : 'PARTIAL_MATCH',
        discrepancyAmount: matchingBill ? Math.abs(Number(matchingBill.total_amount) - invTotal) : 0,
        gstValid: inv.customer_gstin ? validateGSTIN(inv.customer_gstin) : true,
      });
    }

    return {
      success: true,
      summary: {
        totalInvoices: invList.length,
        totalBills: billList.length,
        totalTransactions: txList.length,
        reconciledCount: matchedCount,
        discrepancyCount,
        reconciliationRatePercent: invList.length > 0 ? Math.round((matchedCount / invList.length) * 100) : 100,
      },
      details: results,
    };
  } catch (err) {
    console.error('⚠️ [ReconciliationEngine] 3-way match error:', err.message);
    throw err;
  }
}
