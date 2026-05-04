"""
RAG Chatbot for Cemetery Regulations (Smart Cemetery)
Uses PDF regulations and OpenRouter Free API
"""

import os
import pdfplumber
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
import requests
import pickle
from pathlib import Path

from dotenv import load_dotenv

_PROJECT_ROOT = Path(__file__).resolve().parent
load_dotenv(_PROJECT_ROOT / ".env")

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL_NAME = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free"

PDF_FOLDER_PATH = "/Users/mwlanaz/Development/capstone-project/web-testing/data-pdf"
CHUNK_SIZE = 400
CHUNK_OVERLAP = 50
EMBEDDING_MODEL = "paraphrase-multilingual-MiniLM-L12-v2"

def extract_text_from_pdfs(pdf_folder):
    all_text = ""
    pdf_files = [f for f in os.listdir(pdf_folder) if f.endswith(".pdf")]
    
    for filename in pdf_files:
        filepath = os.path.join(pdf_folder, filename)
        print(f"Membaca {filename}...")
        try:
            with pdfplumber.open(filepath) as pdf:
                for page in pdf.pages:
                    extracted = page.extract_text()
                    if extracted:
                        all_text += f"\n\n=== {filename} - Halaman {page.page_number} ===\n\n"
                        all_text += extracted + "\n"
        except Exception as e:
            print(f"Error membaca {filename}: {e}")
    
    return all_text

def simple_chunk_text(text, chunk_size=CHUNK_SIZE, overlap=CHUNK_OVERLAP):
    words = text.split()
    chunks = []
    start = 0
    
    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        start = end - overlap
    
    return chunks

def create_vector_store(chunks):
    print(f"Membuat embeddings untuk {len(chunks)} chunks...")
    embedder = SentenceTransformer(EMBEDDING_MODEL)
    embeddings = embedder.encode(chunks, convert_to_numpy=True)
    
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings.astype('float32'))
    
    return index, embedder

def retrieve_context(query, index, chunks, embedder, top_k=3):
    query_vector = embedder.encode([query], convert_to_numpy=True)
    distances, indices = index.search(query_vector.astype('float32'), top_k)
    
    retrieved_chunks = [chunks[i] for i in indices[0] if i < len(chunks)]
    context = "\n\n---\n\n".join(retrieved_chunks)
    return context

def call_free_api(prompt, system_context):
    api_key = (os.environ.get("OPENROUTER_API_KEY") or "").strip()
    if not api_key:
        return (
            "Error: OPENROUTER_API_KEY belum diatur. "
            "Tambahkan ke file .env di root proyek (OPENROUTER_API_KEY=...)."
        )

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": MODEL_NAME,
        "messages": [
            {
                "role": "system",
                "content": f"""Anda adalah asisten AI untuk Smart Cemetery yang bergerak di bidang manajemen pemakaman dan TPU (Taman Pemakaman Umum) di Indonesia.
Jawab pertanyaan dengan ramah, profesional, dan dalam Bahasa Indonesia.
Gunakan konteks dari peraturan yang diberikan untuk menjawab.

{system_context}"""
            },
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.3,
        "max_tokens": 1024
    }
    
    try:
        response = requests.post(OPENROUTER_API_URL, json=payload, headers=headers, timeout=60)
        response.raise_for_status()
        result = response.json()
        return result['choices'][0]['message']['content']
    except requests.exceptions.RequestException as e:
        return f"Error API: {str(e)}"

def save_vector_store(index, chunks, filepath="vector_store.pkl"):
    with open(filepath, 'wb') as f:
        pickle.dump({'index': index, 'chunks': chunks}, f)
    print(f"Vector store disimpan ke {filepath}")

def load_vector_store(filepath="vector_store.pkl"):
    if os.path.exists(filepath):
        with open(filepath, 'rb') as f:
            data = pickle.load(f)
        print(f"Vector store dimuat dari {filepath}")
        return data['index'], data['chunks']
    return None, None

SYSTEM_CONTEXT = """
PERSYARATAN PENDAFTARAN MAKAM:
1. KTP Pemohon (scan asli)
2. Kartu Keluarga (scan asli)  
3. Surat Keterangan Kematian dari医院/klinik

PROSEDUR PENDAFTARAN:
1. Registrasi akun di sistem
2. Isi formulir data almarhum dan pemohon
3. Unggah dokumen pendukung
4. Tunggu verifikasi dari admin
5. Jika disetujui, lokasi makam akan dialokasikan

BIAYA MAKAM:
- Diatur oleh Perda setempat
- Untuk Beberapa TPU yang di bawah pemerintah daerah, biaya makam bisa diatur oleh pemerintah daerah tersebut bahkan gratis.
- Bervariasi tergantung blok (A, B, C, D)
- Blok premium biasanya lebih mahal

JAM OPERASIONAL:
- Kantor: Senin-Jumat, 08.00-16.00 WIB
- Layanan pemakaman: 24 jam dengan koordinasi petugas

LOKASI TPU:
- Menyediakan blok-blok sesuai kebutuhan
- Kapasitas terbatas, pendaftaran cepat disarankan
"""

def main():
    vector_store_file = "vector_store.pkl"
    
    index, chunks = load_vector_store(vector_store_file)
    embedder = None
    
    if index is None:
        print("Membaca PDF regulations...")
        raw_text = extract_text_from_pdfs(PDF_FOLDER_PATH)
        
        if not raw_text.strip():
            print("Tidak ada teks yang diekstrak dari PDF!")
            return
        
        print(f"Total teks: {len(raw_text)} karakter")
        chunks = simple_chunk_text(raw_text)
        print(f"Total chunks: {len(chunks)}")
        
        index, embedder = create_vector_store(chunks)
        save_vector_store(index, chunks, vector_store_file)
    else:
        embedder = SentenceTransformer(EMBEDDING_MODEL)
    
    print("\n" + "="*60)
    print("RAG Chatbot Perda Pemakaman - Smart Cemetery")
    print("="*60)
    print("Tanya seputar peraturan pemakaman. Ketik 'keluar' untuk exit.\n")
    
    while True:
        try:
            user_input = input("\n👤 Pertanyaan Anda: ")
            if user_input.lower() in ['keluar', 'exit', 'quit']:
                print("Terima kasih! Sampai jumpa.")
                break
            
            if not user_input.strip():
                continue
            
            print("🔍 Mencari konteks relevan...")
            context = retrieve_context(user_input, index, chunks, embedder)
            
            full_prompt = f"""[Konteks dari Peraturan]:
{context}

[Pertanyaan]: 
{user_input}

Jawab dengan singkat, jelas, dan sesuai peraturan. Jika informasi tidak ada, sampaikan dengan sopan."""

            print("🤖 Memproses jawaban...")
            jawaban = call_free_api(full_prompt, SYSTEM_CONTEXT)
            
            print(f"\n📋 Jawaban:\n{jawaban}")
            
        except KeyboardInterrupt:
            print("\n\nDibatalkan oleh user.")
            break
        except Exception as e:
            print(f"\nError: {e}")

if __name__ == "__main__":
    main()