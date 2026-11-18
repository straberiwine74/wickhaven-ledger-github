// Thaleryn Wiki: search box, mobile menu, and table filters. No libraries.
(function () {
  // Mobile menu
  var btn = document.querySelector('.menu'), side = document.getElementById('side');
  if (btn && side) btn.addEventListener('click', function () {
    var open = side.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // Search
  var q = document.getElementById('q'), box = document.getElementById('results');
  var idx = window.WIKI_INDEX || [];
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function snippet(text, term) {
    var i = text.toLowerCase().indexOf(term);
    if (i < 0) return text.slice(0, 110) + '…';
    var start = Math.max(0, i - 45);
    return (start ? '…' : '') + text.slice(start, i + 75) + '…';
  }
  function run() {
    var term = q.value.trim().toLowerCase();
    if (term.length < 2) { box.hidden = true; return; }
    var hits = [];
    idx.forEach(function (p) {
      var t = p.t.toLowerCase(), x = p.x.toLowerCase(), score = 0;
      if (t.indexOf(term) >= 0) score += 10;
      var n = x.split(term).length - 1;
      score += Math.min(n, 8);
      if (score) hits.push([score, p]);
    });
    hits.sort(function (a, b) { return b[0] - a[0]; });
    box.innerHTML = hits.length ? hits.slice(0, 8).map(function (h) {
      return '<a href="' + h[1].u + '"><b>' + esc(h[1].t) + '</b><small>' + esc(h[1].s) + ' · ' + esc(snippet(h[1].x, term)) + '</small></a>';
    }).join('') : '<div class="none">Nothing found for “' + esc(q.value) + '”.</div>';
    box.hidden = false;
  }
  if (q && box) {
    q.addEventListener('input', run);
    q.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { var a = box.querySelector('a'); if (a) location.href = a.getAttribute('href'); }
      if (e.key === 'Escape') { box.hidden = true; q.blur(); }
    });
    document.addEventListener('click', function (e) { if (!e.target.closest('.search')) box.hidden = true; });
  }

  // Filterable tables: <div class="filter" data-for="tableId"> with buttons data-f and an optional input
  document.querySelectorAll('.filter[data-for]').forEach(function (f) {
    var table = document.getElementById(f.getAttribute('data-for'));
    if (!table) return;
    var rows = table.querySelectorAll('tbody tr'), group = 'all', text = '';
    var input = f.querySelector('input');
    function apply() {
      rows.forEach(function (r) {
        var okGroup = group === 'all' || r.getAttribute('data-g') === group;
        var okText = !text || r.textContent.toLowerCase().indexOf(text) >= 0;
        r.hidden = !(okGroup && okText);
      });
    }
    f.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      group = b.getAttribute('data-f');
      f.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); });
      apply();
    });
    if (input) input.addEventListener('input', function () { text = input.value.trim().toLowerCase(); apply(); });
  });
})();
