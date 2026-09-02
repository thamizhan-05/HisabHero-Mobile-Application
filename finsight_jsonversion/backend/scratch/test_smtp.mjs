import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = Number(process.env.SMTP_PORT) || 465;
const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;
const smtpUser = (process.env.SMTP_USER || process.env.GMAIL_USER || '').trim();
const smtpPass = (process.env.SMTP_PASS || process.env.GMAIL_PASS || '').replace(/\s+/g, '');

console.log('Testing SMTP Configuration:');
console.log('Host:', smtpHost);
console.log('Port:', smtpPort);
console.log('Secure:', smtpSecure);
console.log('User:', smtpUser);
console.log('Pass Length:', smtpPass.length);

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  auth: {
    user: smtpUser,
    pass: smtpPass
  },
  tls: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP Connection verified successfully!');

    console.log('Sending test email to', smtpUser, '...');
    const info = await transporter.sendMail({
      from: `"HisabHero" <${smtpUser}>`,
      to: smtpUser,
      subject: '✅ HisabHero SMTP Delivery Test',
      text: 'This is a test email confirming that SMTP is working properly in HisabHero.',
      html: `
        <div style="font-family: sans-serif; padding: 20px; background: #0f172a; color: #fff; border-radius: 12px;">
          <h2 style="color: #38bdf8;">✅ HisabHero SMTP Delivery Test</h2>
          <p>This email confirms that SMTP email delivery is fully active and verified.</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
        </div>
      `
    });

    console.log('✅ Test email delivered successfully! Message ID:', info.messageId);
  } catch (err) {
    console.error('❌ SMTP Error:', err);
  }
}

testConnection();
