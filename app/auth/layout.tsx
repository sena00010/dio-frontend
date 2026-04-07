"use client";

import { useAuth } from "@/lib/auth-context";
import { FullPageSpinner } from "@/components/ui/spinner";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();

  // AuthProvider handles redirects; show spinner while checking
  if (loading || user) {
    return <FullPageSpinner message="Kontrol ediliyor…" />;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#fdf2f2] via-[#f6f7f9] to-[#f0f1ff] p-4">
      {/* Animated background decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-float absolute -top-32 -right-32 h-80 w-80 rounded-full bg-gradient-to-br from-brand/10 to-brand-light/5 blur-3xl" />
        <div className="animate-float-delayed absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-gradient-to-tr from-indigo-200/30 to-pink-200/20 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, #1c1f26 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-[460px]">
        {children}
      </div>
    </div>
  );
}
