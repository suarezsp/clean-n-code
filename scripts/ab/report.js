// Suite report: per-case tables, totals, sign tests and the output-token gate.

const closesWithApplied = (run) => /\bApplied:/.test(run.answer || '');
const pct = (a, b) => (a ? `${b >= a ? '+' : ''}${(((b - a) / a) * 100).toFixed(0)}%` : '—');
const totalTokens = ({ tokens: t }) => t.input + t.cacheRead + t.cacheCreation + t.output;
const median = (values) => {
  const sorted = values.filter((v) => v !== null && v !== undefined).sort((x, y) => x - y);
  if (!sorted.length) return '—';
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};
const OUTPUT_GATE_RISE = 0.1;
const METRICS = [
  ['functions', 'functions'], ['totalNloc', 'total NLOC'], ['maxNloc', 'max NLOC (K9)'],
  ['maxCcn', 'max CC (K1)'], ['maxNesting', 'max nesting (K2)'],
];

function judgeTally(runs) {
  const verdicts = runs.map((r) => r.judge).filter(Boolean);
  const count = (winner) => verdicts.filter((v) => v.winner === winner).length;
  return { with: count('with'), without: count('without'), tie: count('tie'), inconsistent: count('inconsistent'), unparsed: count('unparsed'), total: verdicts.length };
}

const tallyText = (tally, [a, b]) => `${b} ${tally.with}, ${a} ${tally.without}, tie ${tally.tie}, inconsistent ${tally.inconsistent}${tally.unparsed ? `, unparsed ${tally.unparsed}` : ''} (of ${tally.total})`;
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
  const outputRow = () => {
    const [a, b] = [0, 1].map((arm) => median(ok.map((r) => [r.without, r.withPlugin][arm].tokens.output)));
    return `| output tokens | ${a} | ${b} (${pct(a, b)}) |`;
  };
  const verdicts = ok.filter((r) => r.judge).map((r, i) => `- run ${i + 1}: **${winnerLabel(r.judge.winner, labels)}**. ${r.judge.reasons}`
    + (r.judge.correctnessIssue && r.judge.correctnessIssue !== 'none' ? ` Correctness: ${r.judge.correctnessIssue}` : ''));
  return [
    `## ${result.name}`,
    '',
    `| median of ${ok.length} run(s) | ${labels[0]} | ${labels[1]} |`,
    '|---|---|---|',
    ...METRICS.map(metricRow),
    outputRow(),
    ...(tally.total ? [`| judge wins (both orders agree) | ${tally.without} | ${tally.with} |`] : []),
    '',
    ...(verdicts.length ? ['Judge:', ...verdicts, ''] : []),
    ...failed,
    `Run 1 detail:\n\n${ok[0].summary}`,
    `\`\`\`diff\n${ok[0].patch.trim() || '(no difference)'}\n\`\`\``,
    '',
  ].join('\n');
}

// Two-sided exact sign test: the chance of a split at least this lopsided if both arms were equally likely to win a case.
// Ties are left out. Returns null when no case had a winner.
function signTestP(wins, losses) {
  const n = wins + losses;
  if (!n) return null;
  let tail = 0;
  let choose = 1; // C(n, 0)
  for (let k = 0; k <= Math.min(wins, losses); k++) {
    tail += choose;
    choose = (choose * (n - k)) / (k + 1);
  }
  return Math.min(1, (2 * tail) / 2 ** n);
}

const outcome = (a, b) => (b < a ? 'with' : b > a ? 'without' : 'tie'); // lower is better for cost and output tokens

// Per case: median cost and output tokens of each arm, the judge's majority over its runs, and which arm each metric favors.
function caseSummary(result) {
  const ok = result.runs.filter((r) => !r.failed);
  if (!ok.length) return null;
  const medianOf = (pick) => [0, 1].map((arm) => median(ok.map((r) => pick([r.without, r.withPlugin][arm]))));
  const [cost, output] = [medianOf((run) => run.costUsd), medianOf((run) => run.tokens.output)];
  const tally = judgeTally(ok);
  const judge = tally.with === tally.without ? 'tie' : (tally.with > tally.without ? 'with' : 'without');
  return {
    name: result.name, cost, output, tally, judge: tally.total ? judge : null,
    costWinner: outcome(...cost), outputWinner: outcome(...output),
  };
}

const signLine = (label, summaries, pick) => {
  const count = (arm) => summaries.filter((s) => pick(s) === arm).length;
  const [withWins, withoutWins] = [count('with'), count('without')];
  const p = signTestP(withWins, withoutWins);
  return `- ${label}: with ${withWins}, without ${withoutWins}, tie ${count('tie')} of ${summaries.length} cases, sign test p = ${p === null ? '—' : p.toFixed(3)}`;
};

// One table for the whole suite: cost, output tokens, judge and hidden checks per case, then sign tests across cases.
function suiteTable(results, labels, checks) {
  const summaries = results.map(caseSummary).filter(Boolean);
  if (!summaries.length) return [];
  const checkCell = (name) => {
    const c = checks?.perCase[name];
    return c ? `${c.without}/${c.runs} vs ${c.with}/${c.runs}` : '—';
  };
  const rows = summaries.map((s) => `| ${s.name} | ${s.cost.map((v) => (typeof v === 'number' ? v.toFixed(4) : v)).join(' → ')} | ${s.output.join(' → ')} `
    + `| ${s.tally.total ? `${s.tally.with}–${s.tally.without} (${winnerLabel(s.judge, labels)})` : '—'} | ${checkCell(s.name)} |`);
  return [
    `## Per case (median over runs; ${labels[0]} → ${labels[1]})`,
    '',
    `| case | cost USD | output tokens | judge wins (${labels[1]}–${labels[0]}) | hidden checks (${labels[0]} vs ${labels[1]}) |`,
    '|---|---|---|---|---|',
    ...rows,
    '',
    `Sign tests across cases (a lower cost or output count, or a judge majority, wins the case; with = ${labels[1]}):`,
    signLine('cost', summaries, (s) => s.costWinner),
    signLine('output tokens', summaries, (s) => s.outputWinner),
    ...(summaries.some((s) => s.judge) ? [signLine('judge', summaries, (s) => s.judge)] : []),
    '',
  ];
}

// One markdown file: totals and judge win rate across cases, then each case's medians, verdicts and run-1 diff.
function buildReport(results, labels = ['without', 'with'], checks = null) {
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
    row('input tokens', (run) => run.tokens.input),
    row('cache write tokens', (run) => run.tokens.cacheCreation),
    row('cache read tokens', (run) => run.tokens.cacheRead),
    row('output tokens', (run) => run.tokens.output),
    row('turns', (run) => run.turns),
    row('language cards sent', (run) => run.cardsSent),
    row('turns sent back for invalid codes', (run) => run.codeBlocks || 0),
    row('replies closing with Applied', (run) => Number(closesWithApplied(run))),
    '',
    ...suiteTable(results, labels, checks),
    ...results.map((r) => caseSection(r, labels)),
  ].join('\n');
}

// Why the suite fails its gate, or null: output tokens up over OUTPUT_GATE_RISE and the judge doesn't favor the plugin arm.
function gateFailure(results) {
  const ok = results.flatMap((r) => r.runs.filter((run) => !run.failed));
  const output = (arm) => ok.reduce((total, run) => total + run[arm].tokens.output, 0);
  const [a, b] = [output('without'), output('withPlugin')];
  if (!a || b <= a * (1 + OUTPUT_GATE_RISE)) return null;
  const tally = judgeTally(ok);
  if (tally.with > tally.without) return null;
  return `output tokens ${pct(a, b)} (${a} to ${b}) without a judge win (with ${tally.with}, without ${tally.without})`;
}

module.exports = { buildReport, gateFailure, signTestP, median, judgeTally, tallyText, winnerLabel };
