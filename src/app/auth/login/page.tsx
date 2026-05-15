"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, ArrowRight, Loader2 } from "lucide-react";

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState("");
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const registered = searchParams.get("registered");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace("/dashboard");
      }
    });
  }, [router, supabase]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const loginField = email.includes("@") ? email : email;
    
    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email: loginField.endsWith("@gmail.com") ? loginField : `${loginField}@gmail.com`,
      password,
    });

    if (loginError) {
      if (loginError.message.includes("Invalid login credentials")) {
        setError("Email atau password salah");
      } else {
        setError(loginError.message);
      }
      setLoading(false);
    } else if (data?.session) {
      router.replace("/dashboard");
    } else {
      setError("Login gagal. Silakan coba lagi.");
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordLoading(true);
    setForgotPasswordError("");

    if (!forgotPasswordEmail.trim()) {
      setForgotPasswordError("Email harus diisi");
      setForgotPasswordLoading(false);
      return;
    }

    if (!forgotPasswordEmail.endsWith("@gmail.com")) {
      setForgotPasswordError("Hanya email @gmail.com yang diperbolehkan");
      setForgotPasswordLoading(false);
      return;
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      forgotPasswordEmail,
      {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/reset-password` : undefined,
      }
    );

    if (resetError) {
      setForgotPasswordError(resetError.message);
    } else {
      setForgotPasswordSent(true);
    }
    
    setForgotPasswordLoading(false);
  };

  if (showForgotPassword) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4">
        <div className="w-full max-w-md bg-white p-10 rounded-2xl shadow-xl border">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Lupa Password</h2>
            <p className="text-sm text-slate-600 mt-2">
              Masukkan email Anda untuk menerima link reset password
            </p>
          </div>

          {forgotPasswordSent ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-emerald-600" size={32} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Email Terkirim</h3>
              <p className="text-sm text-slate-600 mb-6">
                Kami telah mengirim link reset password ke email Anda. Silakan cek inbox (atau spam) Anda.
              </p>
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotPasswordSent(false);
                  setForgotPasswordEmail("");
                }}
                className="text-emerald-600 font-medium hover:underline"
              >
                Kembali ke Login
              </button>
            </div>
          ) : (
            <>
              {forgotPasswordError && (
                <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-lg mb-4">
                  <AlertCircle size={16} />
                  {forgotPasswordError}
                </div>
              )}

              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="email"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg pl-10 px-3 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      placeholder="email@gmail.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={forgotPasswordLoading}
                  className="w-full py-3 px-4 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {forgotPasswordLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      Kirim Link Reset
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotPasswordError("");
                  }}
                  className="w-full py-3 px-4 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                >
                  Kembali
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4">
      <div className="w-full max-w-md bg-white p-10 rounded-2xl shadow-xl border">
        <h2 className="text-3xl font-bold text-center mb-2">Login</h2>
        <p className="text-center text-sm text-slate-600 mb-8">Masuk ke akun Smart Cemetery</p>

        {registered && (
          <div className="flex items-center gap-2 text-emerald-500 text-sm bg-emerald-50 p-3 rounded-lg mb-4">
            <CheckCircle size={16} />
            Akun berhasil dibuat! Silakan login.
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-lg mb-4">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email atau Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-slate-300 rounded-lg pl-10 px-3 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder="email@gmail.com"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-slate-300 rounded-lg pl-10 pr-10 px-3 py-2.5 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-emerald-600 font-medium hover:underline"
            >
              Lupa Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Masuk...
              </>
            ) : (
              "Masuk"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-slate-600 mt-8">
          Belum punya akun?{" "}
          <Link href="/auth/register" className="font-medium text-emerald-600 hover:underline">
            Daftar di sini
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}