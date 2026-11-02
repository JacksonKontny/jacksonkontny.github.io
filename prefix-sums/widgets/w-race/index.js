/* w-race: rounds of adds for the plain loop, Hillis-Steele and Blelloch, given n elements and p lanes.
   A work ÷ lanes lower bound per step, not a benchmark. Locked until k-06 is committed. */
Didactician.widget('w-race', function (el, ctx) {
  'use strict';
  var D = window.Didactician;
  var NS = [8, 32, 1024, 1048576];
  var PS = [1, 8, 32, 1024, 0]; // 0 = unlimited (p = n)
  var nLabel = { 8: '8', 32: '32', 1024: '1,024', 1048576: '1,048,576' };
  var pLabel = { 1: '1', 8: '8 (AVX2)', 32: '32 (warp)', 1024: '1,024', 0: 'unlimited' };
  var st = { n: 1048576, p: 8 };
  var f = function (x) { return x.toLocaleString('en-US'); };

  function counts(n, pIn) {
    var p = pIn || n, L = Math.round(Math.log2(n)), hs = 0, bl = 0, hsAdds = 0;
    for (var d = 1; d <= L; d++) {
      var adds = n - Math.pow(2, d - 1);
      hsAdds += adds; hs += Math.ceil(adds / p);
      bl += 2 * Math.ceil((n / Math.pow(2, d)) / p);
    }
    return [
      { key: 'seq', name: 'Plain loop', rounds: n - 1, adds: n - 1 },
      { key: 'hs', name: 'Hillis-Steele', rounds: hs, adds: hsAdds },
      { key: 'bl', name: 'Blelloch', rounds: bl, adds: 2 * (n - 1) }
    ];
  }

  function group(label, values, labels, key) {
    return '<div class="wx-group" role="group" aria-label="' + label + '"><span class="wx-glabel">' + label + '</span><div class="wx-btns">' +
      values.map(function (v) { return '<button type="button" class="wx-btn" data-' + key + '="' + v + '">' + labels[v] + '</button>'; }).join('') +
      '</div></div>';
  }

  el.innerHTML =
    '<div class="wx-frame">' +
    '<div class="wx-locked"><p>The race opens here once you have committed an answer to the ranking question above.</p></div>' +
    '<div class="wx-open" hidden>' +
    '<p class="wx-prompt">Find a setting where Hillis-Steele wins. What do those settings have in common?</p>' +
    '<div class="wx-bars"></div>' +
    '<p class="wx-verdict"></p><p class="wx-sr" aria-live="polite"></p>' +
    '<div class="wx-presets" role="group" aria-label="Presets"><span class="wx-glabel">Presets</span><div class="wx-btns">' +
    '<button type="button" class="wx-btn wx-preset" data-preset="avx">AVX2, a million floats</button>' +
    '<button type="button" class="wx-btn wx-preset" data-preset="warp">One warp scanning 32 values</button></div></div>' +
    group('Elements n', NS, nLabel, 'n') +
    group('Lanes p', PS, pLabel, 'p') +
    '<p class="wx-foot">Rounds = adds ÷ lanes, step by step: a step with 6 adds on 4 lanes takes 2 rounds. A work ÷ lanes model on a log scale, not a benchmark; it ignores memory traffic.</p>' +
    '</div></div>';

  var $ = function (s) { return el.querySelector(s); };
  var bars = $('.wx-bars');
  bars.innerHTML = ['seq', 'hs', 'bl'].map(function (k) {
    return '<div class="wx-row wx-' + k + '"><div class="wx-name"><span class="wx-n"></span><span class="wx-tag" hidden>fastest</span><span class="wx-adds"></span></div>' +
      '<div class="wx-track"><span class="wx-bar"></span><span class="wx-num"></span></div></div>';
  }).join('');

  var MAXLOG = 7; // scale: 1 … 10^7 rounds

  function render() {
    var n = st.n, p = st.p, eff = p || n;
    var rows = counts(n, p);
    var best = Math.min.apply(null, rows.map(function (r) { return r.rounds; }));
    rows.forEach(function (r) {
      var row = $('.wx-' + r.key);
      row.querySelector('.wx-n').textContent = r.name;
      row.querySelector('.wx-adds').textContent = f(r.adds) + ' adds';
      var w = Math.max(0.01, Math.log10(Math.max(1, r.rounds)) / MAXLOG);
      row.querySelector('.wx-bar').style.width = 'calc((100% - 9.5em) * ' + w.toFixed(4) + ')';
      row.querySelector('.wx-num').textContent = f(r.rounds) + (r.rounds === 1 ? ' round' : ' rounds');
      var win = r.rounds === best;
      row.classList.toggle('is-best', win);
      row.querySelector('.wx-tag').hidden = !win;
    });
    var winner = rows.filter(function (r) { return r.rounds === best; }).map(function (r) { return r.key; });
    var v;
    if (winner.indexOf('hs') >= 0) v = 'Lanes ≥ elements (' + f(eff) + ' lanes, ' + f(n) + ' values): Hillis-Steele wins on steps. Its extra adds land on lanes that would otherwise sit idle.';
    else if (winner.indexOf('bl') >= 0) v = (n / eff >= 4 ? 'Lanes ≪ elements' : 'Fewer lanes than elements') + ' (' + f(eff) + ' lanes, ' + f(n) + ' values): in this model, Blelloch wins. Hillis-Steele’s extra adds cost more rounds than its saved steps' + (rows[1].rounds > rows[0].rounds ? ', so it even loses to the plain loop.' : '.');
    else v = 'One lane: every add takes its own round, so the least work wins, and that is the plain loop.';
    $('.wx-verdict').textContent = v;
    el.querySelectorAll('[data-n]').forEach(function (b) { b.setAttribute('aria-pressed', String(+b.dataset.n === n)); });
    el.querySelectorAll('[data-p]').forEach(function (b) { b.setAttribute('aria-pressed', String(+b.dataset.p === p)); });
    el.querySelectorAll('[data-preset]').forEach(function (b) {
      var on = (b.dataset.preset === 'avx' && n === 1048576 && p === 8) || (b.dataset.preset === 'warp' && n === 32 && (p === 32 || (p === 0)));
      b.setAttribute('aria-pressed', String(on));
    });
    $('.wx-sr').textContent = f(n) + ' values, ' + (p ? f(p) : 'unlimited') + ' lanes. ' + rows.map(function (r) { return r.name + ': ' + f(r.rounds) + ' rounds'; }).join('; ') + '. ' + v;
  }

  el.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.n) st.n = +b.dataset.n;
    else if (b.hasAttribute('data-p')) st.p = +b.dataset.p;
    else if (b.dataset.preset === 'avx') { st.n = 1048576; st.p = 8; }
    else if (b.dataset.preset === 'warp') { st.n = 32; st.p = 32; }
    else return;
    render();
  });

  function unlock() {
    $('.wx-locked').hidden = true;
    $('.wx-open').hidden = false;
    render();
  }
  if (D.checks && D.checks['k-06']) unlock();
  else document.addEventListener('didactician:check', function (e) { if (e.detail && e.detail.id === 'k-06') unlock(); });
});
