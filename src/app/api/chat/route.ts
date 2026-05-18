import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase-auth";
import { askAI } from "@/lib/ai-rag";
import { query } from "@/lib/db";
import { createHash } from "crypto";

const RATE_LIMIT = 10;

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

function getCurrentMonthYear(): { month: number; year: number } {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

function generateTitle(message: string): string {
  const cleaned = message.replace(/\s+/g, " ").trim();
  return cleaned.length > 30 ? cleaned.substring(0, 30) + "..." : cleaned;
}

async function checkRateLimit(
  userId: string | null,
  ipHash: string
): Promise<{ allowed: boolean; currentCount: number }> {
  const identifier = userId || ipHash;
  const identifierType = userId ? "user" : "ip";
  const { month, year } = getCurrentMonthYear();

  const result = await query(
    `SELECT usage_count FROM chat_usage 
     WHERE identifier = $1 AND month = $2 AND year = $3`,
    [identifier, month, year]
  );

  const currentCount = result.rows[0]?.usage_count || 0;
  return { allowed: currentCount < RATE_LIMIT, currentCount };
}

async function incrementUsage(
  userId: string | null,
  ipHash: string
): Promise<void> {
  const identifier = userId || ipHash;
  const identifierType = userId ? "user" : "ip";
  const { month, year } = getCurrentMonthYear();

  await query(
    `INSERT INTO chat_usage (identifier, identifier_type, usage_count, month, year)
     VALUES ($1, $2, 1, $3, $4)
     ON CONFLICT (identifier, month, year)
     DO UPDATE SET usage_count = chat_usage.usage_count + 1, updated_at = CURRENT_TIMESTAMP`,
    [identifier, identifierType, month, year]
  );
}

async function getOrCreateSession(
  sessionId: string | null,
  userId: string | null,
  ipHash: string,
  firstMessage: string
): Promise<string> {
  if (sessionId) {
    const result = await query(
      `SELECT id FROM chat_sessions WHERE id = $1 AND (user_id = $2 OR ip_hash = $3)`,
      [sessionId, userId, ipHash]
    );
    if (result.rows.length > 0) {
      return sessionId;
    }
  }

  const title = generateTitle(firstMessage);
  const result = await query(
    `INSERT INTO chat_sessions (user_id, ip_hash, title, last_message)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [userId, ipHash, title, firstMessage]
  );
  
  return result.rows[0].id;
}

async function saveMessage(
  sessionId: string,
  role: "user" | "ai",
  content: string
): Promise<void> {
  await query(
    `INSERT INTO chat_messages (session_id, role, content)
     VALUES ($1, $2, $3)`,
    [sessionId, role, content]
  );
}

async function updateSession(
  sessionId: string,
  message: string
): Promise<void> {
  await query(
    `UPDATE chat_sessions 
     SET last_message = $2, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [sessionId, message]
  );
}

async function getSessionMessages(sessionId: string): Promise<{ role: "user" | "ai"; content: string }[]> {
  const result = await query(
    `SELECT role, content FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC`,
    [sessionId]
  );
  return result.rows;
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const { message, session_id } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const clientIp = getClientIp(req);
    const ipHash = hashIp(clientIp);
    const { allowed, currentCount } = await checkRateLimit(user?.id || null, ipHash);

    if (!allowed) {
      return NextResponse.json(
        {
          error: "RATE_LIMIT_EXCEEDED",
          message: `Batas penggunaan bulanan tercapai. Anda telah menggunakan ${currentCount} prompt bulan ini.`,
        },
        { status: 429 }
      );
    }

    const sessionId = await getOrCreateSession(
      session_id || null,
      user?.id || null,
      ipHash,
      message
    );

    const history = await getSessionMessages(sessionId);

    await saveMessage(sessionId, "user", message);

    const response = await askAI(message, user?.id, history);

    await saveMessage(sessionId, "ai", response);
    await updateSession(sessionId, message);
    await incrementUsage(user?.id || null, ipHash);

    return NextResponse.json({ response, session_id: sessionId });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}