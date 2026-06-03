import { NextResponse } from "next/server";
import pool from "@/lib/db";

/**
 * GET /api/admin/plot/:id/block
 * Returns block and cemetery info for a given plot ID.
 * Used by GraveAllocation to pre-select the current cemetery/block.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const { rows } = await pool.query(
      `SELECT
         cp.id AS plot_id,
         cp.block_id,
         cb.cemetery_id
       FROM cemetery_plots cp
       JOIN cemetery_blocks cb ON cb.id = cp.block_id
       WHERE cp.id = $1`,
      [id],
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Plot tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({
      plotId: rows[0].plot_id,
      blockId: rows[0].block_id,
      cemeteryId: rows[0].cemetery_id,
    });
  } catch (error) {
    console.error("Plot block lookup error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
