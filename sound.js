'use strict';

// 効果音とBGM（Web Audio API で合成。音声ファイル不要）
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

  // 1音を鳴らす。start は今からの秒数（at を渡すと絶対時刻）
  // sustain: true なら音量を保ったまま鳴らし、最後だけ短く消す（ブザー向け）
  function tone(freq, start, dur, { type = 'sine', vol = 0.2, slideTo = null, at = null, sustain = false } = {}) {
    const c = ac();
    if (!c || muted) return;
    const t = at ?? c.currentTime + start;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    if (sustain) gain.gain.setValueAtTime(vol, t + dur - 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  // ---- BGM：8分音符で4小節をくり返す（0 は休符、数字は MIDI ノート番号） ----
  const STEP = 60 / 140 / 2; // テンポ140の8分音符
  const MELODY = [
    72, 76, 79, 76, 77, 81, 79, 0,
    76, 79, 84, 79, 81, 79, 76, 0,
    74, 77, 81, 77, 79, 77, 74, 0,
    67, 71, 74, 77, 76, 74, 72, 0,
  ];
  // ベースは4分音符（C → C/Am → Dm → G）
  const BASS = [48, 55, 48, 55, 48, 55, 45, 52, 50, 57, 50, 57, 43, 50, 43, 47];
  const midi = (n) => 440 * 2 ** ((n - 69) / 12);
  let bgmTimer = null;
  let step = 0;
  let nextAt = 0;

  // 少し先までの音を予約しておく（タイマーのずれで音がもたつかないように）
  function schedule() {
    const c = ac();
    if (!c || muted) return;
    while (nextAt < c.currentTime + 0.12) {
      const m = MELODY[step % MELODY.length];
      if (m) tone(midi(m), 0, STEP * 0.9, { type: 'square', vol: 0.035, at: nextAt });
      if (step % 2 === 0) {
        const b = BASS[(step / 2) % BASS.length];
        tone(midi(b), 0, STEP * 1.6, { type: 'triangle', vol: 0.09, at: nextAt });
      }
      if (step % 4 === 2) tone(2000, 0, 0.03, { type: 'square', vol: 0.012, at: nextAt });
      nextAt += STEP;
      step++;
    }
  }

  return {
    get muted() { return muted; },
    toggle() {
      muted = !muted;
      try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch {}
      if (muted) this.bgmStop();
      else { this.tap(); this.bgmStart(); }
      return muted;
    },
    bgmStart() {
      const c = ac();
      if (!c || muted || bgmTimer) return;
      step = 0;
      nextAt = c.currentTime + 0.1;
      bgmTimer = setInterval(schedule, 25);
      schedule();
    },
    bgmStop() {
      clearInterval(bgmTimer);
      bgmTimer = null;
    },
    // ボタンを押した「ポコッ」
    tap() { tone(520, 0, 0.09, { type: 'triangle', vol: 0.25, slideTo: 880 }); },
    // スタート
    start() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.07, 0.16, { type: 'square', vol: 0.08 }));
    },
    // 出題の「ぷくっ」（泡の音）
    bubble() { tone(300, 0, 0.12, { type: 'sine', vol: 0.18, slideTo: 900 }); },
    // 正解「ピンポン」：高い音→低い音のチャイム（倍音を重ねて鐘っぽく）
    correct() {
      [[1319, 0, 0.35], [1047, 0.2, 0.8]].forEach(([f, s, d]) => {
        tone(f, s, d, { type: 'sine', vol: 0.3 });
        tone(f * 2, s, d * 0.5, { type: 'sine', vol: 0.06 });
        tone(f * 3, s, d * 0.3, { type: 'sine', vol: 0.03 });
      });
    },
    // 不正解「ぶー」：低いブザー音をのばす
    wrong() {
      tone(140, 0, 0.7, { type: 'square', vol: 0.12, sustain: true });
      tone(143, 0, 0.7, { type: 'sawtooth', vol: 0.08, sustain: true });
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
