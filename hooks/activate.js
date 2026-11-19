#!/usr/bin/env node
// Injects the clean-n-code ruleset (skills/clean-n-code/SKILL.md body) as session context, plus the
// language cards for the languages the project is written in, so writing code needs no extra Read turn.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { LANGUAGES_DIR, languageOf, cardBlock } = require('../lib/codes');
const { recordCards } = require('../lib/session');

// Subagent types that write or plan code; any other type (Explore, claude-code-guide, custom read-only agents) gets nothing.
const CODE_WRITING_AGENTS = ['general-purpose', 'Plan', 'claude'];
const CODER_AGENT_SUFFIX = '-coder';
const CARD_MIN_SHARE = 0.1;
const MAX_CARDS = 1; // more cards cost context every turn; other languages get an idiom line, then their card on first write
const IDIOM_LABELS = { python: 'Python', typescript: 'TypeScript', javascript: 'JavaScript', go: 'Go', java: 'Java', csharp: 'C#', rust: 'Rust' };

if ((process.env.CLEAN_N_CODE || '').toLowerCase() === 'off') process.exit(0);

const event = process.argv[2] || 'SessionStart';
const payload = readPayload();
if (event === 'SubagentStart' && !writesCode(payload.agent_type)) process.exit(0);

const sourceLanguages = countSourceLanguages(projectFiles(payload.cwd || process.cwd()));
const languages = cardLanguages(sourceLanguages);
// A fresh, cleared or compacted context holds exactly these cards; a resumed one still holds the cards sent before.
if (event === 'SessionStart') recordCards(payload.session_id, languages, { reset: payload.source !== 'resume' });
const context = `CLEAN-N-CODE MODE ACTIVE\n\n${idiomsForUncardedLanguages(rulesetBody(), sourceLanguages, languages)}${languageCards(languages)}`;
// SessionStart takes raw stdout; SubagentStart needs the JSON form or the context is dropped.
process.stdout.write(event === 'SubagentStart'
  ? JSON.stringify({ hookSpecificOutput: { hookEventName: event, additionalContext: context } })
  : context);

function writesCode(agentType) {
  if (!agentType) return true; // unnamed subagent: assume it may write code
  return CODE_WRITING_AGENTS.includes(agentType) || agentType.endsWith(CODER_AGENT_SUFFIX);
}

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

// The idiom summary is a stopgap for code shown only in the reply: a language with its card doesn't need it,
// and one absent from the project is unlikely to come up.
function idiomsForUncardedLanguages(ruleset, sourceLanguages, cardLanguages) {
  const idiomPrefixes = Object.values(IDIOM_LABELS).map((label) => `  - ${label}:`);
  const keptPrefixes = Object.keys(sourceLanguages)
    .filter((name) => !cardLanguages.includes(name) && IDIOM_LABELS[name])
    .map((name) => `  - ${IDIOM_LABELS[name]}:`);
  return ruleset.split('\n')
    .filter((line) => keptPrefixes.some((prefix) => line.startsWith(prefix)) || !idiomPrefixes.some((prefix) => line.startsWith(prefix)))
    .join('\n');
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

function countSourceLanguages(files) {
  const counts = {};
  for (const file of files) {
    const name = languageOf(file);
    if (name) counts[name] = (counts[name] || 0) + 1;
  }
  return counts;
}

// The most common languages holding at least CARD_MIN_SHARE of the project's source files, up to MAX_CARDS.
function cardLanguages(counts) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return Object.keys(counts)
    .filter((name) => counts[name] / total >= CARD_MIN_SHARE)
    .sort((a, b) => counts[b] - counts[a])
    .slice(0, MAX_CARDS);
}

function languageCards(languages) {
  if (!languages.length) return '';
  return `\n\n## Language cards (detected in this project)\n${languages.map(cardBlock).join('\n\n')}`;
}
