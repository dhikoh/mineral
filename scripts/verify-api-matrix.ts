/**
 * scripts/verify-api-matrix.ts
 * P2-13: Scan semua route.ts di src/app/api — deteksi endpoint tidak terdokumentasi
 */
import * as fs from 'fs';
import * as path from 'path';

const BASE = path.join(__dirname, '..');
const API_DIR = path.join(BASE, 'src', 'app', 'api');

function scanApiRoutes(dir: string, prefix = '/api'): string[] {
  const routes: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const fullPath = path.join(dir, e.name);
    if (e.isDirectory()) {
      const seg = e.name.startsWith('[') ? `{${e.name.slice(1, -1)}}` : e.name;
      routes.push(...scanApiRoutes(fullPath, `${prefix}/${seg}`));
    } else if (e.name === 'route.ts' || e.name === 'route.js') {
      // Baca file untuk deteksi metode HTTP
      const content = fs.readFileSync(fullPath, 'utf8');
      const methods: string[] = [];
      for (const m of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) {
        if (new RegExp(`export\\s+async\\s+function\\s+${m}|export\\s+function\\s+${m}`).test(content)) {
          methods.push(m);
        }
      }
      for (const method of methods) {
        routes.push(`${method} ${prefix}`);
      }
    }
  }
  return routes;
}

console.log('\n=== verify-api-matrix: Peta Endpoint API ===\n');

const routes = scanApiRoutes(API_DIR).sort();

console.log(`Total endpoint: ${routes.length}\n`);
console.log('Daftar endpoint (untuk sinkronisasi Blueprint §7):');
for (const r of routes) {
  console.log(`  ${r}`);
}

// Cek endpoint publik sensitif yang tidak membutuhkan auth
const publicEndpoints = routes.filter(r =>
  !r.includes('/admin/') && !r.includes('/api/health') && !r.includes('/api/validate-cart')
);
console.log(`\n⚠️  Endpoint publik (verifikasi auth manual): ${publicEndpoints.length}`);
for (const r of publicEndpoints) {
  console.log(`  ${r}`);
}

console.log('\n✅ Scan selesai. Update Blueprint §7 jika ada perubahan.\n');
