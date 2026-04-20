# AGENTS.md — src/lib

## OVERVIEW
Core backend utilities: authentication, AI chatbot, database connections, storage, and NextAuth config. Uses direct pg queries (not Prisma).

## FILES

| File | Purpose |
|------|---------|
| `auth-service.ts` | User authorization via Supabase Auth |
| `ai-rag.ts` | AI chatbot with OpenRouter (qwen model) |
| `db.ts` | PostgreSQL connection pool (pg) |
| `storage.ts` | Supabase Storage upload + signed URLs |
| `supabase.ts` | Supabase client (public + admin) |
| `init-db.ts` | Database schema initialization |
| `auth.ts` | NextAuth v4 configuration |
| `prisma.ts` | Prisma client (unused, kept for compatibility) |

## KEY EXPORTS

- `authorizeUser(email, password)` — authenticate user, return profile
- `askAI(message, userId?)` — AI chatbot response + log to chat_logs
- `query(text, params?)` — execute raw SQL via pg pool
- `uploadFile(file, fileName, contentType)` — upload to Supabase Storage, returns fileKey + publicUrl
- `getPresignedUrl(fileKey, expiresIn?)` — generate signed URL for private access
- `supabase` — public client (respects RLS)
- `supabaseAdmin` — service role client (bypasses RLS)
- `cleanupAndInitDb()` — create tables: users, pengajuan, makam, dokumen, chat_logs
- `authOptions` — NextAuth config with Credentials provider

## DATABASE

Direct pg pool to PostgreSQL. Tables created by `init-db.ts`:
- `users` — id, email, password, name, role (USER/ADMIN)
- `pengajuan` — id, user_id, status (PENDING/REVISION/APPROVED/REJECTED)
- `makam` — id, pengajuan_id, blok, nomor, deceased_name, status (AVAILABLE/RESERVED/OCCUPIED)
- `dokumen` — id, pengajuan_id, type (KTP/KK/SURAT_KEMATIAN), file_url, file_key
- `chat_logs` — id, user_id, message, response

## STORAGE

Supabase Storage (not AWS S3). Bucket: `documents`. Uploaded files use UUID filenames. Signed URLs generated with 3600s expiration by default.