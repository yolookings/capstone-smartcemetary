"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { Menu, X, Home, MapPin, FileText, User, LogOut, LayoutDashboard } from "lucide-react";

export default function Header() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = profile?.role === "ADMIN";
  const isUser = !!user && !isAdmin;

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        setUser(authUser);
        const { data: profileData } = await supabase.from("profiles").select("*").eq("id", authUser.id).single();
        setProfile(profileData);
      } else {
        setUser(null);
        setProfile(null);
      }
    };
    fetchUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (session) {
        setUser(session.user);
        supabase.from("profiles").select("*").eq("id", session.user.id).single().then(({ data }: { data: any }) => setProfile(data));
      } else {
        setUser(null);
        setProfile(null);
      }
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    setDrawerOpen(false);
    document.body.dataset.drawerOpen = "false";
  }, [pathname]);

  useEffect(() => {
    document.body.dataset.drawerOpen = drawerOpen ? "true" : "false";
  }, [drawerOpen]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    router.push("/");
    router.refresh();
  };

  const navLinkClass = "font-medium uppercase tracking-widest text-[10px] text-secondary transition-colors duration-200 hover:font-bold hover:text-primary";

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-4 lg:px-12">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo-smartcemetary.png" alt="Smart Cemetery" width={44} height={44} className="h-11 w-11 object-contain" priority />
            <span className="font-manrope font-extrabold text-xl text-primary tracking-tight hidden sm:block">Smart Cemetery</span>
          </Link>
          <nav className="hidden lg:flex items-center gap-8">
            <Link href="/" className={navLinkClass}>Beranda</Link>
            <Link href="/makam" className={navLinkClass}>Peta Makam</Link>
            {isAdmin && (
              <Link href="/dashboard/admin" className={navLinkClass}>Dashboard</Link>
            )}
            {isUser && (
              <>
                <Link href="/dashboard/pengajuan/baru" className={navLinkClass}>Daftar Makam</Link>
                <Link href="/dashboard/pengajuan" className={navLinkClass}>Status Pengajuan</Link>
              </>
            )}
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <div className="relative hidden lg:block">
                <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 px-3 py-1.5 rounded-full border hover:bg-slate-50">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">{user.email?.charAt(0).toUpperCase()}</div>
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border py-1 z-50">
                    <div className="px-4 py-2 border-b">
                      <p className="text-sm font-medium text-slate-900">{profile?.full_name || "User"}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                      {isAdmin && <span className="inline-block mt-1 text-xs bg-emerald-600 text-white px-2 py-0.5 rounded">Admin</span>}
                    </div>
                    {isAdmin && <Link href="/dashboard/admin" className="block w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Dashboard Admin</Link>}
                    {isUser && <Link href="/dashboard" className="block w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Dashboard</Link>}
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Logout</button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/auth/login" className="hidden lg:block bg-primary text-white px-6 py-2 text-xs font-bold rounded-full hover:bg-primary-dark">Login</Link>
            )}
            <button onClick={() => setDrawerOpen(true)} className="lg:hidden p-2 text-slate-600 hover:bg-slate-50 rounded-lg"><Menu size={24} /></button>
          </div>
        </div>
      </header>

      {drawerOpen && <div className="fixed inset-0 bg-black/50 z-50 lg:hidden" onClick={() => setDrawerOpen(false)} />}
      <div className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white z-50 transform transition-transform duration-300 lg:hidden ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <span className="font-bold text-lg text-primary">Menu</span>
            <button onClick={() => setDrawerOpen(false)} className="p-2 text-slate-400"><X size={24} /></button>
          </div>
          {user ? (
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center text-lg font-bold">{user.email?.charAt(0).toUpperCase()}</div>
                <div>
                  <p className="font-bold text-slate-900">{profile?.full_name || "User"}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                  {isAdmin && <span className="inline-block mt-1 text-xs bg-primary text-white px-2 py-0.5">Admin</span>}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <p className="text-sm text-slate-600 mb-3">Silakan login untuk akses penuh</p>
              <Link href="/auth/login" onClick={() => setDrawerOpen(false)} className="block w-full bg-primary text-white py-2.5 text-center text-sm font-bold rounded-lg">Login / Sign In</Link>
            </div>
          )}
          <nav className="flex-1 overflow-y-auto py-2">
            <div className="px-4 py-2"><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Menu Utama</p></div>
            <Link href="/" onClick={() => setDrawerOpen(false)} className="block py-3 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"><div className="flex items-center gap-3"><Home size={18} className="text-slate-400" />Beranda</div></Link>
            <Link href="/makam" onClick={() => setDrawerOpen(false)} className="block py-3 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"><div className="flex items-center gap-3"><MapPin size={18} className="text-slate-400" />Peta Makam</div></Link>
            {user && (
              <>
                <div className="px-4 py-2 mt-2"><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Akun Saya</p></div>
                {isAdmin ? (
                  <Link href="/dashboard/admin" onClick={() => setDrawerOpen(false)} className="block py-3 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"><div className="flex items-center gap-3"><LayoutDashboard size={18} className="text-slate-400" />Dashboard Admin</div></Link>
                ) : (
                  <>
                    <Link href="/dashboard" onClick={() => setDrawerOpen(false)} className="block py-3 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"><div className="flex items-center gap-3"><User size={18} className="text-slate-400" />Dashboard</div></Link>
                    <Link href="/dashboard/pengajuan/baru" onClick={() => setDrawerOpen(false)} className="block py-3 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"><div className="flex items-center gap-3"><FileText size={18} className="text-slate-400" />Daftar Makam</div></Link>
                    <Link href="/dashboard/pengajuan" onClick={() => setDrawerOpen(false)} className="block py-3 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"><div className="flex items-center gap-3"><FileText size={18} className="text-slate-400" />Status Pengajuan</div></Link>
                  </>
                )}
              </>
            )}
          </nav>
          <div className="border-t border-slate-100 p-4">
            {user ? (
              <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-medium text-red-600 w-full py-2 hover:bg-red-50 rounded-lg px-3"><LogOut size={18} />Logout</button>
            ) : (
              <Link href="/auth/register" onClick={() => setDrawerOpen(false)} className="block w-full border border-primary text-primary py-2.5 text-center text-sm font-bold rounded-lg hover:bg-slate-50">Daftar Sekarang</Link>
            )}
          </div>
          <div className="p-4 border-t border-slate-100 bg-slate-50"><p className="text-xs text-slate-400 text-center">© 2026 Smart Cemetery</p></div>
        </div>
      </div>
    </>
  );
}