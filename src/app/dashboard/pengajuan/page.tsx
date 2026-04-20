"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Clock, CheckCircle, AlertCircle, Plus, Search, User, MapPin, Calendar, ArrowRight, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";

export default function PengajuanPage() {
  const [pengajuanList, setPengajuanList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
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
      if (data && data.length > 0) {
        setSelected(data[0]);
      }
      setLoading(false);
    };

    fetchPengajuan();
  }, [supabase]);

  const getStatusIcon = (status: string) => {
    const config: Record<string, { icon: any; bg: string; text: string; label: string }> = {
      PENDING: { icon: Clock, bg: 'bg-amber-100', text: 'text-amber-600', label: 'Menunggu' },
      APPROVED: { icon: CheckCircle, bg: 'bg-emerald-100', text: 'text-emerald-600', label: 'Disetujui' },
      REVISION: { icon: AlertCircle, bg: 'bg-rose-100', text: 'text-rose-600', label: 'Revisi' },
      REJECTED: { icon: AlertCircle, bg: 'bg-slate-100', text: 'text-slate-600', label: 'Ditolak' },
    };
    return config[status] || config.PENDING;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="flex gap-8">
      <div className="w-80 flex-shrink-0">
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-bold text-slate-900">Daftar Pengajuan</h2>
            <Link href="/dashboard/pengajuan/baru" className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
              <Plus size={16} />
            </Link>
          </div>
          
          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {pengajuanList.length > 0 ? (
              pengajuanList.map((p: any) => {
                const status = getStatusIcon(p.status);
                const Icon = status.icon;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelected(p)}
                    className={`w-full p-4 text-left hover:bg-slate-50 transition-colors ${
                      selected?.id === p.id ? 'bg-emerald-50 border-l-4 border-emerald-600' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full ${status.bg} flex items-center justify-center`}>
                        <Icon size={16} className={status.text} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 text-sm truncate">
                          Pengajuan #{p.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(p.created_at).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                      <ArrowRight size={16} className="text-slate-300" />
                    </div>
                    <div className={`mt-2 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                      {status.label}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400 text-sm">
                Belum ada pengajuan
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1">
        {selected ? (
          <div className="bg-white rounded-xl border shadow-sm p-8">
            {(() => {
              const status = getStatusIcon(selected.status);
              const Icon = status.icon;
              return (
                <>
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-full ${status.bg} flex items-center justify-center`}>
                        <Icon size={32} className={status.text} />
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold text-slate-900">{status.label}</h1>
                        <p className="text-slate-500">ID: #{selected.id.slice(0, 8).toUpperCase()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-8">
                    <h3 className="font-bold text-slate-900 mb-4">Status Verifikasi</h3>
                    <div className="flex items-center gap-4">
                      {['PENDING', 'APPROVED', 'REVISION', 'REJECTED'].map((s, i) => {
                        const isActive = selected.status === s;
                        const isPast = ['PENDING', 'APPROVED', 'REVISION', 'REJECTED'].indexOf(selected.status) > i;
                        const config = getStatusIcon(s);
                        const Icon = config.icon;
                        return (
                          <div key={s} className="flex items-center gap-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              isActive ? config.bg : isPast ? 'bg-slate-200' : 'bg-slate-100'
                            }`}>
                              <Icon size={18} className={isActive ? config.text : 'text-slate-400'} />
                            </div>
                            <span className={`text-sm font-medium ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                              {config.label}
                            </span>
                            {i < 3 && (
                              <div className={`w-8 h-0.5 ${isPast ? 'bg-slate-300' : 'bg-slate-200'}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {selected.notes && (
                    <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <h4 className="font-medium text-amber-800 mb-2">Catatan dari Admin:</h4>
                      <p className="text-amber-700">{selected.notes}</p>
                    </div>
                  )}

                  <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <h4 className="font-medium text-blue-800 mb-2">Butuh Bantuan?</h4>
                    <p className="text-sm text-blue-600 mb-3">
                      Hubungi customer service kami untuk informasi lebih lanjut.
                    </p>
                    <Link 
                      href="/dashboard/chat"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      <Phone size={16} />
                      Hubungi Kami
                    </Link>
                  </div>
                </>
              );
            })()}
          </div>
        ) : (
          <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
            <FileText className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-500 mb-4">Pilih pengajuan untuk melihat detail</p>
            <Link href="/dashboard/pengajuan/baru" className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm">
              Buat Pengajuan Baru
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}