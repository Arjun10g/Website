/* featured.js — GSAP-driven SVG centerpiece scenes (no Three.js).
 *
 * Two scenes:
 *   • ragScene  — three coloured clusters (mtsamples / pubmed / icd11) wired
 *                 with k-NN edges; slow rotation; pulsing retrieval beam.
 *   • blogScene — wireframe icosahedron projection with orbiting particles.
 *
 * Both auto-pause via IntersectionObserver when off-screen, halve density
 * on small screens, and respect prefers-reduced-motion.
 */
(function () {
  'use strict';
  if (typeof gsap === 'undefined') return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile     = window.matchMedia('(max-width: 700px)').matches;
  const SVGNS        = 'http://www.w3.org/2000/svg';

  const COLORS = {
    mtsamples: '#22d3ee',
    pubmed:    '#a78bfa',
    icd11:     '#34d399',
    gold:      '#fbbf24',
    purple:    '#a78bfa',
    white:     '#ffffff',
  };

  const VB_W = 400, VB_H = 240;

  function el(tag, attrs) {
    const e = document.createElementNS(SVGNS, tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  /* ------------------------------------------------------------------ */
  /* Scene 1 — rag-psych retrieval graph                                 */
  /* ------------------------------------------------------------------ */
  function buildRagScene(svg) {
    const COUNT = isMobile ? 9 : 14;
    const clusters = [
      { color: COLORS.mtsamples, cx: 110, cy:  90, label: 'mtsamples' },
      { color: COLORS.pubmed,    cx: 290, cy: 100, label: 'pubmed'    },
      { color: COLORS.icd11,     cx: 200, cy: 175, label: 'icd11'     },
    ];

    // Root group so we can rotate/parallax everything together
    const root = el('g', { class: 'rag-root', 'transform-origin': '200 120' });
    svg.appendChild(root);

    // Build clusters: nodes + edges + cluster halo
    const allNodes = [];
    const beamables = [];

    clusters.forEach((cl) => {
      const cg = el('g', { class: 'rag-cluster' });
      root.appendChild(cg);

      // soft halo behind the cluster
      const halo = el('circle', {
        cx: cl.cx, cy: cl.cy, r: 38,
        fill: cl.color, opacity: '0.07',
      });
      cg.appendChild(halo);
      gsap.to(halo, {
        attr: { r: 46 }, opacity: 0.12,
        duration: 2.4 + Math.random() * 1.2,
        repeat: -1, yoyo: true, ease: 'sine.inOut',
      });

      // Nodes around the cluster centre
      const pts = [];
      for (let i = 0; i < COUNT; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = 14 + Math.random() * 24;
        const x = cl.cx + Math.cos(a) * r;
        const y = cl.cy + Math.sin(a) * r;
        pts.push({ x, y });
      }

      // k-NN edges within the cluster (k=2 to keep it readable)
      for (let i = 0; i < pts.length; i++) {
        const dists = pts
          .map((p, j) => ({ j, d: i === j ? Infinity : Math.hypot(pts[i].x - p.x, pts[i].y - p.y) }))
          .sort((a, b) => a.d - b.d).slice(0, 2);
        for (const { j } of dists) {
          if (j > i) {
            const ln = el('line', {
              class: 'rag-edge',
              x1: pts[i].x, y1: pts[i].y, x2: pts[j].x, y2: pts[j].y,
              stroke: cl.color, 'stroke-width': '0.6', opacity: '0.28',
            });
            cg.appendChild(ln);
          }
        }
      }

      // Nodes on top
      pts.forEach((p) => {
        const c = el('circle', {
          class: 'rag-node',
          cx: p.x, cy: p.y, r: 1.8,
          fill: cl.color, opacity: '0.95',
        });
        cg.appendChild(c);
        allNodes.push({ el: c, color: cl.color });
        beamables.push(p);
      });

      // Cluster label, faint
      const lbl = el('text', {
        x: cl.cx, y: cl.cy - 50,
        'text-anchor': 'middle',
        fill: cl.color, opacity: '0.45',
        'font-family': 'JetBrains Mono, monospace',
        'font-size': '7',
        'letter-spacing': '0.12em',
      });
      lbl.textContent = cl.label.toUpperCase();
      cg.appendChild(lbl);
    });

    // The retrieval beam — bright line that hops between two random nodes
    const beam = el('line', {
      class: 'rag-beam',
      x1: 0, y1: 0, x2: 0, y2: 0,
      stroke: COLORS.white, 'stroke-width': '1.4', opacity: '0',
      'stroke-linecap': 'round',
    });
    root.appendChild(beam);

    function nextBeam() {
      const a = beamables[(Math.random() * beamables.length) | 0];
      let b = beamables[(Math.random() * beamables.length) | 0];
      let guard = 0;
      while ((Math.hypot(a.x - b.x, a.y - b.y) < 90) && guard++ < 6) {
        b = beamables[(Math.random() * beamables.length) | 0];
      }
      gsap.set(beam, { attr: { x1: a.x, y1: a.y, x2: a.x, y2: a.y } });
      gsap.to(beam,  { attr: { x2: b.x, y2: b.y }, duration: 0.45, ease: 'power2.out' });
      gsap.fromTo(beam, { opacity: 0 }, { opacity: 0.9, duration: 0.25, yoyo: true, repeat: 1, ease: 'sine.inOut',
        onComplete() {
          gsap.delayedCall(0.3 + Math.random() * 0.6, nextBeam);
        }
      });
    }
    gsap.delayedCall(0.6, nextBeam);

    // Slow rotation of the whole graph
    const rot = gsap.to(root, { rotation: 360, duration: 60, repeat: -1, ease: 'none', svgOrigin: '200 120' });

    // Subtle node twinkle
    allNodes.forEach((n, i) => {
      gsap.to(n.el, {
        opacity: 0.45,
        duration: 1.2 + Math.random() * 1.6,
        delay: Math.random() * 1.5,
        yoyo: true, repeat: -1, ease: 'sine.inOut',
      });
    });

    return { kill() { rot.kill(); gsap.killTweensOf(beam); allNodes.forEach(n => gsap.killTweensOf(n.el)); } };
  }

  /* ------------------------------------------------------------------ */
  /* Scene 2 — blog wireframe icosahedron + orbits                       */
  /* ------------------------------------------------------------------ */
  function buildBlogScene(svg) {
    const cx = 200, cy = 120;

    const root = el('g', { class: 'blog-root', 'transform-origin': '200 120' });
    svg.appendChild(root);

    // --- Icosahedron-ish wireframe via two rotated polygons + cross lines ---
    const wire = el('g', { class: 'blog-wire' });
    root.appendChild(wire);

    function ngon(radius, sides, rotateOffset = 0) {
      const points = [];
      for (let i = 0; i < sides; i++) {
        const a = (i / sides) * Math.PI * 2 + rotateOffset;
        points.push([cx + Math.cos(a) * radius, cy + Math.sin(a) * radius]);
      }
      return points;
    }

    const outer = ngon(72, 6, -Math.PI / 2);
    const inner = ngon(54, 6, 0);

    // Outer hex
    const outerPath = el('polygon', {
      points: outer.map(p => p.join(',')).join(' '),
      fill: 'none', stroke: COLORS.gold, 'stroke-width': '0.9', opacity: '0.65',
    });
    wire.appendChild(outerPath);

    // Inner hex (rotated)
    const innerPath = el('polygon', {
      points: inner.map(p => p.join(',')).join(' '),
      fill: 'none', stroke: COLORS.gold, 'stroke-width': '0.7', opacity: '0.45',
    });
    wire.appendChild(innerPath);

    // Spokes outer→inner
    for (let i = 0; i < outer.length; i++) {
      const o = outer[i];
      const inn = inner[i];
      const sp = el('line', {
        x1: o[0], y1: o[1], x2: inn[0], y2: inn[1],
        stroke: COLORS.gold, 'stroke-width': '0.5', opacity: '0.3',
      });
      wire.appendChild(sp);
    }
    // Long diagonals across the outer hex (the icosa-projection vibe)
    for (let i = 0; i < outer.length; i++) {
      const o = outer[i];
      const opp = outer[(i + 3) % outer.length];
      const dg = el('line', {
        x1: o[0], y1: o[1], x2: opp[0], y2: opp[1],
        stroke: COLORS.gold, 'stroke-width': '0.4', opacity: '0.18',
      });
      wire.appendChild(dg);
    }

    // --- Orbiting particles (purple) on tilted ellipses ---
    const ORBIT_COUNT = isMobile ? 16 : 28;
    const orbits = [];
    for (let i = 0; i < ORBIT_COUNT; i++) {
      const dot = el('circle', {
        class: 'blog-orbit',
        cx: cx, cy: cy, r: 1.6,
        fill: COLORS.purple, opacity: '0.78',
      });
      root.appendChild(dot);
      orbits.push({
        el: dot,
        radius: 88 + Math.random() * 24,
        phase:  Math.random() * Math.PI * 2,
        speed:  0.35 + Math.random() * 0.55,
        tilt:   (Math.random() - 0.5) * 0.7,   // y-flatten
        rotate: Math.random() * Math.PI,        // ellipse rotation
      });
    }

    // --- Pulsing core ---
    const core = el('circle', {
      class: 'blog-core',
      cx, cy, r: 3.2,
      fill: COLORS.white, opacity: '0.95',
    });
    root.appendChild(core);
    gsap.to(core, { attr: { r: 4.6 }, opacity: 0.55, duration: 1.2, yoyo: true, repeat: -1, ease: 'sine.inOut' });

    // --- Animations ---
    const wireTween = gsap.to(wire, { rotation: 360, duration: 40, repeat: -1, ease: 'none', svgOrigin: '200 120' });
    const innerTween = gsap.to(innerPath, { rotation: -360, duration: 28, repeat: -1, ease: 'none', svgOrigin: '200 120' });

    // Animated wireframe colour pulse
    gsap.to([outerPath, innerPath], {
      opacity: '+=0.15', duration: 2.2, yoyo: true, repeat: -1, ease: 'sine.inOut',
    });

    // Orbit ticker — drives particle positions every frame
    const tick = (time) => {
      const t = time / 1000;
      orbits.forEach((o) => {
        const a = o.phase + t * o.speed;
        // ellipse in local (rotated) space
        const lx = Math.cos(a) * o.radius;
        const ly = Math.sin(a) * o.radius * (0.45 + Math.abs(o.tilt));
        // rotate ellipse
        const x = cx + lx * Math.cos(o.rotate) - ly * Math.sin(o.rotate);
        const y = cy + lx * Math.sin(o.rotate) + ly * Math.cos(o.rotate);
        o.el.setAttribute('cx', x);
        o.el.setAttribute('cy', y);
      });
    };
    gsap.ticker.add(tick);

    return {
      kill() {
        wireTween.kill();
        innerTween.kill();
        gsap.killTweensOf(core);
        gsap.killTweensOf([outerPath, innerPath]);
        gsap.ticker.remove(tick);
      }
    };
  }

  /* ------------------------------------------------------------------ */
  /* Lifecycle wrapper                                                   */
  /* ------------------------------------------------------------------ */
  function bind(svg, builder) {
    if (!svg) return;
    if (reduceMotion) { builder(svg); return; }   // build static frame, no kill needed
    const wrap = svg.parentElement;
    let scene = null;
    let started = false;

    function start() {
      if (started) return;
      started = true;
      scene = builder(svg);
    }
    function stop() {
      if (!scene) return;
      scene.kill();
      scene = null;
      started = false;
    }

    const io = new IntersectionObserver((entries) => {
      entries[0].isIntersecting ? start() : stop();
    }, { threshold: 0.05 });
    io.observe(wrap);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
      else if (io.takeRecords().length === 0) {
        // Re-evaluate visibility after tab returns
        const r = wrap.getBoundingClientRect();
        if (r.bottom > 0 && r.top < window.innerHeight) start();
      }
    });

    // Hover: subtle speed-up of root rotation
    let hoverTween;
    wrap.addEventListener('mouseenter', () => {
      const root = svg.querySelector('.rag-root, .blog-root');
      if (!root) return;
      hoverTween && hoverTween.kill();
      hoverTween = gsap.to(root, { scale: 1.04, duration: 0.6, ease: 'power2.out', svgOrigin: '200 120' });
    });
    wrap.addEventListener('mouseleave', () => {
      const root = svg.querySelector('.rag-root, .blog-root');
      if (!root) return;
      hoverTween && hoverTween.kill();
      hoverTween = gsap.to(root, { scale: 1, duration: 0.8, ease: 'power2.out', svgOrigin: '200 120' });
    });
  }

  function init() {
    bind(document.getElementById('ragSvg'),  buildRagScene);
    bind(document.getElementById('blogSvg'), buildBlogScene);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
