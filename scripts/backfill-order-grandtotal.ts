/**
 * scripts/backfill-order-grandtotal.ts
 * P0-A: Backfill grandTotal & subtotal for older orders where grandTotal === 0
 * Supports: --dry-run (default) or --apply
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const isDryRun = !process.argv.includes('--apply');

async function backfillDatabase() {
  console.log(`\n--- Backfilling Database (${isDryRun ? 'DRY RUN' : 'APPLY'}) ---`);
  try {
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { grandTotal: 0 },
          { subtotal: 0 },
        ],
      },
      select: {
        id: true,
        orderCode: true,
        total: true,
        subtotal: true,
        shippingCost: true,
        taxAmount: true,
        discountAmount: true,
        grandTotal: true,
      },
    });

    console.log(`Found ${orders.length} orders in database needing backfill.`);

    let updated = 0;
    for (const order of orders) {
      const effectiveSubtotal = order.subtotal > 0 ? order.subtotal : order.total;
      const effectiveGrandTotal = order.grandTotal > 0 ? order.grandTotal : (
        effectiveSubtotal + (order.shippingCost || 0) + (order.taxAmount || 0) - (order.discountAmount || 0)
      );

      if (!isDryRun) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            subtotal: effectiveSubtotal,
            grandTotal: effectiveGrandTotal,
          },
        });
      } else {
        console.log(`  [DRY] Order ${order.orderCode}: subtotal ${order.subtotal} -> ${effectiveSubtotal}, grandTotal ${order.grandTotal} -> ${effectiveGrandTotal}`);
      }
      updated++;
    }

    console.log(`Database backfill summary: ${updated} orders ${isDryRun ? 'would be updated' : 'updated'}.`);
  } catch (err: unknown) {
    console.warn('Database not accessible or error occurred:', (err as Error)?.message || err);
  }
}

function backfillLocalStore() {
  const localStorePath = path.join(process.cwd(), '.local-store.json');
  if (!fs.existsSync(localStorePath)) {
    return;
  }

  console.log(`\n--- Backfilling .local-store.json (${isDryRun ? 'DRY RUN' : 'APPLY'}) ---`);
  try {
    const data = JSON.parse(fs.readFileSync(localStorePath, 'utf8'));
    if (!Array.isArray(data.orders)) {
      return;
    }

    let updated = 0;
    for (const order of data.orders) {
      if ((!order.grandTotal || order.grandTotal === 0) && order.total > 0) {
        const effectiveSubtotal = order.subtotal > 0 ? order.subtotal : order.total;
        const effectiveGrandTotal = (
          effectiveSubtotal + (order.shippingCost || 0) + (order.taxAmount || 0) - (order.discountAmount || 0)
        );

        if (!isDryRun) {
          order.subtotal = effectiveSubtotal;
          order.grandTotal = effectiveGrandTotal;
        } else {
          console.log(`  [DRY] Local Order ${order.orderCode}: total=${order.total} -> subtotal=${effectiveSubtotal}, grandTotal=${effectiveGrandTotal}`);
        }
        updated++;
      }
    }

    if (!isDryRun && updated > 0) {
      fs.writeFileSync(localStorePath, JSON.stringify(data, null, 2), 'utf8');
      console.log(`Updated ${updated} orders in .local-store.json.`);
    } else {
      console.log(`Local store: ${updated} orders ${isDryRun ? 'would be updated' : 'updated'}.`);
    }
  } catch (err: unknown) {
    console.warn('Error reading or updating .local-store.json:', (err as Error)?.message || err);
  }
}

async function main() {
  console.log(`=== backfill-order-grandtotal (${isDryRun ? 'DRY RUN' : 'APPLY'}) ===`);
  await backfillDatabase();
  backfillLocalStore();

  if (isDryRun) {
    console.log('\n⚠️  DRY RUN complete. Run with --apply to commit changes.\n');
  } else {
    console.log('\n✅ Backfill complete.\n');
  }
}

main()
  .catch(e => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
