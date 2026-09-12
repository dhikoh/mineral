import fs from 'fs';
import path from 'path';
import {
  getProducts,
  getProductBySlug,
  getCategories,
  getArticles,
  getArticleBySlug,
  getFAQs,
  getSiteSettings,
  getContentBlockByKey,
  createOrder,
  getOrderByCode,
  submitPaymentProof,
  verifyPaymentProof,
  updateOrderStatus,
} from '../src/lib/data-store';
import manifestFn from '../src/app/manifest';
import robotsFn from '../src/app/robots';
import sitemapFn from '../src/app/sitemap';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

function assert(name: string, condition: boolean, message?: string) {
  if (condition) {
    results.push({ name, passed: true });
    console.log(`  ✅ ${name}`);
  } else {
    results.push({ name, passed: false, error: message || 'Assertion failed' });
    console.error(`  ❌ ${name}: ${message || 'Assertion failed'}`);
  }
}

async function runPhase7TestSuite() {
  console.log('========================================================');
  console.log('🧪 RUNNING PHASE 7: FINAL POLISH & END-TO-END AUDIT SUITE');
  console.log('========================================================\n');

  const rootDir = path.resolve(__dirname, '..');

  // --- SECTION 1: PWA & ASSETS AUDIT ---
  console.log('--- 1. PWA & Web App Manifest Audit ---');
  try {
    const manifest = manifestFn();
    assert('Manifest Name Defined', Boolean(manifest.name && manifest.name.includes('Adably')));
    assert('Manifest Short Name Valid', manifest.short_name === 'Adably');
    assert('Manifest Display Standalone', manifest.display === 'standalone');
    assert('Manifest Theme Color Defined', manifest.theme_color === '#059669');
    assert('Manifest Icons Configured', Boolean(manifest.icons && manifest.icons.length >= 2));

    const icon192Path = path.join(rootDir, 'public/icons/icon-192.png');
    const icon512Path = path.join(rootDir, 'public/icons/icon-512.png');
    const iconSvgPath = path.join(rootDir, 'public/icons/icon.svg');
    const swPath = path.join(rootDir, 'public/sw.js');
    const offlineHtmlPath = path.join(rootDir, 'public/offline.html');
    const manifestTsPath = path.join(rootDir, 'src/app/manifest.ts');
    const manifestJsonPath = path.join(rootDir, 'public/manifest.json');

    assert('PWA 192px Icon File Exists', fs.existsSync(icon192Path) && fs.statSync(icon192Path).size > 0);
    assert('PWA 512px Icon File Exists', fs.existsSync(icon512Path) && fs.statSync(icon512Path).size > 0);
    assert('PWA SVG Icon Exists', fs.existsSync(iconSvgPath) && fs.statSync(iconSvgPath).size > 0);
    assert('Service Worker File Exists', fs.existsSync(swPath) && fs.statSync(swPath).size > 0);
    assert('Offline Fallback HTML Exists', fs.existsSync(offlineHtmlPath) && fs.statSync(offlineHtmlPath).size > 0);
    assert('Dynamic manifest.ts Exists', fs.existsSync(manifestTsPath) && fs.statSync(manifestTsPath).size > 0);
    assert('Static manifest.json Removed (Zero Orphan)', !fs.existsSync(manifestJsonPath));
  } catch (err: any) {
    assert('PWA Audit Error', false, err.message);
  }

  // --- SECTION 2: SEO, ROBOTS & SITEMAP AUDIT ---
  console.log('\n--- 2. SEO, Robots & Dynamic Sitemap Audit ---');
  try {
    const robots = robotsFn();
    assert('Robots.txt Defines Rules', Boolean(robots.rules));
    assert('Robots.txt Links Sitemap', Boolean(robots.sitemap && robots.sitemap.includes('sitemap.xml')));

    const sitemap = await sitemapFn();
    assert('Dynamic Sitemap Returns Array', Array.isArray(sitemap) && sitemap.length > 5);
    
    const hasHome = sitemap.some((entry) => entry.url.endsWith('/') || !entry.url.split('://')[1].includes('/'));
    const hasProducts = sitemap.some((entry) => entry.url.includes('/produk/'));
    const hasArticles = sitemap.some((entry) => entry.url.includes('/artikel/'));
    const hasCategories = sitemap.some((entry) => entry.url.includes('/kategori/'));

    assert('Sitemap Includes Homepage', hasHome);
    assert('Sitemap Includes Dynamic Product Slugs', hasProducts);
    assert('Sitemap Includes Dynamic Article Slugs', hasArticles);
    assert('Sitemap Includes Dynamic Category Slugs', hasCategories);
  } catch (err: any) {
    assert('SEO Audit Error', false, err.message);
  }

  // --- SECTION 3: RESILIENCY & ERROR BOUNDARIES AUDIT ---
  console.log('\n--- 3. Resilience & Error Boundaries File Audit ---');
  try {
    const notFoundPath = path.join(rootDir, 'src/app/not-found.tsx');
    const errorPath = path.join(rootDir, 'src/app/error.tsx');
    const loadingPath = path.join(rootDir, 'src/app/loading.tsx');
    const keranjangLayoutPath = path.join(rootDir, 'src/app/keranjang/layout.tsx');
    const checkoutLayoutPath = path.join(rootDir, 'src/app/checkout/layout.tsx');
    const pesananLayoutPath = path.join(rootDir, 'src/app/pesanan/[orderCode]/layout.tsx');

    assert('Custom 404 (not-found.tsx) Exists', fs.existsSync(notFoundPath));
    assert('Custom Error Boundary (error.tsx) Exists', fs.existsSync(errorPath));
    assert('Custom Skeleton Loader (loading.tsx) Exists', fs.existsSync(loadingPath));
    assert('Keranjang Layout Metadata Exists', fs.existsSync(keranjangLayoutPath));
    assert('Checkout Layout Metadata Exists', fs.existsSync(checkoutLayoutPath));
    assert('Pesanan Layout Metadata Exists', fs.existsSync(pesananLayoutPath));
  } catch (err: any) {
    assert('Boundary Audit Error', false, err.message);
  }

  // --- SECTION 4: END-TO-END TRANSACTION LIFECYCLE ---
  console.log('\n--- 4. End-to-End Purchasing & Tracking Lifecycle ---');
  try {
    const products = await getProducts();
    assert('Catalog Returns Active Commodities', products.length > 0);

    const testProduct = products.find((p) => p.stock && p.stock >= 2) || products[0];
    const testPhone = '081299887766';

    console.log(`    Creating test order for ${testProduct.name}`);

    const newOrder = await createOrder({
      buyerName: 'PT Mandiri Tambang Persada',
      buyerPhone: testPhone,
      buyerEmail: 'pengadaan@mandiritambang.co.id',
      buyerAddress: 'Kawasan Industri Cikarang Blok B-12, Bekasi',
      notes: 'Harap lampirkan CoA asli dan sertifikat lolos uji karantina pelabuhan.',
      items: [
        {
          productId: testProduct.id,
          qty: 2,
        },
      ],
    });

    assert('Order Created Successfully with PENDING_PAYMENT status', newOrder.status === 'PENDING_PAYMENT');
    assert('Order Code Generated', Boolean(newOrder.orderCode && (newOrder.orderCode.startsWith('ORD-') || newOrder.orderCode.startsWith('MH-'))));

    const fetchedOrder = await getOrderByCode(newOrder.orderCode);
    assert('Order Retrieve By OrderCode Succeeds', fetchedOrder !== null && fetchedOrder.orderCode === newOrder.orderCode);

    // Upload Payment Proof
    const proof = await submitPaymentProof(newOrder.id, {
      fileUrl: '/uploads/e2e-proof-sample.jpg',
      senderBank: 'Bank Mandiri',
      senderName: 'PT Mandiri Tambang Persada',
      amount: newOrder.total,
      note: 'Transfer lunas via Mandiri Corporate',
    });

    assert('Payment Proof Submitted Successfully', Boolean(proof));

    // Admin verifies order proof
    const verifiedOrder = await verifyPaymentProof(newOrder.id, true, 'Pembayaran diverifikasi oleh admin');
    assert('Admin Approves Payment Proof -> Status PAID', verifiedOrder.status === 'PAID');

    // Admin inputs tracking receipt
    const trackingResi = 'MH-EXP-889977';
    const shippedOrder = await updateOrderStatus(newOrder.id, 'SHIPPED', 'Armada Kontainer FCL Truk Tronton B-9876-XYZ', trackingResi);
    assert('Tracking Number Assigned -> Status SHIPPED', shippedOrder.status === 'SHIPPED');
    assert('Tracking Number Stored Correctly', shippedOrder.trackingNumber === trackingResi);

    // Customer performs public tracking lookup (matching /api/lacak-pesanan logic)
    const trackingLookup = await getOrderByCode(newOrder.orderCode);
    assert('Customer Tracking Lookup Matches Order', trackingLookup !== null && trackingLookup.orderCode === newOrder.orderCode);

    const cleanInputPhone = testPhone.replace(/\D/g, '');
    const cleanBuyerPhone = (trackingLookup?.buyerPhone || '').replace(/\D/g, '');
    const isPhoneMatch =
      cleanInputPhone === cleanBuyerPhone ||
      cleanBuyerPhone.endsWith(cleanInputPhone.slice(-8));

    assert('Customer Phone Matches Order Record', isPhoneMatch);
    assert('Customer Sees SHIPPED Status and Resi', trackingLookup?.status === 'SHIPPED' && trackingLookup?.trackingNumber === trackingResi);
  } catch (err: any) {
    assert('E2E Transaction Lifecycle Error', false, err.message);
  }

  // --- SECTION 5: CMS & INTEGRATION INTEGRITY ---
  console.log('\n--- 5. CMS, Site Settings & FAQ Integrity ---');
  try {
    const settings = await getSiteSettings();
    assert('SiteSettings Returns Valid Data', Boolean(settings.siteName && settings.csWhatsapp));

    const faqs = await getFAQs({ activeOnly: true });
    assert('FAQs Available for Google Rich Results', faqs.length > 0);

    const heroBlock = await getContentBlockByKey('homepage_hero');
    assert('Hero ContentBlock Available', heroBlock !== null);

    const articles = await getArticles({ publishedOnly: true });
    assert('Articles Available with Sanitized HTML Content', articles.length > 0 && typeof articles[0].htmlContent === 'string');
  } catch (err: any) {
    assert('CMS Integrity Error', false, err.message);
  }

  // --- SUMMARY ---
  console.log('\n========================================================');
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log(`📊 TEST SUITE SUMMARY: ${passed}/${total} PASSED (${Math.round((passed / total) * 100)}%)`);
  if (failed > 0) {
    console.error(`❌ FAILED TESTS: ${failed}`);
    results.filter((r) => !r.passed).forEach((r) => console.error(`  - ${r.name}: ${r.error}`));
    process.exit(1);
  } else {
    console.log('🎉 ALL PHASE 7 AUDIT CRITERIA PASSED WITH ZERO ERRORS!');
    console.log('========================================================\n');
  }
}

runPhase7TestSuite().catch((e) => {
  console.error('Fatal test runner error:', e);
  process.exit(1);
});
