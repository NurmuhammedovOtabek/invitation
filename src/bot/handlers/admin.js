const db = require('../../db');
const config = require('../../config');
const { Markup } = require('telegraf');

// Handle Admin Approval Callback: adm_approve_{orderId}
async function handleAdminApprove(ctx, orderId) {
  await ctx.answerCbQuery('Tasdiqlanmoqda...');

  try {
    const order = await db.get(`SELECT * FROM orders WHERE id = ?`, [orderId]);
    if (!order) {
      return ctx.reply('❌ Buyurtma topilmadi.');
    }

    if (order.status === 'APPROVED') {
      return ctx.reply('⚠️ Ushbu buyurtma allaqachon tasdiqlangan!');
    }

    // 1. Update order status
    await db.run(
      `UPDATE orders SET status = 'APPROVED', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [orderId]
    );

    // 2. Activate invitation
    await db.run(
      `UPDATE invitations SET is_paid = 1, is_active = 1 WHERE id = ?`,
      [order.invitation_id]
    );

    const inv = await db.get(`SELECT * FROM invitations WHERE id = ?`, [order.invitation_id]);
    const inviteUrl = `${config.BASE_URL}/i/${inv.id}`;

    // 3. Edit admin message
    await ctx.editMessageCaption(
      (ctx.callbackQuery.message.caption || '') + `\n\n✅ <b>ADMIN TOMONIDAN TASDIQLANDI (DONE)!</b>\n🔗 Havola: ${inviteUrl}`,
      { parse_mode: 'HTML' }
    );

    // 4. Send congratulations & link to the client
    const clientMsg = `
🎉 <b>TABRIKLAYMIZ! TAKLIFNOMANGIZ TAYYOR BO'LDI!</b> ✨

To'lovingiz muvaffaqiyatli tasdiqlandi va sizning individual veb-taklifnomangiz faollashtirildi!

🔗 <b>Sizning taklifnoma havolangiz:</b>
${inviteUrl}

📲 <b>Ulashish bo'yicha maslahatlar:</b>
1. Havolani nusxalab, Telegram guruhlarga yoki shaxsiy xabarlarga yuboring.
2. Instagram bio-ga yoki hikoyalarga (Stories) stiker sifatida qo'shing.
3. Mehmonlar havolani ochganda musiqa yangraydi va Yandex xarita orqali to'yxonani oson topib borishadi!

<i>Barcha taklifnomalaringizni botdagi <b>📂 Mening taklifnomalarim</b> bo'limida doimo ko'rishingiz mumkin.</i>
    `;

    const shareKeyboard = Markup.inlineKeyboard([
      [Markup.button.url('✨ Taklifnomani ochish', inviteUrl)],
      [Markup.button.url('📤 Telegramda ulashish', `https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent('Sizni to\'yimizga lutfan taklif etamiz! 🎉')}`)]
    ]);

    await ctx.telegram.sendMessage(order.user_id, clientMsg, {
      parse_mode: 'HTML',
      ...shareKeyboard
    });

  } catch (err) {
    console.error('Error approving order:', err);
    ctx.reply('Tasdiqlashda xatolik yuz berdi: ' + err.message);
  }
}

// Handle Admin Rejection Callback: adm_reject_{orderId}
async function handleAdminReject(ctx, orderId) {
  await ctx.answerCbQuery('Rad etilmoqda...');

  try {
    const order = await db.get(`SELECT * FROM orders WHERE id = ?`, [orderId]);
    if (!order) {
      return ctx.reply('❌ Buyurtma topilmadi.');
    }

    // Update order status
    await db.run(
      `UPDATE orders SET status = 'REJECTED', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [orderId]
    );

    // Edit admin message
    await ctx.editMessageCaption(
      (ctx.callbackQuery.message.caption || '') + `\n\n❌ <b>ADMIN TOMONIDAN RAD ETILDI!</b>`,
      { parse_mode: 'HTML' }
    );

    // Send rejection notice to user
    const clientMsg = `
⚠️ <b>To'lovingiz tasdiqlanmadi.</b>

Yuborilgan chekda xatolik bo'lishi mumkin yoki to'lov hisobimizga kelib tushmadi.
Iltimos, qaytadan tekshirib ko'ring yoki admin bilan bog'laning:
👨‍💻 @${config.ADMIN_USERNAME}
    `;

    await ctx.telegram.sendMessage(order.user_id, clientMsg, { parse_mode: 'HTML' });

  } catch (err) {
    console.error('Error rejecting order:', err);
    ctx.reply('Rad etishda xatolik yuz berdi: ' + err.message);
  }
}

// Admin stats command /admin
async function handleAdminStats(ctx) {
  if (Number(ctx.from.id) !== Number(config.ADMIN_TELEGRAM_ID)) {
    return ctx.reply('⛔ Sizda admin huquqlari yo\'q.');
  }

  try {
    const usersCount = (await db.get(`SELECT COUNT(*) as cnt FROM users`)).cnt;
    const invCount = (await db.get(`SELECT COUNT(*) as cnt FROM invitations`)).cnt;
    const activeInvCount = (await db.get(`SELECT COUNT(*) as cnt FROM invitations WHERE is_active = 1`)).cnt;
    const totalEarnings = (await db.get(`SELECT SUM(amount) as total FROM orders WHERE status = 'APPROVED'`)).total || 0;
    const pendingOrders = (await db.get(`SELECT COUNT(*) as cnt FROM orders WHERE status = 'PENDING'`)).cnt;

    const settings = await db.getAllSettings();

    const statsMsg = `
📊 <b>ADMIN BOSHQARUV STATISTIKASI:</b>

👥 <b>Jami foydalanuvchilar:</b> ${usersCount} ta
💌 <b>Jami taklifnomalar:</b> ${invCount} ta
🟢 <b>Faol (sotilgan) taklifnomalar:</b> ${activeInvCount} ta
⏳ <b>Kutilayotgan to'lov cheklari:</b> ${pendingOrders} ta
💰 <b>Jami tushum:</b> ${totalEarnings.toLocaleString()} so'm

━━━━━━━━━━━━━━━━━━━━
💳 <b>Hozirgi to'lov kartasi:</b>
<code>${settings.card_number || config.CARD_NUMBER}</code> (${settings.card_holder || config.CARD_HOLDER})
💵 <b>Taklifnoma narxi:</b> ${settings.invitation_price || config.INVITATION_PRICE_UZS} so'm

🔧 <b>Tezkor buyruqlar:</b>
• <code>/set_card 8600000000000000 Karta Egasi</code> — Yangi karta raqamini kiritish
• <code>/set_price 50000</code> — Narxni o'zgartirish
• <code>/create</code> — Web orqali mijozga maxsus taklifnoma yasab berish
    `;

    const adminBtns = Markup.inlineKeyboard([
      [Markup.button.url('🌐 Web Admin Panelni Ochish', `${config.BASE_URL}/admin`)],
      [Markup.button.url('✨ Mijozga Taklifnoma Yasash', `${config.BASE_URL}/admin/create`)]
    ]);

    return ctx.replyWithHTML(statsMsg, adminBtns);
  } catch (err) {
    console.error('Admin stats error:', err);
    return ctx.reply('Statistika olishda xatolik.');
  }
}

// Set card number command: /set_card 8600000000000000 Ali Valiyev
async function handleSetCard(ctx) {
  if (Number(ctx.from.id) !== Number(config.ADMIN_TELEGRAM_ID)) return;

  const parts = ctx.message.text.trim().split(' ');
  if (parts.length < 2) {
    return ctx.replyWithHTML('Iltimos to\'g\'ri formatda yozing:\n<code>/set_card 8600123456789012 Alisher Navoiy</code>');
  }

  const cardNumber = parts[1];
  const cardHolder = parts.slice(2).join(' ') || 'ADMINISTRATOR';

  await db.setSetting('card_number', cardNumber);
  await db.setSetting('card_holder', cardHolder);

  return ctx.replyWithHTML(`✅ <b>To'lov kartasi muvaffaqiyatli yangilandi!</b>\n💳 Karta: <code>${cardNumber}</code>\n👤 Egasi: <b>${cardHolder}</b>`);
}

// Set price command: /set_price 60000
async function handleSetPrice(ctx) {
  if (Number(ctx.from.id) !== Number(config.ADMIN_TELEGRAM_ID)) return;

  const parts = ctx.message.text.trim().split(' ');
  if (parts.length < 2) {
    return ctx.replyWithHTML('Iltimos to\'g\'ri formatda yozing:\n<code>/set_price 50000</code>');
  }

  const price = parts[1];
  await db.setSetting('invitation_price', price);

  return ctx.replyWithHTML(`✅ <b>Taklifnoma narxi yangilandi:</b> <code>${price} so'm</code>`);
}

module.exports = {
  handleAdminApprove,
  handleAdminReject,
  handleAdminStats,
  handleSetCard,
  handleSetPrice,
};
