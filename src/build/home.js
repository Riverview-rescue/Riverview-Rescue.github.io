// The home page, top to bottom. Each part reads its own file in content/.

const fs = require('fs');
const path = require('path');
const { ROOT, warn, esc, fmt, rich, link, linkAttrs, button, photo, parseContent, first, every, parts, sections, body, paras, eyebrow, WAVE, src, findFile } = require('./lib');
const shared = require('./shared');

// ---------------------------------------------------------------- banner and numbers (home-banner.txt)

function banner() {
  const doc = parseContent('home-banner.txt');
  const e = doc.top;
  const where = 'content/home-banner.txt';
  const img = photo(first(e, 'photo'), where, 'hero-cow.jpg');
  const badgeNumber = first(e, 'badge number');
  const buttons = [
    button(first(e, 'button text'), first(e, 'button link'), 'btn-primary', where),
    button(first(e, 'second button text'), first(e, 'second button link'), 'btn-ghost', where),
  ].filter(Boolean);
  const numbers = sections(doc, 'Numbers').flatMap((s) => every(s, 'number')).map(parts).filter((p) => p[0]).slice(0, 4);
  const stats = numbers.length ? `

    <section aria-label="Riverview Rescue at a glance">
      <div class="wrap stats" style="--n: ${numbers.length}; --nm: ${numbers.length === 4 ? 2 : numbers.length}">
${numbers.map(([n, label]) => `        <div class="stat reveal"><b>${fmt(n)}</b><span>${fmt(label || '')}</span></div>`).join('\n')}
      </div>
    </section>` : '';

  return `    <section class="hero">
      <div class="wrap hero-inner">
        <div>
          ${eyebrow(e)}
          <h1 class="hero-title">${fmt(first(e, 'headline', 'Riverview Rescue and Sanctuary'))}</h1>
${paras(e, '          ')}
${buttons.length ? `          <div class="hero-cta">\n${buttons.map((b) => '            ' + b).join('\n')}\n          </div>\n` : ''}        </div>
        <div class="hero-photo">
          <img src="assets/img/${src(img)}" alt="${esc(first(e, 'photo description', 'A rescued cow at Riverview'))}" fetchpriority="high">
${badgeNumber ? `          <div class="hero-badge"><strong>${fmt(badgeNumber)}</strong> ${fmt(first(e, 'badge text'))}</div>\n` : ''}        </div>
      </div>
${WAVE}
    </section>${stats}`;
}

// ---------------------------------------------------------------- our story (our-story.txt)

function story() {
  const doc = parseContent('our-story.txt');
  const where = 'content/our-story.txt';
  const intro = doc.top;
  const out = [];
  let group = [];
  let chapterCount = 0;
  let groupCount = 0;

  const flush = () => {
    if (!group.length && groupCount > 0) return;
    const first_ = groupCount === 0;
    const head = first_ ? `        <div class="narrow center reveal">
          ${eyebrow(intro, 'Our story')}
          <h2>${fmt(first(intro, 'headline', 'Our story'))}</h2>
${first(intro, 'lead') ? `          <p class="lead">${rich(first(intro, 'lead'))}</p>\n` : ''}        </div>
` : '';
    out.push(`    <section class="section${groupCount % 2 ? ' section-paper' : ''}"${first_ ? ' id="story"' : ''}>
      <div class="wrap">
${head}${group.join('\n')}
      </div>
    </section>`);
    group = [];
    groupCount++;
  };

  for (const s of doc.sections) {
    const e = s.entries;
    if (/^chapter$/i.test(s.name)) {
      const img = photo(first(e, 'photo'), where, '');
      const square = /square/i.test(first(e, 'photo shape'));
      const flip = chapterCount % 2 === 1;
      const btn = button(first(e, 'button text'), first(e, 'button link'), 'btn-river', where);
      const gap = groupCount === 0 && group.length === 0 ? ' style="margin-top: clamp(3rem, 7vw, 5rem)"' : '';
      group.push(`        <div class="chapter${flip ? ' flip' : ''}${img ? '' : ' no-photo'} reveal"${gap}>
${img ? `          <div class="chapter-media${square ? ' wide' : ''}">
            <img src="assets/img/${src(img)}" alt="${esc(first(e, 'photo description'))}" loading="lazy">
          </div>\n` : ''}          <div>
${first(e, 'chapter name') ? `            <span class="chapter-num">${fmt(first(e, 'chapter name'))}</span>\n` : ''}            <h3>${fmt(first(e, 'title'))}</h3>
${body(e, '            ')}
${btn ? `            ${btn}\n` : ''}          </div>
        </div>`);
      chapterCount++;
    } else if (/^big quote$/i.test(s.name)) {
      flush();
      const btn = button(first(e, 'button text'), first(e, 'button link'), 'btn-ghost', where);
      out.push(`    <section class="section section-dark promise">
      <div class="wrap reveal">
        ${eyebrow(e)}
        <p class="big">“${fmt(first(e, 'quote'))}”</p>
${first(e, 'signed') ? `        <p class="signature" style="color: var(--river)">— ${fmt(first(e, 'signed'))}</p>\n` : ''}${btn ? `        <p style="margin-top: 2rem">${btn}</p>\n` : ''}      </div>
    </section>`);
    } else {
      warn(`${where}: the section [${s.name}] is not one this page knows ([Chapter] or [Big quote]), so it was skipped.`);
    }
  }
  if (group.length || groupCount === 0) flush();
  return out.join('\n\n');
}

// ---------------------------------------------------------------- the herd (the-herd.txt)

// How wide each photo is on a 12-column grid: on computers (d) and on phones (m), with its shape.
function tileShapes(n) {
  const shapes = [];
  for (let i = 0; i < n; i++) {
    if (n === 1) { shapes.push({ d: 12, ar: '16 / 9', m: 12, arm: '4 / 3.6' }); continue; }
    if (i === 0) { shapes.push({ d: 5, ar: '4 / 5', m: 12, arm: '4 / 3.6' }); continue; }
    if (i === 1) { shapes.push({ d: 7, ar: '7 / 5.6', m: 12, arm: '4 / 3.6' }); continue; }
    const rest = n - 2;
    const k = i - 2;
    const lastRowSize = rest % 3 || 3;
    const inLastRow = k >= rest - lastRowSize;
    const d = inLastRow && lastRowSize === 1 ? 12 : inLastRow && lastRowSize === 2 ? 6 : 4;
    const oddOneOut = rest % 2 === 1 && k === rest - 1;
    shapes.push({ d, ar: d === 12 ? '12 / 4.5' : d === 6 ? '3 / 2' : '1', m: oddOneOut ? 12 : 6, arm: oddOneOut ? '4 / 3' : '1' });
  }
  return shapes;
}

function herd() {
  const doc = parseContent('the-herd.txt');
  const where = 'content/the-herd.txt';
  const top = doc.top;
  const bigNumber = first(top, 'big number');

  const photos = sections(doc, 'Photo').map((e) => ({
    img: photo(first(e, 'picture'), where, ''),
    title: first(e, 'title'),
    caption: first(e, 'caption'),
    alt: first(e, 'description', first(e, 'title')),
  })).filter((p) => p.img);
  const shapes = tileShapes(photos.length);
  const grid = photos.length ? `
        <div class="herd">
${photos.map((p, i) => `          <figure class="reveal" style="--d: ${shapes[i].d}; --ar: ${shapes[i].ar}; --m: ${shapes[i].m}; --arm: ${shapes[i].arm}">
            <img src="assets/img/${src(p.img)}" alt="${esc(p.alt)}" loading="lazy">
${p.title || p.caption ? `            <figcaption>${p.title ? `<b>${fmt(p.title)}</b>` : ''}${fmt(p.caption)}</figcaption>\n` : ''}          </figure>`).join('\n')}
        </div>
` : '';

  const notes = [];
  for (const s of doc.sections) {
    const e = s.entries;
    if (/^featured animal$/i.test(s.name)) {
      const img = photo(first(e, 'picture'), where, '');
      const buttons = [
        button(first(e, 'button text'), first(e, 'button link'), 'btn-outline btn-sm', where),
        button(first(e, 'second button text'), first(e, 'second button link'), 'btn-river btn-sm', where),
      ].filter(Boolean);
      notes.push(`        <div class="jeffrey${img ? '' : ' no-photo'} reveal">
${img ? `          <img src="assets/img/${src(img)}" alt="${esc(first(e, 'picture description'))}" loading="lazy">\n` : ''}          <div>
${first(e, 'tag') ? `            <span class="card-tag wheat">${fmt(first(e, 'tag'))}</span>\n` : ''}            <h3>${fmt(first(e, 'name'))}</h3>
${paras(e, '            ')}
${buttons.length ? `            <p style="display:flex; flex-wrap:wrap; gap:.7rem; margin:0">\n${buttons.map((b) => '              ' + b).join('\n')}\n            </p>\n` : ''}          </div>
        </div>`);
    } else if (/^in loving memory$/i.test(s.name)) {
      notes.push(`        <div class="memorial reveal">
          <span class="card-tag">${fmt(first(e, 'tag', 'In loving memory'))}</span>
          <h3>${fmt(first(e, 'name'))}</h3>
${paras(e, '          ')}
        </div>`);
    } else if (!/^photo$/i.test(s.name)) {
      warn(`${where}: the section [${s.name}] is not one this page knows ([Photo], [Featured animal] or [In loving memory]), so it was skipped.`);
    }
  }

  return `    <section class="section" id="herd">
      <div class="wrap">
        <div class="herd-head reveal">
${bigNumber ? `          <div class="herd-count"><b>${fmt(bigNumber)}</b><span>${fmt(first(top, 'big number label'))}</span></div>\n` : ''}          <div>
            ${eyebrow(top, 'Meet the herd')}
            <h2>${fmt(first(top, 'headline', 'Meet the herd'))}</h2>
${first(top, 'lead') ? `            <p class="lead">${rich(first(top, 'lead'))}</p>\n` : ''}          </div>
        </div>
${grid}${notes.length ? `
        <div class="herd-notes">
${notes.join('\n')}
        </div>
` : ''}      </div>
    </section>`;
}

// ---------------------------------------------------------------- urgent needs (urgent-needs.txt)

function urgentNeeds() {
  const doc = parseContent('urgent-needs.txt');
  const where = 'content/urgent-needs.txt';
  const e = doc.top.concat(...doc.sections.map((s) => s.entries));
  const needs = every(e, 'need').map((n) => {
    const [what, detail] = parts(n);
    return `            <li><b>${fmt(what)}</b>${detail ? `<span>${fmt(detail)}</span>` : ''}</li>`;
  });
  const quote = first(e, 'quote');
  const closing = first(e, 'closing line');
  const give = button(first(e, 'button text', 'Give now'), first(e, 'button link'), 'btn-primary', where);
  const img = photo(first(e, 'photo'), where, 'prairie-cow.jpg');
  return `    <section class="section section-dark" id="needs">
      <div class="wrap split">
        <div class="reveal">
          ${eyebrow(e, 'Urgent needs')}
          <h2>${fmt(first(e, 'headline', 'How you can help right now'))}</h2>
${paras(e, '          ')}
${quote ? `          <blockquote class="pull" style="color:#fff">“${fmt(quote)}”</blockquote>\n` : ''}${needs.length ? `          <ul class="needs">\n${needs.join('\n')}\n          </ul>\n` : ''}${closing ? `          <p>${rich(closing)}</p>\n` : ''}          <p style="display:flex; flex-wrap:wrap; gap:.8rem">
${give ? `            ${give}\n` : ''}            <a class="btn btn-ghost" href="donate.html">All ways to give</a>
          </p>
        </div>
        <div class="reveal">
          <img src="assets/img/${src(img)}" alt="${esc(first(e, 'photo description', 'A rescued cow at Riverview'))}" loading="lazy">
        </div>
      </div>
    </section>`;
}

// ---------------------------------------------------------------- sponsors (sponsors.txt)

function initials(name) {
  const words = name.replace(/[^A-Za-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w && !/^(the|and|of|for|a)$/i.test(w));
  return (words.slice(0, 2).map((w) => w[0]).join('') || '?').toUpperCase();
}

function sponsors() {
  const doc = parseContent('sponsors.txt');
  const where = 'content/sponsors.txt';
  const tiles = [];
  for (const e of sections(doc, 'Sponsor')) {
    const name = first(e, 'name');
    if (!name) { warn(`${where}: a [Sponsor] has no "Name:" line, so it was left out.`); continue; }
    const l = link(first(e, 'website'), `${where}, sponsor "${name}"`);
    const note = first(e, 'note');
    const logoName = first(e, 'logo');
    const logoFile = findFile(['assets', 'img', 'sponsors'], logoName);
    const hasLogo = Boolean(logoFile);
    if (logoName && !hasLogo) warn(`${where}: the logo "${logoName}" for "${name}" is not in assets/img/sponsors/, so initials are shown.`);
    const mark = hasLogo
      ? `<span class="sponsor-logo"><img src="assets/img/sponsors/${src(logoFile)}" alt="" loading="lazy"></span>`
      : `<span class="sponsor-mark" aria-hidden="true">${esc(initials(name))}</span>`;
    const inner = `${mark}<b>${fmt(name)}</b>${note ? `<span class="sponsor-note">${fmt(note)}</span>` : ''}`;
    if (!l) warn(`${where}: "${name}" has no "Website:" line, so its box is not clickable.`);
    tiles.push(l
      ? `          <a class="sponsor reveal" href="${esc(l.href)}" target="_blank" rel="noopener sponsored">${inner}<span class="sponsor-go">Visit website</span></a>`
      : `          <div class="sponsor reveal">${inner}</div>`);
  }
  const email = first(doc.top, 'contact email', shared.email);
  const invite = first(doc.top, 'invitation');
  if (invite && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    tiles.push(`          <a class="sponsor sponsor-invite reveal" href="mailto:${esc(email)}?subject=${encodeURIComponent('Sponsoring Riverview Rescue and Sanctuary')}"><span class="sponsor-mark" aria-hidden="true">+</span><b>${fmt(invite)}</b><span class="sponsor-note">Email ${esc(email)}</span></a>`);
  }
  if (!tiles.length) return '';
  const intro = first(doc.top, 'intro');
  return `    <section class="section section-paper" id="sponsors">
      <div class="wrap">
        <div class="narrow center reveal">
          ${eyebrow(doc.top, 'Our sponsors')}
          <h2>${fmt(first(doc.top, 'heading', 'Thank you to our sponsors'))}</h2>
${intro ? `          <p class="lead">${rich(intro)}</p>\n` : ''}        </div>
        <div class="sponsors">
${tiles.join('\n')}
        </div>
      </div>
    </section>`;
}

function page() {
  const blocks = [banner(), story(), herd(), urgentNeeds(), sponsors(), shared.followBand('follow')].filter(Boolean);
  return `  <main id="main">\n${blocks.join('\n\n')}\n  </main>`;
}

module.exports = { page };
