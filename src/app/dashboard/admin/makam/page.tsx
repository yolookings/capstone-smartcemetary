"use client";

import { useEffect, useState } from "react";
import { MapPin, Search, Plus, AlertCircle, Calendar, User, Edit, Trash2, Eye } from "lucide-react";

interface Makam {
  id: string;
  blok: string;
  nomor: string;
  status: string;
  deceased_name: string | null;
  deceased_date: string | null;
  user_id: string | null;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

export default function AdminMakamPage() {
  const [loading, setLoading] = useState(true);
  const [makamList, setMakamList] = useState<Makam[]>([]);
  const [filteredMakam, setFilteredMakam] = useState<Makam[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchMakam = async () => {
    try {
      const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!SUPABASE_URL || !SUPABASE_KEY) {
        setError("Konfigurasi Supabase tidak ditemukan");
        setLoading(false);
        return;
      }

      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/makam?select=*,profiles(full_name,email)&order=created_at.desc`,
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

      const data: Makam[] = await res.json();
      setMakamList(data);
      setFilteredMakam(data);
      setLoading(false);
    } catch (err) {
      setError("Gagal mengambil data");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMakam();
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

  const getStats = () => {
    const total = makamList.length;
    const available = makamList.filter((m) => m.status === "AVAILABLE").length;
    const reserved = makamList.filter((m) => m.status === "RESERVED").length;
    const occupied = makamList.filter((m) => m.status === "OCCUPIED").length;
    return { total, available, reserved, occupied };
  };

  const stats = getStats();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "RESERVED":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "OCCUPIED":
        return "bg-rose-100 text-rose-700 border-rose-200";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "Tersedia";
      case "RESERVED":
        return "Dipesan";
      case "OCCUPIED":
        return "Terisi";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
            onClick={fetchMakam}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
          >
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
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Kelola Makam</h1>
          <p className="text-slate-500 text-sm mt-1">
            Kelola semua data makam dan lokasi
          </p>
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
              <p className="text-2xl font-bold text-slate-900">
                {stats.available}
              </p>
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
              <p className="text-2xl font-bold text-slate-900">
                {stats.reserved}
              </p>
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
              <p className="text-2xl font-bold text-slate-900">
                {stats.occupied}
              </p>
              <p className="text-sm text-slate-500">Terisi</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h3 className="font-bold text-slate-900 text-lg">Daftar Makam</h3>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Cari blok, nomor, atau nama..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent w-64"
                />
              </div>
              <select
                value={statusFilter || ""}
                onChange={(e) =>
                  setStatusFilter(e.target.value || null)
                }
                className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Semua Status</option>
                <option value="AVAILABLE">Tersedia</option>
                <option value="RESERVED">Dipesan</option>
                <option value="OCCUPIED">Terisi</option>
              </select>
            </div>
          </div>
        </div>

        {filteredMakam.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="text-left px-6 py-4">Lokasi</th>
                  <th className="text-left px-6 py-4">Jenazah</th>
                  <th className="text-left px-6 py-4">Pemilik/Pemohon</th>
                  <th className="text-left px-6 py-4">Status</th>
                  <th className="text-left px-6 py-4">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredMakam.map((makam) => (
                  <tr
                    key={makam.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-slate-400" />
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-xs font-medium">
                          Blok {makam.blok} / No. {makam.nomor}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-900">
                        {makam.deceased_name || "-"}
                      </p>
                      {makam.deceased_date && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          Wafat:{" "}
                          {new Date(makam.deceased_date).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {makam.profiles ? (
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {makam.profiles.full_name || "Tanpa Nama"}
                          </p>
                          <p className="text-xs text-slate-400">
                            {makam.profiles.email}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(
                          makam.status
                        )}`}
                      >
                        {getStatusLabel(makam.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(makam.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="text-slate-300" size={32} />
            </div>
            <p className="text-slate-500 font-medium">Tidak ada makam</p>
            <p className="text-slate-400 text-sm mt-1">
              Data makam akan muncul di sini
            </p>
          </div>
        )}
      </div>
    </div>
  );
}