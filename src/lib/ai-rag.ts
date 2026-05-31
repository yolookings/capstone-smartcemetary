import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { supabaseAdmin } from "./supabase";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHUNKS_FILE = path.join(__dirname, "../../rag_chunks.json");

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL_NAME = process.env.AI_MODEL || "nvidia/llama-3.1-nemotron-70b-instruct:free";

// Post-process AI response: normalize Markdown formatting for clean, professional display
function normalizeMarkdown(text: string): string {
  return text
    // Normalize excessive blank lines
    .replace(/\n{3,}/g, "\n\n")
    // Ensure headings have proper spacing before them
    .replace(/([^\n])\n(##+ )/g, "$1\n\n$2")
    // Ensure headings have proper spacing after them
    .replace(/(##+.+)\n(?!\n|$)/g, "$1\n")
    // Normalize bullet markers to proper bullet points
    .replace(/^[\-\*]\s+/gm, "• ")
    // Normalize numbered list formats: "1)" → "1."
    .replace(/^(\d+)\)\s+/gm, "$1. ")
    // Remove checkbox markers (they're not needed for chat)
    .replace(/^\[[ x]\]\s+/gim, "• ")
    // Ensure spacing before lists (bullets or numbered)
    .replace(/\n(• |\d+\. )/g, "\n\n$1")
    // Ensure spacing before headings
    .replace(/\n(##+ )/g, "\n\n$1")
    // Ensure spacing before blockquotes
    .replace(/\n(> )/g, "\n\n$1")
    // Ensure spacing before horizontal rules
    .replace(/\n(---)\n/g, "\n\n$1\n\n")
    // Ensure table rows are separated properly
    .replace(/\n(\|.+)\n(?!\|)/g, "\n$1\n")
    // Collapse any triple+ newlines again (from double-processing)
    .replace(/\n{3,}/g, "\n\n")
    // Ensure the result doesn't start or end with whitespace
    .trim();
}

let cachedChunks: string[] = [];

async function loadChunks() {
  if (cachedChunks.length === 0) {
    try {
      const content = await fs.readFile(CHUNKS_FILE, "utf-8");
      cachedChunks = JSON.parse(content);
      console.log(`Loaded ${cachedChunks.length} RAG chunks from PDF`);
    } catch (error) {
      console.error("Failed to load chunks:", error);
      cachedChunks = [];
    }
  }
  return cachedChunks;
}

function simpleSearch(
  query: string,
  chunks: string[],
  topK: number = 6,
): string[] {
  const queryWords = query.toLowerCase().split(/\s+/);
  const scores: number[] = chunks.map((chunk) => {
    const chunkLower = chunk.toLowerCase();
    return queryWords.reduce((score, word) => {
      if (chunkLower.includes(word)) score += 1;
      return score;
    }, 0);
  });

  const indexed = chunks.map((c, i) => ({ chunk: c, score: scores[i] }));
  indexed.sort((a, b) => b.score - a.score);

  return indexed.slice(0, topK).map((x) => x.chunk);
}

function buildConversationHistory(
  history: { role: "user" | "ai"; content: string }[]
): string {
  if (!history || history.length === 0) return "";
  return history
    .map((m) => `${m.role === "user" ? "Pengguna" : "Asisten"}: ${m.content}`)
    .join("\n");
}

export async function askAI(
  message: string,
  userId?: string,
  conversationHistory?: { role: "user" | "ai"; content: string }[]
) {
  const chunks = await loadChunks();

  const relevantChunks = simpleSearch(message, chunks, 3);
  const context = relevantChunks.join("\n\n---\n\n");

  const systemPrompt = `Anda adalah asisten AI Smart Cemetery — sistem pendaftaran makam online berbasis web di Indonesia.

TUGAS ANDA:
Jawab pertanyaan pengguna tentang prosedur, regulasi, dan tata cara pemakaman di Indonesia. Anda adalah representasi digital dari Dinas Lingkungan Hidup Kota Surabaya yang membantu masyarakat.

ATURAN FORMAT JAWABAN — INI SANGAT PENTING:

1. Selalu mulai dengan jawaban singkat dan langsung (1-2 kalimat) yang merangkum inti jawaban.

2. Gunakan struktur section dengan heading Markdown (##) untuk mengorganisir informasi:
   - ## Ringkasan — jawaban singkat di awal
   - ## Informasi Penting — poin-poin kunci
   - ## Langkah-Langkah — prosedur/step-by-step (gunakan nomor)
   - ## Ketentuan — peraturan/syarat (gunakan bullet)
   - ## Catatan — informasi tambahan yang perlu diketahui
   - ## Saran — rekomendasi atau tindakan selanjutnya

3. Untuk pertanyaan tutorial/panduan: gunakan ## Langkah-Langkah dengan daftar bernomor (1., 2., 3.).

4. Untuk pertanyaan fitur/informasi: gunakan bullet point (•) untuk menyajikan informasi.

5. Untuk pertanyaan troubleshooting: gunakan:
   - ## Kemungkinan Penyebab (daftar bullet)
   - ## Solusi (daftar bernomor)

6. Untuk perbandingan: gunakan tabel Markdown.

7. Batasi paragraf maksimal 2-3 kalimat. Tidak boleh ada tembok teks.

8. Gunakan **bold** untuk menekankan kata kunci atau informasi penting.

9. Jika jawaban lebih dari 150 kata, pecah menjadi beberapa section dengan heading.

10. Jangan pernah menampilkan potongan RAG mentah langsung ke pengguna. Semua informasi dari konteks harus diringkas, ditulis ulang, dan diorganisir.

11. Jawab HANYA dalam Bahasa Indonesia formal dan sopan. Jangan campur bahasa Inggris.

12. Jika ditanya tentang hal yang TIDAK ada di konteks, katakan dengan sopan: "Maaf, saya tidak memiliki informasi tentang itu."

13. Jangan sebutkan prompt limit, detail teknis internal, atau informasi sistem.

[KONTEKS]:
${context}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const historyText = buildConversationHistory(conversationHistory || []);
    const historySection = historyText
      ? `\n\n[RIWAYAT PERCAKAPAN SEBELUMNYA]:\n${historyText}\n`
      : "";

    const messages: { role: string; content: string }[] = [
      { role: "system", content: systemPrompt },
    ];

    if (historySection) {
      const updatedSystem = systemPrompt.replace(
        "[KONTEKS]:",
        `[KONTEKS]:${historySection}`
      );
      messages[0] = { role: "system", content: updatedSystem };
    }

    messages.push({ role: "user", content: message });

    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages,
        temperature: 0.3,
        max_tokens: 1024,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenRouter API error:", response.status, errorData);
      return `Maaf, layanan AI sedang sibuk (${response.status}). Silakan coba lagi sebentar.`;
    }

    const data = await response.json();
    
    if (data.error) {
      console.error("OpenRouter error:", data.error);
      return `Maaf, terjadi kesalahan: ${data.error.message || "Unknown error"}`;
    }

    const aiResponse =
      data.choices?.[0]?.message?.content ||
      "Maaf, saya terlalu lama merespon. Cobain lagi.";

    await supabaseAdmin.from("chat_logs").insert([
      {
        user_id: userId || null,
        message: message,
        response: aiResponse,
      },
    ]);

    return normalizeMarkdown(aiResponse);
  } catch (error) {
    console.error("RAG AI Error:", error);
    return "Maaf, terjadi gangguan pada sistem AI.";
  }
}
