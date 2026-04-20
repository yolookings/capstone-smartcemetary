# Project Knowledge Base

**Generated:** 2026-04-08
**Directory:** src/app

## OVERVIEW
Next.js 15 App Router pages for Smart Cemetery - user dashboards, public pages, and API endpoints.

## ROUTE STRUCTURE
| Path | File | Purpose |
|------|------|---------|
| / | page.tsx | Home page |
| /makam | makam/page.tsx | Cemetery map |
| /auth/login | auth/login/page.tsx | Login form |
| /auth/register | auth/register/page.tsx | Registration form |
| /dashboard | dashboard/page.tsx | User dashboard |
| /dashboard/chat | dashboard/chat/page.tsx | Chat interface |
| /dashboard/pengajuan/baru | dashboard/pengajuan/baru/page.tsx | New application form |
| /dashboard/admin | dashboard/admin/page.tsx | Admin dashboard |
| /dashboard/admin/pengajuan/[id] | dashboard/admin/pengajuan/[id]/page.tsx | Application review |

## API ROUTES
| Path | File | Purpose |
|------|------|---------|
| /api/auth/[...nextauth] | api/auth/[...nextauth]/route.ts | NextAuth handler |
| /api/auth/register | api/auth/register/route.ts | User registration |
| /api/pengajuan | api/pengajuan/route.ts | Application submission |
| /api/chat | api/chat/route.ts | Chatbot API |
| /api/admin/pengajuan/[id] | api/admin/pengajuan/[id]/route.ts | Admin review |

## PAGES
- **Public:** Home, Cemetery Map, Login, Register
- **Protected (User):** Dashboard, Chat, New Application
- **Protected (Admin):** Admin Dashboard, Application Review

## LAYOUTS
- `layout.tsx` - Root layout (entire app)
- `dashboard/layout.tsx` - Dashboard layout (authenticated sections)