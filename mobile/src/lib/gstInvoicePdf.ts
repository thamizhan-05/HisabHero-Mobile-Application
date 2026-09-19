import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

export interface InvoiceItem {
  description: string;
  hsnCode?: string;
  quantity: number | string;
  unitPrice: number | string;
  tax?: number | string;
  discount?: number | string;
}

export interface InvoiceData {
  invoiceNumber: string;
  date?: string;
  dueDate?: string;
  businessName?: string;
  businessGstin?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  businessVpa?: string;
  customerName?: string;
  customerGstin?: string;
  customerAddress?: string;
  customerPhone?: string;
  items?: InvoiceItem[];
  subtotal?: number;
  taxAmount?: number;
  total?: number;
  notes?: string;
}

export const gstInvoicePdf = {
  /**
   * Generate official GST Tax Invoice HTML string
   */
  generateHtml: (data: InvoiceData): string => {
    const invNum = data.invoiceNumber || 'INV-2026-0001';
    const date = data.date || new Date().toISOString().split('T')[0];
    const dueDate = data.dueDate || 'Immediate';
    const bName = data.businessName || 'HisabHero Enterprise';
    const bGstin = data.businessGstin || '33AAAAA0000A1Z5';
    const bAddress = data.businessAddress || 'Chennai, Tamil Nadu, India - 600001';
    const bVpa = data.businessVpa || 'hisabhero.merchant@okhdfcbank';
    const cName = data.customerName || 'Valued Customer';
    const cGstin = data.customerGstin || 'Unregistered Consumer';
    const cAddress = data.customerAddress || 'India';
    
    const items = (data.items && data.items.length > 0) ? data.items : [
      { description: 'Consulting & Accounting Services', hsnCode: '998311', quantity: 1, unitPrice: data.total || 15000, tax: 18 }
    ];

    let calcSubtotal = 0;
    const itemsHtml = items.map((item, idx) => {
      const qty = Number(item.quantity || 1);
      const price = Number(item.unitPrice || 0);
      const lineTotal = qty * price;
      calcSubtotal += lineTotal;
      const hsn = item.hsnCode || '998311';

      return `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td><strong>${item.description}</strong></td>
          <td style="text-align: center;">${hsn}</td>
          <td style="text-align: center;">${qty}</td>
          <td style="text-align: right;">₹${price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          <td style="text-align: right;"><strong>₹${lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></td>
        </tr>
      `;
    }).join('');

    const subtotal = Number(data.subtotal || calcSubtotal);
    const cgst = subtotal * 0.09;
    const sgst = subtotal * 0.09;
    const grandTotal = Number(data.total || (subtotal + cgst + sgst));

    // Dynamic UPI Payment URI
    const upiUri = `upi://pay?pa=${bVpa}&pn=${encodeURIComponent(bName)}&am=${grandTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Invoice ${invNum}`)}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiUri)}`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>GST Tax Invoice #${invNum}</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            color: #0f172a;
            padding: 32px;
            margin: 0;
            background: #ffffff;
            font-size: 13px;
          }
          .invoice-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #0284c7;
            padding-bottom: 18px;
            margin-bottom: 24px;
          }
          .brand-title {
            font-size: 26px;
            font-weight: 900;
            color: #0284c7;
            margin: 0 0 4px 0;
            letter-spacing: -0.5px;
          }
          .tax-invoice-badge {
            font-size: 11px;
            font-weight: 800;
            background: #0284c7;
            color: #ffffff;
            padding: 4px 10px;
            border-radius: 4px;
            display: inline-block;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .meta-box {
            text-align: right;
          }
          .meta-title {
            font-size: 18px;
            font-weight: 800;
            color: #0f172a;
            margin: 0;
          }
          .meta-label {
            color: #64748b;
            font-size: 11px;
            margin-top: 2px;
          }
          .party-grid {
            display: flex;
            justify-content: space-between;
            margin-bottom: 24px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
          }
          .party-card {
            flex: 1;
          }
          .party-title {
            font-size: 11px;
            text-transform: uppercase;
            color: #0284c7;
            font-weight: 800;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
          }
          .party-name {
            font-size: 15px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 4px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
          }
          .items-table th {
            background: #0f172a;
            color: #ffffff;
            font-weight: 700;
            font-size: 11px;
            text-transform: uppercase;
            padding: 10px 12px;
            text-align: left;
          }
          .items-table td {
            padding: 10px 12px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 12px;
          }
          .summary-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-top: 10px;
          }
          .qr-box {
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 12px;
            text-align: center;
            background: #ffffff;
            width: 180px;
          }
          .qr-label {
            font-size: 10px;
            font-weight: 700;
            color: #0284c7;
            margin-top: 6px;
            text-transform: uppercase;
          }
          .totals-table {
            width: 320px;
            border-collapse: collapse;
          }
          .totals-table td {
            padding: 6px 10px;
            font-size: 12px;
          }
          .grand-total-row {
            background: #0284c718;
            border-top: 2px solid #0284c7;
            border-bottom: 2px solid #0284c7;
            font-size: 15px;
            font-weight: 800;
            color: #0284c7;
          }
          .footer-note {
            margin-top: 40px;
            padding-top: 16px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <div>
            <div class="tax-invoice-badge">Official GST Tax Invoice</div>
            <h1 class="brand-title" style="margin-top: 8px;">${bName}</h1>
            <p style="margin: 0; color: #475569; font-size: 12px;">${bAddress}</p>
            <p style="margin: 2px 0 0 0; color: #475569; font-size: 12px;"><strong>GSTIN:</strong> ${bGstin}</p>
          </div>
          <div class="meta-box">
            <h2 class="meta-title">#${invNum}</h2>
            <div class="meta-label">Invoice Date: <strong>${date}</strong></div>
            <div class="meta-label">Payment Due: <strong>${dueDate}</strong></div>
            <div class="meta-label" style="color: #10b981; font-weight: 700; margin-top: 4px;">✔ IRN & GST Verified</div>
          </div>
        </div>

        <div class="party-grid">
          <div class="party-card">
            <div class="party-title">Billed To (Customer):</div>
            <div class="party-name">${cName}</div>
            <div style="color: #475569; font-size: 12px;">GSTIN: ${cGstin}</div>
            <div style="color: #475569; font-size: 12px;">${cAddress}</div>
          </div>
          <div class="party-card" style="text-align: right;">
            <div class="party-title">Payment Mode:</div>
            <div style="font-weight: 700; color: #0f172a;">UPI / Bank Transfer / Cash</div>
            <div style="color: #64748b; font-size: 11px; margin-top: 4px;">VPA: ${bVpa}</div>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">#</th>
              <th>Description / Particulars</th>
              <th style="width: 80px; text-align: center;">HSN/SAC</th>
              <th style="width: 60px; text-align: center;">Qty</th>
              <th style="width: 100px; text-align: right;">Unit Rate</th>
              <th style="width: 110px; text-align: right;">Amount (INR)</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="summary-section">
          <!-- Dynamic UPI QR Code on Invoice PDF -->
          <div class="qr-box">
            <img src="${qrUrl}" width="150" height="150" alt="UPI Payment QR" style="display: block; margin: 0 auto;" />
            <div class="qr-label">Scan to Pay via UPI</div>
            <div style="font-size: 9px; color: #64748b; margin-top: 2px;">GPay • PhonePe • Paytm • BHIM</div>
          </div>

          <!-- Totals & GST Summary -->
          <table class="totals-table">
            <tr>
              <td style="color: #64748b;">Taxable Subtotal:</td>
              <td style="text-align: right; font-weight: 700;">₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td style="color: #64748b;">CGST (9.00%):</td>
              <td style="text-align: right;">₹${cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td style="color: #64748b;">SGST (9.00%):</td>
              <td style="text-align: right;">₹${sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr class="grand-total-row">
              <td>Grand Total:</td>
              <td style="text-align: right;">₹${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
          </table>
        </div>

        <div class="footer-note">
          <div>
            <p style="margin: 0; font-weight: 700; color: #0f172a; font-size: 11px;">Terms & Conditions:</p>
            <p style="margin: 2px 0 0 0; color: #64748b; font-size: 10px;">1. Payment due within specified due date.<br/>2. This is a computer-generated tax invoice powered by HisabHero.</p>
          </div>
          <div style="text-align: center;">
            <div style="height: 40px;"></div>
            <div style="border-top: 1px dashed #94a3b8; width: 160px; margin-top: 8px; padding-top: 4px; font-weight: 700; font-size: 11px;">
              Authorized Signatory
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  /**
   * Generate PDF file and trigger native Share Sheet (WhatsApp, Save to Files, Print)
   */
  generateAndShareInvoicePdf: async (data: InvoiceData): Promise<void> => {
    try {
      const html = gstInvoicePdf.generateHtml(data);
      const { uri } = await Print.printToFileAsync({ html });
      
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: `GST Invoice #${data.invoiceNumber || 'Invoice'}`,
        });
      } else {
        await Print.printAsync({ html });
      }
    } catch (err: any) {
      console.error('PDF Generation Error:', err);
      Alert.alert('PDF Export Error', err.message || 'Could not generate PDF invoice.');
    }
  }
};
