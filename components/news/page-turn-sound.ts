/**
 * The page-turn sound for the magazine reader, synthesised rather than sampled.
 *
 * There is no audio file: the whole thing is three layers of shaped noise built
 * through the Web Audio API. That is deliberate on four counts — it ships zero
 * bytes over the wire, it needs no licence for a recording we do not own, the
 * CSP's `media-src 'self'` never enters into it, and every turn can be jittered
 * so forty-eight pages do not sound like the same click forty-eight times.
 *
 * The layers, in the order a real sheet makes them:
 *   1. `swish`   — the sheet moving through air. Bandpassed noise whose centre
 *                  frequency sweeps up as the page lifts and down as it falls.
 *   2. `crinkle` — paper texture. A handful of ~8 ms grains, high-passed, at
 *                  random offsets inside the first third of the turn.
 *   3. `settle`  — the sheet landing on the stack. One low, very short thump.
 *
 * An AudioContext may only start from a user gesture, so nothing is constructed
 * until the first turn actually happens — which is always a click, a key or a
 * swipe. Everything after that is reused.
 */

let ctx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;

/** One second of white noise, shared by every layer and every turn. */
function getNoise(audio: AudioContext) {
  if (noiseBuffer && noiseBuffer.sampleRate === audio.sampleRate) return noiseBuffer;
  const length = Math.floor(audio.sampleRate);
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
  noiseBuffer = buffer;
  return buffer;
}

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
  }
  // Browsers suspend the context when it is created outside a gesture and after
  // a tab is backgrounded; resuming is a no-op when it is already running.
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);

/**
 * Play one page turn.
 *
 * @param volume 0–1, scaling the whole thing. The default sits low on purpose:
 *   this plays on every single turn, and anything that draws attention to
 *   itself the second time is wrong the fortieth.
 * @param reverse a backward turn — voiced slightly darker and shorter, the way
 *   pulling a sheet back toward you actually sounds against turning it away.
 */
export function playPageTurn(volume = 1, reverse = false) {
  const audio = getContext();
  if (!audio || audio.state === 'closed') return;

  const t0 = audio.currentTime + 0.005;
  const noise = getNoise(audio);

  // Per-turn jitter. Without it the repetition is what you hear, not the paper.
  const speed = rand(0.9, 1.12) * (reverse ? 1.08 : 1);
  const dur = (reverse ? 0.3 : 0.36) / speed;
  const tilt = reverse ? 0.78 : 1;

  const master = audio.createGain();
  master.gain.value = Math.max(0, Math.min(1, volume)) * 0.5;
  master.connect(audio.destination);

  // 1. Swish — the body of the sound.
  {
    const src = audio.createBufferSource();
    src.buffer = noise;
    src.playbackRate.value = rand(0.95, 1.05);

    const band = audio.createBiquadFilter();
    band.type = 'bandpass';
    band.Q.value = 0.7;
    // Up as the sheet lifts off the stack, down as it falls onto the other side.
    band.frequency.setValueAtTime(700 * tilt, t0);
    band.frequency.exponentialRampToValueAtTime(rand(2100, 2900) * tilt, t0 + dur * 0.28);
    band.frequency.exponentialRampToValueAtTime(rand(380, 520) * tilt, t0 + dur);

    // Keeps the low rumble of raw noise out of the mix.
    const hp = audio.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 260;

    const gain = audio.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.32, t0 + 0.022);
    // The dip and second rise are the sheet flexing mid-turn — a single decay
    // reads as a hiss rather than as paper.
    gain.gain.exponentialRampToValueAtTime(0.11, t0 + dur * 0.45);
    gain.gain.exponentialRampToValueAtTime(0.2, t0 + dur * 0.72);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    src.connect(band).connect(hp).connect(gain).connect(master);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
  }

  // 2. Crinkle — short grains scattered through the first half.
  const grains = reverse ? 2 : 3;
  for (let i = 0; i < grains; i += 1) {
    const at = t0 + rand(0.01, dur * 0.5);
    const len = rand(0.006, 0.013);

    const src = audio.createBufferSource();
    src.buffer = noise;
    src.playbackRate.value = rand(0.8, 1.4);

    const hp = audio.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = rand(1800, 3200);

    const gain = audio.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(rand(0.05, 0.11), at + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + len);

    src.connect(hp).connect(gain).connect(master);
    src.start(at);
    src.stop(at + len + 0.02);
  }

  // 3. Settle — the sheet meeting the stack. Felt more than heard.
  {
    const at = t0 + dur * 0.88;
    const src = audio.createBufferSource();
    src.buffer = noise;
    src.playbackRate.value = rand(0.5, 0.7);

    const lp = audio.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = rand(320, 460);

    const gain = audio.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.14, at + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.075);

    src.connect(lp).connect(gain).connect(master);
    src.start(at);
    src.stop(at + 0.1);
  }
}

/** Warm the context up on the gesture that opens the reader, so the first
 *  turn is not the one that pays for construction. */
export function primePageTurnAudio() {
  getContext();
}
