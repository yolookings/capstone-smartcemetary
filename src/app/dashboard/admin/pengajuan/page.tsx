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
      const profilesMap: Record<string, {email: string, full_name: string}> = {};
      
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
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 p-8">
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-12 max-w-lg text-center">
          <div className="w-24 h-24 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <AlertCircle className="text-red-500" size={48} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Gagal Memuat Data</h2>
          <p className="text-slate-500 mb-8">{error}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => fetchData(true)}
              className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-dark transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
            >
              <RefreshCw size={18} />
              Coba Lagi
            </button>
            <Link
              href="/dashboard/admin"
              className="px-8 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-neutral transition-all"
            >
              Kembali
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Validasi Pengajuan</h1>
          <p className="text-secondary text-sm mt-2">Verifikasi dan approve pengajuan makam</p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="bg-white px-6 py-3 rounded-xl font-bold border border-slate-200 text-slate-600 hover:text-primary hover:border-primary transition-all flex items-center gap-2 shadow-sm"
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          Refresh
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

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-xl text-slate-900">Daftar Pengajuan</h3>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Cari email atau nama..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary w-56"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Filter size={16} />
              <span>Menampilkan {filteredList.length} dari {stats.total} pengajuan</span>
            </div>
          </div>
        </div>
        
        {filteredList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-neutral text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <th className="text-left px-8 py-5">Pemohon</th>
                  <th className="text-left px-8 py-5">Status</th>
                  <th className="text-left px-8 py-5">Tanggal</th>
                  <th className="text-right px-8 py-5">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredList.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral transition-all">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center text-white font-bold">
                          {p.profiles?.full_name?.charAt(0) || p.profiles?.email?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{p.profiles?.full_name || 'Unknown'}</p>
                          <p className="text-xs text-slate-400 font-medium">{p.profiles?.email || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(p.status)}`}>
                        {getStatusLabel(p.status)}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-sm text-slate-500 font-medium">
                      {new Date(p.created_at).toLocaleDateString('id-ID', { 
                        day: 'numeric', 
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <Link 
                        href={`/dashboard/admin/pengajuan/${p.id}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
                      >
                        <Eye size={16} />
                        Verifikasi
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-20 text-center">
            <div className="w-24 h-24 bg-neutral rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Inbox className="text-slate-300" size={48} />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">
              {filter ? 'Tidak ada data' : 'Belum ada pengajuan'}
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              {filter 
                ? `Tidak ada pengajuan dengan status tersebut`
                : 'Pengajuan akan muncul di sini'}
            </p>
            {filter && (
              <button
                onClick={() => setFilter(null)}
                className="text-primary font-bold text-sm hover:underline"
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
    blue: 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20',
    amber: 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20',
    rose: 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20',
    emerald: 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/20',
    slate: 'bg-slate-600 text-white border-slate-600 shadow-lg shadow-slate-600/20',
  };

  const colorIconMap: Record<string, string> = {
    blue: 'text-blue-500',
    amber: 'text-amber-500',
    rose: 'text-rose-500',
    emerald: 'text-emerald-500',
    slate: 'text-slate-500',
  };

  return (
    <button 
      onClick={onClick}
      className={`p-6 rounded-xl border transition-all text-left ${active ? activeColorMap[color] : 'bg-white border-slate-100 shadow-sm hover:shadow-xl hover:border-primary/30'}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-bold uppercase tracking-wider ${active ? 'text-white/80' : 'text-slate-400'}`}>{label}</span>
        <div className={active ? 'text-white' : colorIconMap[color]}>
          {icon}
        </div>
      </div>
      <p className={`text-3xl font-bold ${active ? 'text-white' : 'text-slate-900'}`}>{value}</p>
    </button>
  );
}