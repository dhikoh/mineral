/**
 * scripts/verify-env-docs.ts
 * P2-14: Verifikasi konsistensi env vars antara kode dan .env.example
 * Exit 1 jika ada env var di kode yang tidak terdokumentasi di .env.example
 */
import * as fs from 'fs';
import * as path from 'path';

const BASE = path.join(__dirname, '..');

function findEnvUsage(dir: string, ignore: string[]): Set<string> {
  const found = new Set<string>();
  const ENV_PATTERN = /process\.env\.([A-Z][A-Z0-9_]*)/g;

  function walk(d: string) {
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const e of entries) {
      const fullPath = path.join(d, e.name);
      if (ignore.some(ig => fullPath.includes(ig))) continue;
      if (e.isDirectory()) walk(fullPath);
      else if (e.name.endsWith('.ts') || e.name.endsWith('.mjs') || e.name.endsWith('.js')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        for (const m of content.matchAll(ENV_PATTERN)) {
          found.add(m[1]);
        }
      }
    }
  }

  walk(dir);
  return found;
}

function getDocumentedEnvVars(): Set<string> {
  const envExPath = path.join(BASE, '.env.example');
  const content = fs.readFileSync(envExPath, 'utf8');
  const found = new Set<string>();
  // Match lines like KEY="value" or # KEY="value" or # KEY=value
  const KEY_PATTERN = /^#?\s*([A-Z][A-Z0-9_]*)=/gm;
  for (const m of content.matchAll(KEY_PATTERN)) {
    found.add(m[1]);
  }
  return found;
}

// Env vars yang boleh tidak terdokumentasi (Next.js internals, node built-ins)
const ALLOWED_UNDOCUMENTED = new Set([
  'NODE_ENV',
  'PORT',
  'HOSTNAME',
  'npm_package_version',
  'NEXT_TELEMETRY_DISABLED',
  'NEXT_RUNTIME',
  'NEXT_PHASE',
  'VERCEL',
  'CI',
  'DEV_FALLBACK_EMAIL',
  'DEV_FALLBACK_PASSWORD',
]);

const IGNORE_DIRS = ['node_modules', '.next', '.git', 'scripts'];

console.log('\n=== verify-env-docs: Konsistensi Environment Variables ===\n');

const codeEnvVars = findEnvUsage(BASE, IGNORE_DIRS);
const documentedVars = getDocumentedEnvVars();

let errors = 0;
const undocumented: string[] = [];

for (const varName of codeEnvVars) {
  if (ALLOWED_UNDOCUMENTED.has(varName)) continue;
  if (!documentedVars.has(varName)) {
    undocumented.push(varName);
    errors++;
  }
}

if (undocumented.length > 0) {
  console.error('❌ Env vars dipakai di kode tapi tidak didokumentasikan di .env.example:');
  for (const v of undocumented.sort()) {
    console.error(`   - ${v}`);
  }
} else {
  console.log('✅ Semua env vars terdokumentasi di .env.example');
}

console.log(`\nTotal env vars di kode: ${codeEnvVars.size}`);
console.log(`Total env vars di .env.example: ${documentedVars.size}`);
console.log(`Tidak terdokumentasi: ${errors}\n`);

if (errors > 0) process.exit(1);
