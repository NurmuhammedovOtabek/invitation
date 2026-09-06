const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../../db');
const config = require('../../config');

const JWT_SECRET = process.env.JWT_SECRET || 'taklifnoma_super_secret_jwt_key_2026';

// In-memory pending web login sessions: { session_code: { user_id, status, created_at } }
const pendingSessions = new Map();

// Helper to create JWT token
function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      telegram_id: user.telegram_id,
      username: user.username,
      first_name: user.first_name,
      photo_url: user.photo_url || ''
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// Middleware: Authenticate User from Cookie or Header
async function requireAuth(req, res, next) {
  const token = req.cookies?.auth_token || req.headers?.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.redirect('/auth/login?redirect=' + encodeURIComponent(req.originalUrl));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.get(`SELECT * FROM users WHERE telegram_id = ?`, [decoded.telegram_id]);
    if (!user) {
      res.clearCookie('auth_token');
      return res.redirect('/auth/login');
    }
    req.user = user;
    next();
  } catch (err) {
    res.clearCookie('auth_token');
    return res.redirect('/auth/login');
  }
}

// 1. Login Page View: GET /auth/login
router.get('/login', (req, res) => {
  const sessionCode = crypto.randomBytes(4).toString('hex'); // 8-char random token
  pendingSessions.set(sessionCode, { status: 'PENDING', createdAt: Date.now() });

  // Clean old sessions after 10 mins
  setTimeout(() => pendingSessions.delete(sessionCode), 10 * 60 * 1000);

  res.render('login', {
    baseUrl: config.BASE_URL,
    botUsername: (config.ADMIN_USERNAME || 'taklifnoma_bot').replace(/^@/, ''),
    sessionCode,
    redirectUrl: req.query.redirect || '/dashboard'
  });
});

// 2. Telegram WebApp Instant Auto-Login: POST /api/auth/webapp
router.post('/api/auth/webapp', async (req, res) => {
  const { id, first_name, last_name, username, photo_url } = req.body;

  if (!id) {
    return res.status(400).json({ success: false, error: 'User ID talab qilinadi' });
  }

  try {
    // Upsert user into database
    await db.run(
      `INSERT INTO users (telegram_id, username, first_name, last_name)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(telegram_id) DO UPDATE SET
         username = COALESCE(excluded.username, users.username),
         first_name = COALESCE(excluded.first_name, users.first_name),
         last_name = COALESCE(excluded.last_name, users.last_name)`,
      [id, username || null, first_name || '', last_name || '']
    );

    const user = await db.get(`SELECT * FROM users WHERE telegram_id = ?`, [id]);
    const token = createToken({ ...user, photo_url });

    res.cookie('auth_token', token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });

    res.json({ success: true, user, redirect: '/dashboard' });
  } catch (err) {
    console.error('WebApp auth error:', err);
    res.status(500).json({ success: false, error: 'Server xatoligi' });
  }
});

// 3. Check Session Status for Web QR / Deep Link Login: GET /api/auth/check-session/:code
router.get('/api/auth/check-session/:code', async (req, res) => {
  const { code } = req.params;
  const session = pendingSessions.get(code);

  if (!session) {
    return res.json({ status: 'EXPIRED' });
  }

  if (session.status === 'APPROVED' && session.user) {
    const token = createToken(session.user);
    res.cookie('auth_token', token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });
    pendingSessions.delete(code);
    return res.json({ status: 'APPROVED', redirect: '/dashboard' });
  }

  res.json({ status: 'PENDING' });
});

// 4. Logout: GET /auth/logout
router.get('/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.redirect('/');
});

module.exports = {
  router,
  requireAuth,
  pendingSessions,
  createToken
};
