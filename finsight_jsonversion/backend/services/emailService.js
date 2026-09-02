import nodemailer from 'nodemailer';

// SMTP Configuration with full fallback support
function getSmtpConfig() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const rawPort = Number(process.env.SMTP_PORT);
  const port = rawPort || (host.includes('gmail') ? 465 : 587);
  const secure = process.env.SMTP_SECURE !== undefined
    ? process.env.SMTP_SECURE === 'true'
    : port === 465;
  const user = (process.env.SMTP_USER || process.env.GMAIL_USER || '').trim();
  const pass = (process.env.SMTP_PASS || process.env.GMAIL_PASS || '').replace(/\s+/g, '');
  const from = process.env.SMTP_FROM || process.env.EMAIL_FROM || (user ? `"HisabHero" <${user}>` : '"HisabHero" <no-reply@hisabhero.com>');

  return { host, port, secure, user, pass, from };
}

let transporterInstance = null;

export function getSmtpTransporter() {
  const config = getSmtpConfig();
  if (!config.user || !config.pass) {
    return null;
  }

  if (!transporterInstance) {
    transporterInstance = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      pool: true,
      maxConnections: 5,
      maxMessages: 100
    });
  }

  return { transporter: transporterInstance, config };
}

/**
 * Verify SMTP connection on startup
 */
export async function verifySmtpConnection() {
  const smtp = getSmtpTransporter();
  if (!smtp) {
    console.log('⚠️ [SMTP Service] No SMTP credentials found. Emails will be logged to console.');
    return false;
  }

  try {
    await smtp.transporter.verify();
    console.log(`✅ [SMTP Service] Connected to SMTP server (${smtp.config.host}:${smtp.config.port}) as ${smtp.config.user}`);
    return true;
  } catch (err) {
    console.error(`❌ [SMTP Service Error] Connection failed (${smtp.config.host}):`, err.message);
    return false;
  }
}

/**
 * Send 6-digit OTP Verification Email
 */
export async function sendOtpEmail(email, code, fullName = 'User') {
  const smtp = getSmtpTransporter();
  const subject = 'HisabHero – Verify Your Email';
  const cleanEmail = email.toLowerCase().trim();

  const textBody = `Hello ${fullName},

Welcome to HisabHero.

Your email verification code is:

${code}

This code expires in 5 minutes.
Do not share this code with anyone.

If you did not create a HisabHero account, please ignore this email.

Regards,
HisabHero Team`;

  const htmlBody = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; background: #0f172a; color: #f8fafc; border-radius: 16px; border: 1px solid #1e293b;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #38bdf8; font-size: 24px; margin: 0; font-weight: 800; letter-spacing: 1px;">HISABHERO</h1>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 4px;">Smart Financial & ERP Intelligence</p>
      </div>

      <div style="background: #1e293b; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <h2 style="color: #ffffff; margin-top: 0; font-size: 18px;">Verify Your Email Address</h2>
        <p style="font-size: 14px; color: #cbd5e1; margin-bottom: 8px;">Hello <strong>${fullName}</strong>,</p>
        <p style="font-size: 14px; color: #cbd5e1; margin-bottom: 16px;">Welcome! Please enter the 6-digit verification code below to activate your account:</p>
        
        <div style="background: #0f172a; padding: 18px; text-align: center; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; border-radius: 10px; margin: 16px 0; border: 1px solid #334155;">
          ${code}
        </div>

        <p style="color: #94a3b8; font-size: 13px; margin: 8px 0 4px 0;">⏳ This code expires in <strong>5 minutes</strong>.</p>
        <p style="color: #ef4444; font-size: 12px; margin: 0;">🔒 Never share this code with anyone.</p>
      </div>

      <p style="color: #64748b; font-size: 12px; margin-bottom: 16px;">If you did not request this verification, you can safely disregard this email.</p>
      <hr style="border: 0; border-top: 1px solid #1e293b; margin: 20px 0;" />
      <p style="color: #64748b; font-size: 12px; margin: 0; text-align: center;">© ${new Date().getFullYear()} HisabHero Inc. All rights reserved.</p>
    </div>
  `;

  if (smtp) {
    try {
      const info = await smtp.transporter.sendMail({
        from: smtp.config.from,
        to: cleanEmail,
        subject,
        text: textBody,
        html: htmlBody
      });
      console.log(`✅ [SMTP] Verification OTP email sent to ${cleanEmail} (ID: ${info.messageId})`);
      return true;
    } catch (err) {
      console.error(`⚠️ [SMTP Send Error] Failed to send OTP to ${cleanEmail}:`, err.message);
    }
  }

  console.log(`🔑 [Console Fallback] OTP Code for ${cleanEmail}: ${code}`);
  return false;
}

/**
 * Send Password Reset Code Email
 */
export async function sendResetPasswordEmail(email, code) {
  const smtp = getSmtpTransporter();
  const cleanEmail = email.toLowerCase().trim();
  const subject = 'HisabHero – Password Reset Code';

  const textBody = `Hello,

We received a request to reset your HisabHero password.

Your 6-digit password reset code is:

${code}

This code expires in 10 minutes.
If you did not request a password reset, please secure your account immediately.

Regards,
HisabHero Support Team`;

  const htmlBody = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; background: #0f172a; color: #f8fafc; border-radius: 16px; border: 1px solid #1e293b;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #ff6b6b; font-size: 24px; margin: 0; font-weight: 800;">HISABHERO</h1>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 4px;">Account Security</p>
      </div>

      <div style="background: #1e293b; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <h2 style="color: #ff6b6b; margin-top: 0; font-size: 18px;">Password Reset Request</h2>
        <p style="font-size: 14px; color: #cbd5e1;">We received a request to reset your password. Use the verification code below to set a new password:</p>
        
        <div style="background: #0f172a; padding: 18px; text-align: center; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #ff6b6b; border-radius: 10px; margin: 16px 0; border: 1px solid #334155;">
          ${code}
        </div>

        <p style="color: #94a3b8; font-size: 13px; margin: 8px 0 4px 0;">⏳ This code is valid for <strong>10 minutes</strong>.</p>
        <p style="color: #ef4444; font-size: 12px; margin: 0;">If you did not request this, please ignore this email or change your password.</p>
      </div>

      <hr style="border: 0; border-top: 1px solid #1e293b; margin: 20px 0;" />
      <p style="color: #64748b; font-size: 12px; margin: 0; text-align: center;">© ${new Date().getFullYear()} HisabHero Inc. All rights reserved.</p>
    </div>
  `;

  if (smtp) {
    try {
      const info = await smtp.transporter.sendMail({
        from: smtp.config.from,
        to: cleanEmail,
        subject,
        text: textBody,
        html: htmlBody
      });
      console.log(`✅ [SMTP] Password reset code email sent to ${cleanEmail} (ID: ${info.messageId})`);
      return true;
    } catch (err) {
      console.error(`⚠️ [SMTP Reset Error] Failed to send to ${cleanEmail}:`, err.message);
    }
  }

  console.log(`🔑 [Console Fallback] Password Reset Code for ${cleanEmail}: ${code}`);
  return false;
}

/**
 * Send Team Workspace Member Invitation
 */
export async function sendWorkspaceInviteEmail(email, inviterName, workspaceName, joinCode, role = 'member') {
  const smtp = getSmtpTransporter();
  const cleanEmail = email.toLowerCase().trim();
  const subject = `Invitation to join ${workspaceName} on HisabHero`;

  const textBody = `Hello,

${inviterName} has invited you to join "${workspaceName}" as a ${role.toUpperCase()} on HisabHero.

Workspace Join Code: ${joinCode}

Open HisabHero, go to Settings -> Join Workspace, and enter the code above to accept.

Regards,
HisabHero Team`;

  const htmlBody = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; background: #0f172a; color: #f8fafc; border-radius: 16px; border: 1px solid #1e293b;">
      <h1 style="color: #10b981; font-size: 22px; margin: 0 0 16px 0;">Team Workspace Invitation</h1>
      <p style="font-size: 14px; color: #cbd5e1;"><strong>${inviterName}</strong> has invited you to join <strong>${workspaceName}</strong> as a <strong>${role.toUpperCase()}</strong> on HisabHero.</p>
      
      <div style="background: #1e293b; padding: 18px; border-radius: 10px; text-align: center; margin: 20px 0;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0 0 8px 0;">WORKSPACE JOIN CODE</p>
        <span style="font-size: 26px; font-weight: 800; letter-spacing: 4px; color: #10b981;">${joinCode}</span>
      </div>

      <p style="font-size: 13px; color: #94a3b8;">To accept, open HisabHero, navigate to <strong>Settings → Join a Workspace</strong>, and paste the code above.</p>
      <hr style="border: 0; border-top: 1px solid #1e293b; margin: 20px 0;" />
      <p style="color: #64748b; font-size: 12px; margin: 0;">Regards,<br/><strong>HisabHero Team</strong></p>
    </div>
  `;

  if (smtp) {
    try {
      const info = await smtp.transporter.sendMail({
        from: smtp.config.from,
        to: cleanEmail,
        subject,
        text: textBody,
        html: htmlBody
      });
      console.log(`✅ [SMTP] Workspace invitation sent to ${cleanEmail} (ID: ${info.messageId})`);
      return true;
    } catch (err) {
      console.error(`⚠️ [SMTP Invite Error] Failed to send invite to ${cleanEmail}:`, err.message);
    }
  }

  return false;
}

/**
 * Send Contact Support Notification Email
 */
export async function sendContactFormEmail({ name, email, subject, message }) {
  const smtp = getSmtpTransporter();
  const recipient = process.env.CONTACT_EMAIL || smtp?.config?.user || 'hisabhero27@gmail.com';
  const mailSubject = `[HisabHero Support] ${subject || 'New Contact Submission'}`;

  const htmlBody = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; background: #0f172a; color: #f8fafc; border-radius: 12px;">
      <h2 style="color: #38bdf8; margin-top: 0;">New Support Contact Request</h2>
      <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <div style="background: #1e293b; padding: 16px; border-radius: 8px; margin: 16px 0; color: #e2e8f0; white-space: pre-wrap;">
${message}
      </div>
      <p style="color: #64748b; font-size: 12px;">Submitted at: ${new Date().toISOString()}</p>
    </div>
  `;

  if (smtp) {
    try {
      const info = await smtp.transporter.sendMail({
        from: smtp.config.from,
        to: recipient,
        replyTo: email,
        subject: mailSubject,
        html: htmlBody
      });
      console.log(`✅ [SMTP] Contact form email delivered to ${recipient} (ID: ${info.messageId})`);
      return true;
    } catch (err) {
      console.error(`⚠️ [SMTP Contact Error] Failed to send contact email:`, err.message);
    }
  }

  return false;
}
