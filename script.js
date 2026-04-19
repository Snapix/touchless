/* ─── TouchlessTouch — script.js (final) ─────────────────── */
(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════
     1. CUSTOM CURSOR (desktop) + TOUCH SPARKS (mobile)
  ══════════════════════════════════════════════════════════ */
  const curOuter = document.getElementById('curOuter');
  const curInner = document.getElementById('curInner');
  const isMouse  = window.matchMedia('(hover:hover) and (pointer:fine)').matches;

  let mx = -200, my = -200, ox = -200, oy = -200;
  const LERP = 0.13;

  if (isMouse && curOuter && curInner) {
    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
    document.addEventListener('mousedown', () => document.body.classList.add('clicking'));
    document.addEventListener('mouseup',   () => document.body.classList.remove('clicking'));

    document.querySelectorAll('a, button, .btn, .fc, .step-card, .soc-card').forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
    });

    (function animCursor() {
      ox += (mx - ox) * LERP;
      oy += (my - oy) * LERP;
      curOuter.style.left = ox + 'px';
      curOuter.style.top  = oy + 'px';
      curInner.style.left = mx + 'px';
      curInner.style.top  = my + 'px';
      requestAnimationFrame(animCursor);
    })();
  } else {
    // hide cursor elements on touch
    if (curOuter) curOuter.style.display = 'none';
    if (curInner) curInner.style.display = 'none';
  }

  /* ══════════════════════════════════════════════════════════
     2. CLICK SPARK CANVAS — desktop click + mobile touch
     Ported from ReactBits ClickSpark component
  ══════════════════════════════════════════════════════════ */
  const sparkCanvas = document.getElementById('sparkCanvas');
  const sCtx = sparkCanvas.getContext('2d');
  let sW, sH;
  const sparks = [];
  const SPARK_COLOR  = '#38bdf8';
  const SPARK_SIZE   = 10;
  const SPARK_RADIUS = 22;
  const SPARK_COUNT  = 10;
  const SPARK_DUR    = 480;

  function resizeSpark() {
    sW = sparkCanvas.width  = window.innerWidth;
    sH = sparkCanvas.height = window.innerHeight;
  }
  resizeSpark();
  window.addEventListener('resize', resizeSpark);

  function easeOut(t) { return t * (2 - t); }

  function spawnSparks(x, y) {
    const now = performance.now();
    for (let i = 0; i < SPARK_COUNT; i++) {
      sparks.push({ x, y, angle: (2 * Math.PI * i) / SPARK_COUNT, t0: now });
    }
  }

  // desktop
  document.addEventListener('click', e => spawnSparks(e.clientX, e.clientY));
  // mobile touch
  document.addEventListener('touchstart', e => {
    for (const t of e.changedTouches) spawnSparks(t.clientX, t.clientY);
  }, { passive: true });

  (function drawSparks(ts) {
    sCtx.clearRect(0, 0, sW, sH);
    const alive = [];
    for (const sp of sparks) {
      const elapsed = ts - sp.t0;
      if (elapsed >= SPARK_DUR) continue;
      alive.push(sp);
      const p = elapsed / SPARK_DUR;
      const e = easeOut(p);
      const dist = e * SPARK_RADIUS;
      const len  = SPARK_SIZE * (1 - e);
      const x1   = sp.x + dist * Math.cos(sp.angle);
      const y1   = sp.y + dist * Math.sin(sp.angle);
      const x2   = sp.x + (dist + len) * Math.cos(sp.angle);
      const y2   = sp.y + (dist + len) * Math.sin(sp.angle);
      sCtx.globalAlpha = 1 - p;
      sCtx.strokeStyle = SPARK_COLOR;
      sCtx.lineWidth   = 2;
      sCtx.lineCap     = 'round';
      sCtx.beginPath();
      sCtx.moveTo(x1, y1);
      sCtx.lineTo(x2, y2);
      sCtx.stroke();
    }
    sCtx.globalAlpha = 1;
    sparks.length = 0;
    sparks.push(...alive);
    requestAnimationFrame(drawSparks);
  })(0);

  /* ══════════════════════════════════════════════════════════
     3. FLOATING LINES BACKGROUND (WebGL)
     Ported from ReactBits FloatingLines component — GLSL shader
  ══════════════════════════════════════════════════════════ */
  const lCvs = document.getElementById('linesCanvas');
  (function initLines() {
    const gl = lCvs.getContext('webgl', { alpha: true, antialias: true });
    if (!gl) { lCvs.style.display = 'none'; return; }

    let LW, LH;
    function resizeLines() {
      LW = lCvs.width  = window.innerWidth;
      LH = lCvs.height = window.innerHeight;
      gl.viewport(0, 0, LW, LH);
    }
    resizeLines();
    window.addEventListener('resize', resizeLines);

    const vert = `
      attribute vec2 position;
      void main(){gl_Position=vec4(position,0.0,1.0);}
    `;

    const frag = `
      precision highp float;
      uniform vec2 iResolution;
      uniform float iTime;
      uniform vec2 iMouse;
      uniform float bendInfluence;

      mat2 rotate(float r){return mat2(cos(r),sin(r),-sin(r),cos(r));}

      float wave(vec2 uv,float offset,vec2 screenUv,vec2 mouseUv){
        float time=iTime*0.9;
        float amp=sin(offset+time*0.2)*0.28;
        float y=sin(uv.x+offset+time*0.1)*amp;
        vec2 d=screenUv-mouseUv;
        float inf=exp(-dot(d,d)*4.5);
        float bend=(mouseUv.y-screenUv.y)*inf*(-0.45)*bendInfluence;
        y+=bend;
        float m=uv.y-y;
        return 0.016/max(abs(m)+0.01,1e-3)+0.008;
      }

      void main(){
        vec2 baseUv=(2.0*gl_FragCoord.xy-iResolution.xy)/iResolution.y;
        baseUv.y*=-1.0;
        vec2 mouseUv=(2.0*iMouse-iResolution.xy)/iResolution.y;
        mouseUv.y*=-1.0;

        vec3 col=vec3(0.0);
        /* Blue gradient palette */
        vec3 c1=vec3(0.12,0.28,0.75);
        vec3 c2=vec3(0.06,0.55,0.92);
        vec3 c3=vec3(0.05,0.18,0.55);

        /* middle waves */
        for(int i=0;i<6;++i){
          float fi=float(i);
          float t=fi/5.0;
          vec3 lc=mix(c3,c2,t)*0.5;
          float ang=0.2*log(length(baseUv)+1.0);
          vec2 ruv=baseUv*rotate(ang);
          col+=lc*wave(ruv+vec2(0.05*fi+5.0,0.0),2.0+0.15*fi,baseUv,mouseUv);
        }
        /* top waves (subtle) */
        for(int i=0;i<4;++i){
          float fi=float(i);
          float t=fi/3.0;
          vec3 lc=mix(c1,c2,t)*0.3;
          float ang=-0.4*log(length(baseUv)+1.0);
          vec2 ruv=baseUv*rotate(ang);
          ruv.x*=-1.0;
          col+=lc*wave(ruv+vec2(0.05*fi+10.0,0.5),1.0+0.2*fi,baseUv,mouseUv)*0.12;
        }
        /* bottom waves */
        for(int i=0;i<4;++i){
          float fi=float(i);
          vec3 lc=mix(c3,c1,fi/3.0)*0.35;
          float ang=0.4*log(length(baseUv)+1.0);
          vec2 ruv=baseUv*rotate(ang);
          col+=lc*wave(ruv+vec2(0.05*fi+2.0,-0.7),1.5+0.2*fi,baseUv,mouseUv)*0.22;
        }
        gl_FragColor=vec4(col,1.0);
      }
    `;

    function compileShader(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }
    const prog = gl.createProgram();
    gl.attachShader(prog, compileShader(gl.VERTEX_SHADER, vert));
    gl.attachShader(prog, compileShader(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(prog, 'position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, 'iResolution');
    const uTime = gl.getUniformLocation(prog, 'iTime');
    const uMouse = gl.getUniformLocation(prog, 'iMouse');
    const uBend = gl.getUniformLocation(prog, 'bendInfluence');

    let tmx = LW/2, tmy = LH/2, cmx = LW/2, cmy = LH/2;
    let tBend = 0, cBend = 0;
    const DAMP = 0.06;

    window.addEventListener('mousemove', e => { tmx = e.clientX; tmy = e.clientY; tBend = 1; });
    window.addEventListener('mouseleave', () => { tBend = 0; });
    window.addEventListener('touchmove', e => {
      const t = e.touches[0];
      tmx = t.clientX; tmy = t.clientY; tBend = 1;
    }, { passive: true });
    window.addEventListener('touchend', () => { tBend = 0; });

    const start = performance.now();
    (function renderLines() {
      const t = (performance.now() - start) / 1000;
      cmx += (tmx - cmx) * DAMP; cmy += (tmy - cmy) * DAMP;
      cBend += (tBend - cBend) * DAMP;
      gl.uniform2f(uRes, LW, LH);
      gl.uniform1f(uTime, t);
      gl.uniform2f(uMouse, cmx, LH - cmy);
      gl.uniform1f(uBend, cBend);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      requestAnimationFrame(renderLines);
    })();
  })();

  /* ══════════════════════════════════════════════════════════
     4. AMBIENT PARTICLE CANVAS
  ══════════════════════════════════════════════════════════ */
  const bgC = document.getElementById('bgCanvas');
  const bCtx = bgC.getContext('2d');
  let BW, BH;

  function resizeBg() { BW = bgC.width = window.innerWidth; BH = bgC.height = window.innerHeight; }
  resizeBg();
  window.addEventListener('resize', resizeBg);

  function rr(a, b) { return a + Math.random() * (b - a); }

  const PCNT = 55;
  const pts = Array.from({ length: PCNT }, () => ({
    x: rr(0, window.innerWidth), y: rr(0, window.innerHeight),
    r: rr(.5, 2), dx: rr(-.15, .15), dy: rr(-.1, .1),
    a: rr(.08, .45), h: rr(198, 228),
    ph: rr(0, Math.PI * 2), ps: rr(.008, .022),
  }));

  (function drawBg() {
    bCtx.clearRect(0, 0, BW, BH);
    const MAX = 130;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      p.ph += p.ps;
      const a = p.a * (.7 + .3 * Math.sin(p.ph));
      // connections
      for (let j = i + 1; j < pts.length; j++) {
        const q = pts[j];
        const dx = p.x - q.x, dy = p.y - q.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < MAX) {
          bCtx.beginPath();
          bCtx.moveTo(p.x, p.y);
          bCtx.lineTo(q.x, q.y);
          bCtx.strokeStyle = `hsla(210,75%,65%,${(1 - d / MAX) * .06})`;
          bCtx.lineWidth = .5;
          bCtx.stroke();
        }
      }
      // glow
      const g = bCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 7);
      g.addColorStop(0, `hsla(${p.h},80%,68%,${a * .35})`);
      g.addColorStop(1, `hsla(${p.h},80%,68%,0)`);
      bCtx.beginPath(); bCtx.arc(p.x, p.y, p.r * 7, 0, Math.PI * 2);
      bCtx.fillStyle = g; bCtx.fill();
      // dot
      bCtx.beginPath(); bCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      bCtx.fillStyle = `hsla(${p.h},80%,72%,${a})`; bCtx.fill();
      // move
      p.x += p.dx; p.y += p.dy;
      if (p.x < -10) p.x = BW + 10;
      if (p.x > BW + 10) p.x = -10;
      if (p.y < -10) p.y = BH + 10;
      if (p.y > BH + 10) p.y = -10;
    }
    requestAnimationFrame(drawBg);
  })();

  /* ══════════════════════════════════════════════════════════
     5. INTRO TITLE ANIMATION (6 sec blur reveal)
  ══════════════════════════════════════════════════════════ */
  const overlay = document.getElementById('introOverlay');
  const introBar = document.getElementById('introBar');

  // After 5.5s, fade overlay out → reveal page
  setTimeout(() => {
    if (overlay) overlay.classList.add('gone');
    // trigger hero reveals
    document.querySelectorAll('.hero .reveal-up').forEach(el => el.classList.add('revealed'));
  }, 5500);

  /* ══════════════════════════════════════════════════════════
     6. SCROLL REVEAL (IntersectionObserver)
  ══════════════════════════════════════════════════════════ */
  const revEls = document.querySelectorAll('.reveal-up, .reveal-side, .reveal-scale');
  const revObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('revealed'); revObs.unobserve(e.target); }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -35px 0px' });
  revEls.forEach(el => revObs.observe(el));

  /* ══════════════════════════════════════════════════════════
     7. HERO PARALLAX
  ══════════════════════════════════════════════════════════ */
  const heroVis = document.getElementById('heroVis');
  window.addEventListener('scroll', () => {
    if (heroVis) heroVis.style.transform = `translateY(${window.scrollY * 0.07}px)`;
  }, { passive: true });

  /* ══════════════════════════════════════════════════════════
     8. 3D TILT on cards
  ══════════════════════════════════════════════════════════ */
  document.querySelectorAll('.fc, .step-card').forEach(card => {
    card.style.transformStyle = 'preserve-3d';
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      card.style.transform = `translateY(-6px) rotateX(${y * -9}deg) rotateY(${x * 9}deg)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });

  /* ══════════════════════════════════════════════════════════
     9. BUTTON RIPPLE
  ══════════════════════════════════════════════════════════ */
  if (!document.getElementById('rippleKf')) {
    const s = document.createElement('style');
    s.id = 'rippleKf';
    s.textContent = '@keyframes rippleAnim{to{transform:scale(4);opacity:0}}';
    document.head.appendChild(s);
  }
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const rp = document.createElement('span');
      const rc = btn.getBoundingClientRect();
      const sz = Math.max(rc.width, rc.height);
      Object.assign(rp.style, {
        position:'absolute', width:sz+'px', height:sz+'px',
        left:(e.clientX-rc.left-sz/2)+'px', top:(e.clientY-rc.top-sz/2)+'px',
        borderRadius:'50%', background:'rgba(255,255,255,.12)',
        transform:'scale(0)', animation:'rippleAnim .65s linear', pointerEvents:'none'
      });
      btn.appendChild(rp);
      rp.addEventListener('animationend', () => rp.remove());
    });
  });

  /* ══════════════════════════════════════════════════════════
     10. PROFILE IMAGE — handle load error
  ══════════════════════════════════════════════════════════ */
  const cImg = document.getElementById('creatorImg');
  if (cImg) {
    cImg.addEventListener('error', () => {
      cImg.classList.add('broken');
    });
  }

  /* ══════════════════════════════════════════════════════════
     11. ANIMATED BACKGROUND MESH SHIFT
  ══════════════════════════════════════════════════════════ */
  const heroMesh = document.querySelector('.hero-mesh');
  if (heroMesh) {
    let t = 0;
    setInterval(() => {
      t += 0.4;
      const a = Math.sin(t * 0.017) * 7;
      const b = Math.cos(t * 0.013) * 5;
      heroMesh.style.background = `
        radial-gradient(ellipse 80% 60% at ${62+a}% ${38+b}%,rgba(29,78,216,.2) 0%,transparent 62%),
        radial-gradient(ellipse 50% 40% at ${8+b}% 80%,rgba(56,189,248,.08) 0%,transparent 60%),
        radial-gradient(ellipse 35% 50% at 92% ${12+a}%,rgba(99,102,241,.07) 0%,transparent 60%)
      `;
    }, 45);
  }

})();
