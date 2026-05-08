const {
  buildBankRows,
  verifyNumericBank,
  assertHardTierCoversAllSkills,
  PER_TIER,
} = require('./generated-practice-bank');

const rows = buildBankRows();
const { errors, skippedTitles } = verifyNumericBank(rows);
const hard = assertHardTierCoversAllSkills(rows, 14);

console.log('rows', rows.length, 'expected', PER_TIER * 3 * 3);
console.log('numeric verify errors', errors.length);
if (errors.length) console.log(errors.slice(0, 15));
console.log('skipped auto-verify titles', [...skippedTitles].sort().join(', '));
console.log(
  'HARD tier skill gaps (<14)',
  hard.length ? hard : 'none — all section skills represented on HARD'
);

process.exit(errors.length ? 1 : 0);
