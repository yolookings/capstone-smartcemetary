import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { rows } = await pool.query(
      `SELECT id, name, code, capacity, map_coords, sort_order
       FROM cemetery_blocks
       WHERE cemetery_id = $1
       ORDER BY sort_order ASC`,
      [id],
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Blocks fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
