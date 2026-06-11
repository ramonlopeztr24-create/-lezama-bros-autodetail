/* ============================================================
   LEZAMA BROS AUTO DETAIL — script.js  (v2)
   · Drag-to-clean before/after slider (mouse + touch)
   · Cursor water-droplet trail (desktop)
   · Stat counters · scroll reveal · nav scroll state
   Respects prefers-reduced-motion.
   ============================================================ */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;


/* ------------------------------------------------------------
   NAV — solid background after scrolling
------------------------------------------------------------ */
const nav = document.getElementById("nav");
const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 40);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();


/* ------------------------------------------------------------
   DRAG-TO-CLEAN  — the hero centerpiece
   The dirty layer is clipped to [0 .. pos]; dragging the handle
   (or anywhere on the image) sets --pos and wipes it clean.
------------------------------------------------------------ */
const ba = document.getElementById("ba");
if (ba) {
  const hint = document.getElementById("baHint");
  let dragging = false;
  let hintDismissed = false;

  const setPos = (clientX) => {
    const rect = ba.getBoundingClientRect();
    let pct = ((clientX - rect.left) / rect.width) * 100;
    pct = Math.max(2, Math.min(98, pct)); // clamp so a sliver of each side stays
    ba.style.setProperty("--pos", pct + "%");
  };

  const dismissHint = () => {
    if (hintDismissed) return;
    hintDismissed = true;
    ba.classList.remove("ba--hint");
    if (hint) hint.classList.add("hide");
  };

  const start = (e) => {
    dragging = true;
    ba.classList.add("dragging");
    dismissHint();
    setPos(e.clientX ?? e.touches?.[0]?.clientX);
  };
  const move = (e) => {
    if (!dragging) return;
    const x = e.clientX ?? e.touches?.[0]?.clientX;
    if (x != null) setPos(x);
  };
  const end = () => { dragging = false; ba.classList.remove("dragging"); };

  // Pointer events cover mouse + touch + pen in one path
  ba.addEventListener("pointerdown", (e) => { ba.setPointerCapture?.(e.pointerId); start(e); });
  ba.addEventListener("pointermove", move);
  ba.addEventListener("pointerup", end);
  ba.addEventListener("pointercancel", end);
  ba.addEventListener("pointerleave", end);

  // Also let people just hover-sweep on desktop without holding the button
  if (canHover) {
    ba.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      setPos(e.clientX);
    });
  }

  // Invite interaction: a little wiggle on load, then it stops once touched
  if (!reduceMotion) {
    ba.classList.add("ba--hint");
    // Auto-dismiss the wiggle class after the animation so it can't replay
    setTimeout(() => ba.classList.remove("ba--hint"), 4600);
  }
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


/* ------------------------------------------------------------
   STAT COUNTERS — count up when scrolled into view
------------------------------------------------------------ */
const animateCount = (el) => {
  const target = parseFloat(el.dataset.count);
  const suffix = el.dataset.suffix || "";
  const decimals = parseInt(el.dataset.decimals || "0", 10);
  const duration = 1500;
  const start = performance.now();

  const tick = (now) => {
    const p = Math.min((now - start) / duration, 1);
    const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p); // easeOutExpo
    const val = (target * eased).toFixed(decimals);
    el.textContent = val + suffix;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      if (reduceMotion) {
        const d = parseInt(el.dataset.decimals || "0", 10);
        el.textContent = parseFloat(el.dataset.count).toFixed(d) + (el.dataset.suffix || "");
      } else {
        animateCount(el);
      }
      counterObserver.unobserve(el);
    });
  },
  { threshold: 0.6 }
);
document.querySelectorAll(".stats__num").forEach((el) => counterObserver.observe(el));


/* ------------------------------------------------------------
   CURSOR WATER-DROPLET TRAIL  (desktop, throttled)
------------------------------------------------------------ */
if (canHover && !reduceMotion) {
  const layer = document.getElementById("cursorTrail");
  let last = 0;
  window.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    const now = performance.now();
    if (now - last < 55) return; // throttle for smoothness
    last = now;

    const d = document.createElement("span");
    d.className = "droplet";
    const jitter = (Math.random() - 0.5) * 10;
    d.style.left = e.clientX + jitter + "px";
    d.style.top = e.clientY + "px";
    const s = 0.5 + Math.random() * 0.9;
    d.style.width = d.style.height = 10 * s + "px";
    layer.appendChild(d);
    setTimeout(() => d.remove(), 700);
  }, { passive: true });
}
