const db = require('../../db');
const keyboards = require('../keyboards');
const config = require('../../config');
const { pendingSessions } = require('../../server/routes/auth');

async function handleStart(ctx) {
  const user = ctx.from;
  if (!user) return;

  try {
    await db.run(
      `INSERT INTO users (telegram_id, username, first_name, last_name)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(telegram_id) DO UPDATE SET
         username = COALESCE(excluded.username, users.username),
         first_name = COALESCE(excluded.first_name, users.first_name),
         last_name = COALESCE(excluded.last_name, users.last_name)`,
      [user.id, user.username || null, user.first_name || '', user.last_name || '']
    );

    await db.run(`UPDATE users SET state_data = NULL WHERE telegram_id = ?`, [user.id]);
  } catch (err) {
    console.error('Error in handleStart DB:', err);
  }

  // Check if this is a Web Deep Link Login: /start auth_XYZ123
  const startPayload = ctx.message?.text?.split(' ')[1];
  if (startPayload && startPayload.startsWith('auth_')) {
    const sessionCode = startPayload.replace('auth_', '');
    const session = pendingSessions.get(sessionCode);

    if (session) {
      session.status = 'APPROVED';
      session.user = {
        id: user.id,
        telegram_id: user.id,
        username: user.username,
        first_name: user.first_name
      };

      return ctx.replyWithHTML(`
✅ <b>Tabriklaymiz, ${user.first_name}!</b>

Saytdagi <b>Shaxsiy Kabinet</b>ingizga muvaffaqiyatli kirdingiz! Brauzeringizdagi sahifa avtomatik ochildi. ✨
      `, keyboards.mainMenu());
    }
  }

  const welcomeMessage = `
🎉 <b>Assalomu alaykum, ${user.first_name || 'Hurmatli mehmon'}!</b>

<b>Online Taklifnomalar (Lego Platformasi)</b>ga xush kelibsiz! ✨

Bizda siz uchun <b>3 ta qulay tanlov</b> mavjud:

🎁 <b>1. Tayyor Legolar (50,000 so'm)</b>
<i>Biz siz uchun eng chiroyli animatsiya va musiqalar bilan terib qo'ygan tayyor shablonlar (Klassik Oltin, Pushti Romantik, Shohona Moviy, Sunnat To'yi).</i>

🧩 <b>2. O'z Legongizni Tering (Konstruktor - 50,000 so'm)</b>
<i>Har bir bo'lakni o'zingiz tanlaysiz: 5 xil ochilish animatsiyasi, ranglar, shriftlar, Dress Code, To'yona karta raqami va to'y dasturi.</i>

💎 <b>3. Maxsus / VIP Buyurtma (Admin bilan aloqa)</b>
<i>Eksklyuziv 3D video, maxsus illyustratsiyalar yoki murakkab individual dizaynlar.</i>

<i>Boshlash uchun pastdagi tugmalardan birini tanlang:</i>
  `;

  return ctx.replyWithHTML(welcomeMessage, keyboards.mainMenu());
}

async function handleHelp(ctx) {
  const helpText = `
ℹ️ <b>Taklifnoma yaratish tartibi:</b>

1️⃣ O'zingizga ma'qul yo'lni tanlang (Tayyor shablon yoki Lego Konstruktor).
2️⃣ Kelin-kuyov ismlari, sana, to'yxona va lokatsiyani kiriting.
3️⃣ To'lov (50,000 so'm) chekini botga yuboring.
4️⃣ Admin tasdiqlashi bilan individual havolangiz tayyor bo'ladi!

🔗 Havolani Telegram, Instagram yoki WhatsApp orqali barcha mehmonlarga bitta xabar bilan yuborasiz!
  `;
  return ctx.replyWithHTML(helpText, keyboards.mainMenu());
}

async function handleCustomOrder(ctx) {
  const customOrderText = `
💎 <b>Maxsus / VIP Buyurtma (Admin)</b>

Agar sizga mutlaqo eksklyuziv dizayn, maxsus 3D video, alohida studiya illyustratsiyalari yoki nostandart talablar kerak bo'lsa — biz bilan to'g'ridan-to'g'ri bog'lanishingiz mumkin!

👨‍💻 <b>Admin:</b> @${config.ADMIN_USERNAME}
📞 <b>Aloqa:</b> @${config.ADMIN_USERNAME}

<i>G'oyalaringizni yozing, biz siz xohlagan har qanday murakkablikdagi taklifnomani yaratib beramiz!</i>
  `;
  return ctx.replyWithHTML(customOrderText, keyboards.mainMenu());
}

module.exports = {
  handleStart,
  handleHelp,
  handleCustomOrder,
};
