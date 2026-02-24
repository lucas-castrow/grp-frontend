/* ============================================================
   GRP — Pátio de Containers | main.js
   Interactions: Particles · Counters · Map · Navbar · Form
   ============================================================ */

'use strict';

/* ─── HELPERS ────────────────────────────────────────────────── */
const qs = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ─── 1. SCROLL PROGRESS ─────────────────────────────────────── */
const progressBar = qs('#scrollProgress');
window.addEventListener('scroll', () => {
  const total = document.documentElement.scrollHeight - window.innerHeight;
  const current = window.scrollY;
  progressBar.style.width = `${(current / total) * 100}%`;
}, { passive: true });

/* ─── 2. NAVBAR ──────────────────────────────────────────────── */
const navbar = qs('#navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

/* ─── 3. ACTIVE NAV LINKS ────────────────────────────────────── */
const sections = qsa('section[id]');
const navAnchors = qsa('.nav-links a');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      navAnchors.forEach(a => {
        a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
      });
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });

sections.forEach(s => sectionObserver.observe(s));

/* ─── 4. HAMBURGER / MOBILE MENU ─────────────────────────────── */
const hamburger = qs('#hamburger');
const mobileMenu = qs('#mobileMenu');
const mobileClose = qs('#mobileClose');

function openMobileMenu() {
  mobileMenu.classList.add('open');
  hamburger.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeMobileMenu() {
  mobileMenu.classList.remove('open');
  hamburger.classList.remove('active');
  document.body.style.overflow = '';
}

hamburger.addEventListener('click', () => {
  mobileMenu.classList.contains('open') ? closeMobileMenu() : openMobileMenu();
});
mobileClose.addEventListener('click', closeMobileMenu);
qsa('.mobile-link, .mobile-cta').forEach(el => el.addEventListener('click', closeMobileMenu));

/* ─── 5. BACK TO TOP ─────────────────────────────────────────── */
const backToTop = qs('#backToTop');
window.addEventListener('scroll', () => {
  backToTop.classList.toggle('visible', window.scrollY > 500);
}, { passive: true });
backToTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ─── 6. SMOOTH SCROLL ───────────────────────────────────────── */
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;
  const target = qs(link.getAttribute('href'));
  if (target) {
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

/* ─── 7. PARTICLE CANVAS ─────────────────────────────────────── */
(function initParticles() {
  const canvas = qs('#particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const CONFIG = {
    count: window.innerWidth < 768 ? 40 : 80,
    connectDist: 140,
    speed: 0.35,
    minR: 0.8,
    maxR: 2.2,
    color: [59, 130, 246],   // blue-light RGB
  };

  let particles = [];
  let raf;

  function setSize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  class Particle {
    constructor() { this.init(); }
    init() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5) * CONFIG.speed;
      this.vy = (Math.random() - 0.5) * CONFIG.speed;
      this.r = CONFIG.minR + Math.random() * (CONFIG.maxR - CONFIG.minR);
      this.a = 0.15 + Math.random() * 0.35;
    }
    step() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0) this.x = canvas.width;
      if (this.x > canvas.width) this.x = 0;
      if (this.y < 0) this.y = canvas.height;
      if (this.y > canvas.height) this.y = 0;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${CONFIG.color},${this.a})`;
      ctx.fill();
    }
  }

  function buildParticles() {
    particles = [];
    for (let i = 0; i < CONFIG.count; i++) particles.push(new Particle());
  }

  function drawLines() {
    const [r, g, b] = CONFIG.color;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d = Math.hypot(dx, dy);
        if (d < CONFIG.connectDist) {
          const a = (1 - d / CONFIG.connectDist) * 0.14;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(${r},${g},${b},${a})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }
  }

  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.step(); p.draw(); });
    drawLines();
    raf = requestAnimationFrame(tick);
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { setSize(); buildParticles(); }, 200);
  });

  // Pause when tab is hidden to save resources
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else raf = requestAnimationFrame(tick);
  });

  setSize();
  buildParticles();
  tick();
})();

/* ─── 8. COUNTER ANIMATION ───────────────────────────────────── */
(function initCounters() {
  const statsSection = qs('#statsSection');
  if (!statsSection) return;

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function animateCounter(el, target, duration = 1800) {
    let startTime = null;
    function frame(ts) {
      if (!startTime) startTime = ts;
      const prog = Math.min((ts - startTime) / duration, 1);
      const val = Math.floor(easeOutCubic(prog) * target);
      el.textContent = val.toLocaleString('pt-BR');
      if (prog < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      observer.disconnect();
      qsa('.stat-number[data-count]', statsSection).forEach(el => {
        animateCounter(el, parseInt(el.dataset.count, 10));
      });
    }
  }, { threshold: 0.4 });

  observer.observe(statsSection);
})();

/* ─── 9. AOS INIT ────────────────────────────────────────────── */
if (typeof AOS !== 'undefined') {
  AOS.init({
    duration: 780,
    easing: 'ease-out-cubic',
    once: true,
    offset: 50,
  });

  // Failsafe: força exibição de elementos que o AOS não animou após 2s
  setTimeout(() => {
    document.querySelectorAll('[data-aos]:not(.aos-animate)').forEach(el => {
      el.classList.add('aos-animate');
    });
  }, 2000);
}

/* ─── 10. LEAFLET MAP ────────────────────────────────────────── */
(function initMap() {
  const mapEl = qs('#map');
  if (!mapEl || typeof L === 'undefined') return;

  // Coordinates: Av. Sen. Atílio Fontana, 501 - Vila São Jorge, Paranaguá-PR
  const LAT = -25.5196;
  const LNG = -48.5163;
  const ZOOM = 15;

  const map = L.map('map', {
    center: [LAT, LNG],
    zoom: ZOOM,
    scrollWheelZoom: false,
    zoomControl: true,
  });

  // Dark tile layer (CartoDB Dark Matter — no API key required)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(map);

  // Custom SVG marker pin
  const markerIcon = L.divIcon({
    className: '',
    html: `
      <div style="
        position: relative;
        width: 52px;
        height: 52px;
        filter: drop-shadow(0 6px 18px rgba(37,99,235,0.7));
      ">
        <svg viewBox="0 0 52 60" xmlns="http://www.w3.org/2000/svg" width="52" height="60">
          <defs>
            <linearGradient id="pinGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#2563EB"/>
              <stop offset="100%" stop-color="#60A5FA"/>
            </linearGradient>
          </defs>
          <path d="M26 0C15.5 0 7 8.5 7 19c0 14 19 39 19 39s19-25 19-39C45 8.5 36.5 0 26 0z"
                fill="url(#pinGrad)"/>
          <circle cx="26" cy="19" r="9" fill="white" opacity="0.92"/>
          <text x="26" y="24" text-anchor="middle"
                font-family="Montserrat,sans-serif" font-weight="800"
                font-size="9.5" fill="#2563EB">GRP</text>
        </svg>
      </div>
    `,
    iconSize: [52, 60],
    iconAnchor: [26, 60],
    popupAnchor: [0, -62],
  });

  const marker = L.marker([LAT, LNG], { icon: markerIcon }).addTo(map);

  marker.bindPopup(`
    <div style="padding:6px 2px; min-width:200px;">
      <div style="font-family:Montserrat,sans-serif; font-size:0.95rem; font-weight:700;
                  color:#F1F5F9; margin-bottom:6px;">
        GRP — Pátio de Containers
      </div>
      <div style="font-size:0.82rem; color:#94A3B8; line-height:1.6;">
        Av. Sen. Atílio Fontana, 501<br/>
        Vila São Jorge · Paranaguá, PR<br/>
        CEP: 83209-708
      </div>
      <a href="https://www.google.com/maps/dir/?api=1&destination=-25.5196,-48.5163"
         target="_blank" rel="noopener"
         style="display:inline-flex; align-items:center; gap:6px; margin-top:10px;
                font-size:0.78rem; font-weight:600; color:#60A5FA; text-decoration:none;">
        ➜ Como Chegar
      </a>
    </div>
  `).openPopup();

  // Move zoom control to bottom-right
  map.zoomControl.setPosition('bottomright');
})();

/* ─── 11. CONTACT FORM ───────────────────────────────────────── */
(function initForm() {
  const form = qs('#contactForm');
  const submitBtn = qs('#submitBtn');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Validate required fields
    const requiredInputs = qsa('[required]', form);
    let valid = true;
    requiredInputs.forEach(input => {
      if (!input.value.trim()) {
        valid = false;
        input.style.borderColor = '#ef4444';
        input.addEventListener('input', () => { input.style.borderColor = ''; }, { once: true });
      }
    });
    if (!valid) return;

    // Loading state
    const originalHTML = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Enviando...';

    // Simulate API call
    setTimeout(() => {
      submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Mensagem Enviada!';
      submitBtn.style.background = 'linear-gradient(135deg, #16A34A, #22C55E)';
      submitBtn.style.boxShadow = '0 4px 22px rgba(34,197,94,0.4)';

      setTimeout(() => {
        submitBtn.innerHTML = originalHTML;
        submitBtn.style.background = '';
        submitBtn.style.boxShadow = '';
        submitBtn.disabled = false;
        form.reset();
      }, 3500);
    }, 1400);
  });
})();

/* ─── 12. CARD TILT EFFECT (subtle, desktop only) ────────────── */
(function initTilt() {
  if (window.innerWidth < 900) return;

  const tiltCards = qsa('.service-card, .pillar-card, .wf-item');

  tiltCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      const tiltX = dy * -4;
      const tiltY = dx * 4;
      card.style.transform = `perspective(900px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-4px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
})();

/* ─── 13. TYPEWRITER for hero badge ─────────────────────────── */
// (hero badge is already rendered; this adds a subtle cursor blink effect)
const badge = qs('.hero-badge');
if (badge) {
  badge.style.transition = 'opacity 0.3s';
  setTimeout(() => { badge.style.opacity = '1'; }, 300);
}

/* ─── 14. INTERSECTION-BASED COLOR TRANSITION for nav brand ─── */
(function initHeroWatch() {
  const hero = qs('#home');
  if (!hero) return;
  const brand = qs('.nav-brand');
  const obs = new IntersectionObserver((entries) => {
    // no-op kept for future use
  }, { threshold: 0 });
  obs.observe(hero);
})();
