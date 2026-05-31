![Banner Readme Makam](/public/banner-makam.png)

# Smart Cemetery - Digital Cemetery Management System

[![Next.js](https://img.shields.io/badge/Framework-Next.js%2016-black?logo=next.js&style=flat-square)](https://nextjs.org/)
[![React](https://img.shields.io/badge/UI-React%2019-61DAFB?logo=react&style=flat-square)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/Lang-TypeScript%20Strict-3178C6?logo=typescript&style=flat-square)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-06B6D4?logo=tailwindcss&style=flat-square)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/BaaS-Supabase-3FCF8E?logo=supabase&style=flat-square)](https://supabase.com/)
[![PostgreSQL](https://img.shields.io/badge/DB-PostgreSQL-4169E1?logo=postgresql&style=flat-square)](https://www.postgresql.org/)
[![OpenRouter](https://img.shields.io/badge/AI-OpenRouter%20LLM-FF6B6B?logo=openai&style=flat-square)](https://openrouter.ai/)
[![GitHub Actions](https://img.shields.io/badge/CI/CD-GitHub%20Actions-2088FF?logo=githubactions&style=flat-square)](https://github.com/features/actions)
[![PM2](https://img.shields.io/badge/Process-PM2-2B037A?logo=pm2&style=flat-square)](https://pm2.keymetrics.io/)
[![ESLint](https://img.shields.io/badge/Lint-ESLint%20v9-4B32C3?logo=eslint&style=flat-square)](https://eslint.org/)

## 1. Project Overview

### Brief Introduction

Smart Cemetery (E-Makam) is a full-stack digital cemetery management platform built for **Dinas Lingkungan Hidup Kota Surabaya** (Surabaya City Environmental Agency). The system digitizes the entire burial registration workflow — from online application submission and document upload to admin verification, grave allocation, and real-time status tracking.

### Business Problem

Traditional cemetery registration in Indonesia involves manual paperwork, in-person visits to government offices, opaque queuing, and no visibility into application status. This creates bottlenecks for bereaved families who must navigate bureaucratic delays during emotionally difficult times, while administrators struggle with paper document management and lack of centralized tracking.

### High-Level Solution

The platform provides:

- **Self-service online registration** with document upload (KTP, KK, Surat Kematian, Surat RT/RW)
- **Role-based dashboards** separating citizen and administrator workflows
- **Real-time application status tracking** (Pending → Revision → Approved → Rejected)
- **AI-powered chatbot assistant** for procedural guidance and regulation lookup
- **Multi-channel notifications** via WhatsApp and Telegram for status updates
- **Admin review system** for document verification and grave allocation
- **GitOps CI/CD pipeline** with automated deployment to staging and production environments

---

## 2. System Architecture

### Architecture Overview

The application follows a **monolithic Next.js full-stack architecture** with server-rendered React pages and RESTful API routes. Supabase serves as the backend-as-a-service layer providing authentication, relational database, and file storage. The system is deployed on a VPS behind PM2 process management with GitHub Actions automation.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                         │
└──────────┬──────────────────────────┬───────────────────────────┘
           │                          │
           ▼                          ▼
┌──────────────────────┐  ┌──────────────────────────┐
│   Next.js App Router │  │   Next.js API Routes      │
│   (React 19 / SSR)   │  │   (REST Endpoints)        │
├──────────────────────┤  ├──────────────────────────┤
│  - Public Pages      │  │  /api/auth/*              │
│  - User Dashboard    │  │  /api/pengajuan/*         │
│  - Admin Dashboard   │  │  /api/chat/*              │
│  - Chat Widget       │  │  /api/admin/*             │
│  - Cemetery Map      │  │                           │
└──────────────────────┘  └──────────┬────────────────┘
                                     │
          ┌──────────────────────────┼──────────────────────────┐
          │                          │                          │
          ▼                          ▼                          ▼
┌──────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│  Supabase Auth    │  │  Supabase PostgreSQL │  │  Supabase Storage    │
│  (Auth + Session) │  │  (Direct pg Queries) │  │  (Document Uploads)  │
└──────────────────┘  └──────────────────────┘  └──────────────────────┘
                                │
                                ▼
          ┌────────────────────────────────────────────┐
          │         External Services                   │
          ├────────────────────────────────────────────┤
          │  - OpenRouter AI (RAG Chatbot)              │
          │  - Telegram Bot API (Admin Notifications)   │
          │  - Fonnte API (WhatsApp Notifications)      │
          └────────────────────────────────────────────┘
```

### Main Components and Responsibilities

| Component                      | Responsibility                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------ |
| **Next.js App Router (Pages)** | Renders server-side React pages for public, user, and admin routes                         |
| **Next.js API Routes**         | Handles form submissions, authentication, chat, and admin operations                       |
| **Supabase Auth**              | Manages user registration, login, session cookies, and JWT tokens                          |
| **Supabase PostgreSQL**        | Persistent storage for profiles, applications, graves, documents, chat logs, notifications |
| **Supabase Storage**           | Secure document file storage with signed URL access                                        |
| **RAG AI Service**             | Keyword-based retrieval-augmented generation chatbot using PDF regulation chunks           |
| **Telegram Bot**               | Sends real-time notifications to admins on new submissions and status changes              |
| **WhatsApp (Fonnte)**          | Sends submission confirmations and status updates to users' phones                         |
| **GitHub Actions CI/CD**       | Automated quality gates and SSH-based deployment to VPS                                    |

### Data Flow — Burial Application Lifecycle

```
User submits form → API validates → DB insert (pengajuan + dokumen + makam)
    │
    ├─→ WhatsApp confirmation to applicant
    ├─→ Telegram notification to admin group
    ├─→ In-app notification created
    │
Admin reviews → API updates status
    │
    ├─→ PENDING → APPROVED: grave allocated (blok + nomor assigned)
    ├─→ PENDING → REVISION: notes added, applicant notified
    ├─→ PENDING → REJECTED: applicant notified
    │
User views status → Dashboard reflects current state in real-time
```

### Architecture Diagram Reference

_Refer to the CI/CD pipeline diagram in Section 7 for the deployment architecture. A workflow diagram (`/alur.png`) is available on the landing page._

---

## 3. Technologies Used

### Frontend

| Technology                                 | Purpose                                                            |
| ------------------------------------------ | ------------------------------------------------------------------ |
| **Next.js 16** (App Router)                | React framework with server-side rendering, routing, and API layer |
| **React 19**                               | UI component library                                               |
| **Tailwind CSS v4**                        | Utility-first CSS framework via PostCSS                            |
| **Lucide React**                           | Icon component library                                             |
| **React Markdown + remark-gfm**            | Markdown rendering for AI chatbot responses                        |
| **@fontsource/inter, @fontsource/manrope** | Typography system                                                  |

### Backend & API

| Technology             | Purpose                                                    |
| ---------------------- | ---------------------------------------------------------- |
| **Next.js API Routes** | Serverless-style REST endpoints within the Next.js runtime |
| **pg** (node-postgres) | Direct PostgreSQL connection pooling                       |
| **bcrypt**             | Password hashing (legacy NextAuth path)                    |
| **uuid**               | Cryptographically random UUID generation for file names    |

### Database & Auth

| Technology                             | Purpose                                                   |
| -------------------------------------- | --------------------------------------------------------- |
| **Supabase PostgreSQL**                | Relational database for all application tables            |
| **Supabase Auth**                      | Email/password authentication with JWT session management |
| **@supabase/ssr**                      | Server-side Supabase client for cookie-based sessions     |
| **@supabase/supabase-js**              | Client-side Supabase SDK                                  |
| **NextAuth v4** (Credentials Provider) | Additional auth layer with JWT session strategy           |

### AI & Machine Learning

| Technology              | Purpose                                                                  |
| ----------------------- | ------------------------------------------------------------------------ |
| **OpenRouter API**      | Gateway to LLM models (Nvidia Nemotron) for chatbot inference            |
| **Keyword-based RAG**   | Simple term-matching retrieval over pre-chunked PDF regulation documents |
| **Python** (standalone) | Secondary PDF RAG chatbot with FAISS embeddings (rag_chatbot.py)         |

### Storage

| Technology           | Purpose                                           |
| -------------------- | ------------------------------------------------- |
| **Supabase Storage** | Private bucket for uploaded application documents |
| **Signed URLs**      | Time-limited (1 hour) access to private files     |

### Notifications & Messaging

| Technology           | Purpose                                                            |
| -------------------- | ------------------------------------------------------------------ |
| **Telegram Bot API** | Admin notifications for new submissions and status changes         |
| **Fonnte API**       | WhatsApp message delivery to users (confirmations, status updates) |

### DevOps & Infrastructure

| Technology         | Purpose                                                                       |
| ------------------ | ----------------------------------------------------------------------------- |
| **GitHub Actions** | CI/CD pipeline with linting, type checking, security scanning, and deployment |
| **PM2**            | Node.js process management with graceful restart and startup persistence      |
| **VPS (Ubuntu)**   | Production and staging server environments                                    |
| **SSH**            | Secure remote deployment via appleboy/ssh-action                              |
| **Snyk**           | Dependency vulnerability scanning in CI pipeline                              |

### Development & Tooling

| Technology                  | Purpose                                              |
| --------------------------- | ---------------------------------------------------- |
| **TypeScript** (strict)     | Type safety across the entire codebase               |
| **ESLint** (flat config v9) | Static analysis with Next.js core-web-vitals ruleset |
| **Tailwind v4 CLI**         | CSS processing via PostCSS                           |

---

## 4. Engineering Concepts & Implementation

### Major Technical Decisions

**1. Monolithic Next.js Full-Stack over Microservices**

The decision to use a single Next.js application for both frontend and backend was deliberate. For a civic application at this scale, microservices would introduce unnecessary operational complexity. Next.js API routes provide sufficient isolation through route-level organization (`/api/admin/*`, `/api/chat/*`, `/api/pengajuan/*`), while eliminating cross-service network latency.

**2. Direct `pg` Queries over ORM**

The project intentionally avoids Prisma (despite its inclusion in an earlier iteration). Direct SQL queries via `pg` Pool give full control over query performance, avoid ORM overhead, and allow complex JOINs across the `pengajuan` → `makam` → `dokumen` relationship without abstraction leaks. Connection pooling is configured with SSL for Supabase-hosted PostgreSQL.

**3. Supabase Auth + NextAuth Dual Layer**

While Supabase Auth handles primary authentication (email/password, session management via `@supabase/ssr`), NextAuth v4 is layered on top with a Credentials Provider that delegates to `authorizeUser()`. This dual approach provides a JWT session strategy with role-based token claims while leveraging Supabase's secure auth infrastructure. The session contains `role` and `id` claims for efficient authorization checks.

**4. Keyword-Based RAG over Vector Database**

The AI chatbot uses a simple keyword-matching retrieval (term frequency scoring) over pre-chunked PDF regulation documents rather than a full vector database. This was chosen because:

- The regulation corpus is small (single document, ~50 chunks)
- No embedding infrastructure or vector DB operations are needed
- Response quality is sufficient for procedural Q&A
- The `simpleSearch()` function runs entirely in-memory from a cached JSON file

**5. UUID Filename Strategy for Document Security**

Uploaded documents are renamed using `uuidv4()` before storage, preventing enumeration attacks and accidental information leakage through sequential file IDs. The original filename is discarded after upload.

### Architectural Patterns

**Server-Side Rendering (SSR) with Client Islands**

Public-facing pages (landing page, login, register) use Next.js server components for fast initial loads. Dashboard pages use client components (`"use client"`) with Supabase browser clients for authenticated data fetching. This hybrid approach minimizes JavaScript payload on public routes while enabling interactive dashboard experiences.

**Role-Based Access Control (RBAC)**

Access control is enforced at three layers:

1. **Middleware layer** (`middleware.ts`): Route-level guarding — unauthenticated users are redirected to login; non-admin users are redirected from `/dashboard/admin/*`
2. **API layer**: Each admin API endpoint verifies the user's role from the profiles table before processing requests
3. **UI layer**: Navigation items and dashboard views conditionally render based on user role state

**Repository Pattern for Database Access**

Database operations are abstracted through dedicated modules rather than scattered inline queries:

- `src/lib/db.ts` — Connection pool
- `src/lib/init-db.ts` — Schema initialization
- `src/lib/supabase-query.ts` — Supabase REST helper

### Deployment Approach

**GitOps-Inspired Branch-Based Deployment**

The branching strategy directly maps to environments:

- `feature/*` branches → local development
- `dev` branch → automatic CI/CD → staging server (`smartcemetary-staging` on port 3001)
- `main` branch → automatic CI/CD → production server (`smartcemetary` on port 3000)

**Zero-Downtime Deployment via PM2**

The deployment script (`scripts/deploy.sh`) uses PM2's graceful restart capability to minimize downtime. The script:

1. Pulls the latest code
2. Installs dependencies
3. Builds the Next.js application
4. Verifies build output (`.next` directory)
5. Hot-restarts the PM2 process
6. Persists the process list for server reboot survivability

### Automation Practices

**CI/CD Pipeline Quality Gates** (`deploy.yml`)

Every push to `dev` or `main` triggers:

1. **Dependency installation** — `npm install`
2. **ESLint** — Code quality and style enforcement
3. **TypeScript compilation check** — `tsc --noEmit`
4. **Build verification** — `npm run build`
5. **Smoke test** — Verifies `.next` directory exists

**Health Check Automation**

Post-deployment, the pipeline performs a 15-second wait for server warm-up, then executes a `curl` health check. HTTP status codes `200`, `302`, or `307` indicate success; any other response triggers workflow failure and investigation.

### Scalability Considerations

- **Stateless application architecture**: The Next.js server can scale horizontally behind a load balancer
- **Connection pooling**: `pg.Pool` manages database connections efficiently
- **Supabase managed infrastructure**: Database scaling, backup, and maintenance are delegated to Supabase
- **PM2 cluster mode**: Can be configured to utilize multi-core CPUs

### Development Methodology

The project uses **gradual type migration** — ESLint's strict configuration (`eslint.config.mjs`) is applied with selective file ignores, allowing incremental adoption of strict typing across the codebase. This approach prioritizes delivery velocity while progressively improving code quality.

---

## 5. Security & Reliability Considerations

### Authentication & Authorization

| Measure                  | Implementation                                                         |
| ------------------------ | ---------------------------------------------------------------------- |
| **Password-based auth**  | Supabase Auth with email/password, no OAuth providers                  |
| **JWT session strategy** | NextAuth with role/id embedded in JWT token claims                     |
| **Multi-layer RBAC**     | Middleware guards + API role verification + UI conditional rendering   |
| **Email confirmation**   | Admin-created users bypass email verification (production trust model) |
| **Session persistence**  | HTTP-only cookies via `@supabase/ssr` with auto-refresh                |

### Data Protection

| Measure                    | Implementation                                                      |
| -------------------------- | ------------------------------------------------------------------- |
| **UUID file naming**       | Random UUID filenames prevent enumeration attacks                   |
| **Signed URL access**      | Document access limited to 1-hour signed URLs                       |
| **Private storage bucket** | Documents bucket is non-public; access requires signed URL          |
| **RLS policies**           | Row-Level Security on Supabase tables restricts data access         |
| **Environment isolation**  | `.env*` files excluded from git; secrets managed via GitHub Secrets |

### Infrastructure Security

| Measure                    | Implementation                                                    |
| -------------------------- | ----------------------------------------------------------------- |
| **SSH key authentication** | Deployments use SSH private keys, never passwords                 |
| **Port separation**        | Staging (3001) and production (3000) on separate ports            |
| **PM2 process isolation**  | Separate PM2 processes for staging and production                 |
| **Dependency scanning**    | `npm audit` + Snyk in CI pipeline catches vulnerable dependencies |
| **Fail-fast deployment**   | `set -euo pipefail` in deploy script prevents partial deployments |

### Monitoring & Reliability

| Measure                     | Implementation                                                  |
| --------------------------- | --------------------------------------------------------------- |
| **Health check automation** | Post-deployment `curl` verification in CI/CD                    |
| **PM2 auto-restart**        | Application restarts automatically on crash                     |
| **PM2 persistence**         | `pm2 save` ensures process resurrection on server reboot        |
| **In-app notifications**    | Notification system logs all status changes for audit trail     |
| **Rate limiting**           | Chatbot usage limited to 10 prompts/user/month to prevent abuse |

---

## 6. Deployment & Setup Guide

### Prerequisites

- **Node.js** 20+ (development) / 22+ (production via GitHub Actions)
- **npm** (Node.js package manager)
- **Supabase account** (for database, auth, and storage)
- **VPS** (for production/staging deployment — optional for local development)
- **GitHub Secrets** (for CI/CD deployment — optional for local development)

### Environment Configuration

Create a `.env.local` file in the project root:

```env
# ── Supabase (Required) ───────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"

# ── AI Chatbot (Optional — chatbot uses mocks if absent) ───────
OPENROUTER_API_KEY="sk-or-your-key"
AI_MODEL="nvidia/llama-3.1-nemotron-70b-instruct:free"

# ── Notifications (Optional) ──────────────────────────────────
TELEGRAM_BOT_TOKEN="your-telegram-bot-token"
ADMIN_TELEGRAM_IDS="123456789,987654321"
FONNTE_TOKEN="your-fonnte-api-token"
ADMIN_WHATSAPP_NUMBER="6281234567890"

# ── Auth (Optional — auto-generated if omitted) ────────────────
NEXTAUTH_SECRET="random-secret-string-32-characters"
NEXTAUTH_URL="http://localhost:3000"
```

### Local Development Setup

```bash
# 1. Clone the repository
git clone <repository-url>
cd web-testing

# 2. Install dependencies
npm install

# 3. Set up environment variables (see above)
cp .env.example .env.local  # or create manually

# 4. Initialize database schema
#    Either run init-db.ts directly or apply Supabase migrations:
npx tsx src/lib/init-db.ts

# 5. Start development server
npm run dev

# 6. Open in browser
open http://localhost:3000
```

### Database Schema Setup

The application requires the following tables in Supabase PostgreSQL. Apply via Supabase SQL editor or the migration script:

```sql
-- Profiles (links to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE,
  full_name TEXT,
  role TEXT DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
  phone TEXT,
  telegram_chat_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pengajuan (applications)
CREATE TABLE public.pengajuan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'REVISION', 'APPROVED', 'REJECTED')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Makam (grave records)
CREATE TABLE public.makam (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pengajuan_id UUID REFERENCES public.pengajuan(id),
  user_id UUID REFERENCES public.profiles(id),
  nik TEXT,
  deceased_name TEXT,
  deceased_date DATE,
  applicant_name TEXT,
  applicant_phone TEXT,
  relationship TEXT,
  blok TEXT DEFAULT 'TBA',
  nomor TEXT DEFAULT 'TBA',
  status TEXT DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'RESERVED', 'OCCUPIED'))
);

-- Dokumen (uploaded documents)
CREATE TABLE public.dokumen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pengajuan_id UUID REFERENCES public.pengajuan(id),
  user_id UUID REFERENCES public.profiles(id),
  type TEXT CHECK (type IN ('KTP', 'KK', 'SURAT_KEMATIAN', 'SURAT_RT_RW')),
  file_url TEXT,
  file_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Additional tables are auto-created by init-db.ts:
-- chat_logs, chat_sessions, chat_messages, chat_usage, notifications
```

Create the Storage bucket:

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('documents', 'documents', false, 5242880);  -- 5MB limit
```

### Production Deployment

**GitHub Actions CI/CD** handles automated deployment. Configure the following **GitHub Secrets**:

| Secret            | Description                            |
| ----------------- | -------------------------------------- |
| `VPS_HOST`        | Server IP address                      |
| `VPS_USERNAME`    | SSH username (e.g., `root`, `ubuntu`)  |
| `SSH_PRIVATE_KEY` | Private SSH key for authentication     |
| `VPS_PORT`        | SSH port (optional, default: 22)       |
| `SNYK_TOKEN`      | Snyk API token for dependency scanning |

**Manual deployment** via the shell script:

```bash
# Deploy to staging (dev branch)
./scripts/deploy.sh staging

# Deploy to production (main branch)
./scripts/deploy.sh production
```

The deploy script automates: git checkout → npm install → npm run build → PM2 restart → PM2 save.

### Usage

| Route                             | Access             | Purpose                                          |
| --------------------------------- | ------------------ | ------------------------------------------------ |
| `/`                               | Public             | Landing page with workflow overview              |
| `/auth/login`                     | Public             | User login                                       |
| `/auth/register`                  | Public             | User registration (@gmail.com only)              |
| `/auth/reset-password`            | Public             | Password reset                                   |
| `/makam`                          | Public             | Cemetery map and grave viewer                    |
| `/dashboard`                      | Authenticated User | Personal dashboard with pengajuan list and stats |
| `/dashboard/pengajuan/baru`       | Authenticated User | New burial application form                      |
| `/dashboard/pengajuan`            | Authenticated User | Application status tracking                      |
| `/dashboard/pengajuan/revision`   | Authenticated User | Document revision upload                         |
| `/dashboard/chat`                 | Authenticated User | Full AI chatbot interface                        |
| `/dashboard/admin`                | Admin              | Admin overview dashboard                         |
| `/dashboard/admin/pengajuan`      | Admin              | Application queue management                     |
| `/dashboard/admin/pengajuan/[id]` | Admin              | Detailed application review                      |
| `/dashboard/admin/makam`          | Admin              | Grave inventory management                       |
| `/dashboard/admin/users`          | Admin              | User management                                  |
| `/dashboard/admin/laporan`        | Admin              | Reports and analytics                            |
| `/dashboard/admin/pengaturan`     | Admin              | System settings                                  |
| `/dashboard/admin/notifications`  | Admin              | Notification center                              |
| `/dashboard/admin/cemetery`       | Admin              | Cemetery layout management                       |

---

## 7. CI/CD Pipeline & DevOps

### Pipeline Architecture

The GitHub Actions workflow (`deploy.yml`) implements a two-stage pipeline with environment branching:

```mermaid
graph TD
    A[Push to GitHub] --> B{Branch?}
    B -->|dev| C[STAGING Pipeline]
    B -->|main| D[PRODUCTION Pipeline]

    subgraph Quality Gates
        C --> C1[npm install]
        C1 --> C2[ESLint]
        C2 --> C3[tsc --noEmit]
        C3 --> C4[npm run build]
        C4 --> C5[Smoke Test .next]

        D --> D1[npm install]
        D1 --> D2[ESLint]
        D2 --> D3[tsc --noEmit]
        D3 --> D4[npm run build]
        D4 --> D5[Smoke Test .next]
    end

    C5 -->|Pass| E[SSH Deploy to VPS]
    D5 -->|Pass| F[SSH Deploy to VPS]

    subgraph VPS [Server Deployment]
        E --> E1[git pull dev]
        E1 --> E2[npm install && build]
        E2 --> E3[PM2 restart smartcemetary-staging]
        E3 --> E4[Health Check curl]

        F --> F1[git pull main]
        F1 --> F2[npm install && build]
        F2 --> F3[PM2 restart smartcemetary]
        F3 --> F4[Health Check curl]
    end

    E4 -->|Fail| G[Rollback / Fail]
    F4 -->|Fail| H[Rollback / Fail]
```

### Quality Gates

| Gate           | Command             | Purpose                                    |
| -------------- | ------------------- | ------------------------------------------ |
| **ESLint**     | `npm run lint`      | Code quality and style enforcement         |
| **Type Check** | `npx tsc --noEmit`  | Strict TypeScript type safety verification |
| **Build**      | `npm run build`     | Next.js production build compilation       |
| **Smoke Test** | `test -d .next`     | Verifies build output exists               |
| **NPM Audit**  | `npm audit`         | Dependency vulnerability scanning          |
| **Snyk**       | `snyk/actions/node` | Third-party SAST security scanning         |

### Environment Strategy

| Branch | Environment | PM2 Process             | Port | Domain                         |
| ------ | ----------- | ----------------------- | ---- | ------------------------------ |
| `dev`  | Staging     | `smartcemetary-staging` | 3001 | `staging.smartcemetary.web.id` |
| `main` | Production  | `smartcemetary`         | 3000 | `smartcemetary.web.id`         |

### Post-Deployment Verification

After deployment, the pipeline waits 15 seconds for application warm-up, then performs a health check via `curl`:

```bash
curl -s -o /dev/null -w "%{http_code}" https://smartcemetary.web.id
# Expected: 200, 302, or 307 → Success
# Otherwise → Pipeline failure (rollback required)
```

---

## 8. Technical Challenges & Solutions

### Challenge 1: Dual Authentication Layers (Supabase Auth + NextAuth)

**Problem**: The project inherited two authentication systems — Supabase Auth (cookie-based SSR sessions) and NextAuth v4 (JWT sessions with Credentials Provider). These systems have different session models, cookie formats, and refresh mechanisms, causing session conflicts.

**Solution**: The middleware (`middleware.ts`) was implemented as the single source of truth for session validation. It uses `@supabase/ssr`'s `createServerClient` to read Supabase cookies and validate the session before routing. NextAuth handles JWT token callbacks for role propagation, while Supabase Auth manages actual login/session lifecycle. The `getServerSession()` and `getCurrentUser()` helpers in `src/lib/supabase-auth.ts` serve as the unified API for server-side user lookup.

**Lesson**: When inheriting code with overlapping auth systems, the middleware layer is the correct integration boundary. Don't attempt to merge auth providers — instead, define clear responsibility boundaries.

### Challenge 2: RAG Chatbot Without Vector Database

**Problem**: Building an AI chatbot that could answer questions about cemetery regulations required some form of retrieval augmentation, but setting up a vector database (pgvector, Pinecone) added infrastructure complexity disproportionate to the project's scale.

**Solution**: A keyword-based retrieval system (`simpleSearch()`) was implemented that:

- Loads pre-chunked regulation text from a JSON file at startup
- Scores chunks by keyword overlap with the user query
- Returns top-3 chunks as context for the LLM prompt
- Caches chunks in memory for performance

This approach handles the 50-chunk corpus efficiently and avoids any embedding infrastructure. Rate limiting (10 prompts/user/month) prevents abuse of the OpenRouter API.

**Lesson**: Match the retrieval complexity to the data scale. Vector databases become valuable at thousands+ of documents; for small corpora, keyword retrieval with good chunking is simpler and sufficient.

### Challenge 3: Document Storage Security with Supabase Storage

**Problem**: Uploaded documents (KTP, KK, Surat Kematian) contain highly sensitive personal data. Public access to the storage bucket would be a data breach, but private buckets require signed URLs that add request latency.

**Solution**: A hybrid approach was implemented:

- Documents are stored in a private Supabase Storage bucket
- Files are renamed with UUID to prevent enumeration
- Signed URLs are generated with a 1-hour expiration window
- The `getPresignedUrl()` function explicitly calls the Supabase Storage API for signed URL generation
- Document access is additionally controlled via RLS policies at the database level

**Lesson**: Defense-in-depth for document security requires both storage-layer access control and application-layer access control. UUID naming prevents direct URL guessing, signed URLs limit exposure window, and RLS restricts database-level access.

### Challenge 4: CI/CD Pipeline Secrets Management

**Problem**: The CI/CD pipeline requires environment variables (Supabase URL, anon key) during the build step, but these were initially hardcoded in the workflow file, creating a security risk.

**Solution**: Critical secrets were moved to GitHub Secrets (`VPS_HOST`, `VPS_USERNAME`, `SSH_PRIVATE_KEY`, `SNYK_TOKEN`). Non-sensitive configuration values remain in the workflow file as environment variables. The deploy script uses `set -euo pipefail` for fail-fast behavior, preventing partial deployments that could expose misconfiguration.

**Lesson**: Never hardcode secrets in CI/CD configuration files. GitHub Secrets provide encrypted storage with audit logging. The deploy script's strict bash mode prevents silent failures that could leave the application in an inconsistent state.

---

## 9. Project Evidence & Artifacts

### Demonstration Outputs

| Artifact         | Location                   | Description                                             |
| ---------------- | -------------------------- | ------------------------------------------------------- |
| Landing page     | `/`                        | Application overview with workflow visualization        |
| Workflow diagram | `/alur.png`                | Registration process infographic                        |
| Chatbot          | Chat widget (bottom-right) | AI assistant for procedural questions                   |
| Dashboard        | `/dashboard`               | User dashboard with pengajuan stats and grave locations |
| Admin panel      | `/dashboard/admin`         | Application queue, review interface, grave management   |

### Testing Outputs

| Artifact                   | Description                                     |
| -------------------------- | ----------------------------------------------- |
| `eslint-report-new.txt`    | ESLint analysis results                         |
| `eslint-report-strict.txt` | Strict-mode ESLint findings                     |
| Build output               | `.next/` directory (production build artifacts) |

### Deployment Evidence

| Artifact                       | Description                                 |
| ------------------------------ | ------------------------------------------- |
| `scripts/deploy.sh`            | PM2 deployment script with colored logging  |
| `.github/workflows/deploy.yml` | GitHub Actions CI/CD pipeline configuration |

---

## 10. Future Improvements & Roadmap

### Short-Term (Next Iteration)

| Priority | Improvement                                            | Rationale                                                                                                                                                                            |
| -------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| High     | **Upgrade from keyword RAG to vector-based retrieval** | Replace `simpleSearch()` with pgvector or Supabase Vector for semantic search across documents; improves chatbot accuracy for nuanced regulatory questions                           |
| High     | **Add comprehensive test suite**                       | Currently no automated tests — implement unit tests for API routes, integration tests for auth flow, and E2E tests for critical user journeys (registration → submission → approval) |
| Medium   | **Implement proper error boundaries**                  | Add React error boundaries for dashboard components and structured API error responses with consistent error schemas                                                                 |
| Medium   | **Add database migration tooling**                     | Replace `init-db.ts` with proper migration files (already started in `supabase/migrations/`) to enable schema versioning and rollbacks                                               |

### Medium-Term (Next Quarter)

| Priority | Improvement                          | Rationale                                                                                                        |
| -------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| High     | **Session management refactor**      | Consolidate NextAuth + Supabase Auth into a single auth provider to eliminate session synchronization complexity |
| High     | **Strict TypeScript adoption**       | Remove ESLint file ignores gradually — enforce strict typing across all components and API routes                |
| Medium   | **Monitoring and observability**     | Add centralized logging (Sentry or Datadog), request tracing, and uptime monitoring for production environment   |
| Medium   | **Rate limiting for all API routes** | Extend the chat rate-limiting pattern to pengajuan submission and auth endpoints to prevent abuse                |
| Low      | **CLI-based admin tools**            | Build npm scripts for common admin tasks (user management, report generation, data export)                       |

### Long-Term (Future Roadmap)

| Priority | Improvement                                | Rationale                                                                                           |
| -------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| High     | **Automated backup and disaster recovery** | Implement scheduled database backups with tested restore procedures                                 |
| High     | **Performance optimization**               | Add React Server Components migration, image optimization with next/image, and API response caching |
| Medium   | **Multi-language support**                 | Add English and regional language i18n to serve broader user base                                   |
| Medium   | **Mobile application**                     | Build native mobile app (React Native) for push notifications and offline form filling              |
| Medium   | **Digital payment integration**            | Enable online payment for burial service fees via payment gateway                                   |
| Low      | **Real-time updates**                      | Implement Supabase Realtime subscriptions for live dashboard updates without page refresh           |
| Low      | **Containerization**                       | Dockerize the application for environment-consistent deployments and orchestration support          |

---

## 11. Portfolio Summary

### Key Engineering Achievements

- **Full-stack civic application** — Designed and built a production-grade digital cemetery management system from the ground up, serving Surabaya city's burial registration workflow
- **Multi-layer security architecture** — Implemented defense-in-depth with UUID file naming, signed URL access, RLS policies, role-based middleware, and dependency vulnerability scanning in CI/CD
- **GitOps CI/CD pipeline** — Engineered an automated deployment pipeline with branch-based environment mapping, multi-stage quality gates, SSH deployment, and post-deployment health checks
- **AI integration without infrastructure overhead** — Delivered a functional RAG chatbot using keyword retrieval and OpenRouter API, avoiding vector database complexity while maintaining utility
- **Multi-channel notification system** — Integrated Telegram and WhatsApp APIs for real-time status updates, reducing manual communication overhead for administrators
- **Legacy auth consolidation** — Successfully integrated and rationalized two overlapping authentication systems (NextAuth + Supabase Auth) into a coherent middleware-driven architecture

### Technical Skills Demonstrated

| Skill Area                         | Demonstration                                                                      |
| ---------------------------------- | ---------------------------------------------------------------------------------- |
| **Full-Stack Development**         | Next.js 16, React 19, TypeScript, Tailwind CSS v4                                  |
| **Database Engineering**           | PostgreSQL schema design, direct SQL optimization, connection pooling              |
| **Authentication & Authorization** | JWT sessions, cookie-based SSR auth, RBAC at middleware/API/UI layers              |
| **Cloud & BaaS**                   | Supabase (Auth, PostgreSQL, Storage), REST API integration                         |
| **DevOps & CI/CD**                 | GitHub Actions, PM2, SSH automation, health checks, environment management         |
| **AI/ML Integration**              | RAG chatbot design, LLM prompt engineering, OpenRouter API integration             |
| **Security Engineering**           | UUID-based file security, signed URL access, dependency scanning, defense-in-depth |
| **API Design**                     | RESTful route organization, request validation, error handling, rate limiting      |
| **Notification Systems**           | Telegram Bot API, WhatsApp API (Fonnte), multi-channel delivery design             |
| **Linux Administration**           | VPS deployment, process management (PM2), bash scripting (`set -euo pipefail`)     |

### Technologies Mastered Through This Project

| Technology          | Level of Engagement                                                             |
| ------------------- | ------------------------------------------------------------------------------- |
| Next.js App Router  | Core framework — routing, layouts, server/client components, API routes         |
| Supabase Platform   | Deep — Auth, PostgreSQL, Storage, RLS, SSR sessions                             |
| TypeScript (strict) | Full codebase — type safety, generics, module organization                      |
| Tailwind CSS v4     | Production — utility-first styling, responsive design, PostCSS integration      |
| GitHub Actions      | Pipeline design — workflow orchestration, environment variables, SSH deployment |
| PM2                 | Production — process management, graceful restart, startup persistence          |
| OpenRouter API      | Integration — LLM inference, prompt engineering, error handling                 |

---

## Live Demo

This project is deployed and ready to use online at :
**[Access Online Here](https://smartcemetary.web.id/)**

---

_Smart Cemetery — Transforming cemetery administration through digital innovation for Surabaya City._
