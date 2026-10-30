const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.resolve(__dirname, '../site/foundation-lab.js'), 'utf8');
(async () => {
  const m = await import('data:text/javascript;base64,' + Buffer.from(source + '\nexport { LABS, CALCULATE, RENDERERS };').toString('base64'));
  let checks = 0;
  const close = (actual, expected, tolerance = 1e-9) => { assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected}`); checks++; };
  close(m.calculateLinear().value, 40);
  close(m.calculateLinear({ slope: 0, intercept: 55, time: 9 }).value, 55);
  close(m.calculateLinear({ slope: -2, intercept: 20, time: 10 }).value, 0);
  close(m.calculateLinear({ slope: 2, intercept: 80, time: 10 }).value, 100);

  const motion = m.calculateMotion();
  close(motion.position, 0); close(motion.velocity, 2); close(motion.acceleration, 1);
  close(motion.turningTime, 2); close(motion.minPosition, -2); close(motion.maxPosition, 30);
  close(m.calculateMotion({ time: 2 }).velocity, 0);
  close(m.calculateMotion({ a: 0, b: 3, c: -4, time: 10 }).position, 26);
  for (const a of [-1, 0, .5, 1]) for (const time of [0, 2.3, 10]) {
    const input = { a, b: -2.5, c: 4, time }, h = 1e-4;
    const right = m.calculateMotion({ ...input, time: time + h });
    const left = m.calculateMotion({ ...input, time: time - h });
    const at = m.calculateMotion(input);
    close((right.position - left.position) / (2 * h), at.velocity, 1e-7);
    close((right.velocity - left.velocity) / (2 * h), at.acceleration, 1e-7);
  }

  const energy = m.calculateAccumulation();
  close(energy.energy1, 60); close(energy.energy2, 60); close(energy.energy, 120); close(energy.averagePower, 40);
  close(m.calculateAccumulation({ power1: 1, duration1: 1, power2: 0, duration2: 1 }).energy, 1);
  close(m.calculateAccumulation({ duration1: 4, duration2: 2 }).energy, energy.energy * 2);
  close(m.calculateAccumulation({ power1: 0, power2: 0 }).energy, 0);
  const vector = m.calculateVectors();
  close(vector.x, 3); close(vector.y, 4); close(vector.magnitude, 5); close(vector.angle, 53.13010235415598);
  const zero = m.calculateVectors({ magnitudeA: 5, angleA: 25, magnitudeB: 5, angleB: -155 });
  close(zero.magnitude, 0); assert.equal(zero.angle, null); checks++;
  close(m.calculateVectors({ angleA: 90, angleB: 180 }).magnitude, 5);

  let renders = 0;
  for (const [type, config] of Object.entries(m.LABS)) {
    const inputs = [{ ...config.base }];
    for (let mask = 0; mask < 2 ** config.controls.length; mask++) {
      inputs.push(Object.fromEntries(config.controls.map((control, index) => [control[0], control[(mask >> index) & 1 ? 3 : 2]])));
    }
    for (const state of inputs) {
      const result = m.CALCULATE[type](state);
      if (type === 'functions') assert.ok(result.value >= 0 && result.value <= 100);
      if (type === 'accumulation') assert.ok(result.energy >= 0 && result.duration > 0);
      for (const compact of [false, true]) for (const layout of type === 'vectors' ? ['tip', 'tail'] : ['tip']) {
        const markup = m.RENDERERS[type](state, result, 'test', compact, layout);
        assert.ok(!/NaN|Infinity|undefined/.test(markup), `${type}: invalid SVG coordinate or value`);
        assert.ok(markup.includes('role="img"') && markup.includes('aria-label='));
        renders++;
      }
    }
  }
  assert.ok(source.includes('cancelAnimationFrame(frame)') && source.includes("removeEventListener('visibilitychange'"));
  assert.ok(source.includes('prefers-reduced-motion: reduce'));
  console.log(`PASS: ${checks} mathematical/derivative/unit checks; ${renders} desktop/mobile extreme render combinations; animation cleanup and reduced-motion handling present.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
