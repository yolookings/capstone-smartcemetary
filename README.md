# Smart Cemetery

Sistem Manajemen Pemakaman Digital berbasis Web.

## Fitur Utama
- **Pendaftaran Online**: Pengguna dapat mendaftarkan makam secara mandiri.
- **Admin Dashboard**: Verifikasi dokumen dan alokasi lokasi makam oleh admin.
- **AI Chatbot (RAG)**: Bantuan otomatis mengenai prosedur dan regulasi pemakaman.
- **Keamanan Dokumen**: Penggunaan UUID untuk nama file dan Signed URL untuk akses terbatas.
- **Role-Based Access Control**: Pembedaan fitur antara User dan Admin.

## Tech Stack
- **Frontend**: Next.js 15 (React), Tailwind CSS, Lucide Icons.
- **Backend**: Next.js API Routes.
- **Database**: PostgreSQL with Prisma ORM.
- **Auth**: NextAuth.js with Credentials & Bcrypt.
- **Cloud Storage**: AWS S3 (Compatible SDK).

## Cara Menjalankan
1. Clone repositori ini.
2. Install dependensi: `npm install`.
3. Konfigurasi `.env` dengan variabel berikut:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/smart_cemetery"
   NEXTAUTH_SECRET="your-secret"
   AWS_ACCESS_KEY_ID="your-key"
   AWS_SECRET_ACCESS_KEY="your-secret"
   AWS_REGION="your-region"
   AWS_S3_BUCKET_NAME="your-bucket"
   ```
4. Jalankan migrasi database: `npx prisma migrate dev`.
5. Jalankan seed data: `npx prisma db seed`.
6. Jalankan aplikasi: `npm run dev`.

## Data Login Default (Setelah Seed)
- **Admin**: admin@smartcemetery.com / admin123
