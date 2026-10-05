// The Shop page. Its words and products come from content/shop.txt.

const { warn, esc, fmt, rich, link, linkAttrs, button, photo, parseContent, first, section, sections, paras, eyebrow, WAVE, src } = require('./lib');

const where = 'content/shop.txt';

function page() {
  const doc = parseContent('shop.txt');

  const top = section(doc, 'Top of page');
  const hero = `    <section class="page-hero">
      <div class="wrap">
        ${eyebrow(top, 'Shop')}
        <h1>${fmt(first(top, 'headline', 'Shop'))}</h1>
${paras(top, '        ')}
      </div>
${WAVE}
    </section>`;

  const c = section(doc, 'Collection');
  const products = sections(doc, 'Product').map((e) => {
    const name = first(e, 'name');
    if (!name) { warn(`${where}: a [Product] has no "Name:" line, so it was left out.`); return ''; }
    const l = link(first(e, 'link'), `${where}, product "${name}"`);
    const img = photo(first(e, 'picture'), `${where}, product "${name}"`, '');
    const inner = `
            <div class="product-img">${img ? `<img src="assets/img/${src(img)}" alt="${esc(first(e, 'picture description', name))}" loading="lazy">` : ''}</div>
            <div class="product-body">
              <h3>${fmt(name)}</h3>
${first(e, 'design') ? `              <span class="design">${fmt(first(e, 'design'))}</span>\n` : ''}${first(e, 'price') ? `              <span class="price">${fmt(first(e, 'price'))}</span>\n` : ''}            </div>
          `;
    return l ? `          <a class="product reveal" ${linkAttrs(l)}>${inner}</a>` : `          <div class="product reveal">${inner}</div>`;
  }).filter(Boolean);
  const store = button(first(c, 'store button text'), first(c, 'store button link'), 'btn-river', where);
  const collection = `    <section class="section" style="padding-top: 2.5rem">
      <div class="wrap">
        <div class="narrow reveal">
          ${eyebrow(c)}
          <h2>${fmt(first(c, 'headline', 'Current collection'))}</h2>
${first(c, 'lead') ? `          <p class="lead">${rich(first(c, 'lead'))}</p>\n` : ''}        </div>
        <div class="products">
${products.join('\n')}
        </div>
${first(c, 'footnote') ? `        <p class="note reveal" style="margin-top: 1.5rem">${rich(first(c, 'footnote'))}</p>\n` : ''}${store ? `        <p class="reveal">${store}</p>\n` : ''}      </div>
    </section>`;

  const blocks = [hero, collection];
  const f = sections(doc, 'Feature')[0];
  if (f) {
    const img = photo(first(f, 'picture'), where, '');
    const buttons = [
      button(first(f, 'button text'), first(f, 'button link'), 'btn-outline btn-sm', where),
      button(first(f, 'second button text'), first(f, 'second button link'), 'btn-primary btn-sm', where),
    ].filter(Boolean);
    blocks.push(`    <section class="section section-paper">
      <div class="wrap split">
        <div class="reveal">
          ${eyebrow(f)}
          <h2>${fmt(first(f, 'headline'))}</h2>
${paras(f, '          ')}
${buttons.length ? `          <p style="display:flex; flex-wrap:wrap; gap:.7rem">\n${buttons.map((b) => '            ' + b).join('\n')}\n          </p>\n` : ''}        </div>
${img ? `        <div class="reveal" style="justify-self:center">
          <img src="assets/img/${src(img)}" alt="${esc(first(f, 'picture description'))}" loading="lazy" style="max-width: 340px; width: 100%">
        </div>\n` : ''}      </div>
    </section>`);
  }

  return `  <main id="main">\n${blocks.join('\n\n')}\n  </main>`;
}

module.exports = { page };
