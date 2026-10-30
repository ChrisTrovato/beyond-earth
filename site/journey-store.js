import { getWorkbench, importWorkbench, isWorkbenchExport } from './workbench-store.js';

const KEY = 'beyond-earth-journey-v2';
const EXPERIMENTS = new Set(['leverage', 'ramp', 'orbit', 'rotation', 'solar', 'cooling', 'uncertainty', 'robot', 'functions', 'motion', 'accumulation', 'vectors']);
const now = () => new Date().toISOString();
const pausedFocus = () => ({ duration: 25, remaining: 1500, running: false, ends: null, logged: false });
const empty = () => ({ version: 2, epoch: 'original-v2', completed: [], notes: {}, last: null, experiments: [], sessions: [], focus: pausedFocus(), started: now() });
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const dateString = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
const safeId = value => typeof value === 'string' && value.length > 0 && value.length <= 160 && !['__proto__', 'constructor', 'prototype'].includes(value);
const clone = value => JSON.parse(JSON.stringify(value));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const unique = values => [...new Set(values)].sort();
const identity = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
let memory, baseline, replacePending = false;

function normalizeFocus(value) {
  if (!record(value) || !Number.isFinite(value.duration) || value.duration <= 0 || value.duration > 180) return pausedFocus();
  const duration = value.duration;
  const remaining = Number.isFinite(value.remaining) && value.remaining >= 0 && value.remaining <= duration * 60 ? Math.ceil(value.remaining) : Math.ceil(duration * 60);
  const logged = value.logged === true;
  const running = !logged && value.running === true && Number.isFinite(value.ends) && value.ends > 0;
  const focus = { duration, remaining: logged ? 0 : remaining, running, ends: running ? value.ends : null, logged };
  if (safeId(value.sessionId)) focus.sessionId = value.sessionId;
  return focus;
}

function sessions(values) {
  const candidates = values.filter(session => record(session) && Number.isFinite(session.minutes) && session.minutes >= 0 && session.minutes <= 180 && dateString(session.date))
    .map(session => ({ minutes: session.minutes, date: session.date, ...(safeId(session.sessionId) ? { sessionId: session.sessionId } : {}) }))
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date) || a.minutes - b.minutes || String(a.sessionId || '').localeCompare(String(b.sessionId || '')));
  const dates = new Set(), ids = new Set();
  return candidates.filter(session => {
    const key = `${session.date}|${session.minutes}`;
    if (dates.has(key) || (session.sessionId && ids.has(session.sessionId))) return false;
    dates.add(key); if (session.sessionId) ids.add(session.sessionId); return true;
  }).slice(-20000);
}

function normalize(value, validIds) {
  const clean = empty();
  if (!record(value) || value.version !== 2) return clean;
  const allowed = id => safeId(id) && (!validIds || validIds.has(id));
  if (safeId(value.epoch)) clean.epoch = value.epoch;
  clean.completed = unique((Array.isArray(value.completed) ? value.completed : []).filter(allowed));
  clean.last = allowed(value.last) ? value.last : null;
  if (record(value.notes)) for (const id of Object.keys(value.notes).sort()) {
    const note = value.notes[id];
    if (allowed(id) && record(note) && typeof note.text === 'string') clean.notes[id] = { text: note.text.slice(0, 6000), updated: dateString(note.updated) ? note.updated : now() };
  }
  clean.experiments = unique((Array.isArray(value.experiments) ? value.experiments : []).filter(id => EXPERIMENTS.has(id)));
  clean.sessions = sessions(Array.isArray(value.sessions) ? value.sessions : []);
  clean.focus = normalizeFocus(value.focus);
  if (dateString(value.started)) clean.started = value.started;
  return clean;
}
function readLatest() {
  try { return normalize(JSON.parse(localStorage.getItem(KEY) || 'null')); } catch { return null; }
}
function apply(value) {
  for (const key of Object.keys(memory)) delete memory[key];
  Object.assign(memory, value);
}
function notify(persisted) {
  try { window.dispatchEvent(new CustomEvent('journey-updated', { detail: { persisted } })); } catch { /* Notification does not determine storage success. */ }
}
export function getJourney() {
  if (!memory) { memory = readLatest() || empty(); baseline = clone(memory); }
  return memory;
}

function merge(local, latest) {
  const replaced = local.epoch !== latest.epoch;
  const source = clone(local);
  // An explicit import starts a new generation. Old cached history cannot undo it.
  if (replaced) {
    source.completed = source.completed.filter(id => !baseline.completed.includes(id));
    source.experiments = source.experiments.filter(id => !baseline.experiments.includes(id));
    source.notes = Object.fromEntries(Object.entries(source.notes).filter(([id, note]) => !same(note, baseline.notes[id])));
    const old = new Set(baseline.sessions.map(session => `${session.date}|${session.minutes}`));
    source.sessions = source.sessions.filter(session => !old.has(`${session.date}|${session.minutes}`) && (!baseline.focus.sessionId || session.sessionId !== baseline.focus.sessionId));
  }
  const notes = {};
  for (const id of unique([...Object.keys(latest.notes), ...Object.keys(source.notes)])) {
    const a = latest.notes[id], b = source.notes[id];
    notes[id] = !a ? b : !b ? a : Date.parse(b.updated) > Date.parse(a.updated) ? b : Date.parse(b.updated) < Date.parse(a.updated) ? a : b.text > a.text ? b : a;
  }
  let focus = !replaced && !same(local.focus, baseline.focus) ? local.focus : latest.focus;
  if (local.focus.logged && baseline.focus.sessionId && latest.focus.sessionId && baseline.focus.sessionId !== latest.focus.sessionId) focus = latest.focus;
  return normalize({ ...latest, completed: [...latest.completed, ...source.completed], experiments: [...latest.experiments, ...source.experiments], notes,
    sessions: [...latest.sessions, ...source.sessions], focus,
    last: local.last !== baseline.last ? local.last : latest.last,
    started: !replaced && Date.parse(local.started) < Date.parse(latest.started) ? local.started : latest.started });
}

function prepareLocal() {
  const local = normalize(getJourney());
  const oldKeys = new Set(baseline.sessions.map(session => `${session.date}|${session.minutes}`));
  // Shared timer runs have one identity even if two open tabs reach zero together.
  const timerId = local.focus.sessionId || baseline.focus.sessionId;
  if (!replacePending && timerId) for (const session of local.sessions) if (!session.sessionId && !oldKeys.has(`${session.date}|${session.minutes}`)) session.sessionId = timerId;
  if (local.focus.running && (!local.focus.sessionId || baseline.focus.logged)) local.focus.sessionId = identity();
  return local;
}

// Reads durable state again before writing, so a stale tab cannot erase new history.
export function saveJourney() {
  const local = prepareLocal(), latest = readLatest();
  const merged = replacePending || !latest ? local : merge(local, latest);
  apply(merged);
  let persisted = false;
  try { localStorage.setItem(KEY, JSON.stringify(memory)); persisted = true; } catch { /* Keep progress available for this visit. */ }
  if (persisted) { baseline = clone(memory); replacePending = false; }
  else if (latest && !replacePending) baseline = clone(latest);
  notify(persisted);
  return persisted;
}

function receiveStorage(event) {
  if (event.key !== KEY || replacePending) return;
  getJourney();
  if (event.newValue === null) { apply(empty()); baseline = clone(memory); notify(true); return; }
  const latest = readLatest();
  if (!latest) return;
  const merged = merge(normalize(memory), latest);
  apply(merged);
  baseline = clone(latest);
  let persisted = true;
  // Reconcile concurrent read/write races; monotonic history merges converge.
  if (!same(merged, latest)) {
    try { localStorage.setItem(KEY, JSON.stringify(merged)); } catch { persisted = false; }
  }
  if (persisted) baseline = clone(memory);
  notify(persisted);
}
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') window.addEventListener('storage', receiveStorage);

export function completeMission(id) { const data = getJourney(); if (!data.completed.includes(id)) data.completed.push(id); data.last = id; return saveJourney(); }
export function noteMission(id, text) {
  const data = getJourney(), latest = readLatest();
  const timestamp = Math.max(Date.now(), Date.parse(data.notes[id]?.updated) + 1 || 0, Date.parse(latest?.notes[id]?.updated) + 1 || 0);
  data.notes[id] = { text: text.slice(0, 6000), updated: new Date(timestamp).toISOString() };
  return saveJourney();
}
export function visitMission(id) { getJourney().last = id; return saveJourney(); }
export function nextMission(missions) { return missions.find(mission => !getJourney().completed.includes(mission.id)) || missions[0]; }
export function exportJourney() {
  const blob = new Blob([JSON.stringify({ ...getJourney(), workbench: getWorkbench() }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob), anchor = document.createElement('a');
  anchor.href = url; anchor.download = 'beyond-earth-field-notes.json'; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
export function importJourney(data, validIds) {
  if (!record(data) || data.version !== 2 || !Array.isArray(data.completed) || !record(data.notes)) throw new Error('Choose a Beyond Earth progress export.');
  const hasWorkbench = Object.prototype.hasOwnProperty.call(data, 'workbench');
  if (hasWorkbench && !isWorkbenchExport(data.workbench)) throw new Error('The workbench in this progress export is not a valid version 3 record.');
  const clean = normalize(data, new Set(validIds));
  clean.epoch = identity(); clean.focus = pausedFocus();
  getJourney(); apply(clean); replacePending = true;
  const journeySaved = saveJourney();
  const workbenchSaved = hasWorkbench ? importWorkbench(data.workbench, validIds) : true;
  return journeySaved && workbenchSaved;
}
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
export function subjectColor(subject) { return subject === 'Mathematics' ? 'cyan' : subject === 'Engineering' ? 'gold' : 'lilac'; }
