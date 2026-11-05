// Shared helpers for the TypeScript hidden checks in evals/<case>/check.mts (run with tsx).
export const failures = [];

export function check(name, fn) {
  try {
    if (!fn()) failures.push(name);
  } catch (err) {
    failures.push(`${name} (threw ${err.message})`);
  }
}

export function throws(fn) {
  try { fn(); } catch { return true; }
  return false;
}

export function finish() {
  for (const name of failures) console.log(`FAIL ${name}`);
  process.exit(failures.length ? 1 : 0);
}
