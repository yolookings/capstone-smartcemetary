import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabase_execute_sql } from "@/lib/supabase-query";
import { notifyUserStatusChange } from "@/lib/whatsapp";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function dbUpdate(table: string, id: string, data: Record<string, any>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Update failed: ${err}`);
  }
  
  return res.json();
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Check admin role
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
    if (!profiles[0] || profiles[0].role !== 'ADMIN') {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    const { id } = await params;
    const { status, notes, blok, nomor } = await req.json();

    const updated = await dbUpdate('pengajuan', id, { status, notes });

    if (status === "APPROVED") {
      await dbUpdate('makam', id, { status: 'OCCUPIED', blok: blok || 'TBA', nomor: nomor || 'TBA' });
    }

    const pengajuanRes = await fetch(
      `${SUPABASE_URL}/rest/v1/pengajuan?id=eq.${id}&select=*,profiles(phone,whatsapp_number,full_name),makam(*)`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    const pengajuanData = await pengajuanRes.json();
    const profile = pengajuanData[0]?.profiles;
    const makam = pengajuanData[0]?.makam;
    const userPhone = profile?.phone || profile?.whatsapp_number;

    if (userPhone) {
      console.log("[ADMIN] Sending WhatsApp to:", userPhone, "status:", status);
      notifyUserStatusChange({
        userPhone: userPhone,
        status,
        pengajuanId: id,
        blok: makam?.blok,
        nomor: makam?.nomor,
        revisionNote: notes
      }).catch(e => console.error("[WA ERROR]", e));
    } else {
      console.log("[ADMIN] No phone found for user");
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Admin update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/pengajuan?id=eq.${id}&select=*,profiles(email,full_name),makam(*),dokumen(*)`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      }
    );

    const data = await res.json();
    return NextResponse.json(data[0] || null);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}