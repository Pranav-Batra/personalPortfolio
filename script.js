/* ============================================================
   Nintendo DSi Menu Portfolio — behaviour
   - Bottom-screen carousel (scroll / drag / arrows / keys)
   - Selecting an app previews it on the top screen; opening
     expands its full content there
   - DSi stylus cursor + synthesized SFX
   ============================================================ */

/* app metadata (order matches the carousel markup) */
const APPS = [
  { id: 'about',      name: 'About Me',   tag: 'Who I am',            accent: '#4aa3df' },
  { id: 'projects',   name: 'Projects',   tag: "Things I've built",   accent: '#5fb95f' },
  { id: 'experience', name: 'Experience', tag: "Where I've worked",   accent: '#f0a52e' },
  { id: 'contact',    name: 'Contact',    tag: 'Get in touch',        accent: '#e2607a' },
];

/* ---------- WEB AUDIO SFX ---------- */
const SFX = (function () {
  let ctx = null;
  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function note(freq, { type = 'sine', dur = 0.12, gain = 0.16, when = 0, slideTo = null } = {}) {
    if (!ctx) return;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }
  return {
    unlock() { return ensure(); },
    scroll() { if (!ensure()) return; note(760, { type: 'sine', dur: 0.06, gain: 0.09 }); },
    open() {
      if (!ensure()) return;
      note(523, { type: 'triangle', dur: 0.10, gain: 0.15 });
      note(784, { type: 'triangle', dur: 0.13, gain: 0.15, when: 0.06 });
      note(1046, { type: 'sine', dur: 0.20, gain: 0.11, when: 0.12, slideTo: 1240 });
    },
    close() {
      if (!ensure()) return;
      note(680, { type: 'triangle', dur: 0.10, gain: 0.13, slideTo: 480 });
      note(480, { type: 'sine', dur: 0.13, gain: 0.09, when: 0.06, slideTo: 340 });
    },
    tap() { if (!ensure()) return; note(900, { type: 'sine', dur: 0.05, gain: 0.07 }); },
  };
})();

/* ---------- THEME (dark mode) ---------- */
(function theme() {
  const root = document.documentElement;
  const btn = document.getElementById('themeToggle');
  const KEY = 'portfolio-theme';
  if (!btn) return;
  btn.addEventListener('click', () => {
    // resolve the current effective theme (attribute, else system)
    const current = root.getAttribute('data-theme')
      || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = current === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem(KEY, next); } catch (e) {}
    SFX.tap();
  });
})();

(function audioUnlock() {
  const hint = document.getElementById('soundHint');
  function go() {
    SFX.unlock();
    if (hint) hint.classList.add('hidden');
    window.removeEventListener('pointerdown', go);
    window.removeEventListener('keydown', go);
  }
  window.addEventListener('pointerdown', go);
  window.addEventListener('keydown', go);
})();

/* ---------- STYLUS CURSOR ---------- */
(function stylus() {
  const el = document.getElementById('stylus');
  if (!el) return;
  let tx = innerWidth / 2, ty = innerHeight / 2, cx = tx, cy = ty;
  addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY; el.classList.add('active'); });
  addEventListener('mousedown', () => el.classList.add('press'));
  addEventListener('mouseup',   () => el.classList.remove('press'));
  document.addEventListener('mouseleave', () => el.classList.remove('active'));
  document.addEventListener('mouseenter', () => el.classList.add('active'));
  (function tick() {
    cx += (tx - cx) * 0.4;
    cy += (ty - cy) * 0.4;
    el.style.transform = `translate(${cx}px, ${cy}px) translate(-5px, -5px)`;
    requestAnimationFrame(tick);
  })();
})();

/* ---------- CAROUSEL + SCREENS ---------- */
(function menu() {
  const carousel   = document.getElementById('carousel');
  const icons      = Array.from(carousel.querySelectorAll('.app-icon'));
  const splash     = document.getElementById('splash');
  const splashIcon = document.getElementById('splashIcon');
  const splashTitle= document.getElementById('splashTitle');
  const splashTag  = document.getElementById('splashTag');
  const openBtn    = document.getElementById('openBtn');
  const content    = document.getElementById('content');
  const backBtn    = document.getElementById('backBtn');
  const dotsWrap   = document.getElementById('dots');
  const arrowL     = document.getElementById('arrowLeft');
  const arrowR     = document.getElementById('arrowRight');

  const dsi = document.querySelector('.dsi');
  let index = 0;      // centered app
  let opened = false; // is an app expanded on the top screen?

  // spacing between carousel items
  const spacing = () => Math.min(190, Math.max(120, innerWidth * 0.18));

  // build dots
  APPS.forEach((_, i) => {
    const d = document.createElement('button');
    d.setAttribute('aria-label', 'Go to ' + APPS[i].name);
    d.addEventListener('click', () => select(i, true));
    dotsWrap.appendChild(d);
  });
  const dots = Array.from(dotsWrap.children);

  function layout() {
    const s = spacing();
    icons.forEach((el, i) => {
      const d = i - index;
      const scale = d === 0 ? 1.18 : 0.78;
      const op = d === 0 ? 1 : (Math.abs(d) === 1 ? 0.6 : 0.32);
      el.style.transform = `translate(-50%, -50%) translateX(${d * s}px) scale(${scale})`;
      el.style.opacity = op;
      el.style.zIndex = d === 0 ? 3 : 2 - Math.abs(d);
      el.classList.toggle('center', d === 0);
    });
    dots.forEach((el, i) => el.classList.toggle('on', i === index));
  }

  function syncSplash() {
    const app = APPS[index];
    splash.style.setProperty('--sa', app.accent);
    splashIcon.style.setProperty('--sa', app.accent);
    splashIcon.innerHTML = icons[index].querySelector('svg').outerHTML;
    splashTitle.textContent = app.name;
    splashTag.textContent = app.tag;
    openBtn.style.setProperty('--sa', app.accent);
  }

  function select(i, sound) {
    i = Math.max(0, Math.min(APPS.length - 1, i));
    if (i === index) return;
    index = i;
    layout();
    if (!opened) syncSplash();
    if (sound) SFX.scroll();
  }

  function openApp(i) {
    index = i;
    opened = true;
    const app = APPS[index];
    // set accent for the content view
    content.style.setProperty('--vaccent', app.accent);
    content.querySelectorAll('.app-content').forEach((s) => {
      s.hidden = s.dataset.app !== app.id;
    });
    // recolor the title underline explicitly (in case of stale inline)
    const active = content.querySelector(`.app-content[data-app="${app.id}"] .view-title`);
    if (active) active.style.borderBottomColor = app.accent;

    dsi.classList.add('opened');   // merge the two screens into one
    splash.classList.add('hide');
    setTimeout(() => {
      content.hidden = false;
      content.scrollTop = 0;
      // restart the open animation
      content.style.animation = 'none'; void content.offsetWidth; content.style.animation = '';
    }, 180);
    backBtn.hidden = false;
    layout();
    SFX.open();
  }

  function closeApp() {
    if (!opened) return;
    opened = false;
    dsi.classList.remove('opened');  // split back into two screens
    content.hidden = true;
    backBtn.hidden = true;
    syncSplash();
    splash.classList.remove('hide');
    layout();
    SFX.close();
  }

  /* --- interactions --- */
  icons.forEach((el, i) => {
    el.addEventListener('click', () => {
      if (i === index) openApp(i);      // tap centered app -> open
      else select(i, true);             // tap side app -> center it
    });
  });

  arrowL.addEventListener('click', () => select(index - 1, true));
  arrowR.addEventListener('click', () => select(index + 1, true));
  openBtn.addEventListener('click', () => openApp(index));
  backBtn.addEventListener('click', closeApp);

  // mouse wheel over the bottom screen scrolls the carousel
  let wheelLock = false;
  document.querySelector('.bottom-screen').addEventListener('wheel', (e) => {
    if (opened) return;
    e.preventDefault();
    if (wheelLock) return;
    const dir = (e.deltaX || e.deltaY) > 0 ? 1 : -1;
    select(index + dir, true);
    wheelLock = true;
    setTimeout(() => (wheelLock = false), 260);
  }, { passive: false });

  // drag / swipe on the bottom screen
  let dragX = null, dragMoved = false;
  const bottom = document.querySelector('.bottom-screen');
  bottom.addEventListener('pointerdown', (e) => { if (!opened) { dragX = e.clientX; dragMoved = false; } });
  addEventListener('pointermove', (e) => {
    if (dragX === null) return;
    const dx = e.clientX - dragX;
    if (Math.abs(dx) > 55) {
      select(index + (dx > 0 ? -1 : 1), true);
      dragX = e.clientX;
      dragMoved = true;
    }
  });
  addEventListener('pointerup', () => { dragX = null; });

  // keyboard
  addEventListener('keydown', (e) => {
    if (['ArrowLeft', 'ArrowRight', 'Enter', ' ', 'Escape', 'Backspace'].includes(e.key)) {
      if (e.key === 'ArrowLeft')  { if (!opened) select(index - 1, true); }
      else if (e.key === 'ArrowRight') { if (!opened) select(index + 1, true); }
      else if (e.key === 'Enter' || e.key === ' ') { if (!opened) { e.preventDefault(); openApp(index); } }
      else if (e.key === 'Escape' || e.key === 'Backspace') { if (opened) { e.preventDefault(); closeApp(); } }
    }
  });

  addEventListener('resize', layout);

  // init
  layout();
  syncSplash();
})();

/* ---------- LIVE CLOCK ---------- */
(function clock() {
  const el = document.getElementById('clock');
  if (!el) return;
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  function update() {
    const now = new Date();
    let h = now.getHours();
    const m = String(now.getMinutes()).padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    el.textContent = `${days[now.getDay()]}  ${h}:${m} ${ampm}`;
  }
  update();
  setInterval(update, 1000 * 15);
})();
