import { query } from "@/lib/db";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import { ClientTabs } from "@/components/makam/ClientTabs";

const STATUS_COLORS = {
  AVAILABLE: { bg: "#81C784", label: "Tersedia" },
  RESERVED: { bg: "#FFB74D", label: "Dipesan" },
  OCCUPIED: { bg: "#E57373", label: "Terisi" },
};

async function getSession() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

async function getUserRole(userId: string) {
  const res = await query(`SELECT role FROM public.profiles WHERE id = $1`, [
    userId,
  ]);
  return res.rows[0]?.role || "USER";
}

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

interface CemeteryGeoData {
  id: string;
  name: string;
  code: string;
  map_config: Record<string, unknown>;
  blocks: {
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
  }[];
}

/** Serialize for client — no functions, no Dates */
function serializeGeo(data: CemeteryGeoData[]): CemeteryGeoData[] {
  return JSON.parse(JSON.stringify(data));
}

export default async function MakamPage() {
  const user = await getSession();
  let userRole: string | null = null;
  let userId: string | null = null;

  if (user) {
    userRole = await getUserRole(user.id);
    userId = user.id;
  }

  const isAdmin = userRole === "ADMIN";

  // Fetch plots with geo data
  const plotsRes = await query(`
    SELECT
      cp.id,
      cp.plot_number,
      cp.status,
      cp.map_coords::text AS plot_map_coords,
      cb.id AS block_uuid,
      cb.code AS block_code,
      cb.name AS block_name,
      cb.map_coords::text AS block_map_coords,
      c.id AS cemetery_id,
      c.name AS cemetery_name,
      c.code AS cemetery_code,
      c.map_config::text AS cemetery_map_config,
      m.deceased_name,
      m.user_id,
      m.applicant_name,
      m.applicant_phone,
      m.created_at
    FROM public.cemetery_plots cp
    JOIN public.cemetery_blocks cb ON cb.id = cp.block_id
    JOIN public.cemeteries c ON c.id = cb.cemetery_id
    LEFT JOIN public.makam m ON m.plot_id = cp.id
    ORDER BY c.name, cb.sort_order ASC, cp.plot_number ASC
  `);

  const rows = plotsRes.rows as Record<string, unknown>[];

  // Build flat grave plots
  const graves: GravePlot[] = rows.map((r) => ({
    id: r.id as string,
    plot_number: r.plot_number as string,
    status: r.status as string,
    block_code: r.block_code as string,
    block_name: r.block_name as string,
    cemetery_name: r.cemetery_name as string,
    deceased_name: r.deceased_name as string | undefined,
    user_id: r.user_id as string | undefined,
    applicant_name: r.applicant_name as string | undefined,
    applicant_phone: r.applicant_phone as string | undefined,
    created_at: r.created_at as string | undefined,
  }));

  // Build cemetery geo data for Leaflet map
  const cemMap = new Map<string, CemeteryGeoData>();
  for (const r of rows) {
    const cemId = r.cemetery_id as string;
    if (!cemMap.has(cemId)) {
      let mapConfig: Record<string, unknown> = {};
      try {
        mapConfig = JSON.parse(r.cemetery_map_config as string) as Record<string, unknown>;
      } catch { /* ignore */ }

      cemMap.set(cemId, {
        id: cemId,
        name: r.cemetery_name as string,
        code: r.cemetery_code as string,
        map_config: mapConfig,
        blocks: [],
      });
    }

    const cemetery = cemMap.get(cemId)!;
    const blockKey = r.block_uuid as string || (r.block_code as string);
    let block = cemetery.blocks.find((b) => b.id === blockKey);
    if (!block) {
      let blockCoords: Record<string, unknown> = {};
      try {
        blockCoords = JSON.parse(r.block_map_coords as string) as Record<string, unknown>;
      } catch { /* ignore */ }

      block = {
        id: blockKey,
        code: r.block_code as string,
        name: r.block_name as string,
        map_coords: blockCoords,
        plots: [],
      };
      cemetery.blocks.push(block);
    }

    let plotCoords: Record<string, unknown> = {};
    try {
      plotCoords = JSON.parse(r.plot_map_coords as string) as Record<string, unknown>;
    } catch { /* ignore */ }

    block.plots.push({
      id: r.id as string,
      plot_number: r.plot_number as string,
      status: r.status as string,
      map_coords: plotCoords,
    });
  }

  const cemeteryGeo = serializeGeo(Array.from(cemMap.values()));

  const statusCounts = { AVAILABLE: 0, RESERVED: 0, OCCUPIED: 0 };
  graves.forEach((g) => {
    if (g.status in statusCounts)
      statusCounts[g.status as keyof typeof statusCounts]++;
  });

  const graveMapRecord: Record<string, GravePlot> = {};
  graves.forEach((g) => {
    graveMapRecord[`${g.block_code}-${g.plot_number}`] = g;
  });

  const cemeteries = cemeteryGeo.map((c) => ({
    id: c.id,
    name: c.name,
    blocks: c.blocks.map((b) => b.code),
  }));
  const defaultCemeteryId = cemeteries[0]?.id || "";
  const defaultBlock = cemeteries[0]?.blocks[0] || "A";

  return (
    <div className="min-h-screen bg-neutral">
      <div className="container mx-auto px-3 md:px-6 py-6 space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 font-manrope">
            Peta Lahan Pemakaman
          </h1>
          <p className="text-secondary text-xs md:text-sm">
            Pemetaan Lahan Pemakaman yang terbagi dalam blok-blok
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-3">
            {Object.entries(STATUS_COLORS).map(([status, { bg, label }]) => (
              <div key={status} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: bg }}
                />
                <span className="text-xs font-medium text-slate-600">
                  {label}
                </span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 text-xs">
            <span className="text-emerald-600 font-bold">
              {statusCounts.AVAILABLE}
            </span>
            <span className="text-amber-600 font-bold">
              {statusCounts.RESERVED}
            </span>
            <span className="text-rose-600 font-bold">
              {statusCounts.OCCUPIED}
            </span>
          </div>
        </div>

        <ClientTabs
          defaultCemeteryId={defaultCemeteryId}
          defaultBlock={defaultBlock}
          isAdmin={isAdmin}
          userId={userId}
          graveMap={graveMapRecord}
          isLoggedIn={!!user}
          cemeteryGeo={cemeteryGeo}
        />

        <div className="text-center py-4">
          <p className="text-xs text-slate-500">
            Total: <span className="font-bold">{graves.length}</span> petak
          </p>
          {!user && (
            <Link
              href="/auth/login"
              className="inline-block mt-2 text-xs bg-primary text-white px-4 py-2 rounded-full font-bold hover:bg-primary-dark"
            >
              Login untuk Detail
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
