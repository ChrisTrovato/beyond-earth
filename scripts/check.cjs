const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
function run(args) {
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
for (const folder of ['site', 'scripts', 'tests']) {
  for (const filename of fs.readdirSync(path.join(root, folder)).filter(f => /\.(js|cjs)$/.test(f))) {
    run(['--check', path.join(folder, filename)]);
  }
}
for (const filename of fs.readdirSync(path.join(root, 'tests')).filter(f => /^test-.*\.cjs$/.test(f)).sort()) {
  console.log(`\nRunning ${filename}`);
  run([path.join('tests', filename)]);
}
run(['tests/check-v4-content.cjs']);
console.log('\nAll Beyond Earth checks passed.');
