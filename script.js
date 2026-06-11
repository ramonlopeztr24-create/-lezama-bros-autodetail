/* ============================================================
   LEZAMA BROS AUTO DETAIL — script.js  (v5 — black theme)
   · Hero    — drag-to-clean (real Defender) + auto-demo sweep
               + power-wash spray & shampoo foam
   · Process — squeegee wipes fog off on scroll + spray
   · Ceramic — hydrophobic water beading
   · nav · scroll reveal · giant wordmark fit
   ============================================================ */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));


/* ------------------------------------------------------------ NAV */
const nav = document.getElementById("nav");
const onNav = () => nav.classList.toggle("scrolled", window.scrollY > 30);
window.addEventListener("scroll", onNav, { passive: true });
onNav();


/* ------------------------------------------------------------
   WASH FX — power-wash spray + shampoo foam at the wipe seam.
------------------------------------------------------------ */
function attachWash(ba, canvas) {
  if (!ba || !canvas || reduceMotion) return;
  const ctx = canvas.getContext("2d");
  let w, h, dpr;
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = ba.clientWidth; h = ba.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  new ResizeObserver(resize).observe(ba);

  const drops = [], foam = [];
  let prevPos = null, activity = 0;
  const seamX = () => (parseFloat(getComputedStyle(ba).getPropertyValue("--pos")) || 50) / 100 * w;

  const spawn = (x, power) => {
    const n = Math.ceil(power * 8);
    for (let i = 0; i < n; i++) {
      const sp = 5 + Math.random() * 8;
      drops.push({ x: x + (Math.random() - 0.5) * 12, y: h * 0.12 + Math.random() * h * 0.2, vx: -(sp * (0.5 + Math.random())), vy: sp * 0.35 + Math.random() * 1.8, life: 1, decay: 0.016 + Math.random() * 0.02, r: 0.8 + Math.random() * 2.1 });
    }
    if (Math.random() < power) {
      const cx = x - Math.random() * 34, cy = h * (0.26 + Math.random() * 0.58);
      const bubbles = 3 + Math.floor(Math.random() * 4);
      for (let b = 0; b < bubbles; b++) foam.push({ x: cx + (Math.random() - 0.5) * 28, y: cy + (Math.random() - 0.5) * 22, r: 7 + Math.random() * 16, life: 1, decay: 0.008 + Math.random() * 0.008, vy: -(0.1 + Math.random() * 0.45) });
    }
  };

  const loop = () => {
    ctx.clearRect(0, 0, w, h);
    const pos = seamX();
    if (prevPos != null && Math.abs(pos - prevPos) > 0.3) activity = 1;
    activity *= 0.9; prevPos = pos;
    const power = ba.classList.contains("dragging") || ba.classList.contains("auto") ? 1 : activity;

    if (power > 0.06) {
      spawn(pos, power);
      const g = ctx.createRadialGradient(pos, h * 0.16, 0, pos, h * 0.16, 64);
      g.addColorStop(0, `rgba(205,245,255,${0.2 * power})`);
      g.addColorStop(1, "rgba(205,245,255,0)");
      ctx.fillStyle = g; ctx.fillRect(pos - 64, h * 0.16 - 64, 128, 128);
    }
    for (let i = foam.length - 1; i >= 0; i--) {
      const f = foam[i]; f.y += f.vy; f.life -= f.decay;
      if (f.life <= 0) { foam.splice(i, 1); continue; }
      const a = Math.min(1, f.life * 1.4);
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 7); ctx.fillStyle = `rgba(248,252,255,${0.7 * a})`; ctx.fill();
      ctx.beginPath(); ctx.arc(f.x - f.r * 0.32, f.y - f.r * 0.32, f.r * 0.4, 0, 7); ctx.fillStyle = `rgba(255,255,255,${0.85 * a})`; ctx.fill();
    }
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i]; d.x += d.vx; d.y += d.vy; d.vy += 0.17; d.life -= d.decay;
      if (d.life <= 0 || d.y > h) { drops.splice(i, 1); continue; }
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 7); ctx.fillStyle = `rgba(195,240,250,${0.75 * d.life})`; ctx.fill();
    }
    requestAnimationFrame(loop);
  };
  loop();
}


/* ------------------------------------------------------------
   HERO — drag-to-clean + a one-time auto demo sweep on load
------------------------------------------------------------ */
const ba = document.getElementById("ba");
if (ba) {
  const hint = document.getElementById("baHint");
  attachWash(ba, document.getElementById("baSpray"));
  let dragging = false, hintGone = false, userTouched = false;

  const setPos = (clientX) => {
    const r = ba.getBoundingClientRect();
    ba.style.setProperty("--pos", clamp(((clientX - r.left) / r.width) * 100, 2, 98) + "%");
  };
  const killHint = () => { if (hintGone) return; hintGone = true; ba.classList.remove("ba--hint"); hint?.classList.add("hide"); };
  const start = (e) => { dragging = true; userTouched = true; ba.classList.add("dragging"); ba.classList.remove("auto"); killHint(); setPos(e.clientX); };
  const move = (e) => { if (dragging) setPos(e.clientX); };
  const end = () => { dragging = false; ba.classList.remove("dragging"); };

  ba.addEventListener("pointerdown", (e) => { ba.setPointerCapture?.(e.pointerId); start(e); });
  ba.addEventListener("pointermove", move);
  ba.addEventListener("pointerup", end);
  ba.addEventListener("pointercancel", end);

  // Auto demo: when the hero scrolls into view, sweep dirty→clean once
  // so visitors instantly see the transformation, then they can drag.
  if (!reduceMotion) {
    const runDemo = () => {
      if (userTouched) return;
      ba.classList.add("auto");
      ba.style.setProperty("--pos", "92%");
      const startT = performance.now();
      const dur = 2200;
      const tick = (now) => {
        if (userTouched) { ba.classList.remove("auto"); return; }
        const p = Math.min((now - startT) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const pos = 92 - eased * 78; // 92% → 14%
        ba.style.setProperty("--pos", pos + "%");
        if (p < 1) requestAnimationFrame(tick);
        else { ba.classList.remove("auto"); ba.classList.add("ba--hint"); setTimeout(() => ba.classList.remove("ba--hint"), 3600); }
      };
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) { runDemo(); io.disconnect(); } }, { threshold: 0.5 });
    io.observe(ba);
  }
}


/* ------------------------------------------------------------
   PROCESS — squeegee reveal driven by scroll
------------------------------------------------------------ */
const proc = document.getElementById("process");
const squeegee = document.getElementById("squeegee");
const sprayCanvas = document.getElementById("squeegeeSpray");
const sqHint = document.getElementById("squeegeeHint");
const steps = Array.from(document.querySelectorAll(".step"));
const desktopProc = window.matchMedia("(min-width: 881px)").matches;

if (proc && squeegee && !reduceMotion) {
  const ctx = sprayCanvas.getContext("2d");
  let w, h, dpr;
  const drops = [], foam = [];
  const resize = () => { dpr = Math.min(window.devicePixelRatio || 1, 2); w = squeegee.clientWidth; h = squeegee.clientHeight; sprayCanvas.width = w * dpr; sprayCanvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  resize(); new ResizeObserver(resize).observe(squeegee);

  let wipe = 0, prevWipe = 0, activity = 0;
  const spawn = (yPx, power) => {
    const n = Math.ceil(power * 7);
    for (let i = 0; i < n; i++) { const sp = 4 + Math.random() * 7; drops.push({ x: w * (0.1 + Math.random() * 0.8), y: yPx, vx: (Math.random() - 0.5) * sp, vy: sp * 0.6 + Math.random() * 2, life: 1, decay: 0.016 + Math.random() * 0.02, r: 0.8 + Math.random() * 1.9 }); }
    if (Math.random() < power) { const cx = w * (0.1 + Math.random() * 0.8), bubbles = 2 + Math.floor(Math.random() * 3); for (let b = 0; b < bubbles; b++) foam.push({ x: cx + (Math.random() - 0.5) * 30, y: yPx + (Math.random() - 0.5) * 10, r: 6 + Math.random() * 13, life: 1, decay: 0.01 + Math.random() * 0.01, vy: 0.3 + Math.random() * 0.6 }); }
  };
  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    const yPx = h * wipe / 100;
    if (Math.abs(wipe - prevWipe) > 0.05) activity = 1;
    activity *= 0.9; prevWipe = wipe;
    if (activity > 0.06 && wipe > 0.5 && wipe < 99.5) {
      spawn(yPx, activity);
      const g = ctx.createRadialGradient(w / 2, yPx, 0, w / 2, yPx, w * 0.5);
      g.addColorStop(0, `rgba(205,245,255,${0.12 * activity})`); g.addColorStop(1, "rgba(205,245,255,0)");
      ctx.fillStyle = g; ctx.fillRect(0, yPx - 50, w, 100);
    }
    for (let i = foam.length - 1; i >= 0; i--) { const f = foam[i]; f.y += f.vy; f.life -= f.decay; if (f.life <= 0) { foam.splice(i, 1); continue; } const a = Math.min(1, f.life * 1.4); ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 7); ctx.fillStyle = `rgba(248,252,255,${0.55 * a})`; ctx.fill(); ctx.beginPath(); ctx.arc(f.x - f.r * 0.3, f.y - f.r * 0.3, f.r * 0.4, 0, 7); ctx.fillStyle = `rgba(255,255,255,${0.8 * a})`; ctx.fill(); }
    for (let i = drops.length - 1; i >= 0; i--) { const d = drops[i]; d.x += d.vx; d.y += d.vy; d.vy += 0.18; d.life -= d.decay; if (d.life <= 0 || d.y > h) { drops.splice(i, 1); continue; } ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 7); ctx.fillStyle = `rgba(195,240,250,${0.75 * d.life})`; ctx.fill(); }
    requestAnimationFrame(draw);
  };
  draw();

  const setStep = (idx) => steps.forEach((s, i) => s.classList.toggle("active", i === idx));

  if (desktopProc) {
    // desktop: the wipe follows scroll through the tall pinned section
    let activeIdx = -1, hintGone = false;
    const onProc = () => {
      const rect = proc.getBoundingClientRect();
      const scrollable = proc.offsetHeight - window.innerHeight;
      const progress = clamp(-rect.top / scrollable, 0, 1);
      wipe = progress * 100;
      squeegee.style.setProperty("--wipe", wipe + "%");
      if (!hintGone && progress > 0.04) { hintGone = true; sqHint?.classList.add("hide"); }
      const idx = clamp(Math.floor(progress * 4), 0, 3);
      if (idx !== activeIdx) { activeIdx = idx; setStep(idx); }
    };
    window.addEventListener("scroll", onProc, { passive: true });
    window.addEventListener("resize", onProc, { passive: true });
    onProc();
  } else {
    // mobile: auto-play the mud wash-off once when it scrolls into view
    sqHint?.classList.add("hide");
    let played = false;
    const playReveal = () => {
      if (played) return; played = true;
      const startT = performance.now(), dur = 3200;
      const tick = (now) => {
        const p = Math.min((now - startT) / dur, 1);
        wipe = (1 - Math.pow(1 - p, 2)) * 100;
        squeegee.style.setProperty("--wipe", wipe + "%");
        setStep(clamp(Math.floor(p * 4), 0, 3));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    new IntersectionObserver((e) => { if (e[0].isIntersecting) playReveal(); }, { threshold: 0.4 }).observe(squeegee);
  }
} else {
  squeegee?.style.setProperty("--wipe", "100%");
  sqHint?.classList.add("hide");
  steps.forEach((s) => s.classList.add("active"));
}


/* ------------------------------------------------------------
   SERVICES (touch) — light up the row crossing the screen's middle
   so the cyan fill works on phones (no hover there).
------------------------------------------------------------ */
{
  // class is added on all devices; CSS only paints it on touch screens (hover:none)
  const io = new IntersectionObserver(
    (entries) => entries.forEach((en) => en.target.classList.toggle("is-active", en.isIntersecting)),
    { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
  );
  document.querySelectorAll(".srv__row").forEach((r) => io.observe(r));
}


/* ------------------------------------------------------------
   CERAMIC — hydrophobic beads
------------------------------------------------------------ */
const beadCanvas = document.getElementById("beadDrops");
const beadStage = document.getElementById("beadstage");
if (beadCanvas && beadStage && !reduceMotion) {
  const ctx = beadCanvas.getContext("2d");
  let w, h, dpr;
  const beads = [];
  const resize = () => { dpr = Math.min(window.devicePixelRatio || 1, 2); w = beadStage.clientWidth; h = beadStage.clientHeight; beadCanvas.width = w * dpr; beadCanvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  resize(); new ResizeObserver(resize).observe(beadStage);
  let running = false;
  new IntersectionObserver((e) => { running = e[0].isIntersecting; }, { threshold: 0.1 }).observe(beadStage);
  let acc = 0;
  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    if (running) {
      if (++acc % 5 === 0) beads.push({ x: Math.random() * w, y: -10, r: 3 + Math.random() * 7, vy: 0.3 + Math.random() * 0.6, vx: (Math.random() - 0.5) * 0.3, wob: Math.random() * 6.28 });
      for (let i = beads.length - 1; i >= 0; i--) {
        const b = beads[i]; b.vy += 0.04; b.y += b.vy; b.wob += 0.15; b.x += b.vx + Math.sin(b.wob) * 0.4;
        if (b.y - b.r > h) { beads.splice(i, 1); continue; }
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.fillStyle = "rgba(210,238,245,0.32)"; ctx.fill();
        ctx.lineWidth = 1; ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.stroke();
        ctx.beginPath(); ctx.arc(b.x - b.r * 0.33, b.y - b.r * 0.33, b.r * 0.34, 0, 7); ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.fill();
      }
    }
    requestAnimationFrame(draw);
  };
  draw();
}


/* ------------------------------------------------------------ GIANT WORDMARK FIT */
const wordmark = document.querySelector(".foot__wordmark");
if (wordmark) {
  const fitWordmark = () => {
    const foot = wordmark.closest(".foot");
    const cs = getComputedStyle(foot);
    const avail = foot.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    wordmark.style.fontSize = "100px";
    const range = document.createRange(); range.selectNodeContents(wordmark);
    const textW = range.getBoundingClientRect().width || 1;
    wordmark.style.fontSize = (100 * (avail / textW) * 0.99) + "px";
  };
  fitWordmark();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitWordmark);
  window.addEventListener("resize", fitWordmark, { passive: true });
}


/* ------------------------------------------------------------ SCROLL REVEAL */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add("in"); revealObserver.unobserve(entry.target); } });
}, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));
