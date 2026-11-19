const test = require('node:test');
const assert = require('node:assert/strict');
const {
  CATALOG_CODES, CATALOG_FILES, skillNames, readSkill, readCatalog, definedCodes, allDefinedCodes, citedCodes,
} = require('./helpers');

const knownCodes = allDefinedCodes();

for (const [file, expectedCodes] of Object.entries(CATALOG_CODES)) {
  test(`${file} defines exactly its ${expectedCodes.length} codes`, () => {
    assert.deepEqual(definedCodes(readCatalog(file)).sort(), [...expectedCodes].sort());
  });
}

test('no code is defined twice across catalogs', () => {
  const codes = CATALOG_FILES.flatMap((file) => definedCodes(readCatalog(file)));
  assert.equal(codes.length, new Set(codes).size);
});

for (const name of skillNames()) {
  test(`every code cited by ${name} exists in a catalog`, () => {
    const unknown = citedCodes(readSkill(name)).filter((code) => !knownCodes.has(code));
    assert.deepEqual(unknown, []);
  });
}

for (const file of CATALOG_FILES) {
  test(`every code cross-referenced inside ${file} exists`, () => {
    const unknown = citedCodes(readCatalog(file)).filter((code) => !knownCodes.has(code));
    assert.deepEqual(unknown, []);
  });
}
