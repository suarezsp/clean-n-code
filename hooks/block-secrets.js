#!/usr/bin/env node
// PreToolUse hook: blocks Write/Edit/MultiEdit/NotebookEdit/Bash calls that would put a secret-shaped value in a file [S7].
// shortcut: only prefixed token formats; generic high-entropy secrets need gitleaks/trufflehog in CI.

if ((process.env.CLEAN_N_CODE_SECRETS || '').toLowerCase() === 'off') process.exit(0);

const SECRET_PATTERNS = {
  'AWS access key': /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/,
  'GitHub token': /\b(?:gh[pousr]_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{82})\b/,
  'Slack token': /\bxox[baprs]-[A-Za-z0-9-]{10,}/,
  'Stripe live key': /\b[sr]k_live_[A-Za-z0-9]{24,}/,
  'Anthropic API key': /\bsk-ant-[A-Za-z0-9_-]{20,}/,
  'OpenAI API key': /\bsk-(?:(?:proj|svcacct|admin)-[A-Za-z0-9_-]{20,}|[A-Za-z0-9]{40,})/,
  'Google API key': /\bAIza[0-9A-Za-z_-]{35}\b/,
  'private key': /-----BEGIN (?:RSA |EC |DSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/,
};

function writtenText(toolInput) {
  const edits = Array.isArray(toolInput.edits) ? toolInput.edits.map((e) => e.new_string) : [];
  return [toolInput.content, toolInput.new_string, toolInput.new_source, toolInput.command, ...edits].filter((s) => typeof s === 'string').join('\n');
}

function findSecretKind(text) {
  return Object.keys(SECRET_PATTERNS).find((kind) => SECRET_PATTERNS[kind].test(text));
}

let raw = '';
process.stdin.on('data', (chunk) => { raw += chunk; });
process.stdin.on('end', () => {
  let toolInput;
  try {
    toolInput = JSON.parse(raw).tool_input || {};
  } catch {
    process.exit(0); // fail open: Claude Code always sends JSON, and a parse bug must not block every edit
  }
  const kind = findSecretKind(writtenText(toolInput));
  if (!kind) process.exit(0);
  process.stderr.write(
    `clean-n-code blocked this write: secret-shaped value (${kind}) in ${toolInput.file_path || toolInput.notebook_path || 'the command'}. ` +
    'Read secrets at runtime from a secret store or an environment variable, and commit only a placeholder [S7, S8]. ' +
    'If this key is real and was already shared or committed, revoke and rotate it [S10]. ' +
    'If it is a false positive, the user can set CLEAN_N_CODE_SECRETS=off.\n',
  );
  process.exit(2);
});
