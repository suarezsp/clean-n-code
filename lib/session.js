// Which language cards a session's context already holds, so the PostToolUse hook sends each one at most once.
// shortcut: one marker per session_id, shared by the main thread and its subagents; a subagent that writes a
// language the main thread already got won't receive the card. Upgrade if subagents start writing new languages.
const fs = require('fs');
const os = require('os');
const path = require('path');

function markerPath(sessionId) {
  return path.join(os.tmpdir(), `clean-n-code-cards-${String(sessionId).replace(/[^\w-]/g, '_')}.json`);
}

function cardsInContext(sessionId) {
  try {
    return JSON.parse(fs.readFileSync(markerPath(sessionId), 'utf8'));
  } catch {
    return []; // no marker yet: nothing recorded
  }
}

function recordCards(sessionId, languages, { reset = false } = {}) {
  if (!sessionId) return;
  const known = reset ? [] : cardsInContext(sessionId);
  try {
    fs.writeFileSync(markerPath(sessionId), JSON.stringify([...new Set([...known, ...languages])]));
  } catch {
    // an unwritable tmpdir only means a card may be sent twice; never break the session over it
  }
}

module.exports = { cardsInContext, recordCards, markerPath };
