import path from 'node:path';
import { check, throws, finish } from '../../lib/check-helpers.mjs';

const { parsePagination } = await import(path.resolve(process.argv[2], 'src', 'pagination.ts'));
const same = (q: object, page: number, limit: number) => {
  const r = parsePagination(q);
  return r.page === page && r.limit === limit;
};

check('defaults', () => same({}, 1, 20));
check('values parsed', () => same({ page: '3', limit: '50' }, 3, 50));
check('limit bounds kept', () => same({ limit: '1' }, 1, 1) && same({ limit: '100' }, 1, 100));
for (const page of ['0', '-1', '1.5', 'abc']) check(`page ${page} is an error`, () => throws(() => parsePagination({ page })));
for (const limit of ['0', '101', '2.5', 'x']) check(`limit ${limit} is an error`, () => throws(() => parsePagination({ limit })));
finish();
