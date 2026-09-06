const express = require('express');
const router = express.Router();
const db = require('../../db');

// 1. Get Approved Reviews: GET /api/reviews
router.get('/api/reviews', async (req, res) => {
  try {
    const reviews = await db.all(
      `SELECT * FROM reviews WHERE is_approved = 1 ORDER BY created_at DESC LIMIT 20`
    );
    res.json({ success: true, reviews });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Submit New Review: POST /api/reviews
router.post('/api/reviews', async (req, res) => {
  try {
    const { author_name, rating, comment, invitation_id } = req.body;

    if (!author_name || !comment) {
      return res.status(400).json({ success: false, error: 'Ism va sharh matni to\'ldirilishi shart!' });
    }

    const userId = req.user ? req.user.telegram_id : null;
    const finalRating = Math.min(5, Math.max(1, parseInt(rating || 5, 10)));

    await db.run(
      `INSERT INTO reviews (user_id, invitation_id, author_name, rating, comment, is_approved, source)
       VALUES (?, ?, ?, ?, ?, 1, 'web')`,
      [userId, invitation_id || null, author_name.trim(), finalRating, comment.trim()]
    );

    res.json({
      success: true,
      message: 'Rahmat! Sharhingiz muvaffaqiyatli qabul qilindi va sahifada chop etildi.'
    });
  } catch (err) {
    console.error('Submit review error:', err);
    res.status(500).json({ success: false, error: 'Sharh yuborishda xatolik yuz berdi.' });
  }
});

module.exports = router;
