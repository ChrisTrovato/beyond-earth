const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const site = path.resolve(__dirname, '../site');
const html = fs.readFileSync(path.join(site, 'share.html'), 'utf8').replace(/\r\n/g, '\n');
const source = fs.readFileSync(path.join(site, 'share.js'), 'utf8');
const guide = fs.readFileSync(path.resolve(__dirname, '../docs/launch/posting-guide.txt'), 'utf8').replace(/\r\n/g, '\n');
// Match the decoded textarea value exposed by a browser, not raw HTML entities.
const decode = text => text.replace(/&(amp|lt|gt|quot|#39);/g, (_, entity) => ({amp:'&',lt:'<',gt:'>',quot:'"','#39':"'"})[entity]);

function mockDOM() {
  const nodes = new Map(), buttons = [];
  for (const match of html.matchAll(/<textarea\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/textarea>/g)) {
    const disclosure = match[1].startsWith('alt-') ? { open: false } : null;
    nodes.set(match[1], { value: decode(match[2]), focused: false, selected: false, closest: () => disclosure, focus() { this.focused = true; }, select() { this.selected = true; }, setSelectionRange(start, end) { this.range = [start, end]; } });
  }
  nodes.set('site-link', { value: 'https://ditchthescroll.com/beyond-earth/', focus() {}, select() {}, setSelectionRange() {} });
  for (const id of ['status-1', 'status-2', 'status-3', 'link-status']) nodes.set(id, { textContent: '' });
  for (const match of html.matchAll(/<button\b([^>]+)>/g)) {
    const dataset = Object.fromEntries([...match[1].matchAll(/data-([a-z]+)="([^"]+)"/g)].map(value => [value[1], value[2]]));
    if (!dataset.copy && !dataset.select) continue;
    const button = { dataset, disabled: false, listeners: new Map(), addEventListener(name, callback) { this.listeners.set(name, callback); }, removeEventListener(name, callback) { if (this.listeners.get(name) === callback) this.listeners.delete(name); }, async click() { return this.listeners.get('click')?.(); } };
    buttons.push(button);
  }
  return { nodes, buttons, querySelector: selector => nodes.get(selector.match(/\[id="([^"]+)"\]/)?.[1]) || null, querySelectorAll: () => buttons };
}

(async () => {
  const { mountShare } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
  let root = mockDOM(), copied = [];
  assert.equal(root.buttons.length, 13, 'Seven copy and six manual selection buttons are available');
  let cleanup = mountShare(root, { writeText: async text => copied.push(text) });
  for (const button of root.buttons.filter(button => button.dataset.copy)) {
    await button.click();
    assert.equal(copied.at(-1), root.nodes.get(button.dataset.copy).value);
    assert.equal(button.disabled, false);
    assert.match(root.nodes.get(button.dataset.status).textContent, /copied/);
  }
  assert.equal(copied.length, 7);
  for (const button of root.buttons.filter(button => button.dataset.select)) {
    await button.click();
    const field = root.nodes.get(button.dataset.select);
    assert.equal(field.focused, true); assert.equal(field.selected, true);
    assert.deepEqual(field.range, [0, field.value.length]);
    assert.match(root.nodes.get(button.dataset.status).textContent, /Text selected/);
  }
  assert.equal(copied.length, 7, 'Manual select does not write to the clipboard');
  cleanup(); assert.ok(root.buttons.every(button => button.listeners.size === 0));

  root = mockDOM(); cleanup = mountShare(root, undefined);
  let button = root.buttons.find(button => button.dataset.copy === 'alt-2');
  await button.click();
  assert.equal(root.nodes.get('alt-2').closest().open, true);
  assert.equal(root.nodes.get('alt-2').selected, true);
  assert.match(root.nodes.get('status-2').textContent, /Clipboard access is unavailable/);
  assert.equal(button.disabled, false); cleanup();

  root = mockDOM(); cleanup = mountShare(root, { writeText: async () => { throw Error('Denied'); } });
  button = root.buttons.find(button => button.dataset.copy === 'post-1'); await button.click();
  assert.equal(root.nodes.get('post-1').selected, true); assert.equal(button.disabled, false);
  assert.match(root.nodes.get('status-1').textContent, /Ctrl\+C/); cleanup();

  root = mockDOM(); let finish;
  cleanup = mountShare(root, { writeText: () => new Promise(resolve => { finish = resolve; }) });
  button = root.buttons.find(button => button.dataset.copy === 'post-3'); const pending = button.click();
  assert.equal(button.disabled, true); cleanup(); finish(); await pending;
  assert.equal(button.disabled, false); assert.equal(root.nodes.get('status-3').textContent, '');

  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, new Set(ids).size, 'All HTML IDs are unique');
  const counts = [1, 2, 3].map(index => {
    const text = root.nodes.get(`post-${index}`).value;
    assert.ok(!/[^\x00-\x7F]/.test(text), 'Post uses single-weight ASCII outside its URL');
    const weighted = text.replace(/https:\/\/\S+/g, 'x'.repeat(23)).length;
    assert.ok(weighted <= 280); assert.ok(guide.includes(text));
    assert.ok(guide.includes(root.nodes.get(`alt-${index}`).value));
    return weighted;
  });
  assert.deepEqual(counts, [226, 229, 251]);
  const images = [...html.matchAll(/<img\b[^>]*src="([^"]+)"[^>]*>/g)].filter(image => image[1].endsWith('.png') && /alt="[^"]+"/.test(image[0]));
  assert.equal(images.length, 2);
  for (const image of images) {
    const png = fs.readFileSync(path.join(site, image[1]));
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    assert.equal(png.readUInt32BE(16), 1122); assert.equal(png.readUInt32BE(20), 1402);
    assert.match(image[0], /alt="[^"]{100,}"/);
    assert.ok(html.includes(`href="${image[1]}" download=`));
  }
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (/^(?:https?:|#)/.test(match[1])) continue;
    const pathname = decodeURIComponent(new URL(match[1], 'https://example.invalid/').pathname).slice(1);
    assert.ok(fs.existsSync(path.join(site, pathname)), `Local resource exists: ${match[1]}`);
  }
  console.log('PASS: all seven copy buttons, six manual selectors, denied/missing clipboard fallback, disclosure opening, cleanup, and pending-copy cleanup.');
  console.log('PASS: 226/229/251 weighted characters, matching posting-guide text, unique IDs, all local links, two downloadable 1122×1402 PNGs and descriptive alt text.');
})().catch(error => { console.error(error); process.exitCode = 1; });
