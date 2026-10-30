const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createModuleGraph } = require('./site-module-test-helper.cjs');
const realNow = Date.now;
let clock = Date.parse('2026-10-29T18:00:00Z'), nextInterval = 0;
const intervals = new Map(), storage = new Map();
Date.now = () => clock;
global.setInterval = callback => { const id = ++nextInterval; intervals.set(id, callback); return id; };
global.clearInterval = id => intervals.delete(id);
global.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };
global.window = { dispatchEvent() {} };
global.CustomEvent = class { constructor(type, options) { this.type = type; this.detail = options?.detail; } };

class Node {
  constructor(dataset = {}) { this.dataset = dataset; this.handlers = new Map(); this.attributes = new Map(); this.disabled = false; this._html = ''; this._text = ''; this.files = []; }
  set innerHTML(value) { this._html = String(value); this._text = this._html.replace(/<[^>]*>/g, ''); }
  get innerHTML() { return this._html; }
  set textContent(value) { this._text = String(value); this._html = this._text; }
  get textContent() { return this._text; }
  setAttribute(name, value) { this.attributes.set(name, value); }
  addEventListener(name, callback) { if (!this.handlers.has(name)) this.handlers.set(name, []); this.handlers.get(name).push(callback); }
  async emit(name) { for (const callback of this.handlers.get(name) || []) await callback({ target: this, currentTarget: this }); }
}
class Container {
  constructor() { this.nodes = new Map(); this.presets = []; this._html = ''; this.renders = 0; }
  set innerHTML(value) {
    this._html = value; this.renders++; this.nodes = new Map();
    for (const match of value.matchAll(/\bid="([^"]+)"/g)) this.nodes.set('#' + match[1], new Node());
    this.presets = [...value.matchAll(/data-minutes="(\d+)"/g)].map(match => new Node({ minutes: match[1] }));
    const minutes = value.match(/id="logged-minutes">([^<]+)/)?.[1];
    if (minutes !== undefined) this.nodes.get('#logged-minutes').innerHTML = minutes + '<small> min</small>';
  }
  get innerHTML() { return this._html; }
  querySelector(selector) { assert.ok(this.nodes.has(selector), `Mock DOM missing selector ${selector}`); return this.nodes.get(selector); }
  querySelectorAll(selector) { assert.equal(selector, '[data-minutes]'); return this.presets; }
}
const missions = [{ id: 'math-01', subject: 'Mathematics', title: 'One useful idea', hook: 'A connection' }];
const exportData = (minutes = 7) => ({ version: 2, completed: ['math-01'], notes: { 'math-01': { text: 'A kept thought' } }, experiments: ['robot'], sessions: [{ minutes, date: '2026-10-29T17:00:00Z' }], focus: { duration: 45, remaining: 1, running: true, ends: 1 } });
function advance(milliseconds, run = true) { clock += milliseconds; if (run) for (const callback of [...intervals.values()]) callback(); }
function fileInput(container, data) { const input = container.querySelector('#import-journey'); input.files = [{ size: 100, text: async () => JSON.stringify(data) }]; return input; }

(async () => {
  const moduleURL = createModuleGraph('academy timer');
  const store = await import(moduleURL('journey-store.js')), academy = await import(moduleURL('academy.js'));
  const results = [];
  function reset() { intervals.clear(); clock = Date.parse('2026-10-29T18:00:00Z'); store.importJourney({ version: 2, completed: [], notes: {} }, ['math-01']); }
  async function test(name, callback) { reset(); try { await callback(); results.push({ name, passed: true }); } catch (error) { results.push({ name, passed: false, error: error.message }); } finally { intervals.clear(); } }
  const mount = () => { const container = new Container(); const cleanup = academy.mountControl(container, missions); return { container, cleanup, d: store.getJourney() }; };
  const click = (container, selector) => container.querySelector(selector).emit('click');

  await test('Auto-completion logs once; Finish guard and displayed total hold', async () => {
    const { container, cleanup, d } = mount();
    await click(container, '#focus-toggle'); advance(25 * 60000);
    assert.equal(d.sessions.length, 1); assert.equal(d.sessions[0].minutes, 25); assert.equal(d.focus.logged, true);
    assert.equal(container.querySelector('#focus-clock').textContent, '00:00');
    assert.equal(container.querySelector('#focus-finish').disabled, true);
    assert.equal(container.querySelector('#logged-minutes').textContent, '25 min');
    await click(container, '#focus-finish'); advance(60000);
    assert.equal(d.sessions.length, 1, 'The handler also blocks synthetic Finish events after logging');
    await click(container, '#focus-toggle'); assert.equal(d.focus.logged, false); assert.equal(d.focus.running, true);
    cleanup(); assert.equal(intervals.size, 0);
  });

  await test('Manual finish logs whole elapsed minutes and immediately refreshes totals', async () => {
    const { container, cleanup, d } = mount();
    await container.presets[0].emit('click'); await click(container, '#focus-toggle'); advance(135000);
    await click(container, '#focus-finish');
    assert.deepEqual(d.sessions.map(s => s.minutes), [2]); assert.equal(d.focus.remaining, 600); assert.equal(d.focus.running, false);
    assert.equal(container.querySelector('#focus-clock').textContent, '10:00'); assert.equal(container.querySelector('#logged-minutes').textContent, '2 min');
    await click(container, '#focus-finish'); assert.equal(d.sessions.length, 1);
    cleanup(); assert.equal(intervals.size, 0);
  });

  await test('Pause exactly at zero before the timer tick can still log once', async () => {
    const { container, cleanup, d } = mount();
    await container.presets[0].emit('click'); await click(container, '#focus-toggle'); advance(600000, false);
    await click(container, '#focus-toggle');
    assert.equal(d.focus.running, false); assert.equal(d.focus.remaining, 0); assert.equal(d.sessions.length, 0);
    await click(container, '#focus-finish'); assert.deepEqual(d.sessions.map(s => s.minutes), [10]);
    advance(1000); assert.equal(d.sessions.length, 1); cleanup();
  });

  await test('Paused time does not consume the remaining work interval', async () => {
    const { container, cleanup, d } = mount();
    await container.presets[0].emit('click'); await click(container, '#focus-toggle'); advance(180000);
    await click(container, '#focus-toggle'); assert.equal(d.focus.remaining, 420);
    advance(300000); assert.equal(d.focus.remaining, 420); assert.equal(d.sessions.length, 0);
    await click(container, '#focus-toggle'); advance(420000);
    assert.deepEqual(d.sessions.map(s => s.minutes), [10]); cleanup();
  });

  await test('Navigating away clears intervals and returning restores a running deadline', async () => {
    const first = mount(); await first.container.presets[0].emit('click'); await click(first.container, '#focus-toggle');
    advance(180000); first.cleanup(); assert.equal(intervals.size, 0); advance(300000);
    const second = mount(); assert.equal(second.container.querySelector('#focus-clock').textContent, '02:00');
    advance(120000); assert.deepEqual(second.d.sessions.map(s => s.minutes), [10]); second.cleanup(); assert.equal(intervals.size, 0);
  });

  await test('Repeated imports replace the live view and clean every interval on route exit', async () => {
    const { container, cleanup, d } = mount(); await click(container, '#focus-toggle'); advance(60000);
    const firstInterval = [...intervals.keys()][0];
    await fileInput(container, exportData()).emit('change');
    assert.equal(store.getJourney(), d); assert.equal(container.renders, 2); assert.equal(intervals.size, 1); assert.equal(intervals.has(firstInterval), false);
    assert.equal(d.focus.running, false); assert.equal(d.focus.remaining, 1500); assert.equal(container.querySelector('#logged-minutes').textContent, '7 min');
    assert.match(container.querySelector('#backup-status').textContent, /restored progress is ready/);
    await fileInput(container, exportData(12)).emit('change');
    assert.equal(container.renders, 3); assert.equal(intervals.size, 1); assert.equal(container.querySelector('#logged-minutes').textContent, '12 min');
    cleanup(); assert.equal(intervals.size, 0);
  });

  await test('Storage failure produces an honest memory-only import result', async () => {
    const { container, cleanup } = mount(); const write = global.localStorage.setItem;
    global.localStorage.setItem = () => { throw Error('Storage blocked'); };
    try { await fileInput(container, exportData()).emit('change'); assert.match(container.querySelector('#backup-status').textContent, /for this visit/); assert.equal(store.getJourney().sessions[0].minutes, 7); }
    finally { global.localStorage.setItem = write; cleanup(); }
    assert.equal(intervals.size, 0);
  });

  await test('Invalid import keeps the current timer and state intact', async () => {
    const { container, cleanup, d } = mount(); await click(container, '#focus-toggle'); const focus = d.focus;
    await fileInput(container, { invalid: true }).emit('change');
    assert.equal(container.renders, 1); assert.equal(intervals.size, 1); assert.equal(d.focus, focus);
    assert.match(container.querySelector('#backup-status').textContent, /progress export/); cleanup();
  });

  await test('An import resolving after route exit cannot remount or leak an interval', async () => {
    const { container, cleanup } = mount(); let resolve;
    const input = container.querySelector('#import-journey'); input.files = [{ size: 100, text: () => new Promise(done => { resolve = done; }) }];
    const pending = input.emit('change'); cleanup(); assert.equal(intervals.size, 0);
    resolve(JSON.stringify(exportData())); await pending;
    assert.equal(container.renders, 1, 'A departed view must not remount after an awaited file read');
    assert.equal(intervals.size, 0, 'A departed view must not create a fresh timer interval');
  });

  Date.now = realNow;
  for (const result of results) console.log(`${result.passed ? 'PASS' : 'FAIL'}: ${result.name}${result.error ? '\n  ' + result.error : ''}`);
  console.log(`${results.filter(result => result.passed).length}/${results.length} scenarios passed.`);
  if (results.some(result => !result.passed)) process.exitCode = 1;
})().catch(error => { Date.now = realNow; console.error(error); process.exitCode = 1; });
