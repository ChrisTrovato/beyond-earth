const assert = require('node:assert/strict');
const { createModuleGraph } = require('./site-module-test-helper.cjs');
const key = 'beyond-earth-journey-v2', values = new Map();
let sequence = 0;
global.localStorage = { getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, v) };
global.CustomEvent = class { constructor(type, options) { this.type = type; this.detail = options?.detail; } };
async function tab() {
  const listeners = [];
  global.window = { addEventListener: (name, callback) => { if (name === 'storage') listeners.push(callback); }, dispatchEvent() {} };
  const store = await import(createModuleGraph(`tab ${++sequence}`)('journey-store.js'));
  const reference = store.getJourney();
  return { store, reference, sync: () => listeners.forEach(callback => callback({ key, newValue: values.get(key) })) };
}
const stored = () => JSON.parse(values.get(key));
(async () => {
  const a = await tab(), b = await tab();
  a.store.completeMission('m1'); a.store.noteMission('m1', 'Desktop connection');
  b.reference.experiments.push('robot'); b.store.saveJourney();
  assert.deepEqual(stored().completed, ['m1']);
  assert.equal(stored().notes.m1.text, 'Desktop connection');
  assert.deepEqual(stored().experiments, ['robot']);
  a.sync(); assert.equal(a.store.getJourney(), a.reference); assert.deepEqual(a.reference.experiments, ['robot']);
  b.store.noteMission('m1', 'Newest edit'); a.store.visitMission('m2');
  assert.equal(stored().notes.m1.text, 'Newest edit');

  a.reference.sessions.push({ minutes: 10, date: '2026-10-28T01:00:00Z' }); a.store.saveJourney();
  b.reference.sessions.push({ minutes: 5, date: '2026-10-28T02:00:00Z' }); b.store.saveJourney();
  assert.equal(stored().sessions.length, 2);
  a.reference.sessions.push({ minutes: 10, date: '2026-10-28T01:00:00Z' }); a.store.saveJourney();
  assert.equal(stored().sessions.length, 2);

  const end = Date.now() + 600000;
  a.reference.focus = { duration: 10, remaining: 600, running: true, ends: end, logged: false }; a.store.saveJourney();
  b.store.noteMission('m2', 'Unrelated note');
  assert.equal(stored().focus.ends, end, 'A stale unrelated save must not reset a running timer');
  a.sync(); b.sync(); const runId = a.reference.focus.sessionId;
  assert.ok(runId); assert.equal(b.reference.focus.sessionId, runId);
  for (const [index, current] of [a, b].entries()) {
    current.reference.sessions.push({ minutes: 10, date: new Date(end + index * 10).toISOString() });
    Object.assign(current.reference.focus, { running: false, remaining: 0, ends: null, logged: true });
    current.store.saveJourney();
  }
  assert.equal(stored().sessions.filter(session => session.sessionId === runId).length, 1, 'Two tabs completing the same run log once');

  const replacement = { version: 2, completed: ['m2'], notes: { m2: { text: 'Imported thought' } }, experiments: ['orbit'], sessions: [
    { minutes: 3, date: '2026-10-27T01:00:00Z' }, { minutes: 4, date: '2026-10-27T02:00:00Z' }, { minutes: 6, date: '2026-10-27T03:00:00Z' }
  ] };
  a.store.importJourney(replacement, ['m1', 'm2', 'm3']);
  assert.equal(stored().sessions.length, 3, 'Imported sessions must not inherit the old timer identity');
  b.store.visitMission('m3');
  assert.deepEqual(stored().completed, ['m2'], 'A stale tab cannot resurrect history deliberately replaced by import');
  assert.deepEqual(stored().experiments, ['orbit']); assert.equal(stored().notes.m1, undefined);
  b.sync(); assert.equal(b.store.getJourney(), b.reference); assert.equal(b.reference.focus.running, false);

  // A new action after replacement remains useful even if the storage event was delayed.
  const c = await tab(); a.store.importJourney({ version: 2, completed: [], notes: {}, experiments: [] }, ['m1', 'm2', 'm3']);
  c.store.completeMission('m3'); assert.deepEqual(stored().completed, ['m3']);
  assert.equal(stored().notes.m2, undefined);

  // Reconciliation heals interleaved writes whose read steps both preceded the other write.
  const d = await tab(), e = await tab(); d.store.completeMission('m1');
  const writeD = values.get(key); e.store.completeMission('m2');
  const overwritten = JSON.parse(writeD); overwritten.completed = ['m2', 'm3']; values.set(key, JSON.stringify(overwritten));
  d.sync(); e.sync(); assert.deepEqual(stored().completed, ['m1', 'm2', 'm3']);

  const longHistory = Array.from({ length: 1200 }, (_, index) => ({ minutes: 10, date: new Date(Date.UTC(2020, 0, 1) + index * 86400000).toISOString() }));
  d.store.importJourney({ version: 2, completed: [], notes: {}, sessions: longHistory }, ['m1']);
  assert.equal(stored().sessions.length, 1200, 'History is no longer truncated at 1,000 sessions');
  console.log('PASS: stale-tab progress and notes, storage-event identity sync, session union/dedup, shared timer completion, deliberate replacement, delayed events, concurrent-write recovery, and long history.');
})().catch(error => { console.error(error); process.exitCode = 1; });
