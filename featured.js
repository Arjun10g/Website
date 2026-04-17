/* featured.js — Sync the dot indicator under the horizontal card scroller
 * with the currently-centered card. Click a dot → smooth scroll to that
 * card. No animations, no SVG, no GSAP dependency.
 */
(function () {
  'use strict';
  const scroller = document.getElementById('fwScroller');
  const dotsWrap = document.getElementById('fwDots');
  if (!scroller || !dotsWrap) return;

  const cards = Array.from(scroller.querySelectorAll('.fw-card'));
  const dots  = Array.from(dotsWrap.querySelectorAll('.fw-dot'));

  function setActive(idx) {
    dots.forEach((d, i) => {
      const active = i === idx;
      d.classList.toggle('active', active);
      // gold-coloured dot for the blog card (index 1)
      d.classList.toggle('gold', active && cards[i]?.classList.contains('fw-blog'));
    });
  }

  // Observe which card is centred in the scroller viewport.
  const io = new IntersectionObserver((entries) => {
    // pick the entry with the largest intersection ratio
    const visible = entries.filter(e => e.isIntersecting)
                           .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
    if (!visible.length) return;
    const idx = cards.indexOf(visible[0].target);
    if (idx >= 0) setActive(idx);
  }, {
    root: scroller,
    threshold: [0.55, 0.75, 0.9],
  });
  cards.forEach(c => io.observe(c));

  // Dot clicks → smooth scroll to card
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      if (!cards[i]) return;
      cards[i].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    });
  });
})();
