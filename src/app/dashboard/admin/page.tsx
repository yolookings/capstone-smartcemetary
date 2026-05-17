"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  FileText, Clock, CheckCircle, XCircle, AlertCircle, Users, MapPin, 
  BarChart3, ArrowRight, Eye, RefreshCw, Wifi, WifiOff, TrendingUp,
  Calendar, Activity, Bell, MessageCircle
} from "lucide-react";

interface PengajuanWithRelations {
  id: string;
  status: string;
  created_at: string;
  user_id: string;
  profiles?: {
    email: string;
    full_name: string;
  };
}

interface Stats {
  totalPengajuan: number;
  totalUsers: number;
  totalMakam: number;
  availableMakam: number;
  occupiedMakam: number;
  reservedMakam: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  revisionCount: number;
}

interface RecentActivity {
  id: string;
  type: 'pengajuan' | 'user' | 'makam';
  action: string;
  description: string;
  timestamp: string;
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pengajuanList, setPengajuanList] = useState<PengajuanWithRelations[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalPengajuan: 0,
    totalUsers: 0,
    totalMakam: 0,
    availableMakam: 0,
    occupiedMakam: 0,
    reservedMakam: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    revisionCount: 0
  });
  const [profile, setProfile] = useState<{ full_name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError(null);
    setConnectionStatus('checking');
    
    try {
      const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!SUPABASE_URL || !SUPABASE_KEY) {
        setError("Konfigurasi Supabase tidak ditemukan. Silakan periksa file .env.local");
        setConnectionStatus('disconnected');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      };

      const [pengajuanRes, profilesRes, makamRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/pengajuan?select=*&order=created_at.desc`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id,full_name,email`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/makam?select=id,status`, { headers }),
      ]);

      if (!pengajuanRes.ok) {
        setError(`Gagal mengambil data pengajuan. Status: ${pengajuanRes.status}`);
        setConnectionStatus('disconnected');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const pengajuanData = await pengajuanRes.json();
      const profilesData = await profilesRes.json();
      const makamData = await makamRes.json();

      if (!Array.isArray(pengajuanData)) {
        setError("Format data tidak valid dari server");
        setConnectionStatus('disconnected');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      setConnectionStatus('connected');

      const currentUserRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { 'apikey': SUPABASE_KEY } });
      const userData = await currentUserRes.json();
      const user = userData?.data?.user;
      
      if (user && Array.isArray(profilesData)) {
        const myProfile = profilesData.find((p: any) => p.id === user.id);
        if (myProfile) setProfile(myProfile);
      }

      const userIds = [...new Set(pengajuanData.map((p: any) => p.user_id).filter((id: unknown): id is string => typeof id === 'string'))];
      let profilesMap: Record<string, { email: string; full_name: string }> = {};
      
      if (userIds.length > 0) {
        const userIdsStr = userIds.map((id) => `id=eq.${id}`).join(',');
        const profilesRes2 = await fetch(
          `${SUPABASE_URL}/rest/v1/profiles?or=(${userIdsStr})&select=id,email,full_name`,
          { headers }
        );
        const profilesData2 = await profilesRes2.json();
        profilesData2?.forEach((profile: any) => {
          profilesMap[profile.id] = { email: profile.email, full_name: profile.full_name };
        });
      }

      const enrichedData = pengajuanData.map((p: any) => ({
        ...p,
        profiles: profilesMap[p.user_id] || null
      }));
      
      setPengajuanList(enrichedData);

      const pendingCount = enrichedData.filter((p: any) => p.status === 'PENDING').length;
      const approvedCount = enrichedData.filter((p: any) => p.status === 'APPROVED').length;
      const revisionCount = enrichedData.filter((p: any) => p.status === 'REVISION').length;
      const rejectedCount = enrichedData.filter((p: any) => p.status === 'REJECTED').length;

      const availableMakam = makamData.filter((m: any) => m.status === 'AVAILABLE').length;
      const occupiedMakam = makamData.filter((m: any) => m.status === 'OCCUPIED').length;
      const reservedMakam = makamData.filter((m: any) => m.status === 'RESERVED').length;

      setStats({
        totalPengajuan: enrichedData.length,
        totalUsers: profilesData.length || 0,
        totalMakam: makamData.length || 0,
        availableMakam,
        occupiedMakam,
        reservedMakam,
        pendingCount,
        approvedCount,
        rejectedCount,
        revisionCount
      });

      setLoading(false);
      setRefreshing(false);
    } catch (err) {
      setError("Tidak dapat terhubung ke server. Silakan periksa koneksi internet Anda.");
      setConnectionStatus('disconnected');
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const recentPengajuan = pengajuanList.slice(0, 5);
  const pendingPengajuan = pengajuanList.filter((p: any) => p.status === 'PENDING').slice(0, 3);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'pengajuan': return <FileText size={16} className="text-blue-500" />;
      case 'user': return <Users size={16} className="text-purple-500" />;
      case 'makam': return <MapPin size={16} className="text-emerald-500" />;
      default: return <Activity size={16} className="text-slate-500" />;
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
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-12 max-w-md text-center">
          <div className="w-24 h-24 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <WifiOff className="text-red-500" size={48} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Tidak Terhubung</h2>
          <p className="text-slate-500 mb-8">{error}</p>
          <button
            onClick={() => fetchData(true)}
            className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-dark transition-all flex items-center gap-2 shadow-lg shadow-primary/20 mx-auto"
          >
            <RefreshCw size={18} />
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  const approvalRate = stats.totalPengajuan > 0 
    ? Math.round((stats.approvedCount / stats.totalPengajuan) * 100) 
    : 0;

  const occupancyRate = stats.totalMakam > 0 
    ? Math.round(((stats.occupiedMakam + stats.reservedMakam) / stats.totalMakam) * 100) 
    : 0;

return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Dashboard Admin</h1>
          <p className="text-secondary text-sm mt-2">Selamat datang, {profile?.full_name || 'Admin'}</p>
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

      <div className="grid md:grid-cols-4 gap-6">
        <StatCard 
          label="Total Pengajuan" 
          value={stats.totalPengajuan} 
          icon={<FileText className="text-blue-500" />} 
          href="/dashboard/admin/pengajuan"
          color="blue"
        />
        <StatCard 
          label="Menunggu" 
          value={stats.pendingCount} 
          icon={<Clock className="text-amber-500" />} 
          href="/dashboard/admin/pengajuan"
          color="amber"
        />
        <StatCard 
          label="Disetujui" 
          value={stats.approvedCount} 
          icon={<CheckCircle className="text-emerald-500" />} 
          href="/dashboard/admin/pengajuan"
          color="emerald"
        />
        <StatCard 
          label="Pengguna" 
          value={stats.totalUsers} 
          icon={<Users className="text-purple-500" />} 
          href="/dashboard/admin/users"
          color="purple"
        />
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
        <MiniStat 
          label="Tersedia" 
          value={stats.availableMakam} 
          color="emerald"
        />
        <MiniStat 
          label="Dipesan" 
          value={stats.reservedMakam} 
          color="amber"
        />
        <MiniStat 
          label="Terisi" 
          value={stats.occupiedMakam} 
          color="rose"
        />
        <MiniStat 
          label="Revisi" 
          value={stats.revisionCount} 
          color="orange"
        />
        <MiniStat 
          label="Ditolak" 
          value={stats.rejectedCount} 
          color="slate"
        />
        <MiniStat 
          label="Approval" 
          value={`${approvalRate}%`} 
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold text-xl text-slate-900 flex items-center gap-3">
                <Clock className="text-amber-500" size={24} />
                Pengajuan Menunggu Validasi
              </h3>
              <Link href="/dashboard/admin/pengajuan" className="text-sm font-bold text-primary uppercase tracking-widest hover:underline flex items-center gap-1">
                Lihat Semua <ArrowRight size={14} />
              </Link>
            </div>
            
            {pendingPengajuan.length > 0 ? (
              <div className="space-y-4">
                {pendingPengajuan.map((p: any) => (
                  <Link
                    key={p.id}
                    href={`/dashboard/admin/pengajuan/${p.id}`}
                    className="flex items-center justify-between p-6 bg-neutral rounded-2xl hover:bg-slate-100 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                        <Clock className="text-amber-600" size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{p.profiles?.full_name || 'Unknown'}</p>
                        <p className="text-xs text-slate-400 font-medium">{p.profiles?.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 font-medium uppercase tracking-widest">
                        {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <p className="text-xs text-amber-600 font-bold mt-1 uppercase tracking-wider">Menunggu</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="text-primary" size={40} />
                </div>
                <p className="text-slate-600 font-bold">Semua pengajuan sudah diproses</p>
                <p className="text-slate-400 text-sm mt-1">Tidak ada yang menunggu validasi</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold text-xl text-slate-900 flex items-center gap-3">
                <Activity className="text-blue-500" size={24} />
                Aktivitas Terbaru
              </h3>
            </div>
            
            {recentPengajuan.length > 0 ? (
              <div className="space-y-4">
                {recentPengajuan.map((p: any) => (
                  <div key={p.id} className="flex items-center gap-4 p-4 hover:bg-neutral rounded-2xl transition-all">
                    <div className="w-10 h-10 bg-neutral rounded-xl flex items-center justify-center">
                      {getActivityIcon('pengajuan')}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-800">
                        Pengajuan baru dari <span className="font-bold">{p.profiles?.full_name || 'Unknown'}</span>
                      </p>
                      <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">
                        {new Date(p.created_at).toLocaleDateString('id-ID', { 
                          day: 'numeric', 
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-neutral rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <FileText className="text-slate-300" size={40} />
                </div>
                <p className="text-slate-600 font-bold">Belum ada aktivitas</p>
                <p className="text-slate-400 text-sm mt-1">Aktivitas akan muncul di sini</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8">
            <h3 className="font-bold text-xl text-slate-900 mb-8 flex items-center gap-3">
              <TrendingUp className="text-primary" size={24} />
              Statistik Cepat
            </h3>
            
            <div className="space-y-6">
              <div className="p-6 bg-neutral rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Makam</span>
                  <span className="text-3xl font-bold text-slate-900">{stats.totalMakam}</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>

              <div className="p-6 bg-neutral rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tingkat Approval</span>
                  <span className="text-3xl font-bold text-primary">{approvalRate}%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${approvalRate}%` }}></div>
                </div>
              </div>

              <div className="p-6 bg-neutral rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pengunaan Makam</span>
                  <span className="text-3xl font-bold text-amber-600">{occupancyRate}%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden flex">
                  <div className="h-full bg-primary" style={{ width: `${stats.availableMakam / stats.totalMakam * 100 || 0}%` }}></div>
                  <div className="h-full bg-amber-500" style={{ width: `${stats.reservedMakam / stats.totalMakam * 100 || 0}%` }}></div>
                  <div className="h-full bg-rose-500" style={{ width: `${stats.occupiedMakam / stats.totalMakam * 100 || 0}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary to-emerald-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-primary/20">
            <h3 className="font-bold text-xl mb-6">Aksi Cepat</h3>
            <div className="space-y-3">
              <Link
                href="/dashboard/admin/pengajuan"
                className="flex items-center justify-between p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
              >
                <span className="text-sm font-bold">Validasi Pengajuan</span>
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/dashboard/admin/makam"
                className="flex items-center justify-between p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
              >
                <span className="text-sm font-bold">Kelola Makam</span>
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/dashboard/admin/cemetery"
                className="flex items-center justify-between p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
              >
                <span className="text-sm font-bold">Monitoring Makam</span>
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, href, color }: { label: string; value: number; icon: React.ReactNode; href: string; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  
  return (
    <Link 
      href={href}
      className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-xl transition-all group"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500 mt-1">{label}</p>
    </Link>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number | string; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    orange: 'bg-orange-50 text-orange-600',
    slate: 'bg-slate-50 text-slate-600',
    blue: 'bg-blue-50 text-blue-600',
  };
  
  return (
    <div className={`p-4 rounded-xl border border-slate-100 ${colorMap[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium uppercase tracking-wider opacity-70">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    APPROVED: 'bg-emerald-100 text-emerald-700',
    REVISION: 'bg-rose-100 text-rose-700',
    REJECTED: 'bg-slate-100 text-slate-700',
  };

  const labels: Record<string, string> = {
    PENDING: 'Menunggu',
    APPROVED: 'Disetujui',
    REVISION: 'Revisi',
    REJECTED: 'Ditolak',
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || styles.PENDING}`}>
      {labels[status] || status}
    </span>
  );
}