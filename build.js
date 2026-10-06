// Builds the website into the dist/ folder.
//
//   npm install      (once, to get the picture-resizing tool)
//   node build.js
//
// It joins three things together:
//   content/   plain-text files anyone can edit: one for each part of the site
//   src/       the page shells, the shared header and footer, icons, and the build code
//   assets/    pictures, fonts, styles and scripts
//
// Pictures that are much bigger than the site needs (a photo straight off a phone, a huge
// sponsor logo) are shrunk on the way into dist/. The originals in assets/ are never changed.

const fs = require('fs');
const path = require('path');
const { ROOT, read, warn, warnings } = require('./src/build/lib');
const shared = require('./src/build/shared');

const OUT = path.join(ROOT, 'dist');

// Which builder makes the middle of each page. Pages not listed here (404) are used as written.
const mains = {
  'index.html': () => require('./src/build/home').page(),
  'donate.html': () => require('./src/build/donate').page(),
  'shop.html': () => require('./src/build/shop').page(),
  'mission.html': () => require('./src/build/mission').page(),
  'faq.html': () => require('./src/build/faq').page(),
};

// Addresses from the old WordPress site, and where each should now lead.
const OLD_ADDRESSES = {
  'meet-the-animals': '/index.html#herd',
  'how-to-help': '/donate.html',
};

// The largest a picture needs to be, in pixels.
const MAX_PHOTO_WIDTH = 1600;
const MAX_LOGO_SIDE = 480;

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const item of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, item.name);
    const b = path.join(to, item.name);
    if (item.isDirectory()) copyDir(a, b);
    else fs.copyFileSync(a, b);
  }
}

function listFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((item) => {
    const p = path.join(dir, item.name);
    return item.isDirectory() ? listFiles(p) : [p];
  });
}

const kb = (bytes) => Math.round(bytes / 1024) + ' KB';

// Shrinks oversized pictures in dist/assets/img. Returns a line for each one it changed.
async function shrinkPictures() {
  const imgDir = path.join(OUT, 'assets', 'img');
  const pictures = listFiles(imgDir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
  let sharp;
  try { sharp = require('sharp'); } catch (e) { sharp = null; }

  const notes = [];
  for (const file of pictures) {
    const isLogo = path.relative(imgDir, file).split(path.sep)[0] === 'sponsors';
    const name = path.relative(OUT, file).replace(/\\/g, '/');
    const before = fs.statSync(file).size;
    if (!sharp) {
      if (before > (isLogo ? 300 : 1500) * 1024) warn(`${name} is a large file (${kb(before)}) and could not be shrunk because the resizing tool is not installed. Run "npm install" once, then build again.`);
      continue;
    }
    try {
      const input = fs.readFileSync(file);
      const meta = await sharp(input).metadata();
      const turned = (meta.orientation || 1) >= 5; // phone photos stored sideways
      const width = turned ? meta.height : meta.width;
      const height = turned ? meta.width : meta.height;
      const tooBig = isLogo ? Math.max(width, height) > MAX_LOGO_SIDE : width > MAX_PHOTO_WIDTH;
      if (!tooBig) continue;
      let img = sharp(input).rotate();
      img = isLogo
        ? img.resize({ width: MAX_LOGO_SIDE, height: MAX_LOGO_SIDE, fit: 'inside', withoutEnlargement: true })
        : img.resize({ width: MAX_PHOTO_WIDTH, withoutEnlargement: true });
      if (/\.png$/i.test(file)) img = img.png({ compressionLevel: 9 });
      else if (/\.webp$/i.test(file)) img = img.webp({ quality: 82 });
      else img = img.jpeg({ quality: 82, mozjpeg: true });
      const output = await img.toBuffer();
      if (output.length >= before) continue; // already a small file; leave it alone
      fs.writeFileSync(file, output);
      notes.push(`${name}: ${width}x${height} (${kb(before)}) made smaller (${kb(output.length)})`);
    } catch (e) {
      warn(`${name} could not be read as a picture (${e.message.split('\n')[0]}), so it was copied as it is.`);
    }
  }
  return notes;
}

async function build() {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  const header = shared.header();
  const footer = shared.footer();

  for (const file of fs.readdirSync(path.join(ROOT, 'src', 'pages')).filter((f) => f.endsWith('.html'))) {
    const root = file === '404.html' ? '/' : '';
    // Mark the current page in the menu
    const head = header.split(`href="{{root}}${file}"`).join(`href="{{root}}${file}" aria-current="page"`);
    let html = read('src', 'pages', file)
      .replace('{{> header}}', head.trimEnd())
      .replace('{{> footer}}', footer.trimEnd());
    if (html.includes('{{main}}')) {
      if (!mains[file]) throw new Error(`${file} asks for {{main}} but build.js has no builder for it`);
      html = html.replace('{{main}}', () => mains[file]());
    }
    html = html.split('{{security}}').join(shared.security)
      .split('{{robots}}').join(shared.robots)
      .split('{{site_url}}').join(shared.siteUrl)
      .split('{{root}}').join(root);
    const leftover = /\{\{[^}]*\}\}/.exec(html);
    if (leftover) throw new Error(`${file}: unknown placeholder ${leftover[0]}`);
    fs.writeFileSync(path.join(OUT, file), html);
  }

  copyDir(path.join(ROOT, 'assets'), path.join(OUT, 'assets'));
  fs.copyFileSync(path.join(ROOT, '_headers'), path.join(OUT, '_headers'));
  fs.writeFileSync(path.join(OUT, '.nojekyll'), '');

  // The old website's page addresses, sent on to the matching new page.
  for (const [oldPath, target] of Object.entries(OLD_ADDRESSES)) {
    fs.mkdirSync(path.join(OUT, oldPath), { recursive: true });
    fs.writeFileSync(path.join(OUT, oldPath, 'index.html'), `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="robots" content="noindex">
  <meta http-equiv="refresh" content="0; url=${target}">
  <link rel="canonical" href="${shared.siteUrl}${target}">
  <title>Riverview Rescue and Sanctuary</title>
</head>
<body>
  <p>This page has moved. <a href="${target}">Continue to the new page</a>.</p>
</body>
</html>
`);
  }

  // A list of the pages for search engines. Left out while the site is hidden from them.
  if (!shared.robots) {
    const today = new Date().toISOString().slice(0, 10);
    const pages = fs.readdirSync(OUT).filter((f) => f.endsWith('.html') && f !== '404.html').sort((a, b) => (a === 'index.html' ? -1 : b === 'index.html' ? 1 : a.localeCompare(b)));
    const urls = pages.map((f) => `  <url><loc>${shared.siteUrl}/${f === 'index.html' ? '' : f}</loc><lastmod>${today}</lastmod></url>`);
    fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
    fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${shared.siteUrl}/sitemap.xml\n`);
  }

  const shrunk = await shrinkPictures();

  console.log('Built the site into dist/');
  if (shrunk.length) {
    console.log('\nPictures made smaller for the website (your originals are untouched):');
    for (const s of shrunk) console.log('  - ' + s);
  }
  if (warnings.length) {
    console.log('\nThings to check:');
    for (const w of warnings) console.log('  - ' + w);
  }
}

build().catch((e) => { console.error(e); process.exit(1); });
