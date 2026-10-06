// The Mission page. Every word comes from content/mission.txt.

const { warn, esc, fmt, rich, photo, parseContent, first, every, parts, section, body, paras, eyebrow, WAVE, src } = require('./lib');

const where = 'content/mission.txt';

function page() {
  const doc = parseContent('mission.txt');
  const out = [];

  let e = section(doc, 'Top of page');
  out.push(`    <section class="page-hero">
      <div class="wrap">
        ${eyebrow(e, 'Our mission')}
        <h1>${fmt(first(e, 'headline', 'Our mission'))}</h1>
${paras(e, '        ')}
      </div>
${WAVE}
    </section>`);

  e = section(doc, 'What we believe');
  out.push(`    <section class="section" style="padding-top: 3rem">
      <div class="wrap narrow reveal">
        ${eyebrow(e, 'What we believe')}
        <h2>“${fmt(first(e, 'quote'))}”</h2>
${first(e, 'lead') ? `        <p>${rich(first(e, 'lead'))}</p>\n` : ''}${paras(e, '        ')}
      </div>
    </section>`);

  // The two rows of three boxes: who cows are, then what farming takes from them.
  for (const [name, cls] of [['Who they are', ' section-paper'], ['What farming takes', '']]) {
    e = section(doc, name);
    const cards = every(e, 'card').map((c) => {
      const [tag, title, text] = parts(c);
      return `          <div class="card reveal">
            ${tag ? `<span class="card-tag">${fmt(tag)}</span>` : ''}
            <h3>${fmt(title || '')}</h3>
            <p>${rich(text || '')}</p>
          </div>`;
    });
    out.push(`    <section class="section${cls}">
      <div class="wrap">
        <div class="narrow reveal">
          ${eyebrow(e, name)}
          <h2>${fmt(first(e, 'headline'))}</h2>
${first(e, 'lead') ? `          <p class="lead">${rich(first(e, 'lead'))}</p>\n` : ''}        </div>
        <div class="cards">
${cards.join('\n')}
        </div>
      </div>
    </section>`);
  }

  e = section(doc, 'A life, measured');
  const bars = every(e, 'bar').map((b) => {
    const [name, sub, years, shown, colour] = parts(b);
    const y = parseFloat(years);
    if (!name || !(y > 0)) { warn(`${where}: the bar "${b.slice(0, 50)}" needs a name and a number of years, so it was left out.`); return ''; }
    const cls = /^sanct|^free|^blue/i.test(colour || '') ? 'free' : 'farm';
    return `          <div class="life-row" role="listitem">
            <div class="life-label"><b>${fmt(name)}</b>${sub ? `<span>${fmt(sub)}</span>` : ''}</div>
            <div class="life-track"><i class="life-bar ${cls}" style="--y: ${Math.min(y, 30)}"></i><span class="life-value">${fmt(shown || years + ' years')}</span></div>
          </div>`;
  }).filter(Boolean);
  out.push(`    <section class="section section-paper">
      <div class="wrap">
        <div class="narrow reveal">
          ${eyebrow(e, 'A life, measured')}
          <h2>${fmt(first(e, 'headline'))}</h2>
${first(e, 'lead') ? `          <p class="lead">${rich(first(e, 'lead'))}</p>\n` : ''}        </div>
        <div class="life reveal" role="list" aria-label="Typical age at death, by the life a cow is born into">
${bars.join('\n')}
        </div>
${first(e, 'footnote') ? `        <p class="note reveal" style="margin-top: 1.4rem">${rich(first(e, 'footnote'))}</p>\n` : ''}      </div>
    </section>`);

  e = section(doc, 'The scale of it');
  out.push(`    <section class="section section-dark promise">
      <div class="wrap reveal">
        ${eyebrow(e, 'The scale of it')}
        <p class="big" style="max-width: 22ch">${fmt(first(e, 'statement'))}</p>
${paras(e, '        ', ' style="max-width: 40rem; margin-inline: auto"')}
      </div>
    </section>`);

  e = section(doc, 'Where we come from');
  const img = photo(first(e, 'photo'), where, 'allison-selfie.jpg');
  out.push(`    <section class="section section-paper">
      <div class="wrap split">
        <div class="reveal">
          <img src="assets/img/${src(img)}" alt="${esc(first(e, 'photo description', 'Allison with one of the cows'))}" loading="lazy" style="aspect-ratio: 4/4.4; object-fit: cover; width: 100%">
        </div>
        <div class="reveal">
          ${eyebrow(e, 'Where we come from')}
          <h2>${fmt(first(e, 'headline'))}</h2>
${body(e, '          ')}
          <p style="display:flex; flex-wrap:wrap; gap:.8rem">
            <a class="btn btn-river" href="index.html#story">Read Allison's story</a>
            <a class="btn btn-outline" href="index.html#herd">Meet the herd</a>
          </p>
        </div>
      </div>
    </section>`);

  e = section(doc, 'What you can do');
  out.push(`    <section class="follow-band cta-band">
      <div class="wrap reveal">
        <h2>${fmt(first(e, 'headline', 'How you can help'))}${first(e, 'text') ? ` <span>${fmt(first(e, 'text'))}</span>` : ''}</h2>
        <div class="cta-buttons">
          <a class="btn btn-light btn-sm" href="donate.html">Donate</a>
          <a class="btn btn-ghost btn-sm" href="index.html#follow">Follow the herd</a>
          <button class="btn btn-ghost btn-sm share-inline" type="button" data-share>Share Riverview</button>
        </div>
      </div>
    </section>`);

  return `  <main id="main">\n${out.join('\n\n')}\n  </main>`;
}

module.exports = { page };
