// The acoustic chain, offline: what the cutter carves and what the reproducer hears.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AcousticRecorder, AcousticPlayer } from '../src/acoustics.js';
import { Hof } from '../src/contact.js';
import { D0U } from '../src/constants.js';

const fs = 48000;

// peak cutter excursion (µm) for a steady tone, after the filters settle
function cutAmplitude(f, a = 0.01) {
  const rec = new AcousticRecorder(fs);
  let peak = 0;
  for (let i = 0; i < fs; i++) {
    const z = rec.process(a * Math.sin((2 * Math.PI * f * i) / fs));
    if (i > fs / 2) peak = Math.max(peak, Math.abs(z));
  }
  return peak;
}

// play a groove given as cut depth per sample; returns output RMS (second half) and samples in flight
function play(depthAt, n = fs) {
  const p = new AcousticPlayer(fs);
  let s2 = 0;
  for (let i = 0; i < n; i++) {
    const o = p.step(Hof(depthAt(i)), true);
    if (i >= n / 2) s2 += o * o;
  }
  return { rms: Math.sqrt(s2 / (n / 2)), fly: p.fly };
}

test('the horn cannot hold the bass', () => {
  assert.ok(cutAmplitude(50) < cutAmplitude(1000) / 50, 'a 50 Hz tone is cut far below 1 kHz');
});

test('the glass diaphragm rings near 2.3 kHz, and the highs fall away', () => {
  assert.ok(cutAmplitude(2300) > cutAmplitude(1000), 'louder at the diaphragm resonance');
  assert.ok(cutAmplitude(8000) < cutAmplitude(1000) / 20, '8 kHz is mostly gone');
});

test('the cut never goes past ±44 µm, however loud', () => {
  const rec = new AcousticRecorder(fs);
  let peak = 0;
  for (let i = 0; i < fs; i++) peak = Math.max(peak, Math.abs(rec.process(10 * Math.sin((2 * Math.PI * 1000 * i) / fs))));
  assert.ok(peak <= 44 && peak > 40, `peak ${peak}`);
});

test('an unmodulated groove is silent', () => {
  assert.ok(play(() => D0U).rms < 1e-3);
});

test('the reproducer hears velocity: same depth, higher pitch, louder', () => {
  const tone = (f) => play((i) => D0U + 5 * Math.sin((2 * Math.PI * f * i) / fs)).rms;
  assert.ok(tone(1000) > 2 * tone(300));
});

test('on a sudden drop the stylus leaves the groove for a moment', () => {
  const still = play(() => D0U, 4000).fly;
  const cliff = play((i) => (i < 1000 ? D0U : D0U + 40), 4000).fly;
  assert.ok(cliff > still, `in flight: ${cliff} samples vs ${still}`);
});
