"use client";

import { useEffect, useState } from "react";
import { User, Save, AlertCircle, CheckCircle, Lock, Mail, Eye, EyeOff, MessageSquare, Send, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

export default function AdminPengaturanPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user?.id) {
        setError("User tidak ditemukan");
        setLoading(false);
        return;
      }

      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id);
      
      const profileData = profiles?.[0];

      if (profileData) {
        setProfile(profileData);
        setFullName(profileData.full_name || "");
      }

      setLoading(false);
    } catch (err) {
      setError("Gagal mengambil data");
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    setSaving(true);
    setSaved(false);

    try {
      const supabase = createClient();
      const { error: patchError } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', profile.id);

      if (!patchError) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }

      setSaving(false);
    } catch (err) {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Semua kolom password harus diisi");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Password baru dan konfirmasi tidak cocok");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Password minimal 6 karakter");
      return;
    }

    setChangingPassword(true);

    try {
      const supabase = createClient();
      const { error: passwordUpdateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (!passwordUpdateError) {
        setPasswordSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordSuccess(false), 3000);
      } else {
        setPasswordError(passwordUpdateError.message || "Gagal mengubah password");
      }
    } catch (err) {
      setPasswordError("Gagal mengubah password");
    } finally {
      setChangingPassword(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <div className="text-center">
          <AlertCircle className="mx-auto text-red-500 mb-2" size={48} />
          <p className="text-slate-600 font-medium">{error}</p>
          <button
            onClick={fetchProfile}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-4xl">
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">Pengaturan Akun</h1>
        <p className="text-slate-500 text-sm mt-1">Kelola informasi akun Anda</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <User className="text-blue-600" size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Informasi Profil</h3>
            <p className="text-sm text-slate-500">Kelola nama akun Anda</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                value={profile?.email || ""}
                disabled
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">Email tidak dapat diubah</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nama Lengkap
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Masukkan nama lengkap"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Role
            </label>
            <div className="flex items-center gap-2">
              <span className="px-4 py-2.5 bg-emerald-100 text-emerald-700 rounded-xl text-sm font-medium">
                {profile?.role === 'ADMIN' ? 'Administrator' : 'Pengguna'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {saved && (
              <>
                <CheckCircle className="text-emerald-500" size={16} />
                <span className="text-sm text-emerald-600">Berhasil disimpan</span>
              </>
            )}
          </div>
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Menyimpan...
              </>
            ) : (
              <>
                <Save size={18} />
                Simpan Perubahan
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <Lock className="text-amber-600" size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Ubah Password</h3>
            <p className="text-sm text-slate-500">Ganti password akun Anda</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Password Baru
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Masukkan password baru"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Konfirmasi Password Baru
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Konfirmasi password baru"
              />
            </div>
          </div>

          {passwordError && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle size={16} />
              {passwordError}
            </div>
          )}

          {passwordSuccess && (
            <div className="flex items-center gap-2 text-emerald-600 text-sm">
              <CheckCircle size={16} />
              Password berhasil diubah
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100">
          <button
            onClick={handleChangePassword}
            disabled={changingPassword || !newPassword || !confirmPassword}
            className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {changingPassword ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Mengubah...
              </>
            ) : (
              <>
                <Lock size={18} />
                Ubah Password
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── WhatsApp Integration ──────────────────────────────── */}
      <WhatsAppSettingsCard />
    </div>
  );
}

/* ── WhatsApp Settings Card ─────────────────────────────────── */

const TEMPLATES = [
  { value: "pengajuan_dibuat", label: "Pengajuan Dibuat" },
  { value: "pengajuan_disetujui", label: "Pengajuan Disetujui" },
  { value: "permintaan_revisi", label: "Permintaan Revisi" },
  { value: "pengajuan_ditolak", label: "Pengajuan Ditolak" },
];

function WhatsAppSettingsCard() {
  const [configStatus, setConfigStatus] = useState<{
    configured: boolean;
    errors: string[];
  } | null>(null);
  const [checking, setChecking] = useState(true);

  const [testPhone, setTestPhone] = useState("");
  const [testTemplate, setTestTemplate] = useState("pengajuan_dibuat");
  const [sending, setSending] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    async function checkConfig() {
      try {
        const res = await fetch("/api/whatsapp/send-test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: "check", template_name: "check" }),
        });
        if (res.status === 400) {
          const data = await res.json();
          if (data.error?.includes("tidak terkonfigurasi")) {
            setConfigStatus({ configured: false, errors: [data.error] });
          } else {
            setConfigStatus({ configured: true, errors: [] });
          }
        } else if (res.status === 401 || res.status === 403) {
          setConfigStatus({ configured: true, errors: [] });
        } else {
          setConfigStatus({ configured: true, errors: [] });
        }
      } catch {
        setConfigStatus({ configured: false, errors: ["Tidak dapat memeriksa konfigurasi"] });
      } finally {
        setChecking(false);
      }
    }
    checkConfig();
  }, []);

  const handleTestSend = async () => {
    if (!testPhone) return;
    setSending(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/whatsapp/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: testPhone, template_name: testTemplate }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestResult({ success: true, message: "Test WhatsApp berhasil dikirim!" });
      } else {
        setTestResult({ success: false, message: data.error || "Gagal mengirim test" });
      }
    } catch {
      setTestResult({ success: false, message: "Gagal terhubung ke server" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
          <MessageSquare className="text-green-600" size={20} />
        </div>
        <div>
          <h3 className="font-bold text-slate-900">Integrasi WhatsApp</h3>
          <p className="text-sm text-slate-500">Konfigurasi notifikasi WhatsApp via KirimDev</p>
        </div>
      </div>

      {/* ── Configuration Status ──────────────────────────── */}
      <div className="mb-6 p-4 bg-neutral rounded-xl">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Status Konfigurasi</p>
        {checking ? (
          <div className="flex items-center gap-2">
            <Loader2 size={14} className="animate-spin text-primary" />
            <span className="text-sm text-slate-500">Memeriksa...</span>
          </div>
        ) : configStatus?.configured ? (
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">Terkonfigurasi</span>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={16} className="text-amber-600" />
              <span className="text-sm font-medium text-amber-700">Belum Terkonfigurasi</span>
            </div>
            <p className="text-xs text-slate-500">
              Atur environment variable <code className="bg-slate-200 px-1 rounded">KIRIMDEV_API_KEY</code> dan{' '}
              <code className="bg-slate-200 px-1 rounded">KIRIMDEV_PHONE_NUMBER_ID</code> di file .env.local untuk mengaktifkan WhatsApp.
            </p>
          </div>
        )}
      </div>

      {/* ── Template Info ─────────────────────────────────── */}
      <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">Template Terdaftar</p>
        <ul className="space-y-1">
          {TEMPLATES.map((t) => (
            <li key={t.value} className="text-xs text-blue-700 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
              <span className="font-mono text-[10px] text-blue-500">{t.value}</span>
              <span>— {t.label}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Test Send ─────────────────────────────────────── */}
      <div className="border-t border-slate-100 pt-6">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Uji Coba WhatsApp</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nomor Telepon Penerima (628xx)
            </label>
            <input
              type="tel"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="6281234567890"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Template
            </label>
            <select
              value={testTemplate}
              onChange={(e) => setTestTemplate(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm appearance-none bg-white"
            >
              {TEMPLATES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label} ({t.value})
                </option>
              ))}
            </select>
          </div>

          {testResult && (
            <div className={`flex items-center gap-2 text-sm ${testResult.success ? "text-emerald-600" : "text-red-600"}`}>
              {testResult.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {testResult.message}
            </div>
          )}

          <button
            onClick={handleTestSend}
            disabled={sending || !testPhone || !configStatus?.configured}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Mengirim...
              </>
            ) : (
              <>
                <Send size={18} />
                Kirim Test WhatsApp
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}