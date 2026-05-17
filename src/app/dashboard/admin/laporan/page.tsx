"use client";

import { useEffect, useState } from "react";
import { BarChart3, FileText, Users, MapPin, TrendingUp, Calendar, Download, AlertCircle } from "lucide-react";

interface Stats {
  totalPengajuan: number;
  totalUsers: number;
  totalMakam: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  revisionCount: number;
  makamAvailable: number;
  makamOccupied: number;
  makamReserved: number;
}

export default function AdminLaporanPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalPengajuan: 0,
    totalUsers: 0,
    totalMakam: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    revisionCount: 0,
    makamAvailable: 0,
    makamOccupied: 0,
    makamReserved: 0,
  });
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!SUPABASE_URL || !SUPABASE_KEY) {
        setError("Konfigurasi Supabase tidak ditemukan");
        setLoading(false);
        return;
      }

      const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      };

      const [pengajuanRes, profilesRes, makamRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/pengajuan?select=id,status`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id,role`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/makam?select=id,status`, { headers }),
      ]);

      const pengajuanData = await pengajuanRes.json();
      const profilesData = await profilesRes.json();
      const makamData = await makamRes.json();

      const pendingCount = pengajuanData.filter((p: any) => p.status === 'PENDING').length;
      const approvedCount = pengajuanData.filter((p: any) => p.status === 'APPROVED').length;
      const rejectedCount = pengajuanData.filter((p: any) => p.status === 'REJECTED').length;
      const revisionCount = pengajuanData.filter((p: any) => p.status === 'REVISION').length;

      const makamAvailable = makamData.filter((m: any) => m.status === 'AVAILABLE').length;
      const makamOccupied = makamData.filter((m: any) => m.status === 'OCCUPIED').length;
      const makamReserved = makamData.filter((m: any) => m.status === 'RESERVED').length;

      setStats({
        totalPengajuan: pengajuanData.length || 0,
        totalUsers: profilesData.length || 0,
        totalMakam: makamData.length || 0,
        pendingCount,
        approvedCount,
        rejectedCount,
        revisionCount,
        makamAvailable,
        makamOccupied,
        makamReserved,
      });

      setLoading(false);
    } catch (err) {
      setError("Gagal mengambil data");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <div className="text-center">
          <AlertCircle className="mx-auto text-red-500 mb-2" size={48} />
          <p className="text-slate-600 font-medium">{error}</p>
          <button
            onClick={fetchStats}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  const pengajuanRate = stats.totalPengajuan > 0 
    ? Math.round((stats.approvedCount / stats.totalPengajuan) * 100) 
    : 0;

  const makamOccupancy = stats.totalMakam > 0 
    ? Math.round(((stats.makamOccupied + stats.makamReserved) / stats.totalMakam) * 100) 
    : 0;

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Laporan</h1>
          <p className="text-slate-500 text-sm mt-1">Statistik dan ringkasan sistem</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <FileText size={24} />
            </div>
            <TrendingUp size={20} className="opacity-60" />
          </div>
          <p className="text-3xl font-bold">{stats.totalPengajuan}</p>
          <p className="text-sm text-white/80 mt-1">Total Pengajuan</p>
          <div className="mt-4 pt-4 border-t border-white/20">
            <p className="text-xs text-white/60">{pengajuanRate}% disetujui</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Users size={24} />
            </div>
            <Calendar size={20} className="opacity-60" />
          </div>
          <p className="text-3xl font-bold">{stats.totalUsers}</p>
          <p className="text-sm text-white/80 mt-1">Total Pengguna</p>
          <div className="mt-4 pt-4 border-t border-white/20">
            <p className="text-xs text-white/60">
              {stats.totalUsers > 0 ? Math.round((stats.totalUsers - 1) / stats.totalUsers * 100) : 0}% pengguna
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <MapPin size={24} />
            </div>
            <BarChart3 size={20} className="opacity-60" />
          </div>
          <p className="text-3xl font-bold">{stats.totalMakam}</p>
          <p className="text-sm text-white/80 mt-1">Total Makam</p>
          <div className="mt-4 pt-4 border-t border-white/20">
            <p className="text-xs text-white/60">{makamOccupancy}% terpakai</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-900 text-lg mb-6">Status Pengajuan</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-sm text-slate-600">Menunggu</span>
              </div>
              <span className="font-bold text-slate-900">{stats.pendingCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                <span className="text-sm text-slate-600">Sedang Diperiksa</span>
              </div>
              <span className="font-bold text-slate-900">{stats.revisionCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-sm text-slate-600">Disetujui</span>
              </div>
              <span className="font-bold text-slate-900">{stats.approvedCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-slate-500"></div>
                <span className="text-sm text-slate-600">Ditolak</span>
              </div>
              <span className="font-bold text-slate-900">{stats.rejectedCount}</span>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden flex">
              {stats.totalPengajuan > 0 && (
                <>
                  <div 
                    className="bg-amber-500" 
                    style={{ width: `${(stats.pendingCount / stats.totalPengajuan) * 100}%` }}
                  ></div>
                  <div 
                    className="bg-rose-500" 
                    style={{ width: `${(stats.revisionCount / stats.totalPengajuan) * 100}%` }}
                  ></div>
                  <div 
                    className="bg-emerald-500" 
                    style={{ width: `${(stats.approvedCount / stats.totalPengajuan) * 100}%` }}
                  ></div>
                  <div 
                    className="bg-slate-500" 
                    style={{ width: `${(stats.rejectedCount / stats.totalPengajuan) * 100}%` }}
                  ></div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-900 text-lg mb-6">Status Makam</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-sm text-slate-600">Tersedia</span>
              </div>
              <span className="font-bold text-slate-900">{stats.makamAvailable}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-sm text-slate-600">Dipesan</span>
              </div>
              <span className="font-bold text-slate-900">{stats.makamReserved}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                <span className="text-sm text-slate-600">Terisi</span>
              </div>
              <span className="font-bold text-slate-900">{stats.makamOccupied}</span>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden flex">
              {stats.totalMakam > 0 && (
                <>
                  <div 
                    className="bg-emerald-500" 
                    style={{ width: `${(stats.makamAvailable / stats.totalMakam) * 100}%` }}
                  ></div>
                  <div 
                    className="bg-amber-500" 
                    style={{ width: `${(stats.makamReserved / stats.totalMakam) * 100}%` }}
                  ></div>
                  <div 
                    className="bg-rose-500" 
                    style={{ width: `${(stats.makamOccupied / stats.totalMakam) * 100}%` }}
                  ></div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}