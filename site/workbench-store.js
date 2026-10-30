const KEY = 'beyond-earth-workbench-v3';
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const safeId = value => typeof value === 'string' && /^[a-z0-9-]{1,160}$/.test(value) && !['constructor', 'prototype'].includes(value);
const FIELD_NAMES = ['question', 'prediction', 'method', 'result', 'next'];
const DAY = 86400000;
const validTime = value => Number.isFinite(value) && value > 0 && value <= 8640000000000000 - 30 * DAY;
const fresh = () => ({ version: 3, path: null, reviews: [], projects: {} });
const fallback = fresh();
let pendingWrite = false;

// Validate the backup envelope before replacing any existing progress. Individual
// entries are normalized below, just as older journey exports are normalized.
export function isWorkbenchExport(input) {
  return record(input) && input.version === 3 && (input.path === null || safeId(input.path)) && Array.isArray(input.reviews) && record(input.projects);
}

export function cleanWorkbench(input, validIds) {
  const data = fresh();
  if (!record(input) || input.version !== 3) return data;
  const valid = validIds ? new Set(validIds) : null;
  data.path = safeId(input.path) ? input.path : null;
  const reviewIds = new Set();
  data.reviews = (Array.isArray(input.reviews) ? input.reviews : [])
    .filter(review => record(review) && safeId(review.mission) && (!valid || valid.has(review.mission)) && typeof review.correct === 'boolean' && validTime(review.at) && typeof review.id === 'string' && review.id.length > 0 && review.id.length <= 180)
    .filter(review => { if (reviewIds.has(review.id)) return false; reviewIds.add(review.id); return true; })
    .slice(-20000)
    .map(review => ({ id: review.id, mission: review.mission, correct: review.correct, at: review.at }));
  if (record(input.projects)) for (const [id, project] of Object.entries(input.projects)) {
    if (!safeId(id) || !record(project)) continue;
    const fields = {};
    for (const name of FIELD_NAMES) if (record(project.fields) && typeof project.fields[name] === 'string') fields[name] = project.fields[name].slice(0, 6000);
    data.projects[id] = {
      checks: [...new Set((Array.isArray(project.checks) ? project.checks : []).filter(index => Number.isInteger(index) && index >= 0 && index < 30))],
      fields,
      updated: validTime(project.updated) ? project.updated : 0
    };
  }
  return data;
}

function apply(data) {
  for (const key of Object.keys(fallback)) delete fallback[key];
  Object.assign(fallback, data);
}

export function getWorkbench() {
  // A blocked write must survive subsequent reads of the older durable snapshot.
  // A later successful mutation flushes the entire in-memory record to storage.
  if (!pendingWrite) try {
    apply(cleanWorkbench(JSON.parse(localStorage.getItem(KEY) || 'null')));
  } catch { /* Retain this visit's last readable state when storage is unavailable. */ }
  return fallback;
}

function write(data) {
  apply(cleanWorkbench(data));
  pendingWrite = true;
  let saved = false;
  try { localStorage.setItem(KEY, JSON.stringify(fallback)); saved = true; pendingWrite = false; } catch { /* Keep all changes available for this visit and its export. */ }
  try { window.dispatchEvent(new CustomEvent('workbench-updated', { detail: { saved } })); } catch { /* Notification does not determine storage success. */ }
  return saved;
}

export function choosePath(id) {
  if (id !== null && !safeId(id)) return false;
  const data = getWorkbench(); data.path = id;
  return write(data);
}

export function recordReview(mission, correct) {
  if (!safeId(mission) || typeof correct !== 'boolean') return false;
  const data = getWorkbench();
  data.reviews.push({ id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`, mission, correct, at: Date.now() });
  return write(data);
}

export function reviewState(id) {
  const list = getWorkbench().reviews.filter(review => review.mission === id).sort((a, b) => a.at - b.at);
  if (!list.length) return { attempts: 0, correct: 0, last: null, due: 0, streak: 0 };
  let streak = 0;
  for (let index = list.length - 1; index >= 0 && list[index].correct; index--) streak++;
  const last = list.at(-1), days = last.correct ? [1, 3, 7, 14, 30][Math.min(streak - 1, 4)] : 0;
  return { attempts: list.length, correct: list.filter(review => review.correct).length, last, due: last.at + days * DAY, streak };
}

export function setProjectStep(id, index, done) {
  if (!safeId(id) || !Number.isInteger(index) || index < 0 || index >= 30 || typeof done !== 'boolean') return false;
  const data = getWorkbench(), project = data.projects[id] || { checks: [], fields: {}, updated: 0 };
  project.checks = done ? [...new Set([...project.checks, index])] : project.checks.filter(value => value !== index);
  project.updated = Date.now(); data.projects[id] = project;
  return write(data);
}

export function saveProjectFields(id, fields) {
  if (!safeId(id) || !record(fields)) return false;
  const data = getWorkbench(), project = data.projects[id] || { checks: [], fields: {}, updated: 0 };
  project.fields = Object.fromEntries(FIELD_NAMES.filter(name => typeof fields[name] === 'string').map(name => [name, fields[name].slice(0, 6000)]));
  project.updated = Date.now(); data.projects[id] = project;
  return write(data);
}

export function importWorkbench(data, validIds) {
  if (!isWorkbenchExport(data)) throw new Error('The workbench in this progress export is not a valid version 3 record.');
  return write(cleanWorkbench(data, validIds));
}

export function downloadText(filename, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' })), link = document.createElement('a');
  link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
