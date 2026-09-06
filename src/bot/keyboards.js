const { Markup } = require('telegraf');
const config = require('../config');

// Asosiy menyu (3 ta yo'l bilan)
const mainMenu = () => {
  return Markup.keyboard([
    ['🎁 1. Tayyor Legolar', '🧩 2. O\'z Legongizni Tering'],
    ['💎 3. Maxsus Buyurtma (Admin)', '📂 Mening taklifnomalarim'],
    ['🎨 Visual Konstruktor (Web)', 'ℹ️ Narxlar va Yordam']
  ]).resize();
};

// 1. Ochilish Animatsiyasi tanlash (Inline Keyboard)
const openingStyleKeyboard = () => {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('✉️ 3D Muhrli Konvert', 'open_envelope_wax'),
      Markup.button.callback('🎀 Lenta & Sovg\'a Qutisi', 'open_ribbon_gift')
    ],
    [
      Markup.button.callback('🎭 Shohona Parda', 'open_curtain_reveal'),
      Markup.button.callback('✨ Yulduzli Porlash', 'open_fade_glow')
    ],
    [
      Markup.button.callback('⚡️ To\'g\'ridan-to\'g\'ri (Ochilishsiz)', 'open_direct')
    ],
    [Markup.button.callback('❌ Bekor qilish', 'cancel_flow')]
  ]);
};

// 2. Rang uslubi / Mavzu tanlash (Inline Keyboard)
const themeColorKeyboard = () => {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('👑 Emerald & Oltin', 'theme_emerald_gold'),
      Markup.button.callback('🍷 Bordo / To\'q Qizil', 'theme_#3d0c14')
    ],
    [
      Markup.button.callback('🌌 Midnight Blue', 'theme_midnight_blue'),
      Markup.button.callback('🌸 Rose Blush (Pushti)', 'theme_rose_blush')
    ],
    [
      Markup.button.callback('🖤 Qora & Oltin', 'theme_#111111'),
      Markup.button.callback('🎉 Sunnat To\'yi (Feruza)', 'theme_turquoise_festive')
    ],
    [Markup.button.callback('❌ Bekor qilish', 'cancel_flow')]
  ]);
};

// 3. Shrift tanlash (Inline Keyboard)
const fontKeyboard = () => {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('✍️ Great Vibes (Nafis Kaligrafik)', 'font_great_vibes'),
      Markup.button.callback('📜 Playfair (Shohona Klassik)', 'font_playfair')
    ],
    [
      Markup.button.callback('🏛 Cinzel (Rim Shohona)', 'font_cinzel'),
      Markup.button.callback('💎 Alex Brush (Romantik)', 'font_alex_brush')
    ],
    [Markup.button.callback('❌ Bekor qilish', 'cancel_flow')]
  ]);
};

// 4. Fon Zarrachalari tanlash (Inline Keyboard)
const particleKeyboard = () => {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('✨ Oltin Zarralar', 'part_golden_dust'),
      Markup.button.callback('🌹 Atirgul Barglari', 'part_rose_petals')
    ],
    [
      Markup.button.callback('⭐ Yaltirovchi Yulduzlar', 'part_sparkling_stars'),
      Markup.button.callback('🚫 Zarrachalarsiz', 'part_none')
    ],
    [Markup.button.callback('❌ Bekor qilish', 'cancel_flow')]
  ]);
};

// Tadbir turi (Inline Keyboard)
const eventTypeKeyboard = () => {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('💍 Nikoh / Visol To\'yi', 'evt_wedding'),
      Markup.button.callback('🎊 Nikoh Oqshomi', 'evt_party')
    ],
    [
      Markup.button.callback('🎈 Sunnat To\'yi / Beshik To\'yi', 'evt_sunnat'),
      Markup.button.callback('🎂 Tug\'ilgan Kun / Yubiley', 'evt_birthday')
    ],
    [Markup.button.callback('❌ Bekor qilish', 'cancel_flow')]
  ]);
};

// O'tkazib yuborish tugmasi
const skipKeyboard = (step) => {
  return Markup.inlineKeyboard([
    [Markup.button.callback('⏭ O\'tkazib yuborish', `skip_${step}`)],
    [Markup.button.callback('❌ Bekor qilish', 'cancel_flow')]
  ]);
};

// Musiqa tanlash (Inline Keyboard)
const musicKeyboard = () => {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('🎵 1. Romantik Vals', 'music_1'),
      Markup.button.callback('🎻 2. Sharqona Skripka', 'music_2')
    ],
    [
      Markup.button.callback('🎹 3. Oqshom Pianino', 'music_3'),
      Markup.button.callback('🎶 4. Milliy Bayramona', 'music_4')
    ],
    [
      Markup.button.callback('📤 O\'z audiongizni yuklang (MP3)', 'music_custom'),
      Markup.button.callback('⏭ Musiqasiz', 'skip_music')
    ],
    [Markup.button.callback('❌ Bekor qilish', 'cancel_flow')]
  ]);
};

// Admin uchun tasdiqlash tugmalari
const adminApprovalKeyboard = (orderId) => {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('✅ Tasdiqlash (Done)', `adm_approve_${orderId}`),
      Markup.button.callback('❌ Rad etish', `adm_reject_${orderId}`)
    ]
  ]);
};

// Bekor qilish tugmasi
const cancelKeyboard = () => {
  return Markup.inlineKeyboard([
    [Markup.button.callback('❌ Bekor qilish', 'cancel_flow')]
  ]);
};

module.exports = {
  mainMenu,
  openingStyleKeyboard,
  themeColorKeyboard,
  fontKeyboard,
  particleKeyboard,
  eventTypeKeyboard,
  skipKeyboard,
  musicKeyboard,
  adminApprovalKeyboard,
  cancelKeyboard,
};
