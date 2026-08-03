/**
 * Procedurally synthesizes original short WAV sound effects for the game
 * (no external audio assets, no copyright concerns). Run with:
 *   node scripts/generate-sfx.js
 * Output goes to assets/sfx/*.wav and is committed to the repo.
 */
const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;
const OUT_DIR = path.join(__dirname, '..', 'assets', 'sfx');

function zeros(durationSec) {
  return new Float64Array(Math.ceil(durationSec * SAMPLE_RATE));
}

function addAt(master, samples, startSec) {
  const startIdx = Math.round(startSec * SAMPLE_RATE);
  for (let i = 0; i < samples.length; i++) {
    const idx = startIdx + i;
    if (idx >= 0 && idx < master.length) master[idx] += samples[i];
  }
}

// One "note": pitch can sweep linearly from freqStart to freqEnd, amplitude
// follows a fast attack + exponential decay envelope, with an optional
// quieter 2nd harmonic (bell-like) and/or blended noise (percussive/click).
function note(durationSec, {
  freqStart,
  freqEnd = freqStart,
  amp = 1,
  attack = 0.006,
  decay = 3.5, // higher = faster exponential decay
  harmonic2 = 0,
  noise = 0,
  noiseDecay = 8,
} = {}) {
  const n = Math.ceil(durationSec * SAMPLE_RATE);
  const out = new Float64Array(n);
  let phase = 0;
  let phase2 = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const frac = t / durationSec;
    const freq = freqStart + (freqEnd - freqStart) * frac;
    phase += (2 * Math.PI * freq) / SAMPLE_RATE;
    phase2 += (2 * Math.PI * freq * 2) / SAMPLE_RATE;

    const attackEnv = attack > 0 ? Math.min(1, t / attack) : 1;
    const decayEnv = Math.exp(-decay * frac);
    const env = attackEnv * decayEnv;

    let sample = Math.sin(phase) * env;
    if (harmonic2 > 0) sample += Math.sin(phase2) * env * harmonic2;
    if (noise > 0) {
      const noiseEnv = Math.exp(-noiseDecay * frac);
      sample += (Math.random() * 2 - 1) * noiseEnv * noise;
    }
    out[i] = sample * amp;
  }
  return out;
}

function normalize(buf, peak = 0.9) {
  let max = 0;
  for (let i = 0; i < buf.length; i++) max = Math.max(max, Math.abs(buf[i]));
  if (max === 0) return buf;
  const scale = peak / max;
  const out = new Float64Array(buf.length);
  for (let i = 0; i < buf.length; i++) out[i] = buf[i] * scale;
  return out;
}

function writeWav(filename, floatSamples) {
  const normalized = normalize(floatSamples);
  const dataLength = normalized.length * 2;
  const buffer = Buffer.alloc(44 + dataLength);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
  buffer.writeUInt16LE(2, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40);

  for (let i = 0; i < normalized.length; i++) {
    const s = Math.max(-1, Math.min(1, normalized[i]));
    buffer.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, filename), buffer);
  console.log('wrote', filename, `(${(normalized.length / SAMPLE_RATE).toFixed(2)}s)`);
}

// --- individual effects -----------------------------------------------

// soft short click for swapping two candies
writeWav('swap.wav', note(0.09, {
  freqStart: 520, freqEnd: 380, amp: 0.7, attack: 0.002, decay: 6, noise: 0.15, noiseDecay: 20,
}));

// low buzz for an invalid swap (two close dissonant tones)
{
  const buf = zeros(0.16);
  addAt(buf, note(0.16, { freqStart: 196, amp: 0.55, attack: 0.001, decay: 2.2 }), 0);
  addAt(buf, note(0.16, { freqStart: 207, amp: 0.5, attack: 0.001, decay: 2.2 }), 0);
  writeWav('invalid.wav', buf);
}

// quick candy pop for a normal match
writeWav('pop.wav', note(0.14, {
  freqStart: 900, freqEnd: 500, amp: 0.8, attack: 0.003, decay: 5, harmonic2: 0.3, noise: 0.1, noiseDecay: 25,
}));

// ascending pentatonic bell tones for cascades / combos (index 0..4)
const PENTATONIC = [523.25, 587.33, 659.25, 783.99, 1046.5];
PENTATONIC.forEach((freq, i) => {
  writeWav(`cascade${i}.wav`, note(0.22, {
    freqStart: freq, amp: 0.75, attack: 0.004, decay: 3, harmonic2: 0.35,
  }));
});

// magical shimmer when a striped/wrapped/bomb candy is created
{
  const buf = zeros(0.4);
  const arp = [784, 1046.5, 1318.5];
  arp.forEach((freq, i) => {
    addAt(buf, note(0.16, { freqStart: freq, amp: 0.55, attack: 0.003, decay: 4, harmonic2: 0.4 }), i * 0.055);
  });
  addAt(buf, note(0.3, { freqStart: 2200, amp: 0.12, attack: 0.01, decay: 3, noise: 0.35, noiseDecay: 5 }), 0.05);
  writeWav('special.wav', buf);
}

// deep boom for a color-bomb / big blast
{
  const buf = zeros(0.5);
  addAt(buf, note(0.5, { freqStart: 140, freqEnd: 55, amp: 1, attack: 0.002, decay: 3.2 }), 0);
  addAt(buf, note(0.35, { freqStart: 90, amp: 0.6, attack: 0.001, decay: 4, noise: 0.6, noiseDecay: 6 }), 0);
  writeWav('bomb.wav', buf);
}

// victory fanfare arpeggio
{
  const buf = zeros(1.3);
  const seq = [523.25, 659.25, 783.99, 1046.5, 1318.5];
  seq.forEach((freq, i) => {
    addAt(buf, note(i === seq.length - 1 ? 0.55 : 0.18, {
      freqStart: freq, amp: i === seq.length - 1 ? 0.9 : 0.7, attack: 0.004, decay: i === seq.length - 1 ? 1.4 : 3, harmonic2: 0.4,
    }), i * 0.15);
  });
  writeWav('win.wav', buf);
}

// descending "aw" for running out of moves
{
  const buf = zeros(0.6);
  addAt(buf, note(0.6, { freqStart: 440, freqEnd: 293.66, amp: 0.7, attack: 0.01, decay: 2.2, harmonic2: 0.2 }), 0);
  writeWav('lose.wav', buf);
}

// tiny UI tap
writeWav('button.wav', note(0.045, {
  freqStart: 1200, amp: 0.5, attack: 0.001, decay: 10,
}));

console.log('Done. Files in', OUT_DIR);
