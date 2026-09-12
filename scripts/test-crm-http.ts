/**
 * HTTP Integration Test Suite: Security Authorization & CRM Endpoints
 * Adably - Sesi #10 Production-Grade Verification
 */

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

import { signAdminToken, COOKIE_NAME } from '../src/lib/auth';

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

async function run() {
  console.log('========================================================');
  console.log('🔒 RUNNING SECURITY & HTTP AUTHORIZATION TEST SUITE');
  console.log('========================================================\n');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Check if live dev server is currently running
  try {
    const reachable = await fetch(baseUrl, { method: 'HEAD', signal: AbortSignal.timeout(1500) })
      .then(() => true)
      .catch(() => false);

    if (!reachable) {
      console.log(`ℹ️ Dev server (${baseUrl}) is not currently active.`);
      console.log('Skipping live HTTP integration tests. (Start "npm run dev" to run live HTTP assertions.)\n');
      return;
    }
  } catch {
    console.log(`ℹ️ Dev server (${baseUrl}) probe failed. Skipping live HTTP integration tests.\n`);
    return;
  }

  // -----------------------------------------------------------
  // 1. NEGATIVE AUTHORIZATION TESTS (UNAUTHENTICATED -> MUST BE 401)
  // -----------------------------------------------------------
  console.log('--- 1. Negative Tests: Unauthenticated Admin API Access ---');

  // Test 1.1: Unauthenticated GET /api/admin/pelanggan
  const unauthPelanggan = await fetch(`${baseUrl}/api/admin/pelanggan`);
  assert(
    unauthPelanggan.status === 401,
    `GET /api/admin/pelanggan without session returned HTTP ${unauthPelanggan.status} (expected: 401)`
  );

  // Test 1.2: Unauthenticated GET /api/admin/pelanggan/export
  const unauthExport = await fetch(`${baseUrl}/api/admin/pelanggan/export`);
  assert(
    unauthExport.status === 401,
    `GET /api/admin/pelanggan/export without session returned HTTP ${unauthExport.status} (expected: 401)`
  );

  // Test 1.3: Unauthenticated GET /api/admin/produk
  const unauthProduk = await fetch(`${baseUrl}/api/admin/produk`);
  assert(
    unauthProduk.status === 401,
    `GET /api/admin/produk without session returned HTTP ${unauthProduk.status} (expected: 401)`
  );

  // Test 1.4: Unauthenticated GET /api/admin/kategori
  const unauthKategori = await fetch(`${baseUrl}/api/admin/kategori`);
  assert(
    unauthKategori.status === 401,
    `GET /api/admin/kategori without session returned HTTP ${unauthKategori.status} (expected: 401)`
  );

  // Test 1.5: Unauthenticated GET /api/admin/peruntukan
  const unauthPeruntukan = await fetch(`${baseUrl}/api/admin/peruntukan`);
  assert(
    unauthPeruntukan.status === 401,
    `GET /api/admin/peruntukan without session returned HTTP ${unauthPeruntukan.status} (expected: 401)`
  );

  // Test 1.6: Unauthenticated access to /admin UI page -> must redirect (307/308)
  const unauthUiPage = await fetch(`${baseUrl}/admin/pelanggan`, { redirect: 'manual' });
  assert(
    unauthUiPage.status === 307 || unauthUiPage.status === 308,
    `GET /admin/pelanggan page without session returned HTTP ${unauthUiPage.status} redirect to login`
  );

  // -----------------------------------------------------------
  // 2. POSITIVE AUTHORIZATION TESTS (WITH VALID ADMIN TOKEN -> 200)
  // -----------------------------------------------------------
  console.log('\n--- 2. Positive Tests: Authenticated Superadmin Access ---');

  const validToken = await signAdminToken({
    id: 'test-superadmin-id',
    name: 'Super Admin Test',
    email: 'admin@adably.id',
    role: 'SUPERADMIN',
  });

  const authHeaders = {
    Cookie: `${COOKIE_NAME}=${validToken}`,
  };

  // Test 2.1: Authenticated GET /api/admin/pelanggan
  const authPelanggan = await fetch(`${baseUrl}/api/admin/pelanggan`, { headers: authHeaders });
  assert(
    authPelanggan.status === 200,
    `GET /api/admin/pelanggan with valid token returned HTTP ${authPelanggan.status} (expected: 200)`
  );
  if (authPelanggan.status === 200) {
    const json = await authPelanggan.json();
    assert(Array.isArray(json.data), `Payload contains customer data array (count: ${json.data?.length})`);
  }

  // Test 2.2: Authenticated GET /api/admin/pelanggan/export (CSV)
  const authExport = await fetch(`${baseUrl}/api/admin/pelanggan/export`, { headers: authHeaders });
  assert(
    authExport.status === 200,
    `GET /api/admin/pelanggan/export with valid token returned HTTP ${authExport.status} (expected: 200)`
  );
  const contentType = authExport.headers.get('content-type') || '';
  assert(contentType.includes('text/csv'), `Export response header contains Content-Type: text/csv`);

  // Test 2.3: Authenticated GET /api/admin/produk
  const authProduk = await fetch(`${baseUrl}/api/admin/produk`, { headers: authHeaders });
  assert(
    authProduk.status === 200,
    `GET /api/admin/produk with valid token returned HTTP ${authProduk.status} (expected: 200)`
  );

  // Test 2.4: Authenticated GET /api/admin/kategori
  const authKategori = await fetch(`${baseUrl}/api/admin/kategori`, { headers: authHeaders });
  assert(
    authKategori.status === 200,
    `GET /api/admin/kategori with valid token returned HTTP ${authKategori.status} (expected: 200)`
  );

  // Test 2.5: Authenticated GET /api/admin/peruntukan
  const authPeruntukan = await fetch(`${baseUrl}/api/admin/peruntukan`, { headers: authHeaders });
  assert(
    authPeruntukan.status === 200,
    `GET /api/admin/peruntukan with valid token returned HTTP ${authPeruntukan.status} (expected: 200)`
  );

  // -----------------------------------------------------------
  // 3. PUBLIC ENDPOINTS TESTS
  // -----------------------------------------------------------
  console.log('\n--- 3. Public Endpoint Tests ---');

  // Test 3.1: Public RFQ POST /api/leads
  const rfqRes = await fetch(`${baseUrl}/api/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Dr. Hendra Gunawan',
      phone: '081288990011',
      company: 'PT Bio Farma Nutrisi',
      preferredCommodity: 'Zeolite Alam Aktif Mesh 100',
      estimatedVolume: '10 Ton',
      notes: 'Request Certificate of Analysis (CoA) kandungan KTK & silika bebas.',
    }),
  });
  assert(
    rfqRes.status === 200,
    `POST /api/leads public RFQ returned HTTP ${rfqRes.status} (expected: 200)`
  );

  // -----------------------------------------------------------
  // SUMMARY
  // -----------------------------------------------------------
  console.log('\n========================================================');
  console.log(`📊 HTTP SECURITY SUITE SUMMARY: ${testsPassed}/${testsPassed + testsFailed} PASSED`);
  if (testsFailed > 0) {
    console.error(`❌ FAILED: ${testsFailed} tests did not meet security specifications!`);
    process.exit(1);
  } else {
    console.log('🎉 ALL NEGATIVE (401) AND POSITIVE (200) SECURITY CHECKS PASSED!');
    console.log('========================================================\n');
  }
}

run().catch((e) => {
  console.error('Test execution error:', e);
  process.exit(1);
});
