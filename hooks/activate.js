#!/usr/bin/env node
// Injects the clean-n-code ruleset (skills/clean-n-code/SKILL.md body) as session context, plus the
// language cards for the languages the project is written in, so writing code needs no extra Read turn.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { LANGUAGES, LANGUAGES_DIR } = require('../lib/codes');

const READ_ONLY_AGENTS = ['Explore', 'claude-code-guide', 'statusline-setup']; // they never write code
const CARD_MIN_SHARE = 0.1;
const MAX_CARDS = 3;

if ((process.env.CLEAN_N_CODE || '').toLowerCase() === 'off') process.exit(0);

const event = process.argv[2] || 'SessionStart';
const payload = readPayload();
if (event === 'SubagentStart' && READ_ONLY_AGENTS.includes(payload.agent_type)) process.exit(0);

const context = `CLEAN-N-CODE MODE ACTIVE\n\n${rulesetBody()}${languageCards(payload.cwd || process.cwd())}`;
// SessionStart takes raw stdout; SubagentStart needs the JSON form or the context is dropped.
process.stdout.write(event === 'SubagentStart'
  ? JSON.stringify({ hookSpecificOutput: { hookEventName: event, additionalContext: context } })
  : context);

function readPayload() {
  try {
    return JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
  } catch {
    return {}; // no or malformed stdin: fall back to defaults rather than drop the ruleset
  }
}

function rulesetBody() {
  const skill = fs.readFileSync(path.join(__dirname, '..', 'skills', 'clean-n-code', 'SKILL.md'), 'utf8');
  const refs = path.join(__dirname, '..', 'skills', 'clean-n-code', 'references');
  // Hook context has no skill base dir, so point catalog and language-guide references at their absolute path.
  return skill.replace(/^---\n[\s\S]*?\n---\n/, '').trim()
    .replace(/`references\//g, `\`${refs}/`)
    .replace(/`\.\.\/\.\.\/languages\//g, `\`${LANGUAGES_DIR}/`);
}

function projectFiles(cwd) {
  const git = spawnSync('git', ['ls-files', '-z'], { cwd, encoding: 'utf8', timeout: 3000, maxBuffer: 64 * 1024 * 1024 });
  if (git.status === 0 && git.stdout) return git.stdout.split('\0').filter(Boolean);
  try {
    return fs.readdirSync(cwd); // not a git repo: top level only, to stay fast
  } catch {
    return [];
  }
}

// Languages holding at least CARD_MIN_SHARE of the project's source files, most common first.
function detectLanguages(files) {
  const languageOf = new Map(Object.entries(LANGUAGES).flatMap(([name, l]) => l.extensions.map((ext) => [ext, name])));
  const counts = {};
  for (const file of files) {
    const name = languageOf.get(path.extname(file).toLowerCase());
    if (name) counts[name] = (counts[name] || 0) + 1;
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return Object.keys(counts)
    .filter((name) => counts[name] / total >= CARD_MIN_SHARE)
    .sort((a, b) => counts[b] - counts[a])
    .slice(0, MAX_CARDS);
}

function cardOf(name) {
  const guide = fs.readFileSync(path.join(LANGUAGES_DIR, `${name}.md`), 'utf8');
  const match = guide.match(/\n## Card\n([\s\S]*?)\n## /);
  return match ? match[1].trim() : '';
}

function languageCards(cwd) {
  const languages = detectLanguages(projectFiles(cwd));
  if (!languages.length) return '';
  const cards = languages.map((name) => `### ${name} (full guide: \`${path.join(LANGUAGES_DIR, `${name}.md`)}\`)\n${cardOf(name)}`);
  return `\n\n## Language cards (detected in this project)\n${cards.join('\n\n')}`;
}
