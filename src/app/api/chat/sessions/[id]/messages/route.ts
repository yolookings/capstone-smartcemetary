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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    const clientIp = getClientIp(req);
    const ipHash = hashIp(clientIp);

    const sessionResult = await query(
      `SELECT * FROM chat_sessions WHERE id = $1 AND (user_id = $2 OR ip_hash = $3)`,
      [id, user?.id || null, ipHash]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const messagesResult = await query(
      `SELECT role, content, created_at 
       FROM chat_messages 
       WHERE session_id = $1 
       ORDER BY created_at ASC`,
      [id]
    );

    return NextResponse.json({ messages: messagesResult.rows });
  } catch (error) {
    console.error("Get messages error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}