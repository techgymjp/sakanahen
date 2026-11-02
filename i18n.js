'use strict';

// 日本語／英語の切り替え
const LANG_KEY = 'sakanahen-lang';

// 読み → 英語名（英語モードの出題・選択肢・図鑑で使う）
const EN_NAME = {
  まぐろ: 'tuna', たい: 'sea bream', さけ: 'salmon', さば: 'mackerel', いわし: 'sardine',
  あじ: 'horse mackerel', かつお: 'bonito', うなぎ: 'eel', こい: 'carp', あゆ: 'sweetfish',
  たら: 'cod', ぶり: 'yellowtail', さめ: 'shark', くじら: 'whale', かれい: 'flatfish',
  ひらめ: 'olive flounder', さわら: 'Spanish mackerel', ふな: 'crucian carp', なまず: 'catfish',
  ます: 'trout', わに: 'crocodile', あわび: 'abalone', しゃち: 'orca', きす: 'sillago',
  すし: 'sushi', ぼら: 'mullet', すずき: 'sea bass', にしん: 'herring', うろこ: 'fish scale',
  えら: 'gill', ひれ: 'fin', あんこう: 'anglerfish', はたはた: 'sandfish', はも: 'pike conger',
  かじか: 'sculpin', ふか: 'shark', どじょう: 'loach', あさり: 'short-neck clam', ほっけ: 'Atka mackerel',
  たちうお: 'cutlassfish', えり: 'fish trap', かます: 'barracuda', たなご: 'bitterling',
  ふぐ: 'pufferfish', はまち: 'young yellowtail', あおうみがめ: 'green sea turtle', ほうぼう: 'gurnard',
  おしきうお: 'bream', かがみだい: 'mirror dory', えび: 'shrimp', いか: 'squid', とど: 'sea lion',
  ちちぶ: 'goby', はぜ: 'goby', えつ: 'grenadier anchovy', いわな: 'char', しろうお: 'ice goby',
  みごい: 'chub', はや: 'minnow', かわはぎ: 'filefish', なまぐさい: 'fishy smell', このしろ: 'gizzard shad',
  はまぐり: 'hard clam', はらご: 'fish roe', にごい: 'barbel', せいご: 'young sea bass',
  からすみ: 'dried mullet roe', あざやか: 'vivid', こち: 'flathead', まて: 'razor clam',
  ごり: 'river goby', めばる: 'rockfish', にべ: 'croaker', いしもち: 'white croaker', たこ: 'octopus',
  ほしうお: 'dried fish', いるか: 'dolphin', そうぎょ: 'grass carp', あめのうお: 'Biwa trout',
  はえ: 'minnow', うぐい: 'Japanese dace', すばしり: 'young mullet', かずのこ: 'herring roe',
  はらわた: 'guts', かど: 'herring', さんしょううお: 'giant salamander', するめ: 'dried squid',
  むつ: 'gnomefish', まながつお: 'pomfret', せんざんこう: 'pangolin', すけそう: 'Alaska pollock',
  ひしこ: 'anchovy', おこぜ: 'stonefish', ひがい: 'gudgeon', むろあじ: 'round scad', わかさぎ: 'smelt',
  はらか: 'young yellowtail', うみえび: 'sea shrimp', はす: 'hasu', やもお: 'widower', えい: 'ray',
  とびうお: 'flying fish', おおがめ: 'giant turtle', うきぶくろ: 'swim bladder', すっぽん: 'softshell turtle',
  いさざ: 'isaza goby', かじき: 'marlin', うつぼ: 'moray eel', ごまめ: 'dried sardines',
  うみへび: 'sea snake', ちょうざめ: 'sturgeon', えそ: 'lizardfish', やもめ: 'widow',
  かぶとがに: 'horseshoe crab', なます: 'vinegared raw fish', ぎぎ: 'bagrid catfish', しいら: 'mahi-mahi',
  さより: 'halfbeak', ひもの: 'dried fish', くさる: 'to rot', あたらしい: 'fresh', つる: 'to fish',
};

// ひらがな → ローマ字（ヘボン式・長音はそのまま）
const KANA = {
  あ: 'a', い: 'i', う: 'u', え: 'e', お: 'o', か: 'ka', き: 'ki', く: 'ku', け: 'ke', こ: 'ko',
  さ: 'sa', し: 'shi', す: 'su', せ: 'se', そ: 'so', た: 'ta', ち: 'chi', つ: 'tsu', て: 'te', と: 'to',
  な: 'na', に: 'ni', ぬ: 'nu', ね: 'ne', の: 'no', は: 'ha', ひ: 'hi', ふ: 'fu', へ: 'he', ほ: 'ho',
  ま: 'ma', み: 'mi', む: 'mu', め: 'me', も: 'mo', や: 'ya', ゆ: 'yu', よ: 'yo',
  ら: 'ra', り: 'ri', る: 'ru', れ: 're', ろ: 'ro', わ: 'wa', を: 'o', ん: 'n',
  が: 'ga', ぎ: 'gi', ぐ: 'gu', げ: 'ge', ご: 'go', ざ: 'za', じ: 'ji', ず: 'zu', ぜ: 'ze', ぞ: 'zo',
  だ: 'da', ぢ: 'ji', づ: 'zu', で: 'de', ど: 'do', ば: 'ba', び: 'bi', ぶ: 'bu', べ: 'be', ぼ: 'bo',
  ぱ: 'pa', ぴ: 'pi', ぷ: 'pu', ぺ: 'pe', ぽ: 'po',
};
const SMALL = { ゃ: 'ya', ゅ: 'yu', ょ: 'yo' };

function romaji(kana) {
  let out = '';
  let double = false;
  for (let i = 0; i < kana.length; i++) {
    const ch = kana[i];
    if (ch === 'っ') { double = true; continue; }
    let r = KANA[ch] ?? ch;
    const small = SMALL[kana[i + 1]];
    if (small) {
      // しゃ→sha, ちゃ→cha, じゃ→ja, きゃ→kya
      r = /^(sh|ch|j)/.test(r) ? r.slice(0, -1) + small.slice(1) : r.slice(0, -1) + small;
      i++;
    }
    if (double) { out += r[0] === 'c' ? 't' : r[0]; double = false; }
    out += r;
  }
  return out;
}

const TEXT = {
  ja: {
    title: 'さかなへんクイズ',
    logo: 'さかなへん<br>クイズ',
    langBtn: 'EN',
    lead: '全20問・4択',
    start: 'スタート！',
    howto: 'あそびかた',
    ranking: 'ランキング',
    zukan: '図鑑',
    zukanTitle: '漢字図鑑',
    back: '← もどる',
    rules: [
      '<b>全20問・4択</b>のクイズです。',
      '<b>前半 8問</b>（お馴染みの魚）<br>読みに合う本物の漢字を、そっくりな<b>ニセ漢字</b>の中から見抜こう。',
      '<b>後半 12問</b>（難読の魚）<br>漢字を見て、正しい<b>読み</b>を選ぼう。',
      '順位は <b>正解数</b> → <b>タイム</b> の順で決まります。タイムは答えるまでの時間だけを数えます。',
      '右上の 🔊 で音のオン・オフができます。',
    ],
    easyBadge: 'お馴染み',
    hardBadge: '難読',
    easyQ: '「<b></b>」の<em>本物</em>の漢字はどれ？',
    hardQ: 'この漢字の<em>読み</em>はどれ？',
    correct: '○ 正解！',
    wrong: '× 残念…',
    answerIs: '正解は',
    resultTitle: '🎉 けっか 🎉',
    lblCorrect: '正解数',
    lblTime: 'タイム',
    sec: '秒',
    rankIn: (n) => `🏆 ランキング ${n} 位！`,
    rankOut: 'ランキング圏外…もう一度挑戦！',
    rankRow: (c, t) => `${c}問 / ${t}秒`,
    rankEmpty: 'まだ記録がないよ。',
    shareLabel: '結果をシェアしよう！',
    shareX: '𝕏 ポスト',
    shareMore: 'その他',
    copy: 'リンクをコピー',
    copied: 'コピーしました！',
    copyFailed: 'コピーできませんでした',
    shareText: (total, c, t, r) => `さかなへんクイズで ${total}問中${c}問正解！ タイム${t}秒${r ? `（やり直し${r}回）` : ''}🐟 #さかなへんクイズ`,
    shareApp: '📤 結果をシェア',
    best: (c, t) => `ベスト：${c}問 / ${t}秒`,
    privacy: 'プライバシーポリシー',
    privacyUrl: 'https://techgym.jp/privacy-policy/',
    adSettings: '広告の設定',
    pauseTitle: '⏸ 一時停止中',
    resume: '再開',
    pause: '一時停止',
    redoWatch: '📺 広告を見てこの問題をやり直す',
    redoNote: (n, max) => `やり直しはあと ${n} 回（1ゲーム ${max} 回まで）`,
    redoNext: (s) => `次の問題へ（${s}）`,
    redoLoading: '広告を読み込み中…',
    redoFail: '広告を読み込めませんでした',
    redoUsed: (n) => `やり直し ${n} 回`,
    retry: 'もう一度！',
    home: 'タイトルへ',
    review: 'ふりかえり',
    zukanEasy: '🐟 お馴染みの魚',
    zukanHard: '🐡 難読の魚へん',
    zukanCount: (n) => `全${n}字`,
    mute: '音のオン・オフ',
  },
  en: {
    title: 'Sakanahen Kanji Quiz',
    logo: 'Sakanahen<br>Quiz',
    langBtn: '日本語',
    lead: '20 questions · 4 choices',
    start: 'Start!',
    howto: 'How to play',
    ranking: 'Ranking',
    zukan: 'Kanji list',
    zukanTitle: 'Kanji list',
    back: '← Back',
    rules: [
      'A <b>20-question, 4-choice</b> quiz on kanji with the fish radical 魚.',
      '<b>Questions 1–8</b> (familiar fish)<br>Find the <b>real kanji</b> among look-alike <b>fake kanji</b>.',
      '<b>Questions 9–20</b> (hard fish)<br>Look at the kanji and choose what it <b>means</b>.',
      'Ranking is decided by <b>correct answers</b>, then <b>time</b>. Only the time spent answering counts.',
      'Tap 🔊 at the top right to turn sound on or off.',
    ],
    easyBadge: 'Familiar',
    hardBadge: 'Hard',
    easyQ: 'Which is the <em>real</em> kanji for “<b></b>”?',
    hardQ: 'What does this kanji <em>mean</em>?',
    correct: '○ Correct!',
    wrong: '× Wrong…',
    answerIs: 'Answer:',
    resultTitle: '🎉 Results 🎉',
    lblCorrect: 'Correct',
    lblTime: 'Time',
    sec: 's',
    rankIn: (n) => `🏆 Rank #${n}!`,
    rankOut: 'Not in the top 10… try again!',
    rankRow: (c, t) => `${c} correct / ${t}s`,
    rankEmpty: 'No records yet.',
    shareLabel: 'Share your result!',
    shareX: '𝕏 Post',
    shareMore: 'More',
    copy: 'Copy link',
    copied: 'Copied!',
    copyFailed: 'Could not copy',
    shareText: (total, c, t, r) => `I got ${c}/${total} on the Sakanahen Kanji Quiz in ${t}s${r ? ` (${r} retr${r === 1 ? 'y' : 'ies'})` : ''} 🐟 #さかなへんクイズ`,
    shareApp: '📤 Share result',
    best: (c, t) => `Best: ${c} correct / ${t}s`,
    privacy: 'Privacy policy',
    privacyUrl: 'https://techgym.jp/privacy-policy-en/',
    adSettings: 'Ad settings',
    pauseTitle: '⏸ Paused',
    resume: 'Resume',
    pause: 'Pause',
    redoWatch: '📺 Watch an ad to retry this question',
    redoNote: (n, max) => `${n} retr${n === 1 ? 'y' : 'ies'} left (up to ${max} per game)`,
    redoNext: (s) => `Next question (${s})`,
    redoLoading: 'Loading ad…',
    redoFail: 'Could not load the ad',
    redoUsed: (n) => `${n} retr${n === 1 ? 'y' : 'ies'} used`,
    retry: 'Play again!',
    home: 'Title',
    review: 'Review',
    zukanEasy: '🐟 Familiar fish',
    zukanHard: '🐡 Hard fish kanji',
    zukanCount: (n) => `${n} kanji`,
    mute: 'Sound on/off',
  },
};

let lang = (() => {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'ja' || saved === 'en') return saved;
  } catch {}
  return (navigator.language || 'ja').toLowerCase().startsWith('ja') ? 'ja' : 'en';
})();

function T() { return TEXT[lang]; }

function setLang(l) {
  lang = l;
  try { localStorage.setItem(LANG_KEY, l); } catch {}
}

// 表示用の名前：日本語ならよみ、英語なら英語名
function nameOf(yomi) {
  return lang === 'ja' ? yomi : EN_NAME[yomi];
}

// 正解表示用：日本語は「よみ・よみ」、英語は「tuna (maguro)」
function describe(item) {
  if (lang === 'ja') return item.y.join('・');
  return `${EN_NAME[item.y[0]]} (${item.y.map(romaji).join(', ')})`;
}
