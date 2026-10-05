// Phone audit: loads each page in emulated phones and reports layout problems.
const puppeteer = require('puppeteer-core');
const path = require('path');

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const ROOT = 'file:///' + path.join(__dirname, '..', 'dist').split(path.sep).join('/') + '/';
const PAGES = ['index.html', 'donate.html', 'shop.html', 'mission.html', 'faq.html'];
const PHONES = [
  { name: 'small-android-320', width: 320, height: 640 },
  { name: 'galaxy-360', width: 360, height: 740 },
  { name: 'iphone-se-375', width: 375, height: 667 },
  { name: 'iphone-15-393', width: 393, height: 852 },
  { name: 'iphone-plus-430', width: 430, height: 932 },
  { name: 'landscape-667', width: 667, height: 375 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'tablet-834', width: 834, height: 1112 },
  { name: 'laptop-1024', width: 1024, height: 700 },
];
const shots = process.argv.includes('--shots');

(async () => {
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new' });
  let problems = 0;
  for (const phone of PHONES) {
    for (const file of PAGES) {
      const page = await browser.newPage();
      await page.setViewport({ width: phone.width, height: phone.height, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
      await page.goto(ROOT + file, { waitUntil: 'networkidle0' });
      // reveal everything so below-the-fold content is measured and screenshotted
      await page.evaluate(() => document.querySelectorAll('.reveal').forEach(e => e.classList.add('in')));
      await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } window.scrollTo(0, 0); });
      await page.evaluate(() => Promise.race([new Promise(r => setTimeout(r, 4000)), Promise.all([...document.images].map(i => { i.loading = "eager"; return i.decode().catch(() => 0); }))]));
      await new Promise(r => setTimeout(r, 900));

      const report = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const out = { vw, scrollW: document.documentElement.scrollWidth, overflow: [], smallTaps: [], smallText: [], brokenImgs: [] };
        const desc = el => (el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : '') + ' "' + (el.textContent || '').trim().slice(0, 30) + '"');
        document.querySelectorAll('body *').forEach(el => {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return;
          const cs = getComputedStyle(el);
          if (cs.visibility === 'hidden' || cs.display === 'none') return;
          if ((r.right > vw + 1 || r.left < -1) && !el.closest('svg') && !el.closest('.skip')) out.overflow.push(desc(el) + ` L${Math.round(r.left)} R${Math.round(r.right)}`);
        });
        document.querySelectorAll('a, button').forEach(el => {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || el.closest('.skip')) return;
          if (getComputedStyle(el).display === 'none' || !el.offsetParent) return;
          // inline links inside sentences are exempt from the 44px guideline
          const inline = getComputedStyle(el).display === 'inline' && (el.closest('p') || el.closest('li'));
          if (!inline && (r.height < 43.5 || r.width < 43.5)) out.smallTaps.push(desc(el) + ` ${Math.round(r.width)}x${Math.round(r.height)}`);
        });
        document.querySelectorAll('p, li, span, a, figcaption, button').forEach(el => {
          if (!el.offsetParent || !el.textContent.trim() || el.children.length) return;
          const fs = parseFloat(getComputedStyle(el).fontSize);
          if (fs < 12) out.smallText.push(desc(el) + ` ${fs}px`);
        });
        document.querySelectorAll('img').forEach(img => { if (!img.complete || img.naturalWidth === 0) out.brokenImgs.push(img.getAttribute('src')); });
        return out;
      });

      // Menu must open and show every link without clipping
      let menu = 'n/a';
      const toggleVisible = await page.evaluate(() => { const t = document.querySelector('.nav-toggle'); return !!t && getComputedStyle(t).display !== 'none'; });
      if (toggleVisible) {
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.tap('.nav-toggle');
        await new Promise(r => setTimeout(r, 300));
        menu = await page.evaluate(() => {
          const nav = document.getElementById('nav');
          const r = nav.getBoundingClientRect();
          const links = [...nav.querySelectorAll('a')].filter(a => a.getBoundingClientRect().height > 0).length;
          return `open=${nav.classList.contains('open')} links=${links} bottom=${Math.round(r.bottom)} vh=${innerHeight} fits=${r.bottom <= innerHeight + 1 || nav.scrollHeight > nav.clientHeight}`;
        });
        if (shots) await page.screenshot({ path: path.join(__dirname, `${phone.name}-${file}-menu.png`) });
        await page.tap('.nav-toggle');
      }
      if (shots) {
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({ path: path.join(__dirname, `${phone.name}-${file}-top.png`) });
        await page.screenshot({ path: path.join(__dirname, `${phone.name}-${file}-full.png`), fullPage: true });
      }

      const bad = report.scrollW > report.vw || report.overflow.length || report.smallTaps.length || report.smallText.length || report.brokenImgs.length;
      if (bad) problems++;
      console.log(`${bad ? 'ISSUE' : 'ok   '} ${phone.name} ${file} vw=${report.vw} scrollW=${report.scrollW} menu[${menu}]`);
      const uniq = a => [...new Set(a)].slice(0, 8);
      if (report.overflow.length) console.log('   overflow:', uniq(report.overflow).join(' | '));
      if (report.smallTaps.length) console.log('   small taps:', uniq(report.smallTaps).join(' | '));
      if (report.smallText.length) console.log('   small text:', uniq(report.smallText).join(' | '));
      if (report.brokenImgs.length) console.log('   broken imgs:', report.brokenImgs.join(', '));
      await page.close();
    }
  }
  await browser.close();
  console.log(problems ? `\n${problems} page/phone combinations with issues` : '\nAll clean');
})();
