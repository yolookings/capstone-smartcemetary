"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Clock, CheckCircle, AlertCircle, Plus, MapPin, Eye, Search, TrendingUp, TrendingDown, Users, Calendar } from "lucide-react";
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

      const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?id=eq.${authUser.id}&select=*`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
        }
      );
      const profiles = await res.json();
      const profileData = profiles?.[0];
      setProfile(profileData);

      const isAdmin = profileData?.role === 'ADMIN';

      if (isAdmin) {
        const pengajuanRes = await fetch(
          `${SUPABASE_URL}/rest/v1/pengajuan?select=*,profiles(email,full_name),makam(nik,blok,nomor)&order=created_at.desc`,
          {
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
            },
          }
        );
        const allPengajuan = await pengajuanRes.json();
        setPengajuanList(allPengajuan || []);
      } else {
        const pengajuanRes = await fetch(
          `${SUPABASE_URL}/rest/v1/pengajuan?user_id=eq.${authUser.id}&select=*,makam(nik,blok,nomor)&order=created_at.desc`,
          {
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
            },
          }
        );
        const userPengajuan = await pengajuanRes.json();
        setPengajuanList(userPengajuan || []);

        const gravesRes = await fetch(
          `${SUPABASE_URL}/rest/v1/makam?user_id=eq.${authUser.id}`,
          {
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
            },
          }
        );
        const graves = await gravesRes.json();
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
  const getCount = (status: string | null) => status === null 
    ? pengajuanList.length 
    : pengajuanList.filter((s: any) => s.status === status).length;

  const STATUS_SECTIONS = [
    { key: 'PENDING', label: 'Menunggu', color: 'amber', icon: Clock },
    { key: 'REVISION', label: 'Sedang Diperiksa', color: 'rose', icon: AlertCircle },
    { key: 'APPROVED', label: 'Disetujui', color: 'emerald', icon: CheckCircle },
    { key: 'REJECTED', label: 'Ditolak', color: 'slate', icon: AlertCircle },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Admin</h1>
          <p className="text-slate-500 text-sm">Selamat datang, {profile?.full_name || 'Admin'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
              <FileText size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{getCount(null)}</p>
              <p className="text-xs text-slate-500">Total</p>
            </div>
          </div>
        </div>
        {STATUS_SECTIONS.map(section => {
          const Icon = section.icon;
          const count = getCount(section.key);
          const colorMap: Record<string, string> = {
            amber: 'bg-amber-100 text-amber-600',
            rose: 'bg-rose-100 text-rose-600',
            emerald: 'bg-emerald-100 text-emerald-600',
            slate: 'bg-slate-100 text-slate-600',
          };
          return (
            <div key={section.key} className="bg-white p-4 rounded-xl border shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[section.color]}`}>
                  <Icon size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{count}</p>
                  <p className="text-xs text-slate-500">{section.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Status Sections */}
      {STATUS_SECTIONS.map(section => {
        const items = pengajuanList.filter((p: any) => p.status === section.key);
        if (items.length === 0) return null;
        
        const Icon = section.icon;
        const colorMap: Record<string, string> = {
          amber: 'border-amber-200 bg-amber-50',
          rose: 'border-rose-200 bg-rose-50',
          emerald: 'border-emerald-200 bg-emerald-50',
          slate: 'border-slate-200 bg-slate-50',
        };
        const badgeMap: Record<string, string> = {
          amber: 'bg-amber-100 text-amber-700',
          rose: 'bg-rose-100 text-rose-700',
          emerald: 'bg-emerald-100 text-emerald-700',
          slate: 'bg-slate-100 text-slate-700',
        };

        return (
          <div key={section.key} className={`rounded-2xl border p-6 ${colorMap[section.color]}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Icon size={20} className={`text-${section.color}-600`} />
                <h2 className="font-bold text-slate-900">{section.label}</h2>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badgeMap[section.color]}`}>
                  {items.length}
                </span>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.slice(0, 6).map((p: any) => (
                <Link
                  key={p.id}
                  href={`/dashboard/admin/pengajuan/${p.id}`}
                  className="bg-white p-4 rounded-xl border hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-900 text-sm">#{p.id.slice(0, 8).toUpperCase()}</span>
                    <span className="text-xs text-slate-500">
                      {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 truncate">{p.profiles?.email || '-'}</p>
                  <p className="text-xs text-slate-400 mt-1">NIK: {p.makam?.nik || '-'}</p>
                </Link>
              ))}
            </div>
          </div>
        );
      })}

      {pengajuanList.length === 0 && (
        <div className="bg-white p-12 rounded-2xl border text-center">
          <FileText className="mx-auto text-slate-300 mb-4" size={48} />
          <p className="text-slate-500">Belum ada pengajuan</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) {
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

      <div className="grid md:grid-cols-4 gap-6">
        <StatCard title="Total Pengajuan" value={pengajuanList.length} icon={<FileText className="text-blue-500" />} color="blue" />
        <StatCard title="Menunggu" value={getCount('PENDING')} icon={<Clock className="text-amber-500" />} color="amber" />
        <StatCard title="Disetujui" value={getCount('APPROVED')} icon={<CheckCircle className="text-emerald-500" />} color="emerald" />
        <StatCard title="Revisi" value={getCount('REVISION')} icon={<AlertCircle className="text-rose-500" />} color="rose" />
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
                    <StatusBadge status={p.status} />
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
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <FileText className="text-blue-500" size={18} />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Pengajuan</span>
              </div>
              <span className="text-xl font-bold text-slate-900">{pengajuanList.length}</span>
            </div>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Clock className="text-amber-500" size={18} />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Menunggu</span>
              </div>
              <span className="text-xl font-bold text-slate-900">{getCount('PENDING')}</span>
            </div>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <CheckCircle className="text-emerald-500" size={18} />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Disetujui</span>
              </div>
              <span className="text-xl font-bold text-slate-900">{getCount('APPROVED')}</span>
            </div>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                  <AlertCircle className="text-rose-500" size={18} />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Perlu Revisi</span>
              </div>
              <span className="text-xl font-bold text-slate-900">{getCount('REVISION')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
