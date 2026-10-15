"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import api from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { getApiError } from "@/lib/apiError";
import PostPreview from "../PostPreview";
import SlideCanvas, { type Slide } from "./SlideCanvas";

// Carousel düzenleyici: slayt metinleri ve renkleri düzenlenir, her slayt 1080x1350 PNG olarak kaydedilir.

type CarouselData = {
  post: { id: number; title: string; content: string; hashtags?: string; platform: string };
  slides: Slide[];
  company: { name: string; logo_url?: string; brand_colors?: string };
};

const API = process.env.NEXT_PUBLIC_API_URL || "";
const abs = (u?: string) => (!u ? "" : u.startsWith("/") ? `${API}${u}` : u);
const NEUTRALS = ["#111827", "#ffffff", "#f5f0e8"];
const EXPORT_WIDTH = 540; // pixelRatio 2 → 1080x1350

// Uzak görseli dışa aktarımda tuvali kirletmemesi için data URL'e çevirir
async function toDataUrl(url: string): Promise<string> {
  const blob = await fetch(url).then(r => r.blob());
  return new Promise(resolve => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.readAsDataURL(blob);
  });
}

export default function CarouselEditor({ postId, onBack, onComplete }: { postId: number; onBack: () => void; onComplete: () => void }) {
  const toast = useToast();
  const [data, setData] = useState<CarouselData | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [slideCount, setSlideCount] = useState(5);
  const [images, setImages] = useState<Record<string, string>>({}); // url → data URL
  const exportRefs = useRef<(HTMLDivElement | null)[]>([]);
  const requested = useRef(new Set<string>());

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/api/protected/posts/${postId}/carousel`);
      setData(data);
      setSlides(data.slides || []);
    } catch (err) {
      toast.error(getApiError(err, "Carousel yüklenemedi."));
    } finally {
      setLoading(false);
    }
  }, [postId, toast]);

  useEffect(() => { load(); }, [load]);

  // Kapak görseli ve logo data URL'e çevrilir (dışa aktarım için şart)
  useEffect(() => {
    const urls = [data?.company.logo_url, ...slides.map(s => s.image_url)].map(abs).filter(u => u && !requested.current.has(u));
    urls.forEach(u => {
      requested.current.add(u);
      toDataUrl(u).then(d => setImages(m => ({ ...m, [u]: d }))).catch(() => setImages(m => ({ ...m, [u]: u })));
    });
  }, [data?.company.logo_url, slides]);

  const brandColors = useMemo(() => {
    try {
      const c = JSON.parse(data?.company.brand_colors || "[]");
      return Array.isArray(c) ? c.filter((x: unknown) => typeof x === "string" && x.startsWith("#")) : [];
    } catch {
      return [];
    }
  }, [data?.company.brand_colors]);

  const brand = { name: data?.company.name || "", logoSrc: images[abs(data?.company.logo_url)] || undefined };

  const generate = useCallback(async () => {
    setGenerating(true);
    try {
      const { data: res } = await api.post(`/api/protected/posts/${postId}/carousel`, { slide_count: slideCount });
      setSlides(res.slides || []);
      setActive(0);
      if (res.cover_image_failed) toast.info("Kapak görseli üretilemedi; kapak marka renginde hazırlandı.");
      else toast.success("Carousel hazır. Metinleri düzenleyip kaydedebilirsiniz.");
    } catch (err) {
      toast.error(getApiError(err, "Carousel üretilemedi."));
    } finally {
      setGenerating(false);
    }
  }, [postId, slideCount, toast]);

  const update = (patch: Partial<Slide>) => setSlides(prev => prev.map((s, i) => (i === active ? { ...s, ...patch } : s)));

  const save = useCallback(async (): Promise<boolean> => {
    setSaving(true);
    try {
      const rendered: string[] = [];
      for (let i = 0; i < slides.length; i++) {
        const node = exportRefs.current[i];
        if (!node) throw new Error("slide not rendered");
        const png = await toPng(node, { pixelRatio: 1080 / EXPORT_WIDTH, cacheBust: true, skipFonts: true });
        const blob = await fetch(png).then(r => r.blob());
        const fd = new FormData();
        fd.append("canvas", blob, `carousel_${postId}_${i + 1}.png`);
        const up = await api.post("/api/protected/upload-canvas", fd, { headers: { "Content-Type": "multipart/form-data" } });
        rendered.push(up.data.url);
      }
      const { data: res } = await api.put(`/api/protected/posts/${postId}/carousel`, {
        slides: slides.map((s, i) => ({ id: s.id, headline: s.headline, body: s.body, bg_color: s.bg_color, rendered_url: rendered[i] })),
      });
      setSlides(res.slides || slides);
      toast.success(`${slides.length} slayt kaydedildi.`);
      return true;
    } catch (err) {
      toast.error(getApiError(err, "Slaytlar kaydedilemedi."));
      return false;
    } finally {
      setSaving(false);
    }
  }, [slides, postId, toast]);

  if (loading) return <div className="flex h-96 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-brand" /></div>;

  const current = slides[active];
  const imgFor = (s: Slide) => (s.image_url ? images[abs(s.image_url)] : undefined);

  return (
    <div className="space-y-4">
      {/* Üst çubuk */}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={onBack} aria-label="Geri" className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-sm hover:bg-zinc-50">←</button>
        <div className="mr-auto min-w-0">
          <h1 className="truncate text-lg font-bold">Carousel Düzenleyici</h1>
          <p className="truncate text-xs text-muted">{data?.post.title}</p>
        </div>
        {slides.length > 0 && (
          <>
            <button type="button" onClick={generate} disabled={generating || saving} className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold hover:bg-zinc-50 disabled:opacity-50">
              {generating ? "Üretiliyor…" : "↻ Yeniden Üret"}
            </button>
            <button type="button" onClick={save} disabled={saving || generating} className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50">
              {saving ? "Kaydediliyor…" : "💾 Kaydet"}
            </button>
            <button type="button" onClick={async () => { if (await save()) onComplete(); }} disabled={saving || generating} className="rounded-lg bg-gradient-to-r from-brand to-brand-dark px-3 py-2 text-xs font-semibold text-white shadow-sm disabled:opacity-50">
              Kaydet ve Zamanla →
            </button>
          </>
        )}
      </div>

      {slides.length === 0 ? (
        <div className="card mx-auto max-w-md space-y-4 p-6 text-center">
          <h2 className="text-base font-bold">Bu gönderiden carousel oluştur</h2>
          <p className="text-xs text-muted">Kapak (AI görsel) → bilgi slaytları → harekete geçirici son slayt. Marka renklerinizle hazırlanır.</p>
          <div className="flex justify-center gap-1.5">
            {[4, 5, 6, 7].map(n => (
              <button key={n} type="button" onClick={() => setSlideCount(n)} className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${n === slideCount ? "border-brand bg-brand/5 text-brand" : "border-zinc-200"}`}>{n} slayt</button>
            ))}
          </div>
          <button type="button" onClick={generate} disabled={generating} className="w-full rounded-xl bg-gradient-to-r from-brand to-brand-dark px-4 py-3 text-sm font-bold text-white shadow-lg shadow-brand/25 disabled:opacity-60">
            {generating ? "Carousel hazırlanıyor… (~20 sn)" : "Carousel Oluştur"}
          </button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[120px_minmax(0,1fr)_320px]">
          {/* Slayt listesi */}
          <div className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
            {slides.map((s, i) => (
              <button key={s.id} type="button" onClick={() => setActive(i)} aria-label={`Slayt ${i + 1}`}
                className={`shrink-0 overflow-hidden rounded-lg border-2 transition ${i === active ? "border-brand shadow-md" : "border-transparent opacity-80 hover:opacity-100"}`}>
                <SlideCanvas slide={s} total={slides.length} brand={brand} width={108} imageSrc={imgFor(s)} />
              </button>
            ))}
          </div>

          {/* Seçili slayt */}
          <div className="flex justify-center">
            {current && (
              <div className="overflow-hidden rounded-xl shadow-2xl" style={{ width: "min(100%, 440px)" }}>
                <SlideCanvas slide={current} total={slides.length} brand={brand} width={440} imageSrc={imgFor(current)} />
              </div>
            )}
          </div>

          {/* Düzenleme + önizleme */}
          {current && (
            <div className="space-y-4">
              <div className="card space-y-3 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  Slayt {active + 1} · {current.role === "cover" ? "Kapak" : current.role === "cta" ? "Son slayt (CTA)" : "Bilgi"}
                </p>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold">Başlık</span>
                  <input value={current.headline} onChange={e => update({ headline: e.target.value })} className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold">Metin</span>
                  <textarea value={current.body} onChange={e => update({ body: e.target.value })} rows={4} className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand" />
                </label>
                {current.role !== "cover" && (
                  <div>
                    <span className="mb-1 block text-xs font-semibold">Arka plan</span>
                    <div className="flex flex-wrap gap-2">
                      {[...brandColors, ...NEUTRALS].map(c => (
                        <button key={c} type="button" aria-label={`Renk ${c}`} onClick={() => update({ bg_color: c })}
                          className={`h-7 w-7 rounded-full border ${current.bg_color === c ? "ring-2 ring-brand ring-offset-2" : "border-zinc-300"}`} style={{ background: c }} />
                      ))}
                    </div>
                    <button type="button" onClick={() => setSlides(prev => prev.map(s => (s.role === "cover" ? s : { ...s, bg_color: current.bg_color })))} className="mt-2 text-[11px] font-semibold text-brand">
                      Bu rengi tüm slaytlara uygula
                    </button>
                  </div>
                )}
              </div>
              <div className="flex justify-center">
                <PostPreview
                  platform={data?.post.platform || "Instagram"}
                  brandName={brand.name}
                  logoUrl={brand.logoSrc}
                  caption={data?.post.content || ""}
                  hashtags={data?.post.hashtags}
                  slides={slides.map(s => <SlideCanvas key={s.id} slide={s} total={slides.length} brand={brand} width={378} imageSrc={imgFor(s)} />)}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dışa aktarım için ekran dışı tam boy slaytlar */}
      <div aria-hidden style={{ position: "fixed", left: -10000, top: 0, pointerEvents: "none" }}>
        {slides.map((s, i) => (
          <SlideCanvas key={s.id} ref={el => { exportRefs.current[i] = el; }} slide={s} total={slides.length} brand={brand} width={EXPORT_WIDTH} imageSrc={imgFor(s)} />
        ))}
      </div>
    </div>
  );
}
