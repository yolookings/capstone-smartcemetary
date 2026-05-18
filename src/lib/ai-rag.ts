import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { supabaseAdmin } from "./supabase";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHUNKS_FILE = path.join(__dirname, "../../rag_chunks.json");

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL_NAME = process.env.AI_MODEL || "nvidia/llama-3.1-nemotron-70b-instruct:free";

// Post-process AI response: normalize Markdown formatting for clean display
function normalizeMarkdown(text: string): string {
  return text
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^[\-\*]\s+/gm, "• ")
    .replace(/^(\d+)\)\s+/gm, "$1. ")
    .replace(/^\[[ x]\]\s+/gim, "• ")
    .replace(/\n(#+\s)/g, "\n\n$1")
    .replace(/\n(• |\d+\. )/g, "\n\n$1")
    .replace(/\n{3,}/g, "\n\n")
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

  const systemPrompt = `Anda adalah asisten AI untuk sistem Smart Cemetery, sistem pendaftaran makam online berbasis web di Indonesia.

ATURAN PENTING - IKUTI DENGAN TELITI:
1. Jawab HANYA dalam Bahasa Indonesia. Jangan campur bahasa Inggris.
2. Jika ditanya tentang hal yang TIDAK ada di konteks (misalnya jumlah chatbot, fitur tidak bernama, jadwal yang tidak ada), JANGAN membuat jawaban. Katakan: "Maaf, saya tidak memiliki informasi tentang itu."
3. Jangan sebutkan angka prompt, batas bulanan, atau detail teknis internal unless user explicitly asks.
4. Untuk pertanyaan tentang cara pakai website: gunakan konteks yang diberikan. Jika tidak ada, gunakan pengetahuan umum tentang sistem pendaftaran online.
5. Selalu jawab dengan sopan dan ramah.
6. Jika ada riwayat percakapan sebelumnya, gunakan konteks tersebut untuk menjawab agar percakapan terasa alami dan berkelanjutan. Rujuk hal-hal yang pernah dibicarakan sebelumnya jika relevan.

Untuk pertanyaan tentang PANDUAN CARA PENGGUNAAN WEBSITE, gunakan informasi dari [KONTEKS] yang diberikan. Jika topik tidak ada di konteks, beri tahu pengguna dengan sopan bahwa Anda belum punya info tersebut.

Format jawaban:
- Gunakan angka (1., 2., 3.) untuk daftar bernomor.
- Gunakan simbol • untuk daftar berupa poin.
- Pastikan ada baris kosong sebelum setiap daftar dan heading.

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
