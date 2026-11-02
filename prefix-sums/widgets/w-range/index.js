/* w-range: pick i..j on the running array; see sum(i..j) as p[j+1] minus p[i].
   Colours: range/result --c3, p[j+1] (bar A) --c1, p[i] (bar B) --c2, shared/cancelled part hatched. */
Didactician.widget('w-range', function (el, ctx) {
  'use strict';
  var a = [3, 1, 7, 0, 4, 1, 6, 3];
  var p = [0];
  a.forEach(function (v) { p.push(p[p.length - 1] + v); });
  var N = a.length;
  var st = { i: 2, j: 5 };
  var T = 44; // thumb size (touch target)

  el.innerHTML =
    '<div class="wr-frame">' +
    '<p class="wr-prompt">Pick any range. What do the two prefix entries always have in common?</p>' +
    '<div class="wr-stage">' +
    '  <div class="wr-r wr-handles">' +
    '    <input type="range" class="wr-in wr-in-i" min="0" max="7" step="1" aria-label="Start index i">' +
    '    <input type="range" class="wr-in wr-in-j" min="0" max="7" step="1" aria-label="End index j">' +
    '    <span class="wr-tl wr-tl-i" aria-hidden="true">i</span><span class="wr-tl wr-tl-j" aria-hidden="true">j</span>' +
    '  </div>' +
    '  <div class="wr-r wr-idx" aria-hidden="true"></div>' +
    '  <div class="wr-r wr-arr"></div>' +
    '  <div class="wr-r wr-ticks" aria-hidden="true"></div>' +
    '  <div class="wr-r wr-pre" aria-hidden="true"></div>' +
    '  <div class="wr-r wr-plab" aria-hidden="true"></div>' +
    '  <div class="wr-blab wr-blab-a"></div>' +
    '  <div class="wr-r wr-bar wr-bar-a" aria-hidden="true"><span class="wr-seg wr-hatch wr-hatch-a"></span><span class="wr-seg wr-rest"><span class="wr-rest-t"></span></span></div>' +
    '  <div class="wr-blab wr-blab-b"></div>' +
    '  <div class="wr-r wr-bar wr-bar-b" aria-hidden="true"><span class="wr-seg wr-hatch wr-hatch-b"></span></div>' +
    '  <div class="wr-cancel"></div>' +
    '</div>' +
    '<p class="wr-formula" aria-live="polite"></p>' +
    '</div>';

  var $ = function (s) { return el.querySelector(s); };
  var stage = $('.wr-stage'), inI = $('.wr-in-i'), inJ = $('.wr-in-j');
  var idx = $('.wr-idx'), arr = $('.wr-arr'), ticks = $('.wr-ticks'), pre = $('.wr-pre'), plab = $('.wr-plab');
  var cells = [], pcells = [], plabs = [], idxs = [];
  for (var k = 0; k < N; k++) {
    var c = document.createElement('span');
    c.className = 'wr-cell'; c.textContent = a[k];
    c.setAttribute('aria-hidden', 'true');
    c.dataset.k = k;
    arr.appendChild(c); cells.push(c);
    var ix = document.createElement('span'); ix.className = 'wr-ix'; ix.textContent = k; idx.appendChild(ix); idxs.push(ix);
  }
  for (k = 0; k <= N; k++) {
    var t = document.createElement('span'); t.className = 'wr-tick'; ticks.appendChild(t);
    var pc = document.createElement('span'); pc.className = 'wr-pcell'; pc.textContent = p[k]; pre.appendChild(pc); pcells.push(pc);
    var pl = document.createElement('span'); pl.className = 'wr-pl'; pl.textContent = 'p[' + k + ']'; plab.appendChild(pl); plabs.push(pl);
  }

  var cw = 36;
  function layout() {
    var frame = $('.wr-frame'), cs = getComputedStyle(frame);
    var width = frame.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    cw = Math.max(32, Math.min(64, Math.floor(width / (N + 1))));
    var W = cw * (N + 1);
    stage.style.width = W + 'px';
    var left = function (k) { return cw / 2 + k * cw; }; // left edge of cell k = boundary k
    cells.forEach(function (c, k) { c.style.left = left(k) + 'px'; c.style.width = cw + 'px'; });
    idxs.forEach(function (c, k) { c.style.left = left(k) + 'px'; c.style.width = cw + 'px'; });
    var pw = cw - 6;
    pcells.forEach(function (c, k) { c.style.left = (left(k) - pw / 2) + 'px'; c.style.width = pw + 'px'; });
    plabs.forEach(function (c, k) { c.style.left = (left(k) - cw / 2) + 'px'; c.style.width = cw + 'px'; });
    Array.prototype.forEach.call(ticks.children, function (t, k) { t.style.left = left(k) + 'px'; });
    // range inputs: thumb centres land on cell centres
    [inI, inJ].forEach(function (inp) { inp.style.left = (cw - T / 2) + 'px'; inp.style.width = ((N - 1) * cw + T) + 'px'; });
    $('.wr-bar-a').style.left = $('.wr-bar-b').style.left = left(0) + 'px';
    $('.wr-blab-a').style.paddingLeft = $('.wr-blab-b').style.paddingLeft = $('.wr-cancel').style.paddingLeft = left(0) + 'px';
    render();
  }

  function sumRange(i, j) { var s = 0; for (var k = i; k <= j; k++) s += a[k]; return s; }

  function render() {
    var i = st.i, j = st.j;
    inI.value = i; inJ.value = j;
    inI.setAttribute('aria-valuetext', 'i = ' + i);
    inJ.setAttribute('aria-valuetext', 'j = ' + j);
    // thumb labels
    $('.wr-tl-i').style.left = (cw * (i + 1) - T / 2) + 'px';
    $('.wr-tl-j').style.left = (cw * (j + 1) - T / 2) + 'px';
    // which thumb is on top when they coincide: the one that can still move
    var iTop = i === j && i >= N / 2;
    inI.style.zIndex = iTop ? 3 : 2; inJ.style.zIndex = iTop ? 2 : 3;
    $('.wr-tl-i').style.zIndex = iTop ? 5 : 4; $('.wr-tl-j').style.zIndex = iTop ? 4 : 5;

    cells.forEach(function (c, k) {
      c.classList.toggle('is-sel', k >= i && k <= j);
      c.classList.toggle('is-before', k < i);
    });
    pcells.forEach(function (c, k) {
      c.classList.toggle('is-a', k === j + 1);
      c.classList.toggle('is-b', k === i);
    });
    plabs.forEach(function (c, k) {
      c.classList.toggle('is-a', k === j + 1);
      c.classList.toggle('is-b', k === i);
    });

    var A = p[j + 1], B = p[i], r = A - B, direct = sumRange(i, j);
    if (r !== direct) console.error('w-range: identity mismatch', i, j, r, direct);
    var hatchA = $('.wr-hatch-a'), rest = $('.wr-rest'), hatchB = $('.wr-hatch-b');
    hatchA.style.width = (i * cw) + 'px';
    rest.style.width = ((j + 1 - i) * cw) + 'px';
    hatchB.style.width = (i * cw) + 'px';
    hatchA.classList.toggle('is-zero', i === 0); hatchB.classList.toggle('is-zero', i === 0);
    $('.wr-rest-t').textContent = '= ' + r;
    $('.wr-blab-a').innerHTML = '<b class="wr-ca">p[' + (j + 1) + '] = ' + A + '</b> <span>everything before index ' + (j + 1) + '</span>';
    $('.wr-blab-b').innerHTML = i === 0
      ? '<b class="wr-cb">p[0] = 0</b> <span>nothing before index 0</span>'
      : '<b class="wr-cb">p[' + i + '] = ' + B + '</b> <span>everything before index ' + i + '</span>';
    $('.wr-cancel').textContent = i === 0
      ? 'Nothing is subtracted, so the whole of bar A is the range.'
      : 'The hatched part, a[0..' + (i - 1) + '], is in both bars, so it cancels.';
    var terms = a.slice(i, j + 1).join(' + ');
    $('.wr-formula').innerHTML = 'sum(' + i + '..' + j + ') = <span class="wr-ca">p[' + (j + 1) + ']</span> − <span class="wr-cb">p[' + i + ']</span> = ' +
      A + ' − ' + B + ' = <b class="wr-cr">' + r + '</b>' + (j > i ? ' <span class="wr-muted">(' + terms + ')</span>' : '');
  }

  function setI(v) { st.i = v; if (st.j < v) st.j = v; render(); }
  function setJ(v) { st.j = v; if (st.i > v) st.i = v; render(); }
  inI.addEventListener('input', function () { setI(+inI.value); });
  inJ.addEventListener('input', function () { setJ(+inJ.value); });
  arr.addEventListener('click', function (e) {
    var c = e.target.closest('.wr-cell'); if (!c) return;
    var k = +c.dataset.k;
    if (k < st.i) setI(k);
    else if (k > st.j) setJ(k);
    else if (k - st.i <= st.j - k) setI(k);
    else setJ(k);
  });

  ctx.onResize(function () { layout(); });
});
