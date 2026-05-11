"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useSupabase } from "@/components/providers";

export default function DashboardHeader() {
  const supabase = useSupabase();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setUser(session.user);
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        setProfile(profileData);
      }
      setLoading(false);
    };

    fetchUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single()
          .then(({ data }) => setProfile(data));
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMobileMenuOpen(false);
    window.location.href = "/auth/login";
  };

  if (loading)
    return (
      <div className="h-16 bg-white border-b flex items-center px-4">
        <div className="animate-pulse bg-slate-200 h-8 w-32 rounded"></div>
      </div>
    );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-14 items-center justify-between px-4 md:h-16 lg:px-12">
        <Link
          href={profile?.role === "ADMIN" ? "/dashboard/admin" : "/dashboard"}
          className="flex items-center space-x-2"
        >
          <span className="font-manrope text-lg font-extrabold tracking-tight text-primary md:text-xl">
            Smart Cemetery
          </span>
        </Link>

        <div className="flex items-center gap-2 md:gap-4">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((current) => !current)}
            className="inline-flex items-center justify-center rounded-full border p-2 text-slate-700 hover:bg-slate-50 md:hidden cursor-pointer"
            aria-label={mobileMenuOpen ? "Tutup menu" : "Buka menu"}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 rounded-full border px-2 py-1.5 transition-colors hover:bg-slate-50 md:px-3 cursor-pointer"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-white">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <span className="hidden text-sm text-slate-600 sm:block">
                  {user.email}
                </span>
                <svg
                  className="hidden h-4 w-4 text-slate-400 md:block"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-1">
                  <div className="px-4 py-2 border-b">
                    <p className="text-sm font-medium text-slate-900">
                      {profile?.full_name || "User"}
                    </p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                    {profile?.role === "ADMIN" && (
                      <span className="inline-block mt-1 text-xs bg-primary text-white px-2 py-0.5 rounded">
                        Admin
                      </span>
                    )}
                  </div>
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
              className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-primary-dark md:px-6 cursor-pointer"
            >
              Login
            </Link>
          )}
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t bg-white/95 px-4 py-3 shadow-sm md:hidden">
          <div className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            <Link
              href={
                profile?.role === "ADMIN" ? "/dashboard/admin" : "/dashboard"
              }
              className="rounded-lg px-3 py-2 hover:bg-slate-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="rounded-lg px-3 py-2 text-left text-red-600 hover:bg-red-50 cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
