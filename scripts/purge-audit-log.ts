/**
 * scripts/purge-audit-log.ts
 * P1-C: Purge AuditLog records older than SiteSetting.auditRetentionDays
 * Mode: --dry-run (default) or --apply
 * Optional override: --days=N
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const isDryRun = !process.argv.includes('--apply');

function getOverrideDays(): number | null {
  const arg = process.argv.find((a) => a.startsWith('--days='));
  if (arg) {
    const val = parseInt(arg.split('=')[1], 10);
    if (!isNaN(val) && val >= 1) return val;
  }
  return null;
}

async function main() {
  console.log(`\n=== purge-audit-log (${isDryRun ? 'DRY RUN' : 'APPLY'}) ===\n`);

  try {
    // 1. Dapatkan retensi dari SiteSetting atau override
    const setting = await prisma.siteSetting.findUnique({
      where: { id: 'default-setting' },
      select: { auditRetentionDays: true },
    });

    const overrideDays = getOverrideDays();
    const retentionDays = overrideDays ?? setting?.auditRetentionDays ?? 365;

    console.log(`Kebijakan retensi: ${retentionDays} hari${overrideDays ? ' (via --days override)' : ''}`);

    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    console.log(`Cutoff tanggal: ${cutoffDate.toISOString()}`);

    // 2. Hitung jumlah log yang melewati masa retensi
    const count = await prisma.auditLog.count({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    console.log(`Entri audit log kadaluarsa ditemukan: ${count}`);

    if (count === 0) {
      console.log('✅ Tidak ada entri audit log yang melewati batas retensi.');
      return;
    }

    if (isDryRun) {
      console.log(`\n⚠️  DRY RUN: ${count} entri log AKAN dihapus.`);
      console.log('    Jalankan dengan flag --apply untuk menghapus permanen.\n');
      return;
    }

    // 3. Hapus entri kadaluarsa jika --apply
    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    console.log(`\n✅ Berhasil menghapus ${result.count} entri audit log kadaluarsa.`);
  } catch (err: unknown) {
    console.error('Error saat menjalankan purge audit log:', (err as Error)?.message || err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
