// 格物官网原型：知识网络背景。节点缓慢漂移、近的两点连线，光点沿连线跑过去，鼠标靠近时节点被吸过来。
// 只挂在 .hero 和 .final 上；不可见时暂停，prefers-reduced-motion 时只画一帧。
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hosts = document.querySelectorAll('.hero, .final');
  if (!hosts.length) return;

  function rgb(v) {
    var c = document.createElement('canvas').getContext('2d'); c.fillStyle = v; var s = c.fillStyle;
    if (s[0] === '#') return [parseInt(s.substr(1, 2), 16), parseInt(s.substr(3, 2), 16), parseInt(s.substr(5, 2), 16)];
    var m = s.match(/[\d.]+/g); return [+m[0], +m[1], +m[2]];
  }

  function Net(host) {
    var cv = document.createElement('canvas'), ctx = cv.getContext('2d'), local = host.classList.contains('viewer');
    cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = 'position:absolute;top:0;height:100%;z-index:-1;pointer-events:none;' +
      (local ? 'border-radius:inherit' : '-webkit-mask-image:linear-gradient(#000 55%,transparent);mask-image:linear-gradient(#000 55%,transparent)');
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    host.style.isolation = 'isolate';
    host.insertBefore(cv, host.firstChild);
    var w = 0, h = 0, dpr = 1, nodes = [], pulses = [], mouse = null, vis = true, raf = 0, t0 = 0, col = [47, 107, 255], dark = false;

    function theme() {
      var cs = getComputedStyle(document.documentElement);
      col = rgb(cs.getPropertyValue('--primary').trim() || '#2f6bff');
      var bg = rgb(cs.getPropertyValue('--bg').trim() || '#fff'); dark = bg[0] + bg[1] + bg[2] < 300;
    }
    function size() {
      var r = host.getBoundingClientRect(); dpr = Math.min(devicePixelRatio || 1, 2);
      w = local ? r.width : document.documentElement.clientWidth; h = r.height;
      cv.style.left = (local ? 0 : -r.left) + 'px'; cv.style.width = w + 'px';
      cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(90, w * h / (local ? 5500 : 11000)) * (w < 700 ? .6 : 1));
      while (nodes.length < n) nodes.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .18, vy: (Math.random() - .5) * .18, r: 1 + Math.random() * 1.4, b: 0 });
      nodes.length = n;
    }
    var LINK = 150;
    function step(dt) {
      for (var i = 0; i < nodes.length; i++) {
        var p = nodes[i];
        if (mouse) { var dx = mouse.x - p.x, dy = mouse.y - p.y, d = Math.hypot(dx, dy); if (d < 160 && d > 1) { p.vx += dx / d * .004; p.vy += dy / d * .004; } }
        p.vx *= .995; p.vy *= .995;
        var s = Math.hypot(p.vx, p.vy); if (s < .05) { p.vx += (Math.random() - .5) * .01; p.vy += (Math.random() - .5) * .01; } if (s > .5) { p.vx *= .5 / s; p.vy *= .5 / s; }
        p.x += p.vx * dt * .06; p.y += p.vy * dt * .06;
        if (p.x < -20) p.x = w + 20; if (p.x > w + 20) p.x = -20; if (p.y < -20) p.y = h + 20; if (p.y > h + 20) p.y = -20;
        p.b *= .96;
      }
      for (var k = pulses.length - 1; k >= 0; k--) { pulses[k].t += dt / pulses[k].len * .5; if (pulses[k].t >= 1) { pulses[k].b.b = 1; pulses.splice(k, 1); } }
    }
    function spawn() {
      if (pulses.length > 5 || nodes.length < 2) return;
      var a = nodes[Math.floor(Math.random() * nodes.length)], best = [];
      for (var i = 0; i < nodes.length; i++) { var d = Math.hypot(nodes[i].x - a.x, nodes[i].y - a.y); if (nodes[i] !== a && d < LINK) best.push(nodes[i]); }
      if (!best.length) return;
      var b = best[Math.floor(Math.random() * best.length)];
      pulses.push({ a: a, b: b, t: 0, len: Math.hypot(b.x - a.x, b.y - a.y) + 40 });
    }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      var la = dark ? .36 : .26, c = col.join(',');
      ctx.lineWidth = 1;
      for (var i = 0; i < nodes.length; i++) for (var j = i + 1; j < nodes.length; j++) {
        var dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y, d2 = dx * dx + dy * dy;
        if (d2 < LINK * LINK) { ctx.strokeStyle = 'rgba(' + c + ',' + (la * (1 - Math.sqrt(d2) / LINK)).toFixed(3) + ')'; ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y); ctx.stroke(); }
      }
      if (mouse) for (i = 0; i < nodes.length; i++) { var md = Math.hypot(nodes[i].x - mouse.x, nodes[i].y - mouse.y); if (md < 140) { ctx.strokeStyle = 'rgba(' + c + ',' + (.4 * (1 - md / 140)).toFixed(3) + ')'; ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke(); } }
      for (i = 0; i < nodes.length; i++) {
        var p = nodes[i]; ctx.fillStyle = 'rgba(' + c + ',' + ((dark ? .75 : .55) + p.b * .5).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r + p.b * 2.5, 0, 6.2832); ctx.fill();
        if (p.b > .05) { ctx.fillStyle = 'rgba(' + c + ',' + (p.b * .15).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(p.x, p.y, 10 * p.b + 3, 0, 6.2832); ctx.fill(); }
      }
      for (var k = 0; k < pulses.length; k++) {
        var u = pulses[k], e = u.t * u.t * (3 - 2 * u.t);
        for (var s = 0; s < 14; s++) {
          var tt = Math.max(0, e - s * .018), x = u.a.x + (u.b.x - u.a.x) * tt, y = u.a.y + (u.b.y - u.a.y) * tt;
          ctx.fillStyle = 'rgba(' + c + ',' + ((1 - s / 14) * (dark ? .9 : .6)).toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(x, y, 2.2 * (1 - s / 20), 0, 6.2832); ctx.fill();
        }
      }
    }
    function frame(t) {
      raf = 0; if (!vis) return;
      var dt = Math.min(40, t - (t0 || t)); t0 = t;
      step(dt); if (Math.random() < dt / 700) spawn(); draw();
      raf = requestAnimationFrame(frame);
    }
    function start() { if (reduce || raf || !vis) return; t0 = 0; raf = requestAnimationFrame(frame); }

    theme(); size(); for (var i = 0; i < 40; i++) step(16);
    new IntersectionObserver(function (es) { vis = es[0].isIntersecting; if (vis) { draw(); start(); } }).observe(host);
    addEventListener('resize', function () { size(); draw(); });
    host.addEventListener('pointermove', function (e) { var r = host.getBoundingClientRect(), x = e.clientX - r.left + (r.left), y = e.clientY - r.top; mouse = { x: local ? e.clientX - r.left : e.clientX, y: y }; });
    host.addEventListener('pointerleave', function () { mouse = null; });
    new MutationObserver(function () { theme(); draw(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { theme(); draw(); });
    draw(); start();
  }
  hosts.forEach(Net);
})();
