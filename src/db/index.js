const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const config = require('../config');

// Ensure data directory exists
if (!fs.existsSync(config.DATA_DIR)) {
  fs.mkdirSync(config.DATA_DIR, { recursive: true });
}

// Ensure uploads directory exists
if (!fs.existsSync(config.UPLOAD_DIR)) {
  fs.mkdirSync(config.UPLOAD_DIR, { recursive: true });
}

const dbPath = path.join(config.DATA_DIR, 'taklifnoma.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Ma\'lumotlar bazasiga ulanishda xatolik:', err.message);
  } else {
    console.log('✅ SQLite ma\'lumotlar bazasiga muvaffaqiyatli ulandi:', dbPath);
  }
});

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function initDB() {
  await run(`PRAGMA journal_mode = WAL;`);

  // 1. Settings Table (Dynamic system configuration: card number, price, admin text, etc.)
  await run(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      description TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Default settings
  const defaultSettings = [
    ['card_number', '8600 0000 0000 0000', 'To\'lov uchun bank karta raqami'],
    ['card_holder', 'ADMINISTRATOR', 'Karta egasi ism-familiyasi'],
    ['invitation_price', '50000', 'Standart taklifnoma narxi (so\'m)'],
    ['admin_username', 'admin', 'Admin telegram username'],
    ['support_phone', '+998 90 000 00 00', 'Aloqa telefoni']
  ];

  for (const [k, v, desc] of defaultSettings) {
    await run(`INSERT OR IGNORE INTO system_settings (key, value, description) VALUES (?, ?, ?)`, [k, v, desc]);
  }

  // 2. Users Table
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id INTEGER UNIQUE NOT NULL,
      username TEXT,
      first_name TEXT,
      last_name TEXT,
      phone_number TEXT,
      state_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 3. Invitations Table
  await run(`
    CREATE TABLE IF NOT EXISTS invitations (
      id TEXT PRIMARY KEY, -- UUID
      user_id INTEGER NOT NULL,
      template_slug TEXT NOT NULL DEFAULT 'modular',
      theme_color TEXT NOT NULL DEFAULT 'emerald_gold',
      opening_style TEXT NOT NULL DEFAULT 'envelope_wax',
      particle_effect TEXT NOT NULL DEFAULT 'golden_dust',
      font_family TEXT DEFAULT 'great_vibes',
      event_type TEXT NOT NULL DEFAULT 'To''y',
      title TEXT,
      groom_name TEXT,
      bride_name TEXT,
      event_date TEXT, -- YYYY-MM-DD
      event_time TEXT, -- HH:MM
      venue_name TEXT,
      venue_address TEXT,
      yandex_map_url TEXT,
      google_map_url TEXT,
      custom_text TEXT,
      audio_url TEXT,
      photo_url TEXT,
      card_number TEXT,
      card_holder TEXT,
      is_paid INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 0,
      created_by_admin INTEGER DEFAULT 0,
      views_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(telegram_id)
    )
  `);

  // Safely add columns if older database exists
  const columnsToAdd = [
    ['opening_style', "TEXT DEFAULT 'envelope_wax'"],
    ['theme_color', "TEXT DEFAULT 'emerald_gold'"],
    ['particle_effect', "TEXT DEFAULT 'golden_dust'"],
    ['font_family', "TEXT DEFAULT 'great_vibes'"],
    ['card_number', 'TEXT'],
    ['card_holder', 'TEXT'],
    ['created_by_admin', 'INTEGER DEFAULT 0']
  ];

  for (const [col, typeDef] of columnsToAdd) {
    try { await run(`ALTER TABLE invitations ADD COLUMN ${col} ${typeDef}`); } catch(e){}
  }

  // 4. Orders / Payments Table
  await run(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      invitation_id TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      amount INTEGER NOT NULL DEFAULT 50000,
      receipt_file_id TEXT,
      receipt_file_path TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING',
      admin_note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (invitation_id) REFERENCES invitations(id),
      FOREIGN KEY (user_id) REFERENCES users(telegram_id)
    )
  `);

  // 5. Reviews / Sharhlar Table (Mijozlar qoldirgan sharhlar)
  await run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      invitation_id TEXT,
      author_name TEXT NOT NULL,
      rating INTEGER DEFAULT 5,
      comment TEXT NOT NULL,
      is_approved INTEGER DEFAULT 1,
      source TEXT DEFAULT 'web', -- 'web' or 'bot'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(telegram_id)
    )
  `);

  // 6. Wishes Table (Mehmonlar tilaklari)
  await run(`
    CREATE TABLE IF NOT EXISTS wishes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invitation_id TEXT NOT NULL,
      guest_name TEXT NOT NULL,
      attendance_status TEXT DEFAULT 'yes',
      guest_count INTEGER DEFAULT 1,
      wish_text TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (invitation_id) REFERENCES invitations(id)
    )
  `);

  // 7. Future Venues / To'yxonalar Table (Kelajak ekotizimi uchun)
  await run(`
    CREATE TABLE IF NOT EXISTS venues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      city TEXT DEFAULT 'Toshkent',
      district TEXT,
      address TEXT,
      capacity INTEGER,
      price_per_seat INTEGER,
      phone TEXT,
      yandex_map_url TEXT,
      photo_url TEXT,
      rating REAL DEFAULT 5.0,
      is_partner INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('✅ Barcha ma\'lumotlar bazasi jadvallari (Sozlamalar, Sharhlar, Taklifnomalar, To\'yxonalar) tayyorlandi.');
}

// Helpers for Settings
async function getSetting(key, defaultValue = '') {
  const row = await get(`SELECT value FROM system_settings WHERE key = ?`, [key]);
  return row ? row.value : defaultValue;
}

async function setSetting(key, value) {
  return await run(`
    INSERT INTO system_settings (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
  `, [key, value]);
}

async function getAllSettings() {
  const rows = await all(`SELECT * FROM system_settings`);
  const settings = {};
  rows.forEach(r => { settings[r.key] = r.value; });
  return settings;
}

module.exports = {
  db,
  run,
  get,
  all,
  initDB,
  getSetting,
  setSetting,
  getAllSettings
};
