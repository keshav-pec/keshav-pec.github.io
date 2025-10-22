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

window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.backdropFilter = 'blur(10px)';
    } else {
        navbar.style.background = '#ffffff';
        navbar.style.backdropFilter = 'none';
    }
});

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
animateElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// ===============================================
// TYPING EFFECT FOR HERO SUBTITLE
// ===============================================

const subtitleElement = document.querySelector('.hero-subtitle');
const subtitles = [
    'Full Stack Developer',
    'MERN Stack Specialist',
    'CS Student @ PEC',
    'Frontend Developer @ SlugLime',
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
    background: linear-gradient(135deg, #667eea, #764ba2);
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
