# PROJECT KNOWLEDGE BASE

**Generated:** 2026-04-08
**Project:** Smart Cemetery - Web Testing

## OVERVIEW

Next.js 15 cemetery management system with PostgreSQL, NextAuth, AWS S3. Indonesian-language UI.

## WHERE TO LOOK

| Task       | Location            | Notes                 |
| ---------- | ------------------- | --------------------- |
| Auth       | src/lib/auth\*.ts   | NextAuth config       |
| AI/RAG     | src/lib/ai-rag.ts   | Chatbot logic         |
| Database   | src/lib/db.ts       | pg direct (no Prisma) |
| S3 Storage | src/lib/storage.ts  | Signed URLs           |
| Supabase   | src/lib/supabase.ts | Vector storage        |
| Routes     | src/app/api/\*      | API routes            |
| Pages      | src/app/\*          | Next.js App Router    |
| Seed       | scripts/seed.ts     | Test data             |

## CONVENTIONS

- No Prisma - direct `pg` queries
- UUID filenames for uploads
- Signed URL expiration (15min)
- Credentials provider only (no OAuth)

## COMMANDS

```bash
npm run dev      # Dev server
npm run build    # Production build
npm run lint    # ESLint
```

## NOTES

- Tailwind v4 via postcss.config.mjs
- ESLint flat config (eslint.config.mjs)
- NextAuth v4 with [...nextauth] catch-all
