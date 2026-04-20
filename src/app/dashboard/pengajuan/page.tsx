"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Clock, CheckCircle, AlertCircle, Plus, MapPin, Eye, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";

export default function PengajuanPage() {
  const [pengajuanList, setPengajuanList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const supabase = createClient();

  useEffect(() => {
    const fetchPengajuan = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        window.location.href = '/auth/login';
        return;
      }

      const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/pengajuan?user_id=eq.${user.id}&select=*,makam(nik,blok,nomor,deceased_date,applicant_name,relationship)&order=created_at.desc`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
        }
      );

      const data = await res.json();
      setPengajuanList(data || []);
      setLoading(false);
    };

    fetchPengajuan();
  }, [supabase]);

  const getStatusBadge = (status: string) => {
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
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status] || styles.PENDING}`}>
        {labels[status] || status}
      </span>
    );
  };

  const filteredList = pengajuanList.filter(p => 
    search === "" || 
    p.id.includes(search) ||
    p.makam?.nik?.includes(search)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Status Pengajuan</h1>
          <p className="text-slate-500 text-sm">Lihat status pengajuan makam Anda</p>
        </div>
        <Link href="/dashboard/pengajuan/baru" className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm">
          <Plus size={16} />
          Pengajuan Baru
        </Link>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Cari berdasarkan ID atau NIK..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {filteredList.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredList.map((p: any) => (
              <div key={p.id} className="p-6 hover:bg-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                      <FileText className="text-slate-400" size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">ID: #{p.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-sm text-slate-500">
                        NIK: {p.makam?.nik || '-'} • {new Date(p.created_at).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {getStatusBadge(p.status)}
                    <Link 
                      href={`/dashboard/admin/pengajuan/${p.id}`}
                      className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded-lg"
                    >
                      <Eye size={18} />
                    </Link>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400">Nama Pemohon</p>
                    <p className="font-medium">{p.makam?.applicant_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Hubungan</p>
                    <p className="font-medium">{p.makam?.relationship || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Lokasi Makam</p>
                    <p className="font-medium">{p.makam?.blok || 'TBA'} - {p.makam?.nomor || 'TBA'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Tanggal Wafat</p>
                    <p className="font-medium">{p.makam?.deceased_date ? new Date(p.makam.deceased_date).toLocaleDateString('id-ID') : '-'}</p>
                  </div>
                </div>

                {p.notes && (
                  <div className="mt-4 p-3 bg-amber-50 rounded-lg text-sm">
                    <p className="text-amber-700 font-medium">Catatan:</p>
                    <p className="text-amber-600">{p.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <FileText className="mx-auto text-slate-300 mb-4" size={40} />
            <p className="text-slate-500 mb-4">Belum ada pengajuan</p>
            <Link href="/dashboard/pengajuan/baru" className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm">
              Buat Pengajuan Pertama
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}