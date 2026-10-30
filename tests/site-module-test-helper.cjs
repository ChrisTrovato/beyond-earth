const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../site');

// Give each simulated tab its own complete ES-module graph. All imports within
// one graph share one store instance, as they do in a real browser document.
exports.createModuleGraph = function createModuleGraph(namespace) {
  const urls = new Map();
  return function moduleURL(name) {
    const filename = path.resolve(root, name);
    if (urls.has(filename)) return urls.get(filename);
    const source = fs.readFileSync(filename, 'utf8').replace(/\bfrom\s*(['"])(\.\/[^'"]+)\1/g, (match, quote, relative) => {
      const child = path.relative(root, path.resolve(path.dirname(filename), relative));
      return `from ${JSON.stringify(moduleURL(child))}`;
    });
    const url = 'data:text/javascript;base64,' + Buffer.from(source + `\n// test graph ${namespace}`).toString('base64');
    urls.set(filename, url);
    return url;
  };
};
