"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Shield, LayoutDashboard, FileText, Users, MapPin, BarChart3, Settings, Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const menuItems: NavItem[] = [
  { href: "/dashboard/admin", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { href: "/dashboard/admin/pengajuan", label: "Validasi Pengajuan", icon: <FileText size={18} /> },
  { href: "/dashboard/admin/users", label: "Kelola Pengguna", icon: <Users size={18} /> },
  { href: "/dashboard/admin/makam", label: "Kelola Makam", icon: <MapPin size={18} /> },
  { href: "/dashboard/admin/cemetery", label: "Monitoring Makam", icon: <MapPin size={18} /> },
  { href: "/dashboard/admin/laporan", label: "Laporan & Statistik", icon: <BarChart3 size={18} /> },
  { href: "/dashboard/admin/notifications", label: "Notifikasi", icon: <Bell size={18} /> },
];

const bottomMenuItems: NavItem[] = [
  { href: "/dashboard/admin/pengaturan", label: "Pengaturan", icon: <Settings size={18} /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ full_name: string } | null>(null);
  const router = useRouter();
  const pathname = usePathname();
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
      const profileData = profiles?.[0];

      if (profileData?.role !== 'ADMIN') {
        router.replace('/dashboard');
        return;
      }

      setProfile(profileData);
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

  const isActive = (href: string) => {
    if (href === "/dashboard/admin") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-56 bg-white border-r border-slate-200 flex flex-col shadow-sm">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Shield className="text-white" size={18} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Admin Panel</h2>
              <p className="text-xs text-slate-500">Smart Cemetery</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-2 space-y-0.5">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                isActive(item.href)
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 border border-emerald-600"
                  : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-100 border border-transparent"
              }`}
            >
              {item.icon}
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-2 border-t border-slate-100 space-y-0.5">
          {bottomMenuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                isActive(item.href)
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 border border-emerald-600"
                  : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-100 border border-transparent"
              }`}
            >
              {item.icon}
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
          
          <div className="mt-3 px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-xs text-slate-400">Logged in as</p>
            <p className="text-sm font-semibold text-slate-700 truncate">{profile?.full_name || 'Admin'}</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 overflow-auto">
        {children}
      </main>
    </div>
  );
}