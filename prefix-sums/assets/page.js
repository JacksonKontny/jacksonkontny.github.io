/* Page figures: f-build (built cell by cell, with replay) and f-simd (two static panels). */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var D = window.Didactician || {};
  var fmt = function (v) { return v < 0 ? '−' + Math.abs(v) : String(v); };
  var paren = function (v) { return v < 0 ? '(' + fmt(v) + ')' : fmt(v); };

  function el(tag, attrs, parent, text) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }

  /* ---------------- f-build ---------------- */
  function bld() {
    var fig = document.getElementById('f-build');
    if (!fig) return;
    var svg = fig.querySelector('svg');
    var live = document.getElementById('f-build-live');
    var vals = [5, 2, 8, 1, 6];
    var pre = [0];
    vals.forEach(function (v) { pre.push(pre[pre.length - 1] + v); });
    var X0 = 40, W = 56;
    var gVals = svg.querySelector('.bld-vals'), gTicks = svg.querySelector('.bld-ticks'), gPre = svg.querySelector('.bld-pre');
    var valG = [], preG = [];
    vals.forEach(function (v, k) {
      var x = X0 + W * k;
      var g = el('g', {}, gVals);
      el('text', { x: x + W / 2, y: 54, 'text-anchor': 'middle', class: 'bld-lab' }, g, 'a[' + k + ']');
      el('rect', { x: x + 2, y: 62, width: W - 4, height: 40, rx: 4, class: 'bld-cell' }, g);
      el('text', { x: x + W / 2, y: 87, 'text-anchor': 'middle', class: 'bld-val' }, g, fmt(v));
      valG.push(g);
    });
    pre.forEach(function (v, k) {
      var cx = X0 + W * k;
      el('line', { x1: cx, y1: 106, x2: cx, y2: 122, class: 'bld-tick' }, gTicks);
      var g = el('g', {}, gPre);
      el('rect', { x: cx - 24, y: 124, width: 48, height: 40, rx: 4, class: 'bld-cell' }, g);
      el('text', { x: cx, y: 149, 'text-anchor': 'middle', class: 'bld-val' }, g, fmt(v));
      el('text', { x: cx, y: 184, 'text-anchor': 'middle', class: 'bld-lab' }, g, 'p[' + k + ']');
      preG.push(g);
    });
    var gArrows = el('g', { class: 'bld-arrows' }, svg);
    var box = { x: 104, y: 216, width: 152, height: 36 };
    if (D.arrow) {
      D.arrow(svg, { x: X0 + W * 1, y: 192 }, box, { color: 'var(--c2)', parent: gArrows });
      D.arrow(svg, { x: X0 + W * 4, y: 192 }, box, { color: 'var(--c1)', parent: gArrows });
    }
    var bracket = svg.querySelector('.bld-bracket'), result = svg.querySelector('.bld-result');
    var finalText = 'sum(1..3): p[4] − p[1] = 16 − 5 = 11, the same as 2 + 8 + 1.';

    function clear() {
      valG.concat(preG).forEach(function (g) { g.classList.remove('is-adding', 'is-c1', 'is-c2', 'is-range'); });
    }
    function show(step) { // step 0..5 = prefix cells visible up to step; 6 = final
      clear();
      preG.forEach(function (g, k) { g.classList.toggle('is-hidden', k > Math.min(step, 5)); });
      var fin = step >= 6;
      [bracket, result, gArrows].forEach(function (g) { g.classList.toggle('is-hidden', !fin); });
      if (fin) {
        preG[4].classList.add('is-c1'); preG[1].classList.add('is-c2');
        [1, 2, 3].forEach(function (k) { valG[k].classList.add('is-range'); });
        live.textContent = finalText;
      } else if (step === 0) {
        live.textContent = 'p[0] = 0: nothing comes before a[0].';
      } else {
        valG[step - 1].classList.add('is-adding');
        preG[step - 1].classList.add('is-adding');
        preG[step].classList.add('is-adding');
        live.textContent = 'p[' + step + '] = p[' + (step - 1) + '] + a[' + (step - 1) + '] = ' + fmt(pre[step - 1]) + ' + ' + paren(vals[step - 1]) + ' = ' + fmt(pre[step]);
      }
    }

    var timer = null;
    function run() {
      clearTimeout(timer);
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) { show(6); return; }
      var s = 0;
      show(0);
      (function next() {
        timer = setTimeout(function () { s++; show(s); if (s < 6) next(); }, s === 0 ? 700 : 1000);
      })();
    }
    show(6); // static end state until it scrolls into view
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { io.disconnect(); run(); }
      }, { threshold: 0.5 });
      io.observe(svg);
    }
    if (D.onReplay) D.onReplay(fig, run);
  }

  /* ---------------- f-simd ---------------- */
  function simd() {
    var L = document.getElementById('f-simd-left'), R = document.getElementById('f-simd-right');
    if (!L || !R) return;
    var a = [3, 1, 7, 0, 4, 1, 6, 3], b = [2, 5, 1, 3, 0, 2, 4, 1];
    var X0 = 26, CW = 36;
    var cx = function (k) { return X0 + CW * k + CW / 2; };
    [L, R].forEach(function (s) { s.classList.add('pg-simd'); });

    function row(svg, vals, y, h, cls, label) {
      vals.forEach(function (v, k) {
        el('rect', { x: X0 + CW * k + 2, y: y, width: CW - 4, height: h, rx: 3, class: cls || 'cell' }, svg);
        el('text', { x: cx(k), y: y + h / 2 + 5, 'text-anchor': 'middle', class: 'val' }, svg, String(v));
      });
      if (label) el('text', { x: 12, y: y + h / 2 + 5, 'text-anchor': 'middle', class: 'lab' }, svg, label);
    }

    // left: a + b, one instruction
    row(L, a, 16, 32, 'cell', 'a');
    row(L, b, 56, 32, 'cell', 'b');
    a.forEach(function (_, k) {
      el('line', { x1: cx(k), y1: 90, x2: cx(k), y2: 114, class: 'wire' }, L);
      el('line', { x1: cx(k), y1: 158, x2: cx(k), y2: 182, class: 'wire' }, L);
    });
    el('rect', { x: X0 + 2, y: 116, width: CW * 8 - 4, height: 40, rx: 6, class: 'op' }, L);
    el('text', { x: X0 + CW * 4, y: 141, 'text-anchor': 'middle', class: 'op-text' }, L, 'vaddps: 1 instruction');
    row(L, a.map(function (v, k) { return v + b[k]; }), 184, 32, 'sum', 'c');
    el('text', { x: X0 + CW * 4, y: 262, 'text-anchor': 'middle', class: 'note' }, L, '8 adds in 1 step');

    // right: the running sum as a dependent chain
    row(R, a, 16, 32, 'cell', 'a');
    var s = [], acc = 0;
    a.forEach(function (v) { acc += v; s.push(acc); });
    var boxes = [];
    s.forEach(function (v, k) {
      var x = X0 + CW * k + 2, y = 66 + 26 * k;
      el('line', { x1: cx(k), y1: 50, x2: cx(k), y2: y - 2, class: 'wire', 'stroke-dasharray': '2 3' }, R);
      var r = el('rect', { x: x, y: y, width: CW - 4, height: 20, rx: 3, class: 'sum' }, R);
      el('text', { x: cx(k), y: y + 15, 'text-anchor': 'middle', class: 'val' }, R, String(v));
      boxes.push({ x: x, y: y, width: CW - 4, height: 20 });
      if (k > 0) el('text', { x: x + CW - 1, y: y + 15, class: 'step-lab' }, R, '+' + a[k]);
    });
    el('text', { x: 12, y: 66 + 15, 'text-anchor': 'middle', class: 'lab' }, R, 's');
    if (D.arrow) {
      for (var k = 1; k < 8; k++) {
        var p = boxes[k - 1];
        D.arrow(R, { x: p.x + p.width / 2, y: p.y + p.height }, boxes[k], { color: 'var(--c4)', width: 1.5, head: 4, gap: 2, curve: -0.25 });
      }
    }
    var nt = el('text', { x: 322, y: 92, 'text-anchor': 'end', class: 'note' }, R);
    el('tspan', { x: 322, dy: 0 }, nt, '7 steps;');
    el('tspan', { x: 322, dy: 18 }, nt, 'step k needs');
    el('tspan', { x: 322, dy: 18 }, nt, 'step k−1');
  }

  function init() { bld(); simd(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
