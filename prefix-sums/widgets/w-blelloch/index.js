/* w-blelloch: step through Blelloch's work-efficient exclusive scan on [3 1 7 0 4 1 6 3].
   7 stages: up 1-3 (strides 1, 2, 4), clear (save the total, root <- 0), down 1-3 (strides 4, 2, 1).
   Every row is computed by running the algorithm below, not typed in.
   The last stage is gated on check k-05 (moved into this frame; assets/checks.js still runs it).
   Colours (manifest colour language): active pair --c4, dimmed context opacity .35,
   result --c3, saved total = dashed --c1 border. */
Didactician.widget('w-blelloch', function (el, ctx) {
  'use strict';
  var D = window.Didactician;
  var NS = 'http://www.w3.org/2000/svg';
  var INPUT = [3, 1, 7, 0, 4, 1, 6, 3];
  var N = INPUT.length;
  var CHECK = 'k-05';

  /* ---- model: run the algorithm and record each stage ---------------------------------- */
  var stages = [{ key: 'input', name: 'input', rows: INPUT.slice(), pairs: [], adds: 0, phase: 'input' }];
  var a = INPUT.slice(), s, k, total, lvl = 0;
  for (s = 1; s < N; s *= 2) {
    lvl++;
    var pu = [];
    for (k = 0; k < N; k += 2 * s) {
      var L = k + s - 1, R = k + 2 * s - 1;
      pu.push({ L: L, R: R, l: a[L], r: a[R], out: a[L] + a[R] });
      a[R] = a[L] + a[R];
    }
    stages.push({ phase: 'up', name: 'up ' + lvl, stride: s, rows: a.slice(), pairs: pu, adds: pu.length });
  }
  total = a[N - 1];
  a[N - 1] = 0;
  stages.push({ phase: 'clear', name: 'clear', rows: a.slice(), pairs: [], adds: 0, total: total });
  lvl = 0;
  for (s = N / 2; s >= 1; s /= 2) {
    lvl++;
    var pd = [];
    for (k = 0; k < N; k += 2 * s) {
      var L2 = k + s - 1, R2 = k + 2 * s - 1, t = a[L2], parent = a[R2];
      a[L2] = parent;
      a[R2] = parent + t;
      pd.push({ L: L2, R: R2, parent: parent, oldL: t, outL: a[L2], outR: a[R2] });
    }
    stages.push({ phase: 'down', name: 'down ' + lvl, stride: s, rows: a.slice(), pairs: pd, adds: pd.length });
  }
  var LAST = stages.length - 1; // 7

  // Self-check the model against the brute-force definition of an exclusive scan.
  var ex = [0];
  for (k = 1; k < N; k++) ex.push(ex[k - 1] + INPUT[k - 1]);
  if (stages[LAST].rows.join() !== ex.join() || total !== ex[N - 1] + INPUT[N - 1]) {
    throw new Error('w-blelloch: scan model does not match the exclusive prefix sum');
  }

  function addsUpTo(st, phase) {
    var n = 0;
    for (var i = 1; i <= st; i++) if (!phase || stages[i].phase === phase) n += stages[i].adds;
    return n;
  }
  function levelsUpTo(st) {
    var n = 0;
    for (var i = 1; i <= st; i++) if (stages[i].phase === 'up' || stages[i].phase === 'down') n++;
    return n;
  }
  function ruleLines(sg, narrow) {
    if (sg.phase === 'down' && narrow) return ['L ← R (the parent, P);', 'R ← P + old L'];
    if (sg.phase === 'up') return ['R ← L + R'];
    if (sg.phase === 'clear') return ['save ' + sg.total + ' (the total),', 'root ← 0'];
    if (sg.phase === 'down') return ['L ← R (the parent);', 'R ← parent + old L'];
    return [];
  }
  function stageTitle(sg) { return sg.stride ? sg.name + ' · stride ' + sg.stride : sg.name; }

  function explain(st) {
    var sg = stages[st];
    if (sg.phase === 'input') return 'The input. Step to start the up-sweep: pairs 1 apart.';
    if (sg.phase === 'up') {
      var ups = sg.pairs.map(function (p) { return p.l + ' + ' + p.r + ' = ' + p.out; }).join(', ');
      var tail = st === 3 ? ': the total of the whole array.' : '.';
      return 'Up ' + sg.name.slice(3) + ' (stride ' + sg.stride + '): each pair’s right cell becomes L + R: ' + ups + tail +
        ' ' + sg.adds + (sg.adds === 1 ? ' add.' : ' adds.');
    }
    if (sg.phase === 'clear') {
      return 'Clear: save ' + sg.total + ' (the total of everything), then set the root to 0, because nothing comes before the whole array.';
    }
    var downs = sg.pairs.map(function (p) {
      return '(' + p.L + ', ' + p.R + '): parent ' + p.parent + ' (in R’s slot), L ← ' + p.parent + ', R ← ' + p.parent + ' + ' + p.oldL + ' = ' + p.outR;
    }).join('; ');
    var msg = 'Down ' + sg.name.slice(5) + ' (stride ' + sg.stride + '): ' + downs + '. ' + sg.adds + (sg.adds === 1 ? ' add.' : ' adds.');
    if (st === LAST) msg += ' Every cell now holds the sum of everything before it: the exclusive scan, prefix[0..7]. The saved ' + total + ' is prefix[8].';
    return msg;
  }

  function tally(st) {
    if (st === LAST) {
      return levelsUpTo(st) + ' levels · ' + addsUpTo(st) + ' adds = ' + addsUpTo(st, 'up') + ' up + ' + addsUpTo(st, 'down') +
        ' down (Hillis-Steele: 17 adds in 3 steps; sequential loop: ' + (N - 1) + ' adds)';
    }
    var up = addsUpTo(st, 'up'), dn = addsUpTo(st, 'down');
    if (st <= 4) return 'adds so far: ' + up + (st >= 1 ? ' (up)' : '');
    return 'adds so far: ' + up + ' (up) + ' + dn + ' (down) = ' + (up + dn);
  }

  /* ---- DOM ------------------------------------------------------------------------------- */
  el.innerHTML =
    '<div class="wb-frame">' +
    '  <div class="wb-canvas"><svg class="wb-svg" role="img" aria-label="Blelloch scan rows"></svg></div>' +
    '  <div class="wb-controls">' +
    '    <button type="button" class="d-btn wb-back">‹ Back</button>' +
    '    <button type="button" class="d-btn primary wb-step">Step ›</button>' +
    '    <button type="button" class="d-btn wb-reset">Reset</button>' +
    '    <span class="wb-counter"></span>' +
    '  </div>' +
    '  <div class="wb-info">' +
    '    <p class="wb-tally" aria-hidden="true"></p>' +
    '    <p class="wb-explain" aria-hidden="true"></p>' +
    '    <p class="wb-live wb-sr" aria-live="polite"></p>' +
    '  </div>' +
    '  <p class="wb-lock" hidden>The last step is locked: predict it below first.</p>' +
    '  <div class="wb-checkslot" hidden></div>' +
    '</div>';
  var $ = function (q) { return el.querySelector(q); };
  var svg = $('.wb-svg'), btnBack = $('.wb-back'), btnStep = $('.wb-step'), btnReset = $('.wb-reset');
  var counter = $('.wb-counter'), tallyEl = $('.wb-tally'), explainEl = $('.wb-explain'), liveEl = $('.wb-live'), frame = $('.wb-frame');
  var lockEl = $('.wb-lock'), slot = $('.wb-checkslot');

  // Adopt the page's k-05 card into the frame (checks.js keeps working wherever it lives).
  var card = document.querySelector('.d-check[data-check="' + CHECK + '"][data-check-host="w-blelloch"]');
  if (card) slot.appendChild(card);

  function committed() { return !!(D.checks && D.checks[CHECK]); }

  var st = 0, prevSt = 0, W = 600;

  function mk(tag, attrs, parent, text) {
    var n = document.createElementNS(NS, tag);
    for (var key in attrs) n.setAttribute(key, attrs[key]);
    if (text != null) n.textContent = text;
    if (parent) parent.appendChild(n);
    return n;
  }

  function draw() {
    var narrow = W < 520;
    var labelW = narrow ? 0 : 150;
    var cw = Math.max(30, Math.min(54, Math.floor((W - labelW) / (N + 1))));
    var gap = 4, x0 = labelW + Math.max(0, Math.floor((W - labelW - cw * (N + 1)) / 2));
    if (!narrow) x0 = labelW;
    var labH = narrow ? 14 : 0, arcH = narrow ? 16 : 22, cellH = narrow ? 28 : 38, rowGap = narrow ? 2 : 4;
    var rowH = labH + arcH + cellH + rowGap;
    var headH = narrow ? 16 : 18, resH = 22;
    var H = headH + rowH * stages.length + resH;
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.textContent = '';
    var defs = mk('defs', {}, svg);
    var mid = 'wb-ah-' + Math.random().toString(36).slice(2, 7);
    var m = mk('marker', { id: mid, viewBox: '0 0 10 10', refX: '1', refY: '5', markerWidth: String(narrow ? 3 : 4), markerHeight: String(narrow ? 3 : 4),
      markerUnits: 'strokeWidth', orient: 'auto-start-reverse' }, defs);
    mk('path', { d: 'M0,0 L10,5 L0,10 z', class: 'wb-head' }, m);
    var HEAD = narrow ? 6 : 8; // marker length in px (3 or 4 x stroke 2)

    var cx = function (i) { return x0 + i * cw + cw / 2; };
    var fs = narrow ? 13 : 15;

    // index header
    var hg = mk('g', { class: 'wb-head-row', 'aria-hidden': 'true' }, svg);
    for (var i = 0; i < N; i++) mk('text', { x: cx(i), y: 13, class: 'wb-idx', 'text-anchor': 'middle' }, hg, String(i));

    for (var r = 0; r < stages.length; r++) {
      var sg = stages[r];
      var y0 = headH + r * rowH, yCell = y0 + labH + arcH;
      var shown = r <= st, active = r === st && r > 0, isFinal = r === LAST && st === LAST;
      var g = mk('g', { class: 'wb-row' + (shown ? '' : ' is-future') + (active || (r === 0 && st === 0) ? ' is-active' : (shown ? ' is-past' : '')) +
        (r === st && st !== prevSt && st > prevSt ? ' is-new' : '') }, svg);

      // phase label
      var title = stageTitle(sg), rules = active ? ruleLines(sg, narrow) : [];
      if (narrow) {
        var lt = mk('text', { x: x0, y: y0 + 11, class: 'wb-lab' + (active ? ' is-on' : '') }, g,
          title + (rules.length ? ' — ' + rules.join(' ') : ''));
        // Keep the label inside the frame: drop the stride, then tighten the type.
        var room = W - x0;
        if (rules.length && lt.getComputedTextLength && lt.getComputedTextLength() > room) {
          lt.textContent = sg.name + ' — ' + rules.join(' ');
          if (lt.getComputedTextLength() > room) lt.style.fontSize = '12px';
        }
      } else {
        mk('text', { x: 0, y: y0 + labH + arcH + 4, class: 'wb-lab' + (active ? ' is-on' : '') }, g, title);
        rules.forEach(function (line, li) {
          mk('text', { x: 0, y: y0 + labH + arcH + 22 + li * 16, class: 'wb-rule' }, g, line);
        });
      }

      // cells
      var touched = {}, written = {}, roles = {};
      sg.pairs.forEach(function (p) {
        touched[p.L] = touched[p.R] = true;
        roles[p.L] = 'L'; roles[p.R] = 'R';
        written[p.R] = true;
        if (sg.phase === 'down') written[p.L] = true;
      });
      if (sg.phase === 'clear') { touched[N - 1] = written[N - 1] = true; }
      // The row just above a down-sweep stage is the one it reads: its R slot holds the parent.
      var src = {}, nx = stages[st];
      if (r === st - 1 && nx.phase === 'down') {
        nx.pairs.forEach(function (p) { src[p.L] = narrow ? '' : 'old L'; src[p.R] = narrow ? 'P' : 'parent'; });
      }
      for (i = 0; i < N; i++) {
        var cls = 'wb-cell';
        if (!shown) cls += ' is-ghost';
        else if (active) cls += written[i] ? ' is-write' : (touched[i] ? ' is-read' : ' is-dim');
        if (isFinal) cls += ' is-result';
        if (i in src) cls += ' is-src';
        var cg = mk('g', { class: cls }, g);
        mk('rect', { x: x0 + i * cw + gap / 2, y: yCell, width: cw - gap, height: cellH, rx: 4 }, cg);
        if (shown) {
          var tag = active && roles[i] ? roles[i] : (src[i] || '');
          mk('text', { x: cx(i), y: yCell + cellH / 2 + (tag ? (narrow ? 8 : 7) : 5), 'text-anchor': 'middle', class: 'wb-val', 'font-size': fs }, cg, String(sg.rows[i]));
          if (tag) mk('text', { x: x0 + i * cw + gap / 2 + 3, y: yCell + 10, class: 'wb-role' + (src[i] ? ' wb-srctag' : '') }, cg, tag);
        }
      }

      // arcs over pairs (stay on past rows, dimmed, so the strides read as a tree)
      if (shown && sg.pairs.length) {
        var ag = mk('g', { class: 'wb-arcs', 'aria-hidden': 'true' }, g);
        sg.pairs.forEach(function (p) {
          var yEnd = yCell - 1 - HEAD, yTop = y0 + labH + 2;
          var xa = cx(p.L), xb = cx(p.R);
          var d = 'M' + xa + ',' + yEnd + ' C' + xa + ',' + yTop + ' ' + xb + ',' + yTop + ' ' + xb + ',' + yEnd;
          var attrs = { d: d, class: 'wb-arc', 'marker-end': 'url(#' + mid + ')' };
          if (sg.phase === 'down') attrs['marker-start'] = 'url(#' + mid + ')';
          mk('path', attrs, ag);
        });
      }

      // saved total: shown on the clear row and, at the end, as prefix[8]
      if (shown && (sg.phase === 'clear' || isFinal)) {
        var sx = x0 + N * cw + gap / 2;
        var sgp = mk('g', { class: 'wb-saved' + (active ? '' : ' is-past-saved') }, g);
        mk('rect', { x: sx, y: yCell, width: cw - gap, height: cellH, rx: 4 }, sgp);
        mk('text', { x: sx + (cw - gap) / 2, y: yCell + cellH / 2 + 5, 'text-anchor': 'middle', class: 'wb-val', 'font-size': fs }, sgp, String(total));
        mk('text', { x: sx + (cw - gap) / 2, y: yCell - 4, 'text-anchor': 'middle', class: 'wb-savedlab' }, sgp, isFinal ? 'p[8]' : 'saved');
      }
    }

    // result line under the final row
    if (st === LAST) {
      var yr = headH + rowH * stages.length + 12;
      var rg = mk('g', { class: 'wb-resline is-new' }, svg);
      mk('text', { x: x0 + gap / 2, y: yr, class: 'wb-res' }, rg, '↑ exclusive scan = prefix[0..7]');
      mk('text', { x: x0 + (N + 1) * cw - gap / 2, y: yr, 'text-anchor': 'end', class: 'wb-res' }, rg, total + ' = prefix[8]');
    }
  }

  function render() {
    var locked = st === LAST - 1 && !committed();
    btnBack.disabled = st === 0;
    btnStep.disabled = st === LAST || locked;
    btnStep.textContent = st === LAST - 1 && !locked ? 'Show last step ›' : 'Step ›';
    counter.textContent = 'Stage ' + st + ' of ' + LAST + (st ? ' · ' + stages[st].name : ' · input');
    tallyEl.textContent = tally(st);
    explainEl.textContent = explain(st);
    liveEl.textContent = 'Stage ' + st + ' of ' + LAST + '. ' + explain(st) +
      (locked ? ' The last step is locked: predict it below.' : '') + ' ' + (st === LAST ? '' : tally(st) + '.');
    lockEl.hidden = !locked;
    slot.hidden = !(st >= LAST - 1 || committed());
    draw();
    prevSt = st;
  }

  function go(n) { st = Math.max(0, Math.min(LAST, n)); render(); }
  btnBack.addEventListener('click', function () { go(st - 1); });
  btnStep.addEventListener('click', function () {
    if (st === LAST - 1 && !committed()) return;
    go(st + 1);
  });
  btnReset.addEventListener('click', function () { go(0); });
  document.addEventListener('didactician:check', function (e) {
    if (e.detail && e.detail.id === CHECK) render();
  });

  ctx.onResize(function (w) {
    var c = $('.wb-canvas');
    W = Math.max(280, c.clientWidth || w);
    frame.classList.toggle('is-narrow', W < 520);
    prevSt = st; // no entry animation on relayout
    draw();
  });
  render();
});
