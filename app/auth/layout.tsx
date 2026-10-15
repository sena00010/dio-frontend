"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { FullPageSpinner } from "@/components/ui/spinner";

const ROTATING = ["planlasın", "tasarlasın", "yazsın", "zamanlasın"];
const SPECIAL_DAYS = ["Anneler Günü", "Black Friday", "Ramazan Bayramı", "23 Nisan", "Sevgililer Günü", "Öğretmenler Günü", "Yılbaşı", "Babalar Günü", "29 Ekim", "11.11"];
const PLATFORMS = ["Instagram", "Facebook", "LinkedIn", "TikTok"];

// Başlıktaki dönen kelime
function RotatingWord() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI(x => (x + 1) % ROTATING.length), 2200);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="relative inline-block min-w-[5.5em] align-bottom">
      <span key={i} className="dio-word-in inline-block bg-gradient-to-r from-white via-[#ffe4dc] to-[#ffd36e] bg-clip-text text-transparent">
        {ROTATING[i]}.
      </span>
    </span>
  );
}

// Ürünün gerçek parçalarından kolaj: gönderi, carousel slaytı, haftalık plan
function ProductCollage() {
  return (
    // Kısa ekranlarda gizlemek yerine küçültülür (1366x768 gibi yaygın dizüstüler)
    <div className="relative mx-auto h-[400px] w-full max-w-[560px] origin-top [@media(max-height:900px)]:-mb-[100px] [@media(max-height:900px)]:scale-[0.75] [@media(max-height:800px)]:-mb-[140px] [@media(max-height:800px)]:scale-[0.65] [@media(max-height:620px)]:hidden">
      {/* Instagram gönderisi */}
      <div className="dio-float absolute left-0 top-6 w-[230px] rotate-[-6deg] overflow-hidden rounded-2xl bg-white text-zinc-900 shadow-2xl shadow-black/25">
        <div className="flex items-center gap-2 px-3 py-2.5">
          <span className="h-7 w-7 rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 p-[2px]"><span className="block h-full w-full rounded-full bg-brand" /></span>
          <span className="text-[12px] font-semibold">markaniz</span>
          <span className="ml-auto text-zinc-400">•••</span>
        </div>
        <div className="relative aspect-[4/5] bg-[radial-gradient(circle_at_30%_20%,#fdba74,#c2410c_45%,#1c1917)]">
          <span className="absolute left-4 top-4 h-1.5 w-10 rounded-full bg-white/80" />
          <p className="absolute bottom-5 left-4 right-4 text-[20px] font-extrabold leading-tight text-white drop-shadow">Kampanyanız hazır, siz sadece onaylayın.</p>
        </div>
        <div className="flex gap-3 px-3 pt-2.5 text-zinc-900">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#ef4444"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" /></svg>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.4 8.4 0 0 1-12.6 7.3L3 21l2.2-5.4A8.4 8.4 0 1 1 21 11.5z" /></svg>
        </div>
        <div className="space-y-1.5 px-3 pb-3 pt-2">
          <span className="block h-2 w-4/5 rounded-full bg-zinc-200" />
          <span className="block h-2 w-3/5 rounded-full bg-zinc-200" />
        </div>
      </div>

      {/* Carousel slaytı */}
      <div className="dio-float-delayed absolute right-2 top-0 w-[190px] rotate-[5deg] overflow-hidden rounded-2xl bg-white p-5 text-brand shadow-2xl shadow-black/25">
        <p className="text-[44px] font-black leading-none opacity-25">01</p>
        <p className="mt-6 text-[17px] font-extrabold leading-tight text-zinc-900">Tatlıları açıkta bırakmayın</p>
        <span className="my-3 block h-1 w-8 rounded-full bg-brand" />
        <p className="text-[11px] leading-relaxed text-zinc-500">Streçle kapatın; açık yüzey nem kaybedince lezzet hemen düşer.</p>
        <div className="mt-5 flex justify-between text-[10px] font-bold text-zinc-400"><span>Carousel</span><span>2/5 →</span></div>
      </div>

      {/* Haftalık plan */}
      <div className="dio-float absolute bottom-0 right-10 w-[260px] rounded-2xl border border-white/30 bg-white/20 p-4 text-white shadow-2xl shadow-black/15 backdrop-blur-xl">
        <p className="text-[11px] font-bold uppercase tracking-widest text-white/85">Bu hafta</p>
        <ul className="mt-3 space-y-2">
          {[
            ["Sal", "19:00", "Eğitici ipucu", "bg-sky-400"],
            ["Per", "19:00", "Carousel", "bg-amber-400"],
            ["Cmt", "10:00", "Özel gün", "bg-emerald-400"],
          ].map(([d, t, label, dot]) => (
            <li key={d} className="flex items-center gap-3 rounded-xl bg-white/15 px-3 py-2">
              <span className="w-8 text-[12px] font-bold">{d}</span>
              <span className={`h-2 w-2 rounded-full ${dot}`} />
              <span className="flex-1 text-[12px] font-medium">{label}</span>
              <span className="text-[11px] text-white/85">{t}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Durum rozeti */}
      <div className="dio-float-delayed absolute left-[34%] top-[-6px] flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-[12px] font-bold text-zinc-900 shadow-xl">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white">✓</span>
        4 gönderi takvime eklendi
      </div>
    </div>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();

  // AuthProvider handles redirects; show spinner while checking
  if (loading || user) {
    return <FullPageSpinner message="Kontrol ediliyor…" />;
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* ── Marka paneli (geniş ekran) ── */}
      <aside className="dio-gradient-shift relative hidden w-[55%] flex-col overflow-hidden bg-[linear-gradient(135deg,#d91f2a_0%,#e6272f_35%,#ff5a3c_65%,#d91f2a_100%)] px-14 py-12 text-white lg:flex">
        {/* Hareketli ışık katmanları */}
        <div className="dio-blob pointer-events-none absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-white/10 blur-[130px]" />
        <div className="dio-blob-delayed pointer-events-none absolute right-[-120px] top-1/3 h-[420px] w-[420px] rounded-full bg-[#ff8a5c]/30 blur-[130px]" />
        <div className="dio-blob pointer-events-none absolute -bottom-48 left-1/3 h-[420px] w-[420px] rounded-full bg-[#b3121b]/50 blur-[140px]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.12]" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "26px 26px" }} />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-sm font-black tracking-tight text-brand shadow-lg shadow-black/10">DIO</span>
            <span className="leading-tight">
              <span className="block text-[15px] font-bold">DIO</span>
              <span className="block text-[11px] font-medium tracking-wide text-white/75">DİJİTAL İŞ ORTAĞI</span>
            </span>
          </div>
          <span className="rounded-full border border-white/30 bg-white/15 px-3 py-1 text-[12px] font-semibold text-white backdrop-blur">
            ✨ Yeni: Ayın planı ve carousel
          </span>
        </div>

        <div className="relative mt-[6vh]">
          <h2 className="max-w-[620px] text-[44px] font-extrabold leading-[1.05] tracking-tight xl:text-[54px]">
            Sosyal medyanızı yapay zekâ <RotatingWord />
          </h2>
          <p className="mt-4 max-w-[520px] text-[16px] leading-relaxed text-white/85">
            Markanızı bir kez tanıtın. DIO her ay içeriklerinizi yazar, kendi renklerinizle tasarlar ve takviminize yerleştirir.
          </p>
        </div>

        <div className="relative mt-8 flex-1">
          <ProductCollage />
        </div>

        {/* Özel günler şeridi + platformlar */}
        <div className="relative mt-6 space-y-4">
          <div className="dio-marquee-mask overflow-hidden">
            <div className="dio-marquee flex w-max gap-2">
              {[...SPECIAL_DAYS, ...SPECIAL_DAYS].map((d, i) => (
                <span key={i} className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-white/30 bg-white/15 px-3 py-1.5 text-[12px] font-semibold text-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />{d}
                </span>
              ))}
            </div>
          </div>
          <p className="text-[12px] text-white/75">
            {PLATFORMS.join(" · ")} için içerik · Türkçe, Türkiye takvimine göre
          </p>
        </div>
      </aside>

      {/* ── Form alanı ── */}
      <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-white px-5 py-10 sm:px-10">
        {/* Mobil: üstte hareketli kırmızı geçiş bandı; geniş ekran: beyaz zemin */}
        <div className="dio-gradient-shift pointer-events-none absolute inset-x-0 top-0 h-[360px] rounded-b-[44px] bg-[linear-gradient(135deg,#d91f2a_0%,#e6272f_35%,#ff5a3c_65%,#d91f2a_100%)] lg:hidden" />
        <div className="dio-blob pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-white/25 blur-[100px] lg:hidden" />
        <div className="dio-blob-delayed pointer-events-none absolute -right-24 top-24 h-72 w-72 rounded-full bg-[#ffb199]/40 blur-[100px] lg:hidden" />
        <div className="dio-blob pointer-events-none absolute -right-32 -top-32 hidden h-96 w-96 rounded-full bg-brand/15 blur-3xl lg:block" />
        <div className="dio-blob-delayed pointer-events-none absolute -bottom-32 -left-24 hidden h-80 w-80 rounded-full bg-[#ff6b4a]/15 blur-3xl lg:block" />
        <div className="pointer-events-none absolute inset-0 hidden opacity-[0.5] lg:block" style={{ backgroundImage: "radial-gradient(circle, #fecaca 1px, transparent 1px)", backgroundSize: "22px 22px" }} />

        {/* Mobil üst bölüm */}
        <div className="relative mb-7 w-full max-w-[440px] text-white lg:hidden">
          <div className="mb-6 flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[13px] font-black text-brand shadow-lg shadow-black/10">DIO</span>
            <span className="text-[12px] font-semibold tracking-wide text-white/85">DİJİTAL İŞ ORTAĞI</span>
          </div>
          <h2 className="text-[32px] font-extrabold leading-[1.08] tracking-tight">
            Sosyal medyanızı yapay zekâ <RotatingWord />
          </h2>
        </div>

        <div className="relative w-full max-w-[440px] rounded-3xl bg-white p-7 shadow-[0_30px_70px_-25px_rgba(230,39,47,0.35)] ring-1 ring-brand/10 sm:p-9">
          <span className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-[12px] font-semibold text-brand">
            ✨ Yapay zekâ destekli içerik
          </span>
          {children}
        </div>
      </main>
    </div>
  );
}
