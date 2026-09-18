'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Phone, Mail, MapPin, Building2, Package,
  BarChart3, Calendar, Clock, AlertCircle, CheckCircle2,
  User, Tag, Edit3, MessageCircle, PhoneCall, Video,
  FileText, Cpu, Trash2, Loader2, Plus, ExternalLink,
} from 'lucide-react';

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

type LeadStatus = 'BARU' | 'DIHUBUNGI' | 'SAMPEL_DIKIRIM' | 'NEGOSIASI' | 'DEAL' | 'BATAL';
type CustomerType = 'PROSPECT' | 'CUSTOMER';
type InteractionType = 'CALL' | 'WHATSAPP' | 'EMAIL' | 'MEETING' | 'SITE_VISIT' | 'NOTE' | 'SYSTEM';

interface Interaction {
  id: string;
  type: InteractionType;
  summary: string;
  actorId: string | null;
  actorName: string;
  relatedOrderId: string | null;
  createdAt: string;
  actor?: { id: string; name: string; role: string } | null;
}

interface OrderSummary {
  id: string;
  orderCode: string;
  status: string;
  total: number;
  itemsCount: number;
  createdAt: string;
}

interface CustomerDetail {
  id: string;
  name: string;
  company: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  type: CustomerType;
  status: LeadStatus;
  preferredCommodity: string | null;
  estimatedVolume: string | null;
  notes: string | null;
  totalOrders: number;
  totalSpent: number;
  lastContactAt: string | null;
  nextFollowUpAt: string | null;
  assignedToId: string | null;
  assignedTo: { id: string; name: string; email: string; role: string } | null;
  tags: string[] | null;
  orders: OrderSummary[];
  interactions: Interaction[];
  createdAt: string;
  updatedAt: string;
}

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<LeadStatus, { label: string; bg: string; text: string }> = {
  BARU:           { label: 'Baru',           bg: 'bg-blue-100',   text: 'text-blue-800'   },
  DIHUBUNGI:      { label: 'Dihubungi',      bg: 'bg-yellow-100', text: 'text-yellow-800' },
  SAMPEL_DIKIRIM: { label: 'Sampel Dikirim', bg: 'bg-purple-100', text: 'text-purple-800' },
  NEGOSIASI:      { label: 'Negosiasi',      bg: 'bg-orange-100', text: 'text-orange-800' },
  DEAL:           { label: 'Deal ✓',         bg: 'bg-green-100',  text: 'text-green-800'  },
  BATAL:          { label: 'Batal',          bg: 'bg-gray-100',   text: 'text-gray-500'   },
};

const ORDER_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  PENDING_PAYMENT:      { label: 'Menunggu Bayar',   bg: 'bg-yellow-100', text: 'text-yellow-800' },
  PENDING_VERIFICATION: { label: 'Verifikasi',        bg: 'bg-blue-100',   text: 'text-blue-800'   },
  PAID:                 { label: 'Lunas',             bg: 'bg-green-100',  text: 'text-green-800'  },
  PROCESSING:           { label: 'Diproses',          bg: 'bg-indigo-100', text: 'text-indigo-800' },
  SHIPPED:              { label: 'Dikirim',           bg: 'bg-purple-100', text: 'text-purple-800' },
  COMPLETED:            { label: 'Selesai',           bg: 'bg-green-100',  text: 'text-green-800'  },
  REJECTED:             { label: 'Ditolak',           bg: 'bg-red-100',    text: 'text-red-800'    },
  CANCELLED:            { label: 'Dibatalkan',        bg: 'bg-gray-100',   text: 'text-gray-500'   },
};

const INTERACTION_ICONS: Record<InteractionType, React.ReactNode> = {
  CALL:       <PhoneCall className="w-4 h-4" />,
  WHATSAPP:   <MessageCircle className="w-4 h-4" />,
  EMAIL:      <Mail className="w-4 h-4" />,
  MEETING:    <Video className="w-4 h-4" />,
  SITE_VISIT: <MapPin className="w-4 h-4" />,
  NOTE:       <FileText className="w-4 h-4" />,
  SYSTEM:     <Cpu className="w-4 h-4" />,
};

const INTERACTION_TYPE_LABELS: Record<InteractionType, string> = {
  CALL:       'Telepon',
  WHATSAPP:   'WhatsApp',
  EMAIL:      'Email',
  MEETING:    'Meeting',
  SITE_VISIT: 'Kunjungan',
  NOTE:       'Catatan',
  SYSTEM:     'Sistem',
};

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
}

function formatDate(iso: string | null) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} menit lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} jam lalu`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} hari lalu`;
  return formatDate(iso);
}

function getOverdueDays(iso: string | null) {
  if (!iso) return 0;
  const diff = Date.now() - new Date(iso).getTime();
  return Math.floor(diff / 86400000);
}

// ──────────────────────────────────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────────────────────────────────

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Interaction form state
  const [intType, setIntType] = useState<InteractionType>('WHATSAPP');
  const [intSummary, setIntSummary] = useState('');
  const [intOrderId, setIntOrderId] = useState('');
  const [submittingInt, setSubmittingInt] = useState(false);
  const [intSuccess, setIntSuccess] = useState('');
  const [intError, setIntError] = useState('');
  const [deletingIntId, setDeletingIntId] = useState<string | null>(null);

  // Auto-save PIC state
  const [picSaving, setPicSaving] = useState(false);
  const [picSuccess, setPicSuccess] = useState(false);

  // Staff list for PIC dropdown
  const [staffList, setStaffList] = useState<StaffUser[]>([]);

  // Follow-up date edit
  const [followUpInput, setFollowUpInput] = useState('');
  const [savingFollowUp, setSavingFollowUp] = useState(false);

  // Session
  const [session, setSession] = useState<{ id: string; name: string; role: string } | null>(null);

  // Resolve params
  const [customerId, setCustomerId] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ id }) => setCustomerId(id));
  }, [params]);

  const fetchCustomer = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/pelanggan/${id}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal memuat data pelanggan');
      }
      const { data } = await res.json();
      setCustomer(data);
      setFollowUpInput(data.nextFollowUpAt ? data.nextFollowUpAt.substring(0, 10) : '');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!customerId) return;
    fetchCustomer(customerId);
    // Load staff list & session
    fetch('/api/admin/users').then(r => r.json()).then(d => setStaffList(d.data || [])).catch(() => {});
    fetch('/api/admin/auth/me').then(r => r.json()).then(d => setSession(d.user || null)).catch(() => {});
  }, [customerId, fetchCustomer]);

  // ── Auto-save PIC ──────────────────────────────────────────────────────────
  const handlePicChange = async (assignedToId: string) => {
    if (!customerId || !customer) return;
    setPicSaving(true);
    setPicSuccess(false);
    try {
      const res = await fetch(`/api/admin/pelanggan/${customerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedToId: assignedToId || null }),
      });
      if (!res.ok) throw new Error('Gagal menyimpan');
      const { data } = await res.json();
      setCustomer(prev => prev ? { ...prev, assignedToId: data.assignedToId, assignedTo: data.assignedTo } : prev);
      setPicSuccess(true);
      setTimeout(() => setPicSuccess(false), 2000);
    } catch {
      // silently fail — shown on next reload
    } finally {
      setPicSaving(false);
    }
  };

  // ── Save follow-up date ────────────────────────────────────────────────────
  const handleSaveFollowUp = async () => {
    if (!customerId) return;
    setSavingFollowUp(true);
    try {
      const res = await fetch(`/api/admin/pelanggan/${customerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nextFollowUpAt: followUpInput || null }),
      });
      if (!res.ok) throw new Error('Gagal menyimpan');
      const { data } = await res.json();
      setCustomer(prev => prev ? { ...prev, nextFollowUpAt: data.nextFollowUpAt } : prev);
    } finally {
      setSavingFollowUp(false);
    }
  };

  // ── Add Interaction ────────────────────────────────────────────────────────
  const handleAddInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) return;
    setSubmittingInt(true);
    setIntError('');
    setIntSuccess('');
    try {
      const res = await fetch(`/api/admin/pelanggan/${customerId}/interaksi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: intType, summary: intSummary, relatedOrderId: intOrderId || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan');
      // Prepend new interaction to top
      setCustomer(prev => prev ? { ...prev, interactions: [data.data, ...prev.interactions] } : prev);
      setIntSummary('');
      setIntOrderId('');
      setIntSuccess('Catatan interaksi berhasil disimpan');
      setTimeout(() => setIntSuccess(''), 3000);
    } catch (e: any) {
      setIntError(e.message);
    } finally {
      setSubmittingInt(false);
    }
  };

  // ── Delete Interaction ─────────────────────────────────────────────────────
  const handleDeleteInteraction = async (interactionId: string) => {
    if (!confirm('Hapus catatan interaksi ini?')) return;
    if (!customerId) return;
    setDeletingIntId(interactionId);
    try {
      const res = await fetch(`/api/admin/pelanggan/${customerId}/interaksi/${interactionId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus');
      setCustomer(prev => prev ? { ...prev, interactions: prev.interactions.filter(i => i.id !== interactionId) } : prev);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setDeletingIntId(null);
    }
  };

  // ── Render States ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-lg mx-auto mt-12 bg-red-50 border border-red-200 rounded-xl text-center">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
        <p className="text-red-700 font-medium mb-4">{error}</p>
        <button
          onClick={() => customerId && fetchCustomer(customerId)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  if (!customer) return null;

  const statusConf = STATUS_CONFIG[customer.status];
  const overdueDays = getOverdueDays(customer.nextFollowUpAt);
  const isOverdue = customer.nextFollowUpAt && overdueDays > 0 && !['DEAL', 'BATAL'].includes(customer.status);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link
            href="/admin/pelanggan"
            className="mt-1 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Kembali ke daftar pelanggan"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
            {customer.company && (
              <p className="text-gray-500 flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-4 h-4" /> {customer.company}
              </p>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${customer.type === 'CUSTOMER' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                {customer.type === 'CUSTOMER' ? 'Customer' : 'Prospek'}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConf.bg} ${statusConf.text}`}>
                {statusConf.label}
              </span>
              {customer.tags && (customer.tags as string[]).map((tag: string) => (
                <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                  <Tag className="w-3 h-3" /> {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2 sm:flex-shrink-0">
          {customer.phone && (
            <a
              href={`https://wa.me/${customer.phone}?text=${encodeURIComponent(`Halo ${customer.name}, saya dari tim pengadaan kami.`)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
              aria-label="Chat WhatsApp"
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
          )}
          <Link
            href={`/admin/pelanggan?edit=${customer.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
            aria-label="Edit data kontak"
          >
            <Edit3 className="w-4 h-4" /> Edit
          </Link>
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <BarChart3 className="w-5 h-5 text-blue-500" />, label: 'Total Pesanan', value: customer.totalOrders.toString() },
          { icon: <Package className="w-5 h-5 text-emerald-500" />, label: 'Total Belanja (LTV)', value: formatRupiah(customer.totalSpent) },
          { icon: <Clock className="w-5 h-5 text-purple-500" />, label: 'Kontak Terakhir', value: formatDate(customer.lastContactAt) },
          {
            icon: <Calendar className="w-5 h-5 text-orange-500" />,
            label: 'Follow-up Berikutnya',
            value: customer.nextFollowUpAt ? formatDate(customer.nextFollowUpAt) : '-',
            extra: isOverdue ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 font-medium mt-1">
                <AlertCircle className="w-3 h-3" /> Terlewat {overdueDays} hari
              </span>
            ) : null,
          },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">{card.icon}<span className="text-xs text-gray-500">{card.label}</span></div>
            <p className="text-sm font-semibold text-gray-900 truncate">{card.value}</p>
            {card.extra}
          </div>
        ))}
      </div>

      {/* ── Info Kontak & PIC ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Informasi Kontak & Penanggung Jawab</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <InfoRow icon={<Phone className="w-4 h-4" />} label="Telepon" value={customer.phone} />
          <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={customer.email || '-'} />
          <InfoRow icon={<MapPin className="w-4 h-4" />} label="Alamat" value={customer.address || '-'} />
          <InfoRow icon={<Package className="w-4 h-4" />} label="Komoditas Minat" value={customer.preferredCommodity || '-'} />
          <InfoRow icon={<BarChart3 className="w-4 h-4" />} label="Estimasi Volume" value={customer.estimatedVolume || '-'} />
          <div>
            <label htmlFor="pic-select" className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
              <User className="w-4 h-4" /> PIC Penanggung Jawab
            </label>
            <div className="flex items-center gap-2">
              <select
                id="pic-select"
                value={customer.assignedToId || ''}
                onChange={(e) => handlePicChange(e.target.value)}
                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                aria-label="Pilih PIC penanggung jawab"
              >
                <option value="">— Belum ditentukan —</option>
                {staffList.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                ))}
              </select>
              {picSaving && <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />}
              {picSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            </div>
          </div>
          <div>
            <label htmlFor="followup-date" className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
              <Calendar className="w-4 h-4" /> Jadwal Follow-up
            </label>
            <div className="flex items-center gap-2">
              <input
                id="followup-date"
                type="date"
                value={followUpInput}
                onChange={(e) => setFollowUpInput(e.target.value)}
                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                aria-label="Tanggal follow-up berikutnya"
              />
              <button
                onClick={handleSaveFollowUp}
                disabled={savingFollowUp}
                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-60 flex items-center gap-1"
                aria-label="Simpan jadwal follow-up"
              >
                {savingFollowUp ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
        {customer.notes && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-700 border border-gray-100">
            <span className="font-medium text-gray-500 text-xs">Catatan:</span>
            <p className="mt-1 whitespace-pre-wrap">{customer.notes}</p>
          </div>
        )}
      </div>

      {/* ── 2-column desktop / accordion mobile ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Riwayat Transaksi */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-600" /> Riwayat Transaksi
          </h2>
          {customer.orders.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Kontak ini belum pernah melakukan transaksi.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(customer.orders || []).map(order => {
                const oConf = ORDER_STATUS_CONFIG[order.status] || { label: order.status, bg: 'bg-gray-100', text: 'text-gray-700' };
                return (
                  <Link
                    key={order.id}
                    href={`/admin/pesanan/${order.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50 transition-colors group"
                    aria-label={`Lihat pesanan ${order.orderCode}`}
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 group-hover:text-emerald-700 flex items-center gap-1">
                        {order.orderCode} <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                      </p>
                      <p className="text-xs text-gray-400">{formatDate(order.createdAt)} · {order.itemsCount} item</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{formatRupiah(order.total)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${oConf.bg} ${oConf.text}`}>{oConf.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Riwayat Interaksi */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-blue-600" /> Riwayat Interaksi
          </h2>

          {/* Form tambah interaksi — di atas timeline */}
          <form onSubmit={handleAddInteraction} className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="int-type" className="block text-xs font-medium text-gray-600 mb-1">Tipe Interaksi</label>
                <select
                  id="int-type"
                  value={intType}
                  onChange={e => setIntType(e.target.value as InteractionType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  aria-label="Pilih tipe interaksi"
                >
                  {(['CALL','WHATSAPP','EMAIL','MEETING','SITE_VISIT','NOTE'] as InteractionType[]).map(t => (
                    <option key={t} value={t}>{INTERACTION_TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="int-order" className="block text-xs font-medium text-gray-600 mb-1">Terkait Pesanan (opsional)</label>
                <select
                  id="int-order"
                  value={intOrderId}
                  onChange={e => setIntOrderId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  aria-label="Pilih pesanan terkait"
                >
                  <option value="">— Tidak ada —</option>
                  {(customer.orders || []).map(o => (
                    <option key={o.id} value={o.id}>{o.orderCode}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="int-summary" className="block text-xs font-medium text-gray-600 mb-1">
                Ringkasan <span className="text-gray-400">({intSummary.length} karakter)</span>
              </label>
              <textarea
                id="int-summary"
                value={intSummary}
                onChange={e => setIntSummary(e.target.value)}
                rows={3}
                required
                minLength={5}
                placeholder="Tuliskan ringkasan interaksi..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500"
                aria-label="Ringkasan interaksi"
              />
            </div>
            {intError && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{intError}</p>}
            {intSuccess && <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />{intSuccess}</p>}
            <button
              type="submit"
              disabled={submittingInt}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
              aria-label="Simpan catatan interaksi"
            >
              {submittingInt ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Simpan Catatan
            </button>
          </form>

          {/* Timeline */}
          {(customer.interactions || []).length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <FileText className="w-7 h-7 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Belum ada catatan interaksi. Tambahkan catatan pertama.</p>
            </div>
          ) : (
            <div className="relative space-y-3 before:absolute before:left-[18px] before:top-0 before:bottom-0 before:w-0.5 before:bg-gray-100">
              {(customer.interactions || []).map(interaction => {
                const isSystem = interaction.type === 'SYSTEM';
                const canDelete = !isSystem && session && (session.role === 'SUPERADMIN' || session.id === interaction.actorId);
                return (
                  <div key={interaction.id} className="flex gap-3 pl-1 relative">
                    <div className={`relative z-10 flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${isSystem ? 'bg-gray-100 text-gray-400' : 'bg-blue-100 text-blue-600'}`}>
                      {INTERACTION_ICONS[interaction.type]}
                    </div>
                    <div className={`flex-1 rounded-xl p-3 text-sm border ${isSystem ? 'bg-gray-50 border-gray-100 text-gray-500' : 'bg-white border-gray-200'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium text-xs text-gray-600">{INTERACTION_TYPE_LABELS[interaction.type]}</span>
                          {isSystem && <span className="text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded font-medium">Sistem</span>}
                        </div>
                        {canDelete && (
                          <button
                            onClick={() => handleDeleteInteraction(interaction.id)}
                            disabled={deletingIntId === interaction.id}
                            className="flex-shrink-0 p-1 text-gray-300 hover:text-red-500 transition-colors disabled:opacity-50"
                            aria-label="Hapus interaksi ini"
                          >
                            {deletingIntId === interaction.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                      <p className="mt-1 text-gray-700 leading-relaxed whitespace-pre-wrap">{interaction.summary}</p>
                      <p className="mt-1.5 text-xs text-gray-400">
                        {interaction.actorName} · {timeAgo(interaction.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Sub-component
// ──────────────────────────────────────────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-400 flex items-center gap-1 mb-0.5">{icon}{label}</div>
      <p className="text-sm text-gray-800">{value}</p>
    </div>
  );
}
