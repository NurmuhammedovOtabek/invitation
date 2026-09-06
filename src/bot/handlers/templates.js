const keyboards = require('../keyboards');
const config = require('../../config');

async function handleTemplatesShowcase(ctx) {
  const showcaseText = `
🎨 <b>Bizning Taklifnoma Shablonlarimiz</b>

Barcha shablonlarimiz mobil qurilmalarga 100% moslashgan, jonli animatsiyalar, fon musiqasi va xaritalar bilan jihozlangan:

👑 <b>1. Classic Luxury (Klassik Oltin)</b>
• Zangori-yashil va oltin ranglar uyg'unligi, oq gullar, to'kiluvchi oltin zarralar.
• <a href="${config.BASE_URL}/preview/classic_luxury">Jonli namunani ko'rish ↗</a>

🌸 <b>2. Modern Romantic (Nafis Pushti)</b>
• Zamonaviy minimalist dizayn, nozik pushti gullar, romantik shriftlar.
• <a href="${config.BASE_URL}/preview/modern_romantic">Jonli namunani ko'rish ↗</a>

🌌 <b>3. Royal Night (Shohona Tun)</b>
• To'q ko'k va yaltiroq oltin naqshlar, sharqona nafislik.
• <a href="${config.BASE_URL}/preview/royal_night">Jonli namunani ko'rish ↗</a>

🎉 <b>4. Sunnat To'yi (Bolalar uchun)</b>
• Moviy-feruza ranglar, quvnoq animatsiyalar, tojbop dizayn.
• <a href="${config.BASE_URL}/preview/sunnat_toy">Jonli namunani ko'rish ↗</a>

<i>Yangi taklifnoma yaratish uchun pastdagi tugmani bosing:</i>
  `;

  return ctx.replyWithHTML(showcaseText, keyboards.templateKeyboard());
}

module.exports = {
  handleTemplatesShowcase,
};
