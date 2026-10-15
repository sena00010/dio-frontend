"use client";

import { useAuth } from "@/lib/auth-context";
import { FullPageSpinner } from "@/components/ui/spinner";

const FEATURES = [
  { title: "Ayın planı tek tıkla", text: "Eğitici, etkileşim ve kampanya içerikleri dengeli dağılır; özel günler otomatik eklenir." },
  { title: "Marka kimliğinizle tasarım", text: "Instagram oranında görseller ve carousel'ler; logonuz ve renklerinizle." },
  { title: "Üret, düzenle, zamanla", text: "Fikirden yayına tek akış; her şey takviminizde." },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();

  // AuthProvider handles redirects; show spinner while checking
  if (loading || user) {
    return <FullPageSpinner message="Kontrol ediliyor…" />;
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* ── Marka paneli (geniş ekran) ── */}
      <aside className="relative hidden w-[46%] max-w-[720px] flex-col justify-between overflow-hidden bg-[#0d0d10] p-12 text-white lg:flex">
        <div className="pointer-events-none absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-brand/40 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-40 right-0 h-[360px] w-[360px] rounded-full bg-orange-500/20 blur-[120px]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }}
        />

        <div className="relative flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-sm font-black tracking-tight">DIO</span>
          <span className="leading-tight">
            <span className="block text-[15px] font-bold">DIO</span>
            <span className="block text-[11px] font-medium tracking-wide text-white/50">DİJİTAL İŞ ORTAĞI</span>
          </span>
        </div>

        <div className="relative">
          <h2 className="max-w-md text-[34px] font-bold leading-[1.12] tracking-tight xl:text-[38px]">
            Sosyal medyanız <span className="text-brand-light">yapay zekâ</span> ile kendiliğinden büyüsün.
          </h2>
          <ul className="mt-7 max-w-md space-y-4">
            {FEATURES.map((f, i) => (
              <li key={f.title} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-sm font-bold">{i + 1}</span>
                <span>
                  <span className="block text-[15px] font-semibold">{f.title}</span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-white/60">{f.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Örnek gönderi kartı */}
        <div className="relative flex items-end justify-between gap-6 [@media(max-height:940px)]:hidden">
          <div className="w-[210px] rotate-[-3deg] overflow-hidden rounded-2xl bg-white text-zinc-900 shadow-2xl shadow-black/40">
            <div className="flex items-center gap-2 px-3 py-2.5">
              <span className="h-7 w-7 rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 p-[2px]">
                <span className="block h-full w-full rounded-full bg-brand" />
              </span>
              <span className="text-[12px] font-semibold">markaniz</span>
            </div>
            <div className="relative aspect-[4/5] bg-gradient-to-br from-[#7c2d12] via-[#c2410c] to-[#1c1917] p-4">
              <span className="absolute left-4 top-4 h-1.5 w-10 rounded-full bg-white/80" />
              <p className="absolute bottom-5 left-4 right-4 text-[19px] font-extrabold leading-tight text-white">Kampanyanız hazır, siz sadece onaylayın.</p>
            </div>
            <div className="space-y-1.5 px-3 py-3">
              <span className="block h-2 w-4/5 rounded-full bg-zinc-200" />
              <span className="block h-2 w-3/5 rounded-full bg-zinc-200" />
            </div>
          </div>
          <div className="mb-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/50">Planlandı</p>
            <p className="text-sm font-semibold">Perşembe · 19:00</p>
          </div>
        </div>
      </aside>

      {/* ── Form alanı ── */}
      <main className="flex flex-1 items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-[420px]">{children}</div>
      </main>
    </div>
  );
}
