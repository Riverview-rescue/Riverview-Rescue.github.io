// Parts that appear on every page: the preview notice, the footer, the social links and the "Follow" band.
// Their words come from content/site-wide.txt.

const { read, warn, esc, fmt, rich, link, parseContent, first, section, sections } = require('./lib');

const doc = parseContent('site-wide.txt');
const email = first(doc.top, 'email');

// Where the site lives, without a slash on the end. Used for link previews.
const siteUrl = (() => {
  const raw = first(doc.top, 'website address').replace(/\/+$/, '');
  if (/^https?:\/\/[^\s]+$/i.test(raw)) return raw;
  if (raw) warn(`content/site-wide.txt: "Website address: ${raw}" should start with https://, so link previews have no picture.`);
  return '';
})();
const hidden = !/^(no|n|false)$/i.test(first(doc.top, 'hide from search engines', 'yes'));

// Lines for the top of every page.
const robots = hidden ? '  <meta name="robots" content="noindex">\n' : '';
// Tells the browser to load nothing from other websites and run no scripts but the site's own.
// (The sha256 value is the hosting badge Netlify adds; it does nothing on other hosts.)
const security = `  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'sha256-mTJ4cJaTm2Gw95GeXEpZdvEEY9ybh6FZu1bwcNE7QlY='; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'">
  <meta name="referrer" content="strict-origin-when-cross-origin">`;

// ---------------------------------------------------------------- social links

const ICONS = ['facebook', 'instagram', 'tiktok', 'youtube', 'threads'];

function iconFor(name, address) {
  const hay = (name + ' ' + address).toLowerCase();
  const which = ICONS.find((i) => hay.includes(i));
  if (!which) return '';
  const d = /<path d="([^"]+)"/.exec(read('src', 'icons', which + '.svg'));
  return d ? `<svg class="ico" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="${d[1]}"/></svg>` : '';
}

const socials = sections(doc, 'Social').map((e) => {
  const name = first(e, 'name');
  const l = link(first(e, 'address'), `content/site-wide.txt, social link "${name}"`);
  if (!name || !l) return null;
  return {
    name,
    handle: first(e, 'handle', name),
    href: l.href,
    icon: iconFor(name, l.href),
    footer: !/^(no|n|false)$/i.test(first(e, 'show in footer', 'yes')),
  };
}).filter(Boolean);
if (!socials.length) warn('content/site-wide.txt: no [Social] links were found, so the Follow band has none.');

const socialPills = () => socials
  .map((s) => `          <a href="${esc(s.href)}" target="_blank" rel="noopener" aria-label="${esc(s.name)}: ${esc(s.handle)}" title="${esc(s.name)}">${s.icon}<span>${esc(s.handle)}</span></a>`)
  .join('\n');

const socialFooter = () => socials
  .filter((s) => s.footer && s.icon)
  .map((s) => `        <a href="${esc(s.href)}" target="_blank" rel="noopener" aria-label="${esc(s.name)}: ${esc(s.handle)}" title="${esc(s.name)}">${s.icon}</a>`)
  .join('\n');

// ---------------------------------------------------------------- follow band

// The heading and line can be replaced per page (the Donate page words them differently).
function followBand(id, headline, text) {
  const e = section(doc, 'Follow band');
  const h = headline || first(e, 'headline', 'Follow the herd');
  const t = text || first(e, 'text');
  const question = first(e, 'question');
  return `    <section class="follow-band"${id ? ` id="${id}"` : ''}>
      <div class="wrap reveal">
        <h2>${fmt(h)}${t ? ` <span>${fmt(t)}</span>` : ''}</h2>
        <div class="socials">
${socialPills()}
        </div>
        <div class="follow-foot">
${email ? `          <p>${fmt(question)} <a href="mailto:${esc(email)}">${esc(email)}</a></p>\n` : ''}          <div class="share">
            <button class="btn btn-ghost btn-sm" type="button" data-share>Share Riverview</button>
            <a class="btn btn-ghost btn-sm" href="https://www.facebook.com/sharer/sharer.php" data-share-fb target="_blank" rel="noopener">Share on Facebook</a>
          </div>
        </div>
      </div>
    </section>`;
}

// ---------------------------------------------------------------- header and footer

function header() {
  const notice = first(doc.top, 'preview notice');
  let html = read('src', 'partials', 'header.html');
  html = html.replace('{{preview_bar}}', notice ? `  <div class="preview-bar">${fmt(notice)}</div>\n` : '');
  return html;
}

function footer() {
  const e = section(doc, 'Footer');
  const name = first(e, 'name line', 'Riverview Rescue and Sanctuary');
  const location = first(e, 'location');
  const about = first(e, 'about');
  const nonprofit = first(e, 'nonprofit line');
  const values = {
    footer_name: `<strong>${fmt(name)}</strong>${location ? ` · ${fmt(location)}` : ''}`,
    footer_about: `${about ? `<span class="hide-sm">${fmt(about)} </span>` : ''}${fmt(nonprofit)}`,
    footer_email: email ? `<p>${fmt(first(doc.top, 'contact words', 'Contact us at'))} <a href="mailto:${esc(email)}">${esc(email)}</a></p>` : '',
    footer_copyright: fmt(first(e, 'copyright', name)),
    footer_signoff: fmt(first(e, 'sign-off')),
    social_footer: socialFooter(),
  };
  let html = read('src', 'partials', 'footer.html');
  for (const [k, v] of Object.entries(values)) html = html.split(`{{${k}}}`).join(v);
  return html;
}

module.exports = { email, siteUrl, robots, security, header, footer, followBand };
