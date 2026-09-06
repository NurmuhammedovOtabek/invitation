document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initCountdown();
  initOpeningExperience();
  initLanguageSwitcher();
});

// Particles Generator
function initParticles() {
  const container = document.getElementById('particle-container');
  if (!container) return;

  const effectType = container.getAttribute('data-effect') || 'golden_dust';
  if (effectType === 'none') return;

  const count = 28;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');

    if (effectType === 'rose_petals') {
      el.classList.add('petal-rose');
      const size = Math.random() * 14 + 8;
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.left = `${Math.random() * 100}%`;
      el.style.animationDuration = `${Math.random() * 6 + 5}s`;
      el.style.animationDelay = `${Math.random() * 5}s`;
    } else if (effectType === 'sparkling_stars') {
      el.classList.add('particle-star');
      const size = Math.random() * 4 + 2;
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.left = `${Math.random() * 100}%`;
      el.style.top = `${Math.random() * 100}%`;
      el.style.animationDelay = `${Math.random() * 3}s`;
    } else {
      el.classList.add('petal-gold');
      const size = Math.random() * 10 + 5;
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.left = `${Math.random() * 100}%`;
      el.style.animationDuration = `${Math.random() * 6 + 5}s`;
      el.style.animationDelay = `${Math.random() * 5}s`;
    }

    container.appendChild(el);
  }
}

// Countdown Timer
function initCountdown() {
  const countdownEl = document.getElementById('countdown-data');
  if (!countdownEl) return;

  const eventDateStr = countdownEl.getAttribute('data-date');
  const eventTimeStr = countdownEl.getAttribute('data-time') || '18:00';

  if (!eventDateStr) return;

  const targetDate = new Date(`${eventDateStr}T${eventTimeStr}:00`).getTime();

  function update() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance < 0) {
      document.getElementById('days').innerText = '00';
      document.getElementById('hours').innerText = '00';
      document.getElementById('minutes').innerText = '00';
      document.getElementById('seconds').innerText = '00';
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const pad = (n) => String(n).padStart(2, '0');

    const elDays = document.getElementById('days');
    const elHours = document.getElementById('hours');
    const elMinutes = document.getElementById('minutes');
    const elSeconds = document.getElementById('seconds');

    if (elDays) elDays.innerText = pad(days);
    if (elHours) elHours.innerText = pad(hours);
    if (elMinutes) elMinutes.innerText = pad(minutes);
    if (elSeconds) elSeconds.innerText = pad(seconds);
  }

  update();
  setInterval(update, 1000);
}

// Interactive Opening & Audio Player
function initOpeningExperience() {
  const audio = document.getElementById('bg-audio');
  const btn = document.getElementById('music-toggle-btn');
  const eq = document.getElementById('music-equalizer');
  const overlay = document.getElementById('open-overlay-modal');

  let isPlaying = false;

  // Add paused icon if not already present
  let iconPaused = document.getElementById('music-paused-icon');
  if (btn && !iconPaused) {
    iconPaused = document.createElement('span');
    iconPaused.id = 'music-paused-icon';
    iconPaused.innerHTML = '🔇';
    iconPaused.style.fontSize = '18px';
    iconPaused.style.display = 'none';
    btn.appendChild(iconPaused);
  }

  function showMusicButton() {
    if (btn) btn.classList.add('visible');
  }

  function playAudio() {
    if (!audio) return;
    audio.play().then(() => {
      isPlaying = true;
      if (btn) {
        btn.classList.add('playing');
        btn.classList.remove('paused');
      }
      if (eq) eq.style.display = 'flex';
      if (iconPaused) iconPaused.style.display = 'none';
    }).catch(e => {
      console.log('Audio autoplay:', e);
    });
  }

  function pauseAudio() {
    if (!audio) return;
    audio.pause();
    isPlaying = false;
    if (btn) {
      btn.classList.remove('playing');
      btn.classList.add('paused');
    }
    if (eq) eq.style.display = 'none';
    if (iconPaused) iconPaused.style.display = 'block';
  }

  if (btn) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isPlaying) pauseAudio();
      else playAudio();
    });
  }

  if (!overlay) {
    showMusicButton();
    return;
  }

  const openingStyle = overlay.getAttribute('data-opening-style') || 'envelope_wax';
  const envelope = document.getElementById('main-envelope');
  const giftBox = document.getElementById('main-giftbox');
  const curtains = document.getElementById('main-curtains');

  overlay.addEventListener('click', () => {
    playAudio();

    if (openingStyle === 'envelope_wax' && envelope) {
      envelope.classList.add('open');
      setTimeout(() => {
        fadeOutOverlay(overlay, showMusicButton);
      }, 1100);
    } else if (openingStyle === 'ribbon_gift' && giftBox) {
      giftBox.classList.add('open');
      setTimeout(() => {
        fadeOutOverlay(overlay, showMusicButton);
      }, 900);
    } else if (openingStyle === 'curtain_reveal' && curtains) {
      curtains.classList.add('curtains-open');
      setTimeout(() => {
        fadeOutOverlay(overlay, showMusicButton);
      }, 1200);
    } else {
      fadeOutOverlay(overlay, showMusicButton);
    }
  });
}

function fadeOutOverlay(overlay, callback) {
  overlay.style.opacity = '0';
  overlay.style.pointerEvents = 'none';
  setTimeout(() => {
    overlay.style.display = 'none';
    if (callback) callback();
  }, 500);
}

// Language Switcher (UZ / RU)
function initLanguageSwitcher() {
  const uzBtn = document.getElementById('lang-uz');
  const ruBtn = document.getElementById('lang-ru');
  if (!uzBtn || !ruBtn) return;

  uzBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    setLanguage('uz');
  });

  ruBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    setLanguage('ru');
  });
}

function setLanguage(lang) {
  const uzBtn = document.getElementById('lang-uz');
  const ruBtn = document.getElementById('lang-ru');

  if (lang === 'ru') {
    if (ruBtn) ruBtn.classList.add('active');
    if (uzBtn) uzBtn.classList.remove('active');
    document.querySelectorAll('[data-lang-uz]').forEach(el => {
      el.innerText = el.getAttribute('data-lang-ru') || el.innerText;
    });
  } else {
    if (uzBtn) uzBtn.classList.add('active');
    if (ruBtn) ruBtn.classList.remove('active');
    document.querySelectorAll('[data-lang-uz]').forEach(el => {
      el.innerText = el.getAttribute('data-lang-uz') || el.innerText;
    });
  }
}

// Copy Toyona Card Number
function copyCardNumber(cardNumber) {
  navigator.clipboard.writeText(cardNumber.replace(/\s+/g, '')).then(() => {
    showToast('💳 Karta raqami nusxalandi!');
  });
}

// Copy Invitation Link
function copyInvitationLink() {
  const url = window.location.href;
  navigator.clipboard.writeText(url).then(() => {
    showToast('✅ Taklifnoma havolasi nusxalandi!');
  });
}

function showToast(text) {
  let alertBox = document.getElementById('copy-toast');
  if (!alertBox) {
    alertBox = document.createElement('div');
    alertBox.id = 'copy-toast';
    alertBox.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-amber-500 text-slate-950 text-xs font-bold rounded-full shadow-lg opacity-0 transition-opacity duration-300 pointer-events-none z-50';
    document.body.appendChild(alertBox);
  }
  alertBox.innerText = text;
  alertBox.classList.remove('opacity-0');
  alertBox.classList.add('opacity-100');
  setTimeout(() => {
    alertBox.classList.remove('opacity-100');
    alertBox.classList.add('opacity-0');
  }, 2500);
}

// Guest Review Submission
async function submitGuestReview(e) {
  e.preventDefault();
  const authorInput = document.getElementById('review-author');
  const commentInput = document.getElementById('review-comment');
  const form = document.getElementById('review-form');

  if (!authorInput || !commentInput) return;

  const author_name = authorInput.value.trim();
  const comment = commentInput.value.trim();

  try {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author_name, comment, rating: 5 })
    });
    const data = await res.json();

    if (data.success) {
      showToast('🎉 Tilagingiz uchun katta rahmat!');
      authorInput.value = '';
      commentInput.value = '';

      // Append to list dynamically
      const listBox = document.getElementById('reviews-list-box');
      const hint = document.getElementById('empty-reviews-hint');
      if (hint) hint.remove();

      const newCard = document.createElement('div');
      newCard.className = 'p-3 rounded-xl bg-black/40 border border-slate-800 space-y-1';
      newCard.innerHTML = `
        <div class="flex items-center justify-between">
          <span class="font-bold text-xs text-amber-300">${author_name}</span>
          <span class="text-[10px] text-amber-400">★★★★★</span>
        </div>
        <p class="text-xs text-gray-300 italic">"${comment}"</p>
      `;
      listBox.prepend(newCard);
    } else {
      alert(data.error || 'Xatolik yuz berdi');
    }
  } catch (err) {
    console.error('Review submit error:', err);
  }
}

