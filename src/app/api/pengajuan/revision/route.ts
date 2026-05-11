import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { uploadFile } from "@/lib/storage";
import { getAdminWhatsAppNumber, notifyAdminRevisionResubmission } from "@/lib/whatsapp";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function dbFetch(table: string, query: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
  });
  return res.json();
}

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

async function dbInsert(table: string, data: Record<string, any>) {
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

    if (existing[0].status !== 'NEED_REVISION') {
      return NextResponse.json({ error: "Pengajuan tidak membutuhkan revisi" }, { status: 400 });
    }

    const makam = existing[0].makam;

    await dbDelete('dokumen', pengajuanId);

    const files = [
      { file: ktp, type: "KTP" },
      { file: kk, type: "KK" },
      { file: suratKematian, type: "SURAT_KEMATIAN" }
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

    const adminWa = getAdminWhatsAppNumber();
    if (adminWa && makam) {
      notifyAdminRevisionResubmission({
        adminPhone: adminWa,
        applicantName: makam.applicant_name || "N/A",
        deceasedName: makam.deceased_name || "N/A"
      }).catch(err => console.error("[WAPP] Notification failed:", err));
    }

    return NextResponse.json({ message: "Dokumen revisi berhasil dikirim", id: pengajuanId });
  } catch (error: any) {
    console.error("Revision submit error:", error.message || error);
    return NextResponse.json({ 
      error: "Internal Server Error", 
      detail: error.message 
    }, { status: 500 });
  }
}