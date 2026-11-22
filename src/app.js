(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hero = document.querySelector('.hero');
  const stage = hero.querySelector('.stage');
  const poster = hero.querySelector('.poster img');
  const canvas = hero.querySelector('canvas.scrub');
  const copy = hero.querySelector('.hero-copy');
  const phases = [...hero.querySelectorAll('.phases li')];
  const cue = hero.querySelector('.cue');
  const top = document.querySelector('.top');
  const FRAMES = 72;
  const phone = () => innerWidth <= 700;
  const dir = phone() ? 'm' : 'd';
  const IW = dir === 'm' ? 800 : 1600, IH = dir === 'm' ? 450 : 900;
  const src = i => `/assets/frames/${dir}/${String(i + 1).padStart(3, '0')}.webp`;
  const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  // Where the render sits: always at least full width, strands below the headline.
  // Frame geometry (measured): knot spans 22% to 74% of frame height at the start,
  // the finished lines sit 43% to 70%. Start: knot fits between headline and captions.
  // End: lines centered, full width. Scroll blends one into the other.
  let rectA = { x: 0, y: 0, w: 0, h: 0 }, rectB = rectA, blend = 0;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  function layout() {
    const cw = stage.clientWidth, ch = stage.clientHeight, ph = phone();
    const st = stage.getBoundingClientRect().top;
    const yTop = copy.getBoundingClientRect().bottom - st + (ph ? 12 : 20);
    const phTop = phases[0].parentElement.getBoundingClientRect().top - st;
    const yBot = ph ? ch - 12 : phTop - 24;
    const avail = Math.max(120, yBot - yTop);
    const sA = clamp(avail / (0.53 * IH), cw * (ph ? 1.4 : 0.6) / IW, cw * (ph ? 2.1 : 1.04) / IW);
    const wA = IW * sA, hA = IH * sA;
    const xA = ph ? Math.min(0, Math.max(cw - wA, cw * 0.5 - wA * 0.35)) : (cw - wA) / 2;
    rectA = { x: xA, y: yTop + (avail - 0.53 * hA) / 2 - 0.22 * hA, w: wA, h: hA };
    const sB = ph ? (cw * 2.35) / IW : Math.max((cw * 1.04) / IW, (ch * 0.7) / IH);
    const wB = IW * sB, hB = IH * sB;
    const xB = ph ? Math.min(0, Math.max(cw - wB, cw * 0.5 - wB * 0.42)) : (cw - wB) / 2;
    const cyB = ph ? (64 + phTop) / 2 : ch * 0.5;
    rectB = { x: xB, y: cyB - 0.565 * hB, w: wB, h: hB };
    const r = rectA;
    Object.assign(poster.style, { position: 'absolute', left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px', objectFit: 'fill', maxWidth: 'none' });
    {
      const dpr = Math.min(2, devicePixelRatio || 1);
      canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
      canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }
  }

  // Frames
  const imgs = new Array(FRAMES);
  const loaded = new Array(FRAMES).fill(false);
  let current = -1, progress = 0, ticking = false;
  const ctx = canvas.getContext('2d');

  function nearest(i) {
    for (let d = 0; d < FRAMES; d++) {
      if (i - d >= 0 && loaded[i - d]) return i - d;
      if (i + d < FRAMES && loaded[i + d]) return i + d;
    }
    return -1;
  }
  function draw() {
    const want = Math.round(progress * (FRAMES - 1));
    const i = nearest(want);
    if (i < 0) return;
    current = i;
    ctx.fillStyle = '#F7F8F3';
    ctx.fillRect(0, 0, stage.clientWidth, stage.clientHeight);
    const L = (a, b) => a + (b - a) * blend;
    ctx.drawImage(imgs[i], L(rectA.x, rectB.x), L(rectA.y, rectB.y), L(rectA.w, rectB.w), L(rectA.h, rectB.h));
    if (!canvas.classList.contains('ready')) canvas.classList.add('ready');
  }

  function load() {
    const order = [0, FRAMES - 1];
    for (let i = 1; i < FRAMES - 1; i++) order.push(i);
    let next = 0;
    const pump = () => {
      if (next >= order.length) return;
      const i = order[next++];
      const im = new Image();
      im.decoding = 'async';
      im.onload = () => { loaded[i] = true; imgs[i] = im; if (Math.abs(i - Math.round(progress * (FRAMES - 1))) < Math.abs(current - Math.round(progress * (FRAMES - 1))) || current < 0) draw(); pump(); };
      im.onerror = pump;
      im.src = src(i);
    };
    for (let k = 0; k < 6; k++) pump();
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      top.classList.toggle('scrolled', scrollY > 20);
      const span = hero.offsetHeight - stage.clientHeight;
      progress = Math.min(1, Math.max(0, (scrollY - hero.offsetTop) / span));
      const fade = ss(0.06, 0.3, progress);
      blend = ss(0.04, 0.36, progress);
      copy.style.opacity = String(1 - fade);
      copy.style.transform = reduce ? '' : `translateY(${-48 * fade}px)`;
      const ph = progress < 0.3 ? 0 : progress < 0.72 ? 1 : 2;
      phases.forEach((li, k) => li.classList.toggle('on', k === ph));
      cue.classList.toggle('gone', progress > 0.02);
      phases[0].parentElement.style.opacity = phone() ? String(ss(0.12, 0.24, progress)) : '';
      draw();
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (!t) return;
    e.preventDefault();
    t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    history.replaceState(null, '', a.getAttribute('href'));
  }));

  layout();
  let lastW = innerWidth, lastH = innerHeight;
  addEventListener('resize', () => {
    // Safari's toolbar changes height while scrolling; only relayout on real size changes
    if (innerWidth === lastW && Math.abs(innerHeight - lastH) < 160) return;
    lastW = innerWidth; lastH = innerHeight; layout();
  });
  if (document.fonts) document.fonts.ready.then(layout);
  addEventListener('scroll', onScroll, { passive: true });
  phases[0].classList.add('on'); load();
  onScroll();

  // Reveals and count up
  if (reduce || !('IntersectionObserver' in window)) return;
  const rv = document.querySelectorAll('.stat, .role, .principles article, .quote figure, .creds > div, .contact .wrap');
  rv.forEach(el => el.classList.add('rv'));
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    io.unobserve(e.target);
  }), { rootMargin: '0px 0px -12% 0px' });
  rv.forEach(el => io.observe(el));

  const nums = document.querySelectorAll('[data-count]');
  const fmt = (el, v) => { el.textContent = el.hasAttribute('data-sep') ? Math.round(v).toLocaleString('en-US') : String(Math.round(v)); };
  const nio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    nio.unobserve(e.target);
    const el = e.target, end = +el.dataset.count, t0 = performance.now(), dur = 1400;
    fmt(el, 0);
    const step = t => {
      const k = Math.min(1, (t - t0) / dur), ease = 1 - Math.pow(1 - k, 3);
      fmt(el, end * ease);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }), { threshold: 0.6 });
  nums.forEach(el => nio.observe(el));
})();
