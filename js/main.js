/* てもみサロン ペパームーン – site interactions (no dependencies) */
(function () {
  'use strict';
  var doc = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* header: solid on scroll, bottom bar hide on scroll down */
  var header = document.querySelector('.site-header');
  var bar = document.querySelector('.bottom-bar');
  var toTop = document.querySelector('.to-top');
  var lastY = 0;
  function onScroll() {
    var y = window.scrollY;
    if (header && !header.classList.contains('site-header--solid')) header.classList.toggle('is-solid', y > 40);
    if (bar) bar.classList.toggle('is-hidden', y > lastY + 4 && y > 400);
    if (bar && y < lastY - 4) bar.classList.remove('is-hidden');
    if (toTop) toTop.classList.toggle('is-show', y > 700);
    lastY = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (toTop) toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });

  /* mobile drawer */
  var toggle = document.querySelector('.menu-toggle');
  var drawer = document.getElementById('drawer');
  function setNav(open) {
    doc.classList.toggle('nav-open', open);
    if (toggle) { toggle.setAttribute('aria-expanded', open); toggle.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く'); }
    if (drawer) drawer.setAttribute('aria-hidden', !open);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  if (toggle) toggle.addEventListener('click', function () { setNav(!doc.classList.contains('nav-open')); });
  if (drawer) drawer.addEventListener('click', function (e) { if (e.target.closest('a')) setNav(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setNav(false); });

  /* hero slideshow */
  var slides = document.querySelectorAll('.hero__slide');
  var dots = document.querySelectorAll('.hero__dots button');
  var copies = document.querySelectorAll('.hero__copy');
  if (slides.length > 1) {
    var cur = 0, timer;
    var go = function (n) {
      slides[cur].classList.remove('is-active'); if (dots[cur]) dots[cur].classList.remove('is-active');
      if (copies[cur]) { copies[cur].classList.remove('is-active'); copies[cur].setAttribute('aria-hidden', 'true'); }
      cur = (n + slides.length) % slides.length;
      slides[cur].classList.add('is-active'); if (dots[cur]) dots[cur].classList.add('is-active');
      if (copies[cur]) { copies[cur].classList.add('is-active'); copies[cur].removeAttribute('aria-hidden'); }
    };
    var play = function () { clearInterval(timer); if (!reduce) timer = setInterval(function () { go(cur + 1); }, 6500); };
    dots.forEach(function (d, i) { d.addEventListener('click', function () { go(i); play(); }); });
    play();
  }

  /* scroll reveal */
  var els = document.querySelectorAll('.reveal, .reveal-img');
  if ('IntersectionObserver' in window && !reduce) {
    // clip-path hides .reveal-img from IntersectionObserver, so watch its parent instead
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var t = en.target;
        if (t.classList.contains('reveal')) t.classList.add('is-in');
        t.querySelectorAll(':scope > .reveal-img').forEach(function (c) { c.classList.add('is-in'); });
        io.unobserve(t);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    els.forEach(function (el) { io.observe(el.classList.contains('reveal-img') ? el.parentElement : el); });
  } else { els.forEach(function (el) { el.classList.add('is-in'); }); }
  document.querySelectorAll('.stagger').forEach(function (g) {
    Array.prototype.forEach.call(g.children, function (c, i) { c.style.setProperty('--i', i); });
  });

  /* parallax for CTA background */
  var par = document.querySelectorAll('[data-parallax]');
  if (par.length && !reduce) {
    var tick = false;
    var upd = function () {
      par.forEach(function (el) {
        var r = el.parentElement.getBoundingClientRect();
        var p = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
        el.style.transform = 'translate3d(0,' + (p * -60).toFixed(1) + 'px,0)';
      });
      tick = false;
    };
    window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  }

  /* booking dialog */
  var dlg = document.getElementById('book-dialog');
  if (dlg) {
    var tabs = dlg.querySelectorAll('[role="tab"]');
    var showTab = function (name) {
      tabs.forEach(function (t) {
        var on = t.dataset.tab === name;
        t.setAttribute('aria-selected', on);
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
    };
    tabs.forEach(function (t) { t.addEventListener('click', function () { showTab(t.dataset.tab); }); });
    document.addEventListener('click', function (e) {
      var o = e.target.closest('[data-book]');
      if (o) {
        e.preventDefault(); setNav(false);
        showTab(o.dataset.book === 'tel' ? 'tel' : 'web');
        if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
        if (window.dataLayer) window.dataLayer.push({ event: 'open_booking', booking_type: o.dataset.book });
      }
      if (e.target.closest('[data-close]')) dlg.close();
    });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  }

  /* menu page: active chip while scrolling */
  var chips = document.querySelectorAll('.menu-nav a');
  if (chips.length && 'IntersectionObserver' in window) {
    var map = {};
    chips.forEach(function (c) { map[c.getAttribute('href').slice(1)] = c; });
    var mo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          chips.forEach(function (c) { c.classList.remove('is-active'); });
          var c = map[en.target.id];
          if (c) { c.classList.add('is-active'); c.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' }); }
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('.menu-sec').forEach(function (s) { mo.observe(s); });
  }

  /* contact form -> mail app */
  var form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = form.elements;
      var body = 'お名前: ' + f.name.value + '\nメールアドレス: ' + f.email.value + '\n\n' + f.message.value;
      window.location.href = 'mailto:' + form.dataset.to + '?subject=' + encodeURIComponent('【HP】お問い合わせ') + '&body=' + encodeURIComponent(body);
      var msg = document.getElementById('form-msg');
      if (msg) msg.hidden = false;
    });
  }

  /* tel / booking click tracking for GTM */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="tel:"], a[data-shop]');
    if (a && window.dataLayer) window.dataLayer.push({ event: a.href.indexOf('tel:') === 0 ? 'tel_click' : 'booking_click', shop: a.dataset.shop || a.href });
  });
})();
