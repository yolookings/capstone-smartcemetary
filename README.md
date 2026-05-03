# Smart Cemetery

Sistem Manajemen Pemakaman Digital berbasis Web dengan fitur pendaftaran online, verifikasi admin, dan chatbot AI.

## Fitur Utama

- **Pendaftaran Online**: Pengguna dapat mendaftarkan makam secara mandiri dengan/upload dokumen.
- **Dashboard Admin**: Verifikasi dokumen dan alokasi lokasi makam oleh tim admin.
- **Status Tracking**: Pengguna dapat melihat status pengajuan (Menunggu/Disetujui/Revisi/Ditolak).
- **AI Chatbot**: Bantuan otomatis mengenai prosedur dan regulasi pemakaman.
- **Keamanan Dokumen**: Penggunaan UUID untuk nama file dan Signed URL untuk akses terbatas.
- **Role-Based Access**: Pembedaan fitur antara User dan Admin.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide Icons
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (via Supabase)
- **Auth**: Supabase Auth with @supabase/ssr
- **Storage**: Supabase Storage

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (for database & auth)

## Cara Menjalankan

### 1. Clone Repository

```bash
git clone <repository-url>
cd web-testing
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Supabase

1. Buat project baru di [Supabase](https://supabase.com)
2. Buat tabel dengan SQL berikut:

```sql
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE,
  full_name TEXT,
  role TEXT DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pengajuan table
CREATE TABLE public.pengajuan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'REVISION', 'APPROVED', 'REJECTED')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Makam table
CREATE TABLE public.makam (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pengajuan_id UUID REFERENCES public.pengajuan(id),
  user_id UUID REFERENCES public.profiles(id),
  nik TEXT,
  deceased_date DATE,
  applicant_name TEXT,
  applicant_phone TEXT,
  relationship TEXT,
  blok TEXT DEFAULT 'TBA',
  nomor TEXT DEFAULT 'TBA',
  status TEXT DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'RESERVED', 'OCCUPIED'))
);

-- Dokumen table
CREATE TABLE public.dokumen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pengajuan_id UUID REFERENCES public.pengajuan(id),
  user_id UUID REFERENCES public.profiles(id),
  type TEXT CHECK (type IN ('KTP', 'KK', 'SURAT_KEMATIAN')),
  file_url TEXT,
  file_key TEXT
);

-- Chat logs table
CREATE TABLE public.chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  message TEXT,
  response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

3. Buat storage bucket:

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('documents', 'documents', false, 5242880);
```

### 4. Konfigurasi Environment

Buat file `.env.local`:

```env
# Supabase (wajib - dari Supabase Dashboard)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# OpenRouter (opsional - untuk AI chatbot)
OPENROUTER_API_KEY="sk-or-your-key"
AI_MODEL="nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free"

# Opsional
NEXTAUTH_SECRET="random-secret-string"
```

### 5. Jalankan Aplikasi

```bash
npm run dev
```

Buka http://localhost:3000

## Akun Login

Setelah mendaftar melalui halaman register, akun pertama akan menjadi Admin (ubah manual di database jika diperlukan):

```sql
UPDATE public.profiles SET role = 'ADMIN' WHERE email = 'admin@email.com';
```

## Struktur Project

```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/login/        # Login page
│   ├── auth/register/    # Registration page
│   ├── dashboard/       # User dashboard
│   │   └── pengajuan/   # Pengajuan pages
│   └── api/             # API routes
├── components/            # React components
│   └── dashboard/       # Dashboard components
└── lib/                 # Utilities
    ├── supabase/        # Supabase clients
    └── storage.ts       # File upload utilities
```

## Fitur Halaman

| Halaman                         | Akses  | Deskripsi                      |
| ------------------------------- | ------ | ------------------------------ |
| /                               | Public | Home page                      |
| /auth/login                     | Public | Login form                     |
| /auth/register                  | Public | Registration (@gmail.com only) |
| /dashboard                      | User   | Dashboard + pengajuan list     |
| /dashboard/pengajuan/baru       | User   | Submit new pengajuan           |
| /dashboard/pengajuan            | User   | View status                    |
| /dashboard/admin                | Admin  | Admin dashboard                |
| /dashboard/admin/pengajuan/[id] | Admin  | Review & update status         |

## AI Chatbot (RAG)

Sistem memiliki dua implementasi AI chatbot:

### 1. Web Chatbot (Integrated)

- **File**: `src/lib/ai-rag.ts`
- **Usage**: Chat page di `/dashboard/chat`
- **Features**: Integrated dengan Next.js, menggunakan OpenRouter API

### 2. Standalone RAG Chatbot (Python)

- **File**: `rag_chatbot.py`
- **Usage**: CLI chatbot berbasis PDF regulations
- **Features**: RAG dengan FAISS, multilingual embeddings, PDF parsing

#### Setup

```bash
pip install -r requirements.txt
python rag_chatbot.py
```

#### Requirements

- Python 3.8+
- PDF regulations di parent directory (`../*.pdf`)
- OpenRouter API key (sudah ada di `.env`)

## Keamanan

- Semua Environment Variables diabaikan oleh Git (.env\*)
- RLS (Row Level Security) diaktifkan untuk tabel sensitif
- File upload menggunakan UUID random
- Akses dokumen melalui Signed URL

## Lisensi

MIT License
