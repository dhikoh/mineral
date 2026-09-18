import { getDefaultSiteName } from '@/lib/config';
import { Metadata } from 'next';
import { getFAQs, getSiteSettings } from '@/lib/data-store';
import { FAQClient } from './FAQClient';
import { safeJsonLd } from '@/lib/json-ld';

export const metadata: Metadata = {
  title: `Tanya Jawab (FAQ) — ${getDefaultSiteName()}`,
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
        dangerouslySetInnerHTML={{ __html: safeJsonLd(faqSchema) }}
      />
      <FAQClient
        faqs={faqs}
        csWhatsapp={settings.csWhatsapp}
        siteName={settings.siteName}
      />
    </>
  );
}

