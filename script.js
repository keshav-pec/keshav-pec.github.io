// ===============================================
// ANIMATED CODE BACKGROUND (CANVAS)
// ===============================================

(function() {
    // Cursor trail (desktop/laptop only)
    const supportsFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (supportsFinePointer) {
        const trailCount = 10;
        const trailDots = [];
        const positions = [];
        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;
        const interactiveSelector = 'a, button, .btn, .nav-link, .project-link, .skill-tag, .nav-social, .hamburger, input, textarea, label';

        for (let i = 0; i < trailCount; i++) {
            const dot = document.createElement('span');
            dot.className = 'cursor-trail-dot';
            dot.style.width = `${12 - i * 0.8}px`;
            dot.style.height = `${12 - i * 0.8}px`;
            dot.style.opacity = `${Math.max(0.18, 0.9 - i * 0.08)}`;
            document.body.appendChild(dot);
            trailDots.push(dot);
            positions.push({ x: mouseX, y: mouseY });
        }

        function animateTrail() {
            positions[0].x += (mouseX - positions[0].x) * 0.35;
            positions[0].y += (mouseY - positions[0].y) * 0.35;

            for (let i = 1; i < trailCount; i++) {
                positions[i].x += (positions[i - 1].x - positions[i].x) * 0.38;
                positions[i].y += (positions[i - 1].y - positions[i].y) * 0.38;
            }

            trailDots.forEach((dot, i) => {
                dot.style.left = `${positions[i].x}px`;
                dot.style.top = `${positions[i].y}px`;
                dot.classList.add('active');
            });

            requestAnimationFrame(animateTrail);
        }

        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        document.addEventListener('mouseover', (e) => {
            if (e.target.closest(interactiveSelector)) {
                trailDots.forEach(dot => dot.classList.add('hover'));
            }
        });

        document.addEventListener('mouseout', (e) => {
            if (e.target.closest(interactiveSelector)) {
                trailDots.forEach(dot => dot.classList.remove('hover'));
            }
        });

        document.addEventListener('mouseleave', () => {
            trailDots.forEach(dot => dot.classList.remove('active', 'hover'));
        });

        document.addEventListener('mouseenter', () => {
            trailDots.forEach(dot => dot.classList.add('active'));
        });

        animateTrail();
    }

    const canvas = document.getElementById('codeCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    function resizeCanvas() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Cool coding symbols and keywords
    const codeSnippets = [
        '{ }', '[ ]', '< />', '( )', '=>', '===', '!==',
        'const', 'let', 'var', 'function', 'class', 'async', 'await',
        'if', 'else', 'return', 'import', 'export', 'default',
        'React', 'Node', 'MongoDB', 'Express', 'JS', 'CSS', 'HTML',
        'map()', 'filter()', 'reduce()', 'useState', 'useEffect',
        '&&', '||', '...', 'try', 'catch', 'new', 'this'
    ];
    
    // Color palette for syntax highlighting (blue/black/white theme)
    const colors = [
        { r: 255, g: 255, b: 255, name: 'white' },      // White - keywords
        { r: 191, g: 219, b: 254, name: 'ice-blue' },   // Light blue - functions
        { r: 147, g: 197, b: 253, name: 'soft-blue' },  // Soft blue - strings
        { r: 96, g: 165, b: 250, name: 'sky-blue' },    // Sky blue - variables
        { r: 37, g: 99, b: 235, name: 'royal-blue' },   // Deep blue - operators
        { r: 148, g: 163, b: 184, name: 'slate' }       // Slate - brackets
    ];
    
    // Particle class for falling code with syntax colors
    class CodeParticle {
        constructor() {
            this.reset();
        }
        
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height - canvas.height;
            this.speed = 0.5 + Math.random() * 2;
            this.snippet = codeSnippets[Math.floor(Math.random() * codeSnippets.length)];
            this.fontSize = 16 + Math.random() * 10;
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.opacity = 0.4 + Math.random() * 0.4;
            this.rotation = Math.random() * 0.2 - 0.1;
        }
        
        update() {
            this.y += this.speed;
            if (this.y > canvas.height + 50) {
                this.reset();
                this.y = -50;
            }
        }
        
        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.opacity})`;
            ctx.font = `bold ${this.fontSize}px 'Courier New', monospace`;
            ctx.shadowBlur = 15;
            ctx.shadowColor = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.8)`;
            ctx.fillText(this.snippet, 0, 0);
            ctx.restore();
        }
    }
    
    // Create more particles for denser effect
    const particleCount = 80;
    const particles = [];
    for (let i = 0; i < particleCount; i++) {
        particles.push(new CodeParticle());
    }
    
    // Animation loop
    function animate() {
        // Very subtle fade effect to maintain glow without visible trail
        ctx.fillStyle = 'rgba(5, 7, 13, 0.35)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Update and draw falling code
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        requestAnimationFrame(animate);
    }
    
    animate();
})();

// ===============================================
// NAVIGATION MENU TOGGLE
// ===============================================

const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');

// Toggle mobile menu
hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on a link
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// ===============================================
// NAVBAR BACKGROUND ON SCROLL
// ===============================================

const navbar = document.querySelector('.navbar');

// Scroll progress indicator
const scrollProgress = document.createElement('div');
scrollProgress.className = 'scroll-progress';
document.body.appendChild(scrollProgress);

function updateScrollProgress() {
    const scrollTop = window.scrollY || window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    scrollProgress.style.width = `${progress}%`;
}

window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(255, 255, 255, 0.15)';
        navbar.style.backdropFilter = 'blur(25px) saturate(180%)';
        navbar.style.boxShadow = '0 8px 32px 0 rgba(37, 99, 235, 0.2)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.1)';
        navbar.style.backdropFilter = 'blur(20px) saturate(180%)';
        navbar.style.boxShadow = '0 8px 32px 0 rgba(37, 99, 235, 0.18)';
    }

    updateScrollProgress();
});

window.addEventListener('resize', updateScrollProgress);
updateScrollProgress();

// ===============================================
// SMOOTH SCROLLING FOR NAVIGATION LINKS
// ===============================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offsetTop = target.offsetTop - 70;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// ===============================================
// ACTIVE NAVIGATION LINK ON SCROLL
// ===============================================

const sections = document.querySelectorAll('section');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (window.pageYOffset >= sectionTop - 100) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// ===============================================
// SCROLL REVEAL ANIMATION
// ===============================================

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
const animateElements = document.querySelectorAll('.skill-category, .project-card, .timeline-item, .contact-content > *');
animateElements.forEach((el, index) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    el.style.transitionDelay = `${Math.min(0.45, (index % 6) * 0.07)}s`;
    observer.observe(el);
});

// Subtle 3D tilt animation for cards on desktop
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const tiltCards = document.querySelectorAll('.project-card, .skill-category, .timeline-content');

    tiltCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const rotateY = ((x / rect.width) - 0.5) * 8;
            const rotateX = ((y / rect.height) - 0.5) * -8;

            card.style.transform = `perspective(900px) translateY(-6px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });
}

// ===============================================
// TYPING EFFECT FOR HERO SUBTITLE
// ===============================================

const subtitleElement = document.querySelector('.hero-subtitle');
const subtitles = [
    'Full Stack Developer',
    'CSE Student @PEC',
    'Problem Solver'
];

let subtitleIndex = 0;
let charIndex = 0;
let isDeleting = false;
let typingDelay = 100;

function typeSubtitle() {
    const currentSubtitle = subtitles[subtitleIndex];
    
    if (isDeleting) {
        subtitleElement.textContent = currentSubtitle.substring(0, charIndex - 1);
        charIndex--;
        typingDelay = 50;
    } else {
        subtitleElement.textContent = currentSubtitle.substring(0, charIndex + 1);
        charIndex++;
        typingDelay = 100;
    }

    if (!isDeleting && charIndex === currentSubtitle.length) {
        typingDelay = 2000;
        isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        subtitleIndex = (subtitleIndex + 1) % subtitles.length;
        typingDelay = 500;
    }

    setTimeout(typeSubtitle, typingDelay);
}

// Start typing effect after page load
window.addEventListener('load', () => {
    setTimeout(typeSubtitle, 1000);
});

// ===============================================
// CONTACT FORM HANDLING
// ===============================================

const contactForm = document.getElementById('contactForm');

contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get form values
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const subject = document.getElementById('subject').value;
    const message = document.getElementById('message').value;
    
    // Create mailto link
    const mailtoLink = `mailto:keshavpec24@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`)}`;
    
    // Open email client
    window.location.href = mailtoLink;
    
    // Show success message
    alert('Thank you for your message! Your email client will open shortly.');
    
    // Reset form
    contactForm.reset();
});

// ===============================================
// SKILL TAGS ANIMATION
// ===============================================

const skillTags = document.querySelectorAll('.skill-tag');

skillTags.forEach((tag, index) => {
    tag.style.animationDelay = `${index * 0.1}s`;
});

// ===============================================
// SCROLL TO TOP BUTTON
// ===============================================

// Create scroll to top button
const scrollTopBtn = document.createElement('button');
scrollTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
scrollTopBtn.className = 'scroll-top-btn';
scrollTopBtn.style.cssText = `
    position: fixed;
    bottom: 30px;
    right: 30px;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: linear-gradient(135deg, #2563eb, #0f172a);
    color: white;
    border: none;
    cursor: pointer;
    font-size: 1.2rem;
    display: none;
    align-items: center;
    justify-content: center;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    z-index: 999;
    transition: all 0.3s ease;
`;
document.body.appendChild(scrollTopBtn);

// Show/hide scroll to top button
window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
        scrollTopBtn.style.display = 'flex';
    } else {
        scrollTopBtn.style.display = 'none';
    }
});

// Scroll to top on click
scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// Hover effect for scroll top button
scrollTopBtn.addEventListener('mouseenter', () => {
    scrollTopBtn.style.transform = 'translateY(-5px)';
});

scrollTopBtn.addEventListener('mouseleave', () => {
    scrollTopBtn.style.transform = 'translateY(0)';
});

// ===============================================
// PRELOADER (OPTIONAL)
// ===============================================

window.addEventListener('load', () => {
    const preloader = document.createElement('div');
    preloader.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: white;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        transition: opacity 0.5s ease;
    `;
    preloader.innerHTML = '<div style="width: 50px; height: 50px; border: 5px solid #f3f3f3; border-top: 5px solid #4a90e2; border-radius: 50%; animation: spin 1s linear infinite;"></div>';
    
    const style = document.createElement('style');
    style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
    document.head.appendChild(style);
    
    setTimeout(() => {
        preloader.style.opacity = '0';
        setTimeout(() => {
            preloader.remove();
        }, 500);
    }, 1000);
});

// ===============================================
// PARTICLE BACKGROUND EFFECT (OPTIONAL)
// ===============================================

function createParticles() {
    const hero = document.querySelector('.hero');
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.cssText = `
            position: absolute;
            width: 2px;
            height: 2px;
            background: rgba(255, 255, 255, 0.5);
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: float-particle ${5 + Math.random() * 10}s linear infinite;
            animation-delay: ${Math.random() * 5}s;
        `;
        hero.appendChild(particle);
    }
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes float-particle {
            0%, 100% { transform: translateY(0) translateX(0); opacity: 0; }
            10%, 90% { opacity: 1; }
            50% { transform: translateY(-100px) translateX(${Math.random() * 100 - 50}px); }
        }
    `;
    document.head.appendChild(style);
}

// Uncomment to enable particles
// createParticles();

console.log('%c🚀 Portfolio loaded successfully!', 'color: #4a90e2; font-size: 16px; font-weight: bold;');
