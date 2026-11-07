const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const {
  ROOT, LANGUAGES_DIR, LANGUAGE_PREFIXES, LANGUAGE_MAX_LINES, CARD_MAX_CHARS, CATALOG_FILES, readCatalog, readLanguage, definedCodes, citedCodes,
} = require('./helpers');

const allDefinedCodes = new Set([
  ...CATALOG_FILES.flatMap((file) => definedCodes(readCatalog(file))),
  ...Object.keys(LANGUAGE_PREFIXES).flatMap((name) => definedCodes(readLanguage(name))),
]);

test('languages/ holds exactly one guide per known language', () => {
  const files = fs.readdirSync(LANGUAGES_DIR).filter((f) => f.endsWith('.md')).sort();
  assert.deepEqual(files, Object.keys(LANGUAGE_PREFIXES).map((name) => `${name}.md`).sort());
});

for (const [name, prefix] of Object.entries(LANGUAGE_PREFIXES)) {
  const text = readLanguage(name);

  test(`${name}.md defines ${prefix}1..n with no gaps or strays`, () => {
    const codes = definedCodes(text);
    assert.ok(codes.length >= 12, `${name}.md has only ${codes.length} codes`);
    assert.deepEqual(codes, codes.map((_, i) => `${prefix}${i + 1}`));
  });

  test(`${name}.md header range matches its last code`, () => {
    const codes = definedCodes(text);
    assert.ok(text.includes(`**${prefix}1–${codes.at(-1)}**`), `header should cite ${prefix}1–${codes.at(-1)}`);
  });

  test(`${name}.md lists its sources and stays within ${LANGUAGE_MAX_LINES} lines`, () => {
    assert.ok(fs.readFileSync(path.join(ROOT, 'docs', 'sources.md'), 'utf8').includes(`## ${name}.md`), `${name}.md has no sources`);
    assert.ok(text.split('\n').length <= LANGUAGE_MAX_LINES, `${name}.md is too long`);
  });

  test(`every code cited by ${name}.md exists`, () => {
    assert.deepEqual(citedCodes(text).filter((code) => !allDefinedCodes.has(code)), []);
  });

  test(`${name}.md has a Card within ${CARD_MAX_CHARS} characters citing only its own codes`, () => {
    const card = (text.match(/\n## Card\n([\s\S]*?)\n## /) || [])[1];
    assert.ok(card, `${name}.md has no ## Card section`);
    assert.ok(card.length <= CARD_MAX_CHARS, `card is ${card.length} characters`);
    const codes = citedCodes(card);
    assert.ok(codes.length >= 4, 'card cites too few codes');
    const defined = new Set(definedCodes(text));
    assert.deepEqual(codes.filter((code) => !defined.has(code)), []);
  });
}
