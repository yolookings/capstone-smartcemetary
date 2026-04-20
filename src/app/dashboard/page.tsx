"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Clock, CheckCircle, AlertCircle, Plus, MapPin, Eye, Search, Filter, Download, TrendingUp, TrendingDown, Users, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [pengajuanList, setPengajuanList] = useState<any[]>([]);
  const [myGraves, setMyGraves] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        window.location.href = '/auth/login';
        return;
      }

      setUser(authUser);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      setProfile(profileData);

      const isAdmin = profileData?.role === 'ADMIN';

      if (isAdmin) {
        const { data: allPengajuan } = await supabase
          .from('pengajuan')
          .select('*, profiles(*), makam(*)')
          .order('created_at', { ascending: false });
        setPengajuanList(allPengajuan || []);
      } else {
        const { data: userPengajuan } = await supabase
          .from('pengajuan')
          .select('*, makam(*)')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false });
        setPengajuanList(userPengajuan || []);

        const { data: graves } = await supabase
          .from('makam')
          .select('*')
          .eq('user_id', authUser.id);
        setMyGraves(graves || []);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
    </div>
  );

  const isAdmin = profile?.role === 'ADMIN';

  if (isAdmin) {
    return <AdminDashboard pengajuanList={pengajuanList} profile={profile} />;
  } else {
    return <UserDashboard user={user} profile={profile} pengajuanList={pengajuanList} myGraves={myGraves} />;
  }
}

function AdminDashboard({ pengajuanList, profile }: { pengajuanList: any[]; profile: any }) {
  const getCount = (status: string) => pengajuanList.filter((s: any) => s.status === status).length;
  const total = pengajuanList.length;
  const pending = getCount('PENDING');
  const approved = getCount('APPROVED');
  const revision = getCount('REVISION');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Admin</h1>
          <p className="text-slate-500 text-sm">Selamat datang, {profile?.full_name || 'Admin'}</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-slate-50 text-sm">
            <Download size={16} />
            Export
          </button>
          <Link href="/dashboard/pengajuan/baru" className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm">
            <Plus size={16} />
            Pengajuan Baru
          </Link>
        </div>
      </div>

      {/* Stats Cards with Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Pengajuan" 
          value={total} 
          icon={<FileText size={20} />} 
          trend="+12%" 
          trendUp={true}
          color="blue"
        />
        <StatCard 
          title="Menunggu" 
          value={pending} 
          icon={<Clock size={20} />} 
          trend="-5%" 
          trendUp={false}
          color="amber"
        />
        <StatCard 
          title="Disetujui" 
          value={approved} 
          icon={<CheckCircle size={20} />} 
          trend="+8%" 
          trendUp={true}
          color="emerald"
        />
        <StatCard 
          title="Revisi" 
          value={revision} 
          icon={<AlertCircle size={20} />} 
          trend="-3%" 
          trendUp={false}
          color="rose"
        />
      </div>

      {/* Quick Actions & Search */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari pengajuan..." 
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-slate-50 text-sm">
          <Filter size={16} />
          Filter
        </button>
      </div>

      {/* Recent Applications Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-semibold text-slate-900">Pengajuan Terbaru</h2>
          <Link href="/dashboard/pengajuan" className="text-sm text-emerald-600 hover:underline">Lihat Semua</Link>
        </div>
        
        <table className="w-full">
          <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3">Pemohon</th>
              <th className="px-6 py-3">Tanggal</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pengajuanList.slice(0, 8).map((p: any) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-medium">
                      {p.profiles?.full_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{p.profiles?.full_name || 'Unknown'}</p>
                      <p className="text-xs text-slate-500">{p.profiles?.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  {new Date(p.created_at).toLocaleDateString('id-ID', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={p.status} />
                </td>
                <td className="px-6 py-4">
                  <Link 
                    href={`/dashboard/admin/pengajuan/${p.id}`}
                    className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                  >
                    Detail
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {pengajuanList.length === 0 && (
          <div className="p-8 text-center text-slate-400">
            <FileText className="mx-auto mb-2" size={32} />
            <p>Belum ada pengajuan</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, trendUp, color }: { 
  title: string; 
  value: number; 
  icon: React.ReactNode; 
  trend: string; 
  trendUp: boolean;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
  };

  return (
    <div className="bg-white p-6 rounded-xl border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium ${trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
          {trendUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {trend}
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{title}</p>
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

function UserDashboard({ user, profile, pengajuanList, myGraves }: { user: any; profile: any; pengajuanList: any[]; myGraves: any[] }) {
  const getCount = (status: string) => pengajuanList.filter(s => s.status === status).length;

  return (
    <div className="space-y-12 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Halo, {profile?.full_name || user.email}</h1>
          <p className="text-secondary text-sm mt-2">Selamat datang di Smart Cemetery.</p>
        </div>
        <Link 
          href="/dashboard/pengajuan/baru" 
          className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-dark transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
        >
          <Plus size={20} />
          Daftar Makam
        </Link>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3 px-4">
          <MapPin className="text-primary" size={24} />
          Lokasi Makam Keluarga
        </h2>
        {myGraves.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myGraves.map((grave: any) => (
              <div key={grave.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors"></div>
                <div className="relative z-10 space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-lg uppercase tracking-widest">
                      Blok {grave.blok} - No. {grave.nomor}
                    </span>
                    <span className={`px-3 py-1 text-[10px] font-bold rounded-lg uppercase tracking-widest ${
                      grave.status === 'OCCUPIED' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                      {grave.status}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 leading-tight mb-1">{grave.deceased_name || "Lahan Dipesan"}</h3>
                    <p className="text-xs text-slate-400 font-medium">
                      {grave.deceased_date ? `Wafat: ${new Date(grave.deceased_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}` : "Menunggu Aktivasi"}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-slate-50 flex items-center gap-2 text-primary">
                    <MapPin size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Koordinat Terverifikasi</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-[2.5rem] border border-dashed border-slate-200 text-center space-y-4">
            <div className="w-16 h-16 bg-neutral rounded-2xl flex items-center justify-center mx-auto text-slate-300">
              <MapPin size={32} />
            </div>
            <p className="text-secondary text-sm font-medium">Anda belum memiliki data lokasi makam keluarga yang terdaftar.</p>
            <Link href="/dashboard/pengajuan/baru" className="inline-block bg-primary text-white px-6 py-2 rounded-lg font-bold text-sm">
              Daftar Sekarang
            </Link>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8 pt-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-4">
            <h2 className="text-xl font-bold text-slate-900">Riwayat Pengajuan</h2>
            <Link href="/dashboard/pengajuan" className="text-xs font-bold text-primary uppercase tracking-widest hover:underline">Lihat Semua</Link>
          </div>
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            {pengajuanList.length > 0 ? (
              <div className="divide-y divide-slate-50">
                {pengajuanList.slice(0, 5).map((p: any) => (
                  <div key={p.id} className="p-6 hover:bg-neutral/50 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-neutral rounded-xl flex items-center justify-center text-primary font-bold">
                        {p.status.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 leading-none mb-1">ID #{p.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">{new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${
                      p.status === 'PENDING' ? 'bg-amber-100 text-amber-600' :
                      p.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' :
                      p.status === 'REVISION' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-20 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">
                <p>Belum ada pengajuan</p>
                <Link href="/dashboard/pengajuan/baru" className="text-primary hover:underline mt-2 inline-block">
                  Buat pengajuan pertama
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900 px-4">Statistik Saya</h2>
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
            <StatMini icon={<FileText className="text-blue-500" />} label="Total Pengajuan" value={pengajuanList.length} color="bg-blue-50" />
            <StatMini icon={<Clock className="text-amber-500" />} label="Menunggu" value={getCount('PENDING')} color="bg-amber-50" />
            <StatMini icon={<CheckCircle className="text-emerald-500" />} label="Disetujui" value={getCount('APPROVED')} color="bg-emerald-50" />
            <StatMini icon={<AlertCircle className="text-rose-500" />} label="Perlu Revisi" value={getCount('REVISION')} color="bg-rose-50" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatMini({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number, color: string }) {
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
          {icon}
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-xl font-bold text-slate-900">{value}</span>
    </div>
  );
}