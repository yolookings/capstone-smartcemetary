"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Shield, LayoutDashboard, FileText, Users, MapPin, BarChart3, Bell, Menu, X } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const menuItems: NavItem[] = [
  { href: "/dashboard/admin", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
  { href: "/dashboard/admin/pengajuan", label: "Validasi Pengajuan", icon: <FileText size={20} /> },
  { href: "/dashboard/admin/users", label: "Kelola Pengguna", icon: <Users size={20} /> },
  { href: "/dashboard/admin/makam", label: "Kelola Makam", icon: <MapPin size={20} /> },
  { href: "/dashboard/admin/cemetery", label: "Monitoring Makam", icon: <MapPin size={20} /> },
  { href: "/dashboard/admin/laporan", label: "Laporan", icon: <BarChart3 size={20} /> },
  { href: "/dashboard/admin/notifications", label: "Notifikasi", icon: <Bell size={20} /> },
];

const bottomMenuItems: NavItem[] = [];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ full_name: string; username: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.replace('/auth/login');
          return;
        }

        // 1. Fetch profile info (the database source of truth)
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role,full_name,username')
          .eq('id', user.id)
          .single();

        // Check role from profiles first, fallback to JWT metadata
        const userRole = profileData?.role || user.user_metadata?.role || 'USER';

        if (userRole !== 'ADMIN') {
          router.replace('/dashboard');
          return;
        }

        if (profileData) {
          setProfile(profileData);
        } else {
          // Graceful fallback to JWT metadata values for display
          setProfile({
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin',
            username: user.user_metadata?.username || 'admin'
          });
        }

        setLoading(false);
      } catch (err) {
        console.error("Error in checkAdmin layout hook:", err);
        router.replace('/dashboard');
      }
    };

    checkAdmin();
  }, [router, supabase]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isActive = (href: string) => {
    if (href === "/dashboard/admin") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const NavContent = ({ vertical = false }: { vertical?: boolean }) => (
    <>
      <nav className={`flex-1 py-4 ${vertical ? 'px-4' : 'px-3'} space-y-1 overflow-y-auto`}>
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              isActive(item.href)
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "text-slate-600 hover:bg-neutral"
            }`}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className={`py-4 ${vertical ? 'px-4' : 'px-3'} border-t border-slate-50 space-y-1`}>
        {bottomMenuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              isActive(item.href)
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "text-slate-600 hover:bg-neutral"
            }`}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-neutral">
      <div className="lg:flex">
        
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        
        <aside className="hidden lg:flex lg:w-64 bg-white border-r border-slate-100 flex-col flex-shrink-0 transition-all duration-300 sticky top-0 h-screen">
          <div className="h-20 flex items-center px-6 border-b border-slate-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="text-white" size={18} />
              </div>
              <span className="font-bold text-slate-900 text-lg">Admin Panel</span>
            </div>
          </div>
          <NavContent />
        </aside>

        
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 flex flex-col transform transition-transform duration-300 lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="h-20 flex items-center justify-between px-6 border-b border-slate-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="text-white" size={18} />
              </div>
              <span className="font-bold text-slate-900 text-lg">Admin</span>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-600"
            >
              <X size={24} />
            </button>
          </div>
          <NavContent vertical />
        </aside>

        <div className="flex-1 overflow-hidden">
          <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-4 lg:px-12 flex-shrink-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-3 text-slate-400 hover:text-slate-600 hover:bg-neutral rounded-xl transition-all lg:hidden"
            >
              <Menu size={24} />
            </button>
            
            <div className="hidden lg:block">
              <span className="text-xl font-extrabold text-slate-900 tracking-tight">Admin Panel</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-full">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <span className="text-sm font-bold text-primary uppercase tracking-wider">Online</span>
              </div>
            </div>
          </header>

          <main className="p-4 lg:p-12">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}