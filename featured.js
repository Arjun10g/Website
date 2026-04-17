/* featured.js — Three.js scenes for the homepage centerpiece tiles.
 *
 * Two independent scenes:
 *   • ragScene  — three coloured clusters (mtsamples / pubmed / icd11) wired
 *                 with k-NN edges; slow rotation; gentle hover acceleration.
 *   • blogScene — wireframe icosahedron with orbiting particle rings.
 *
 * Both auto-pause via IntersectionObserver when off-screen, throttle with
 * the device pixel ratio, skip entirely if the user prefers reduced motion
 * or if Three.js failed to load. Cleanup on resize prevents WebGL context
 * leaks during fast nav.
 */
(function () {
  'use strict';

  if (typeof THREE === 'undefined') return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile     = window.matchMedia('(max-width: 700px)').matches;

  const PALETTE = {
    mtsamples: 0x22d3ee,   // cyan
    pubmed:    0xa78bfa,   // purple
    icd11:     0x34d399,   // green
    bg:        0x030712,
    blogA:     0xfbbf24,   // gold
    blogB:     0xa78bfa,
  };

  /* ------------------------------------------------------------------ */
  /* Shared lifecycle helper                                             */
  /* ------------------------------------------------------------------ */
  function makeScene(canvas, factory) {
    if (!canvas || reduceMotion) return;
    const wrap = canvas.parentElement;
    let { clientWidth: w, clientHeight: h } = wrap;
    if (w === 0 || h === 0) {
      // wrap not laid out yet — try after paint
      requestAnimationFrame(() => makeScene(canvas, factory));
      return;
    }

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !isMobile,
      alpha: true,
      powerPreference: 'low-power',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 2));
    renderer.setSize(w, h, false);
    renderer.setClearColor(0x000000, 0);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 100);
    camera.position.z = 5;

    const ctx = { renderer, scene, camera, w, h, hover: 0, mouseX: 0, mouseY: 0 };
    const update = factory(ctx);

    let raf = 0;
    let visible = true;
    let lastT = performance.now();

    function loop(t) {
      const dt = Math.min((t - lastT) / 1000, 0.05);
      lastT = t;
      // ease hover toward target (1 if pointer over wrap else 0)
      ctx.hover += (ctx.hoverTarget - ctx.hover) * Math.min(1, dt * 6);
      update(dt, t * 0.001);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    }

    function start() {
      if (raf) return;
      lastT = performance.now();
      raf = requestAnimationFrame(loop);
    }
    function stop() {
      cancelAnimationFrame(raf);
      raf = 0;
    }

    // Pause when scrolled off-screen
    const io = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      visible ? start() : stop();
    }, { threshold: 0.05 });
    io.observe(wrap);

    // Hover state
    ctx.hoverTarget = 0;
    wrap.addEventListener('mouseenter', () => { ctx.hoverTarget = 1; });
    wrap.addEventListener('mouseleave', () => { ctx.hoverTarget = 0; });

    // Subtle parallax from cursor inside the wrap
    wrap.addEventListener('mousemove', (e) => {
      const rect = wrap.getBoundingClientRect();
      ctx.mouseX = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;
      ctx.mouseY = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;
    });

    // Resize handling — debounced
    let rzT = 0;
    function onResize() {
      clearTimeout(rzT);
      rzT = setTimeout(() => {
        const nw = wrap.clientWidth, nh = wrap.clientHeight;
        if (nw === ctx.w && nh === ctx.h) return;
        ctx.w = nw; ctx.h = nh;
        renderer.setSize(nw, nh, false);
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
      }, 100);
    }
    window.addEventListener('resize', onResize, { passive: true });

    // Cleanup on page hide (prevents WebGL leaks during page transitions)
    document.addEventListener('visibilitychange', () => {
      document.hidden ? stop() : (visible && start());
    });
  }

  /* ------------------------------------------------------------------ */
  /* Scene 1 — rag-psych retrieval graph                                 */
  /* ------------------------------------------------------------------ */
  function ragFactory(ctx) {
    const { scene } = ctx;
    const COUNT_PER_CLUSTER = isMobile ? 22 : 38;
    const CLUSTERS = [
      { color: PALETTE.mtsamples, center: new THREE.Vector3(-1.6, 0.4, 0) },
      { color: PALETTE.pubmed,    center: new THREE.Vector3( 1.6, 0.5, 0.3) },
      { color: PALETTE.icd11,     center: new THREE.Vector3( 0.0, -1.3, -0.2) },
    ];

    // Particles (one BufferGeometry per cluster so we can colour them differently)
    const allPoints = [];
    const clusterGroup = new THREE.Group();

    CLUSTERS.forEach(({ color, center }) => {
      const positions = new Float32Array(COUNT_PER_CLUSTER * 3);
      const points = [];
      for (let i = 0; i < COUNT_PER_CLUSTER; i++) {
        const r = 0.55 + Math.random() * 0.55;
        const theta = Math.random() * Math.PI * 2;
        const phi   = Math.acos(2 * Math.random() - 1);
        const x = center.x + r * Math.sin(phi) * Math.cos(theta);
        const y = center.y + r * Math.sin(phi) * Math.sin(theta);
        const z = center.z + r * Math.cos(phi);
        positions[i * 3]     = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
        points.push(new THREE.Vector3(x, y, z));
      }
      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.PointsMaterial({
        color, size: isMobile ? 0.085 : 0.07,
        transparent: true, opacity: 0.95,
        blending: THREE.AdditiveBlending, depthWrite: false,
        sizeAttenuation: true,
      });
      const pts = new THREE.Points(geom, mat);
      clusterGroup.add(pts);
      allPoints.push({ points, color, mat });
    });

    // k-NN edges within each cluster
    const edgeGroup = new THREE.Group();
    allPoints.forEach(({ points, color }) => {
      const linePositions = [];
      const k = 3;
      for (let i = 0; i < points.length; i++) {
        const distances = points
          .map((p, j) => ({ j, d: i === j ? Infinity : points[i].distanceTo(p) }))
          .sort((a, b) => a.d - b.d)
          .slice(0, k);
        for (const { j } of distances) {
          if (j > i) {
            linePositions.push(points[i].x, points[i].y, points[i].z,
                               points[j].x, points[j].y, points[j].z);
          }
        }
      }
      const lg = new THREE.BufferGeometry();
      lg.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
      const lm = new THREE.LineBasicMaterial({
        color, transparent: true, opacity: 0.18,
        blending: THREE.AdditiveBlending, depthWrite: false,
      });
      const lines = new THREE.LineSegments(lg, lm);
      edgeGroup.add(lines);
    });

    // Cross-cluster "retrieval beam" — a single bright line that hops between
    // a random point in each cluster every couple of seconds. Mimics the per-source
    // retrieval → fusion path in the actual pipeline.
    const beamGeom = new THREE.BufferGeometry();
    beamGeom.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(6), 3));
    const beamMat = new THREE.LineBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const beam = new THREE.Line(beamGeom, beamMat);

    scene.add(clusterGroup);
    scene.add(edgeGroup);
    scene.add(beam);

    let beamT = 0;
    function pickBeamEndpoints() {
      const a = allPoints[Math.floor(Math.random() * allPoints.length)];
      let b = allPoints[Math.floor(Math.random() * allPoints.length)];
      while (b === a) b = allPoints[Math.floor(Math.random() * allPoints.length)];
      const pa = a.points[Math.floor(Math.random() * a.points.length)];
      const pb = b.points[Math.floor(Math.random() * b.points.length)];
      const arr = beamGeom.attributes.position.array;
      arr[0] = pa.x; arr[1] = pa.y; arr[2] = pa.z;
      arr[3] = pb.x; arr[4] = pb.y; arr[5] = pb.z;
      beamGeom.attributes.position.needsUpdate = true;
    }
    pickBeamEndpoints();

    return function update(dt, time) {
      const speed = 0.06 + ctx.hover * 0.18;
      clusterGroup.rotation.y += speed * dt * 0.6;
      clusterGroup.rotation.x = Math.sin(time * 0.2) * 0.18 + ctx.mouseY * 0.15;
      edgeGroup.rotation.copy(clusterGroup.rotation);
      beam.rotation.copy(clusterGroup.rotation);

      // Camera parallax
      camera_lerp(ctx, ctx.mouseX * 0.4, ctx.mouseY * 0.25, dt);

      // Beam pulse
      beamT += dt;
      const cycle = 1.6;
      if (beamT > cycle) { beamT = 0; pickBeamEndpoints(); }
      const phase = beamT / cycle;
      beam.material.opacity = 0.85 * Math.sin(phase * Math.PI);
    };
  }

  /* ------------------------------------------------------------------ */
  /* Scene 2 — blog wireframe icosahedron                                */
  /* ------------------------------------------------------------------ */
  function blogFactory(ctx) {
    const { scene, camera } = ctx;
    camera.position.z = 4.2;

    // Icosahedron — wireframe, gold
    const ico = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.35, 1),
      new THREE.MeshBasicMaterial({
        color: PALETTE.blogA, wireframe: true,
        transparent: true, opacity: 0.55,
      })
    );
    scene.add(ico);

    // Inner solid (faint, for depth)
    const inner = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.32, 0),
      new THREE.MeshBasicMaterial({
        color: PALETTE.bg, transparent: true, opacity: 0.7,
      })
    );
    scene.add(inner);

    // Orbiting purple particles — algorithmic ring
    const RING_COUNT = isMobile ? 90 : 160;
    const ringPositions = new Float32Array(RING_COUNT * 3);
    const ringPhases    = new Float32Array(RING_COUNT);
    const ringRadii     = new Float32Array(RING_COUNT);
    const ringTilts     = new Float32Array(RING_COUNT);
    for (let i = 0; i < RING_COUNT; i++) {
      ringPhases[i] = Math.random() * Math.PI * 2;
      ringRadii[i]  = 1.95 + Math.random() * 0.55;
      ringTilts[i]  = (Math.random() - 0.5) * 0.9;
    }
    const ringGeom = new THREE.BufferGeometry();
    ringGeom.setAttribute('position', new THREE.BufferAttribute(ringPositions, 3));
    const ringMat = new THREE.PointsMaterial({
      color: PALETTE.blogB, size: isMobile ? 0.055 : 0.045,
      transparent: true, opacity: 0.85,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const ringPts = new THREE.Points(ringGeom, ringMat);
    scene.add(ringPts);

    // Faint central glow particle (the "node" being computed on)
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 })
    );
    scene.add(core);

    return function update(dt, time) {
      const speed = 0.18 + ctx.hover * 0.5;
      ico.rotation.x += speed * dt * 0.6;
      ico.rotation.y += speed * dt * 0.9;
      inner.rotation.copy(ico.rotation);

      // Update orbit positions
      const arr = ringGeom.attributes.position.array;
      for (let i = 0; i < RING_COUNT; i++) {
        const a = ringPhases[i] + time * (0.35 + ringTilts[i] * 0.4);
        const r = ringRadii[i];
        const t = ringTilts[i];
        arr[i * 3]     = Math.cos(a) * r;
        arr[i * 3 + 1] = Math.sin(a) * r * Math.cos(t);
        arr[i * 3 + 2] = Math.sin(a) * r * Math.sin(t);
      }
      ringGeom.attributes.position.needsUpdate = true;
      ringPts.rotation.y = time * 0.08;

      // Core pulse
      const pulse = 1 + 0.25 * Math.sin(time * 2.2);
      core.scale.setScalar(pulse);
      core.material.opacity = 0.7 + 0.3 * Math.sin(time * 2.2);

      camera_lerp(ctx, ctx.mouseX * 0.3, ctx.mouseY * 0.22, dt);
    };
  }

  /* ------------------------------------------------------------------ */
  /* Helpers                                                             */
  /* ------------------------------------------------------------------ */
  function camera_lerp(ctx, tx, ty, dt) {
    const k = Math.min(1, dt * 4);
    ctx.camera.position.x += (tx - ctx.camera.position.x) * k;
    ctx.camera.position.y += (ty - ctx.camera.position.y) * k;
    ctx.camera.lookAt(0, 0, 0);
  }

  /* ------------------------------------------------------------------ */
  /* Init                                                                */
  /* ------------------------------------------------------------------ */
  function init() {
    const ragCanvas  = document.getElementById('ragCanvas');
    const blogCanvas = document.getElementById('blogCanvas');
    if (ragCanvas)  makeScene(ragCanvas,  ragFactory);
    if (blogCanvas) makeScene(blogCanvas, blogFactory);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
