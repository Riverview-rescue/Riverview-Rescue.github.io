// The Donate page. Its words come from content/donate.txt.

const { esc, fmt, rich, button, photo, parseContent, first, every, parts, section, sections, body, eyebrow, WAVE, src } = require('./lib');
const shared = require('./shared');

const where = 'content/donate.txt';

// What the "Copy" button copies: phone numbers lose their dashes, usernames lose the @.
const copyValue = (code) => /^[\d\s().+-]+$/.test(code) ? code.replace(/\D/g, '') : code.replace(/^@/, '');

function paymentCard(e) {
  const name = first(e, 'name');
  if (!name) return '';
  const tag = first(e, 'tag');
  const text = first(e, 'text');
  const code = first(e, 'code');
  const note = first(e, 'note');
  const qr = photo(first(e, 'qr picture'), `${where}, payment "${name}"`, '');
  const buttons = [
    button(first(e, 'button text'), first(e, 'button link'), 'btn-river btn-sm', `${where}, payment "${name}"`),
    button(first(e, 'second button text'), first(e, 'second button link'), 'btn-river btn-sm', `${where}, payment "${name}"`),
  ].filter(Boolean);

  const codeLine = code ? `<p class="pay-line"><span class="handle">${esc(code)}</span> <button class="copy-btn" type="button" data-copy="${esc(copyValue(code))}" aria-label="Copy ${esc(code)}">Copy</button></p>` : '';
  const noteLine = note ? `<p class="pay-desc">${rich(note)}</p>` : '';
  const details = qr
    ? `            <div class="pay-venmo-body">
              <div>
                ${[codeLine, noteLine].filter(Boolean).join('\n                ')}
              </div>
              <img src="assets/img/${src(qr)}" alt="QR code for ${esc(name)}${code ? ', ' + esc(code) : ''}" width="92" height="92">
            </div>\n`
    : [codeLine, noteLine].filter(Boolean).map((l) => `            ${l}\n`).join('');

  return `          <div class="pay">
            <div class="pay-head"><h3>${fmt(name)}</h3>${tag ? `<span class="card-tag">${fmt(tag)}</span>` : ''}</div>
${text ? `            <p class="pay-desc">${rich(text)}</p>\n` : ''}${details}${buttons.length === 1 ? `            ${buttons[0]}\n` : ''}${buttons.length > 1 ? `            <p class="pay-actions">\n${buttons.map((b) => '              ' + b).join('\n')}\n            </p>\n` : ''}          </div>`;
}

function page() {
  const doc = parseContent('donate.txt');

  const top = section(doc, 'Top of page');
  const highlight = first(top, 'highlight');
  const hero = `    <section class="page-hero compact">
      <div class="wrap">
        <h1>${fmt(first(top, 'headline', 'Donate'))}</h1>
${every(top, 'text').map((t) => `        <p>${rich(t)}</p>`).join('\n')}
${highlight ? `        <p class="hero-fact">${rich(highlight)}</p>\n` : ''}      </div>
${WAVE}
    </section>`;

  const cards = sections(doc, 'Payment').map(paymentCard).filter(Boolean);
  const tax = sections(doc, 'Tax note')[0] || [];
  const taxText = first(tax, 'text');
  const taxBold = first(tax, 'bold start');
  const payments = `    <section class="section" style="padding-top: 0.5rem">
      <div class="wrap">
        <div class="pays">
${cards.join('\n\n')}
        </div>
${taxText || taxBold ? `
        <p class="tax-note">${taxBold ? `<strong>${fmt(taxBold)}</strong> ` : ''}${rich(taxText)}</p>\n` : ''}      </div>
    </section>`;

  const g = section(doc, 'Where your gift goes');
  const img = photo(first(g, 'photo'), where, 'calf-coat.jpg');
  const ways = every(g, 'way').map(parts).filter((p) => p[0]);
  const gift = `    <section class="section section-paper">
      <div class="wrap split">
        <div class="reveal">
          <img src="assets/img/${src(img)}" alt="${esc(first(g, 'photo description', 'A rescued animal at Riverview'))}" loading="lazy" style="aspect-ratio: 4/4.4; object-fit: cover; width: 100%">
        </div>
        <div class="reveal">
          ${eyebrow(g)}
          <h2>${fmt(first(g, 'headline'))}</h2>
${body(g, '          ')}
${ways.length ? `          <h3 class="more-ways-title">${fmt(first(g, 'more ways heading', 'More ways to help'))}</h3>
          <ul class="more-ways">
${ways.map(([title, text]) => `            <li><strong>${fmt(title)}</strong>${text ? ' ' + rich(text) : ''}</li>`).join('\n')}
          </ul>\n` : ''}        </div>
      </div>
    </section>`;

  const band = sections(doc, 'Share band')[0] || [];
  const follow = shared.followBand('', first(band, 'headline'), first(band, 'text'));

  return `  <main id="main">\n${[hero, payments, gift, follow].join('\n\n')}\n  </main>`;
}

module.exports = { page };
