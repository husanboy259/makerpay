export default () => ({
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3001', 10),
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Database
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '5432', 10),
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME || 'makerpay',
  DB_SSL: process.env.DB_SSL || 'false',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',

  // Encryption key for provider credentials
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,

  // Platform
  PLATFORM_FEE_PERCENT: parseFloat(process.env.PLATFORM_FEE_PERCENT || '1.5'),
  WEBHOOK_MAX_RETRIES: parseInt(process.env.WEBHOOK_MAX_RETRIES || '5', 10),
  WEBHOOK_RETRY_INTERVALS: [60, 300, 900, 3600, 86400], // seconds

  // Providers base URLs
  TSPAY_BASE_URL: process.env.TSPAY_BASE_URL || 'https://api.tspay.uz',
  PAYNEST_BASE_URL: process.env.PAYNEST_BASE_URL || 'https://api.paynest.uz',
  TULOVPAY_BASE_URL: process.env.TULOVPAY_BASE_URL || 'https://api.tulovpay.uz',
});
