/**
 * scripts/test-csv-injection.ts
 * FASE 6: Regresi formula injection prevention di modul csv.ts
 */
import { escapeCsvField, buildCsv } from '../src/lib/csv';

let pass = 0;
let fail = 0;

function expect(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { console.log(`  ✓ ${label}`); pass++; }
  else {
    console.error(`  ✗ ${label}`);
    console.error(`    Expected: ${JSON.stringify(expected)}`);
    console.error(`    Actual:   ${JSON.stringify(actual)}`);
    fail++;
  }
}

function expectContains(label: string, actual: string, substring: string) {
  if (actual.includes(substring)) { console.log(`  ✓ ${label}`); pass++; }
  else {
    console.error(`  ✗ ${label} — expected to contain: ${JSON.stringify(substring)}`);
    console.error(`    Actual: ${JSON.stringify(actual)}`);
    fail++;
  }
}

function expectNotContains(label: string, actual: string, substring: string) {
  if (!actual.includes(substring)) { console.log(`  ✓ ${label}`); pass++; }
  else {
    console.error(`  ✗ ${label} — should NOT contain: ${JSON.stringify(substring)}`);
    fail++;
  }
}

console.log('\n=== test-csv-injection: Formula Injection Prevention ===\n');

console.log('escapeCsvField — formula prefix protection:');
const formulaStarters = ['=SUM(A1)', '+1+1', '-1+1', '@SUM', '\t=cmd', '\r=cmd'];
for (const f of formulaStarters) {
  const result = escapeCsvField(f);
  expectContains(`"${f}" diawali apostrof`, result, "'");
  expectNotContains(`"${f}" tidak bisa langsung dieksekusi Excel`, result, f.charAt(0) === result.charAt(1) ? '' : f);
}

console.log('\nescapeCsvField — normal values:');
expect('String biasa', escapeCsvField('PT Mineral Alam'), '"PT Mineral Alam"');
expect('Angka', escapeCsvField(12345), '"12345"');
expect('null → ""', escapeCsvField(null), '""');
expect('undefined → ""', escapeCsvField(undefined), '""');
expect('String dengan koma', escapeCsvField('Jakarta, Indonesia'), '"Jakarta, Indonesia"');
expect('String dengan kutip', escapeCsvField('Nama "Alias"'), '"Nama ""Alias"""');

console.log('\nbuildCsv — struktur file:');
const csv = buildCsv(['Nama', 'Harga'], [['PT ABC', 100000], ['=SUM()', 200000]]);
expectContains('Dimulai dengan BOM', csv, '\uFEFF');
expectContains('Header baris pertama', csv, '"Nama","Harga"');
expectContains('Data baris pertama', csv, '"PT ABC","100000"');
expectContains('Formula injection di-escape', csv, "'=SUM()");
expectContains('Pakai CRLF', csv, '\r\n');

console.log(`\n=== Hasil: ${pass} lulus, ${fail} gagal ===\n`);
if (fail > 0) process.exit(1);
