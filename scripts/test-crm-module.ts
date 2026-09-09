/**
 * Automated Test Suite: CRM & Customer Database Module
 * MineralHub Indonesia
 */

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
  assert(initialList.length >= 4, `Initial customer list loaded (${initialList.length} items)`);

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
  assert(searchResults.some((c) => c.id === newContact.id), 'Search by company name found test contact');

  const statusResults = await getCustomers({ status: 'BARU' });
  assert(statusResults.every((c) => c.status === 'BARU'), 'Filter by status BARU returned only BARU contacts');

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

  // Test 8: Guest Checkout Auto-Sync
  console.log('\n--- 8. Guest Checkout Auto-Sync (syncCustomerFromOrder) ---');
  const buyerPhone = `62815${Math.floor(1000000 + Math.random() * 9000000)}`;
  const orderSync = await syncCustomerFromOrder({
    buyerName: 'Pak Wahyu Hidayat',
    buyerPhone,
    buyerEmail: 'wahyu.hidayat@gmail.com',
    buyerAddress: 'Jl. Ahmad Yani No. 50, Semarang',
    total: 12500000,
  });

  assert(orderSync !== null, 'Customer auto-synced from guest order');
  assert(orderSync?.type === 'CUSTOMER', 'Type is set to CUSTOMER');
  assert(orderSync?.status === 'DEAL', 'Status is set to DEAL');
  assert(orderSync?.totalOrders === 1, 'Total orders is 1');
  assert(orderSync?.totalSpent === 12500000, 'Total spent recorded correctly (Rp 12.500.000)');

  // Second order from same buyer
  const orderSync2 = await syncCustomerFromOrder({
    buyerName: 'Pak Wahyu Hidayat',
    buyerPhone,
    total: 8000000,
  });

  assert(orderSync2?.totalOrders === 2, 'Total orders incremented to 2');
  assert(orderSync2?.totalSpent === 20500000, 'Total spent incremented to Rp 20.500.000');

  // Test 9: Admin Delete Customer (CRUD: Delete)
  console.log('\n--- 9. Admin Delete Customer (CRUD: Delete) ---');
  const deleteResult = await deleteCustomer(newContact.id);
  assert(deleteResult.success === true, 'Delete operation returned success: true');

  const verifyDeleted = await getCustomerById(newContact.id);
  assert(verifyDeleted === null, 'Customer no longer found after deletion');

  // Clean up RFQ & Order test contacts
  await deleteCustomer(rfqLead1.customer.id);
  if (orderSync) await deleteCustomer(orderSync.id);

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
