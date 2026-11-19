# Changelog

## 1.0.0 (2026-11-19)

First stable version.

### Changed
- The language card sent after a file is written no longer makes the model restyle that file: it applies to what is written next, and the written file is edited only for a bug or a security rule.
- Session start sends one language card (the project's most common language), not up to three. Other project languages keep a one-line idiom and get their card on first write.
- Shorter always-on ruleset (≤ 3800 characters): doc comments only where the repo documents its API, closing line capped at 5 codes, no recap.
- `scripts/ab.js` split into `scripts/ab/args.js`, `judge.js` and `report.js`; every function under cyclomatic complexity 10.
- `npm run eval` runs both the graded and the language suites.

### Added
- Language evals for Go, Python and TypeScript (12 `lang-*` cases in total).

### Removed
- Unused exports in `lib/codes.js`, `lib/session.js` and `scripts/ab.js`.

### Measured
Plugin vs no plugin, 9 cases × 3 runs: cost +29% → +12% (Sonnet) and +37% → +17% (Haiku); output tokens +20% → −1% (Sonnet) and +41% → +11% (Haiku). Blind judge still favors the plugin (15–6 Sonnet, 13–5 Haiku). Details in the README.

## 0.1.0

Initial plugin: always-on clean-code mode, review, security, audit and refactor skills, secret-blocking hook, 12 language guides, evals and A/B runner.
