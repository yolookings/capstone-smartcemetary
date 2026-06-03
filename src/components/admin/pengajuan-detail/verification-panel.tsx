"use client";

import { useState } from "react";
import {
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Send,
  Loader2,
  ChevronDown,
  FileText,
} from "lucide-react";
import { ConfirmModal } from "./confirm-modal";

interface VerificationPanelProps {
  pengajuanId: string;
  currentStatus: string;
  notes: string | null;
  createdAt: string;
  updatedAt?: string | null;
  documentCount: number;
  onApprove: () => Promise<void>;
  onRequestRevision: (note: string) => Promise<void>;
  onReject: () => Promise<void>;
  onRefresh: () => void;
}

interface StatusBadge {
  label: string;
  icon: React.ReactNode;
  bg: string;
  text: string;
  dot: string;
}

const statusConfig: Record<string, StatusBadge> = {
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

function getStatus(key: string): StatusBadge {
  return statusConfig[key] || {
    label: key,
    icon: <AlertCircle size={14} />,
    bg: "bg-slate-100 border-slate-200",
    text: "text-slate-700",
    dot: "bg-slate-400",
  };
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

type ModalAction = "approve" | "revision" | "reject" | null;

export function VerificationPanel({
  pengajuanId,
  currentStatus,
  notes,
  createdAt,
  updatedAt,
  documentCount,
  onApprove,
  onRequestRevision,
  onReject,
  onRefresh,
}: VerificationPanelProps) {
  const s = getStatus(currentStatus);
  const [activeModal, setActiveModal] = useState<ModalAction>(null);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [revisionNote, setRevisionNote] = useState("");
  const [requestingRevision, setRequestingRevision] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isPending = currentStatus === "PENDING";
  const isApproved = currentStatus === "APPROVED";

  const handleApprove = async () => {
    setApproving(true);
    try {
      await onApprove();
      setActiveModal(null);
    } catch {
      // error handled upstream
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    setRejecting(true);
    try {
      await onReject();
      setActiveModal(null);
    } catch {
      // error handled upstream
    } finally {
      setRejecting(false);
    }
  };

  const handleRevision = async () => {
    if (!revisionNote.trim()) return;
    setRequestingRevision(true);
    try {
      await onRequestRevision(revisionNote);
      setRevisionNote("");
      setActiveModal(null);
    } catch {
      // error handled upstream
    } finally {
      setRequestingRevision(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Shield className="text-primary" size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 font-manrope">Verifikasi</h3>
                <p className="text-xs text-slate-400 font-medium">Panel verifikasi admin</p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
              title="Refresh"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            </button>
          </div>

          {/* Current Status */}
          <div className="mb-6 p-4 bg-neutral rounded-xl">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Status Saat Ini</p>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${s.bg} ${s.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
              {s.icon}
              {s.label}
            </div>
          </div>

          {/* Metadata */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between py-2 border-b border-slate-50">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID Pengajuan</span>
              <span className="text-sm font-mono font-bold text-slate-800">#{pengajuanId.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-50">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tanggal Dibuat</span>
              <span className="text-xs font-medium text-slate-600">{formatDate(createdAt)}</span>
            </div>
            {updatedAt && (
              <div className="flex items-center justify-between py-2 border-b border-slate-50">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Terakhir Diperbarui</span>
                <span className="text-xs font-medium text-slate-600">{formatDate(updatedAt)}</span>
              </div>
            )}
            <div className="flex items-center justify-between py-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dokumen</span>
              <span className="text-xs font-medium text-slate-600">{documentCount} file</span>
            </div>
          </div>

          {/* Admin Notes */}
          {notes && (
            <div className="mb-6 p-3 bg-neutral rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Catatan Admin</p>
              <p className="text-sm text-slate-700 leading-relaxed">{notes}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {isApproved ? "Aksi Lainnya" : "Aksi Verifikasi"}
            </p>

            {/* Primary: Approve */}
            <button
              onClick={() => setActiveModal("approve")}
              disabled={!isPending}
              className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              <CheckCircle size={18} />
              {isApproved ? "Telah Disetujui" : "Setujui & Approve"}
            </button>

            {/* Secondary: Request Revision */}
            <button
              onClick={() => setActiveModal("revision")}
              disabled={!isPending}
              className="w-full py-3 border-2 border-amber-400 text-amber-600 rounded-xl font-bold text-sm hover:bg-amber-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <AlertCircle size={18} />
              Minta Revisi Dokumen
            </button>

            {/* Tertiary: Reject */}
            <button
              onClick={() => setActiveModal("reject")}
              disabled={!isPending}
              className="w-full py-3 border border-slate-200 text-slate-500 rounded-xl font-bold text-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <XCircle size={18} />
              Tolak Pengajuan
            </button>
          </div>
        </div>
      </div>

      {/* Approve Confirmation Modal */}
      <ConfirmModal
        open={activeModal === "approve"}
        onClose={() => setActiveModal(null)}
        onConfirm={handleApprove}
        title="Setujui Pengajuan"
        description="Pastikan semua dokumen telah diverifikasi dan data pemohon sudah lengkap. Tindakan ini akan mengirim notifikasi WhatsApp ke pemohon."
        confirmLabel="Setujui Sekarang"
        confirmVariant="primary"
        loading={approving}
      >
        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
          <div className="flex items-start gap-2">
            <FileText size={16} className="text-emerald-600 mt-0.5 shrink-0" />
            <p className="text-xs text-emerald-700 font-medium">
              Setelah disetujui, lokasi makam akan otomatis dialokasikan dan pemohon akan menerima notifikasi.
            </p>
          </div>
        </div>
      </ConfirmModal>

      {/* Revision Modal */}
      <ConfirmModal
        open={activeModal === "revision"}
        onClose={() => { setActiveModal(null); setRevisionNote(""); }}
        onConfirm={handleRevision}
        title="Minta Revisi Dokumen"
        description="Berikan catatan jelas tentang dokumen apa yang perlu diperbaiki oleh pemohon."
        confirmLabel="Kirim Permintaan Revisi"
        confirmVariant="warning"
        loading={requestingRevision}
      >
        <textarea
          className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm transition-all resize-none"
          rows={4}
          placeholder="Contoh: Foto KTP kurang jelas, mohon upload ulang dengan resolusi lebih tinggi."
          value={revisionNote}
          onChange={(e) => setRevisionNote(e.target.value)}
        />
      </ConfirmModal>

      {/* Reject Confirmation Modal */}
      <ConfirmModal
        open={activeModal === "reject"}
        onClose={() => setActiveModal(null)}
        onConfirm={handleReject}
        title="Tolak Pengajuan"
        description="Apakah Anda yakin ingin menolak pengajuan ini? Tindakan ini akan mengirim notifikasi penolakan ke pemohon."
        confirmLabel="Tolak Pengajuan"
        confirmVariant="danger"
        loading={rejecting}
      />
    </>
  );
}
