"use client";

import { useState, useEffect } from "react";
import { MapPin, Save, Loader2, CheckCircle, Map } from "lucide-react";
import { EmptyField } from "./empty-field";

interface GraveAllocationProps {
  pengajuanId: string;
  currentBlok: string | null;
  currentNomor: string | null;
  graveStatus: string | null;
  pengajuanStatus: string;
  onAllocate: (blok: string, nomor: string) => Promise<void>;
  onRefresh: () => void;
}

const graveStatusConfig: Record<string, { label: string; bg: string; text: string }> = {
  AVAILABLE: { label: "Tersedia", bg: "bg-emerald-50", text: "text-emerald-700" },
  RESERVED: { label: "Dipesan", bg: "bg-amber-50", text: "text-amber-700" },
  OCCUPIED: { label: "Terisi", bg: "bg-slate-100", text: "text-slate-600" },
};

export function GraveAllocation({ pengajuanId, currentBlok, currentNomor, graveStatus, pengajuanStatus, onAllocate, onRefresh }: GraveAllocationProps) {
  const [blok, setBlok] = useState(currentBlok && currentBlok !== "TBA" ? currentBlok : "");
  const [nomor, setNomor] = useState(currentNomor && currentNomor !== "TBA" ? currentNomor : "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const isApproved = pengajuanStatus === "APPROVED";
  const gs = graveStatusConfig[graveStatus || ""];

  useEffect(() => {
    if (currentBlok && currentBlok !== "TBA") setBlok(currentBlok);
    if (currentNomor && currentNomor !== "TBA") setNomor(currentNomor);
  }, [currentBlok, currentNomor]);

  const handleSave = async () => {
    if (!blok.trim() || !nomor.trim()) return;
    setSaving(true);
    try {
      await onAllocate(blok.trim().toUpperCase(), nomor.trim().toUpperCase());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onRefresh();
    } catch {
      // error handled upstream
    } finally {
      setSaving(false);
    }
  };

  const hasAllocation = currentBlok && currentBlok !== "TBA" && currentNomor && currentNomor !== "TBA";

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div className="p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <MapPin className="text-primary" size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 font-manrope">Alokasi Lokasi Makam</h3>
            <p className="text-xs text-slate-400 font-medium">Tentukan blok dan nomor makam</p>
          </div>
        </div>

        {hasAllocation && (
          <div className="mb-6 p-4 bg-primary/5 rounded-xl border border-primary/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Map className="text-primary" size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  Blok {currentBlok} — No. {currentNomor}
                </p>
                {gs && (
                  <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${gs.bg} ${gs.text}`}>
                    {gs.label}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Blok Makam</label>
            <input
              type="text"
              value={blok}
              onChange={(e) => setBlok(e.target.value.toUpperCase())}
              placeholder="Contoh: A, B, C"
              disabled={isApproved}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-medium text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors disabled:bg-slate-50 disabled:text-slate-400"
            />
            {!blok && <p className="text-[10px] text-slate-400 mt-1">Masukkan blok makam (huruf)</p>}
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nomor Makam</label>
            <input
              type="text"
              value={nomor}
              onChange={(e) => setNomor(e.target.value.toUpperCase())}
              placeholder="Contoh: 01, 02, 03"
              disabled={isApproved}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-medium text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors disabled:bg-slate-50 disabled:text-slate-400"
            />
            {!nomor && <p className="text-[10px] text-slate-400 mt-1">Masukkan nomor makam (angka)</p>}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || saved || !blok.trim() || !nomor.trim() || isApproved}
          className="w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20"
        >
          {saved ? (
            <>
              <CheckCircle size={18} />
              Tersimpan
            </>
          ) : saving ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save size={18} />
              {hasAllocation ? "Perbarui Lokasi" : "Simpan Lokasi"}
            </>
          )}
        </button>

        {isApproved && (
          <p className="text-[10px] text-amber-600 font-medium text-center mt-3">
            Pengajuan sudah disetujui. Alokasi tidak dapat diubah.
          </p>
        )}
      </div>
    </div>
  );
}
