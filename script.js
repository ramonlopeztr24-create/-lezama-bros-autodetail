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
