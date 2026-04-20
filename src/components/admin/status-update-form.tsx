"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, MessageSquare, Loader2 } from "lucide-react";

export default function StatusUpdateForm({ 
  pengajuanId, 
  currentStatus, 
  notes: initialNotes 
}: { 
  pengajuanId: string; 
  currentStatus: string; 
  notes: string 
}) {
  const [status, setStatus] = useState(currentStatus);
  const [notes, setNotes] = useState(initialNotes);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/pengajuan/${pengajuanId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes }),
      });

      if (res.ok) {
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: 'APPROVED', label: 'Setuju', color: 'emerald', icon: <Check size={18} /> },
    { value: 'REVISION', label: 'Revisi', color: 'rose', icon: <MessageSquare size={18} /> },
    { value: 'REJECTED', label: 'Tolak', color: 'slate', icon: <X size={18} /> },
    { value: 'PENDING', label: 'Tunda', color: 'amber', icon: <MessageSquare size={18} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Update Status</p>
        <div className="grid grid-cols-4 gap-2">
          {statusOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setStatus(opt.value)}
              className={`flex flex-col items-center justify-center gap-1 p-3 border rounded-xl transition-all ${
                status === opt.value 
                  ? `bg-${opt.color}-600 text-white border-${opt.color}-600` 
                  : `bg-white text-${opt.color}-600 border-${opt.color}-200 hover:bg-${opt.color}-50`
              }`}
            >
              {opt.icon}
              <span className="text-[10px] font-bold uppercase">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Catatan / Feedback</label>
        <textarea 
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none min-h-[120px] text-sm" 
          placeholder={
            status === 'APPROVED' ? 'Selamat! Pengajuan disetujui...' :
            status === 'REVISION' ? 'Mohon lengkapi dokumen...' :
            status === 'REJECTED' ? 'Alasan penolakan...' :
            'Catatan tambahan...'
          }
        />
      </div>

      <button 
        onClick={handleUpdate}
        disabled={loading || (status === currentStatus && notes === initialNotes)}
        className="w-full py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading && <Loader2 className="animate-spin" size={20} />}
        Simpan Perubahan
      </button>
    </div>
  );
}