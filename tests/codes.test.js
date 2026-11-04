const test = require('node:test');
const assert = require('node:assert/strict');
const { citedCodes, invalidCodes, allDefinedCodes } = require('../lib/codes');

test('invalidCodes flags unknown codes and code-shaped labels', () => {
  assert.deepEqual(invalidCodes('Applied: G25, S-validation, PY99, K10').sort(), ['K10', 'PY99', 'S-validation']);
  assert.deepEqual(invalidCodes('see G-12 and GO-errors'), ['G-12', 'GO-errors']);
});

test('invalidCodes accepts real catalog and language codes', () => {
  assert.deepEqual(invalidCodes('Applied: N1, K9, S12, D12, GO9, PY15, RS11, CL14'), []);
  assert.deepEqual(invalidCodes('Applied: RS3 (C-CONV), CWE-89, SHA-256'), []);
});

test('citedCodes ignores dotted guideline ids and longer words', () => {
  assert.deepEqual(citedCodes('ES.20 CP.20 CA1502 MEM30-C GO9'), ['GO9']);
});

test('allDefinedCodes covers every catalog and language guide', () => {
  for (const code of ['C1', 'G36', 'K9', 'D16', 'S25', 'PY16', 'TS14', 'RS15']) assert.ok(allDefinedCodes().has(code), code);
});
