const { v4: uuidv4 } = require('uuid');
const db = require('../../db');
const keyboards = require('../keyboards');
const config = require('../../config');

async function getUserState(userId) {
  const row = await db.get(`SELECT state_data FROM users WHERE telegram_id = ?`, [userId]);
  if (!row || !row.state_data) return null;
  try { return JSON.parse(row.state_data); } catch (e) { return null; }
}

async function saveUserState(userId, stateData) {
  const json = stateData ? JSON.stringify(stateData) : null;
  await db.run(`UPDATE users SET state_data = ? WHERE telegram_id = ?`, [json, userId]);
}

// 1. FLOW A: Tayyor Legolar (Tayyor Shablonlar)
async function startReadyTemplatesFlow(ctx) {
  const userId = ctx.from.id;
  await saveUserState(userId, {
    mode: 'READY_TEMPLATE',
    step: 'SELECT_TEMPLATE',
    data: { invitationId: uuidv4() }
  });

  const msg = `
🎁 <b>Tayyor Legolar (Shablonlar)</b>

Biz oldindan eng chiroyli animatsiya va musiqalar bilan terib qo'ygan dizaynlardan birini tanlang:

👑 <b>1. Classic Luxury:</b> Oltin-yashil klassik dabdaba
🌸 <b>2. Modern Romantic:</b> Nafis pushti romantik dizayn
🌌 <b>3. Royal Night:</b> Shohona to'q moviy va oltin
🎉 <b>4. Sunnat To'yi:</b> Bolajonlar quvonchli bayrami
  `;

  return ctx.replyWithHTML(msg, keyboards.themeColorKeyboard());
}

// 2. FLOW B: O'z Legongizni Tering (Konstruktor)
async function startCustomLegoFlow(ctx) {
  const userId = ctx.from.id;
  await saveUserState(userId, {
    mode: 'CUSTOM_LEGO',
    step: 'SELECT_OPENING',
    data: { invitationId: uuidv4() }
  });

  const msg = `
🧩 <b>O'z Legongizni Tering (Konstruktor)</b>

1-QADAM: <b>Ochilish animatsiyasini</b> tanlang:
<i>(Mijoz taklifnoma havolasini ochganda qanday animatsiya chiqishini belgilang)</i>
  `;

  return ctx.replyWithHTML(msg, keyboards.openingStyleKeyboard());
}

// Handle Opening Style Selection
async function handleOpeningStyleSelect(ctx, openingStyle) {
  await ctx.answerCbQuery();
  const userId = ctx.from.id;
  const state = await getUserState(userId);
  if (!state) return ctx.reply('Iltimos, qaytadan /start bosing.');

  state.data.openingStyle = openingStyle;
  state.step = 'SELECT_THEME';
  await saveUserState(userId, state);

  const msg = `
✅ Ochilish animatsiyasi: <b>${getOpeningName(openingStyle)}</b>

2-QADAM: <b>Rang uslubi va mavzuni</b> tanlang:
  `;

  return ctx.editMessageText(msg, { parse_mode: 'HTML', ...keyboards.themeColorKeyboard() });
}

// Handle Theme Selection
async function handleThemeSelect(ctx, themeColor) {
  await ctx.answerCbQuery();
  const userId = ctx.from.id;
  const state = await getUserState(userId);
  if (!state) return ctx.reply('Iltimos, qaytadan /start bosing.');

  state.data.themeColor = themeColor;
  
  if (state.mode === 'READY_TEMPLATE') {
    state.data.openingStyle = 'envelope_wax';
    state.data.fontFamily = 'great_vibes';
    state.data.particleEffect = 'golden_dust';
    state.step = 'SELECT_EVENT_TYPE';
    await saveUserState(userId, state);

    return ctx.editMessageText(`
✅ Shablon tanlandi!

3-QADAM: <b>Tadbir turini</b> tanlang:
    `, { parse_mode: 'HTML', ...keyboards.eventTypeKeyboard() });
  }

  state.step = 'SELECT_FONT';
  await saveUserState(userId, state);

  const msg = `
✅ Rang: <b>${getThemeName(themeColor)}</b>

3-QADAM: <b>Shrift uslubini</b> tanlang:
  `;

  return ctx.editMessageText(msg, { parse_mode: 'HTML', ...keyboards.fontKeyboard() });
}

// Handle Font Selection
async function handleFontSelect(ctx, fontFamily) {
  await ctx.answerCbQuery();
  const userId = ctx.from.id;
  const state = await getUserState(userId);
  if (!state) return ctx.reply('Iltimos, qaytadan /start bosing.');

  state.data.fontFamily = fontFamily;
  state.step = 'SELECT_PARTICLE';
  await saveUserState(userId, state);

  const msg = `
✅ Shrift: <b>${getFontName(fontFamily)}</b>

4-QADAM: <b>Fon zarrachalari effektini</b> tanlang:
  `;

  return ctx.editMessageText(msg, { parse_mode: 'HTML', ...keyboards.particleKeyboard() });
}

// Handle Particle Selection
async function handleParticleSelect(ctx, particleEffect) {
  await ctx.answerCbQuery();
  const userId = ctx.from.id;
  const state = await getUserState(userId);
  if (!state) return ctx.reply('Iltimos, qaytadan /start bosing.');

  state.data.particleEffect = particleEffect;
  state.step = 'SELECT_EVENT_TYPE';
  await saveUserState(userId, state);

  const msg = `
✅ Fon zarrachalari: <b>${getParticleName(particleEffect)}</b>

5-QADAM: <b>Tadbir turini</b> tanlang:
  `;

  return ctx.editMessageText(msg, { parse_mode: 'HTML', ...keyboards.eventTypeKeyboard() });
}

// Handle Event Type Selection
async function handleEventTypeSelect(ctx, eventType) {
  await ctx.answerCbQuery();
  const userId = ctx.from.id;
  const state = await getUserState(userId);
  if (!state) return ctx.reply('Iltimos, qaytadan /start bosing.');

  state.data.eventType = eventType;
  state.step = 'ENTER_NAMES';
  await saveUserState(userId, state);

  const msg = `
✅ Tadbir turi: <b>${eventType}</b>

<b>Ismlarni kiriting:</b>
<i>(Masalan: Kelin va Kuyov: <code>Alisher & Madina</code> yoki bola ismi: <code>Sardorbek</code>)</i>
  `;

  return ctx.editMessageText(msg, { parse_mode: 'HTML', ...keyboards.cancelKeyboard() });
}

// Handle Text Inputs
async function handleTextInput(ctx) {
  const userId = ctx.from.id;
  const text = ctx.message.text.trim();
  const state = await getUserState(userId);
  if (!state || !state.step) return;

  switch (state.step) {
    case 'ENTER_NAMES': {
      state.data.names = text;
      state.step = 'ENTER_DATE';
      await saveUserState(userId, state);

      return ctx.replyWithHTML(`
✅ Ismlar: <b>${text}</b>

<b>To'y / Tadbir sanasini kiriting:</b>
<i>(Masalan: <code>2026-10-25</code> yoki <code>25-oktyabr 2026-yil</code>)</i>
      `, keyboards.cancelKeyboard());
    }

    case 'ENTER_DATE': {
      state.data.date = text;
      state.step = 'ENTER_TIME';
      await saveUserState(userId, state);

      return ctx.replyWithHTML(`
✅ Sana: <b>${text}</b>

<b>Boshlanish vaqtini kiriting:</b>
<i>(Masalan: <code>18:00</code>)</i>
      `, keyboards.cancelKeyboard());
    }

    case 'ENTER_TIME': {
      state.data.time = text;
      state.step = 'ENTER_VENUE';
      await saveUserState(userId, state);

      return ctx.replyWithHTML(`
✅ Vaqt: <b>${text}</b>

<b>To'yxona / Restoran nomi va manzilini kiriting:</b>
<i>(Masalan: <code>"Yakkasaroy" to'yxonasi, Shota Rustaveli ko'chasi 54-uy</code>)</i>
      `, keyboards.cancelKeyboard());
    }

    case 'ENTER_VENUE': {
      state.data.venue = text;
      state.step = 'ENTER_LOCATION_URL';
      await saveUserState(userId, state);

      return ctx.replyWithHTML(`
✅ To'yxona: <b>${text}</b>

<b>Xaritadagi lokatsiyani yuboring:</b>
• Yandex Maps / Google Maps havolasini yuborishingiz mumkin
• Yoki <b>⏭ O'tkazib yuborish</b>ni bosing
      `, keyboards.skipKeyboard('location'));
    }

    case 'ENTER_LOCATION_URL': {
      state.data.locationUrl = text;
      state.step = 'UPLOAD_PHOTO';
      await saveUserState(userId, state);

      return ctx.replyWithHTML(`
✅ Xarita havolasi qabul qilindi!

<b>Fotosurat yuklang:</b>
<i>(Rasm yuboring yoki o'tkazib yuboring)</i>
      `, keyboards.skipKeyboard('photo'));
    }

    case 'ENTER_CUSTOM_TEXT': {
      state.data.customText = text;
      state.step = 'SUMMARY_AND_PAY';
      await saveUserState(userId, state);

      return showSummaryAndPayment(ctx, state);
    }

    default:
      break;
  }
}

// Location share
async function handleLocationInput(ctx) {
  const userId = ctx.from.id;
  const state = await getUserState(userId);
  if (!state || state.step !== 'ENTER_LOCATION_URL') return;

  const { latitude, longitude } = ctx.message.location;
  const yandexUrl = `https://yandex.com/maps/?pt=${longitude},${latitude}&z=16&l=map`;

  state.data.locationUrl = yandexUrl;
  state.step = 'UPLOAD_PHOTO';
  await saveUserState(userId, state);

  return ctx.replyWithHTML(`
✅ Lokatsiya qabul qilindi!

<b>Fotosurat yuklang:</b>
<i>(Rasm yuboring yoki o'tkazib yuboring)</i>
  `, keyboards.skipKeyboard('photo'));
}

// Photo Input
async function handlePhotoInput(ctx) {
  const userId = ctx.from.id;
  const state = await getUserState(userId);
  if (!state) return;

  const photos = ctx.message.photo;
  const highestResPhoto = photos[photos.length - 1];

  if (state.step === 'UPLOAD_PHOTO') {
    const fileLink = await ctx.telegram.getFileLink(highestResPhoto.file_id);
    state.data.photoUrl = fileLink.href;
    state.step = 'SELECT_MUSIC';
    await saveUserState(userId, state);

    return ctx.replyWithHTML(`
✅ Fotosurat muvaffaqiyatli yuklandi!

<b>Fon musiqasini tanlang:</b>
    `, keyboards.musicKeyboard());
  }

  // Payment receipt
  if (state.step === 'WAITING_PAYMENT_RECEIPT') {
    const fileLink = await ctx.telegram.getFileLink(highestResPhoto.file_id);
    const invitationId = state.data.invitationId;
    const orderId = uuidv4();

    await db.run(`
      INSERT INTO invitations (
        id, user_id, template_slug, opening_style, theme_color, particle_effect,
        event_type, groom_name, event_date, event_time, venue_name, yandex_map_url,
        google_map_url, custom_text, audio_url, photo_url, is_paid, is_active
      ) VALUES (?, ?, 'modular', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)
    `, [
      invitationId,
      userId,
      state.data.openingStyle || 'envelope_wax',
      state.data.themeColor || 'emerald_gold',
      state.data.particleEffect || 'golden_dust',
      state.data.eventType || 'To\'y',
      state.data.names || '',
      state.data.date || '',
      state.data.time || '',
      state.data.venue || '',
      state.data.locationUrl || '',
      state.data.locationUrl || '',
      state.data.customText || '',
      state.data.audioUrl || '/audio/romantic_sample.mp3',
      state.data.photoUrl || ''
    ]);

    await db.run(`
      INSERT INTO orders (id, invitation_id, user_id, amount, receipt_file_id, receipt_file_path, status)
      VALUES (?, ?, ?, ?, ?, ?, 'PENDING')
    `, [orderId, invitationId, userId, config.INVITATION_PRICE_UZS, highestResPhoto.file_id, fileLink.href]);

    await saveUserState(userId, null);

    await ctx.replyWithHTML(`
🎉 <b>To'lov chekingiz qabul qilindi!</b>

Administrator to'lovni tekshirib, 2-5 daqiqa ichida taklifnomangizni faollashtiradi va sizga havolani yuboradi! ✨
    `, keyboards.mainMenu());

    if (config.ADMIN_TELEGRAM_ID) {
      const adminCaption = `
🔔 <b>YANGI TO'LOV CHEKI KELDI!</b>

🆔 <b>Buyurtma ID:</b> <code>${orderId}</code>
👤 <b>Mijoz:</b> @${ctx.from.username || 'noma\'lum'}
💰 <b>Summa:</b> ${config.INVITATION_PRICE_UZS.toLocaleString()} so'm
✉️ <b>Ochilish:</b> ${getOpeningName(state.data.openingStyle)}
🎨 <b>Rang:</b> ${getThemeName(state.data.themeColor)}
💍 <b>Ismlar:</b> ${state.data.names}
📅 <b>Sana va Vaqt:</b> ${state.data.date} | ${state.data.time}
📍 <b>To'yxona:</b> ${state.data.venue}
      `;

      try {
        await ctx.telegram.sendPhoto(config.ADMIN_TELEGRAM_ID, highestResPhoto.file_id, {
          caption: adminCaption,
          parse_mode: 'HTML',
          ...keyboards.adminApprovalKeyboard(orderId)
        });
      } catch (adminErr) {
        console.error('Failed to notify admin:', adminErr);
      }
    }
  }
}

// Audio Input
async function handleAudioInput(ctx) {
  const userId = ctx.from.id;
  const state = await getUserState(userId);
  if (!state || state.step !== 'SELECT_MUSIC') return;

  const audio = ctx.message.audio || ctx.message.voice;
  if (!audio) return;

  const fileLink = await ctx.telegram.getFileLink(audio.file_id);
  state.data.audioUrl = fileLink.href;
  state.step = 'ENTER_CUSTOM_TEXT';
  await saveUserState(userId, state);

  return ctx.replyWithHTML(`
✅ O'z musiqangiz yuklandi!

<b>Taklifnoma matnini kiriting:</b>
<i>(O'z matningizni yozing yoki standart matn uchun <b>⏭ O'tkazib yuborish</b>ni bosing)</i>
  `, keyboards.skipKeyboard('custom_text'));
}

// Skip Callbacks
async function handleSkip(ctx, step) {
  await ctx.answerCbQuery();
  const userId = ctx.from.id;
  const state = await getUserState(userId);
  if (!state) return;

  if (step === 'location') {
    state.data.locationUrl = '';
    state.step = 'UPLOAD_PHOTO';
    await saveUserState(userId, state);

    return ctx.replyWithHTML(`
<b>Fotosurat yuklang:</b>
<i>(Rasm yuboring yoki o'tkazib yuboring)</i>
    `, keyboards.skipKeyboard('photo'));
  }

  if (step === 'photo') {
    state.data.photoUrl = '';
    state.step = 'SELECT_MUSIC';
    await saveUserState(userId, state);

    return ctx.replyWithHTML(`
<b>Fon musiqasini tanlang:</b>
    `, keyboards.musicKeyboard());
  }

  if (step === 'music') {
    state.data.audioUrl = '/audio/romantic_sample.mp3';
    state.step = 'ENTER_CUSTOM_TEXT';
    await saveUserState(userId, state);

    return ctx.replyWithHTML(`
<b>Taklifnoma matnini kiriting:</b>
    `, keyboards.skipKeyboard('custom_text'));
  }

  if (step === 'custom_text') {
    state.data.customText = 'Sizni va oila a\'zolaringizni farzandlarimizning baxt to\'yiga lutfan taklif etamiz!';
    state.step = 'SUMMARY_AND_PAY';
    await saveUserState(userId, state);

    return showSummaryAndPayment(ctx, state);
  }
}

// Music Select
async function handleMusicSelect(ctx, musicId) {
  await ctx.answerCbQuery();
  const userId = ctx.from.id;
  const state = await getUserState(userId);
  if (!state) return;

  const musicMap = {
    music_1: '/audio/waltz_sample.mp3',
    music_2: '/audio/oriental_violin.mp3',
    music_3: '/audio/piano_evening.mp3',
    music_4: '/audio/national_festive.mp3',
  };

  state.data.audioUrl = musicMap[musicId] || '/audio/romantic_sample.mp3';
  state.step = 'ENTER_CUSTOM_TEXT';
  await saveUserState(userId, state);

  return ctx.replyWithHTML(`
✅ Fon musiqasi tanlandi!

<b>Taklifnoma matnini kiriting:</b>
<i>(O'z matningizni yozing yoki standart matn uchun <b>⏭ O'tkazib yuborish</b>ni bosing)</i>
  `, keyboards.skipKeyboard('custom_text'));
}

// Summary and Pay
async function showSummaryAndPayment(ctx, state) {
  const d = state.data;
  const cardNumber = await db.getSetting('card_number', config.CARD_NUMBER);
  const cardHolder = await db.getSetting('card_holder', config.CARD_HOLDER);
  const priceUzs = parseInt(await db.getSetting('invitation_price', config.INVITATION_PRICE_UZS), 10);

  const summary = `
📋 <b>BUYURTMA XULOSASI:</b>

✉️ <b>Ochilish:</b> ${getOpeningName(d.openingStyle)}
🎨 <b>Rang mavzusi:</b> ${getThemeName(d.themeColor)}
💍 <b>Tadbir:</b> ${d.eventType || 'To\'y'}
👥 <b>Ismlar:</b> <code>${d.names || '-'}</code>
📅 <b>Sana va Vaqt:</b> <code>${d.date || '-'} | ${d.time || '-'}</code>
🏛 <b>Manzil:</b> <code>${d.venue || '-'}</code>

━━━━━━━━━━━━━━━━━━━━
💰 <b>Xizmat narxi:</b> <code>${priceUzs.toLocaleString()} so'm</code>

💳 <b>To'lov uchun karta:</b>
<code>${cardNumber}</code>
👤 <b>Karta egasi:</b> <code>${cardHolder}</code>
━━━━━━━━━━━━━━━━━━━━

💡 <i>To'lov cheki (skrinshot/rasmi)ni botga yuboring:</i>
  `;

  state.step = 'WAITING_PAYMENT_RECEIPT';
  await saveUserState(ctx.from.id, state);

  return ctx.replyWithHTML(summary, keyboards.cancelKeyboard());
}

async function handleCancelFlow(ctx) {
  await ctx.answerCbQuery();
  await saveUserState(ctx.from.id, null);
  return ctx.reply('❌ Jarayon bekor qilindi.', keyboards.mainMenu());
}

function getOpeningName(slug) {
  const map = {
    envelope_wax: '✉️ 3D Muhrli Konvert',
    ribbon_gift: '🎀 Lenta & Sovg\'a Qutisi',
    curtain_reveal: '🎭 Shohona Parda',
    fade_glow: '✨ Yulduzli Porlash',
    direct: '⚡️ To\'g\'ridan-to\'g\'ri'
  };
  return map[slug] || '3D Konvert';
}

function getThemeName(slug) {
  const map = {
    emerald_gold: '👑 Emerald & Oltin',
    '#3d0c14': '🍷 Bordo / To\'q Qizil',
    midnight_blue: '🌌 Midnight Blue',
    rose_blush: '🌸 Rose Blush (Pushti)',
    '#111111': '🖤 Qora & Oltin',
    turquoise_festive: '🎉 Sunnat To\'yi'
  };
  return map[slug] || slug || 'Emerald & Oltin';
}

function getFontName(slug) {
  const map = {
    great_vibes: '✍️ Great Vibes (Kaligrafik)',
    playfair: '📜 Playfair (Klassik)',
    cinzel: '🏛 Cinzel (Rim Shohona)',
    alex_brush: '💎 Alex Brush (Romantik)'
  };
  return map[slug] || 'Great Vibes';
}

function getParticleName(slug) {
  const map = {
    golden_dust: '✨ Oltin Zarralar',
    rose_petals: '🌹 Atirgul Barglari',
    sparkling_stars: '⭐ Yulduzlar',
    none: '🚫 Zarrachalarsiz'
  };
  return map[slug] || 'Oltin Zarralar';
}

module.exports = {
  startReadyTemplatesFlow,
  startCustomLegoFlow,
  handleOpeningStyleSelect,
  handleThemeSelect,
  handleFontSelect,
  handleParticleSelect,
  handleEventTypeSelect,
  handleTextInput,
  handleLocationInput,
  handlePhotoInput,
  handleAudioInput,
  handleSkip,
  handleMusicSelect,
  handleCancelFlow,
};
