'use strict';

const TOTAL = 20;
const EASY_COUNT = 8;              // 前半：お馴染み（ニセ漢字から選ぶ）
const HARD_COUNT = TOTAL - EASY_COUNT; // 後半：難読（実在の漢字から選ぶ）
const RANK_KEY = 'sakanahen-ranking';
const NAME_KEY = 'sakanahen-name';
const ALL = [...EASY, ...HARD];

const $ = (id) => document.getElementById(id);

function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sharesReading(a, b) {
  return a.y.some((y) => b.y.includes(y));
}

// お馴染み問題：正解のつくり＋ニセのつくり3つ（すべて合成描画）
function makeEasyQuestion(e) {
  const choices = shuffle([e.t, ...e.f]).map((t) => ({ t, correct: t === e.t }));
  return { level: 'easy', item: e, choices };
}

// 難読問題：正解＋読みが重ならない実在の魚へん漢字3つ
function makeHardQuestion(e) {
  const pool = shuffle(HARD.filter((x) => x !== e && !sharesReading(x, e)));
  const picked = [];
  for (const x of pool) {
    if (picked.length === 3) break;
    if (picked.some((p) => sharesReading(p, x))) continue;
    picked.push(x);
  }
  const choices = shuffle([e, ...picked]).map((x) => ({ k: x.k, correct: x === e }));
  return { level: 'hard', item: e, choices };
}

function renderComposed(tsukuri) {
  const s = document.createElement('span');
  s.className = 'kc';
  s.innerHTML = `<span class="h">魚</span><span class="t"></span>`;
  s.querySelector('.t').textContent = tsukuri;
  return s;
}

// ---- 画面切替 ----
function show(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
  window.scrollTo(0, 0);
}

// ---- ランキング（端末内に保存） ----
function loadRanking() {
  try { return JSON.parse(localStorage.getItem(RANK_KEY)) || []; } catch { return []; }
}
function saveRanking(list) {
  try { localStorage.setItem(RANK_KEY, JSON.stringify(list)); } catch {}
}
function compareRecord(a, b) {
  return b.correct - a.correct || a.time - b.time;
}
function renderRanking(highlightId) {
  const ol = $('ranking');
  ol.innerHTML = '';
  for (const r of loadRanking()) {
    const li = document.createElement('li');
    if (r.id === highlightId) li.className = 'me';
    li.innerHTML = `<span class="rn"></span><span class="rs">${r.correct}問 / ${r.time.toFixed(1)}秒</span>`;
    li.querySelector('.rn').textContent = r.name;
    ol.appendChild(li);
  }
}

// ---- ゲーム進行 ----
let game = null;
let timerId = null;

function startGame() {
  const name = $('player-name').value.trim() || 'ななしの釣り人';
  try { localStorage.setItem(NAME_KEY, name); } catch {}
  const qs = [
    ...shuffle(EASY).slice(0, EASY_COUNT).map(makeEasyQuestion),
    ...shuffle(HARD).slice(0, HARD_COUNT).map(makeHardQuestion),
  ];
  game = { name, qs, index: 0, correct: 0, elapsed: 0, qStart: 0, answers: [] };
  show('screen-quiz');
  showQuestion();
}

function currentTime() {
  return game.elapsed + (game.qStart ? (performance.now() - game.qStart) / 1000 : 0);
}

function tick() {
  $('q-time').textContent = currentTime().toFixed(1) + '秒';
}

function showQuestion() {
  const q = game.qs[game.index];
  $('q-num').textContent = `${game.index + 1} / ${TOTAL}`;
  $('q-score').textContent = `正解 ${game.correct}`;
  $('progress-bar').style.width = (game.index / TOTAL * 100) + '%';
  const badge = $('q-level');
  badge.textContent = q.level === 'easy' ? 'お馴染み' : '難読';
  badge.className = 'badge' + (q.level === 'hard' ? ' hard' : '');

  const qt = $('q-text');
  qt.innerHTML = q.level === 'easy'
    ? '「<b></b>」の<b style="font-size:inherit;color:inherit">本物</b>の漢字はどれ？'
    : '「<b></b>」と読む漢字はどれ？';
  qt.querySelector('b').textContent = q.item.y[0];

  const box = $('choices');
  box.innerHTML = '';
  q.choices.forEach((c, i) => {
    const b = document.createElement('button');
    b.className = 'choice';
    if (q.level === 'easy') b.appendChild(renderComposed(c.t));
    else b.textContent = c.k;
    b.addEventListener('click', () => answer(i));
    box.appendChild(b);
  });
  $('feedback').innerHTML = '';

  game.qStart = performance.now();
  clearInterval(timerId);
  timerId = setInterval(tick, 100);
  tick();
}

function answer(i) {
  const q = game.qs[game.index];
  // タイムは回答までの時間だけを計測（正誤表示中は止める）
  game.elapsed = currentTime();
  game.qStart = 0;
  clearInterval(timerId);
  tick();

  const ok = q.choices[i].correct;
  if (ok) game.correct++;
  game.answers.push({ item: q.item, ok });
  $('q-score').textContent = `正解 ${game.correct}`;

  const buttons = [...$('choices').children];
  buttons.forEach((b, j) => {
    b.disabled = true;
    if (q.choices[j].correct) b.classList.add('ok');
    else if (j === i) b.classList.add('ng');
  });

  const fb = $('feedback');
  const yomi = q.item.y.join('・');
  fb.innerHTML = ok
    ? `<span class="ok">○ 正解！</span> <span class="k"></span>（${yomi}）`
    : `<span class="ng">× 残念…</span> 正解は <span class="k"></span>（${yomi}）`;
  fb.querySelector('.k').textContent = q.item.k;

  setTimeout(next, ok ? 700 : 1500);
}

function next() {
  game.index++;
  if (game.index < TOTAL) showQuestion();
  else finish();
}

function finish() {
  $('progress-bar').style.width = '100%';
  const time = Math.round(game.elapsed * 10) / 10;
  const rec = { id: Date.now() + '-' + Math.random(), name: game.name, correct: game.correct, time, date: new Date().toISOString() };
  const list = [...loadRanking(), rec].sort(compareRecord);
  const rank = list.indexOf(rec) + 1;
  saveRanking(list.slice(0, 10));

  $('r-correct').textContent = game.correct;
  $('r-time').textContent = time.toFixed(1);
  $('r-rank').textContent = rank <= 10 ? `ランキング ${rank} 位！` : 'ランキング圏外…もう一度挑戦！';

  const ol = $('review');
  ol.innerHTML = '';
  for (const a of game.answers) {
    const li = document.createElement('li');
    li.innerHTML = `<span class="${a.ok ? 'mark-ok' : 'mark-ng'}">${a.ok ? '○' : '×'}</span> <span class="k"></span><span class="y"></span>`;
    li.querySelector('.k').textContent = a.item.k;
    li.querySelector('.y').textContent = a.item.y.join('・');
    ol.appendChild(li);
  }
  renderRanking(rec.id);
  show('screen-result');
}

// ---- 図鑑 ----
function renderZukan() {
  const fill = (id, items) => {
    const el = $(id);
    el.innerHTML = '';
    for (const e of items) {
      const d = document.createElement('div');
      d.innerHTML = '<span class="k"></span><span class="y"></span>';
      d.querySelector('.k').textContent = e.k;
      d.querySelector('.y').textContent = e.y.join('・');
      el.appendChild(d);
    }
  };
  fill('zukan-easy', EASY);
  fill('zukan-hard', HARD);
  $('z-count').textContent = `全${ALL.length}字`;
  show('screen-zukan');
}

// ---- 初期化 ----
try { $('player-name').value = localStorage.getItem(NAME_KEY) || ''; } catch {}
renderRanking();
$('btn-start').addEventListener('click', startGame);
$('btn-retry').addEventListener('click', startGame);
$('btn-home').addEventListener('click', () => { renderRanking(); show('screen-title'); });
$('btn-zukan').addEventListener('click', renderZukan);
document.querySelectorAll('[data-home]').forEach((b) => b.addEventListener('click', () => show('screen-title')));
