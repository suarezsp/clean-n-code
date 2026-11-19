// Test DSL for the plugin: paths, hook runner, skill and catalog readers.
const fs = require('fs');
const path = require('path');
const os = require('os');
const { after } = require('node:test');
const { spawnSync } = require('child_process');
const {
  ROOT, REFERENCES_DIR, LANGUAGES_DIR, LANGUAGE_PREFIXES, definedCodes, allDefinedCodes, citedCodes, invalidCodes,
} = require('../lib/codes');

const SKILLS_DIR = path.join(ROOT, 'skills');
const HOOK_SCRIPT = path.join(ROOT, 'hooks', 'activate.js');
const CHECK_HOOK_SCRIPT = path.join(ROOT, 'hooks', 'check-codes.js');
const SECRETS_HOOK_SCRIPT = path.join(ROOT, 'hooks', 'block-secrets.js');

// Every heuristic code each catalog must define, as published in its source.
const CATALOG_CODES = {
  'smells.md': [
    ...codeRange('C', 5), ...codeRange('E', 2), ...codeRange('F', 4), ...codeRange('G', 36),
    ...codeRange('J', 3), ...codeRange('N', 7), ...codeRange('T', 9),
  ],
  'complexity.md': codeRange('K', 9),
  'design.md': codeRange('D', 16),
  'security.md': codeRange('S', 25),
};
const CATALOG_FILES = Object.keys(CATALOG_CODES);
const READABILITY_CATALOGS = CATALOG_FILES.filter((file) => file !== 'security.md');
const LANGUAGE_MAX_LINES = 80;
const REPORT_SKILLS = ['clean-review', 'clean-audit', 'clean-refactor'];
// Context budgets in characters (lines can be arbitrarily long): the ruleset every session pays, and each language card.
// The idiom lines (E3) replaced a Read turn per chat-only answer; only languages in the project without a card keep one.
const ALWAYS_ON_MAX_CHARS = 3800;
const CARD_MAX_CHARS = 700;

// A temp dir that is removed when the requiring test file finishes.
const tempDirs = [];
after(() => tempDirs.forEach((dir) => fs.rmSync(dir, { recursive: true, force: true })));
function makeTempDir(prefix) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

function codeRange(prefix, count) {
  return Array.from({ length: count }, (_, i) => `${prefix}${i + 1}`);
}

// Runs the activation hook; `input` is the hook's stdin payload (cwd, agent_type…).
function runHook(args = [], env = {}, input = '') {
  return spawnSync('node', [HOOK_SCRIPT, ...args], { input, encoding: 'utf8', env: { ...process.env, ...env } });
}

function runCheckHook(payload, env = {}) {
  const input = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return spawnSync('node', [CHECK_HOOK_SCRIPT], { input, encoding: 'utf8', env: { ...process.env, ...env } });
}

// Runs the secret-blocking hook with a PreToolUse payload on stdin.
function runSecretsHook(toolName, toolInput, env = {}) {
  const input = typeof toolInput === 'string' ? toolInput : JSON.stringify({ tool_name: toolName, tool_input: toolInput });
  return spawnSync('node', [SECRETS_HOOK_SCRIPT], { input, encoding: 'utf8', env: { ...process.env, ...env } });
}

function skillNames() {
  return fs.readdirSync(SKILLS_DIR).filter((name) => fs.existsSync(path.join(SKILLS_DIR, name, 'SKILL.md')));
}

function readSkill(name) {
  return fs.readFileSync(path.join(SKILLS_DIR, name, 'SKILL.md'), 'utf8');
}

function frontmatter(skillText) {
  const match = skillText.match(/^---\n([\s\S]*?)\n---\n/);
  return match ? match[1] : null;
}

function readLanguage(name) {
  return fs.readFileSync(path.join(LANGUAGES_DIR, `${name}.md`), 'utf8');
}

function readCatalog(file) {
  return fs.readFileSync(path.join(REFERENCES_DIR, file), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

module.exports = {
  ROOT, SKILLS_DIR, REFERENCES_DIR, LANGUAGES_DIR, LANGUAGE_PREFIXES, LANGUAGE_MAX_LINES, CATALOG_CODES, CATALOG_FILES, READABILITY_CATALOGS, REPORT_SKILLS, ALWAYS_ON_MAX_CHARS, CARD_MAX_CHARS,
  makeTempDir, runHook, runCheckHook, runSecretsHook, skillNames, readSkill, frontmatter, readCatalog, readLanguage, definedCodes, allDefinedCodes, citedCodes, invalidCodes, readJson,
};
