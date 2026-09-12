/**
 * scripts/backfill-customer-order.ts
 * Sesi #20 — One-time backfill: isi Order.customerId untuk pesanan historis
 * yang belum bertaut ke Customer, matching via normalizePhone(buyerPhone).
 *
 * Jalankan setelah migrate: npx tsx scripts/backfill-customer-order.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function normalizePhone(phone: string): string {
  if (!phone) return '';
  let p = phone.replace(/\D/g, '');
  if (p.startsWith('0')) p = '62' + p.slice(1);
  if (p.startsWith('8')) p = '62' + p;
  return p;
}

async function main() {
  console.log('=== Backfill Order.customerId — Sesi #20 ===\n');

  const ordersWithoutCustomer = await prisma.order.findMany({
    where: { customerId: null },
    select: { id: true, orderCode: true, buyerPhone: true },
  });

  console.log(`Found ${ordersWithoutCustomer.length} orders without customerId.\n`);

  let linked = 0;
  let skipped = 0;
  const errors: string[] = [];

  const customers = await prisma.customer.findMany({
    select: { id: true, phone: true },
  });

  const phoneMap = new Map<string, string>();
  for (const c of customers) {
    const normalized = normalizePhone(c.phone);
    if (normalized) phoneMap.set(normalized, c.id);
  }

  for (const order of ordersWithoutCustomer) {
    try {
      const normalized = normalizePhone(order.buyerPhone);
      const customerId = phoneMap.get(normalized);

      if (!customerId) {
        console.log(`  SKIP  ${order.orderCode} — no matching customer for phone ${order.buyerPhone}`);
        skipped++;
        continue;
      }

      await prisma.order.update({ where: { id: order.id }, data: { customerId } });
      console.log(`  LINK  ${order.orderCode} → customerId ${customerId}`);
      linked++;
    } catch (err: any) {
      const msg = `ERROR on ${order.orderCode}: ${err.message}`;
      console.error(`  ${msg}`);
      errors.push(msg);
    }
  }

  console.log('\n=== Backfill Complete ===');
  console.log(`  Linked : ${linked}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors : ${errors.length}`);
  if (errors.length > 0) errors.forEach((e) => console.log(`  - ${e}`));
}

main()
  .catch((e) => { console.error('Fatal:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
