'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  AlertCircle,
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  Gem,
  Package2,
  Weight,
  DollarSign,
  Camera,
  Send,
  ChevronRight,
} from 'lucide-react';
import { ImageUploader } from '@/components/ui/ImageUploader';

const STEPS = [
  { id: 1, label: 'Info Kontak', icon: User },
  { id: 2, label: 'Info Komoditas', icon: Gem },
  { id: 3, label: 'Foto & Konfirmasi', icon: Camera },
];

const PROVINCES = [
  'Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Kepulauan Riau', 'Jambi',
  'Bengkulu', 'Sumatera Selatan', 'Kepulauan Bangka Belitung', 'Lampung',
  'DKI Jakarta', 'Jawa Barat', 'Banten', 'Jawa Tengah', 'DI Yogyakarta', 'Jawa Timur',
  'Bali', 'Nusa Tenggara Barat', 'Nusa Tenggara Timur',
  'Kalimantan Barat', 'Kalimantan Tengah', 'Kalimantan Selatan', 'Kalimantan Timur', 'Kalimantan Utara',
  'Sulawesi Utara', 'Gorontalo', 'Sulawesi Tengah', 'Sulawesi Barat', 'Sulawesi Selatan', 'Sulawesi Tenggara',
  'Maluku', 'Maluku Utara', 'Papua', 'Papua Barat', 'Papua Selatan', 'Papua Tengah', 'Papua Pegunungan',
];

export default function JualKomoditasPage() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [province, setProvince] = useState('');

  // Step 2
  const [commodityName, setCommodityName] = useState('');
  const [commoditySpec, setCommoditySpec] = useState('');
  const [estimatedVolume, setEstimatedVolume] = useState('');
  const [priceExpected, setPriceExpected] = useState('');

  // Step 3
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  const validateStep1 = () => {
    if (!name.trim()) { setError('Nama kontak wajib diisi'); return false; }
    if (!phone.trim()) { setError('Nomor WhatsApp wajib diisi'); return false; }
    return true;
  };

  const validateStep2 = () => {
    if (!commodityName.trim()) { setError('Nama komoditas wajib diisi'); return false; }
    return true;
  };

  const handleNext = () => {
    setError(null);
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/jual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          company: company.trim() || undefined,
          phone: phone.trim(),
          email: email.trim() || undefined,
          province: province || undefined,
          commodityName: commodityName.trim(),
          commoditySpec: commoditySpec.trim() || undefined,
          estimatedVolume: estimatedVolume.trim() || undefined,
          priceExpected: priceExpected.trim() || undefined,
          photoUrls,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Gagal mengirim penawaran'); setSubmitting(false); return; }
      setSubmitted(true);
    } catch {
      setError('Terjadi kesalahan jaringan. Silakan coba lagi.');
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950/20 to-slate-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/30">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Penawaran Terkirim!</h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Terima kasih <span className="text-emerald-400 font-semibold">{name}</span>. Tim kami akan menghubungi Anda melalui WhatsApp dalam <strong className="text-white">1×24 jam kerja</strong>.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-left space-y-2 text-xs text-slate-400">
            <p className="font-semibold text-slate-300 text-sm">Ringkasan penawaran Anda:</p>
            <p>🪨 <span className="text-white">{commodityName}</span></p>
            {estimatedVolume && <p>📦 Volume: <span className="text-white">{estimatedVolume}</span></p>}
            <p>📞 WA: <span className="text-white">{phone}</span></p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-6 py-3 text-sm font-bold text-white transition-all active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/30 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 py-3.5">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link
            href="/"
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-bold text-white text-sm flex items-center gap-2">
              <Gem className="h-4 w-4 text-emerald-400" />
              Jual Komoditas Anda
            </h1>
            <p className="text-[11px] text-slate-400">Tawarkan mineral atau komoditas ke platform kami</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-8">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isDone = step > s.id;
            return (
              <div key={s.id} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isActive ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300' :
                  isDone ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-500'
                }`}>
                  {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">{s.label}</span>
                  <span className="sm:hidden">{s.id}</span>
                </div>
                {i < STEPS.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-slate-600" />}
              </div>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 animate-in fade-in">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Info Kontak */}
        {step === 1 && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <User className="h-4 w-4 text-emerald-400" />
              Informasi Kontak Anda
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Nama Lengkap <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Contoh: Budi Santoso"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/90 py-2.5 pl-9 pr-3.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Perusahaan / Instansi
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Nama perusahaan (opsional)"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/90 py-2.5 pl-9 pr-3.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Nomor WhatsApp <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="tel"
                    placeholder="08xxxxxxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/90 py-2.5 pl-9 pr-3.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Email (Opsional)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    placeholder="email@perusahaan.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/90 py-2.5 pl-9 pr-3.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Provinsi Lokasi Komoditas
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <select
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/90 py-2.5 pl-9 pr-3.5 text-xs text-white focus:border-emerald-500 focus:outline-none appearance-none"
                  >
                    <option value="">Pilih provinsi...</option>
                    {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Info Komoditas */}
        {step === 2 && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Gem className="h-4 w-4 text-emerald-400" />
              Detail Komoditas yang Ditawarkan
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Nama Komoditas <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Gem className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Contoh: Zeolite Alam, Bentonite, Kaolin, Pasir Silika..."
                    value={commodityName}
                    onChange={(e) => setCommodityName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/90 py-2.5 pl-9 pr-3.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Spesifikasi Teknis
                </label>
                <textarea
                  rows={3}
                  placeholder="Kadar kemurnian, ukuran mesh, kadar air, kadar SiO2/Al2O3, asal tambang, kondisi material (raw/processed)..."
                  value={commoditySpec}
                  onChange={(e) => setCommoditySpec(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 py-2.5 px-3.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Estimasi Volume / Kuantitas
                </label>
                <div className="relative">
                  <Weight className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Contoh: 500 ton/bulan, 50 ton (sekali)"
                    value={estimatedVolume}
                    onChange={(e) => setEstimatedVolume(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/90 py-2.5 pl-9 pr-3.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Harga Harapan (Opsional)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Contoh: Rp 800.000/ton (nego)"
                    value={priceExpected}
                    onChange={(e) => setPriceExpected(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/90 py-2.5 pl-9 pr-3.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">Biarkan kosong jika ingin didiskusikan bersama tim kami</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Foto & Konfirmasi */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Camera className="h-4 w-4 text-emerald-400" />
                Foto Sampel Komoditas (Opsional)
              </h2>
              <p className="text-xs text-slate-400">
                Unggah foto sampel atau foto kondisi material. Membantu tim kami memvalidasi kualitas lebih cepat.
              </p>
              <ImageUploader
                multiple={true}
                label="Foto Komoditas / Sampel"
                helperText="Unggah 1–5 foto. Format JPG, PNG, WEBP. Maks 5MB per file."
                values={photoUrls}
                onChange={(urls: string[]) => setPhotoUrls(urls)}
              />
            </div>

            {/* Konfirmasi Ringkasan */}
            <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6 space-y-3">
              <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                <Package2 className="h-4 w-4" />
                Konfirmasi Penawaran Anda
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Nama</span>
                  <span className="text-white font-semibold">{name}{company ? ` (${company})` : ''}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>WhatsApp</span>
                  <span className="text-white font-semibold">{phone}</span>
                </div>
                {province && (
                  <div className="flex justify-between text-slate-400">
                    <span>Provinsi</span>
                    <span className="text-white font-semibold">{province}</span>
                  </div>
                )}
                <div className="border-t border-slate-700 pt-2 mt-2">
                  <div className="flex justify-between text-slate-400">
                    <span>Komoditas</span>
                    <span className="text-white font-semibold">{commodityName}</span>
                  </div>
                  {estimatedVolume && (
                    <div className="flex justify-between text-slate-400 mt-1">
                      <span>Volume</span>
                      <span className="text-white">{estimatedVolume}</span>
                    </div>
                  )}
                  {priceExpected && (
                    <div className="flex justify-between text-slate-400 mt-1">
                      <span>Harga Harapan</span>
                      <span className="text-white">{priceExpected}</span>
                    </div>
                  )}
                </div>
                {photoUrls.length > 0 && (
                  <div className="flex justify-between text-slate-400 mt-1">
                    <span>Foto</span>
                    <span className="text-white">{photoUrls.length} foto terlampir</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => { setError(null); setStep((s) => s - 1); }}
              className="flex items-center gap-2 rounded-xl border border-slate-700 px-5 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </button>
          ) : (
            <Link
              href="/"
              className="flex items-center gap-2 rounded-xl border border-slate-700 px-5 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Batal
            </Link>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-6 py-2.5 text-xs font-bold text-white shadow-sm active:scale-95 transition-all"
            >
              Lanjut
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-6 py-2.5 text-xs font-bold text-white shadow-sm active:scale-95 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /><span>Mengirim...</span></>
              ) : (
                <><Send className="h-4 w-4" /><span>Kirim Penawaran</span></>
              )}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
