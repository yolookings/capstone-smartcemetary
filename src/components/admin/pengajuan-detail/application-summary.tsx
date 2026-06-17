import { FileText, Clock, User, CheckCircle, XCircle, AlertCircle, RefreshCw, Fingerprint } from "lucide-react";
import { EmptyField } from "./empty-field";
import { generateReferenceNumber } from "@/lib/reference-number";

interface ApplicationSummaryProps {
  id: string;
  applicantName: string | null;
  status: string;
  documentCount: number;
  createdAt: string;
  updatedAt?: string | null;
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; bg: string; text: string; dot: string }> = {
  PENDING: {
    label: "Menunggu Verifikasi",
    icon: <Clock size={14} />,
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  APPROVED: {
    label: "Disetujui",
    icon: <CheckCircle size={14} />,
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  REVISION: {
    label: "Perlu Revisi",
    icon: <RefreshCw size={14} />,
    bg: "bg-rose-50 border-rose-200",
    text: "text-rose-700",
    dot: "bg-rose-500",
  },
  REJECTED: {
    label: "Ditolak",
    icon: <XCircle size={14} />,
    bg: "bg-slate-100 border-slate-200",
    text: "text-slate-700",
    dot: "bg-slate-400",
  },
};

function getStatus(key: string) {
  return statusConfig[key] || { label: key, icon: <AlertCircle size={14} />, bg: "bg-slate-100 border-slate-200", text: "text-slate-700", dot: "bg-slate-400" };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ApplicationSummary({ id, applicantName, status, documentCount, createdAt, updatedAt }: ApplicationSummaryProps) {
  const s = getStatus(status);
  const refNumber = generateReferenceNumber(id);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <FileText className="text-primary" size={22} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">No. Referensi</p>
                <h1 className="text-xl lg:text-2xl font-bold text-slate-900 font-manrope break-all">
                  {refNumber}
                </h1>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  ID: #{id.slice(0, 8).toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 lg:gap-6">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <User size={16} className="shrink-0 text-slate-400" />
              <span className="font-medium truncate max-w-[220px]">
                {applicantName || <EmptyField label="Nama Tidak Tersedia" />}
              </span>
            </div>

            <div className="h-6 w-px bg-slate-200 hidden lg:block" />

            <div className="flex items-center gap-2 text-sm text-slate-500 whitespace-nowrap">
              <Clock size={16} className="shrink-0 text-slate-400" />
              <span className="font-medium">{formatDate(createdAt)}</span>
            </div>

            <div className="h-6 w-px bg-slate-200 hidden lg:block" />

            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border whitespace-nowrap ${s.bg} ${s.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
              {s.icon}
              {s.label}
            </span>

            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium whitespace-nowrap">
              <FileText size={14} />
              <span>{documentCount} dokumen</span>
            </div>

            {updatedAt && (
              <>
                <div className="h-6 w-px bg-slate-200 hidden lg:block" />
                <div className="flex items-center gap-2 text-xs text-slate-400 whitespace-nowrap">
                  <RefreshCw size={14} className="shrink-0" />
                  <span>Diperbarui: {formatDate(updatedAt)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
