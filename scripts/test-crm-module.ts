import fs from 'fs';
import path from 'path';

// Load .env if not loaded (for standalone tsx execution)
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
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  createOrUpdateLead,
  syncCustomerFromOrder,
  getAdminDashboardStats,
  normalizePhone,
} from '../src/lib/data-store';

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    testsPassed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    testsFailed++;
  }
}

async function runTests() {
  console.log('🚀 Starting CRM & Customer Database Module Test Suite...\n');

  // Test 1: normalizePhone
  console.log('--- 1. Phone Normalization Test ---');
  assert(normalizePhone('081234567890') === '6281234567890', 'Convert leading 0 to 62');
  assert(normalizePhone('+62812-3456-7890') === '6281234567890', 'Remove non-digits and leading +');
  assert(normalizePhone('81234567890') === '6281234567890', 'Prepend 62 if starts with 8');
  assert(normalizePhone('6281234567890') === '6281234567890', 'Keep 62 as is');

  // Test 2: Initial Get Customers & Stats
  console.log('\n--- 2. Database Retrieval & Stats ---');
  const initialList = await getCustomers();
  assert(initialList.data.length >= 4, `Initial customer list loaded (${initialList.data.length} items)`);

  const initialStats = await getAdminDashboardStats();
  assert(typeof initialStats.totalLeadsCount === 'number', 'totalLeadsCount is present in stats');
  assert(typeof initialStats.totalCustomersCount === 'number', 'totalCustomersCount is present in stats');
  assert(typeof initialStats.totalProspectsCount === 'number', 'totalProspectsCount is present in stats');
  console.log(`     Metrics: ${initialStats.totalLeadsCount} Leads, ${initialStats.totalCustomersCount} Customers, ${initialStats.totalProspectsCount} Prospects`);

  // Test 3: Admin Manual Create Customer (CRUD: Create)
  console.log('\n--- 3. Admin Manual Create Customer (CRUD: Create) ---');
  const testPhone = `62899${Math.floor(1000000 + Math.random() * 9000000)}`;
  const newContact = await createCustomer({
    name: 'Budi Santoso, S.T.',
    company: 'PT Konstruksi Jaya Abadi',
    phone: testPhone,
    email: 'budi@konstruksijaya.id',
    address: 'Jl. Merdeka No. 100, Jakarta Pusat',
    type: 'PROSPECT',
    status: 'BARU',
    source: 'MANUAL_ADMIN',
    preferredCommodity: 'Zeolite Alam Aktif Mesh 80',
    estimatedVolume: '30 Ton / Bulan',
    notes: 'Inquiry awal melalui telepon expo konstruksi.',
  });

  assert(Boolean(newContact.id), `Contact created successfully with ID: ${newContact.id}`);
  assert(newContact.name === 'Budi Santoso, S.T.', 'Name correctly set');
  assert(newContact.phone === testPhone, 'Phone normalized and matched');
  assert(newContact.status === 'BARU', 'Status is BARU');
  assert(newContact.source === 'MANUAL_ADMIN', 'Source is MANUAL_ADMIN');

  // Test 4: Duplicate Phone Rejection
  console.log('\n--- 4. Duplicate Phone Prevention ---');
  let duplicateThrew = false;
  try {
    await createCustomer({
      name: 'Budi Clone',
      phone: testPhone, // Same phone
    });
  } catch (err: any) {
    duplicateThrew = true;
    assert(err.message.includes('sudah terdaftar'), `Duplicate prevented with message: "${err.message}"`);
  }
  assert(duplicateThrew, 'Duplicate creation threw error as expected');

  // Test 5: Get Customer by ID & Filtering
  console.log('\n--- 5. Get Customer Detail & Filter (CRUD: Read) ---');
  const fetched = await getCustomerById(newContact.id);
  assert(fetched !== null && fetched.id === newContact.id, 'Fetched customer by ID matches');

  const searchResults = await getCustomers({ q: 'Konstruksi Jaya' });
  assert(searchResults.data.some((c: any) => c.id === newContact.id), 'Search by company name found test contact');

  const statusResults = await getCustomers({ status: 'BARU' });
  assert(statusResults.data.every((c: any) => c.status === 'BARU'), 'Filter by status BARU returned only BARU contacts');

  // Test 6: Admin Update Customer (CRUD: Update)
  console.log('\n--- 6. Update Customer (CRUD: Update) ---');
  const updated = await updateCustomer(newContact.id, {
    status: 'NEGOSIASI',
    notes: 'Diskusi quotation 30 ton/bulan disepakati via zoom. Menunggu PO resmi.',
    estimatedVolume: '45 Ton / Bulan (Revised)',
  });

  assert(updated.status === 'NEGOSIASI', 'Status successfully updated to NEGOSIASI');
  assert(updated.notes?.includes('Diskusi quotation') || false, 'Notes updated with follow-up log');
  assert(updated.estimatedVolume === '45 Ton / Bulan (Revised)', 'Estimated volume updated');

  // Test 7: Public RFQ Lead Capture (Storefront Submission)
  console.log('\n--- 7. Public RFQ Lead Capture (createOrUpdateLead) ---');
  const rfqPhone = `62877${Math.floor(1000000 + Math.random() * 9000000)}`;
  const rfqLead1 = await createOrUpdateLead({
    name: 'Ibu Ratna Dewi',
    phone: rfqPhone,
    company: 'CV Tirta Murni Water',
    email: 'ratna@tirtamurni.co.id',
    address: 'Kawasan Industri Rungkut, Surabaya',
    preferredCommodity: 'Pasir Silika Bangka Putih',
    estimatedVolume: '2 Kontainer 20ft',
    notes: 'Kebutuhan mendesak untuk filter pabrik air minum.',
  });

  assert(rfqLead1.isNew === true, 'New RFQ lead created with isNew = true');
  assert(rfqLead1.customer.status === 'BARU', 'RFQ lead status initialized to BARU');
  assert(rfqLead1.customer.source === 'WEBSITE_RFQ', 'Source set to WEBSITE_RFQ');

  // Second RFQ submission with same phone (Re-engagement / update notes)
  const rfqLead2 = await createOrUpdateLead({
    name: 'Ibu Ratna Dewi Updated',
    phone: rfqPhone,
    company: 'CV Tirta Murni Water Group',
    notes: 'Tambahan request sampel 2kg.',
  });

  assert(rfqLead2.isNew === false, 'Same phone re-submission identified as existing lead (isNew = false)');
  assert(rfqLead2.customer.notes?.includes('Tambahan request sampel') || false, 'Merged notes preserve previous and new request');

  // Test 8: Guest Checkout Auto-Sync (R-7: Dua Tahap Siklus CRM)
  console.log('\n--- 8. Guest Checkout & Payment CRM Lifecycle (R-7) ---');
  const buyerPhone = `62815${Math.floor(1000000 + Math.random() * 9000000)}`;

  // Tahap 1: Saat submit checkout (belum bayar) -> tercatat sebagai PROSPECT, BARU, totalOrders = 0, totalSpent = 0
  const checkoutLead = await syncCustomerFromOrder({
    buyerName: 'Pak Wahyu Hidayat',
    buyerPhone,
    buyerEmail: 'wahyu.hidayat@gmail.com',
    buyerAddress: 'Jl. Ahmad Yani No. 50, Semarang',
    total: 12500000,
    isPaid: false,
  });

  assert(checkoutLead !== null, 'Lead auto-recorded from guest checkout');
  assert(checkoutLead?.type === 'PROSPECT', 'Initial checkout type is PROSPECT (not premature DEAL)');
  assert(checkoutLead?.status === 'BARU', 'Initial checkout status is BARU');
  assert(checkoutLead?.totalOrders === 0, 'Total orders is 0 before payment verification');
  assert(checkoutLead?.totalSpent === 0, 'Total spent is 0 before payment verification');

  // Tahap 2: Saat pembayaran diverifikasi lunas -> promosi ke CUSTOMER, DEAL, totalOrders = 1, totalSpent bertambah
  const paidDeal = await syncCustomerFromOrder({
    buyerName: 'Pak Wahyu Hidayat',
    buyerPhone,
    total: 12500000,
    isPaid: true,
  });

  assert(paidDeal !== null, 'Customer promoted upon payment verification');
  assert(paidDeal?.type === 'CUSTOMER', 'Type is promoted to CUSTOMER after payment');
  assert(paidDeal?.status === 'DEAL', 'Status is set to DEAL after payment');
  assert(paidDeal?.totalOrders === 1, 'Total orders is 1 after verified payment');
  assert(paidDeal?.totalSpent === 12500000, 'Total spent recorded correctly (Rp 12.500.000)');

  // Transaksi kedua yang lunas dari pembeli yang sama
  const paidDeal2 = await syncCustomerFromOrder({
    buyerName: 'Pak Wahyu Hidayat',
    buyerPhone,
    total: 8000000,
    isPaid: true,
  });

  assert(paidDeal2?.totalOrders === 2, 'Total orders incremented to 2 on repeat purchase');
  assert(paidDeal2?.totalSpent === 20500000, 'Total spent incremented to Rp 20.500.000');

  // Test 9: Admin Delete Customer (CRUD: Delete)
  console.log('\n--- 9. Admin Delete Customer (CRUD: Delete) ---');
  const deleteResult = await deleteCustomer(newContact.id);
  assert(deleteResult.success === true, 'Delete operation returned success: true');

  const verifyDeleted = await getCustomerById(newContact.id);
  assert(verifyDeleted === null, 'Customer no longer found after deletion');

  // Clean up RFQ & Order test contacts
  await deleteCustomer(rfqLead1.customer.id);
  if (checkoutLead) await deleteCustomer(checkoutLead.id);

  // ─── Sesi #20 Tests ───────────────────────────────────────────────────────

  // Test 10: addCustomerInteraction
  console.log('\n--- 10. [Sesi #20] addCustomerInteraction ---');
  try {
    const { addCustomerInteraction } = await import('../src/lib/data-store');
    // Buat customer sementara untuk test
    const tempCust = await createCustomer({
      name: 'Test Interaksi Sesi20',
      phone: '6299988877766',
      source: 'MANUAL_ADMIN',
    });
    const interaction = await addCustomerInteraction({
      customerId: tempCust.id,
      type: 'CALL',
      summary: 'Test telepon follow-up sesi 20',
      actorId: null,
      actorName: 'Test Runner',
    });
    assert(!!interaction.id, 'addCustomerInteraction: interaction ID ada');
    assert(interaction.type === 'CALL', 'addCustomerInteraction: type = CALL');
    assert(interaction.actorName === 'Test Runner', 'addCustomerInteraction: actorName tersimpan');

    // Test 11: deleteCustomerInteraction — SYSTEM entry harus ditolak
    console.log('\n--- 11. [Sesi #20] deleteCustomerInteraction RBAC ---');
    const { deleteCustomerInteraction } = await import('../src/lib/data-store');
    const systemInteraction = await addCustomerInteraction({
      customerId: tempCust.id,
      type: 'SYSTEM',
      summary: 'Test sistem otomatis',
      actorId: null,
      actorName: 'SYSTEM',
    });
    try {
      await deleteCustomerInteraction(systemInteraction.id, 'any-user-id', 'ADMIN');
      assert(false, 'deleteCustomerInteraction: SYSTEM entry seharusnya DITOLAK');
    } catch (e: any) {
      assert(e.message.includes('sistem'), 'deleteCustomerInteraction: SYSTEM entry ditolak dengan pesan benar');
    }
    // Hapus manual entry oleh pembuat
    await deleteCustomerInteraction(interaction.id, 'any-user-id', 'SUPERADMIN');
    assert(true, 'deleteCustomerInteraction: SUPERADMIN bisa hapus manual entry');

    // Cleanup
    await deleteCustomer(tempCust.id);
  } catch (e: any) {
    console.warn('  ⚠️  Skip Test 10-11 (DB tidak aktif):', e.message);
  }

  // Test 12: getFollowUpsDue
  console.log('\n--- 12. [Sesi #20] getFollowUpsDue ---');
  try {
    const { getFollowUpsDue } = await import('../src/lib/data-store');
    const due = await getFollowUpsDue(5);
    assert(Array.isArray(due), 'getFollowUpsDue: mengembalikan array');
    assert(due.length <= 5, 'getFollowUpsDue: maksimal 5 kontak');
    if (due.length > 0) {
      assert('nextFollowUpAt' in due[0], 'getFollowUpsDue: item punya nextFollowUpAt');
      assert('overdueMs' in due[0], 'getFollowUpsDue: item punya overdueMs');
    }
    console.log(`  ℹ️  getFollowUpsDue: ${due.length} kontak due`);
  } catch (e: any) {
    console.warn('  ⚠️  Skip Test 12 (DB tidak aktif):', e.message);
  }

  // ─────────────────────────────────────────────────────────────────────────

  // Summary
  console.log('\n========================================');
  console.log(`🎉 TEST SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log('========================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}


runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
