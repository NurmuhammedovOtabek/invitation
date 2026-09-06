const express = require('express');
const router = express.Router();
const db = require('../../db');
const config = require('../../config');
const { requireAuth } = require('./auth');

function formatDate(dateStr) {
  if (!dateStr) return '';
  const months = [
    'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
    'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
  ];
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${d.getDate()}-${months[d.getMonth()]} ${d.getFullYear()}-yil`;
  } catch (e) {
    return dateStr;
  }
}

// User Personal Dashboard: GET /dashboard and GET /my
router.get(['/dashboard', '/my'], requireAuth, async (req, res) => {
  const user = req.user;

  try {
    // Fetch all invitations belonging to this user
    const invitations = await db.all(
      `SELECT * FROM invitations WHERE user_id = ? ORDER BY created_at DESC`,
      [user.telegram_id]
    );

    // Calculate stats
    const totalInvites = invitations.length;
    const totalViews = invitations.reduce((sum, inv) => sum + (inv.views_count || 0), 0);
    const activeInvites = invitations.filter(inv => inv.is_active === 1).length;

    const formattedInvites = invitations.map(inv => ({
      ...inv,
      formattedDate: formatDate(inv.event_date),
      createdDate: formatDate(inv.created_at?.split(' ')[0] || ''),
      liveUrl: `${config.BASE_URL}/i/${inv.id}`
    }));

    res.render('dashboard', {
      user,
      invitations: formattedInvites,
      stats: {
        totalInvites,
        totalViews,
        activeInvites
      },
      baseUrl: config.BASE_URL
    });
  } catch (err) {
    console.error('Error rendering dashboard:', err);
    res.status(500).render('error', {
      title: 'Xatolik',
      message: 'Kabinetni yuklashda texnik xatolik yuz berdi.'
    });
  }
});

module.exports = router;
