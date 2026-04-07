"use client";

export function FullPageSpinner({ message = "Yükleniyor…" }: { message?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 animate-fade-in-up">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-dark shadow-lg shadow-brand/20">
          <span className="text-2xl font-black text-white tracking-tight">D</span>
        </div>
        <div className="spinner spinner-dark" />
        <p className="text-sm text-muted">{message}</p>
      </div>
    </div>
  );
}
