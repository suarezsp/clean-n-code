// Test DSL for the plugin: paths, hook runner, skill and catalog readers.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SKILLS_DIR = path.join(ROOT, 'skills');
const REFERENCES_DIR = path.join(SKILLS_DIR, 'clean-n-code', 'references');
const HOOK_SCRIPT = path.join(ROOT, 'hooks', 'activate.js');

// Every heuristic code each catalog must define, as published in its source.
const CATALOG_CODES = {
  'smells.md': [
    ...codeRange('C', 5), ...codeRange('E', 2), ...codeRange('F', 4), ...codeRange('G', 36),
    ...codeRange('J', 3), ...codeRange('N', 7), ...codeRange('T', 9),
  ],
  'complexity.md': codeRange('K', 8),
  'design.md': codeRange('D', 16),
};
const CATALOG_FILES = Object.keys(CATALOG_CODES);
const REPORT_SKILLS = ['clean-review', 'clean-audit', 'clean-refactor'];
const ALWAYS_ON_MAX_LINES = 75; // context budget: two always-on plugins share every session

function codeRange(prefix, count) {
  return Array.from({ length: count }, (_, i) => `${prefix}${i + 1}`);
}

function runHook(args = [], env = {}) {
  return spawnSync('node', [HOOK_SCRIPT, ...args], { encoding: 'utf8', env: { ...process.env, ...env } });
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

function readCatalog(file) {
  return fs.readFileSync(path.join(REFERENCES_DIR, file), 'utf8');
}

// Codes a catalog defines: bold entries such as "**G5 Duplication**".
function definedCodes(catalogText) {
  return [...catalogText.matchAll(/\*\*([A-Z]\d+) /g)].map((m) => m[1]);
}

// Codes a text cites: C/E/F/G/J/N/T/K/D followed by a number, as a whole word.
function citedCodes(text) {
  return [...new Set([...text.matchAll(/\b([CEFGJNTKD]\d{1,2})\b/g)].map((m) => m[1]))];
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

module.exports = {
  ROOT, SKILLS_DIR, REFERENCES_DIR, CATALOG_CODES, CATALOG_FILES, REPORT_SKILLS, ALWAYS_ON_MAX_LINES,
  runHook, skillNames, readSkill, frontmatter, readCatalog, definedCodes, citedCodes, readJson,
};
