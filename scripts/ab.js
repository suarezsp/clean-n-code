#!/usr/bin/env node
// A/B: runs one prompt through Claude Code without and with the clean-n-code plugin, then diffs the answers.
// Both arms start in an empty temp dir with user settings off, so no user plugin (ponytail, …) leaks in.
// shortcut: one run per arm, so the diff illustrates rather than measures; `npm run eval` does 3 graded runs.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const { citedCodes, invalidCodes } = require('../lib/codes');
const { parseLizardCsv, measureFunctions } = require('../lib/lizard');

const ROOT = path.join(__dirname, '..');
const PLUGIN_NAME = 'clean-n-code';
const MODE_MARKER = 'CLEAN-N-CODE MODE ACTIVE';
const FENCE_EXTENSIONS = {
  python: 'py', py: 'py', javascript: 'js', js: 'js', typescript: 'ts', ts: 'ts', java: 'java', csharp: 'cs',
  cs: 'cs', cpp: 'cpp', 'c++': 'cpp', c: 'c', go: 'go', rust: 'rs', rs: 'rs', php: 'php', sql: 'sql',
  bash: 'sh', sh: 'sh', shell: 'sh',
};
const USAGE = `Usage:
  npm run ab -- "<prompt>"
  npm run ab -- --case <eval case name>        (uses evals/<case>/prompt.md)
  npm run ab -- --prompt-file <file.md>
  npm run ab -- --suite [--cases a,b] [--runs n] [--judge]   (code-writing cases: evals/mode-*, evals/refactor-*)
  npm run ab -- --rejudge <ab-results/ts> --judge-model opus   (judge an existing suite's pairs again)
  npm run ab -- --suite --variant <plugin dir>  (A/B two skill versions: <dir> is arm A, this repo is arm B)
  npm run ab -- --check <ab-results/ts>        (run each case's evals/<case>/check.sh on both arms' saved output)
Options: --model <model> (default sonnet)  --effort <low|medium|high>  --extra-plugin-dir <dir> (loaded in both arms, e.g. ponytail)  --judge-model <model> (default sonnet)  --max-turns <n> (default 10)  --allowed-tools <A,B> (default Read,Glob,Grep,Skill)`;
const CODE_WRITING_CASE = /^(mode|refactor)-/;

function parseArgs(argv) {
  const opts = { maxTurns: 10, allowedTools: ['Read', 'Glob', 'Grep', 'Skill'], model: 'sonnet', judgeModel: 'sonnet', runs: 1 };
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (flag === '--case') opts.caseName = argv[++i];
    else if (flag === '--prompt-file') opts.prompt = fs.readFileSync(argv[++i], 'utf8');
    else if (flag === '--model') opts.model = argv[++i];
    else if (flag === '--max-turns') opts.maxTurns = Number(argv[++i]);
    else if (flag === '--allowed-tools') opts.allowedTools = argv[++i].split(',');
    else if (flag === '--suite') opts.suite = true;
    else if (flag === '--runs') opts.runs = Number(argv[++i]);
    else if (flag === '--judge') opts.judge = true;
    else if (flag === '--judge-model') opts.judgeModel = argv[++i];
    else if (flag === '--variant') opts.variant = path.resolve(argv[++i]);
    else if (flag === '--rejudge') opts.rejudge = path.resolve(argv[++i]);
    else if (flag === '--cases') Object.assign(opts, { suite: true, cases: argv[++i].split(',') });
    else if (flag === '--effort') opts.effort = argv[++i];
    else if (flag === '--extra-plugin-dir') opts.extraPluginDir = path.resolve(argv[++i]);
    else if (flag === '--check') opts.check = path.resolve(argv[++i]);
    else rest.push(flag);
  }
  if (rest.length) opts.prompt = rest.join(' ');
  if (opts.caseName) Object.assign(opts, loadCase(opts.caseName));
  if (!opts.prompt && !opts.suite && !opts.rejudge && !opts.check) throw new Error(USAGE);
  if (!Number.isInteger(opts.runs) || opts.runs < 1) throw new Error(`--runs must be a whole number of at least 1\n${USAGE}`);
  return opts;
}

// Reads an eval case prompt and the max_turns / allowed_tools in its frontmatter.
function loadCase(name) {
  const caseDir = path.join(ROOT, 'evals', name);
  const text = fs.readFileSync(path.join(caseDir, 'prompt.md'), 'utf8');
  const fixtureDir = path.join(caseDir, 'fixture');
  const [, frontmatter = '', body = text] = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/) || [];
  const turns = frontmatter.match(/^max_turns:\s*(\d+)/m);
  const tools = frontmatter.match(/^allowed_tools:\s*\[(.*)\]/m);
  return {
    prompt: body.trim(),
    ...(turns && { maxTurns: Number(turns[1]) }),
    ...(tools && { allowedTools: tools[1].split(',').map((t) => t.trim()).filter(Boolean) }),
    ...(fs.existsSync(fixtureDir) && { fixtureDir }),
  };
}

// Eval cases that make the agent write code; review/secure cases only produce prose, so they don't diff well.
function selectCases(names, wanted) {
  if (!wanted) return names.filter((name) => CODE_WRITING_CASE.test(name)).sort();
  const unknown = wanted.filter((name) => !names.includes(name));
  if (unknown.length) throw new Error(`unknown eval case(s): ${unknown.join(', ')}`);
  return wanted;
}

// Why an arm can't be compared (usage limit, crash, auth), or null. A limit reply costs nothing and looks like an answer.
function armFailure(run) {
  if (!run.isError && run.costUsd > 0) return null;
  return (run.answer || 'no result event').trim().split('\n')[0];
}

// Pulls what we need out of `claude -p --output-format stream-json --verbose`.
function parseStream(streamText) {
  const run = {
    plugins: [], modeInjected: false, answer: '', costUsd: 0, turns: 0, durationMs: 0, isError: true,
    tokens: { input: 0, output: 0, cacheRead: 0, cacheCreation: 0 },
  };
  for (const line of streamText.split('\n')) {
    let event;
    try { event = JSON.parse(line); } catch { continue; }
    if (event.type === 'system' && event.subtype === 'init') {
      run.plugins = (event.plugins || []).filter((p) => p.path !== 'builtin').map((p) => p.name);
    }
    if (event.type === 'system' && event.subtype === 'hook_response' && JSON.stringify(event).includes(MODE_MARKER)) {
      run.modeInjected = true;
    }
    if (event.type === 'result') {
      Object.assign(run, {
        answer: event.result || '', costUsd: event.total_cost_usd || 0, turns: event.num_turns || 0,
        durationMs: event.duration_ms || 0, isError: Boolean(event.is_error),
        tokens: sumTokens(event.model_usage_since_last_result || event.modelUsage || {}),
      });
    }
  }
  return run;
}

// Token totals across models, to show where an arm's cost comes from.
function sumTokens(modelUsage) {
  const total = { input: 0, output: 0, cacheRead: 0, cacheCreation: 0 };
  for (const usage of Object.values(modelUsage)) {
    total.input += usage.inputTokens || 0;
    total.output += usage.outputTokens || 0;
    total.cacheRead += usage.cacheReadInputTokens || 0;
    total.cacheCreation += usage.cacheCreationInputTokens || 0;
  }
  return total;
}

// The comparison is only fair if each arm loads exactly what it should: nothing or clean-n-code for arm A, clean-n-code for B.
// An --extra-plugin-dir plugin (e.g. ponytail) must load in both arms.
function isolationProblems(without, withPlugin, { variant = false, extraPlugin = null } = {}) {
  const problems = [];
  const shared = extraPlugin ? [extraPlugin] : [];
  const check = (label, run, expected) => {
    const missing = expected.filter((name) => !run.plugins.includes(name));
    if (missing.length) problems.push(`${label} did not load ${missing.join(', ')}`);
    const extra = run.plugins.filter((name) => !expected.includes(name));
    if (extra.length) problems.push(`${label} also loaded: ${extra.join(', ')}`);
  };
  check(variant ? 'variant arm' : 'baseline arm', without, [...(variant ? [PLUGIN_NAME] : []), ...shared]);
  check('plugin arm', withPlugin, [PLUGIN_NAME, ...shared]);
  return problems;
}

function extraPluginName(opts) {
  if (!opts.extraPluginDir) return null;
  return JSON.parse(fs.readFileSync(path.join(opts.extraPluginDir, '.claude-plugin', 'plugin.json'), 'utf8')).name;
}

// First fenced code block of a markdown answer, or null.
function extractCode(markdown) {
  const match = markdown.match(/```([\w+#-]*)[^\n]*\n([\s\S]*?)```/);
  if (!match) return null;
  const lang = match[1].toLowerCase();
  return { ext: FENCE_EXTENSIONS[lang] || 'txt', code: match[2] };
}

const armLabels = (opts) => (opts.variant ? [`A (${path.basename(opts.variant)})`, 'B (repo)'] : ['without', 'with']);

// Arm A runs without the plugin, or with the --variant plugin dir; arm B always runs with this repo.
function pluginDirOf(opts, withPlugin) {
  return withPlugin ? ROOT : opts.variant;
}

function runArm(opts, withPlugin) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), `ab-${withPlugin ? 'with' : 'without'}-`));
  if (opts.fixtureDir) fs.cpSync(opts.fixtureDir, cwd, { recursive: true });
  const pluginDir = pluginDirOf(opts, withPlugin);
  // Outside cwd, so it never shows up as a file the arm wrote.
  const hookLog = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'ab-hooklog-')), 'after-write.log');
  const args = [
    '-p', opts.prompt, '--output-format', 'stream-json', '--verbose', '--setting-sources', 'project',
    '--no-session-persistence', '--max-turns', String(opts.maxTurns), '--allowed-tools', opts.allowedTools.join(','),
    ...(opts.model ? ['--model', opts.model] : []),
    ...(opts.effort ? ['--effort', opts.effort] : []),
    ...(pluginDir ? ['--plugin-dir', pluginDir] : []),
    ...(opts.extraPluginDir ? ['--plugin-dir', opts.extraPluginDir] : []),
  ];
  return new Promise((resolve, reject) => {
    const env = { ...process.env, CLEAN_N_CODE_HOOK_LOG: hookLog };
    const child = spawn('claude', args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', (err) => reject(new Error(`could not start claude: ${err.message}`)));
    child.on('close', (code) => {
      const run = { ...parseStream(stdout), cwd, ...hookCounts(hookLog) };
      if (code !== 0 && !run.answer) reject(new Error(`claude exited ${code} (${withPlugin ? 'with' : 'without'}): ${stderr.trim()}`));
      else resolve(run);
    });
  });
}

// How many language cards the after-write hook sent during an arm.
function hookCounts(logFile) {
  let lines = [];
  try { lines = fs.readFileSync(logFile, 'utf8').split('\n'); } catch { /* the hook never fired */ }
  return { cardsSent: lines.filter((l) => l === 'card').length };
}

// Paths are relative to cwd so diff headers read `a/without.go`, not an absolute path.
function gitDiff(cwd, a, b, extraArgs = []) {
  // git diff --no-index exits 1 when files differ; that's the expected case.
  return spawnSync('git', ['--no-pager', 'diff', '--no-index', ...extraArgs, '--', a, b], { cwd, encoding: 'utf8' }).stdout;
}

function armDirs(dir) {
  return { without: path.join(dir, 'files', 'without'), with: path.join(dir, 'files', 'with') };
}

function writeResults(dir, opts, without, withPlugin) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'prompt.md'), `${opts.prompt}\n`);
  fs.writeFileSync(path.join(dir, 'without.md'), `${without.answer}\n`);
  fs.writeFileSync(path.join(dir, 'with.md'), `${withPlugin.answer}\n`);

  const codeWithout = extractCode(without.answer);
  const codeWith = extractCode(withPlugin.answer);
  let compared = ['without.md', 'with.md'];
  if (codeWithout && codeWith) {
    compared = [`without.${codeWithout.ext}`, `with.${codeWith.ext}`];
    fs.writeFileSync(path.join(dir, compared[0]), codeWithout.code);
    fs.writeFileSync(path.join(dir, compared[1]), codeWith.code);
  }
  const [a, b] = compared.map((f) => path.join(dir, f));
  fs.writeFileSync(path.join(dir, 'diff.patch'), gitDiff(dir, ...compared));

  const filesDiff = copyWrittenFiles(dir, without.cwd, withPlugin.cwd);
  // Written files are the real output when the case allows Write; otherwise the answer's code block.
  const targets = filesDiff ? [armDirs(dir).without, armDirs(dir).with] : [codeWithout && a, codeWith && b];
  const functions = targets.map((target) => target && measureFunctions(target));
  const code = filesDiff ? targets.map(readTree) : [codeWithout?.code, codeWith?.code];
  const summary = summarize({ labels: armLabels(opts), without, withPlugin, functions, measured: targets.map(Boolean), compared: [a, b], filesDiff });
  fs.writeFileSync(path.join(dir, 'summary.md'), summary);
  return { dir, compared: [a, b], summary, filesDiff, code, metrics: functions.map(metricsOf) };
}

// Every file under dir as one text, each preceded by its path, for the judge.
function readTree(dir) {
  return fs.readdirSync(dir, { recursive: true }).sort()
    .filter((file) => fs.statSync(path.join(dir, file)).isFile())
    .map((file) => `// file: ${file}\n${fs.readFileSync(path.join(dir, file), 'utf8')}`).join('\n');
}

// Files an arm wrote into its temp dir (only when tools like Write were allowed).
function copyWrittenFiles(dir, cwdWithout, cwdWith) {
  if (!fs.readdirSync(cwdWithout).length && !fs.readdirSync(cwdWith).length) return false;
  fs.cpSync(cwdWithout, armDirs(dir).without, { recursive: true });
  fs.cpSync(cwdWith, armDirs(dir).with, { recursive: true });
  fs.writeFileSync(path.join(dir, 'files.patch'), gitDiff(path.join(dir, 'files'), 'without', 'with'));
  return true;
}

// Whole-answer numbers per arm; null when nothing was measured.
function metricsOf(functions) {
  if (!functions) return null;
  const max = (pick) => Math.max(0, ...functions.map(pick));
  return {
    functions: functions.length,
    totalNloc: functions.reduce((total, f) => total + f.nloc, 0),
    maxCcn: max((f) => f.ccn),
    maxNloc: max((f) => f.nloc),
    maxNesting: max((f) => f.nesting ?? 0),
  };
}

function summarize({ labels, without, withPlugin, functions, measured, compared, filesDiff }) {
  const perFunction = (arm, pick) => {
    if (!measured[arm]) return '—';
    if (!functions[arm]) return 'not measured';
    return functions[arm].map((f) => `${f.name} ${pick(f)}`).join(', ') || 'no functions';
  };
  const codes = (run) => citedCodes(run.answer).join(', ') || '—';
  const invalid = (run) => invalidCodes(run.answer.trim().split('\n').filter((l) => /^\W*Applied:/.test(l)).at(-1) || '').join(', ') || 'none';
  const tokens = ({ tokens: t }) => `${t.input} in / ${t.cacheRead} cache read / ${t.cacheCreation} cache write / ${t.output} out`;
  const row = (label, a, b) => `| ${label} | ${a} | ${b} |`;
  const fnRow = (label, pick) => row(label, perFunction(0, pick), perFunction(1, pick));
  return [
    `| | ${labels[0]} | ${labels[1]} |`,
    '|---|---|---|',
    row('plugins loaded', without.plugins.join(', ') || 'none', withPlugin.plugins.join(', ')),
    row('mode injected', without.modeInjected ? 'yes' : 'no', withPlugin.modeInjected ? 'yes' : 'no'),
    row('cost USD', without.costUsd.toFixed(4), withPlugin.costUsd.toFixed(4)),
    row('turns', without.turns, withPlugin.turns),
    row('duration s', (without.durationMs / 1000).toFixed(1), (withPlugin.durationMs / 1000).toFixed(1)),
    row('tokens', tokens(without), tokens(withPlugin)),
    fnRow('function length, NLOC (K9)', (f) => f.nloc),
    fnRow('cyclomatic complexity (K1)', (f) => f.ccn),
    fnRow('nesting depth (K2)', (f) => f.nesting ?? '?'),
    row('language cards sent after a write', without.cardsSent, withPlugin.cardsSent),
    row('rule codes cited', codes(without), codes(withPlugin)),
    row('invalid codes (closing line)', invalid(without), invalid(withPlugin)),
    '',
    `Compared: ${path.basename(compared[0])} vs ${path.basename(compared[1])}${filesDiff ? '; written files in files.patch' : ''}.`,
    '',
  ].join('\n');
}

// Both arms of one prompt; throws when the comparison would be meaningless.
async function runPair(opts) {
  const [without, withPlugin] = await Promise.all([runArm(opts, false), runArm(opts, true)]);
  const problems = isolationProblems(without, withPlugin, { variant: Boolean(opts.variant), extraPlugin: extraPluginName(opts) });
  if (problems.length) throw new Error(`A/B is not isolated, refusing to compare:\n- ${problems.join('\n- ')}`);
  const failures = [['without', without], ['with', withPlugin]]
    .map(([arm, run]) => armFailure(run) && `${arm} arm failed: ${armFailure(run)}`).filter(Boolean);
  if (failures.length) throw new Error(failures.join('\n'));
  return { without, withPlugin };
}

const JUDGE_SCHEMA = {
  type: 'object',
  properties: {
    winner: { enum: ['A', 'B', 'tie'] },
    reasons: { type: 'string' },
    correctness_issue: { type: 'string' },
  },
  required: ['winner', 'reasons', 'correctness_issue'],
};

// The judge never sees which version had which skill; each pair is judged in both orders to cancel position bias.
function judgePrompt(task, code, withFirst) {
  const [a, b] = withFirst ? [code[1], code[0]] : [code[0], code[1]];
  return `You are a senior engineer who must maintain one of these two answers to the same task. Judge only the code.

Task given to both:
${task}

Version A:
\`\`\`
${a}
\`\`\`

Version B:
\`\`\`
${b}
\`\`\`

Which version costs the next reader less to understand and change, while doing exactly what the task asks, `
    + 'no more and no less? Behavior the task did not ask for counts against a version. '
    + 'In correctness_issue, name any version that breaks the task and how, or write "none". Keep reasons to two sentences.';
}

// Maps the judge's A/B verdict back to an arm; null when the reply isn't usable.
function parseJudge(event, withFirst) {
  let verdict = event.structured_output;
  if (!verdict) {
    try { verdict = JSON.parse((event.result || '').match(/\{[\s\S]*\}/)?.[0]); } catch { return null; }
  }
  if (!verdict || !['A', 'B', 'tie'].includes(verdict.winner)) return null;
  const arms = withFirst ? { A: 'with', B: 'without' } : { A: 'without', B: 'with' };
  return { winner: verdict.winner === 'tie' ? 'tie' : arms[verdict.winner], reasons: verdict.reasons, correctnessIssue: verdict.correctness_issue };
}

// Two verdicts on the same pair (one per order) count only when they agree.
// Reasons come from the second order, where the judge's A and B match the report's labels (A = without, B = with).
function combineVerdicts(first, second) {
  if (!first || !second) return first || second ? { ...(second || first), winner: 'inconsistent' } : null;
  const winner = first.winner === second.winner ? first.winner : 'inconsistent';
  return { ...second, winner, orders: [first.winner, second.winner] };
}

function judgeOnce(opts, code, withFirst) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'ab-judge-'));
  const args = [
    '-p', judgePrompt(opts.prompt, code, withFirst), '--output-format', 'json', '--setting-sources', 'project',
    '--no-session-persistence', '--tools', '', '--model', opts.judgeModel, '--json-schema', JSON.stringify(JUDGE_SCHEMA),
  ];
  return new Promise((resolve) => {
    const child = spawn('claude', args, { cwd, stdio: ['ignore', 'pipe', 'ignore'] });
    let stdout = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.on('error', () => resolve(null));
    child.on('close', () => {
      try { resolve(parseJudge(JSON.parse(stdout), withFirst)); } catch { resolve(null); }
    });
  });
}

async function judgePair(opts, code) {
  if (!code[0] || !code[1]) return null;
  const [first, second] = await Promise.all([judgeOnce(opts, code, true), judgeOnce(opts, code, false)]);
  return combineVerdicts(first, second);
}

const pct = (a, b) => (a ? `${b >= a ? '+' : ''}${(((b - a) / a) * 100).toFixed(0)}%` : '—');
const totalTokens = ({ tokens: t }) => t.input + t.cacheRead + t.cacheCreation + t.output;
const median = (values) => {
  const sorted = values.filter((v) => v !== null && v !== undefined).sort((x, y) => x - y);
  if (!sorted.length) return '—';
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};
const METRICS = [
  ['functions', 'functions'], ['totalNloc', 'total NLOC'], ['maxNloc', 'max NLOC (K9)'],
  ['maxCcn', 'max CC (K1)'], ['maxNesting', 'max nesting (K2)'],
];

function judgeTally(runs) {
  const verdicts = runs.map((r) => r.judge).filter(Boolean);
  const count = (winner) => verdicts.filter((v) => v.winner === winner).length;
  return { with: count('with'), without: count('without'), tie: count('tie'), inconsistent: count('inconsistent'), total: verdicts.length };
}

const tallyText = (tally, [a, b]) => `${b} ${tally.with}, ${a} ${tally.without}, tie ${tally.tie}, inconsistent ${tally.inconsistent} (of ${tally.total})`;
const winnerLabel = (winner, [a, b]) => ({ with: b, without: a }[winner] || winner);

function caseSection(result, labels) {
  const ok = result.runs.filter((r) => !r.failed);
  const failed = result.runs.filter((r) => r.failed).map((r) => `FAILED run: ${r.failed}`);
  if (!ok.length) return `## ${result.name}\n\n${failed.join('\n')}\n`;
  const metricRow = ([key, label]) => {
    const pick = (arm) => median(ok.map((r) => r.metrics[arm]?.[key]));
    return `| ${label} | ${pick(0)} | ${pick(1)} |`;
  };
  const tally = judgeTally(ok);
  const verdicts = ok.filter((r) => r.judge).map((r, i) => `- run ${i + 1}: **${winnerLabel(r.judge.winner, labels)}**. ${r.judge.reasons}`
    + (r.judge.correctnessIssue && r.judge.correctnessIssue !== 'none' ? ` Correctness: ${r.judge.correctnessIssue}` : ''));
  return [
    `## ${result.name}`,
    '',
    `| median of ${ok.length} run(s) | ${labels[0]} | ${labels[1]} |`,
    '|---|---|---|',
    ...METRICS.map(metricRow),
    ...(tally.total ? [`| judge wins (both orders agree) | ${tally.without} | ${tally.with} |`] : []),
    '',
    ...(verdicts.length ? ['Judge:', ...verdicts, ''] : []),
    ...failed,
    `Run 1 detail:\n\n${ok[0].summary}`,
    `\`\`\`diff\n${ok[0].patch.trim() || '(no difference)'}\n\`\`\``,
    '',
  ].join('\n');
}

// One markdown file: totals and judge win rate across cases, then each case's medians, verdicts and run-1 diff.
function buildReport(results, labels = ['without', 'with']) {
  const ok = results.flatMap((r) => r.runs.filter((run) => !run.failed));
  const sum = (arm, pick) => ok.reduce((total, run) => total + pick(run[arm]), 0);
  const row = (label, pick, format = (v) => v) => {
    const [a, b] = [sum('without', pick), sum('withPlugin', pick)];
    return `| ${label} | ${format(a)} | ${format(b)} | ${pct(a, b)} |`;
  };
  const tally = judgeTally(ok);
  const runCount = results.reduce((total, r) => total + r.runs.length, 0);
  return [
    `# A/B: ${labels[0]} vs ${labels[1]} (${ok.length}/${runCount} runs compared, ${results.length} cases)`,
    '',
    ...(tally.total ? [`**Blind judge:** ${tallyText(tally, labels)}.`, ''] : []),
    `| total | ${labels[0]} | ${labels[1]} | delta |`,
    '|---|---|---|---|',
    row('cost USD', (run) => run.costUsd, (v) => v.toFixed(4)),
    row('tokens (all)', totalTokens),
    row('output tokens', (run) => run.tokens.output),
    row('turns', (run) => run.turns),
    row('language cards sent', (run) => run.cardsSent),
    '',
    ...results.map((r) => caseSection(r, labels)),
  ].join('\n');
}

async function runCaseOnce(caseOpts, runDir, suiteDir) {
  const { without, withPlugin } = await runPair(caseOpts);
  const { summary, compared, filesDiff, code, metrics } = writeResults(runDir, caseOpts, without, withPlugin);
  // Diffed from the suite dir so headers name the case: a/mode-writes-idiomatic-go/without.go.
  const pair = filesDiff ? Object.values(armDirs(runDir)) : compared;
  const patch = gitDiff(suiteDir, ...pair.map((f) => path.relative(suiteDir, f)));
  const judge = caseOpts.judge ? await judgePair(caseOpts, code) : null;
  if (judge) fs.writeFileSync(path.join(runDir, 'judge.json'), `${JSON.stringify(judge, null, 2)}\n`);
  return { without, withPlugin, summary, patch, metrics, judge };
}

// A usage limit fails every later run too, so the suite stops there and reports what it has.
const isUsageLimit = (message) => /hit your .*limit|usage limit|rate limit/i.test(message);

async function runSuite(opts, dir) {
  const names = selectCases(fs.readdirSync(path.join(ROOT, 'evals')), opts.cases);
  const results = [];
  let stopped = '';
  for (const name of names) {
    if (stopped) break;
    const caseOpts = { ...opts, ...loadCase(name) };
    const runs = [];
    for (let i = 0; i < opts.runs; i++) {
      console.error(`[${results.length + 1}/${names.length}] ${name}${opts.runs > 1 ? ` run ${i + 1}/${opts.runs}` : ''}`);
      const runDir = opts.runs > 1 ? path.join(dir, name, `run-${i + 1}`) : path.join(dir, name);
      try {
        runs.push(await runCaseOnce(caseOpts, runDir, dir));
      } catch (err) {
        console.error(`  ${err.message}`);
        runs.push({ failed: err.message.replace(/\n/g, '; ') });
        if (isUsageLimit(err.message)) {
          stopped = err.message.split('\n')[0];
          break;
        }
      }
    }
    results.push({ name, runs });
  }
  if (stopped) console.error(`Stopped early: ${stopped}`);
  const labels = armLabels(opts);
  fs.writeFileSync(path.join(dir, 'report.md'), buildReport(results, labels));
  const patches = results.flatMap((r) => r.runs.filter((run) => !run.failed).map((run) => run.patch));
  fs.writeFileSync(path.join(dir, 'all.patch'), patches.join(''));
  console.log(`Report: ${path.relative(process.cwd(), path.join(dir, 'report.md'))}`);
}

// The code pair a finished run left on disk: written files when there are any, else the two code blocks.
function savedCode(runDir) {
  if (fs.existsSync(path.join(runDir, 'files'))) return Object.values(armDirs(runDir)).map(readTree);
  const pick = (arm) => fs.readdirSync(runDir).find((f) => f.startsWith(`${arm}.`) && !f.endsWith('.md'));
  return ['without', 'with'].map((arm) => pick(arm) && fs.readFileSync(path.join(runDir, pick(arm)), 'utf8'));
}

// Every run dir of a suite: <case>/run-<i>/ with --runs > 1, else <case>/ itself.
function savedRuns(suiteDir) {
  return fs.readdirSync(suiteDir).filter((name) => fs.statSync(path.join(suiteDir, name)).isDirectory()).sort()
    .map((name) => {
      const caseDir = path.join(suiteDir, name);
      const runDirs = fs.readdirSync(caseDir).filter((d) => /^run-\d+$/.test(d)).map((d) => path.join(caseDir, d));
      return { name, runDirs: (runDirs.length ? runDirs : [caseDir]).filter((d) => fs.existsSync(path.join(d, 'prompt.md'))) };
    });
}

async function rejudge(opts) {
  const lines = [`# Re-judged with ${opts.judgeModel}: ${path.basename(opts.rejudge)}`, ''];
  const all = [];
  for (const { name, runDirs } of savedRuns(opts.rejudge)) {
    console.error(`rejudging ${name} (${runDirs.length} runs)`);
    const verdicts = [];
    for (const runDir of runDirs) {
      const prompt = fs.readFileSync(path.join(runDir, 'prompt.md'), 'utf8').trim();
      verdicts.push({ judge: await judgePair({ ...opts, prompt }, savedCode(runDir)) });
    }
    all.push(...verdicts);
    lines.push(`- ${name}: ${tallyText(judgeTally(verdicts), ['without', 'with'])}`);
  }
  lines.splice(1, 0, `**Total:** ${tallyText(judgeTally(all), ['without', 'with'])}`);
  const out = path.join(opts.rejudge, `rejudge-${opts.judgeModel}.md`);
  fs.writeFileSync(out, `${lines.join('\n')}\n`);
  console.log(fs.readFileSync(out, 'utf8'));
}

// What one arm left in a finished run: its written files, else its code block file.
function armOutput(runDir, arm) {
  const written = armDirs(runDir)[arm];
  if (fs.existsSync(written)) return written;
  const file = fs.readdirSync(runDir).find((f) => f.startsWith(`${arm}.`) && !f.endsWith('.md'));
  return file && path.join(runDir, file);
}

// Runs evals/<case>/check.sh <arm output> on every saved run; exit 0 means the hidden checks passed.
function runChecks(suiteDir, labels = ['without', 'with']) {
  const lines = [`# Hidden checks: ${path.basename(suiteDir)}`, '', `| case | ${labels[0]} | ${labels[1]} |`, '|---|---|---|'];
  const total = { without: [0, 0], with: [0, 0] };
  for (const { name, runDirs } of savedRuns(suiteDir)) {
    const script = path.join(ROOT, 'evals', name, 'check.sh');
    if (!fs.existsSync(script)) continue;
    const passed = { without: 0, with: 0 };
    for (const runDir of runDirs) {
      for (const arm of ['without', 'with']) {
        const target = armOutput(runDir, arm);
        const result = target && spawnSync('bash', [script, target], { encoding: 'utf8', timeout: 120000 });
        if (result && result.status === 0) passed[arm] += 1;
        else console.error(`  FAIL ${name} ${path.basename(runDir)} ${arm}: ${(result?.stdout + result?.stderr || 'no output').trim().split('\n').slice(-3).join(' | ')}`);
      }
    }
    for (const arm of ['without', 'with']) total[arm] = [total[arm][0] + passed[arm], total[arm][1] + runDirs.length];
    lines.push(`| ${name} | ${passed.without}/${runDirs.length} | ${passed.with}/${runDirs.length} |`);
  }
  lines.push(`| **total** | ${total.without.join('/')} | ${total.with.join('/')} |`);
  fs.writeFileSync(path.join(suiteDir, 'check.md'), `${lines.join('\n')}\n`);
  console.log(lines.join('\n'));
  return total;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const dir = path.join(ROOT, 'ab-results', new Date().toISOString().replace(/[:.]/g, '-'));
  console.error(`Model ${opts.model}, max ${opts.maxTurns} turns per arm…`);
  if (opts.rejudge) return rejudge(opts);
  if (opts.check) return runChecks(opts.check);
  if (opts.suite) return runSuite(opts, dir);

  const { without, withPlugin } = await runPair(opts);
  const { compared, summary } = writeResults(dir, opts, without, withPlugin);
  process.stdout.write(gitDiff(dir, ...compared.map((f) => path.basename(f)), ['--color=always']));
  console.log(`\n${summary}\nResults: ${path.relative(process.cwd(), dir)}/`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}

module.exports = {
  parseArgs, loadCase, parseStream, isolationProblems, extractCode, parseLizardCsv, selectCases, armFailure, buildReport,
  metricsOf, median, parseJudge, judgePrompt, combineVerdicts, hookCounts, isUsageLimit, savedCode, savedRuns,
  armOutput, runChecks,
};
