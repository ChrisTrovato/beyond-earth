const assert = require('node:assert/strict');
const { createModuleGraph } = require('./site-module-test-helper.cjs');
const key = 'beyond-earth-journey-v2';
let instance = 0;

async function fresh(initial) {
  const storage = new Map(initial ? [[key, JSON.stringify(initial)]] : []);
  const events = [];
  global.localStorage = { getItem: name => storage.get(name) ?? null, setItem: (name, value) => storage.set(name, value) };
  global.window = { dispatchEvent: event => events.push(event) };
  global.CustomEvent = class { constructor(type, options = {}) { this.type = type; this.detail = options.detail; } };
  const module = await import(createModuleGraph(`store ${++instance}`)('journey-store.js'));
  return { module, storage, events };
}

(async () => {
  const first = await fresh();
  const store = first.module;
  const reference = store.getJourney();
  assert.deepEqual(reference.focus, { duration: 25, remaining: 1500, running: false, ends: null, logged: false });
  store.completeMission('math-01');
  store.completeMission('math-01');
  assert.deepEqual(reference.completed, ['math-01']);
  assert.equal(store.noteMission('math-01', 'A'.repeat(6100)), true);
  assert.equal(reference.notes['math-01'].text.length, 6000);
  reference.experiments = ['orbit', 'robot'];
  reference.sessions = [{ minutes: 10, date: '2026-10-29T12:00:00.000Z' }];
  reference.focus = { duration: 45, remaining: 1200, running: true, ends: Date.now() + 1200000 };
  const exported = JSON.parse(JSON.stringify(reference));
  exported.completed.push('unknown', 'math-01');
  exported.experiments.push('orbit', 'unknown');
  exported.notes.unknown = { text: 'not a valid mission' };
  exported.sessions.push(null, { minutes: NaN, date: 'invalid' }, { minutes: 200, date: '2026-10-29' });
  assert.equal(store.importJourney(exported, ['math-01']), true);
  assert.equal(store.getJourney(), reference, 'Mounted views retain the current store object');
  assert.deepEqual(reference.completed, ['math-01']);
  assert.deepEqual(reference.experiments, ['orbit', 'robot']);
  assert.equal(reference.sessions.length, 1);
  assert.equal(reference.started, exported.started);
  assert.equal(reference.notes.unknown, undefined);
  assert.deepEqual(reference.focus, { duration: 25, remaining: 1500, running: false, ends: null, logged: false });
  assert.equal(first.events.at(-1).detail.persisted, true);

  const beforeInvalid = JSON.stringify(reference);
  assert.throws(() => store.importJourney({ version: 2, completed: [], notes: [] }, ['math-01']), /progress export/);
  assert.equal(JSON.stringify(reference), beforeInvalid, 'Invalid imports do not modify progress');

  global.localStorage.setItem = () => { throw new Error('Storage blocked'); };
  assert.equal(store.importJourney({ ...exported, completed: [] }, ['math-01']), false);
  assert.equal(store.getJourney(), reference);
  assert.deepEqual(reference.completed, [], 'A failed durable write remains available for this visit');
  assert.equal(first.events.at(-1).detail.persisted, false);
  global.localStorage.setItem = (name, value) => first.storage.set(name, value);
  global.window.dispatchEvent = () => { throw new Error('Notification unavailable'); };
  assert.equal(store.saveJourney(), true, 'UI notification failure is not a storage failure');

  const malformed = await fresh({ version: 2, completed: ['math-01', 'math-01', 12], notes: { 'math-01': null, 'math-02': { text: 'Good note' } }, sessions: [null, { minutes: 5, date: 'not a date' }], experiments: ['robot', 'robot', 'bad'], focus: { duration: 25 }, started: 'invalid' });
  const repaired = malformed.module.getJourney();
  assert.deepEqual(repaired.completed, ['math-01']);
  assert.deepEqual(repaired.experiments, ['robot']);
  assert.deepEqual(repaired.sessions, []);
  assert.equal(repaired.notes['math-01'], undefined);
  assert.equal(repaired.notes['math-02'].text, 'Good note');
  assert.equal(repaired.focus.remaining, 1500);
  assert.equal(repaired.focus.running, false);

  const ends = Date.now() + 123000;
  const active = await fresh({ version: 2, completed: [], notes: {}, focus: { duration: 10, remaining: 123, running: true, ends, logged: false } });
  assert.deepEqual(active.module.getJourney().focus, { duration: 10, remaining: 123, running: true, ends, logged: false });
  const logged = await fresh({ version: 2, completed: [], notes: {}, focus: { duration: 10, remaining: 0, running: true, ends, logged: true } });
  assert.equal(logged.module.getJourney().focus.running, false);
  assert.equal(logged.module.getJourney().focus.logged, true);
  console.log('PASS: journey import identity, complete backup round-trip, paused import timer, storage results, malformed-state recovery, and persisted timer state.');
})().catch(error => { console.error(error); process.exitCode = 1; });
