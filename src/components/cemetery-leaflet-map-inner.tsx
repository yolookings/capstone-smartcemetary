"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Rectangle,
  Tooltip,
  useMap,
} from "react-leaflet";
import type {
  CemeteryLeafletMapProps,
  PlotGeo,
  BlockGeo,
} from "./cemetery-leaflet-map";

// Load Leaflet CSS once (outside component to avoid re-imports)
import "leaflet/dist/leaflet.css";

/* ── Helpers ─────────────────────────────────────────────────── */

/** Validate a lat/lng pair is finite and within reasonable bounds */
function isValidLatLng(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/** Validate a polygon coordinate array */
function isValidPolygon(positions: [number, number][]): boolean {
  return (
    Array.isArray(positions) &&
    positions.length >= 3 &&
    positions.every((p) => Array.isArray(p) && p.length >= 2 && isValidLatLng(p[0], p[1]))
  );
}

/* ── Status config ──────────────────────────────────────────── */

const STATUS_STYLES: Record<string, { color: string; fillColor: string; label: string }> = {
  AVAILABLE: { color: "#22c55e", fillColor: "#86efac", label: "Tersedia" },
  RESERVED: { color: "#f59e0b", fillColor: "#fde68a", label: "Dipesan" },
  OCCUPIED: { color: "#ef4444", fillColor: "#fca5a5", label: "Terisi" },
};

/* ── Auto-fit map bounds to all block polygons ─────────────── */

function MapBoundsFitter({ blocks }: { blocks: BlockGeo[] }) {
  const map = useMap();
  const fitted = useRef(false);

  const allCoords = useMemo(() => {
    const coords: [number, number][] = [];
    for (const block of blocks) {
      if (isValidPolygon(block.polygon)) {
        coords.push(...block.polygon);
      }
    }
    return coords;
  }, [blocks]);

  useEffect(() => {
    if (allCoords.length > 0 && !fitted.current) {
      map.fitBounds(allCoords, { padding: [40, 40], maxZoom: 19 });
      fitted.current = true;
    }
  }, [map, allCoords]);

  return null;
}

/* ── Plot rectangles (admin/allocation mode) ────────────────── */

function PlotRectangle({
  plot,
  isSelected,
  mode,
  onSelect,
}: {
  plot: PlotGeo;
  isSelected: boolean;
  mode: string;
  onSelect?: (id: string) => void;
}) {
  const ss = STATUS_STYLES[plot.status] || STATUS_STYLES.AVAILABLE;
  const [lat, lng] = plot.coordinates;

  if (!isValidLatLng(lat, lng)) {
    console.warn(`[map] Invalid plot coords: plot=${plot.plotNumber} lat=${lat} lng=${lng}`);
    return null;
  }

  const halfLat = plot.cellHeight ? plot.cellHeight / 2 : 0.00003;
  const halfLng = plot.cellWidth ? plot.cellWidth / 2 : 0.00003;
  const isInteractive = mode === "admin" && !!onSelect;

  return (
    <Rectangle
      key={plot.id}
      bounds={[
        [lat - halfLat, lng - halfLng],
        [lat + halfLat, lng + halfLng],
      ]}
      pathOptions={{
        color: isSelected ? "#2563eb" : ss.color,
        weight: isSelected ? 2.5 : 1,
        fillColor: isSelected ? "#bfdbfe" : ss.fillColor,
        fillOpacity: isSelected ? 0.8 : 0.6,
      }}
      interactive={isInteractive}
      eventHandlers={isInteractive ? { click: () => onSelect(plot.id) } : undefined}
    >
      <Tooltip permanent direction="center" className="plot-label-tooltip">
        <span className="font-bold text-[9px] leading-none">{plot.plotNumber}</span>
      </Tooltip>
    </Rectangle>
  );
}

/* ── Public mode plot (small colored rectangle) ─────────────── */

function PublicPlotRect({ plot }: { plot: PlotGeo }) {
  const ss = STATUS_STYLES[plot.status] || STATUS_STYLES.AVAILABLE;
  const [lat, lng] = plot.coordinates;

  if (!isValidLatLng(lat, lng)) {
    return null;
  }

  const halfLat = plot.cellHeight ? plot.cellHeight / 2 : 0.00003;
  const halfLng = plot.cellWidth ? plot.cellWidth / 2 : 0.00003;

  return (
    <Rectangle
      key={plot.id}
      bounds={[
        [lat - halfLat, lng - halfLng],
        [lat + halfLat, lng + halfLng],
      ]}
      pathOptions={{
        color: ss.color,
        weight: 1,
        fillColor: ss.fillColor,
        fillOpacity: 0.5,
      }}
      interactive={false}
    >
      <Tooltip>
        <div className="text-xs leading-relaxed">
          <strong>Petak {plot.plotNumber}</strong>
          <br />
          <span>{ss.label}</span>
        </div>
      </Tooltip>
    </Rectangle>
  );
}

/* ── Inner map component (runs only client-side) ────────────── */

export default function InnerMap({
  data,
  mode = "public",
  selectedBlockId,
  selectedPlotId,
  onSelectBlock,
  onSelectPlot,
}: CemeteryLeafletMapProps) {
  // Validate center
  const [centerLat, centerLng] = data.center;
  const safeCenter: [number, number] =
    isValidLatLng(centerLat, centerLng)
      ? [centerLat, centerLng]
      : [-7.29385, 112.81075]; // fallback: TPU Keputih

  return (
    <MapContainer
      center={safeCenter}
      zoom={data.zoom || 17}
      className="w-full h-full z-0"
      scrollWheelZoom={mode === "admin" || mode === "allocation"}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Auto-fit map to all block polygons */}
      <MapBoundsFitter blocks={data.blocks} />

      {/* Cemetery boundary */}
      {data.boundary && data.boundary.length >= 4 && (
        <Rectangle
          bounds={data.boundary as [[number, number], [number, number]]}
          pathOptions={{
            color: "#2563eb",
            weight: 2,
            fill: false,
            dashArray: "8 4",
          }}
        />
      )}

      {/* Blocks */}
      {data.blocks.map((block) => {
        const isSelected = selectedBlockId === block.id;
        const isInteractive = (mode === "admin" || mode === "allocation") && !!onSelectBlock;
        const validPolygon = isValidPolygon(block.polygon);

        if (!validPolygon) {
          if (block.polygon && block.polygon.length > 0) {
            console.warn(`[map] Block ${block.code} has invalid polygon (${block.polygon.length} pts)`);
          }
        }

        return (
          <div key={block.id}>
            {/* Block polygon — only when valid */}
            {validPolygon && (
              <Polygon
                positions={block.polygon}
                pathOptions={{
                  color: isSelected ? "#2563eb" : "#94a3b8",
                  weight: isSelected ? 3 : 2,
                  fillColor: isSelected ? "#dbeafe" : "#f1f5f9",
                  fillOpacity: isSelected ? 0.35 : 0.2,
                }}
                interactive={isInteractive}
                eventHandlers={
                  isInteractive ? { click: () => onSelectBlock(block.id) } : undefined
                }
              >
                <Tooltip permanent direction="center" className="block-label-tooltip">
                  <span className="text-xs font-bold whitespace-nowrap">
                    {block.name}
                    {mode === "admin" && block.availableCount > 0 && (
                      <span className="ml-1 text-slate-400">({block.availableCount})</span>
                    )}
                  </span>
                </Tooltip>
              </Polygon>
            )}

            {/* Plots */}
            {block.plots.map((plot) =>
              mode === "public" ? (
                <PublicPlotRect key={plot.id} plot={plot} />
              ) : (
                <PlotRectangle
                  key={plot.id}
                  plot={plot}
                  isSelected={selectedPlotId === plot.id}
                  mode={mode}
                  onSelect={mode === "admin" ? onSelectPlot : undefined}
                />
              ),
            )}
          </div>
        );
      })}
    </MapContainer>
  );
}
