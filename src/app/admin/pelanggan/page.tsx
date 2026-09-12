'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  Plus,
  Search,
  Filter,
  Download,
  Phone,
  Mail,
  Building2,
  MapPin,
  Pencil,
  Trash2,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Send,
  MessageSquare,
  TrendingUp,
  Sparkles,
  Package,
  Calendar,
  DollarSign,
  ExternalLink,
  Tag,
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

export interface CustomerItem {
  id: string;
  name: string;
  company?: string | null;
  email?: string | null;
  phone: string;
  address?: string | null;
  type: 'PROSPECT' | 'CUSTOMER';
  status: 'BARU' | 'DIHUBUNGI' | 'SAMPEL_DIKIRIM' | 'NEGOSIASI' | 'DEAL' | 'BATAL';
  source: string;
  preferredCommodity?: string | null;
  estimatedVolume?: string | null;
  notes?: string | null;
  totalOrders: number;
  totalSpent: number;
  lastContactAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_CONFIG: Record<
  CustomerItem['status'],
  { label: string; badgeClass: string; dotClass: string }
> = {
  BARU: {
    label: 'Prospek Baru',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    dotClass: 'bg-purple-500',
  },
  DIHUBUNGI: {
    label: 'Sudah Dihubungi',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    dotClass: 'bg-blue-500',
  },
  SAMPEL_DIKIRIM: {
    label: 'Sampel Lab Dikirim',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    dotClass: 'bg-amber-500',
  },
  NEGOSIASI: {
    label: 'Tahap Negosiasi',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
    dotClass: 'bg-orange-500',
  },
  DEAL: {
    label: 'Deal / Closing',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  BATAL: {
    label: 'Batal / Pending',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
    dotClass: 'bg-slate-400',
  },
};

export default function AdminPelangganPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'ALL' | 'PROSPECT' | 'CUSTOMER'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal Add / Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formType, setFormType] = useState<'PROSPECT' | 'CUSTOMER'>('PROSPECT');
  const [formStatus, setFormStatus] = useState<CustomerItem['status']>('BARU');
  const [formSource, setFormSource] = useState('MANUAL_ADMIN');
  const [formCommodity, setFormCommodity] = useState('');
  const [formVolume, setFormVolume] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Delete State
  const [deletingCustomer, setDeletingCustomer] = useState<CustomerItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/pelanggan');
      const json = await res.json();
      if (json.success) {
        setCustomers(json.data);
      } else {
        throw new Error(json.error || 'Gagal memuat data');
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal mengambil data pelanggan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Filtered List
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (selectedType !== 'ALL' && c.type !== selectedType) return false;
      if (selectedStatus !== 'ALL' && c.status !== selectedStatus) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = c.name?.toLowerCase().includes(q);
        const matchesCompany = c.company?.toLowerCase().includes(q);
        const matchesPhone = c.phone?.includes(q);
        const matchesEmail = c.email?.toLowerCase().includes(q);
        const matchesCommodity = c.preferredCommodity?.toLowerCase().includes(q);
        const matchesNotes = c.notes?.toLowerCase().includes(q);
        if (!matchesName && !matchesCompany && !matchesPhone && !matchesEmail && !matchesCommodity && !matchesNotes) {
          return false;
        }
      }
      return true;
    });
  }, [customers, selectedType, selectedStatus, searchQuery]);

  // Metric Computations
  const totalCount = customers.length;
  const newProspectsCount = customers.filter((c) => c.status === 'BARU').length;
  const inNegotiationCount = customers.filter(
    (c) => c.status === 'NEGOSIASI' || c.status === 'SAMPEL_DIKIRIM'
  ).length;
  const dealCustomersCount = customers.filter((c) => c.status === 'DEAL' || c.type === 'CUSTOMER').length;
  const totalLtv = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);

  // Open Create Modal
  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormName('');
    setFormPhone('');
    setFormCompany('');
    setFormEmail('');
    setFormAddress('');
    setFormType('PROSPECT');
    setFormStatus('BARU');
    setFormSource('MANUAL_ADMIN');
    setFormCommodity('');
    setFormVolume('');
    setFormNotes('');
    setError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (c: CustomerItem) => {
    setEditingCustomer(c);
    setFormName(c.name || '');
    setFormPhone(c.phone || '');
    setFormCompany(c.company || '');
    setFormEmail(c.email || '');
    setFormAddress(c.address || '');
    setFormType(c.type || 'PROSPECT');
    setFormStatus(c.status || 'BARU');
    setFormSource(c.source || 'MANUAL_ADMIN');
    setFormCommodity(c.preferredCommodity || '');
    setFormVolume(c.estimatedVolume || '');
    setFormNotes(c.notes || '');
    setError(null);
    setIsModalOpen(true);
  };

  // Save (Create or Update)
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) {
      setError('Nama kontak dan Nomor WhatsApp wajib diisi.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload = {
      name: formName.trim(),
      phone: formPhone.trim(),
      company: formCompany.trim() || null,
      email: formEmail.trim() || null,
      address: formAddress.trim() || null,
      type: formType,
      status: formStatus,
      source: formSource,
      preferredCommodity: formCommodity.trim() || null,
      estimatedVolume: formVolume.trim() || null,
      notes: formNotes.trim() || null,
    };

    try {
      if (editingCustomer) {
        // Update
        const res = await fetch(`/api/admin/pelanggan/${editingCustomer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal memperbarui data.');

        setSuccess('Data pelanggan berhasil diperbarui.');
      } else {
        // Create
        const res = await fetch('/api/admin/pelanggan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal menambahkan kontak.');

        setSuccess('Kontak baru berhasil ditambahkan ke database.');
      }

      setIsModalOpen(false);
      fetchCustomers();
      setTimeout(() => setSuccess(null), 3500);
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Customer
  const handleDeleteCustomer = async () => {
    if (!deletingCustomer) return;
    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/pelanggan/${deletingCustomer.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus kontak.');

      setSuccess(`Kontak ${deletingCustomer.name} berhasil dihapus.`);
      setDeletingCustomer(null);
      fetchCustomers();
      setTimeout(() => setSuccess(null), 3500);
    } catch (err: any) {
      setError(err?.message || 'Gagal menghapus kontak.');
    } finally {
      setDeleting(false);
    }
  };

  // Helper WhatsApp Direct Chat URL
  const getWhatsAppChatUrl = (customer: CustomerItem) => {
    let clean = customer.phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
    const greeting = customer.company
      ? `Halo Bapak/Ibu ${customer.name} (${customer.company}), salam hangat dari Tim Adably.`
      : `Halo Bapak/Ibu ${customer.name}, salam hangat dari Tim Adably.`;

    const topic = customer.preferredCommodity
      ? ` Kami ingin menindaklanjuti perihal pengadaan komoditas ${customer.preferredCommodity}. Apakah spesifikasi & kuotasinya sudah sesuai kebutuhan pabrik Anda?`
      : ` Kami ingin menindaklanjuti kebutuhan komoditas mineral tambang & hasil alam Anda. Ada yang bisa kami bantu?`;

    return `https://wa.me/${clean}?text=${encodeURIComponent(greeting + topic)}`;
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* Header Bar */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link
                href="/admin/dashboard"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">
                    Database Pelanggan & CRM Leads
                  </h1>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                    B2B Mineral
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Pusat follow-up prospek RFQ, manajemen kontak calon pembeli, & riwayat belanja
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2.5">
              <a
                href="/api/admin/pelanggan/export"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
              >
                <Download className="h-3.5 w-3.5 text-slate-500" />
                <span>Ekspor CSV</span>
              </a>

              <button
                type="button"
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-soft-sm transition-all active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah Kontak Baru</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Toast / Alerts */}
        {error && (
          <div className="flex items-start gap-2.5 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-700 shadow-sm">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1 font-medium">{error}</div>
            <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-800 shadow-sm">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
            <div className="flex-1 font-medium">{success}</div>
            <button onClick={() => setSuccess(null)} className="text-emerald-500 hover:text-emerald-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Metric Cards Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft-sm">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Database</span>
              <Users className="h-4 w-4 text-slate-400" />
            </div>
            <p className="text-2xl font-black text-slate-900">{totalCount}</p>
            <span className="text-[10px] text-slate-400">Seluruh kontak tercatat</span>
          </div>

          <div className="rounded-2xl border border-purple-200/80 bg-purple-50/40 p-4 shadow-soft-sm">
            <div className="flex items-center justify-between text-purple-700 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Prospek Baru</span>
              <Sparkles className="h-4 w-4 text-purple-600" />
            </div>
            <p className="text-2xl font-black text-purple-900">{newProspectsCount}</p>
            <span className="text-[10px] text-purple-600 font-medium">Perlu segera dihubungi</span>
          </div>

          <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4 shadow-soft-sm">
            <div className="flex items-center justify-between text-amber-700 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Dalam Progres</span>
              <MessageSquare className="h-4 w-4 text-amber-600" />
            </div>
            <p className="text-2xl font-black text-amber-900">{inNegotiationCount}</p>
            <span className="text-[10px] text-amber-600 font-medium">Sampel / Negosiasi</span>
          </div>

          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4 shadow-soft-sm">
            <div className="flex items-center justify-between text-emerald-700 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Pelanggan Closing</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-900">{dealCustomersCount}</p>
            <span className="text-[10px] text-emerald-600 font-medium">Deal / Telah Checkout</span>
          </div>

          <div className="col-span-2 sm:col-span-2 lg:col-span-1 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft-sm">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Akumulasi Nilai LTV</span>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900 truncate">
              {formatRupiah(totalLtv)}
            </p>
            <span className="text-[10px] text-slate-400">Total belanja repeat order</span>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft-sm space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama kontak, nama perusahaan, WhatsApp, email, atau komoditas..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Type Tabs */}
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setSelectedType('ALL')}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  selectedType === 'ALL'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Semua ({customers.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedType('PROSPECT')}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  selectedType === 'PROSPECT'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Prospek ({customers.filter((c) => c.type === 'PROSPECT').length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedType('CUSTOMER')}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  selectedType === 'CUSTOMER'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Pelanggan ({customers.filter((c) => c.type === 'CUSTOMER').length})
              </button>
            </div>

            {/* Status Dropdown Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="ALL">Semua Status Follow-Up</option>
                <option value="BARU">Prospek Baru</option>
                <option value="DIHUBUNGI">Sudah Dihubungi</option>
                <option value="SAMPEL_DIKIRIM">Sampel Lab Dikirim</option>
                <option value="NEGOSIASI">Tahap Negosiasi</option>
                <option value="DEAL">Deal / Closing</option>
                <option value="BATAL">Batal / Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Customer Data Table */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-soft-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-slate-500 space-y-3">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />
              <p className="text-xs font-medium">Memuat database kontak...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <Users className="mx-auto h-12 w-12 text-slate-300" />
              <p className="text-sm font-bold text-slate-700">Tidak ada kontak yang sesuai filter</p>
              <p className="text-xs text-slate-400">
                Coba ubah kata kunci pencarian atau reset filter di atas.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedType('ALL');
                  setSelectedStatus('ALL');
                }}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Kontak & Perusahaan</th>
                    <th className="py-3.5 px-4">WhatsApp & Email</th>
                    <th className="py-3.5 px-4">Minat Komoditas</th>
                    <th className="py-3.5 px-4">Tipe & Status</th>
                    <th className="py-3.5 px-4">Riwayat Belanja</th>
                    <th className="py-3.5 px-4 text-right">Aksi & Follow-Up</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCustomers.map((c) => {
                    const statusInfo = STATUS_CONFIG[c.status] || STATUS_CONFIG.BARU;
                    const waUrl = getWhatsAppChatUrl(c);

                    return (
                      <tr
                        key={c.id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        {/* Name & Company */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 text-xs sm:text-sm">
                                {c.name}
                              </span>
                              {c.source && (
                                <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[9px] font-bold text-slate-500">
                                  {c.source.replace('_', ' ')}
                                </span>
                              )}
                            </div>
                            {c.company ? (
                              <div className="flex items-center gap-1 text-slate-600 text-[11px]">
                                <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
                                <span className="font-medium truncate max-w-[200px]">{c.company}</span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Perorangan / Mandiri</span>
                            )}
                            {c.address && (
                              <div className="flex items-center gap-1 text-slate-400 text-[10px]">
                                <MapPin className="h-2.5 w-2.5 shrink-0" />
                                <span className="truncate max-w-[220px]">{c.address}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Phone & Email */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Klik untuk chat WhatsApp langsung"
                                className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                              >
                                <Phone className="h-3 w-3 text-emerald-600" />
                                <span>{c.phone}</span>
                              </a>
                            </div>
                            {c.email ? (
                              <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                                <Mail className="h-2.5 w-2.5 text-slate-400" />
                                <span className="truncate max-w-[180px]">{c.email}</span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400">-</span>
                            )}
                          </div>
                        </td>

                        {/* Commodity & Volume */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            {c.preferredCommodity ? (
                              <span className="font-semibold text-slate-900 block truncate max-w-[190px]">
                                {c.preferredCommodity}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px] italic">Belum dispesifikasi</span>
                            )}
                            {c.estimatedVolume && (
                              <span className="inline-block rounded bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                                {c.estimatedVolume}
                              </span>
                            )}
                            {c.notes && (
                              <p className="text-[10px] text-slate-500 line-clamp-1 italic max-w-[200px]" title={c.notes}>
                                "{c.notes}"
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Type & Status Badges */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1.5">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${statusInfo.badgeClass}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dotClass}`} />
                              {statusInfo.label}
                            </span>
                            <div>
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                  c.type === 'CUSTOMER'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {c.type === 'CUSTOMER' ? 'Pelanggan' : 'Prospek Lead'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Total Orders & Spent */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <span className="font-extrabold text-slate-900 block">
                              {formatRupiah(c.totalSpent || 0)}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {c.totalOrders || 0} kali transaksi
                            </span>
                          </div>
                        </td>

                        {/* Row Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Sesi #20: Link ke halaman detail */}
                            <Link
                              href={`/admin/pelanggan/${c.id}`}
                              title="Lihat Profil Detail"
                              className="inline-flex items-center gap-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 px-2.5 py-1.5 text-xs font-bold transition-colors border border-blue-200"
                              aria-label={`Lihat detail kontak ${c.name}`}
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span className="hidden sm:inline">Detail</span>
                            </Link>

                            {/* Edit / Notes */}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(c)}
                              title="Edit Data & Catatan Sales"
                              className="rounded-xl border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => setDeletingCustomer(c)}
                              title="Hapus Kontak"
                              className="rounded-xl border border-slate-200 p-1.5 text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-colors"
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
      </div>

      {/* Modal Add / Edit Customer */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white border border-slate-200 shadow-2xl transition-all"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-6 py-4 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    {editingCustomer ? 'Perbarui Data & Catatan Prospek' : 'Tambah Kontak Baru Manual'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingCustomer ? `ID: ${editingCustomer.id}` : 'Tambahkan prospek pameran, telepon, atau kontak relasi'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCustomer} className="p-6 space-y-4">
              {error && (
                <div className="flex items-start gap-2.5 rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Kontak / PIC <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: Ir. Bambang Sudiro"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* WhatsApp */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor WhatsApp / HP <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="Contoh: 081298765432"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Company */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Perusahaan / Pabrik
                  </label>
                  <input
                    type="text"
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    placeholder="Contoh: PT Semen Perkasa Nusantara"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Bisnis
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="Contoh: procurement@perusahaan.co.id"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Klasifikasi Akun
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="PROSPECT">PROSPEK (Calon Pembeli / Lead)</option>
                    <option value="CUSTOMER">PELANGGAN (Customer Aktif)</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status Follow-Up Sales
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="BARU">Prospek Baru Masuk</option>
                    <option value="DIHUBUNGI">Sudah Dihubungi Sales</option>
                    <option value="SAMPEL_DIKIRIM">Sampel Lab Sedang Dikirim</option>
                    <option value="NEGOSIASI">Tahap Pembahasan Harga / Kontrak</option>
                    <option value="DEAL">Deal / Closing Pesanan</option>
                    <option value="BATAL">Batal / Dibatalkan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Preferred Commodity */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Komoditas yang Diminati
                  </label>
                  <input
                    type="text"
                    value={formCommodity}
                    onChange={(e) => setFormCommodity(e.target.value)}
                    placeholder="Contoh: Zeolite Alam Mesh 80 / Bentonite"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Estimated Volume */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Estimasi Volume / Kebutuhan
                  </label>
                  <input
                    type="text"
                    value={formVolume}
                    onChange={(e) => setFormVolume(e.target.value)}
                    placeholder="Contoh: 50 Ton / Bulan atau FCL 40ft"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alamat Pabrik / Gudang / Kota
                </label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Contoh: Kawasan Industri Cilegon Blok M-4, Banten"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Source (for admin reference) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sumber Perolehan Kontak
                </label>
                <select
                  value={formSource}
                  onChange={(e) => setFormSource(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="MANUAL_ADMIN">Input Manual Admin</option>
                  <option value="OFFLINE_EXPO">Pameran / Expo Tambang</option>
                  <option value="WEBSITE_RFQ">Formulir RFQ Website</option>
                  <option value="CHECKOUT">Guest Checkout Transaksi</option>
                </select>
              </div>

              {/* Notes & Sales Log */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Negosiasi & Riwayat Follow-Up
                </label>
                <textarea
                  rows={3}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Tuliskan hasil pembicaraan, nomor resi pengiriman sampel, skema pembayaran yang dinegosiasikan, dll..."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-6 py-2.5 text-xs font-bold text-white shadow-soft-sm transition-all disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{editingCustomer ? 'Simpan Perubahan' : 'Tambahkan Kontak'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Delete Confirmation */}
      {deletingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
              <Trash2 className="h-6 w-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900">
                Hapus Kontak Pelanggan?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin menghapus data kontak{' '}
                <strong className="text-slate-900">{deletingCustomer.name}</strong>
                {deletingCustomer.company ? ` (${deletingCustomer.company})` : ''}? Data riwayat
                follow-up akan dihapus secara permanen.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCustomer(null)}
                disabled={deleting}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteCustomer}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-bold text-white shadow-soft-sm transition-all disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Ya, Hapus Kontak</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
