/* animations.js — Shared GSAP setup for all pages */

function setupPageTransitions() {
  const overlay = document.getElementById('page-transition');
  if (!overlay) return;

  // Reveal page on load
  gsap.fromTo(overlay,
    { scaleY: 1, transformOrigin: 'top' },
    { scaleY: 0, duration: 0.9, ease: 'power4.inOut', delay: 0.05 }
  );

  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    if (href.startsWith('#') || href.startsWith('mailto') || href.startsWith('http')) return;
    if (link.hasAttribute('download')) return;
    if (!href.endsWith('.html')) return;

    link.addEventListener('click', e => {
      e.preventDefault();
      const dest = href;
      gsap.fromTo(overlay,
        { scaleY: 0, transformOrigin: 'bottom' },
        { scaleY: 1, duration: 0.65, ease: 'power4.inOut', onComplete: () => { window.location.href = dest; } }
      );
    });
  });
}

function setupCursor() {
  // Skip on touch devices — no pointer to show
  if (window.matchMedia('(hover: none)').matches) return;

  const cursor = document.createElement('div');
  cursor.id = 'cursor';
  const ring = document.createElement('div');
  ring.id = 'cursor-ring';
  document.body.append(cursor, ring);

  document.addEventListener('mousemove', e => {
    // Subtract half the element size to keep the dot centred on the pointer
    gsap.to('#cursor',     { x: e.clientX - 3.5, y: e.clientY - 3.5, duration: 0.08 });
    gsap.to('#cursor-ring',{ x: e.clientX - 15,  y: e.clientY - 15,  duration: 0.35, ease: 'power2.out' });
  });

  document.addEventListener('mousedown', () => {
    gsap.to(['#cursor', '#cursor-ring'], { scale: 0.7, duration: 0.1 });
  });
  document.addEventListener('mouseup', () => {
    gsap.to(['#cursor', '#cursor-ring'], { scale: 1, duration: 0.2 });
  });

  const enlargeTargets = () => document.querySelectorAll('a, button');
  function bindCursorHover() {
    enlargeTargets().forEach(el => {
      el.addEventListener('mouseenter', () => {
        gsap.to('#cursor', { scale: 2.2, duration: 0.2 });
        gsap.to('#cursor-ring', { scale: 2, opacity: 0.35, duration: 0.2 });
      });
      el.addEventListener('mouseleave', () => {
        gsap.to('#cursor', { scale: 1, duration: 0.2 });
        gsap.to('#cursor-ring', { scale: 1, opacity: 1, duration: 0.2 });
      });
    });
  }
  bindCursorHover();
}

function setupScrollReveals() {
  gsap.utils.toArray('.reveal-up').forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, y: 52 },
      {
        opacity: 1, y: 0,
        duration: 0.9, ease: 'power3.out',
        delay: parseFloat(el.dataset.delay || 0),
        scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' }
      }
    );
  });

  gsap.utils.toArray('.reveal-left').forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, x: -52 },
      { opacity: 1, x: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%' } }
    );
  });

  gsap.utils.toArray('.reveal-right').forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, x: 52 },
      { opacity: 1, x: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%' } }
    );
  });

  gsap.utils.toArray('.reveal-scale').forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, scale: 0.88 },
      { opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%' } }
    );
  });

  gsap.utils.toArray('.stagger-group').forEach(group => {
    const items = group.querySelectorAll('.stagger-item');
    gsap.fromTo(items,
      { opacity: 0, y: 40 },
      {
        opacity: 1, y: 0,
        stagger: 0.1, duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: group, start: 'top 85%' }
      }
    );
  });
}

function setupOrbFloating() {
  const orbs = [
    { sel: '.orb-1', y: -45, x:  20, dur: 8,  delay: 0 },
    { sel: '.orb-2', y:  55, x: -30, dur: 10, delay: 2 },
    { sel: '.orb-3', y: -25, x:  40, dur: 6,  delay: 1 },
  ];
  orbs.forEach(({ sel, y, x, dur, delay }) => {
    if (!document.querySelector(sel)) return;
    gsap.to(sel, { y, x, duration: dur, ease: 'sine.inOut', yoyo: true, repeat: -1, delay });
  });
}

function setupMobileNav() {
  const toggle = document.querySelector('.nav-toggle');
  if (!toggle) return;

  toggle.addEventListener('click', () => {
    const isOpen = document.body.classList.toggle('nav-open');
    toggle.setAttribute('aria-expanded', isOpen);
  });

  // Close menu when a nav link is clicked
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
      document.body.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

function initAnimations() {
  gsap.registerPlugin(ScrollTrigger);
  setupPageTransitions();
  setupCursor();
  setupScrollReveals();
  setupOrbFloating();
  setupMobileNav();
}
