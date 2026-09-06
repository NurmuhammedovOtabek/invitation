const express = require('express');
const router = express.Router();
const ics = require('ics');
const db = require('../../db');
const config = require('../../config');

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

// 1. Interactive Visual Web Builder: /builder & /customizer
router.get(['/builder', '/customizer'], (req, res) => {
  res.render('builder', {
    baseUrl: config.BASE_URL
  });
});

// 2. Dynamic Live Modular Preview: /preview/modular
router.get('/preview/modular', (req, res) => {
  const { opening, theme, particle, font, names, date, time, venue, address, timeline, dresscode, toyona, card } = req.query;

  const eventDate = date || '2026-10-25';

  const demoData = {
    id: 'demo-modular',
    template_slug: 'modular',
    opening_style: opening || 'envelope_wax',
    theme_color: theme || '#0c3327',
    particle_effect: particle || 'golden_dust',
    font_family: font || 'great_vibes',
    event_type: 'Nikoh To\'yi',
    groom_name: names || 'Alisher & Madina',
    bride_name: '',
    event_date: eventDate,
    formattedDate: formatDate(eventDate),
    event_time: time || '18:00',
    venue_name: venue || '"Yakkasaroy" To\'yxonasi',
    venue_address: address || 'Toshkent shahri, Shota Rustaveli ko\'chasi 54-uy',
    yandex_map_url: 'https://yandex.com/maps/?text=Yakkasaroy+toyxonasi',
    google_map_url: 'https://maps.google.com/?q=Yakkasaroy+Tashkent',
    custom_text: 'Sizni va aziz oila a\'zolaringizni farzandlarimizning baxt to\'yiga lutfan taklif etamiz! Sizning tashrifingiz biz uchun cheksiz sharafdir.',
    audio_url: '/audio/romantic_sample.mp3',
    photo_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    show_timeline: timeline !== '0',
    show_dresscode: dresscode !== '0',
    show_toyona: toyona !== '0',
    card_number: card || '8600 1234 5678 9012',
    card_holder: 'Alisher & Madina',
    is_active: 1,
    views_count: 142
  };

  res.render('templates/modular_invitation', {
    invitation: demoData,
    baseUrl: config.BASE_URL,
    isPreview: true,
  });
});

// 3. Dynamic Live Invitation Route: /i/:id
router.get('/i/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const invitation = await db.get(`SELECT * FROM invitations WHERE id = ?`, [id]);

    if (!invitation) {
      return res.status(404).render('error', {
        title: 'Taklifnoma topilmadi',
        message: 'Kechirasiz, bunday taklifnoma mavjud emas yoki o\'chirilgan.'
      });
    }

    await db.run(`UPDATE invitations SET views_count = views_count + 1 WHERE id = ?`, [id]);

    const templateSlug = invitation.template_slug || 'modular';
    const viewName = templateSlug === 'modular' ? 'templates/modular_invitation' : `templates/${templateSlug}`;

    res.render(viewName, {
      invitation: {
        ...invitation,
        formattedDate: formatDate(invitation.event_date),
        show_timeline: true,
        show_dresscode: true,
        show_toyona: !!invitation.card_number,
      },
      baseUrl: config.BASE_URL,
      isPreview: false,
    });
  } catch (err) {
    console.error('Error rendering invitation:', err);
    res.status(500).render('error', {
      title: 'Xatolik',
      message: 'Sahifani yuklashda texnik xatolik yuz berdi.'
    });
  }
});

// 4. Calendar .ics Download Route
router.get('/i/:id/calendar', async (req, res) => {
  const { id } = req.params;

  try {
    const inv = await db.get(`SELECT * FROM invitations WHERE id = ?`, [id]);
    if (!inv) return res.status(404).send('Not found');

    const dateParts = (inv.event_date || '2026-10-15').split('-').map(Number);
    const timeParts = (inv.event_time || '18:00').split(':').map(Number);

    const event = {
      start: [dateParts[0] || 2026, dateParts[1] || 10, dateParts[2] || 15, timeParts[0] || 18, timeParts[1] || 0],
      duration: { hours: 4, minutes: 0 },
      title: `${inv.groom_name} - ${inv.event_type}`,
      description: inv.custom_text || 'Sizni to\'yimizga lutfan taklif etamiz!',
      location: `${inv.venue_name || ''}, ${inv.venue_address || ''}`,
      url: `${config.BASE_URL}/i/${inv.id}`,
      status: 'CONFIRMED',
      busyStatus: 'BUSY'
    };

    ics.createEvent(event, (error, value) => {
      if (error) {
        return res.status(500).send('Calendar creation error');
      }
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="taklifnoma-${id}.ics"`);
      res.send(value);
    });
  } catch (err) {
    res.status(500).send('Error');
  }
});

module.exports = router;
