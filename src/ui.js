(function () {
  'use strict';
  var C = window.RondoCore, E = C.E, JP = E.JP;
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- chapter tabs (hash routing) ---------- */
  var VIEWS = ['abstract', 'specimen', 'singles', 'doubles', 'training', 'teams', 'lab', 'forecast', 'archive'];
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

  /* ---------- §8 記録庫：目録から各資料へ移動、童話の挿絵は §1 のイラストを使い回す ---------- */
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('[data-jump]').forEach(function (b) {
    b.addEventListener('click', function () {
      var t = $(b.dataset.jump);
      if (t) { try { t.scrollIntoView({behavior: reduceMotion ? 'auto' : 'smooth', block: 'start'}); } catch (e) { t.scrollIntoView(); } }
    });
  });
  document.querySelectorAll('img[data-copy-from]').forEach(function (img) {
    var s = $(img.dataset.copyFrom); if (s) img.src = s.src;
  });

  /* ---------- ability mode（§1.5 のスキン／いかく切り替え） ---------- */
  var segBtns = Array.prototype.slice.call(document.querySelectorAll('[data-mode]'));
  function setMode(m) {
    segBtns.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.mode === m ? 'true' : 'false'); });
    document.querySelectorAll('[data-rondo]').forEach(function (p) { p.hidden = p.dataset.rondo !== m; });
  }
  segBtns.forEach(function (b) { b.addEventListener('click', function () { setMode(b.dataset.mode); }); });
  setMode('skin');

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
    if (!r) { renderOut(head, null, t0.st.hp, ['いかくのときロンドは変化技（優先度+' + C.DM.rondo.priIntim + 'の交代）']); return; }
    var notes = [];
    notes.push(JP[r.type] + (r.skinned ? '（スキン変換・×1.2）' : ''));
    notes.push(r.cat === 'phys' ? '物理' : '特殊');
    notes.push('相性 ×' + r.eff + (m.rondo && r.eff > 0 ? '（輪舞補正込み）' : ''));
    notes.push('タイプ一致 ×' + (r.stab / 4096).toFixed(2).replace(/0$/, ''));
    if (m.pri) notes.push('優先度' + (m.pri > 0 ? '+' : '') + m.pri);
    if (m.rondo) notes.push('踊り技・非接触');
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
