/**
 * scripts/verify-api-matrix.ts
 * P2-D: Scan semua route.ts di src/app/ (api dan uploads)
 * Verifikasi 100% konsistensi dengan tabel docs/BLUEPRINT.md §7.
 * FAIL-LOUD: process.exit(1) jika ada selisih endpoint antara kode dan dokumentasi.
 */
import * as fs from 'fs';
import * as path from 'path';

const BASE = path.join(__dirname, '..');
const APP_DIR = path.join(BASE, 'src', 'app');
const BLUEPRINT_PATH = path.join(BASE, 'docs', 'BLUEPRINT.md');

function scanRoutes(dir: string, prefix = ''): string[] {
  const routes: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const fullPath = path.join(dir, e.name);
    if (e.isDirectory()) {
      routes.push(...scanRoutes(fullPath, `${prefix}/${e.name}`));
    } else if (e.name === 'route.ts' || e.name === 'route.js') {
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const m of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) {
        if (new RegExp(`export\\s+(async\\s+)?function\\s+${m}\\b`).test(content)) {
          routes.push(`${m} ${prefix}`);
        }
      }
    }
  }
  return routes;
}

function parseBlueprintRoutes(): string[] {
  if (!fs.existsSync(BLUEPRINT_PATH)) {
    throw new Error(`File BLUEPRINT tidak ditemukan di: ${BLUEPRINT_PATH}`);
  }
  const bpContent = fs.readFileSync(BLUEPRINT_PATH, 'utf8').replace(/\r/g, '');
  const lines = bpContent.split('\n');
  const start = lines.findIndex((l) => l.includes('## 7. Matriks Endpoint API Lengkap'));
  if (start === -1) {
    throw new Error('Section "## 7. Matriks Endpoint API Lengkap" tidak ditemukan di BLUEPRINT.md');
  }

  const endRel = lines.slice(start).findIndex((l, i) => i > 5 && l.startsWith('---'));
  const tableLines = endRel !== -1 ? lines.slice(start, start + endRel) : lines.slice(start);

  const bpRoutes: string[] = [];
  for (const line of tableLines) {
    const match = line.match(/^\|\s*`([A-Z]+)`\s*\|\s*`([^`]+)`\s*\|/);
    if (match) {
      bpRoutes.push(`${match[1].trim()} ${match[2].trim()}`);
    }
  }
  return bpRoutes;
}

console.log('\n=== verify-api-matrix: Sinkronisasi Route Kode ↔ BLUEPRINT.md §7 ===\n');

try {
  const codeRoutes = scanRoutes(APP_DIR).sort();
  const bpRoutes = parseBlueprintRoutes().sort();

  console.log(`Total endpoint terdeteksi di kode: ${codeRoutes.length}`);
  console.log(`Total endpoint terdokumentasi di BLUEPRINT: ${bpRoutes.length}\n`);

  const missingInBp = codeRoutes.filter((r) => !bpRoutes.includes(r));
  const missingInCode = bpRoutes.filter((r) => !codeRoutes.includes(r));

  let hasError = false;

  if (missingInBp.length > 0) {
    hasError = true;
    console.error(`❌ [DRIFT DETECTED] ${missingInBp.length} endpoint di kode BELUM terdokumentasi di BLUEPRINT §7:`);
    for (const r of missingInBp) {
      console.error(`   + ${r}`);
    }
    console.error('');
  }

  if (missingInCode.length > 0) {
    hasError = true;
    console.error(`❌ [ORPHAN DOCS] ${missingInCode.length} endpoint di BLUEPRINT §7 TIDAK ditemukan di kode:`);
    for (const r of missingInCode) {
      console.error(`   - ${r}`);
    }
    console.error('');
  }

  if (hasError) {
    console.error('⛔ Verifikasi matriks API GAGAL. Selaraskan BLUEPRINT.md §7 dengan implementasi route aktual.');
    process.exit(1);
  }

  console.log('✅ Matriks API 100% SINKRON! Seluruh endpoint kode terdaftar rapi di BLUEPRINT §7.');
  process.exit(0);
} catch (err: unknown) {
  console.error('Error executing verify-api-matrix:', (err as Error)?.message || err);
  process.exit(1);
}
