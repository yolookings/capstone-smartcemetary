# Business Process Flow

> **As-Is vs. To-Be: How burial registration changes with Smart Cemetery**

---

## 1. As-Is Process (Before Smart Cemetery)

The traditional workflow relies on paper forms, physical visits, and manual coordination.

```mermaid
flowchart TD
    A[Death Occurs] --> B[Family visits DLH office]
    B --> C[Request paper form]
    C --> D[Fill form by hand]
    D --> E[Gather physical documents<br/>KTP, KK, Surat Kematian]
    E --> F[Submit to DLH counter]
    F --> G[Staff files paperwork manually]
    G --> H{Admin Review}
    H -->|Approved| I[Staff manually allocates grave<br/>in spreadsheet]
    H -->|Need Changes| J[Staff calls family<br/>to request revision]
    H -->|Rejected| K[Staff informs family]
    I --> L[Family must visit again<br/>for grave location]
    
    style A fill:#f3f4f6,stroke:#6b7280
    style B fill:#fef3c7,stroke:#d97706
    style C fill:#fef3c7,stroke:#d97706
    style D fill:#fef3c7,stroke:#d97706
    style E fill:#fef3c7,stroke:#d97706
    style F fill:#fef3c7,stroke:#d97706
    style G fill:#fef3c7,stroke:#d97706
    style H fill:#e0f2fe,stroke:#0284c7
    style I fill:#d1fae5,stroke:#059669
    style J fill:#fce7f3,stroke:#e11d48
    style K fill:#fce7f3,stroke:#e11d48
    style L fill:#fef3c7,stroke:#d97706
```

### Pain Points in the As-Is Process

1. **Multiple physical visits** — Families must visit the DLH office at least twice (submission + result)
2. **Paper documents** — Prone to damage, loss, and disorganization
3. **No status visibility** — Families cannot track progress without calling
4. **Manual grave allocation** — Staff uses spreadsheets, prone to errors and double-booking
5. **Phone-based communication** — Staff must call families for revisions or approvals
6. **No audit trail** — Decisions and changes are not systematically recorded
7. **Manual reporting** — Statistics require manual compilation from paper records

---

## 2. To-Be Process (With Smart Cemetery)

The digital workflow eliminates physical visits and automates coordination.

```mermaid
flowchart TD
    A[Death Occurs] --> B[Family accesses Smart Cemetery<br/>from any device]
    B --> C[Register / Login]
    C --> D[Fill online form:<br/>Deceased & Applicant data]
    D --> E[Upload digital documents:<br/>KTP, KK, Surat Kematian]
    E --> F[Submit application]
    F --> G[System sends WhatsApp<br/>confirmation to applicant]
    G --> H[System sends Telegram<br/>notification to admins]
    H --> I[Admin opens application<br/>in review dashboard]
    I --> J{Admin reviews<br/>documents & data}
    
    J -->|Approve| K[System auto-allocates<br/>next available grave plot]
    J -->|Request Revision| L[Admin adds revision notes]
    J -->|Reject| M[Admin adds rejection reason]
    
    K --> N[System notifies applicant<br/>via WhatsApp + Telegram]
    L --> O[System notifies applicant<br/>to upload revised documents]
    M --> P[System notifies applicant<br/>of rejection & reason]
    
    O --> Q[Family uploads revised<br/>documents online]
    Q --> R[Admin re-verifies]
    R --> K
    
    N --> S[Applicant can view<br/>grave location online]
    
    style A fill:#f3f4f6,stroke:#6b7280
    style B fill:#dcfce7,stroke:#16a34a
    style C fill:#dcfce7,stroke:#16a34a
    style D fill:#dcfce7,stroke:#16a34a
    style E fill:#dcfce7,stroke:#16a34a
    style F fill:#dcfce7,stroke:#16a34a
    style G fill:#f0fdf4,stroke:#22c55e
    style H fill:#f0fdf4,stroke:#22c55e
    style I fill:#e0f2fe,stroke:#0284c7
    style J fill:#e0f2fe,stroke:#0284c7
    style K fill:#d1fae5,stroke:#059669
    style L fill:#fef3c7,stroke:#d97706
    style M fill:#fce7f3,stroke:#e11d48
    style N fill:#f0fdf4,stroke:#22c55e
    style O fill:#f0fdf4,stroke:#22c55e
    style P fill:#f0fdf4,stroke:#22c55e
    style Q fill:#dcfce7,stroke:#16a34a
    style R fill:#e0f2fe,stroke:#0284c7
    style S fill:#dcfce7,stroke:#16a34a
```

### Key Improvements in the To-Be Process

| Step | Before | After |
|------|--------|-------|
| **Form submission** | In-person at DLH office | Online from any device, 24/7 |
| **Document delivery** | Physical photocopies | Digital upload (PDF/images) |
| **Application confirmation** | None / verbal | Automatic WhatsApp message |
| **Status checking** | Phone call or visit | Real-time online dashboard |
| **Document review** | Paper files shuffled between desks | Side-by-side document preview in browser |
| **Grave allocation** | Manual spreadsheet lookup | Auto-assigned from available plots |
| **Status notifications** | Manual phone calls | Automated WhatsApp + Telegram |
| **Revisions** | Visit office to resubmit | Upload revised documents online |
| **Reporting** | Manual data compilation | Real-time dashboard + export |

---

## 3. User Journey Summary

### Applicant Journey

```mermaid
flowchart LR
    A[Landing Page] --> B[Register]
    B --> C[Login]
    C --> D[Submit Application]
    D --> E[Upload Documents]
    E --> F[View Status]
    F --> G{Status Update?}
    G -->|Approved| H[View Grave Location]
    G -->|Revision| I[Upload Revised Docs]
    G -->|Rejected| J[View Reason]
    I --> F
```

### Admin Journey

```mermaid
flowchart LR
    A[Login] --> B[Dashboard Overview]
    B --> C[Application Queue]
    C --> D[Review Detail]
    D --> E{Decision}
    E -->|Approve| F[Auto-allocate Grave]
    E -->|Revision| G[Write Notes]
    E -->|Reject| H[Write Reason]
    F --> B
    G --> B
    H --> B
```

---

*Next: [03 — Functional Requirements](./03-functional-requirements.md) — Complete feature list.*
