import fs from 'node:fs';
import path from 'node:path';
import { check, finish } from '../../lib/check-helpers.mjs';

const src = path.resolve(process.argv[2], 'src');
let salesReport: ((csv: string) => string) | undefined;
for (const file of fs.readdirSync(src).filter((f) => f.endsWith('.ts'))) {
  salesReport ??= (await import(path.join(src, file))).salesReport;
}
if (!salesReport) {
  console.log('FAIL no file exports salesReport');
  process.exit(1);
}

const csv = [
  'date,region,amount_cents',
  '2024-01-01,North,1050',
  '2024-01-02,South,2500',
  '2024-01-03,North,950',
  'bad,North,1',
  '2024-01-04,,5',
  '2024-01-05,East,-1',
  '2024-01-06,East,1.5',
  '',
].join('\n');
const lines = salesReport(csv).split('\n');
const amountLines = lines.slice(0, 3);

check('sorted by total descending', () => /^\s*South\b.*25\.00\s*$/.test(lines[0]) && /^\s*North\b.*20\.00\s*$/.test(lines[1]));
check('TOTAL line', () => /^\s*TOTAL\b.*45\.00\s*$/.test(lines[2]));
check('amounts right-aligned', () => new Set(amountLines.map((l) => l.trimEnd().length)).size === 1);
check('errors block', () => lines[3] === '' && lines[4] === 'Errors:');
check('one error line per invalid row, in order', () => {
  const errors = lines.slice(5).filter(Boolean);
  return errors.length === 4 && errors.every((l, i) => l.startsWith(`line ${i + 5}: `));
});
check('ties sorted by region name', () => {
  const out = salesReport!('date,region,amount_cents\n2024-01-01,Beta,100\n2024-01-01,Alpha,100').split('\n');
  return /^\s*Alpha\b/.test(out[0]) && /^\s*Beta\b/.test(out[1]);
});
check('no errors block when every row is valid', () => !salesReport!('date,region,amount_cents\n2024-01-01,A,1').includes('Errors:'));
finish();
