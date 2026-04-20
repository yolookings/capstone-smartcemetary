"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, FileText, Clock, LayoutDashboard, Database, UserCheck, CheckCircle, XCircle, AlertCircle, Filter, Shield, LogOut } from "lucide-react";

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

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pengajuanList, setPengajuanList] = useState<PengajuanWithRelations[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, revision: 0, rejected: 0 });
  const [filter, setFilter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!SUPABASE_URL || !SUPABASE_KEY) {
        setError("Konfigurasi Supabase tidak ditemukan");
        setLoading(false);
        return;
      }

      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/pengajuan?select=*&order=created_at.desc`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
        }
      );

      if (!res.ok) {
        setError(`Error fetching: ${res.status}`);
        setLoading(false);
        return;
      }

      const data: any[] = await res.json();
      
      const userIds = [...new Set(data.map(p => p.user_id).filter(Boolean))];
      let profilesMap: Record<string, {email: string, full_name: string}> = {};
      
      if (userIds.length > 0) {
        const userIdsStr = userIds.map(id => `id=eq.${id}`).join(',');
        const profilesRes = await fetch(
          `${SUPABASE_URL}/rest/v1/profiles?or=(${userIdsStr})&select=id,email,full_name`,
          {
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
            },
          }
        );
        const profilesData = await profilesRes.json();
        profilesData?.forEach((profile: any) => {
          profilesMap[profile.id] = { email: profile.email, full_name: profile.full_name };
        });
      }

      const enrichedData: PengajuanWithRelations[] = data.map(p => ({
        ...p,
        profiles: profilesMap[p.user_id] || null
      }));
      
      setPengajuanList(enrichedData);

      const pending = enrichedData.filter(p => p.status === 'PENDING').length;
      const approved = enrichedData.filter(p => p.status === 'APPROVED').length;
      const revision = enrichedData.filter(p => p.status === 'REVISION').length;
      const rejected = enrichedData.filter(p => p.status === 'REJECTED').length;
      setStats({
        total: enrichedData.length,
        pending,
        approved,
        revision,
        rejected
      });

      setLoading(false);
    } catch (err) {
      setError("Gagal mengambil data");
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!SUPABASE_URL || !SUPABASE_KEY) {
        setError("Konfigurasi tidak ditemukan");
        setLoading(false);
        return;
      }

      const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: { 'apikey': SUPABASE_KEY }
      });
      const userData = await userRes.json();
      const user = userData?.data?.user;

      if (!user?.id) {
        router.push('/auth/login?redirect=/dashboard/admin');
        return;
      }

      const profileRes = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=role`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
        }
      );
      const profileData = await profileRes.json();
      
      if (!profileData[0] || profileData[0].role !== 'ADMIN') {
        router.push('/dashboard');
        return;
      }

      fetchData();
    };

    checkAuth();
  }, []);

  const filteredList = filter 
    ? pengajuanList.filter(p => p.status === filter)
    : pengajuanList;

  if (loading) return (
    <div className="flex items-center justify-center h-[calc(100vh-80px)]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-[calc(100vh-80px)]">
      <div className="text-center">
        <AlertCircle className="mx-auto text-red-500 mb-2" size={48} />
        <p className="text-slate-600 font-medium">{error}</p>
        <button onClick={fetchData} className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg">
          Coba Lagi
        </button>
      </div>
    </div>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'APPROVED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'REVISION': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'REJECTED': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Menunggu';
      case 'APPROVED': return 'Disetujui';
      case 'REVISION': return 'Revisi';
      case 'REJECTED': return 'Ditolak';
      default: return status;
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden">
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col p-4 space-y-2 overflow-y-auto">
        <div className="px-3 py-4">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center mb-3">
            <Shield className="text-white" size={20} />
          </div>
          <h2 className="font-bold text-slate-900">Admin Panel</h2>
          <p className="text-xs text-slate-500">Smart Cemetery</p>
        </div>
        
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">Menu Validasi</p>
          <AdminNavLink icon={<LayoutDashboard size={18} />} label="Dashboard" active />
          <AdminNavLink icon={<FileText size={18} />} label="Semua Pengajuan" />
          <AdminNavLink icon={<UserCheck size={18} />} label="Verifikasi" />
          <AdminNavLink icon={<Database size={18} />} label="Data Makam" />
        </div>
        
        <div className="pt-4 border-t border-slate-100">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-100 transition-all">
            <LogOut size={18} />
            <span className="text-sm font-semibold">Mode User</span>
          </Link>
        </div>
      </aside>

      <main className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Validasi Pengajuan</h1>
              <p className="text-slate-500 text-sm mt-1">Verifikasi dan approve pengajuan makam</p>
            </div>
            <div className="px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm text-xs font-medium text-slate-500 flex items-center gap-2">
              <Clock size={14} />
              {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
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

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-lg">Daftar Pengajuan</h3>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Filter size={14} />
                <span>Menampilkan {filteredList.length} dari {stats.total} pengajuan</span>
              </div>
            </div>
            
            {filteredList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <th className="text-left px-6 py-4">Pemohon</th>
                      <th className="text-left px-6 py-4">Lokasi</th>
                      <th className="text-left px-6 py-4">Tanggal</th>
                      <th className="text-left px-6 py-4">Status</th>
                      <th className="text-right px-6 py-4">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredList.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                              {p.profiles?.full_name?.charAt(0) || p.profiles?.email?.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{p.profiles?.full_name || 'Unknown'}</p>
                              <p className="text-xs text-slate-400">{p.profiles?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {p.makam?.blok ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-xs font-medium">
                              Blok {p.makam.blok} / No. {p.makam.nomor}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {new Date(p.created_at).toLocaleDateString('id-ID', { 
                            day: 'numeric', 
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(p.status)}`}>
                            {getStatusLabel(p.status)}
                          </span>
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
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="text-slate-300" size={32} />
                </div>
                <p className="text-slate-500 font-medium">Belum ada pengajuan</p>
                <p className="text-slate-400 text-sm mt-1">Pengajuan akan muncul di sini</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function AdminNavLink({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${active ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-slate-600 hover:bg-slate-100'}`}>
      {icon}
      <span className="text-sm font-semibold">{label}</span>
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