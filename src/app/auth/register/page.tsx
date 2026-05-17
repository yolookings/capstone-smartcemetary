"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Mail,
  Lock,
  Phone,
  AlertCircle,
  CheckCircle,
  Loader2,
  Eye,
  EyeOff,
  Home,
  LogIn,
} from "lucide-react";
import { createClient } from "@/lib/supabase/browser";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const getPasswordStrength = (pwd: string): { score: number; label: string; color: string } => {
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) return { score: 1, label: "Lemah", color: "bg-red-500" };
    if (score <= 4) return { score: 2, label: "Sedang", color: "bg-yellow-500" };
    return { score: 3, label: "Kuat", color: "bg-emerald-500" };
  };

  const passwordStrength = getPasswordStrength(password);

  const checkUsernameAvailability = async (username: string) => {
    if (username.length < 2) {
      setUsernameAvailable(null);
      return;
    }
    setCheckingUsername(true);
    try {
      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", username.toLowerCase())
        .single();

      setUsernameAvailable(!data);
    } catch (err) {
      setUsernameAvailable(true);
    }
    setCheckingUsername(false);
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setUsername(value);
    checkUsernameAvailability(value);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 12);
    setPhoneNumber(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim()) { setError("Nama lengkap harus diisi"); return; }
    if (!username.trim()) { setError("Username harus diisi"); return; }
    if (username.length < 2) { setError("Username minimal 2 karakter"); return; }
    if (usernameAvailable === false) { setError("Username ini sudah digunakan, pilih username lain"); return; }
    if (!email.trim()) { setError("Email harus diisi"); return; }
    if (!email.endsWith("@gmail.com")) { setError("Hanya email @gmail.com yang diperbolehkan"); return; }
    if (!phoneNumber.trim()) { setError("Nomor HP harus diisi untuk notifikasi WhatsApp"); return; }
    if (!phoneNumber.startsWith("08")) { setError("Nomor HP harus dimulai dengan 08 untuk WhatsApp"); return; }
    if (phoneNumber.length < 10) { setError("Nomor HP minimal 10 digit"); return; }
    if (!password) { setError("Password harus diisi"); return; }
    if (password.length < 6) { setError("Password minimal 6 karakter"); return; }
    if (!/[A-Z]/.test(password)) { setError("Password harus mengandung huruf besar"); return; }
    if (!/[a-z]/.test(password)) { setError("Password harus mengandung huruf kecil"); return; }
    if (!/[0-9]/.test(password)) { setError("Password harus mengandung angka"); return; }
    if (password !== confirmPassword) { setError("Password dan konfirmasi tidak cocok"); return; }

    setLoading(true);

    try {
      setError("Memproses pendaftaran...");
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password,
        options: {
          data: { full_name: name, username: username.toLowerCase() },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (!signUpData.user) {
        setError("Gagal membuat akun. Silakan coba lagi.");
        setLoading(false);
        return;
      }

      setError("Menyimpan data pengguna...");

      const normalizedPhone = phoneNumber.startsWith("08")
        ? `62${phoneNumber.slice(1)}`
        : phoneNumber;

      const profileData = {
        id: signUpData.user.id,
        email: email.toLowerCase(),
        full_name: name,
        username: username.toLowerCase(),
        role: "USER",
        phone: phoneNumber,
        whatsapp_number: normalizedPhone,
      };

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(profileData, { onConflict: "id" });

      if (profileError) {
        console.error("Profile error:", profileError);
      }

      setSuccess("Pendaftaran berhasil! Silakan cek email untuk verifikasi akun Anda.");
      setRegistrationComplete(true);
      
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "Terjadi kesalahan. Silakan coba lagi.");
    }
    
    setLoading(false);
  };

  if (registrationComplete) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-emerald-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Pendaftaran Berhasil!</h2>
          <p className="text-sm text-slate-600 mb-6">
            {success}
          </p>
          <div className="space-y-3">
            <Link
              href="/auth/login"
              className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700"
            >
              <LogIn size={18} />
              Login
            </Link>
            <Link
              href="/"
              className="flex items-center justify-center gap-2 w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200"
            >
              <Home size={18} />
              Kembali ke Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Daftar Akun</h2>
          <p className="text-sm text-slate-600 mt-1">Buat akun untuk pendaftaran makam</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-lg mb-4">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 text-emerald-500 text-sm bg-emerald-50 p-3 rounded-lg mb-4">
            <CheckCircle size={16} /> {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                placeholder="Nama Lengkap" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Username <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">@</span>
              <input type="text" value={username} onChange={handleUsernameChange}
                className="w-full pl-8 pr-3 py-2.5 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                placeholder="username" required />
              {checkingUsername && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-emerald-500" size={18} />}
              {usernameAvailable === true && username.length >= 2 && (
                <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
              )}
              {usernameAvailable === false && username.length >= 2 && (
                <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" size={18} />
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {usernameAvailable === false && username.length >= 2 ? "Username sudah digunakan" : usernameAvailable === true && username.length >= 2 ? "Username tersedia" : "Minimal 2 karakter"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                placeholder="email@gmail.com" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nomor HP <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="tel" value={phoneNumber} onChange={handlePhoneChange}
                className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                placeholder="081234567890" required />
            </div>
            <p className="text-xs text-slate-500 mt-1">Wajib untuk notifikasi WhatsApp</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                placeholder="Password" required minLength={6} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {password && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        passwordStrength.score >= level ? passwordStrength.color : "bg-slate-200"
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs ${passwordStrength.color.replace("bg-", "text-")}`}>
                  {passwordStrength.label} {passwordStrength.score === 3 && "✓"}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Minimal 6 karakter, gunakan huruf besar, kecil, angka, dan simbol
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Konfirmasi Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                placeholder="Konfirmasi Password" required />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading || usernameAvailable === false}
            className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="animate-spin" size={18} /> Mendaftarkan...</> : "Daftar Akun"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-600 mt-6">
          Sudah punya akun? <Link href="/auth/login" className="font-medium text-emerald-600 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}