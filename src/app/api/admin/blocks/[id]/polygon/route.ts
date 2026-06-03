import { NextResponse } from "next/server";
import pool from "@/lib/db";

/**
 * PATCH /api/admin/blocks/:id/polygon
 * Updates the geographic polygon boundary for a cemetery block.
 * Body: { polygon: GeoJSON Feature }
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { polygon } = await req.json();

    if (!polygon || !polygon.geometry || polygon.geometry.type !== "Polygon") {
      return NextResponse.json(
        { error: "Polygon harus berupa GeoJSON Feature dengan geometry Polygon" },
        { status: 400 },
      );
    }

    const coordinates = polygon.geometry.coordinates;
    if (!coordinates?.[0]?.length || coordinates[0].length < 4) {
      return NextResponse.json(
        { error: "Polygon minimal memiliki 4 titik (ring tertutup)" },
        { status: 400 },
      );
    }

    const { rows } = await pool.query(
      `UPDATE cemetery_blocks
       SET polygon = $1::jsonb
       WHERE id = $2
       RETURNING id, name, code, polygon`,
      [JSON.stringify(polygon), id],
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Blok tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, block: rows[0] });
  } catch (error) {
    console.error("Polygon update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * GET /api/admin/blocks/:id/polygon
 * Returns the polygon for a block.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { rows } = await pool.query(
      `SELECT id, name, code, polygon, map_coords
       FROM cemetery_blocks WHERE id = $1`,
      [id],
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Blok tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ block: rows[0] });
  } catch (error) {
    console.error("Polygon fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
