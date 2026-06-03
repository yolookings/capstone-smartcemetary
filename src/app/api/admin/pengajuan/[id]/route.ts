import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notifyUserStatusChange } from "@/lib/whatsapp";
import pool from "@/lib/db";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function dbUpdate(table: string, id: string, data: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Update failed: ${err}`);
  }

  return res.json();
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      SUPABASE_URL,
      SUPABASE_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const profileRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=role`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    const profiles = await profileRes.json();
    if (!profiles[0] || profiles[0].role !== 'ADMIN') {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    const { id } = await params;
    const { status, notes, plot_id, block_id, cemetery_id } = await req.json();

    // Update pengajuan status
    const updated = await dbUpdate('pengajuan', id, { status, notes });

    // ── Full auto-allocation via cemetery_id (cross-block) ───
    // Finds next block by sort_order with available plots,
    // then picks the lowest available plot number.
    if (cemetery_id && !block_id && !plot_id) {
      const pgClient = await pool.connect();
      try {
        await pgClient.query("BEGIN");

        // Find next block with available plots, ordered by sort_order
        const { rows: nextBlocks } = await pgClient.query(
          `SELECT cb.id, cb.code, cb.name
           FROM cemetery_blocks cb
           WHERE cb.cemetery_id = $1
             AND EXISTS (
               SELECT 1 FROM cemetery_plots cp
               WHERE cp.block_id = cb.id AND cp.status = 'AVAILABLE'
               FOR UPDATE
             )
           ORDER BY cb.sort_order ASC
           LIMIT 1
           FOR UPDATE`,
          [cemetery_id]
        );

        if (nextBlocks.length === 0) {
          throw new Error("Semua blok di pemakaman ini sudah penuh");
        }

        const nextBlock = nextBlocks[0];

        // Lock and pick lowest available plot in this block
        const { rows: availablePlots } = await pgClient.query(
          `SELECT id, plot_number
           FROM cemetery_plots
           WHERE block_id = $1 AND status = 'AVAILABLE'
           ORDER BY plot_number ASC
           LIMIT 1
           FOR UPDATE`,
          [nextBlock.id]
        );

        if (availablePlots.length === 0) {
          throw new Error("Blok ${nextBlock.name} tidak memiliki petak tersedia");
        }

        const autoPlot = availablePlots[0];
        const newPlotStatus = status === "APPROVED" ? "OCCUPIED" : "RESERVED";

        await pgClient.query(
          `UPDATE cemetery_plots SET status = $1 WHERE id = $2`,
          [newPlotStatus, autoPlot.id]
        );

        const { rows: blockRows } = await pgClient.query(
          `SELECT cb.code AS block_code, cb.name AS block_name, cp.plot_number,
                  c.name AS cemetery_name
           FROM cemetery_plots cp
           JOIN cemetery_blocks cb ON cb.id = cp.block_id
           JOIN cemeteries c ON c.id = cb.cemetery_id
           WHERE cp.id = $1`,
          [autoPlot.id]
        );

        const blockInfo = blockRows[0];

        await pgClient.query(
          `UPDATE makam
           SET plot_id = $1, blok = $2, nomor = $3, status = $4
           WHERE pengajuan_id = $5`,
          [autoPlot.id, blockInfo.block_code, blockInfo.plot_number, newPlotStatus, id]
        );

        await pgClient.query("COMMIT");

        await sendNotification(id, status, notes, blockInfo.block_code, blockInfo.plot_number);

        return NextResponse.json({
          ...(updated[0] || {}),
          plot_id: autoPlot.id,
          plot_number: autoPlot.plot_number,
          blok: blockInfo.block_code,
          nomor: blockInfo.plot_number,
          cemetery_name: blockInfo.cemetery_name,
          autoAllocated: true,
          blockId: nextBlock.id,
        });
      } catch (txErr) {
        await pgClient.query("ROLLBACK");
        throw txErr;
      } finally {
        pgClient.release();
      }
    }

    // ── Sequential auto-allocation via block_id ──────────────
    // Server finds next AVAILABLE plot in the block atomically.
    if (block_id && !plot_id) {
      const pgClient = await pool.connect();
      try {
        await pgClient.query('BEGIN');

        // Lock all available plots in this block (prevents race)
        const { rows: availablePlots } = await pgClient.query(
          `SELECT id, plot_number
           FROM cemetery_plots
           WHERE block_id = $1 AND status = 'AVAILABLE'
           ORDER BY plot_number ASC
           LIMIT 1
           FOR UPDATE`,
          [block_id]
        );

        if (availablePlots.length === 0) {
          throw new Error("Blok sudah penuh — tidak ada petak tersedia");
        }

        const autoPlot = availablePlots[0];
        const newPlotStatus = status === "APPROVED" ? 'OCCUPIED' : 'RESERVED';

        await pgClient.query(
          `UPDATE cemetery_plots SET status = $1 WHERE id = $2`,
          [newPlotStatus, autoPlot.id]
        );

        const { rows: blockRows } = await pgClient.query(
          `SELECT cb.code AS block_code, cb.name AS block_name, cp.plot_number,
                  c.name AS cemetery_name
           FROM cemetery_plots cp
           JOIN cemetery_blocks cb ON cb.id = cp.block_id
           JOIN cemeteries c ON c.id = cb.cemetery_id
           WHERE cp.id = $1`,
          [autoPlot.id]
        );

        const blockInfo = blockRows[0];

        await pgClient.query(
          `UPDATE makam
           SET plot_id = $1,
               blok = $2,
               nomor = $3,
               status = $4
           WHERE pengajuan_id = $5`,
          [autoPlot.id, blockInfo.block_code, blockInfo.plot_number, newPlotStatus, id]
        );

        await pgClient.query('COMMIT');

        await sendNotification(id, status, notes, blockInfo.block_code, blockInfo.plot_number);

        return NextResponse.json({
          ...(updated[0] || {}),
          plot_id: autoPlot.id,
          plot_number: autoPlot.plot_number,
          blok: blockInfo.block_code,
          nomor: blockInfo.plot_number,
          cemetery_name: blockInfo.cemetery_name,
          autoAllocated: true,
        });
      } catch (txErr) {
        await pgClient.query('ROLLBACK');
        throw txErr;
      } finally {
        pgClient.release();
      }
    }

    // ── Direct plot_id allocation ────────────────────────────
    if (plot_id) {
      // Use direct pg transaction for atomic plot locking + allocation
      const pgClient = await pool.connect();
      try {
        await pgClient.query('BEGIN');

        // Lock the plot row to prevent race conditions
        const { rows: lockedPlots } = await pgClient.query(
          `SELECT id, status, plot_number, block_id
           FROM cemetery_plots
           WHERE id = $1
           FOR UPDATE`,
          [plot_id]
        );

        if (lockedPlots.length === 0) {
          throw new Error("Plot tidak ditemukan");
        }

        const lockedPlot = lockedPlots[0];
        const isAlreadyOwned = await checkIfPlotAlreadyAssigned(pgClient, id, plot_id);

        // Only check availability if it's not already assigned to this pengajuan
        if (!isAlreadyOwned && lockedPlot.status !== 'AVAILABLE') {
          throw new Error("Plot sudah tidak tersedia");
        }

        const newPlotStatus = status === "APPROVED" ? 'OCCUPIED' : 'RESERVED';

        // Update cemetery_plots status
        await pgClient.query(
          `UPDATE cemetery_plots SET status = $1 WHERE id = $2`,
          [newPlotStatus, plot_id]
        );

        // Get block + cemetery info for the notification
        const { rows: blockRows } = await pgClient.query(
          `SELECT cb.code AS block_code, cb.name AS block_name, cp.plot_number,
                  c.name AS cemetery_name
           FROM cemetery_plots cp
           JOIN cemetery_blocks cb ON cb.id = cp.block_id
           JOIN cemeteries c ON c.id = cb.cemetery_id
           WHERE cp.id = $1`,
          [plot_id]
        );

        // Update makam record: set plot_id, blok, nomor from the plot data
        const blockInfo = blockRows[0];
        await pgClient.query(
          `UPDATE makam
           SET plot_id = $1,
               blok = $2,
               nomor = $3,
               status = $4
           WHERE pengajuan_id = $5`,
          [plot_id, blockInfo.block_code, blockInfo.plot_number, newPlotStatus, id]
        );

        await pgClient.query('COMMIT');

        // Update the notification data with enriched location info
        const waBlok = blockInfo.block_code;
        const waNomor = blockInfo.plot_number;

        // Send WhatsApp notification with enriched data
        await sendNotification(id, status, notes, waBlok, waNomor);

        return NextResponse.json({
          ...updated[0],
          plot_id,
          blok: waBlok,
          nomor: waNomor,
          cemetery_name: blockInfo.cemetery_name,
        });
      } catch (txErr) {
        await pgClient.query('ROLLBACK');
        throw txErr;
      } finally {
        pgClient.release();
      }
    }

    // No plot_id — just status update (reject, request revision, or approve without new allocation)
    if (status === "APPROVED") {
      // Approve existing allocation — set makam to OCCUPIED
      await dbUpdate('makam', id, { status: 'OCCUPIED' });

      // Also update cemetery_plots if there's a plot_id
      const checkRes = await fetch(
        `${SUPABASE_URL}/rest/v1/makam?pengajuan_id=eq.${id}&select=plot_id`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
        }
      );
      const makamRows = await checkRes.json();
      const existingPlotId = makamRows[0]?.plot_id;
      if (existingPlotId) {
        await fetch(
          `${SUPABASE_URL}/rest/v1/cemetery_plots?id=eq.${existingPlotId}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
            },
            body: JSON.stringify({ status: 'OCCUPIED' }),
          }
        );
      }
    }

    // Send notification without plot info
    await sendNotification(id, status, notes, null, null);

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Admin update error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function checkIfPlotAlreadyAssigned(
  client: { query: (text: string, params?: unknown[]) => Promise<{ rows: unknown[] }> },
  pengajuanId: string,
  plotId: string
): Promise<boolean> {
  const { rows } = await client.query(
    `SELECT id FROM makam WHERE pengajuan_id = $1 AND plot_id = $2`,
    [pengajuanId, plotId]
  );
  return rows.length > 0;
}

async function sendNotification(
  pengajuanId: string,
  status: string,
  notes: string | null,
  blok: string | null,
  nomor: string | null
) {
  try {
    const pengajuanRes = await fetch(
      `${SUPABASE_URL}/rest/v1/pengajuan?id=eq.${pengajuanId}&select=*,profiles(phone,whatsapp_number,full_name),makam(*)`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    const pengajuanData = await pengajuanRes.json();
    const profile = pengajuanData[0]?.profiles;
    const userPhone = profile?.phone || profile?.whatsapp_number;

    if (userPhone) {
      console.log("[ADMIN] Sending WhatsApp to:", userPhone, "status:", status);
      notifyUserStatusChange({
        userPhone,
        status: status as "APPROVED" | "REJECTED" | "NEED_REVISION",
        pengajuanId,
        blok: blok || undefined,
        nomor: nomor || undefined,
        revisionNote: notes || undefined,
      }).catch(e => console.error("[WA ERROR]", e));
    }
  } catch (e) {
    console.error("[NOTIFICATION ERROR]", e);
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/pengajuan?id=eq.${id}&select=*,profiles(email,full_name),makam(*),dokumen(*)`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      }
    );

    const data = await res.json();
    return NextResponse.json(data[0] || null);
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
