import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
  }
});

export async function getServerSession() {
  const cookieStore = await cookies();
  
  const accessToken = cookieStore.get('sb-access-token')?.value;
  const refreshToken = cookieStore.get('sb-refresh-token')?.value;
  const sbNonce = cookieStore.get('sb-nonce')?.value;
  
  if (!accessToken) {
    return { user: null, session: null };
  }
  
  const { data: { session }, error } = await supabaseAdmin.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken || accessToken,
  });
  
  if (error || !session) {
    return { user: null, session: null };
  }
  
  return { user: session.user, session };
}

export async function getCurrentUser() {
  const { user } = await getServerSession();
  
  if (!user) {
    return null;
  }
  
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  return {
    ...user,
    role: profile?.role || 'USER',
    full_name: profile?.full_name,
  };
}

export async function isAdmin() {
  const user = await getCurrentUser();
  return user?.role === 'ADMIN';
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error || !data.session) {
    return { session: null, error };
  }
  
  return { session: data.session, error: null };
}

export async function signOut() {
  const { error } = await supabaseAdmin.auth.signOut();
  return { error };
}
