"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, FileText, Clock, CheckCircle, XCircle, AlertCircle, Filter, Search, RefreshCw, Inbox } from "lucide-react";

interface PengajuanWithRelations {
  id: string;
  status: string;
  created_at: string;
  user_id: string;
  profiles?: {
    email: string;
    full_name: string;
  };
  makam?: {
    deceased_name: string;
    blok: string;
    nomor: string;
  };
}

export default function AdminPengajuanPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pengajuanList, setPengajuanList] = useState<PengajuanWithRelations[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, revision: 0, rejected: 0 });
  const [filter, setFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError(null);
    
    try {
      const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!SUPABASE_URL || !SUPABASE_KEY) {
        setError("Konfigurasi Supabase tidak ditemukan");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      };

      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/pengajuan?select=*&order=created_at.desc`,
        { headers }
      );

      if (!res.ok) {
        const errorText = await res.text();
        setError(`Gagal memuat data: ${res.status}`);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const data = await res.json();
      
      if (!Array.isArray(data)) {
        setError("Format data tidak valid");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const userIds = [...new Set(data.map((p: any) => p.user_id).filter(Boolean))];
      let profilesMap: Record<string, {email: string, full_name: string}> = {};
      
      if (userIds.length > 0) {
        for (const userId of userIds) {
          const profilesRes = await fetch(
            `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=id,email,full_name`,
            { headers }
          );
          
          if (profilesRes.ok) {
            const profileData = await profilesRes.json();
            if (Array.isArray(profileData) && profileData.length > 0) {
              profilesMap[userId] = { 
                email: profileData[0].email, 
                full_name: profileData[0].full_name 
              };
            }
          }
        }
      }

      const enrichedData: PengajuanWithRelations[] = data.map(p => ({
        ...p,
        profiles: profilesMap[p.user_id] || null
      }));
      
      setPengajuanList(enrichedData);

      const pending = enrichedData.filter(p => p.status === 'PENDING' || p.status === 'WAITING_VERIFICATION').length;
      const approved = enrichedData.filter(p => p.status === 'APPROVED').length;
      const revision = enrichedData.filter(p => p.status === 'REVISION' || p.status === 'NEED_REVISION').length;
      const rejected = enrichedData.filter(p => p.status === 'REJECTED').length;
      
      setStats({
        total: enrichedData.length,
        pending,
        approved,
        revision,
        rejected
      });

      setLoading(false);
      setRefreshing(false);
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredList = pengajuanList.filter(p => {
    const matchesFilter = filter ? (p.status === filter || 
      (filter === 'PENDING' && p.status === 'WAITING_VERIFICATION') ||
      (filter === 'REVISION' && p.status === 'NEED_REVISION')) : true;
    const matchesSearch = searchQuery 
      ? p.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    if (status === 'PENDING' || status === 'WAITING_VERIFICATION') return 'bg-amber-100 text-amber-700 border-amber-200';
    if (status === 'APPROVED') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (status === 'REVISION' || status === 'NEED_REVISION') return 'bg-rose-100 text-rose-700 border-rose-200';
    if (status === 'REJECTED') return 'bg-slate-100 text-slate-700 border-slate-200';
    return 'bg-slate-100 text-slate-700';
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
      case 'WAITING_VERIFICATION': return 'Menunggu';
      case 'APPROVED': return 'Disetujui';
      case 'REVISION':
      case 'NEED_REVISION': return 'Revisi';
      case 'REJECTED': return 'Ditolak';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        <p className="text-slate-500">Memuat data pengajuan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] p-8">
        <div className="bg-white rounded-3xl border border-red-200 shadow-sm p-8 max-w-lg text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="text-red-500" size={40} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Gagal Memuat Data</h2>
          <p className="text-slate-500 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => fetchData(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
            >
              <RefreshCw size={18} />
              Coba Lagi
            </button>
            <Link
              href="/dashboard/admin"
              className="px-6 py-3 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
            >
              Kembali
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Validasi Pengajuan</h1>
          <p className="text-slate-500 text-sm mt-1">Verifikasi dan approve pengajuan makam</p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="p-2.5 bg-white rounded-xl border border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-300 transition-all disabled:opacity-50"
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard 
          label="Total" 
          value={stats.total} 
          icon={<FileText className="text-blue-500" />} 
          color="blue"
          active={filter === null}
          onClick={() => setFilter(null)}
        />
        <StatCard 
          label="Menunggu" 
          value={stats.pending} 
          icon={<Clock className="text-amber-500" />} 
          color="amber"
          active={filter === 'PENDING'}
          onClick={() => setFilter('PENDING')}
        />
        <StatCard 
          label="Sedang Diperiksa" 
          value={stats.revision} 
          icon={<AlertCircle className="text-rose-500" />} 
          color="rose"
          active={filter === 'REVISION'}
          onClick={() => setFilter('REVISION')}
        />
        <StatCard 
          label="Disetujui" 
          value={stats.approved} 
          icon={<CheckCircle className="text-emerald-500" />} 
          color="emerald"
          active={filter === 'APPROVED'}
          onClick={() => setFilter('APPROVED')}
        />
        <StatCard 
          label="Ditolak" 
          value={stats.rejected} 
          icon={<XCircle className="text-slate-500" />} 
          color="slate"
          active={filter === 'REJECTED'}
          onClick={() => setFilter('REJECTED')}
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-900 text-lg">Daftar Pengajuan</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Cari email atau nama..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Filter size={14} />
              <span>Menampilkan {filteredList.length} dari {stats.total} pengajuan</span>
            </div>
          </div>
        </div>
        
        {filteredList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="text-left px-6 py-4">Pemohon</th>
                  <th className="text-left px-6 py-4">Status</th>
                  <th className="text-left px-6 py-4">Tanggal</th>
                  <th className="text-right px-6 py-4">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredList.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                          {p.profiles?.full_name?.charAt(0) || p.profiles?.email?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{p.profiles?.full_name || 'Unknown'}</p>
                          <p className="text-xs text-slate-400">{p.profiles?.email || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(p.status)}`}>
                        {getStatusLabel(p.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(p.created_at).toLocaleDateString('id-ID', { 
                        day: 'numeric', 
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/dashboard/admin/pengajuan/${p.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        <Eye size={14} />
                        Verifikasi
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Inbox className="text-slate-300" size={40} />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              {filter ? 'Tidak ada data' : 'Belum ada pengajuan'}
            </h3>
            <p className="text-slate-500 text-sm mb-4">
              {filter 
                ? `Tidak ada pengajuan dengan status tersebut`
                : 'Pengajuan akan muncul di sini'}
            </p>
            {filter && (
              <button
                onClick={() => setFilter(null)}
                className="text-emerald-600 font-medium text-sm hover:underline"
              >
                Tampilkan semua pengajuan
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, active, onClick }: { label: string; value: number; icon: React.ReactNode; color: string; active?: boolean; onClick?: () => void }) {
  const activeColorMap: Record<string, string> = {
    blue: 'bg-blue-600 text-white border-blue-600',
    amber: 'bg-amber-500 text-white border-amber-500',
    rose: 'bg-rose-500 text-white border-rose-500',
    emerald: 'bg-emerald-600 text-white border-emerald-600',
    slate: 'bg-slate-600 text-white border-slate-600',
  };

  return (
    <button 
      onClick={onClick}
      className={`p-5 rounded-2xl border-2 transition-all text-left ${active ? activeColorMap[color] : 'bg-white border-slate-200 hover:border-emerald-300'}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-bold uppercase tracking-wider ${active ? 'text-white/80' : 'text-slate-400'}`}>{label}</span>
        <div className={active ? '' : 'opacity-60'}>
          {icon}
        </div>
      </div>
      <p className={`text-3xl font-bold ${active ? 'text-white' : 'text-slate-900'}`}>{value}</p>
    </button>
  );
}