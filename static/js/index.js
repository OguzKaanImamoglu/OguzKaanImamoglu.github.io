(function () {
  "use strict";
  /* ---------- navbar burger (from Nerfies) ---------- */
  document.querySelectorAll(".navbar-burger").forEach(function (burger) {
    burger.addEventListener("click", function () {
      burger.classList.toggle("is-active");
      var menu = document.getElementById(burger.dataset.target);
      if (menu) menu.classList.toggle("is-active");
      burger.setAttribute("aria-expanded", String(burger.classList.contains("is-active")));
    });
  });

  /* ---------- results carousel (bulma-carousel, as in Nerfies) ---------- */
  if (window.bulmaCarousel && document.querySelector(".carousel")) {
    bulmaCarousel.attach(".carousel", {
      slidesToScroll: 1,
      slidesToShow: window.innerWidth < 700 ? 1 : 3,
      loop: true,
      infinite: true,
      autoplay: false
    });
  }

  
  /* ---------- domain augmentation switcher ---------- */
  var daText = {
    base: "A plain DRR straight out of DiffDeepDRR. Smooth, low noise, clean contrast. A detector trained only on these learns to rely on a look that real X-ray does not have.",
    aug: "The same frame after Fourier Domain Adaptation, Gaussian noise and gamma correction. The low-frequency texture now comes from real fluoroscopy, and the grain is closer to a real detector.",
    real: "A real fluoroscopy frame from a coronary intervention. Coarser texture, overlapping catheter and anatomy, and a wire that is often only a few pixels wide."
  };
  var daStage = document.getElementById("da-stage");
  if (daStage) {
    var daDesc = document.getElementById("da-desc");
    var daBtns = document.querySelectorAll("[data-da]");
    function showDa(k) {
      daStage.querySelectorAll("img").forEach(function (img) { img.hidden = img.dataset.k !== k; });
      daBtns.forEach(function (b) { var on = b.dataset.da === k; b.setAttribute("aria-pressed", String(on)); b.classList.toggle("is-selected", on); });
      daDesc.textContent = daText[k];
    }
    daBtns.forEach(function (b) { b.addEventListener("click", function () { showDa(b.dataset.da); }); });
    showDa("base");
  }


  /* ---------- pseudo-labelling charts ---------- */
  // Values read from the original thesis figure (pseudo_label_stats.png); counts are about ±10, confidence about ±0.0002.
  var plRoot = document.getElementById("pl-charts");
  if (plRoot) {
    var iters = ["Base", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
    var counts = [970, 1770, 2050, 2350, 2460, 2580, 2610, 2620, 2650, 2740];
    var confs = [0.9208, 0.9194, 0.9191, 0.9185, 0.9182, 0.9178, 0.9176, 0.9176, 0.9176, 0.9178];
    var cfg = {
      count: { title: "Pseudo-labelled frames", values: counts, min: 0, max: 4000, ticks: [0, 1000, 2000, 3000, 4000],
               fmt: function (v) { return v.toLocaleString("en-US"); }, tip: function (v) { return "≈" + v.toLocaleString("en-US") + " frames (" + Math.round(v / 3770 * 100) + "%)"; },
               ref: { v: 3770, label: "All 3,770 frames" } },
      conf:  { title: "Average confidence", values: confs, min: 0.898, max: 0.922, ticks: [0.900, 0.905, 0.910, 0.915, 0.920],
               fmt: function (v) { return v.toFixed(3); }, tip: function (v) { return "≈" + v.toFixed(4); },
               ref: { v: 0.900, label: "Threshold 0.9" } }
    };
    var NS = "http://www.w3.org/2000/svg";
    function el(tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
    function drawPL() { plRoot.querySelectorAll(".pl-chart").forEach(function (box) {
      box.innerHTML = "";
      var c = cfg[box.dataset.series];
      var W = Math.max(300, Math.round(box.clientWidth - 12)), H = W < 520 ? 210 : 230, L = W < 520 ? 52 : 64, R = 16, T = 34, B = box.dataset.series === "conf" ? 46 : 28;
      var pw = W - L - R, ph = H - T - B;
      var x = function (i) { return L + (i + 0.5) * pw / iters.length; };
      var y = function (v) { return T + (1 - (v - c.min) / (c.max - c.min)) * ph; };
      var svg = el("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": c.title + " per iteration" }, box);
      el("text", { x: L, y: 18, "class": "pc-title" }, svg).textContent = c.title;
      c.ticks.forEach(function (t) {
        el("line", { x1: L, x2: W - R, y1: y(t), y2: y(t), "class": "pc-grid" }, svg);
        el("text", { x: L - 8, y: y(t) + 4, "class": "pc-tick", "text-anchor": "end" }, svg).textContent = c.fmt(t);
      });
      el("line", { x1: L, x2: W - R, y1: y(c.ref.v), y2: y(c.ref.v), "class": "pc-ref" }, svg);
      el("text", { x: W - R, y: y(c.ref.v) - 6, "class": "pc-reflabel", "text-anchor": "end" }, svg).textContent = c.ref.label;
      if (box.dataset.series === "conf") {
        iters.forEach(function (it, i) { el("text", { x: x(i), y: H - B + 18, "class": "pc-tick", "text-anchor": "middle" }, svg).textContent = it; });
        el("text", { x: L + pw / 2, y: H - 4, "class": "pc-axis", "text-anchor": "middle" }, svg).textContent = "Pseudo-labelling iteration";
      }
      var d = c.values.map(function (v, i) { return (i ? "L" : "M") + x(i) + " " + y(v); }).join(" ");
      el("path", { d: d, "class": "pc-line" }, svg);
      var dots = c.values.map(function (v, i) { return el("circle", { cx: x(i), cy: y(v), r: 4.5, "class": "pc-dot" }, svg); });
      var tip = document.createElement("div"); tip.className = "pc-tip"; tip.hidden = true; box.appendChild(tip);
      c.values.forEach(function (v, i) {
        var hit = el("rect", { x: x(i) - pw / iters.length / 2, y: T, width: pw / iters.length, height: ph, "class": "pc-hit", tabindex: 0,
                               "aria-label": "Iteration " + iters[i] + ": " + c.tip(v) }, svg);
        function show() {
          dots.forEach(function (dd, k) { dd.setAttribute("r", k === i ? 6.5 : 4.5); });
          tip.textContent = (i ? "Iteration " + iters[i] : "Base model") + ": " + c.tip(v);
          tip.hidden = false;
          tip.style.left = (x(i) / W * 100) + "%";
          tip.style.top = (y(v) / H * 100) + "%";
        }
        function hide() { tip.hidden = true; dots.forEach(function (dd) { dd.setAttribute("r", 4.5); }); }
        hit.addEventListener("mouseenter", show); hit.addEventListener("focus", show);
        hit.addEventListener("mouseleave", hide); hit.addEventListener("blur", hide);
      });
    }); }
    drawPL();
    var plW = plRoot.clientWidth, plT;
    window.addEventListener("resize", function () {
      clearTimeout(plT);
      plT = setTimeout(function () { if (plRoot.clientWidth !== plW) { plW = plRoot.clientWidth; drawPL(); } }, 150);
    });
  }

  /* ---------- ablation explorer ---------- */
  var ex = document.getElementById("explorer");
  if (ex) {
    // Values from the thesis ablation study (Tables 4.2, 4.3) and baselines (4.4, 4.5).
    var data = {
      single: {
        "00": [56.340, 42.991, 69.285],
        "10": [62.065, 63.178, 74.466],
        "01": [73.013, 86.168, 92.717],
        "11": [76.672, 92.523, 96.176],
        ref: [73.047, 83.925, 91.683]
      },
      double: {
        "00": [25.332, -11.224, 19.259],
        "10": [62.380, 69.388, 83.333],
        "01": [62.940, 71.088, 83.101],
        "11": [70.789, 87.415, 93.285],
        ref: [62.014, 71.429, 81.905]
      }
    };
    var vidSuffix = { "00": "base", "10": "da", "01": "pl", "11": "dapl" };
    var names = ["HOTA", "MOTA", "IDF1"];
    var set = "single";
    var tDa = document.getElementById("t-da");
    var tPl = document.getElementById("t-pl");
    var vid = document.getElementById("ex-vid");
    var cfg = document.getElementById("ex-cfg");
    var box = document.getElementById("ex-metrics");
    var setBtns = ex.querySelectorAll("[data-set]");

    // build metric rows once
    var rows = names.map(function (n) {
      var r = document.createElement("div");
      r.className = "metric";
      r.innerHTML = '<span class="name">' + n + '</span><div class="track" title=""><div class="scale"></div><div class="fill"></div><div class="ghost"></div><span class="val"></span></div>';
      box.appendChild(r);
      return r;
    });

    function render() {
      var key = (tDa.checked ? "1" : "0") + (tPl.checked ? "1" : "0");
      var vals = data[set][key], ref = data[set].ref;
      rows.forEach(function (r, i) {
        var v = vals[i], w = Math.max(0, Math.min(100, v));
        var fill = r.querySelector(".fill"), val = r.querySelector(".val"), ghost = r.querySelector(".ghost");
        fill.style.width = w + "%";
        val.style.left = w + "%";
        val.textContent = v.toFixed(1);
        val.classList.toggle("neg", v < 0);
        ghost.style.left = "calc(" + ref[i] + "% - 1px)";
        r.querySelector(".track").title = names[i] + ": " + v.toFixed(1) + " (annotated-real reference " + ref[i].toFixed(1) + ")";
      });
      var parts = ["YOLOv8n trained on synthetic DRRs"];
      if (tDa.checked) parts.push("domain augmentation");
      if (tPl.checked) parts.push("pseudo-labelling on real frames");
      cfg.innerHTML = "<b>" + (key === "11" ? "Full pipeline" : key === "00" ? "No adaptation" : "Partial") + "</b>: " + parts.join(", ") + ".";
      var src = "static/videos/" + set + "_" + vidSuffix[key] + ".mp4";
      if (vid.getAttribute("src") !== src) {
        vid.setAttribute("src", src);
        vid.setAttribute("poster", src.replace(".mp4", ".webp"));
        vid.setAttribute("aria-label", "Tracking output on the " + set + "-guidewire test sequence for this configuration");
        var pr = vid.play(); if (pr && pr.catch) pr.catch(function () {});
      }
    }

    setBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        set = b.dataset.set;
        setBtns.forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); x.classList.toggle("is-selected", x === b); });
        render();
      });
    });
    tDa.addEventListener("change", render);
    tPl.addEventListener("change", render);
    render();
  }
})();

// ===== Palamedes: Sentinels illustration =====
(function () {
  var el = document.getElementById('pa-sentinels');
  if (!el) return;
  var regions = ['AABBBB', 'AABBCC', 'DAACCC', 'DDEECC', 'DEEEFF', 'DDEFFF'];
  var sentinels = { '0,1': 1, '1,3': 1, '2,5': 1, '3,0': 1, '4,2': 1, '5,4': 1 };
  for (var r = 0; r < 6; r++) {
    for (var c = 0; c < 6; c++) {
      var cell = document.createElement('span');
      cell.className = 'r' + regions[r][c];
      if (sentinels[r + ',' + c]) cell.innerHTML = '<i class="pa-dot"></i>';
      el.appendChild(cell);
    }
  }
})();

// ===== Palamedes: replay player (three games) =====
(function () {
  var root = document.getElementById('pa-replay');
  if (!root) return;
  function k(x) { return '<span class="k">' + x + '</span>'; }
  function s(x) { return '<span class="s">"' + x + '"</span>'; }
  function e(x) { return '<span class="e">"' + x + '"</span>'; }
  function arr(a) { return '[' + a.map(s).join(', ') + ']'; }
  function act(field, val, key, extra) { return k('act') + '(run_id, {' + k(field) + ': ' + val + '},\n    key=' + s(key) + (extra || '') + ')'; }
  function ok(body) { return '{ ' + k('ok') + ': true' + (body ? ',\n  ' + body : '') + ' }'; }
  function bad(msg, allowed) { return '{ ' + k('ok') + ': false,\n  ' + k('error') + ': ' + e(msg) + ',\n  ' + k('allowed') + ': ' + s(allowed) + ' }'; }

  // ---------- Rungs ----------
  var L1 = ['COLD'], L2 = ['COLD', 'CORD'], L3 = L2.concat('WORD'), L4 = L3.concat('WARD'), L5 = L4.concat('WARM');
  var rungs = {
    title: 'A word ladder from COLD to WARM',
    steps: [
      { b: L1, log: [], call: k('start_run') + '(game=' + s('rungs') + ')', resp: '{ ' + k('run_id') + ': ' + s('r-42') + ',\n  ' + k('start') + ': ' + s('COLD') + ', ' + k('target') + ': ' + s('WARM') + ' }', note: 'The agent starts a run. It sees only the start word and the target, never the solution.' },
      { b: L2, log: [[1, 'CORD', 1]], call: act('word', s('CORD'), 'k-1', ',\n    reasoning=' + s('L to R gives a real word')), resp: ok(k('ladder') + ': ' + arr(L2)), note: 'A valid move. It is stored as event 1, with its idempotency key and the short reasoning.' },
      { b: L2, log: [[1, 'CORD', 1], [2, 'CXRD', 0]], cls: 'err', call: act('word', s('CXRD'), 'k-2'), resp: bad('CXRD is not a word', 'a real word one letter away from CORD'), note: 'An invalid move. The error says what was wrong and what is allowed, so the agent can correct itself.' },
      { b: L3, log: [[1, 'CORD', 1], [2, 'CXRD', 0], [3, 'WORD', 1]], call: act('word', s('WORD'), 'k-3'), resp: ok(k('ladder') + ': ' + arr(L3)), note: 'Valid, stored as event 3.' },
      { b: L3, log: [[1, 'CORD', 1], [2, 'CXRD', 0], [3, 'WORD', 1]], flash: 3, cls: 'retry', call: '<span class="c">// the reply timed out, so the agent retries</span>\n' + act('word', s('WORD'), 'k-3'), resp: ok(k('ladder') + ': ' + arr(L3)) + '\n<span class="c">// stored result, no new event</span>', note: 'Same key, same move: the server returns the stored result. No second move is played and the log does not change.' },
      { b: L4, log: [[1, 'CORD', 1], [2, 'CXRD', 0], [3, 'WORD', 1], [4, 'WARD', 1]], call: act('word', s('WARD'), 'k-4'), resp: ok(k('ladder') + ': ' + arr(L4)), note: 'Valid, stored as event 4.' },
      { b: L5, done: true, log: [[1, 'CORD', 1], [2, 'CXRD', 0], [3, 'WORD', 1], [4, 'WARD', 1], [5, 'WARM', 1]], call: act('word', s('WARM'), 'k-5'), resp: '{ ' + k('ok') + ': true, ' + k('solved') + ': true,\n  ' + k('ladder') + ': ' + arr(L5) + ' }', note: 'Solved. The run closes and is scored. Its replay opens to everyone after the day ends.' }
    ],
    draw: function (st, prev) {
      var h = '<div class="pa-rladder">';
      st.b.forEach(function (w, j) {
        var p = st.b[j - 1], cls = st.done ? 'done' : (prev && j === st.b.length - 1 && prev.b.length < st.b.length ? 'new' : '');
        var ww = p ? w.split('').map(function (c, n) { return c !== p[n] ? '<span class="hl">' + c + '</span>' : c; }).join('') : w;
        h += '<div class="' + cls + '">' + ww + '</div>';
      });
      if (!st.done) h += '<div class="target">WARM</div>';
      return h + '</div>';
    }
  };

  // ---------- Lexis ----------
  var lexis = {
    title: 'Seven letters, always use the center A',
    steps: [
      { f: [], log: [], call: k('start_run') + '(game=' + s('lexis') + ')', resp: '{ ' + k('letters') + ': ' + arr(['P', 'L', 'N', 'A', 'E', 'T', 'S']) + ',\n  ' + k('center') + ': ' + s('A') + ', ' + k('found') + ': [] }', note: 'Seven letters and a center letter that every word must use.' },
      { f: ['PLANT'], log: [[1, 'PLANT', 1]], call: act('word', s('PLANT'), 'k-1'), resp: ok(k('found') + ': ' + arr(['PLANT'])), note: 'A valid word. Longer words score more.' },
      { f: ['PLANT'], bad: 'PELT', log: [[1, 'PLANT', 1], [2, 'PELT', 0]], cls: 'err', call: act('word', s('PELT'), 'k-2'), resp: bad('PELT does not use the center letter A', 'a word that uses the center letter A'), note: 'Invalid: no center letter. Every invalid guess costs points, so random guessing does not pay.' },
      { f: ['PLANT', 'SLATE'], log: [[1, 'PLANT', 1], [2, 'PELT', 0], [3, 'SLATE', 1]], call: act('word', s('SLATE'), 'k-3'), resp: ok(k('found') + ': ' + arr(['PLANT', 'SLATE'])), note: 'Valid, stored as event 3.' },
      { f: ['PLANT', 'SLATE', 'PLANETS'], pang: 'PLANETS', log: [[1, 'PLANT', 1], [2, 'PELT', 0], [3, 'SLATE', 1], [4, 'PLANETS', 1]], call: act('word', s('PLANETS'), 'k-4'), resp: ok(k('found') + ': ' + arr(['PLANT', 'SLATE', 'PLANETS']) + ',\n  ' + k('bonus') + ': ' + s('uses all seven letters')), note: 'A word with all seven letters earns a bonus. The agent keeps going until it stops or the time is up.' }
    ],
    draw: function (st) {
      var L = ['P', 'L', 'N', 'A', 'E', 'T', 'S'];
      var h = '<div class="pa-rlex">' + L.map(function (c) { return '<span' + (c === 'A' ? ' class="center"' : '') + '>' + c + '</span>'; }).join('') + '</div><div class="pa-rfound">';
      st.f.forEach(function (w) { h += '<span' + (w === st.pang ? ' class="pang"' : '') + '>' + w + '</span>'; });
      if (st.bad) h += '<span class="badw">' + st.bad + '</span>';
      if (!st.f.length && !st.bad) h += '<em>no words yet</em>';
      return h + '</div>';
    }
  };

  // ---------- Sentinels ----------
  var R = ['AABBBB', 'AABBCC', 'DAACCC', 'DDEECC', 'DEEEFF', 'DDEFFF'];
  var P = [[0, 1], [1, 3], [2, 5], [3, 0], [4, 2], [5, 4]];
  function sentStep(n, extra) { return P.slice(0, n); }
  var sentinels = {
    title: 'One sentinel per row, column and region',
    steps: [
      { p: [], log: [], call: k('start_run') + '(game=' + s('sentinels') + ')', resp: '{ ' + k('size') + ': 6,\n  ' + k('regions') + ': ' + arr(['AABBBB', 'AABBCC', '...']) + ' }', note: 'The agent gets the region of every cell directly, so it does not have to read a picture.' },
      { p: sentStep(1), log: [[1, '(0,1)', 1]], call: act('place', '[0, 1]', 'k-1'), resp: ok(k('placed') + ': 1'), note: 'A valid placement, stored as event 1.' },
      { p: sentStep(1), bad: [1, 2], log: [[1, '(0,1)', 1], [2, '(1,2)', 0]], cls: 'err', call: act('place', '[1, 2]', 'k-2'), resp: bad('(1,2) touches the sentinel at (0,1)', 'a cell not next to another sentinel'), note: 'Invalid: two sentinels may not touch, not even diagonally.' },
      { p: sentStep(2), log: [[1, '(0,1)', 1], [2, '(1,2)', 0], [3, '(1,3)', 1]], call: act('place', '[1, 3]', 'k-3'), resp: ok(k('placed') + ': 2'), note: 'Valid, stored as event 3.' },
      { p: sentStep(4), log: [[1, '(0,1)', 1], [2, '(1,2)', 0], [3, '(1,3)', 1], [4, '(2,5)', 1], [5, '(3,0)', 1]], call: act('place', '[3, 0]', 'k-5'), resp: ok(k('placed') + ': 4'), note: 'Two more valid placements.' },
      { p: sentStep(6), done: true, log: [[1, '(0,1)', 1], [2, '(1,2)', 0], [3, '(1,3)', 1], [4, '(2,5)', 1], [5, '(3,0)', 1], [6, '(4,2)', 1], [7, '(5,4)', 1]], call: act('place', '[5, 4]', 'k-7'), resp: '{ ' + k('ok') + ': true, ' + k('solved') + ': true,\n  ' + k('placed') + ': 6 }', note: 'Solved: one sentinel in every row, column and region. The puzzle was generated so that this is the only solution.' }
    ],
    draw: function (st) {
      var h = '<div class="pa-grid pa-rgrid' + (st.done ? ' done' : '') + '">';
      for (var r = 0; r < 6; r++) for (var c = 0; c < 6; c++) {
        var has = st.p.some(function (q) { return q[0] === r && q[1] === c; });
        var isBad = st.bad && st.bad[0] === r && st.bad[1] === c;
        h += '<span class="r' + R[r][c] + (isBad ? ' bad' : '') + '">' + (has ? '<i class="pa-dot"></i>' : (isBad ? '<i class="fas fa-times"></i>' : '')) + '</span>';
      }
      return h + '</div>';
    }
  };

  var games = { rungs: rungs, lexis: lexis, sentinels: sentinels };
  var g = rungs, i = 0, timer = null;
  var $ = function (id) { return document.getElementById(id); };
  var dots = $('rp-dots');
  function buildDots() {
    dots.innerHTML = '';
    g.steps.forEach(function (_, n) {
      var b = document.createElement('button'); b.setAttribute('aria-label', 'Step ' + (n + 1));
      b.addEventListener('click', function () { stop(); go(n); }); dots.appendChild(b);
    });
  }
  function render() {
    var st = g.steps[i];
    $('rp-board').innerHTML = g.draw(st, g.steps[i - 1]);
    $('rp-log').innerHTML = st.log.length ? st.log.map(function (r) {
      return '<li' + (st.flash === r[0] ? ' class="flash"' : '') + '>#' + r[0] + ' ' + r[1] + ' <span class="' + (r[2] ? 'ok">ok' : 'bad">invalid') + '</span></li>';
    }).join('') : '<li style="color:#9aa1ab">empty</li>';
    $('rp-call').innerHTML = st.call;
    $('rp-resp').innerHTML = st.resp;
    var note = $('rp-note'); note.className = 'pa-rnote' + (st.cls ? ' ' + st.cls : ''); note.textContent = st.note;
    $('rp-title').textContent = g.title;
    $('rp-count').textContent = 'Step ' + (i + 1) + ' of ' + g.steps.length;
    Array.prototype.forEach.call(dots.children, function (d, n) { d.classList.toggle('on', n === i); });
    $('rp-prev').disabled = i === 0; $('rp-next').disabled = i === g.steps.length - 1;
  }
  function go(n) { i = Math.max(0, Math.min(g.steps.length - 1, n)); render(); }
  function stop() { if (timer) { clearInterval(timer); timer = null; } $('rp-play').innerHTML = '<span class="icon"><i class="fas fa-play"></i></span><span>Play</span>'; }
  $('rp-prev').addEventListener('click', function () { stop(); go(i - 1); });
  $('rp-next').addEventListener('click', function () { stop(); go(i + 1); });
  $('rp-play').addEventListener('click', function () {
    if (timer) { stop(); return; }
    if (i === g.steps.length - 1) go(0);
    $('rp-play').innerHTML = '<span class="icon"><i class="fas fa-pause"></i></span><span>Pause</span>';
    timer = setInterval(function () { if (i >= g.steps.length - 1) { stop(); return; } go(i + 1); }, 2600);
  });
  root.querySelectorAll('.pa-replay-games button').forEach(function (b) {
    b.addEventListener('click', function () {
      stop(); g = games[b.dataset.g]; i = 0;
      root.querySelectorAll('.pa-replay-games button').forEach(function (x) { x.classList.toggle('on', x === b); });
      buildDots(); render();
    });
  });
  buildDots(); render();
})();

// ===== Palamedes: future games toggles =====
(function () {
  document.querySelectorAll('.pa-fg-btn').forEach(function (b) {
    var target = document.getElementById(b.dataset.toggle);
    if (!target) return;
    var label = b.querySelector('span:last-child'), orig = label.textContent;
    b.addEventListener('click', function () {
      var on = target.classList.toggle('reveal');
      if (b.dataset.toggle === 'pa-clusters') document.getElementById('pa-clusters-key').classList.toggle('reveal', on);
      if (b.dataset.toggle === 'pa-mafia') target.querySelectorAll('.seat').forEach(function (s) { s.querySelector('span').textContent = on || s.classList.contains('out') ? s.dataset.r : '?'; });
      label.textContent = on ? 'Hide' : orig;
    });
  });
  var texts = [
    'The Mafia pick a target, the Doctor protects one player, the Detective checks one player. All in private.',
    'The night’s result is announced. Agents discuss in short rounds, each speaking once per round.',
    'Everyone votes. The player with the most votes is out and their role is revealed.'
  ];
  var ph = document.getElementById('pa-phases');
  if (ph) ph.querySelectorAll('button').forEach(function (b) {
    b.addEventListener('click', function () {
      ph.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); });
      document.getElementById('pa-phase-text').textContent = texts[+b.dataset.p];
    });
  });
})();

// ===== Palamedes: one move, three cases =====
(function () {
  var root = document.getElementById('pa-mv');
  if (!root) return;
  var cases = {
    'new': { path: ['agent', 'mcp', 'platform', 'engine', 'db', 'agent'], skip: [],
      steps: ['The agent calls act(run, action, key).', 'The MCP server checks the OAuth token, the rate limit and the request size.', 'The platform locks the run and finds the key is new.', 'The engine applies the move and returns the new state, or a structured error. It never raises.', 'The move is stored as an event, with the new state, in one transaction.', 'The agent gets a compact observation with only what a player may see.'],
      result: ['', 'One move played, one event stored.'] },
    'retry': { path: ['agent', 'mcp', 'platform', 'db', 'agent'], skip: ['engine'],
      steps: ['The call timed out, so the agent sends the same action with the same key.', 'The MCP server checks the token and the rate limit as usual.', 'The platform locks the run and finds the key already stored.', 'PostgreSQL returns the stored result. The engine is not called.', 'The agent gets exactly the same answer as the first time.'],
      result: ['info', 'No second move. The game is safe against retries.'] },
    'clash': { path: ['agent', 'mcp', 'platform', 'db', 'agent'], skip: ['engine'],
      steps: ['The agent reuses a key, but with a different action.', 'The MCP server checks the token and the rate limit as usual.', 'The platform finds the key, but the payload hash does not match.', 'Nothing is written.', 'The agent gets a clear error: this key was used for a different action.'],
      result: ['warn', 'Rejected. A key can never mean two different moves.'] }
  };
  var nodes = {}; root.querySelectorAll('.pa-mv-node').forEach(function (n) { nodes[n.dataset.n] = n; });
  var tabs = root.querySelectorAll('.pa-mv-tabs li');
  var list = document.getElementById('pa-mv-steps'), res = document.getElementById('pa-mv-result');
  var timers = [];
  function run(name) {
    timers.forEach(clearTimeout); timers = [];
    var c = cases[name];
    tabs.forEach(function (t) { t.classList.toggle('is-active', t.dataset.sc === name); });
    Object.keys(nodes).forEach(function (k) { nodes[k].className = 'pa-mv-node' + (c.skip.indexOf(k) >= 0 ? ' skip' : ''); });
    list.innerHTML = c.steps.map(function (s) { return '<li>' + s + '</li>'; }).join('');
    res.className = 'pa-mv-result'; res.textContent = c.result[1];
    var items = list.querySelectorAll('li');
    c.steps.forEach(function (_, n) {
      timers.push(setTimeout(function () {
        Object.keys(nodes).forEach(function (k) { nodes[k].classList.remove('hot'); });
        var key = c.path[Math.min(n, c.path.length - 1)];
        nodes[key].classList.add('hot', 'used');
        items[n].classList.add('on');
        if (n === c.steps.length - 1) timers.push(setTimeout(function () {
          nodes[key].classList.remove('hot');
          res.className = 'pa-mv-result on' + (c.result[0] ? ' ' + c.result[0] : '');
        }, 900));
      }, 250 + n * 900));
    });
  }
  tabs.forEach(function (t) { t.addEventListener('click', function () { run(t.dataset.sc); }); });
  var started = false;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en, ob) { if (en[0].isIntersecting && !started) { started = true; run('new'); ob.disconnect(); } }, { threshold: 0.4 }).observe(root);
  } else { run('new'); }
  // static fallback until visible
  list.innerHTML = cases['new'].steps.map(function (s) { return '<li class="on">' + s + '</li>'; }).join('');
})();

// ===== Selected work slider =====
(function () {
  var track = document.getElementById('work-track');
  if (!track) return;
  var slides = track.querySelectorAll('.work-slide');
  var root = document.getElementById('work-slider');
  var prev = root.querySelector('.ws-btn.prev'), next = root.querySelector('.ws-btn.next');
  var dots = document.getElementById('ws-dots');
  slides.forEach(function (_, n) {
    var b = document.createElement('button'); b.setAttribute('aria-label', 'Project ' + (n + 1));
    b.addEventListener('click', function () { go(n); }); dots.appendChild(b);
  });
  function idx() { return Math.round(track.scrollLeft / (slides[0].offsetWidth + 16)); }
  function go(n) { n = Math.max(0, Math.min(slides.length - 1, n)); track.scrollTo({ left: slides[n].offsetLeft - track.offsetLeft - 2, behavior: 'smooth' }); }
  function update() {
    var i = idx();
    Array.prototype.forEach.call(dots.children, function (d, n) { d.classList.toggle('on', n === i); });
    prev.disabled = i === 0; next.disabled = i === slides.length - 1;
    slides.forEach(function (s, n) { s.querySelectorAll('video').forEach(function (v) { if (n === i) { v.play && v.play().catch(function(){}); } }); });
  }
  prev.addEventListener('click', function () { go(idx() - 1); });
  next.addEventListener('click', function () { go(idx() + 1); });
  track.addEventListener('scroll', function () { clearTimeout(track._t); track._t = setTimeout(update, 60); });
  track.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') go(idx() + 1); if (e.key === 'ArrowLeft') go(idx() - 1); });
  track.setAttribute('tabindex', '0');
  window.addEventListener('resize', update);
  update();
})();
