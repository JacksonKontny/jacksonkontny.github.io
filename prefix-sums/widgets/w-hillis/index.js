/* w-hillis: step through the Hillis-Steele inclusive scan on [3 1 7 0 4 1 6 3].
   Model (computed, not canned): x_d[k] = x_{d-1}[k] + x_{d-1}[k - off] if k >= off, else x_{d-1}[k],
   off = 2^(d-1), d = 1..3. Each step reads row d-1 and writes a fresh row d (two buffers).
   Colours (page colour language): neutral input cells; cells being added + their arrows --c4;
   final result --c3; unchanged context dimmed. */
Didactician.widget('w-hillis', function (el, ctx) {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var X0 = [3, 1, 7, 0, 4, 1, 6, 3];
  var N = X0.length;
  var STEPS = Math.log2(N); // 3

  // ---- model ---------------------------------------------------------------------------------
  var rows = [X0.slice()], adds = [0];
  for (var d = 1; d <= STEPS; d++) {
    var off = 1 << (d - 1), prev = rows[d - 1], next = [], n = 0;
    for (var k = 0; k < N; k++) {
      if (k >= off) { next.push(prev[k] + prev[k - off]); n++; } else next.push(prev[k]);
    }
    rows.push(next); adds.push(n);
  }
  // sanity check against the verified trace (x-01, c-08, c-09)
  var EXPECT = [[3, 4, 8, 7, 4, 5, 7, 9], [3, 4, 11, 11, 12, 12, 11, 14], [3, 4, 11, 11, 15, 16, 22, 25]];
  EXPECT.forEach(function (r, i) { if (r.join() !== rows[i + 1].join()) console.error('w-hillis: row mismatch', i + 1, rows[i + 1]); });
  if (adds.join() !== '0,7,6,4') console.error('w-hillis: add counts mismatch', adds);
  var SEQ = N - 1;
  function addsSoFar(s) { var t = 0; for (var i = 1; i <= s; i++) t += adds[i]; return t; }

  // ---- DOM -----------------------------------------------------------------------------------
  el.innerHTML =
    '<div class="wh-frame">' +
    '  <svg class="wh-svg" role="img" aria-label="Rows of the Hillis-Steele scan; see the live description below the controls."></svg>' +
    '  <div class="wh-controls">' +
    '    <div class="wh-btns">' +
    '      <button type="button" class="wh-btn wh-back" aria-label="Back one step">‹ Back</button>' +
    '      <button type="button" class="wh-btn wh-step wh-primary" aria-label="Next step">Step ›</button>' +
    '      <button type="button" class="wh-btn wh-reset">Reset</button>' +
    '    </div>' +
    '    <span class="wh-count"></span>' +
    '  </div>' +
    '  <p class="wh-tally"></p>' +
    '  <p class="wh-live" aria-live="polite"></p>' +
    '</div>';
  var $ = function (s) { return el.querySelector(s); };
  var svg = $('.wh-svg'), btnBack = $('.wh-back'), btnStep = $('.wh-step'), btnReset = $('.wh-reset');
  var state = { step: 0, width: 600, animate: false };

  function mk(tag, attrs, parent, text) {
    var e = document.createElementNS(NS, tag);
    for (var a in attrs) e.setAttribute(a, attrs[a]);
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }

  // ---- drawing -------------------------------------------------------------------------------
  function geom(W) {
    var narrow = W < 520;
    var labW = narrow ? 64 : 150, gapX = narrow ? 8 : 16;
    var cw = Math.max(26, Math.min(56, Math.floor((W - labW - gapX) / N)));
    var content = cw * N + gapX + labW;
    var x0 = Math.max(0, Math.floor((W - content) / 2));
    var g = {
      narrow: narrow, cw: cw, x0: x0, labX: x0 + cw * N + gapX, labW: labW,
      rowH: narrow ? 34 : 40, gapY: narrow ? 46 : 48, top: 34, idxH: 16, bottom: 26
    };
    g.H = g.top + 4 * g.rowH + 3 * g.gapY + g.bottom;
    g.rowY = function (r) { return g.top + r * (g.rowH + g.gapY); };
    g.cx = function (k) { return x0 + k * cw + cw / 2; };
    return g;
  }

  function render() {
    var W = state.width, g = geom(W), s = state.step, anim = state.animate && !ctx.reducedMotion;
    state.animate = false;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + g.H);
    svg.setAttribute('width', W);
    svg.setAttribute('height', g.H);
    svg.textContent = '';
    svg.classList.toggle('is-narrow', g.narrow);
    $('.wh-frame').classList.toggle('is-narrow', g.narrow);

    var defs = mk('defs', {}, svg);
    [['wh-ah', 'wh-head'], ['wh-ah-dim', 'wh-head-dim']].forEach(function (m) {
      var mark = mk('marker', { id: m[0], viewBox: '0 0 10 10', refX: '1', refY: '5', markerWidth: '5', markerHeight: '5',
        markerUnits: 'strokeWidth', orient: 'auto-start-reverse' }, defs);
      mk('path', { d: 'M0,0 L10,5 L0,10 z', 'class': m[1] }, mark);
    });

    // caption tag + index labels
    mk('text', { x: g.x0, y: 14, 'class': 'wh-tag' }, svg, g.narrow ? 'read row → write row (two buffers)' : 'each step: read row → write row (two buffers)');
    for (var k = 0; k < N; k++) mk('text', { x: g.cx(k), y: g.top - 6, 'class': 'wh-idx', 'text-anchor': 'middle' }, svg, k);

    // arrows first (under cells)
    for (var r = 1; r <= STEPS; r++) {
      if (r > s) break;
      var active = r === s, off = 1 << (r - 1);
      var ga = mk('g', { 'class': 'wh-arrows' + (active ? ' is-active' : ' is-dim') + (active && anim ? ' is-anim' : '') }, svg);
      var yS = g.rowY(r - 1) + g.rowH + 2, yT = g.rowY(r) - 3;
      var trim = 9; // 0.9 × markerWidth(5) × stroke(2): head base sits at the line end
      var dx = Math.min(7, g.cw * 0.22);
      for (k = 0; k < N; k++) {
        if (k < off) {
          mk('line', { x1: g.cx(k), y1: yS, x2: g.cx(k), y2: yT + 1, 'class': 'wh-copy' }, ga);
          continue;
        }
        // vertical: x_{d-1}[k] → x_d[k]
        mk('line', { x1: g.cx(k) + dx, y1: yS, x2: g.cx(k) + dx, y2: yT - trim, 'class': 'wh-arr',
          'marker-end': active ? 'url(#wh-ah)' : 'url(#wh-ah-dim)' }, ga);
        // diagonal: x_{d-1}[k-off] → x_d[k]
        var sx = g.cx(k - off) - dx * 0.4, tx = g.cx(k) - dx, ty = yT;
        var vx = tx - sx, vy = ty - yS, len = Math.sqrt(vx * vx + vy * vy);
        mk('line', { x1: sx, y1: yS, x2: tx - vx / len * trim, y2: ty - vy / len * trim, 'class': 'wh-arr',
          'marker-end': active ? 'url(#wh-ah)' : 'url(#wh-ah-dim)' }, ga);
      }
      if (active) {
        // read/write tag beside the active gap, in the label column
        mk('text', { x: g.labX, y: yS + 13, 'class': 'wh-rw' }, svg, 'read ↑');
        mk('text', { x: g.labX, y: yT - 5, 'class': 'wh-rw' }, svg, 'write ↓');
      }
    }

    // rows
    for (r = 0; r <= STEPS; r++) {
      var y = g.rowY(r);
      var ghost = r > s;
      var cls = 'wh-row';
      if (ghost) cls += ' is-ghost';
      else if (r === s && r > 0) cls += ' is-active';
      else if (r === s - 1 || r === s) cls += ' is-read';
      else cls += ' is-dim';
      if (r === s && r === STEPS) cls += ' is-final';
      if (r === s && r > 0 && anim) cls += ' is-anim';
      var gr = mk('g', { 'class': cls }, svg);
      var offR = 1 << (r - 1);
      for (k = 0; k < N; k++) {
        var changed = r > 0 && k >= offR;
        var cc = 'wh-cell' + (r === 0 ? '' : changed ? ' is-changed' : ' is-copied');
        mk('rect', { x: g.x0 + k * g.cw + 2, y: y, width: g.cw - 4, height: g.rowH, rx: 4, 'class': cc }, gr);
        if (!ghost) mk('text', { x: g.cx(k), y: y + g.rowH / 2, 'class': 'wh-num' + (changed ? ' is-changed' : r > 0 ? ' is-copied' : ''),
          'text-anchor': 'middle', 'dominant-baseline': 'central' }, gr, rows[r][k]);
      }
      // label beside the row
      var lg = mk('g', { 'class': 'wh-lab' + (ghost ? ' is-ghost' : r === s && r > 0 ? ' is-active' : '') }, svg);
      var ly = y + g.rowH / 2;
      if (r === 0) {
        mk('text', { x: g.labX, y: ly, 'dominant-baseline': 'central', 'class': 'wh-l1' }, lg, 'input');
      } else if (g.narrow) {
        mk('text', { x: g.labX, y: ly - 8, 'dominant-baseline': 'central', 'class': 'wh-l1' }, lg, 'offset ' + offR);
        mk('text', { x: g.labX, y: ly + 9, 'dominant-baseline': 'central', 'class': 'wh-l2' }, lg, adds[r] + ' adds');
      } else {
        mk('text', { x: g.labX, y: ly - 8, 'dominant-baseline': 'central', 'class': 'wh-l1' }, lg, 'step ' + r + ' · offset ' + offR);
        mk('text', { x: g.labX, y: ly + 9, 'dominant-baseline': 'central', 'class': 'wh-l2' }, lg, adds[r] + ' adds');
      }
    }

    if (s === STEPS) {
      var by = g.rowY(STEPS) + g.rowH + 5, bx0 = g.x0 + 2, bx1 = g.x0 + g.cw * N - 2;
      mk('path', { d: 'M' + bx0 + ',' + (by - 3) + ' V' + by + ' H' + bx1 + ' V' + (by - 3), 'class': 'wh-bracket' }, svg);
      mk('text', { x: g.x0 + (g.cw * N) / 2, y: by + 15, 'text-anchor': 'middle', 'class': 'wh-final' }, svg,
        'inclusive scan = prefix[1..8]');
    }

    // controls + text
    btnBack.disabled = s === 0;
    btnStep.disabled = s === STEPS;
    btnReset.disabled = s === 0;
    $('.wh-count').textContent = 'Step ' + s + ' of ' + STEPS;
    var so = addsSoFar(s);
    $('.wh-tally').innerHTML = s === STEPS
      ? '<b class="wh-nw">' + STEPS + ' steps · ' + so + ' adds</b> <span class="wh-muted wh-nw">(sequential loop: ' + SEQ + ')</span>'
      : '<span class="wh-nw">adds so far: <b>' + so + '</b></span> <span class="wh-muted wh-nw">· sequential loop: ' + SEQ + '</span>';
    var live;
    if (s === 0) live = 'Step 0 of ' + STEPS + ': the input, ' + X0.join(' ') + '. No adds yet.';
    else {
      var o = 1 << (s - 1);
      live = 'Step ' + s + ' of ' + STEPS + ': each cell adds the value ' + o + (o === 1 ? ' place' : ' places') + ' left. ' +
        adds[s] + ' adds; ' + so + ' so far. New row: ' + rows[s].join(' ') + '.';
      if (s === STEPS) live += ' This is the inclusive scan, prefix[1..8]: ' + STEPS + ' steps, ' + so + ' adds; the sequential loop needs ' + SEQ + '.';
    }
    $('.wh-live').textContent = live;
  }

  function go(s, animate) {
    state.step = Math.max(0, Math.min(STEPS, s));
    state.animate = !!animate;
    render();
  }
  btnStep.addEventListener('click', function () { go(state.step + 1, true); });
  btnBack.addEventListener('click', function () { go(state.step - 1, false); if (btnBack.disabled) btnStep.focus(); });
  btnReset.addEventListener('click', function () { go(0, false); btnStep.focus(); });
  // keep focus on a usable button when the one just pressed becomes disabled
  btnStep.addEventListener('click', function () { if (btnStep.disabled) btnBack.focus(); });

  ctx.onResize(function () {
    var frame = $('.wh-frame'), cs = getComputedStyle(frame);
    state.width = Math.max(260, Math.floor(frame.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)));
    render();
  });
});
