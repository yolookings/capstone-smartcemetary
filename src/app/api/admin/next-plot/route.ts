import { NextResponse } from "next/server";
import pool from "@/lib/db";

/**
 * GET /api/admin/next-plot?block_id=xxx
 * GET /api/admin/next-plot?cemetery_id=xxx
 *
 * Returns the next available plot.
 * If block_id is provided → finds lowest available plot in that block.
 * If cemetery_id is provided → finds next block by sort_order with available plots,
 *   then lowest plot in that block (auto cross-block continuation).
 *
 * Read-only check — no locking.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const blockId = searchParams.get("block_id");
    const cemeteryId = searchParams.get("cemetery_id");

    // ── Block-specific lookup ────────────────────────────────
    if (blockId) {
      const blockCheck = await pool.query(
        `SELECT id, name, code FROM cemetery_blocks WHERE id = $1`,
        [blockId],
      );

      if (blockCheck.rows.length === 0) {
        return NextResponse.json({ error: "Blok tidak ditemukan" }, { status: 404 });
      }

      const block = blockCheck.rows[0];
      const { rows: availablePlots } = await pool.query(
        `SELECT id, plot_number, status, map_coords
         FROM cemetery_plots
         WHERE block_id = $1 AND status = 'AVAILABLE'
         ORDER BY plot_number ASC LIMIT 1`,
        [blockId],
      );

      const { rows: countRows } = await pool.query(
        `SELECT COUNT(*)::int AS available
         FROM cemetery_plots WHERE block_id = $1 AND status = 'AVAILABLE'`,
        [blockId],
      );

      const totalAvailable = countRows[0]?.available ?? 0;

      if (availablePlots.length === 0) {
        return NextResponse.json({
          available: false,
          blockFull: true,
          message: `Blok ${block.name} sudah penuh`,
          block: { id: block.id, name: block.name, code: block.code },
          availableCount: 0,
        });
      }

      const nextPlot = availablePlots[0];
      return NextResponse.json({
        available: true,
        blockFull: false,
        plot: {
          id: nextPlot.id,
          plotNumber: nextPlot.plot_number,
          status: nextPlot.status,
          mapCoords: nextPlot.map_coords,
        },
        block: { id: block.id, name: block.name, code: block.code },
        availableCount: totalAvailable,
      });
    }

    // ── Cemetery-wide auto-allocation (by sort_order) ────────
    if (cemeteryId) {
      // Find next block with available plots, ordered by sort_order
      const { rows: nextBlockRows } = await pool.query(
        `SELECT cb.id, cb.name, cb.code, cb.sort_order,
                (SELECT COUNT(*) FROM cemetery_plots cp
                 WHERE cp.block_id = cb.id AND cp.status = 'AVAILABLE')::int AS available
         FROM cemetery_blocks cb
         WHERE cb.cemetery_id = $1
           AND EXISTS (
             SELECT 1 FROM cemetery_plots cp
             WHERE cp.block_id = cb.id AND cp.status = 'AVAILABLE'
           )
         ORDER BY cb.sort_order ASC
         LIMIT 1`,
        [cemeteryId],
      );

      if (nextBlockRows.length === 0) {
        return NextResponse.json({
          available: false,
          cemeteryFull: true,
          message: "Semua blok di pemakaman ini sudah penuh",
          availableCount: 0,
        });
      }

      const nextBlock = nextBlockRows[0];

      // Find lowest available plot in the chosen block
      const { rows: availablePlots } = await pool.query(
        `SELECT id, plot_number, status, map_coords
         FROM cemetery_plots
         WHERE block_id = $1 AND status = 'AVAILABLE'
         ORDER BY plot_number ASC LIMIT 1`,
        [nextBlock.id],
      );

      // Count total available across entire cemetery
      const { rows: totalRows } = await pool.query(
        `SELECT COUNT(*)::int AS available
         FROM cemetery_plots cp
         JOIN cemetery_blocks cb ON cb.id = cp.block_id
         WHERE cb.cemetery_id = $1 AND cp.status = 'AVAILABLE'`,
        [cemeteryId],
      );

      const nextPlot = availablePlots[0];
      return NextResponse.json({
        available: true,
        cemeteryFull: false,
        plot: {
          id: nextPlot.id,
          plotNumber: nextPlot.plot_number,
          status: nextPlot.status,
          mapCoords: nextPlot.map_coords,
        },
        block: {
          id: nextBlock.id,
          name: nextBlock.name,
          code: nextBlock.code,
          sortOrder: nextBlock.sort_order,
          availableCount: nextBlock.available,
        },
        availableCount: totalRows[0]?.available ?? 0,
      });
    }

    return NextResponse.json(
      { error: "Parameter block_id atau cemetery_id diperlukan" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Next-plot error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
