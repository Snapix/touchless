// ================================
// TEXT PRESSURE EFFECT
// ================================
const pressureText = document.getElementById('pressureText');
const chars = pressureText ? pressureText.querySelectorAll('.char') : [];

let textMouse = { x: 0, y: 0 };
let textCursor = { x: 0, y: 0 };

if (chars.length > 0) {
    // Initialize character positions
    setTimeout(() => {
        chars.forEach((char, i) => {
            char.style.opacity = '0';
            char.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                char.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                char.style.opacity = '1';
                char.style.transform = 'translateY(0)';
            }, 400 + i * 50);
        });
    }, 100);

    // Calculate distance between two points
    const calcDist = (a, b) => {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        return Math.sqrt(dx * dx + dy * dy);
    };

    // Get attribute value based on distance
    const getCharAttr = (distance, maxDist, minVal, maxVal) => {
        const val = maxVal - Math.abs((maxVal * distance) / maxDist);
        return Math.max(minVal, val + minVal);
    };

    // Animate text pressure effect
    function animateTextPressure() {
        textMouse.x += (textCursor.x - textMouse.x) / 12;
        textMouse.y += (textCursor.y - textMouse.y) / 12;

        if (pressureText) {
            const titleRect = pressureText.getBoundingClientRect();
            const maxDist = titleRect.width / 2;

            chars.forEach(char => {
                const rect = char.getBoundingClientRect();
                const charCenter = {
                    x: rect.x + rect.width / 2,
                    y: rect.y + rect.height / 2
                };

                const distance = calcDist(textMouse, charCenter);
                
                // Calculate font weight based on distance (closer = bolder)
                const weight = Math.floor(getCharAttr(distance, maxDist, 100, 900));
                
                // Calculate scale based on distance (closer = bigger)
                const scale = getCharAttr(distance, maxDist, 1, 1.3).toFixed(2);
                
                // Calculate glow intensity
                const glowIntensity = getCharAttr(distance, maxDist, 0.3, 1).toFixed(2);

                char.style.fontWeight = weight;
                char.style.transform = `scale(${scale})`;
                char.style.textShadow = `
                    0 0 ${20 * glowIntensity}px rgba(255, 255, 255, ${0.8 * glowIntensity}),
                    0 0 ${40 * glowIntensity}px rgba(96, 165, 250, ${0.6 * glowIntensity}),
                    0 0 ${60 * glowIntensity}px rgba(167, 139, 250, ${0.4 * glowIntensity})
                `;
            });
        }

        requestAnimationFrame(animateTextPressure);
    }

    // Update cursor position for text effect
    document.addEventListener('mousemove', (e) => {
        textCursor.x = e.clientX;
        textCursor.y = e.clientY;
    });

    // Initialize position to center
    const titleRect = pressureText.getBoundingClientRect();
    textMouse.x = textCursor.x = titleRect.left + titleRect.width / 2;
    textMouse.y = textCursor.y = titleRect.top + titleRect.height / 2;

    animateTextPressure();
}

// ================================
// CUSTOM CURSOR
// ================================
const cursorDot = document.querySelector('.cursor-dot');
const cursorBlob = document.querySelector('.cursor-blob');

let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let dotX = mouseX;
let dotY = mouseY;
let blobX = mouseX;
let blobY = mouseY;

// Track mouse movement
document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

// Smooth cursor animation
function animateCursor() {
    // Smooth following for dot
    dotX += (mouseX - dotX) * 0.3;
    dotY += (mouseY - dotY) * 0.3;
    
    // Slower smooth following for blob
    blobX += (mouseX - blobX) * 0.12;
    blobY += (mouseY - blobY) * 0.12;
    
    if (cursorDot) {
        cursorDot.style.left = `${dotX}px`;
        cursorDot.style.top = `${dotY}px`;
        cursorDot.style.transform = 'translate(-50%, -50%)';
    }
    
    if (cursorBlob) {
        cursorBlob.style.left = `${blobX}px`;
        cursorBlob.style.top = `${blobY}px`;
        cursorBlob.style.transform = 'translate(-50%, -50%)';
    }
    
    requestAnimationFrame(animateCursor);
}

animateCursor();

// Cursor hover effects
const hoverElements = document.querySelectorAll('a, button, .btn, .feature-card, .download-card, .social-card');

hoverElements.forEach(el => {
    el.addEventListener('mouseenter', () => {
        if (cursorBlob) cursorBlob.classList.add('hover');
        if (cursorDot) cursorDot.style.transform = 'translate(-50%, -50%) scale(1.5)';
    });
    
    el.addEventListener('mouseleave', () => {
        if (cursorBlob) cursorBlob.classList.remove('hover');
        if (cursorDot) cursorDot.style.transform = 'translate(-50%, -50%) scale(1)';
    });
});

// ================================
// ANIMATED BACKGROUND CANVAS
// ================================
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');

let width, height;
let blobs = [];
const blobCount = 6;

// Deep blue and purple aurora palette
const colors = [
    'rgba(29, 78, 216, 0.4)',   // Deep Blue
    'rgba(30, 64, 175, 0.3)',   // Blue
    'rgba(88, 28, 135, 0.3)',   // Purple
    'rgba(37, 99, 235, 0.2)',   // Light Blue
    'rgba(67, 56, 202, 0.25)',  // Indigo
    'rgba(109, 40, 217, 0.25)'  // Violet
];

function initCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    
    blobs = [];
    for (let i = 0; i < blobCount; i++) {
        blobs.push({
            x: Math.random() * width,
            y: Math.random() * height,
            r: Math.random() * 500 + 400,
            vx: (Math.random() - 0.5) * 0.2,
            vy: (Math.random() - 0.5) * 0.2,
            color: colors[i % colors.length],
            offset: Math.random() * Math.PI * 2
        });
    }
}

function drawBackground(time) {
    ctx.clearRect(0, 0, width, height);
    
    blobs.forEach((blob, i) => {
        // Pulsing effect
        const currentR = blob.r + Math.sin(time * 0.0005 + blob.offset) * 50;
        
        const gradient = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, currentR);
        gradient.addColorStop(0, blob.color);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(blob.x, blob.y, currentR, 0, Math.PI * 2);
        ctx.fill();
        
        // Slow organic movement
        blob.x += blob.vx + Math.sin(time * 0.0002 + i) * 0.1;
        blob.y += blob.vy + Math.cos(time * 0.0002 + i) * 0.1;
        
        // Wrap around screen edges
        if (blob.x < -blob.r) blob.x = width + blob.r;
        if (blob.x > width + blob.r) blob.x = -blob.r;
        if (blob.y < -blob.r) blob.y = height + blob.r;
        if (blob.y > height + blob.r) blob.y = -blob.r;
    });
    
    requestAnimationFrame(drawBackground);
}

initCanvas();
drawBackground(0);

window.addEventListener('resize', initCanvas);

// ================================
// SCROLL REVEAL ANIMATIONS
// ================================
const revealSections = document.querySelectorAll('.reveal-section');

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
});

revealSections.forEach(section => {
    revealObserver.observe(section);
});

// ================================
// FEATURE CARDS STAGGER ANIMATION
// ================================
const featureCards = document.querySelectorAll('.feature-card');

const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const index = entry.target.dataset.index || 0;
            setTimeout(() => {
                entry.target.style.opacity = '0';
                entry.target.style.transform = 'translateY(50px)';
                entry.target.style.transition = 'all 0.8s cubic-bezier(0.22, 1, 0.36, 1)';
                
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, 50);
            }, index * 150);
            
            cardObserver.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.2
});

featureCards.forEach(card => {
    cardObserver.observe(card);
});

// ================================
// MAGNETIC BUTTON EFFECT
// ================================
const buttons = document.querySelectorAll('.btn, .download-card, .social-card');

buttons.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        const moveX = x * 0.15;
        const moveY = y * 0.15;
        
        btn.style.transform = `translate(${moveX}px, ${moveY}px)`;
    });
    
    btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate(0, 0)';
    });
});

// ================================
// SMOOTH SCROLL
// ================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ================================
// PARALLAX SCROLL EFFECT
// ================================
let ticking = false;

function updateParallax() {
    const scrolled = window.pageYOffset;
    
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        heroTitle.style.transform = `translateY(${scrolled * 0.3}px)`;
        heroTitle.style.opacity = 1 - (scrolled / 500);
    }
    
    ticking = false;
}

window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(updateParallax);
        ticking = true;
    }
});

// ================================
// BUTTON RIPPLE EFFECT
// ================================
const rippleButtons = document.querySelectorAll('.btn-primary, .download-primary');

rippleButtons.forEach(button => {
    button.addEventListener('click', function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const ripple = document.createElement('span');
        ripple.style.cssText = `
            position: absolute;
            width: 20px;
            height: 20px;
            background: rgba(255, 255, 255, 0.6);
            border-radius: 50%;
            transform: translate(-50%, -50%) scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
            left: ${x}px;
            top: ${y}px;
        `;
        
        this.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    });
});

// Add ripple animation to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: translate(-50%, -50%) scale(20);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ================================
// PERFORMANCE: REDUCE MOTION
// ================================
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (prefersReducedMotion.matches) {
    // Disable heavy animations for users who prefer reduced motion
    document.querySelectorAll('*').forEach(el => {
        el.style.animation = 'none';
        el.style.transition = 'none';
    });
}