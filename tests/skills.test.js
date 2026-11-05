const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { ROOT, SKILLS_DIR, READABILITY_CATALOGS, REPORT_SKILLS, skillNames, readSkill, frontmatter } = require('./helpers');

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
  test(`${name}: loads every readability catalog`, () => {
    for (const file of READABILITY_CATALOGS) assert.ok(readSkill(name).includes(file), `${name} does not load ${file}`);
  });
}

test('clean-secure loads the security catalog', () => {
  assert.ok(readSkill('clean-secure').includes('security.md'));
});

for (const name of ['clean-review', 'clean-audit', 'clean-secure']) {
  test(`${name}: promises to change no code`, () => {
    assert.match(readSkill(name), /changes? (no code|nothing)/i);
  });
}

test('clean-refactor pins behavior with tests before changing code', () => {
  const text = readSkill('clean-refactor');
  assert.ok(text.indexOf('Pin the behavior first') < text.indexOf('Tiny steps'));
});

// The plugin stands alone: no skill or manifest leans on another plugin by name.
test('no skill or manifest mentions ponytail', () => {
  const files = [
    ...skillNames().map((name) => path.join(SKILLS_DIR, name, 'SKILL.md')),
    ...fs.readdirSync(path.join(SKILLS_DIR, 'clean-n-code', 'references')).map((f) => path.join(SKILLS_DIR, 'clean-n-code', 'references', f)),
    path.join(ROOT, '.claude-plugin', 'plugin.json'),
    path.join(ROOT, '.claude-plugin', 'marketplace.json'),
  ];
  const offenders = files.filter((file) => /ponytail/i.test(fs.readFileSync(file, 'utf8')));
  assert.deepEqual(offenders, []);
});

// Cost guard: the always-on mode must not order a Read turn before writing code, or cite codes it hasn't seen.
test('always-on mode writes from cards and cites only codes in context', () => {
  const text = readSkill('clean-n-code');
  assert.doesNotMatch(text, /before writing code in a language, read its guide/i);
  assert.match(text, /Cite only codes printed in this context/);
  assert.match(text, /never invent one/);
});
