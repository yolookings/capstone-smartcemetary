import Link from "next/link";
import {
  ArrowRight,
  FileUp,
  CheckCircle2,
  MessageCircleQuestion,
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-12 pb-24 overflow-hidden">
        <div className="container mx-auto px-4 lg:px-12">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-[10px] font-bold tracking-widest uppercase">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
                Digital Curator
              </div>
              <h1 className="text-6xl lg:text-7xl font-extrabold tracking-tighter text-slate-900 leading-[1.1]">
                Aplikasi Pemakaman Berbasis Digital
              </h1>
              <p className="text-lg text-secondary max-w-xl leading-relaxed">
                Modernisasi administrasi pemakaman yang mengedepankan
                penghormatan dan efisiensi. Daftarkan dan kelola data makam
                dengan sentuhan teknologi modern.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/dashboard/pengajuan/baru"
                  className="bg-primary text-white px-8 py-4 rounded-xl font-bold hover:bg-primary-dark transition-all flex items-center gap-3 shadow-lg shadow-primary/20"
                >
                  Mulai Pendaftaran <ArrowRight size={20} />
                </Link>
                <div className="flex items-center gap-4 px-6 py-4 bg-white/50 border border-slate-100 rounded-xl text-secondary text-sm">
                  <MessageCircleQuestion className="text-primary" size={20} />
                  <span>
                    Bingung prosedur? Tanya AI kami di pojok kanan bawah
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 relative">
              <div className="w-full aspect-[4/3] bg-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&q=80&w=1200"
                  alt="Cemetery Park"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-2xl shadow-xl border border-slate-100 hidden md:block">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 leading-none">
                      Terverifikasi
                    </p>
                    <p className="text-xs text-secondary mt-1">
                      Sertifikasi Lahan Digital
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-24 bg-white border-y border-slate-100">
        <div className="container mx-auto px-4 lg:px-12 text-center">
          <h2 className="text-4xl font-bold mb-4">Proses Pendaftaran</h2>
          <p className="text-secondary mb-16 max-w-2xl mx-auto">
            Langkah-langkah sederhana untuk mendaftarkan lokasi peristirahatan
            terakhir yang layak bagi keluarga tercinta secara digital.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <ProcessStep
              num="01"
              icon={<FileUp className="w-6 h-6" />}
              title="Daftar Akun"
              description="Buat akun pendaftar untuk mulai mengelola data administrasi keluarga Anda."
            />
            <ProcessStep
              num="02"
              icon={<FileUp className="w-6 h-6" />}
              title="Upload Dokumen"
              description="Unggah persyaratan scan KTP, KK, dan Surat Kematian melalui panel yang aman."
            />
            <ProcessStep
              num="03"
              icon={<CheckCircle2 className="w-6 h-6" />}
              title="Selesai"
              description="Tunggu verifikasi admin dan pantau status pengajuan Anda secara real-time."
            />
          </div>
        </div>
      </section>

      {/* AI Focus Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 lg:px-12">
          <div className="bg-primary rounded-[3rem] p-12 lg:p-20 text-white flex flex-col lg:flex-row items-center gap-12 overflow-hidden relative">
            <div className="flex-1 space-y-8 relative z-10 text-center lg:text-left">
              <h2 className="text-5xl font-bold leading-tight">
                Butuh Bantuan Segera?
              </h2>
              <p className="text-primary-light text-lg">
                Asisten AI kami siap menjawab pertanyaan Anda mengenai regulasi,
                biaya, dan prosedur pemakaman kapan saja tanpa perlu login.
              </p>
              <div className="inline-flex items-center gap-4 bg-white/10 backdrop-blur-sm px-8 py-4 rounded-2xl border border-white/20 animate-bounce">
                <span className="text-sm font-bold uppercase tracking-widest">
                  Tanya Sekarang di Pojok Kanan Bawah
                </span>
                <ArrowRight size={20} />
              </div>
            </div>
            <div className="flex-1 relative z-10 w-full hidden lg:block">
              <div className="w-full aspect-video bg-white/10 rounded-[2rem] border border-white/20 backdrop-blur-sm p-4 flex items-center justify-center">
                <MessageCircleQuestion size={120} className="text-white/20" />
              </div>
            </div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ProcessStep({
  num,
  icon,
  title,
  description,
}: {
  num: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white p-10 rounded-[2rem] border border-slate-100 hover:shadow-xl transition-all group text-left">
      <div className="mb-8 flex items-center justify-between">
        <div className="w-14 h-14 bg-neutral rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
          {icon}
        </div>
        <span className="text-4xl font-extrabold text-slate-100 group-hover:text-slate-200 transition-colors">
          #{num}
        </span>
      </div>
      <h3 className="text-xl font-bold mb-3 text-slate-900">{title}</h3>
      <p className="text-secondary text-sm leading-relaxed">{description}</p>
    </div>
  );
}
