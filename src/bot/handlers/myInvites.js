const { Markup } = require('telegraf');
const db = require('../../db');
const config = require('../../config');
const keyboards = require('../keyboards');

async function handleMyInvitations(ctx) {
  const userId = ctx.from.id;

  try {
    const invitations = await db.all(
      `SELECT * FROM invitations WHERE user_id = ? ORDER BY created_at DESC LIMIT 10`,
      [userId]
    );

    if (!invitations || invitations.length === 0) {
      return ctx.replyWithHTML(`
📂 <b>Sizda hali yaratilgan taklifnomalar yo'q.</b>

Yangi taklifnoma yaratish uchun <b>✨ Yangi taklifnoma yaratish</b> tugmasini bosing!
      `, keyboards.mainMenu());
    }

    let message = `📂 <b>Sizning taklifnomalaringiz (${invitations.length} ta):</b>\n\n`;

    const inlineButtons = [];

    invitations.forEach((inv, index) => {
      const statusIcon = inv.is_active ? '🟢 Faol' : (inv.is_paid ? '🟡 Tekshirilmoqda' : '🔴 To\'lov kutilmoqda');
      const link = `${config.BASE_URL}/i/${inv.id}`;

      message += `<b>${index + 1}. ${inv.groom_name || 'Taklifnoma'}</b>\n`;
      message += `💍 Tadbir: ${inv.event_type} | 📅 Sana: ${inv.event_date || '-'}\n`;
      message += `📊 Holat: ${statusIcon} | 👁 Ko'rishlar: ${inv.views_count || 0}\n`;
      if (inv.is_active) {
        message += `🔗 <b>Havola:</b> ${link}\n`;
      }
      message += `\n`;

      if (inv.is_active) {
        inlineButtons.push([
          Markup.button.url(`🔗 ${index + 1}-taklifnomani ochish`, link),
          Markup.button.switchToChat(`📤 Ulashish`, `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent('Sizni to\'yimizga lutfan taklif etamiz!')}`)
        ]);
      }
    });

    if (inlineButtons.length > 0) {
      return ctx.replyWithHTML(message, Markup.inlineKeyboard(inlineButtons));
    } else {
      return ctx.replyWithHTML(message, keyboards.mainMenu());
    }
  } catch (err) {
    console.error('Error fetching invitations:', err);
    return ctx.reply('Taklifnomalarni yuklashda xatolik yuz berdi.');
  }
}

module.exports = {
  handleMyInvitations,
};
