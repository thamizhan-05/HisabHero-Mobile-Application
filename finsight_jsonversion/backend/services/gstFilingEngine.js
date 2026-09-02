import crypto from 'crypto';
import { supabase } from '../db/supabaseClient.js';

/**
 * Generate GSTR-1 JSON Payload per GST Portal Specifications (from Supabase)
 */
export async function generateGSTR1Payload(userId, workspaceId = null, month = null, year = null) {
  let query = supabase.from('invoices').select('*');
  if (workspaceId) {
    query = query.eq('workspace_id', workspaceId);
  }

  const { data: invoices, error } = await query;
  if (error) throw new Error(`[gstFilingEngine.generateGSTR1] ${error.message}`);

  const invoiceList = invoices || [];
  const b2bInvoices = [];
  const b2cInvoices = [];
  let totalTaxableValue = 0;
  let totalIGST = 0;
  let totalCGST = 0;
  let totalSGST = 0;

  for (const inv of invoiceList) {
    const amount = Number(inv.total_amount) || 0;
    const cgstVal = Number(inv.cgst) || 0;
    const sgstVal = Number(inv.sgst) || 0;
    const igstVal = Number(inv.igst) || 0;
    const taxAmt = cgstVal + sgstVal + igstVal;
    const taxableVal = Number(inv.subtotal) || (amount - taxAmt);

    totalTaxableValue += taxableVal;
    totalCGST += cgstVal;
    totalSGST += sgstVal;
    totalIGST += igstVal;

    const invRecord = {
      inum: inv.invoice_number || `INV-${inv.id.substring(0, 8)}`,
      idt: inv.date || new Date().toISOString().split('T')[0],
      val: amount,
      pos: '27-Maharashtra',
      rchrg: 'N',
      inv_typ: 'R',
      itms: [
        {
          num: 1,
          itm_det: {
            txval: taxableVal,
            rt: 18,
            iamt: igstVal,
            camt: cgstVal,
            samt: sgstVal,
            csamt: 0
          }
        }
      ]
    };

    if (inv.customer_gstin) {
      b2bInvoices.push({ ctin: inv.customer_gstin, inv: [invRecord] });
    } else {
      b2cInvoices.push(invRecord);
    }
  }

  const now = new Date();
  const filingPeriod = `${String(month || now.getMonth() + 1).padStart(2, '0')}${year || now.getFullYear()}`;

  return {
    gstin: '27ABCDE1234F1Z5',
    fp: filingPeriod,
    version: 'GST_OFFLINE_TOOL_v1.0',
    hash: crypto.createHash('sha256').update(JSON.stringify({ b2bInvoices, b2cInvoices })).digest('hex'),
    summary: {
      totalTaxableValue,
      totalCGST,
      totalSGST,
      totalIGST,
      totalTaxAmount: totalCGST + totalSGST + totalIGST,
      totalInvoices: invoiceList.length,
      b2bCount: b2bInvoices.length,
      b2cCount: b2cInvoices.length,
    },
    b2b: b2bInvoices,
    b2cs: b2cInvoices,
  };
}

/**
 * Generate GSTR-3B Summary Payload (from Supabase)
 */
export async function generateGSTR3BPayload(userId, workspaceId = null, month = null, year = null) {
  const gstr1 = await generateGSTR1Payload(userId, workspaceId, month, year);

  // Get Inward Supplies (Expense transactions in Supabase)
  let txQuery = supabase
    .from('transactions')
    .select('*')
    .eq('type', 'expense');

  if (workspaceId) {
    txQuery = txQuery.eq('workspace_id', workspaceId);
  }

  const { data: expenseTxns } = await txQuery;
  const expenses = expenseTxns || [];

  let itcEligibleCGST = 0;
  let itcEligibleSGST = 0;
  let itcEligibleIGST = 0;

  for (const t of expenses) {
    const amt = Number(t.amount) || 0;
    const taxAmt = Number(t.tax_amount) || Math.round(amt * 0.18);
    itcEligibleCGST += Math.round(taxAmt / 2);
    itcEligibleSGST += Math.round(taxAmt / 2);
  }

  const outwardCGST = gstr1.summary.totalCGST;
  const outwardSGST = gstr1.summary.totalSGST;
  const netPayableCGST = Math.max(0, outwardCGST - itcEligibleCGST);
  const netPayableSGST = Math.max(0, outwardSGST - itcEligibleSGST);

  return {
    gstin: '27ABCDE1234F1Z5',
    ret_period: gstr1.fp,
    sup_details: {
      osup_det: {
        txval: gstr1.summary.totalTaxableValue,
        iamt: gstr1.summary.totalIGST,
        camt: outwardCGST,
        samt: outwardSGST,
        csamt: 0,
      },
    },
    itc_elg: {
      itc_avl: [
        {
          ty: 'All Other ITC',
          iamt: itcEligibleIGST,
          camt: itcEligibleCGST,
          samt: itcEligibleSGST,
          csamt: 0,
        },
      ],
    },
    tax_pmt: {
      tx_py: [
        {
          trans_typ: 'Tax Payable',
          camt: netPayableCGST,
          samt: netPayableSGST,
        },
      ],
    },
    status: 'READY_TO_FILE',
    generatedAt: new Date().toISOString(),
  };
}
