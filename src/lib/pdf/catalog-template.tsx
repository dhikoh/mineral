/**
 * src/lib/pdf/catalog-template.tsx
 * Sesi #28 — Template PDF Katalog Produk Adably
 * Menggunakan @react-pdf/renderer primitives (tidak ada JSX browser).
 */

import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import type { ProductItem, SiteSettingsData } from '@/lib/data-store';

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 36,
    fontSize: 9,
    color: '#1E293B',
  },
  // --- Header ---
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 2,
    borderBottomColor: '#059669',
    paddingBottom: 10,
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'column',
  },
  logoBox: {
    width: 32,
    height: 32,
    backgroundColor: '#059669',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
  },
  siteName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#059669',
  },
  tagline: {
    fontSize: 7.5,
    color: '#64748B',
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  refLabel: {
    fontSize: 7,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  refNumber: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#1E293B',
    marginTop: 2,
  },
  generatedAt: {
    fontSize: 7.5,
    color: '#64748B',
    marginTop: 2,
  },
  // --- Buyer block ---
  buyerBlock: {
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 3,
    borderLeftColor: '#059669',
    padding: 10,
    marginBottom: 14,
    borderRadius: 3,
  },
  buyerLabel: {
    fontSize: 7,
    color: '#059669',
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  buyerName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
  },
  buyerCompany: {
    fontSize: 8.5,
    color: '#475569',
    marginTop: 1,
  },
  // --- Section heading ---
  sectionHeading: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  productCount: {
    fontSize: 7.5,
    color: '#64748B',
    fontFamily: 'Helvetica',
    marginLeft: 4,
  },
  // --- Product grid (2 columns) ---
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    width: '47.8%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    marginBottom: 4,
  },
  cardImage: {
    width: '100%',
    height: 100,
    objectFit: 'cover',
    backgroundColor: '#F1F5F9',
  },
  cardImagePlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImagePlaceholderText: {
    color: '#CBD5E1',
    fontSize: 20,
  },
  cardBody: {
    padding: 8,
  },
  categoryBadge: {
    backgroundColor: '#ECFDF5',
    color: '#059669',
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  cardName: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
    marginBottom: 3,
    lineHeight: 1.35,
  },
  cardDesc: {
    fontSize: 7.5,
    color: '#64748B',
    lineHeight: 1.5,
    marginBottom: 6,
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 5,
    marginTop: 2,
  },
  cardPrice: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: '#059669',
  },
  cardPriceHidden: {
    fontSize: 8,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  cardUnit: {
    fontSize: 7,
    color: '#94A3B8',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  // --- Usages ---
  usageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    marginBottom: 5,
  },
  usageChip: {
    fontSize: 6.5,
    color: '#475569',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    borderRadius: 2,
  },
  // --- Footer ---
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 36,
    right: 36,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  footerLeft: {
    flexDirection: 'column',
  },
  footerSiteName: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#059669',
    marginBottom: 2,
  },
  footerContact: {
    fontSize: 7,
    color: '#64748B',
  },
  footerDisclaimer: {
    fontSize: 6.5,
    color: '#94A3B8',
    fontStyle: 'italic',
    maxWidth: 200,
    textAlign: 'right',
  },
  pageNumber: {
    fontSize: 7,
    color: '#94A3B8',
  },
});

// ---------------------------------------------------------------------------
// Helper — format Rupiah
// ---------------------------------------------------------------------------
function formatRupiah(n: number): string {
  return 'Rp ' + n.toLocaleString('id-ID');
}

// Helper — potong teks
function truncate(text: string, maxLen: number): string {
  if (!text) return '';
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
}

// ---------------------------------------------------------------------------
// Props Interface
// ---------------------------------------------------------------------------
export interface CatalogDocumentProps {
  products: ProductItem[];
  settings: SiteSettingsData;
  showPrice: boolean;
  buyerName?: string;
  buyerCompany?: string;
  refNumber: string;
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Single Product Card
// ---------------------------------------------------------------------------
function ProductCard({
  product,
  showPrice,
}: {
  product: ProductItem;
  showPrice: boolean;
}) {
  const imageUrl = product.images?.[0] || null;
  const usages = product.usages?.map((u) => u.usage?.name).filter(Boolean) || [];

  return (
    <View style={styles.card}>
      {/* Gambar */}
      {imageUrl ? (
        <Image style={styles.cardImage} src={imageUrl} />
      ) : (
        <View style={styles.cardImagePlaceholder}>
          <Text style={styles.cardImagePlaceholderText}>◻</Text>
        </View>
      )}

      <View style={styles.cardBody}>
        {/* Kategori badge */}
        {product.category?.name && (
          <Text style={styles.categoryBadge}>{product.category.name}</Text>
        )}

        {/* Nama */}
        <Text style={styles.cardName}>{product.name}</Text>

        {/* Deskripsi singkat */}
        <Text style={styles.cardDesc}>
          {truncate(product.description, 160)}
        </Text>

        {/* Peruntukan chips */}
        {usages.length > 0 && (
          <View style={styles.usageRow}>
            {usages.slice(0, 3).map((u, i) => (
              <Text key={i} style={styles.usageChip}>
                {u}
              </Text>
            ))}
            {usages.length > 3 && (
              <Text style={styles.usageChip}>+{usages.length - 3}</Text>
            )}
          </View>
        )}

        {/* Harga & Unit */}
        <View style={styles.cardMeta}>
          {showPrice ? (
            <Text style={styles.cardPrice}>
              {formatRupiah(product.price)}/{product.unit || 'kg'}
            </Text>
          ) : (
            <Text style={styles.cardPriceHidden}>Hubungi Kami</Text>
          )}
          <Text style={styles.cardUnit}>
            Stok: {product.stock} {product.unit || 'unit'}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main CatalogDocument
// ---------------------------------------------------------------------------
export function CatalogDocument({
  products,
  settings,
  showPrice,
  buyerName,
  buyerCompany,
  refNumber,
  generatedAt,
}: CatalogDocumentProps) {
  const hasBuyer = !!(buyerName || buyerCompany);

  return (
    <Document
      title={`Katalog Produk ${settings.siteName}`}
      author={settings.siteName}
      subject="Katalog Komoditas Mineral & Hasil Alam"
      creator="Adably Admin Panel"
    >
      <Page size="A4" style={styles.page} wrap>
        {/* ================================================================
            HEADER
        ================================================================ */}
        <View style={styles.header} fixed>
          <View style={styles.headerLeft}>
            <View style={styles.logoBox}>
              <Text style={styles.logoText}>A</Text>
            </View>
            <Text style={styles.siteName}>{settings.siteName}</Text>
            {settings.tagline ? (
              <Text style={styles.tagline}>{truncate(settings.tagline, 60)}</Text>
            ) : null}
          </View>

          <View style={styles.headerRight}>
            <Text style={styles.refLabel}>No. Referensi</Text>
            <Text style={styles.refNumber}>{refNumber}</Text>
            <Text style={styles.generatedAt}>Diterbitkan: {generatedAt}</Text>
          </View>
        </View>

        {/* ================================================================
            BUYER BLOCK (opsional)
        ================================================================ */}
        {hasBuyer && (
          <View style={styles.buyerBlock}>
            <Text style={styles.buyerLabel}>Dipersiapkan untuk</Text>
            {buyerName && (
              <Text style={styles.buyerName}>{buyerName}</Text>
            )}
            {buyerCompany && (
              <Text style={styles.buyerCompany}>{buyerCompany}</Text>
            )}
          </View>
        )}

        {/* ================================================================
            SECTION HEADING
        ================================================================ */}
        <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 10 }}>
          <Text style={[styles.sectionHeading, { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 }]}>
            Katalog Produk
          </Text>
          <Text style={styles.productCount}>({products.length} produk)</Text>
        </View>
        <View style={{ borderBottomWidth: 1, borderBottomColor: '#E2E8F0', marginBottom: 12 }} />

        {/* ================================================================
            PRODUCT GRID
        ================================================================ */}
        <View style={styles.grid}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} showPrice={showPrice} />
          ))}
        </View>

        {/* ================================================================
            FOOTER (fixed di setiap halaman)
        ================================================================ */}
        <View style={styles.footer} fixed>
          <View style={styles.footerLeft}>
            <Text style={styles.footerSiteName}>{settings.siteName}</Text>
            <Text style={styles.footerContact}>
              {settings.csWhatsapp
                ? `WA: ${settings.csWhatsapp}`
                : ''}
              {settings.csEmail ? `  •  ${settings.csEmail}` : ''}
            </Text>
            {settings.address ? (
              <Text style={[styles.footerContact, { marginTop: 1 }]}>
                {truncate(settings.address, 80)}
              </Text>
            ) : null}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.footerDisclaimer}>
              Harga dapat berubah sewaktu-waktu.{'\n'}
              Dokumen ini bersifat rahasia dan hanya untuk penerima yang dituju.
            </Text>
            <Text
              style={styles.pageNumber}
              render={({ pageNumber, totalPages }) =>
                `Halaman ${pageNumber} / ${totalPages}`
              }
            />
          </View>
        </View>
      </Page>
    </Document>
  );
}
