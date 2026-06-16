"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  MapPin,
  Search,
  RefreshCw,
  Wifi,
  WifiOff,
  List,
  Edit3,
  Save,
  X,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import {
  CemeteryLeafletMap,
  type CemeteryGeo,
  type BlockGeo,
  type PlotGeo,
} from "@/components/cemetery-leaflet-map";

interface RawPlot {
  id: string;
  plot_number: string;
  status: string;
  map_coords: Record<string, unknown>;
  block_id: string;
  cemetery_blocks: Record<string, unknown> & {
    id: string;
    name: string;
    code: string;
    map_coords: Record<string, unknown>;
    polygon: Record<string, unknown> | null;
    sort_order: number;
    cemeteries: Record<string, unknown> & {
      id: string;
      name: string;
      code: string;
      map_config: Record<string, unknown>;
    };
  };
}

interface Stats {
  total: number;
  available: number;
  reserved: number;
  occupied: number;
}

/** Convert GeoJSON [lng, lat] to [lat, lng] */
function toLatLng(coord: number[]): [number, number] {
  return [coord[1], coord[0]];
}

function parseBlockGeo(
  rawCoords: Record<string, unknown>,
  rawPolygon: Record<string, unknown> | null,
): {
  polygon: [number, number][];
  center?: [number, number];
  plotsPerRow?: number;
  plotRows?: number;
} {
  const source = (rawPolygon || rawCoords) as Record<string, unknown>;
  if (source.type === "Feature" && source.geometry) {
    const geom = source.geometry as Record<string, unknown>;
    if (geom.type === "Polygon") {
      const ring = (geom.coordinates as number[][][])?.[0] || [];
      const polygon = ring[0] ? ring.map((c) => toLatLng(c)) : [];
      const props = (source.properties || {}) as Record<string, unknown>;
      const centerArr = props.center as number[] | undefined;
      return {
        polygon,
        center: centerArr ? toLatLng(centerArr) : undefined,
        plotsPerRow: props.plotsPerRow as number | undefined,
        plotRows: props.plotRows as number | undefined,
      };
    }
  }
  return { polygon: [] };
}

function parsePlotGeo(rawCoords: Record<string, unknown>): {
  coordinates: [number, number];
  cellWidth?: number;
  cellHeight?: number;
} {
  const coords = rawCoords as Record<string, unknown>;
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

function parseCemeteryMapConfig(config: Record<string, unknown>): {
  center: [number, number];
  zoom: number;
  boundary?: [number, number][];
} {
  const c = config as Record<string, unknown>;
  const centerArr = c.center as number[] | undefined;
  const boundaryArr = c.boundary as number[][] | undefined;
  return {
    center: centerArr ? toLatLng(centerArr) : [0, 0],
    zoom: (c.zoom as number) || 17,
    boundary: boundaryArr?.map((p) => toLatLng(p)),
  };
}

export default function AdminCemeteryPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rawPlots, setRawPlots] = useState<RawPlot[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [selectedCemeteryId, setSelectedCemeteryId] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "disconnected" | "checking"
  >("checking");

  const [polygonEditBlockId, setPolygonEditBlockId] = useState<string | null>(
    null,
  );
  const [polygonEditCoords, setPolygonEditCoords] = useState<string>("");
  const [polygonSaving, setPolygonSaving] = useState(false);
  const [polygonSaveError, setPolygonSaveError] = useState<string | null>(null);
  const [polygonSaveSuccess, setPolygonSaveSuccess] = useState(false);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError(null);
    setConnectionStatus("checking");

    try {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from("cemetery_plots")
        .select(
          "id, plot_number, status, map_coords, block_id, cemetery_blocks!inner(id, name, code, map_coords, polygon, sort_order, cemeteries!inner(id, name, code, map_config))",
        )
        .order("plot_number");

      if (fetchError) {
        setError(`Gagal terhubung ke server: ${fetchError.message}`);
        setConnectionStatus("disconnected");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      setConnectionStatus("connected");
      setRawPlots((data || []) as unknown as RawPlot[]);
    } catch {
      setError("Tidak dapat terhubung ke server");
      setConnectionStatus("disconnected");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const cemeteryMapData = useMemo(() => {
    const cemMap = new Map<string, CemeteryGeo>();
    const blockMap = new Map<string, BlockGeo>();

    for (const plot of rawPlots) {
      const block =
        (Array.isArray(plot.cemetery_blocks)
          ? plot.cemetery_blocks[0]
          : plot.cemetery_blocks) || {};
      const cemetery =
        (Array.isArray(block.cemeteries)
          ? block.cemeteries[0]
          : block.cemeteries) || {};

      if (!cemetery.id || !block.id) continue;

      if (!cemMap.has(cemetery.id)) {
        const mc = parseCemeteryMapConfig(
          (cemetery.map_config || {}) as Record<string, unknown>,
        );
        cemMap.set(cemetery.id, {
          id: cemetery.id,
          name: cemetery.name || "",
          code: cemetery.code || "",
          center: mc.center,
          zoom: mc.zoom,
          boundary: mc.boundary,
          blocks: [],
        });
      }

      const blockKey = `${cemetery.id}:${block.id}`;
      if (!blockMap.has(blockKey)) {
        const bc = parseBlockGeo(
          (block.map_coords || {}) as Record<string, unknown>,
          (block.polygon || null) as Record<string, unknown> | null,
        );
        const bg: BlockGeo = {
          id: block.id,
          name: block.name || "",
          code: block.code || "",
          polygon: bc.polygon,
          plots: [],
          availableCount: 0,
        };
        blockMap.set(blockKey, bg);
        cemMap.get(cemetery.id)!.blocks.push(bg);
      }

      const pg = parsePlotGeo(
        (plot.map_coords || {}) as Record<string, unknown>,
      );
      const plotGeo: PlotGeo = {
        id: plot.id,
        plotNumber: plot.plot_number,
        status: plot.status as PlotGeo["status"],
        coordinates: pg.coordinates,
        cellWidth: pg.cellWidth,
        cellHeight: pg.cellHeight,
      };
      blockMap.get(blockKey)!.plots.push(plotGeo);
    }

    for (const [, bg] of blockMap) {
      bg.availableCount = bg.plots.filter(
        (p) => p.status === "AVAILABLE",
      ).length;
    }

    return Array.from(cemMap.values());
  }, [rawPlots]);

  const filteredPlots = useMemo(() => {
    let filtered = rawPlots;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((p) => {
        const block =
          (Array.isArray(p.cemetery_blocks)
            ? p.cemetery_blocks[0]
            : p.cemetery_blocks) || {};
        const cemetery =
          (Array.isArray(block.cemeteries)
            ? block.cemeteries[0]
            : block.cemeteries) || {};
        return (
          String(p.plot_number).toLowerCase().includes(q) ||
          String(block.code || "")
            .toLowerCase()
            .includes(q) ||
          String(block.name || "")
            .toLowerCase()
            .includes(q) ||
          String(cemetery.name || "")
            .toLowerCase()
            .includes(q)
        );
      });
    }
    if (statusFilter) {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }
    return filtered;
  }, [searchQuery, statusFilter, rawPlots]);

  const stats: Stats = {
    total: rawPlots.length,
    available: rawPlots.filter((p) => p.status === "AVAILABLE").length,
    reserved: rawPlots.filter((p) => p.status === "RESERVED").length,
    occupied: rawPlots.filter((p) => p.status === "OCCUPIED").length,
  };

  const activeCemeteryData = useMemo(() => {
    if (!selectedCemeteryId) return cemeteryMapData[0] || null;
    return cemeteryMapData.find((c) => c.id === selectedCemeteryId) || null;
  }, [selectedCemeteryId, cemeteryMapData]);

  const getStatusLabel = (s: string) => {
    switch (s) {
      case "AVAILABLE":
        return "Tersedia";
      case "RESERVED":
        return "Dipesan";
      case "OCCUPIED":
        return "Terisi";
      default:
        return s;
    }
  };

  const handleOpenPolygonEditor = useCallback(() => {
    if (polygonEditBlockId) {
      setPolygonEditBlockId(null);
      setPolygonSaveError(null);
      setPolygonSaveSuccess(false);
      return;
    }
    const firstBlock = activeCemeteryData?.blocks?.[0];
    if (!firstBlock) return;
    setPolygonEditBlockId(firstBlock.id);
    setPolygonEditCoords(
      firstBlock.polygon.map((p) => `${p[1]},${p[0]}`).join("\n"),
    );
    setPolygonSaveError(null);
    setPolygonSaveSuccess(false);
  }, [polygonEditBlockId, activeCemeteryData]);

  const handlePolygonSave = useCallback(async () => {
    if (!polygonEditBlockId) return;
    setPolygonSaving(true);
    setPolygonSaveError(null);
    setPolygonSaveSuccess(false);
    try {
      const lines = polygonEditCoords
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length < 4) {
        throw new Error("Minimal 4 titik koordinat diperlukan");
      }
      const coordinates: number[][] = lines.map((line) => {
        const parts = line.split(",").map(Number);
        if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) {
          throw new Error(
            `Format koordinat tidak valid: "${line}". Gunakan format: lng,lat`,
          );
        }
        return parts;
      });
      coordinates.push(coordinates[0]);

      const polygonFeature = {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [coordinates],
        },
        properties: {},
      };

      const res = await fetch(
        `/api/admin/blocks/${polygonEditBlockId}/polygon`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ polygon: polygonFeature }),
        },
      );

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal menyimpan polygon");
      }

      setPolygonSaveSuccess(true);
      setTimeout(() => setPolygonSaveSuccess(false), 3000);
      fetchData(true);
    } catch (err) {
      setPolygonSaveError(
        err instanceof Error ? err.message : "Gagal menyimpan",
      );
    } finally {
      setPolygonSaving(false);
    }
  }, [polygonEditBlockId, polygonEditCoords]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        <p className="text-slate-500">Memuat data pemakaman...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] p-8">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 max-w-md text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <WifiOff className="text-red-500" size={40} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Gagal Memuat Data
          </h2>
          <p className="text-slate-500 mb-6">{error}</p>
          <button
            onClick={() => fetchData(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
          >
            <RefreshCw size={18} />
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            Monitoring Pemakaman
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Pantau ketersediaan dan penggunaan petak makam
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
              connectionStatus === "connected"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {connectionStatus === "connected" ? (
              <Wifi size={14} />
            ) : (
              <WifiOff size={14} />
            )}
            {connectionStatus === "connected" ? "Terhubung" : "Terputus"}
          </div>
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="p-2.5 bg-white rounded-xl border border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-300 transition-all disabled:opacity-50"
          >
            <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <MapPin className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              <p className="text-sm text-slate-500">Total Petak</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <MapPin className="text-emerald-600" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {stats.available}
              </p>
              <p className="text-sm text-slate-500">Tersedia</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <MapPin className="text-amber-600" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {stats.reserved}
              </p>
              <p className="text-sm text-slate-500">Dipesan</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center">
              <MapPin className="text-rose-600" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {stats.occupied}
              </p>
              <p className="text-sm text-slate-500">Terisi</p>
            </div>
          </div>
        </div>
      </div>

      {/* Block-level Stats */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center gap-2">
          <MapPin size={18} className="text-emerald-600" />
          <h3 className="font-bold text-slate-900">Statistik per Blok</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="text-left px-6 py-4">Blok</th>
                <th className="text-center px-6 py-4">Total Petak</th>
                <th className="text-center px-6 py-4">Tersedia</th>
                <th className="text-center px-6 py-4">Dipesan</th>
                <th className="text-center px-6 py-4">Terisi</th>
                <th className="text-center px-6 py-4">Occupancy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(() => {
                const blockMap = new Map<string, { name: string; total: number; available: number; reserved: number; occupied: number }>();
                for (const plot of rawPlots) {
                  const block = (Array.isArray(plot.cemetery_blocks) ? plot.cemetery_blocks[0] : plot.cemetery_blocks) || {};
                  if (!block.id) continue;
                  if (!blockMap.has(block.id)) {
                    blockMap.set(block.id, { name: block.name || block.code || "", total: 0, available: 0, reserved: 0, occupied: 0 });
                  }
                  const b = blockMap.get(block.id)!;
                  b.total++;
                  if (plot.status === "AVAILABLE") b.available++;
                  else if (plot.status === "RESERVED") b.reserved++;
                  else if (plot.status === "OCCUPIED") b.occupied++;
                }
                return Array.from(blockMap.values()).map((block) => {
                  const occ = block.total > 0 ? (((block.occupied + block.reserved) / block.total) * 100).toFixed(1) : "0.0";
                  return (
                    <tr key={block.name} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">{block.name}</td>
                      <td className="px-6 py-4 text-center text-slate-600">{block.total}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-semibold text-emerald-600">{block.available}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-semibold text-amber-600">{block.reserved}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-semibold text-rose-600">{block.occupied}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(parseFloat(occ), 100)}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-slate-600 w-12">{occ}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Polygon Editor Panel */}
      {polygonEditBlockId && (
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-amber-100 flex items-center justify-between bg-amber-50">
            <div className="flex items-center gap-2">
              <Edit3 size={18} className="text-amber-700" />
              <h3 className="font-bold text-slate-900">Edit Polygon Blok</h3>
            </div>
            <button
              onClick={() => {
                setPolygonEditBlockId(null);
                setPolygonSaveError(null);
                setPolygonSaveSuccess(false);
              }}
              className="p-1.5 hover:bg-amber-100 rounded-lg transition-colors"
            >
              <X size={18} className="text-slate-400" />
            </button>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Koordinat Polygon (GeoJSON lng,lat — satu titik per baris)
              </label>
              <textarea
                value={polygonEditCoords}
                onChange={(e) => setPolygonEditCoords(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                placeholder="112.81075,-7.29385&#10;112.81100,-7.29385&#10;..."
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePolygonSave}
                disabled={polygonSaving}
                className="px-5 py-2.5 bg-amber-600 text-white rounded-xl font-bold text-sm hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {polygonSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Menyimpan...
                  </>
                ) : (
                  <>
                    <Save size={16} /> Simpan Polygon
                  </>
                )}
              </button>
              {polygonSaveSuccess && (
                <span className="text-xs font-bold text-emerald-600">
                  Polygon berhasil disimpan!
                </span>
              )}
              {polygonSaveError && (
                <span className="text-xs font-bold text-rose-600">
                  {polygonSaveError}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-slate-900 text-lg">
                Peta Pemakaman
              </h3>
              {cemeteryMapData.length > 1 && (
                <select
                  value={selectedCemeteryId || ""}
                  onChange={(e) =>
                    setSelectedCemeteryId(e.target.value || null)
                  }
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Semua Pemakaman</option>
                  {cemeteryMapData.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Cari blok atau nomor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent w-64"
                />
              </div>
              <select
                value={statusFilter || ""}
                onChange={(e) => setStatusFilter(e.target.value || null)}
                className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Semua Status</option>
                <option value="AVAILABLE">Tersedia</option>
                <option value="RESERVED">Dipesan</option>
                <option value="OCCUPIED">Terisi</option>
              </select>
              <button
                onClick={handleOpenPolygonEditor}
                className={`p-2.5 rounded-xl border transition-all ${
                  polygonEditBlockId
                    ? "bg-amber-100 border-amber-300 text-amber-700"
                    : "bg-white border-slate-200 text-slate-500 hover:text-amber-600 hover:border-amber-300"
                }`}
                title="Edit Polygon Blok"
              >
                <Edit3 size={18} />
              </button>
              <div className="flex border border-slate-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setViewMode("map")}
                  className={`p-2.5 ${viewMode === "map" ? "bg-emerald-600 text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}
                >
                  <MapPin size={18} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2.5 ${viewMode === "list" ? "bg-emerald-600 text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {filteredPlots.length > 0 ? (
          viewMode === "map" ? (
            <div className="p-6">
              {activeCemeteryData ? (
                <CemeteryLeafletMap
                  data={activeCemeteryData}
                  mode="admin"
                  height="600px"
                />
              ) : (
                <div className="text-center py-16 text-slate-400">
                  <MapPin size={48} className="mx-auto mb-3 opacity-30" />
                  <p>Tidak ada data pemakaman</p>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="text-left px-6 py-4">Pemakaman</th>
                    <th className="text-left px-6 py-4">Blok</th>
                    <th className="text-left px-6 py-4">Petak</th>
                    <th className="text-left px-6 py-4">Status</th>
                    <th className="text-left px-6 py-4">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(() => {
                    const shownBlocks = new Set<string>();
                    return filteredPlots.map((plot) => {
                      const block =
                        (Array.isArray(plot.cemetery_blocks)
                          ? plot.cemetery_blocks[0]
                          : plot.cemetery_blocks) || {};
                      const cemetery =
                        (Array.isArray(block.cemeteries)
                          ? block.cemeteries[0]
                          : block.cemeteries) || {};
                      const isFirstInBlock = !shownBlocks.has(plot.block_id);
                      shownBlocks.add(plot.block_id);
                      return (
                        <tr
                          key={plot.id}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-6 py-4 font-medium text-slate-900">
                            {String(cemetery.name || "")}
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {String(block.name || "")}
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {plot.plot_number}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                plot.status === "AVAILABLE"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : plot.status === "RESERVED"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-rose-100 text-rose-700"
                              }`}
                            >
                              {getStatusLabel(plot.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {isFirstInBlock && (
                              <button
                                onClick={() => {
                                  const blockPolygon = (block.polygon ||
                                    block.map_coords) as Record<
                                    string,
                                    unknown
                                  > | null;
                                  if (blockPolygon) {
                                    const parsed = parseBlockGeo(
                                      block.map_coords as Record<
                                        string,
                                        unknown
                                      >,
                                      block.polygon as Record<
                                        string,
                                        unknown
                                      > | null,
                                    );
                                    setPolygonEditBlockId(plot.block_id);
                                    setPolygonEditCoords(
                                      parsed.polygon
                                        .map((p) => `${p[1]},${p[0]}`)
                                        .join("\n"),
                                    );
                                    setPolygonSaveError(null);
                                    setPolygonSaveSuccess(false);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                                title="Edit Polygon Blok"
                              >
                                <Edit3 size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <div className="p-16 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="text-slate-300" size={40} />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              Tidak ada data
            </h3>
            <p className="text-slate-500 text-sm">
              Data pemakaman akan muncul di sini
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
