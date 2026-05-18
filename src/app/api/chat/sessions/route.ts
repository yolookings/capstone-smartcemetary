import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase-auth";
import { query } from "@/lib/db";
import { createHash } from "crypto";

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  if (forwarded) return forwarded.split(",")[0].trim();
  if (realIp) return realIp;
  return "unknown";
}

function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").substring(0, 32);
}

async function listSessions(userId: string | null, ipHash: string) {
  let result;
  if (userId) {
    result = await query(
      `SELECT id, title, last_message, created_at, updated_at
       FROM chat_sessions
       WHERE user_id = $1
       ORDER BY updated_at DESC
       LIMIT 50`,
      [userId]
    );
  } else {
    result = await query(
      `SELECT id, title, last_message, created_at, updated_at
       FROM chat_sessions
       WHERE ip_hash = $1 AND user_id IS NULL
       ORDER BY updated_at DESC
       LIMIT 50`,
      [ipHash]
    );
  }
  return result.rows;
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    const ipHash = hashIp(getClientIp(req));
    const sessions = await listSessions(user?.id || null, ipHash);
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("List sessions error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const ipHash = hashIp(getClientIp(req));
    const sessions = await listSessions(user?.id || null, ipHash);
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("List sessions error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}