import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Mulai Seeding Data Default MineralHub ---');

  // 1. Akun Superadmin
  const hashedPassword = await bcrypt.hash('admin123456', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@mineralhub.com' },
    update: {},
    create: {
      email: 'admin@mineralhub.com',
      name: 'Super Admin MineralHub',
      password: hashedPassword,
      role: Role.SUPERADMIN,
    },
  });
  console.log(`✓ Superadmin dibuat: ${admin.email}`);

  // 2. SiteSetting
  const settings = await prisma.siteSetting.upsert({
    where: { id: 'default-setting' },
    update: {},
    create: {
      id: 'default-setting',
      siteName: 'MineralHub Indonesia',
      tagline: 'Pusat Komoditas Mineral Tambang & Hasil Alam Berkualitas',
      logoUrl: '',
      faviconUrl: '',
      primaryColor: '#059669',
      csWhatsapp: '6281234567890',
      csEmail: 'cs@mineralhub.id',
      csOperationalHours: 'Senin - Sabtu, 08.00 - 17.00 WIB',
      address: 'Kawasan Pergudangan & Industri Logistik Blok M-9, Jakarta Barat',
      bankAccounts: [
        {
          bank: 'BCA',
          noRekening: '8001234567',
          atasNama: 'PT MineralHub Indonesia',
        },
        {
          bank: 'Mandiri',
          noRekening: '1230009876543',
          atasNama: 'PT MineralHub Indonesia',
        },
      ],
      footerText: '© 2026 MineralHub Indonesia. Solusi pengadaan komoditas mineral & hasil alam terpercaya.',
      metaTitle: 'MineralHub Indonesia — Marketplace Komoditas Mineral & Hasil Alam',
      metaDesc: 'Jual beli komoditas mineral tambang berkualitas: Zeolite, Bentonite, Timah murni, serta Gaharu super untuk industri, agrikultur, dan ekspor.',
    },
  });
  console.log(`✓ SiteSetting disiapkan: ${settings.siteName}`);

  // 3. ContentBlocks
  const contentBlocks = [
    {
      key: 'homepage_hero',
      title: 'Pasokan Mineral Tambang & Komoditas Alam Terpercaya',
      content: '<p>Kami menyediakan komoditas mineral tambang mentah dan olahan berstandar industri dengan pengujian laboratorium berkala. Siap melayani kebutuhan pengiriman industri domestik maupun ekspor skala besar.</p>',
    },
    {
      key: 'about_us',
      title: 'Tentang MineralHub Indonesia',
      content: '<p>MineralHub Indonesia adalah platform pengadaan mineral dan hasil alam terintegrasi. Kami menghubungkan sumber tambang terverifikasi langsung dengan pelaku industri kimia, pertanian, konstruksi, dan manufaktur global dengan jaminan kualitas serta transparansi analisis laboratorium.</p>',
    },
    {
      key: 'why_us',
      title: 'Mengapa Memilih MineralHub?',
      content: '<ul><li><strong>Spesifikasi Teruji:</strong> Setiap pengiriman disertai Certificate of Analysis (CoA) resmi.</li><li><strong>Kapasitas Stabil:</strong> Jaringan tambang dan pengolahan langsung memastikan kontinuitas pasokan.</li><li><strong>Harga Transparan:</strong> Pembelian langsung tanpa rantai perantara berlebih.</li><li><strong>Pengiriman Aman:</strong> Armada logistik darat dan laut berpengalaman.</li></ul>',
    },
    {
      key: 'shipping_info',
      title: 'Informasi Pengiriman & Logistik',
      content: '<p>Pengiriman darat mencakup seluruh Pulau Jawa, Bali, dan Sumatra menggunakan armada truk colt diesel, fuso, hingga tronton. Untuk pengiriman antar-pulau dan ekspor, kami menyediakan kontainer FCL (Full Container Load) dan LCL melalui pelabuhan Tanjung Priok dan Tanjung Perak.</p>',
    },
    {
      key: 'terms',
      title: 'Syarat & Ketentuan Pemesanan',
      content: '<p>Pemesanan diproses setelah konfirmasi pembayaran transfer bank diverifikasi oleh admin. Estimasi waktu tiba barang bergantung pada jarak lokasi tujuan dan kapasitas tonase yang dipesan.</p>',
    },
    {
      key: 'privacy_policy',
      title: 'Kebijakan Privasi',
      content: '<p>Data pribadi yang dikirimkan pada saat checkout (nama, nomor kontak, alamat pengiriman) hanya digunakan untuk pemrosesan faktur, verifikasi pembayaran, dan koordinasi pengiriman armada logistik.</p>',
    },
  ];

  for (const block of contentBlocks) {
    await prisma.contentBlock.upsert({
      where: { key: block.key },
      update: {},
      create: block,
    });
  }
  console.log(`✓ ContentBlock disiapkan: ${contentBlocks.length} blok`);

  // 4. FAQs
  const faqs = [
    {
      question: 'Bagaimana alur pemesanan di MineralHub?',
      answer: 'Pilih produk di katalog, tentukan jumlah kuantitas yang dibutuhkan, lalu klik Checkout. Masukkan data penerima dan alamat pengiriman. Sistem akan menerbitkan Kode Pesanan unik dan detail rekening bank untuk transfer.',
      order: 1,
      isActive: true,
    },
    {
      question: 'Bagaimana metode pembayaran yang tersedia?',
      answer: 'Saat ini pembayaran dilakukan via transfer manual ke rekening bank resmi perusahaan kami (BCA dan Bank Mandiri). Setelah transfer, unggah foto bukti transfer pada halaman detail pesanan.',
      order: 2,
      isActive: true,
    },
    {
      question: 'Berapa lama verifikasi bukti transfer diproses?',
      answer: 'Verifikasi dilakukan manual oleh tim admin keuangan kami dalam waktu 15 - 30 menit pada jam kerja operasional (Senin - Sabtu, 08.00 - 17.00 WIB).',
      order: 3,
      isActive: true,
    },
    {
      question: 'Bagaimana cara melacak status pengiriman pesanan?',
      answer: 'Gunakan fitur Lacak Pesanan pada navigasi web. Masukkan Kode Pesanan (contoh: ORD-20260908-0001) dan nomor WhatsApp yang digunakan saat pemesanan.',
      order: 4,
      isActive: true,
    },
  ];

  for (const faq of faqs) {
    const existing = await prisma.fAQ.findFirst({ where: { question: faq.question } });
    if (!existing) {
      await prisma.fAQ.create({ data: faq });
    }
  }
  console.log(`✓ FAQ disiapkan: ${faqs.length} tanya-jawab`);

  // 5. Kategori
  const catMineral = await prisma.category.upsert({
    where: { slug: 'mineral-tambang' },
    update: {},
    create: {
      name: 'Mineral Tambang',
      slug: 'mineral-tambang',
      image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80',
    },
  });

  const catHutan = await prisma.category.upsert({
    where: { slug: 'hasil-hutan-non-kayu' },
    update: {},
    create: {
      name: 'Hasil Hutan Non-Kayu',
      slug: 'hasil-hutan-non-kayu',
      image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80',
    },
  });
  console.log('✓ Kategori disiapkan');

  // 6. Usages (Peruntukan)
  const usageData = [
    { name: 'Pertanian & Pupuk', slug: 'pertanian-pupuk' },
    { name: 'Peternakan & Pakan Ternak', slug: 'peternakan-pakan-ternak' },
    { name: 'Pengolahan Air', slug: 'pengolahan-air' },
    { name: 'Industri & Konstruksi', slug: 'industri-konstruksi' },
    { name: 'Industri Elektronik', slug: 'industri-elektronik' },
    { name: 'Kesehatan & Kosmetik', slug: 'kesehatan-kosmetik' },
    { name: 'Parfum & Dupa', slug: 'parfum-dupa' },
    { name: 'Ekspor Bahan Mentah', slug: 'ekspor-bahan-mentah' },
  ];

  const usageMap = new Map<string, string>();
  for (const u of usageData) {
    const usage = await prisma.usage.upsert({
      where: { slug: u.slug },
      update: {},
      create: u,
    });
    usageMap.set(u.slug, usage.id);
  }
  console.log(`✓ Usages disiapkan: ${usageData.length} peruntukan`);

  // 7. Produk Mineral & Hasil Alam
  const products = [
    {
      name: 'Zeolite Alam Aktif Mesh 80',
      slug: 'zeolite-alam-aktif-mesh-80',
      description: 'Zeolite alam murni berpori aktif dengan KTK (Kapasitas Tukar Kation) tinggi. Sangat efektif untuk ameliorasi tanah asam, campuran pupuk slow-release, media filter air tambak/akuakultur, dan penyerap bau kandang ternak.',
      price: 45000,
      stock: 500,
      images: [
        'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
      ],
      tags: ['zeolite', 'mineralalam', 'penyaringair', 'pupukorganik'],
      categoryId: catMineral.id,
      usageSlugs: ['pertanian-pupuk', 'pengolahan-air', 'peternakan-pakan-ternak'],
    },
    {
      name: 'Bentonite Sodium Swelling Grade A',
      slug: 'bentonite-sodium-swelling-grade-a',
      description: 'Bentonite lempung alami tipe sodium dengan daya kembang (swelling index) superior. Digunakan secara luas untuk lumpur pemboran minyak/gas (drilling mud), perekat pakan pelet ternak, dan penjernih limbah industri.',
      price: 65000,
      stock: 350,
      images: [
        'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
      ],
      tags: ['bentonite', 'clay', 'drillingmud', 'catlitter'],
      categoryId: catMineral.id,
      usageSlugs: ['industri-konstruksi', 'pengolahan-air', 'pertanian-pupuk'],
    },
    {
      name: 'Timah Balok Murni (Tin Ingot) Sn 99.9%',
      slug: 'timah-balok-murni-sn-99',
      description: 'Ingot balok timah murni grade komersial dengan kemurnian Stannum min 99.9%. Memenuhi standar ekspor LME (London Metal Exchange) untuk solder elektronik presisi, pelapisan pelat baja, dan paduan metalurgi.',
      price: 485000,
      stock: 120,
      images: [
        'https://images.unsplash.com/photo-1535813547-99c456a41d4a?auto=format&fit=crop&w=800&q=80',
      ],
      tags: ['timah', 'tin', 'logam', 'ekspor'],
      categoryId: catMineral.id,
      usageSlugs: ['industri-elektronik', 'ekspor-bahan-mentah'],
    },
    {
      name: 'Kayu Gaharu Super Natural (Aquilaria)',
      slug: 'kayu-gaharu-super-natural-aquilaria',
      description: 'Potongan kayu gaharu alami berkualitas tinggi dengan akumulasi resin hitam pekat. Menghasilkan aroma khas rempah manis yang tahan lama ketika dibakar. Ideal untuk aromaterapi dupa religius, bahan baku ekstraksi minyak atsiri premium, dan komoditas koleksi ekspor.',
      price: 1250000,
      stock: 45,
      images: [
        'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
      ],
      tags: ['gaharu', 'agarwood', 'parfum', 'dupa'],
      categoryId: catHutan.id,
      usageSlugs: ['kesehatan-kosmetik', 'parfum-dupa', 'ekspor-bahan-mentah'],
    },
  ];

  for (const p of products) {
    const { usageSlugs, ...productData } = p;
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: productData,
    });

    // Relasi ProductUsage
    for (const uSlug of usageSlugs) {
      const uId = usageMap.get(uSlug);
      if (uId) {
        await prisma.productUsage.upsert({
          where: {
            productId_usageId: {
              productId: product.id,
              usageId: uId,
            },
          },
          update: {},
          create: {
            productId: product.id,
            usageId: uId,
          },
        });
      }
    }
  }
  console.log(`✓ Produk disiapkan: ${products.length} item dengan relasi peruntukan`);

  // 8. Artikel Contoh
  const articles = [
    {
      title: 'Peran Zeolite Aktif dalam Meningkatkan Kesuburan Tanah dan Efisiensi Pupuk',
      slug: 'peran-zeolite-aktif-dalam-meningkatkan-kesuburan-tanah',
      htmlContent: `
        <p>Zeolite alam telah lama diakui sebagai salah satu bahan pembenah tanah (soil conditioner) terbaik di dunia pertanian modern. Dengan struktur kristal berpori mikro yang unik, zeolite mampu mengikat kation hara penting seperti amonium (NH4+) dan kalium (K+) agar tidak mudah tercuci oleh air hujan.</p>
        <h2>Mengapa Petani Membutuhkan Zeolite?</h2>
        <p>Pemberian pupuk kimia secara terus-menerus sering kali menyebabkan degradasi tanah dan inefisiensi biaya karena pupuk larut terbawa air sebelum diserap akar. Zeolite bertindak sebagai wadah cadangan yang melepaskan hara secara perlahan (slow-release mechanism).</p>
        <h3>Manfaat Utama:</h3>
        <ul>
          <li>Meningkatkan Kapasitas Tukar Kation (KTK) tanah hingga 200%.</li>
          <li>Mengurangi kehilangan nitrogen akibat penguapan dan pencucian.</li>
          <li>Menjaga kelembaban zona perakaran pada musim kemarau.</li>
        </ul>
      `,
      thumbnail: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
      metaDesc: 'Pelajari bagaimana zeolite aktif mampu memperbaiki struktur tanah, menghemat pupuk, dan mendongkrak hasil panen pertanian secara berkelanjutan.',
      isPublished: true,
      publishedAt: new Date(),
    },
    {
      title: 'Mengenal Bentonite: Karakteristik Mineral Lempung dan Aplikasinya',
      slug: 'mengenal-bentonite-karakteristik-dan-aplikasi',
      htmlContent: `
        <p>Bentonite adalah mineral lempung yang terbentuk dari pelapukan abu vulkanik selama jutaan tahun. Komponen utamanya adalah mineral montmorillonite yang memiliki kemampuan mengembang (swelling) luar biasa saat bersentuhan dengan air.</p>
        <h2>Aplikasi Utama di Dunia Industri</h2>
        <p>Dari dunia pengeboran minyak dan gas hingga industri penjernihan minyak nabati (bleaching earth), bentonite memegang peranan krusial sebagai bahan baku fungsional yang hemat biaya dan ramah lingkungan.</p>
      `,
      thumbnail: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
      metaDesc: 'Mengenal mineral bentonite, sifat swelling, dan penggunaannya dalam industri lumpur bor, pakan ternak, dan pengolahan limbah.',
      isPublished: true,
      publishedAt: new Date(),
    },
  ];

  for (const a of articles) {
    await prisma.article.upsert({
      where: { slug: a.slug },
      update: {},
      create: a,
    });
  }
  console.log(`✓ Artikel disiapkan: ${articles.length} artikel`);

  console.log('--- Seeding Selesai Sukses ---');
}

main()
  .catch((e) => {
    console.error('Error saat seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
