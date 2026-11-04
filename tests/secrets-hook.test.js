const test = require('node:test');
const assert = require('node:assert/strict');
const { runSecretsHook } = require('./helpers');

// Fake keys are assembled at runtime so this file never contains a secret-shaped literal
// (the hook itself, and push protection, would otherwise flag it).
const FAKE_SECRETS = {
  'AWS access key': 'AKIA' + 'Q'.repeat(16),
  'GitHub token': 'ghp' + '_' + 'a1'.repeat(18),
  'Slack token': 'xox' + 'b-' + '1234567890-abcdef',
  'Stripe live key': 'sk' + '_live_' + 'x'.repeat(24),
  'Anthropic API key': 'sk-' + 'ant-' + 'z'.repeat(30),
  'OpenAI API key': 'sk-' + 'proj-' + 'y'.repeat(30),
  'Google API key': 'AI' + 'za' + 'B'.repeat(35),
  'private key': '-----BEGIN ' + 'RSA PRIVATE KEY-----',
};

for (const [kind, secret] of Object.entries(FAKE_SECRETS)) {
  test(`Write with a ${kind} is blocked with exit 2 and names the kind`, () => {
    const result = runSecretsHook('Write', { file_path: 'config.js', content: `const key = "${secret}";` });
    assert.equal(result.status, 2);
    assert.match(result.stderr, new RegExp(kind));
    assert.match(result.stderr, /config\.js/);
  });
}

test('Edit with a secret in new_string is blocked', () => {
  const result = runSecretsHook('Edit', { file_path: 'a.py', old_string: 'x', new_string: `KEY = "${FAKE_SECRETS['AWS access key']}"` });
  assert.equal(result.status, 2);
});

test('MultiEdit with a secret in any edit is blocked', () => {
  const edits = [{ old_string: 'a', new_string: 'b' }, { old_string: 'c', new_string: FAKE_SECRETS['GitHub token'] }];
  assert.equal(runSecretsHook('MultiEdit', { file_path: 'a.js', edits }).status, 2);
});

test('code that reads the key from the environment passes', () => {
  const result = runSecretsHook('Write', { file_path: 'config.js', content: 'const key = process.env.API_KEY;\n// AKIA... placeholder\n' });
  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
});

test('a test-mode Stripe key is not treated as a live secret', () => {
  assert.equal(runSecretsHook('Write', { file_path: 'a.js', content: 'sk' + '_test_' + 'x'.repeat(24) }).status, 0);
});

for (const value of ['off', 'OFF']) {
  test(`CLEAN_N_CODE_SECRETS=${value} disables the block`, () => {
    const result = runSecretsHook('Write', { file_path: 'a.js', content: FAKE_SECRETS['AWS access key'] }, { CLEAN_N_CODE_SECRETS: value });
    assert.equal(result.status, 0);
  });
}

test('CLEAN_N_CODE=off (style mode off) keeps the secret block on', () => {
  const result = runSecretsHook('Write', { file_path: 'a.js', content: FAKE_SECRETS['AWS access key'] }, { CLEAN_N_CODE: 'off' });
  assert.equal(result.status, 2);
});

test('malformed stdin fails open', () => {
  assert.equal(runSecretsHook(null, 'not json').status, 0);
});
