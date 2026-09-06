const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');

function loadTs(path) {
  const output = ts.transpileModule(readFileSync(resolve(__dirname, '..', path), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  new Function('module', 'exports', 'require', output)(module, module.exports, require);
  return module.exports;
}
const { computeMisaScheduleOptions } = loadTs('src/lib/service-types.ts');
const { getMisaDeadline } = loadTs('src/lib/misa-deadline.ts');

test('Sunday correction, Saturday addition, weekdays and first Friday exception', () => {
  const cases = [
    ['2026-09-06', ['06:00', '08:30', '17:30']],
    ['2026-09-12', ['06:30', '17:30']],
    ['2026-09-07', ['06:30']], ['2026-09-09', ['06:30']],
    ['2026-09-08', ['18:30']], ['2026-09-10', ['18:30']], ['2026-09-11', ['18:30']],
    ['2026-09-04', ['19:30']], ['2026-05-01', ['19:30']],
  ];
  for (const [date, expected] of cases) assert.deepEqual(computeMisaScheduleOptions(date).map(o => o.value), expected);
});

test('WIB noon deadlines handle Sundays, mornings, month/year boundaries and invalid dates', () => {
  const cases = [
    ['2026-09-06', '06:00', '2026-09-05T05:00:00.000Z'],
    ['2026-09-06', '08:30', '2026-09-05T05:00:00.000Z'],
    ['2026-09-06', '17:30', '2026-09-05T05:00:00.000Z'],
    ['2026-09-12', '06:30', '2026-09-11T05:00:00.000Z'],
    ['2026-09-12', '17:30', '2026-09-12T05:00:00.000Z'],
    ['2026-09-04', '19:30', '2026-09-04T05:00:00.000Z'],
    ['2026-09-08', '18:30', '2026-09-08T05:00:00.000Z'],
    ['2027-01-02', '06:30', '2027-01-01T05:00:00.000Z'],
    ['2028-01-01', '06:30', '2027-12-31T05:00:00.000Z'],
    ['2026-03-01', '08:30', '2026-02-28T05:00:00.000Z'],
  ];
  for (const [date, time, expected] of cases) assert.equal(getMisaDeadline(date, time)?.toISOString(), expected);
  assert.equal(getMisaDeadline('', ''), undefined);
  assert.equal(getMisaDeadline('2026-02-30', '06:30'), undefined);
});
