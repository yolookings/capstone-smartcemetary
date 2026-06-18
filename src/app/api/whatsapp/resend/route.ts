import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { resendMessage, isWhatsAppConfigured } from "@/lib/whatsapp-sender";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      SUPABASE_URL,
      SUPABASE_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profileRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=role`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    const profiles = await profileRes.json();
    if (!profiles[0] || profiles[0].role !== "ADMIN") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    if (!isWhatsAppConfigured()) {
      return NextResponse.json(
        { error: "KirimDev tidak terkonfigurasi" },
        { status: 400 }
      );
    }

    const { log_id } = await req.json();

    if (!log_id) {
      return NextResponse.json(
        { error: "log_id wajib diisi" },
        { status: 400 }
      );
    }

    const result = await resendMessage(log_id);

    if (result.success) {
      return NextResponse.json({
        message: "WhatsApp berhasil dikirim ulang",
        log: result.log,
      });
    }

    return NextResponse.json(
      { error: result.error || "Gagal mengirim ulang WhatsApp" },
      { status: 500 }
    );
  } catch (error) {
    console.error("[WA RESEND] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
