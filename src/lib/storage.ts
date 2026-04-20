import { v4 as uuidv4 } from "uuid";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const BUCKET_NAME = "documents";

export async function uploadFile(file: Buffer, fileName: string, contentType: string) {
  const extension = fileName.split(".").pop();
  const fileKey = `${uuidv4()}.${extension}`;

  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${fileKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
      },
      body: file as unknown as BodyInit,
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Upload failed: ${err}`);
  }

  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${fileKey}`;

  return {
    fileKey,
    fileUrl: publicUrl,
  };
}

export async function getPresignedUrl(fileKey: string, expiresIn = 3600) {
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/sign/${BUCKET_NAME}/${fileKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
      },
      body: JSON.stringify({ expiresIn }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create signed URL: ${err}`);
  }

  const data = await res.json();
  return `${SUPABASE_URL}/storage/v1${data.signedURL}`;
}