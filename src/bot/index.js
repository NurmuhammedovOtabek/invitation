const { Telegraf, Markup } = require('telegraf');
const config = require('../config');
const startHandler = require('./handlers/start');
const createHandler = require('./handlers/create');
const myInvitesHandler = require('./handlers/myInvites');
const templatesHandler = require('./handlers/templates');
const adminHandler = require('./handlers/admin');

function initBot() {
  if (!config.BOT_TOKEN) {
    console.warn('⚠️ BOT_TOKEN topilmadi! Telegram bot ishga tushirilmadi. Iltimos .env faylini to\'ldiring.');
    return null;
  }

  const bot = new Telegraf(config.BOT_TOKEN);
  module.exports.botInstance = bot;

  // Commands
  bot.command('start', startHandler.handleStart);
  bot.command('help', startHandler.handleHelp);
  bot.command('my', myInvitesHandler.handleMyInvitations);
  bot.command('templates', templatesHandler.handleTemplatesShowcase);
  bot.command('admin', adminHandler.handleAdminStats);
  bot.command('set_card', adminHandler.handleSetCard);
  bot.command('set_price', adminHandler.handleSetPrice);
  bot.command('builder', (ctx) => {
    return ctx.replyWithHTML(`
🎨 <b>Jonli Visual Konstruktor</b>

Har bir Lego bo'lagini vizual tanlash uchun havolani bosing:
🔗 <a href="${config.BASE_URL}/builder">${config.BASE_URL}/builder</a>
    `, Markup.inlineKeyboard([
      [Markup.button.url('✨ Konstruktorni ochish', `${config.BASE_URL}/builder`)]
    ]));
  });

  // 3 TA ASOSIY TANLOV (Reply Menu)
  bot.hears('🎁 1. Tayyor Legolar', createHandler.startReadyTemplatesFlow);
  bot.hears('🧩 2. O\'z Legongizni Tering', createHandler.startCustomLegoFlow);
  bot.hears('💎 3. Maxsus Buyurtma (Admin)', startHandler.handleCustomOrder);

  // Qo'shimcha menyular
  bot.hears('📂 Mening taklifnomalarim', myInvitesHandler.handleMyInvitations);
  bot.hears('🎨 Visual Konstruktor (Web)', (ctx) => {
    return ctx.replyWithHTML(`
🎨 <b>Jonli Visual Konstruktor</b>

Telefon maketida barcha Lego bo'laklarini sinab ko'ring:
🔗 <a href="${config.BASE_URL}/builder">${config.BASE_URL}/builder</a>
    `, Markup.inlineKeyboard([
      [Markup.button.url('✨ Konstruktorni ochish', `${config.BASE_URL}/builder`)]
    ]));
  });
  bot.hears('ℹ️ Narxlar va Yordam', startHandler.handleHelp);

  // 1. Opening Style Callbacks
  bot.action(/^open_(.+)$/, (ctx) => {
    const opening = ctx.match[1];
    return createHandler.handleOpeningStyleSelect(ctx, opening);
  });

  // 2. Theme Color Callbacks
  bot.action(/^theme_(.+)$/, (ctx) => {
    const theme = ctx.match[1];
    return createHandler.handleThemeSelect(ctx, theme);
  });

  // 3. Font Callbacks
  bot.action(/^font_(.+)$/, (ctx) => {
    const font = ctx.match[1];
    return createHandler.handleFontSelect(ctx, font);
  });

  // 4. Particle Callbacks
  bot.action(/^part_(.+)$/, (ctx) => {
    const part = ctx.match[1];
    return createHandler.handleParticleSelect(ctx, part);
  });

  // 5. Event Type Callbacks
  bot.action('evt_wedding', (ctx) => createHandler.handleEventTypeSelect(ctx, 'Nikoh / Visol To\'yi'));
  bot.action('evt_party', (ctx) => createHandler.handleEventTypeSelect(ctx, 'Nikoh Oqshomi'));
  bot.action('evt_sunnat', (ctx) => createHandler.handleEventTypeSelect(ctx, 'Sunnat To\'yi'));
  bot.action('evt_birthday', (ctx) => createHandler.handleEventTypeSelect(ctx, 'Tug\'ilgan Kun / Yubiley'));

  // Skip Callbacks
  bot.action(/^skip_(.+)$/, (ctx) => {
    const step = ctx.match[1];
    return createHandler.handleSkip(ctx, step);
  });

  // Music Selection Callbacks
  bot.action(/^music_(\d+)$/, (ctx) => {
    return createHandler.handleMusicSelect(ctx, `music_${ctx.match[1]}`);
  });
  bot.action('music_custom', async (ctx) => {
    await ctx.answerCbQuery();
    return ctx.reply('Iltimos, o\'z audio faylingizni (MP3 yoki Voice) yuboring:');
  });

  // Admin Approval Callbacks
  bot.action(/^adm_approve_(.+)$/, (ctx) => {
    return adminHandler.handleAdminApprove(ctx, ctx.match[1]);
  });
  bot.action(/^adm_reject_(.+)$/, (ctx) => {
    return adminHandler.handleAdminReject(ctx, ctx.match[1]);
  });

  // Cancel flow
  bot.action('cancel_flow', createHandler.handleCancelFlow);

  // Media & Input Listeners
  bot.on('text', createHandler.handleTextInput);
  bot.on('location', createHandler.handleLocationInput);
  bot.on('photo', createHandler.handlePhotoInput);
  bot.on(['audio', 'voice'], createHandler.handleAudioInput);

  return bot;
}

module.exports = {
  initBot,
};
