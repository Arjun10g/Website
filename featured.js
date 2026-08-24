/* featured.js — Dot pagination for the horizontal card scroller.
 *
 * The dots are BUILT FROM THE CARDS rather than hand-written in the markup, so
 * adding or removing a card never leaves the pagination out of sync. Clicking a
 * dot scrolls its card into view. No animations, no SVG, no GSAP dependency.
 */
(function () {
  'use strict';
  const scroller = document.getElementById('fwScroller');
  const dotsWrap = document.getElementById('fwDots');
  if (!scroller || !dotsWrap) return;

  const cards = Array.from(scroller.querySelectorAll('.fw-card'));
  if (!cards.length) return;

  // Per-variant dot tint, keyed off the card's accent class.
  const TINTS = { 'fw-blog': 'gold', 'fw-dcs': 'green', 'fw-quant': 'purple' };
  const tintOf = card => {
    for (const cls in TINTS) if (card.classList.contains(cls)) return TINTS[cls];
    return null;
  };

  dotsWrap.textContent = '';
  const dots = cards.map((card, i) => {
    const title = card.querySelector('.fw-title')?.textContent.trim() || `project ${i + 1}`;
    const dot = document.createElement('button');
    dot.className = 'fw-dot' + (i === 0 ? ' active' : '');
    dot.type = 'button';
    dot.dataset.idx = String(i);
    dot.setAttribute('aria-label', `View ${title}`);
    dot.addEventListener('click', () => {
      card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    });
    dotsWrap.appendChild(dot);
    return dot;
  });
  // The first card's tint has to be applied up front — setActive only runs once
  // the observer fires, which is after paint.
  const firstTint = tintOf(cards[0]);
  if (firstTint) dots[0].classList.add(firstTint);

  function setActive(idx) {
    dots.forEach((d, i) => {
      const active = i === idx;
      d.classList.toggle('active', active);
      ['gold', 'green', 'purple'].forEach(t => d.classList.remove(t));
      const tint = tintOf(cards[i]);
      if (active && tint) d.classList.add(tint);
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
})();
