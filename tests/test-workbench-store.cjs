const assert = require('node:assert/strict');
const { createModuleGraph } = require('./site-module-test-helper.cjs');
const WORKBENCH = 'beyond-earth-workbench-v3', JOURNEY = 'beyond-earth-journey-v2';
const DAY = 86400000;
const originalNow = Date.now;
let clock = Date.parse('2026-10-29T18:00:00Z'), sequence = 0;
Date.now = () => clock;
const blankWorkbench = () => ({ version: 3, path: null, reviews: [], projects: {} });

async function environment(initial = {}) {
  const values = new Map(Object.entries(initial).map(([key, value]) => [key, JSON.stringify(value)]));
  const events = [], blockedKeys = new Set();
  const state = { blockReads: false, blockWrites: false, throwNotification: false };
  global.localStorage = {
    getItem: key => { if (state.blockReads) throw Error('Read blocked'); return values.get(key) ?? null; },
    setItem: (key, value) => { if (state.blockWrites || blockedKeys.has(key)) throw Error('Write blocked'); values.set(key, value); }
  };
  global.CustomEvent = class { constructor(type, options) { this.type = type; this.detail = options?.detail; } };
  global.window = { addEventListener() {}, dispatchEvent(event) { if (state.throwNotification) throw Error('Notification failed'); events.push(event); } };
  const moduleURL = createModuleGraph(`workbench ${++sequence}`);
  const workbench = await import(moduleURL('workbench-store.js'));
  const journey = await import(moduleURL('journey-store.js'));
  return { values, events, state, blockedKeys, workbench, journey };
}

async function captureExport(journey) {
  const originalCreate = URL.createObjectURL, originalRevoke = URL.revokeObjectURL, originalTimeout = global.setTimeout;
  const originalDocument = global.document;
  let blob, clicked = false, filename, revoked = false, scheduled;
  URL.createObjectURL = value => { blob = value; return 'blob:test-backup'; };
  URL.revokeObjectURL = url => { assert.equal(url, 'blob:test-backup'); revoked = true; };
  global.setTimeout = callback => { scheduled = callback; return 1; };
  global.document = { createElement: tag => { assert.equal(tag, 'a'); return { click() { clicked = true; filename = this.download; assert.equal(this.href, 'blob:test-backup'); } }; } };
  try {
    journey.exportJourney();
    assert.equal(clicked, true); assert.equal(filename, 'beyond-earth-field-notes.json');
    assert.equal(blob.type, 'application/json'); assert.equal(revoked, false);
    const data = JSON.parse(await blob.text()); scheduled(); assert.equal(revoked, true);
    return data;
  } finally { URL.createObjectURL = originalCreate; URL.revokeObjectURL = originalRevoke; global.setTimeout = originalTimeout; global.document = originalDocument; }
}

(async () => {
  // Regression: old durable state must not erase new work when setItem fails.
  const first = await environment({ [WORKBENCH]: { ...blankWorkbench(), path: 'mechanisms' } });
  const { workbench: wb } = first, reference = wb.getWorkbench();
  first.state.blockWrites = true;
  assert.equal(wb.choosePath('space-structures'), false);
  assert.equal(wb.saveProjectFields('cardboard-crane', { question: 'What changes the tipping point?', result: 'Measured 12 cm.' }), false);
  assert.equal(wb.setProjectStep('cardboard-crane', 2, true), false);
  assert.equal(wb.recordReview('math-01', true), false);
  for (let index = 0; index < 3; index++) {
    assert.equal(wb.getWorkbench(), reference);
    assert.equal(wb.getWorkbench().path, 'space-structures');
    assert.deepEqual(wb.getWorkbench().projects['cardboard-crane'].checks, [2]);
    assert.equal(wb.getWorkbench().projects['cardboard-crane'].fields.result, 'Measured 12 cm.');
    assert.equal(wb.reviewState('math-01').attempts, 1);
  }
  assert.equal(JSON.parse(first.values.get(WORKBENCH)).path, 'mechanisms');
  assert.equal(first.events.at(-1).detail.saved, false);
  const failedWriteExport = await captureExport(first.journey);
  assert.equal(failedWriteExport.workbench.path, 'space-structures', 'An export includes unsaved work from this visit');
  first.state.blockReads = true;
  assert.equal(wb.getWorkbench().reviews.length, 1);
  first.state.blockReads = false; first.state.blockWrites = false;
  assert.equal(wb.setProjectStep('cardboard-crane', 3, true), true);
  const flushed = JSON.parse(first.values.get(WORKBENCH));
  assert.equal(flushed.path, 'space-structures'); assert.equal(flushed.reviews.length, 1);
  assert.deepEqual(flushed.projects['cardboard-crane'].checks, [2, 3]);
  assert.equal(flushed.projects['cardboard-crane'].fields.result, 'Measured 12 cm.');
  const freshReader = await import(createModuleGraph(`reader ${++sequence}`)('workbench-store.js'));
  assert.deepEqual(freshReader.getWorkbench(), flushed, 'Recovery persists all pending path, review, and project changes');
  first.state.throwNotification = true;
  assert.equal(wb.choosePath('lunar-systems'), true, 'A notification error does not report a failed storage write');
  console.log('PASS: blocked-write/read fallback, repeated reads, export of unsaved work, recovery flush, and storage-result semantics.');

  const scheduling = await environment(), s = scheduling.workbench;
  assert.deepEqual(s.reviewState('math-01'), { attempts: 0, correct: 0, last: null, due: 0, streak: 0 });
  for (const [index, days] of [1, 3, 7, 14, 30, 30].entries()) {
    clock += 3600000; assert.equal(s.recordReview('math-01', true), true);
    const review = s.reviewState('math-01');
    assert.equal(review.due, clock + days * DAY); assert.equal(review.streak, index + 1); assert.equal(review.attempts, index + 1);
  }
  clock += 3600000; s.recordReview('math-01', false);
  assert.equal(s.reviewState('math-01').due, clock); assert.equal(s.reviewState('math-01').streak, 0);
  clock += 3600000; s.recordReview('math-01', true);
  assert.equal(s.reviewState('math-01').due, clock + DAY); assert.equal(s.reviewState('math-01').streak, 1);
  assert.equal(s.reviewState('math-01').attempts, 8); assert.equal(s.reviewState('math-01').correct, 7);
  assert.equal(s.reviewState('math-02').attempts, 0);
  const schedulerReload = await import(createModuleGraph(`schedule reader ${++sequence}`)('workbench-store.js'));
  assert.deepEqual(schedulerReload.reviewState('math-01'), s.reviewState('math-01'));
  console.log('PASS: 1/3/7/14/30-day review schedule, maximum interval, incorrect-answer reset, mission isolation, and reload.');

  s.choosePath('robotics');
  s.setProjectStep('joint-study', 0, true); s.setProjectStep('joint-study', 0, true); s.setProjectStep('joint-study', 1, true); s.setProjectStep('joint-study', 0, false);
  s.saveProjectFields('joint-study', { question: 'Q'.repeat(6100), prediction: 'A longer arm needs more torque.', method: 'Measure force.', result: 'R', next: 'N', unexpected: 'Not part of a report' });
  assert.deepEqual(s.getWorkbench().projects['joint-study'].checks, [1]);
  assert.equal(s.getWorkbench().projects['joint-study'].fields.question.length, 6000);
  assert.equal(s.getWorkbench().projects['joint-study'].fields.unexpected, undefined);
  const beforeInvalidAction = JSON.stringify(s.getWorkbench());
  assert.equal(s.choosePath('<bad>'), false); assert.equal(s.setProjectStep('joint-study', -1, true), false);
  assert.equal(s.setProjectStep('joint-study', 30, true), false); assert.equal(s.recordReview('math-01', 'yes'), false);
  assert.equal(s.saveProjectFields('constructor', {}), false);
  assert.equal(JSON.stringify(s.getWorkbench()), beforeInvalidAction);
  const reportReload = await import(createModuleGraph(`project reader ${++sequence}`)('workbench-store.js'));
  assert.equal(reportReload.getWorkbench().path, 'robotics');
  assert.deepEqual(reportReload.getWorkbench().projects, s.getWorkbench().projects);
  console.log('PASS: path and project reload, step toggles, report fields, field length, and invalid action protection.');

  const beforeInvalidImport = JSON.stringify(s.getWorkbench());
  for (const invalid of [null, [], { version: 2 }, { version: 3 }, { ...blankWorkbench(), reviews: {} }, { ...blankWorkbench(), projects: [] }, { ...blankWorkbench(), path: 3 }]) {
    assert.throws(() => s.importWorkbench(invalid, ['math-01']), /valid version 3/);
    assert.equal(JSON.stringify(s.getWorkbench()), beforeInvalidImport);
  }
  const dirty = { ...blankWorkbench(), path: 'robotics', reviews: [
    { id: 'one', mission: 'math-01', correct: true, at: clock },
    { id: 'one', mission: 'math-01', correct: true, at: clock },
    { id: 'unknown', mission: 'not-in-curriculum', correct: true, at: clock },
    { id: 'bad-date', mission: 'math-01', correct: true, at: 1e300 }, null
  ], projects: JSON.parse('{"joint-study":{"checks":[0,0,-1,30,2,"3"],"fields":{"question":"Keep this","result":3},"updated":0},"constructor":{"checks":[0]}}') };
  assert.equal(s.importWorkbench(dirty, ['math-01']), true);
  assert.equal(s.getWorkbench().reviews.length, 1);
  assert.deepEqual(s.getWorkbench().projects['joint-study'].checks, [0, 2]);
  assert.deepEqual(s.getWorkbench().projects['joint-study'].fields, { question: 'Keep this' });
  assert.equal(Object.hasOwn(s.getWorkbench().projects, 'constructor'), false);
  const manyReviews = Array.from({ length: 1200 }, (_, index) => ({ id: `r-${index}`, mission: 'math-01', correct: true, at: clock + index }));
  s.importWorkbench({ ...blankWorkbench(), reviews: manyReviews }, ['math-01']);
  assert.equal(s.getWorkbench().reviews.length, 1200);
  console.log('PASS: backup-envelope validation, sanitized entries, valid mission filtering, duplicate review IDs, and long review history.');

  const integrated = await environment(), j = integrated.journey, w = integrated.workbench;
  j.completeMission('math-01'); j.noteMission('math-01', 'Area under power means energy.');
  j.getJourney().experiments = ['functions', 'motion', 'accumulation', 'vectors', 'robot'];
  j.getJourney().sessions.push({ minutes: 12, date: '2026-10-29T18:00:00Z' }); j.saveJourney();
  w.choosePath('robotics'); w.recordReview('math-01', true); w.setProjectStep('joint-study', 1, true); w.saveProjectFields('joint-study', { question: 'How far does the tip travel?', result: 'Measured and compared.' });
  const backup = await captureExport(j);
  assert.equal(backup.version, 2); assert.equal(backup.workbench.version, 3);
  assert.deepEqual(backup.experiments, ['accumulation', 'functions', 'motion', 'robot', 'vectors']);
  assert.equal(Object.hasOwn(j.getJourney(), 'workbench'), false, 'Export does not contaminate the journey merge state');
  const journeyReference = j.getJourney(), workbenchReference = w.getWorkbench();
  for (const invalid of [null, { version: 2 }, { ...blankWorkbench(), projects: [] }]) {
    const journeyBefore = JSON.stringify(j.getJourney()), workbenchBefore = JSON.stringify(w.getWorkbench());
    assert.throws(() => j.importJourney({ version: 2, completed: [], notes: {}, workbench: invalid }, ['math-01']), /valid version 3/);
    assert.equal(JSON.stringify(j.getJourney()), journeyBefore); assert.equal(JSON.stringify(w.getWorkbench()), workbenchBefore);
  }
  j.importJourney({ version: 2, completed: [], notes: {} }, ['math-01']);
  assert.deepEqual(w.getWorkbench(), backup.workbench, 'Older v2 imports leave current workbench progress intact');
  w.importWorkbench(blankWorkbench(), ['math-01']);
  assert.equal(j.importJourney(backup, ['math-01']), true);
  assert.equal(j.getJourney(), journeyReference); assert.equal(w.getWorkbench(), workbenchReference);
  assert.deepEqual(w.getWorkbench(), backup.workbench);
  assert.deepEqual(j.getJourney().completed, backup.completed); assert.deepEqual(j.getJourney().notes, backup.notes);
  assert.deepEqual(j.getJourney().experiments, backup.experiments); assert.deepEqual(j.getJourney().sessions, backup.sessions);
  assert.equal(j.getJourney().focus.running, false);
  const exportedAgain = await captureExport(j);
  assert.deepEqual(exportedAgain.workbench, backup.workbench);
  const replacement = { ...backup, workbench: { ...blankWorkbench(), path: 'lunar-systems' } };
  integrated.blockedKeys.add(WORKBENCH);
  assert.equal(j.importJourney(replacement, ['math-01']), false, 'Partial durable success reports false');
  assert.equal(w.getWorkbench().path, 'lunar-systems', 'Failed nested import remains accessible in this visit');
  assert.equal((await captureExport(j)).workbench.path, 'lunar-systems');
  integrated.blockedKeys.clear(); w.choosePath('lunar-systems');
  integrated.blockedKeys.add(JOURNEY);
  assert.equal(j.importJourney(backup, ['math-01']), false);
  assert.deepEqual(w.getWorkbench(), backup.workbench, 'Workbench is still imported when the journey write fails');
  assert.deepEqual(j.getJourney().completed, backup.completed);
  console.log('PASS: full downloaded JSON round-trip, all foundation IDs, stable identities, old-v2 compatibility, pre-mutation nested validation, and partial-storage failures.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => { Date.now = originalNow; });
