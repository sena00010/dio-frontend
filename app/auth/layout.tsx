"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { FullPageSpinner } from "@/components/ui/spinner";

const ROTATING = ["planlasın", "tasarlasın", "yazsın", "zamanlasın"];
const FEATURES = ["Ayın planı tek tıkla", "Marka renklerinizle tasarım", "Carousel ve Instagram formatı", "Türk özel günleri otomatik"];

// Başlıktaki dönen kelime
function RotatingWord() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI(x => (x + 1) % ROTATING.length), 2200);
    return () => clearInterval(t);
  }, []);
  return (
    <span key={i} className="dio-word-in inline-block bg-gradient-to-r from-white to-[#ffe08a] bg-clip-text text-transparent">
      {ROTATING[i]}.
    </span>
  );
}

// Formun iki yanında süzülen örnek gönderi kartı
function SamplePost({ title, from, to, className }: { title: string; from: string; to: string; className: string }) {
  return (
    <div className={`pointer-events-none absolute hidden w-[190px] overflow-hidden rounded-2xl bg-white shadow-2xl shadow-red-900/20 ring-1 ring-black/5 xl:block ${className}`}>
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className="h-6 w-6 rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600" />
        <span className="text-[11px] font-semibold text-zinc-800">markaniz</span>
        <span className="ml-auto text-zinc-400">•••</span>
      </div>
      <div className="relative aspect-[4/5]" style={{ background: `linear-gradient(150deg, ${from}, ${to})` }}>
        <span className="absolute left-3 top-3 h-1.5 w-8 rounded-full bg-white/80" />
        <p className="absolute bottom-4 left-3 right-3 text-[16px] font-extrabold leading-tight text-white drop-shadow">{title}</p>
      </div>
      <div className="space-y-1.5 px-3 py-3">
        <span className="block h-1.5 w-4/5 rounded-full bg-zinc-200" />
        <span className="block h-1.5 w-1/2 rounded-full bg-zinc-200" />
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
    <div className="relative min-h-screen overflow-hidden bg-[#fafafa]">
      {/* Üstte hareketli kırmızı geçiş bandı ve dalga */}
      <div className="dio-gradient-shift absolute inset-x-0 top-0 h-[400px] bg-[linear-gradient(120deg,#e6272f_0%,#ff5a3c_35%,#ff8a5c_65%,#e6272f_100%)] md:h-[52vh] md:min-h-[440px]" />
      <div className="dio-blob pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-white/15 blur-[90px]" />
      <div className="dio-blob-delayed pointer-events-none absolute right-0 top-24 h-80 w-80 rounded-full bg-[#ffd1b8]/25 blur-[100px]" />
      <svg className="absolute inset-x-0 top-[280px] h-[120px] w-full md:top-[calc(max(52vh,440px)-120px)] md:h-[160px]" viewBox="0 0 1440 160" preserveAspectRatio="none" aria-hidden>
        <path d="M0,80 C320,160 520,0 860,60 C1120,110 1300,40 1440,70 L1440,160 L0,160 Z" fill="#fafafa" />
      </svg>

      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-5 pb-12 pt-6 md:px-6 md:pt-10">
        {/* Üst çubuk */}
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[13px] font-black text-brand shadow-lg shadow-red-900/15">DIO</span>
            <span className="text-[12px] font-bold tracking-wide text-white/90">DİJİTAL İŞ ORTAĞI</span>
          </div>
          <span className="hidden rounded-full bg-white/20 px-3 py-1 text-[12px] font-semibold text-white backdrop-blur sm:inline">
            ✨ Yeni: Ayın planı ve carousel
          </span>
        </div>

        {/* Başlık */}
        <h2 className="mt-8 text-center text-[32px] font-extrabold leading-[1.08] tracking-tight text-white md:mt-12 md:text-[52px]">
          Sosyal medyanızı yapay zekâ <RotatingWord />
        </h2>
        <p className="mt-3 max-w-xl text-center text-[15px] text-white/90 md:text-[17px]">
          Markanızı bir kez tanıtın; içerikleri DIO yazsın, tasarlasın ve takviminize yerleştirsin.
        </p>

        {/* Form kartı + yanlarda örnek gönderiler */}
        <div className="relative mt-8 w-full max-w-[440px] md:mt-10">
          <SamplePost title="Kampanyanız hazır, siz sadece onaylayın." from="#ff8a5c" to="#e6272f" className="dio-float -left-[250px] top-14 rotate-[-6deg]" />
          <SamplePost title="Kahve yanına en iyi 5 tatlı" from="#f59e0b" to="#ef4444" className="dio-float-delayed -right-[250px] top-24 rotate-[6deg]" />
          <div className="relative rounded-3xl bg-white p-7 shadow-[0_30px_80px_-30px_rgba(17,24,39,0.35)] ring-1 ring-black/5 sm:p-9">
            {children}
          </div>
        </div>

        {/* Özellikler */}
        <ul className="mt-8 flex max-w-2xl flex-wrap justify-center gap-2">
          {FEATURES.map(f => (
            <li key={f} className="flex items-center gap-1.5 rounded-full border border-red-100 bg-white px-3 py-1.5 text-[12px] font-semibold text-zinc-600 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />{f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
