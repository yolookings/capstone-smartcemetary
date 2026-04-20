import 'dotenv/config'; // Load environment variables from .env
import { cleanupAndInitDb } from '../src/lib/init-db';
import bcrypt from 'bcrypt';
import pool from '../src/lib/db';

async function seed() {
  await cleanupAndInitDb();
  
  const client = await pool.connect();
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Seed Admin
    await client.query(`
      INSERT INTO users (email, password, name, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING
    `, ['admin@smartcemetery.com', hashedPassword, 'Super Admin', 'ADMIN']);

    // Seed some available graves
    const blocks = ['A', 'B', 'C', 'D'];
    for (const block of blocks) {
      for (let i = 1; i <= 20; i++) {
        await client.query(`
          INSERT INTO makam (blok, nomor, status)
          VALUES ($1, $2, $3)
        `, [block, i.toString(), 'AVAILABLE']);
      }
    }
    
    console.log('Seeding completed successfully on Supabase');
  } catch (e) {
    console.error('Seeding failed:', e);
  } finally {
    client.release();
    process.exit(0);
  }
}

seed();
