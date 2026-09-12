'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X,
  Save,
  Check,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  order: number;
  isActive: boolean;
}

export default function AdminFAQPage() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Form states
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const fetchFaqs = () => {
    fetch('/api/admin/faq')
      .then((res) => {
        if (res.status === 401) {
          router.push('/admin/login');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.faqs) {
          setFaqs(data.faqs);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching FAQs:', err);
        setErrorMsg('Gagal memuat daftar FAQ.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchFaqs();
  }, [router]);

  const openAddModal = () => {
    setEditingFaq(null);
    setQuestion('');
    setAnswer('');
    setOrder(faqs.length + 1);
    setIsActive(true);
    setErrorMsg('');
    setModalOpen(true);
  };

  const openEditModal = (faq: FAQItem) => {
    setEditingFaq(faq);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setOrder(faq.order);
    setIsActive(faq.isActive);
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) {
      setErrorMsg('Pertanyaan dan jawaban wajib diisi.');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      if (editingFaq) {
        // Update
        const res = await fetch(`/api/admin/faq/${editingFaq.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question, answer, order, isActive }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal memperbarui FAQ.');
        setSuccessMsg('FAQ berhasil diperbarui.');
      } else {
        // Create
        const res = await fetch('/api/admin/faq', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question, answer, order, isActive }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal menambahkan FAQ.');
        setSuccessMsg('FAQ baru berhasil ditambahkan.');
      }

      setModalOpen(false);
      fetchFaqs();
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat menyimpan.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (faq: FAQItem) => {
    try {
      const nextActive = !faq.isActive;
      const res = await fetch(`/api/admin/faq/${faq.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextActive }),
      });
      if (res.ok) {
        setFaqs((prev) =>
          prev.map((f) => (f.id === faq.id ? { ...f, isActive: nextActive } : f))
        );
      }
    } catch (e) {
      console.error('Error toggling FAQ status:', e);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/admin/faq/${deleteId}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccessMsg('FAQ berhasil dihapus.');
        setDeleteModalOpen(false);
        setDeleteId(null);
        fetchFaqs();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Gagal menghapus FAQ.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menghapus FAQ.');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Memuat data FAQ...</p>
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
              <h1 className="text-base font-bold text-slate-900">Manajemen FAQ Dinamis</h1>
              <p className="text-xs text-slate-500">Kelola daftar tanya-jawab umum seputar komoditas mineral</p>
            </div>
          </div>

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-all shadow-soft-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah FAQ Baru</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        {/* Alerts */}
        {successMsg && (
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 shadow-soft-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg('')} className="text-emerald-600 hover:text-emerald-900">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 shadow-soft-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg('')} className="text-rose-600 hover:text-rose-900">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* FAQ Table */}
        <div className="overflow-hidden rounded-3xl border border-surface-200 bg-white shadow-soft-xs">
          <div className="border-b border-surface-200 bg-surface-50/50 p-4 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-700">
              Daftar Tanya Jawab ({faqs.length} Pertanyaan)
            </p>
            <Link
              href="/faq"
              target="_blank"
              className="text-xs font-bold text-emerald-700 hover:underline"
            >
              Lihat Halaman Publik &rarr;
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-surface-200 bg-surface-50 font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 w-16 text-center">Urutan</th>
                  <th className="px-4 py-3">Pertanyaan</th>
                  <th className="px-4 py-3">Cuplikan Jawaban</th>
                  <th className="px-4 py-3 w-28 text-center">Status</th>
                  <th className="px-4 py-3 w-28 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {faqs.map((f) => (
                  <tr key={f.id} className="hover:bg-surface-50/80 transition-colors">
                    <td className="px-4 py-3.5 text-center font-bold text-slate-700">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-surface-100 font-mono text-xs">
                        {f.order}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900 max-w-xs">
                      {f.question}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 max-w-md line-clamp-2">
                      {f.answer}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => toggleStatus(f)}
                        title={f.isActive ? 'Nonaktifkan FAQ' : 'Aktifkan FAQ'}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition-all ${
                          f.isActive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {f.isActive ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" /> Aktif
                          </>
                        ) : (
                          'Nonaktif'
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(f)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-surface-200 text-slate-600 hover:border-emerald-500 hover:text-emerald-700 transition-colors"
                          title="Edit FAQ"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteId(f.id);
                            setDeleteModalOpen(true);
                          }}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Hapus FAQ"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-soft-xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-surface-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingFaq ? 'Edit Tanya Jawab (FAQ)' : 'Tambah FAQ Baru'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-surface-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pertanyaan FAQ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Contoh: Apakah seluruh komoditas memiliki sertifikat COA?"
                  className="w-full rounded-xl border border-surface-200 bg-surface-50/50 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jawaban Lengkap <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Jelaskan jawaban secara rinci dan informatif..."
                  className="w-full rounded-xl border border-surface-200 bg-surface-50/50 p-3.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Urutan Tampil (Order)
                  </label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    min={0}
                    className="w-full rounded-xl border border-surface-200 bg-surface-50/50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status Publikasi
                  </label>
                  <label className="flex items-center gap-2 mt-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="h-4 w-4 rounded border-surface-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-medium text-slate-700">Tampilkan di Web Publik</span>
                  </label>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-surface-100 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-surface-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-surface-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-all shadow-soft-sm disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      <span>{editingFaq ? 'Simpan Perubahan' : 'Tambah FAQ'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-soft-xl">
            <h3 className="text-base font-bold text-slate-900">Hapus Tanya Jawab (FAQ)?</h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              FAQ yang dihapus tidak akan lagi muncul pada halaman publik. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="mt-5 flex justify-end gap-2.5">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="rounded-xl border border-surface-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-surface-50"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 transition-colors"
              >
                Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
