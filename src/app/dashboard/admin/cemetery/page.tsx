"use client";

import { useEffect, useState } from "react";
import { MapPin, Search, AlertCircle, RefreshCw, Wifi, WifiOff, Grid3X3, List, LayoutGrid } from "lucide-react";

interface Makam {
  id: string;
  blok: string;
  nomor: string;
  status: string;
  deceased_name: string | null;
  deceased_date: string | null;
  user_id: string | null;
  created_at: string;
}

interface Stats {
  total: number;
  available: number;
  reserved: number;
  occupied: number;
}

export default function AdminCemeteryPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [makamList, setMakamList] = useState<Makam[]>([]);
  const [filteredMakam, setFilteredMakam] = useState<Makam[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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
        setError("Konfigurasi Supabase tidak ditemukan");
        setConnectionStatus('disconnected');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      };

      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/makam?select=*&order=blok,nomor`,
        { headers }
      );

      if (!res.ok) {
        setError(`Gagal terhubung ke server. Status: ${res.status}`);
        setConnectionStatus('disconnected');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      setConnectionStatus('connected');
      const data: Makam[] = await res.json();
      setMakamList(data);
      setFilteredMakam(data);
      setLoading(false);
      setRefreshing(false);
    } catch (err) {
      setError("Tidak dapat terhubung ke server");
      setConnectionStatus('disconnected');
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = makamList;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.blok?.toLowerCase().includes(query) ||
          m.nomor?.toLowerCase().includes(query) ||
          m.deceased_name?.toLowerCase().includes(query)
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((m) => m.status === statusFilter);
    }

    setFilteredMakam(filtered);
  }, [searchQuery, statusFilter, makamList]);

  const stats: Stats = {
    total: makamList.length,
    available: makamList.filter((m) => m.status === "AVAILABLE").length,
    reserved: makamList.filter((m) => m.status === "RESERVED").length,
    occupied: makamList.filter((m) => m.status === "OCCUPIED").length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE": return "bg-emerald-500";
      case "RESERVED": return "bg-amber-500";
      case "OCCUPIED": return "bg-rose-500";
      default: return "bg-slate-400";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "AVAILABLE": return "Tersedia";
      case "RESERVED": return "Dipesan";
      case "OCCUPIED": return "Terisi";
      default: return status;
    }
  };

  const groupedByBlok = filteredMakam.reduce((acc, m) => {
    if (!acc[m.blok]) acc[m.blok] = [];
    acc[m.blok].push(m);
    return acc;
  }, {} as Record<string, Makam[]>);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-slate-500">Memuat data makam...</p>
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
          <h2 className="text-xl font-bold text-slate-900 mb-2">Gagal Memuat Data</h2>
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

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Monitoring Makam</h1>
          <p className="text-slate-500 text-sm mt-1">Pantau ketersediaan dan penggunaan makam</p>
        </div>
        <div className="flex items-center gap-3">
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
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <MapPin className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              <p className="text-sm text-slate-500">Total Makam</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <MapPin className="text-emerald-600" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.available}</p>
              <p className="text-sm text-slate-500">Tersedia</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <MapPin className="text-amber-600" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.reserved}</p>
              <p className="text-sm text-slate-500">Dipesan</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center">
              <MapPin className="text-rose-600" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.occupied}</p>
              <p className="text-sm text-slate-500">Terisi</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h3 className="font-bold text-slate-900 text-lg">Peta Makam</h3>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Cari blok atau nomor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent w-64"
                />
              </div>
              <select
                value={statusFilter || ""}
                onChange={(e) => setStatusFilter(e.target.value || null)}
                className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Semua Status</option>
                <option value="AVAILABLE">Tersedia</option>
                <option value="RESERVED">Dipesan</option>
                <option value="OCCUPIED">Terisi</option>
              </select>
              <div className="flex border border-slate-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 ${viewMode === 'grid' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                >
                  <Grid3X3 size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 ${viewMode === 'list' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {filteredMakam.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(groupedByBlok).map(([blok, makams]) => (
                  <div key={blok} className="border border-slate-200 rounded-xl p-4">
                    <h4 className="font-bold text-slate-900 mb-3">Blok {blok}</h4>
                    <div className="grid grid-cols-5 gap-2">
                      {makams.map((m) => (
                        <div
                          key={m.id}
                          className={`w-full aspect-square rounded-lg ${getStatusColor(m.status)} flex items-center justify-center text-white text-xs font-bold`}
                          title={`No. ${m.nomor} - ${getStatusLabel(m.status)}`}
                        >
                          {m.nomor}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="text-left px-6 py-4">Blok</th>
                    <th className="text-left px-6 py-4">Nomor</th>
                    <th className="text-left px-6 py-4">Status</th>
                    <th className="text-left px-6 py-4">Jenazah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredMakam.map((makam) => (
                    <tr key={makam.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">{makam.blok}</td>
                      <td className="px-6 py-4 text-slate-600">{makam.nomor}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          makam.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700' :
                          makam.status === 'RESERVED' ? 'bg-amber-100 text-amber-700' :
                          'bg-rose-100 text-rose-700'
                        }`}>
                          {getStatusLabel(makam.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{makam.deceased_name || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <div className="p-16 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="text-slate-300" size={40} />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Tidak ada data makam</h3>
            <p className="text-slate-500 text-sm">Data makam akan muncul di sini</p>
          </div>
        )}
      </div>
    </div>
  );
}