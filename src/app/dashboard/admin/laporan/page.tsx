"use client";

import { useEffect, useState, useMemo } from "react";
import { BarChart3, FileText, Users, MapPin, TrendingUp, Calendar, AlertCircle, Download, FileDown } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

interface MonthlyRow {
  month: string;
  total: number;
  approved: number;
  rejected: number;
  pending: number;
  revision: number;
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
  const [monthlyData, setMonthlyData] = useState<MonthlyRow[]>([]);
  const [monthlyLoading, setMonthlyLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];

  const formatMonth = (monthKey: string) => {
    const [, m] = monthKey.split("-");
    return monthNames[parseInt(m, 10) - 1] || monthKey;
  };

  const fetchMonthlyData = async () => {
    setMonthlyLoading(true);
    try {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from("pengajuan")
        .select("id,status,created_at");

      if (fetchError || !data) {
        setMonthlyLoading(false);
        return;
      }

      let filtered = data;
      if (selectedMonth !== "all") {
        filtered = filtered.filter((d) => {
          const date = new Date(d.created_at);
          return (date.getMonth() + 1).toString() === selectedMonth;
        });
      }
      if (selectedYear !== "all") {
        filtered = filtered.filter((d) => {
          const date = new Date(d.created_at);
          return date.getFullYear().toString() === selectedYear;
        });
      }

      const grouped: Record<string, MonthlyRow> = {};
      for (const item of filtered) {
        const date = new Date(item.created_at);
        const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`;
        if (!grouped[key]) {
          grouped[key] = { month: key, total: 0, approved: 0, rejected: 0, pending: 0, revision: 0 };
        }
        grouped[key].total++;
        if (item.status === "APPROVED") grouped[key].approved++;
        else if (item.status === "REJECTED") grouped[key].rejected++;
        else if (item.status === "PENDING") grouped[key].pending++;
        else if (item.status === "REVISION") grouped[key].revision++;
      }

      setMonthlyData(
        Object.values(grouped).sort((a, b) => a.month.localeCompare(b.month)),
      );
    } catch {
      /* empty */
    } finally {
      setMonthlyLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(() => {
    const years: string[] = [];
    for (let y = currentYear; y >= currentYear - 5; y--) years.push(String(y));
    return years;
  }, [currentYear]);

  const exportToExcel = () => {
    const wsData = monthlyData.map((d, i) => ({
      No: i + 1,
      Bulan: formatMonth(d.month),
      "Total Pengajuan": d.total,
      Disetujui: d.approved,
      Ditolak: d.rejected,
      Pending: d.pending,
      Revisi: d.revision,
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    ws["!cols"] = [
      { wch: 5 }, { wch: 20 }, { wch: 16 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Bulanan");
    XLSX.writeFile(wb, "laporan-bulanan.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Laporan Bulanan - Smart Cemetery", 14, 22);
    doc.setFontSize(11);
    doc.text(`Tanggal: ${new Date().toLocaleDateString("id-ID")}`, 14, 32);
    autoTable(doc, {
      startY: 40,
      head: [["No", "Bulan", "Total", "Disetujui", "Ditolak", "Pending", "Revisi"]],
      body: monthlyData.map((d, i) => [
        i + 1, formatMonth(d.month), d.total, d.approved, d.rejected, d.pending, d.revision,
      ]),
      theme: "grid",
      headStyles: { fillColor: [16, 185, 129] },
    });
    doc.save("laporan-bulanan.pdf");
  };

  const fetchStats = async () => {
    try {
      const supabase = createClient();

      const [pengajuanResult, profilesResult, makamResult] = await Promise.all([
        supabase.from('pengajuan').select('id,status'),
        supabase.from('profiles').select('id,role'),
        supabase.from('makam').select('id,status'),
      ]);

      if (pengajuanResult.error || profilesResult.error || makamResult.error) {
        const errorMsg = [pengajuanResult.error, profilesResult.error, makamResult.error]
          .filter(Boolean)
          .map(e => e?.message)
          .join(', ');
        setError(`Gagal memuat statistik: ${errorMsg}`);
        setLoading(false);
        return;
      }

      interface PengajuanRaw {
        id: string;
        status: string;
      }
      interface ProfileRaw {
        id: string;
        role: string;
      }
      interface MakamRaw {
        id: string;
        status: string;
      }

      const pengajuanData = (pengajuanResult.data || []) as PengajuanRaw[];
      const profilesData = (profilesResult.data || []) as ProfileRaw[];
      const makamData = (makamResult.data || []) as MakamRaw[];

      const pendingCount = pengajuanData.filter((p) => p.status === 'PENDING').length;
      const approvedCount = pengajuanData.filter((p) => p.status === 'APPROVED').length;
      const rejectedCount = pengajuanData.filter((p) => p.status === 'REJECTED').length;
      const revisionCount = pengajuanData.filter((p) => p.status === 'REVISION').length;

      const makamAvailable = makamData.filter((m) => m.status === 'AVAILABLE').length;
      const makamOccupied = makamData.filter((m) => m.status === 'OCCUPIED').length;
      const makamReserved = makamData.filter((m) => m.status === 'RESERVED').length;

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
    } catch {
      setError("Gagal mengambil data");
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStats();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetchMonthlyData();
  }, [selectedMonth, selectedYear]);

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">Laporan</h1>
          <p className="text-slate-500 text-sm mt-1">Statistik dan ringkasan sistem</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white">
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

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
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

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-5 text-white">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
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

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-bold text-slate-900 text-base mb-5">Status Makam</h3>
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

      {/* Monthly Chart Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
          <h3 className="font-bold text-slate-900 text-base">Tren Pengajuan Bulanan</h3>
          <div className="flex items-center gap-3">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Semua Bulan</option>
              {monthNames.map((name, i) => (
                <option key={i + 1} value={String(i + 1)}>{name}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Semua Tahun</option>
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button
              onClick={exportToExcel}
              disabled={monthlyData.length === 0}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <FileDown size={16} />
              Export Excel
            </button>
            <button
              onClick={exportToPDF}
              disabled={monthlyData.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Download size={16} />
              Export PDF
            </button>
          </div>
        </div>
        {monthlyLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : monthlyData.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  tickFormatter={(v: string) => {
                    const [, m] = v.split("-");
                    return monthNames[parseInt(m, 10) - 1]?.slice(0, 3) || v;
                  }}
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                />
                <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} />
                <Tooltip
                  labelFormatter={(v) => formatMonth(String(v))}
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                />
                <Legend />
                <Bar dataKey="total" name="Total" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="approved" name="Disetujui" fill="#34d399" radius={[4, 4, 0, 0]} />
                <Bar dataKey="rejected" name="Ditolak" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="revision" name="Revisi" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-slate-400">
            <div className="text-center">
              <BarChart3 size={40} className="mx-auto mb-2 opacity-30" />
              <p>Tidak ada data untuk periode ini</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}