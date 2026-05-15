"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Lock, Phone, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import supabase from "@/lib/supabase-client";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const router = useRouter();

  const checkUsernameAvailability = async (username: string) => {
    if (username.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    setCheckingUsername(true);
    const { data } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", username.toLowerCase())
      .single();
    setUsernameAvailable(!data);
    setCheckingUsername(false);
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setUsername(value);
    checkUsernameAvailability(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!name.trim()) { setError("Nama lengkap harus diisi"); return; }
    if (!username.trim()) { setError("Username harus diisi"); return; }
    if (username.length < 3) { setError("Username minimal 3 karakter"); return; }
    if (usernameAvailable === false) { setError("Username sudah digunakan"); return; }
    if (!email.trim()) { setError("Email harus diisi"); return; }
    if (!email.endsWith("@gmail.com")) { setError("Hanya email @gmail.com yang diperbolehkan"); return; }
    if (!password) { setError("Password harus diisi"); return; }
    if (password.length < 6) { setError("Password minimal 6 karakter"); return; }
    if (password !== confirmPassword) { setError("Password dan konfirmasi tidak cocok"); return; }

    setLoading(true);

    try {
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("email")
        .eq("email", email.toLowerCase())
        .single();

      if (existingUser) {
        setError("Email sudah terdaftar");
        setLoading(false);
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password,
        options: { data: { full_name: name, username: username.toLowerCase() } },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        const normalizedPhone = phoneNumber.replace(/^0/, "62");
        await supabase.from("profiles").insert({
          id: data.user.id,
          email: email.toLowerCase(),
          full_name: name,
          username: username.toLowerCase(),
          role: "USER",
          phone: normalizedPhone || null,
          whatsapp_number: normalizedPhone || null,
        });
        setSuccess("Akun berhasil dibuat! Mengarahkan ke login...");
        setTimeout(() => router.push("/auth/login?registered=true"), 1500);
      } else {
        setError("Pendaftaran gagal");
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan");
      setLoading(false);
    }
  };

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
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                placeholder="Nama Lengkap" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">@</span>
              <input type="text" value={username} onChange={handleUsernameChange}
                className="w-full pl-8 pr-3 py-2.5 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                placeholder="username" required />
              {checkingUsername && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-emerald-500" size={18} />}
              {usernameAvailable === true && username.length >= 3 && <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />}
              {usernameAvailable === false && username.length >= 3 && <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" size={18} />}
            </div>
            <p className="text-xs text-slate-500 mt-1">Minimal 3 karakter</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                placeholder="email@gmail.com" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                placeholder="Password" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Konfirmasi Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                placeholder="Konfirmasi Password" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nomor HP (Opsional)</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 12))}
                className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                placeholder="8123456789" />
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