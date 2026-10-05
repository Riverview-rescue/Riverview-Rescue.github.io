# Riverview Rescue and Sanctuary website

The website for Riverview Rescue and Sanctuary, Nebraska's only cow sanctuary. It is a plain static site: a small build script joins editable text files with page templates and writes finished HTML into `dist/`.

## How it is organised

| Folder or file | What it is | Who edits it |
| --- | --- | --- |
| `content/` | Every word on the site, as plain-text files: one per page or section. Start with `content/_READ-ME-FIRST.txt` | Allison |
| `src/build/` | The code that turns each content file into its part of a page (`home.js`, `donate.js`, `shop.js`, `mission.js`, `faq.js`, `shared.js`, `lib.js`) | Maintainer |
| `src/pages/` | A thin shell per page: the `<head>` (title, description, link preview) around `{{main}}`. `404.html` is written out in full | Maintainer |
| `src/partials/` | The header (menu) and footer layout, shared by every page | Maintainer |
| `src/icons/` | Social media logos | Maintainer |
| `assets/` | Styles, script, fonts and pictures, copied to the site as they are | Maintainer; Allison adds pictures |
| `build.js` | Builds the site with Node.js. One package, `sharp`, shrinks oversized photos and logos | Maintainer |
| `tools/` | Two checks to run before publishing (see below) | Maintainer |
| `.github/workflows/publish.yml` | Tells GitHub to build and publish the site on every change | Maintainer |
| `_headers`, `netlify.toml` | Only used if the site is hosted on Netlify | Maintainer |
| `dist/` | The finished site. Generated, never edited by hand, not kept in git | nobody |

## Build and preview

```
npm install      # once
node build.js
```

Then open `dist/index.html` in a browser. The build prints a "Things to check" list if a content file has a line it could not use; it does not fail because of a typing mistake in `content/`.

Pictures wider than 1600 pixels, and sponsor logos larger than 480 pixels, are shrunk in `dist/` only; the originals in `assets/` are never changed. Without `npm install` the build still works but copies pictures at full size and says so.

## Check before publishing

```
node build.js
node tools/phone-audit.js       # every page at nine screen sizes: overflow, tap sizes, small text, broken images, menu
node tools/security-check.js   # serves dist/ with the real security headers and reports anything blocked
```

Both drive Microsoft Edge through `puppeteer-core`, so they need Windows with Edge installed (or the browser path changed at the top of each file). Each should end with a "clean" line.

## Publish

Publishing is automatic. Whenever a file changes on the `main` branch, GitHub builds the site and puts it live (see `.github/workflows/publish.yml`). That covers an edit made on github.com as well as a push from a computer. The "Actions" tab of the repository shows each run; a red cross there means the last change was not published and the previous version is still live.

## Common edits

- **Any wording, photo, sponsor, product, payment method or social link** — the matching file in `content/`.
- **Number of cows rescued** — it appears in `home-banner.txt`, `the-herd.txt` and `mission.txt` (as `32` and as "thirty-two"), and in the share message in `assets/js/main.js`.
- **Menu** — `src/partials/header.html`.
- **A new kind of label or block in a content file** — add the label to `LABELS` in `src/build/lib.js` and use it in the matching builder.
- **Page title and search description** — the `<head>` of the file in `src/pages/`.
- **An address from the old website that should forward somewhere** — `OLD_ADDRESSES` in `build.js`.

## Before it becomes the official site

1. Replace the example sponsors in `content/sponsors.txt` with real ones, and finish the FAQ answers marked "PLEASE CHECK" in `content/faq.txt`.
2. In `content/site-wide.txt`: empty the `Preview notice:` line, set `Website address:` to the real address, and set `Hide from search engines:` to `no`.
3. In the repository's Settings, under Pages, enter the custom domain; then add the DNS records GitHub lists at the company where the domain is registered.

## Privacy and security

The site is static: no forms, logins, cookies, analytics or third-party scripts, and nothing is loaded from other domains. Donations happen on Venmo, PayPal, Zelle, Donorbox and GoFundMe, never on this site. Every page carries a strict Content-Security-Policy (written by `src/build/shared.js`); if you ever add an embed (a video, a donation form), its domain must be added there or the browser will block it.

## Recurring donations

Monthly giving runs through the rescue's Donorbox campaign, which offers One-time and Monthly on its form. The Donorbox card on the Donate page links to it.

## Sources for the Mission page figures

Not shown on the site, kept here in case anyone asks where a number came from.

- Typical lifespan and slaughter ages for beef, dairy and veal cattle: The Humane League, “How long do cows live naturally vs. on factory farms?” (https://thehumaneleague.org/article/how-long-do-cows-live-naturally-vs-on-factory-farms)
- U.S. commercial cattle slaughter, 2025: USDA National Agricultural Statistics Service, Livestock Slaughter 2025 Summary (https://www.nass.usda.gov/Publications/Todays_Reports/reports/lsan0426.pdf)
- Social bonds and stress: K. M. McLennan (2013), “Social bonds in dairy cattle”, University of Northampton (https://nectar.northampton.ac.uk/id/eprint/6466/1/McLennan_Krista_2013_Social_bonds_in_dairy_cattle_the_effect_of_dynamic_group_systems_on_welfare_and_productivity.pdf)
- Cow and calf separation: overview of the research on cow–calf separation (https://en.wikipedia.org/wiki/Cow-calf_separation)
