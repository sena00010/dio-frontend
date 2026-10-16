"use client";

import { useEffect, useState } from "react";

// Logonun dış zeminini (çoğunlukla beyaz) şeffaflaştırır.
// Kenarlardan başlayan taşma doldurma ile yalnızca zemine BAĞLI pikseller silinir;
// logonun içindeki beyaz harf/şekiller korunur. Zemin düz değilse görsel aynen döner.

const cache = new Map<string, Promise<string>>();

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function toDataUrl(src: string): Promise<string> {
  if (src.startsWith("data:")) return src;
  const blob = await fetch(src).then(r => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.blob();
  });
  return new Promise(resolve => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.readAsDataURL(blob);
  });
}

async function process(src: string): Promise<string> {
  const dataUrl = await toDataUrl(src);
  if (dataUrl.startsWith("data:image/svg")) return dataUrl; // vektör logolar zaten şeffaf
  const img = await loadImage(dataUrl);

  // Büyük logoları küçült (hız); çıktı PNG
  const scale = Math.min(1, 800 / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;

  // Zemin rengi: dört köşenin ortalaması; köşeler zaten şeffafsa dokunma
  const corners = [0, w - 1, (h - 1) * w, h * w - 1].map(i => i * 4);
  if (corners.every(i => px[i + 3] < 20)) return dataUrl;
  const bg = [0, 1, 2].map(c => corners.reduce((s, i) => s + px[i + c], 0) / 4);
  const cornerSpread = Math.max(...corners.map(i => Math.abs(px[i] - bg[0]) + Math.abs(px[i + 1] - bg[1]) + Math.abs(px[i + 2] - bg[2])));
  if (cornerSpread > 60) return dataUrl; // köşeler farklı renkte → düz zemin yok

  const TOL = 48; // zemine benzerlik eşiği (RGB toplam fark)
  const dist = (i: number) => Math.abs(px[i] - bg[0]) + Math.abs(px[i + 1] - bg[1]) + Math.abs(px[i + 2] - bg[2]);
  const visited = new Uint8Array(w * h);
  const stack: number[] = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);

  let removed = 0;
  while (stack.length) {
    const p = stack.pop()!;
    if (visited[p]) continue;
    visited[p] = 1;
    const i = p * 4;
    const d = dist(i);
    if (d > TOL) continue;
    // Kenarlarda yumuşak geçiş: zemine çok yakınsa tamamen, sınırdaysa kısmen şeffaf
    px[i + 3] = d < TOL * 0.5 ? 0 : Math.round(px[i + 3] * ((d - TOL * 0.5) / (TOL * 0.5)));
    removed++;
    const x = p % w;
    if (x > 0) stack.push(p - 1);
    if (x < w - 1) stack.push(p + 1);
    if (p >= w) stack.push(p - w);
    if (p < w * (h - 1)) stack.push(p + w);
  }

  // Neredeyse tüm görsel silindiyse (ör. açık renkli logo düz zeminde) orijinali koru
  if (removed > w * h * 0.97) return dataUrl;

  // Harf içi boşluklar (A, O, P, R...): dış zemine bağlı olmayan kapalı zemin-renkli alanlar.
  // İnce bir çizgiyle çevriliyse (kısa mesafede dış zemine ulaşılıyorsa) boşluktur → silinir.
  // Geniş bir renk alanının içindeyse (ör. kırmızı daire içindeki beyaz yazı) bilinçlidir → korunur.
  const outside = visited; // dış zemin pikselleri (taşma doldurmanın gezdiği ve silinenler)
  const isOutside = (q: number) => outside[q] === 1 && px[q * 4 + 3] < 128;
  const reach = Math.max(4, Math.round(Math.min(w, h) * 0.15));
  const seen = new Uint8Array(w * h);
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  for (let start = 0; start < w * h; start++) {
    if (seen[start] || outside[start] || dist(start * 4) > TOL) continue;
    // Kapalı bölgeyi topla
    const region: number[] = [];
    const q = [start];
    seen[start] = 1;
    while (q.length) {
      const p = q.pop()!;
      region.push(p);
      const x = p % w;
      const nbs = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, p >= w ? p - w : -1, p < w * (h - 1) ? p + w : -1];
      for (const nb of nbs) {
        if (nb < 0 || seen[nb] || outside[nb] || dist(nb * 4) > TOL) continue;
        seen[nb] = 1;
        q.push(nb);
      }
    }
    if (region.length > w * h * 0.08) continue; // büyük kapalı alanlar bilinçli tasarımdır
    // Bölge sınırından örnekler: kısa mesafede dış zemine ulaşılıyor mu?
    const inRegion = new Set(region);
    const boundary = region.filter(p => {
      const x = p % w;
      return (x > 0 && !inRegion.has(p - 1)) || (x < w - 1 && !inRegion.has(p + 1)) || !inRegion.has(p - w) || !inRegion.has(p + w);
    });
    const step = Math.max(1, Math.floor(boundary.length / 120));
    let hits = 0, samples = 0;
    for (let k = 0; k < boundary.length; k += step) {
      samples++;
      const bx = boundary[k] % w, by = Math.floor(boundary[k] / w);
      let hit = false;
      for (const [dx, dy] of dirs) {
        for (let d = 1; d <= reach && !hit; d++) {
          const x = bx + dx * d, y = by + dy * d;
          if (x < 0 || y < 0 || x >= w || y >= h) break;
          const qq = y * w + x;
          if (inRegion.has(qq)) continue;
          if (isOutside(qq)) hit = true;
        }
        if (hit) break;
      }
      if (hit) hits++;
    }
    if (samples > 0 && hits / samples >= 0.6) {
      for (const p of region) {
        const i = p * 4;
        const d = dist(i);
        px[i + 3] = d < TOL * 0.5 ? 0 : Math.round(px[i + 3] * ((d - TOL * 0.5) / (TOL * 0.5)));
      }
    }
  }
  ctx.putImageData(data, 0, 0);
  return canvas.toDataURL("image/png");
}

export function makeLogoTransparent(src: string): Promise<string> {
  if (!cache.has(src)) cache.set(src, process(src).catch(() => src));
  return cache.get(src)!;
}

// Bileşenlerde kullanım: şeffaf sürüm hazır olana kadar orijinali gösterir
export function useTransparentLogo(src?: string | null): string | undefined {
  const [out, setOut] = useState<{ src?: string | null; url?: string }>({});
  useEffect(() => {
    if (!src) return;
    let alive = true;
    makeLogoTransparent(src).then(url => { if (alive) setOut({ src, url }); });
    return () => { alive = false; };
  }, [src]);
  if (!src) return undefined;
  return out.src === src ? out.url : src;
}
