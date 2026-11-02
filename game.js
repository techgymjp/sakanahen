'use strict';

const TOTAL = 20;
const EASY_COUNT = 8;              // 前半：お馴染み（ニセ漢字から選ぶ）
const HARD_COUNT = TOTAL - EASY_COUNT; // 後半：難読（漢字を見て読みを選ぶ）
const RANK_KEY = 'sakanahen-ranking';
// シェアボタンで共有するURL（ゲームの紹介記事）
const SHARE_URL = 'https://techgym.jp/column/claude-code-game-sakanahen/';
const ALL = [...EASY, ...HARD];
// 難読問題に出すのは生き物の漢字だけ（生き物以外の字は図鑑のみ）
const HARD_QUIZ = HARD.filter((e) => e.c !== 'other');

const $ = (id) => document.getElementById(id);

// Android アプリ(Capacitor)で動いているか。Web 版では Capacitor がないので何もしない
const NATIVE = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
const plugin = (name) => (NATIVE && window.Capacitor.Plugins ? window.Capacitor.Plugins[name] : null);
// まちがえた問題を広告を見てやり直せる回数（1 ゲームあたり）
const REDO_MAX = 3;
const REDO_DELAY = 2000; // 正解の表示を読めるよう、少し待ってから案内を出す
const REDO_WAIT = 5;     // 案内を出しておく秒数。過ぎたら次の問題へ

function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// お馴染み問題：正解のつくり＋ニセのつくり3つ（すべて合成描画）
function makeEasyQuestion(e) {
  const choices = shuffle([e.t, ...e.f]).map((t) => ({ t, correct: t === e.t }));
  return { level: 'easy', item: e, choices };
}

// 名前の片方がもう片方を含む（ぶり／yellowtail と young yellowtail など）と紛らわしいので同時に出さない
const similar = (a, b) => a.includes(b) || b.includes(a);

// 難読問題：漢字を見せて、正しい読み（英語では意味）＋同じ分類の実在の名前3つから選ぶ
// 選択肢の名前は魚の名前／魚以外の水の生き物の名前。正解の別名と紛らわしい名前は除く
function makeHardQuestion(e) {
  const taken = e.y.map(nameOf);
  const pool = new Set(ALL.filter((x) => x.c === e.c).map((x) => nameOf(x.y[0])));
  const others = [];
  for (const n of shuffle([...pool])) {
    if (others.length === 3) break;
    if (taken.some((t) => similar(t, n))) continue;
    others.push(n);
    taken.push(n);
  }
  const answer = nameOf(e.y[0]);
  const choices = shuffle([answer, ...others]).map((y) => ({ y, correct: y === answer }));
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
  // 言語の切り替えはタイトル画面だけ（出題中に切り替わらないように）
  $('btn-lang').hidden = id !== 'screen-title';
  // バナー広告は選択肢と重ならない画面だけ（タイトル・あそびかた・ポーズ・結果）
  Ads.setBanner(['screen-title', 'screen-howto', 'screen-pause', 'screen-result'].includes(id));
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
  ol.dataset.empty = T().rankEmpty;
  for (const r of loadRanking()) {
    const li = document.createElement('li');
    if (r.id === highlightId) li.className = 'me';
    const d = new Date(r.date);
    li.innerHTML = `<span class="rn">${T().rankRow(r.correct, r.time.toFixed(1))}</span><span class="rs">${d.getMonth() + 1}/${d.getDate()}</span>`;
    ol.appendChild(li);
  }
}

// ---- ゲーム進行 ----
let game = null;
let timerId = null;

function startGame() {
  const qs = [
    ...shuffle(EASY).slice(0, EASY_COUNT).map(makeEasyQuestion),
    ...shuffle(HARD_QUIZ).slice(0, HARD_COUNT).map(makeHardQuestion),
  ];
  game = { qs, index: 0, correct: 0, elapsed: 0, qStart: 0, qBase: 0, answers: [], redoUsed: 0, phase: 'question' };
  Sound.start();
  Sound.bgmStart();
  show('screen-quiz');
  showQuestion();
}

function currentTime() {
  return game.elapsed + (game.qStart ? (performance.now() - game.qStart) / 1000 : 0);
}

function tick() {
  $('q-time').textContent = '⏱ ' + currentTime().toFixed(1);
}

function showQuestion() {
  const q = game.qs[game.index];
  $('q-num').textContent = `${game.index + 1} / ${TOTAL}`;
  $('q-score').textContent = `⭕ ${game.correct}`;
  $('progress-bar').style.width = (game.index / TOTAL * 100) + '%';
  const badge = $('q-level');
  badge.textContent = q.level === 'easy' ? T().easyBadge : T().hardBadge;
  badge.className = 'chip badge' + (q.level === 'hard' ? ' hard' : '');

  const qt = $('q-text');
  if (q.level === 'easy') {
    qt.innerHTML = T().easyQ;
    qt.querySelector('b').textContent = nameOf(q.item.y[0]);
  } else {
    qt.innerHTML = '<span class="q-kanji"></span>' + T().hardQ;
    qt.querySelector('.q-kanji').textContent = q.item.k;
  }

  const box = $('choices');
  box.innerHTML = '';
  q.choices.forEach((c, i) => {
    const b = document.createElement('button');
    b.className = 'choice' + (q.level === 'hard' ? ' yomi' : '');
    if (q.level === 'easy') b.appendChild(renderComposed(c.t));
    else b.textContent = c.y;
    b.addEventListener('click', () => answer(i));
    box.appendChild(b);
  });
  $('feedback').innerHTML = '';
  Sound.bubble();

  game.phase = 'question';
  game.qBase = game.elapsed; // やり直すときはこの問題にかけた時間も取り消す
  game.qStart = performance.now();
  clearInterval(timerId);
  timerId = setInterval(tick, 100);
  tick();
}

function answer(i) {
  if (game.phase !== 'question') return;
  game.phase = 'feedback';
  const q = game.qs[game.index];
  // タイムは回答までの時間だけを計測（正誤表示中は止める）
  game.elapsed = currentTime();
  game.qStart = 0;
  clearInterval(timerId);
  tick();

  const ok = q.choices[i].correct;
  if (ok) game.correct++;
  game.answers.push({ item: q.item, ok });
  $('q-score').textContent = `⭕ ${game.correct}`;
  if (ok) Sound.correct(); else Sound.wrong();

  const buttons = [...$('choices').children];
  buttons.forEach((b, j) => {
    b.disabled = true;
    if (q.choices[j].correct) b.classList.add('ok');
    else if (j === i) b.classList.add('ng');
    else b.classList.add('dim');
  });
  if (ok) burst(buttons[i]);

  const fb = $('feedback');
  fb.innerHTML = ok
    ? `<span class="ok">${T().correct}</span> <span class="k"></span><span class="y"></span>`
    : `<span class="ng">${T().wrong}</span> ${T().answerIs} <span class="k"></span><span class="y"></span>`;
  fb.querySelector('.k').textContent = q.item.k;
  fb.querySelector('.y').textContent = lang === 'ja' ? `（${describe(q.item)}）` : ` ${describe(q.item)}`;

  if (ok) setTimeout(next, 700);
  else if (canRedo()) setTimeout(offerRedo, REDO_DELAY);
  else setTimeout(next, 1500);
}

function next() {
  game.index++;
  if (game.index < TOTAL) showQuestion();
  else finish();
}

function finish() {
  game.phase = 'done';
  $('progress-bar').style.width = '100%';
  const time = Math.round(game.elapsed * 10) / 10;
  const rec = { id: Date.now() + '-' + Math.random(), correct: game.correct, time, date: new Date().toISOString() };
  const list = [...loadRanking(), rec].sort(compareRecord);
  const rank = list.indexOf(rec) + 1;
  saveRanking(list.slice(0, 10));

  $('r-correct').textContent = game.correct;
  $('r-time').textContent = time.toFixed(1);
  $('r-rank').textContent = rank <= 10 ? T().rankIn(rank) : T().rankOut;
  $('r-redo').hidden = !game.redoUsed;
  $('r-redo').textContent = T().redoUsed(game.redoUsed);
  Sound.bgmStop();
  Sound.fanfare(game.correct >= TOTAL / 2);

  const ol = $('review');
  ol.innerHTML = '';
  for (const a of game.answers) {
    const li = document.createElement('li');
    li.innerHTML = `<span class="${a.ok ? 'mark-ok' : 'mark-ng'}">${a.ok ? '○' : '×'}</span><span class="k"></span><span class="y"></span>`;
    li.querySelector('.k').textContent = a.item.k;
    li.querySelector('.y').textContent = describe(a.item);
    ol.appendChild(li);
  }
  renderRanking(rec.id);
  setupShare(game.correct, time, game.redoUsed);
  show('screen-result');
}

// ---- シェア ----
function setupShare(correct, time, redoUsed) {
  const url = SHARE_URL;
  const text = T().shareText(TOTAL, correct, time.toFixed(1), redoUsed);
  const enc = encodeURIComponent;
  $('share-x').href = `https://x.com/intent/post?text=${enc(text)}&url=${enc(url)}`;
  $('share-line').href = `https://social-plugins.line.me/lineit/share?url=${enc(url)}&text=${enc(text)}`;
  $('share-fb').href = `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`;
  // スマホなどOSの共有メニューが使える場合だけ「その他」を出す
  const more = $('share-more');
  more.hidden = !navigator.share;
  more.onclick = () => navigator.share({ title: T().title, text, url }).catch(() => {});
  // アプリでは Android の共有メニューだけを出す
  const nativeShare = plugin('Share');
  if (nativeShare) {
    for (const id of ['share-x', 'share-line', 'share-fb', 'share-copy']) $(id).hidden = true;
    more.hidden = false;
    more.textContent = T().shareApp;
    more.onclick = () => nativeShare.share({ title: T().title, text, url, dialogTitle: T().shareApp }).catch(() => {});
  }
  const copy = $('share-copy');
  copy.textContent = T().copy;
  copy.onclick = async () => {
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      copy.textContent = T().copied;
    } catch {
      copy.textContent = T().copyFailed;
    }
  };
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
      d.querySelector('.y').textContent = describe(e);
      el.appendChild(d);
    }
  };
  fill('zukan-easy', EASY);
  fill('zukan-hard', HARD);
  $('z-count').textContent = T().zukanCount(ALL.length);
  show('screen-zukan');
}

// ---- 演出 ----
// 正解したボタンから泡と魚を飛ばす
function burst(el) {
  const r = el.getBoundingClientRect();
  const icons = ['🫧', '🫧', '🐟', '🐠', '✨'];
  for (let n = 0; n < 10; n++) {
    const s = document.createElement('span');
    s.className = 'burst';
    s.textContent = icons[n % icons.length];
    const a = Math.random() * Math.PI * 2;
    const d = 70 + Math.random() * 70;
    s.style.left = r.left + r.width / 2 - 13 + 'px';
    s.style.top = r.top + r.height / 2 - 13 + 'px';
    s.style.setProperty('--dx', Math.cos(a) * d + 'px');
    s.style.setProperty('--dy', Math.sin(a) * d + 'px');
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 900);
  }
}

// 背景の泡と泳ぐ魚
function makeSea() {
  const sea = $('sea');
  for (let n = 0; n < 16; n++) {
    const b = document.createElement('span');
    b.className = 'bubble';
    const size = 8 + Math.random() * 28;
    b.style.width = b.style.height = size + 'px';
    b.style.left = Math.random() * 100 + '%';
    b.style.animationDuration = 8 + Math.random() * 10 + 's';
    b.style.animationDelay = -Math.random() * 18 + 's';
    sea.appendChild(b);
  }
  ['🐟', '🐠', '🐡', '🦈'].forEach((f, n) => {
    const s = document.createElement('span');
    s.className = 'swim' + (n % 2 ? ' rev' : '');
    s.textContent = f;
    s.style.top = 12 + n * 22 + '%';
    s.style.animationDuration = 18 + n * 6 + 's';
    s.style.animationDelay = -n * 5 + 's';
    sea.appendChild(s);
  });
}

// ---- 一時停止 ----
// 出題中だけ止められる。止めている間はタイムを数えず、問題も隠す
function pauseGame() {
  if (!game || game.phase !== 'question') return;
  game.elapsed = currentTime();
  game.qStart = 0;
  clearInterval(timerId);
  game.phase = 'paused';
  show('screen-pause');
}

function resumeGame() {
  if (!game || game.phase !== 'paused') return;
  withInterstitial(() => {
    show('screen-quiz');
    game.phase = 'question';
    game.qStart = performance.now();
    timerId = setInterval(tick, 100);
    tick();
  });
}

// ---- 全画面広告(アプリのみ) ----
let adBusy = false;
async function withInterstitial(then) {
  if (adBusy) return;
  if (Ads.available) {
    adBusy = true;
    await Ads.showInterstitial(3000);
    adBusy = false;
  }
  then();
}

function goTitle() {
  withInterstitial(() => {
    if (game && game.phase !== 'done') { clearInterval(timerId); game.phase = 'done'; }
    renderBest();
    Sound.bgmStart();
    show('screen-title');
  });
}

// ---- リワード広告のチート: まちがえた問題をやり直す(アプリのみ・1 ゲーム REDO_MAX 回まで) ----
// まちがえたら正解を見せたあとで「広告を見てこの問題をやり直す」を出す。最後まで見たら、その問題の結果と
// かかった時間を取り消して、同じ問題（同じ選択肢・同じ並び）をもう一度出す
const redo = { timer: null, left: 0, busy: false };

function canRedo() {
  return Ads.canReward && game.redoUsed < REDO_MAX;
}

function offerRedo() {
  if (game.phase !== 'feedback') return;
  game.phase = 'redo';
  Object.assign(redo, { left: REDO_WAIT, busy: false });
  $('redo-watch').disabled = false;
  $('redo-watch').textContent = T().redoWatch;
  $('redo-note').textContent = T().redoNote(REDO_MAX - game.redoUsed, REDO_MAX);
  $('redo-next').textContent = T().redoNext(redo.left);
  $('redo').hidden = false;
  redo.timer = setInterval(() => {
    if (redo.busy) return;
    redo.left--;
    $('redo-next').textContent = T().redoNext(Math.max(0, redo.left));
    if (redo.left <= 0 && closeRedo()) next();
  }, 1000);
}

// 案内を閉じる。案内が出ていなければ false
function closeRedo() {
  if (game.phase !== 'redo') return false;
  clearInterval(redo.timer);
  $('redo').hidden = true;
  game.phase = 'feedback';
  return true;
}

async function watchRedo() {
  if (game.phase !== 'redo' || redo.busy) return;
  redo.busy = true;
  $('redo-watch').disabled = true;
  $('redo-watch').textContent = T().redoLoading;
  const result = await Ads.showRewarded();
  if (result === 'unavailable') {
    $('redo-note').textContent = T().redoFail;
    setTimeout(() => { if (closeRedo()) next(); }, 1500);
    return;
  }
  closeRedo();
  if (result !== 'rewarded') { next(); return; }
  // まちがえた結果とかかった時間を取り消して、同じ問題をもう一度
  game.answers.pop();
  game.elapsed = game.qBase;
  game.redoUsed++;
  showQuestion();
}

// タイトル画面のベスト記録
function renderBest() {
  const top = loadRanking()[0];
  $('best').hidden = !top;
  if (top) $('best').textContent = T().best(top.correct, top.time.toFixed(1));
}

// ---- 言語 ----
// data-t の付いた要素と、あそびかたの説明を今の言語の文言にする
function applyLang() {
  const t = T();
  renderBest();
  $('privacyLink').href = t.privacyUrl;
  document.documentElement.lang = lang;
  document.title = t.title;
  document.querySelectorAll('[data-t]').forEach((el) => { el.innerHTML = t[el.dataset.t]; });
  $('rules').innerHTML = t.rules.map((r) => `<li>${r}</li>`).join('');
  $('btn-lang').textContent = t.langBtn;
  $('btn-mute').setAttribute('aria-label', t.mute);
}

// ---- 初期化 ----
makeSea();
applyLang();
$('btn-lang').addEventListener('click', () => {
  setLang(lang === 'ja' ? 'en' : 'ja');
  applyLang();
});
$('btn-mute').textContent = Sound.muted ? '🔇' : '🔊';
$('btn-mute').addEventListener('click', () => { $('btn-mute').textContent = Sound.toggle() ? '🔇' : '🔊'; });
document.querySelectorAll('#btn-zukan, #btn-home, #btn-lang, #btn-howto-back, #btn-pause, #btn-pause-home, #btn-resume, #redo-next, [data-home], [data-go], .share-btn').forEach((b) => b.addEventListener('click', () => Sound.tap()));
document.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => {
  if (b.dataset.go === 'screen-rank') renderRanking();
  show(b.dataset.go);
}));
// ブラウザは操作があるまで音を出せないので、最初の操作でBGMを始める
document.addEventListener('pointerdown', () => Sound.bgmStart(), { once: true });
// 「スタート」「もう一度」「タイトルへ」「再開」のたびに全画面広告（アプリのみ）
$('btn-start').addEventListener('click', () => withInterstitial(startGame));
$('btn-start2').addEventListener('click', () => withInterstitial(startGame));
$('btn-retry').addEventListener('click', () => withInterstitial(startGame));
$('btn-home').addEventListener('click', goTitle);
$('btn-howto-back').addEventListener('click', goTitle);
$('btn-pause-home').addEventListener('click', goTitle);
$('btn-pause').addEventListener('click', pauseGame);
$('btn-resume').addEventListener('click', resumeGame);
$('redo-watch').addEventListener('click', watchRedo);
$('redo-next').addEventListener('click', () => { if (closeRedo()) next(); });
$('btn-zukan').addEventListener('click', renderZukan);
document.querySelectorAll('[data-home]').forEach((b) => b.addEventListener('click', () => show('screen-title')));

// 裏に回ったら一時停止して音を止める(広告の表示中は広告側が音を止めている)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    pauseGame();
    Sound.suspend();
  } else if (!Ads.showing) {
    Sound.resume();
  }
});

// Android の戻るボタン: 出題中は一時停止(一時停止中なら再開)、タイトル・結果画面ではアプリを閉じる
if (plugin('App')) {
  plugin('App').addListener('backButton', () => {
    if (adBusy) return;
    const screen = document.querySelector('.screen.active').id;
    if (screen === 'screen-title' || screen === 'screen-result') plugin('App').exitApp();
    else if (screen === 'screen-howto') goTitle();
    else if (screen === 'screen-pause') resumeGame();
    else if (screen === 'screen-quiz') pauseGame();
    else show('screen-title');
  });
}

// タイトル画面の下に、バージョン(アプリ版)・プライバシーポリシー・広告の設定(EU など)を出す
if (NATIVE) {
  document.body.classList.add('native');
  $('legal').hidden = false;
  if (window.APP_VERSION && window.APP_VERSION !== 'dev') $('buildInfo').textContent = window.APP_VERSION;
  Ads.initDone.then(() => { if (Ads.privacyOptionsRequired) $('adPrivacy').hidden = false; });
  $('adPrivacyLink').addEventListener('click', (e) => { e.preventDefault(); Ads.showPrivacyOptions(); });
}
show('screen-title');
