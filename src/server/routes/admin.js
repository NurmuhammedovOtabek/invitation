const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../../db');
const config = require('../../config');
const { requireAuth } = require('../routes/auth');

// Multer storage for custom images and audios uploaded by Admin
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `custom_${Date.now()}_${uuidv4().slice(0, 8)}${ext}`);
  }
});
const upload = multer({ storage });

// Admin Authorization Middleware
async function requireAdmin(req, res, next) {
  // If user is logged in via Web session
  if (req.user && Number(req.user.telegram_id) === Number(config.ADMIN_TELEGRAM_ID)) {
    return next();
  }

  // Also support quick secret pin for admin in development if needed
  if (req.query.admin_key === 'admin2026' || req.session?.isAdmin) {
    return next();
  }

  // Redirect to login if not admin
  return res.status(403).render('error', {
    title: 'Kirish taqiqlangan',
    message: 'Bu sahifaga faqat platforma administratori kira oladi.'
  });
}

// 1. Admin Dashboard View: GET /admin
router.get(['/admin', '/admin/dashboard'], requireAuth, requireAdmin, async (req, res) => {
  try {
    const usersCount = (await db.get(`SELECT COUNT(*) as cnt FROM users`)).cnt;
    const invCount = (await db.get(`SELECT COUNT(*) as cnt FROM invitations`)).cnt;
    const activeInvCount = (await db.get(`SELECT COUNT(*) as cnt FROM invitations WHERE is_active = 1`)).cnt;
    const pendingOrdersCount = (await db.get(`SELECT COUNT(*) as cnt FROM orders WHERE status = 'PENDING'`)).cnt;
    const totalEarnings = (await db.get(`SELECT SUM(amount) as total FROM orders WHERE status = 'APPROVED'`)).total || 0;

    // Recent orders
    const recentOrders = await db.all(`
      SELECT o.*, i.groom_name, u.first_name, u.username, u.telegram_id as user_tg_id
      FROM orders o
      LEFT JOIN invitations i ON o.invitation_id = i.id
      LEFT JOIN users u ON o.user_id = u.telegram_id
      ORDER BY o.created_at DESC LIMIT 10
    `);

    // All system settings (Card number, price, etc.)
    const settings = await db.getAllSettings();

    // Recent reviews
    const reviews = await db.all(`SELECT * FROM reviews ORDER BY created_at DESC LIMIT 20`);

    // All custom created invitations
    const allInvitations = await db.all(`
      SELECT i.*, u.username, u.first_name 
      FROM invitations i 
      LEFT JOIN users u ON i.user_id = u.telegram_id 
      ORDER BY i.created_at DESC LIMIT 20
    `);

    res.render('admin/dashboard', {
      user: req.user,
      stats: {
        usersCount,
        invCount,
        activeInvCount,
        pendingOrdersCount,
        totalEarnings
      },
      recentOrders,
      settings,
      reviews,
      allInvitations,
      baseUrl: config.BASE_URL,
      successMsg: req.query.msg || null
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.status(500).send('Admin dashboard error: ' + err.message);
  }
});

// 2. Admin Create Custom Invitation for Client View: GET /admin/create
router.get('/admin/create', requireAuth, requireAdmin, async (req, res) => {
  const users = await db.all(`SELECT telegram_id, username, first_name FROM users ORDER BY created_at DESC LIMIT 50`);
  res.render('admin/create_invitation', {
    user: req.user,
    users,
    baseUrl: config.BASE_URL
  });
});

// 3. Admin Process Custom Invitation Creation: POST /admin/create
router.post('/admin/create', requireAuth, requireAdmin, upload.fields([
  { name: 'photo_file', maxCount: 1 },
  { name: 'audio_file', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      target_user_id,
      target_username,
      names,
      event_type,
      event_date,
      event_time,
      venue_name,
      venue_address,
      yandex_map_url,
      custom_text,
      opening_style,
      theme_color,
      font_family,
      particle_effect,
      card_number,
      card_holder,
      is_active_flag
    } = req.body;

    let finalUserId = null;

    // Find or identify target user
    if (target_user_id) {
      finalUserId = parseInt(target_user_id, 10);
    } else if (target_username) {
      const cleanUser = target_username.replace(/^@/, '').trim();
      const existing = await db.get(`SELECT telegram_id FROM users WHERE LOWER(username) = LOWER(?)`, [cleanUser]);
      if (existing) {
        finalUserId = existing.telegram_id;
      } else {
        // Create placeholder user if doesn't exist yet
        const tempId = Date.now();
        await db.run(`INSERT INTO users (telegram_id, username, first_name) VALUES (?, ?, ?)`, [tempId, cleanUser, cleanUser]);
        finalUserId = tempId;
      }
    } else {
      finalUserId = req.user.telegram_id; // Default to admin if no user specified
    }

    const invitationId = uuidv4();
    let photoUrl = req.body.photo_url || '';
    let audioUrl = req.body.audio_url || '/audio/romantic_sample.mp3';

    if (req.files && req.files.photo_file && req.files.photo_file[0]) {
      photoUrl = `/uploads/${req.files.photo_file[0].filename}`;
    }
    if (req.files && req.files.audio_file && req.files.audio_file[0]) {
      audioUrl = `/uploads/${req.files.audio_file[0].filename}`;
    }

    const isActive = is_active_flag === 'on' || is_active_flag === '1' ? 1 : 1;

    await db.run(`
      INSERT INTO invitations (
        id, user_id, template_slug, theme_color, opening_style, particle_effect,
        font_family, event_type, groom_name, event_date, event_time, venue_name,
        venue_address, yandex_map_url, google_map_url, custom_text, audio_url,
        photo_url, card_number, card_holder, is_paid, is_active, created_by_admin
      ) VALUES (?, ?, 'modular', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 1)
    `, [
      invitationId,
      finalUserId,
      theme_color || 'emerald_gold',
      opening_style || 'envelope_wax',
      particle_effect || 'golden_dust',
      font_family || 'great_vibes',
      event_type || 'Nikoh To\'yi',
      names || 'Alisher & Madina',
      event_date || '2026-10-25',
      event_time || '18:00',
      venue_name || '"Yakkasaroy" To\'yxonasi',
      venue_address || 'Toshkent shahri',
      yandex_map_url || '',
      yandex_map_url || '',
      custom_text || 'Sizni to\'yimizga lutfan taklif etamiz!',
      audioUrl,
      photoUrl,
      card_number || '',
      card_holder || '',
      isActive
    ]);

    // Send notification to the user in Telegram if valid telegram_id
    try {
      const { botInstance } = require('../../bot');
      if (botInstance && finalUserId && finalUserId > 100000) {
        const inviteUrl = `${config.BASE_URL}/i/${invitationId}`;
        const notifyMsg = `
🎉 <b>Hurmatli mijoz!</b>

Administrator siz uchun maxsus individual taklifnomani tayyorladi va sizning hisobingizga biriktirdi! ✨

💍 <b>Taklifnoma:</b> ${names}
📅 <b>Sana:</b> ${event_date}
🔗 <b>Sizning havolangiz:</b>
${inviteUrl}

<i>Ushbu havolani mehmonlaringizga bemalol yuborishingiz mumkin. Shuningdek, u sizning <b>📂 Mening taklifnomalarim</b> kabinetingizda doimiy saqlanadi.</i>
        `;

        await botInstance.telegram.sendMessage(finalUserId, notifyMsg, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '✨ Taklifnomani ochish', url: inviteUrl }]
            ]
          }
        });
      }
    } catch (botErr) {
      console.log('User notification skipped/failed:', botErr.message);
    }

    res.redirect(`/admin?msg=${encodeURIComponent('Yangi taklifnoma muvaffaqiyatli yaratildi va mijozga biriktirildi!')}`);
  } catch (err) {
    console.error('Error creating custom invitation:', err);
    res.status(500).send('Xatolik: ' + err.message);
  }
});

// 4. Update System Settings (Karta raqami, narx, admin username): POST /admin/settings
router.post('/admin/settings', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { card_number, card_holder, invitation_price, admin_username, support_phone } = req.body;

    if (card_number) await db.setSetting('card_number', card_number.trim());
    if (card_holder) await db.setSetting('card_holder', card_holder.trim());
    if (invitation_price) await db.setSetting('invitation_price', invitation_price.trim());
    if (admin_username) await db.setSetting('admin_username', admin_username.trim().replace(/^@/, ''));
    if (support_phone) await db.setSetting('support_phone', support_phone.trim());

    res.redirect('/admin?msg=' + encodeURIComponent('Sozlamalar (Karta raqami va narxlar) muvaffaqiyatli yangilandi!'));
  } catch (err) {
    res.status(500).send('Sozlamalarni saqlashda xatolik: ' + err.message);
  }
});

// 5. Approve Review: POST /admin/reviews/approve/:id
router.post('/admin/reviews/approve/:id', requireAuth, requireAdmin, async (req, res) => {
  await db.run(`UPDATE reviews SET is_approved = 1 WHERE id = ?`, [req.params.id]);
  res.redirect('/admin?msg=' + encodeURIComponent('Sharh tasdiqlandi!'));
});

// 6. Delete Review: POST /admin/reviews/delete/:id
router.post('/admin/reviews/delete/:id', requireAuth, requireAdmin, async (req, res) => {
  await db.run(`DELETE FROM reviews WHERE id = ?`, [req.params.id]);
  res.redirect('/admin?msg=' + encodeURIComponent('Sharh o\'chirildi!'));
});

// 7. Delete Invitation: POST /admin/invitations/delete/:id
router.post('/admin/invitations/delete/:id', requireAuth, requireAdmin, async (req, res) => {
  await db.run(`DELETE FROM invitations WHERE id = ?`, [req.params.id]);
  res.redirect('/admin?msg=' + encodeURIComponent('Taklifnoma o\'chirildi!'));
});

module.exports = router;
