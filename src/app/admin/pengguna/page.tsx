'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  UserCheck,
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  ShieldAlert,
  Shield,
  Key,
  Mail,
  User,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'SUPERADMIN' | 'ADMIN';
  isActive: boolean; // Sesi #17 (Temuan J)
  createdAt: string;
}

export default function AdminPenggunaPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id?: string; role?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<'SUPERADMIN' | 'ADMIN'>('ADMIN');
  const [formPassword, setFormPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete modal state
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  // Sesi #17 (Temuan J): Status loading per-user untuk toggle isActive
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/users');
      const json = await res.json();

      if (res.ok && json.success) {
        setUsers(json.data);
      } else {
        setError(json.error || 'Gagal memuat daftar pengguna.');
      }
    } catch {
      setError('Terjadi kendala jaringan saat memuat daftar pengguna.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Sesi #19 (Fix #3): Guard RBAC di layer halaman — defense-in-depth.
    // Middleware + requireSuperAdminSession di API sudah benar, ini layer tambahan
    // agar ADMIN biasa tidak melihat shell halaman bahkan sebelum API dipanggil.
    fetch('/api/admin/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.user) {
          window.location.href = '/admin/login';
          return;
        }
        if (data.user.role !== 'SUPERADMIN') {
          window.location.href = '/admin/dashboard';
          return;
        }
        setCurrentUser(data.user);
        fetchUsers();
      })
      .catch(() => {
        window.location.href = '/admin/login';
      });
  }, []);


  const openAddModal = () => {
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormRole('ADMIN');
    setFormPassword('');
    setError(null);
    setSuccess(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user: AdminUser) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormRole(user.role);
    setFormPassword('');
    setError(null);
    setSuccess(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formName.trim() || !formEmail.trim()) {
      setError('Nama lengkap dan email wajib diisi.');
      return;
    }

    if (!editingUser && (!formPassword || formPassword.length < 8)) {
      setError('Kata sandi awal wajib diisi minimal 8 karakter.');
      return;
    }

    if (editingUser && formPassword && formPassword.length < 8) {
      setError('Kata sandi baru minimal 8 karakter.');
      return;
    }

    setSubmitting(true);

    try {
      if (editingUser) {
        // Edit User
        const payload: any = {
          name: formName.trim(),
          email: formEmail.trim(),
          role: formRole,
        };
        if (formPassword) {
          payload.password = formPassword;
        }

        const res = await fetch(`/api/admin/users/${editingUser.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Gagal memperbarui akun pengguna.');

        setSuccess(json.message || 'Akun admin berhasil diperbarui.');
        setIsModalOpen(false);
        fetchUsers();
      } else {
        // Add New User
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName.trim(),
            email: formEmail.trim(),
            role: formRole,
            password: formPassword,
          }),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Gagal menambahkan staf admin baru.');

        setSuccess(json.message || 'Staf admin berhasil ditambahkan.');
        setIsModalOpen(false);
        fetchUsers();
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/admin/users/${deletingUser.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || 'Gagal menghapus pengguna.');

      setSuccess(`Akun admin ${deletingUser.name} berhasil dihapus.`);
      setDeletingUser(null);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus akun pengguna.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Sesi #17 (Temuan J): Toggle status aktif/nonaktif staf
  const handleToggleActive = async (u: AdminUser) => {
    if (currentUser?.id === u.id) return; // Proteksi self-deactivation
    setTogglingId(u.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !u.isActive }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal mengubah status akun.');
      setSuccess(`Akun ${u.name} berhasil ${!u.isActive ? 'diaktifkan' : 'dinonaktifkan'}.`);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Gagal mengubah status akun.');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 sm:px-8 py-3.5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/dashboard"
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="font-bold text-white text-sm flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-emerald-400" />
                Manajemen Admin &amp; Staf Portal
              </h1>
              <p className="text-[11px] text-slate-400">
                Atur hak akses operasional (SUPERADMIN &amp; ADMIN) dan kredensial tim
              </p>
            </div>
          </div>

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-soft-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah Admin Baru</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-8 pt-6 space-y-6">
        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 animate-in fade-in">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Roles Policy Explainer Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-soft-sm flex items-start gap-3.5">
            <div className="rounded-xl bg-rose-500/10 p-2.5 text-rose-400 shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                Role SUPERADMIN
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Akses tingkat tertinggi: Kelola akun admin, konfigurasi rekening bank transfer, pengaturan kontak CS, integrasi sistem, dan manajemen komoditas menyeluruh.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-soft-sm flex items-start gap-3.5">
            <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400 shrink-0">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                Role ADMIN (Operasional)
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Akses operasional harian: Verifikasi bukti bayar, proses resi pengiriman, kelola katalog komoditas &amp; stok, CRM leads pembeli, dan publikasi artikel.
              </p>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-soft-md">
          <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Daftar Akun Pengguna Terdaftar ({users.length})
            </h2>
            <span className="text-[11px] text-slate-500">
              RBAC Aktif &bull; Sesi Aman JOSE JWT
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
              <p className="text-xs">Memuat data akun admin...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              Belum ada akun admin terdaftar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-slate-900/80 font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-5 py-3.5">Nama Staf / Pejabat</th>
                    <th className="px-5 py-3.5">Email Akun</th>
                    <th className="px-5 py-3.5">Tingkat Hak Akses</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Terdaftar Sejak</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {users.map((u) => {
                    const isSelf = currentUser?.id === u.id;

                    return (
                      <tr
                        key={u.id}
                        className={`hover:bg-slate-800/40 transition-colors ${!u.isActive ? 'opacity-60' : ''}`}
                      >
                        <td className="px-5 py-4">
                          <div className="font-bold text-white flex items-center gap-2">
                            <span>{u.name}</span>
                            {isSelf && (
                              <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold">
                                Anda
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 font-mono text-slate-300">
                          {u.email}
                        </td>
                        <td className="px-5 py-4">
                          {u.role === 'SUPERADMIN' ? (
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 text-[11px] font-bold text-rose-300">
                              <ShieldAlert className="h-3 w-3" />
                              SUPERADMIN
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
                              <Shield className="h-3 w-3" />
                              ADMIN
                            </span>
                          )}
                        </td>
                        {/* Sesi #17 (Temuan J): Kolom Status Aktif */}
                        <td className="px-5 py-4">
                          {u.isActive ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-bold text-emerald-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-700/50 border border-slate-600/50 px-2.5 py-1 text-[11px] font-bold text-slate-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                              Nonaktif
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-slate-400 whitespace-nowrap">
                          {formatDate(u.createdAt)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            {/* Toggle Aktif/Nonaktif */}
                            <button
                              onClick={() => handleToggleActive(u)}
                              disabled={isSelf || togglingId === u.id}
                              className={`rounded-lg border p-1.5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                                u.isActive
                                  ? 'border-amber-600/50 bg-amber-600/10 text-amber-400 hover:bg-amber-600/20'
                                  : 'border-emerald-600/50 bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600/20'
                              }`}
                              title={isSelf ? 'Tidak dapat mengubah status akun sendiri' : u.isActive ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                            >
                              {togglingId === u.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : u.isActive ? (
                                <ToggleRight className="h-3.5 w-3.5" />
                              ) : (
                                <ToggleLeft className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => openEditModal(u)}
                              className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-300 hover:border-emerald-500 hover:text-white transition-colors"
                              title="Ubah Data / Kata Sandi"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingUser(u)}
                              disabled={isSelf}
                              className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-rose-400 hover:border-rose-500 hover:bg-rose-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title={isSelf ? 'Tidak dapat menghapus akun sendiri' : 'Hapus Akun'}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-7 shadow-soft-xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-emerald-400" />
                {editingUser ? 'Perbarui Akun Admin' : 'Tambah Staf Admin Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  Nama Lengkap <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  Alamat Email (Login) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="budi@Adably.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-slate-400" />
                  Tingkat Hak Akses (Role) <span className="text-rose-400">*</span>
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as 'SUPERADMIN' | 'ADMIN')}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="ADMIN">ADMIN (Operasional &amp; Katalog)</option>
                  <option value="SUPERADMIN">SUPERADMIN (Kendali Penuh &amp; Pengaturan Rekening)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-slate-400" />
                  Kata Sandi {editingUser ? '(Kosongkan jika tidak diubah)' : <span className="text-rose-400">*</span>}
                </label>
                <input
                  type="password"
                  placeholder={editingUser ? 'Minimal 8 karakter (opsional)' : 'Minimal 8 karakter'}
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{editingUser ? 'Simpan Perubahan' : 'Daftarkan Akun'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-soft-xl animate-in zoom-in-95 duration-200 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 mb-4">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-white text-sm">Hapus Akun Pengguna?</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Apakah Anda yakin ingin menghapus akses untuk{' '}
              <strong className="text-white">{deletingUser.name}</strong> ({deletingUser.email})? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 transition-colors disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Ya, Hapus Akun</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
