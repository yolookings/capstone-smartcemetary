"use client";

import { useState, useMemo } from "react";

/* ── Types ────────────────────────────────────────────────── */

export interface CemeteryMapData {
  id: string;
  name: string;
  code: string;
  mapConfig: {
    viewBox?: string;
    bgColor?: string;
    roadColor?: string;
  };
  blocks: BlockMapData[];
}

export interface BlockMapData {
  id: string;
  name: string;
  code: string;
  mapCoords: BlockCoords;
  plots: PlotMapData[];
}

export interface BlockCoords {
  x: number;
  y: number;
  width: number;
  height: number;
  plotsPerRow: number;
  plotRows: number;
  padding: number;
  gap: number;
}

export interface PlotMapData {
  id: string;
  plotNumber: string;
  status: "AVAILABLE" | "RESERVED" | "OCCUPIED";
  mapCoords: PlotCoords;
}

export interface PlotCoords {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CemeteryMapProps {
  data: CemeteryMapData | null;
  selectedBlockId: string | null;
  selectedPlotId: string | null;
  onSelectBlock?: (blockId: string) => void;
  onSelectPlot?: (plotId: string) => void;
  compact?: boolean;
}

/* ── Status colors ──────────────────────────────────────────── */

const STATUS_STYLES: Record<string, { fill: string; stroke: string; label: string }> = {
  AVAILABLE: { fill: "#86efac", stroke: "#22c55e", label: "Tersedia" },
  RESERVED: { fill: "#fde68a", stroke: "#f59e0b", label: "Dipesan" },
  OCCUPIED: { fill: "#fca5a5", stroke: "#ef4444", label: "Terisi" },
};

/* ── Component ──────────────────────────────────────────────── */

export function CemeteryMap({
  data,
  selectedBlockId,
  selectedPlotId,
  onSelectBlock,
  onSelectPlot,
  compact = false,
}: CemeteryMapProps) {
  const [hoveredPlot, setHoveredPlot] = useState<string | null>(null);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-48 bg-neutral rounded-xl border border-dashed border-slate-200">
        <p className="text-sm text-slate-400 font-medium">Pilih blok untuk melihat peta</p>
      </div>
    );
  }

  const viewBox = data.mapConfig.viewBox || "0 0 800 600";
  const bgColor = data.mapConfig.bgColor || "#f0f4f0";
  const roadColor = data.mapConfig.roadColor || "#e2e8f0";

  return (
    <div className="space-y-3">
      {/* Map SVG */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <svg
          viewBox={viewBox}
          className={`w-full ${compact ? "h-auto max-h-48" : "h-auto max-h-96"}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background */}
          <rect width="100%" height="100%" fill={bgColor} rx="4" />

          {/* Roads / pathways */}
          <rect x="195" y="0" width="15" height="300" fill={roadColor} rx="2" />
          <rect x="390" y="0" width="15" height="300" fill={roadColor} rx="2" />
          <rect x="585" y="0" width="15" height="300" fill={roadColor} rx="2" />
          <rect x="0" y="295" width="800" height="15" fill={roadColor} rx="2" />

          {/* Blocks */}
          {data.blocks.map((block) => {
            const isSelected = selectedBlockId === block.id;
            const coords = block.mapCoords;

            return (
              <g key={block.id}>
                {/* Block background */}
                <rect
                  x={coords.x}
                  y={coords.y}
                  width={coords.width}
                  height={coords.height}
                  fill={isSelected ? "#dbeafe" : "#ffffff"}
                  stroke={isSelected ? "#2563eb" : "#cbd5e1"}
                  strokeWidth={isSelected ? 3 : 1}
                  rx={6}
                  className="transition-all duration-200 cursor-pointer"
                  onClick={() => onSelectBlock?.(block.id)}
                />

                {/* Block label */}
                <text
                  x={coords.x + coords.width / 2}
                  y={coords.y + 18}
                  textAnchor="middle"
                  className={`font-bold text-xs fill-current ${isSelected ? "fill-blue-600" : "fill-slate-500"}`}
                >
                  {block.name}
                </text>

                {/* Plots */}
                {block.plots.map((plot) => {
                  const style = STATUS_STYLES[plot.status] || STATUS_STYLES.AVAILABLE;
                  const pc = plot.mapCoords;
                  const isPlotSelected = selectedPlotId === plot.id;
                  const isHovered = hoveredPlot === plot.id;

                  return (
                    <g
                      key={plot.id}
                      onClick={() => onSelectPlot?.(plot.id)}
                      onMouseEnter={() => setHoveredPlot(plot.id)}
                      onMouseLeave={() => setHoveredPlot(null)}
                      className="cursor-pointer"
                    >
                      <rect
                        x={pc.x}
                        y={pc.y}
                        width={pc.width}
                        height={pc.height}
                        fill={isPlotSelected ? "#bfdbfe" : style.fill}
                        stroke={isPlotSelected ? "#2563eb" : isHovered ? "#1e293b" : style.stroke}
                        strokeWidth={isPlotSelected ? 2.5 : isHovered ? 2 : 1}
                        rx={3}
                        className="transition-all duration-150"
                      />

                      {/* Plot number */}
                      <text
                        x={pc.x + pc.width / 2}
                        y={pc.y + pc.height / 2 + 1}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-[4px] fill-slate-700 font-medium pointer-events-none"
                      >
                        {plot.plotNumber}
                      </text>

                      {/* Hover tooltip */}
                      {isHovered && (
                        <g>
                          <rect
                            x={pc.x + pc.width / 2 - 24}
                            y={pc.y - 20}
                            width={48}
                            height={16}
                            rx={4}
                            fill="#1e293b"
                          />
                          <text
                            x={pc.x + pc.width / 2}
                            y={pc.y - 9}
                            textAnchor="middle"
                            className="text-[5px] fill-white font-medium"
                          >
                            {style.label}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* Cemetery name watermark */}
          <text
            x="400"
            y="570"
            textAnchor="middle"
            className="text-[10px] fill-slate-300"
          >
            {data.name}
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-[11px]">
        {Object.entries(STATUS_STYLES).map(([key, style]) => (
          <div key={key} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded border"
              style={{ backgroundColor: style.fill, borderColor: style.stroke }}
            />
            <span className="text-slate-600 font-medium">{style.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
