const path = require('path');
const dotenv = require('dotenv');

// Load .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

module.exports = {
  // Telegram Bot
  BOT_TOKEN: process.env.BOT_TOKEN || '',
  ADMIN_TELEGRAM_ID: process.env.ADMIN_TELEGRAM_ID ? parseInt(process.env.ADMIN_TELEGRAM_ID, 10) : 6342396680,
  ADMIN_USERNAME: (process.env.ADMIN_USERNAME || 'admin').replace(/^@/, ''),

  // Payment Defaults (Will be overridden dynamically by system_settings in DB)
  CARD_NUMBER: process.env.CARD_NUMBER || '8600 0000 0000 0000',
  CARD_HOLDER: process.env.CARD_HOLDER || 'ADMINISTRATOR',
  INVITATION_PRICE_UZS: parseInt(process.env.INVITATION_PRICE_UZS || '50000', 10),

  // Web & Server
  PORT: parseInt(process.env.PORT || '3000', 10),
  BASE_URL: (process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, ''),
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'taklifnoma_jwt_secret_key_2026_super_secure',

  // Directories
  UPLOAD_DIR: path.resolve(__dirname, '../public/uploads'),
  DATA_DIR: path.resolve(__dirname, '../data'),
};
