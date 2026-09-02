import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromWhatsApp = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

let twilioClient = null;

if (accountSid && authToken && !accountSid.includes('YOUR-')) {
  try {
    twilioClient = twilio(accountSid, authToken);
    console.log('✅ Twilio WhatsApp Business Client initialized.');
  } catch (err) {
    console.warn('⚠️ Twilio initialization error:', err.message);
  }
} else {
  console.warn('⚠️ Twilio credentials missing or placeholder.');
}

/**
 * Format any Indian or International phone number to Twilio WhatsApp E.164 format
 */
export function formatWhatsAppRecipient(phoneNumber) {
  if (!phoneNumber) return null;
  let clean = String(phoneNumber).replace(/[^0-9+]/g, '');

  if (!clean.startsWith('+')) {
    // Default to Indian country code (+91) if 10 digits
    if (clean.length === 10) {
      clean = `+91${clean}`;
    } else if (clean.startsWith('91') && clean.length === 12) {
      clean = `+${clean}`;
    } else {
      clean = `+${clean}`;
    }
  }

  return clean.startsWith('whatsapp:') ? clean : `whatsapp:${clean}`;
}

/**
 * Send raw WhatsApp text or media message
 */
export async function sendWhatsAppMessage({ to, body, mediaUrl = null }) {
  const recipient = formatWhatsAppRecipient(to);
  if (!recipient) {
    throw new Error('Valid recipient phone number is required.');
  }

  if (!twilioClient) {
    console.warn('[WhatsApp Mock] Twilio not configured. Message simulated:', { to: recipient, body });
    return {
      success: true,
      simulated: true,
      messageId: `mock_${Date.now()}`,
      to: recipient,
      body,
    };
  }

  const payload = {
    from: fromWhatsApp,
    to: recipient,
    body,
  };

  if (mediaUrl) {
    payload.mediaUrl = [mediaUrl];
  }

  try {
    const msg = await twilioClient.messages.create(payload);
    console.log(`📲 WhatsApp message sent to ${recipient} (SID: ${msg.sid}, Status: ${msg.status})`);
    return {
      success: true,
      sid: msg.sid,
      status: msg.status,
      to: recipient,
    };
  } catch (err) {
    console.error(`❌ Twilio WhatsApp Error to ${recipient}:`, err.message);
    throw err;
  }
}

/**
 * Send Real GST Invoice WhatsApp Notification
 */
export async function sendInvoiceWhatsAppNotification({
  to,
  customerName = 'Valued Customer',
  invoiceNumber = 'INV-001',
  totalAmount = 0,
  dueDate = 'Immediate',
  upiLink = '',
  businessName = 'HisabHero Merchant',
}) {
  const formattedAmount = `₹${Number(totalAmount).toLocaleString('en-IN')}`;
  
  const body = `*Invoice #${invoiceNumber} from ${businessName}* 🧾

Namaste ${customerName} 🙏,

Thank you for your business! Here are the details of your invoice:

• *Invoice Number:* ${invoiceNumber}
• *Total Amount:* ${formattedAmount}
• *Due Date:* ${dueDate}

${upiLink ? `*Pay Instantly via UPI:* ⚡\n${upiLink}\n_(Supports GPay, PhonePe, Paytm & BHIM)_\n\n` : ''}For any queries regarding this invoice, feel free to reply to this message.

Thank you,
*${businessName}*`;

  return sendWhatsAppMessage({ to, body });
}

/**
 * Send Real Khata Outstanding Balance Reminder
 */
export async function sendKhataReminderWhatsAppNotification({
  to,
  customerName = 'Valued Customer',
  netBalance = 0,
  businessName = 'HisabHero Merchant',
  upiLink = '',
}) {
  const formattedAmount = `₹${Math.abs(Number(netBalance)).toLocaleString('en-IN')}`;
  
  const body = `*Payment Reminder from ${businessName}* 🔔

Namaste ${customerName} 🙏,

This is a gentle reminder regarding your outstanding Khata ledger balance of *${formattedAmount}*.

${upiLink ? `*Settle Balance via UPI:* ⚡\n${upiLink}\n_(Pay instantly using GPay, PhonePe, Paytm)_\n\n` : ''}Thank you for your prompt payment!

Warm regards,
*${businessName}*`;

  return sendWhatsAppMessage({ to, body });
}

/**
 * Send WhatsApp OTP verification code
 */
export async function sendOtpWhatsApp({ to, otpCode, purpose = 'Account Verification' }) {
  const body = `*HisabHero Security Code* 🔐

Your verification code for *${purpose}* is:
*${otpCode}*

Valid for 10 minutes. Please do not share this code with anyone.

_HisabHero Financial Intelligence_`;

  return sendWhatsAppMessage({ to, body });
}
