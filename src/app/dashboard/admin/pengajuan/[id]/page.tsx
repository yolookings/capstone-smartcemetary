"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Calendar, MapPin, FileText, Image, Eye, CheckCircle, XCircle, AlertCircle, Clock, Send } from "lucide-react";

interface Dokumen {
  id: string;
  type: string;
  file_url: string;
  file_key: string;
}

interface Makam {
  id: string;
  deceased_name: string;
  deceased_date: string;
  nik: string;
  applicant_name: string;
  applicant_phone: string;
  relationship: string;
  blok: string;
  nomor: string;
  status: string;
}

interface Pengajuan {
  id: string;
  status: string;
  notes: string;
  created_at: string;
  user_id: string;
  profiles?: {
    email: string;
    full_name: string;
  };
  makam?: Makam;
  dokumen?: Dokumen[];
}

interface Props {
  params: Promise<{ id: string }>;
}

export default function PengajuanDetailPage({ params }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pengajuan, setPengajuan] = useState<Pengajuan | null>(null);
  const [documents, setDocuments] = useState<Dokumen[]>([]);
  const [updating, setUpdating] = useState(false);
  const [allocating, setAllocating] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Dokumen | null>(null);
  const [id, setId] = useState<string>("");
  const [blok, setBlok] = useState("");
  const [nomor, setNomor] = useState("");

  useEffect(() => {
    params.then(p => {
      setId(p.id);
      fetchData(p.id);
    });
  }, [params]);

  const fetchData = async (pengajuanId: string) => {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/pengajuan?id=eq.${pengajuanId}&select=*,profiles(email,full_name),makam(*),dokumen(*)`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    const data = await res.json();
    if (data && data.length > 0) {
      setPengajuan(data[0]);
      setDocuments(data[0].dokumen || []);
    }
    setLoading(false);
  };

  const updateStatus = async (newStatus: string, notes: string) => {
    setUpdating(true);
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    await fetch(
      `${SUPABASE_URL}/rest/v1/pengajuan?id=eq.${id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          status: newStatus,
          notes: notes,
        }),
      }
    );

    fetchData(id);
    setUpdating(false);
  };

  const getPresignedUrl = async (fileKey: string) => {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const res = await fetch(
      `${SUPABASE_URL}/storage/v1/object/sign/documents/${fileKey}`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ expiresIn: 300 }),
      }
    );
    const data = await res.json();
    return `${SUPABASE_URL}/storage/v1${data.signedURL}`;
  };

  const allocateGrave = async () => {
    if (!blok || !nomor) return;
    setAllocating(true);
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    await fetch(
      `${SUPABASE_URL}/rest/v1/makam?pengajuan_id=eq.${id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          blok: blok.toUpperCase(),
          nomor: nomor.toUpperCase(),
          status: 'RESERVED',
        }),
      }
    );

    fetchData(id);
    setAllocating(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'APPROVED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'REVISION': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'REJECTED': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Menunggu';
      case 'APPROVED': return 'Disetujui';
      case 'REVISION': return 'Revisi';
      case 'REJECTED': return 'Ditolak';
      default: return status;
    }
  };

  const getDocTypeLabel = (type: string) => {
    switch (type) {
      case 'KTP': return 'KTP Pemohon';
      case 'KK': return 'Kartu Keluarga';
      case 'SURAT_KEMATIAN': return 'Surat Keterangan Kematian';
      default: return type;
    }
  };

  const handleViewDoc = async (doc: Dokumen) => {
    const url = await getPresignedUrl(doc.file_key);
    window.open(url, '_blank');
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[calc(100vh-80px)]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
    </div>
  );

  if (!pengajuan) return (
    <div className="p-8 text-center">
      <p className="text-slate-500">Pengajuan tidak ditemukan</p>
      <Link href="/dashboard/admin" className="text-emerald-600 hover:underline mt-2 inline-block">
        Kembali ke Dashboard
      </Link>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/admin" className="p-2.5 bg-white rounded-xl border border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-300 transition-all shadow-sm">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Detail Pengajuan</h1>
          <p className="text-slate-500 text-sm">Verifikasi dokumen dan kelola status pengajuan</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <User className="text-emerald-600" size={20} />
                </div>
                <h3 className="font-bold text-slate-900">Data Pendaftar</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Nama</p>
                  <p className="text-slate-800 font-medium">{pengajuan.profiles?.full_name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Email</p>
                  <p className="text-slate-800 font-medium">{pengajuan.profiles?.email || '-'}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
                  <Calendar className="text-rose-600" size={20} />
                </div>
                <h3 className="font-bold text-slate-900">Data Almarhum</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Nama</p>
                  <p className="text-slate-800 font-medium">{pengajuan.makam?.deceased_name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Tanggal Wafat</p>
                  <p className="text-slate-800 font-medium">
                    {pengajuan.makam?.deceased_date 
                      ? new Date(pengajuan.makam.deceased_date).toLocaleDateString('id-ID')
                      : '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <MapPin className="text-blue-600" size={20} />
              </div>
              <h3 className="font-bold text-slate-900">Alokasi Lokasi Makam</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Blok</p>
                <input
                  type="text"
                  value={blok || pengajuan.makam?.blok || ''}
                  onChange={(e) => setBlok(e.target.value)}
                  placeholder="Contoh: A, B, C"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Nomor</p>
                <input
                  type="text"
                  value={nomor || pengajuan.makam?.nomor || ''}
                  onChange={(e) => setNomor(e.target.value)}
                  placeholder="Contoh: 01, 02, 03"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
            <button
              onClick={allocateGrave}
              disabled={allocating || (!blok && !nomor)}
              className="mt-4 w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <MapPin size={18} />
              {allocating ? 'Menyimpan...' : 'Simpan Lokasi'}
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <FileText className="text-amber-600" size={20} />
                </div>
                <h3 className="font-bold text-slate-900">Dokumen Persyaratan</h3>
              </div>
              <span className="text-xs font-medium text-slate-500">{documents.length} dokumen</span>
            </div>
            
            {documents.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="p-4 border-2 border-slate-100 rounded-xl hover:border-emerald-300 transition-all group">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                          <Image className="text-slate-500" size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{getDocTypeLabel(doc.type)}</p>
                          <p className="text-xs text-slate-400">{doc.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleViewDoc(doc)}
                      className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-medium text-sm hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Eye size={16} />
                      Lihat Dokumen
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-xl">
                <FileText className="mx-auto text-slate-300 mb-2" size={32} />
                <p className="text-slate-500 text-sm">Tidak ada dokumen diupload</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-6">
            <h3 className="font-bold text-slate-900 text-lg mb-4">Status Verifikasi</h3>
            
            <div className="mb-6">
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Status Saat Ini</p>
              <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(pengajuan.status)}`}>
                {pengajuan.status === 'PENDING' && <Clock size={14} />}
                {pengajuan.status === 'APPROVED' && <CheckCircle size={14} />}
                {pengajuan.status === 'REVISION' && <AlertCircle size={14} />}
                {pengajuan.status === 'REJECTED' && <XCircle size={14} />}
                {getStatusLabel(pengajuan.status)}
              </span>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Update Status</p>
              
              <button
                onClick={() => updateStatus('APPROVED', 'Dokumen diverifikasi dan disetujui')}
                disabled={updating || pengajuan.status === 'APPROVED'}
                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <CheckCircle size={18} />
                Setuju & Approve
              </button>

              <button
                onClick={() => updateStatus('REVISION', 'Perlu perbaikan dokumen')}
                disabled={updating || pengajuan.status === 'REVISION'}
                className="w-full py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <AlertCircle size={18} />
                Minta Revisi
              </button>

              <button
                onClick={() => updateStatus('REJECTED', 'Dokumen tidak valid')}
                disabled={updating || pengajuan.status === 'REJECTED'}
                className="w-full py-3 bg-slate-600 text-white rounded-xl font-semibold hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <XCircle size={18} />
                Tolak Pengajuan
              </button>
            </div>

            {pengajuan.notes && (
              <div className="mt-6 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Catatan</p>
                <p className="text-sm text-slate-600">{pengajuan.notes}</p>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Tanggal Pengajuan</p>
              <p className="text-sm text-slate-600">
                {new Date(pengajuan.created_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
