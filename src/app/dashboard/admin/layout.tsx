"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, LayoutDashboard, FileText, UserCheck, Database, LogOut, Bell, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.replace('/auth/login');
        return;
      }

      const userId = user.id;
      const profileRes = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=role,full_name`,
        {
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
        }
      );
      const profiles = await profileRes.json();
      const profile = profiles?.[0];

      if (profile?.role !== 'ADMIN') {
        router.replace('/dashboard');
        return;
      }

      setLoading(false);
    };

    checkAdmin();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col p-4">
        <div className="px-3 py-4 mb-4">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center mb-3">
            <Shield className="text-white" size={20} />
          </div>
          <h2 className="font-bold text-slate-900">Admin Panel</h2>
          <p className="text-xs text-slate-500">Smart Cemetery</p>
        </div>
        
        <div className="space-y-1 flex-1">
          <Link href="/dashboard/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
            <LayoutDashboard size={18} />
            <span className="text-sm font-semibold">Dashboard</span>
          </Link>
          <Link href="/dashboard/admin/pengajuan" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-100">
            <FileText size={18} />
            <span className="text-sm font-semibold">Semua Pengajuan</span>
          </Link>
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-100">
            <UserCheck size={18} />
            <span className="text-sm font-semibold">Mode User</span>
          </Link>
        </div>
        
        <div className="pt-4 border-t border-slate-100">
          <Link href="/dashboard/chat" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-100">
            <Bell size={18} />
            <span className="text-sm font-semibold">Notifikasi</span>
          </Link>
        </div>
      </aside>

      <main className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 overflow-auto p-8">
        {children}
      </main>
    </div>
  );
}