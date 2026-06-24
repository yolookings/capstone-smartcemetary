"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
  Send,
  Clock,
} from "lucide-react";

interface WhatsAppLogItem {
  id: string;
  pengajuan_id: string;
  recipient_number: string;
  template_name: string;
  status: "success" | "failed";
  error_message: string | null;
  sent_at: string;
}

interface WhatsAppLogProps {
  pengajuanId: string;
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

const templateLabels: Record<string, string> = {
  pengajuan_dibuat: "Pengajuan Dibuat",
  pengajuan_disetujui: "Pengajuan Disetujui",
  permintaan_revisi: "Permintaan Revisi",
  pengajuan_ditolak: "Pengajuan Ditolak",
};

export function WhatsAppLog({ pengajuanId }: WhatsAppLogProps) {
  const [logs, setLogs] = useState<WhatsAppLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/whatsapp/logs/${pengajuanId}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal memuat log");
      }
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat log WhatsApp");
    } finally {
      setLoading(false);
    }
  }, [pengajuanId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleResend = async (logId: string) => {
    setResending(logId);
    try {
      const res = await fetch("/api/whatsapp/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ log_id: logId }),
      });
      if (res.ok) {
        await fetchLogs();
      }
    } catch {
      // silent
    } finally {
      setResending(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <MessageSquare className="text-green-600" size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Notifikasi WhatsApp</h3>
            <p className="text-xs text-slate-400">Riwayat pengiriman</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-6">
          <Loader2 size={20} className="animate-spin text-primary" />
          <span className="ml-2 text-sm text-slate-400">Memuat riwayat...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <MessageSquare className="text-green-600" size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Notifikasi WhatsApp</h3>
            <p className="text-xs text-slate-400">Riwayat pengiriman</p>
          </div>
        </div>
        <p className="text-xs text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <MessageSquare className="text-green-600" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 font-manrope">Notifikasi WhatsApp</h3>
              <p className="text-xs text-slate-400 font-medium">Riwayat pengiriman notifikasi</p>
            </div>
          </div>
          <button
            onClick={fetchLogs}
            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-300 bg-neutral/50 rounded-xl border border-dashed border-slate-200">
            <Send size={32} className="mb-2 opacity-50" />
            <p className="text-sm font-medium">Belum ada notifikasi WhatsApp</p>
            <p className="text-xs mt-1">Notifikasi akan muncul setelah dikirim oleh sistem</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className={`p-4 rounded-xl border ${
                  log.status === "success"
                    ? "bg-emerald-50 border-emerald-100"
                    : "bg-red-50 border-red-100"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {log.status === "success" ? (
                        <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle size={14} className="text-red-600 shrink-0" />
                      )}
                      <span
                        className={`text-xs font-bold ${
                          log.status === "success" ? "text-emerald-700" : "text-red-700"
                        }`}
                      >
                        {templateLabels[log.template_name] || log.template_name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono">{log.recipient_number}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock size={10} className="text-slate-400" />
                      <p className="text-[10px] text-slate-400">{formatDate(log.sent_at)}</p>
                    </div>
                    {log.status === "failed" && log.error_message && (
                      <p className="text-[10px] text-red-500 mt-1">Error: {log.error_message}</p>
                    )}
                  </div>
                  {log.status === "failed" && (
                    <button
                      onClick={() => handleResend(log.id)}
                      disabled={resending === log.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-primary hover:text-white hover:border-primary transition-all shrink-0 disabled:opacity-50"
                    >
                      {resending === log.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <RefreshCw size={12} />
                      )}
                      Kirim Ulang
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
