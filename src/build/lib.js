// Shared helpers for the build: reading content files, cleaning up text, links and pictures.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const read = (...p) => fs.readFileSync(path.join(ROOT, ...p), 'utf8').replace(/\r\n/g, '\n').replace(/^﻿/, '');

const warnings = [];
const warn = (msg) => { if (!warnings.includes(msg)) warnings.push(msg); };

// ---------------------------------------------------------------- text

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Headings and short labels: "straight quotes" become curly, *stars* become emphasis.
const fmt = (s) => esc(String(s).replace(/"([^"]+)"/g, '“$1”')).replace(/\*([^*]+)\*/g, '<em>$1</em>');

// Paragraphs: the same, and an email or web address typed in the text becomes a link.
const rich = (s) => fmt(s)
  .replace(/(^|[\s(])(https?:\/\/[^\s<)]*[^\s<).,;:!?])/g, (m, pre, url) => `${pre}<a href="${url}" target="_blank" rel="noopener">${url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}</a>`)
  .replace(/(^|[\s(])([A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+)/g, '$1<a href="mailto:$2">$2</a>');

// ---------------------------------------------------------------- links

// Accepts a full web address, "www.example.com", an email address, or a page of this site
// ("donate.html", "index.html#story", "#story"). Anything else is refused.
function link(raw, where) {
  let u = String(raw || '').trim();
  if (!u) return null;
  if (/^#[\w-]+$/.test(u) || /^[\w-]+\.html(#[\w-]+)?$/i.test(u)) return { href: u, external: false };
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(u)) return { href: 'mailto:' + u, external: false };
  if (/^www\./i.test(u) || (!/^[a-z][a-z0-9+.-]*:/i.test(u) && /^[\w-]+(\.[\w-]+)+/.test(u))) u = 'https://' + u;
  if (/^https?:\/\//i.test(u)) return { href: u, external: true };
  if (/^mailto:/i.test(u)) return { href: u, external: false };
  warn(`${where}: "${raw}" is not a web address, so it was left out.`);
  return null;
}

const linkAttrs = (l) => `href="${esc(l.href)}"${l.external ? ' target="_blank" rel="noopener"' : ''}`;

// A button, or nothing if the text or the link is missing.
function button(text, rawLink, classes, where) {
  if (!text) return '';
  const l = link(rawLink, where);
  if (!l) return '';
  return `<a class="btn ${classes}" ${linkAttrs(l)}>${fmt(text)}</a>`;
}

// ---------------------------------------------------------------- pictures

// Finds a picture by name without caring about capital letters ("Logo.PNG" finds "logo.png"),
// because the live server is stricter about that than a home computer. Returns the real file name.
function findFile(folder, name) {
  const wanted = String(name || '').trim().replace(/^.*[\\/]/, '');
  if (!wanted) return "";
  let files;
  try { files = fs.readdirSync(path.join(ROOT, ...folder)); } catch (e) { return ""; }
  return files.find((f) => f === wanted) || files.find((f) => f.toLowerCase() === wanted.toLowerCase()) || "";
}

function photo(name, where, fallback) {
  const file = String(name || "").trim();
  const found = findFile(["assets", "img"], file);
  if (found) return found;
  if (file) warn(`${where}: the picture "${file}" is not in assets/img/${fallback ? `, so "${fallback}" was used` : ", so it was left out"}.`);
  return fallback || "";
}

// A picture name made safe to put in a web address (spaces and odd characters allowed).
const src = (file) => esc(encodeURI(file));

// ---------------------------------------------------------------- content files
//
// The format is deliberately forgiving:
//   # a note                      ignored
//   [Section name]                starts a section
//   Label: some words             a labelled line (only the labels listed below count)
//   more words                    a line with no label continues the line above

const LABELS = new Set([
  'small label', 'headline', 'heading', 'lead', 'text', 'quote', 'signed', 'highlight', 'statement', 'footnote',
  'button text', 'button link', 'second button text', 'second button link', 'store button text', 'store button link',
  'photo', 'photo description', 'photo shape', 'picture', 'picture description', 'qr picture',
  'badge number', 'badge text', 'number', 'chapter name', 'title', 'caption', 'description',
  'big number', 'big number label', 'tag', 'name', 'need', 'closing line',
  'intro', 'invitation', 'contact email', 'website', 'note', 'logo',
  'bar', 'card', 'code', 'bold start', 'more ways heading', 'way',
  'design', 'price', 'link',
  'preview notice', 'email', 'name line', 'location', 'about', 'nonprofit line', 'copyright', 'sign-off', 'question',
  'handle', 'address', 'show in footer',
  'answer', 'group', 'contact words', 'website address', 'hide from search engines',
]);

function parseContent(file) {
  const doc = { file: 'content/' + file, top: [], sections: [] };
  let target = doc.top;
  let last = null;
  let text;
  try { text = read('content', file); } catch (e) { warn(`content/${file} is missing, so that part of the site is empty.`); return doc; }
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const section = /^\[(.+)\]$/.exec(line);
    if (section) {
      target = [];
      doc.sections.push({ name: section[1].trim(), entries: target });
      last = null;
      continue;
    }
    const labelled = /^([A-Za-z][A-Za-z -]{0,30}?)\s*:\s*(.*)$/.exec(line);
    if (labelled && LABELS.has(labelled[1].toLowerCase())) {
      last = { key: labelled[1].toLowerCase(), value: labelled[2].trim() };
      target.push(last);
    } else if (last) {
      last.value = (last.value + ' ' + line).trim();
    } else {
      warn(`content/${file}: could not understand the line "${line.slice(0, 60)}", so it was skipped.`);
    }
  }
  return doc;
}

const first = (entries, key, fallback = '') => {
  const hit = entries.find((e) => e.key === key && e.value);
  return hit ? hit.value : fallback;
};
const every = (entries, key) => entries.filter((e) => e.key === key && e.value).map((e) => e.value);
const parts = (value) => value.split('|').map((p) => p.trim());

// One named section; warns if it is not there.
function section(doc, name) {
  const hit = doc.sections.find((s) => s.name.toLowerCase() === name.toLowerCase());
  if (!hit) warn(`${doc.file}: the section [${name}] is missing, so that part of the page is empty.`);
  return hit ? hit.entries : [];
}
const sections = (doc, name) => doc.sections.filter((s) => s.name.toLowerCase() === name.toLowerCase()).map((s) => s.entries);

// "Text" and "Quote" lines, in the order they were written.
const body = (entries, indent) => entries
  .filter((x) => (x.key === 'text' || x.key === 'quote') && x.value)
  .map((x) => x.key === 'quote' ? `${indent}<blockquote class="pull">“${fmt(x.value)}”</blockquote>` : `${indent}<p>${rich(x.value)}</p>`)
  .join('\n');

const paras = (entries, indent, attrs = '') => every(entries, 'text').map((t) => `${indent}<p${attrs}>${rich(t)}</p>`).join('\n');
const eyebrow = (entries, fallback = '') => {
  const t = first(entries, 'small label', fallback);
  return t ? `<span class="eyebrow">${fmt(t)}</span>` : '';
};

const WAVE = `      <svg class="wave" viewBox="0 0 1440 110" preserveAspectRatio="none" aria-hidden="true">
        <path fill="#1aa7c9" opacity=".55" d="M0 62c160-40 320-48 520-22s360 52 560 34 280-46 360-58v94H0z"/>
        <path fill="#f8f4ea" d="M0 84c180-34 360-40 560-16s380 40 560 22 240-34 320-44v64H0z"/>
      </svg>`;

module.exports = { ROOT, read, warn, warnings, esc, fmt, rich, link, linkAttrs, button, photo, findFile, src, parseContent, first, every, parts, section, sections, body, paras, eyebrow, WAVE };
