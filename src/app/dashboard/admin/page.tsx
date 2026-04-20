import { getCurrentUser, isAdmin } from "@/lib/supabase-auth";
import { supabaseAdmin } from "@/lib/supabase-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Eye, FileText, Clock, LayoutDashboard, Database, UserCheck, TrendingUp, Bell, Settings } from "lucide-react";

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  const adminCheck = await isAdmin();

  if (!user || !adminCheck) {
    redirect("/dashboard");
  }

  const { data: allPengajuan } = await supabaseAdmin
    .from('pengajuan')
    .select('*, profiles(email, full_name), makam(deceased_name, blok, nomor)')
    .order('created_at', { ascending: false })
    .limit(10);

  const { count: totalMakam } = await supabaseAdmin
    .from('makam')
    .select('*', { count: 'exact', head: true });

  const { count: pending } = await supabaseAdmin
    .from('pengajuan')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'PENDING');

  const { count: approved } = await supabaseAdmin
    .from('pengajuan')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'APPROVED');

  const { count: revision } = await supabaseAdmin
    .from('pengajuan')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'REVISION');

  const stats = {
    total_makam: totalMakam || 0,
    pending: pending || 0,
    approved: approved || 0,
    revision: revision || 0
  };

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden">
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col p-6 space-y-8 overflow-y-auto">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-2">Menu Utama</p>
          <AdminNavLink icon={<LayoutDashboard size={18} />} label="Dashboard" active />
          <AdminNavLink icon={<FileText size={18} />} label="Pengajuan Masuk" />
          <AdminNavLink icon={<UserCheck size={18} />} label="Verifikasi Dokumen" />
          <AdminNavLink icon={<Database size={18} />} label="Data Makam" />
          <AdminNavLink icon={<Eye size={18} />} label="Manajemen User" />
        </div>
        
        <div className="pt-8 border-t border-slate-100 space-y-1">
          <AdminNavLink icon={<Bell size={18} />} label="Notifikasi" />
          <AdminNavLink icon={<Settings size={18} />} label="Pengaturan" />
        </div>
      </aside>

      <main className="flex-1 bg-neutral overflow-y-auto p-12">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Ringkasan Sistem</h1>
              <p className="text-secondary text-sm mt-1">Pantau status operasional dan pengajuan makam secara real-time.</p>
            </div>
            <div className="px-4 py-2 bg-white rounded-xl border border-slate-100 text-[10px] font-bold text-slate-500 flex items-center gap-2">
              <Clock size={14} />
              {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-6">
            <StatBox icon={<Database className="text-primary" />} label="Total Makam" value={stats.total_makam} sub="+124 Unit baru" color="bg-primary/10" />
            <StatBox icon={<FileText className="text-blue-500" />} label="Pengajuan Masuk" value={stats.pending + stats.approved + stats.revision} sub={`${stats.pending} Perlu diulas`} color="bg-blue-50" />
            <StatBox icon={<Clock className="text-amber-500" />} label="Pending" value={stats.pending} sub="Menunggu" color="bg-amber-50" />
            <StatBox icon={<TrendingUp className="text-rose-500" />} label="Sertifikasi" value="12" sub="85% Tingkat sukses" color="bg-rose-50" />
          </div>

          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-bold text-slate-900">Pengajuan Terbaru</h3>
              <Link href="/dashboard/admin/pengajuan" className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">Semua Data</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50">
                    <th className="text-left pb-4">Pemohon</th>
                    <th className="text-left pb-4">Nama Mendiang</th>
                    <th className="text-left pb-4">Blok / Plot</th>
                    <th className="text-left pb-4">Tanggal</th>
                    <th className="text-left pb-4">Status</th>
                    <th className="text-right pb-4">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {allPengajuan?.map((p: any) => (
                    <tr key={p.id} className="group hover:bg-neutral/50 transition-colors">
                      <td className="py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                            {p.profiles?.full_name?.charAt(0) || p.profiles?.email?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{p.profiles?.full_name || 'Unknown'}</p>
                            <p className="text-[10px] text-slate-400">{p.profiles?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 text-sm font-medium text-slate-600">{p.makam?.deceased_name || '-'}</td>
                      <td className="py-5 text-sm font-medium text-slate-600">
                        {p.makam?.blok ? `Blok ${p.makam.blok} / No. ${p.makam.nomor}` : '-'}
                      </td>
                      <td className="py-5 text-sm text-slate-500">
                        {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                          p.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                          p.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                          p.status === 'REVISION' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-5 text-right">
                        <Link 
                          href={`/dashboard/admin/pengajuan/${p.id}`}
                          className="p-2 bg-neutral rounded-lg text-slate-400 hover:text-primary transition-colors inline-block"
                        >
                          <Eye size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function AdminNavLink({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${active ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-neutral hover:text-slate-600'}`}>
      {icon}
      <span className="text-sm font-bold">{label}</span>
    </div>
  );
}

function StatBox({ icon, label, value, sub, color }: { icon: React.ReactNode, label: string, value: string | number, sub: string, color: string }) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-4">
      <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-3xl font-bold text-slate-900 leading-none mb-2">{value}</p>
        <p className="text-[10px] font-bold text-primary uppercase">{sub}</p>
      </div>
    </div>
  );
}