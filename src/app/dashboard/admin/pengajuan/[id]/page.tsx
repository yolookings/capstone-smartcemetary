import { getCurrentUser, isAdmin } from "@/lib/supabase-auth";
import { supabaseAdmin } from "@/lib/supabase-auth";
import { redirect } from "next/navigation";
import { getPresignedUrl } from "@/lib/storage";
import { FileText, User, Calendar, MapPin, ExternalLink, ArrowLeft } from "lucide-react";
import Link from "next/link";
import StatusUpdateForm from "@/components/admin/status-update-form";

export default async function PengajuanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const adminCheck = await isAdmin();
  if (!adminCheck) {
    redirect("/dashboard");
  }

  const { id } = await params;

  const { data: pengajuan, error } = await supabaseAdmin
    .from('pengajuan')
    .select('*, profiles(*), makam(*), dokumen(*)')
    .eq('id', id)
    .single();

  if (error || !pengajuan) {
    redirect("/dashboard/admin");
  }

  const documentsWithUrls = await Promise.all(
    (pengajuan.dokumen || []).map(async (doc: any) => ({
      ...doc,
      signedUrl: await getPresignedUrl(doc.file_key)
    }))
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/admin" className="p-2 bg-white rounded-lg border border-slate-100 text-slate-500 hover:text-emerald-600">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Detail Pengajuan #{id.slice(0, 8)}</h1>
          <p className="text-slate-500 text-sm">Verifikasi dokumen dan kelola status pengajuan makam.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid md:grid-cols-2 gap-6">
            <InfoCard 
              icon={<User className="text-emerald-600" />} 
              title="Informasi Pendaftar" 
              items={[
                { label: "Nama", value: pengajuan.profiles?.full_name || "-" },
                { label: "Email", value: pengajuan.profiles?.email || "-" }
              ]} 
            />
            <InfoCard 
              icon={<Calendar className="text-emerald-600" />} 
              title="Data Almarhum" 
              items={[
                { label: "Nama", value: pengajuan.makam?.deceased_name || "-" },
                { label: "Tanggal Wafat", value: pengajuan.makam?.deceased_date ? new Date(pengajuan.makam.deceased_date).toLocaleDateString('id-ID') : "-" }
              ]} 
            />
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="text-emerald-600" size={20} />
              Alokasi Lokasi Makam
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Blok</p>
                <p className="text-slate-900 font-medium">{pengajuan.makam?.blok || "Belum ditentukan"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Nomor</p>
                <p className="text-slate-900 font-medium">{pengajuan.makam?.nomor || "Belum ditentukan"}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="text-emerald-600" size={20} />
              Dokumen Persyaratan
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {documentsWithUrls.map((doc: any) => (
                <div key={doc.id} className="p-4 border rounded-xl bg-slate-50 flex items-center justify-between group hover:border-emerald-300 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{doc.type}</p>
                      <p className="text-xs text-slate-500">ID: {doc.id.slice(0, 6)}</p>
                    </div>
                  </div>
                  <a 
                    href={doc.signedUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-white rounded-lg transition-all"
                  >
                    <ExternalLink size={18} />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6 sticky top-24">
            <h2 className="text-lg font-bold text-slate-900">Status Verifikasi</h2>
            <div className="mb-6">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Status Saat Ini</p>
              <span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase ${
                pengajuan.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                pengajuan.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                pengajuan.status === 'REVISION' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
              }`}>
                {pengajuan.status}
              </span>
            </div>
            
            <StatusUpdateForm pengajuanId={pengajuan.id} currentStatus={pengajuan.status} notes={pengajuan.notes || ""} />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon, title, items }: { icon: React.ReactNode; title: string; items: { label: string; value: string }[] }) {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
      <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
        {icon}
        {title}
      </h2>
      <div className="space-y-4">
        {items.map((item, idx) => (
          <div key={idx} className="space-y-1">
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">{item.label}</p>
            <p className="text-slate-900 font-medium">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}