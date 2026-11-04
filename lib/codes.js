// Single source for rule codes: which ones exist, which ones a text cites, which cited ones are invalid.
// Used by the hooks, the A/B script and the tests, so the code regex lives in one place.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const REFERENCES_DIR = path.join(ROOT, 'skills', 'clean-n-code', 'references');
const LANGUAGES_DIR = path.join(ROOT, 'languages');

// Each language guide in languages/, the code prefix its rules use, and the file extensions that mean it.
const LANGUAGES = {
  python: { prefix: 'PY', extensions: ['.py', '.pyi'] },
  javascript: { prefix: 'JS', extensions: ['.js', '.mjs', '.cjs', '.jsx'] },
  typescript: { prefix: 'TS', extensions: ['.ts', '.tsx', '.mts', '.cts'] },
  java: { prefix: 'JA', extensions: ['.java'] },
  csharp: { prefix: 'CS', extensions: ['.cs'] },
  cpp: { prefix: 'CP', extensions: ['.cpp', '.cc', '.cxx', '.hpp', '.hh', '.hxx'] },
  go: { prefix: 'GO', extensions: ['.go'] },
  php: { prefix: 'PH', extensions: ['.php'] },
  sql: { prefix: 'SQ', extensions: ['.sql'] },
  bash: { prefix: 'SH', extensions: ['.sh', '.bash'] },
  c: { prefix: 'CL', extensions: ['.c', '.h'] },
  rust: { prefix: 'RS', extensions: ['.rs'] },
};
const LANGUAGE_PREFIXES = Object.fromEntries(Object.entries(LANGUAGES).map(([name, l]) => [name, l.prefix]));
const PREFIX_GROUP = `(?:[CEFGJNTKDS]|${Object.values(LANGUAGE_PREFIXES).join('|')})`;
const CITED_CODE = new RegExp(`\\b(${PREFIX_GROUP}\\d{1,2})\\b`, 'g');
// A prefix, a dash, then a lowercase word or a number ("S-validation", "G-12"): a code-shaped label that isn't a code.
// Uppercase ids such as the Rust API Guidelines' C-CONV are real references and stay allowed.
const PSEUDO_CODE = new RegExp(`\\b(${PREFIX_GROUP}-(?:[a-z][\\w-]*|\\d+\\b))`, 'g');

// Codes a catalog or language guide defines: bold entries such as "**G5 Duplication**" or "**PY4 Name.**".
function definedCodes(text) {
  return [...text.matchAll(/\*\*([A-Z]{1,2}\d+) /g)].map((m) => m[1]);
}

// Codes a text cites, as whole words: catalog codes (C/E/F/G/J/N/T/K/D/S + number) and language codes (PY4, RS11…).
function citedCodes(text) {
  return [...new Set([...text.matchAll(CITED_CODE)].map((m) => m[1]))];
}

function readMarkdownDir(dir) {
  return fs.readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => fs.readFileSync(path.join(dir, f), 'utf8'));
}

let cachedDefined;
function allDefinedCodes() {
  cachedDefined ??= new Set([...readMarkdownDir(REFERENCES_DIR), ...readMarkdownDir(LANGUAGES_DIR)].flatMap(definedCodes));
  return cachedDefined;
}

// Cited codes that don't exist (PY99, K10) plus code-shaped labels (S-validation).
function invalidCodes(text) {
  const unknown = citedCodes(text).filter((code) => !allDefinedCodes().has(code));
  const pseudo = [...new Set([...text.matchAll(PSEUDO_CODE)].map((m) => m[1]))];
  return [...unknown, ...pseudo];
}

module.exports = {
  ROOT, REFERENCES_DIR, LANGUAGES_DIR, LANGUAGES, LANGUAGE_PREFIXES,
  definedCodes, citedCodes, allDefinedCodes, invalidCodes,
};
