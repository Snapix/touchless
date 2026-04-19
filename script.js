/* ─── TOUCHLESSTOUCH — script.js ──────────────────────────── */

(function () {
  'use strict';

  /* ── CURSOR AMBIENT GLOW ────────────────────────────────── */
  const cursorGlow = document.getElementById('cursorGlow');
  let cx = window.innerWidth / 2, cy = window.innerHeight / 2;
  let tx = cx, ty = cy;

  document.addEventListener('mousemove', (e) => {
    tx = e.clientX;
    ty = e.clientY;
  });

  function lerpCursor() {
    cx += (tx - cx) * 0.08;
    cy += (ty - cy) * 0.08;
    if (cursorGlow) {
      cursorGlow.style.left = cx + 'px';
      cursorGlow.style.top = cy + 'px';
    }
    requestAnimationFrame(lerpCursor);
  }
  lerpCursor();

  /* ── BACKGROUND PARTICLE CANVAS ─────────────────────────── */
  const canvas = document.getElementById('bgCanvas');
  const ctx = canvas.getContext('2d');
  let W, H;

  const PARTICLE_COUNT = 70;
  const particles = [];

  function resizeCanvas() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  function randomRange(a, b) { return a + Math.random() * (b - a); }

  function makeParticle() {
    return {
      x: randomRange(0, W),
      y: randomRange(0, H),
      r: randomRange(0.5, 2.2),
      dx: randomRange(-0.18, 0.18),
      dy: randomRange(-0.12, 0.12),
      alpha: randomRange(0.1, 0.55),
      hue: randomRange(195, 230),
      pulse: randomRange(0, Math.PI * 2),
      pulseSpeed: randomRange(0.008, 0.025),
    };
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(makeParticle());

  /* Connection lines */
  function drawConnections() {
    const MAX_DIST = 140;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAX_DIST) {
          const opacity = (1 - dist / MAX_DIST) * 0.08;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `hsla(210, 80%, 65%, ${opacity})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function animateParticles() {
    ctx.clearRect(0, 0, W, H);

    particles.forEach(p => {
      p.pulse += p.pulseSpeed;
      const glowAlpha = p.alpha * (0.7 + 0.3 * Math.sin(p.pulse));

      // Glow
      const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6);
      grd.addColorStop(0, `hsla(${p.hue}, 80%, 70%, ${glowAlpha * 0.4})`);
      grd.addColorStop(1, `hsla(${p.hue}, 80%, 70%, 0)`);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 6, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      // Core dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 80%, 75%, ${glowAlpha})`;
      ctx.fill();

      p.x += p.dx;
      p.y += p.dy;

      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10;
      if (p.y > H + 10) p.y = -10;
    });

    drawConnections();
    requestAnimationFrame(animateParticles);
  }

  animateParticles();

  /* ── HERO VISUAL CANVAS (RADAR / GRID) ──────────────────── */
  const visCanvas = document.getElementById('visCanvas');
  if (visCanvas) {
    const vc = visCanvas.getContext('2d');
    const VW = visCanvas.width;
    const VH = visCanvas.height;
    let angle = 0;
    let mouseVX = VW / 2, mouseVY = VH / 2;

    visCanvas.addEventListener('mousemove', (e) => {
      const rect = visCanvas.getBoundingClientRect();
      mouseVX = e.clientX - rect.left;
      mouseVY = e.clientY - rect.top;
    });

    function drawVisCanvas() {
      vc.clearRect(0, 0, VW, VH);

      const cx = VW / 2, cy = VH / 2;

      // Sweep radar effect
      const sweepGrad = vc.createConicalGradient
        ? null
        : null;

      // Draw radar sweep manually
      const sweepLen = Math.PI * 0.6;
      const grd = vc.createConicalGradient
        ? null
        : (() => {
          // Fallback: draw arc segment
          vc.save();
          vc.beginPath();
          vc.moveTo(cx, cy);
          vc.arc(cx, cy, 160, angle - sweepLen, angle);
          vc.closePath();
          const sg = vc.createRadialGradient(cx, cy, 0, cx, cy, 160);
          sg.addColorStop(0, 'rgba(56,189,248,0.0)');
          sg.addColorStop(0.7, 'rgba(56,189,248,0.05)');
          sg.addColorStop(1, 'rgba(56,189,248,0.0)');
          vc.fillStyle = sg;
          vc.fill();
          vc.restore();
        })();

      // Radar sweep line
      vc.save();
      vc.beginPath();
      vc.moveTo(cx, cy);
      vc.lineTo(
        cx + Math.cos(angle) * 155,
        cy + Math.sin(angle) * 155
      );
      const lineGrd = vc.createLinearGradient(cx, cy, cx + Math.cos(angle) * 155, cy + Math.sin(angle) * 155);
      lineGrd.addColorStop(0, 'rgba(56,189,248,0)');
      lineGrd.addColorStop(1, 'rgba(56,189,248,0.6)');
      vc.strokeStyle = lineGrd;
      vc.lineWidth = 1.5;
      vc.stroke();
      vc.restore();

      // Sweep fill
      vc.save();
      vc.beginPath();
      vc.moveTo(cx, cy);
      vc.arc(cx, cy, 155, angle - 1.2, angle);
      vc.closePath();
      const sweepFill = vc.createRadialGradient(cx, cy, 0, cx, cy, 155);
      sweepFill.addColorStop(0, 'rgba(56,189,248,0)');
      sweepFill.addColorStop(0.8, 'rgba(56,189,248,0.06)');
      sweepFill.addColorStop(1, 'rgba(56,189,248,0.02)');
      vc.fillStyle = sweepFill;
      vc.fill();
      vc.restore();

      // Data dots blipping
      const dots = [
        { x: cx + 60, y: cy - 40 },
        { x: cx - 50, y: cy + 55 },
        { x: cx + 30, y: cy + 70 },
        { x: cx - 70, y: cy - 30 },
      ];

      dots.forEach((dot, i) => {
        const dx = dot.x - cx;
        const dy = dot.y - cy;
        const dotAngle = Math.atan2(dy, dx);
        const diff = ((angle - dotAngle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        const fade = diff < 2.5 ? 1 - diff / 2.5 : 0;

        if (fade > 0.02) {
          vc.beginPath();
          vc.arc(dot.x, dot.y, 3 + fade * 3, 0, Math.PI * 2);
          vc.fillStyle = `rgba(56,189,248,${fade * 0.8})`;
          vc.fill();

          // Ripple
          vc.beginPath();
          vc.arc(dot.x, dot.y, 3 + (1 - fade) * 14, 0, Math.PI * 2);
          vc.strokeStyle = `rgba(56,189,248,${fade * 0.3})`;
          vc.lineWidth = 1;
          vc.stroke();
        }
      });

      angle += 0.018;
      if (angle > Math.PI * 2) angle -= Math.PI * 2;

      requestAnimationFrame(drawVisCanvas);
    }
    drawVisCanvas();
  }

  /* ── SCROLL REVEAL (IntersectionObserver) ───────────────── */
  const revealEls = document.querySelectorAll('.reveal-up, .reveal-side, .reveal-scale');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  revealEls.forEach(el => revealObserver.observe(el));

  /* ── HERO PARALLAX ──────────────────────────────────────── */
  const heroVisual = document.getElementById('heroVisual');

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    if (heroVisual) {
      heroVisual.style.transform = `translateY(${scrollY * 0.08}px)`;
    }
  }, { passive: true });

  /* ── BUTTON RIPPLE ──────────────────────────────────────── */
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', function (e) {
      const ripple = document.createElement('span');
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        border-radius: 50%;
        background: rgba(255,255,255,0.15);
        transform: scale(0);
        animation: rippleAnim 0.6s linear;
        pointer-events: none;
      `;

      // Inject ripple keyframes once
      if (!document.querySelector('#rippleStyle')) {
        const style = document.createElement('style');
        style.id = 'rippleStyle';
        style.textContent = `
          @keyframes rippleAnim {
            to { transform: scale(3); opacity: 0; }
          }
        `;
        document.head.appendChild(style);
      }

      btn.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  });

  /* ── SMOOTH SECTION ENTRANCE (OPACITY LERP) ─────────────── */
  // Already handled via CSS IntersectionObserver above

  /* ── CREATOR AVATAR FLOAT ───────────────────────────────── */
  const avatarWrap = document.querySelector('.creator-avatar-wrap');
  if (avatarWrap) {
    let floatAngle = 0;
    function floatAvatar() {
      floatAngle += 0.012;
      const y = Math.sin(floatAngle) * 6;
      avatarWrap.style.transform = `translateY(${y}px)`;
      requestAnimationFrame(floatAvatar);
    }
    floatAvatar();
  }

  /* ── FEAT CARD 3D TILT ───────────────────────────────────── */
  document.querySelectorAll('.feat-card, .step-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      const tiltX = y * -8;
      const tiltY = x * 8;
      card.style.transform = `translateY(-6px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
      card.style.transformStyle = 'preserve-3d';
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  /* ── SOCIAL CARD HOVER COLOR LEAK ───────────────────────── */
  document.querySelectorAll('.social-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.boxShadow = '';
    });
  });

  /* ── HERO TEXT STAGGER ON LOAD ───────────────────────────── */
  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      document.querySelectorAll('.hero .reveal-up, .hero .badge').forEach(el => {
        el.classList.add('revealed');
      });
    }, 100);
  });

  /* Also trigger immediately if DOMContentLoaded already fired */
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(() => {
      document.querySelectorAll('.hero .reveal-up, .hero .badge').forEach(el => {
        el.classList.add('revealed');
      });
    }, 100);
  }

  /* ── ANIMATED GRADIENT BACKGROUND SHIFT ─────────────────── */
  let gradAngle = 0;
  const heroSection = document.querySelector('.hero');
  if (heroSection) {
    setInterval(() => {
      gradAngle = (gradAngle + 0.2) % 360;
      heroSection.querySelector('.hero-bg-mesh').style.background = `
        radial-gradient(ellipse 80% 60% at ${55 + Math.sin(gradAngle * 0.017) * 8}% ${38 + Math.cos(gradAngle * 0.017) * 6}%, rgba(29,78,216,0.22) 0%, transparent 60%),
        radial-gradient(ellipse 50% 40% at ${10 + Math.cos(gradAngle * 0.017) * 5}% 80%, rgba(56,189,248,0.1) 0%, transparent 60%),
        radial-gradient(ellipse 40% 50% at 90% ${10 + Math.sin(gradAngle * 0.02) * 6}%, rgba(99,102,241,0.08) 0%, transparent 60%)
      `;
    }, 40);
  }

  /* ── SCROLL-BASED GLOW INTENSITY ─────────────────────────── */
  window.addEventListener('scroll', () => {
    const scrollFraction = Math.min(window.scrollY / 600, 1);
    if (cursorGlow) {
      cursorGlow.style.opacity = 1 - scrollFraction * 0.4;
    }
  }, { passive: true });

})();
