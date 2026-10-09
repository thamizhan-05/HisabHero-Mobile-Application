import 'dotenv/config';

/**
 * Validated Environment Configuration
 * Centralizes all environment variables with fail-safes and warnings.
 */
export const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'hisabhero_jwt_super_secret_key_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30d',
  
  // Security & Rate Limiting
  corsOrigin: process.env.CORS_ORIGIN || '*',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 mins
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  authRateLimitMaxRequests: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS, 10) || 15,
  demoOtpEnabled: process.env.ALLOW_DEMO_OTP === 'true' || process.env.NODE_ENV === 'test',

  // Database
  supabaseUrl: process.env.SUPABASE_URL || 'https://lsrcyhoxxbndzhntlvay.supabase.co',
  supabaseKey: process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  mongoUri: process.env.MONGO_URI || '',

  // AI & External APIs
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.startsWith('AIzaSy')),

  // Communication
  email: {
    smtpHost: process.env.SMTP_HOST || '',
    smtpPort: parseInt(process.env.SMTP_PORT, 10) || 587,
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    resendApiKey: process.env.RESEND_API_KEY || ''
  },
  whatsapp: {
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
    twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || ''
  }
};

// Security warning in production
if (config.nodeEnv === 'production' && config.jwtSecret === 'hisabhero_jwt_super_secret_key_2026') {
  console.warn('⚠️ [SECURITY WARNING] Default JWT_SECRET is active in production! Set a custom JWT_SECRET.');
}
