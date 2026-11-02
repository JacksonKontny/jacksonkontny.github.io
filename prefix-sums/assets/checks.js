/* Comprehension checks: commit first, then reveal.
   Markup: .d-check[data-check="k-NN"] with .d-option[data-option] buttons and a .d-feedback[data-answer].
   Think-then-reveal checks: .d-check[data-kind="reveal"] with a .pg-reveal button.
   On commit:
     - window.Didactician.checks[id] = { choice, correct }
     - document fires CustomEvent 'didactician:check' with detail { id, choice, correct }
     - elements [data-reveal-after="<id>"] get .is-open
   Widgets that gate on a check (w-blelloch on k-05, w-race on k-06) read Didactician.checks or
   listen for the event. A widget may adopt a check into its own frame by moving the
   .d-check[data-check-host="<widget id>"] node; this script keeps working wherever the node lives. */
(function () {
  'use strict';
  var D = (window.Didactician = window.Didactician || {});
  D.checks = D.checks || {};

  function commit(card, id, choice, correct) {
    if (D.checks[id]) return;
    D.checks[id] = { choice: choice, correct: correct };
    card.classList.add('is-committed');
    document.querySelectorAll('[data-reveal-after="' + id + '"]').forEach(function (el) { el.classList.add('is-open'); });
    document.dispatchEvent(new CustomEvent('didactician:check', { detail: { id: id, choice: choice, correct: correct } }));
  }

  function setup(card) {
    var id = card.getAttribute('data-check');
    var fb = card.querySelector('.d-feedback');
    if (card.getAttribute('data-kind') === 'reveal') {
      var btn = card.querySelector('.pg-reveal');
      btn.addEventListener('click', function () {
        fb.hidden = false;
        btn.hidden = true;
        commit(card, id, null, null);
        fb.setAttribute('tabindex', '-1');
        fb.focus({ preventScroll: true });
      });
      return;
    }
    var answer = fb.getAttribute('data-answer');
    var opts = Array.prototype.slice.call(card.querySelectorAll('.d-option'));
    var lead = document.createElement('p');
    lead.className = 'pg-fb-lead';
    fb.insertBefore(lead, fb.firstChild);
    fb.setAttribute('aria-live', 'polite');
    opts.forEach(function (b) {
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () {
        if (card.classList.contains('is-committed')) return;
        var choice = b.getAttribute('data-option');
        var right = choice === answer;
        opts.forEach(function (o) {
          o.setAttribute('aria-disabled', 'true');
          if (o.getAttribute('data-option') === answer) o.classList.add('is-right');
        });
        b.setAttribute('aria-pressed', 'true');
        if (!right) b.classList.add('is-wrong');
        lead.textContent = right ? 'Yes, ' + answer + '.' : 'You picked ' + choice + '. The answer is ' + answer + '.';
        fb.hidden = false;
        commit(card, id, choice, right);
      });
    });
  }

  function init() {
    document.querySelectorAll('.d-check[data-check]').forEach(setup);
    // Gated content is visible without JS; with JS it waits for its check.
    document.querySelectorAll('[data-reveal-after]').forEach(function (el) {
      el.classList.add('is-gated');
      if (D.checks[el.getAttribute('data-reveal-after')]) el.classList.add('is-open');
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
