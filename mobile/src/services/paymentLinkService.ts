export type PaymentLinkRequest = {
  vpa?: string;            // UPI ID e.g. "hisabhero@upi"
  payeeName?: string;      // Business Name
  amount: number;
  invoiceNumber: string;
  currency?: string;
  note?: string;
};

export type PaymentLinkResult = {
  upiDeepLink: string;
  qrPayload: string;
  whatsappShareUrl: string;
  formattedMessage: string;
};

/**
 * 💳 Generate Dynamic UPI Payment Deep Links & WhatsApp Collection Messages
 */
export function generatePaymentLink(req: PaymentLinkRequest): PaymentLinkResult {
  const vpa = req.vpa || 'hisabhero@upi';
  const payeeName = req.payeeName || 'HisabHero Merchant';
  const amount = Number(req.amount) || 0;
  const currency = req.currency || 'INR';
  const invoiceNumber = req.invoiceNumber || 'INV-1001';
  const note = req.note || `Payment for Invoice ${invoiceNumber}`;

  // Encoded UPI URL Scheme: upi://pay?pa=hisabhero@upi&pn=Merchant&am=1500&cu=INR&tn=Invoice1001
  const encodedPn = encodeURIComponent(payeeName);
  const encodedTn = encodeURIComponent(note);
  const upiDeepLink = `upi://pay?pa=${vpa}&pn=${encodedPn}&am=${amount.toFixed(2)}&cu=${currency}&tn=${encodedTn}`;

  // Format WhatsApp Reminder Message
  const message = `Hello! 💳

Payment reminder for Invoice *${invoiceNumber}* from *${payeeName}*.

💰 *Amount Due*: ₹${amount.toLocaleString('en-IN')}
📝 *Note*: ${note}

Pay instantly via UPI (GPay, PhonePe, Paytm, BHIM):
${upiDeepLink}

Thank you for your business! Powered by HisabHero.`;

  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

  return {
    upiDeepLink,
    qrPayload: upiDeepLink,
    whatsappShareUrl,
    formattedMessage: message,
  };
}
