"use client";

import { useState, type ReactNode } from "react";

// Gönderinin platformda nasıl görüneceğini gösteren önizleme (Instagram / LinkedIn / genel feed)

export function platformAspectClass(platform?: string) {
  const p = (platform || "").toLowerCase();
  if (p === "instagram" || p === "facebook") return "aspect-[4/5]";
  if (p === "tiktok" || p.includes("story") || p.includes("reels")) return "aspect-[9/16]";
  if (p === "twitter" || p === "x") return "aspect-video";
  return "aspect-square";
}

type PostPreviewProps = {
  platform: string;
  brandName: string;
  logoUrl?: string;
  imageUrl?: string | null;
  caption: string;
  hashtags?: string;
  // Carousel: her slayt 378 px genişlikte hazır bir düğüm (görsel yerine gösterilir)
  slides?: ReactNode[];
};

function CarouselMedia({ slides }: { slides: ReactNode[] }) {
  const [idx, setIdx] = useState(0);
  const go = (d: number) => setIdx(i => Math.min(slides.length - 1, Math.max(0, i + d)));
  return (
    <div className="relative">
      <div className="overflow-hidden">{slides[idx]}</div>
      <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">{idx + 1}/{slides.length}</span>
      {idx > 0 && (
        <button type="button" onClick={() => go(-1)} aria-label="Önceki slayt" className="absolute left-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-sm shadow">‹</button>
      )}
      {idx < slides.length - 1 && (
        <button type="button" onClick={() => go(1)} aria-label="Sonraki slayt" className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-sm shadow">›</button>
      )}
      <div className="flex justify-center gap-1 py-2">
        {slides.map((_, i) => <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === idx ? "bg-[#0095f6]" : "bg-zinc-300"}`} />)}
      </div>
    </div>
  );
}

function Avatar({ brandName, logoUrl, size }: { brandName: string; logoUrl?: string; size: number }) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} alt={brandName} className="rounded-full border border-zinc-200 bg-white object-contain" style={{ width: size, height: size }} />;
  }
  return (
    <div className="flex items-center justify-center rounded-full bg-brand text-white font-bold" style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {(brandName || "?").charAt(0).toUpperCase()}
    </div>
  );
}

function Caption({ caption, hashtags, collapsedLines }: { caption: string; hashtags?: string; collapsedLines: number }) {
  const [expanded, setExpanded] = useState(false);
  const full = [caption.trim(), (hashtags || "").trim()].filter(Boolean).join("\n\n");
  const lines = full.split("\n");
  const isLong = lines.length > collapsedLines || full.length > 140;
  const visible = expanded || !isLong ? full : lines.slice(0, collapsedLines).join("\n").slice(0, 140).trimEnd();

  return (
    <p className="whitespace-pre-line text-[13px] leading-[1.45] text-zinc-900">
      {visible.split(/(#[\p{L}\p{N}_]+)/u).map((part, i) =>
        part.startsWith("#") ? <span key={i} className="text-[#00376b]">{part}</span> : <span key={i}>{part}</span>
      )}
      {isLong && !expanded && (
        <button type="button" onClick={() => setExpanded(true)} className="ml-1 text-zinc-500">
          …devamını gör
        </button>
      )}
    </p>
  );
}

export default function PostPreview({ platform, brandName, logoUrl, imageUrl, caption, hashtags, slides }: PostPreviewProps) {
  const trMap: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" };
  const handle = brandName.toLocaleLowerCase("tr-TR").replace(/[çğıöşü]/g, ch => trMap[ch]).replace(/[^a-z0-9._]+/g, "");
  const isLinkedIn = platform.toLowerCase() === "linkedin";
  const media = slides && slides.length > 0 ? <CarouselMedia slides={slides} /> : (
    <div className={`${platformAspectClass(platform)} w-full bg-zinc-100`}>
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="Gönderi görseli" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center text-xs text-zinc-400">Görsel seçin</div>
      )}
    </div>
  );

  if (isLinkedIn) {
    return (
      <div className="w-full max-w-[380px] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex items-center gap-2.5 px-3 py-2.5">
          <Avatar brandName={brandName} logoUrl={logoUrl} size={40} />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-zinc-900">{brandName}</p>
            <p className="text-[11px] text-zinc-500">Şimdi · 🌐</p>
          </div>
        </div>
        <div className="px-3 pb-2">
          <Caption caption={caption} hashtags={hashtags} collapsedLines={3} />
        </div>
        {media}
        <div className="flex justify-around border-t border-zinc-100 py-2 text-[12px] font-semibold text-zinc-500">
          <span>👍 Beğen</span><span>💬 Yorum</span><span>↻ Paylaş</span>
        </div>
      </div>
    );
  }

  // Instagram ve diğer feed platformları
  return (
    <div className="w-full max-w-[380px] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div className="rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 p-[2px]">
          <div className="rounded-full bg-white p-[1.5px]">
            <Avatar brandName={brandName} logoUrl={logoUrl} size={30} />
          </div>
        </div>
        <p className="flex-1 truncate text-[13px] font-semibold text-zinc-900">{handle || brandName}</p>
        <span className="text-zinc-500">•••</span>
      </div>
      {media}
      <div className="flex items-center gap-4 px-3 pt-2.5 text-zinc-900" aria-hidden>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" /></svg>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.4 8.4 0 0 1-12.6 7.3L3 21l2.2-5.4A8.4 8.4 0 1 1 21 11.5z" /></svg>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
        <svg className="ml-auto" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
      </div>
      <div className="px-3 pb-3 pt-1.5">
        <p className="mb-0.5 text-[13px] font-semibold text-zinc-900">{handle || brandName}</p>
        <Caption caption={caption} hashtags={hashtags} collapsedLines={2} />
      </div>
    </div>
  );
}
