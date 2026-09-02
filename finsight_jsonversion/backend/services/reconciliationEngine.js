import Invoice from '../models/Invoice.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import BankTransaction from '../models/BankTransaction.js';

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
 * Matches Invoices <-> Purchase Orders <-> Bank Transactions
 */
export async function runThreeWayReconciliation(userId, businessId = null) {
  try {
    const filter = businessId ? { businessId } : { userId };

    const [invoices, purchaseOrders, bankTransactions] = await Promise.all([
      Invoice.find(filter).lean(),
      PurchaseOrder.find(filter).lean(),
      BankTransaction.find(filter).lean()
    ]);

    const results = [];
    let matchedCount = 0;
    let discrepancyCount = 0;

    for (const inv of invoices) {
      const invNum = inv.invoiceNumber || '';
      const invTotal = Number(inv.total) || Number(inv.amount) || 0;
      const invVendor = (inv.clientName || inv.vendorName || '').toLowerCase().trim();

      // 1. Find matching Purchase Order
      const matchingPO = purchaseOrders.find((po) => {
        const poNumMatch = po.poNumber && invNum.toLowerCase().includes(po.poNumber.toLowerCase());
        const poTotalMatch = Math.abs((Number(po.total) || 0) - invTotal) < 5;
        return poNumMatch || poTotalMatch;
      });

      // 2. Find matching Bank Transaction
      const matchingBankTx = bankTransactions.find((bt) => {
        const amountMatch = Math.abs(Math.abs(Number(bt.amount) || 0) - invTotal) < 5;
        const descMatch = invVendor && (bt.description || '').toLowerCase().includes(invVendor);
        return amountMatch || descMatch;
      });

      // Calculate 3-Way Matching Score
      let matchScore = 0;
      if (matchingPO) matchScore += 45;
      if (matchingBankTx) matchScore += 45;
      if (inv.gstNumber && validateGSTIN(inv.gstNumber)) matchScore += 10;

      const isFullyMatched = matchScore >= 80;
      const hasDiscrepancy = (matchingPO && Math.abs(matchingPO.total - invTotal) > 5) ||
                             (matchingBankTx && Math.abs(Math.abs(matchingBankTx.amount) - invTotal) > 5);

      if (isFullyMatched && !hasDiscrepancy) matchedCount++;
      else discrepancyCount++;

      results.push({
        invoiceId: inv._id,
        invoiceNumber: invNum,
        invoiceTotal: invTotal,
        clientName: inv.clientName,
        matchedPO: matchingPO ? { id: matchingPO._id, poNumber: matchingPO.poNumber, total: matchingPO.total } : null,
        matchedBankTransaction: matchingBankTx ? { id: matchingBankTx._id, amount: matchingBankTx.amount, description: matchingBankTx.description } : null,
        matchScore,
        status: isFullyMatched ? 'RECONCILED' : hasDiscrepancy ? 'DISCREPANCY_FLAGGED' : 'PARTIAL_MATCH',
        discrepancyAmount: matchingPO ? Math.abs(matchingPO.total - invTotal) : 0,
        gstValid: inv.gstNumber ? validateGSTIN(inv.gstNumber) : true,
      });
    }

    return {
      success: true,
      summary: {
        totalInvoices: invoices.length,
        totalPOs: purchaseOrders.length,
        totalBankTx: bankTransactions.length,
        reconciledCount: matchedCount,
        discrepancyCount,
        reconciliationRatePercent: invoices.length > 0 ? Math.round((matchedCount / invoices.length) * 100) : 100,
      },
      details: results,
    };
  } catch (err) {
    console.error('⚠️ [ReconciliationEngine] 3-way match error:', err.message);
    throw err;
  }
}
