"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export default function Header() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        setUser(authUser);
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();
        setProfile(profileData);
      }
    };

    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (session) {
        setUser(session.user);
        supabase.from('profiles').select('*').eq('id', session.user.id).single()
          .then(({ data }: { data: any }) => setProfile(data));
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    router.push('/');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="container flex h-20 items-center justify-between mx-auto px-4 lg:px-12">
        <Link href="/" className="flex items-center space-x-2">
          <span className="font-manrope font-extrabold text-2xl text-primary tracking-tight">Smart Cemetery</span>
        </Link>
        
        <nav className="hidden md:flex gap-8 items-center text-secondary font-medium text-sm">
          <Link href="/" className="hover:text-primary transition-colors font-bold uppercase tracking-widest text-[10px]">Beranda</Link>
          <Link href="/makam" className="hover:text-primary transition-colors font-bold uppercase tracking-widest text-[10px]">Peta Makam</Link>
          {user && (
            <>
              <Link href="/dashboard/pengajuan/baru" className="hover:text-primary transition-colors font-bold uppercase tracking-widest text-[10px]">Daftar Makam</Link>
              <Link href="/dashboard/pengajuan" className="hover:text-primary transition-colors font-bold uppercase tracking-widest text-[10px]">Status Pengajuan</Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="relative">
              <button 
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border hover:bg-slate-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border py-1">
                  <div className="px-4 py-2 border-b">
                    <p className="text-sm font-medium text-slate-900">{profile?.full_name || 'User'}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                    {profile?.role === 'ADMIN' && (
                      <span className="inline-block mt-1 text-xs bg-emerald-600 text-white px-2 py-0.5 rounded">Admin</span>
                    )}
                  </div>
                  <Link href="/dashboard" className="block w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
                    Dashboard
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link 
              href="/auth/login" 
              className="bg-primary text-white px-8 py-2.5 rounded-full text-xs font-bold shadow-sm hover:bg-primary-dark transition-all"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}