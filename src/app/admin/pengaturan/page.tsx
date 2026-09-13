'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  Settings,
  Phone,
  CreditCard,
  Building,
  Clock,
  Plus,
  Trash2,
  Globe,
  Sparkles,
  ExternalLink,
  QrCode,
  Building2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { ImageUploader } from '@/components/ui/ImageUploader';
import type { BankAccount } from '@/lib/data-store';

interface SiteSettingsData {
  siteName: string;
  tagline: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  primaryColor?: string | null;
  csWhatsapp: string;
  csEmail: string;
  csOperationalHours: string;
  address: string;
  bankAccounts: BankAccount[];
  footerText?: string | null;
}

export default function AdminPengaturanPage() {
  const [activeTab, setActiveTab] = useState<'brand' | 'contact' | 'banks'>('brand');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form states
  const [siteName, setSiteName] = useState('Adably');
  const [tagline, setTagline] = useState('Pusat Komoditas Mineral Tambang & Hasil Alam Berkualitas Ekspor');
  const [logoUrl, setLogoUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#059669');
  const [csWhatsapp, setCsWhatsapp] = useState('6281234567890');
  const [csEmail, setCsEmail] = useState('cs@adably.id');
  const [csOperationalHours, setCsOperationalHours] = useState('Senin - Sabtu, 08.00 - 17.00 WIB');
  const [address, setAddress] = useState('Kawasan Pergudangan & Industri Logistik Blok M-9, Jakarta Barat');
  const [footerText, setFooterText] = useState('© 2026 Adably. All rights reserved.');
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([
    { bank: 'BCA', noRekening: '8001234567', atasNama: 'Adably' },
    { bank: 'Mandiri', noRekening: '1230009876543', atasNama: 'Adably' },
  ]);

  const router = useRouter();

  useEffect(() => {
    fetch('/api/admin/pengaturan')
      .then((res) => {
        if (res.status === 401) {
          router.push('/admin/login');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.settings) {
          const s: SiteSettingsData = data.settings;
          setSiteName(s.siteName || '');
          setTagline(s.tagline || '');
          setLogoUrl(s.logoUrl || '');
          setFaviconUrl(s.faviconUrl || '');
          setPrimaryColor(s.primaryColor || '#059669');
          setCsWhatsapp(s.csWhatsapp || '');
          setCsEmail(s.csEmail || '');
          setCsOperationalHours(s.csOperationalHours || '');
          setAddress(s.address || '');
          setFooterText(s.footerText || '');
          if (Array.isArray(s.bankAccounts) && s.bankAccounts.length > 0) {
            setBankAccounts(s.bankAccounts);
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading settings:', err);
        setErrorMsg('Gagal memuat pengaturan situs.');
        setLoading(false);
      });
  }, [router]);

  const handleAddBank = () => {
    setBankAccounts((prev) => [
      ...prev,
      { type: 'BANK', bank: 'BCA', noRekening: '', atasNama: 'Adably', isActive: true },
    ]);
  };

  const handleAddQris = () => {
    setBankAccounts((prev) => [
      ...prev,
      { type: 'QRIS', bank: 'QRIS', noRekening: '', atasNama: 'Adably', qrImageUrl: '', instructions: '', isActive: true },
    ]);
  };

  const handleRemoveBank = (index: number) => {
    if (bankAccounts.length <= 1) {
      alert('Minimal harus ada 1 rekening bank transfer resmi.');
      return;
    }
    setBankAccounts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBankChange = (index: number, field: keyof BankAccount, val: string | boolean) => {
    setBankAccounts((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    // Sanitize WhatsApp number (ensure digits only, prefix with 62)
    let cleanWa = csWhatsapp.replace(/\D/g, '');
    if (cleanWa.startsWith('0')) {
      cleanWa = '62' + cleanWa.slice(1);
    }

    try {
      const res = await fetch('/api/admin/pengaturan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteName: siteName.trim(),
          tagline: tagline.trim(),
          logoUrl: logoUrl.trim() || null,
          faviconUrl: faviconUrl.trim() || null,
          primaryColor,
          csWhatsapp: cleanWa,
          csEmail: csEmail.trim(),
          csOperationalHours: csOperationalHours.trim(),
          address: address.trim(),
          footerText: footerText.trim(),
          bankAccounts,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan pengaturan.');

      setSuccessMsg('Pengaturan situs & nomor CS berhasil disimpan dan langsung aktif!');
      setCsWhatsapp(cleanWa);
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat menyimpan pengaturan.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Memuat pengaturan platform...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 pb-16">
      {/* Top Header */}
      <header className="relative z-10 md:sticky md:top-0 md:z-30 border-b border-surface-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/dashboard"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-surface-200 bg-white text-slate-600 hover:bg-surface-50 transition-colors shadow-soft-xs"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-base font-bold text-slate-900">Pengaturan Situs & WhatsApp CS</h1>
              <p className="text-xs text-slate-500">Kelola identitas merek, kontak CS, dan rekening bank resmi</p>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-all shadow-soft-sm disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                <span>Simpan Pengaturan</span>
              </>
            )}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pt-6 sm:px-6 lg:px-8">
        {/* Alerts */}
        {successMsg && (
          <div className="mb-6 flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 shadow-soft-xs">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 flex items-center gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 shadow-soft-xs">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex border-b border-surface-200 bg-white rounded-2xl p-1.5 shadow-soft-xs gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('brand')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'brand'
                ? 'bg-emerald-600 text-white shadow-soft-xs'
                : 'text-slate-600 hover:bg-surface-50'
            }`}
          >
            <Globe className="h-4 w-4" />
            <span>Identitas Platform</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'contact'
                ? 'bg-emerald-600 text-white shadow-soft-xs'
                : 'text-slate-600 hover:bg-surface-50'
            }`}
          >
            <Phone className="h-4 w-4" />
            <span>Kontak & WhatsApp CS</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('banks')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'banks'
                ? 'bg-emerald-600 text-white shadow-soft-xs'
                : 'text-slate-600 hover:bg-surface-50'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            <span>Rekening Bank ({bankAccounts.length})</span>
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSave} className="mt-6">
          {/* TAB 1: IDENTITAS PLATFORM */}
          {activeTab === 'brand' && (
            <div className="rounded-3xl border border-surface-200 bg-white p-6 sm:p-8 shadow-soft-xs space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">Identitas & Merek Platform</h2>
                <p className="text-xs text-slate-500">Nama platform, tagline, logo, dan tema tampilan toko</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nama Situs / Marketplace <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    placeholder="Adably"
                    className="w-full rounded-xl border border-surface-200 bg-surface-50/50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Warna Aksen Primer (Hex)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor || '#059669'}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-9 w-12 cursor-pointer rounded-xl border border-surface-200 p-1"
                    />
                    <input
                      type="text"
                      value={primaryColor || '#059669'}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1 rounded-xl border border-surface-200 bg-surface-50/50 px-3.5 py-2 text-xs font-mono text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tagline Platform
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Pusat Komoditas Mineral Tambang & Hasil Alam Berkualitas Ekspor"
                  className="w-full rounded-xl border border-surface-200 bg-surface-50/50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <ImageUploader
                    label="Logo Platform"
                    helperText="Rekomendasi PNG transparan atau SVG rasio 1:1 atau 3:1."
                    value={logoUrl || ''}
                    onChange={(val) => setLogoUrl(val)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    URL Favicon (Opsional)
                  </label>
                  <input
                    type="text"
                    value={faviconUrl || ''}
                    onChange={(e) => setFaviconUrl(e.target.value)}
                    placeholder="https://example.com/favicon.ico"
                    className="w-full rounded-xl border border-surface-200 bg-surface-50/50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Ikon kecil yang muncul pada tab peramban pengunjung.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Teks Hak Cipta Footer
                </label>
                <input
                  type="text"
                  value={footerText || ''}
                  onChange={(e) => setFooterText(e.target.value)}
                  placeholder="© 2026 Adably. All rights reserved."
                  className="w-full rounded-xl border border-surface-200 bg-surface-50/50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* TAB 2: KONTAK & OPERASIONAL */}
          {activeTab === 'contact' && (
            <div className="rounded-3xl border border-surface-200 bg-white p-6 sm:p-8 shadow-soft-xs space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">Kontak Resmi & Jam Layanan CS</h2>
                <p className="text-xs text-slate-500">
                  Nomor WhatsApp yang dimasukkan di sini akan otomatis terhubung ke tombol chat di seluruh toko
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nomor WhatsApp CS Resmi <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={csWhatsapp}
                      onChange={(e) => setCsWhatsapp(e.target.value)}
                      placeholder="6281234567890"
                      className="w-full rounded-xl border border-surface-200 bg-surface-50/50 px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Format internasional dengan kode negara (contoh: 6281234567890).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email Resmi Layanan Pelanggan
                  </label>
                  <input
                    type="email"
                    value={csEmail}
                    onChange={(e) => setCsEmail(e.target.value)}
                    placeholder="cs@adably.id"
                    className="w-full rounded-xl border border-surface-200 bg-surface-50/50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Jam Operasional Pelayanan
                </label>
                <input
                  type="text"
                  value={csOperationalHours}
                  onChange={(e) => setCsOperationalHours(e.target.value)}
                  placeholder="Senin - Sabtu, 08.00 - 17.00 WIB"
                  className="w-full rounded-xl border border-surface-200 bg-surface-50/50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Alamat Kantor & Gudang Logistik Utama
                </label>
                <textarea
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Kawasan Pergudangan & Industri Logistik Blok M-9, Jakarta Barat"
                  className="w-full rounded-xl border border-surface-200 bg-surface-50/50 p-3.5 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* TAB 3: REKENING BANK & QRIS */}
          {activeTab === 'banks' && (
            <div className="rounded-3xl border border-surface-200 bg-white p-6 sm:p-8 shadow-soft-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Rekening Bank &amp; QRIS</h2>
                  <p className="text-xs text-slate-500">
                    Daftar metode pembayaran yang akan ditampilkan pada halaman pesanan pembeli
                  </p>
                </div>
                <div className="flex gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={handleAddBank}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-surface-100 px-3 py-2 text-xs font-bold text-slate-800 hover:bg-surface-200 transition-colors"
                  >
                    <Building2 className="h-3.5 w-3.5" /> Tambah Bank
                  </button>
                  <button
                    type="button"
                    onClick={handleAddQris}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-purple-100 px-3 py-2 text-xs font-bold text-purple-800 hover:bg-purple-200 transition-colors"
                  >
                    <QrCode className="h-3.5 w-3.5" /> Tambah QRIS
                  </button>
                </div>
              </div>

              <div className="space-y-5">
                {bankAccounts.map((b, idx) => (
                  <div
                    key={idx}
                    className={`rounded-2xl border p-4 sm:p-5 relative transition-all ${
                      b.isActive === false
                        ? 'border-slate-200 bg-slate-50/50 opacity-60'
                        : b.type === 'QRIS'
                        ? 'border-purple-200 bg-purple-50/30'
                        : 'border-surface-200 bg-surface-50/50'
                    }`}
                  >
                    {/* Header: tipe + badge + toggle + hapus */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        {b.type === 'QRIS' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-purple-100 px-2.5 py-1 text-xs font-extrabold text-purple-800">
                            <QrCode className="h-3.5 w-3.5" /> QRIS #{idx + 1}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-extrabold text-emerald-800">
                            <CreditCard className="h-3.5 w-3.5" /> Bank #{idx + 1}
                          </span>
                        )}
                        {b.isActive === false && (
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Nonaktif</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {/* Toggle aktif */}
                        <button
                          type="button"
                          onClick={() => handleBankChange(idx, 'isActive', !(b.isActive !== false))}
                          className={`inline-flex items-center gap-1 text-xs font-semibold transition-colors ${
                            b.isActive !== false ? 'text-emerald-600 hover:text-emerald-800' : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          {b.isActive !== false ? (
                            <ToggleRight className="h-5 w-5" />
                          ) : (
                            <ToggleLeft className="h-5 w-5" />
                          )}
                          {b.isActive !== false ? 'Aktif' : 'Nonaktif'}
                        </button>
                        {bankAccounts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveBank(idx)}
                            className="text-xs font-semibold text-rose-600 hover:text-rose-800 inline-flex items-center gap-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Hapus
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Fields BANK */}
                    {b.type !== 'QRIS' && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Nama Bank
                          </label>
                          <input
                            type="text"
                            required
                            value={b.bank}
                            onChange={(e) => handleBankChange(idx, 'bank', e.target.value)}
                            placeholder="BCA, Mandiri, BRI..."
                            className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Nomor Rekening
                          </label>
                          <input
                            type="text"
                            required
                            value={b.noRekening}
                            onChange={(e) => handleBankChange(idx, 'noRekening', e.target.value)}
                            placeholder="8001234567"
                            className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Atas Nama
                          </label>
                          <input
                            type="text"
                            required
                            value={b.atasNama}
                            onChange={(e) => handleBankChange(idx, 'atasNama', e.target.value)}
                            placeholder="Adably"
                            className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Instruksi Pembayaran <span className="font-normal text-slate-400">(opsional)</span>
                          </label>
                          <input
                            type="text"
                            value={b.instructions || ''}
                            onChange={(e) => handleBankChange(idx, 'instructions', e.target.value)}
                            placeholder="Contoh: Transfer tepat sesuai total. Verifikasi 1x24 jam kerja."
                            className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                    )}

                    {/* Fields QRIS */}
                    {b.type === 'QRIS' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                              Nama Merchant / Label
                            </label>
                            <input
                              type="text"
                              required
                              value={b.bank}
                              onChange={(e) => handleBankChange(idx, 'bank', e.target.value)}
                              placeholder="QRIS Adably"
                              className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                              Atas Nama
                            </label>
                            <input
                              type="text"
                              required
                              value={b.atasNama}
                              onChange={(e) => handleBankChange(idx, 'atasNama', e.target.value)}
                              placeholder="Adably"
                              className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                              NMID <span className="font-normal text-slate-400">(opsional)</span>
                            </label>
                            <input
                              type="text"
                              value={b.noRekening || ''}
                              onChange={(e) => handleBankChange(idx, 'noRekening', e.target.value)}
                              placeholder="ID merchant QRIS"
                              className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-xs font-mono text-slate-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                              Instruksi <span className="font-normal text-slate-400">(opsional)</span>
                            </label>
                            <input
                              type="text"
                              value={b.instructions || ''}
                              onChange={(e) => handleBankChange(idx, 'instructions', e.target.value)}
                              placeholder="Scan QR, masukkan nominal, konfirmasi."
                              className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                          </div>
                        </div>

                        {/* Upload Gambar QR */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-2">
                            Gambar Kode QR <span className="text-rose-500">*</span>
                          </label>
                          <ImageUploader
                            value={b.qrImageUrl || ''}
                            onChange={(val) => handleBankChange(idx, 'qrImageUrl', val as string)}
                            uploadEndpoint="/api/admin/upload"
                            helperText="Upload gambar QR code QRIS (PNG/JPG, maks 5MB)"
                          />
                          {b.qrImageUrl && (
                            <div className="mt-2 flex items-center gap-2">
                              <img
                                src={b.qrImageUrl}
                                alt="Preview QR"
                                className="h-24 w-24 rounded-xl border border-purple-200 object-contain bg-white p-1"
                              />
                              <p className="text-[11px] text-slate-500">Preview kode QR yang akan ditampilkan ke pembeli</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Save Bar */}
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-xs font-bold text-white hover:bg-emerald-500 transition-all shadow-soft-sm disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Menyimpan Pengaturan...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Simpan Seluruh Pengaturan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
