// Mario-themed sound effects using Web Audio API
// No external files needed!

let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playNote(freq, duration, type = 'square', volume = 0.15) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // Audio not supported, silently ignore
  }
}

export function playJumpSound() {
  playNote(523, 0.08);
  setTimeout(() => playNote(659, 0.08), 80);
  setTimeout(() => playNote(784, 0.12), 160);
}

export function playSlideSound() {
  // Coin pickup sound
  playNote(988, 0.06);
  setTimeout(() => playNote(1319, 0.1), 60);
}

export function playCoinSound() {
  playNote(1567, 0.06);
  setTimeout(() => playNote(1976, 0.12), 70);
}

export function playPowerupSound() {
  const notes = [659, 698, 784, 880, 988, 1047];
  notes.forEach((n, i) => setTimeout(() => playNote(n, 0.1), i * 80));
}
