// STATE VARIABLES
const totalImages = 17;
const images = [];
let loadedCount = 0;
let targetScrollY = 0;
let currentScrollY = 0;
const easing = 0.08; // Buttery smooth scroll easing factor

// SELECTORS
const canvas = document.getElementById('scroll-canvas');
const ctx = canvas.getContext('2d');
const preloader = document.getElementById('preloader');
const loaderBar = document.getElementById('loader-bar');
const loaderPercentage = document.getElementById('loader-percentage');
const progressBarY = document.getElementById('progress-bar-y');
const customCursor = document.getElementById('custom-cursor');
const customCursorDot = document.getElementById('custom-cursor-dot');

// MOUSE POSITION FOR CUSTOM CURSOR
let mouseX = -100;
let mouseY = -100;
let cursorX = -100;
let cursorY = -100;

// PRELOAD IMAGES
function preloadImages() {
    return new Promise((resolve) => {
        for (let i = 1; i <= totalImages; i++) {
            const img = new Image();
            // Format number to three digits: e.g. 1 -> '001', 12 -> '012'
            const frameNum = String(i).padStart(3, '0');
            img.src = `ezgif-frame-${frameNum}.jpg`;
            img.onload = () => {
                loadedCount++;
                updateLoaderProgress();
                if (loadedCount === totalImages) {
                    resolve();
                }
            };
            img.onerror = () => {
                // Fail-safe to avoid blocking the site if an image is missing
                loadedCount++;
                updateLoaderProgress();
                if (loadedCount === totalImages) {
                    resolve();
                }
            };
            images.push(img);
        }
    });
}

function updateLoaderProgress() {
    const progress = Math.round((loadedCount / totalImages) * 100);
    loaderBar.style.width = `${progress}%`;
    loaderPercentage.innerText = `${progress}%`;
}

// COVER DRAW ROUTINE (Equivalent to background-size: cover)
function drawImageCover(ctx, img) {
    const dpr = window.devicePixelRatio || 1;
    const canvasWidth = canvas.width / dpr;
    const canvasHeight = canvas.height / dpr;

    const imgWidth = img.width;
    const imgHeight = img.height;

    // Calc scale ratio
    const r = Math.min(canvasWidth / imgWidth, canvasHeight / imgHeight);
    let nw = imgWidth * r;
    let nh = imgHeight * r;
    let ar = 1;

    // Fill cover differences
    if (nw < canvasWidth) ar = canvasWidth / nw;
    if (Math.abs(ar - 1) < 1e-14 && nh < canvasHeight) ar = canvasHeight / nh;
    nw *= ar;
    nh *= ar;

    // Crop source bounding box
    const cw = imgWidth / (nw / canvasWidth);
    const ch = imgHeight / (nh / canvasHeight);
    const cx = (imgWidth - cw) / 2;
    const cy = (imgHeight - ch) / 2;

    // Clear Canvas and Draw Frame
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(img, cx, cy, cw, ch, 0, 0, canvasWidth, canvasHeight);
}

// SCALE CANVAS FOR HIGH RESOLUTION DESKTOPS (Ultra HD)
function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    ctx.resetTransform();
    ctx.scale(dpr, dpr);

    // Redraw current frame immediately on resize
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = maxScroll <= 0 ? 0 : currentScrollY / maxScroll;
    const frameIndex = Math.min(totalImages - 1, Math.max(0, Math.floor(scrollPercent * totalImages)));
    if (images[frameIndex]) {
        drawImageCover(ctx, images[frameIndex]);
    }
}

// ANIMATION LOOP (Scroll Interpolation & Cursor Easing)
function updateAnimation() {
    // 1. Scroll Lerping
    const diff = targetScrollY - currentScrollY;
    if (Math.abs(diff) > 0.05) {
        currentScrollY += diff * easing;
    } else {
        currentScrollY = targetScrollY;
    }

    // 2. Map scroll to sequence frame
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = maxScroll <= 0 ? 0 : currentScrollY / maxScroll;
    const frameIndex = Math.min(totalImages - 1, Math.max(0, Math.floor(scrollPercent * totalImages)));

    if (images[frameIndex]) {
        drawImageCover(ctx, images[frameIndex]);
    }

    // 3. Update Progress Bar
    progressBarY.style.height = `${scrollPercent * 100}%`;

    // 4. Cursor Easing
    const cursorDiffX = mouseX - cursorX;
    const cursorDiffY = mouseY - cursorY;
    
    cursorX += cursorDiffX * 0.18;
    cursorY += cursorDiffY * 0.18;

    customCursor.style.left = `${cursorX}px`;
    customCursor.style.top = `${cursorY}px`;
    
    customCursorDot.style.left = `${mouseX}px`;
    customCursorDot.style.top = `${mouseY}px`;

    requestAnimationFrame(updateAnimation);
}

// INTERSECTION OBSERVER FOR FADE-IN TEXTS
function setupIntersectionObserver() {
    const options = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add visible class to trigger CSS transition
                entry.target.classList.add('visible');
                
                // Find all nested fade-in elements within this section
                const childElements = entry.target.querySelectorAll('.fade-in');
                childElements.forEach((el, index) => {
                    setTimeout(() => {
                        el.classList.add('visible');
                    }, index * 150); // Stagger element entrances
                });
            }
        });
    }, options);

    // Observe each content section
    document.querySelectorAll('.section').forEach(section => {
        observer.observe(section);
    });
}

// MOUSE INTERACTION TRACKING
function setupMouseEvents() {
    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        // Show cursor elements once first movement occurs
        customCursor.style.opacity = 1;
        customCursorDot.style.opacity = 1;
    });

    // Expand cursor ring when hovering links or buttons
    const interactiveElements = document.querySelectorAll('a, button, input, textarea, .btn');
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            customCursor.classList.add('hovered');
        });
        el.addEventListener('mouseleave', () => {
            customCursor.classList.remove('hovered');
        });
    });

    // Hide cursor when leaving window
    document.addEventListener('mouseleave', () => {
        customCursor.style.opacity = 0;
        customCursorDot.style.opacity = 0;
    });
}

// MAIN SETUP INITIALIZATION
async function init() {
    // Initialize UI cursor coordinates out of view
    customCursor.style.opacity = 0;
    customCursorDot.style.opacity = 0;

    // Load images
    await preloadImages();

    // Fade out preloader
    setTimeout(() => {
        preloader.classList.add('fade-out');
    }, 400);

    // Setup size and listeners
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('scroll', () => {
        targetScrollY = window.scrollY;
        checkScrollAchievement();
    }, { passive: true });

    resizeCanvas();
    setupIntersectionObserver();
    setupMouseEvents();
    initViewCounter();
    
    // Kickstart main loop
    requestAnimationFrame(updateAnimation);
}

// SCROLL ACHIEVEMENT & VIEW COUNTER SYSTEM
let achievementUnlocked = false;

function checkScrollAchievement() {
    if (achievementUnlocked) return;
    
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollHeight <= 0) return;
    
    const scrollPercent = (window.scrollY / scrollHeight) * 100;
    if (scrollPercent >= 60) {
        achievementUnlocked = true;
        showAchievement();
    }
}

function showAchievement() {
    const toast = document.getElementById('achievement-toast');
    if (!toast) return;
    
    toast.classList.add('show');
    
    // Play retro synth coin sound
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        let osc1 = audioCtx.createOscillator();
        let gain1 = audioCtx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        gain1.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        osc1.connect(gain1);
        gain1.connect(audioCtx.destination);
        osc1.start();
        osc1.stop(audioCtx.currentTime + 0.25);
        
        setTimeout(() => {
            let osc2 = audioCtx.createOscillator();
            let gain2 = audioCtx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
            gain2.gain.setValueAtTime(0.08, audioCtx.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
            osc2.connect(gain2);
            gain2.connect(audioCtx.destination);
            osc2.start();
            osc2.stop(audioCtx.currentTime + 0.35);
        }, 80);
    } catch (e) {
        console.log("Audio play blocked or unsupported");
    }
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 5000);
}

function initViewCounter() {
    const counterEl = document.getElementById('hits-count');
    if (!counterEl) return;
    
    let currentHits = localStorage.getItem('dinesh_portfolio_views');
    if (!currentHits) {
        currentHits = 1024 + Math.floor(Math.random() * 200); // Seed views
    } else {
        currentHits = parseInt(currentHits, 10);
    }
    
    currentHits += 1;
    localStorage.setItem('dinesh_portfolio_views', currentHits);
    
    counterEl.innerText = currentHits.toLocaleString();
}

// Start app on DOM Loaded
document.addEventListener('DOMContentLoaded', init);
