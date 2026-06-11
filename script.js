/* ============================================================
   LEZAMA BROS AUTO DETAIL — script.js
   Handles: nav scroll state · scroll-reveal · counter animation
            · water-spray canvas · dripping droplets
   All animation uses requestAnimationFrame / IntersectionObserver
   and respects prefers-reduced-motion.
   ============================================================ */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ------------------------------------------------------------
   1. NAV — add solid background once the user scrolls
------------------------------------------------------------ */
const nav = document.getElementById("nav");
const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 40);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();


/* ------------------------------------------------------------
   2. SCROLL REVEAL — fade + slide sections in as they enter view
------------------------------------------------------------ */
const revealEls = document.querySelectorAll(".reveal");
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
revealEls.forEach((el) => revealObserver.observe(el));


/* ------------------------------------------------------------
   3. COUNTER — animate stat numbers up when scrolled into view
------------------------------------------------------------ */
const counters = document.querySelectorAll(".stats__num");
const animateCount = (el) => {
  const target = parseInt(el.dataset.count, 10);
  const suffix = el.dataset.suffix || "";
  const duration = 1600;
  const start = performance.now();

  const tick = (now) => {
    const p = Math.min((now - start) / duration, 1);
    // easeOutExpo for a satisfying "settle"
    const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
    el.textContent = Math.round(target * eased) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        if (reduceMotion) {
          entry.target.textContent =
            entry.target.dataset.count + (entry.target.dataset.suffix || "");
        } else {
          animateCount(entry.target);
        }
        counterObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.6 }
);
counters.forEach((c) => counterObserver.observe(c));


/* ------------------------------------------------------------
   4. DRIPPING DROPLETS — random droplets running down the hero
------------------------------------------------------------ */
const dripsLayer = document.getElementById("drips");
if (dripsLayer && !reduceMotion) {
  const DRIP_COUNT = 14;
  for (let i = 0; i < DRIP_COUNT; i++) {
    const d = document.createElement("span");
    d.className = "drip";
    d.style.left = Math.random() * 100 + "%";
    d.style.animationDuration = 3 + Math.random() * 4 + "s";
    d.style.animationDelay = Math.random() * 6 + "s";
    const scale = 0.6 + Math.random() * 1.4;
    d.style.transform = `scale(${scale})`;
    dripsLayer.appendChild(d);
  }
}


/* ------------------------------------------------------------
   5. WATER-SPRAY CANVAS — pressure-washer jet that sweeps across
   the hero. Particles emit from a moving nozzle point, arc with
   gravity, and fade — subtle + premium, not cheesy.
------------------------------------------------------------ */
const canvas = document.getElementById("spray");
if (canvas && !reduceMotion) {
  const ctx = canvas.getContext("2d");
  let w, h, dpr;
  const particles = [];

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener("resize", resize, { passive: true });

  // The nozzle sweeps left↔right across the upper third of the hero
  let t = 0;

  const spawn = (nx, ny, dir) => {
    // Fan of droplets shooting from the nozzle
    const count = 3;
    for (let i = 0; i < count; i++) {
      const spread = (Math.random() - 0.5) * 0.5;
      const speed = 3 + Math.random() * 4;
      particles.push({
        x: nx,
        y: ny,
        vx: dir * (speed * (0.6 + Math.random() * 0.6)) + spread,
        vy: speed * 0.5 + Math.random() * 1.5,
        life: 1,
        decay: 0.012 + Math.random() * 0.02,
        r: 0.8 + Math.random() * 1.8,
      });
    }
  };

  const frame = () => {
    ctx.clearRect(0, 0, w, h);
    t += 0.008;

    // Nozzle position — eases back and forth across the screen
    const sweep = (Math.sin(t) + 1) / 2; // 0..1
    const nx = w * (0.12 + sweep * 0.76);
    const ny = h * 0.26;
    const dir = Math.cos(t) >= 0 ? 1 : -1;

    spawn(nx, ny, dir);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12; // gravity
      p.vx *= 0.99;
      p.life -= p.decay;

      if (p.life <= 0 || p.y > h) {
        particles.splice(i, 1);
        continue;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180, 245, 245, ${p.life * 0.5})`;
      ctx.fill();
    }

    // Soft mist halo at the nozzle
    const grd = ctx.createRadialGradient(nx, ny, 0, nx, ny, 60);
    grd.addColorStop(0, "rgba(45, 212, 212, 0.10)");
    grd.addColorStop(1, "rgba(45, 212, 212, 0)");
    ctx.fillStyle = grd;
    ctx.fillRect(nx - 60, ny - 60, 120, 120);

    requestAnimationFrame(frame);
  };
  frame();
}
