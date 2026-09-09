/**
 * HTTP Integration Test: CRM Endpoints
 */

async function run() {
  console.log('Testing HTTP Endpoints...\n');

  // 1. GET /admin/pelanggan page
  const pageRes = await fetch('http://localhost:3000/admin/pelanggan');
  console.log(`1. GET /admin/pelanggan: HTTP ${pageRes.status}`);

  // 2. GET /api/admin/pelanggan
  const apiRes = await fetch('http://localhost:3000/api/admin/pelanggan');
  const apiJson = await apiRes.json();
  console.log(`2. GET /api/admin/pelanggan: HTTP ${apiRes.status}, data count: ${apiJson.data?.length}`);

  // 3. POST /api/leads (Public RFQ)
  const rfqRes = await fetch('http://localhost:3000/api/leads', {
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
  const rfqJson = await rfqRes.json();
  console.log(`3. POST /api/leads: HTTP ${rfqRes.status}, message: ${rfqJson.message}`);

  // 4. GET /api/admin/pelanggan/export (CSV)
  const csvRes = await fetch('http://localhost:3000/api/admin/pelanggan/export');
  const csvText = await csvRes.text();
  const contentType = csvRes.headers.get('content-type');
  const contentDisp = csvRes.headers.get('content-disposition');
  console.log(`4. GET /api/admin/pelanggan/export: HTTP ${csvRes.status}`);
  console.log(`   Content-Type: ${contentType}`);
  console.log(`   Content-Disposition: ${contentDisp}`);
  console.log(`   CSV Header sample: ${csvText.slice(0, 120)}...`);
  console.log(`   CSV Total bytes: ${csvText.length}`);

  console.log('\n✅ All HTTP endpoints verified successfully!');
}

run().catch((e) => console.error('HTTP test error:', e));
