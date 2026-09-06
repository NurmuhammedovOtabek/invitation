const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const invitationRoutes = require('./routes/invitation');
const authRoutes = require('./routes/auth').router;
const dashboardRoutes = require('./routes/dashboard');
const adminRoutes = require('./routes/admin');
const reviewsRoutes = require('./routes/reviews');

function createApp() {
  const app = express();

  // View Engine
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  // Middlewares
  app.use(cors());
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, '../../public')));

  // Mount Routes
  app.use('/auth', authRoutes);
  app.use(adminRoutes);     // /admin, /admin/create, /admin/settings
  app.use(reviewsRoutes);   // /api/reviews
  app.use(dashboardRoutes); // /dashboard & /my
  app.use('/', invitationRoutes);

  // Home redirect to Builder / Showcase
  app.get('/', (req, res) => {
    res.redirect('/builder');
  });

  // 404 Handler
  app.use((req, res) => {
    res.status(404).render('error', {
      title: 'Sahifa topilmadi (404)',
      message: 'Kechirasiz, siz qidirayotgan sahifa mavjud emas.'
    });
  });

  return app;
}

module.exports = {
  createApp,
};
