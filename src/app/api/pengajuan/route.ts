import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { uploadFile } from "@/lib/storage";
import { notifyAdminsNewSubmission } from "@/lib/telegram";
import { notifyUserSubmissionConfirmation } from "@/lib/whatsapp";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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
    const deceasedName = formData.get("deceasedName") as string;
    const deceasedDate = formData.get("deceasedDate") as string;
    const applicantName = formData.get("applicantName") as string;
    const applicantEmail = formData.get("applicantEmail") as string;
    const applicantPhone = formData.get("applicantPhone") as string;
    const relationship = formData.get("relationship") as string;
    
    const ktp = formData.get("ktp") as File;
    const kk = formData.get("kk") as File;
    const suratKematian = formData.get("suratKematian") as File;
    const suratRtRw = formData.get("suratRtRw") as File;

    if (!nik || !deceasedDate || !ktp || !suratKematian || !suratRtRw) {
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

    const profileRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=phone`,
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
    );
    const profiles = await profileRes.json();
    const profile = profiles[0];

    const files = [
      { file: ktp, type: "KTP" },
      { file: kk, type: "KK" },
      { file: suratKematian, type: "SURAT_KEMATIAN" },
      { file: suratRtRw, type: "SURAT_RT_RW" }
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
      deceased_name: deceasedName,
      deceased_date: deceasedDate,
      applicant_name: applicantName,
      applicant_email: applicantEmail,
      applicant_phone: applicantPhone,
      relationship: relationship,
      status: 'RESERVED',
      blok: 'TBA',
      nomor: 'TBA',
    });

    await notifyAdminsNewSubmission({
      pengajuanId,
      applicantName,
      nik,
      relationship
    }).catch(err => console.error("[TELEGRAM] Notification failed:", err));

    await dbInsert('notifications', {
      type: 'pengajuan',
      title: 'Pengajuan Baru',
      message: `Pengajuan baru dari ${applicantName}. NIK: ${nik}`,
      user_id: userId,
      pengajuan_id: pengajuanId,
    });

    const userPhone = profile?.phone;
    if (userPhone) {
      notifyUserSubmissionConfirmation({
        userPhone,
        pengajuanId,
        applicantName,
        nik
      }).catch(err => console.error("[WA] Submit confirm failed:", err));
    }

    return NextResponse.json({ message: "Pengajuan berhasil dikirim", id: pengajuanId });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Pengajuan error detail:", errorMessage);
    return NextResponse.json({ 
      error: "Internal Server Error", 
      detail: errorMessage 
    }, { status: 500 });
  }
}

export async function GET(_req: Request) {
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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Internal Server Error", detail: errorMessage }, { status: 500 });
  }
}