#!/usr/bin/env node
// Stop hook: if the reply's closing line cites a rule code that doesn't exist (PY99, "S-validation"),
// send the turn back once to fix it. Free unless it fires; never blocks twice in a row.
const fs = require('fs');
const { invalidCodes } = require('../lib/codes');
const { logHookEvent } = require('../lib/session');

if ((process.env.CLEAN_N_CODE_CHECK || '').toLowerCase() === 'off') process.exit(0);
if ((process.env.CLEAN_N_CODE || '').toLowerCase() === 'off') process.exit(0);

function lastAssistantText(transcriptPath) {
  const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n').filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    let entry;
    try { entry = JSON.parse(lines[i]); } catch { continue; }
    if (entry.type !== 'assistant') continue;
    const content = entry.message?.content;
    const text = Array.isArray(content)
      ? content.filter((c) => c.type === 'text').map((c) => c.text).join('\n')
      : (typeof content === 'string' ? content : '');
    if (text.trim()) return text;
  }
  return '';
}

// Only the closing line is checked: code blocks above it may legitimately contain C11, T1 and the like.
// Another skill (ponytail) may add its own closing line after ours, so look for `Applied:` in the last few lines.
// Weaker models end a paragraph with it instead of starting a line, so only what follows it counts.
function closingLine(text) {
  const tail = text.trim().split('\n').filter((l) => l.trim()).slice(-4);
  const applied = tail.findLast((l) => /\bApplied:/.test(l));
  return applied ? applied.slice(applied.indexOf('Applied:')) : tail.at(-1) || '';
}

function main() {
  let payload;
  try {
    payload = JSON.parse(fs.readFileSync(0, 'utf8'));
  } catch {
    return; // fail open: a malformed payload must not trap the session
  }
  if (payload.stop_hook_active || !payload.transcript_path) return;
  let text;
  try {
    text = lastAssistantText(payload.transcript_path);
  } catch {
    return;
  }
  const invalid = invalidCodes(closingLine(text));
  if (!invalid.length) return;
  logHookEvent('code-block');
  process.stdout.write(JSON.stringify({
    decision: 'block',
    reason: `clean-n-code: the closing line cites codes that don't exist: ${invalid.join(', ')}. ` +
      'Rewrite only that line, citing codes that exist (in your context or the catalogs), or drop them.',
  }));
}

main();
