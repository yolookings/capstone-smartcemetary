import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { uploadFile } from "@/lib/storage";
import { notifyAdminsRevisionResubmission } from "@/lib/telegram";

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

async function dbInsert(table: string, data: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
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
    throw new Error(`Insert failed: ${err}`);
  }
  
  return res.json();
}

async function dbDelete(table: string, id: string) {
  await fetch(`${SUPABASE_URL}/rest/v1/${table}?pengajuan_id=eq.${id}`, {
    method: 'DELETE',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
  });
}

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

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

const userId = user.id;
    const formData = await req.formData();
    const pengajuanId = formData.get("pengajuanId") as string;
    
    const ktp = formData.get("ktp") as File;
    const kk = formData.get("kk") as File;
    const suratKematian = formData.get("suratKematian") as File;
    const suratRtRw = formData.get("suratRtRw") as File;

    if (!pengajuanId) {
      return NextResponse.json({ error: "ID pengajuan wajib diisi" }, { status: 400 });
    }

    const existingRes = await fetch(
      `${SUPABASE_URL}/rest/v1/pengajuan?id=eq.${pengajuanId}&select=*,makam(*)`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    const existing = await existingRes.json();
    
    if (!existing[0]) {
      return NextResponse.json({ error: "Pengajuan tidak ditemukan" }, { status: 404 });
    }

    const makam = existing[0].makam;

    await dbDelete('dokumen', pengajuanId);

    const files = [
      { file: ktp, type: "KTP" },
      { file: kk, type: "KK" },
      { file: suratKematian, type: "SURAT_KEMATIAN" },
      { file: suratRtRw, type: "SURAT_RT_RW" }
    ];

    let hasUpload = false;
    for (const f of files) {
      if (f.file && f.file.size > 0) {
        hasUpload = true;
        const buffer = Buffer.from(await f.file.arrayBuffer());
        const upload = await uploadFile(buffer, f.file.name, f.file.type);
        
        await dbInsert('dokumen', {
          pengajuan_id: pengajuanId,
          user_id: userId,
          type: f.type,
          file_url: upload.fileUrl,
          file_key: upload.fileKey,
        });
      }
    }

    if (!hasUpload) {
      return NextResponse.json({ error: "Minimal upload satu dokumen" }, { status: 400 });
    }

    await dbUpdate('pengajuan', pengajuanId, { 
      status: 'PENDING',
      revision_note: null,
    });

    await notifyAdminsRevisionResubmission({
      pengajuanId,
      applicantName: makam?.applicant_name || "N/A",
      nik: makam?.nik || "N/A",
      relationship: makam?.relationship || "N/A"
    }).catch(err => console.error("[TELEGRAM] Notification failed:", err));

    await dbInsert('notifications', {
      type: 'revision',
      title: 'Pengajuan Direvisi',
      message: `Pengajuan direvisi oleh ${makam?.applicant_name || "N/A"}`,
      user_id: userId,
      pengajuan_id: pengajuanId,
    });

    return NextResponse.json({ message: "Dokumen revisi berhasil dikirim", id: pengajuanId });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Revision submit error:", errorMessage);
    return NextResponse.json({ 
      error: "Internal Server Error", 
      detail: errorMessage 
    }, { status: 500 });
  }
}