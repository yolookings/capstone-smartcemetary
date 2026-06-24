"use client";

import { useEffect, useState } from "react";
import { Users, Search, UserPlus, Shield, MoreVertical, Mail, Calendar, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

export default function AdminUsersPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Profile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError(`Error fetching: ${fetchError.message}`);
        setLoading(false);
        return;
      }

      setUsers(data || []);
      setFilteredUsers(data || []);
      setLoading(false);
    } catch (err) {
      setError("Gagal mengambil data");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let filtered = users;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.email?.toLowerCase().includes(query) ||
          u.full_name?.toLowerCase().includes(query)
      );
    }

    if (roleFilter) {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [searchQuery, roleFilter, users]);

  const getStats = () => {
    const total = users.length;
    const admins = users.filter((u) => u.role === "ADMIN").length;
    const regularUsers = users.filter((u) => u.role === "USER").length;
    return { total, admins, regularUsers };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <p className="text-slate-600 font-bold">{error}</p>
          <button
            onClick={fetchUsers}
            className="mt-6 px-6 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">Kelola Pengguna</h1>
          <p className="text-secondary text-sm mt-1">
            Kelola semua pengguna sistem
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users className="text-blue-500" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              <p className="text-xs text-slate-500">Total Pengguna</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Shield className="text-emerald-500" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.admins}</p>
              <p className="text-xs text-slate-500">Admin</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <Users className="text-amber-500" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {stats.regularUsers}
              </p>
              <p className="text-xs text-slate-500">Pengguna Biasa</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-50">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <h3 className="font-bold text-lg text-slate-900">Daftar Pengguna</h3>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Cari nama atau email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary w-64"
                />
              </div>
              <select
                value={roleFilter || ""}
                onChange={(e) =>
                  setRoleFilter(e.target.value || null)
                }
                className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Semua Role</option>
                <option value="ADMIN">Admin</option>
                <option value="USER">Pengguna</option>
              </select>
            </div>
          </div>
        </div>

        {filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="text-left px-5 py-3.5">Pengguna</th>
                  <th className="text-left px-5 py-3.5">Email</th>
                  <th className="text-left px-5 py-3.5">Role</th>
                  <th className="text-left px-5 py-3.5">Tanggal Daftar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-xs">
                          {user.full_name?.charAt(0) ||
                            user.email?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {user.full_name || "Tanpa Nama"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Mail size={12} className="text-slate-400" />
                        {user.email}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                          user.role === "ADMIN"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {user.role === "ADMIN" ? "Admin" : "Pengguna"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {new Date(user.created_at).toLocaleDateString("id-ID", {
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
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="text-slate-300" size={32} />
            </div>
            <p className="text-slate-500 font-medium">Tidak ada pengguna</p>
            <p className="text-slate-400 text-sm mt-1">
              Pengguna akan muncul di sini
            </p>
          </div>
        )}
      </div>
    </div>
  );
}