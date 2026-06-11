/* ============================================================
   LEZAMA BROS AUTO DETAIL — script.js  (v4)
   · Hero    — wash reveal on load + 3D parallax tilt
   · Process — squeegee wipes fog away as you scroll + spray/foam
   · Ceramic — hydrophobic water droplets beading & rolling off
   · nav state · scroll reveal · giant wordmark fit
   Respects prefers-reduced-motion.
   ============================================================ */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));


/* ------------------------------------------------------------
   NAV
------------------------------------------------------------ */
const nav = document.getElementById("nav");
const onNav = () => nav.classList.toggle("scrolled", window.scrollY > 30);
window.addEventListener("scroll", onNav, { passive: true });
onNav();


/* ------------------------------------------------------------
   HERO — wash reveal on load, then 3D parallax tilt + shine
------------------------------------------------------------ */
const showcar = document.getElementById("showcar");
const heroStage = document.getElementById("heroStage");
if (showcar) {
  // trigger the matte→gloss "wash reveal" shortly after load
  requestAnimationFrame(() => setTimeout(() => showcar.classList.remove("reveal-start"), 250));

  // parallax tilt follows the cursor (desktop, fine pointers only)
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (fine && !reduceMotion && heroStage) {
    const frame = showcar.querySelector(".showcar__frame");
    let raf = null, tx = 0, ty = 0;
    const apply = () => { frame.style.transform = `rotateY(${tx}deg) rotateX(${ty}deg)`; raf = null; };
    heroStage.addEventListener("pointermove", (e) => {
      const r = heroStage.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      tx = px * 8; ty = -py * 8;
      if (!raf) raf = requestAnimationFrame(apply);
    });
    heroStage.addEventListener("pointerleave", () => {
      tx = ty = 0;
      if (!raf) raf = requestAnimationFrame(apply);
    });
  }
}


/* ------------------------------------------------------------
   PROCESS — squeegee reveal driven by scroll
   As the tall section scrolls past: a rubber blade travels down,
   wiping a foggy/wet veil off the car (clean appears above it),
   a pressure-wash spray follows the blade, and steps 01–04 advance.
------------------------------------------------------------ */
const proc = document.getElementById("process");
const squeegee = document.getElementById("squeegee");
const blade = document.getElementById("squeegeeBlade");
const sprayCanvas = document.getElementById("squeegeeSpray");
const sqHint = document.getElementById("squeegeeHint");
const steps = Array.from(document.querySelectorAll(".step"));
const desktopProc = window.matchMedia("(min-width: 881px)").matches;

if (proc && squeegee && desktopProc && !reduceMotion) {
  /* --- pressure-wash spray canvas that rides the blade --- */
  const ctx = sprayCanvas.getContext("2d");
  let w, h, dpr;
  const drops = [], foam = [];
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = squeegee.clientWidth; h = squeegee.clientHeight;
    sprayCanvas.width = w * dpr; sprayCanvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  new ResizeObserver(resize).observe(squeegee);

  let wipe = 0, prevWipe = 0, activity = 0;

  const spawn = (yPx, power) => {
    const n = Math.ceil(power * 7);
    for (let i = 0; i < n; i++) {
      const sp = 4 + Math.random() * 7;
      const x = w * (0.1 + Math.random() * 0.8);
      drops.push({ x, y: yPx, vx: (Math.random() - 0.5) * sp, vy: sp * 0.6 + Math.random() * 2, life: 1, decay: 0.016 + Math.random() * 0.02, r: 0.8 + Math.random() * 1.9 });
    }
    if (Math.random() < power) {
      const cx = w * (0.1 + Math.random() * 0.8);
      const bubbles = 2 + Math.floor(Math.random() * 3);
      for (let b = 0; b < bubbles; b++) foam.push({ x: cx + (Math.random() - 0.5) * 30, y: yPx + (Math.random() - 0.5) * 10, r: 6 + Math.random() * 13, life: 1, decay: 0.01 + Math.random() * 0.01, vy: 0.3 + Math.random() * 0.6 });
    }
  };

  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    const yPx = h * wipe / 100;
    if (Math.abs(wipe - prevWipe) > 0.05) activity = 1;
    activity *= 0.9; prevWipe = wipe;

    if (activity > 0.06 && wipe > 0.5 && wipe < 99.5) {
      spawn(yPx, activity);
      const g = ctx.createRadialGradient(w / 2, yPx, 0, w / 2, yPx, w * 0.5);
      g.addColorStop(0, `rgba(205,245,255,${0.12 * activity})`);
      g.addColorStop(1, "rgba(205,245,255,0)");
      ctx.fillStyle = g; ctx.fillRect(0, yPx - 50, w, 100);
    }
    for (let i = foam.length - 1; i >= 0; i--) {
      const f = foam[i]; f.y += f.vy; f.life -= f.decay;
      if (f.life <= 0) { foam.splice(i, 1); continue; }
      const a = Math.min(1, f.life * 1.4);
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 7); ctx.fillStyle = `rgba(248,252,255,${0.55 * a})`; ctx.fill();
      ctx.beginPath(); ctx.arc(f.x - f.r * 0.3, f.y - f.r * 0.3, f.r * 0.4, 0, 7); ctx.fillStyle = `rgba(255,255,255,${0.8 * a})`; ctx.fill();
    }
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i]; d.x += d.vx; d.y += d.vy; d.vy += 0.18; d.life -= d.decay;
      if (d.life <= 0 || d.y > h) { drops.splice(i, 1); continue; }
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 7); ctx.fillStyle = `rgba(195,240,250,${0.75 * d.life})`; ctx.fill();
    }
    requestAnimationFrame(draw);
  };
  draw();

  /* --- scroll → wipe progress + steps --- */
  let activeIdx = -1, hintGone = false;
  const onProc = () => {
    const rect = proc.getBoundingClientRect();
    const scrollable = proc.offsetHeight - window.innerHeight;
    const progress = clamp(-rect.top / scrollable, 0, 1);

    wipe = progress * 100;
    squeegee.style.setProperty("--wipe", wipe + "%");

    if (!hintGone && progress > 0.04) { hintGone = true; sqHint?.classList.add("hide"); }

    const idx = clamp(Math.floor(progress * 4), 0, 3);
    if (idx !== activeIdx) { activeIdx = idx; steps.forEach((s, i) => s.classList.toggle("active", i === idx)); }
  };
  window.addEventListener("scroll", onProc, { passive: true });
  window.addEventListener("resize", onProc, { passive: true });
  onProc();
} else {
  // mobile / reduced-motion: reveal clean + show all steps
  squeegee?.style.setProperty("--wipe", "100%");
  sqHint?.classList.add("hide");
  steps.forEach((s) => s.classList.add("active"));
}


/* ------------------------------------------------------------
   CERAMIC — hydrophobic water droplets that bead and roll off
------------------------------------------------------------ */
const beadCanvas = document.getElementById("beadDrops");
const beadStage = document.getElementById("beadstage");
if (beadCanvas && beadStage && !reduceMotion) {
  const ctx = beadCanvas.getContext("2d");
  let w, h, dpr;
  const beads = [];
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = beadStage.clientWidth; h = beadStage.clientHeight;
    beadCanvas.width = w * dpr; beadCanvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  new ResizeObserver(resize).observe(beadStage);

  let running = false;
  // only animate while the section is on screen (perf)
  new IntersectionObserver((e) => { running = e[0].isIntersecting; }, { threshold: 0.1 }).observe(beadStage);

  let acc = 0;
  const spawn = () => {
    const r = 3 + Math.random() * 7;
    beads.push({ x: Math.random() * w, y: -10, r, vy: 0.3 + Math.random() * 0.6, vx: (Math.random() - 0.5) * 0.3, wob: Math.random() * 6.28, life: 1 });
  };

  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    if (running) {
      acc += 1;
      if (acc % 5 === 0) spawn();           // steady supply of beads
      for (let i = beads.length - 1; i >= 0; i--) {
        const b = beads[i];
        // hydrophobic: beads accelerate down and roll, wobbling slightly
        b.vy += 0.04; b.y += b.vy;
        b.wob += 0.15; b.x += b.vx + Math.sin(b.wob) * 0.4;
        if (b.y - b.r > h) { beads.splice(i, 1); continue; }

        // glossy water bead: body + bright highlight + faint rim
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7);
        ctx.fillStyle = "rgba(210,238,245,0.32)"; ctx.fill();
        ctx.lineWidth = 1; ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.stroke();
        ctx.beginPath(); ctx.arc(b.x - b.r * 0.33, b.y - b.r * 0.33, b.r * 0.34, 0, 7);
        ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.fill();
      }
    }
    requestAnimationFrame(draw);
  };
  draw();
}


/* ------------------------------------------------------------
   GIANT WORDMARK — fit font-size to fill the footer width
------------------------------------------------------------ */
const wordmark = document.querySelector(".foot__wordmark");
if (wordmark) {
  const fitWordmark = () => {
    const foot = wordmark.closest(".foot");
    const cs = getComputedStyle(foot);
    const avail = foot.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    wordmark.style.fontSize = "100px";
    const range = document.createRange();
    range.selectNodeContents(wordmark);
    const textW = range.getBoundingClientRect().width || 1;
    wordmark.style.fontSize = (100 * (avail / textW) * 0.99) + "px";
  };
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
      if (entry.isIntersecting) { entry.target.classList.add("in"); revealObserver.unobserve(entry.target); }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
);
document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));
