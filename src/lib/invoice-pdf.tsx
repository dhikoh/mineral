/**
 * src/lib/invoice-pdf.tsx
 * ADD-01: Template PDF Proforma / Official Commercial Invoice B2B
 * Render dokumen faktur menggunakan @react-pdf/renderer untuk pembeli & admin.
 */

import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  renderToBuffer,
} from '@react-pdf/renderer';
import type { OrderData, SiteSettingsData } from '@/lib/data-store';
import { computeOrderTotals } from '@/lib/order-total';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 36,
    fontSize: 9,
    color: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 2,
    borderBottomColor: '#059669',
    paddingBottom: 12,
    marginBottom: 16,
  },
  companyBox: {
    flexDirection: 'column',
    maxWidth: 320,
  },
  brandName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#059669',
  },
  tagline: {
    fontSize: 8,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 4,
  },
  companyText: {
    fontSize: 8,
    color: '#475569',
    lineHeight: 1.3,
  },
  invoiceMetaBox: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  invoiceTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
    textTransform: 'uppercase',
  },
  invoiceSubtitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#059669',
    marginTop: 2,
  },
  metaText: {
    fontSize: 8,
    color: '#475569',
    marginTop: 3,
  },
  partiesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  partyCol: {
    width: '48%',
  },
  partyTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  partyName: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
    marginBottom: 2,
  },
  partyDetail: {
    fontSize: 8,
    color: '#334155',
    lineHeight: 1.3,
  },
  table: {
    width: '100%',
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#059669',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  thText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableRowAlt: {
    backgroundColor: '#F8FAFC',
  },
  colNo: { width: '6%', textAlign: 'center' },
  colDesc: { width: '46%' },
  colQty: { width: '16%', textAlign: 'right' },
  colPrice: { width: '16%', textAlign: 'right' },
  colSubtotal: { width: '16%', textAlign: 'right' },
  cellText: {
    fontSize: 8,
    color: '#1E293B',
  },
  summarySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  notesBox: {
    width: '52%',
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notesTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#475569',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  notesText: {
    fontSize: 8,
    color: '#334155',
    lineHeight: 1.3,
  },
  calculationBox: {
    width: '44%',
    padding: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  calcLabel: {
    fontSize: 8,
    color: '#64748B',
  },
  calcValue: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1.5,
    borderTopColor: '#059669',
    paddingTop: 6,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#059669',
  },
  grandTotalValue: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#059669',
  },
  bankSection: {
    padding: 10,
    backgroundColor: '#ECFDF5',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 16,
  },
  bankTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#065F46',
    marginBottom: 4,
  },
  bankText: {
    fontSize: 8,
    color: '#047857',
    lineHeight: 1.3,
  },
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
    fontSize: 7,
    color: '#94A3B8',
  },
});

function formatRupiahPdf(amount: number): string {
  return 'Rp ' + Math.round(amount).toLocaleString('id-ID');
}

export function InvoiceDocument({
  order,
  settings,
}: {
  order: OrderData;
  settings: SiteSettingsData;
}) {
  const isPaidOrBeyond = ['PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED'].includes(order.status);
  const docTitle = isPaidOrBeyond ? 'FAKTUR RESMI PENJUALAN' : 'FAKTUR PROFORMA';
  const docSubtitle = isPaidOrBeyond ? 'COMMERCIAL INVOICE' : 'PROFORMA INVOICE';

  const orderDate = new Date(order.createdAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Hitung ulang rincian finansial jika grandTotal belum disimpan di snapshot
  const totals = computeOrderTotals({
    items: order.items.map((i) => ({
      price: i.price,
      qty: (i as any).qty ?? (i as any).quantity ?? 1,
    })),
    taxRateBasisPoints: (order.taxRate !== null && order.taxRate !== undefined) ? order.taxRate : (settings.taxEnabled ? (settings.defaultTaxRate ?? 0) : 0),
    taxEnabled: settings.taxEnabled || Boolean(order.taxRate && order.taxRate > 0),
    manualShippingCost: order.shippingCost ?? 0,
    discountAmount: order.discountAmount ?? 0,
  });

  const grandTotal = order.grandTotal ?? totals.grandTotal;
  const subtotal = order.subtotal ?? totals.subtotal;
  const taxAmount = order.taxAmount ?? totals.taxAmount;
  const shippingCost = order.shippingCost ?? totals.shippingCost;

  return (
    <Document title={`${docTitle} - ${order.orderCode}`}>
      <Page size="A4" style={styles.page}>
        {/* Header Perusahaan & Meta Faktur */}
        <View style={styles.header}>
          <View style={styles.companyBox}>
            <Text style={styles.brandName}>{settings.siteName}</Text>
            <Text style={styles.tagline}>{settings.tagline}</Text>
            {settings.address && <Text style={styles.companyText}>{settings.address}</Text>}
            <Text style={styles.companyText}>
              WhatsApp CS: {settings.csWhatsapp} | Email: {settings.csEmail}
            </Text>
          </View>
          <View style={styles.invoiceMetaBox}>
            <Text style={styles.invoiceTitle}>{docTitle}</Text>
            <Text style={styles.invoiceSubtitle}>{docSubtitle}</Text>
            <Text style={styles.metaText}>No: {order.orderCode}</Text>
            <Text style={styles.metaText}>Tanggal: {orderDate}</Text>
            <Text style={styles.metaText}>Status: {order.status}</Text>
          </View>
        </View>

        {/* Data Pihak Pembeli & Pengiriman */}
        <View style={styles.partiesRow}>
          <View style={styles.partyCol}>
            <Text style={styles.partyTitle}>Tujuan Tagihan (Billed To):</Text>
            <Text style={styles.partyName}>{order.buyerName}</Text>
            <Text style={styles.partyDetail}>Telepon/WA: {order.buyerPhone}</Text>
            {order.buyerEmail && <Text style={styles.partyDetail}>Email: {order.buyerEmail}</Text>}
          </View>
          <View style={styles.partyCol}>
            <Text style={styles.partyTitle}>Alamat Pengiriman Logistik:</Text>
            <Text style={styles.partyDetail}>{order.buyerAddress}</Text>
            {order.trackingNumber && (
              <Text style={[styles.partyDetail, { marginTop: 4, fontFamily: 'Helvetica-Bold' }]}>
                No. Resi/Kargo: {order.trackingNumber}
              </Text>
            )}
          </View>
        </View>

        {/* Tabel Rincian Komoditas */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.colNo}>
              <Text style={styles.thText}>No</Text>
            </View>
            <View style={styles.colDesc}>
              <Text style={styles.thText}>Deskripsi Produk Komoditas</Text>
            </View>
            <View style={styles.colQty}>
              <Text style={styles.thText}>Kuantitas</Text>
            </View>
            <View style={styles.colPrice}>
              <Text style={styles.thText}>Harga Satuan</Text>
            </View>
            <View style={styles.colSubtotal}>
              <Text style={styles.thText}>Subtotal</Text>
            </View>
          </View>

          {order.items.map((item, index) => {
            const unit = item.productUnit || 'Kg';
            const itemQty = (item as any).qty ?? (item as any).quantity ?? 1;
            const itemSubtotal = item.price * itemQty;
            return (
              <View
                key={item.id || index}
                style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}
              >
                <View style={styles.colNo}>
                  <Text style={styles.cellText}>{index + 1}</Text>
                </View>
                <View style={styles.colDesc}>
                  <Text style={[styles.cellText, { fontFamily: 'Helvetica-Bold' }]}>
                    {item.productName || 'Komoditas Mineral'}
                  </Text>
                </View>
                <View style={styles.colQty}>
                  <Text style={styles.cellText}>
                    {itemQty.toLocaleString('id-ID')} {unit}
                  </Text>
                </View>
                <View style={styles.colPrice}>
                  <Text style={styles.cellText}>{formatRupiahPdf(item.price)}</Text>
                </View>
                <View style={styles.colSubtotal}>
                  <Text style={[styles.cellText, { fontFamily: 'Helvetica-Bold' }]}>
                    {formatRupiahPdf(itemSubtotal)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Ringkasan Finansial & Catatan */}
        <View style={styles.summarySection}>
          <View style={styles.notesBox}>
            <Text style={styles.notesTitle}>Catatan &amp; Instruksi Khusus:</Text>
            <Text style={styles.notesText}>
              {order.notes ? order.notes : 'Tidak ada instruksi khusus pemesanan.'}
            </Text>
            <Text style={[styles.notesText, { marginTop: 6, color: '#64748B' }]}>
              Barang yang sudah dibeli dan diperiksa sesuai spesifikasi saat pembongkaran muatan
              terikat pada kontrak niaga komoditas.
            </Text>
          </View>

          <View style={styles.calculationBox}>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Subtotal Komoditas:</Text>
              <Text style={styles.calcValue}>{formatRupiahPdf(subtotal)}</Text>
            </View>
            {taxAmount > 0 && (
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>
                  PPN ({order.taxRate ?? settings.defaultTaxRate}%):
                </Text>
                <Text style={styles.calcValue}>{formatRupiahPdf(taxAmount)}</Text>
              </View>
            )}
            {shippingCost > 0 && (
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Ongkos Kirim/Kargo:</Text>
                <Text style={styles.calcValue}>{formatRupiahPdf(shippingCost)}</Text>
              </View>
            )}
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>TOTAL AKHIR:</Text>
              <Text style={styles.grandTotalValue}>{formatRupiahPdf(grandTotal)}</Text>
            </View>
          </View>
        </View>

        {/* Instruksi Pembayaran Bank (Hanya jika belum lunas) */}
        {!isPaidOrBeyond && settings.bankAccounts && settings.bankAccounts.length > 0 && (
          <View style={styles.bankSection}>
            <Text style={styles.bankTitle}>Instruksi Pembayaran Transfer Bank Resmi:</Text>
            {settings.bankAccounts.map((b, i) => (
              <Text key={i} style={styles.bankText}>
                • {b.bank}: {b.noRekening} a.n. {b.atasNama}
              </Text>
            ))}
            <Text style={[styles.bankText, { marginTop: 4, fontStyle: 'italic' }]}>
              Mohon sertakan Kode Pesanan ({order.orderCode}) pada berita transfer dan unggah bukti
              pembayaran melalui tautan pesanan Anda.
            </Text>
          </View>
        )}

        {/* Footer Dokumen */}
        <View style={styles.footer}>
          <Text>
            Dokumen sah diterbitkan otomatis oleh sistem {settings.siteName}.
          </Text>
          <Text>Halaman 1 dari 1</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function renderInvoiceToBuffer(
  order: OrderData,
  settings: SiteSettingsData
): Promise<Buffer> {
  const element = React.createElement(InvoiceDocument, {
    order,
    settings,
  }) as React.ReactElement<any>;
  return renderToBuffer(element);
}
