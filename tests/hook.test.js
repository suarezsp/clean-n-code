const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  runHook, REFERENCES_DIR, LANGUAGES_DIR, CATALOG_FILES, ALWAYS_ON_MAX_CHARS, CARD_MAX_CHARS,
} = require('./helpers');

// Runs SessionStart in a throwaway project holding empty files with the given names (not a git repo: the hook lists its top level).
function sessionIn(fileNames) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cnc-project-'));
  try {
    for (const name of fileNames) fs.writeFileSync(path.join(dir, name), '');
    return runHook(['SessionStart'], {}, JSON.stringify({ cwd: dir })).stdout;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
const files = (ext, n) => Array.from({ length: n }, (_, i) => `f${i}${ext}`);

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

test(`always-on ruleset without cards stays within ${ALWAYS_ON_MAX_CHARS} characters`, () => {
  const out = sessionIn([]);
  assert.doesNotMatch(out, /## Language cards/);
  assert.ok(out.length <= ALWAYS_ON_MAX_CHARS, `ruleset is ${out.length} characters`);
});

test('ruleset plus the single card stays within budget', () => {
  const out = sessionIn([...files('.go', 4), ...files('.py', 3), ...files('.ts', 3), ...files('.rs', 2)]);
  assert.equal((out.match(/^### /gm) || []).length, 1);
  assert.ok(out.length <= ALWAYS_ON_MAX_CHARS + CARD_MAX_CHARS + 200, `context is ${out.length} characters`);
});

test('a language with its card in context loses its idiom line', () => {
  const out = sessionIn(files('.go', 3));
  assert.doesNotMatch(out, /^ {2}- Go:/m);
});

test('a project whose language has no idiom line never prints an undefined label', () => {
  assert.doesNotMatch(sessionIn(files('.sh', 3)), /undefined:/);
});

test('a language absent from the project loses its idiom line', () => {
  const out = sessionIn(files('.go', 3));
  assert.doesNotMatch(out, /^ {2}- Python:/m);
});

test('a project language under the card threshold keeps its idiom line', () => {
  const out = sessionIn([...files('.go', 19), 'tool.py']);
  assert.match(out, /^ {2}- Python:/m);
});

test('SessionStart injects only the most common language card; the runner-up keeps its idiom line', () => {
  const out = sessionIn([...files('.go', 9), 'tool.py', 'README.md', 'notes.txt']);
  assert.match(out, /^### go$/m);
  assert.match(out, /GO9/);
  assert.doesNotMatch(out, /^### python$/m);
  assert.match(out, /^ {2}- Python:/m);
  assert.doesNotMatch(out, /^### rust$/m);
});

test('a language under 10% of source files gets no card', () => {
  const out = sessionIn([...files('.go', 19), 'tool.py']);
  assert.match(out, /^### go$/m);
  assert.doesNotMatch(out, /^### python$/m);
});

for (const agentType of ['Explore', 'claude-code-guide', 'statusline-setup', 'some-unknown-agent']) {
  test(`SubagentStart injects nothing into the non-coding ${agentType} agent`, () => {
    const result = runHook(['SubagentStart'], {}, JSON.stringify({ agent_type: agentType }));
    assert.equal(result.stdout, '');
    assert.equal(result.status, 0);
  });
}

for (const agentType of ['Plan', 'general-purpose', 'claude', 'sonnet-coder', undefined]) {
  test(`SubagentStart still injects into the code-writing ${agentType} agent`, () => {
    const out = runHook(['SubagentStart'], {}, JSON.stringify({ agent_type: agentType })).stdout;
    assert.match(JSON.parse(out).hookSpecificOutput.additionalContext, /^CLEAN-N-CODE MODE ACTIVE/);
  });
}

test('malformed stdin still injects the ruleset', () => {
  assert.match(runHook(['SessionStart'], {}, 'not json').stdout, /^CLEAN-N-CODE MODE ACTIVE/);
});

test('SessionStart resolves the language guides folder to an absolute path', () => {
  const out = runHook(['SessionStart']).stdout;
  assert.ok(out.includes(`${LANGUAGES_DIR}/`), 'languages/ path not resolved');
  assert.doesNotMatch(out, /`\.\.\/\.\.\/languages\//);
});
