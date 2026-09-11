import { Metadata } from 'next';
import { getFAQs, getSiteSettings } from '@/lib/data-store';
import { FAQClient } from './FAQClient';

export const metadata: Metadata = {
  title: 'Tanya Jawab (FAQ) — MineralHub Indonesia',
  description:
    'Pertanyaan yang sering diajukan mengenai pemesanan komoditas mineral, kesesuaian spesifikasi, sampel produk, prosedur pengiriman, dan ketentuan niaga.',
};

export default async function FAQPage() {
  const [faqs, settings] = await Promise.all([
    getFAQs({ activeOnly: true }),
    getSiteSettings(),
  ]);

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <FAQClient
        faqs={faqs}
        csWhatsapp={settings.csWhatsapp}
        siteName={settings.siteName}
      />
    </>
  );
}

