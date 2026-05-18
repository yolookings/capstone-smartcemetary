import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase-auth";
import { query } from "@/lib/db";
import { createHash } from "crypto";

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  if (realIp) {
    return realIp;
  }
  return "unknown";
}

function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").substring(0, 32);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    const clientIp = getClientIp(req);
    const ipHash = hashIp(clientIp);

    const result = await query(
      `DELETE FROM chat_sessions 
       WHERE id = $1 AND (user_id = $2 OR ip_hash = $3)
       RETURNING id`,
      [id, user?.id || null, ipHash]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Session not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete session error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}