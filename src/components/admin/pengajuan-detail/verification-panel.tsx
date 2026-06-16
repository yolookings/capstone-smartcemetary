"use client";

import { useState } from "react";
import {
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Loader2,
  ChevronDown,
  FileText,
  Sparkles,
  Map,
} from "lucide-react";
import { ConfirmModal } from "./confirm-modal";

interface Cemetery {
  id: string;
  name: string;
  code: string;
}

interface VerificationPanelProps {
  pengajuanId: string;
  currentStatus: string;
  notes: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt?: string | null;
  documentCount: number;
  cemeteries: Cemetery[];
  onApprove?: () => Promise<void>;
  onApproveAuto: (cemeteryId: string) => Promise<void>;
  onRequestRevision: (note: string) => Promise<void>;
  onReject: (reason: string) => Promise<void>;
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

type ModalAction = "approve-auto" | "approve-manual" | "revision" | "reject" | null;

export function VerificationPanel({
  pengajuanId,
  currentStatus,
  notes,
  rejectionReason,
  createdAt,
  updatedAt,
  documentCount,
  cemeteries,
  onApproveAuto,
  onRequestRevision,
  onReject,
  onRefresh,
}: VerificationPanelProps) {
  const s = getStatus(currentStatus);
  const [activeModal, setActiveModal] = useState<ModalAction>(null);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReasonText, setRejectionReasonText] = useState("");
  const [revisionNote, setRevisionNote] = useState("");
  const [requestingRevision, setRequestingRevision] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCemeteryId, setSelectedCemeteryId] = useState(cemeteries[0]?.id || "");

  const isPending = currentStatus === "PENDING";
  const isApproved = currentStatus === "APPROVED";
  const isRejected = currentStatus === "REJECTED";

  const handleApproveAuto = async () => {
    if (!selectedCemeteryId) return;
    setApproving(true);
    try {
      await onApproveAuto(selectedCemeteryId);
      setActiveModal(null);
    } catch {
      // error handled upstream
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReasonText.trim()) return;
    setRejecting(true);
    try {
      await onReject(rejectionReasonText.trim());
      setRejectionReasonText("");
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

  const handleOpenApproveModal = () => {
    if (cemeteries.length > 0 && !selectedCemeteryId) {
      setSelectedCemeteryId(cemeteries[0].id);
    }
    setActiveModal("approve-auto");
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

          {/* Rejection Reason Display */}
          {isRejected && rejectionReason && (
            <div className="mb-6 p-3 bg-red-50 rounded-xl border border-red-100">
              <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1.5">Alasan Penolakan</p>
              <p className="text-sm text-red-700 leading-relaxed">{rejectionReason}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {isApproved ? "Aksi Lainnya" : "Aksi Verifikasi"}
            </p>

            {/* Primary: Approve with Auto Allocation */}
            <button
              onClick={handleOpenApproveModal}
              disabled={!isPending}
              className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              <Sparkles size={18} />
              {isApproved ? "Telah Disetujui" : "Setujui & Alokasi Otomatis"}
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
              onClick={() => {
                setRejectionReasonText("");
                setActiveModal("reject");
              }}
              disabled={!isPending}
              className="w-full py-3 border border-slate-200 text-slate-500 rounded-xl font-bold text-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <XCircle size={18} />
              Tolak Pengajuan
            </button>
          </div>
        </div>
      </div>

      {/* Approve with Auto Allocation Modal */}
      <ConfirmModal
        open={activeModal === "approve-auto"}
        onClose={() => setActiveModal(null)}
        onConfirm={handleApproveAuto}
        title="Setujui dengan Alokasi Otomatis"
        description="Sistem akan memilih blok dan petak yang tersedia secara otomatis. Pilih pemakaman untuk alokasi."
        confirmLabel="Setujui & Alokasikan"
        confirmVariant="primary"
        loading={approving}
      >
        <div className="space-y-4">
          {cemeteries.length > 0 && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Pilih Pemakaman
              </label>
              <div className="relative">
                <select
                  value={selectedCemeteryId}
                  onChange={(e) => setSelectedCemeteryId(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-medium text-sm appearance-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                >
                  {cemeteries.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
            </div>
          )}
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
            <div className="flex items-start gap-2">
              <Sparkles size={16} className="text-emerald-600 mt-0.5 shrink-0" />
              <p className="text-xs text-emerald-700 font-medium">
                Sistem akan memilih blok dengan prioritas tertinggi yang masih memiliki petak tersedia, lalu
                mengalokasikannya secara otomatis. Pemohon akan menerima notifikasi WhatsApp.
              </p>
            </div>
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
        onClose={() => { setActiveModal(null); setRejectionReasonText(""); }}
        onConfirm={handleReject}
        title="Tolak Pengajuan"
        description="Berikan alasan penolakan yang jelas agar pemohon memahami mengapa pengajuan ditolak."
        confirmLabel="Tolak Pengajuan"
        confirmVariant="danger"
        loading={rejecting}
      >
        <textarea
          className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 text-sm transition-all resize-none"
          rows={4}
          placeholder="Contoh: Data pemohon tidak sesuai dengan KTP yang dilampirkan."
          value={rejectionReasonText}
          onChange={(e) => setRejectionReasonText(e.target.value)}
        />
      </ConfirmModal>
    </>
  );
}
