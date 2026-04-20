# RLS (Row Level Security) Policies

## Apa itu RLS?

**RLS (Row Level Security)** adalah sistem keamanan database yang mengontrol siapa yang bisa melihat atau mengedit data di setiap tabel.

Dengan RLS, kita tidak perlu menulis kode keamanan di aplikasi - database sendiri yang menentukan siapa yang boleh akses data.

---

## Struktur Tabel dan Policies

### 1. profiles (Data Pengguna)

| Action | Siapa yang bisa |
|--------|-----------------|
| SELECT (baca profil sendiri) | Hanya pengguna itu sendiri |
| UPDATE (ubah profil) | Hanya pengguna itu sendiri |
| SELECT/ALL (admin) | ADMIN bisa lihat/edit semua |

```sql
-- Policy: User hanya bisa baca profil sendiri
CREATE POLICY profile_select_own ON profiles
FOR SELECT USING (auth.uid() = id);

-- Policy: User hanya bisa update profil sendiri
CREATE POLICY profile_update_own ON profiles
FOR UPDATE USING (auth.uid() = id);

-- Policy: Admin bisa lakukan semua
CREATE POLICY profile_admin_all ON profiles
FOR ALL USING (is_admin() = true);
```

**Contoh Penggunaan:**
- User A login → bisa lihat & edit profil User A
- User B login → tidak bisa lihat profil User A
- Admin login → bisa lihat & edit semua profil

---

### 2. pengajuan (Pengajuan Pemakaman)

| Action | Siapa yang bisa |
|--------|-----------------|
| INSERT (submit baru) | Semua user logged-in (membuat pengajuan sendiri) |
| SELECT (lihat) | User hanya lihat pengajuan sendiri |
| UPDATE/DELETE | User lihat sendiri, ADMIN lihat semua |

```sql
-- Policy: User bisa submit pengajuan (otomatis set user_id = diri sendiri)
CREATE POLICY pengajuan_insert_own ON pengajuan
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: User hanya bisa lihat pengajuan sendiri
CREATE POLICY pengajuan_select_own ON pengajuan
FOR SELECT USING (auth.uid() = user_id);

-- Policy: Admin bisa lihat semua pengajuan
CREATE POLICY pengajuan_admin_all ON pengajuan
FOR ALL USING (is_admin() = true);
```

**Contoh Penggunaan:**
- User submit pengajuan → status = "PENDING"
- User pergi ke dashboard → lihat pengajuan sendiri dengan status
- Admin pergi ke /dashboard/admin → lihat SEMUA pengajuan dari semua user
- Admin bisa ubah status ke "APPROVED" atau "REVISION"

---

### 3. makam (Lokasi Makam)

| Action | Siapa yang bisa |
|--------|-----------------|
| SELECT (lihat) | Siapa saja bisa lihat (data publik) |
| SELECT (own) | User lihat makam keluarga sendiri |
| ALL (admin) | ADMIN bisa lakukan semuanya |

```sql
-- Policy: Siapa saja bisa lihat semua makam (publik)
CREATE POLICY makam_select_all ON makam
FOR SELECT USING (true);

-- Policy: User lihat makam keluarga sendiri
CREATE POLICY makam_select_own ON makam
FOR SELECT USING (auth.uid() = user_id);

-- Policy: Admin bisa lakukan semua
CREATE POLICY makam_admin_all ON makam
FOR ALL USING (is_admin() = true);
```

**Contoh Penggunaan:**
- Orang datang ke /makam → bisa lihat peta makam
- User login → bisa lihat makam keluarga sendiri dengan detail
- Admin login → bisa lihat & edit semua data makam

---

### 4. dokumen (Dokumen - KTP, KK, Surat Kematian)

| Action | Siapa yang bisa |
|--------|-----------------|
| ALL (own) | User lihat & manage dokumen sendiri |
| ALL (admin) | ADMIN lihat semua |

```sql
-- Policy: User hanya bisa lihat dokumen sendiri
CREATE POLICY dokumen_own ON dokumen
FOR ALL USING (auth.uid() = user_id);

-- Policy: Admin bisa lihat semua dokumen
CREATE POLICY dokumen_admin ON dokumen
FOR ALL USING (is_admin() = true);
```

**Contoh Penggunaan:**
- User upload KTP → tersimpan dengan user_id = ID user tersebut
- User lain tidak bisa lihat dokumen tersebut
- Admin bisa lihat semua dokumen untuk verifikasi

---

### 5. chat_logs (Riwayat Chat AI)

| Action | Siapa yang bisa |
|--------|-----------------|
| ALL | User hanya bisa lihat chatnya sendiri |

```sql
-- Policy: User hanya bisa lihat chatnya sendiri
CREATE POLICY chat_own ON chat_logs
FOR ALL USING (auth.uid() = user_id);
```

**Contoh Penggunaan:**
- User chat dengan AI → tersimpan ke database
- User lain tidak bisa lihat chat tersebut
- Tidak ada akses admin (privasi)

---

## Ringkasan Rules

```
┌─────────────────────────────────────────────────────────────┐
│                    ATURAN KEAMANAN                          │
├─────────────────────────────────────────────────────────────┤
│ profiles     │ OWNER: read/update    ADMIN: all            │
│ pengajuan   │ OWNER: CRUD own        ADMIN: all            │
│ makam       │ PUBLIK: read          ADMIN: all            │
│ dokumen    │ OWNER: all           ADMIN: all            │
│ chat_logs  │ OWNER: only (strict) - No admin access       │
└─────────────────────────────────────────────────────────────┘
```

## Fungsi Kunci

### `auth.uid()`
Mengambil ID user yang sedang login dari Supabase Auth.

```sql
-- Contoh: auth.uid() = 'abc123'
-- Returns ID dari user yang sedang logged-in
```

### `is_admin()`
Fungsi khusus untuk cek apakah user memiliki role ADMIN.

```sql
-- Contoh query is_admin()
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
$$ LANGUAGE SQL SECURITY DEFINER;
```

---

## Kenapa RLS Penting?

1. **Keamanan Otomatis** - Tidak perlu kode manual di aplikasi
2. **Tidak Ada BugFilter** - Database yang jaga, bukan code
3. **Mudah Dikelola** - Tambah aturan = 1 baris SQL
4. **Performance** - Cepat karena dicek di level database

---

## Contoh Skenario Nyata

### Skenario 1: User Submit Pengajuan
```
1. User login (auth.uid() = 'user-123')
2. Submit pengajuan baru
3. Database otomatis set user_id = 'user-123'
4. Pengajuan tersimpan dengan user_id = 'user-123'
5. User lain tidak bisa lihat pengajuan ini
6. Admin bisa lihat karena is_admin() = true
```

### Skenario 2: Admin Review
```
1. Admin login (role = 'ADMIN')
2. Pergi ke /dashboard/admin
3. Lihat semua pengajuan dari semua user
4. Ubah status pengajuan ke "APPROVED"
5. Perubahan tersimpan
```

### Skenario 3: User Coba Akses Data Orang Lain
```
1. User A coba akses pengajuan User B
2. RLS cek: auth.uid() = 'user-A'
3. Pengajuan User B punya user_id = 'user-B'
4. 'user-A' != 'user-B' → DITOLAK
5. User A tidak bisa lihat data User B
```

---

## Cara Mengcek Policy Ada

```sql
-- Lihat semua policy di database
SELECT policyname, tablename 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename;
```

---

## Cara Menonaktifkan ( Emergency )

```sql
-- Matikan RLS untuk satu tabel
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Nyalakan lagi
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

---

## Daftar Policy Lengkap

| Table | Policy Name | Command | Kondisi |
|-------|------------|---------|---------|
| profiles | profile_select_own | SELECT | auth.uid() = id |
| profiles | profile_update_own | UPDATE | auth.uid() = id |
| profiles | profile_admin_all | ALL | is_admin() |
| pengajuan | pengajuan_insert_own | INSERT | auth.uid() = user_id |
| pengajuan | pengajuan_select_own | SELECT | auth.uid() = user_id |
| pengajuan | pengajuan_admin_all | ALL | is_admin() |
| makam | makam_select_all | SELECT | true |
| makam | makam_select_own | SELECT | auth.uid() = user_id |
| makam | makam_admin_all | ALL | is_admin() |
| dokumen | dokumen_own | ALL | auth.uid() = user_id |
| dokumen | dokumen_admin | ALL | is_admin() |
| chat_logs | chat_own | ALL | auth.uid() = user_id |