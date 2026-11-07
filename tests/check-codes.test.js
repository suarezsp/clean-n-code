const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { runCheckHook } = require('./helpers');

function transcriptEndingWith(text) {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cnc-transcript-')), 't.jsonl');
  const lines = [
    { type: 'user', message: { content: 'write it' } },
    { type: 'assistant', message: { content: [{ type: 'text', text }] } },
  ];
  fs.writeFileSync(file, lines.map((l) => JSON.stringify(l)).join('\n'));
  return file;
}

test('blocks once when the closing line cites a code that does not exist', () => {
  const result = runCheckHook({ transcript_path: transcriptEndingWith('```go\nx\n```\nApplied: G25, S-validation') });
  const { decision, reason } = JSON.parse(result.stdout);
  assert.equal(decision, 'block');
  assert.match(reason, /S-validation/);
});

test('logs each block for the A/B count', () => {
  const log = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cnc-cc-')), 'hook.log');
  runCheckHook({ transcript_path: transcriptEndingWith('Applied: S-validation') }, { CLEAN_N_CODE_HOOK_LOG: log });
  assert.equal(fs.readFileSync(log, 'utf8'), 'code-block\n');
});

test('checks an Applied: that ends a paragraph, and not the prose before it', () => {
  const result = runCheckHook({ transcript_path: transcriptEndingWith('See RFC9110 for details. Applied: S-validation') });
  assert.match(JSON.parse(result.stdout).reason, /: S-validation\./);
});

test('passes when every cited code exists', () => {
  assert.equal(runCheckHook({ transcript_path: transcriptEndingWith('code\nApplied: G25, K9, GO9, S12') }).stdout, '');
});

test('only the closing line is checked, so code above it may mention C11 or T1', () => {
  const text = '```c\n/* C11 atomics, see T1 */\n```\nApplied: CL12';
  assert.equal(runCheckHook({ transcript_path: transcriptEndingWith(text) }).stdout, '');
});

test('never blocks twice in a row (stop_hook_active)', () => {
  const payload = { transcript_path: transcriptEndingWith('Applied: PY99'), stop_hook_active: true };
  assert.equal(runCheckHook(payload).stdout, '');
});

test('malformed payload or missing transcript fails open', () => {
  assert.equal(runCheckHook('not json').status, 0);
  assert.equal(runCheckHook({ transcript_path: '/nonexistent/t.jsonl' }).stdout, '');
});

test('CLEAN_N_CODE_CHECK=off disables the check', () => {
  const result = runCheckHook({ transcript_path: transcriptEndingWith('Applied: PY99') }, { CLEAN_N_CODE_CHECK: 'off' });
  assert.equal(result.stdout, '');
});

test('finds the Applied line when another skill adds its own closing line after it', () => {
  const text = 'code\nApplied: G25, PY99\nSkipped: retries. Risk: none.';
  const { reason } = JSON.parse(runCheckHook({ transcript_path: transcriptEndingWith(text) }).stdout);
  assert.match(reason, /PY99/);
});
