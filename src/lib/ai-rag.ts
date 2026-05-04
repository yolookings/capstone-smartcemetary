import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { supabaseAdmin } from "./supabase";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHUNKS_FILE = path.join(__dirname, "../../rag_chunks.json");

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL_NAME = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free";

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
  topK: number = 3,
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

export async function askAI(message: string, userId?: string) {
  const chunks = await loadChunks();

  const relevantChunks = simpleSearch(message, chunks, 3);
  const context = relevantChunks.join("\n\n---\n\n");

  const systemPrompt = `Anda adalah asisten AI untuk Smart Cemetery yang bergerak di bidang manajemen pemakaman dan TPU (Taman Pemakaman Umum) di Indonesia.
Jawab pertanyaan dengan ramah, profesional, dan dalam Bahasa Indonesia.
Gunakan konteks dari peraturan Perda yang diberikan untuk menjawab. Jangan buat informasi yang tidak ada di konteks.

[REFERENSI PERDA]:
${context}`;

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.3,
        max_tokens: 1024,
      }),
    });

    const data = await response.json();
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

    return aiResponse;
  } catch (error) {
    console.error("RAG AI Error:", error);
    return "Maaf, terjadi gangguan pada sistem AI.";
  }
}
