"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

/* ── Types (shared with inner component) ──────────────────── */

export interface PlotGeo {
  id: string;
  plotNumber: string;
  status: "AVAILABLE" | "RESERVED" | "OCCUPIED";
  coordinates: [number, number];
  cellWidth?: number;
  cellHeight?: number;
}

export interface BlockGeo {
  id: string;
  name: string;
  code: string;
  polygon: [number, number][];
  plots: PlotGeo[];
  availableCount: number;
}

export interface CemeteryGeo {
  id: string;
  name: string;
  code: string;
  center: [number, number];
  zoom: number;
  boundary?: [number, number][];
  blocks: BlockGeo[];
}

export type MapMode = "public" | "admin" | "allocation";

export interface CemeteryLeafletMapProps {
  data: CemeteryGeo;
  mode?: MapMode;
  selectedBlockId?: string | null;
  selectedPlotId?: string | null;
  onSelectBlock?: (blockId: string) => void;
  onSelectPlot?: (plotId: string) => void;
  height?: string;
  showLegend?: boolean;
}

/* ── Status styles ─────────────────────────────────────────── */

export const STATUS_STYLES: Record<string, { color: string; fillColor: string; label: string }> = {
  AVAILABLE: { color: "#22c55e", fillColor: "#86efac", label: "Tersedia" },
  RESERVED: { color: "#f59e0b", fillColor: "#fde68a", label: "Dipesan" },
  OCCUPIED: { color: "#ef4444", fillColor: "#fca5a5", label: "Terisi" },
};

/* ── Fallback ─────────────────────────────────────────────── */

function LeafletFallback() {
  return (
    <div className="flex items-center justify-center h-full bg-slate-50 rounded-xl border border-slate-200">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
        <p className="text-sm text-slate-400">Memuat peta...</p>
      </div>
    </div>
  );
}

/* ── Dynamically imported inner map ────────────────────────── */

const InnerMap = dynamic(() => import("./cemetery-leaflet-map-inner"), {
  ssr: false,
  loading: () => <LeafletFallback />,
});

/* ── Empty data fallback ───────────────────────────────────── */

function EmptyDataFallback() {
  return (
    <div className="flex items-center justify-center h-full bg-slate-50 rounded-xl border border-slate-200">
      <div className="text-center px-6">
        <div className="text-3xl mb-2">🗺️</div>
        <p className="text-sm text-slate-500 font-medium">Data peta belum tersedia</p>
        <p className="text-xs text-slate-400 mt-1">
          Tambahkan blok dan petak untuk menampilkan peta
        </p>
      </div>
    </div>
  );
}

/* ── Public component ──────────────────────────────────────── */

export function CemeteryLeafletMap(props: CemeteryLeafletMapProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const hasData = props.data.blocks.length > 0;

  if (!mounted) {
    return (
      <div
        className="bg-white rounded-xl border border-slate-100 overflow-hidden"
        style={{ height: props.height || "500px", minHeight: "300px" }}
      >
        <LeafletFallback />
      </div>
    );
  }

  if (!hasData) {
    return (
      <div
        className="bg-white rounded-xl border border-slate-100 overflow-hidden"
        style={{ height: props.height || "500px", minHeight: "300px" }}
      >
        <EmptyDataFallback />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        className="bg-white rounded-xl border border-slate-100 overflow-hidden"
        style={{ height: props.height || "500px", minHeight: "300px" }}
      >
        <InnerMap {...props} />
      </div>

      {props.showLegend !== false && (
        <div className="flex flex-wrap gap-4 text-xs">
          {Object.entries(STATUS_STYLES).map(([key, style]) => (
            <div key={key} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded border"
                style={{ backgroundColor: style.fillColor, borderColor: style.color }}
              />
              <span className="text-slate-600 font-medium">{style.label}</span>
            </div>
          ))}
          {(props.mode === "admin" || props.mode === "allocation") && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded border border-blue-500 bg-blue-100" />
              <span className="text-slate-600 font-medium">Terpilih</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
