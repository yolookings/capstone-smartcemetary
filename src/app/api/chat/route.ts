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

async function checkRateLimit(
  userId: string | null,
  ipHash: string
): Promise<{ allowed: boolean; currentCount: number }> {
  const identifier = userId || ipHash;
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

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const { message } = await req.json();

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

    const response = await askAI(message, user?.id || undefined);

    await incrementUsage(user?.id || null, ipHash);

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
