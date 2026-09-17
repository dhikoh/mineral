/**
 * scripts/backfill-orderitem-snapshot.ts
 * P1-07: Isi snapshot productName/productSlug/productUnit untuk OrderItem lama
 * Jalankan sekali setelah migrasi 20260917000003
 * Mode: --dry-run (default) atau --apply
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const isDryRun = !process.argv.includes('--apply');

async function main() {
  console.log(`\n=== backfill-orderitem-snapshot (${isDryRun ? 'DRY RUN' : 'APPLY'}) ===\n`);

  // Ambil semua OrderItem yang belum punya snapshot (productName masih '')
  const items = await prisma.orderItem.findMany({
    where: { productName: '' },
    include: { product: { select: { name: true, slug: true, unit: true } } },
  });

  console.log(`OrderItem tanpa snapshot: ${items.length}`);

  if (items.length === 0) {
    console.log('✅ Semua OrderItem sudah memiliki snapshot. Tidak ada yang perlu dibackfill.');
    return;
  }

  let updated = 0;
  let skipped = 0;

  for (const item of items) {
    if (!item.product) {
      console.warn(`  ⚠️  OrderItem ${item.id}: produk sudah dihapus — set placeholder`);
      if (!isDryRun) {
        await prisma.orderItem.update({
          where: { id: item.id },
          data: { productName: '[Produk Dihapus]', productUnit: item.productUnit || 'kg' },
        });
      }
      skipped++;
      continue;
    }

    if (!isDryRun) {
      await prisma.orderItem.update({
        where: { id: item.id },
        data: {
          productName: item.product.name,
          productSlug: item.product.slug,
          productUnit: item.product.unit,
        },
      });
    } else {
      console.log(`  [DRY] OrderItem ${item.id}: "${item.product.name}" (${item.product.unit})`);
    }
    updated++;
  }

  console.log(`\nDiperbarui: ${updated}, Produk hilang (placeholder): ${skipped}`);

  if (isDryRun) {
    console.log('\n⚠️  DRY RUN — tidak ada perubahan yang disimpan.');
    console.log('    Jalankan dengan --apply untuk menerapkan.\n');
  } else {
    console.log('\n✅ Backfill snapshot selesai.\n');
  }
}

main()
  .catch(e => { console.error('Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
