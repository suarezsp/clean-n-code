// Command-line arguments of `npm run ab` and eval case loading.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const USAGE = `Usage:
  npm run ab -- "<prompt>"
  npm run ab -- --case <eval case name>        (uses evals/<case>/prompt.md)
  npm run ab -- --prompt-file <file.md>
  npm run ab -- --suite [--cases a,b] [--runs n] [--judge] [--gate]   (code-writing cases: evals/mode-*, evals/refactor-*)
  npm run ab -- --rejudge <ab-results/ts> --judge-model opus   (judge an existing suite's pairs again)
  npm run ab -- --suite --variant <plugin dir>  (A/B two skill versions: <dir> is arm A, this repo is arm B)
  npm run ab -- --check <ab-results/ts>        (run each case's evals/<case>/check.sh on both arms' saved output)
Options: --gate (exit 1 if output tokens rise over 10% without a judge win)  --model <model> (default sonnet)  --effort <low|medium|high>  --extra-plugin-dir <dir> (loaded in both arms, e.g. ponytail)  --judge-model <model> (default sonnet)  --max-turns <n> (default 10)  --allowed-tools <A,B> (default Read,Glob,Grep,Skill)`;
const CODE_WRITING_CASE = /^(mode|refactor)-/;

// Flags that take the next argument as their value, and flags that stand alone.
const VALUE_FLAGS = {
  '--case': (opts, value) => { opts.caseName = value; },
  '--prompt-file': (opts, value) => { opts.prompt = fs.readFileSync(value, 'utf8'); },
  '--model': (opts, value) => { opts.model = value; },
  '--max-turns': (opts, value) => { opts.maxTurns = Number(value); },
  '--allowed-tools': (opts, value) => { opts.allowedTools = value.split(','); },
  '--runs': (opts, value) => { opts.runs = Number(value); },
  '--judge-model': (opts, value) => { opts.judgeModel = value; },
  '--variant': (opts, value) => { opts.variant = path.resolve(value); },
  '--rejudge': (opts, value) => { opts.rejudge = path.resolve(value); },
  '--cases': (opts, value) => Object.assign(opts, { suite: true, cases: value.split(',') }),
  '--effort': (opts, value) => { opts.effort = value; },
  '--extra-plugin-dir': (opts, value) => { opts.extraPluginDir = path.resolve(value); },
  '--check': (opts, value) => { opts.check = path.resolve(value); },
};
const SWITCH_FLAGS = {
  '--suite': (opts) => { opts.suite = true; },
  '--judge': (opts) => { opts.judge = true; },
  '--gate': (opts) => { opts.gate = true; },
};

function parseArgs(argv) {
  const opts = { maxTurns: 10, allowedTools: ['Read', 'Glob', 'Grep', 'Skill'], model: 'sonnet', judgeModel: 'sonnet', runs: 1 };
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (Object.hasOwn(VALUE_FLAGS, flag)) VALUE_FLAGS[flag](opts, argv[++i]);
    else if (Object.hasOwn(SWITCH_FLAGS, flag)) SWITCH_FLAGS[flag](opts);
    else rest.push(flag);
  }
  if (rest.length) opts.prompt = rest.join(' ');
  if (opts.caseName) Object.assign(opts, loadCase(opts.caseName));
  requireValidArgs(opts);
  return opts;
}

function requireValidArgs(opts) {
  const hasWork = opts.prompt || opts.suite || opts.rejudge || opts.check;
  if (!hasWork) throw new Error(USAGE);
  if (!Number.isInteger(opts.runs) || opts.runs < 1) throw new Error(`--runs must be a whole number of at least 1\n${USAGE}`);
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

module.exports = { parseArgs, loadCase, selectCases };
