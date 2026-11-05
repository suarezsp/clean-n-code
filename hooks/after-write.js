#!/usr/bin/env node
// PostToolUse on Write/Edit/MultiEdit: the first time a session writes a language whose card isn't in context,
// send that card. Silent otherwise, and it never blocks a write.
const fs = require('fs');
const { languageOf, cardBlock } = require('../lib/codes');
const { cardsInContext, recordCards } = require('../lib/session');

function readPayload() {
  try {
    return JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
  } catch {
    return {}; // fail open: a malformed payload must not break the write
  }
}

// The A/B script sets CLEAN_N_CODE_HOOK_LOG to count cards sent; hook output isn't in stream-json.
function logCardSent() {
  const log = process.env.CLEAN_N_CODE_HOOK_LOG;
  if (!log) return;
  try {
    fs.appendFileSync(log, 'card\n');
  } catch {
    // counting is best effort; never fail the write over it
  }
}

function main() {
  if ((process.env.CLEAN_N_CODE || '').toLowerCase() === 'off') return;
  const payload = readPayload();
  const file = payload.tool_input?.file_path;
  const language = file && languageOf(file);
  if (!language || !payload.session_id || cardsInContext(payload.session_id).includes(language)) return;
  recordCards(payload.session_id, [language]);
  logCardSent();
  const context = `## Language card (first ${language} file this session)\n${cardBlock(language)}`;
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: context } }));
}

main();
