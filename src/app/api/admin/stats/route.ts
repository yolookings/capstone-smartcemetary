import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify role in database (source of truth for promotions)
    const roleRes = await query(
      `SELECT role FROM public.profiles WHERE id = $1`,
      [user.id]
    );
    const dbRole = roleRes.rows[0]?.role || user.user_metadata?.role || 'USER';

    if (dbRole !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Query all statistics in a single, super-fast direct PostgreSQL query
    const statsRes = await query(`
      SELECT 
        (SELECT COUNT(*) FROM public.pengajuan) as total_pengajuan,
        (SELECT COUNT(*) FROM public.profiles) as total_users,
        (SELECT COUNT(*) FROM public.makam) as total_makam,
        (SELECT COUNT(*) FROM public.makam WHERE status = 'AVAILABLE') as available_makam,
        (SELECT COUNT(*) FROM public.makam WHERE status = 'OCCUPIED') as occupied_makam,
        (SELECT COUNT(*) FROM public.makam WHERE status = 'RESERVED') as reserved_makam,
        (SELECT COUNT(*) FROM public.pengajuan WHERE status = 'PENDING') as pending_count,
        (SELECT COUNT(*) FROM public.pengajuan WHERE status = 'APPROVED') as approved_count,
        (SELECT COUNT(*) FROM public.pengajuan WHERE status = 'REJECTED') as rejected_count,
        (SELECT COUNT(*) FROM public.pengajuan WHERE status = 'REVISION') as revision_count
    `);

    const stats = statsRes.rows[0];

    // Query recent submissions with profile details directly using SQL join
    const recentRes = await query(`
      SELECT p.*, pr.email, pr.full_name
      FROM public.pengajuan p
      LEFT JOIN public.profiles pr ON p.user_id = pr.id
      ORDER BY p.created_at DESC
      LIMIT 10
    `);

    interface DbRow {
      id: string;
      status: string;
      created_at: string;
      user_id: string;
      notes: string | null;
      email: string | null;
      full_name: string | null;
    }

    const enrichedList = (recentRes.rows as DbRow[]).map((row) => ({
      id: row.id,
      status: row.status,
      created_at: row.created_at,
      user_id: row.user_id,
      notes: row.notes,
      profiles: row.email ? {
        email: row.email,
        full_name: row.full_name || row.email.split('@')[0]
      } : undefined
    }));

    return NextResponse.json({
      stats: {
        totalPengajuan: parseInt(stats.total_pengajuan || '0'),
        totalUsers: parseInt(stats.total_users || '0'),
        totalMakam: parseInt(stats.total_makam || '0'),
        availableMakam: parseInt(stats.available_makam || '0'),
        occupiedMakam: parseInt(stats.occupied_makam || '0'),
        reservedMakam: parseInt(stats.reserved_makam || '0'),
        pendingCount: parseInt(stats.pending_count || '0'),
        approvedCount: parseInt(stats.approved_count || '0'),
        rejectedCount: parseInt(stats.rejected_count || '0'),
        revisionCount: parseInt(stats.revision_count || '0')
      },
      pengajuanList: enrichedList
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Error in admin stats API:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
