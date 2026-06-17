"use client";

import { useState, useEffect } from "react";
import { MapPin, Save, Loader2, CheckCircle, Map, ChevronDown, AlertTriangle, Sparkles } from "lucide-react";

/* ── Types ────────────────────────────────────────────────── */

interface GraveAllocationProps {
  pengajuanId: string;
  currentPlotId: string | null;
  currentBlok: string | null;
  currentNomor: string | null;
  graveStatus: string | null;
  pengajuanStatus: string;
  onAllocate: (blockId: string) => Promise<void>;
  onRefresh: () => void;
}

interface Cemetery {
  id: string;
  name: string;
  code: string;
  map_config: Record<string, unknown>;
}

interface Block {
  id: string;
  name: string;
  code: string;
  capacity: number;
  map_coords: Record<string, unknown>;
  sort_order: number;
}

interface NextPlotInfo {
  id: string;
  plotNumber: string;
  status: string;
}

/* ── Status Config ──────────────────────────────────────────── */

const graveStatusConfig: Record<string, { label: string; bg: string; text: string }> = {
  AVAILABLE: { label: "Tersedia", bg: "bg-emerald-50", text: "text-emerald-700" },
  RESERVED: { label: "Dipesan", bg: "bg-amber-50", text: "text-amber-700" },
  OCCUPIED: { label: "Terisi", bg: "bg-slate-100", text: "text-slate-600" },
};

/* ── Component ──────────────────────────────────────────────── */

type AllocationMode = "auto" | "manual";

export function GraveAllocation({
  currentPlotId,
  currentBlok,
  currentNomor,
  graveStatus,
  pengajuanStatus,
  onAllocate,
  onRefresh,
}: GraveAllocationProps) {
  const isApproved = pengajuanStatus === "APPROVED";
  const gs = graveStatusConfig[graveStatus || ""];
  const hasAllocation = currentBlok && currentBlok !== "TBA" && currentNomor && currentNomor !== "TBA";

  // ── Mode: auto vs manual ─────────────────────────────────
  const [mode, setMode] = useState<AllocationMode>("auto");

  // ── Data State ───────────────────────────────────────────
  const [cemeteries, setCemeteries] = useState<Cemetery[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);

  // ── Selection State ──────────────────────────────────────
  const [selectedCemeteryId, setSelectedCemeteryId] = useState<string>("");
  const [selectedBlockId, setSelectedBlockId] = useState<string>("");

  // ── Auto-next-available plot (from cemetery_id) ──────────
  const [autoPlot, setAutoPlot] = useState<NextPlotInfo | null>(null);
  const [autoBlock, setAutoBlock] = useState<{ id: string; name: string; code: string; sortOrder: number } | null>(null);
  const [fetchingAuto, setFetchingAuto] = useState(false);
  const [autoNotFound, setAutoNotFound] = useState(false);

  // ── Manual: next-available plot (from block_id) ──────────
  const [nextPlot, setNextPlot] = useState<NextPlotInfo | null>(null);
  const [blockFull, setBlockFull] = useState(false);
  const [availableCount, setAvailableCount] = useState(0);
  const [fetchingPlot, setFetchingPlot] = useState(false);

  // ── UI State ─────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  // ── Fetch cemeteries on mount ────────────────────────────
  useEffect(() => {
    async function loadCemeteries() {
      setLoading(true);
      try {
        const res = await fetch("/api/cemeteries");
        if (res.ok) {
          const data = await res.json();
          setCemeteries(data);
        }
      } catch {
        // fallback: empty
      } finally {
        setLoading(false);
      }
    }
    loadCemeteries();
  }, []);

  // ── Fetch blocks when cemetery changes ───────────────────
  useEffect(() => {
    if (!selectedCemeteryId) {
      setBlocks([]);
      setSelectedBlockId("");
      setNextPlot(null);
      setBlockFull(false);
      return;
    }
    async function loadBlocks() {
      try {
        const res = await fetch(`/api/cemeteries/${selectedCemeteryId}/blocks`);
        if (res.ok) {
          const data = await res.json();
          setBlocks(data);
        }
      } catch {
        setBlocks([]);
      }
      setSelectedBlockId("");
      setNextPlot(null);
      setBlockFull(false);
    }
    loadBlocks();
  }, [selectedCemeteryId]);

  // ── AUTO MODE: fetch next plot via cemetery_id ───────────
  useEffect(() => {
    if (mode !== "auto" || !selectedCemeteryId) {
      setAutoPlot(null);
      setAutoBlock(null);
      setAutoNotFound(false);
      return;
    }

    async function loadAuto() {
      setFetchingAuto(true);
      setAutoPlot(null);
      setAutoBlock(null);
      setAutoNotFound(false);
      setConfirmed(false);
      setError(null);
      try {
        const res = await fetch(`/api/admin/next-plot?cemetery_id=${selectedCemeteryId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.available && data.plot) {
            setAutoPlot({
              id: data.plot.id,
              plotNumber: data.plot.plotNumber,
              status: data.plot.status,
            });
            setAutoBlock(data.block);
            setAutoNotFound(false);
          } else {
            setAutoPlot(null);
            setAutoBlock(null);
            setAutoNotFound(true);
          }
        } else {
          setAutoNotFound(true);
        }
      } catch {
        setAutoNotFound(true);
      } finally {
        setFetchingAuto(false);
      }
    }

    loadAuto();
  }, [mode, selectedCemeteryId]);

  // ── MANUAL MODE: fetch next available plot when block changes ─
  useEffect(() => {
    if (mode !== "manual" || !selectedBlockId) {
      setNextPlot(null);
      setBlockFull(false);
      setConfirmed(false);
      return;
    }

    async function loadNextPlot() {
      setFetchingPlot(true);
      setError(null);
      setConfirmed(false);
      try {
        const res = await fetch(`/api/admin/next-plot?block_id=${selectedBlockId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.available && data.plot) {
            setNextPlot({
              id: data.plot.id,
              plotNumber: data.plot.plotNumber,
              status: data.plot.status,
            });
            setBlockFull(false);
            setAvailableCount(data.availableCount ?? 0);
          } else {
            setNextPlot(null);
            setBlockFull(data.blockFull ?? true);
            setAvailableCount(0);
          }
        } else {
          setNextPlot(null);
          setBlockFull(true);
        }
      } catch {
        setNextPlot(null);
        setBlockFull(true);
      } finally {
        setFetchingPlot(false);
      }
    }

    loadNextPlot();
  }, [mode, selectedBlockId]);

  // ── Handle save ──────────────────────────────────────────
  const handleSave = async () => {
    const targetBlockId = mode === "auto" ? autoBlock?.id : selectedBlockId;
    if (!targetBlockId) return;
    setSaving(true);
    setError(null);
    try {
      await onAllocate(targetBlockId);
      setSaved(true);
      setConfirmed(true);
      setTimeout(() => setSaved(false), 2000);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan alokasi");
    } finally {
      setSaving(false);
    }
  };

  // ── Pre-select current allocation when blocks load ────────
  const [pendingBlockId, setPendingBlockId] = useState<string | null>(null);

  useEffect(() => {
    if (!pendingBlockId || blocks.length === 0) return;
    const match = blocks.find((b) => b.id === pendingBlockId);
    if (match) {
      setSelectedBlockId(match.id);
      setPendingBlockId(null);
    }
  }, [blocks, pendingBlockId]);

  useEffect(() => {
    if (!currentPlotId || cemeteries.length === 0) return;
    (async () => {
      try {
        const res = await fetch(`/api/admin/plot/${currentPlotId}/block`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.cemeteryId) {
          setSelectedCemeteryId(data.cemeteryId);
          setPendingBlockId(data.blockId);
        }
      } catch { /* ignore */ }
    })();
  }, [currentPlotId, cemeteries]);

  // ── Determine if a different block/plot is being proposed ─
  const proposedBlockCode = mode === "auto" ? autoBlock?.code : blocks.find((b) => b.id === selectedBlockId)?.code;
  const proposedPlotNumber = mode === "auto" ? autoPlot?.plotNumber : nextPlot?.plotNumber;
  const hasProposal = mode === "auto" ? !!autoPlot : !!nextPlot;
  const hasChanged = !!(
    hasAllocation &&
    hasProposal &&
    currentBlok &&
    (proposedBlockCode !== currentBlok || proposedPlotNumber !== currentNomor)
  );

  const isChanging = hasChanged && confirmed;

  const canSave =
    mode === "auto"
      ? !!selectedCemeteryId && !!autoPlot && !autoNotFound && !isApproved
      : !!selectedBlockId && !!nextPlot && !blockFull && !isApproved;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div className="p-6 lg:p-8">
        {/* ── Header ──────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <MapPin className="text-primary" size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 font-manrope">Alokasi Makam</h3>
            <p className="text-xs text-slate-400 font-medium">
              {mode === "auto"
                ? "Otomatis memilih blok & petak berikutnya"
                : "Pilih blok, sistem akan mengalokasikan petak tersedia berikutnya"}
            </p>
          </div>
        </div>

        {/* ── Mode Toggle ──────────────────────────────────── */}
        {!isApproved && (
          <div className="mb-5 flex items-center gap-2 bg-slate-50 p-1 rounded-xl w-fit">
            <button
              onClick={() => setMode("auto")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === "auto"
                  ? "bg-white text-primary shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Sparkles size={14} />
              Otomatis
            </button>
            <button
              onClick={() => setMode("manual")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === "manual"
                  ? "bg-white text-primary shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Map size={14} />
              Pilih Blok
            </button>
          </div>
        )}

        {/* ── Current Allocation ──────────────────────────── */}
        {hasAllocation && (
          <div className="mb-6 p-4 bg-primary/5 rounded-xl border border-primary/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Map className="text-primary" size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {currentBlok && currentBlok !== "TBA"
                    ? `Blok ${currentBlok} — No. ${currentNomor}`
                    : "Menunggu alokasi"}
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

        {/* ── Loading ─────────────────────────────────────── */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-primary" />
            <span className="ml-3 text-sm text-slate-400">Memuat data pemakaman...</span>
          </div>
        )}

        {!loading && (
          <div className="space-y-5">
            {/* ── Cemetery Select ──────────────────────────── */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Pilih Pemakaman
              </label>
              <div className="relative">
                <select
                  value={selectedCemeteryId}
                  onChange={(e) => setSelectedCemeteryId(e.target.value)}
                  disabled={isApproved}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-medium text-sm appearance-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <option value="">-- Pilih Pemakaman --</option>
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

            {/* ── AUTO MODE: Auto-detected Block + Plot ────── */}
            {mode === "auto" && selectedCemeteryId && (
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                {fetchingAuto ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 size={18} className="animate-spin text-primary" />
                    <span className="ml-2 text-sm text-slate-400">Mencari blok & petak tersedia...</span>
                  </div>
                ) : autoNotFound ? (
                  <div className="p-4 bg-rose-50 flex items-start gap-3">
                    <AlertTriangle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-rose-700">Semua Penuh</p>
                      <p className="text-xs text-rose-600 mt-0.5">
                        Semua blok di pemakaman ini sudah penuh. Silakan pilih pemakaman lain atau alihkan ke mode manual.
                      </p>
                    </div>
                  </div>
                ) : autoPlot && autoBlock ? (
                  <div className="p-4 bg-emerald-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">
                          Alokasi Otomatis
                        </p>
                        <p className="text-lg font-bold text-slate-900">
                          Blok {autoBlock.code} — No. {autoPlot.plotNumber}
                        </p>
                        <p className="text-xs text-emerald-600 mt-0.5">
                          {`Blok ${autoBlock.name} — prioritas ${autoBlock.sortOrder}`}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <Sparkles size={24} className="text-emerald-600" />
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* ── MANUAL MODE: Block Select + Plot ──────────── */}
            {mode === "manual" && (
              <>
                {/* Block Select */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Pilih Blok
                  </label>
                  <div className="relative">
                    <select
                      value={selectedBlockId}
                      onChange={(e) => setSelectedBlockId(e.target.value)}
                      disabled={isApproved || !selectedCemeteryId}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-medium text-sm appearance-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      <option value="">-- Pilih Blok --</option>
                      {blocks
                        .sort((a, b) => a.sort_order - b.sort_order)
                        .map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.capacity} petak)
                          </option>
                        ))}
                    </select>
                    <ChevronDown
                      size={16}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                  </div>
                </div>

                {/* Next Available Plot Display */}
                {selectedBlockId && (
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    {fetchingPlot ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 size={18} className="animate-spin text-primary" />
                        <span className="ml-2 text-sm text-slate-400">Mengecek petak tersedia...</span>
                      </div>
                    ) : blockFull ? (
                      <div className="p-4 bg-rose-50 flex items-start gap-3">
                        <AlertTriangle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-rose-700">Blok Penuh</p>
                          <p className="text-xs text-rose-600 mt-0.5">
                            Semua petak di blok ini sudah terisi. Pilih blok lain.
                          </p>
                        </div>
                      </div>
                    ) : nextPlot ? (
                      <div className="p-4 bg-emerald-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">
                              Petak Berikutnya
                            </p>
                            <p className="text-lg font-bold text-slate-900">
                              Petak No. {nextPlot.plotNumber}
                            </p>
                            <p className="text-xs text-emerald-600 mt-0.5">
                              {availableCount} petak tersedia di blok ini
                            </p>
                          </div>
                          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <CheckCircle size={24} className="text-emerald-600" />
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </>
            )}

            {/* ── Change Warning ───────────────────────────── */}
            {hasChanged && !confirmed && (
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-amber-800">Alokasi Berbeda</p>
                    <p className="text-xs text-amber-700 mt-1">
                      Alokasi saat ini adalah Blok {currentBlok} — No. {currentNomor}.
                      <span>
                        {" "}Sistem menyarankan petak baru. Klik tombol di bawah untuk mengonfirmasi perubahan.
                      </span>
                    </p>
                    <button
                      onClick={() => setConfirmed(true)}
                      className="mt-2 text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1.5 rounded-lg hover:bg-amber-200 transition-colors"
                    >
                      Konfirmasi Perubahan
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Error ────────────────────────────────────── */}
            {error && (
              <p className="text-xs text-rose-500 font-medium">{error}</p>
            )}

            {/* ── Save Button ──────────────────────────────── */}
            <button
              onClick={handleSave}
              disabled={saving || saved || !canSave || (hasChanged && !confirmed)}
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
                  {currentPlotId
                    ? hasChanged && confirmed
                      ? "Perbarui Alokasi"
                      : "Simpan Alokasi"
                    : "Simpan Alokasi"}
                </>
              )}
            </button>

            {/* ── Locked Notice ────────────────────────────── */}
            {isApproved && (
              <p className="text-[10px] text-amber-600 font-medium text-center">
                Pengajuan sudah disetujui. Alokasi tidak dapat diubah.
              </p>
            )}
            {!selectedCemeteryId && (
              <p className="text-[10px] text-slate-400 font-medium text-center">
                Pilih pemakaman untuk mulai alokasi
              </p>
            )}

            {/* ── Info notice ──────────────────────────────── */}
            {mode === "auto" && selectedCemeteryId && autoPlot && !isApproved && (
              <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                Sistem otomatis memilih blok dengan prioritas tertinggi yang masih memiliki petak tersedia.
              </p>
            )}
            {mode === "manual" && selectedBlockId && nextPlot && !isApproved && (
              <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                Petak dialokasikan secara otomatis berdasarkan nomor urut terkecil yang tersedia.
                {availableCount > 1 && ` ${availableCount - 1} petak lain tersedia di blok ini.`}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
