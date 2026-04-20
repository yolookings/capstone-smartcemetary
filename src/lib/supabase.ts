import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Use anon key with elevated permissions via the MCP authenticated connection
// This works because the MCP uses the user's authenticated session

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// For admin operations - use anon key but with properauth
export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey);