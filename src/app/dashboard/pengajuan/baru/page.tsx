"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, User, Phone, MapPin } from "lucide-react";

export default function BaruPengajuanPage() {
  const [nik, setNik] = useState("");
  const [deceasedDate, setDeceasedDate] = useState("");
  const [applicantName, setApplicantName] = useState("");
  const [applicantPhone, setApplicantPhone] = useState("");
  const [relationship, setRelationship] = useState("Suami / Istri");
  const [relationshipOther, setRelationshipOther] = useState("");
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [ktp, setKtp] = useState<File | null>(null);
  const [kk, setKk] = useState<File | null>(null);
  const [suratKematian, setSuratKematian] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleRelationshipChange = (value: string) => {
    setRelationship(value);
    setShowOtherInput(value === "Lainnya");
    if (value !== "Lainnya") {
      setRelationshipOther("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const relationshipFinal = relationship === "Lainnya" && relationshipOther 
        ? relationshipOther 
        : relationship;

      const formData = new FormData();
      formData.append("nik", nik);
      formData.append("deceasedDate", deceasedDate);
      formData.append("applicantName", applicantName);
      formData.append("applicantPhone", applicantPhone);
      formData.append("relationship", relationshipFinal);
      if (ktp) formData.append("ktp", ktp);
      if (kk) formData.append("kk", kk);
      if (suratKematian) formData.append("suratKematian", suratKematian);

      const res = await fetch("/api/pengajuan", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/dashboard/pengajuan");
        }, 2000);
      } else {
        const data = await res.json();
        setError(data.error || "Gagal mengirim pengajuan.");
      }
    } catch (err) {
      setError("Terjadi kesalahan sistem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      <div className="flex flex-col md:flex-row gap-12">
        <div className="w-full md:w-1/3 space-y-8">
          <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden group">
            <img 
              src="https://images.unsplash.com/photo-1511216335778-7cb8f49fa7a3?auto=format&fit=crop&q=80&w=800" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
              alt="Nature"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/90 to-transparent flex flex-col justify-end p-8 text-white">
              <h1 className="text-3xl font-bold mb-2">Formulir Pendaftaran</h1>
              <p className="text-sm opacity-80 leading-relaxed">
                Lengkapi data untuk mendigitalisasi memori orang yang tersayang ke dalam sistem kurasi kami.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 uppercase tracking-widest text-xs">Persyaratan Dokumen</h3>
            <ul className="space-y-3">
              <RequirementItem text="Scan KTP Pemohon Asli" />
              <RequirementItem text="Scan Kartu Keluarga Asli" />
              <RequirementItem text="Surat Keterangan Kematian" />
            </ul>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-12 bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-6 py-4 rounded-2xl flex items-center gap-3">
              <CheckCircle size={20} />
              <p className="text-sm font-medium">Pengajuan berhasil dikirim! Mengalihkan ke halaman status...</p>
            </div>
          )}

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 px-6 py-4 rounded-2xl flex items-center gap-3">
              <AlertCircle size={20} />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-neutral rounded-full flex items-center justify-center font-bold text-primary">1</div>
              <h2 className="text-xl font-bold text-slate-900">Data Almarhum</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <FormGroup label="NIK Almarhum/ah">
                <input 
                  type="text" 
                  required 
                  value={nik}
                  onChange={(e) => setNik(e.target.value)}
                  className="input-pill w-full" 
                  placeholder="Masukkan NIK (16 digit)"
                  maxLength={16}
                />
              </FormGroup>
              <FormGroup label="Tanggal Wafat">
                <input 
                  type="date" 
                  required 
                  value={deceasedDate}
                  onChange={(e) => setDeceasedDate(e.target.value)}
                  className="input-pill w-full" 
                />
              </FormGroup>
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-neutral rounded-full flex items-center justify-center font-bold text-primary">2</div>
              <h2 className="text-xl font-bold text-slate-900">Data Pemohon</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <FormGroup label="Nama Lengkap Pemohon">
                <input 
                  type="text" 
                  required 
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  className="input-pill w-full" 
                  placeholder="Sesuai KTP"
                />
              </FormGroup>
              <FormGroup label="Nomor WhatsApp">
                <input 
                  type="tel" 
                  required 
                  value={applicantPhone}
                  onChange={(e) => setApplicantPhone(e.target.value)}
                  className="input-pill w-full" 
                  placeholder="0812 xxxx xxxx"
                />
              </FormGroup>
              <FormGroup label="Hubungan Dengan Almarhum">
                <select 
                  value={relationship}
                  onChange={(e) => handleRelationshipChange(e.target.value)}
                  className="input-pill w-full appearance-none bg-no-repeat bg-[right_1.5rem_center]"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundSize: '1rem' }}
                >
                  <option>Suami / Istri</option>
                  <option>Anak</option>
                  <option>Orang Tua</option>
                  <option>Saudara Kandung</option>
                  <option>Lainnya</option>
                </select>
              </FormGroup>
              {showOtherInput && (
                <FormGroup label="Hubungan Lainnya">
                  <input 
                    type="text" 
                    value={relationshipOther}
                    onChange={(e) => setRelationshipOther(e.target.value)}
                    className="input-pill w-full" 
                    placeholder="Sebutkan hubungan Anda"
                    required
                  />
                </FormGroup>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-neutral rounded-full flex items-center justify-center font-bold text-primary">3</div>
              <h2 className="text-xl font-bold text-slate-900">Lampiran Dokumen</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <UploadBox label="Upload KTP" file={ktp} setFile={setKtp} id="ktp" />
              <UploadBox label="Upload KK" file={kk} setFile={setKk} id="kk" />
              <UploadBox label="Surat Kematian" file={suratKematian} setFile={setSuratKematian} id="sk" />
            </div>
          </div>

          <div className="pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" required className="w-5 h-5 rounded accent-primary" />
              <span className="text-xs text-secondary leading-tight">
                Saya menyatakan bahwa data yang saya kirimkan adalah benar dan dapat dipertanggungjawabkan.
              </span>
            </label>
            <button 
              type="submit" 
              disabled={loading}
              className="bg-primary text-white px-12 py-4 rounded-xl font-bold hover:bg-primary-dark transition-all flex items-center gap-3 disabled:opacity-50 shadow-lg shadow-primary/20 w-full md:w-auto justify-center"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : null}
              Kirim Pengajuan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RequirementItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3 text-sm text-secondary">
      <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
      {text}
    </li>
  );
}

function FormGroup({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-4">{label}</label>
      {children}
    </div>
  );
}

function UploadBox({ label, file, setFile, id }: { label: string, file: File | null, setFile: (f: File | null) => void, id: string }) {
  return (
    <div className="space-y-3">
      <div className="relative aspect-square border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center p-6 text-center hover:border-primary/50 transition-colors bg-neutral/50 group">
        <input 
          type="file" 
          accept="image/*,.pdf" 
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="absolute inset-0 opacity-0 cursor-pointer" 
          id={id}
        />
        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-secondary mb-4 group-hover:scale-110 transition-transform">
          <Upload size={24} />
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-[10px] text-slate-400 truncate w-full px-2">{file ? file.name : "PDF/JPG Max 2MB"}</p>
      </div>
    </div>
  );
}