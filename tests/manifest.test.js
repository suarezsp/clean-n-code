const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { ROOT, readJson } = require('./helpers');

const plugin = readJson('.claude-plugin/plugin.json');
const marketplace = readJson('.claude-plugin/marketplace.json');

test('marketplace lists the plugin under the same name', () => {
  assert.deepEqual(marketplace.plugins.map((p) => p.name), [plugin.name]);
});

test('plugin version is semver', () => {
  assert.match(plugin.version, /^\d+\.\d+\.\d+$/);
});

test('every hook command points at a script that exists', () => {
  const hooks = readJson(plugin.hooks);
  const commands = Object.values(hooks.hooks).flat().flatMap((entry) => entry.hooks.map((h) => h.command));
  assert.ok(commands.length > 0);
  for (const command of commands) {
    const script = command.match(/\$\{CLAUDE_PLUGIN_ROOT\}\/([^"\s]+)/)[1];
    assert.ok(fs.existsSync(path.join(ROOT, script)), `missing ${script}`);
  }
});

test('package.json test script runs every test file', () => {
  assert.equal(readJson('package.json').scripts.test, 'node --test tests/*.test.js');
});
