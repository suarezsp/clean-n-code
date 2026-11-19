const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { ROOT, makeTempDir } = require('./helpers');

const SCRIPT = path.join(ROOT, 'hooks', 'after-write.js');
let sessionCounter = 0;
const newSession = () => `test-${process.pid}-${Date.now()}-${sessionCounter++}`;

function afterWrite(payload, env = {}) {
  const result = spawnSync('node', [SCRIPT], { input: JSON.stringify(payload), encoding: 'utf8', env: { ...process.env, ...env } });
  return result.stdout ? JSON.parse(result.stdout).hookSpecificOutput.additionalContext : '';
}
const writeOf = (sessionId, filePath) => ({ session_id: sessionId, tool_name: 'Write', tool_input: { file_path: filePath } });

test('the first write of a language without a card in context sends its card, once', () => {
  const session = newSession();
  assert.match(afterWrite(writeOf(session, '/x/app.py')), /### python\n- /);
  assert.equal(afterWrite(writeOf(session, '/x/other.py')), '');
  assert.match(afterWrite(writeOf(session, '/x/main.go')), /^### go$/m);
});

test('no card is sent for a language SessionStart already injected', () => {
  const session = newSession();
  const dir = makeTempDir('cnc-aw-');
  for (const name of ['a.py', 'b.py']) fs.writeFileSync(path.join(dir, name), '');
  spawnSync('node', [path.join(ROOT, 'hooks', 'activate.js'), 'SessionStart'], { input: JSON.stringify({ cwd: dir, session_id: session }) });
  assert.equal(afterWrite(writeOf(session, path.join(dir, 'c.py'))), '');
});

test('non-code files, a missing session id and CLEAN_N_CODE=off add nothing', () => {
  assert.equal(afterWrite(writeOf(newSession(), '/x/notes.md')), '');
  assert.equal(afterWrite({ tool_name: 'Write', tool_input: { file_path: '/x/a.rs' } }), '');
  assert.equal(afterWrite(writeOf(newSession(), '/x/a.rs'), { CLEAN_N_CODE: 'off' }), '');
});

test('a malformed payload fails open', () => {
  const result = spawnSync('node', [SCRIPT], { input: 'not json', encoding: 'utf8' });
  assert.equal(result.status, 0);
  assert.equal(result.stdout, '');
});

test('CLEAN_N_CODE_HOOK_LOG records each card and nudge the hook sends', () => {
  const log = path.join(makeTempDir('cnc-aw-'), 'hook.log');
  afterWrite(writeOf(newSession(), '/x/app.ts'), { CLEAN_N_CODE_HOOK_LOG: log });
  assert.equal(fs.readFileSync(log, 'utf8'), 'card\n');
});

test('a resumed session keeps the cards it was already sent; a compacted one gets them again', () => {
  const session = newSession();
  const dir = makeTempDir('cnc-aw-');
  const start = (source) => spawnSync('node', [path.join(ROOT, 'hooks', 'activate.js'), 'SessionStart'], { input: JSON.stringify({ cwd: dir, session_id: session, source }) });
  start('startup');
  assert.match(afterWrite(writeOf(session, '/x/a.rs')), /^### rust$/m);
  start('resume');
  assert.equal(afterWrite(writeOf(session, '/x/b.rs')), '');
  start('compact');
  assert.match(afterWrite(writeOf(session, '/x/c.rs')), /^### rust$/m);
});
