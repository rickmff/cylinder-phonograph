// The 70 µm sapphire ball in the groove: how deep it reaches, and what it cannot enter.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Hof, TAPS, YC0 } from '../src/contact.js';
import { D0U, GWHU, RBU } from '../src/constants.js';

const knee = (GWHU * GWHU) / (2 * RBU); // depth beyond which the ball rides on the walls (µm)

test('in a shallow cut the ball reaches the floor', () => {
  for (const d of [0, 10, 30, knee - 1]) assert.ok(Math.abs(Hof(d) + d) < 0.05, `d=${d}: ${Hof(d)}`);
});

test('in a deep cut the ball rests on the walls and cannot reach the floor', () => {
  const gap = (d) => d + Hof(d); // µm between the ball's lowest point and the floor
  for (const d of [knee + 5, 80, 96]) assert.ok(gap(d) > 0.1, `d=${d}: gap ${gap(d)}`);
  assert.ok(gap(96) > gap(80) && gap(80) > gap(knee + 5), 'the gap grows with depth');
  assert.ok(gap(96) > 15, `a 96 µm cut leaves ${gap(96)} µm under the ball`);
});

test('the deeper the cut, the lower the ball', () => {
  for (let d = 0; d < 98; d += 0.5) assert.ok(Hof(d + 0.5) <= Hof(d));
});

test('at rest the ball centre sits above the land', () => {
  assert.ok(D0U > knee, 'the rest depth is already past the knee');
  assert.ok(YC0 > 0 && YC0 < RBU * 1e-6);
});

test('the dilation taps span the ball and are centred', () => {
  assert.equal(TAPS.length, 9);
  assert.equal(TAPS[4][0], 0);
  assert.equal(TAPS[4][1], 0);
  assert.ok(TAPS.every(([, h]) => h <= 0));
});
