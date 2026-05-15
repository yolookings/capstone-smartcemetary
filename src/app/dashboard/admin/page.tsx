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
      <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        <p className="text-slate-500">Memuat data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] p-8">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 max-w-md text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <WifiOff className="text-red-500" size={40} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Tidak Terhubung</h2>
          <p className="text-slate-500 mb-6">{error}</p>
          <button
            onClick={() => fetchData(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
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
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard Admin</h1>
          <p className="text-slate-500 text-sm mt-1">Selamat datang, {profile?.full_name || 'Admin'}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
            connectionStatus === 'connected' 
              ? 'bg-emerald-100 text-emerald-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {connectionStatus === 'connected' ? <Wifi size={14} /> : <WifiOff size={14} />}
            {connectionStatus === 'connected' ? 'Terhubung' : 'Terputus'}
          </div>
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="p-2.5 bg-white rounded-xl border border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-300 transition-all disabled:opacity-50"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Clock className="text-amber-500" size={20} />
                Pengajuan Menunggu Validasi
              </h3>
              <Link href="/dashboard/admin/pengajuan" className="text-sm text-emerald-600 font-medium hover:underline flex items-center gap-1">
                Lihat Semua <ArrowRight size={14} />
              </Link>
            </div>
            
            {pendingPengajuan.length > 0 ? (
              <div className="space-y-3">
                {pendingPengajuan.map((p: any) => (
                  <Link
                    key={p.id}
                    href={`/dashboard/admin/pengajuan/${p.id}`}
                    className="flex items-center justify-between p-4 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                        <Clock className="text-amber-600" size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{p.profiles?.full_name || 'Unknown'}</p>
                        <p className="text-xs text-slate-500">{p.profiles?.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400">
                        {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </span>
                      <p className="text-xs text-amber-600 font-medium mt-0.5">Menunggu</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="text-emerald-500" size={32} />
                </div>
                <p className="text-slate-500 font-medium">Semua pengajuan sudah diproses</p>
                <p className="text-slate-400 text-sm">Tidak ada yang menunggu validasi</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Activity className="text-blue-500" size={20} />
                Aktivitas Terbaru
              </h3>
            </div>
            
            {recentPengajuan.length > 0 ? (
              <div className="space-y-3">
                {recentPengajuan.map((p: any) => (
                  <div key={p.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors">
                    {getActivityIcon('pengajuan')}
                    <div className="flex-1">
                      <p className="text-sm text-slate-800">
                        Pengajuan baru dari <span className="font-medium">{p.profiles?.full_name || 'Unknown'}</span>
                      </p>
                      <p className="text-xs text-slate-400">
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
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="text-slate-300" size={32} />
                </div>
                <p className="text-slate-500 font-medium">Belum ada aktivitas</p>
                <p className="text-slate-400 text-sm">Aktivitas akan muncul di sini</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 text-lg mb-6 flex items-center gap-2">
              <TrendingUp className="text-emerald-500" size={20} />
              Statistik Cepat
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-500">Total Makam</span>
                  <span className="text-2xl font-bold text-slate-900">{stats.totalMakam}</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-500">Tingkat Approval</span>
                  <span className="text-2xl font-bold text-emerald-600">{approvalRate}%</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${approvalRate}%` }}></div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-500">Pengakaian Makam</span>
                  <span className="text-2xl font-bold text-amber-600">{occupancyRate}%</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden flex">
                  <div className="h-full bg-emerald-500" style={{ width: `${stats.availableMakam / stats.totalMakam * 100 || 0}%` }}></div>
                  <div className="h-full bg-amber-500" style={{ width: `${stats.reservedMakam / stats.totalMakam * 100 || 0}%` }}></div>
                  <div className="h-full bg-rose-500" style={{ width: `${stats.occupiedMakam / stats.totalMakam * 100 || 0}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white">
            <h3 className="font-bold text-lg mb-4">Aksi Cepat</h3>
            <div className="space-y-3">
              <Link
                href="/dashboard/admin/pengajuan"
                className="flex items-center justify-between p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
              >
                <span className="text-sm font-medium">Validasi Pengajuan</span>
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/dashboard/admin/makam"
                className="flex items-center justify-between p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
              >
                <span className="text-sm font-medium">Kelola Makam</span>
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/dashboard/admin/cemetery"
                className="flex items-center justify-between p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
              >
                <span className="text-sm font-medium">Monitoring Makam</span>
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
    blue: 'border-blue-200 bg-blue-50',
    amber: 'border-amber-200 bg-amber-50',
    emerald: 'border-emerald-200 bg-emerald-50',
    purple: 'border-purple-200 bg-purple-50',
  };
  
  return (
    <Link 
      href={href}
      className={`p-5 rounded-2xl border-2 bg-white hover:border-emerald-300 hover:shadow-md transition-all`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</span>
        <div className="opacity-60">
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
    </Link>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number | string; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    rose: 'bg-rose-100 text-rose-700',
    orange: 'bg-orange-100 text-orange-700',
    slate: 'bg-slate-100 text-slate-700',
    blue: 'bg-blue-100 text-blue-700',
  };
  
  return (
    <div className={`p-4 rounded-xl ${colorMap[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium opacity-80">{label}</p>
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