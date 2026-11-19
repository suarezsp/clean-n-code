// Blind judge: compares two answers in both orders and returns one verdict per pair.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

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

// Two verdicts on the same pair (one per order) count only when they agree; an order whose reply couldn't be parsed makes the pair `unparsed`.
// Reasons come from the second order, where the judge's A and B match the report's labels (A = without, B = with).
function combineVerdicts(first, second) {
  if (!first && !second) return { winner: 'unparsed', reasons: '', correctnessIssue: 'none' };
  if (!first || !second) return { ...(second || first), winner: 'unparsed' };
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
    child.on('error', () => {
      fs.rmSync(cwd, { recursive: true, force: true });
      resolve(null);
    });
    child.on('close', () => {
      fs.rmSync(cwd, { recursive: true, force: true });
      try { resolve(parseJudge(JSON.parse(stdout), withFirst)); } catch { resolve(null); }
    });
  });
}

async function judgePair(opts, code) {
  if (!code[0] || !code[1]) return null;
  const [first, second] = await Promise.all([judgeOnce(opts, code, true), judgeOnce(opts, code, false)]);
  return combineVerdicts(first, second);
}

module.exports = { parseJudge, judgePrompt, combineVerdicts, judgePair };
