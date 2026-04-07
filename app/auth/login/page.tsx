"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // ─── Handle email/password login ──────────────────────
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await api.post("/api/auth/login", { email, password });

      // Save token & company status
      localStorage.setItem("token", data.token);
      localStorage.setItem("current_step", String(data.current_step ?? 0));

      // Onboarding tamamlanmışsa dashboard'a, yoksa onboarding'e
      if (data.has_company && (data.current_step ?? 0) >= 7) {
        localStorage.setItem("onboarding_completed", "true");
        router.push("/");
      } else {
        router.push("/onboarding");
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(
        axiosErr.response?.data?.error || "Giriş başarısız. Lütfen bilgilerinizi kontrol edin."
      );
    } finally {
      setLoading(false);
    }
  }

  // ─── Handle Google sign-in ────────────────────────────
  async function handleGoogleLogin() {
    setError("");
    setGoogleLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const { data } = await api.post("/api/auth/google", {
        id_token: idToken,
      });

      // Save token & company status
      localStorage.setItem("token", data.token);
      localStorage.setItem("current_step", String(data.current_step ?? 0));

      if (data.has_company && (data.current_step ?? 0) >= 7) {
        localStorage.setItem("onboarding_completed", "true");
        router.push("/");
      } else {
        router.push("/onboarding");
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(
        axiosErr.response?.data?.error || "Google ile giriş başarısız oldu."
      );
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="animate-fade-in-up">
      {/* Logo & heading */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-dark shadow-lg shadow-brand/20">
          <span className="text-2xl font-black text-white tracking-tight">D</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Tekrar Hoş Geldiniz
        </h1>
        <p className="subtle mt-1.5 text-sm">
          Hesabınıza giriş yapın
        </p>
      </div>

      {/* Card */}
      <div className="glass-card rounded-2xl p-8">
        {/* Error message */}
        {error && (
          <div className="auth-error mb-5 animate-fade-in-up">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 5v3.5M8 10.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {error}
          </div>
        )}

        {/* Google sign-in button */}
        <button
          type="button"
          className="auth-btn auth-btn-google mb-4"
          onClick={handleGoogleLogin}
          disabled={googleLoading || loading}
        >
          {googleLoading ? (
            <span className="spinner spinner-dark" />
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
              </svg>
              Google ile Giriş Yap
            </>
          )}
        </button>

        {/* Divider */}
        <div className="auth-divider my-5">veya</div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="auth-label">
              E-posta
            </label>
            <input
              id="login-email"
              type="email"
              className="auth-input"
              placeholder="ornek@sirket.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="auth-label">
              Şifre
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                className="auth-input pr-11"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                minLength={6}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="auth-btn auth-btn-primary mt-2"
            disabled={loading || googleLoading}
          >
            {loading ? <span className="spinner" /> : "Giriş Yap"}
          </button>
        </form>
      </div>

      {/* Footer link */}
      <p className="mt-6 text-center text-sm text-muted animate-fade-in-up-delay-2">
        Hesabınız yok mu?{" "}
        <Link
          href="/auth/register"
          className="font-semibold text-brand hover:text-brand-dark transition-colors"
        >
          Kayıt Olun
        </Link>
      </p>
    </div>
  );
}
