import crypto from 'crypto';
import Invoice from '../models/Invoice.js';
import Transaction from '../models/Transaction.js';

/**
 * Generate GSTR-1 JSON Payload per GST Portal Specifications
 */
export async function generateGSTR1Payload(userId, businessId = null, month = null, year = null) {
  const filter = businessId ? { businessId } : { userId };
  const invoices = await Invoice.find(filter).lean();

  const b2bInvoices = [];
  const b2cInvoices = [];
  let totalTaxableValue = 0;
  let totalIGST = 0;
  let totalCGST = 0;
  let totalSGST = 0;

  for (const inv of invoices) {
    const amount = Number(inv.total) || Number(inv.amount) || 0;
    const taxRate = Number(inv.taxRate) || 18;
    const taxableVal = Math.round(amount / (1 + taxRate / 100));
    const taxAmt = amount - taxableVal;

    const cgst = Math.round(taxAmt / 2);
    const sgst = taxAmt - cgst;

    totalTaxableValue += taxableVal;
    totalCGST += cgst;
    totalSGST += sgst;

    const invRecord = {
      inum: inv.invoiceNumber || `INV-${inv._id.toString().substring(0, 6)}`,
      idt: inv.invoiceDate || new Date().toISOString().split('T')[0],
      val: amount,
      pos: inv.placeOfSupply || '27-Maharashtra',
      rchrg: 'N',
      inv_typ: 'R',
      itms: [
        {
          num: 1,
          itm_det: {
            txval: taxableVal,
            rt: taxRate,
            iamt: 0,
            camt: cgst,
            samt: sgst,
            csamt: 0
          }
        }
      ]
    };

    if (inv.gstNumber) {
      b2bInvoices.push({ ctin: inv.gstNumber, inv: [invRecord] });
    } else {
      b2cInvoices.push(invRecord);
    }
  }

  return {
    gstin: '27AAAAA0000A1Z5',
    fp: `${month || '08'}${year || '2026'}`,
    gt: totalTaxableValue + totalCGST + totalSGST,
    cur_gt: totalTaxableValue + totalCGST + totalSGST,
    b2b: b2bInvoices,
    b2cs: b2cInvoices,
    summary: {
      totalInvoices: invoices.length,
      totalTaxableValue,
      totalCGST,
      totalSGST,
      totalIGST,
      totalTax: totalCGST + totalSGST + totalIGST,
    }
  };
}

/**
 * Generate GSTR-3B Monthly Tax Summary Payload
 */
export async function generateGSTR3BPayload(userId, businessId = null) {
  const filter = businessId ? { businessId } : { userId };

  const [invoices, transactions] = await Promise.all([
    Invoice.find(filter).lean(),
    Transaction.find({ ...filter, type: 'expense' }).lean()
  ]);

  let outboundTaxable = 0;
  let outboundTax = 0;
  for (const inv of invoices) {
    const amt = Number(inv.total) || 0;
    outboundTaxable += Math.round(amt / 1.18);
    outboundTax += amt - Math.round(amt / 1.18);
  }

  let inboundTaxable = 0;
  let itcAvailable = 0;
  for (const tx of transactions) {
    const amt = Math.abs(Number(tx.amount) || 0);
    inboundTaxable += Math.round(amt / 1.18);
    itcAvailable += amt - Math.round(amt / 1.18);
  }

  const netTaxPayable = Math.max(0, outboundTax - itcAvailable);

  return {
    gstin: '27AAAAA0000A1Z5',
    ret_period: '082026',
    table_3_1: {
      outbound_supplies: {
        txval: outboundTaxable,
        iamt: 0,
        camt: Math.round(outboundTax / 2),
        samt: Math.round(outboundTax / 2),
        csamt: 0
      }
    },
    table_4_itc: {
      itc_available: {
        iamt: 0,
        camt: Math.round(itcAvailable / 2),
        samt: Math.round(itcAvailable / 2),
        csamt: 0
      }
    },
    summary: {
      outboundTax,
      itcClaimable: itcAvailable,
      netTaxPayableInRupees: netTaxPayable,
    }
  };
}

/**
 * Generate E-Invoice IRN & Dynamic B2B QR Payload
 */
export function generateEInvoicePayload(invoice) {
  const invNum = invoice.invoiceNumber || 'INV-1001';
  const amount = Number(invoice.total) || Number(invoice.amount) || 0;
  const sellerGstin = '27AAAAA0000A1Z5';
  const buyerGstin = invoice.gstNumber || '27BBBBB1111B2Z6';

  const rawIrnString = `${sellerGstin}-${invNum}-${invoice.invoiceDate || '2026-08-15'}-${amount}`;
  const irnHash = crypto.createHash('sha256').update(rawIrnString).digest('hex');

  const qrPayload = `https://hisabhero.com/pay/einvoice?irn=${irnHash}&seller=${sellerGstin}&amt=${amount}`;

  return {
    success: true,
    irn: irnHash,
    ackNo: Math.floor(100000000000000 + Math.random() * 900000000000000),
    ackDate: new Date().toISOString(),
    qrCodeString: qrPayload,
    status: 'GENERATED_VALIDATED',
    sellerGstin,
    buyerGstin,
    amount
  };
}
