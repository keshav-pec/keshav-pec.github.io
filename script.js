// ===============================================
// ANIMATED CODE BACKGROUND (CANVAS) — PERF OPTIMISED
// ===============================================

(function () {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ── Cursor trail (desktop only, CSS-transitioned, no RAF per dot) ──────────
    const supportsFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (supportsFinePointer && !prefersReducedMotion) {
        const TRAIL = 8;
        const dots = [];
        const pos = [];
        let mx = window.innerWidth / 2, my = window.innerHeight / 2;
        const interactable = 'a, button, .btn, .nav-link, .project-link, .skill-tag, .nav-social, .hamburger, input, textarea';

        for (let i = 0; i < TRAIL; i++) {
            const d = document.createElement('span');
            d.className = 'cursor-trail-dot';
            const size = Math.max(6, 18 - i * 1.5);
            d.style.cssText = `width:${size}px;height:${size}px;opacity:${Math.max(0.15, 0.85 - i * 0.1)};transition:transform 0.25s ease,filter 0.2s ease;`;
            document.body.appendChild(d);
            dots.push(d);
            pos.push({ x: mx, y: my });
        }

        function animateTrail() {
            pos[0].x += (mx - pos[0].x) * 0.32;
            pos[0].y += (my - pos[0].y) * 0.32;
            for (let i = 1; i < TRAIL; i++) {
                pos[i].x += (pos[i - 1].x - pos[i].x) * 0.36;
                pos[i].y += (pos[i - 1].y - pos[i].y) * 0.36;
            }
            dots.forEach((d, i) => {
                d.style.left = pos[i].x + 'px';
                d.style.top  = pos[i].y + 'px';
                d.classList.add('active');
            });
            requestAnimationFrame(animateTrail);
        }

        window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });
        document.addEventListener('mouseover',  e => { if (e.target.closest(interactable)) dots.forEach(d => d.classList.add('hover')); });
        document.addEventListener('mouseout',   e => { if (e.target.closest(interactable)) dots.forEach(d => d.classList.remove('hover')); });
        document.addEventListener('mouseleave', () => dots.forEach(d => d.classList.remove('active', 'hover')));
        document.addEventListener('mouseenter', () => dots.forEach(d => d.classList.add('active')));
        animateTrail();
    }

    // ── Canvas falling-code background ──────────────────────────────────────────
    const canvas = document.getElementById('codeCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resizeCanvas() {
        canvas.width  = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }
    resizeCanvas();
    let resizeTick = null;
    window.addEventListener('resize', () => {
        if (resizeTick) cancelAnimationFrame(resizeTick);
        resizeTick = requestAnimationFrame(() => { resizeCanvas(); resizeTick = null; });
    }, { passive: true });

    const snippets = [
        '{ }', '[ ]', '< />', '( )', '=>', '===', '!==',
        'const', 'let', 'async', 'await', 'class', 'return', 'import',
        'React', 'Node', 'MongoDB', 'JS', 'CSS', 'HTML',
        'map()', 'filter()', 'useState', '&&', '||', '...'
    ];
    // Pre-compute rgba strings — no object spread per frame
    const colorsRgba = [
        'rgba(255,255,255,',
        'rgba(191,219,254,',
        'rgba(147,197,253,',
        'rgba(96,165,250,',
        'rgba(37,99,235,',
        'rgba(148,163,184,'
    ];

    class Particle {
        constructor() { this.init(true); }
        init(randomY = false) {
            this.x       = Math.random() * canvas.width;
            this.y       = randomY ? Math.random() * canvas.height : -40;
            this.speed   = 0.4 + Math.random() * 1.6;
            this.text    = snippets[Math.floor(Math.random() * snippets.length)];
            this.size    = 13 + Math.random() * 8;
            this.color   = colorsRgba[Math.floor(Math.random() * colorsRgba.length)];
            this.opacity = 0.22 + Math.random() * 0.32;
            this.rot     = (Math.random() - 0.5) * 0.18;
        }
        update() {
            this.y += this.speed;
            if (this.y > canvas.height + 40) this.init();
        }
        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rot);
            ctx.font = `bold ${this.size}px 'Courier New', monospace`;
            // NO shadowBlur — it's extremely expensive on GPU
            ctx.fillStyle = this.color + this.opacity + ')';
            ctx.fillText(this.text, 0, 0);
            ctx.restore();
        }
    }

    const COUNT = prefersReducedMotion ? 18 : 40;   // was 72 — halved for perf
    const particles = Array.from({ length: COUNT }, () => new Particle());

    let rafId = null;
    function animate() {
        ctx.fillStyle = 'rgba(5,7,13,0.38)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        for (const p of particles) { p.update(); p.draw(); }
        rafId = requestAnimationFrame(animate);
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) { cancelAnimationFrame(rafId); rafId = null; }
        else if (!rafId) animate();
    });
    animate();
})();

// ===============================================
// NAVIGATION MENU TOGGLE
// ===============================================

const hamburger = document.querySelector('.hamburger');
const navMenu   = document.querySelector('.nav-menu');
const navLinks  = document.querySelectorAll('.nav-link');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// ===============================================
// SCROLL ORCHESTRATOR — single rAF for all scroll work
// ===============================================

const navbar       = document.querySelector('.navbar');
const heroContent  = document.querySelector('.hero-content');
const sections     = Array.from(document.querySelectorAll('section'));
let scrollTopBtn   = null;
let sectionPos     = [];

// Scroll-progress bar
const scrollBar = document.createElement('div');
scrollBar.className = 'scroll-progress';
document.body.appendChild(scrollBar);

function measureSections() {
    sectionPos = sections.map(s => ({ id: s.getAttribute('id'), top: s.offsetTop - 120 }));
}

let ticking = false;
function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
        const sy = window.scrollY;

        // Navbar glass intensity
        const glassAmount = Math.min(sy / 120, 1);
        navbar.style.background = `rgba(255,255,255,${0.08 + glassAmount * 0.10})`;
        navbar.style.boxShadow  = glassAmount > 0.4 ? '0 8px 32px rgba(37,99,235,0.18)' : 'none';

        // Scroll progress bar — width only, GPU-cheap
        const max = document.documentElement.scrollHeight - window.innerHeight;
        scrollBar.style.width = (max > 0 ? (sy / max) * 100 : 0) + '%';

        // Active nav link
        let current = sectionPos[0]?.id || '';
        for (const s of sectionPos) { if (sy >= s.top) current = s.id; }
        navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${current}`));

        // Hero parallax — composited translate3d only (no opacity change = no repaint)
        if (heroContent) {
            const shift = Math.min(sy * 0.14, 80);
            heroContent.style.transform = `translate3d(0,${shift}px,0)`;
            // Fade hero text gently
            heroContent.style.opacity = Math.max(0, 1 - sy / 700).toFixed(3);
        }

        // Scroll-to-top button
        if (scrollTopBtn) scrollTopBtn.style.opacity = sy > 280 ? '1' : '0';

        ticking = false;
    });
}

window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', () => {
    measureSections();
    onScroll();
}, { passive: true });

measureSections();
onScroll();

// ===============================================
// SMOOTH ANCHOR SCROLLING
// ===============================================

document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        const target = document.querySelector(a.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        window.scrollTo({ top: target.offsetTop - 70, behavior: 'smooth' });
    });
});

// ===============================================
// INTERSECTION OBSERVER — REVEAL ON SCROLL
// ===============================================

const revealObs = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            obs.unobserve(entry.target);
        }
    });
}, { threshold: 0.08, rootMargin: '0px 0px -80px 0px' });

document.querySelectorAll('.section-title, .about-content, .skill-category, .timeline-item, .project-card, .contact-content > *, .footer-section')
    .forEach((el, i) => {
        el.classList.add('reveal');
        el.style.transitionDelay = `${Math.min(360, (i % 5) * 72)}ms`;
        revealObs.observe(el);
    });

// ===============================================
// SUBTLE TILT — CSS custom property approach (no JS per frame)
// ===============================================
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.project-card, .skill-category').forEach(card => {
        card.addEventListener('mouseenter', () => card.classList.add('tilt-active'));
        card.addEventListener('mousemove', e => {
            const r = card.getBoundingClientRect();
            const rx = ((e.clientY - r.top)  / r.height - 0.5) * -6;
            const ry = ((e.clientX - r.left) / r.width  - 0.5) *  6;
            card.style.setProperty('--rx', rx.toFixed(1) + 'deg');
            card.style.setProperty('--ry', ry.toFixed(1) + 'deg');
        });
        card.addEventListener('mouseleave', () => {
            card.classList.remove('tilt-active');
            card.style.removeProperty('--rx');
            card.style.removeProperty('--ry');
        });
    });
}

// ===============================================
// TYPING EFFECT — HERO SUBTITLE
// ===============================================

const subtitleEl = document.querySelector('.hero-subtitle');
const subtitles  = ['Full Stack Developer', 'CSE Student @PEC', 'Problem Solver', 'Open Source Contributor'];
let si = 0, ci = 0, deleting = false, delay = 100;

function type() {
    const cur = subtitles[si];
    subtitleEl.textContent = deleting
        ? cur.substring(0, --ci)
        : cur.substring(0, ++ci);

    delay = deleting ? 45 : 105;
    if (!deleting && ci === cur.length) { delay = 2200; deleting = true; }
    else if (deleting && ci === 0) { deleting = false; si = (si + 1) % subtitles.length; delay = 450; }
    setTimeout(type, delay);
}
window.addEventListener('load', () => setTimeout(type, 900));

// ===============================================
// CONTACT FORM
// ===============================================

const contactForm = document.getElementById('contactForm');
contactForm.addEventListener('submit', e => {
    e.preventDefault();
    const name    = document.getElementById('name').value;
    const email   = document.getElementById('email').value;
    const subject = document.getElementById('subject').value;
    const message = document.getElementById('message').value;
    const mailto  = `mailto:keshavpec24@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`)}`;
    window.location.href = mailto;
    contactForm.reset();
});

// ===============================================
// SCROLL-TO-TOP BUTTON
// ===============================================

scrollTopBtn = document.createElement('button');
scrollTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
scrollTopBtn.className = 'scroll-top-btn';
scrollTopBtn.setAttribute('aria-label', 'Back to top');
document.body.appendChild(scrollTopBtn);

scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// ===============================================
// PARALLAX FALLBACK (Firefox & older browsers)
// Uses JS only when CSS scroll-driven is unsupported
// ===============================================

if (!CSS.supports('(animation-timeline: scroll()) and (animation-range: 0%)')) {
    const wrapper = document.querySelector('.parallax-wrapper');
    const layers  = document.querySelectorAll('.parallax-layer');
    if (wrapper && layers.length) {
        const depthValues = [0.12, 0.28, 0.48]; // match data-depth attrs

        let parallaxTicking = false;
        function updateParallax() {
            const sy = window.scrollY;
            const rect = wrapper.getBoundingClientRect();
            const wrapperTop = rect.top + sy;
            const wrapperH = wrapper.offsetHeight;
            const winH = window.innerHeight;

            if (sy >= wrapperTop - winH && sy <= wrapperTop + wrapperH) {
                const progress = (sy - (wrapperTop - winH)) / (wrapperH + winH);
                layers.forEach((layer, i) => {
                    const maxPx = depthValues[i] * 160;
                    const ty = maxPx * (0.5 - progress);
                    layer.style.transform = `translateY(${ty.toFixed(2)}px)`;
                });
            }
        }

        const obs = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    window.addEventListener('scroll', onParallaxScroll, { passive: true });
                } else {
                    window.removeEventListener('scroll', onParallaxScroll);
                }
            });
        }, { threshold: 0 });

        function onParallaxScroll() {
            if (parallaxTicking) return;
            parallaxTicking = true;
            requestAnimationFrame(() => { updateParallax(); parallaxTicking = false; });
        }

        obs.observe(wrapper);
        updateParallax();
    }
}

console.log('%c🚀 Portfolio loaded!', 'color:#2563eb;font-size:14px;font-weight:700;');
