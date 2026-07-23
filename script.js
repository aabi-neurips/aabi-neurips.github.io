// Minimal JavaScript:
//  1. mobile navigation toggle
//  2. animated hero background: free-floating particles plus a
//     "connectome brain" point-cloud anchored on the right side.
// The site works fully without JS; with reduced-motion the static SVG
// background is shown instead of the animation.

document.addEventListener('DOMContentLoaded', function () {

  /* ---------- mobile nav ---------- */
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('siteNav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- typewriter title ---------- */
  var titleEl = document.getElementById('typeTitle');
  if (titleEl && !reducedMotion) {
    var ghost = titleEl.querySelector('.type-ghost');
    var typed = titleEl.querySelector('.type-text');
    var caret = titleEl.querySelector('.type-caret');
    var fullText = ghost ? ghost.textContent : '';
    if (ghost && typed && fullText) {
      titleEl.classList.add('js-typing');
      var pos = 0;
      var typeTick = function () {
        pos++;
        typed.textContent = fullText.slice(0, pos);
        if (pos < fullText.length) {
          setTimeout(typeTick, 34 + Math.random() * 40);
        } else if (caret) {
          setTimeout(function () { caret.classList.add('done'); }, 2600);
        }
      };
      setTimeout(typeTick, 500);
    }
  }

  /* ---------- hero animation ---------- */
  var canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  if (reducedMotion) return;

  var ctx = canvas.getContext('2d');
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0;
  var particles = [];   // free-floating movers
  var brainNodes = [];  // anchored point-cloud forming a brain
  var pulses = [];
  var LINK_DIST = 150;
  var brainLinkDist = 60;
  var mouse = { x: -9999, y: -9999 };
  var t = 0;

  // Side-view brain silhouette (facing left), normalized 0-100 units.
  var BRAIN_POLY = [
    [8, 62], [4, 48], [6, 36], [12, 24], [22, 14], [34, 8], [48, 6],
    [62, 8], [74, 14], [83, 24], [88, 34], [90, 44], [89, 54], [85, 62],
    [88, 66], [87, 74], [80, 79], [70, 79], [63, 74],       // cerebellum
    [60, 84], [54, 84], [55, 74],                            // brainstem
    [45, 72], [30, 68], [18, 66]
  ];

  function pointInPoly(x, y, poly) {
    var inside = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
    return inside;
  }

  function resize() {
    var rect = canvas.parentElement.getBoundingClientRect();
    W = rect.width;
    H = rect.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  function seed() {
    // free particles
    var count = Math.min(90, Math.max(35, Math.round((W * H) / 20000)));
    particles = [];
    for (var i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: 1.2 + Math.random() * 1.6,
        amber: i % 8 === 0
      });
    }

    // brain point-cloud: anchored on the right on wide screens,
    // centered (and fainter) on narrow ones
    brainNodes = [];
    var narrow = W < 760;
    var scale = narrow ? Math.min(W * 0.8, H * 0.5) : Math.min(H * 0.62, W * 0.4);
    var ox = narrow ? (W - scale) / 2 : W * 0.98 - scale;
    var oy = narrow ? H * 0.16 : H * 0.5 - scale * 0.45;
    brainLinkDist = scale * 0.115;

    function addNode(nx, ny, edge) {
      brainNodes.push({
        x0: ox + (nx / 100) * scale,
        y0: oy + (ny / 100) * scale,
        x: 0, y: 0,
        phase: Math.random() * Math.PI * 2,
        speed: 0.004 + Math.random() * 0.004,
        wobble: scale * (0.006 + Math.random() * 0.008),
        r: edge ? 1.6 : 1.1 + Math.random() * 1.4,
        amber: Math.random() < 0.1,
        alpha: narrow ? 0.35 : 0.6
      });
    }

    // boundary nodes: walk the outline
    for (var b = 0; b < BRAIN_POLY.length; b++) {
      var p1 = BRAIN_POLY[b], p2 = BRAIN_POLY[(b + 1) % BRAIN_POLY.length];
      var segLen = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      var steps = Math.max(1, Math.round(segLen / 5));
      for (var s = 0; s < steps; s++) {
        var f = s / steps;
        addNode(p1[0] + (p2[0] - p1[0]) * f, p1[1] + (p2[1] - p1[1]) * f, true);
      }
    }
    // interior nodes: rejection sampling
    var target = 70, guard = 0;
    while (target > 0 && guard < 4000) {
      guard++;
      var rx = Math.random() * 100, ry = Math.random() * 100;
      if (pointInPoly(rx, ry, BRAIN_POLY)) {
        addNode(rx, ry, false);
        target--;
      }
    }
  }

  function spawnPulse() {
    // pulses mostly fire from inside the brain
    var fromBrain = Math.random() < 0.7 && brainNodes.length;
    var src = fromBrain
      ? brainNodes[Math.floor(Math.random() * brainNodes.length)]
      : particles[Math.floor(Math.random() * particles.length)];
    if (src) {
      pulses.push({
        x: src.x || src.x0, y: src.y || src.y0,
        r: 0, max: 60 + Math.random() * 70,
        amber: src.amber
      });
    }
  }

  var pulseTimer = setInterval(spawnPulse, 1500);

  function step() {
    ctx.clearRect(0, 0, W, H);
    t++;

    // --- brain node positions (gentle breathing wobble) ---
    for (var n = 0; n < brainNodes.length; n++) {
      var bn = brainNodes[n];
      bn.x = bn.x0 + Math.cos(bn.phase + t * bn.speed) * bn.wobble;
      bn.y = bn.y0 + Math.sin(bn.phase + t * bn.speed * 1.3) * bn.wobble;
    }

    // --- links among brain nodes (connectome) ---
    for (var i = 0; i < brainNodes.length; i++) {
      var a = brainNodes[i];
      for (var j = i + 1; j < brainNodes.length; j++) {
        var b = brainNodes[j];
        var dx = a.x - b.x, dy = a.y - b.y;
        var d2 = dx * dx + dy * dy;
        if (d2 < brainLinkDist * brainLinkDist) {
          var alpha = (a.alpha * 0.42) * (1 - Math.sqrt(d2) / brainLinkDist);
          ctx.strokeStyle = 'rgba(96, 165, 250, ' + alpha.toFixed(3) + ')';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // --- links among free particles ---
    for (i = 0; i < particles.length; i++) {
      a = particles[i];
      for (j = i + 1; j < particles.length; j++) {
        b = particles[j];
        var fdx = a.x - b.x, fdy = a.y - b.y;
        var fd2 = fdx * fdx + fdy * fdy;
        if (fd2 < LINK_DIST * LINK_DIST) {
          var falpha = 0.14 * (1 - Math.sqrt(fd2) / LINK_DIST);
          ctx.strokeStyle = 'rgba(96, 165, 250, ' + falpha.toFixed(3) + ')';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // --- draw brain nodes ---
    for (n = 0; n < brainNodes.length; n++) {
      bn = brainNodes[n];
      ctx.beginPath();
      ctx.arc(bn.x, bn.y, bn.r, 0, Math.PI * 2);
      ctx.fillStyle = bn.amber
        ? 'rgba(245, 158, 11, ' + (bn.alpha + 0.15).toFixed(2) + ')'
        : 'rgba(125, 180, 252, ' + bn.alpha.toFixed(2) + ')';
      ctx.fill();
    }

    // --- move & draw free particles ---
    for (var k = 0; k < particles.length; k++) {
      var p = particles[k];
      var mdx = mouse.x - p.x, mdy = mouse.y - p.y;
      var md2 = mdx * mdx + mdy * mdy;
      if (md2 < 160 * 160) {
        p.vx += mdx * 0.000012 * (160 * 160 - md2) / (160 * 160);
        p.vy += mdy * 0.000012 * (160 * 160 - md2) / (160 * 160);
      }
      p.x += p.vx;
      p.y += p.vy;
      p.vx = Math.max(-0.5, Math.min(0.5, p.vx));
      p.vy = Math.max(-0.5, Math.min(0.5, p.vy));
      if (p.x < -10) p.x = W + 10; else if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10; else if (p.y > H + 10) p.y = -10;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.amber ? 'rgba(245, 158, 11, 0.7)' : 'rgba(96, 165, 250, 0.55)';
      ctx.fill();
    }

    // --- expanding pulse rings ---
    for (var q = pulses.length - 1; q >= 0; q--) {
      var pu = pulses[q];
      pu.r += 0.9;
      var life = 1 - pu.r / pu.max;
      if (life <= 0) { pulses.splice(q, 1); continue; }
      ctx.beginPath();
      ctx.arc(pu.x, pu.y, pu.r, 0, Math.PI * 2);
      ctx.strokeStyle = pu.amber
        ? 'rgba(245, 158, 11, ' + (0.35 * life).toFixed(3) + ')'
        : 'rgba(96, 165, 250, ' + (0.3 * life).toFixed(3) + ')';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    raf = requestAnimationFrame(step);
  }

  canvas.parentElement.addEventListener('mousemove', function (e) {
    var rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });
  canvas.parentElement.addEventListener('mouseleave', function () {
    mouse.x = -9999; mouse.y = -9999;
  });

  var raf;
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      clearInterval(pulseTimer);
    } else {
      pulseTimer = setInterval(spawnPulse, 1500);
      raf = requestAnimationFrame(step);
    }
  });

  resize();
  raf = requestAnimationFrame(step);
});
