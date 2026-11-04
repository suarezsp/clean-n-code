const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { SKILLS_DIR, CATALOG_FILES, REPORT_SKILLS, skillNames, readSkill, frontmatter } = require('./helpers');

for (const name of skillNames()) {
  test(`${name}: frontmatter name matches its folder`, () => {
    assert.match(frontmatter(readSkill(name)) ?? '', new RegExp(`^name: ${name}$`, 'm'));
  });

  test(`${name}: description is present`, () => {
    assert.match(frontmatter(readSkill(name)) ?? '', /^description: >?\s*\S/m);
  });

  test(`${name}: every relative path to a sibling skill exists`, () => {
    const skillDir = path.join(SKILLS_DIR, name);
    const references = [...readSkill(name).matchAll(/`(\.\.\/[^`\s]+)`/g)].map((m) => m[1]);
    for (const ref of references) assert.ok(fs.existsSync(path.join(skillDir, ref)), `${name}: missing ${ref}`);
  });
}

for (const name of REPORT_SKILLS) {
  test(`${name}: loads every catalog`, () => {
    for (const file of CATALOG_FILES) assert.ok(readSkill(name).includes(file), `${name} does not load ${file}`);
  });
}

for (const name of ['clean-review', 'clean-audit', 'clean-help']) {
  test(`${name}: promises to change no code`, () => {
    assert.match(readSkill(name), /changes? (no code|nothing)/i);
  });
}

test('clean-refactor pins behavior with tests before changing code', () => {
  const text = readSkill('clean-refactor');
  assert.ok(text.indexOf('Pin the behavior first') < text.indexOf('Tiny steps'));
});
