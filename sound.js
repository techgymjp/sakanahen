'use strict';

// 効果音（Web Audio API で合成。音声ファイル不要）
const Sound = (() => {
  const MUTE_KEY = 'sakanahen-mute';
  let ctx = null;
  let muted = false;
  try { muted = localStorage.getItem(MUTE_KEY) === '1'; } catch {}

  function ac() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // 1音を鳴らす。start は今からの秒数
  function tone(freq, start, dur, { type = 'sine', vol = 0.2, slideTo = null } = {}) {
    const c = ac();
    if (!c || muted) return;
    const t = c.currentTime + start;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  return {
    get muted() { return muted; },
    toggle() {
      muted = !muted;
      try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch {}
      if (!muted) this.tap();
      return muted;
    },
    // ボタンを押した「ポコッ」
    tap() { tone(520, 0, 0.09, { type: 'triangle', vol: 0.25, slideTo: 880 }); },
    // スタート
    start() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.07, 0.16, { type: 'square', vol: 0.08 }));
    },
    // 出題の「ぷくっ」（泡の音）
    bubble() { tone(300, 0, 0.12, { type: 'sine', vol: 0.18, slideTo: 900 }); },
    // 正解「ピンポン♪」
    correct() {
      tone(1319, 0, 0.18, { type: 'sine', vol: 0.3 });
      tone(1047, 0.14, 0.35, { type: 'sine', vol: 0.3 });
      tone(2637, 0, 0.1, { type: 'triangle', vol: 0.05 });
    },
    // 不正解「ブブー」
    wrong() {
      tone(180, 0, 0.18, { type: 'sawtooth', vol: 0.12 });
      tone(150, 0.2, 0.32, { type: 'sawtooth', vol: 0.12, slideTo: 110 });
    },
    // 結果発表のファンファーレ
    fanfare(good) {
      const notes = good
        ? [[523, 0], [523, 0.12], [523, 0.24], [659, 0.36], [784, 0.6], [1047, 0.84]]
        : [[392, 0], [349, 0.18], [330, 0.36], [262, 0.6]];
      notes.forEach(([f, s], i) => tone(f, s, i === notes.length - 1 ? 0.6 : 0.16, { type: 'square', vol: 0.08 }));
      if (good) [784, 1047, 1319].forEach((f) => tone(f, 0.84, 0.6, { type: 'triangle', vol: 0.06 }));
    },
  };
})();
