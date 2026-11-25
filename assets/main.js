/* GullyDRS – small, dependency-free enhancements. The page works fully without JS. */
(function () {
  var doc = document.documentElement;
  doc.classList.add('js');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Split the hero headline into words for a staggered entrance (keeps inner markup)
  var h1 = document.querySelector('.hero h1');
  if (h1 && !reduce) {
    var i = 0;
    (function split(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var w = document.createElement('span'); w.className = 'w'; w.style.setProperty('--i', i++); w.textContent = part; frag.appendChild(w);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'svg') {
          if (n.classList.contains('seam')) { n.classList.add('w'); n.style.setProperty('--i', i++); } else { split(n); }
        }
      });
    })(h1);
  }

  // Header shadow + scroll progress
  var header = document.querySelector('.site-header');
  var bar = document.querySelector('.progress');
  var ticking = false;
  var onScroll = function () {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY;
      if (header) header.classList.toggle('scrolled', y > 8);
      if (bar) { var max = document.documentElement.scrollHeight - window.innerHeight; bar.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')'; }
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Mobile menu
  var btn = document.querySelector('.menu-btn');
  if (btn) {
    var setOpen = function (open) {
      doc.classList.toggle('menu-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    btn.addEventListener('click', function () { setOpen(!doc.classList.contains('menu-open')); });
    document.querySelectorAll('.nav a').forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
  }

  // Count-up numbers
  var countUp = function (el) {
    var to = parseFloat(el.getAttribute('data-count')); if (isNaN(to)) return;
    var start = null, dur = 1100;
    var step = function (t) {
      if (!start) start = t;
      var p = Math.min(1, (t - start) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * e);
      if (p < 1) requestAnimationFrame(step);
    };
    el.textContent = '0'; requestAnimationFrame(step);
  };

  // Reveal on scroll
  var items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || reduce) {
    items.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        e.target.querySelectorAll('[data-count]').forEach(countUp);
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  }

  // Gentle 3D tilt on cards (mouse only)
  if (finePointer && !reduce) {
    document.querySelectorAll('.call, .tile, .place, .guide, .step').forEach(function (card) {
      card.addEventListener('mouseenter', function () { card.classList.add('tilt'); });
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty('--ry', (x * 6).toFixed(2) + 'deg');
        card.style.setProperty('--rx', (-y * 6).toFixed(2) + 'deg');
        card.style.setProperty('--ty', '-4px');
      });
      card.addEventListener('mouseleave', function () {
        card.style.setProperty('--ry', '0deg'); card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ty', '0');
      });
    });
  }

  // Stop SVG (SMIL) animations for people who prefer less motion
  if (reduce) document.querySelectorAll('svg').forEach(function (s) { if (s.pauseAnimations) s.pauseAnimations(); });

  // Demo video: load and play only when visible, never with reduced motion or data saver
  var v = document.getElementById('demo');
  var saveData = navigator.connection && navigator.connection.saveData;
  if (v && !reduce && !saveData && 'IntersectionObserver' in window) {
    var vo = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { v.preload = 'auto'; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        else { v.pause(); }
      });
    }, { threshold: 0.25 });
    vo.observe(v);
  }
})();
