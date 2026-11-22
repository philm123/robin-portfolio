// Builds dist/ from content/site.json + src/. No dependencies. Run: node build.mjs
import fs from 'fs';
import path from 'path';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(ROOT, 'dist');
const c = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/site.json'), 'utf8'));
const SITE_URL = (process.env.URL || 'https://robin-hoffman.netlify.app').replace(/\/$/, '');

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const list = a => (Array.isArray(a) ? a : []).filter(x => x !== null && x !== undefined && x !== '');
const href = u => { const s = String(u || '').trim(); return /^(https?:|mailto:|\/)/i.test(s) ? esc(s) : '#'; };
const media = p => { const s = String(p || '').trim(); if (!s) return ''; return s.startsWith('/') || /^https?:/.test(s) ? s : '/' + s; };
// Wrap each number so it can count up; commas keep their formatting.
const countUp = v => esc(v).replace(/\d[\d,]*(\.\d+)?/g, m => `<span data-count="${m.replace(/,/g, '')}"${m.includes(',') ? ' data-sep' : ''}>${m}</span>`);
const STRAND = ['#174C3C', '#2F6B52', '#5E8C6F', '#26302C'];

const resume = media(c.contact?.resume);
const shown = list(c.testimonials?.items).filter(t => t && t.show !== false && t.quote).slice(0, 3);

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(c.seo?.title)}</title>
<meta name="description" content="${esc(c.seo?.description)}">
<link rel="canonical" href="${SITE_URL}/">
<meta property="og:type" content="website">
<meta property="og:url" content="${SITE_URL}/">
<meta property="og:title" content="${esc(c.seo?.title)}">
<meta property="og:description" content="${esc(c.seo?.description)}">
<meta property="og:image" content="${SITE_URL}/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="theme-color" content="#F7F8F3">
<link rel="preload" href="/assets/fonts/fraunces-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/instrument-sans-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/styles.css">
</head>
<body>
<a class="skip" href="#work">Skip to experience</a>

<header class="top">
  <a class="mark" href="#top" aria-label="Robin J. Hoffman, back to top">RJH</a>
  <nav aria-label="Sections">
    <a href="#roles">Roles</a>
    <a href="#work">Work</a>
    <a href="#how">How I work</a>
    <a href="#contact">Contact</a>
  </nav>
  ${resume ? `<a class="btn btn-small" href="${href(resume)}" download>Resume</a>` : ''}
</header>

<main>
<section class="hero" id="top" aria-label="Introduction">
  <div class="stage">
    <picture class="poster">
      <source media="(max-width: 700px)" srcset="/assets/frames/m/001.webp">
      <img src="/assets/frames/d/001.webp" width="1600" height="900" alt="Seven tangled strands of yarn on paper" fetchpriority="high">
    </picture>
    <canvas class="scrub" aria-hidden="true"></canvas>
    <div class="hero-copy wrap">
      <p class="eyebrow">${esc(c.hero?.eyebrow)}</p>
      <h1>${esc(c.hero?.headline)}</h1>
      <p class="lede">${esc(c.hero?.intro)}</p>
    </div>
    <ol class="phases wrap" aria-hidden="true">
      ${list(c.hero?.captions).slice(0, 3).map((t, i) => `<li data-at="${i}">${esc(t)}</li>`).join('\n      ')}
    </ol>
    <p class="cue" aria-hidden="true">Scroll</p>
  </div>
</section>

<section class="stats wrap" aria-labelledby="stats-h">
  <h2 class="kicker" id="stats-h">${esc(c.highlights?.kicker || 'Career highlights')}</h2>
  <div class="stat-grid">
    ${list(c.highlights?.items).map(s => `<div class="stat">
      <p class="num">${countUp(s.value)}</p>
      <p class="lbl">${esc(s.label)}</p>
    </div>`).join('\n    ')}
  </div>
</section>

<section class="roles" id="roles" aria-labelledby="roles-h">
  <div class="wrap roles-grid">
    <div>
      <p class="kicker">${esc(c.roles?.kicker)}</p>
      <h2 id="roles-h">${esc(c.roles?.heading)}</h2>
    </div>
    <ul class="role-list">
      ${list(c.roles?.items).map(r => `<li>${esc(r)}</li>`).join('\n      ')}
    </ul>
  </div>
</section>

<section class="work" id="work" aria-labelledby="work-h">
  <div class="wrap">
    <p class="kicker">${esc(c.experience?.kicker)}</p>
    <h2 id="work-h">${esc(c.experience?.heading)}</h2>
  </div>
  <ol class="timeline wrap">
    ${list(c.experience?.jobs).map((j, i) => `<li class="role" style="--c:${STRAND[i % STRAND.length]}">
      <div class="when">${esc(j.years)}</div>
      <div class="what">
        <h3>${esc(j.company)}</h3>
        <p class="title">${esc(j.title)}</p>
        ${j.summary ? `<p>${esc(j.summary)}</p>` : ''}
        ${list(j.bullets).length ? `<ul>${list(j.bullets).map(b => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
      </div>
    </li>`).join('\n    ')}
  </ol>
</section>

<section class="how" id="how" aria-labelledby="how-h">
  <div class="wrap">
    <p class="kicker">${esc(c.principles?.kicker)}</p>
    <h2 id="how-h">${esc(c.principles?.heading)}</h2>
    <div class="principles">
      ${list(c.principles?.items).map((p, i) => `<article>
        <span class="n" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.body)}</p>
      </article>`).join('\n      ')}
    </div>
  </div>
</section>

${shown.length ? `<section class="quote" aria-labelledby="quote-h">
  <div class="wrap">
    <h2 class="kicker" id="quote-h">${esc(c.testimonials?.kicker || 'What colleagues say')}</h2>
    <div class="quotes q${Math.min(shown.length, 3)}">
      ${shown.map(t => `<figure>
        <blockquote><p>${esc(t.quote)}</p></blockquote>
        <figcaption><strong>${esc(t.name)}</strong> <span>${esc([t.role, t.relationship].filter(Boolean).join(', '))}</span></figcaption>
      </figure>`).join('\n      ')}
    </div>
    ${c.testimonials?.more_link ? `<p class="more"><a href="${href(c.testimonials.more_link)}" rel="noopener">More recommendations on LinkedIn</a></p>` : ''}
  </div>
</section>` : ''}

<section class="creds wrap" aria-label="Credentials">
  <div>
    <h2 class="kicker">Certifications</h2>
    <ul class="pills">${list(c.credentials?.certifications).map(x => `<li>${esc(x)}</li>`).join('')}</ul>
    ${c.credentials?.certifications_note ? `<p class="note">${esc(c.credentials.certifications_note)}</p>` : ''}
    ${list(c.credentials?.training).length ? `<h2 class="kicker sub">Training</h2>
    <ul class="pills quiet">${list(c.credentials.training).map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
  </div>
  <div>
    <h2 class="kicker">Tools</h2>
    <ul class="pills quiet">${list(c.credentials?.tools).map(x => `<li>${esc(x)}</li>`).join('')}</ul>
  </div>
</section>

<section class="contact" id="contact" aria-labelledby="contact-h">
  <div class="wrap">
    <h2 id="contact-h">${esc(c.contact?.heading)}</h2>
    <p>${esc(c.contact?.body)}</p>
    <div class="actions">
      ${c.contact?.email ? `<a class="btn" href="mailto:${esc(c.contact.email)}">Email Robin</a>` : ''}
      ${c.contact?.linkedin ? `<a class="btn btn-ghost" href="${href(c.contact.linkedin)}" rel="noopener">LinkedIn</a>` : ''}
      ${resume ? `<a class="btn btn-ghost" href="${href(resume)}" download>Download resume</a>` : ''}
    </div>
  </div>
</section>
</main>

<footer class="wrap foot">
  <p>Robin J. Hoffman</p>
  <p>${esc(c.contact?.location)}</p>
</footer>
<script src="/app.js" defer></script>
</body>
</html>
`;

fs.rmSync(OUT, { recursive: true, force: true });
fs.cpSync(path.join(ROOT, 'src'), OUT, { recursive: true });
if (fs.existsSync(path.join(ROOT, 'media'))) fs.cpSync(path.join(ROOT, 'media'), path.join(OUT, 'media'), { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.html'), html);
if (resume && !resume.startsWith('http') && !fs.existsSync(path.join(OUT, resume))) {
  console.error(`Resume file not found: ${resume}. Upload it in the editor or fix the path.`);
  process.exit(1);
}
console.log(`Built dist/index.html (${html.length} bytes), ${list(c.experience?.jobs).length} jobs, ${shown.length} testimonials.`);
