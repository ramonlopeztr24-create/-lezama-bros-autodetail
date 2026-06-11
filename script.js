/* ============================================================
   LEZAMA BROS AUTO DETAIL — script.js  (v3)
   · Drag-to-clean hero slider (mouse + touch)
   · Scroll-driven PROCESS: car auto-cleans + steps 01–04 advance
   · Scroll reveal · nav scroll state
   Respects prefers-reduced-motion.
   ============================================================ */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));


/* ------------------------------------------------------------
   NAV — solid background after scrolling
------------------------------------------------------------ */
const nav = document.getElementById("nav");
const onNav = () => nav.classList.toggle("scrolled", window.scrollY > 30);
window.addEventListener("scroll", onNav, { passive: true });
onNav();


/* ------------------------------------------------------------
   DRAG-TO-CLEAN  (hero centerpiece)
------------------------------------------------------------ */
const ba = document.getElementById("ba");
if (ba) {
  const hint = document.getElementById("baHint");
  let dragging = false, hintGone = false;

  const setPos = (clientX) => {
    const r = ba.getBoundingClientRect();
    const pct = clamp(((clientX - r.left) / r.width) * 100, 2, 98);
    ba.style.setProperty("--pos", pct + "%");
  };
  const killHint = () => {
    if (hintGone) return; hintGone = true;
    ba.classList.remove("ba--hint");
    if (hint) hint.classList.add("hide");
  };
  const start = (e) => { dragging = true; ba.classList.add("dragging"); killHint(); setPos(e.clientX); };
  const move  = (e) => { if (dragging) setPos(e.clientX); };
  const end   = () => { dragging = false; ba.classList.remove("dragging"); };

  ba.addEventListener("pointerdown", (e) => { ba.setPointerCapture?.(e.pointerId); start(e); });
  ba.addEventListener("pointermove", move);
  ba.addEventListener("pointerup", end);
  ba.addEventListener("pointercancel", end);

  if (!reduceMotion) {
    ba.classList.add("ba--hint");
    setTimeout(() => ba.classList.remove("ba--hint"), 4800);
  }
}


/* ------------------------------------------------------------
   PROCESS — scroll-driven
   As the tall .process section scrolls past, map progress 0→1:
   · the pinned car wipes from dirty → clean
   · steps 01–04 highlight at each quarter
------------------------------------------------------------ */
const proc = document.getElementById("process");
const baAuto = document.getElementById("baAuto");
const steps = Array.from(document.querySelectorAll(".step"));
const isDesktopProc = window.matchMedia("(min-width: 881px)").matches;

if (proc && baAuto && isDesktopProc) {
  let activeIdx = -1;
  const onProc = () => {
    const rect = proc.getBoundingClientRect();
    const scrollable = proc.offsetHeight - window.innerHeight;
    const progress = clamp(-rect.top / scrollable, 0, 1);

    // wipe the car clean (5% → 98%)
    baAuto.style.setProperty("--pos", (5 + progress * 93) + "%");

    // highlight the active step
    const idx = clamp(Math.floor(progress * 4), 0, 3);
    if (idx !== activeIdx) {
      activeIdx = idx;
      steps.forEach((s, i) => s.classList.toggle("active", i === idx));
    }
  };
  window.addEventListener("scroll", onProc, { passive: true });
  window.addEventListener("resize", onProc, { passive: true });
  onProc();
} else if (steps.length) {
  // mobile: no pin — just show every step active
  steps.forEach((s) => s.classList.add("active"));
  if (baAuto) baAuto.style.setProperty("--pos", "60%");
}


/* ------------------------------------------------------------
   WASH FX — power-wash spray + shampoo foam at the wipe seam.
   Activates whenever the car is being cleaned (drag OR scroll),
   so it works on both the hero slider and the process section.
------------------------------------------------------------ */
function attachWash(ba) {
  if (!ba || reduceMotion) return;

  const canvas = document.createElement("canvas");
  canvas.className = "ba__spray";
  const handle = ba.querySelector(".ba__handle");
  handle ? ba.insertBefore(canvas, handle) : ba.appendChild(canvas);
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
    // pressure-washer water jet, fanning toward the dirty (left) side — intense
    const n = Math.ceil(power * 8);
    for (let i = 0; i < n; i++) {
      const sp = 5 + Math.random() * 8;
      drops.push({
        x: x + (Math.random() - 0.5) * 12,
        y: h * 0.12 + Math.random() * h * 0.18,
        vx: -(sp * (0.5 + Math.random() * 1.0)),
        vy: sp * 0.35 + Math.random() * 1.8,
        life: 1, decay: 0.016 + Math.random() * 0.02,
        r: 0.8 + Math.random() * 2.1,
      });
    }
    // shampoo foam clusters clinging near the seam (lots of suds = flashy)
    if (Math.random() < 1.0 * power) {
      const cx = x - Math.random() * 34, cy = h * (0.26 + Math.random() * 0.58);
      const bubbles = 3 + Math.floor(Math.random() * 4);
      for (let b = 0; b < bubbles; b++) {
        foam.push({
          x: cx + (Math.random() - 0.5) * 26,
          y: cy + (Math.random() - 0.5) * 22,
          r: 7 + Math.random() * 16,
          life: 1, decay: 0.008 + Math.random() * 0.008,
          vy: -(0.1 + Math.random() * 0.45),
        });
      }
    }
  };

  const loop = () => {
    ctx.clearRect(0, 0, w, h);
    const pos = seamX();
    if (prevPos != null && Math.abs(pos - prevPos) > 0.3) activity = 1;
    activity *= 0.9;
    prevPos = pos;

    const power = ba.classList.contains("dragging") ? 1 : activity;

    if (power > 0.06) {
      spawn(pos, power);
      // misty halo at the nozzle — bigger, brighter
      const g = ctx.createRadialGradient(pos, h * 0.16, 0, pos, h * 0.16, 64);
      g.addColorStop(0, `rgba(205,245,255,${0.2 * power})`);
      g.addColorStop(1, "rgba(205,245,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(pos - 64, h * 0.16 - 64, 128, 128);
    }

    // foam (draw under water so droplets read on top)
    for (let i = foam.length - 1; i >= 0; i--) {
      const f = foam[i];
      f.y += f.vy; f.life -= f.decay;
      if (f.life <= 0) { foam.splice(i, 1); continue; }
      const a = Math.min(1, f.life * 1.4);
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 7); ctx.fillStyle = `rgba(248,252,255,${0.7 * a})`; ctx.fill();
      // highlight for a soapy, glossy bubble look
      ctx.beginPath(); ctx.arc(f.x - f.r * 0.32, f.y - f.r * 0.32, f.r * 0.4, 0, 7); ctx.fillStyle = `rgba(255,255,255,${0.85 * a})`; ctx.fill();
    }

    // water droplets
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.x += d.vx; d.y += d.vy; d.vy += 0.17; d.life -= d.decay;
      if (d.life <= 0 || d.y > h) { drops.splice(i, 1); continue; }
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 7);
      ctx.fillStyle = `rgba(195,240,250,${0.75 * d.life})`; ctx.fill();
    }

    requestAnimationFrame(loop);
  };
  loop();
}
attachWash(document.getElementById("ba"));
attachWash(document.getElementById("baAuto"));


/* ------------------------------------------------------------
   GIANT WORDMARK — scale font-size so it fills the footer width
   edge-to-edge without clipping (like the reference site).
------------------------------------------------------------ */
const wordmark = document.querySelector(".foot__wordmark");
if (wordmark) {
  const fitWordmark = () => {
    const foot = wordmark.closest(".foot");
    const cs = getComputedStyle(foot);
    const avail = foot.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    // Measure the ACTUAL rendered text width (not the block width) via a Range
    wordmark.style.fontSize = "100px";
    const range = document.createRange();
    range.selectNodeContents(wordmark);
    const textW = range.getBoundingClientRect().width || 1;
    wordmark.style.fontSize = (100 * (avail / textW) * 0.99) + "px"; // fill width, hair of room
  };
  // Fit now, after web font loads, and on resize
  fitWordmark();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitWordmark);
  window.addEventListener("resize", fitWordmark, { passive: true });
}


/* ------------------------------------------------------------
   SCROLL REVEAL
------------------------------------------------------------ */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
);
document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));
