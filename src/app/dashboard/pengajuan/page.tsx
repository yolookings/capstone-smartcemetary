"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Clock, CheckCircle, AlertCircle, Plus, Search, User, MapPin, Calendar, ArrowRight, Phone, MessageCircle, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";

export default function PengajuanPage() {
  const [pengajuanList, setPengajuanList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [dokumenList, setDokumenList] = useState<any[]>([]);
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

  useEffect(() => {
    const fetchDokumen = async () => {
      if (!selected?.id) {
        setDokumenList([]);
        return;
      }

      const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/dokumen?pengajuan_id=eq.${selected.id}&select=*`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
        }
      );

      const data = await res.json();
      setDokumenList(data || []);
    };

    fetchDokumen();
  }, [selected?.id]);

  const getStatusIcon = (status: string) => {
    const config: Record<string, { icon: any; bg: string; text: string; label: string }> = {
      PENDING: { icon: Clock, bg: 'bg-amber-100', text: 'text-amber-600', label: 'Menunggu' },
      APPROVED: { icon: CheckCircle, bg: 'bg-emerald-100', text: 'text-emerald-600', label: 'Disetujui' },
      REVISION: { icon: AlertCircle, bg: 'bg-rose-100', text: 'text-rose-600', label: 'Revisi' },
      NEED_REVISION: { icon: AlertCircle, bg: 'bg-rose-100', text: 'text-rose-600', label: 'Perlu Revisi' },
      REJECTED: { icon: AlertCircle, bg: 'bg-slate-100', text: 'text-slate-600', label: 'Ditolak' },
    };
    return config[status] || config.PENDING;
  };

  const getStepIndex = (status: string): number => {
    const statusMap: Record<string, number> = {
      PENDING: 0,
      REVISION: 1,
      NEED_REVISION: 1,
      VERIFIED: 2,
      VALIDATED: 3,
      APPROVED: 4,
      COMPLETED: 4,
      REJECTED: -1,
    };
    return statusMap[status] ?? 0;
  };

  const steps = [
    { key: 'PENDING', title: 'Pengajuan Diterima', desc: 'Pengajuan Anda telah diterima sistem' },
    { key: 'VERIFIED', title: 'Verifikasi Dokumen', desc: 'Admin sedang memverifikasi dokumen' },
    { key: 'VALIDATED', title: 'Validasi Data', desc: 'Data almarhum sedang divalidasi' },
    { key: 'APPROVED', title: 'Alokasi Makam', desc: 'Lokasi makam sedang dialokasikan' },
    { key: 'COMPLETED', title: 'Selesai', desc: 'Pendaftaran makam telah selesai' },
  ];

  const getDocTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'KTP': 'KTP Pemohon',
      'KK': 'Kartu Keluarga',
      'SURAT_KEMATIAN': 'Surat Kematian',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Status Pengajuan</h1>
        <p className="text-slate-500 text-sm mt-1">Pantau proses pendaftaran makam secara real-time</p>
      </div>

      <div className="grid md:grid-cols-5 gap-8">
        <div className="md:col-span-3 space-y-6">
          {selected ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
              {(() => {
                const status = getStatusIcon(selected.status);
                const Icon = status.icon;
                const currentStep = getStepIndex(selected.status);
                const isRejected = selected.status === 'REJECTED';

                return (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${status.bg} ${status.text}`}>
                        {status.label}
                      </div>

                    </div>

                    <h2 className="text-xl font-extrabold text-slate-900 mb-6">
                      {isRejected
                        ? 'Pengajuan Ditolak'
                        : steps[currentStep]?.title || 'Menunggu'}
                    </h2>

                    <div className="mb-8">
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                          style={{ 
                            width: isRejected 
                              ? '100%' 
                              : `${Math.min(((currentStep + 1) / steps.length) * 100, 100)}%` 
                          }}
                        />
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-slate-400">
                        <span>Mulai</span>
                        <span>Selesai</span>
                      </div>
                    </div>

                    {selected.status === 'REJECTED' && selected.rejection_reason ? (
                      <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                        <h4 className="font-medium text-red-800 mb-2">Alasan Penolakan:</h4>
                        <p className="text-red-700">{selected.rejection_reason}</p>
                      </div>
                    ) : selected.notes && (
                      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <h4 className="font-medium text-amber-800 mb-2">Catatan dari Admin:</h4>
                        <p className="text-amber-700">{selected.notes}</p>
                      </div>
                    )}

                    {selected.status === 'NEED_REVISION' && (
                      <div className="mt-6 p-6 bg-rose-50 border-2 border-rose-300 rounded-xl">
                        <div className="flex items-center gap-3 mb-4">
                          <AlertCircle className="text-rose-600" size={24} />
                          <h3 className="text-lg font-bold text-rose-800">Dokumen Memerlukan Revisi</h3>
                        </div>
                        <p className="text-rose-700 mb-4">
                          Silakan upload dokumen yang telah diperbaiki sesuai catatan admin di atas.
                        </p>
                        <Link 
                          href={`/dashboard/pengajuan/revision?id=${selected.id}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
                        >
                          Upload Dokumen Revisi
                        </Link>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
              <FileText className="mx-auto text-slate-300 mb-4" size={48} />
              <p className="text-slate-500 mb-4">Pilih pengajuan untuk melihat detail</p>
              <Link href="/dashboard/pengajuan/baru" className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm">
                Buat Pengajuan Baru
              </Link>
            </div>
          )}

          {selected && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
              <h3 className="text-lg font-extrabold text-slate-900 mb-6">Timeline Proses</h3>
              
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />

                <div className="space-y-6">
                  {steps.map((step, index) => {
                    const currentStep = getStepIndex(selected.status);
                    const isCompleted = index < currentStep;
                    const isActive = index === currentStep && selected.status !== 'REJECTED';
                    const isRejected = selected.status === 'REJECTED';

                    if (isRejected && index === 0) {
                      return (
                        <div key={step.key} className="relative flex items-start gap-4">
                          <div className="relative z-10 flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                              <XCircle size={16} className="text-rose-600" />
                            </div>
                          </div>
                          <div className="pt-1">
                            <p className="font-bold text-rose-600">Pengajuan Ditolak</p>
                            <p className="text-sm text-slate-500 mt-1">Mohon hubungi admin untuk informasi lebih lanjut</p>
                            <p className="text-xs text-slate-400 mt-2">
                              {selected.updated_at ? new Date(selected.updated_at).toLocaleDateString('id-ID', { 
                                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                              }) : '-'}
                            </p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={step.key} className="relative flex items-start gap-4">
                        <div className="relative z-10 flex-shrink-0">
                          {isCompleted ? (
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                              <CheckCircle size={16} className="text-emerald-600" />
                            </div>
                          ) : isActive ? (
                            <div className="relative">
                              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center animate-pulse">
                                <div className="w-3 h-3 bg-white rounded-full" />
                              </div>
                              <div className="absolute inset-0 w-8 h-8 rounded-full bg-emerald-400 animate-ping opacity-30" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-slate-400" />
                            </div>
                          )}
                        </div>
                        <div className="pt-1">
                          <p className={`font-bold ${isActive ? 'text-slate-900' : isCompleted ? 'text-emerald-700' : 'text-slate-400'}`}>
                            {step.title}
                          </p>
                          <p className="text-sm text-slate-500 mt-1">{step.desc}</p>
                          {isCompleted && (
                            <p className="text-xs text-slate-400 mt-2">
                              {index === 0 && selected.created_at 
                                ? new Date(selected.created_at).toLocaleDateString('id-ID', { 
                                    day: 'numeric', month: 'long', year: 'numeric' 
                                  })
                                : '-'}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-extrabold text-slate-900">Daftar Pengajuan</h2>
              <Link href="/dashboard/pengajuan/baru" className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-shadow hover:shadow-md">
                <Plus size={16} />
              </Link>
            </div>
            
            <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
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

          {selected && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-6">
                <FileText className="text-emerald-600" size={20} />
                <h3 className="text-lg font-extrabold text-slate-900">Detail Pengajuan</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">ID Pengajuan</span>
                  <span className="text-sm font-bold text-slate-900">#{selected.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Nama Pemohon</span>
                  <span className="text-sm font-bold text-slate-900">{selected.makam?.applicant_name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Nama Almarhum</span>
                  <span className="text-sm font-bold text-slate-900">{selected.makam?.nik || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Tanggal Pengajuan</span>
                  <span className="text-sm font-bold text-slate-900">
                    {selected.created_at ? new Date(selected.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    }) : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Lokasi Makam</span>
                  <span className="text-sm font-bold text-slate-900">
                    {selected.makam?.blok && selected.makam?.blok !== 'TBA' 
                      ? `Blok ${selected.makam.blok}, Nomor ${selected.makam.nomor || '-'}`
                      : 'Belum ditentukan'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {selected && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-6">
                <FileText className="text-emerald-600" size={20} />
                <h3 className="text-lg font-extrabold text-slate-900">Dokumen</h3>
              </div>
              
              {dokumenList.length > 0 ? (
                <div className="space-y-3">
                  {dokumenList.map((doc: any) => (
                    <div key={doc.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                        <FileText size={14} className="text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{getDocTypeLabel(doc.type)}</p>
                      </div>
                      {doc.file_url ? (
                        <CheckCircle size={16} className="text-emerald-600" />
                      ) : (
                        <Clock size={16} className="text-slate-400" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">Belum ada dokumen diupload</p>
              )}
            </div>
          )}

          {selected && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
              <Link 
                href="/dashboard/chat"
                className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-emerald-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-emerald-200 transition-all"
              >
                <MessageCircle size={18} />
                Tanya AI Navigator
              </Link>
              <button className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-white border-2 border-emerald-600 text-emerald-600 font-bold rounded-xl hover:bg-emerald-50 transition-colors">
                <Phone size={18} />
                Hubungi Admin
              </button>
            </div>
          )}

          {selected && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-6">
                <MapPin className="text-emerald-600" size={20} />
                <h3 className="text-lg font-extrabold text-slate-900">Status Lokasi Makam</h3>
              </div>
              
              <div className="bg-slate-100 rounded-xl p-8 text-center mb-4">
                <MapPin className="mx-auto text-slate-300 mb-2" size={32} />
                <p className="text-sm text-slate-400">Peta lokasi akan ditampilkan di sini</p>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <MapPin size={16} className="text-emerald-600" />
                <span className="font-medium text-slate-700">
                  {selected.makam?.blok && selected.makam?.blok !== 'TBA'
                    ? `Lokasi: Blok ${selected.makam.blok}, Nomor ${selected.makam.nomor || '-'}`
                    : 'Lokasi belum ditentukan'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}