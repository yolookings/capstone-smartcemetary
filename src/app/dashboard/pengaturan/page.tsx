"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User, Mail, Phone, Shield, Save, Lock, Eye, EyeOff, AlertCircle, CheckCircle,
  MessageCircle, ExternalLink, Loader2, Smartphone, KeyRound
} from "lucide-react";
import { createClient } from "@/lib/supabase/browser";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: string;
  telegram_chat_id: string | null;
}

export default function AccountSettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  // ── Loading / Auth ──────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);

  // ── Profile State ───────────────────────────────────────
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  // ── Profile Save ────────────────────────────────────────
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // ── Password State ──────────────────────────────────────
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // ── Telegram State ──────────────────────────────────────
  const [telegramChatId, setTelegramChatId] = useState("");
  const [savingTelegram, setSavingTelegram] = useState(false);
  const [telegramSuccess, setTelegramSuccess] = useState(false);
  const [telegramError, setTelegramError] = useState<string | null>(null);

  // ── Fetch Profile ───────────────────────────────────────
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/auth/login");
        return;
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id);

      const p = profiles?.[0];
      if (p) {
        setProfile(p);
        setFullName(p.full_name || "");
        setPhone(p.phone || "");
        setTelegramChatId(p.telegram_chat_id || "");
      }

      setLoading(false);
      setAuthChecking(false);
    }
    init();
  }, [supabase, router]);

  // ── Save Profile ────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!profile) return;
    setSavingProfile(true);
    setProfileError(null);
    setProfileSuccess(false);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, phone: phone || null })
        .eq("id", profile.id);

      if (error) {
        setProfileError(error.message);
      } else {
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 3000);
      }
    } catch {
      setProfileError("Gagal menyimpan profil");
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Change Password ─────────────────────────────────────
  const handleChangePassword = async () => {
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!oldPassword || !newPassword || !confirmPassword) {
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
      // 1. Verify old password by attempting re-authentication
      const email = profile?.email;
      if (!email) {
        setPasswordError("Email tidak ditemukan");
        setChangingPassword(false);
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: oldPassword,
      });

      if (signInError) {
        setPasswordError("Old password does not match");
        setChangingPassword(false);
        return;
      }

      // 2. Old password is correct — update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setPasswordError(updateError.message || "Gagal mengubah password");
      } else {
        setPasswordSuccess(true);
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordSuccess(false), 3000);
      }
    } catch {
      setPasswordError("Gagal mengubah password");
    } finally {
      setChangingPassword(false);
    }
  };

  // ── Save Telegram ───────────────────────────────────────
  const handleSaveTelegram = async () => {
    if (!profile) return;
    setSavingTelegram(true);
    setTelegramError(null);
    setTelegramSuccess(false);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ telegram_chat_id: telegramChatId || null })
        .eq("id", profile.id);

      if (error) {
        setTelegramError(error.message);
      } else {
        setTelegramSuccess(true);
        setTimeout(() => setTelegramSuccess(false), 3000);
      }
    } catch {
      setTelegramError("Gagal menyimpan Chat ID");
    } finally {
      setSavingTelegram(false);
    }
  };

  // ── Loading ─────────────────────────────────────────────
  if (loading || authChecking) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  // ── Shared Styles ───────────────────────────────────────
  const inputClass =
    "w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-white";
  const inputDisabledClass =
    "w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-500 cursor-not-allowed";
  const labelClass = "block text-sm font-medium text-slate-700 mb-1.5";
  const sectionCard =
    "bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden";

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20">
      {/* ── Page Header ──────────────────────────────────── */}
      <div>
        <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
          Account Settings
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Kelola informasi akun, keamanan, dan integrasi Anda
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════
          PROFILE SECTION
          ══════════════════════════════════════════════════════ */}
      <div className={sectionCard}>
        <div className="p-6 lg:p-8">
          {/* Section Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <User className="text-primary" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 font-manrope">Profil</h3>
              <p className="text-xs text-slate-400 font-medium">
                Informasi dasar akun Anda
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {/* Email (read-only) */}
            <div className="sm:col-span-2">
              <label className={labelClass}>Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={profile?.email || ""}
                  disabled
                  className={inputDisabledClass}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">Email tidak dapat diubah</p>
            </div>

            {/* Full Name */}
            <div>
              <label className={labelClass}>Nama Lengkap</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={inputClass}
                  placeholder="Masukkan nama lengkap"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className={labelClass}>Nomor Telepon</label>
              <div className="relative">
                <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClass}
                  placeholder="Contoh: 6281234567890"
                />
              </div>
            </div>

            {/* Role (read-only) */}
            <div>
              <label className={labelClass}>Role</label>
              <div className="flex items-center h-[46px]">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-lg">
                  <Shield size={14} />
                  {profile?.role === "ADMIN" ? "Administrator" : "Pengguna"}
                </span>
              </div>
            </div>
          </div>

          {/* Profile Save Bar */}
          <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
            <div>
              {profileSuccess && (
                <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
                  <CheckCircle size={16} />
                  Profil berhasil disimpan
                </span>
              )}
              {profileError && (
                <span className="inline-flex items-center gap-1.5 text-sm text-red-600 font-medium">
                  <AlertCircle size={16} />
                  {profileError}
                </span>
              )}
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
            >
              {savingProfile ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Simpan Perubahan
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          SECURITY SECTION
          ══════════════════════════════════════════════════════ */}
      <div className={sectionCard}>
        <div className="p-6 lg:p-8">
          {/* Section Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Lock className="text-amber-600" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 font-manrope">Keamanan</h3>
              <p className="text-xs text-slate-400 font-medium">
                Ubah password akun Anda
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Old Password */}
            <div>
              <label className={labelClass}>Password Lama</label>
              <div className="relative">
                <KeyRound size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPasswords ? "text" : "password"}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className={inputClass}
                  placeholder="Masukkan password lama"
                />
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className={labelClass}>Password Baru</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPasswords ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-white"
                  placeholder="Masukkan password baru (min. 6 karakter)"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className={labelClass}>Konfirmasi Password Baru</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPasswords ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                  placeholder="Ulangi password baru"
                />
              </div>
            </div>

            {/* Show/Hide toggle label */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showPasswords}
                onChange={() => setShowPasswords(!showPasswords)}
                className="rounded border-slate-300 text-primary focus:ring-primary"
              />
              <span className="text-xs text-slate-500">Tampilkan password</span>
            </label>

            {/* Password Messages */}
            {passwordError && (
              <div className="flex items-center gap-2 text-sm text-red-600 font-medium bg-red-50 p-3 rounded-xl border border-red-100">
                <AlertCircle size={16} className="shrink-0" />
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                <CheckCircle size={16} className="shrink-0" />
                Password berhasil diubah
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <button
              onClick={handleChangePassword}
              disabled={changingPassword}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-white rounded-xl font-bold text-sm hover:bg-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20"
            >
              {changingPassword ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Mengubah...
                </>
              ) : (
                <>
                  <Lock size={16} />
                  Ubah Password
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          INTEGRATION SECTION
          ══════════════════════════════════════════════════════ */}
      <div className={sectionCard}>
        <div className="p-6 lg:p-8">
          {/* Section Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <MessageCircle className="text-indigo-600" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 font-manrope">Integrasi Telegram</h3>
              <p className="text-xs text-slate-400 font-medium">
                Terima notifikasi pengajuan via Telegram
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Telegram Chat ID */}
            <div>
              <label className={labelClass}>Telegram Chat ID</label>
              <div className="relative">
                <Smartphone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  className={inputClass}
                  placeholder="Masukkan Chat ID Telegram Anda"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Kosongkan jika tidak ingin menerima notifikasi Telegram.
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <ExternalLink size={14} className="text-indigo-500" />
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                  Cara Mendapatkan Chat ID
                </span>
              </div>
              <ol className="text-xs text-indigo-600 space-y-1.5 list-decimal list-inside leading-relaxed">
                <li>
                  Buka Telegram dan cari{" "}
                  <strong>@getidsbot</strong> (atau <strong>@userinfobot</strong>)
                </li>
                <li>
                  Ketik <strong>/start</strong> untuk memulai percakapan
                </li>
                <li>
                  Bot akan mengirimkan ID numerik Anda — salin angka tersebut
                </li>
                <li>
                  Tempel angka tersebut ke kolom di atas dan klik Simpan
                </li>
              </ol>
              <p className="text-xs text-indigo-500 pt-1">
                Pastikan Anda sudah pernah menghubungi bot Telegram E-Makam agar
                notifikasi dapat terkirim.
              </p>
            </div>

            {/* Telegram Messages */}
            {telegramSuccess && (
              <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                <CheckCircle size={16} className="shrink-0" />
                Chat ID berhasil disimpan
              </div>
            )}
            {telegramError && (
              <div className="flex items-center gap-2 text-sm text-red-600 font-medium bg-red-50 p-3 rounded-xl border border-red-100">
                <AlertCircle size={16} className="shrink-0" />
                {telegramError}
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <button
              onClick={handleSaveTelegram}
              disabled={savingTelegram}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-500 text-white rounded-xl font-bold text-sm hover:bg-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
            >
              {savingTelegram ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Simpan Chat ID
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
