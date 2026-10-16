"use client";

import { useState } from "react";
import { useTransparentLogo } from "@/lib/logoTransparent";

// Marka logosu: adres doğru kurulur (CDN tam URL veya /uploads yolu), zemin şeffaflaştırılır,
// logo yoksa / yüklenemezse baş harfler gösterilir. Tüm ekranlarda bu bileşen kullanılır.

const API = process.env.NEXT_PUBLIC_API_URL || "";

export function mediaUrl(u?: string | null): string {
  if (!u) return "";
  if (/^(https?:|data:|blob:)/.test(u)) return u;
  return u.startsWith("/") ? `${API}${u}` : `${API}/${u}`;
}

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toLocaleUpperCase("tr-TR") || "?";

export default function BrandLogo({ logoUrl, name, size = 40, className = "" }: { logoUrl?: string | null; name: string; size?: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  const src = useTransparentLogo(logoUrl && !failed ? mediaUrl(logoUrl) : null);

  if (!src) {
    return (
      <span className={`inline-flex shrink-0 items-center justify-center rounded-lg bg-brand font-bold text-white ${className}`}
        style={{ width: size, height: size, fontSize: Math.max(10, size * 0.36) }} aria-label={name}>
        {initials(name)}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name} onError={() => setFailed(true)}
      className={`shrink-0 rounded-lg object-contain ${className}`} style={{ width: size, height: size }} />
  );
}
