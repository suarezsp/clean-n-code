#!/usr/bin/env node
// A/B: runs one prompt through Claude Code without and with the clean-n-code plugin, then diffs the answers.
// Both arms start in an empty temp dir with user settings off, so no user plugin (ponytail, …) leaks in.
// shortcut: one run per arm, so the diff illustrates rather than measures; `npm run eval` does 1 graded run per case.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const { citedCodes, invalidCodes } = require('../lib/codes');
const { parseLizardCsv, measureFunctions } = require('../lib/lizard');
const { parseArgs, loadCase, selectCases } = require('./ab/args');
const { parseJudge, judgePrompt, combineVerdicts, judgePair } = require('./ab/judge');
const { buildReport, gateFailure, signTestP, median, judgeTally, tallyText, winnerLabel } = require('./ab/report');

const ROOT = path.join(__dirname, '..');
const PLUGIN_NAME = 'clean-n-code';
const MODE_MARKER = 'CLEAN-N-CODE MODE ACTIVE';
const FENCE_EXTENSIONS = {
  python: 'py', py: 'py', javascript: 'js', js: 'js', typescript: 'ts', ts: 'ts', java: 'java', csharp: 'cs',
  cs: 'cs', cpp: 'cpp', 'c++': 'cpp', c: 'c', go: 'go', rust: 'rs', rs: 'rs', php: 'php', sql: 'sql',
  bash: 'sh', sh: 'sh', shell: 'sh',
};
const CHECK_LEFTOVERS = /(^|\/)(__pycache__|\.pytest_cache)(\/|$)/; // left by --check; the arm didn't write them

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
    const event = parseJsonLine(line);
    if (event) applyStreamEvent(run, event);
  }
  return run;
}

function parseJsonLine(line) {
  try { return JSON.parse(line); } catch { return null; }
}

function applyStreamEvent(run, event) {
  if (event.type === 'result') return applyResultEvent(run, event);
  if (event.type !== 'system') return;
  if (event.subtype === 'init') {
    run.plugins = (event.plugins || []).filter((p) => p.path !== 'builtin').map((p) => p.name);
  } else if (event.subtype === 'hook_response' && JSON.stringify(event).includes(MODE_MARKER)) {
    run.modeInjected = true;
  }
}

function applyResultEvent(run, event) {
  Object.assign(run, {
    answer: event.result || '', costUsd: event.total_cost_usd || 0, turns: event.num_turns || 0,
    durationMs: event.duration_ms || 0, isError: Boolean(event.is_error),
    tokens: sumTokens(event.model_usage_since_last_result || event.modelUsage || {}),
  });
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
  const hookLogDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ab-hooklog-'));
  const hookLog = path.join(hookLogDir, 'after-write.log');
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
    const discard = () => [cwd, hookLogDir].forEach((dir) => fs.rmSync(dir, { recursive: true, force: true }));
    child.on('error', (err) => {
      discard();
      reject(new Error(`could not start claude: ${err.message}`));
    });
    child.on('close', (code) => {
      const run = { ...parseStream(stdout), cwd, ...hookCounts(hookLog) };
      fs.rmSync(hookLogDir, { recursive: true, force: true });
      if (code === 0 || run.answer) return resolve(run);
      discard();
      reject(new Error(`claude exited ${code} (${withPlugin ? 'with' : 'without'}): ${stderr.trim()}`));
    });
  });
}

// What the hooks did during an arm: language cards sent, and turns check-codes sent back.
function hookCounts(logFile) {
  let lines = [];
  try { lines = fs.readFileSync(logFile, 'utf8').split('\n'); } catch { /* the hook never fired */ }
  const count = (entry) => lines.filter((l) => l === entry).length;
  return { cardsSent: count('card'), codeBlocks: count('code-block') };
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
    .filter((file) => !CHECK_LEFTOVERS.test(file) && fs.statSync(path.join(dir, file)).isFile())
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
  const invalid = (run) => invalidCodes(run.answer.split('Applied:').slice(1).at(-1) || '').join(', ') || 'none';
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
    row('turns sent back for invalid codes', without.codeBlocks, withPlugin.codeBlocks),
    row('rule codes cited', codes(without), codes(withPlugin)),
    row('invalid codes (closing line)', invalid(without), invalid(withPlugin)),
    '',
    `Compared: ${path.basename(compared[0])} vs ${path.basename(compared[1])}${filesDiff ? '; written files in files.patch' : ''}.`,
    '',
  ].join('\n');
}

const removeArmDirs = (...runs) => runs.forEach((run) => fs.rmSync(run.cwd, { recursive: true, force: true }));

// Both arms of one prompt; throws when the comparison would be meaningless. The caller removes the arms' temp dirs.
async function runPair(opts) {
  const settled = await Promise.allSettled([runArm(opts, false), runArm(opts, true)]);
  const rejected = settled.find((arm) => arm.status === 'rejected');
  if (rejected) {
    removeArmDirs(...settled.filter((arm) => arm.status === 'fulfilled').map((arm) => arm.value));
    throw rejected.reason;
  }
  const [without, withPlugin] = settled.map((arm) => arm.value);
  const problems = isolationProblems(without, withPlugin, { variant: Boolean(opts.variant), extraPlugin: extraPluginName(opts) });
  const failures = [['without', without], ['with', withPlugin]]
    .map(([arm, run]) => armFailure(run) && `${arm} arm failed: ${armFailure(run)}`).filter(Boolean);
  if (problems.length || failures.length) removeArmDirs(without, withPlugin);
  if (problems.length) throw new Error(`A/B is not isolated, refusing to compare:\n- ${problems.join('\n- ')}`);
  if (failures.length) throw new Error(failures.join('\n'));
  return { without, withPlugin };
}

async function runCaseOnce(caseOpts, runDir, suiteDir) {
  const { without, withPlugin } = await runPair(caseOpts);
  const { summary, compared, filesDiff, code, metrics } = writeResults(runDir, caseOpts, without, withPlugin);
  removeArmDirs(without, withPlugin);
  // Diffed from the suite dir so headers name the case: a/mode-writes-idiomatic-go/without.go.
  const pair = filesDiff ? Object.values(armDirs(runDir)) : compared;
  const patch = gitDiff(suiteDir, ...pair.map((f) => path.relative(suiteDir, f)));
  const judge = caseOpts.judge ? await judgePair(caseOpts, code) : null;
  if (judge) fs.writeFileSync(path.join(runDir, 'judge.json'), `${JSON.stringify(judge, null, 2)}\n`);
  return { without, withPlugin, summary, patch, metrics, judge };
}

// A usage limit fails every later run too, so the suite stops there and reports what it has.
const isUsageLimit = (message) => /hit your .*limit|usage limit|rate limit/i.test(message);

// Every run of one case; stops at the first usage limit and says why in `stopped`.
async function runCase(name, caseOpts, { dir, position, total }) {
  const runs = [];
  for (let i = 0; i < caseOpts.runs; i++) {
    console.error(`[${position}/${total}] ${name}${caseOpts.runs > 1 ? ` run ${i + 1}/${caseOpts.runs}` : ''}`);
    const runDir = caseOpts.runs > 1 ? path.join(dir, name, `run-${i + 1}`) : path.join(dir, name);
    try {
      runs.push(await runCaseOnce(caseOpts, runDir, dir));
    } catch (err) {
      console.error(`  ${err.message}`);
      runs.push({ failed: err.message.replace(/\n/g, '; ') });
      if (isUsageLimit(err.message)) return { runs, stopped: err.message.split('\n')[0] };
    }
  }
  return { runs, stopped: '' };
}

async function runSuite(opts, dir) {
  const names = selectCases(fs.readdirSync(path.join(ROOT, 'evals')), opts.cases);
  const results = [];
  let stopped = '';
  for (const name of names) {
    if (stopped) break;
    const caseOpts = { ...opts, ...loadCase(name) };
    const outcome = await runCase(name, caseOpts, { dir, position: results.length + 1, total: names.length });
    stopped = outcome.stopped;
    results.push({ name, runs: outcome.runs });
  }
  if (stopped) console.error(`Stopped early: ${stopped}`);
  writeSuiteOutputs(dir, results, opts);
}

function writeSuiteOutputs(dir, results, opts) {
  const labels = armLabels(opts);
  const checks = runChecks(dir, labels);
  fs.writeFileSync(path.join(dir, 'report.md'), buildReport(results, labels, checks));
  const patches = results.flatMap((r) => r.runs.filter((run) => !run.failed).map((run) => run.patch));
  fs.writeFileSync(path.join(dir, 'all.patch'), patches.join(''));
  console.log(`Report: ${path.relative(process.cwd(), path.join(dir, 'report.md'))}`);
  const gate = opts.gate && gateFailure(results);
  if (gate) {
    console.error(`Gate failed: ${gate}`);
    process.exitCode = 1;
  }
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
  const labels = armLabels(opts);
  const lines = [`# Re-judged with ${opts.judgeModel}: ${path.basename(opts.rejudge)}`, ''];
  const all = [];
  const reasons = [];
  for (const { name, runDirs } of savedRuns(opts.rejudge)) {
    console.error(`rejudging ${name} (${runDirs.length} runs)`);
    const verdicts = [];
    for (const runDir of runDirs) {
      const prompt = fs.readFileSync(path.join(runDir, 'prompt.md'), 'utf8').trim();
      verdicts.push({ judge: await judgePair({ ...opts, prompt }, savedCode(runDir)) });
    }
    all.push(...verdicts);
    lines.push(`- ${name}: ${tallyText(judgeTally(verdicts), labels)}`);
    reasons.push(`## ${name}`, ...verdicts.filter((v) => v.judge).map((v, i) => `- run ${i + 1}: **${winnerLabel(v.judge.winner, labels)}**. ${v.judge.reasons}`), '');
  }
  lines.splice(1, 0, `**Total:** ${tallyText(judgeTally(all), labels)}`);
  const out = path.join(opts.rejudge, `rejudge-${opts.judgeModel}.md`);
  fs.writeFileSync(out, `${[...lines, '', ...reasons].join('\n')}\n`);
  console.log(lines.join('\n'));
}

// What one arm left in a finished run: its written files, else its code block file.
function armOutput(runDir, arm) {
  const written = armDirs(runDir)[arm];
  if (fs.existsSync(written)) return written;
  const file = fs.readdirSync(runDir).find((f) => f.startsWith(`${arm}.`) && !f.endsWith('.md'));
  return file && path.join(runDir, file);
}

// Runs one arm's saved output through the case's check script; returns whether it passed.
function checkArm(script, runDir, arm, name) {
  const target = armOutput(runDir, arm);
  const result = target && spawnSync('bash', [script, target], { encoding: 'utf8', timeout: 120000 });
  if (result && result.status === 0) return true;
  console.error(`  FAIL ${name} ${path.basename(runDir)} ${arm}: ${(result?.stdout + result?.stderr || 'no output').trim().split('\n').slice(-3).join(' | ')}`);
  return false;
}

// Runs evals/<case>/check.sh <arm output> on every saved run; exit 0 means the hidden checks passed.
function runChecks(suiteDir, labels = ['without', 'with']) {
  const lines = [`# Hidden checks: ${path.basename(suiteDir)}`, '', `| case | ${labels[0]} | ${labels[1]} |`, '|---|---|---|'];
  const total = { without: [0, 0], with: [0, 0] };
  const perCase = {};
  for (const { name, runDirs } of savedRuns(suiteDir)) {
    const script = path.join(ROOT, 'evals', name, 'check.sh');
    if (!fs.existsSync(script)) continue;
    const passed = { without: 0, with: 0 };
    for (const runDir of runDirs) {
      for (const arm of ['without', 'with']) passed[arm] += checkArm(script, runDir, arm, name) ? 1 : 0;
    }
    for (const arm of ['without', 'with']) total[arm] = [total[arm][0] + passed[arm], total[arm][1] + runDirs.length];
    perCase[name] = { ...passed, runs: runDirs.length };
    lines.push(`| ${name} | ${passed.without}/${runDirs.length} | ${passed.with}/${runDirs.length} |`);
  }
  lines.push(`| **total** | ${total.without.join('/')} | ${total.with.join('/')} |`);
  fs.writeFileSync(path.join(suiteDir, 'check.md'), `${lines.join('\n')}\n`);
  console.log(lines.join('\n'));
  return { total, perCase };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const dir = path.join(ROOT, 'ab-results', new Date().toISOString().replace(/[:.]/g, '-'));
  console.error(`Model ${opts.model}, max ${opts.maxTurns} turns per arm…`);
  if (opts.rejudge) return rejudge(opts);
  if (opts.check) return runChecks(opts.check, armLabels(opts));
  if (opts.suite) return runSuite(opts, dir);

  const { without, withPlugin } = await runPair(opts);
  const { compared, summary } = writeResults(dir, opts, without, withPlugin);
  removeArmDirs(without, withPlugin);
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
  parseArgs, loadCase, parseStream, isolationProblems, extractCode, parseLizardCsv, selectCases, armFailure, buildReport, gateFailure, signTestP,
  metricsOf, median, parseJudge, judgePrompt, combineVerdicts, hookCounts, isUsageLimit, savedCode, savedRuns,
  armOutput,
};
