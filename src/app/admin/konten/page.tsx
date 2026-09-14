'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  FileText,
  ShieldCheck,
  Truck,
  HelpCircle,
  Eye,
  Edit3,
  Gem,
} from 'lucide-react';
import { sanitize } from '@/lib/sanitize';
import { RichTextEditor } from '@/components/editor/RichTextEditor';

interface ContentBlockItem {
  id: string;
  key: string;
  title: string | null;
  content: string;
  updatedAt: string;
}

const BLOCK_TABS = [
  { key: 'homepage_hero', label: 'Banner Beranda', icon: Sparkles, desc: 'Judul & deskripsi utama pada header beranda' },
  { key: 'supplier_cta', label: 'CTA Penawaran Jual', icon: Gem, desc: 'Banner ajakan suplai/pemilik tambang di hero beranda' },
  { key: 'about_us', label: 'Tentang Kami', icon: FileText, desc: 'Profil perusahaan, komitmen pasokan, dan spesifikasi' },
  { key: 'why_us', label: 'Keunggulan Kami', icon: ShieldCheck, desc: '4 pilar keunggulan pasokan komoditas' },
  { key: 'shipping_info', label: 'Pengiriman & Logistik', icon: Truck, desc: 'Opsi ekspedisi truk, kargo kontainer, dan pelabuhan muat' },
  { key: 'terms', label: 'Syarat & Ketentuan', icon: FileText, desc: 'Aturan pemesanan, MOQ, dan inspeksi komplain' },
  { key: 'privacy_policy', label: 'Kebijakan Privasi', icon: ShieldCheck, desc: 'Perlindungan data dan kerahasiaan mitra' },
];

export default function AdminKontenPage() {
  const [blocks, setBlocks] = useState<ContentBlockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeKey, setActiveKey] = useState('homepage_hero');
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetch('/api/admin/konten')
      .then((res) => {
        if (res.status === 401) {
          router.push('/admin/login');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.blocks) {
          setBlocks(data.blocks);
          const current = data.blocks.find((b: ContentBlockItem) => b.key === 'homepage_hero');
          if (current) {
            setEditTitle(current.title || '');
            setEditContent(current.content || '');
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching blocks:', err);
        setErrorMsg('Gagal memuat blok konten.');
        setLoading(false);
      });
  }, [router]);

  const handleTabChange = (key: string) => {
    setActiveKey(key);
    setSuccessMsg('');
    setErrorMsg('');
    const target = blocks.find((b) => b.key === key);
    if (target) {
      setEditTitle(target.title || '');
      setEditContent(target.content || '');
    } else {
      setEditTitle('');
      setEditContent('');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/admin/konten', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: activeKey,
          title: editTitle.trim() || null,
          content: editContent,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan blok konten.');

      setSuccessMsg('Blok konten berhasil diperbarui dan diterapkan ke storefront!');
      // Update local state
      setBlocks((prev) => {
        const idx = prev.findIndex((b) => b.key === activeKey);
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = data.block;
          return next;
        }
        return [...prev, data.block];
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat menyimpan.');
    } finally {
      setSaving(false);
    }
  };

  const activeTabMeta = BLOCK_TABS.find((t) => t.key === activeKey) || BLOCK_TABS[0];
  const activeBlock = blocks.find((b) => b.key === activeKey);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Memuat data CMS teks web...</p>
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
              <h1 className="text-base font-bold text-slate-900">CMS Konten Teks Web</h1>
              <p className="text-xs text-slate-500">Kelola seluruh teks statis dan halaman informasi toko</p>
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
                <span>Simpan Perubahan</span>
              </>
            )}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        {/* Success / Error Alerts */}
        {successMsg && (
          <div className="mb-6 flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 shadow-soft-xs animate-in fade-in duration-300">
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Navigation Tabs (Sidebar) */}
          <div className="space-y-2 lg:col-span-1">
            <h3 className="px-1 text-xs font-bold uppercase tracking-wider text-slate-400">
              Daftar Halaman & Seksi
            </h3>
            <div className="space-y-1.5">
              {BLOCK_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeKey === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => handleTabChange(tab.key)}
                    className={`w-full text-left rounded-2xl p-3.5 transition-all flex items-start gap-3 border ${
                      isActive
                        ? 'border-emerald-500 bg-emerald-50/80 shadow-soft-xs text-emerald-950 font-bold'
                        : 'border-surface-200 bg-white hover:bg-surface-50 text-slate-700'
                    }`}
                  >
                    <div
                      className={`rounded-xl p-2 shrink-0 ${
                        isActive ? 'bg-emerald-600 text-white' : 'bg-surface-100 text-slate-500'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs truncate">{tab.label}</p>
                      <p className="text-[11px] font-normal text-slate-400 truncate mt-0.5">
                        {tab.key}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Editor (Main Area) */}
          <div className="lg:col-span-3">
            <div className="rounded-3xl border border-surface-200 bg-white p-6 shadow-soft-xs">
              {/* Active Tab Info */}
              <div className="flex flex-col gap-2 border-b border-surface-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-slate-900">{activeTabMeta.label}</h2>
                    <span className="rounded-md bg-surface-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-600">
                      {activeKey}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{activeTabMeta.desc}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewMode(false)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                      !previewMode
                        ? 'bg-slate-900 text-white shadow-soft-xs'
                        : 'bg-surface-100 text-slate-600 hover:bg-surface-200'
                    }`}
                  >
                    <Edit3 className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode(true)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                      previewMode
                        ? 'bg-emerald-600 text-white shadow-soft-xs'
                        : 'bg-surface-100 text-slate-600 hover:bg-surface-200'
                    }`}
                  >
                    <Eye className="h-3.5 w-3.5" /> Pratinjau
                  </button>
                </div>
              </div>

              {/* Form Fields */}
              <div className="mt-6 space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Judul Seksi / Heading Utama (Opsional)
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Contoh: Pusat Komoditas Mineral & Hasil Alam Berkualitas Ekspor"
                    className="w-full rounded-xl border border-surface-200 bg-surface-50/50 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Isi Konten Teks / Paragraf
                  </label>

                  {!previewMode ? (
                    <RichTextEditor
                      value={editContent}
                      onChange={setEditContent}
                      placeholder="Ketik konten teks atau informasi detail di sini..."
                      theme="light"
                      minHeight={220}
                    />
                  ) : (
                    <div className="min-h-[280px] rounded-2xl border border-surface-200 bg-surface-50/30 p-5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                        Tampilan Pratinjau Pengunjung:
                      </p>
                      {editTitle && (
                        <h3 className="text-base font-extrabold text-slate-900 mb-3">
                          {editTitle}
                        </h3>
                      )}
                      <div
                        className="prose prose-sm max-w-none text-xs leading-relaxed text-slate-700"
                        dangerouslySetInnerHTML={{ __html: sanitize(editContent) }}
                      />
                    </div>
                  )}
                </div>

                {/* Footer Meta */}
                {activeBlock?.updatedAt && (
                  <p className="text-[11px] text-slate-400">
                    Terakhir diperbarui: {new Date(activeBlock.updatedAt).toLocaleString('id-ID')}
                  </p>
                )}

                {/* Bottom Action */}
                <div className="pt-4 border-t border-surface-100 flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-all shadow-soft-sm disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5" />
                        <span>Simpan Perubahan ({activeTabMeta.label})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
