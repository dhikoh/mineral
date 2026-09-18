'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ShoppingBag,
  Loader2,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Building2,
  Gem,
  Weight,
  DollarSign,
  FileText,
  Save,
  ExternalLink,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import type { SellOfferItem, SellOfferStatus } from '@/lib/data-store';

const STATUS_OPTIONS: { value: SellOfferStatus; label: string; color: string }[] = [
  { value: 'BARU', label: 'Baru', color: 'text-amber-300' },
  { value: 'DIHUBUNGI', label: 'Dihubungi', color: 'text-blue-300' },
  { value: 'DIVERIFIKASI', label: 'Diverifikasi', color: 'text-emerald-300' },
  { value: 'DITOLAK', label: 'Ditolak', color: 'text-rose-300' },
];

const STATUS_ICONS: Record<SellOfferStatus, React.ElementType> = {
  BARU: Clock,
  DIHUBUNGI: Phone,
  DIVERIFIKASI: CheckCircle2,
  DITOLAK: XCircle,
};

export default function AdminPenawaranJualDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [offer, setOffer] = useState<SellOfferItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState<SellOfferStatus>('BARU');
  const [adminNotes, setAdminNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/penawaran-jual/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          setOffer(json.data);
          setStatus(json.data.status);
          setAdminNotes(json.data.adminNotes || '');
        } else {
          setError(json.error || 'Tidak ditemukan');
        }
      })
      .catch(() => setError('Gagal memuat data'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch(`/api/admin/penawaran-jual/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNotes }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Gagal menyimpan'); return; }
      setOffer(json.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError('Terjadi kesalahan jaringan');
    } finally {
      setSaving(false);
    }
  };

  const waLink = offer
    ? `https://wa.me/${offer.phone}?text=${encodeURIComponent(
        `Halo ${offer.name}, kami dari tim pengadaan kami ingin menindaklanjuti penawaran komoditas ${offer.commodityName} yang Anda ajukan. `
      )}`
    : '#';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center gap-2 text-white text-xs">
        <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
        <span>Memuat penawaran...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 sm:px-8 py-3.5">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <Link
            href="/admin/penawaran-jual"
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-bold text-white text-sm flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-emerald-400" />
              Detail Penawaran Jual
            </h1>
            <p className="text-[11px] text-slate-400">
              {offer?.commodityName || 'Memuat...'} — {offer?.name}
            </p>
          </div>
        </div>
      </header>

      {error && !offer && (
        <div className="mx-auto max-w-4xl px-4 sm:px-8 pt-6">
          <div className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {offer && (
        <main className="mx-auto max-w-4xl px-4 sm:px-8 pt-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 animate-in fade-in">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {saved && (
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              <span>Perubahan berhasil disimpan</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left: Info Penawar & Komoditas */}
            <div className="lg:col-span-2 space-y-5">
              {/* Info Kontak */}
              <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
                <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-400" />
                  Info Penawar
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <InfoRow icon={Building2} label="Nama" value={offer.name + (offer.company ? ` (${offer.company})` : '')} />
                  <InfoRow icon={Phone} label="WhatsApp" value={offer.phone} />
                  {offer.email && <InfoRow icon={Mail} label="Email" value={offer.email} />}
                  {offer.province && <InfoRow icon={MapPin} label="Provinsi" value={offer.province} />}
                </div>
                <div className="pt-2">
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white transition-all active:scale-95"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    Hubungi via WhatsApp
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              {/* Info Komoditas */}
              <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
                <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                  <Gem className="h-4 w-4 text-emerald-400" />
                  Info Komoditas
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <InfoRow icon={Gem} label="Komoditas" value={offer.commodityName} highlight />
                  {offer.estimatedVolume && <InfoRow icon={Weight} label="Volume" value={offer.estimatedVolume} />}
                  {offer.priceExpected && <InfoRow icon={DollarSign} label="Harga Harapan" value={offer.priceExpected} />}
                </div>
                {offer.commoditySpec && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Spesifikasi Teknis</p>
                    <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-800/50 rounded-xl p-3">{offer.commoditySpec}</p>
                  </div>
                )}
              </div>

              {/* Foto Sampel */}
              {offer.photoUrls && offer.photoUrls.length > 0 && (
                <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileText className="h-4 w-4 text-amber-400" />
                    Foto Sampel ({offer.photoUrls.length})
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {offer.photoUrls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={url}
                          alt={`Foto ${i + 1}`}
                          className="w-full h-32 object-cover rounded-xl border border-slate-700 hover:border-emerald-500 transition-colors"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Status & Catatan Admin */}
            <div className="space-y-5">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Status & Tindak Lanjut
                </h2>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Status Penawaran
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as SellOfferStatus)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/90 py-2.5 px-3.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Catatan Admin
                  </label>
                  <textarea
                    rows={5}
                    placeholder="Catatan tindak lanjut, hasil verifikasi, alasan penolakan..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/90 py-2.5 px-3.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white transition-all active:scale-95 disabled:opacity-50"
                >
                  {saving ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /><span>Menyimpan...</span></>
                  ) : (
                    <><Save className="h-4 w-4" /><span>Simpan Perubahan</span></>
                  )}
                </button>
              </div>

              {/* Meta info */}
              <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-4 text-xs text-slate-500 space-y-1.5">
                <p><span className="text-slate-400">Masuk:</span>{' '}{new Date(offer.createdAt).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}</p>
                <p><span className="text-slate-400">Diperbarui:</span>{' '}{new Date(offer.updatedAt).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}</p>
                <p className="font-mono text-[10px] text-slate-600 break-all">ID: {offer.id}</p>
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex gap-2">
      <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${highlight ? 'text-emerald-400' : 'text-slate-500'}`} />
      <div>
        <p className="text-[11px] text-slate-500 uppercase tracking-wider">{label}</p>
        <p className={`font-semibold ${highlight ? 'text-emerald-300' : 'text-white'}`}>{value}</p>
      </div>
    </div>
  );
}
