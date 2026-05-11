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

const BLOKS = ["A", "B", "C", "D", "E"];

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
  blok: string;
  nomor: number;
  status: string;
  deceased_name?: string;
  user_id?: string;
  applicant_name?: string;
  applicant_phone?: string;
  created_at?: string;
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

  const gravesRes = await query(`
    SELECT m.blok, m.nomor, m.status, m.deceased_name, m.user_id, 
           m.applicant_name, m.applicant_phone, m.created_at
    FROM public.makam m
    WHERE m.blok != 'TBA'
    ORDER BY m.blok ASC, m.nomor ASC
  `);

  const graves: GravePlot[] = gravesRes.rows;
  const graveMap = new Map<string, GravePlot>();
  graves.forEach((g) => graveMap.set(`${g.blok}${g.nomor}`, g));

  const statusCounts = { AVAILABLE: 0, RESERVED: 0, OCCUPIED: 0 };
  graves.forEach((g) => {
    if (g.status in statusCounts)
      statusCounts[g.status as keyof typeof statusCounts]++;
  });

  const graveMapRecord = Object.fromEntries(graveMap);

  return (
    <div className="min-h-screen bg-neutral">
      <div className="container mx-auto px-3 md:px-6 py-6 space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 font-manrope">
            Peta Lahan Pemakaman
          </h1>
          <p className="text-secondary text-xs md:text-sm">
            Pemetaan Lahan Pemakaman yang dibagi menjadi 5 Blok yang berisi
            kurang lebih 99 Plot Makam.
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
          defaultTab="A"
          isAdmin={isAdmin}
          userId={userId}
          graveMap={graveMapRecord as Record<string, GravePlot>}
        />

        <div className="text-center py-4">
          <p className="text-xs text-slate-500">
            Total: <span className="font-bold">99</span> petak
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
