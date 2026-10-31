// 格物官网交互：主题、页头、吉祥物、分段 Tab、横向轮播、黏性分步、进场动画。页头页脚由 Astro 渲染。
(function () {
  'use strict';
  // 主题
  var root = document.documentElement;
  try { var t = localStorage.getItem('garwoo-theme'); if (t) root.dataset.theme = t; } catch (e) {}
  document.getElementById('theme').addEventListener('click', function () {
    var dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('garwoo-theme', root.dataset.theme); } catch (e) {}
  });

  // 页头
  var hdr = document.getElementById('hdr');
  addEventListener('scroll', function () { hdr.classList.toggle('scrolled', scrollY > 8); }, { passive: true });
  document.getElementById('burger').addEventListener('click', function () { hdr.classList.toggle('menu-open'); });
  var mega = document.querySelector('.has-mega');
  mega.querySelector('button').addEventListener('click', function () {
    var open = mega.classList.toggle('open'); this.setAttribute('aria-expanded', open);
  });
  document.addEventListener('click', function (e) { if (!mega.contains(e.target)) mega.classList.remove('open'); });

  // 吉祥物：点击会嘎呜
  var audio;
  function roar(el) {
    el.classList.remove('roar'); void el.getBoundingClientRect(); el.classList.add('roar');
    var r = el.getBoundingClientRect(), b = document.createElement('div');
    b.className = 'roar-bubble'; b.textContent = '嘎呜！';
    b.style.left = Math.min(r.right - 10, innerWidth - 110) + 'px'; b.style.top = Math.max(r.top - 30, 8) + 'px';
    document.body.appendChild(b); setTimeout(function () { b.remove(); }, 1100);
    try {
      var A = window.AudioContext || window.webkitAudioContext; if (!A) return;
      audio = audio || new A();
      var c = audio, o = c.createOscillator(), g = c.createGain(), n = c.currentTime;
      o.type = 'sawtooth'; o.connect(g); g.connect(c.destination);
      o.frequency.setValueAtTime(220, n); o.frequency.exponentialRampToValueAtTime(330, n + .12); o.frequency.exponentialRampToValueAtTime(140, n + .45);
      g.gain.setValueAtTime(.0001, n); g.gain.exponentialRampToValueAtTime(.1, n + .03); g.gain.exponentialRampToValueAtTime(.0001, n + .5);
      o.start(n); o.stop(n + .52);
    } catch (e) {}
  }
  document.querySelectorAll('.mascot').forEach(function (m) {
    m.setAttribute('role', 'button'); m.setAttribute('tabindex', '0'); m.setAttribute('aria-label', '嘎呜');
    m.addEventListener('click', function () { roar(m); });
    m.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); roar(m); } });
  });

  // 分段 Tab：data-tabs 容器内的按钮 data-target 指向面板
  document.querySelectorAll('[data-tabs]').forEach(function (seg) {
    var btns = seg.querySelectorAll('button');
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        btns.forEach(function (x) {
          x.setAttribute('aria-selected', x === b);
          var p = document.getElementById(x.dataset.target); if (p) p.hidden = x !== b;
        });
        seg.dispatchEvent(new CustomEvent('tab', { detail: b.dataset.target }));
      });
    });
  });

  // 横向轮播：中间卡高亮，Tab 与左右按钮联动
  document.querySelectorAll('.rail').forEach(function (rail) {
    var slides = [].slice.call(rail.children), id = rail.id;
    var tabs = id ? document.querySelectorAll('[data-rail="' + id + '"] button') : [];
    function update() {
      var mid = rail.scrollLeft + rail.clientWidth / 2, best = 0, bd = 1e9;
      slides.forEach(function (s, i) { var d = Math.abs(s.offsetLeft + s.offsetWidth / 2 - mid); if (d < bd) { bd = d; best = i; } });
      slides.forEach(function (s, i) { s.classList.toggle('dimmed', i !== best && s.classList.contains('slide')); });
      tabs.forEach(function (t, i) { t.setAttribute('aria-selected', i === best); });
    }
    function go(i) { var s = slides[i]; if (s) rail.scrollTo({ left: s.offsetLeft - (rail.clientWidth - s.offsetWidth) / 2, behavior: 'smooth' }); }
    tabs.forEach(function (t, i) { t.addEventListener('click', function () { go(i); }); });
    document.querySelectorAll('[data-rail-prev="' + id + '"]').forEach(function (b) { b.addEventListener('click', function () { rail.scrollBy({ left: -rail.clientWidth * .7, behavior: 'smooth' }); }); });
    document.querySelectorAll('[data-rail-next="' + id + '"]').forEach(function (b) { b.addEventListener('click', function () { rail.scrollBy({ left: rail.clientWidth * .7, behavior: 'smooth' }); }); });
    rail.addEventListener('scroll', function () { requestAnimationFrame(update); }, { passive: true });
    addEventListener('resize', update); setTimeout(update, 50);
  });

  // 黏性分步讲述
  document.querySelectorAll('.story').forEach(function (story) {
    var steps = story.querySelectorAll('.step'), scenes = story.querySelectorAll('.viewer .scene');
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var i = [].indexOf.call(steps, e.target);
        steps.forEach(function (s, k) { s.classList.toggle('on', k === i); });
        scenes.forEach(function (s, k) { s.classList.toggle('on', k === i); });
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach(function (s) { io.observe(s); });
  });

  // 进场动画
  var rio = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach(function (el) { rio.observe(el); });

  window.GW_TOAST = function (msg) {
    var t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2200);
  };
})();
