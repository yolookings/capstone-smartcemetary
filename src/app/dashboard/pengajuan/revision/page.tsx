"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Upload, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";

export default function RevisionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pengajuanId, setPengajuanId] = useState("");
  const [pengajuan, setPengajuan] = useState<any>(null);
  const [ktp, setKtp] = useState<File | null>(null);
  const [kk, setKk] = useState<File | null>(null);
  const [suratKematian, setSuratKematian] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      setPengajuanId(id);
      fetchPengajuan(id);
    }
  }, [searchParams]);

  const fetchPengajuan = async (id: string) => {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/pengajuan?id=eq.${id}&select=*,makam(*)`,
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
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ktp && !kk && !suratKematian) {
      setError("Minimal upload satu dokumen");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("pengajuanId", pengajuanId);
      if (ktp) formData.append("ktp", ktp);
      if (kk) formData.append("kk", kk);
      if (suratKematian) formData.append("suratKematian", suratKematian);

      const res = await fetch("/api/pengajuan/revision", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setSubmitting(false);
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan");
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-white rounded-2xl border shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-emerald-600 w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Revisi Berhasil Dikirim</h1>
          <p className="text-slate-600 mb-8">
            Dokumen revisi Anda telah berhasil diunggah. Admin akan memverifikasi ulang.
          </p>
          <button
            onClick={() => router.push("/dashboard/pengajuan")}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700"
          >
            Kembali ke Daftar Pengajuan
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <button
        onClick={() => router.push("/dashboard/pengajuan")}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
      >
        <ArrowLeft size={20} />
        Kembali
      </button>

      <div className="bg-white rounded-2xl border shadow-sm p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center">
            <AlertCircle className="text-rose-600 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Upload Dokumen Revisi</h1>
            <p className="text-slate-500 text-sm">#{pengajuanId.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>

        {pengajuan?.notes && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <h3 className="font-medium text-amber-800 mb-2">Catatan dari Admin:</h3>
            <p className="text-amber-700">{pengajuan.notes}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Foto KTP <span className="text-rose-500">*</span>
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-slate-400 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setKtp(e.target.files?.[0] || null)}
                className="hidden"
                id="ktp-upload"
              />
              <label htmlFor="ktp-upload" className="cursor-pointer">
                <Upload className="mx-auto text-slate-400 mb-2" />
                <p className="text-sm text-slate-600">
                  {ktp ? ktp.name : "Klik untuk upload foto KTP"}
                </p>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Foto KK</label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-slate-400 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setKk(e.target.files?.[0] || null)}
                className="hidden"
                id="kk-upload"
              />
              <label htmlFor="kk-upload" className="cursor-pointer">
                <Upload className="mx-auto text-slate-400 mb-2" />
                <p className="text-sm text-slate-600">
                  {kk ? kk.name : "Klik untuk upload foto KK"}
                </p>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Surat Kematian <span className="text-rose-500">*</span>
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-slate-400 transition-colors">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setSuratKematian(e.target.files?.[0] || null)}
                className="hidden"
                id="surat-upload"
              />
              <label htmlFor="surat-upload" className="cursor-pointer">
                <Upload className="mx-auto text-slate-400 mb-2" />
                <p className="text-sm text-slate-600">
                  {suratKematian ? suratKematian.name : "Klik untuk upload surat kematian"}
                </p>
              </label>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Upload size={20} />
            Kirim Dokumen Revisi
          </button>
        </form>
      </div>
    </div>
  );
}