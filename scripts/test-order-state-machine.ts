/**
 * scripts/test-order-state-machine.ts
 * FASE 6: Regresi transisi status pesanan dan helper canVerifyPayment/canRejectPayment
 */
import {
  isValidOrderTransition,
  canVerifyPayment,
  canRejectPayment,
  VALID_ORDER_STATUSES,
  ALLOWED_ORDER_TRANSITIONS,
} from '../src/lib/order-security';

let pass = 0;
let fail = 0;

function expect(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { console.log(`  ✓ ${label}`); pass++; }
  else {
    console.error(`  ✗ ${label} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    fail++;
  }
}

console.log('\n=== test-order-state-machine ===\n');

// P1-05: REJECTED tidak boleh ada
console.log('REJECTED removed from state machine:');
expect('VALID_ORDER_STATUSES has no REJECTED', VALID_ORDER_STATUSES.includes('REJECTED' as never), false);
expect('ALLOWED_ORDER_TRANSITIONS has no REJECTED key', 'REJECTED' in ALLOWED_ORDER_TRANSITIONS, false);

// Transisi sah
console.log('\nTransisi sah:');
expect('PENDING_PAYMENT → PENDING_VERIFICATION', isValidOrderTransition('PENDING_PAYMENT', 'PENDING_VERIFICATION'), true);
expect('PENDING_PAYMENT → CANCELLED', isValidOrderTransition('PENDING_PAYMENT', 'CANCELLED'), true);
expect('PAID → PROCESSING', isValidOrderTransition('PAID', 'PROCESSING'), true);
expect('PROCESSING → SHIPPED', isValidOrderTransition('PROCESSING', 'SHIPPED'), true);
expect('SHIPPED → COMPLETED', isValidOrderTransition('SHIPPED', 'COMPLETED'), true);
expect('Same status (PENDING_PAYMENT → PENDING_PAYMENT)', isValidOrderTransition('PENDING_PAYMENT', 'PENDING_PAYMENT'), true);

// Transisi tidak sah
console.log('\nTransisi tidak sah (P0-04 state machine gate):');
expect('PENDING_PAYMENT → PAID (langsung, bypass verifikasi)', isValidOrderTransition('PENDING_PAYMENT', 'PAID'), false);
expect('COMPLETED → CANCELLED (terminal)', isValidOrderTransition('COMPLETED', 'CANCELLED'), false);
expect('CANCELLED → PAID (terminal)', isValidOrderTransition('CANCELLED', 'PAID'), false);
expect('PENDING_VERIFICATION → PAID (via PATCH generik)', isValidOrderTransition('PENDING_VERIFICATION', 'PAID'), false);
expect('SHIPPED → PENDING_PAYMENT (backward)', isValidOrderTransition('SHIPPED', 'PENDING_PAYMENT'), false);

// canVerifyPayment / canRejectPayment
console.log('\ncanVerifyPayment:');
expect('PENDING_VERIFICATION = can verify', canVerifyPayment('PENDING_VERIFICATION'), true);
expect('PAID = cannot verify', canVerifyPayment('PAID'), false);
expect('PENDING_PAYMENT = cannot verify', canVerifyPayment('PENDING_PAYMENT'), false);
expect('COMPLETED = cannot verify', canVerifyPayment('COMPLETED'), false);

console.log('\ncanRejectPayment:');
expect('PENDING_VERIFICATION = can reject', canRejectPayment('PENDING_VERIFICATION'), true);
expect('PAID = cannot reject', canRejectPayment('PAID'), false);
expect('CANCELLED = cannot reject', canRejectPayment('CANCELLED'), false);

console.log(`\n=== Hasil: ${pass} lulus, ${fail} gagal ===\n`);
if (fail > 0) process.exit(1);
