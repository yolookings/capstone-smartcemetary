# User Interface Overview

> **Page map, layout structure, and key screens**

---

## 1. Navigation Map

```mermaid
flowchart TD
    Home[/] --> Login[/auth/login]
    Home --> Register[/auth/register]
    Home --> Map[/makam]
    
    Login --> UserDash[/dashboard]
    Login --> AdminDash[/dashboard/admin]
    
    UserDash --> NewApp[/dashboard/pengajuan/baru]
    UserDash --> MyApps[/dashboard/pengajuan]
    UserDash --> Chat[/dashboard/chat]
    UserDash --> Pengaturan[/dashboard/pengaturan]
    
    MyApps --> Detail[/dashboard/pengajuan/revision]
    
    AdminDash --> Queue[/dashboard/admin/pengajuan]
    AdminDash --> Graves[/dashboard/admin/makam]
    AdminDash --> Users[/dashboard/admin/users]
    AdminDash --> Reports[/dashboard/admin/laporan]
    AdminDash --> Settings[/dashboard/admin/pengaturan]
    AdminDash --> Notif[/dashboard/admin/notifications]
    AdminDash --> Cemetery[/dashboard/admin/cemetery]
    AdminDash --> Pengaturan
    
    Queue --> Review[/dashboard/admin/pengajuan/{id}]
```

---

## 2. Page Directory

### 2.1 Public Pages

| Page | Route | Purpose |
|------|-------|---------|
| **Landing Page** | `/` | Hero section, workflow infographic, feature highlights, CTA buttons |
| **Cemetery Map** | `/makam` | Interactive Leaflet map showing grave blocks and plot availability |
| **Login** | `/auth/login` | Email/password sign-in form |
| **Register** | `/auth/register` | User registration form |
| **Reset Password** | `/auth/reset-password` | Password recovery flow |

### 2.2 User Dashboard Pages

| Page | Route | Purpose |
|------|-------|---------|
| **User Dashboard** | `/dashboard` | Stats overview, recent applications, grave locations |
| **New Application** | `/dashboard/pengajuan/baru` | Multi-step form for burial application with document upload |
| **My Applications** | `/dashboard/pengajuan` | List of all submitted applications with status |
| **Application Detail** | `/dashboard/pengajuan/revision` | View submission detail and upload revised documents |
| **AI Chat** | `/dashboard/chat` | Full chat interface with conversation history |
| **Account Settings** | `/dashboard/pengaturan` | Profile, password, and Telegram integration |

### 2.3 Admin Dashboard Pages

| Page | Route | Purpose |
|------|-------|---------|
| **Admin Dashboard** | `/dashboard/admin` | Overview with statistics, recent applications, charts |
| **Application Queue** | `/dashboard/admin/pengajuan` | Filterable, searchable list of all applications |
| **Application Review** | `/dashboard/admin/pengajuan/{id}` | Full detail view with verification panel, documents, allocation |
| **Grave Management** | `/dashboard/admin/makam` | Cemetery, block, and plot management |
| **User Management** | `/dashboard/admin/users` | Registered users list |
| **Reports** | `/dashboard/admin/laporan` | PDF and Excel report generation |
| **Cemetery Map** | `/dashboard/admin/cemetery` | SVG-based interactive cemetery layout |
| **Notifications** | `/dashboard/admin/notifications` | In-app notification center |
| **Settings** | `/dashboard/admin/pengaturan` | Admin account settings |
| **Account Settings** | `/dashboard/pengaturan` | Shared account settings (profile, password, Telegram) |

---

## 3. Key Screen Descriptions

### Landing Page (`/`)
- Hero section with application name and tagline
- Workflow infographic (`/alur.png`) showing the registration process
- Feature highlights with icons
- CTA buttons: Daftar Makam, Cek Status, Peta Makam
- Floating AI chatbot widget in bottom-right corner

### Application Form (`/dashboard/pengajuan/baru`)
- Multi-step form with sections:
  1. **Data Almarhum** — deceased name, NIK, date of death, religion
  2. **Data Pemohon** — applicant name, email, phone, relationship
  3. **Dokumen** — upload KTP, KK, Surat Kematian, Surat RT/RW
  4. **Tanggal Pemakaman** — preferred burial date
- Form validation with error messages
- Loading state during submission
- Success redirect with confirmation

### Admin Application Review (`/dashboard/admin/pengajuan/{id}`)
- Three-column layout on desktop:
  - **Left column (2/3):** Applicant info, deceased info, documents, grave allocation, timeline
  - **Right column (1/3):** Verification panel with action buttons
- **Application Summary** header card with:
  - Reference number (EKM-XXXX-XXXX format)
  - Applicant name, status badge, creation date, document count
- **Applicant Info** card:
  - Account data (name, email, phone) ↔ Form-submitted data (name, email, phone)
  - Clear separation between "Akun" and "Pengajuan" sources
- **Deceased Info** card with NIK, dates, religion, relationship
- **Documents** grid with preview buttons and status badges
- **Grave Allocation** panel with auto/manual mode
- **Activity Timeline** showing full history

### Account Settings (`/dashboard/pengaturan`)
- Three-section card layout:
  1. **Profil** — view/edit name, phone; read-only email and role
  2. **Keamanan** — change password with old/new/confirm fields
  3. **Integrasi Telegram** — Chat ID input with instructions
- Success/error notifications per action
- Consistent with dashboard design system

---

## 4. Design System

| Element | Specification |
|---------|---------------|
| **Typography** | Headings: Manrope (700, 800 weight); Body: Inter (400, 500, 600 weight) |
| **Primary Color** | Emerald green (`#059669`) — used for buttons, links, active states |
| **Background** | Neutral/light gray (`#f8fafc`) |
| **Cards** | White background, rounded-2xl (16px), subtle border and shadow |
| **Icons** | Lucide React icon library |
| **Responsive** | Mobile-first with md/lg breakpoints |
| **Status Colors** | Amber (pending), Emerald (approved), Rose (revision), Slate (rejected) |
| **Empty State** | Dashed border badge with "Tidak Ada Data" message |

---

## 5. Figma / Mockups

> Wireframes and mockups are available in the project's design assets. For access to the Figma file, please contact the project team.

Key screens captured as reference:
- Landing page with workflow diagram
- Application form (multi-step)
- User dashboard with stats cards
- Admin application queue table
- Admin application detail (three-column review layout)
- Account settings page
- Mobile responsive views

---

*Next: Technical documentation for developers → [01 — System Architecture](../technical/01-system-architecture.md)*
