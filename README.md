# 💌 Online Taklifnomalar — Telegram Bot va Veb Platformasi (Node.js)

Ushbu platforma zamonaviy, animatsiyali, musiqali va interaktiv to'y/tadbir taklifnomalarini yaratuvchi hamda Telegram bot orqali avtomatlashtirilgan savdo va to'lov nazorati tizimiga ega to'liq biznes loyihasidir.

---

## 🌟 Tizim Imkoniyatlari

1. **Telegram Bot (Telegraf.js):**
   - 4 xil zamonaviy taklifnoma shablonlari (Classic Luxury, Modern Romantic, Royal Night, Sunnat To'yi).
   - Qadamma-qadam ma'lumot kiritish (Kelin-kuyov ismlari, sana, vaqt, to'yxona, Yandex lokatsiyasi, rasm, fon musiqasi va samimiy tilak matnlari).
   - Karta orqali to'lov (50,000 so'm) va to'lov chekini botga yuklash.
   - Admin tekshiruvi: Adminga rasm bilan birga `[✅ Tasdiqlash (Done)]` va `[❌ Rad etish]` tugmalari boradi.
   - Tasdiqlangach, bot mijozga avtomatik tarzda unikal havola (`https://domain.uz/i/uuid...`) va tabrik yuboradi.
   - Foydalanuvchining shaxsiy tarixi: "📂 Mening taklifnomalarim" menyusi.

2. **Veb-Taklifnoma Sahifalari (Express.js + EJS + TailwindCSS):**
   - 📱 100% Mobile-first zamonaviy Instagram-style dizayn.
   - 🎵 Fon musiqasi pleyeri (avtomatik musiqa va aylanuvchi disk tugmasi).
   - ⏳ Jonli to'y kunigacha hisoblagich (Kun, Soat, Daqiqa, Soniya).
   - 📍 Yandex Xarita va Google Xaritaga 1 ta bosishda marshrut ochish.
   - 📅 Google Calendar va Apple Calendar (.ics) integratsiyasi.
   - 💌 Mehmonlar tomonidan tashrifni tasdiqlash (RSVP) va online tilaklar doskasi.
   - 🔒 Har bir mijoz uchun alohida xavfsiz `UUID` havola.

---

## 🛠 O'rnatish va Ishga Tushirish (Lokal kompyuterda)

### 1. Kerakli paketlarni o'rnatish:
Terminalda ushbu loyiha papkasida quyidagi buyruqni bajaring:
```bash
npm install
```

### 2. `.env` faylini yaratish va to'ldirish:
`.env.example` faylidan nusxa olib, `.env` deb nomlang:
```bash
cp .env.example .env
```
Faylni oching va o'z ma'lumotlaringizni kiriting:
```env
BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ  # @BotFather dan olingan bot tokeni
ADMIN_TELEGRAM_ID=123456789                      # Sizning Telegram ID raqamingiz
ADMIN_USERNAME=tillo_dev                         # Telegram usernameingiz
CARD_NUMBER=8600 1234 5678 9012                 # Pul tushadigan karta raqami
CARD_HOLDER=FALONCHIYEV PISTONCHI                # Karta egasining ismi
INVITATION_PRICE_UZS=50000                       # Taklifnoma narxi
BASE_URL=http://localhost:3000                   # Domen (yoki localhost)
PORT=3000
```

### 3. Telegram Bot Token va Admin ID ni qanday olish mumkin?
1. Telegramda **[@BotFather](https://t.me/BotFather)** ga kiring, `/newbot` buyrug'ini bering, botga nom va username bering -> Sizga **Token** beradi.
2. O'z Telegram ID raqamingizni bilish uchun Telegramda **[@userinfobot](https://t.me/userinfobot)** ga kiring -> ID raqamingizni ko'rsatadi.

### 4. Dasturni ishga tushirish:
```bash
npm start
```
Browserda tekshirish: `http://localhost:3000`

---

## 🌐 Eng Arzon Serverga Joylashtirish (VPS ~$3/oy)

Ushbu Node.js + SQLite loyihasi minimal resurs talab qiladi (atigi 40-60 MB RAM).

### 1. Server tanlash:
* **Hetzner Cloud (CX22)** yoki **VDSina / Timeweb VPS** (oyiga ~$3 - $4).
* Operatsion tizim: **Ubuntu 22.04 / 24.04 LTS**.

### 2. Serverda ishga tushirish (PM2 orqali):
```bash
# Node.js va PM2 o'rnatish
sudo apt update && sudo apt install -y nodejs npm
sudo npm install -g pm2

# Loyiha papkasiga kirib:
npm install
pm2 start src/index.js --name "taklifnoma-bot"
pm2 startup
pm2 save
```

### 3. Bepul SSL va Domen ulash (Caddy orqali 1 daqiqada):
Caddy veb-serveri SSL sertifikatini (HTTPS) avtomatik va mutlaqo bepul olib beradi:
```bash
sudo apt install -y caddy
```
`/etc/caddy/Caddyfile` fayliga yozing:
```caddy
taklifnoma.uz {
    reverse_proxy localhost:3000
}
```
Caddy-ni qayta ishga tushiring:
```bash
sudo systemctl restart caddy
```

---

## 📁 Loyiha Strukturasi

```
video2/
├── package.json              # Paketlar va buyruqlar
├── .env.example              # Xavfsiz konfiguratsiya namunasi
├── README.md                 # To'liq texnik qo'llanma
├── INSTAGRAM_MARKETING_GUIDE.md # Instagram Reels va marketing rejasi
├── src/
│   ├── config.js             # Sozlamalar va .env yuklagich
│   ├── index.js              # Asosiy ishga tushirish fayli
│   ├── db/
│   │   └── index.js          # SQLite ma'lumotlar bazasi
│   ├── bot/
│   │   ├── index.js          # Telegraf bot boshqaruvchisi
│   │   ├── keyboards.js      # Telegram tugmalari
│   │   └── handlers/
│   │       ├── start.js      # /start va asosiy menyu
│   │       ├── create.js     # Taklifnoma yaratish FSM va chek yuklash
│   │       ├── myInvites.js  # Foydalanuvchi buyurtmalar tarixi
│   │       ├── templates.js  # Shablonlar ko'rgazmasi
│   │       └── admin.js      # Admin tasdiqlash (Done / Reject)
│   └── server/
│       ├── app.js            # Express server
│       ├── routes/
│       │   └── invitation.js # /i/:id, /preview/:slug, /i/:id/rsvp, /i/:id/calendar
│       └── views/
│           ├── templates/
│           │   ├── classic_luxury.ejs   # Oltin & Zangori klassik shablon
│           │   ├── modern_romantic.ejs  # Pushti romantik shablon
│           │   ├── royal_night.ejs      # Shohona moviy-oltin shablon
│           │   └── sunnat_toy.ejs       # Bolalar sunnat to'yi shabloni
│           ├── preview_demo.ejs         # Bosh sahifa
│           └── error.ejs                # Xatolik sahifasi
└── public/
    ├── css/animations.css    # Hashamatli animatsiyalar va stillar
    ├── js/invitation.js      # Musiqa, hisoblagich, RSVP AJAX
    ├── audio/                # Musiqa namunalari
    └── uploads/              # Yuklangan rasmlar
```

---

## 📈 Marketing va Savdo
Instagram orqali har kuni ko'plab buyurtmalar olish bo'yicha tayyor video ssenariylar va strategiya bilan [`INSTAGRAM_MARKETING_GUIDE.md`](file:///c:/Users/user/Desktop/video2/INSTAGRAM_MARKETING_GUIDE.md) faylida tanishishingiz mumkin.
