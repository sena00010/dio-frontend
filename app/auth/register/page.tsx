"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    company_name: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!privacyAccepted) {
      setError("Devam etmek için Gizlilik Sözleşmesi'ni kabul etmelisiniz.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const { data } = await api.post("/api/auth/register", form);

      // Save token & company status
      localStorage.setItem("token", data.token);
      localStorage.setItem("current_step", String(data.current_step ?? 0));

      // Yeni kayıt → her zaman onboarding'e
      router.push("/onboarding");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(
        axiosErr.response?.data?.error || "Kayıt başarısız. Lütfen tekrar deneyin."
      );
    } finally {
      setLoading(false);
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
          Hesap Oluşturun
        </h1>
        <p className="subtle mt-1.5 text-sm">
          DIO Panel&apos;e hemen başlayın
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name fields – side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="reg-fname" className="auth-label">Ad</label>
              <input
                id="reg-fname"
                type="text"
                className="auth-input"
                placeholder="Ahmet"
                value={form.first_name}
                onChange={(e) => updateField("first_name", e.target.value)}
                required
                autoComplete="given-name"
              />
            </div>
            <div>
              <label htmlFor="reg-lname" className="auth-label">Soyad</label>
              <input
                id="reg-lname"
                type="text"
                className="auth-input"
                placeholder="Yılmaz"
                value={form.last_name}
                onChange={(e) => updateField("last_name", e.target.value)}
                required
                autoComplete="family-name"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="reg-email" className="auth-label">E-posta</label>
            <input
              id="reg-email"
              type="email"
              className="auth-input"
              placeholder="ornek@sirket.com"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="reg-phone" className="auth-label">Telefon Numarası</label>
            <input
              id="reg-phone"
              type="tel"
              className="auth-input"
              placeholder="+90 555 123 4567"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              required
              autoComplete="tel"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="reg-password" className="auth-label">Şifre</label>
            <div className="relative">
              <input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                className="auth-input pr-11"
                placeholder="En az 6 karakter"
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                required
                autoComplete="new-password"
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

          {/* Company Name */}
          <div>
            <label htmlFor="reg-company" className="auth-label">Firma Adı</label>
            <input
              id="reg-company"
              type="text"
              className="auth-input"
              placeholder="Şirket Ltd. Şti."
              value={form.company_name}
              onChange={(e) => updateField("company_name", e.target.value)}
              required
              autoComplete="organization"
            />
          </div>

          {/* Gizlilik Sözleşmesi Onayı */}
          <div className="flex items-start gap-2.5 mt-1">
            <input
              id="reg-privacy"
              type="checkbox"
              checked={privacyAccepted}
              onChange={(e) => setPrivacyAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-brand focus:ring-brand/30 cursor-pointer accent-[#E73932]"
            />
            <label htmlFor="reg-privacy" className="text-xs text-muted leading-relaxed cursor-pointer select-none">
              <a
                href="https://www.dijitalisortagi.com/gizlilik-sozlesmesi"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-brand hover:text-brand-dark underline underline-offset-2 transition-colors"
              >
                Gizlilik Sözleşmesi
              </a>
              &apos;ni okudum ve kabul ediyorum.
            </label>
          </div>

          <button
            type="submit"
            className="auth-btn auth-btn-primary mt-2"
            disabled={loading || !privacyAccepted}
          >
            {loading ? <span className="spinner" /> : "Kayıt Ol"}
          </button>
        </form>
      </div>

      {/* Footer link */}
      <p className="mt-6 text-center text-sm text-muted animate-fade-in-up-delay-2">
        Zaten hesabınız var mı?{" "}
        <Link
          href="/auth/login"
          className="font-semibold text-brand hover:text-brand-dark transition-colors"
        >
          Giriş Yapın
        </Link>
      </p>
    </div>
  );
}
