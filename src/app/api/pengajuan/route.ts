import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { uploadFile } from "@/lib/storage";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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
    const nik = formData.get("nik") as string;
    const deceasedDate = formData.get("deceasedDate") as string;
    const applicantName = formData.get("applicantName") as string;
    const applicantPhone = formData.get("applicantPhone") as string;
    const relationship = formData.get("relationship") as string;
    
    const ktp = formData.get("ktp") as File;
    const kk = formData.get("kk") as File;
    const suratKematian = formData.get("suratKematian") as File;

    if (!nik || !deceasedDate || !ktp || !suratKematian) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    const pengajuan = await dbInsert('pengajuan', {
      user_id: userId,
      status: 'PENDING',
    });

    const pengajuanId = pengajuan[0]?.id;
    if (!pengajuanId) {
      throw new Error('Failed to create pengajuan');
    }

    const files = [
      { file: ktp, type: "KTP" },
      { file: kk, type: "KK" },
      { file: suratKematian, type: "SURAT_KEMATIAN" }
    ];

    for (const f of files) {
      if (f.file && f.file.size > 0) {
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

    await dbInsert('makam', {
      pengajuan_id: pengajuanId,
      user_id: userId,
      nik: nik,
      deceased_date: deceasedDate,
      applicant_name: applicantName,
      applicant_phone: applicantPhone,
      relationship: relationship,
      status: 'RESERVED',
      blok: 'TBA',
      nomor: 'TBA',
    });

    return NextResponse.json({ message: "Pengajuan berhasil dikirim", id: pengajuanId });
  } catch (error: any) {
    console.error("Pengajuan error detail:", error.message || error);
    return NextResponse.json({ 
      error: "Internal Server Error", 
      detail: error.message 
    }, { status: 500 });
  }
}

export async function GET(req: Request) {
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

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/pengajuan?user_id=eq.${userId}&select=*,makam(nik,blok,nomor)&order=created_at.desc`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      }
    );

    const pengajuans = await res.json();

    return NextResponse.json(pengajuans || []);
  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error", detail: error.message }, { status: 500 });
  }
}