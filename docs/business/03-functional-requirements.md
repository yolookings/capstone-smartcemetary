# Functional Requirements & Use Cases

> **Complete feature list organized by user role and module**

---

## 1. Public Features (No Login Required)

| ID | Feature | Description |
|----|---------|-------------|
| PUB-01 | Landing Page | View application overview, workflow diagram, and navigation to login/register |
| PUB-02 | Cemetery Map | Interactive map showing grave blocks and plot availability using Leaflet |
| PUB-03 | AI Chatbot | Ask procedural questions about burial registration; answered via AI with RAG from regulation documents |
| PUB-04 | Login | Sign in with email and password via Supabase Auth |
| PUB-05 | Register | Create a new user account with email, password, and name |

---

## 2. User Features (Authenticated Citizens)

### 2.1 Dashboard

| ID | Feature | Description |
|----|---------|-------------|
| USR-01 | Dashboard Overview | View application statistics (total, pending, approved, revision counts) |
| USR-02 | Application History | List of all submitted applications with status badges |
| USR-03 | Grave Locations | View allocated grave locations for approved applications (block + number) |

### 2.2 Burial Application

| ID | Feature | Description |
|----|---------|-------------|
| USR-10 | New Application Form | Submit a burial application with deceased and applicant data |
| USR-11 | Upload Documents | Upload KTP, KK, Surat Kematian, and Surat RT/RW (PDF/image) |
| USR-12 | Duplicate Email Check | System checks if applicant email already has an active application |
| USR-13 | Submit Confirmation | Receive WhatsApp confirmation message after successful submission |
| USR-14 | View Submission Detail | See all submitted data (applicant info, deceased info, documents) in a read-only format |

### 2.3 Status Tracking

| ID | Feature | Description |
|----|---------|-------------|
| USR-20 | Application Status | View current status (Pending / Revision / Approved / Rejected) |
| USR-21 | Document Revision | Upload revised documents when admin requests changes |
| USR-22 | Status Notifications | Receive WhatsApp and Telegram notifications on status changes |

### 2.4 Account Settings

| ID | Feature | Description |
|----|---------|-------------|
| USR-30 | View Profile | See personal profile information (name, email, phone, role) |
| USR-31 | Update Profile | Change full name and phone number |
| USR-32 | Change Password | Update password with old password verification |
| USR-33 | Telegram Integration | Save Telegram Chat ID for receiving notifications |

### 2.5 AI Chatbot

| ID | Feature | Description |
|----|---------|-------------|
| USR-40 | Full Chat Interface | Dedicated chat page with full conversation history |
| USR-41 | Chat Widget | Floating chatbot widget available on all pages |
| USR-42 | Conversation History | Chat sessions are saved and can be revisited |
| USR-43 | Rate Limiting | 10 AI prompts per user per month |

---

## 3. Admin Features

### 3.1 Dashboard & Overview

| ID | Feature | Description |
|----|---------|-------------|
| ADM-01 | Admin Dashboard | Overview of all applications with statistics and charts |
| ADM-02 | Stats API | Real-time application counts by status |
| ADM-03 | Notification Center | In-app notifications for new submissions and status changes |

### 3.2 Application Management

| ID | Feature | Description |
|----|---------|-------------|
| ADM-10 | Application Queue | Filterable, searchable list of all applications |
| ADM-11 | Search by Email/Name | Find applications by applicant email or account name |
| ADM-12 | Filter by Status | Filter applications by Pending, Revision, Approved, Rejected |
| ADM-13 | Application Detail | Full detail view with applicant info, deceased data, documents, timeline |
| ADM-14 | Auto-Approve with Allocation | Approve application and automatically allocate next available grave plot |
| ADM-15 | Request Revision | Send revision request with specific notes to applicant |
| ADM-16 | Reject Application | Reject application with reason |
| ADM-17 | Status Timeline | View full activity history (created, approved, rejected, revisions) |

### 3.3 Document Review

| ID | Feature | Description |
|----|---------|-------------|
| ADM-20 | Document Preview | View uploaded documents (KTP, KK, Surat Kematian, Surat RT/RW) |
| ADM-21 | Signed URL Access | Documents accessed via time-limited signed URLs (5 minutes) |
| ADM-22 | Document Status | Each document shows status: uploaded, verified, pending, revision, or missing |

### 3.4 Grave Allocation

| ID | Feature | Description |
|----|---------|-------------|
| ADM-30 | Auto Allocation | System selects highest-priority block with available plots |
| ADM-31 | Manual Allocation | Admin selects specific block, system shows next available plot |
| ADM-32 | Current Allocation View | Show currently allocated block and plot number |
| ADM-33 | Change Warning | Warns admin when proposed allocation differs from current |
| ADM-34 | Allocation Lock | Approved applications cannot be re-allocated |

### 3.5 Cemetery Management

| ID | Feature | Description |
|----|---------|-------------|
| ADM-40 | Cemetery List | View all managed cemeteries |
| ADM-41 | Block Management | Configure blocks within each cemetery (name, capacity, priority order) |
| ADM-42 | Plot Grid | Visual grid showing all plots with availability status |
| ADM-43 | Interactive Map | SVG-based cemetery map with clickable plots |

### 3.6 User Management

| ID | Feature | Description |
|----|---------|-------------|
| ADM-50 | User List | View all registered users |
| ADM-51 | Create Admin | Create new admin accounts |
| ADM-52 | User Details | View user profile information |

### 3.7 Reports

| ID | Feature | Description |
|----|---------|-------------|
| ADM-60 | Application Report | Monthly/periodic report with application statistics |
| ADM-61 | PDF Export | Download reports in PDF format |
| ADM-62 | Excel Export | Download reports in XLSX format |

### 3.8 Notifications

| ID | Feature | Description |
|----|---------|-------------|
| ADM-70 | Telegram Alerts | New submissions sent to admin Telegram group |
| ADM-71 | In-App Notifications | Notification center with read/unread status |

### 3.9 System Settings

| ID | Feature | Description |
|----|---------|-------------|
| ADM-80 | Account Settings | Admin can update their own profile, password, and Telegram Chat ID |

---

## 4. Notification Matrix

| Trigger | Channel | Recipient | Message Content |
|---------|---------|-----------|-----------------|
| New submission | WhatsApp | Applicant | Confirmation with application reference number |
| New submission | Telegram | Admin group | Applicant name, NIK, relationship |
| Status → Approved | WhatsApp | Applicant | Approval confirmation with block & plot number |
| Status → Revision | WhatsApp | Applicant | Revision notes from admin |
| Status → Rejected | WhatsApp | Applicant | Rejection notification |
| Revision resubmitted | Telegram | Admin group | Notification to re-verify |

---

## 5. Role-Based Access Control

| Feature | Public | User | Admin |
|---------|--------|------|-------|
| Landing Page | ✅ | ✅ | ✅ |
| Cemetery Map | ✅ | ✅ | ✅ |
| AI Chatbot (widget) | ✅ | ✅ | ✅ |
| Login / Register | ✅ | ❌ (redirect) | ❌ (redirect) |
| Full Chat Interface | ❌ | ✅ | ✅ |
| Submit Application | ❌ | ✅ | ❌ |
| View My Applications | ❌ | ✅ | ✅ |
| Account Settings | ❌ | ✅ | ✅ |
| Admin Dashboard | ❌ | ❌ | ✅ |
| Application Queue | ❌ | ❌ | ✅ |
| Review & Verify | ❌ | ❌ | ✅ |
| Grave Allocation | ❌ | ❌ | ✅ |
| Cemetery Management | ❌ | ❌ | ✅ |
| User Management | ❌ | ❌ | ✅ |
| Reports | ❌ | ❌ | ✅ |

---

*Next: [04 — User Interface](./04-user-interface.md) — Visual tour of the application.*
