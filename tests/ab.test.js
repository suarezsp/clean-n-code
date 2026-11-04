const test = require('node:test');
const assert = require('node:assert/strict');
const { parseArgs, loadCase, parseStream, isolationProblems, extractCode, parseLizardCsv } = require('../scripts/ab');

const stream = (...events) => events.map((e) => JSON.stringify(e)).join('\n');
const INIT_WITH_PLUGIN = {
  type: 'system', subtype: 'init',
  plugins: [{ name: 'clean-n-code', path: '/x' }, { name: 'cc-plugin-telemetry', path: 'builtin' }],
};

test('parseStream reads non-builtin plugins, mode injection and the final result', () => {
  const run = parseStream(stream(
    { type: 'system', subtype: 'hook_response', output: 'CLEAN-N-CODE MODE ACTIVE\n...' },
    INIT_WITH_PLUGIN,
    { type: 'assistant', message: {} },
    { type: 'result', result: 'hello', total_cost_usd: 0.12, num_turns: 2, duration_ms: 3400, is_error: false },
  ) + '\nnot json');
  assert.deepEqual(run.plugins, ['clean-n-code']);
  assert.equal(run.modeInjected, true);
  assert.equal(run.answer, 'hello');
  assert.equal(run.costUsd, 0.12);
  assert.equal(run.turns, 2);
  assert.equal(run.isError, false);
});

test('parseStream without a result event marks the run as an error', () => {
  assert.equal(parseStream(stream(INIT_WITH_PLUGIN)).isError, true);
});

test('isolationProblems accepts a clean baseline and a plugin-only treatment', () => {
  assert.deepEqual(isolationProblems({ plugins: [] }, { plugins: ['clean-n-code'] }), []);
});

test('isolationProblems flags a leaked user plugin in either arm and a missing plugin', () => {
  assert.equal(isolationProblems({ plugins: ['ponytail'] }, { plugins: ['clean-n-code'] }).length, 1);
  assert.equal(isolationProblems({ plugins: [] }, { plugins: ['clean-n-code', 'ponytail'] }).length, 1);
  assert.equal(isolationProblems({ plugins: [] }, { plugins: [] }).length, 1);
});

test('extractCode returns the first fenced block with an extension from its language', () => {
  assert.deepEqual(extractCode('intro\n```go\nfunc A() {}\n```\n```py\nx\n```'), { ext: 'go', code: 'func A() {}\n' });
  assert.equal(extractCode('```\nplain\n```').ext, 'txt');
  assert.equal(extractCode('no code here'), null);
});

test('loadCase strips frontmatter and keeps max_turns and allowed_tools', () => {
  const opts = loadCase('mode-writes-idiomatic-go');
  assert.equal(opts.maxTurns, 10);
  assert.deepEqual(opts.allowedTools, ['Read', 'Glob', 'Grep']);
  assert.match(opts.prompt, /^Write a Go function/);
});

test('parseArgs takes a free prompt and options, and requires a prompt', () => {
  const opts = parseArgs(['--model', 'sonnet', '--max-turns', '4', 'write', 'a', 'parser']);
  assert.equal(opts.prompt, 'write a parser');
  assert.equal(opts.model, 'sonnet');
  assert.equal(opts.maxTurns, 4);
  assert.throws(() => parseArgs([]), /Usage/);
});

test('parseLizardCsv reads per-function NLOC and CCN', () => {
  const csv = '15,5,128,1,16,"LoadConfig@7-22@a.go","a.go","LoadConfig","LoadConfig path string",7,22\n'
    + '3,1,10,0,3,"helper@24-26@a.go","a.go","helper","helper",24,26\n';
  assert.deepEqual(parseLizardCsv(csv), [{ name: 'LoadConfig', nloc: 15, ccn: 5 }, { name: 'helper', nloc: 3, ccn: 1 }]);
});

test('parseStream sums token usage from the result event', () => {
  const run = parseStream(JSON.stringify({
    type: 'result', result: 'x', model_usage_since_last_result: {
      a: { inputTokens: 2, outputTokens: 50, cacheReadInputTokens: 900, cacheCreationInputTokens: 100 },
    },
  }));
  assert.deepEqual(run.tokens, { input: 2, output: 50, cacheRead: 900, cacheCreation: 100 });
});
