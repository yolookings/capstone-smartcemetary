"use client";

import { useState } from "react";
import { FileText, Eye, FileImage, File, CheckCircle, Clock, AlertCircle, XCircle, Loader2, Download } from "lucide-react";
import { EmptyField } from "./empty-field";

interface DocumentCardProps {
  id: string;
  type: string;
  fileUrl: string;
  fileKey: string;
  createdAt?: string | null;
  onView: (fileKey: string) => Promise<string>;
  verificationStatus?: "uploaded" | "verified" | "pending" | "revision" | "missing";
}

const docTypeConfig: Record<string, { label: string; icon: React.ReactNode; description: string }> = {
  KTP: {
    label: "KTP Pemohon",
    icon: <FileText size={18} />,
    description: "Kartu Tanda Penduduk pemohon yang masih berlaku",
  },
  KK: {
    label: "Kartu Keluarga",
    icon: <FileImage size={18} />,
    description: "Kartu Keluarga yang menunjukkan hubungan keluarga",
  },
  SURAT_KEMATIAN: {
    label: "Surat Keterangan Kematian",
    icon: <FileText size={18} />,
    description: "Surat kematian dari kelurahan/rumah sakit",
  },
  SURAT_RT_RW: {
    label: "Surat Pengantar RT/RW",
    icon: <File size={18} />,
    description: "Surat pengantar dari ketua RT dan RW setempat",
  },
};

function getDocConfig(type: string) {
  return docTypeConfig[type] || {
    label: type.replace(/_/g, " "),
    icon: <File size={18} />,
    description: "Dokumen persyaratan",
  };
}

const statusConfig = {
  uploaded: { label: "Telah Diupload", icon: <CheckCircle size={14} />, bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  verified: { label: "Terverifikasi", icon: <CheckCircle size={14} />, bg: "bg-blue-50 text-blue-700 border-blue-200" },
  pending: { label: "Menunggu Review", icon: <Clock size={14} />, bg: "bg-amber-50 text-amber-700 border-amber-200" },
  revision: { label: "Perlu Revisi", icon: <AlertCircle size={14} />, bg: "bg-rose-50 text-rose-700 border-rose-200" },
  missing: { label: "Belum Diupload", icon: <XCircle size={14} />, bg: "bg-slate-100 text-slate-500 border-slate-200" },
};

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

export function DocumentCard({ id, type, fileUrl, fileKey, createdAt, onView, verificationStatus = "uploaded" }: DocumentCardProps) {
  const [viewing, setViewing] = useState(false);
  const config = getDocConfig(type);
  const status = statusConfig[verificationStatus];
  const dateLabel = formatDate(createdAt);

  const handleView = async () => {
    setViewing(true);
    try {
      const signedUrl = await onView(fileKey);
      window.open(signedUrl, "_blank");
    } catch (err) {
      console.error("Failed to open document:", err);
    } finally {
      setViewing(false);
    }
  };

  return (
    <div className="group relative bg-white border border-slate-100 rounded-xl hover:border-primary/20 hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className="p-4 lg:p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
              <div className="text-primary/70">{config.icon}</div>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{config.label}</p>
              <p className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">{config.description}</p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${status.bg}`}>
            {status.icon}
            {status.label}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium mb-4">
          <span className="truncate max-w-[140px]">ID: {id.slice(0, 8)}</span>
          {dateLabel && (
            <>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span>{dateLabel}</span>
            </>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleView}
            disabled={viewing}
            className="flex-1 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
          >
            {viewing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Eye size={14} />
            )}
            {viewing ? "Membuka..." : "Lihat Dokumen"}
          </button>
          {fileUrl && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 border border-slate-200 rounded-xl text-slate-400 hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all"
              title="Download"
            >
              <Download size={16} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
