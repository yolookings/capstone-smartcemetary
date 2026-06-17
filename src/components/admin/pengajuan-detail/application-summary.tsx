import { FileText, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, User } from "lucide-react";
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
    icon: <Clock size={12} />,
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  APPROVED: {
    label: "Disetujui",
    icon: <CheckCircle size={12} />,
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  REVISION: {
    label: "Perlu Revisi",
    icon: <RefreshCw size={12} />,
    bg: "bg-rose-50 border-rose-200",
    text: "text-rose-700",
    dot: "bg-rose-500",
  },
  REJECTED: {
    label: "Ditolak",
    icon: <XCircle size={12} />,
    bg: "bg-slate-100 border-slate-200",
    text: "text-slate-700",
    dot: "bg-slate-400",
  },
};

function getStatus(key: string) {
  return statusConfig[key] || { label: key, icon: <AlertCircle size={12} />, bg: "bg-slate-100 border-slate-200", text: "text-slate-700", dot: "bg-slate-400" };
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
      <div className="px-5 py-4 lg:px-8 lg:py-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
          {/* Left: Ref Number + Applicant */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 lg:w-11 lg:h-11 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
              <FileText className="text-primary" size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No. Referensi</p>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base lg:text-lg font-bold text-slate-900 font-manrope whitespace-nowrap">
                  {refNumber}
                </h1>
                <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                  #{id.slice(0, 8).toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Metadata row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
            {/* Applicant name */}
            <div className="flex items-center gap-1.5 text-slate-500">
              <User size={13} className="shrink-0 text-slate-400" />
              <span className="font-medium truncate max-w-[180px]">
                {applicantName || <EmptyField label="Nama Tidak Tersedia" />}
              </span>
            </div>

            {/* Date */}
            <div className="flex items-center gap-1.5 text-slate-500 whitespace-nowrap">
              <Clock size={13} className="shrink-0 text-slate-400" />
              <span className="font-medium">{formatDate(createdAt)}</span>
            </div>

            {/* Status badge */}
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${s.bg} ${s.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
              {s.icon}
              {s.label}
            </span>

            {/* Document count */}
            <div className="flex items-center gap-1 text-slate-400 font-medium whitespace-nowrap">
              <FileText size={12} />
              <span>{documentCount} dokumen</span>
            </div>

            {/* Updated at */}
            {updatedAt && (
              <div className="flex items-center gap-1 text-slate-400 whitespace-nowrap">
                <RefreshCw size={12} className="shrink-0" />
                <span>{formatDate(updatedAt)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
