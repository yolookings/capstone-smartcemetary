import { Calendar, User, Fingerprint, Heart, Phone, MapPin, Hash, Cross } from "lucide-react";
import { EmptyField } from "./empty-field";

interface DeceasedInfoProps {
  deceasedName: string | null;
  nik: string | null;
  deceasedDate: string | null;
  relationship: string | null;
  applicantName: string | null;
  applicantPhone: string | null;
  blok: string | null;
  nomor: string | null;
  religion: string | null;
  burialDate: string | null;
}

function FieldRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-neutral/50 transition-colors">
      <div className="w-8 h-8 rounded-lg bg-tertiary/5 flex items-center justify-center shrink-0 mt-0.5">
        <div className="text-tertiary/60">{icon}</div>
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

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

export function DeceasedInfo({ deceasedName, nik, deceasedDate, relationship, applicantName, applicantPhone, blok, nomor, religion, burialDate }: DeceasedInfoProps) {
  const hasGraveAllocation = blok && blok !== "TBA" && nomor && nomor !== "TBA";

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div className="p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-tertiary/10 rounded-xl flex items-center justify-center">
            <Heart className="text-tertiary" size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 font-manrope">Data Almarhum</h3>
            <p className="text-xs text-slate-400 font-medium">Informasi almarhum dan hubungan keluarga</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-1">
          <FieldRow
            icon={<User size={16} />}
            label="Nama Almarhum"
            value={deceasedName}
          />
          <div className="md:col-span-2">
            <FieldRow
              icon={<Fingerprint size={16} />}
              label="NIK"
              value={nik}
            />
          </div>
          <FieldRow
            icon={<Calendar size={16} />}
            label="Tanggal Wafat"
            value={formatDate(deceasedDate)}
          />
          <FieldRow
            icon={<Heart size={16} />}
            label="Hubungan Dengan Pemohon"
            value={relationship}
          />
          <FieldRow
            icon={<Cross size={16} />}
            label="Agama"
            value={religion}
          />
          <FieldRow
            icon={<Calendar size={16} />}
            label="Tanggal Pemakaman"
            value={formatDate(burialDate)}
          />
          <FieldRow
            icon={<User size={16} />}
            label="Nama Pemohon (Almarhum)"
            value={applicantName}
          />
          <FieldRow
            icon={<Phone size={16} />}
            label="No. HP Pemohon"
            value={applicantPhone}
          />
          {hasGraveAllocation && (
            <>
              <FieldRow
                icon={<MapPin size={16} />}
                label="Blok Makam"
                value={blok}
              />
              <FieldRow
                icon={<Hash size={16} />}
                label="Nomor Makam"
                value={nomor}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
