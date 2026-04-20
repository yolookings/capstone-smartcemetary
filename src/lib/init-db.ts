import pool from './db';

export async function cleanupAndInitDb() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Drop old Prisma tables (Capitalized or single-named versions)
    await client.query(`DROP TABLE IF EXISTS "ChatLog" CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS "Dokumen" CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS "Makam" CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS "Pengajuan" CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS "User" CASCADE;`);

    // Ensure we are using lowercase table names for our native implementation
    
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT,
        role TEXT DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Pengajuan table
    await client.query(`
      CREATE TABLE IF NOT EXISTS pengajuan (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'REVISION', 'APPROVED', 'REJECTED')),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Makam table
    await client.query(`
      CREATE TABLE IF NOT EXISTS makam (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        pengajuan_id UUID REFERENCES pengajuan(id) ON DELETE SET NULL,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Added user_id for privacy
        blok TEXT,
        nomor TEXT,
        deceased_name TEXT,
        deceased_date DATE,
        applicant_name TEXT,
        applicant_phone TEXT,
        relationship TEXT,
        status TEXT DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'RESERVED', 'OCCUPIED')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Dokumen table
    await client.query(`
      CREATE TABLE IF NOT EXISTS dokumen (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        pengajuan_id UUID REFERENCES pengajuan(id) ON DELETE CASCADE,
        type TEXT CHECK (type IN ('KTP', 'KK', 'SURAT_KEMATIAN')),
        file_url TEXT NOT NULL,
        file_key TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ChatLog table
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        message TEXT NOT NULL,
        response TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query('COMMIT');
    console.log('Database cleaned and initialized successfully');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error cleaning/initializing database', e);
  } finally {
    client.release();
  }
}
