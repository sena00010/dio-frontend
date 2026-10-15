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
    <span key={i} className="dio-word-in inline-block bg-gradient-to-r from-white to-[#ffd1d3] bg-clip-text text-transparent">
      {ROTATING[i]}.
    </span>
  );
}

// Formun iki yanında süzülen örnek gönderiler — görseller DIO'nun kendi görsel motoruyla üretildi
type Sample = { img: string; handle: string; title: string };
const LEFT_SAMPLES: Sample[] = [
  { img: "kahve", handle: "kosebasikahve", title: "Güne iyi bir kahveyle başlayın" },
  { img: "moda", handle: "atelyemoda", title: "Yeni sezon vitrinde" },
  { img: "restoran", handle: "ocakbasi.ist", title: "Hafta sonu menüsü hazır" },
  { img: "emlak", handle: "yuvaemlak", title: "Hayalinizdeki eve bir adım" },
];
const RIGHT_SAMPLES: Sample[] = [
  { img: "pastane", handle: "lezzetduragi", title: "Kahve yanına en iyi 5 tatlı" },
  { img: "kozmetik", handle: "pudraguzellik", title: "Cildiniz için 3 basit adım" },
  { img: "spor", handle: "formfit.club", title: "30 günde yeni bir alışkanlık" },
  { img: "cicek", handle: "gulbahcesi", title: "Sevdiklerinize özel buketler" },
];

function SamplePost({ samples, delay, className }: { samples: Sample[]; delay: number; className: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    const start = setTimeout(() => {
      interval = setInterval(() => setI(x => (x + 1) % samples.length), 3600);
    }, delay);
    return () => { clearTimeout(start); clearInterval(interval); };
  }, [samples.length, delay]);
  const cur = samples[i];

  return (
    <div className={`pointer-events-none absolute w-[200px] overflow-hidden rounded-2xl bg-white shadow-2xl shadow-red-900/20 ring-1 ring-black/5 ${className}`}>
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className="h-6 w-6 rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 p-[2px]">
          <span className="block h-full w-full rounded-full bg-brand" />
        </span>
        <span key={cur.handle} className="dio-word-in text-[11px] font-semibold text-zinc-800">{cur.handle}</span>
        <span className="ml-auto text-zinc-400">•••</span>
      </div>
      <div className="relative aspect-[4/5] bg-gradient-to-br from-[#ff4d54] to-[#c91f26]">
        {samples.map((sm, idx) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={sm.img} src={`/login-samples/${sm.img}.jpg`} alt="" loading={idx === 0 ? "eager" : "lazy"}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${idx === i ? "opacity-100" : "opacity-0"}`} />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <p key={cur.title} className="dio-word-in absolute bottom-4 left-3 right-3 text-[16px] font-extrabold leading-tight text-white">{cur.title}</p>
        <div className="absolute left-0 right-0 top-2 flex justify-center gap-1">
          {samples.map((sm, idx) => <span key={sm.img} className={`h-1 rounded-full transition-all ${idx === i ? "w-4 bg-white" : "w-1.5 bg-white/50"}`} />)}
        </div>
      </div>
      <div className="flex gap-3 px-3 pt-2.5 text-zinc-900">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#e6272f"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" /></svg>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.4 8.4 0 0 1-12.6 7.3L3 21l2.2-5.4A8.4 8.4 0 1 1 21 11.5z" /></svg>
      </div>
      <div className="space-y-1.5 px-3 pb-3 pt-2">
        <span className="block h-1.5 w-4/5 rounded-full bg-zinc-200" />
        <span className="block h-1.5 w-1/2 rounded-full bg-zinc-200" />
      </div>
    </div>
  );
}

// Yan gönderiler yalnızca geniş ekranda gösterilir (mobilde görseller indirilmez)
function useWide() {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    const update = () => setWide(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return wide;
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();
  const wide = useWide();

  // AuthProvider handles redirects; show spinner while checking
  if (loading || user) {
    return <FullPageSpinner message="Kontrol ediliyor…" />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fafafa]">
      {/* Üstte hareketli kırmızı geçiş bandı ve dalga */}
      <div className="dio-gradient-shift absolute inset-x-0 top-0 h-[400px] bg-[linear-gradient(120deg,#e6272f_0%,#c91f26_35%,#e6272f_65%,#d4222b_100%)] md:h-[52vh] md:min-h-[440px]" />
      <div className="dio-blob pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-white/15 blur-[90px]" />
      <div className="dio-blob-delayed pointer-events-none absolute right-0 top-24 h-80 w-80 rounded-full bg-[#ff4d54]/30 blur-[100px]" />
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
          {wide && (
            <>
              <SamplePost samples={LEFT_SAMPLES} delay={0} className="dio-float -left-[260px] top-12 rotate-[-6deg]" />
              <SamplePost samples={RIGHT_SAMPLES} delay={1800} className="dio-float-delayed -right-[260px] top-24 rotate-[6deg]" />
            </>
          )}
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
