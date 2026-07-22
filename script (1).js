/* ============================================
   RAKSHA — script.js
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- LOADER ---------- */
  const loader = document.getElementById('loader');
  const loaderProgress = document.getElementById('loaderProgress');
  let pct = 0;
  const loadTimer = setInterval(() => {
    pct += Math.random() * 18;
    if (pct >= 100) {
      pct = 100;
      clearInterval(loadTimer);
      setTimeout(() => loader.classList.add('done'), 250);
    }
    loaderProgress.style.width = pct + '%';
  }, 140);

  /* ---------- NAV ---------- */
  const nav = document.getElementById('nav');
  const navLinks = document.getElementById('navLinks');
  const navBurger = document.getElementById('navBurger');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  });

  navBurger.addEventListener('click', () => {
    navBurger.classList.toggle('open');
    navLinks.classList.toggle('open');
  });
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    navBurger.classList.remove('open');
    navLinks.classList.remove('open');
  }));

  /* ---------- ROUTE THREAD (signature scroll progress) ---------- */
  const routeBlip = document.getElementById('routeBlip');
  function updateRoute() {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
    routeBlip.style.top = (progress * 100) + '%';
  }
  window.addEventListener('scroll', updateRoute);
  updateRoute();

  /* ---------- SCROLL REVEAL ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
  revealEls.forEach(el => revealObserver.observe(el));

  /* ---------- HERO MOUSE GLOW ---------- */
  const hero = document.getElementById('hero');
  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    hero.style.setProperty('--mx', x + '%');
    hero.style.setProperty('--my', y + '%');
  });

  /* ---------- NIGHT CITY CANVAS ---------- */
  const canvas = document.getElementById('cityCanvas');
  const ctx = canvas.getContext('2d');
  let W, H, buildings = [], particles = [], stars = [];

  function resizeCanvas() {
    W = canvas.width = hero.offsetWidth;
    H = canvas.height = hero.offsetHeight;
    buildLayout();
  }

  function buildLayout() {
    // stars
    stars = Array.from({ length: 90 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H * 0.5,
      r: Math.random() * 1.2 + 0.2,
      tw: Math.random() * Math.PI * 2
    }));

    // skyline — layered silhouettes
    buildings = [];
    [0.55, 0.72, 0.9].forEach((baseline, layer) => {
      let x = -40;
      const group = [];
      while (x < W + 40) {
        const w = 40 + Math.random() * 70;
        const h = (0.12 + Math.random() * (0.28 - layer * 0.05)) * H;
        group.push({ x, w, h, lit: [] });
        // windows
        const cols = Math.max(2, Math.floor(w / 14));
        const rows = Math.max(2, Math.floor(h / 18));
        for (let c = 0; c < cols; c++) {
          for (let r = 0; r < rows; r++) {
            if (Math.random() > 0.6) {
              group[group.length - 1].lit.push({ c, r, flicker: Math.random() * Math.PI * 2 });
            }
          }
        }
        x += w + 4;
      }
      buildings.push({ baseline, group, alpha: 0.9 - layer * 0.22 });
    });

    // floating particles
    particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 2 + 0.5,
      vy: -(Math.random() * 0.3 + 0.1),
      vx: (Math.random() - 0.5) * 0.15,
      hue: Math.random() > 0.5 ? '124,58,237' : '34,211,238',
      alpha: Math.random() * 0.5 + 0.1
    }));
  }

  let t = 0;
  function drawCity() {
    ctx.clearRect(0, 0, W, H);

    // sky gradient
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#05050f');
    g.addColorStop(0.5, '#0a0a18');
    g.addColorStop(1, '#050508');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // stars
    stars.forEach(s => {
      const tw = 0.5 + 0.5 * Math.sin(t * 0.02 + s.tw);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${0.3 * tw})`;
      ctx.fill();
    });

    // buildings back to front
    buildings.forEach(layer => {
      layer.group.forEach(b => {
        const y = H * layer.baseline - b.h;
        ctx.fillStyle = `rgba(8,8,16,${layer.alpha})`;
        ctx.fillRect(b.x, y, b.w, H - y);

        // windows
        const cols = Math.max(2, Math.floor(b.w / 14));
        const rows = Math.max(2, Math.floor(b.h / 18));
        const cw = b.w / cols, rh = b.h / rows;
        b.lit.forEach(w => {
          const flick = 0.6 + 0.4 * Math.sin(t * 0.03 + w.flicker);
          const isCyan = (w.c + w.r) % 5 === 0;
          ctx.fillStyle = isCyan
            ? `rgba(34,211,238,${0.5 * flick * layer.alpha})`
            : `rgba(230,210,255,${0.35 * flick * layer.alpha})`;
          ctx.fillRect(b.x + w.c * cw + 2, y + w.r * rh + 2, cw - 4, rh - 4);
        });
      });
    });

    // glowing route line across the skyline (GPS motif)
    ctx.beginPath();
    const routeY = H * 0.42;
    ctx.moveTo(-20, routeY + Math.sin(t * 0.01) * 14);
    for (let x = 0; x <= W + 20; x += 40) {
      ctx.lineTo(x, routeY + Math.sin((x * 0.006) + t * 0.01) * 22);
    }
    const rg = ctx.createLinearGradient(0, 0, W, 0);
    rg.addColorStop(0, 'rgba(124,58,237,0)');
    rg.addColorStop(0.5, 'rgba(34,211,238,0.55)');
    rg.addColorStop(1, 'rgba(124,58,237,0)');
    ctx.strokeStyle = rg;
    ctx.lineWidth = 1.6;
    ctx.shadowColor = 'rgba(34,211,238,0.5)';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // floating particles
    particles.forEach(p => {
      p.y += p.vy;
      p.x += p.vx;
      if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.hue},${p.alpha})`;
      ctx.fill();
    });

    t++;
    requestAnimationFrame(drawCity);
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  drawCity();

  /* ---------- FEATURES DATA ---------- */
  const features = [
    { icon: '◎', title: 'AI Smart Detection', desc: 'On-device models read motion and audio patterns to sense trouble before it escalates.' },
    { icon: '✦', title: 'Silent SOS', desc: 'Trigger an alert without a sound, a screen tap, or drawing any attention.' },
    { icon: '⟁', title: 'Shake Detection', desc: 'A sharp, deliberate shake of the phone fires an alert instantly.' },
    { icon: '◈', title: 'Voice Trigger', desc: 'A single spoken phrase activates emergency response, hands-free.' },
    { icon: '⌖', title: 'Live GPS Tracking', desc: 'Trusted contacts see your real-time location for the duration of your walk.' },
    { icon: '⤳', title: 'Route Deviation Detection', desc: 'An unexpected turn off your usual path quietly raises a flag.' },
    { icon: '⇢', title: 'Safe Route Suggestions', desc: 'Routing that favors lit, populated, community-verified streets.' },
    { icon: '🔒', title: 'Encrypted Communication', desc: 'Every message and alert is end-to-end encrypted, always.' },
    { icon: '✓', title: 'Community Verification', desc: 'A vetted network of nearby guardians ready to respond in real time.' },
    { icon: '●', title: 'Emergency Recording', desc: 'Audio and location are logged automatically the moment SOS fires.' },
    { icon: '⌂', title: 'Nearby Safe Places', desc: 'Instantly surface the closest verified safe space — open store, station, or ally.' },
    { icon: '⇄', title: 'Offline Mode', desc: 'Core detection and SOS keep working even without signal or data.' },
    { icon: '⌚', title: 'Wearable Integration', desc: 'Pairs with the Raksha band for screen-free, discreet protection.' },
    { icon: '⛨', title: 'Police Integration', desc: 'Verified emergencies route directly to partnered local response units.' }
  ];
  const featuresGrid = document.getElementById('featuresGrid');
  featuresGrid.innerHTML = features.map(f => `
    <div class="feature-card glass tilt-card">
      <div class="feature-icon">${f.icon}</div>
      <h3>${f.title}</h3>
      <p>${f.desc}</p>
    </div>
  `).join('');

  /* 3D tilt on feature cards */
  document.querySelectorAll('.tilt-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      const rotX = ((y / r.height) - 0.5) * -8;
      const rotY = ((x / r.width) - 0.5) * 8;
      card.style.transform = `perspective(700px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-4px)`;
      card.style.setProperty('--fx', x + 'px');
      card.style.setProperty('--fy', y + 'px');
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(700px) rotateX(0) rotateY(0) translateY(0)';
    });
  });

  /* ---------- TIMELINE DATA ---------- */
  const steps = [
    { title: 'Wear it, carry it', desc: 'Open the app or clip on the band before you head out — Raksha starts listening silently.' },
    { title: 'Walk your route', desc: 'Live GPS and route-deviation detection quietly track your path against your usual pattern.' },
    { title: 'Signal detected', desc: 'A shake, a voice trigger, or an unexplained deviation prompts a silent, two-step check-in.' },
    { title: 'Help arrives', desc: 'No response in seconds escalates automatically to contacts, community guardians, and police.' }
  ];
  document.getElementById('timeline').innerHTML = steps.map((s, i) => `
    <div class="timeline-step reveal">
      <div class="timeline-num">${String(i + 1).padStart(2, '0')}</div>
      <div><h3>${s.title}</h3><p>${s.desc}</p></div>
    </div>
  `).join('');
  document.querySelectorAll('.timeline-step').forEach(el => revealObserver.observe(el));

  /* ---------- TECHNOLOGY DATA ---------- */
  const tech = ['React', 'Next.js', 'Tailwind CSS', 'TypeScript', 'Framer Motion', 'GSAP', 'Three.js', 'Spline', 'Firebase', 'Google Maps API'];
  document.getElementById('techGrid').innerHTML = tech.map(t => `<span class="tech-chip">${t}</span>`).join('');

  /* ---------- IMPACT COUNTERS ---------- */
  const counters = document.querySelectorAll('.counter');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(c => counterObserver.observe(c));

  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const duration = 1600;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.floor(eased * target);
      el.textContent = value.toLocaleString();
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = target.toLocaleString() + '+';
    }
    requestAnimationFrame(tick);
  }

  /* ---------- TESTIMONIALS ---------- */
  const testimonials = [
    { quote: 'The route deviation alert once caught a wrong turn before I even noticed I was lost. It felt like someone was actually watching out for me.', name: 'Ananya R., Bengaluru' },
    { quote: 'Silent SOS meant I never had to explain myself to anyone in the moment. It just quietly handled everything.', name: 'Meera K., Delhi' },
    { quote: 'I recommend the wearable to every woman in my family. No app to open, no screen to fumble with — just a tap.', name: 'Priya S., Mumbai' },
    { quote: 'Knowing my location stays private unless something actually goes wrong is what finally got me to use a safety app at all.', name: 'Fatima N., Hyderabad' }
  ];
  const testiTrack = document.getElementById('testiTrack');
  const testiDots = document.getElementById('testiDots');
  testiTrack.innerHTML = testimonials.map((t, i) => `
    <div class="testi-card glass${i === 0 ? ' active' : ''}">
      <p>"${t.quote}"</p>
      <span>${t.name}</span>
    </div>
  `).join('');
  testiDots.innerHTML = testimonials.map((_, i) => `<button class="${i === 0 ? 'active' : ''}" data-i="${i}" aria-label="Testimonial ${i + 1}"></button>`).join('');

  let testiIndex = 0;
  const testiCards = testiTrack.querySelectorAll('.testi-card');
  const testiDotEls = testiDots.querySelectorAll('button');
  function showTesti(i) {
    testiCards.forEach((c, idx) => c.classList.toggle('active', idx === i));
    testiDotEls.forEach((d, idx) => d.classList.toggle('active', idx === i));
    testiIndex = i;
  }
  testiDotEls.forEach(dot => dot.addEventListener('click', () => showTesti(parseInt(dot.dataset.i, 10))));
  setInterval(() => showTesti((testiIndex + 1) % testimonials.length), 5500);

  /* ---------- FAQ DATA ---------- */
  const faqs = [
    { q: 'Does Raksha track my location all the time?', a: 'No. Location is only actively shared with your chosen trusted contacts during a session you start, or automatically for a limited window after an SOS is triggered. Nothing is stored or sold beyond that.' },
    { q: 'What happens if I trigger an alert by accident?', a: 'Every alert goes through a silent, few-second confirmation window where you can cancel with a simple gesture before anyone is notified.' },
    { q: 'Does Raksha work without internet?', a: 'Core detection, shake and voice triggers, and local alerts to nearby paired devices continue working offline. Full escalation resumes once connectivity returns.' },
    { q: 'Is the wearable required to use Raksha?', a: 'No — the app works fully standalone. The wearable adds a screen-free trigger for moments your phone isn\u2019t accessible.' },
    { q: 'Who sees my data?', a: 'Only the trusted contacts and verified responders you explicitly authorize. Raksha never sells or shares data with advertisers or third parties.' }
  ];
  document.getElementById('faqList').innerHTML = faqs.map((f, i) => `
    <div class="faq-item">
      <button class="faq-q" data-i="${i}">${f.q}<span class="plus">+</span></button>
      <div class="faq-a"><p>${f.a}</p></div>
    </div>
  `).join('');
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(other => {
        other.classList.remove('open');
        other.querySelector('.faq-a').style.maxHeight = null;
      });
      if (!isOpen) {
        item.classList.add('open');
        a.style.maxHeight = a.scrollHeight + 'px';
      }
    });
  });

  /* ---------- DEMO MODAL ---------- */
  const modal = document.getElementById('demoModal');
  const modalBackdrop = document.getElementById('modalBackdrop');
  const modalClose = document.getElementById('modalClose');
  function openModal() { modal.classList.add('open'); document.body.style.overflow = 'hidden'; }
  function closeModal() { modal.classList.remove('open'); document.body.style.overflow = ''; }
  ['watchDemoNav', 'watchDemoHero', 'watchDemoCta'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', openModal);
  });
  modalBackdrop.addEventListener('click', closeModal);
  modalClose.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  /* ---------- GET STARTED → TOAST ---------- */
  const toast = document.getElementById('toast');
  let toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
  }
  ['getStartedNav', 'getStartedHero', 'getStartedCta'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', () => showToast('Welcome to Raksha — your safety journey starts now.'));
  });

  /* ---------- SMOOTH ANCHOR SCROLL OFFSET ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        const y = target.getBoundingClientRect().top + window.scrollY - 70;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    });
  });

});
