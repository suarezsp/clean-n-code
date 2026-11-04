const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { runHook, REFERENCES_DIR, CATALOG_FILES, ALWAYS_ON_MAX_LINES } = require('./helpers');

test('SessionStart prints the ruleset as plain text', () => {
  assert.match(runHook(['SessionStart']).stdout, /^CLEAN-N-CODE MODE ACTIVE\n/);
});

test('SessionStart strips the skill frontmatter', () => {
  assert.doesNotMatch(runHook(['SessionStart']).stdout, /^name: clean-n-code$/m);
});

test('SessionStart resolves every catalog reference to an absolute path', () => {
  const out = runHook(['SessionStart']).stdout;
  for (const file of CATALOG_FILES) assert.ok(out.includes(path.join(REFERENCES_DIR, file)), `unresolved ${file}`);
});

test('SubagentStart wraps the ruleset in hookSpecificOutput JSON', () => {
  const { hookSpecificOutput } = JSON.parse(runHook(['SubagentStart']).stdout);
  assert.equal(hookSpecificOutput.hookEventName, 'SubagentStart');
  assert.match(hookSpecificOutput.additionalContext, /^CLEAN-N-CODE MODE ACTIVE\n/);
});

test('no event argument defaults to SessionStart plain text', () => {
  assert.equal(runHook([]).stdout, runHook(['SessionStart']).stdout);
});

for (const value of ['off', 'OFF', 'Off']) {
  test(`CLEAN_N_CODE=${value} silences the hook`, () => {
    const result = runHook(['SessionStart'], { CLEAN_N_CODE: value });
    assert.equal(result.stdout, '');
    assert.equal(result.status, 0);
  });
}

test('any other CLEAN_N_CODE value keeps the hook on', () => {
  assert.match(runHook(['SessionStart'], { CLEAN_N_CODE: 'on' }).stdout, /^CLEAN-N-CODE MODE ACTIVE/);
});

test(`always-on ruleset stays within ${ALWAYS_ON_MAX_LINES} lines`, () => {
  const lineCount = runHook(['SessionStart']).stdout.split('\n').length;
  assert.ok(lineCount <= ALWAYS_ON_MAX_LINES, `always-on ruleset has ${lineCount} lines`);
});
