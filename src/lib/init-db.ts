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

    // Makam table (with plot_id for normalized allocation)
    await client.query(`
      CREATE TABLE IF NOT EXISTS makam (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        pengajuan_id UUID REFERENCES pengajuan(id) ON DELETE SET NULL,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        plot_id UUID,
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

    // Cemeteries table
    await client.query(`
      CREATE TABLE IF NOT EXISTS cemeteries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE,
        address TEXT,
        description TEXT,
        map_config JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Cemetery blocks table (with polygon column for geographic boundaries)
    await client.query(`
      CREATE TABLE IF NOT EXISTS cemetery_blocks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cemetery_id UUID NOT NULL REFERENCES cemeteries(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        code TEXT NOT NULL,
        capacity INTEGER NOT NULL DEFAULT 0,
        map_coords JSONB DEFAULT '{}'::jsonb,
        polygon JSONB DEFAULT '{}'::jsonb,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(cemetery_id, code)
      );
    `);

    // Migration: add polygon column if missing (for existing DBs)
    await client.query(`
      ALTER TABLE cemetery_blocks
      ADD COLUMN IF NOT EXISTS polygon JSONB DEFAULT '{}'::jsonb;
    `);

    // Cemetery plots table
    await client.query(`
      CREATE TABLE IF NOT EXISTS cemetery_plots (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        block_id UUID NOT NULL REFERENCES cemetery_blocks(id) ON DELETE CASCADE,
        plot_number TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'AVAILABLE' 
          CHECK (status IN ('AVAILABLE', 'RESERVED', 'OCCUPIED')),
        map_coords JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(block_id, plot_number)
      );
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_cemetery_blocks_cemetery ON cemetery_blocks(cemetery_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_cemetery_blocks_sort ON cemetery_blocks(sort_order);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_cemetery_plots_block ON cemetery_plots(block_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_cemetery_plots_status ON cemetery_plots(status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_makam_plot_id ON makam(plot_id);`);

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

    // Chat usage table for rate limiting (10 prompts/user/month)
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_usage (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        identifier TEXT NOT NULL,
        identifier_type TEXT NOT NULL CHECK (identifier_type IN ('user', 'ip')),
        usage_count INTEGER DEFAULT 0,
        month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
        year INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (identifier, month, year)
      );
    `);

    // Notifications table for admin alerts
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type TEXT NOT NULL CHECK (type IN ('pengajuan', 'revision', 'approved', 'rejected', 'system')),
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        pengajuan_id UUID REFERENCES pengajuan(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Indexes for notifications
    await client.query(`CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);`);

    // Chat sessions table for chatbot history
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        ip_hash TEXT,
        title TEXT,
        last_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Chat messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
        role TEXT NOT NULL CHECK (role IN ('user', 'ai')),
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Indexes for chat tables
    await client.query(`CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_chat_sessions_ip ON chat_sessions(ip_hash);`);

    // WhatsApp Logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        pengajuan_id UUID REFERENCES pengajuan(id) ON DELETE SET NULL,
        recipient_number TEXT NOT NULL,
        template_name TEXT NOT NULL,
        payload JSONB DEFAULT '{}'::jsonb,
        status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
        error_message TEXT,
        api_response JSONB DEFAULT '{}'::jsonb,
        sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Indexes for whatsapp_logs
    await client.query(`CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_pengajuan ON whatsapp_logs(pengajuan_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_status ON whatsapp_logs(status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_sent ON whatsapp_logs(sent_at DESC);`);

    await client.query('COMMIT');
    console.log('Database cleaned and initialized successfully');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error cleaning/initializing database', e);
  } finally {
    client.release();
  }
}
