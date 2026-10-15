"use client";

import { forwardRef } from "react";

// Carousel slaytını 4:5 (1080x1350) oranında çizer. Ölçüler genişliğe göre ölçeklenir,
// böylece aynı bileşen küçük önizlemede ve dışa aktarımda birebir aynı görünür.

export type Slide = {
  id: number;
  position: number;
  role: "cover" | "value" | "cta";
  headline: string;
  body: string;
  bg_color: string;
  image_url?: string;
  rendered_url?: string;
};

export type SlideBrand = { name: string; logoSrc?: string };

const FONT = "Inter, Montserrat, 'Helvetica Neue', Arial, sans-serif";

// Arka plan rengine göre okunaklı metin rengi
export function textOn(bg: string) {
  const hex = bg.replace("#", "");
  const full = hex.length === 3 ? hex.split("").map(c => c + c).join("") : hex;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return "#ffffff";
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.45 ? "#111827" : "#ffffff";
}

type Props = { slide: Slide; total: number; brand: SlideBrand; width: number; imageSrc?: string };

const SlideCanvas = forwardRef<HTMLDivElement, Props>(function SlideCanvas({ slide, total, brand, width, imageSrc }, ref) {
  const u = width / 1080; // 1080 px tasarım ölçeği
  const height = Math.round(width * 1.25);
  const bg = slide.bg_color || "#1f2937";
  const fg = textOn(bg);
  const muted = fg === "#ffffff" ? "rgba(255,255,255,0.72)" : "rgba(17,24,39,0.68)";
  const pad = 88 * u;

  const logo = (size: number) =>
    brand.logoSrc ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={brand.logoSrc} alt="" style={{ height: size, width: "auto", maxWidth: size * 3, objectFit: "contain" }} />
    ) : (
      <span style={{ fontWeight: 800, fontSize: size * 0.55, letterSpacing: 0.5 }}>{brand.name}</span>
    );

  const base: React.CSSProperties = {
    position: "relative", width, height, overflow: "hidden", fontFamily: FONT,
    background: bg, color: fg, boxSizing: "border-box",
  };

  if (slide.role === "cover") {
    return (
      <div ref={ref} style={base}>
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageSrc} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(150deg, ${bg} 0%, #111827 100%)` }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.05) 30%, rgba(0,0,0,0.78) 100%)" }} />
        <div style={{ position: "absolute", top: pad * 0.8, left: pad, color: "#fff" }}>{logo(64 * u)}</div>
        <div style={{ position: "absolute", left: pad, right: pad, bottom: pad * 1.5, color: "#fff" }}>
          <div style={{ width: 96 * u, height: 10 * u, background: bg === "#1f2937" ? "#fff" : bg, borderRadius: 99, marginBottom: 36 * u }} />
          <div style={{ fontSize: 92 * u, fontWeight: 800, lineHeight: 1.05, letterSpacing: -1 * u }}>{slide.headline}</div>
          {slide.body && <div style={{ marginTop: 28 * u, fontSize: 40 * u, lineHeight: 1.35, opacity: 0.9 }}>{slide.body}</div>}
        </div>
        <div style={{ position: "absolute", right: pad, bottom: pad * 0.6, color: "#fff", fontSize: 30 * u, fontWeight: 700, background: "rgba(255,255,255,0.18)", borderRadius: 99, padding: `${12 * u}px ${28 * u}px` }}>
          Kaydır →
        </div>
      </div>
    );
  }

  if (slide.role === "cta") {
    return (
      <div ref={ref} style={{ ...base, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: pad }}>
        <div style={{ marginBottom: 56 * u }}>{logo(120 * u)}</div>
        <div style={{ fontSize: 84 * u, fontWeight: 800, lineHeight: 1.08, letterSpacing: -1 * u }}>{slide.headline}</div>
        {slide.body && <div style={{ marginTop: 32 * u, fontSize: 40 * u, lineHeight: 1.4, color: muted, maxWidth: 820 * u }}>{slide.body}</div>}
        <div style={{ position: "absolute", bottom: pad * 0.7, fontSize: 30 * u, fontWeight: 700, color: muted }}>{brand.name}</div>
      </div>
    );
  }

  // Değer slaytı
  return (
    <div ref={ref} style={{ ...base, padding: pad, display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 150 * u, fontWeight: 900, lineHeight: 1, opacity: 0.18 }}>{String(slide.position).padStart(2, "0")}</div>
      <div style={{ marginTop: "auto", marginBottom: "auto" }}>
        <div style={{ fontSize: 76 * u, fontWeight: 800, lineHeight: 1.1, letterSpacing: -1 * u }}>{slide.headline}</div>
        <div style={{ width: 80 * u, height: 8 * u, background: fg, opacity: 0.85, borderRadius: 99, margin: `${40 * u}px 0` }} />
        <div style={{ fontSize: 44 * u, lineHeight: 1.45, color: muted }}>{slide.body}</div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 30 * u, fontWeight: 700, color: muted }}>
        <span>{brand.name}</span>
        <span>{slide.position + 1}/{total} →</span>
      </div>
    </div>
  );
});

export default SlideCanvas;
