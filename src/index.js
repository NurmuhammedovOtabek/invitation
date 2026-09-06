const config = require('./config');
const db = require('./db');
const { createApp } = require('./server/app');
const { initBot } = require('./bot');

async function bootstrap() {
  console.log('🚀 Online Taklifnomalar Tizimi ishga tushirilmoqda...');

  // 1. Initialize SQLite Database
  try {
    await db.initDB();
  } catch (err) {
    console.error('❌ Ma\'lumotlar bazasini ishga tushirishda xatolik:', err);
    process.exit(1);
  }

  // 2. Start Express Web Server
  const app = createApp();
  const server = app.listen(config.PORT, () => {
    console.log(`🌐 Veb-server faol: ${config.BASE_URL} (Port: ${config.PORT})`);
    console.log(`✨ Shablonlar ko'rish sahifasi: ${config.BASE_URL}/`);
  });

  // 3. Start Telegram Bot
  const bot = initBot();
  if (bot) {
    bot.startPolling();
    console.log('🤖 Telegram Bot muvaffaqiyatli ishga tushdi va xabarlarni tinglamoqda: @web_taklifnoma_bot');

    // Graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
  } else {
    console.log('💡 Eslatma: Telegram botni ishga tushirish uchun .env faylida BOT_TOKEN ni belgilang.');
  }
}

bootstrap().catch(console.error);
