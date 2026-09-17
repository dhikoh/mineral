/**
 * scripts/migrate-notes-to-interactions.ts
 * P1-02: Pisah field notes lama (string-append) → CustomerInteraction records
 * Mode: --dry-run (default) atau --apply
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const isDryRun = !process.argv.includes('--apply');

async function main() {
  console.log(`\n=== migrate-notes-to-interactions (${isDryRun ? 'DRY RUN' : 'APPLY'}) ===\n`);

  const customers = await prisma.customer.findMany({
    where: { notes: { not: null } },
    select: { id: true, name: true, notes: true },
  });

  console.log(`Pelanggan dengan notes lama: ${customers.length}`);

  let created = 0;
  let skipped = 0;

  for (const c of customers) {
    if (!c.notes?.trim()) { skipped++; continue; }

    // Pisah berdasarkan separator kronologis
    const segments = c.notes.split(/\n---\n|\n---\r\n/).map(s => s.trim()).filter(Boolean);

    if (isDryRun) {
      console.log(`  [DRY] Customer "${c.name}": ${segments.length} notes → interactions`);
      for (const seg of segments.slice(0, 2)) {
        console.log(`    → "${seg.slice(0, 80)}..."`);
      }
    } else {
      for (const seg of segments) {
        await prisma.customerInteraction.create({
          data: {
            customerId: c.id,
            type: 'NOTE',
            summary: seg,
            actorName: 'Sistem (Migrasi)',
            createdAt: new Date(),
          },
        });
        created++;
      }
    }
  }

  if (isDryRun) {
    console.log('\n⚠️  DRY RUN — tidak ada perubahan.');
    console.log('    Jalankan dengan --apply untuk menerapkan.\n');
  } else {
    console.log(`\n✅ Selesai: ${created} CustomerInteraction dibuat dari notes lama.\n`);
    console.log('⚠️  PENTING: Hapus field notes lama secara manual setelah verifikasi data.\n');
  }
}

main()
  .catch(e => { console.error('Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
