/* ============================================================
   TouchlessTouch — script.js
   Animated background · Crosshair cursor · Click sparks
   Scroll reveals · Decrypt text · Feature card mouse glow
   ============================================================ */

'use strict';

/* ─────────────────────────────────────────────────────────────
   1. PARTICLE / WAVE BACKGROUND CANVAS
   Inspired by ColorBends / FloatingLines aesthetics — pure canvas
   ───────────────────────────────────────────────────────────── */
(function initBackground() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, animId;
  let mouse = { x: -1000, y: -1000 };

  // Track mouse for parallax wave distortion
  window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  const BLUE  = [30, 144, 255];
  const CYAN  = [0, 212, 255];

  // Particle system
  const PARTICLE_COUNT = 60;
  const particles = [];

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

  function makeParticle() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.4 + 0.05,
      color: Math.random() < 0.6 ? BLUE : CYAN,
      life: Math.random(),
      lifeSpeed: 0.001 + Math.random() * 0.002
    };
  }

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    particles.length = 0;
    for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(makeParticle());
  }

  // Floating connection lines between nearby particles
  function drawLines() {
    const MAX_DIST = 140;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < MAX_DIST) {
          const alpha = (1 - d / MAX_DIST) * 0.15;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(30,144,255,${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  // Wave lines — FloatingLines inspired
  function drawWaves(t) {
    const count = 5;
    for (let i = 0; i < count; i++) {
      ctx.beginPath();
      const yBase = (H / (count + 1)) * (i + 1);
      const amp   = 30 + i * 8;
      const freq  = 0.003 + i * 0.0005;
      const speed = 0.0003 * (i % 2 === 0 ? 1 : -1);
      // Mouse Y influence
      const mouseInfluence = ((mouse.y - yBase) / H) * 20;

      for (let x = 0; x <= W; x += 2) {
        const y = yBase
          + Math.sin(x * freq + t * speed * 1000) * amp
          + Math.sin(x * freq * 2 - t * speed * 600) * (amp * 0.4)
          + mouseInfluence * Math.exp(-((x - mouse.x) ** 2) / (2 * 80000));

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      const blendColor = [
        Math.round(lerp(BLUE[0], CYAN[0], i / count)),
        Math.round(lerp(BLUE[1], CYAN[1], i / count)),
        Math.round(lerp(BLUE[2], CYAN[2], i / count))
      ];
      ctx.strokeStyle = `rgba(${blendColor.join(',')},0.07)`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function tick(t) {
    ctx.clearRect(0, 0, W, H);

    // Subtle radial gradient base
    const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7);
    grad.addColorStop(0, 'rgba(10,20,48,0.4)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    drawWaves(t);

    // Update & draw particles
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.life += p.lifeSpeed;

      // Wrap around
      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;

      // Pulse alpha
      const pulse = (Math.sin(p.life * Math.PI * 2) + 1) / 2;
      const alpha = clamp(p.alpha * pulse, 0, 1);

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color.join(',')},${alpha})`;
      ctx.fill();
    }

    drawLines();

    animId = requestAnimationFrame(tick);
  }

  window.addEventListener('resize', resize);
  resize();
  animId = requestAnimationFrame(tick);
})();


/* ─────────────────────────────────────────────────────────────
   2. CLICK SPARKS (ClickSpark component — vanilla)
   ───────────────────────────────────────────────────────────── */
(function initSparks() {
  const canvas = document.getElementById('spark-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  const sparks = [];

  const SPARK_COLOR  = '#1e90ff';
  const SPARK_COUNT  = 10;
  const SPARK_RADIUS = 55;
  const SPARK_SIZE   = 10;
  const DURATION     = 500;

  function addSparks(x, y) {
    const now = performance.now();
    for (let i = 0; i < SPARK_COUNT; i++) {
      sparks.push({
        x, y,
        angle: (Math.PI * 2 * i) / SPARK_COUNT + (Math.random() - 0.5) * 0.5,
        startTime: now
      });
    }
  }

  document.addEventListener('click', e => {
    addSparks(e.clientX, e.clientY);
  });

  function easeOut(t) { return t * (2 - t); }

  function drawSparks(ts) {
    ctx.clearRect(0, 0, W, H);
    const now = ts;
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      const elapsed = now - s.startTime;
      if (elapsed >= DURATION) { sparks.splice(i, 1); continue; }
      const progress = elapsed / DURATION;
      const eased    = easeOut(progress);
      const dist     = eased * SPARK_RADIUS;
      const len      = SPARK_SIZE * (1 - eased);
      const x1 = s.x + dist * Math.cos(s.angle);
      const y1 = s.y + dist * Math.sin(s.angle);
      const x2 = s.x + (dist + len) * Math.cos(s.angle);
      const y2 = s.y + (dist + len) * Math.sin(s.angle);
      const alpha = 1 - eased;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = `rgba(30,144,255,${alpha})`;
      ctx.lineWidth = 2;
      ctx.lineCap  = 'round';
      ctx.stroke();
    }
    requestAnimationFrame(drawSparks);
  }
  requestAnimationFrame(drawSparks);
})();


/* ─────────────────────────────────────────────────────────────
   3. CROSSHAIR CURSOR (Crosshair component — vanilla)
   ───────────────────────────────────────────────────────────── */
(function initCursor() {
  if (window.innerWidth < 600) return; // skip on mobile

  const lineH   = document.getElementById('cursor-h');
  const lineV   = document.getElementById('cursor-v');
  const dot     = document.getElementById('cursor-dot');

  if (!lineH || !lineV || !dot) return;

  let curX = 0, curY = 0;
  let aimX = 0, aimY = 0;
  let visible = false;

  // Lerp toward mouse for smooth crosshair
  function lerp(a, b, t) { return a + (b - a) * t; }

  document.addEventListener('mousemove', e => {
    aimX = e.clientX;
    aimY = e.clientY;

    if (!visible) {
      visible = true;
      lineH.style.opacity = '1';
      lineV.style.opacity = '1';
      dot.style.opacity   = '1';
    }
  });

  document.addEventListener('mouseleave', () => {
    visible = false;
    lineH.style.opacity = '0';
    lineV.style.opacity = '0';
    dot.style.opacity   = '0';
  });

  function animateCursor() {
    curX = lerp(curX, aimX, 0.12);
    curY = lerp(curY, aimY, 0.12);

    lineH.style.top  = `${curY}px`;
    lineV.style.left = `${curX}px`;
    dot.style.left   = `${aimX}px`;
    dot.style.top    = `${aimY}px`;

    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  // Scale dot on hover over interactive elements
  document.querySelectorAll('a, button, .btn, .feature-card, .social-link, .nav-cta').forEach(el => {
    el.addEventListener('mouseenter', () => {
      dot.style.transform = 'translate(-50%, -50%) scale(3)';
      dot.style.opacity   = '0.4';
    });
    el.addEventListener('mouseleave', () => {
      dot.style.transform = 'translate(-50%, -50%) scale(1)';
      dot.style.opacity   = '1';
    });
  });
})();


/* ─────────────────────────────────────────────────────────────
   4. NAVBAR SCROLL BEHAVIOUR
   ───────────────────────────────────────────────────────────── */
(function initNavbar() {
  const nav = document.getElementById('navbar');
  if (!nav) return;
  const onScroll = () => {
    if (window.scrollY > 40) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
})();


/* ─────────────────────────────────────────────────────────────
   5. SCROLL REVEAL — IntersectionObserver
   Covers [data-reveal] (fade-up) and [data-step] + [data-card]
   ───────────────────────────────────────────────────────────── */
(function initScrollReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));
  document.querySelectorAll('[data-step]').forEach(el  => io.observe(el));
  document.querySelectorAll('[data-card]').forEach(el  => io.observe(el));
})();


/* ─────────────────────────────────────────────────────────────
   6. DECRYPTED TEXT EFFECT — badge text (DecryptedText-inspired)
   ───────────────────────────────────────────────────────────── */
(function initDecrypt() {
  const el = document.getElementById('decrypt-badge');
  if (!el) return;

  const target   = el.textContent.trim();
  const chars    = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!#$@';
  let iteration  = 0;
  let interval   = null;
  let resolved   = false;

  function scramble() {
    el.textContent = target.split('').map((ch, i) => {
      if (i < iteration) return target[i];
      if (ch === ' ') return ' ';
      return chars[Math.floor(Math.random() * chars.length)];
    }).join('');

    if (iteration >= target.length) {
      clearInterval(interval);
      resolved = true;
      el.textContent = target;
    }
    iteration += 0.5;
  }

  // Trigger after short delay on load
  setTimeout(() => {
    iteration = 0;
    interval  = setInterval(scramble, 45);
  }, 800);

  // Re-run on hover of parent badge
  const badge = el.closest('.hero-badge');
  if (badge) {
    badge.addEventListener('mouseenter', () => {
      if (!resolved) return;
      iteration = 0;
      clearInterval(interval);
      interval = setInterval(scramble, 40);
    });
  }
})();


/* ─────────────────────────────────────────────────────────────
   7. FEATURE CARD — mouse glow follow (card shimmer)
   ───────────────────────────────────────────────────────────── */
(function initCardGlow() {
  document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width)  * 100;
      const y = ((e.clientY - rect.top)  / rect.height) * 100;
      card.style.setProperty('--mouse-x', `${x}%`);
      card.style.setProperty('--mouse-y', `${y}%`);
    });
  });
})();


/* ─────────────────────────────────────────────────────────────
   8. BUTTON RIPPLE EFFECT
   ───────────────────────────────────────────────────────────── */
(function initRipple() {
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size   = Math.max(rect.width, rect.height) * 2;
      const x      = e.clientX - rect.left - size / 2;
      const y      = e.clientY - rect.top  - size / 2;

      Object.assign(ripple.style, {
        position:     'absolute',
        width:        `${size}px`,
        height:       `${size}px`,
        left:         `${x}px`,
        top:          `${y}px`,
        borderRadius: '50%',
        background:   'rgba(255,255,255,0.15)',
        transform:    'scale(0)',
        animation:    'ripple-anim 0.6s ease-out forwards',
        pointerEvents:'none'
      });

      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 700);
    });
  });

  // Inject keyframe
  const style = document.createElement('style');
  style.textContent = `
    @keyframes ripple-anim {
      to { transform: scale(1); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
})();


/* ─────────────────────────────────────────────────────────────
   9. STAGGER REVEAL DELAYS — sections label + title
   ───────────────────────────────────────────────────────────── */
(function initStaggeredSectionReveal() {
  // For each section, stagger children with [data-reveal]
  document.querySelectorAll('section').forEach(section => {
    const revealEls = section.querySelectorAll('[data-reveal]');
    revealEls.forEach((el, i) => {
      el.style.transitionDelay = `${i * 0.08}s`;
    });
  });
})();


/* ─────────────────────────────────────────────────────────────
   10. SMOOTH ANCHOR SCROLL
   ───────────────────────────────────────────────────────────── */
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = 80; // navbar height
      const top    = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();


/* ─────────────────────────────────────────────────────────────
   11. AURORA-STYLE GLOW behind hero on mousemove
   ───────────────────────────────────────────────────────────── */
(function initHeroMouseGlow() {
  const hero = document.getElementById('hero');
  if (!hero) return;

  let gx = 50, gy = 50;
  let tx = 50, ty = 50;

  hero.addEventListener('mousemove', e => {
    const rect = hero.getBoundingClientRect();
    tx = ((e.clientX - rect.left) / rect.width)  * 100;
    ty = ((e.clientY - rect.top)  / rect.height) * 100;
  });

  function tick() {
    gx += (tx - gx) * 0.05;
    gy += (ty - gy) * 0.05;
    hero.style.setProperty('--gx', `${gx}%`);
    hero.style.setProperty('--gy', `${gy}%`);
    requestAnimationFrame(tick);
  }
  tick();

  // Inject the pseudo-element style
  const style = document.createElement('style');
  style.textContent = `
    #hero::after {
      content: '';
      position: absolute;
      inset: 0;
      z-index: 1;
      background: radial-gradient(
        circle 600px at var(--gx, 50%) var(--gy, 50%),
        rgba(30,144,255,0.07),
        transparent 70%
      );
      pointer-events: none;
      transition: --gx 0.1s, --gy 0.1s;
    }
  `;
  document.head.appendChild(style);
})();


/* ─────────────────────────────────────────────────────────────
   12. COUNTUP for stats / any future [data-count] elements
   ───────────────────────────────────────────────────────────── */
(function initCountUp() {
  const els = document.querySelectorAll('[data-count]');
  if (!els.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el  = entry.target;
      const end = parseFloat(el.dataset.count);
      const dur = 2000;
      const start = performance.now();
      function step(now) {
        const t = Math.min((now - start) / dur, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(ease * end).toLocaleString();
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
      io.unobserve(el);
    });
  }, { threshold: 0.5 });

  els.forEach(el => io.observe(el));
})();


/* ─────────────────────────────────────────────────────────────
   13. BORDER SWEEP FALLBACK (for browsers without @property)
   ───────────────────────────────────────────────────────────── */
(function initBorderSweepFallback() {
  // If @property is unsupported, animate via JS
  if (CSS.supports && CSS.supports('@property', '--angle')) return;
  const card = document.querySelector('.dl-card');
  if (!card) return;

  let angle = 0;
  function sweep() {
    angle = (angle + 0.5) % 360;
    card.style.setProperty('--angle', `${angle}deg`);
    requestAnimationFrame(sweep);
  }
  sweep();
})();


/* ─────────────────────────────────────────────────────────────
   14. NAV ACTIVE LINK on scroll section
   ───────────────────────────────────────────────────────────── */
(function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const links    = document.querySelectorAll('.nav-links a');

  function onScroll() {
    const scrollY = window.scrollY + 100;
    let current = '';
    sections.forEach(sec => {
      if (sec.offsetTop <= scrollY) current = sec.id;
    });
    links.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // Active style injection
  const style = document.createElement('style');
  style.textContent = `.nav-links a.active { color: var(--white) !important; }`;
  document.head.appendChild(style);
})();


/* ─────────────────────────────────────────────────────────────
   15. TITLE GLITCH EFFECT (occasional random glitch on hero)
   ───────────────────────────────────────────────────────────── */
(function initGlitch() {
  const title = document.querySelector('.hero-title');
  if (!title) return;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes glitch-clip-1 {
      0%   { clip-path: inset(10% 0 85% 0); transform: translate(-4px, 0); }
      20%  { clip-path: inset(50% 0 30% 0); transform: translate(4px,  0); }
      40%  { clip-path: inset(80% 0 5%  0); transform: translate(-2px, 0); }
      60%  { clip-path: inset(20% 0 70% 0); transform: translate(2px,  0); }
      80%  { clip-path: inset(65% 0 15% 0); transform: translate(-4px, 0); }
      100% { clip-path: inset(10% 0 85% 0); transform: translate(0,    0); }
    }
    @keyframes glitch-clip-2 {
      0%   { clip-path: inset(85% 0 5%  0); transform: translate(4px,  0); }
      20%  { clip-path: inset(5%  0 85% 0); transform: translate(-4px, 0); }
      40%  { clip-path: inset(40% 0 50% 0); transform: translate(2px,  0); }
      60%  { clip-path: inset(70% 0 20% 0); transform: translate(-2px, 0); }
      80%  { clip-path: inset(15% 0 75% 0); transform: translate(4px,  0); }
      100% { clip-path: inset(85% 0 5%  0); transform: translate(0,    0); }
    }
    .hero-title.glitching::before,
    .hero-title.glitching::after {
      content: attr(data-text);
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
    .hero-title { position: relative; }
    .hero-title.glitching::before {
      color: #00d4ff;
      animation: glitch-clip-1 0.3s steps(1) forwards;
    }
    .hero-title.glitching::after {
      color: #1e90ff;
      animation: glitch-clip-2 0.3s steps(1) forwards;
    }
  `;
  document.head.appendChild(style);

  // Set data-text to title text
  title.setAttribute('data-text', title.textContent);

  function triggerGlitch() {
    title.classList.add('glitching');
    setTimeout(() => title.classList.remove('glitching'), 350);
    // Schedule next glitch randomly every 5–12s
    setTimeout(triggerGlitch, 5000 + Math.random() * 7000);
  }

  // First glitch after 3s
  setTimeout(triggerGlitch, 3000);
})();


/* ─────────────────────────────────────────────────────────────
   DONE. All systems go 🚀
   ───────────────────────────────────────────────────────────── */
console.log('%cTouchlessTouch · Built by OKSnappy', 'color:#1e90ff;font-family:monospace;font-size:14px');
