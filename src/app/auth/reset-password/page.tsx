"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";
import { type EmailOtpType } from "@supabase/supabase-js";
import {
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";

function ResetPasswordContent() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [tokenError, setTokenError] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const tryEstablishSession = async () => {
      // ── Step 1: Check if already have a session (e.g. from callback redirect) ──
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      if (existingSession) {
        setIsReady(true);
        return;
      }

      // ── Step 2: Try URL hash parameters (implicit flow fallback) ──
      const hashParams = new URLSearchParams(
        window.location.hash.substring(1)
      );
      let accessToken = hashParams.get("access_token");
      let refreshToken = hashParams.get("refresh_token");
      let type = hashParams.get("type");

      // ── Step 3: Try query parameters (PKCE / token_hash flow) ──
      const queryTokenHash = searchParams.get("token_hash");
      const queryType = searchParams.get("type") as EmailOtpType | null;
      const queryCode = searchParams.get("code");
      const queryAccessToken =
        searchParams.get("access_token") || searchParams.get("token");
      const queryRefreshToken = searchParams.get("refresh_token");

      // Fallback to query params if not in hash
      if (!accessToken) {
        accessToken = queryAccessToken;
        refreshToken = queryRefreshToken;
        if (!type && queryType) type = queryType;
      }

      try {
        // ── Path A: token_hash + type (recovery flow via email template) ──
        if (queryTokenHash && queryType) {
          const { error: otpError } = await supabase.auth.verifyOtp({
            type: queryType,
            token_hash: queryTokenHash,
          });
          if (otpError) {
            console.error("verifyOtp error:", otpError);
            throw otpError;
          }
          setIsReady(true);
          return;
        }

        // ── Path B: code (PKCE flow via exchangeCodeForSession) ──
        if (queryCode) {
          const { error: codeError } =
            await supabase.auth.exchangeCodeForSession(queryCode);
          if (codeError) {
            console.error("exchangeCodeForSession error:", codeError);
            throw codeError;
          }
          setIsReady(true);
          return;
        }

        // ── Path C: access_token in hash/query (legacy implicit flow) ──
        if (
          accessToken &&
          (type === "recovery" || type === "password_recovery" || !type)
        ) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || "",
          });
          if (sessionError) {
            console.error("setSession error:", sessionError);
            throw sessionError;
          }
          setIsReady(true);
          return;
        }

        // ── No valid tokens found at all ──
        // Check if there's an error from the callback redirect
        const queryError = searchParams.get("error");
        if (queryError) {
          throw new Error(
            searchParams.get("error_description") ||
              "Link tidak valid atau sudah kedaluwarsa"
          );
        }

        // Nothing to process
        setTokenError(true);
        setError(
          "Link reset password tidak valid. Silakan minta link baru dari halaman login."
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Terjadi kesalahan tidak diketahui";
        console.error("Token processing error:", err);
        setTokenError(true);
        setError(
          message ||
            "Link reset password tidak valid atau sudah kedaluwarsa. Silakan minta link baru."
        );
      }
    };

    tryEstablishSession();
  }, [supabase, searchParams]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password.length < 6) {
      setError("Password minimal 6 karakter");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Password dan konfirmasi tidak cocok");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push("/auth/login?reset=true");
      }, 2000);
    }

    setLoading(false);
  };

  if (success) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4">
        <div className="w-full max-w-md bg-white p-10 rounded-2xl shadow-xl border text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-emerald-600" size={32} />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Password Berhasil Diubah
          </h3>
          <p className="text-sm text-slate-600 mb-6">
            Password Anda telah berhasil diperbarui. Mengarahkan ke login...
          </p>
          <Link
            href="/auth/login"
            className="text-emerald-600 font-medium hover:underline"
          >
            Login sekarang
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4">
      <div className="w-full max-w-md bg-white p-10 rounded-2xl shadow-xl border">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Reset Password</h2>
          <p className="text-sm text-slate-600 mt-2">
            Masukkan password baru Anda
          </p>
        </div>

        {error && (
          <div className="flex flex-col gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-lg mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
            {tokenError && (
              <Link
                href="/auth/login?forgot=1"
                className="text-emerald-600 hover:underline text-center mt-2"
              >
                Klik di sini untuk minta link reset password baru
              </Link>
            )}
          </div>
        )}

        <form onSubmit={handleResetPassword} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Password Baru
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                placeholder="Password baru"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                ) : (
                  <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                )}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">Minimal 6 karakter</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Konfirmasi Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                placeholder="Konfirmasi password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !isReady}
            className="w-full py-3 px-4 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Menyimpan...
              </>
            ) : (
              "Simpan Password"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-slate-600 mt-6">
          <Link
            href="/auth/login"
            className="font-medium text-emerald-600 hover:underline"
          >
            Kembali ke Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
