// Serves the site locally with the same security headers Netlify will send, and reports anything the browser blocks.
const http = require('http'), fs = require('fs'), path = require('path'), puppeteer = require('puppeteer-core');
const ROOT = path.join(__dirname, '..', 'dist').split(path.sep).join('/');
const hdr = {};
for (const line of fs.readFileSync(ROOT + '/_headers', 'utf8').split('\n')) {
  const m = /^  ([A-Za-z-]+): (.*)$/.exec(line);
  if (m && m[1] !== 'Strict-Transport-Security') hdr[m[1]] = m[2].replace('; upgrade-insecure-requests', '');
}
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const srv = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0]));
  if (!fs.existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { ...hdr, 'Content-Type': types[path.extname(p)] || 'application/octet-stream' });
  res.end(fs.readFileSync(p));
}).listen(8765, async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: 'new' });
  let bad = 0;
  for (const f of ['index.html', 'donate.html', 'shop.html', 'mission.html', 'faq.html', '404.html']) {
    const page = await b.newPage();
    const msgs = [], failed = [], ext = new Set();
    page.on('console', m => { if (m.type() === 'error' || /Content Security Policy/i.test(m.text())) msgs.push(m.text()); });
    page.on('pageerror', e => msgs.push(String(e)));
    page.on('requestfailed', r => failed.push(r.url()));
    page.on('request', r => { if (!r.url().startsWith('http://localhost:8765') && !r.url().startsWith('data:')) ext.add(r.url()); });
    await page.setViewport({ width: 390, height: 844, isMobile: true });
    await page.goto('http://localhost:8765/' + f, { waitUntil: 'networkidle0' });
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise(r => setTimeout(r, 50)); } });
    await new Promise(r => setTimeout(r, 800));
    const fonts = await page.evaluate(() => [...document.fonts].filter(x => x.status === 'loaded').map(x => x.family).filter((v, i, a) => a.indexOf(v) === i));
    const imgs = await page.evaluate(() => [...document.images].filter(i => !i.naturalWidth).length);
    const cookies = (await page.cookies()).length;
    const storage = await page.evaluate(() => localStorage.length + sessionStorage.length);
    console.log(f, '| blocked/errors:', msgs.length, '| failed requests:', failed.length, '| third-party requests:', ext.size, '| fonts:', fonts.join('+'), '| broken images:', imgs, '| cookies:', cookies, '| stored items:', storage);
    msgs.concat(failed).concat([...ext]).slice(0, 6).forEach(m => console.log('   ', m.slice(0, 200)));
    bad += msgs.length + failed.length + ext.size + imgs;
    await page.close();
  }
  await b.close(); srv.close();
  console.log(bad ? 'PROBLEMS: ' + bad : 'Security-header test clean');
});
