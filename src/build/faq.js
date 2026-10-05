// The FAQ page. Questions and answers come from content/faq.txt.

const { warn, esc, fmt, rich, button, parseContent, first, every, section, sections, paras, eyebrow, WAVE } = require('./lib');
const shared = require('./shared');

const where = 'content/faq.txt';

function page() {
  const doc = parseContent('faq.txt');
  const top = section(doc, 'Top of page');

  // Walk the file in order: a [Group] starts a new heading, each [Question] joins the group above it.
  const groups = [];
  let current = null;
  for (const s of doc.sections) {
    if (/^group$/i.test(s.name)) {
      current = { title: first(s.entries, 'title'), items: [] };
      groups.push(current);
    } else if (/^question$/i.test(s.name)) {
      const q = first(s.entries, 'question');
      const answers = every(s.entries, 'answer');
      if (!q || !answers.length) { warn(`${where}: a [Question] needs both a "Question:" and an "Answer:" line, so it was left out${q ? ` ("${q.slice(0, 40)}")` : ''}.`); continue; }
      if (!current) { current = { title: '', items: [] }; groups.push(current); }
      current.items.push({
        q,
        answers,
        btn: button(first(s.entries, 'button text'), first(s.entries, 'button link'), 'btn-river btn-sm', `${where}, question "${q.slice(0, 40)}"`),
      });
    } else if (!/^(top of page|still have a question)$/i.test(s.name)) {
      warn(`${where}: the section [${s.name}] is not one this page knows ([Group] or [Question]), so it was skipped.`);
    }
  }
  const filled = groups.filter((g) => g.items.length);

  const hero = `    <section class="page-hero">
      <div class="wrap">
        ${eyebrow(top, 'Questions and answers')}
        <h1>${fmt(first(top, 'headline', 'Frequently asked questions'))}</h1>
${paras(top, '        ')}
      </div>
${WAVE}
    </section>`;

  const list = `    <section class="section" style="padding-top: 2.5rem">
      <div class="wrap narrow">
${filled.map((g) => `${g.title ? `        <h2 class="faq-group">${fmt(g.title)}</h2>\n` : ''}        <div class="faq">
${g.items.map((it) => `          <details class="faq-item">
            <summary>${fmt(it.q)}</summary>
            <div class="faq-answer">
${it.answers.map((a) => `              <p>${rich(a)}</p>`).join('\n')}
${it.btn ? `              <p>${it.btn}</p>\n` : ''}            </div>
          </details>`).join('\n')}
        </div>`).join('\n\n')}
      </div>
    </section>`;

  const more = sections(doc, 'Still have a question')[0];
  const closing = more ? `    <section class="section section-paper" style="padding-top: 3rem; padding-bottom: 3rem">
      <div class="wrap narrow center">
        <h2 style="font-size: clamp(1.5rem, 3vw, 2rem)">${fmt(first(more, 'headline', 'Still have a question?'))}</h2>
${paras(more, '        ')}
        <p style="display:flex; flex-wrap:wrap; gap:.8rem; justify-content:center; margin:0">
${shared.email ? `          <a class="btn btn-river" href="mailto:${esc(shared.email)}">Email ${esc(shared.email)}</a>\n` : ''}          <a class="btn btn-outline" href="donate.html">Donate</a>
        </p>
      </div>
    </section>` : '';

  // The same questions in the form search engines read.
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: filled.flatMap((g) => g.items).map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.answers.join(' ').replace(/\*/g, '') },
    })),
  };
  const jsonLd = `  <script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;

  return `  <main id="main">\n${[hero, list, closing].filter(Boolean).join('\n\n')}\n  </main>\n${jsonLd}`;
}

module.exports = { page };
