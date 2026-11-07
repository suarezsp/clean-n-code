#!/usr/bin/env node
// PostToolUse on Write/Edit/MultiEdit: the first time a session writes a language whose card isn't in context,
// send that card. Silent otherwise, and it never blocks a write.
const fs = require('fs');
const { languageOf, cardBlock } = require('../lib/codes');
const { cardsInContext, recordCards, logHookEvent } = require('../lib/session');

function readPayload() {
  try {
    return JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
  } catch {
    return {}; // fail open: a malformed payload must not break the write
  }
}

function main() {
  if ((process.env.CLEAN_N_CODE || '').toLowerCase() === 'off') return;
  const payload = readPayload();
  const file = payload.tool_input?.file_path;
  const language = file && languageOf(file);
  if (!language || !payload.session_id || cardsInContext(payload.session_id).includes(language)) return;
  recordCards(payload.session_id, [language]);
  logHookEvent('card');
  const context = `## Language card (first ${language} file this session)\n${cardBlock(language)}`;
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: context } }));
}

main();
