(function () {
  'use strict';
  var C = window.RondoCore, E = C.E, JP = E.JP;
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- chapter tabs (hash routing) ---------- */
  var VIEWS = ['abstract', 'specimen', 'singles', 'doubles', 'training', 'teams', 'lab', 'forecast'];
  var chapters = {};
  document.querySelectorAll('[data-chapter]').forEach(function (s) { chapters[s.id] = s; });
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  var current = null;
  function show(view) {
    if (VIEWS.indexOf(view) < 0) view = 'abstract';
    if (view === current) return view;
    current = view;
    VIEWS.forEach(function (v) { if (chapters[v]) chapters[v].hidden = (v !== view); });
    tabs.forEach(function (t) {
      if (t.dataset.view === view) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current');
    });
    var row = document.querySelector('.tabrow'), act = tabs.filter(function (t) { return t.dataset.view === view; })[0];
    if (row && act) { var l = act.offsetLeft - 16; if (l < row.scrollLeft || act.offsetLeft + act.offsetWidth > row.scrollLeft + row.clientWidth) row.scrollLeft = Math.max(0, l); }
    return view;
  }
  function hashView() { return (location.hash || '').replace('#', ''); }
  tabs.forEach(function (t) {
    t.addEventListener('click', function (e) {
      e.preventDefault();
      var v = t.dataset.view;
      show(v);
      if (hashView() !== v) location.hash = v;
      var sec = chapters[v];
      if (sec) { try { sec.scrollIntoView({block: 'start'}); } catch (err) { sec.scrollIntoView(); } }
    });
  });
  window.addEventListener('hashchange', function () { show(hashView()); });
  var initial = hashView();
  show(initial);
  if (VIEWS.indexOf(initial) > 0 && chapters[initial]) { setTimeout(function () { try { chapters[initial].scrollIntoView({block: 'start'}); } catch (e) {} }, 0); }

  /* ---------- emblem + ability mode ---------- */
  var cv = $('emblem'), ctx = cv && cv.getContext ? cv.getContext('2d') : null;
  var mode = 'skin';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function tok(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || '#888'; }
  function draw(t) {
    if (!ctx) return;
    var W = cv.width, cx = W / 2, cy = W / 2, R = W * 0.34;
    var ink = tok('--ink'), rule = tok('--rule'), gold = tok('--gold'), goldInk = tok('--goldInk'), indigo = tok('--indigo'), sheet = tok('--sheet');
    ctx.clearRect(0, 0, W, W);
    ctx.fillStyle = sheet; ctx.beginPath(); ctx.arc(cx, cy, W * 0.48, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = rule; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, W * 0.48 - 1, 0, Math.PI * 2); ctx.stroke();
    for (var i = 0; i < 24; i++) {
      var a = i / 24 * Math.PI * 2, major = i % 6 === 0, r1 = W * 0.445, r2 = W * (major ? 0.40 : 0.425);
      ctx.strokeStyle = major ? ink : rule; ctx.lineWidth = major ? 3 : 1.5;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2); ctx.stroke();
    }
    var accent = mode === 'skin' ? indigo : goldInk, ph = t * 0.0006;
    ctx.strokeStyle = accent; ctx.globalAlpha = 0.4; ctx.lineWidth = 2; ctx.beginPath();
    for (var k = 0; k <= 360; k++) {
      var b = k / 360 * Math.PI * 2, rr = R * (0.8 + 0.17 * Math.sin(3 * b + ph));
      var x = cx + Math.cos(b) * rr, y = cy + Math.sin(b) * rr;
      if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.closePath(); ctx.stroke(); ctx.globalAlpha = 1;
    if (mode === 'intim') {
      var p = (t * 0.0005) % 1;
      ctx.strokeStyle = goldInk; ctx.globalAlpha = Math.max(0, 1 - p); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(cx, cy, W * 0.12 + p * W * 0.3, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
    }
    for (var j = 0; j < 8; j++) {
      var c = j / 8 * Math.PI * 2 + t * 0.0008 * (mode === 'skin' ? 1 : -1);
      var r3 = R * (0.8 + 0.17 * Math.sin(3 * c + ph));
      var s = W * (0.026 + 0.009 * Math.sin(t * 0.004 + j));
      ctx.fillStyle = j % 2 ? gold : accent;
      ctx.beginPath(); ctx.arc(cx + Math.cos(c) * r3, cy + Math.sin(c) * r3, s, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = Math.round(W * 0.2) + "px 'Dela Gothic One','Hiragino Kaku Gothic StdN',sans-serif";
    ctx.fillText(mode === 'skin' ? '竜' : '威', cx, cy + W * 0.012);
  }
  var raf = null;
  function loop(t) { draw(t); raf = requestAnimationFrame(loop); }
  function start() { if (reduce) { draw(1200); return; } if (!raf) raf = requestAnimationFrame(loop); }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
  if (window.matchMedia) { var mq = window.matchMedia('(prefers-color-scheme: dark)'); if (mq.addEventListener) mq.addEventListener('change', function () { draw(1200); }); }
  try { new MutationObserver(function () { draw(1200); }).observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme']}); } catch (e) {}
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { draw(1200); });

  var segBtns = Array.prototype.slice.call(document.querySelectorAll('[data-mode]'));
  function setMode(m) {
    mode = m;
    segBtns.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.mode === m ? 'true' : 'false'); });
    document.querySelectorAll('[data-rondo]').forEach(function (p) { p.hidden = p.dataset.rondo !== m; });
    var cap = $('emblemCap'); if (cap) cap.textContent = '輪舞観測図 ／ MODE: ' + (m === 'skin' ? 'SKIN' : 'INTIMIDATE');
    if (reduce) draw(1200);
  }
  segBtns.forEach(function (b) { b.addEventListener('click', function () { setMode(b.dataset.mode); }); });
  if (cv) {
    cv.addEventListener('click', function () { setMode(mode === 'skin' ? 'intim' : 'skin'); });
    cv.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setMode(mode === 'skin' ? 'intim' : 'skin'); } });
  }
  setMode('skin'); start();

  /* ---------- stat calculator ---------- */
  var NAT_ORDER = ['jolly', 'adamant', 'careful', 'impish', 'calm', 'bold', 'brave', 'relaxed', 'sassy', 'modest', 'timid', 'hardy'];
  var scNat = $('sc-nat');
  NAT_ORDER.forEach(function (k) {
    var n = C.NAT[k], ups = [], dn = [];
    ['atk', 'def', 'spa', 'spd', 'spe'].forEach(function (s) { if (n[s] > 1) ups.push(s); if (n[s] < 1) dn.push(s); });
    var lab = {atk: 'A', def: 'B', spa: 'C', spd: 'D', spe: 'S'};
    var o = document.createElement('option'); o.value = k;
    o.textContent = n.jp + (ups.length ? '（' + lab[ups[0]] + '↑' + lab[dn[0]] + '↓）' : '');
    scNat.appendChild(o);
  });
  scNat.value = 'jolly';
  var scIds = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
  function clampEv(v) { v = Math.round((+v || 0) / 4) * 4; return Math.max(0, Math.min(252, v)); }
  function statCalc() {
    var ev = {}, total = 0;
    scIds.forEach(function (k) { var el = $('sc-' + k); var v = clampEv(el.value); ev[k] = v; total += v; });
    var nat = scNat.value, st = C.stats('draffia', nat, ev), n = C.NAT[nat];
    var lab = {hp: 'H', atk: 'A', def: 'B', spa: 'C', spd: 'D', spe: 'S'};
    $('sc-out').innerHTML = scIds.map(function (k) {
      var cls = n[k] > 1 ? 'up' : (n[k] < 1 ? 'dn' : '');
      return '<div><dt>' + lab[k] + '</dt><dd class="' + cls + '">' + st[k] + '</dd></div>';
    }).join('');
    var el = $('sc-ev'); el.textContent = '努力値合計 ' + total + ' / 510' + (total > 510 ? '（上限超過）' : '　残り ' + (510 - total));
    el.className = 'evline' + (total > 510 ? ' over' : '');
  }
  scIds.forEach(function (k) { $('sc-' + k).addEventListener('input', statCalc); });
  scNat.addEventListener('change', statCalc);
  statCalc();

  /* ---------- speed checker ---------- */
  var spRows = Array.prototype.slice.call(document.querySelectorAll('.sp-row[data-spe]'));
  function speedCheck() {
    var ev = +$('spd-ev').value, iv = +$('spd-iv').value, nat = +$('spd-nat').value;
    $('spd-evv').textContent = ev;
    var me = E.calcStat(C.SP.draffia.b[5], ev, iv, nat, false);
    if ($('spd-tw').checked) me *= 2;
    var max = Math.max(240, Math.ceil(me * 1.05));
    var cnt = 0;
    spRows.forEach(function (r) {
      var s = +r.dataset.spe, fast = s > me;
      if (fast) cnt++;
      r.classList.toggle('faster', fast);
      r.querySelector('.fl').style.width = (s / max * 100) + '%';
      r.querySelector('.mark').style.left = 'calc(' + (me / max * 100) + '% - 1px)';
    });
    $('spd-me').textContent = me;
    $('spd-count').textContent = cnt;
    $('spd-total').textContent = spRows.length;
  }
  ['spd-ev', 'spd-iv', 'spd-nat', 'spd-tw'].forEach(function (id) { $(id).addEventListener('input', speedCheck); $(id).addEventListener('change', speedCheck); });
  speedCheck();

  /* ---------- damage calculator ---------- */
  var TYPES = E.TYPES;
  function fillStages(sel, def) {
    for (var s = 6; s >= -6; s--) { var o = document.createElement('option'); o.value = s; o.textContent = (s > 0 ? '+' : '') + s; sel.appendChild(o); }
    sel.value = def || 0;
  }
  fillStages($('ca-stage')); fillStages($('ca-dstage'));
  var mvSel = $('ca-move');
  Object.keys(C.DM).forEach(function (k) {
    if (k === 'facadest') return;
    var m = C.DM[k], o = document.createElement('option'); o.value = k;
    o.textContent = m.jp + '（' + JP[m.type] + ' ' + m.bp + '）';
    mvSel.appendChild(o);
  });
  mvSel.value = 'rondo';
  var tgSel = $('ca-tgt');
  C.TARGETS.forEach(function (t) { var o = document.createElement('option'); o.value = t.key; o.textContent = t.label; tgSel.appendChild(o); });
  tgSel.value = 'flutter_cs';
  var ttSel = $('ca-ttera');
  [['', 'なし']].concat(TYPES.map(function (t) { return [t, JP[t]]; })).forEach(function (p) { var o = document.createElement('option'); o.value = p[0]; o.textContent = p[1]; ttSel.appendChild(o); });
  var atSel = $('cd-atk');
  [['S', 'シングル想定'], ['B', 'シングル・ダブル共通'], ['D', 'ダブル想定（全体技は×0.75込み）']].forEach(function (g) {
    var og = document.createElement('optgroup'); og.label = g[1];
    C.ATTACKS.filter(function (a) { return a.group === g[0]; }).forEach(function (a) { var o = document.createElement('option'); o.value = a.key; o.textContent = a.label; og.appendChild(o); });
    atSel.appendChild(og);
  });
  atSel.value = 'ci_lance_d';

  var calcMode = 'atk';
  var modeBtns = Array.prototype.slice.call(document.querySelectorAll('[data-calcmode]'));
  modeBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      calcMode = b.dataset.calcmode;
      modeBtns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      document.querySelectorAll('[data-pane]').forEach(function (p) { p.hidden = p.dataset.pane !== calcMode; });
      run();
    });
  });

  function pct(x) { return x.toFixed(1); }
  function koHtml(ko) { return ko.text; }
  function renderOut(head, res, hp, notes) {
    $('o-head').textContent = head;
    if (!res) {
      $('o-dmg').textContent = '—'; $('o-pct').textContent = ''; $('o-ko').textContent = 'ダメージなし';
      $('o-rem').style.width = '100%'; $('o-rng').style.left = '100%'; $('o-rng').style.width = '0';
      $('o-notes').innerHTML = notes.map(function (n) { return '<span>' + n + '</span>'; }).join(''); $('o-rolls').textContent = '';
      return;
    }
    $('o-dmg').textContent = res.min + ' – ' + res.max;
    $('o-pct').textContent = pct(res.minPct) + '% – ' + pct(res.maxPct) + '%（HP ' + hp + '）' + (res.hits > 1 ? '　' + res.hits + '発合計' : '');
    $('o-ko').textContent = res.max === 0 ? '効果なし' : koHtml(res.ko);
    var lo = Math.max(0, 100 - res.maxPct), hi = Math.max(0, 100 - res.minPct);
    $('o-rem').style.width = lo + '%';
    $('o-rng').style.left = lo + '%'; $('o-rng').style.width = Math.max(0, hi - lo) + '%';
    $('o-notes').innerHTML = notes.map(function (n) { return '<span>' + n + '</span>'; }).join('');
    $('o-rolls').textContent = '乱数16段階：' + res.rolls.join(', ');
  }
  var lastTarget = null;
  function runAtk() {
    var ev = clampEv($('ca-ev').value); $('ca-evv').textContent = ev;
    var nat = $('ca-nat').value, st = C.stats('draffia', nat, {hp: 4, atk: ev, spe: 252});
    var t0 = C.target(tgSel.value);
    if (lastTarget !== t0.key) { $('ca-dstage').value = t0.defStage || 0; lastTarget = t0.key; }
    var tgt = {sp: t0.sp, st: t0.st, tera: ttSel.value || null, defStage: +$('ca-dstage').value, final: t0.final,
      ruin: $('ca-ruin').checked, reflect: $('ca-ref').checked ? ($('ca-dbl').checked ? 'double' : 'single') : null};
    var skin = $('ca-ab').value === 'skin';
    var mv = mvSel.value, m = C.DM[mv];
    var o = {st: st, skin: skin, move: mv, item: $('ca-item').value, tera: $('ca-tera').value || null, stellar: true,
      atkStage: +$('ca-stage').value, crit: $('ca-crit').checked, hh: $('ca-hh').checked, burn: $('ca-burn').checked,
      statused: $('ca-st').checked || $('ca-burn').checked, doubles: $('ca-dbl').checked, target: tgt};
    var r = C.drfAtk(o);
    var head = 'ドラフィア（' + C.NAT[nat].jp + ' A' + ev + '・実数値' + st.atk + '）→ ' + t0.label;
    if (!r) { renderOut(head, null, t0.st.hp, ['いかくのときロンドは変化技（優先度+1の交代）']); return; }
    var notes = [];
    notes.push(JP[r.type] + (r.skinned ? '（スキン変換・×1.2）' : ''));
    notes.push(r.cat === 'phys' ? '物理' : '特殊（A≦Cで判定）');
    notes.push('相性 ×' + r.eff + (m.rondo && r.eff > 0 ? '（輪舞補正込み）' : ''));
    notes.push('タイプ一致 ×' + (r.stab / 4096).toFixed(2).replace(/0$/, ''));
    if (m.pri) notes.push('優先度' + (m.pri > 0 ? '+' : '') + m.pri);
    if (m.rondo) notes.push('音技');
    if (mv === 'doubleedge' && r.max > 0) notes.push('反動 ' + Math.round(r.min / 3) + '〜' + Math.round(r.max / 3));
    if (mv === 'facade' && o.statused) notes.push('威力140→スキン168');
    if (t0.final) notes.push('満タン特性で半減');
    renderOut(head, r, t0.st.hp, notes);
  }
  function runDef() {
    var hp = clampEv($('cd-hp').value), df = clampEv($('cd-def').value), sd = clampEv($('cd-spd').value);
    $('cd-hpv').textContent = hp; $('cd-defv').textContent = df; $('cd-spdv').textContent = sd;
    var nat = $('cd-nat').value, st = C.stats('draffia', nat, {hp: hp, def: df, spd: sd});
    var p = C.attack(atSel.value);
    var drf = {st: st, tera: $('cd-tera').value || null, intim: $('cd-intim').checked, haban: $('cd-haban').checked,
      av: $('cd-av').checked, screen: $('cd-scr').checked ? (p.group === 'D' ? 'double' : 'single') : null};
    var r = C.vsDrf(p, drf);
    var head = p.label.split('｜')[0] + ' → ドラフィア（' + C.NAT[nat].jp + ' H' + hp + ' B' + df + ' D' + sd + '：' + st.hp + '-' + st.def + '-' + st.spd + '）';
    var notes = [JP[p.type] + '・' + (p.cat === 'phys' ? '物理' : '特殊'), '相性 ×' + r.eff];
    if (p.cat === 'phys' && drf.intim && !p.bodyPress) notes.push(p.crit ? '急所のためいかく無視' : 'いかく -1');
    if (p.bodyPress) notes.push('ボディプレス（防御で計算・いかく無効）');
    if (p.ruinDef) notes.push('わざわいのつるぎ（防御×0.75）');
    if (p.beads) notes.push('わざわいのたま（特防×0.75）');
    if (p.spread) notes.push('全体技 ×0.75');
    if (drf.haban && p.type === 'Dragon' && r.eff > 1) notes.push('ハバンのみ ×0.5');
    if (st.hp + df + sd > 0 && hp + df + sd > 510) notes.push('努力値合計が510を超えています');
    renderOut(head, r, st.hp, notes);
  }
  function run() { if (calcMode === 'atk') runAtk(); else runDef(); }
  document.querySelectorAll('[data-pane] select, [data-pane] input').forEach(function (el) {
    el.addEventListener('input', run); el.addEventListener('change', run);
  });
  run();
})();
