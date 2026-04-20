import { supabaseAdmin } from "./supabase";

export async function authorizeUser(email: string, password: string) {
  // Masuk menggunakan Supabase Auth SDK
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) return null;

  // Ambil metadata profil dari tabel public.profiles menggunakan filter yang benar
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  return {
    id: data.user.id,
    email: data.user.email,
    name: profile?.full_name || data.user.email,
    role: profile?.role || 'USER',
  };
}
