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

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Update Status</p>
        <div className="grid grid-cols-3 gap-2">
          <StatusButton 
            active={status === 'APPROVED'} 
            onClick={() => setStatus('APPROVED')} 
            color="emerald" 
            label="Approve" 
            icon={<Check size={16} />} 
          />
          <StatusButton 
            active={status === 'REVISION'} 
            onClick={() => setStatus('REVISION')} 
            color="rose" 
            label="Revisi" 
            icon={<X size={16} />} 
          />
          <StatusButton 
            active={status === 'PENDING'} 
            onClick={() => setStatus('PENDING')} 
            color="amber" 
            label="Pending" 
            icon={<MessageSquare size={16} />} 
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Catatan Revisi / Feedback</label>
        <textarea 
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none min-h-[120px] text-sm" 
          placeholder="Berikan alasan jika perlu revisi..."
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

function StatusButton({ active, onClick, color, label, icon }: { active: boolean; onClick: () => void; color: string; label: string; icon: React.ReactNode }) {
  const colorClasses: Record<string, string> = {
    emerald: active ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50',
    rose: active ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50',
    amber: active ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-amber-600 border-amber-200 hover:bg-amber-50',
  };

  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 p-3 border rounded-xl transition-all ${colorClasses[color]}`}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase">{label}</span>
    </button>
  );
}
