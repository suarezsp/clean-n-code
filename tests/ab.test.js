const test = require('node:test');
const assert = require('node:assert/strict');
const {
  parseArgs, loadCase, parseStream, isolationProblems, extractCode, parseLizardCsv, selectCases, armFailure, buildReport,
  metricsOf, median, parseJudge, judgePrompt, combineVerdicts, hookCounts, isUsageLimit, savedCode, savedRuns,
} = require('../scripts/ab');

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

test('parseLizardCsv reads per-function NLOC, CCN, lines and -ENS nesting', () => {
  const csv = '15,5,128,1,16,"LoadConfig@7-22@a.go","a.go","LoadConfig","LoadConfig path string",7,22,2\n'
    + '3,1,10,0,3,"helper@24-26@a.go","a.go","helper","helper",24,26\n';
  assert.deepEqual(parseLizardCsv(csv), [
    { name: 'LoadConfig', file: 'a.go', nloc: 15, ccn: 5, start: 7, end: 22, nesting: 2 },
    { name: 'helper', file: 'a.go', nloc: 3, ccn: 1, start: 24, end: 26, nesting: null },
  ]);
});

test('parseStream sums token usage from the result event', () => {
  const run = parseStream(JSON.stringify({
    type: 'result', result: 'x', model_usage_since_last_result: {
      a: { inputTokens: 2, outputTokens: 50, cacheReadInputTokens: 900, cacheCreationInputTokens: 100 },
    },
  }));
  assert.deepEqual(run.tokens, { input: 2, output: 50, cacheRead: 900, cacheCreation: 100 });
});

test('parseArgs defaults to sonnet and accepts --suite or --cases without a prompt', () => {
  assert.equal(parseArgs(['hi']).model, 'sonnet');
  assert.equal(parseArgs(['--suite']).suite, true);
  assert.deepEqual(parseArgs(['--cases', 'a,b']).cases, ['a', 'b']);
});

test('selectCases keeps only code-writing cases unless named, and rejects unknown names', () => {
  const names = ['review-x', 'mode-b', 'results', 'refactor-a', 'secure-y', 'mode-a'];
  assert.deepEqual(selectCases(names), ['mode-a', 'mode-b', 'refactor-a']);
  assert.deepEqual(selectCases(names, ['review-x']), ['review-x']);
  assert.throws(() => selectCases(names, ['nope']), /unknown eval case/);
});

test('armFailure refuses a usage-limit reply and accepts a paid answer', () => {
  const limit = parseStream(JSON.stringify({ type: 'result', result: "You've hit your 5-hour limit", is_error: true }));
  assert.match(armFailure(limit), /5-hour limit/);
  assert.equal(armFailure({ isError: false, costUsd: 0.05, answer: 'code' }), null);
  assert.equal(armFailure({ isError: false, costUsd: 0, answer: '' }), 'no result event');
});

const arm = (costUsd, output) => ({ costUsd, turns: 1, cardsSent: 0, tokens: { input: 0, output, cacheRead: 100, cacheCreation: 0 } });
const metrics = (maxCcn) => ({ functions: 2, totalNloc: 20, maxCcn, maxNloc: 12, maxNesting: 1 });
const okRun = (maxCcn, judge) => ({
  without: arm(0.1, 100), withPlugin: arm(0.15, 200), summary: '| s |', patch: '-old\n+new\n',
  metrics: [metrics(8), metrics(maxCcn)], judge,
});

test('buildReport totals both arms and shows medians, verdicts, run-1 diff and failures', () => {
  const report = buildReport([
    { name: 'mode-a', runs: [okRun(3, { winner: 'with', reasons: 'Flatter.', correctnessIssue: 'none' }), okRun(5, null), { failed: 'limit' }] },
    { name: 'mode-b', runs: [{ failed: 'with arm failed: limit' }] },
  ]);
  assert.match(report, /2\/4 runs compared, 2 cases/);
  assert.match(report, /\*\*Blind judge:\*\* with 1, without 0, tie 0, inconsistent 0 \(of 1\)/);
  assert.match(report, /\| cost USD \| 0\.2000 \| 0\.3000 \| \+50% \|/);
  assert.match(report, /\| max CC \(K1\) \| 8 \| 4 \|/);
  assert.match(report, /- run 1: \*\*with\*\*\. Flatter\./);
  assert.match(report, /```diff\n-old\n\+new\n```/);
  assert.match(report, /FAILED run: limit/);
  assert.match(report, /## mode-b\n\nFAILED run: with arm failed: limit/);
});

test('metricsOf summarises functions and is null when nothing was measured', () => {
  const fns = [{ nloc: 10, ccn: 3, nesting: 2 }, { nloc: 4, ccn: 6, nesting: null }];
  assert.deepEqual(metricsOf(fns), { functions: 2, totalNloc: 14, maxCcn: 6, maxNloc: 10, maxNesting: 2 });
  assert.deepEqual(metricsOf([]), { functions: 0, totalNloc: 0, maxCcn: 0, maxNloc: 0, maxNesting: 0 });
  assert.equal(metricsOf(null), null);
});

test('median skips missing values', () => {
  assert.equal(median([3, null, 1, 2]), 2);
  assert.equal(median([4, 1]), 2.5);
  assert.equal(median([undefined]), '—');
});

test('parseJudge maps the blind A/B verdict back to the arm in both orders', () => {
  const verdict = { winner: 'A', reasons: 'r', correctness_issue: 'none' };
  assert.equal(parseJudge({ structured_output: verdict }, true).winner, 'with');
  assert.equal(parseJudge({ structured_output: verdict }, false).winner, 'without');
  assert.equal(parseJudge({ result: 'sure: {"winner":"tie","reasons":"x","correctness_issue":"none"}' }, true).winner, 'tie');
  assert.equal(parseJudge({ result: 'no json' }, true), null);
  assert.equal(parseJudge({ structured_output: { winner: 'C' } }, true), null);
});

test('judgePrompt hides which arm had the plugin and swaps the order', () => {
  const first = judgePrompt('task', ['WITHOUT_CODE', 'WITH_CODE'], true);
  assert.ok(first.indexOf('WITH_CODE') < first.indexOf('WITHOUT_CODE'));
  const second = judgePrompt('task', ['WITHOUT_CODE', 'WITH_CODE'], false);
  assert.ok(second.indexOf('WITHOUT_CODE') < second.indexOf('WITH_CODE'));
  assert.doesNotMatch(first, /plugin|clean-n-code/i);
});

test('parseArgs takes --runs, --judge and rejects a bad run count', () => {
  const opts = parseArgs(['--suite', '--runs', '3', '--judge']);
  assert.equal(opts.runs, 3);
  assert.equal(opts.judge, true);
  assert.equal(opts.judgeModel, 'sonnet');
  assert.throws(() => parseArgs(['--suite', '--runs', '0']), /--runs/);
});

test('isolationProblems in variant mode requires clean-n-code in both arms and nothing else', () => {
  const variant = { variant: true };
  assert.deepEqual(isolationProblems({ plugins: ['clean-n-code'] }, { plugins: ['clean-n-code'] }, variant), []);
  assert.equal(isolationProblems({ plugins: [] }, { plugins: ['clean-n-code'] }, variant).length, 1);
  assert.equal(isolationProblems({ plugins: ['clean-n-code', 'ponytail'] }, { plugins: ['clean-n-code'] }, variant).length, 1);
});

test('combineVerdicts keeps a winner only when both orders agree', () => {
  const v = (winner) => ({ winner, reasons: 'r', correctnessIssue: 'none' });
  assert.equal(combineVerdicts(v('with'), v('with')).winner, 'with');
  assert.equal(combineVerdicts(v('with'), v('without')).winner, 'inconsistent');
  assert.equal(combineVerdicts(v('tie'), null).winner, 'inconsistent');
  assert.equal(combineVerdicts(null, null), null);
});

test('buildReport uses the arm labels it is given', () => {
  const report = buildReport([{ name: 'mode-a', runs: [okRun(3, { winner: 'with', reasons: 'x', correctnessIssue: 'none' })] }], ['A (v1)', 'B (repo)']);
  assert.match(report, /^# A\/B: A \(v1\) vs B \(repo\)/);
  assert.match(report, /B \(repo\) 1, A \(v1\) 0/);
  assert.match(report, /- run 1: \*\*B \(repo\)\*\*/);
});

test('parseArgs resolves --variant to an absolute plugin dir', () => {
  assert.ok(require('path').isAbsolute(parseArgs(['--suite', '--variant', 'some/dir']).variant));
});

test('hookCounts counts the cards the after-write hook logged, and zero when it never fired', () => {
  const fs = require('fs');
  const file = require('path').join(fs.mkdtempSync(require('path').join(require('os').tmpdir(), 'ab-t-')), 'log');
  assert.deepEqual(hookCounts(file), { cardsSent: 0 });
  fs.writeFileSync(file, 'card\ncard\n');
  assert.deepEqual(hookCounts(file), { cardsSent: 2 });
});

test('isUsageLimit recognises the limit reply so the suite can stop', () => {
  assert.equal(isUsageLimit("with arm failed: You've hit your 5-hour limit · resets 1am"), true);
  assert.equal(isUsageLimit('with arm failed: no result event'), false);
});

test('savedRuns and savedCode read back a finished suite for re-judging', () => {
  const fs = require('fs');
  const p = require('path');
  const suite = fs.mkdtempSync(p.join(require('os').tmpdir(), 'ab-suite-'));
  const run = p.join(suite, 'mode-a', 'run-1');
  fs.mkdirSync(run, { recursive: true });
  fs.writeFileSync(p.join(run, 'prompt.md'), 'task');
  fs.writeFileSync(p.join(run, 'without.py'), 'A');
  fs.writeFileSync(p.join(run, 'with.py'), 'B');
  fs.writeFileSync(p.join(run, 'with.md'), 'answer');
  const filesRun = p.join(suite, 'mode-b');
  fs.mkdirSync(p.join(filesRun, 'files', 'without'), { recursive: true });
  fs.mkdirSync(p.join(filesRun, 'files', 'with'), { recursive: true });
  fs.writeFileSync(p.join(filesRun, 'prompt.md'), 'task');
  fs.writeFileSync(p.join(filesRun, 'files', 'with', 'x.ts'), 'X');
  assert.deepEqual(savedRuns(suite).map((r) => [r.name, r.runDirs.length]), [['mode-a', 1], ['mode-b', 1]]);
  assert.deepEqual(savedCode(run), ['A', 'B']);
  assert.deepEqual(savedCode(filesRun), ['', '// file: x.ts\nX']);
});
