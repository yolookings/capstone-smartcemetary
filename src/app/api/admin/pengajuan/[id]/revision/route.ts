import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notifyUserStatusChange } from "@/lib/whatsapp";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function dbUpdate(table: string, id: string, data: Record<string, unknown>) {
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

export async function POST(
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
    const { revisionNote } = await req.json();

    if (!revisionNote || revisionNote.trim().length === 0) {
      return NextResponse.json({ error: "Catatan revisian wajib diisi" }, { status: 400 });
    }

    const updateData = {
      status: 'NEED_REVISION',
      revision_note: revisionNote,
    };

    await dbUpdate('pengajuan', id, updateData);

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
    const userPhone = profile?.phone || profile?.whatsapp_number;

    if (userPhone) {
      notifyUserStatusChange({
        userPhone: userPhone,
        status: "NEED_REVISION",
        pengajuanId: id,
        revisionNote: revisionNote
      }).catch(console.error);
    }

    return NextResponse.json({ 
      message: "Revisi diminta", 
      id,
      status: 'NEED_REVISION' 
    });
  } catch (error) {
    console.error("Request revision error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}