"use client";

import { useState, useMemo } from "react";
import { CemeteryLeafletMap, type CemeteryGeo, type BlockGeo, type PlotGeo } from "@/components/cemetery-leaflet-map";

const STATUS_COLORS: Record<string, { bg: string; label: string }> = {
  AVAILABLE: { bg: "#81C784", label: "Tersedia" },
  RESERVED: { bg: "#FFB74D", label: "Dipesan" },
  OCCUPIED: { bg: "#E57373", label: "Terisi" },
};

interface GravePlot {
  id: string;
  plot_number: string;
  status: string;
  block_code: string;
  block_name: string;
  cemetery_name: string;
  deceased_name?: string;
  user_id?: string;
  applicant_name?: string;
  applicant_phone?: string;
  created_at?: string;
}

interface BlockGeoRaw {
  id: string;
  code: string;
  name: string;
  map_coords: Record<string, unknown>;
  plots: {
    id: string;
    plot_number: string;
    status: string;
    map_coords: Record<string, unknown>;
  }[];
}

interface CemeteryGeoRaw {
  id: string;
  name: string;
  code: string;
  map_config: Record<string, unknown>;
  blocks: BlockGeoRaw[];
}

interface ClientTabsProps {
  defaultCemeteryId: string;
  defaultBlock: string;
  isAdmin: boolean;
  userId: string | null;
  graveMap: Record<string, GravePlot>;
  isLoggedIn: boolean;
  cemeteryGeo: CemeteryGeoRaw[];
}

/** Convert GeoJSON [lng, lat] to [lat, lng] */
function toLatLng(coord: number[]): [number, number] {
  return [coord[1], coord[0]];
}

function parseCemeteryConfig(
  config: Record<string, unknown>,
): { center: [number, number]; zoom: number; boundary?: [number, number][] } {
  const centerArr = config.center as number[] | undefined;
  const boundaryArr = config.boundary as number[][] | undefined;
  return {
    center: centerArr ? toLatLng(centerArr) : [0, 0],
    zoom: (config.zoom as number) || 17,
    boundary: boundaryArr?.map((p) => toLatLng(p)),
  };
}

function parseBlockCoords(
  raw: Record<string, unknown>,
): [number, number][] {
  const coords = raw as Record<string, unknown>;
  if (coords.type === "Feature" && coords.geometry) {
    const geom = coords.geometry as Record<string, unknown>;
    if (geom.type === "Polygon") {
      const ring = (geom.coordinates as number[][][])?.[0] || [];
      return ring.length > 0 ? ring.map((c) => toLatLng(c)) : [];
    }
  }
  return [];
}

function parsePlotCoords(raw: Record<string, unknown>): { coordinates: [number, number]; cellWidth?: number; cellHeight?: number } {
  const coords = raw as Record<string, unknown>;
  if (coords.type === "Point") {
    const xy = coords.coordinates as number[];
    const props = (coords.properties || {}) as Record<string, unknown>;
    return {
      coordinates: toLatLng(xy),
      cellWidth: props.cellWidth as number | undefined,
      cellHeight: props.cellHeight as number | undefined,
    };
  }
  return { coordinates: [0, 0] as [number, number] };
}

/** Convert raw serialized geo data to CemeteryGeo for the map component */
function buildCemeteryGeo(raw: CemeteryGeoRaw): CemeteryGeo {
  const cfg = parseCemeteryConfig(raw.map_config);
  const blocks: BlockGeo[] = raw.blocks.map((b) => {
    const polygon = parseBlockCoords(b.map_coords);
    if (polygon.length < 3) {
      console.log(`[map] Block ${b.code} (${b.id}): no valid polygon — map_coords type:`, typeof b.map_coords, b.map_coords?.type ?? "N/A");
    }
    const plots: PlotGeo[] = b.plots.map((p) => {
      const pc = parsePlotCoords(p.map_coords);
      return {
        id: p.id,
        plotNumber: p.plot_number,
        status: p.status as PlotGeo["status"],
        coordinates: pc.coordinates,
        cellWidth: pc.cellWidth,
        cellHeight: pc.cellHeight,
      };
    });
    return {
      id: b.id,
      name: b.name,
      code: b.code,
      polygon,
      plots,
      availableCount: plots.filter((p) => p.status === "AVAILABLE").length,
    };
  });

  return {
    id: raw.id,
    name: raw.name,
    code: raw.code,
    center: cfg.center,
    zoom: cfg.zoom,
    boundary: cfg.boundary,
    blocks,
  };
}

export function ClientTabs({
  defaultCemeteryId,
  defaultBlock,
  isAdmin,
  userId,
  graveMap,
  isLoggedIn,
  cemeteryGeo,
}: ClientTabsProps) {
  const [activeCemeteryId, setActiveCemeteryId] = useState(defaultCemeteryId);
  const [activeBlockCode, setActiveBlockCode] = useState(defaultBlock);
  const [hoveredPlot, setHoveredPlot] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState<GravePlot | null>(null);

  const showBlur = !isLoggedIn;

  // Find active cemetery geo data
  const activeGeo = useMemo(() => {
    const raw = cemeteryGeo.find((c) => c.id === activeCemeteryId);
    return raw ? buildCemeteryGeo(raw) : null;
  }, [cemeteryGeo, activeCemeteryId]);

  // All block codes for tabs
  const blocks = useMemo(() => {
    const active = cemeteryGeo.find((c) => c.id === activeCemeteryId);
    return active ? active.blocks.map((b) => b.code) : [];
  }, [cemeteryGeo, activeCemeteryId]);

  // Filtered grave map for active block
  const activeBlockGraves = useMemo(() => {
    return Object.entries(graveMap)
      .filter(([key]) => key.startsWith(`${activeBlockCode}-`))
      .map(([, g]) => g)
      .sort((a, b) => parseInt(a.plot_number) - parseInt(b.plot_number));
  }, [graveMap, activeBlockCode]);

  // For the grid view fallback (when no geo data)
  const gridCols = useMemo(() => {
    const count = activeBlockGraves.length;
    if (count <= 10) return "grid-cols-5";
    if (count <= 15) return "grid-cols-5";
    if (count <= 20) return "grid-cols-5 md:grid-cols-6 lg:grid-cols-8";
    return "grid-cols-6 md:grid-cols-8 lg:grid-cols-10";
  }, [activeBlockGraves.length]);

  const handlePlotClick = (plot: GravePlot) => {
    if (isAdmin && plot && (plot.status === "OCCUPIED" || plot.status === "RESERVED")) {
      setModalData(plot);
      setShowModal(true);
    }
  };

  const cemeteryName = activeGeo?.name || "";

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Cemetery selector + name */}
        {cemeteryGeo.length > 0 && (
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
            {cemeteryGeo.length > 1 ? (
              <select
                value={activeCemeteryId}
                onChange={(e) => {
                  setActiveCemeteryId(e.target.value);
                  const cem = cemeteryGeo.find((c) => c.id === e.target.value);
                  if (cem && cem.blocks.length > 0) {
                    setActiveBlockCode(cem.blocks[0].code);
                  }
                }}
                className="text-xs font-medium bg-white border border-slate-200 rounded-lg px-2 py-1"
              >
                {cemeteryGeo.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-slate-500 font-medium">
                Pemakaman: <span className="text-slate-700">{cemeteryName}</span>
              </p>
            )}
          </div>
        )}

        {/* Block tabs */}
        <div className="flex border-b border-slate-100 overflow-x-auto">
          {blocks.map((block) => (
            <button
              key={block}
              onClick={() => setActiveBlockCode(block)}
              className={`flex-1 min-w-[60px] py-3 px-4 text-sm font-bold transition-colors ${
                activeBlockCode === block
                  ? "bg-slate-800 text-white"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              Blok {block}
            </button>
          ))}
        </div>

        <div className="p-4">
          {showBlur ? (
            <div className="relative">
              <div className="opacity-30 pointer-events-none">
                {activeGeo && (
                  <CemeteryLeafletMap
                    data={activeGeo}
                    mode="public"
                    height="400px"
                    showLegend={false}
                  />
                )}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/90 backdrop-blur-sm px-6 py-4 rounded-2xl shadow-lg text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">Login Diperlukan</h3>
                  <p className="text-sm text-slate-600 mb-3">Silakan login untuk melihat peta lengkap</p>
                </div>
              </div>
            </div>
          ) : activeGeo ? (
            <div className="space-y-4">
              {/* Leaflet map with block highlighted */}
              <CemeteryLeafletMap
                data={activeGeo}
                mode="public"
                height="450px"
                showLegend={false}
              />

              {/* Block detail: show plot cards for active block */}
              {activeBlockGraves.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Blok {activeBlockCode} — {activeBlockGraves.length} petak
                  </p>
                  <div className={`grid ${gridCols} gap-2`}>
                    {activeBlockGraves.map((plot) => {
                      const status = plot.status || "AVAILABLE";
                      const bgColor = STATUS_COLORS[status]?.bg || STATUS_COLORS.AVAILABLE.bg;
                      const showDetails = isAdmin && (status === "OCCUPIED" || status === "RESERVED");
                      const canViewPrivate = isAdmin || (userId && plot.user_id === userId);

                      return (
                        <div
                          key={plot.id || plot.plot_number}
                          onClick={() => handlePlotClick(plot)}
                          onMouseEnter={() => setHoveredPlot(plot.plot_number)}
                          onMouseLeave={() => setHoveredPlot(null)}
                          className={`relative aspect-square rounded-lg border-b-2 cursor-pointer transition-all ${
                            showDetails ? "hover:scale-110 hover:shadow-md hover:z-10" : ""
                          } flex items-center justify-center text-[10px] md:text-xs font-bold`}
                          style={{ backgroundColor: bgColor, borderColor: bgColor, color: "#1a1a1a" }}
                        >
                          <span>{plot.plot_number}</span>

                          {!canViewPrivate && status === "OCCUPIED" && (
                            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                              <span className="text-[8px] text-slate-500">Privat</span>
                            </div>
                          )}

                          {showDetails && isAdmin && hoveredPlot === plot.plot_number && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white text-[10px] px-3 py-2 rounded-lg whitespace-nowrap z-20">
                              <div className="font-bold">{plot.deceased_name || "N/A"}</div>
                              <div className="opacity-70">{plot.applicant_name || "N/A"}</div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm font-medium">Tidak ada data petak untuk blok ini</p>
            </div>
          )}
        </div>
      </div>

      {showModal && modalData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">
                Detail Petak {modalData.plot_number}
                <span className="text-sm font-normal text-slate-500 ml-2">
                  Blok {modalData.block_code}
                </span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b">
                <span className="text-slate-500">Pemakaman</span>
                <span className="font-medium">{modalData.cemetery_name}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-slate-500">Lokasi</span>
                <span className="font-medium">Blok {modalData.block_code} / Petak {modalData.plot_number}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-slate-500">Status</span>
                <span className={`font-bold ${
                  modalData.status === "AVAILABLE" ? "text-emerald-600" :
                  modalData.status === "RESERVED" ? "text-amber-600" : "text-rose-600"
                }`}>
                  {STATUS_COLORS[modalData.status]?.label}
                </span>
              </div>

              {modalData.deceased_name && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-slate-500">Nama Jenazah</span>
                  <span className="font-medium">{modalData.deceased_name}</span>
                </div>
              )}

              {modalData.applicant_name && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-slate-500">Pemohon</span>
                  <span className="font-medium">{modalData.applicant_name}</span>
                </div>
              )}

              {modalData.applicant_phone && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-slate-500">Telepon</span>
                  <span className="font-medium">{modalData.applicant_phone}</span>
                </div>
              )}

              {modalData.created_at && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-slate-500">Tanggal</span>
                  <span className="font-medium">
                    {new Date(modalData.created_at).toLocaleDateString("id-ID")}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="w-full mt-6 py-3 bg-slate-800 text-white rounded-xl font-bold"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
}
