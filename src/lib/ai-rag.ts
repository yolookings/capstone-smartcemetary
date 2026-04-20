import { supabaseAdmin } from "./supabase";

const KNOWLEDGE_BASE = `
Smart Cemetery (The Living Memory) adalah sistem manajemen pemakaman digital modern.
Persyaratan Pendaftaran:
1. Scan KTP Pemohon Asli.
2. Scan Kartu Keluarga Asli.
3. Surat Keterangan Kematian.

Prosedur:
1. Registrasi akun.
2. Isi formulir data almarhum dan pemohon.
3. Unggah dokumen.
4. Tunggu verifikasi admin.
5. Jika disetujui, lokasi makam akan ditentukan dan muncul di dashboard.

Biaya: Diatur oleh Perda setempat, bervariasi tergantung blok (A, B, C, D).
Jam Operasional Kantor: Senin-Jumat 08.00-16.00 WIB.
Layanan Pemakaman: 24 Jam dengan koordinasi petugas.
`;

export async function askAI(message: string, userId?: string) {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen/qwen-2.5-coder-32b-instruct",
        messages: [
          {
            role: "system",
            content: `Anda adalah asisten AI untuk Smart Cemetery. Gunakan konteks berikut untuk menjawab pertanyaan pengguna secara ramah dan profesional dalam Bahasa Indonesia: \n${KNOWLEDGE_BASE}`
          },
          { role: "user", content: message }
        ],
      }),
    });

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || "Maaf, saya sedang tidak dapat merespon saat ini.";

    // Save to ChatLog using Supabase SDK (more robust)
    await supabaseAdmin
      .from('chat_logs')
      .insert([
        { 
          user_id: userId || null, 
          message: message, 
          response: aiResponse 
        }
      ]);

    return aiResponse;
  } catch (error) {
    console.error("OpenRouter AI Error:", error);
    return "Maaf, terjadi gangguan pada sistem AI. Silakan hubungi admin secara manual.";
  }
}
