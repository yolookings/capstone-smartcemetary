"use client";

import { useEffect, useState } from "react";
import { Bell, MessageCircle, CheckCircle, AlertCircle, Clock, RefreshCw, Wifi, WifiOff, Trash2, Eye, Mail } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export default function AdminNotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError(null);
    setConnectionStatus('checking');
    
    try {
      const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!SUPABASE_URL || !SUPABASE_KEY) {
        setConnectionStatus('disconnected');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 300));
      setConnectionStatus('connected');
      
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/notifications?order=created_at.desc&limit=100`,
        { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
      );
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
      setLoading(false);
      setRefreshing(false);
    } catch (err) {
      setError("Tidak dapat memuat notifikasi");
      setConnectionStatus('disconnected');
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    await fetch(`${SUPABASE_URL}/rest/v1/notifications?id=eq.${id}`, {
      method: 'PATCH',
      headers: { 'apikey': SUPABASE_KEY!, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
      body: JSON.stringify({ read: true }),
    });
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = async (id: string) => {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    await fetch(`${SUPABASE_URL}/rest/v1/notifications?id=eq.${id}`, {
      method: 'DELETE',
      headers: { 'apikey': SUPABASE_KEY!, 'Authorization': `Bearer ${SUPABASE_KEY}` },
    });
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'pengajuan': return <Bell className="text-blue-500" size={20} />;
      case 'approved': return <CheckCircle className="text-emerald-500" size={20} />;
      case 'revision': return <AlertCircle className="text-amber-500" size={20} />;
      case 'system': return <MessageCircle className="text-purple-500" size={20} />;
      default: return <Bell className="text-slate-500" size={20} />;
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes} menit yang lalu`;
    if (hours < 24) return `${hours} jam yang lalu`;
    return `${days} hari yang lalu`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-slate-500">Memuat notifikasi...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] p-8">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 max-w-md text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <WifiOff className="text-red-500" size={40} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Gagal Memuat Notifikasi</h2>
          <p className="text-slate-500 mb-6">{error}</p>
          <button
            onClick={() => fetchData(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
          >
            <RefreshCw size={18} />
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Notifikasi</h1>
          <p className="text-slate-500 text-sm mt-1">
            {unreadCount > 0 
              ? `${unreadCount} notifikasi belum dibaca` 
              : 'Semua notifikasi sudah dibaca'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
            connectionStatus === 'connected' 
              ? 'bg-emerald-100 text-emerald-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {connectionStatus === 'connected' ? <Wifi size={14} /> : <WifiOff size={14} />}
            {connectionStatus === 'connected' ? 'Terhubung' : 'Terputus'}
          </div>
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="p-2.5 bg-white rounded-xl border border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-300 transition-all disabled:opacity-50"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
            filter === 'all' 
              ? 'bg-primary text-white' 
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          Semua
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
            filter === 'unread' 
              ? 'bg-primary text-white' 
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          Belum Dibaca
        </button>
        <button
          onClick={() => setFilter('read')}
          className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
            filter === 'read' 
              ? 'bg-primary text-white' 
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          Sudah Dibaca
        </button>
        
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="ml-auto text-sm text-emerald-600 font-medium hover:underline"
          >
            Tandai semua sudah dibaca
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        {filteredNotifications.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredNotifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`p-6 hover:bg-slate-50 transition-colors ${!notification.read ? 'bg-blue-50/50' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    !notification.read ? 'bg-blue-100' : 'bg-slate-100'
                  }`}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900">{notification.title}</h3>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{notification.message}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {getTimeAgo(notification.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Tandai sudah dibaca"
                      >
                        <CheckCircle size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Hapus"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-16 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="text-slate-300" size={40} />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              {filter === 'unread' ? 'Tidak ada notifikasi baru' : 'Tidak ada notifikasi'}
            </h3>
            <p className="text-slate-500 text-sm">
              {filter === 'unread' 
                ? 'Semua notifikasi sudah dibaca' 
                : 'Notifikasi akan muncul di sini'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}