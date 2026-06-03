import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, code, address, description, map_config
       FROM cemeteries
       ORDER BY name ASC`,
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Cemeteries fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
