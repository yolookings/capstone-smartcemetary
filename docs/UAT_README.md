# UAT — User Acceptance Testing

## Smart Cemetery — Sistem Manajemen Pemakaman Digital

**Dinas Lingkungan Hidup Kota Surabaya**

---

## Daftar Isi

1. [Informasi Dokumen](#1-informasi-dokumen)
2. [Lingkup Pengujian](#2-lingkup-pengujian)
3. [Daftar Fitur](#3-daftar-fitur)
4. [Peran Pengguna](#4-peran-pengguna)
5. [Skenario UAT — Pengguna (USER)](#5-skenario-uat--pengguna-user)
6. [Skenario UAT — Admin (ADMIN)](#6-skenario-uat--admin-admin)
7. [Formulir UAT Lengkap](#7-formulir-uat-lengkap)
8. [Rangkuman](#8-rangkuman)
9. [Tanda Tangan](#9-tanda-tangan)

---

## 1. Informasi Dokumen

| Item                  | Detail                                                                                                            |
| --------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Nama Aplikasi**     | Smart Cemetery                                                                                                    |
| **Deskripsi**         | Sistem informasi manajemen pemakaman berbasis web untuk TPU Keputih, Surabaya                                     |
| **Tahap**             | User Acceptance Testing (UAT)                                                                                     |
| **Tanggal Pengujian** | {{tanggal_pengujian}}                                                                                             |
| **Lokasi**            | {{lokasi_pengujian}}                                                                                              |
| **Penguji**           | {{nama_penguji}}                                                                                                  |
| **Versi Aplikasi**    | 1.0.0                                                                                                             |
| **Stack Teknologi**   | Next.js 16 · Supabase Auth · PostgreSQL · Leaflet Maps · WhatsApp/Fonnte · Telegram Bot · AI Chatbot (OpenRouter) |

---

## 2. Lingkup Pengujian

### ✅ Dalam Lingkup

- Login, registrasi, reset password pengguna
- Pengajuan pemakaman baru (form + upload dokumen)
- Tracking status pengajuan (Pending / Need Revision / Approved / Rejected)
- Alokasi makam oleh admin (otomatis & manual)
- Peta interaktif makam berbasis Leaflet & OpenStreetMap
- Dashboard pengguna (ringkasan status dan histori)
- Dashboard admin (statistik, antrian, grafik)
- Manajemen pengguna oleh admin
- Laporan dan statistik
- Chatbot AI tanya-jawab regulasi pemakaman (10 prompt/bulan)
- Notifikasi in-app, WhatsApp (Fonnte), Telegram
- Manajemen data makam (blok, plot, status)

### ❌ Di Luar Lingkup

- Integrasi dengan sistem eksternal di luar yang disebutkan
- Migrasi data dari sistem legacy
- Uji performa / load testing
- Uji keamanan penetrasi

---

## 3. Daftar Fitur

| ID Fitur | Nama Fitur                      | Modul      | Role  |
| -------- | ------------------------------- | ---------- | ----- |
| F-01     | Registrasi Akun                 | Auth       | Semua |
| F-02     | Login                           | Auth       | Semua |
| F-03     | Logout                          | Auth       | Semua |
| F-04     | Reset Password                  | Auth       | Semua |
| F-05     | Melihat Dashboard Ringkasan     | Dashboard  | USER  |
| F-06     | Mengajukan Pemakaman Baru       | Pengajuan  | USER  |
| F-07     | Upload Dokumen Persyaratan      | Dokumen    | USER  |
| F-08     | Melihat Status Pengajuan        | Pengajuan  | USER  |
| F-09     | Upload Revisi Dokumen           | Pengajuan  | USER  |
| F-10     | Melihat Peta Makam Publik       | Peta       | Semua |
| F-11     | Chatbot AI Regulasi             | Chatbot    | USER  |
| F-12     | Melihat Dashboard Admin         | Dashboard  | ADMIN |
| F-13     | Menyetujui/Menolak Pengajuan    | Validasi   | ADMIN |
| F-14     | Meminta Revisi Dokumen          | Validasi   | ADMIN |
| F-15     | Mengalokasikan Makam (Otomatis) | Makam      | ADMIN |
| F-16     | Mengalokasikan Makam (Manual)   | Makam      | ADMIN |
| F-17     | Melihat & Mengelola Makam       | Makam      | ADMIN |
| F-18     | Memantau Peta TPU               | Peta Admin | ADMIN |
| F-19     | Mengedit Poligon Blok           | Peta Admin | ADMIN |
| F-20     | Mengelola Pengguna              | Pengguna   | ADMIN |
| F-21     | Melihat Laporan & Statistik     | Laporan    | ADMIN |
| F-22     | Mengelola Notifikasi            | Notifikasi | ADMIN |
| F-23     | Mengatur Profil & Password      | Pengaturan | Semua |
| F-24     | Notifikasi WhatsApp             | Notifikasi | ADMIN |
| F-25     | Notifikasi Telegram             | Notifikasi | ADMIN |

---

## 4. Peran Pengguna

### 👤 USER (Warga / Masyarakat Umum)

- Mendaftar dan login akun
- Mengajukan permohonan pemakaman
- Mengunggah dokumen persyaratan
- Melacak status pengajuan
- Melakukan revisi dokumen jika diminta
- Menggunakan chatbot AI untuk informasi regulasi
- Melihat peta makam TPU Keputih

### 🛡️ ADMIN (Petugas Dinas / Pengelola TPU)

- Semua akses USER (dashboard admin)
- Memvalidasi pengajuan (setuju / tolak / minta revisi)
- Mengalokasikan makam (otomatis atau manual)
- Mengelola data pengguna
- Memantau peta TPU dan mengedit poligon blok
- Melihat laporan dan statistik
- Mengelola notifikasi

---

## 5. Skenario UAT — Pengguna (USER)

### 5.1 Registrasi & Login

| Kode     | Skenario                              | Langkah Pengujian                                                                                         | Hasil Diharapkan                             |
| -------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| U-REG-01 | Registrasi akun baru berhasil         | 1. Buka halaman `/auth/register`<br>2. Isi nama, email, password, konfirmasi password<br>3. Klik "Daftar" | Akun berhasil dibuat, diarahkan ke dashboard |
| U-REG-02 | Registrasi dengan email duplikat      | 1. Isi form dengan email yang sudah terdaftar<br>2. Klik "Daftar"                                         | Muncul pesan error "Email sudah terdaftar"   |
| U-REG-03 | Registrasi dengan password tidak sama | 1. Isi password dan konfirmasi password berbeda<br>2. Klik "Daftar"                                       | Validasi gagal, muncul pesan error           |
| U-REG-04 | Registrasi dengan email tidak valid   | 1. Isi format email salah (tanpa @)<br>2. Klik "Daftar"                                                   | Validasi gagal, muncul error format email    |
| U-LOG-01 | Login berhasil                        | 1. Buka halaman `/auth/login`<br>2. Isi email & password benar<br>3. Klik "Masuk"                         | Masuk ke halaman dashboard user              |
| U-LOG-02 | Login dengan password salah           | 1. Isi email benar, password salah<br>2. Klik "Masuk"                                                     | Muncul pesan "Email atau password salah"     |
| U-LOG-03 | Login dengan email tidak terdaftar    | 1. Isi email tidak terdaftar<br>2. Klik "Masuk"                                                           | Muncul pesan error yang sesuai               |
| U-LOG-04 | Akses halaman tanpa login             | 1. Buka `/dashboard` tanpa session                                                                        | Diarahkan ke halaman login                   |
| U-LOG-05 | Reset password                        | 1. Klik "Lupa Password"<br>2. Isi email terdaftar<br>3. Klik kirim                                        | Muncul pesan tautan reset terkirim           |
| U-LOG-06 | Logout                                | 1. Klik tombol logout<br>2. Konfirmasi                                                                    | Kembali ke halaman login, session berakhir   |

### 5.2 Dashboard Pengguna

| Kode     | Skenario                          | Langkah Pengujian                             | Hasil Diharapkan                                                             |
| -------- | --------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------- |
| U-DSH-01 | Melihat dashboard pengguna        | 1. Login sebagai user<br>2. Buka `/dashboard` | Muncul ringkasan: total pengajuan, status, makam keluarga, tombol aksi cepat |
| U-DSH-02 | Tombol "Pengajuan Baru" berfungsi | 1. Klik tombol pengajuan baru                 | Diarahkan ke `/dashboard/pengajuan/baru`                                     |
| U-DSH-03 | Tombol "Lihat Status" berfungsi   | 1. Klik tombol lihat status                   | Diarahkan ke `/dashboard/pengajuan`                                          |

### 5.3 Pengajuan Pemakaman

| Kode     | Skenario                         | Langkah Pengujian                                                                                                                                        | Hasil Diharapkan                                                                              |
| -------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| U-PGN-01 | Membuka halaman pengajuan baru   | 1. Buka `/dashboard/pengajuan/baru`<br>2. Lihat form pengajuan                                                                                           | Form muncul dengan field: nama, NIK, alamat, nama almarhum, tanggal meninggal, hubungan, dll. |
| U-PGN-02 | Membuka halaman daftar pengajuan | 1. Buka `/dashboard/pengajuan`                                                                                                                           | Muncul tabel/daftar semua pengajuan milik user                                                |
| U-PGN-03 | Mengisi form pengajuan lengkap   | 1. Isi semua field yang diperlukan<br>2. Isi data almarhum (nama, TTL, NIK)<br>3. Isi data pemohon (nama, no telepon, email)<br>4. Isi hubungan keluarga | Form valid, data terisi semua                                                                 |
| U-PGN-04 | Upload dokumen KTP               | 1. Pilih file KTP (PDF/JPG/PNG)<br>2. Upload                                                                                                             | File terupload, muncul nama file di form                                                      |
| U-PGN-05 | Upload dokumen KK                | 1. Pilih file Kartu Keluarga                                                                                                                             | File terupload                                                                                |
| U-PGN-06 | Upload dokumen Surat Kematian    | 1. Pilih file Surat Kematian                                                                                                                             | File terupload                                                                                |
| U-PGN-07 | Upload Surat RT/RW               | 1. Pilih file Surat RT/RW                                                                                                                                | File terupload                                                                                |
| U-PGN-08 | Submit pengajuan lengkap         | 1. Isi semua data & upload dokumen<br>2. Klik "Ajukan"                                                                                                   | Pengajuan berhasil dikirim, muncul notifikasi, status awal "PENDING"                          |
| U-PGN-09 | Submit tanpa dokumen lengkap     | 1. Isi data, skip upload dokumen                                                                                                                         | Validasi gagal, minta upload dokumen                                                          |
| U-PGN-10 | Submit tanpa data wajib          | 1. Lewati field wajib                                                                                                                                    | Validasi form gagal, field wajib ditandai merah                                               |
| U-PGN-11 | Submit dengan file > 2MB         | 1. Upload file > 2MB                                                                                                                                     | Validasi ukuran file gagal, muncul pesan error                                                |
| U-PGN-12 | Submit dengan tipe file salah    | 1. Upload file .exe/.zip                                                                                                                                 | Validasi tipe file gagal, hanya PDF/JPG/PNG diterima                                          |
| U-PGN-13 | Melihat detail status pengajuan  | 1. Klik salah satu pengajuan di daftar                                                                                                                   | Muncul detail: data almarhum, pemohon, dokumen, status, timeline                              |
| U-PGN-14 | Pengajuan status "APPROVED"      | 1. Lihat status setelah disetujui admin                                                                                                                  | Status "DISETUJUI", info makam muncul (blok & nomor)                                          |
| U-PGN-15 | Pengajuan status "NEED_REVISION" | 1. Lihat status setelah diminta revisi                                                                                                                   | Status "REVISI", muncul catatan admin, tombol upload revisi                                   |
| U-PGN-16 | Upload revisi dokumen            | 1. Buka halaman pengajuan status revisi<br>2. Upload dokumen revisi<br>3. Klik kirim                                                                     | Dokumen revisi terkirim, status kembali ke "PENDING"                                          |
| U-PGN-17 | Pengajuan status "REJECTED"      | 1. Lihat status setelah ditolak                                                                                                                          | Status "DITOLAK", muncul alasan penolakan                                                     |

### 5.4 Peta Makam Publik

| Kode     | Skenario                                  | Langkah Pengujian             | Hasil Diharapkan                                   |
| -------- | ----------------------------------------- | ----------------------------- | -------------------------------------------------- |
| U-MAP-01 | Membuka peta makam publik                 | 1. Buka `/makam`              | Peta TPU Keputih tampil dengan blok-blok makam     |
| U-MAP-02 | Melihat semua blok makam                  | 1. Scroll/zoom peta           | 5 blok (A-E) dengan plot-plot makam tampil         |
| U-MAP-03 | Warna plot                                | 1. Perhatikan perbedaan warna | Hijau = Tersedia, Merah = Terisi, Kuning = Dipesan |
| U-MAP-04 | Klik plot untuk detail                    | 1. Klik salah satu plot       | Muncul popup info: nomor plot, status              |
| U-MAP-05 | Navigasi peta (zoom/pan)                  | 1. Zoom in/out, drag peta     | Peta responsif, tidak error                        |
| U-MAP-06 | Mode tampilan (Lihat Peta / Lihat Daftar) | 1. Klik tab "Lihat Peta"      | Tampilan peta interaktif muncul                    |
| U-MAP-07 | Mode daftar                               | 1. Klik tab "Lihat Daftar"    | Tabel daftar makam muncul dengan info              |

### 5.5 Chatbot AI

| Kode     | Skenario               | Langkah Pengujian                                          | Hasil Diharapkan                          |
| -------- | ---------------------- | ---------------------------------------------------------- | ----------------------------------------- |
| U-CHT-01 | Membuka chatbot        | 1. Login<br>2. Buka `/dashboard/chat`                      | Halaman chat dengan input pesan muncul    |
| U-CHT-02 | Mengirim pertanyaan    | 1. Ketik pertanyaan tentang regulasi pemakaman<br>2. Kirim | AI merespon dengan jawaban relevan        |
| U-CHT-03 | Riwayat chat tersimpan | 1. Kirim beberapa pesan<br>2. Refresh halaman              | Riwayat chat tetap ada, session tersimpan |
| U-CHT-04 | Membuat sesi chat baru | 1. Klik "Sesi Baru"                                        | Sesi baru dibuat, riwayat bersih          |
| U-CHT-05 | Limit penggunaan       | 1. Cek jumlah penggunaan                                   | Tampil "X/10 prompts bulan ini"           |
| U-CHT-06 | Limit tercapai         | 1. Gunakan 10 prompt dalam 1 bulan                         | Muncul pesan "Batas bulanan tercapai"     |
| U-CHT-07 | Chat tanpa login       | 1. Logout<br>2. Buka chat                                  | Tidak bisa akses / diarahkan ke login     |

---

## 6. Skenario UAT — Admin (ADMIN)

### 6.1 Login Admin

| Kode     | Skenario               | Langkah Pengujian                                         | Hasil Diharapkan                              |
| -------- | ---------------------- | --------------------------------------------------------- | --------------------------------------------- |
| A-LOG-01 | Login sebagai admin    | 1. Login dengan email admin<br>2. Password admin          | Masuk ke dashboard admin (`/dashboard/admin`) |
| A-LOG-02 | User biasa akses admin | 1. Login sebagai user biasa<br>2. Buka `/dashboard/admin` | Diarahkan ke dashboard user atau error akses  |

### 6.2 Dashboard Admin

| Kode     | Skenario                | Langkah Pengujian          | Hasil Diharapkan                                                   |
| -------- | ----------------------- | -------------------------- | ------------------------------------------------------------------ |
| A-DSH-01 | Melihat dashboard admin | 1. Buka `/dashboard/admin` | Muncul statistik: total pengajuan, total makam, makam terisi, dll. |
| A-DSH-02 | Statistik real-time     | 1. Periksa angka statistik | Angka sesuai dengan data di database                               |
| A-DSH-03 | Grafik aktivitas        | 1. Lihat chart/grafik      | Grafik pengajuan per periode tampil                                |
| A-DSH-04 | Navigasi sidebar        | 1. Klik semua menu sidebar | Semua menu navigasi berfungsi ke halaman masing-masing             |

### 6.3 Validasi Pengajuan

| Kode     | Skenario                           | Langkah Pengujian                                                                                    | Hasil Diharapkan                                               |
| -------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| A-VAL-01 | Melihat daftar pengajuan           | 1. Buka `/dashboard/admin/pengajuan`                                                                 | Muncul semua pengajuan dengan filter status                    |
| A-VAL-02 | Filter status pengajuan            | 1. Klik filter "Menunggu"                                                                            | Hanya pengajuan PENDING tampil                                 |
| A-VAL-03 | Filter "Disetujui"                 | 1. Klik filter "Disetujui"                                                                           | Hanya yang APPROVED tampil                                     |
| A-VAL-04 | Filter "Revisi"                    | 1. Klik filter "Revisi"                                                                              | Hanya yang NEED_REVISION tampil                                |
| A-VAL-05 | Filter "Ditolak"                   | 1. Klik filter "Ditolak"                                                                             | Hanya yang REJECTED tampil                                     |
| A-VAL-06 | Melihat detail pengajuan           | 1. Klik salah satu pengajuan                                                                         | Muncul halaman detail lengkap: info pemohon, almarhum, dokumen |
| A-VAL-07 | Melihat dokumen pengajuan          | 1. Buka detail pengajuan<br>2. Lihat kartu dokumen                                                   | Dokumen KTP, KK, Surat Kematian, Surat RT/RW tampil            |
| A-VAL-08 | Preview dokumen                    | 1. Klik dokumen                                                                                      | Dokumen terbuka (untuk PDF/IMG)                                |
| A-VAL-09 | Menyetujui pengajuan (auto-plot)   | 1. Buka detail pengajuan PENDING<br>2. Pilih "Setujui" dengan alokasi otomatis<br>3. Klik konfirmasi | Pengajuan APPROVED, plot dipilih otomatis, muncul info plot    |
| A-VAL-10 | Menyetujui pengajuan (manual plot) | 1. Pilih "Setujui"<br>2. Pilih blok & nomor plot manual<br>3. Klik konfirmasi                        | Pengajuan APPROVED, plot sesuai pilihan admin                  |
| A-VAL-11 | Menolak pengajuan                  | 1. Pilih "Tolak"<br>2. Isi alasan penolakan<br>3. Konfirmasi                                         | Status REJECTED, alasan tercatat                               |
| A-VAL-12 | Meminta revisi dokumen             | 1. Pilih "Minta Revisi"<br>2. Isi catatan revisi<br>3. Konfirmasi                                    | Status NEED_REVISION, catatan tercatat                         |
| A-VAL-13 | Timeline aktivitas                 | 1. Lihat timeline pada detail                                                                        | Riwayat semua aksi admin muncul di timeline                    |

### 6.4 Manajemen Data Makam

| Kode     | Skenario                  | Langkah Pengujian                                      | Hasil Diharapkan                         |
| -------- | ------------------------- | ------------------------------------------------------ | ---------------------------------------- |
| A-MKM-01 | Melihat data makam        | 1. Buka `/dashboard/admin/makam`                       | Muncul daftar semua makam di TPU Keputih |
| A-MKM-02 | Filter berdasarkan blok   | 1. Pilih filter blok                                   | Hanya makam di blok terpilih tampil      |
| A-MKM-03 | Filter berdasarkan status | 1. Pilih filter status (Tersedia/Terisi)               | Makam dengan status sesuai tampil        |
| A-MKM-04 | Status plot konsisten     | 1. Setuju pengajuan dengan plot X<br>2. Cek data makam | Plot X berubah status jadi OCCUPIED      |
| A-MKM-05 | Mencari makam             | 1. Gunakan search/nomor plot                           | Data makam sesuai pencarian tampil       |

### 6.5 Manajemen Pengguna

| Kode     | Skenario                | Langkah Pengujian                | Hasil Diharapkan                      |
| -------- | ----------------------- | -------------------------------- | ------------------------------------- |
| A-USR-01 | Melihat daftar pengguna | 1. Buka `/dashboard/admin/users` | Tabel semua pengguna terdaftar tampil |
| A-USR-02 | Filter role             | 1. Filter "USER"                 | Hanya user biasa tampil               |
| A-USR-03 | Filter "ADMIN"          | 1. Filter "ADMIN"                | Hanya admin tampil                    |
| A-USR-04 | Cari pengguna           | 1. Ketik nama/email              | Data sesuai pencarian tampil          |

### 6.6 Manajemen Peta TPU

| Kode     | Skenario                    | Langkah Pengujian                   | Hasil Diharapkan                                                   |
| -------- | --------------------------- | ----------------------------------- | ------------------------------------------------------------------ |
| A-PET-01 | Membuka peta admin          | 1. Buka `/dashboard/admin/cemetery` | Peta TPU dengan semua blok & plot tampil. Warna plot sesuai status |
| A-PET-02 | Melihat detail plot         | 1. Klik plot                        | Info: blok, nomor, status, almarhum (jika terisi)                  |
| A-PET-03 | Mode edit poligon           | 1. Masuk mode edit                  | Poligon blok bisa diedit/digeser                                   |
| A-PET-04 | Menyimpan perubahan poligon | 1. Edit poligon<br>2. Simpan        | Poligon tersimpan, peta refresh                                    |

### 6.7 Laporan & Statistik

| Kode     | Skenario                | Langkah Pengujian                  | Hasil Diharapkan                               |
| -------- | ----------------------- | ---------------------------------- | ---------------------------------------------- |
| A-LAP-01 | Membuka halaman laporan | 1. Buka `/dashboard/admin/laporan` | Halaman laporan dengan berbagai metrik         |
| A-LAP-02 | Statistik pemakaman     | 1. Lihat angka dan grafik          | Total makam, terisi, tersedia, kapasitas       |
| A-LAP-03 | Grafik pengajuan        | 1. Lihat grafik                    | Grafik jumlah pengajuan per periode            |
| A-LAP-04 | Distribusi per blok     | 1. Lihat tabel/blok                | Data per blok (kapasitas, terisi, sisa)        |
| A-LAP-05 | Ekspor / cetak laporan  | 1. Klik tombol ekspor              | PDF atau print muncul (bila diimplementasikan) |

### 6.8 Notifikasi

| Kode     | Skenario                   | Langkah Pengujian                        | Hasil Diharapkan                         |
| -------- | -------------------------- | ---------------------------------------- | ---------------------------------------- |
| A-NTF-01 | Membuka halaman notifikasi | 1. Buka `/dashboard/admin/notifications` | Daftar notifikasi tampil                 |
| A-NTF-02 | Notifikasi pengajuan baru  | 1. User submit pengajuan                 | Admin mendapat notifikasi pengajuan baru |
| A-NTF-03 | Notifikasi real-time       | 1. User melakukan aksi                   | Notifikasi muncul (dengan refresh)       |
| A-NTF-04 | Menandai notifikasi dibaca | 1. Klik notifikasi                       | Status berubah jadi sudah dibaca         |
| A-NTF-05 | Notifikasi WhatsApp        | 1. Approve/reject pengajuan              | Cek WhatsApp penerima (bila terdaftar)   |
| A-NTF-06 | Notifikasi Telegram        | 1. Aksi pada pengajuan                   | Cek Telegram admin (bila terdaftar)      |

### 6.9 Pengaturan Profil

| Kode     | Skenario             | Langkah Pengujian                            | Hasil Diharapkan                            |
| -------- | -------------------- | -------------------------------------------- | ------------------------------------------- |
| A-STG-01 | Melihat profil       | 1. Buka `/dashboard/admin/pengaturan`        | Data profil admin tampil                    |
| A-STG-02 | Update profil        | 1. Edit nama/nomor telepon                   | Data berhasil diperbarui                    |
| A-STG-03 | Ganti password       | 1. Isi password lama + baru<br>2. Konfirmasi | Password berhasil diubah                    |
| A-STG-04 | Ganti password salah | 1. Isi password lama salah                   | Error "Password lama tidak sesuai"          |
| A-STG-05 | Integrasi Telegram   | 1. Isi Telegram Chat ID                      | Notifikasi Telegram terkirim ke ID tersebut |

---

## 7. Formulir UAT Lengkap

### 7.1 Form Identitas UAT

```
Nama Penguji      : ___________________________
Jabatan           : ___________________________
Tanggal Pengujian : ___________________________
Lokasi            : ___________________________
Peramban          : ☐ Chrome  ☐ Firefox  ☐ Edge  ☐ Safari
Resolusi Layar    : ___________________________
```

### 7.2 Lembar Uji

| Kode     | Fitur           | Skenario                | Langkah   | Hasil? (✓/✗) | Catatan |
| -------- | --------------- | ----------------------- | --------- | ------------ | ------- |
| U-REG-01 | Registrasi      | Registrasi berhasil     | 3 langkah | ☐ ✓ ☐ ✗      |         |
| U-REG-02 | Registrasi      | Email duplikat          | 2 langkah | ☐ ✓ ☐ ✗      |         |
| U-REG-03 | Registrasi      | Password tidak sama     | 2 langkah | ☐ ✓ ☐ ✗      |         |
| U-REG-04 | Registrasi      | Email invalid           | 2 langkah | ☐ ✓ ☐ ✗      |         |
| U-LOG-01 | Login           | Login berhasil          | 3 langkah | ☐ ✓ ☐ ✗      |         |
| U-LOG-02 | Login           | Password salah          | 2 langkah | ☐ ✓ ☐ ✗      |         |
| U-LOG-03 | Login           | Email tidak terdaftar   | 2 langkah | ☐ ✓ ☐ ✗      |         |
| U-LOG-04 | Login           | Akses tanpa login       | 1 langkah | ☐ ✓ ☐ ✗      |         |
| U-LOG-05 | Login           | Reset password          | 3 langkah | ☐ ✓ ☐ ✗      |         |
| U-LOG-06 | Login           | Logout                  | 2 langkah | ☐ ✓ ☐ ✗      |         |
| U-DSH-01 | Dashboard       | Melihat dashboard       | 2 langkah | ☐ ✓ ☐ ✗      |         |
| U-DSH-02 | Dashboard       | Tombol pengajuan baru   | 1 langkah | ☐ ✓ ☐ ✗      |         |
| U-DSH-03 | Dashboard       | Tombol lihat status     | 1 langkah | ☐ ✓ ☐ ✗      |         |
| U-PGN-01 | Pengajuan       | Membuka form baru       | 2 langkah | ☐ ✓ ☐ ✗      |         |
| U-PGN-02 | Pengajuan       | Daftar pengajuan        | 1 langkah | ☐ ✓ ☐ ✗      |         |
| U-PGN-03 | Pengajuan       | Isi form lengkap        | 4 langkah | ☐ ✓ ☐ ✗      |         |
| U-PGN-04 | Pengajuan       | Upload KTP              | 2 langkah | ☐ ✓ ☐ ✗      |         |
| U-PGN-05 | Pengajuan       | Upload KK               | 2 langkah | ☐ ✓ ☐ ✗      |         |
| U-PGN-06 | Pengajuan       | Upload Surat Kematian   | 2 langkah | ☐ ✓ ☐ ✗      |         |
| U-PGN-07 | Pengajuan       | Upload Surat RT/RW      | 2 langkah | ☐ ✓ ☐ ✗      |         |
| U-PGN-08 | Pengajuan       | Submit lengkap          | 2 langkah | ☐ ✓ ☐ ✗      |         |
| U-PGN-09 | Pengajuan       | Submit tanpa dokumen    | 2 langkah | ☐ ✓ ☐ ✗      |         |
| U-PGN-10 | Pengajuan       | Submit tanpa data wajib | 2 langkah | ☐ ✓ ☐ ✗      |         |
| U-PGN-11 | Pengajuan       | File > 2MB              | 2 langkah | ☐ ✓ ☐ ✗      |         |
| U-PGN-12 | Pengajuan       | Tipe file salah         | 2 langkah | ☐ ✓ ☐ ✗      |         |
| U-PGN-13 | Pengajuan       | Detail status           | 2 langkah | ☐ ✓ ☐ ✗      |         |
| U-PGN-14 | Pengajuan       | Status APPROVED         | 1 langkah | ☐ ✓ ☐ ✗      |         |
| U-PGN-15 | Pengajuan       | Status NEED_REVISION    | 1 langkah | ☐ ✓ ☐ ✗      |         |
| U-PGN-16 | Pengajuan       | Upload revisi           | 3 langkah | ☐ ✓ ☐ ✗      |         |
| U-PGN-17 | Pengajuan       | Status REJECTED         | 1 langkah | ☐ ✓ ☐ ✗      |         |
| U-MAP-01 | Peta            | Membuka peta publik     | 1 langkah | ☐ ✓ ☐ ✗      |         |
| U-MAP-02 | Peta            | Melihat blok            | 2 langkah | ☐ ✓ ☐ ✗      |         |
| U-MAP-03 | Peta            | Warna plot              | 1 langkah | ☐ ✓ ☐ ✗      |         |
| U-MAP-04 | Peta            | Klik plot detail        | 2 langkah | ☐ ✓ ☐ ✗      |         |
| U-MAP-05 | Peta            | Navigasi zoom/pan       | 2 langkah | ☐ ✓ ☐ ✗      |         |
| U-MAP-06 | Peta            | Tab "Lihat Peta"        | 1 langkah | ☐ ✓ ☐ ✗      |         |
| U-MAP-07 | Peta            | Tab "Lihat Daftar"      | 1 langkah | ☐ ✓ ☐ ✗      |         |
| U-CHT-01 | Chatbot         | Membuka chatbot         | 2 langkah | ☐ ✓ ☐ ✗      |         |
| U-CHT-02 | Chatbot         | Kirim pertanyaan        | 2 langkah | ☐ ✓ ☐ ✗      |         |
| U-CHT-03 | Chatbot         | Riwayat tersimpan       | 2 langkah | ☐ ✓ ☐ ✗      |         |
| U-CHT-04 | Chatbot         | Sesi baru               | 1 langkah | ☐ ✓ ☐ ✗      |         |
| U-CHT-05 | Chatbot         | Limit penggunaan        | 1 langkah | ☐ ✓ ☐ ✗      |         |
| U-CHT-06 | Chatbot         | Limit tercapai          | 1 langkah | ☐ ✓ ☐ ✗      |         |
| U-CHT-07 | Chatbot         | Tanpa login             | 2 langkah | ☐ ✓ ☐ ✗      |         |
| A-LOG-01 | Admin Login     | Login admin             | 2 langkah | ☐ ✓ ☐ ✗      |         |
| A-LOG-02 | Admin Login     | User akses admin        | 2 langkah | ☐ ✓ ☐ ✗      |         |
| A-DSH-01 | Admin Dashboard | Melihat dashboard       | 1 langkah | ☐ ✓ ☐ ✗      |         |
| A-DSH-02 | Admin Dashboard | Statistik real-time     | 1 langkah | ☐ ✓ ☐ ✗      |         |
| A-DSH-03 | Admin Dashboard | Grafik aktivitas        | 1 langkah | ☐ ✓ ☐ ✗      |         |
| A-DSH-04 | Admin Dashboard | Navigasi sidebar        | 6 langkah | ☐ ✓ ☐ ✗      |         |
| A-VAL-01 | Validasi        | Daftar pengajuan        | 1 langkah | ☐ ✓ ☐ ✗      |         |
| A-VAL-02 | Validasi        | Filter PENDING          | 1 langkah | ☐ ✓ ☐ ✗      |         |
| A-VAL-03 | Validasi        | Filter APPROVED         | 1 langkah | ☐ ✓ ☐ ✗      |         |
| A-VAL-04 | Validasi        | Filter NEED_REVISION    | 1 langkah | ☐ ✓ ☐ ✗      |         |
| A-VAL-05 | Validasi        | Filter REJECTED         | 1 langkah | ☐ ✓ ☐ ✗      |         |
| A-VAL-06 | Validasi        | Detail pengajuan        | 1 langkah | ☐ ✓ ☐ ✗      |         |
| A-VAL-07 | Validasi        | Lihat dokumen           | 2 langkah | ☐ ✓ ☐ ✗      |         |
| A-VAL-08 | Validasi        | Preview dokumen         | 1 langkah | ☐ ✓ ☐ ✗      |         |
| A-VAL-09 | Validasi        | Setujui auto-plot       | 3 langkah | ☐ ✓ ☐ ✗      |         |
| A-VAL-10 | Validasi        | Setujui manual plot     | 3 langkah | ☐ ✓ ☐ ✗      |         |
| A-VAL-11 | Validasi        | Tolak pengajuan         | 3 langkah | ☐ ✓ ☐ ✗      |         |
| A-VAL-12 | Validasi        | Minta revisi            | 3 langkah | ☐ ✓ ☐ ✗      |         |
| A-VAL-13 | Validasi        | Timeline aktivitas      | 1 langkah | ☐ ✓ ☐ ✗      |         |
| A-MKM-01 | Makam           | Data makam              | 1 langkah | ☐ ✓ ☐ ✗      |         |
| A-MKM-02 | Makam           | Filter blok             | 1 langkah | ☐ ✓ ☐ ✗      |         |
| A-MKM-03 | Makam           | Filter status           | 1 langkah | ☐ ✓ ☐ ✗      |         |
| A-MKM-04 | Makam           | Status plot konsisten   | 2 langkah | ☐ ✓ ☐ ✗      |         |
| A-MKM-05 | Makam           | Cari makam              | 1 langkah | ☐ ✓ ☐ ✗      |         |
| A-USR-01 | Pengguna        | Daftar pengguna         | 1 langkah | ☐ ✓ ☐ ✗      |         |
| A-USR-02 | Pengguna        | Filter USER             | 1 langkah | ☐ ✓ ☐ ✗      |         |
| A-USR-03 | Pengguna        | Filter ADMIN            | 1 langkah | ☐ ✓ ☐ ✗      |         |
| A-USR-04 | Pengguna        | Cari pengguna           | 1 langkah | ☐ ✓ ☐ ✗      |         |
| A-PET-01 | Peta Admin      | Peta TPU                | 1 langkah | ☐ ✓ ☐ ✗      |         |
| A-PET-02 | Peta Admin      | Detail plot             | 1 langkah | ☐ ✓ ☐ ✗      |         |
| A-PET-03 | Peta Admin      | Edit poligon            | 1 langkah | ☐ ✓ ☐ ✗      |         |
| A-PET-04 | Peta Admin      | Simpan poligon          | 2 langkah | ☐ ✓ ☐ ✗      |         |
| A-LAP-01 | Laporan         | Halaman laporan         | 1 langkah | ☐ ✓ ☐ ✗      |         |
| A-LAP-02 | Laporan         | Statistik               | 1 langkah | ☐ ✓ ☐ ✗      |         |
| A-LAP-03 | Laporan         | Grafik pengajuan        | 1 langkah | ☐ ✓ ☐ ✗      |         |
| A-LAP-04 | Laporan         | Distribusi blok         | 1 langkah | ☐ ✓ ☐ ✗      |         |
| A-LAP-05 | Laporan         | Ekspor laporan          | 1 langkah | ☐ ✓ ☐ ✗      |         |
| A-NTF-01 | Notifikasi      | Halaman notifikasi      | 1 langkah | ☐ ✓ ☐ ✗      |         |
| A-NTF-02 | Notifikasi      | Notif pengajuan baru    | 2 langkah | ☐ ✓ ☐ ✗      |         |
| A-NTF-03 | Notifikasi      | Real-time               | 2 langkah | ☐ ✓ ☐ ✗      |         |
| A-NTF-04 | Notifikasi      | Tandai dibaca           | 1 langkah | ☐ ✓ ☐ ✗      |         |
| A-NTF-05 | Notifikasi      | WhatsApp                | 2 langkah | ☐ ✓ ☐ ✗      |         |
| A-NTF-06 | Notifikasi      | Telegram                | 2 langkah | ☐ ✓ ☐ ✗      |         |
| A-STG-01 | Pengaturan      | Lihat profil            | 1 langkah | ☐ ✓ ☐ ✗      |         |
| A-STG-02 | Pengaturan      | Update profil           | 2 langkah | ☐ ✓ ☐ ✗      |         |
| A-STG-03 | Pengaturan      | Ganti password benar    | 3 langkah | ☐ ✓ ☐ ✗      |         |
| A-STG-04 | Pengaturan      | Ganti password salah    | 2 langkah | ☐ ✓ ☐ ✗      |         |
| A-STG-05 | Pengaturan      | Integrasi Telegram      | 2 langkah | ☐ ✓ ☐ ✗      |         |

### 7.3 Catatan Defect

| No  | Kode UAT | Deskripsi Masalah | Severity                   | Status                    |
| --- | -------- | ----------------- | -------------------------- | ------------------------- |
| 1   |          |                   | ☐ Rendah ☐ Sedang ☐ Tinggi | ☐ Open ☐ Fixed ☐ Verified |
| 2   |          |                   | ☐ Rendah ☐ Sedang ☐ Tinggi | ☐ Open ☐ Fixed ☐ Verified |
| 3   |          |                   | ☐ Rendah ☐ Sedang ☐ Tinggi | ☐ Open ☐ Fixed ☐ Verified |

> **Severity:**
>
> - **Rendah** — Masalah kosmetik / minor, tidak menghambat fungsi utama
> - **Sedang** — Fungsi berjalan tapi ada kendala, ada workaround
> - **Tinggi** — Fungsi utama tidak berjalan, tidak ada workaround

---

## 8. Rangkuman

### 8.1 Statistik Pengujian

| Metrik             | Jumlah                 |
| ------------------ | ---------------------- |
| Total Skenario Uji | 84                     |
| ✅ Lulus           | {{jumlah_lulus}}       |
| ❌ Gagal           | {{jumlah_gagal}}       |
| ⚠️ Tidak Diuji     | {{jumlah_tidak_diuji}} |
| **Pass Rate**      | **{{pass_rate}}%**     |

### 8.2 Ringkasan Defect

| Severity | Jumlah            | Status                   |
| -------- | ----------------- | ------------------------ |
| Tinggi   | {{defect_tinggi}} | {{defect_tinggi_status}} |
| Sedang   | {{defect_sedang}} | {{defect_sedang_status}} |
| Rendah   | {{defect_rendah}} | {{defect_rendah_status}} |

### 8.3 Fitur Utama (25 Fitur)

| Modul                        | Jumlah Fitur |
| ---------------------------- | ------------ |
| Autentikasi & Manajemen Akun | 5            |
| Dashboard Pengguna           | 1            |
| Pengajuan Pemakaman          | 2            |
| Dokumen                      | 1            |
| Peta Makam Publik            | 1            |
| Chatbot AI                   | 1            |
| Dashboard Admin              | 1            |
| Validasi Pengajuan           | 3            |
| Manajemen Makam              | 3            |
| Manajemen Pengguna           | 1            |
| Peta & Poligon Admin         | 2            |
| Laporan & Statistik          | 1            |
| Notifikasi                   | 3            |
| Pengaturan Profil            | 1            |

### 8.4 Rekomendasi

- [ ] **DITERIMA** — Semua skenario kritis berjalan baik, siap untuk production
- [ ] **DITERIMA DENGAN CATATAN** — Masalah minor ditemukan, bisa diperbaiki setelah rilis
- [ ] **DITOLAK** — Ditemukan defect kritis yang harus diperbaiki sebelum rilis

---

## 9. Tanda Tangan

Dengan ini menyatakan bahwa aplikasi **Smart Cemetery** telah diuji dan:

```
☐ DITERIMA
☐ DITERIMA DENGAN CATATAN
☐ DITOLAK
```

| Peran                     | Nama | Tanda Tangan | Tanggal |
| ------------------------- | ---- | ------------ | ------- |
| **Penguji**               |      |              |         |
| **Project Manager / PIC** |      |              |         |
| **Developer**             |      |              |         |

---

> **Dokumen UAT ini dibuat berdasarkan implementasi aktual aplikasi Smart Cemetery per Juni 2026.**
>
> _© 2026 Dinas Lingkungan Hidup Kota Surabaya — Smart Cemetery System_
