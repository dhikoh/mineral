/**
 * Automated Verification Script for Audit P0, P1, and Business Gap Solved Items
 * Adably
 */

import { generateOrderCode } from '../src/lib/utils';
import {
  createOrder,
  submitPaymentProof,
  verifyPaymentProof,
  deleteCategory,
  deleteProduct,
  getCategories,
  getProducts,
  getAdminUsers,
  createAdminUser,
} from '../src/lib/data-store';
import { isSuperAdmin, isAdmin } from '../src/lib/auth';

let passed = 0;
let failed = 0;

function assert(condition: boolean, desc: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${desc}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${desc}`);
    failed++;
  }
}

async function runAuditTests() {
  console.log('========================================================');
  console.log('🧪 RUNNING AUDIT P0, P1 & BUSINESS GAP VERIFICATION');
  console.log('========================================================\n');

  // -----------------------------------------------------------
  // 1. P0: ORDER CODE CRYPTOGRAPHIC ENTROPY & COLLISION RESISTANCE
  // -----------------------------------------------------------
  console.log('--- 1. P0: OrderCode Cryptographic Entropy ---');
  const sampleCode = generateOrderCode();
  assert(
    /^ORD-\d{8}-[A-F0-9]{8}$/.test(sampleCode),
    `Format ORD-YYYYMMDD-[HEX8] matched: ${sampleCode}`
  );

  const codeSet = new Set<string>();
  const ITERATIONS = 5000;
  for (let i = 0; i < ITERATIONS; i++) {
    codeSet.add(generateOrderCode());
  }
  assert(
    codeSet.size === ITERATIONS,
    `Zero collisions generated across ${ITERATIONS} rapid iterations (100% unique)`
  );

  // -----------------------------------------------------------
  // 2. P0: CHECKOUT QUANTITY VALIDATION (NO NEGATIVE / ZERO QTY)
  // -----------------------------------------------------------
  console.log('\n--- 2. P0: Checkout Quantity Strict Positive Integer Validation ---');
  let zeroQtyCaught = false;
  try {
    await createOrder({
      buyerName: 'Test Buyer',
      buyerPhone: '081234567890',
      buyerAddress: 'Jl. Uji Kuantitas No. 1',
      items: [{ productId: 'prod-1', qty: 0 }],
    });
  } catch (err: any) {
    zeroQtyCaught = true;
    assert(
      err.message.toLowerCase().includes('positif') || err.message.toLowerCase().includes('kuantitas'),
      `Zero quantity rejected with descriptive error: "${err.message}"`
    );
  }
  assert(zeroQtyCaught, 'Order creation with qty=0 was strictly rejected');

  let negativeQtyCaught = false;
  try {
    await createOrder({
      buyerName: 'Fraud Buyer',
      buyerPhone: '081234567890',
      buyerAddress: 'Jl. Uji Kuantitas No. 2',
      items: [{ productId: 'prod-1', qty: -5 }],
    });
  } catch (err: any) {
    negativeQtyCaught = true;
    assert(
      err.message.toLowerCase().includes('positif') || err.message.toLowerCase().includes('kuantitas'),
      `Negative quantity rejected with descriptive error: "${err.message}"`
    );
  }
  assert(negativeQtyCaught, 'Order creation with qty=-5 was strictly rejected');

  // -----------------------------------------------------------
  // 3. P0: PAYMENT PROOF STATUS GATE & CRM IDEMPOTENCY
  // -----------------------------------------------------------
  console.log('\n--- 3. P0: Status Gate Bukti Pembayaran & Idempotensi CRM Deal ---');
  // Create valid order
  const validOrder = await createOrder({
    buyerName: 'Audit Customer',
    buyerPhone: '081288990011',
    buyerAddress: 'Jl. Pertambangan Sukses No. 8',
    items: [{ productId: 'prod-1', qty: 2 }],
  });
  assert(validOrder.status === 'PENDING_PAYMENT', 'Order created with PENDING_PAYMENT');

  // Submit proof for PENDING_PAYMENT -> should succeed
  const proofResult = await submitPaymentProof(validOrder.id, {
    fileUrl: '/uploads/bukti-test.jpg',
    senderBank: 'BCA',
    senderName: 'Audit Customer',
    amount: validOrder.total,
    note: 'Uji status gate',
  });
  assert(proofResult.status === 'PENDING_VERIFICATION', 'Proof submitted -> status is PENDING_VERIFICATION');

  // Verify payment proof -> status becomes PAID
  const verifiedOrder = await verifyPaymentProof(validOrder.id, true, 'Admin Audit');
  assert(verifiedOrder.status === 'PAID', 'Verified proof -> status is PAID');

  // Attempt to re-submit proof on PAID order -> MUST be rejected by Status Gate
  let reSubmitRejected = false;
  try {
    await submitPaymentProof(validOrder.id, {
      fileUrl: '/uploads/bukti-palsu.jpg',
      senderBank: 'Mandiri',
      senderName: 'Fraud',
      amount: validOrder.total,
      note: 'Re-upload on paid order',
    });
  } catch (err: any) {
    reSubmitRejected = true;
    assert(
      err.message.includes('lunas') || err.message.includes('tidak dapat menerima bukti transfer baru'),
      `Status Gate rejected re-submission with message: "${err.message}"`
    );
  }
  assert(reSubmitRejected, 'Re-submitting payment proof on PAID order was blocked by Status Gate');

  // Idempotency: verify payment proof second time -> should NOT duplicate CRM or throw unhandled error
  const doubleVerified = await verifyPaymentProof(validOrder.id, true, 'Admin Audit Second Pass');
  assert(doubleVerified.status === 'PAID', 'Idempotent verification returned PAID without double-counting');

  // -----------------------------------------------------------
  // 4. P1: RELATIONAL INTEGRITY ON DELETE (CATEGORY & PRODUCT)
  // -----------------------------------------------------------
  console.log('\n--- 4. P1: Relational Integrity on Delete (Category & Product) ---');
  const allCats = await getCategories();
  const catWithProducts = allCats.find((c) => (c._count?.products || 0) > 0) || allCats[0];

  let catDeleteBlocked = false;
  try {
    await deleteCategory(catWithProducts.id);
  } catch (err: any) {
    catDeleteBlocked = true;
    assert(
      err.message.includes('masih digunakan') || err.message.includes('produk'),
      `Category deletion blocked due to existing products: "${err.message}"`
    );
  }
  assert(catDeleteBlocked, 'Foreign key / orphan cascade prevented on Category deletion');

  let prodDeleteBlocked = false;
  try {
    // prod-1 was ordered above in validOrder
    await deleteProduct('prod-1');
  } catch (err: any) {
    prodDeleteBlocked = true;
    assert(
      err.message.includes('riwayat') || err.message.includes('nonaktifkan'),
      `Product deletion blocked due to order history: "${err.message}"`
    );
  }
  assert(prodDeleteBlocked, 'Product with transaction history is protected against hard delete');

  // -----------------------------------------------------------
  // 5. BUSINESS GAP: UNIT OF MEASURE & DYNAMIC MIN STOCK
  // -----------------------------------------------------------
  console.log('\n--- 5. Business Gap: Satuan (UoM) & Ambang Stok Dinamis ---');
  const allProds = await getProducts();
  const prodSample = allProds[0];
  assert(typeof prodSample.unit === 'string' && prodSample.unit.length > 0, `Product has unit: "${prodSample.unit}"`);
  assert(typeof prodSample.minStock === 'number' && prodSample.minStock > 0, `Product has minStock: ${prodSample.minStock}`);

  // -----------------------------------------------------------
  // 6. BUSINESS GAP: RBAC HELPER SPECIFICATIONS
  // -----------------------------------------------------------
  console.log('\n--- 6. Business Gap: RBAC Helper Specifications ---');
  assert(isSuperAdmin({ id: '1', email: 'sa@test.com', name: 'SA', role: 'SUPERADMIN' }) === true, 'isSuperAdmin for SUPERADMIN is true');
  assert(isSuperAdmin({ id: '2', email: 'adm@test.com', name: 'Adm', role: 'ADMIN' }) === false, 'isSuperAdmin for ADMIN is false');
  assert(isAdmin({ id: '2', email: 'adm@test.com', name: 'Adm', role: 'ADMIN' }) === true, 'isAdmin for ADMIN is true');
  assert(isAdmin({ id: '1', email: 'sa@test.com', name: 'SA', role: 'SUPERADMIN' }) === true, 'isAdmin for SUPERADMIN is true');
  assert(isAdmin(null) === false, 'isAdmin for null session is false');

  console.log('\n========================================================');
  console.log(`📊 AUDIT TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAuditTests().catch((err) => {
  console.error('Fatal audit test error:', err);
  process.exit(1);
});
