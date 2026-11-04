#!/usr/bin/env node
// A/B: runs one prompt through Claude Code without and with the clean-n-code plugin, then diffs the answers.
// Both arms start in an empty temp dir with user settings off, so no user plugin (ponytail, …) leaks in.
// shortcut: one run per arm, so the diff illustrates rather than measures; `npm run eval` does 3 graded runs.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const { citedCodes, invalidCodes } = require('../lib/codes');

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
Options: --model <model>  --max-turns <n> (default 10)  --allowed-tools <A,B> (default Read,Glob,Grep,Skill)`;

function parseArgs(argv) {
  const opts = { maxTurns: 10, allowedTools: ['Read', 'Glob', 'Grep', 'Skill'] };
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (flag === '--case') opts.caseName = argv[++i];
    else if (flag === '--prompt-file') opts.prompt = fs.readFileSync(argv[++i], 'utf8');
    else if (flag === '--model') opts.model = argv[++i];
    else if (flag === '--max-turns') opts.maxTurns = Number(argv[++i]);
    else if (flag === '--allowed-tools') opts.allowedTools = argv[++i].split(',');
    else rest.push(flag);
  }
  if (rest.length) opts.prompt = rest.join(' ');
  if (opts.caseName) Object.assign(opts, loadCase(opts.caseName));
  if (!opts.prompt) throw new Error(USAGE);
  return opts;
}

// Reads an eval case prompt and the max_turns / allowed_tools in its frontmatter.
function loadCase(name) {
  const text = fs.readFileSync(path.join(ROOT, 'evals', name, 'prompt.md'), 'utf8');
  const [, frontmatter = '', body = text] = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/) || [];
  const turns = frontmatter.match(/^max_turns:\s*(\d+)/m);
  const tools = frontmatter.match(/^allowed_tools:\s*\[(.*)\]/m);
  return {
    prompt: body.trim(),
    ...(turns && { maxTurns: Number(turns[1]) }),
    ...(tools && { allowedTools: tools[1].split(',').map((t) => t.trim()).filter(Boolean) }),
  };
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

// The comparison is only fair if the baseline loads no user plugin and the treatment loads this one.
function isolationProblems(without, withPlugin) {
  const problems = [];
  if (without.plugins.length) problems.push(`baseline arm loaded plugins: ${without.plugins.join(', ')}`);
  if (!withPlugin.plugins.includes(PLUGIN_NAME)) problems.push(`plugin arm did not load ${PLUGIN_NAME}`);
  const extra = withPlugin.plugins.filter((name) => name !== PLUGIN_NAME);
  if (extra.length) problems.push(`plugin arm also loaded: ${extra.join(', ')}`);
  return problems;
}

// First fenced code block of a markdown answer, or null.
function extractCode(markdown) {
  const match = markdown.match(/```([\w+#-]*)[^\n]*\n([\s\S]*?)```/);
  if (!match) return null;
  const lang = match[1].toLowerCase();
  return { ext: FENCE_EXTENSIONS[lang] || 'txt', code: match[2] };
}

function runArm(opts, withPlugin) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), `ab-${withPlugin ? 'with' : 'without'}-`));
  const args = [
    '-p', opts.prompt, '--output-format', 'stream-json', '--verbose', '--setting-sources', 'project',
    '--no-session-persistence', '--max-turns', String(opts.maxTurns), '--allowed-tools', opts.allowedTools.join(','),
    ...(opts.model ? ['--model', opts.model] : []),
    ...(withPlugin ? ['--plugin-dir', ROOT] : []),
  ];
  return new Promise((resolve, reject) => {
    const child = spawn('claude', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', (err) => reject(new Error(`could not start claude: ${err.message}`)));
    child.on('close', (code) => {
      const run = { ...parseStream(stdout), cwd };
      if (code !== 0 && !run.answer) reject(new Error(`claude exited ${code} (${withPlugin ? 'with' : 'without'}): ${stderr.trim()}`));
      else resolve(run);
    });
  });
}

// Paths are relative to cwd so diff headers read `a/without.go`, not an absolute path.
function gitDiff(cwd, a, b, extraArgs = []) {
  // git diff --no-index exits 1 when files differ; that's the expected case.
  return spawnSync('git', ['--no-pager', 'diff', '--no-index', ...extraArgs, '--', a, b], { cwd, encoding: 'utf8' }).stdout;
}

// lizard --csv rows: NLOC,CCN,tokens,params,length,"location","file","function",…
function parseLizardCsv(csv) {
  return [...csv.matchAll(/^(\d+),(\d+),\d+,\d+,\d+,"[^"]*","[^"]*","([^"]*)"/gm)]
    .map((m) => ({ name: m[3], nloc: Number(m[1]), ccn: Number(m[2]) }));
}

// Per-function size (K9: the function itself, nothing around it) and CC (K1) via a run-once lizard.
// Returns null when lizard can't run, so the summary says "not measured" instead of a misleading block count.
function measureFunctions(file) {
  const result = spawnSync('uvx', ['lizard', '--csv', file], { encoding: 'utf8', timeout: 120000 });
  if (result.error || !result.stdout) return null;
  return parseLizardCsv(result.stdout);
}

function writeResults(opts, without, withPlugin) {
  const dir = path.join(ROOT, 'ab-results', new Date().toISOString().replace(/[:.]/g, '-'));
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
  const summary = summarize({ without, withPlugin, codeWithout, codeWith, compared: [a, b], filesDiff });
  fs.writeFileSync(path.join(dir, 'summary.md'), summary);
  return { dir, compared: [a, b], summary };
}

// Files an arm wrote into its temp dir (only when tools like Write were allowed).
function copyWrittenFiles(dir, cwdWithout, cwdWith) {
  if (!fs.readdirSync(cwdWithout).length && !fs.readdirSync(cwdWith).length) return false;
  const target = (arm) => path.join(dir, 'files', arm);
  fs.cpSync(cwdWithout, target('without'), { recursive: true });
  fs.cpSync(cwdWith, target('with'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'files.patch'), gitDiff(path.join(dir, 'files'), 'without', 'with'));
  return true;
}

function summarize({ without, withPlugin, codeWithout, codeWith, compared, filesDiff }) {
  const functions = [codeWithout && measureFunctions(compared[0]), codeWith && measureFunctions(compared[1])];
  const perFunction = (fns, code, pick) => {
    if (!code) return '—';
    if (!fns) return 'not measured';
    return fns.map((f) => `${f.name} ${pick(f)}`).join(', ') || 'no functions';
  };
  const codes = (run) => citedCodes(run.answer).join(', ') || '—';
  const invalid = (run) => invalidCodes(run.answer.trim().split('\n').at(-1) || '').join(', ') || 'none';
  const tokens = ({ tokens: t }) => `${t.input} in / ${t.cacheRead} cache read / ${t.cacheCreation} cache write / ${t.output} out`;
  const row = (label, a, b) => `| ${label} | ${a} | ${b} |`;
  return [
    '| | without | with |',
    '|---|---|---|',
    row('plugins loaded', without.plugins.join(', ') || 'none', withPlugin.plugins.join(', ')),
    row('mode injected', without.modeInjected ? 'yes' : 'no', withPlugin.modeInjected ? 'yes' : 'no'),
    row('cost USD', without.costUsd.toFixed(4), withPlugin.costUsd.toFixed(4)),
    row('turns', without.turns, withPlugin.turns),
    row('duration s', (without.durationMs / 1000).toFixed(1), (withPlugin.durationMs / 1000).toFixed(1)),
    row('tokens', tokens(without), tokens(withPlugin)),
    row('function length, NLOC (K9)', perFunction(functions[0], codeWithout, (f) => f.nloc), perFunction(functions[1], codeWith, (f) => f.nloc)),
    row('cyclomatic complexity (K1)', perFunction(functions[0], codeWithout, (f) => f.ccn), perFunction(functions[1], codeWith, (f) => f.ccn)),
    row('rule codes cited', codes(without), codes(withPlugin)),
    row('invalid codes (closing line)', invalid(without), invalid(withPlugin)),
    '',
    `Compared: ${path.basename(compared[0])} vs ${path.basename(compared[1])}${filesDiff ? '; written files in files.patch' : ''}.`,
    'One run per arm: this illustrates the change; `npm run eval` measures it.',
    '',
  ].join('\n');
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  console.error(`Running both arms (max ${opts.maxTurns} turns, tools: ${opts.allowedTools.join(',')})…`);
  const [without, withPlugin] = await Promise.all([runArm(opts, false), runArm(opts, true)]);
  const problems = isolationProblems(without, withPlugin);
  if (problems.length) throw new Error(`A/B is not isolated, refusing to compare:\n- ${problems.join('\n- ')}`);
  if (without.isError || withPlugin.isError) console.error('warning: an arm ended with an error; see its .md file');

  const { dir, compared, summary } = writeResults(opts, without, withPlugin);
  process.stdout.write(gitDiff(dir, ...compared.map((f) => path.basename(f)), ['--color=always']));
  console.log(`\n${summary}\nResults: ${path.relative(process.cwd(), dir)}/`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}

module.exports = { parseArgs, loadCase, parseStream, isolationProblems, extractCode, parseLizardCsv };
