'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import {
  Upload,
  Link as LinkIcon,
  X,
  Star,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react';

interface ImageUploaderProps {
  label?: string;
  helperText?: string;
  placeholder?: string;
  value?: string; // Untuk mode single
  values?: string[]; // Untuk mode multiple (galeri produk)
  multiple?: boolean;
  uploadEndpoint?: string; // default '/api/admin/upload'
  onChange: (value: any) => void;
}

export function ImageUploader({
  label = 'Gambar',
  helperText = 'Format JPG, PNG, WEBP, atau PDF. Maksimal 5 MB.',
  value = '',
  values = [],
  multiple = false,
  uploadEndpoint = '/api/admin/upload',
  onChange,
}: ImageUploaderProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Daftar gambar saat ini
  const currentImages: string[] = multiple ? values : value ? [value] : [];

  const handleFileUpload = async (file: File) => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(uploadEndpoint, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Gagal mengunggah file gambar');
        setLoading(false);
        return;
      }

      if (multiple) {
        const nextValues = [...values, data.url];
        onChange(nextValues);
      } else {
        onChange(data.url);
      }

      setSuccessMsg('Gambar berhasil diunggah');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      setError('Terjadi kesalahan jaringan saat upload file');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await fetch(uploadEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Tautan URL gambar tidak valid');
        setLoading(false);
        return;
      }

      if (multiple) {
        const nextValues = [...values, data.url];
        onChange(nextValues);
      } else {
        onChange(data.url);
      }

      setUrlInput('');
      setSuccessMsg('Tautan URL gambar berhasil disimpan');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      setError('Gagal memvalidasi tautan URL');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (index: number) => {
    if (multiple) {
      const nextValues = values.filter((_, idx) => idx !== index);
      onChange(nextValues);
    } else {
      onChange('');
    }
  };

  const handleSetPrimary = (index: number) => {
    if (!multiple || index === 0) return;
    const selected = values[index];
    const remaining = values.filter((_, idx) => idx !== index);
    onChange([selected, ...remaining]);
  };

  return (
    <div className="space-y-3">
      {/* Label & Helper */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          {label} {multiple && <span className="text-slate-400 font-normal">(Galeri Multi-Gambar)</span>}
        </label>
        <span className="text-[11px] text-slate-400">{helperText}</span>
      </div>

      {/* Tabs Switcher: Upload File vs Tautan URL */}
      <div className="flex rounded-xl bg-surface-100 p-1 border border-surface-200">
        <button
          type="button"
          onClick={() => {
            setActiveTab('upload');
            setError(null);
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'upload'
              ? 'bg-white text-emerald-700 shadow-soft-sm'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Upload className="h-3.5 w-3.5" />
          <span>Unggah File Langsung</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('url');
            setError(null);
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'url'
              ? 'bg-white text-emerald-700 shadow-soft-sm'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <LinkIcon className="h-3.5 w-3.5" />
          <span>Tempel Tautan URL</span>
        </button>
      </div>

      {/* Mode 1: File Dropzone / Picker */}
      {activeTab === 'upload' && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-surface-300 hover:border-emerald-500 bg-surface-50/50 hover:bg-emerald-50/30 p-6 text-center cursor-pointer transition-all"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/svg+xml"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
            className="hidden"
          />
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-surface-200 text-slate-500 group-hover:text-emerald-600 group-hover:scale-105 transition-all shadow-soft-sm">
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            ) : (
              <Upload className="h-6 w-6" />
            )}
          </div>
          <p className="mt-3 text-xs font-bold text-slate-800 group-hover:text-emerald-700">
            {loading ? 'Sedang mengunggah...' : 'Klik atau drag file gambar ke area ini'}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Mendukung JPG, PNG, WEBP, SVG hingga 5 MB
          </p>
        </div>
      )}

      {/* Mode 2: Paste URL */}
      {activeTab === 'url' && (
        <form onSubmit={handleUrlSubmit} className="flex gap-2">
          <input
            type="url"
            placeholder="https://example.com/foto-komoditas.jpg"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="flex-1 rounded-xl border border-surface-300 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
          />
          <button
            type="submit"
            disabled={loading || !urlInput.trim()}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-soft-sm hover:bg-emerald-700 active:scale-95 disabled:opacity-50 transition-all"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Gunakan'}
          </button>
        </form>
      )}

      {/* Alert Messages */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-700">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Image Preview & Gallery List */}
      {currentImages.length > 0 && (
        <div className="mt-3 space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {multiple ? `Gambar Terpilih (${currentImages.length})` : 'Preview Gambar:'}
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {currentImages.map((imgUrl, idx) => (
              <div
                key={idx}
                className="group relative aspect-video sm:aspect-square overflow-hidden rounded-xl border border-surface-200 bg-surface-100 shadow-soft-sm"
              >
                <Image
                  src={imgUrl}
                  alt={`Preview ${idx + 1}`}
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover"
                />

                {/* Primary Thumbnail Badge */}
                {multiple && idx === 0 && (
                  <span className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded-md bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                    <Star className="h-2.5 w-2.5 fill-white" /> Utama
                  </span>
                )}

                {/* Overlay Action Buttons */}
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity p-2">
                  {multiple && idx > 0 && (
                    <button
                      type="button"
                      title="Jadikan Gambar Utama"
                      onClick={() => handleSetPrimary(idx)}
                      className="rounded-lg bg-white/90 p-1.5 text-slate-800 hover:bg-emerald-600 hover:text-white transition-colors"
                    >
                      <Star className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    title="Hapus Gambar"
                    onClick={() => handleRemove(idx)}
                    className="rounded-lg bg-rose-600 p-1.5 text-white hover:bg-rose-700 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
