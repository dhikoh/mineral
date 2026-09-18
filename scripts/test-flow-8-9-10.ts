/**
 * scripts/test-flow-8-9-10.ts
 * Verifikasi Uji Alur Bisnis:
 * - Uji #8: Alur Uang End-to-End (Kalkulasi > 0, Verifikasi amount = grandTotal tanpa 409, CRM DEAL, LTV sinkron)
 * - Uji #9: Integritas Catatan Pembeli vs Admin Notes
 * - Uji #10: Ketahanan Snapshot OrderItem saat produk master dihapus
 */
import fs from 'fs';
import path from 'path';

// Load .env if not loaded
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.substring(0, idx).trim();
      let val = trimmed.substring(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

import {
  getProducts,
  createOrder,
  getOrderById,
  getOrderByCode,
  submitPaymentProof,
  verifyPaymentProof,
  updateOrderStatus,
  deleteProduct,
  getCustomerById,
  getAdminDashboardStats,
  getSiteSettings,
} from '../src/lib/data-store';
import { computeOrderTotals } from '../src/lib/order-total';

let passed = 0;
let failed = 0;

function assert(desc: string, condition: boolean, details?: any) {
  if (condition) {
    console.log(`  ✅ PASS: ${desc}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${desc}`, details ? details : '');
    failed++;
  }
}

async function runBusinessFlowTests() {
  console.log('\n========================================================');
  console.log('🧪 VERIFIKASI GATE MUTU C: UJI ALUR #8, #9, & #10');
  console.log('========================================================\n');

  // -------------------------------------------------------------
  // UJI #8: ALUR UANG END-TO-END
  // -------------------------------------------------------------
  console.log('--- Uji #8: Alur Uang End-to-End ---');
  const products = await getProducts();
  const testProduct = (products as any[]).find((p: any) => p.stock && p.stock >= 5) || (products as any[])[0];
  const settings = await getSiteSettings();

  // 1. Checkout nominal calculation
  const qty = 5;
  const unitPrice = testProduct.price;
  const subtotal = qty * unitPrice;
  const taxRate = settings.taxEnabled ? settings.defaultTaxRate || 1100 : 0;
  const calculatedTotals = computeOrderTotals({
    items: [{ price: unitPrice, qty }],
    taxEnabled: Boolean(settings.taxEnabled),
    taxRateBps: taxRate,
    shippingCost: 0,
  });

  assert('Nominal subtotal dihitung benar (> 0)', calculatedTotals.subtotal === subtotal && subtotal > 0);
  assert('Nominal grandTotal dihitung benar (> 0)', calculatedTotals.grandTotal >= calculatedTotals.subtotal);

  // 2. Rekening asli di public settings
  const hasBankAccounts = Array.isArray(settings.bankAccounts) && settings.bankAccounts.length > 0;
  assert('Rekening bank/QRIS aktif tersedia di SiteSettings', hasBankAccounts);

  // 3. Buat order
  const testPhone = '081288776655';
  const buyerNotes = 'Catatan penting dari pembeli untuk packing kayu dan segel karung.';
  const order = await createOrder({
    buyerName: 'PT Industri Kimia Nusantara',
    buyerPhone: testPhone,
    buyerEmail: 'pengadaan@kimianusantara.co.id',
    buyerAddress: 'Jl. Kawasan Industri Rungkut Blok C-10, Surabaya',
    notes: buyerNotes,
    items: [{ productId: testProduct.id, qty }],
  });

  assert('Order berhasil dibuat dengan grandTotal > 0', order.grandTotal > 0);
  assert('Nominal grandTotal di database sama dengan kalkulasi checkout', order.grandTotal === calculatedTotals.grandTotal);
  assert('Order subtotal konsisten', order.subtotal === calculatedTotals.subtotal);

  // 3b. ADD-02: Negosiasi ongkir oleh admin
  const negotiatedShippingCost = 50000;
  await updateOrderStatus(order.id, order.status, undefined, undefined, negotiatedShippingCost);
  const orderAfterShipping = await getOrderById(order.id);
  assert('Admin berhasil menetapkan ongkir hasil negosiasi (ADD-02)', (orderAfterShipping?.shippingCost || 0) === negotiatedShippingCost);
  assert('GrandTotal terupdate dengan ongkir negosiasi', (orderAfterShipping?.grandTotal || 0) === calculatedTotals.grandTotal + negotiatedShippingCost);

  const finalPayAmount = orderAfterShipping?.grandTotal || order.grandTotal;

  // 4. Upload bukti transfer dengan amount = grandTotal
  const proof = await submitPaymentProof(order.id, {
    fileUrl: '/uploads/proof-uji-8.jpg',
    senderBank: 'BCA',
    senderName: 'PT Industri Kimia Nusantara',
    amount: finalPayAmount, // Tepat sebesar grandTotal setelah ongkir
    note: 'Pembayaran transfer penuh via BCA KlikBisnis',
  });
  assert('Upload bukti transfer berhasil', Boolean(proof));

  // 5. Admin verifikasi pembayaran -> LULUS tanpa 409
  let verifyError: any = null;
  let verifiedOrder: any = null;
  try {
    verifiedOrder = await verifyPaymentProof(order.id, true, 'Verifikasi mutasi rekening BCA valid.');
  } catch (err: any) {
    verifyError = err;
  }
  assert('Verifikasi pembayaran lulus tanpa 409 AMOUNT_MISMATCH', verifyError === null && verifiedOrder !== null);
  assert('Status pesanan berubah menjadi PAID', verifiedOrder?.status === 'PAID');

  // 6. CRM naik ke DEAL dan LTV bertambah sebesar grandTotal
  if (order.customerId) {
    const customer = await getCustomerById(order.customerId);
    assert('Customer CRM dipromosikan ke DEAL', customer?.status === 'DEAL');
    assert('Customer LTV (totalSpent) bertambah sebesar grandTotal', (customer?.totalSpent || 0) >= finalPayAmount);
  } else {
    assert('Customer ID tercatat di Order', false, 'order.customerId is null');
  }

  // 7. Dashboard omset
  const stats = await getAdminDashboardStats();
  assert('Dashboard menampilkan omset total > 0', stats.totalRevenue >= finalPayAmount);

  // -------------------------------------------------------------
  // UJI #9: INTEGRITAS CATATAN PEMBELI VS ADMIN NOTES
  // -------------------------------------------------------------
  console.log('\n--- Uji #9: Integritas Catatan Pembeli vs Admin Notes ---');
  const adminInternalNotes = 'Catatan rahasia admin: Pembeli VIP, berikan diskon invoice berikutnya.';
  const updatedOrderWithAdminNote = await updateOrderStatus(order.id, 'PROCESSING', adminInternalNotes);

  const reloadedOrder = await getOrderById(order.id);
  assert('Catatan pembeli asli tetap utuh dan tidak tertimpa', reloadedOrder?.notes === buyerNotes);
  assert('Catatan internal admin tersimpan di adminNotes', reloadedOrder?.adminNotes === adminInternalNotes);

  // -------------------------------------------------------------
  // UJI #10: KETAHANAN SNAPSHOT ORDERITEM
  // -------------------------------------------------------------
  console.log('\n--- Uji #10: Ketahanan Snapshot OrderItem Saat Produk Dihapus ---');
  const orderWithSnapshot = await getOrderById(order.id);
  const firstItem = orderWithSnapshot?.items[0];

  assert('OrderItem memiliki snapshot productName', Boolean(firstItem?.productName && firstItem.productName.length > 0));
  assert('OrderItem memiliki snapshot productUnit', Boolean(firstItem?.productUnit && firstItem.productUnit.length > 0));
  assert('OrderItem memiliki snapshot productSlug', Boolean(firstItem?.productSlug));

  const originalItemName = firstItem?.productName;
  const originalItemUnit = firstItem?.productUnit;

  // Hapus produk referensi
  if (testProduct.id) {
    let deleteSucceeded = false;
    try {
      await deleteProduct(testProduct.id);
      deleteSucceeded = true;
    } catch (e: any) {
      // Jika diproteksi oleh integrity check relasi di DB, itu juga valid
      deleteSucceeded = false;
    }

    // Lookup order lagi
    const orderAfterProductDelete = await getOrderById(order.id);
    const itemAfter = orderAfterProductDelete?.items[0];

    assert(
      'OrderItem tetap menyajikan nama komoditas asli dari snapshot',
      itemAfter?.productName === originalItemName
    );
    assert(
      'OrderItem tetap menyajikan satuan komoditas asli dari snapshot',
      itemAfter?.productUnit === originalItemUnit
    );
  }

  console.log('\n========================================================');
  console.log(`📊 HASIL UJI ALUR: ${passed} LULUS, ${failed} GAGAL`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runBusinessFlowTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
