const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  console.log("Database URL:", process.env.DATABASE_URL);
  console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);

  // 1. Test PostgreSQL direct connection
  if (process.env.DATABASE_URL) {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('supabase') || process.env.DATABASE_URL.includes('neon.tech') 
        ? { rejectUnauthorized: false } 
        : false,
    });

    try {
      await client.connect();
      console.log("✅ PostgreSQL direct connection successful!");
      const res = await client.query('SELECT NOW()');
      console.log("PG Query Result:", res.rows[0]);
      await client.end();
    } catch (err) {
      console.error("❌ PostgreSQL direct connection failed:", err.message);
    }
  } else {
    console.log("⚠️ No DATABASE_URL found");
  }

  // 2. Test Supabase JS Client
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const { data, error } = await supabase.from('makam').select('id').limit(1);
    if (error) {
      console.error("❌ Supabase JS query failed:", error.message);
    } else {
      console.log("✅ Supabase JS query successful! Data:", data);
    }
  } catch (err) {
    console.error("❌ Supabase JS fetch failed:", err.message);
  }

  // 3. Test Supabase REST API via native fetch
  try {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/makam?select=id&limit=1`;
    const headers = {
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
    };
    const res = await fetch(url, { headers });
    console.log("Supabase REST API status:", res.status);
    if (res.ok) {
      const data = await res.json();
      console.log("✅ Supabase REST API query successful! Data:", data);
    } else {
      const text = await res.text();
      console.error("❌ Supabase REST API failed status:", res.status, text);
    }
  } catch (err) {
    console.error("❌ Supabase REST API fetch failed:", err.message);
  }
}

testConnection();
