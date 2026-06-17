import { User, Mail, Phone, Shield, Fingerprint } from "lucide-react";
import { EmptyField } from "./empty-field";

interface ApplicantInfoProps {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  applicantName: string | null;
  applicantEmail: string | null;
  applicantPhone: string | null;
}

function FieldRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-neutral/50 transition-colors">
      <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 mt-0.5">
        <div className="text-primary/60">{icon}</div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-slate-800 truncate">
          {value ? value : <EmptyField />}
        </p>
      </div>
    </div>
  );
}

export function ApplicantInfo({ fullName, email, phone, role, applicantName, applicantEmail, applicantPhone }: ApplicantInfoProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div className="p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <User className="text-primary" size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 font-manrope">Informasi Pemohon</h3>
            <p className="text-xs text-slate-400 font-medium">Data pendaftar dan akun pengguna</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-1">
          <FieldRow
            icon={<User size={16} />}
            label="Nama Lengkap (Akun)"
            value={fullName}
          />
          <FieldRow
            icon={<User size={16} />}
            label="Nama Pemohon (Pengajuan)"
            value={applicantName}
          />
          <FieldRow
            icon={<Mail size={16} />}
            label="Email (Akun)"
            value={email}
          />
          <FieldRow
            icon={<Mail size={16} />}
            label="Email Pemohon (Pengajuan)"
            value={applicantEmail}
          />
          <FieldRow
            icon={<Phone size={16} />}
            label="Nomor Telepon (Akun)"
            value={phone}
          />
          <FieldRow
            icon={<Phone size={16} />}
            label="Nomor Telepon (Pemohon)"
            value={applicantPhone}
          />
          <FieldRow
            icon={<Shield size={16} />}
            label="Role"
            value={role}
          />
        </div>
      </div>
    </div>
  );
}
