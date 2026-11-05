// Per-function metrics from lizard for the A/B script.
const { spawnSync } = require('child_process');

const ROW = /^(\d+),(\d+),\d+,\d+,\d+,"[^"]*","([^"]*)","([^"]*)","[^"]*",(\d+),(\d+)(?:,(\d+))?/gm;

// lizard -ENS --csv rows: NLOC,CCN,tokens,params,length,"location","file","function","long name",start,end,nesting
function parseLizardCsv(csv) {
  return [...csv.matchAll(ROW)].map((m) => ({
    name: m[4], file: m[3], nloc: Number(m[1]), ccn: Number(m[2]),
    start: Number(m[5]), end: Number(m[6]), nesting: m[7] === undefined ? null : Number(m[7]),
  }));
}

// Runs lizard on a file or directory: an installed one, else a run-once uvx copy.
// Returns null when lizard can't run, so callers say "not measured" instead of guessing.
function measureFunctions(target, { timeout = 120000 } = {}) {
  const args = ['-ENS', '--csv', target];
  let result = spawnSync('lizard', args, { encoding: 'utf8', timeout });
  if (result.error) result = spawnSync('uvx', ['lizard', ...args], { encoding: 'utf8', timeout });
  if (result.error || result.status !== 0 && !result.stdout) return null;
  return parseLizardCsv(result.stdout || '');
}

module.exports = { parseLizardCsv, measureFunctions };
