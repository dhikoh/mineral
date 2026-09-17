/**
 * scripts/test-uom.ts
 * FASE 6: Regresi matriks konversi KG↔TON untuk modul uom.ts
 */
import {
  toBaseQty,
  fromBaseQty,
  priceForDisplayUnit,
  maxQtyInDisplayUnit,
  validateOrderQty,
  isWeightBase,
  normalizeBaseUnit,
} from '../src/lib/uom';

let pass = 0;
let fail = 0;

function expect(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    console.log(`  ✓ ${label}`);
    pass++;
  } else {
    console.error(`  ✗ ${label}`);
    console.error(`    Expected: ${JSON.stringify(expected)}`);
    console.error(`    Actual:   ${JSON.stringify(actual)}`);
    fail++;
  }
}

console.log('\n=== test-uom: Unit of Measure Conversion ===\n');

// isWeightBase
console.log('isWeightBase:');
expect('kg is weight', isWeightBase('kg'), true);
expect('ton is weight', isWeightBase('ton'), true);
expect('kilogram is weight', isWeightBase('kilogram'), true);
expect('pcs is not weight', isWeightBase('pcs'), false);

// normalizeBaseUnit
console.log('\nnormalizeBaseUnit:');
expect('kg → kg', normalizeBaseUnit('kg'), 'kg');
expect('ton → ton', normalizeBaseUnit('ton'), 'ton');
expect('KILOGRAM → kg', normalizeBaseUnit('kilogram'), 'kg');
expect('pcs → null', normalizeBaseUnit('pcs'), null);

// toBaseQty: convert display unit → base unit
console.log('\ntoBaseQty:');
expect('2 ton → kg = 2000', toBaseQty(2, 'ton', 'kg'), 2000);
expect('500 kg → kg = 500', toBaseQty(500, 'kg', 'kg'), 500);
expect('500 kg → ton = 0.5', toBaseQty(500, 'kg', 'ton'), 0.5);
expect('1 ton → ton = 1', toBaseQty(1, 'ton', 'ton'), 1);
expect('0.5 ton → kg = 500', toBaseQty(0.5, 'ton', 'kg'), 500);

// fromBaseQty: convert base unit → display unit
console.log('\nfromBaseQty:');
expect('2000 kg (base) → ton display = 2', fromBaseQty(2000, 'ton', 'kg'), 2);
expect('500 kg (base) → kg display = 500', fromBaseQty(500, 'kg', 'kg'), 500);
expect('1000 kg (base) → ton display = 1', fromBaseQty(1000, 'ton', 'kg'), 1);
expect('2 ton (base) → kg display = 2000', fromBaseQty(2, 'kg', 'ton'), 2000);

// priceForDisplayUnit
console.log('\npriceForDisplayUnit:');
expect('Rp5000/kg → ton display = Rp5_000_000', priceForDisplayUnit(5000, 'ton', 'kg'), 5_000_000);
expect('Rp5000/kg → kg display = Rp5000', priceForDisplayUnit(5000, 'kg', 'kg'), 5000);
expect('Rp2_000_000/ton → kg display = Rp2000', priceForDisplayUnit(2_000_000, 'kg', 'ton'), 2000);
expect('Rp2_000_000/ton → ton display = Rp2_000_000', priceForDisplayUnit(2_000_000, 'ton', 'ton'), 2_000_000);

// maxQtyInDisplayUnit
console.log('\nmaxQtyInDisplayUnit:');
expect('stock 5000 kg → ton max = 5', maxQtyInDisplayUnit(5000, 'ton', 'kg'), 5);
expect('stock 500 kg → ton max = 0 (disabled)', maxQtyInDisplayUnit(500, 'ton', 'kg'), 0);
expect('stock 500 kg → kg max = 500', maxQtyInDisplayUnit(500, 'kg', 'kg'), 500);
expect('stock 2 ton → kg max = 2000', maxQtyInDisplayUnit(2, 'kg', 'ton'), 2000);

// validateOrderQty
console.log('\nvalidateOrderQty:');
expect('qty=1000 minOQ=1000 incr=1 = valid', validateOrderQty(1000, 1000, 1), null);
expect('qty=500 minOQ=1000 incr=1 = error', validateOrderQty(500, 1000, 1) !== null, true);
expect('qty=1500 minOQ=1000 incr=500 = valid', validateOrderQty(1500, 1000, 500), null);
expect('qty=1250 minOQ=1000 incr=500 = error', validateOrderQty(1250, 1000, 500) !== null, true);

console.log(`\n=== Hasil: ${pass} lulus, ${fail} gagal ===\n`);
if (fail > 0) process.exit(1);
