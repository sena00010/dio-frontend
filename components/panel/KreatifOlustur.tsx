"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api";

/* ────────────────────────────────────────────────
   TYPES
   ──────────────────────────────────────────────── */
interface PerformanceEstimate {
  estimated_reach: string;
  engagement_rate: string;
  best_time: string;
  brand_fit: number;
  competitor_density: string;
}

interface CreativeVariant {
  id: string;
  name: string;
  format: string;
  ai_score: number;
  is_ai_recommended: boolean;
  emphasis: string;
  headline: string;
  sub_headline: string;
  caption: string;
  cta: string;
  hashtags: string[];
  performance: PerformanceEstimate;
  visual_description: string;
  color_palette: string[];
  design_notes: string;
  image_url?: string; // Backend'den üretilen görsel URL'i
}

/* ────────────────────────────────────────────────
   CONSTANTS
   ──────────────────────────────────────────────── */
const EMPHASIS_OPTIONS = [
  { key: "yenilik", icon: "✨", label: "Yenilik & Heyecan", desc: "\"İlk sen gör\" hissi" },
  { key: "fiyat", icon: "🏷️", label: "Fiyat & Kampanya", desc: "İndirim vurgusu" },
  { key: "kalite", icon: "💎", label: "Ürün Kalitesi", desc: "Materyal, dayanıklılık" },
  { key: "sosyal_kanit", icon: "⭐", label: "Sosyal Kanıt", desc: "Müşteri yorumları" },
];

const PLATFORM_OPTIONS = [
  {
    key: "instagram",
    label: "Instagram",
    icon: () => (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
      </svg>
    ),
  },
  {
    key: "tiktok",
    label: "TikTok",
    icon: () => (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1 0-5.78 2.92 2.92 0 0 1 .88.13V9a6.34 6.34 0 1 0 5.45 6.28V9.44a8.18 8.18 0 0 0 3.77.96V7a4.76 4.76 0 0 1 0-.31z"/>
      </svg>
    ),
  },
  {
    key: "facebook",
    label: "Facebook",
    icon: () => (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
      </svg>
    ),
  },
];

const FORMAT_OPTIONS = [
  { key: "1:1 Feed", label: "1:1 Feed" },
  { key: "9:16 Story", label: "9:16 Story" },
  { key: "4:5 Feed", label: "4:5 Feed" },
  { key: "Carousel", label: "Carousel" },
  { key: "Reels", label: "Reels" },
];

/* ── Helpers ────────────────────────────────── */
function scoreColor(s: number) {
  if (s >= 90) return "bg-gradient-to-br from-emerald-500 to-green-600 text-white ring-emerald-200";
  if (s >= 75) return "bg-gradient-to-br from-orange-500 to-amber-600 text-white ring-orange-200";
  return "bg-gradient-to-br from-zinc-400 to-zinc-500 text-white ring-zinc-200";
}

function scoreBorder(s: number) {
  if (s >= 90) return "border-emerald-400 shadow-emerald-100";
  if (s >= 75) return "border-orange-300 shadow-orange-50";
  return "border-zinc-200";
}

/* ── Image component with backend-generated images ─── */
function VariantImage({ variant, className = "", imageStatus = "pending" }: {
  variant: CreativeVariant;
  className?: string;
  imageStatus?: string; // "pending" | "generating" | "done" | "error"
}) {
  const [loaded, setLoaded] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const imgUrl = variant.image_url
    ? (variant.image_url.startsWith("http") ? variant.image_url : `${baseUrl}${variant.image_url}`)
    : "";

  const gradientBg = variant.color_palette?.length >= 2
    ? `linear-gradient(135deg, ${variant.color_palette[0]}, ${variant.color_palette[1]}${variant.color_palette[2] ? ", " + variant.color_palette[2] : ""})`
    : "linear-gradient(135deg, #E6272F, #FF6B35)";

  const isGenerating = imageStatus === "pending" || imageStatus === "generating";
  const hasImage = !!imgUrl && imageStatus === "done";

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: gradientBg }}>
      {/* Shimmer while generating */}
      {isGenerating && (
        <div className="absolute inset-0 z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shimmer" style={{ backgroundSize: "200% 100%" }} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="text-center">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-[10px] text-white/80 font-medium mb-2">
                <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" strokeDasharray="32" strokeLinecap="round" /></svg>
                {imageStatus === "generating" ? "Görsel üretiliyor..." : "Sırada bekliyor..."}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Error state */}
      {imageStatus === "error" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 backdrop-blur-sm px-3 py-1 text-[10px] text-white/90 font-medium">
            ⚠️ Görsel üretilemedi
          </div>
        </div>
      )}
      {/* Loaded image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {hasImage && (
        <img
          src={imgUrl}
          alt={variant.headline || "Creative variant"}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${loaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setLoaded(true)}
          onError={() => {}}
          crossOrigin="anonymous"
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════ */
export default function KreatifOlusturScreen({
  topics: initialTopics = [],
  onBack,
  onStudioNavigate,
}: {
  topics?: string[];
  onBack?: () => void;
  onStudioNavigate?: (postId: number) => void;
}) {
  const { activeCompany } = useAuth();

  /* ── Settings state ─────────────────────────── */
  const [emphasis, setEmphasis] = useState("yenilik");
  const [platforms, setPlatforms] = useState<Set<string>>(new Set(["instagram"]));
  const [formats, setFormats] = useState<Set<string>>(new Set(["1:1 Feed", "9:16 Story"]));
  const [variantCount, setVariantCount] = useState(6);

  /* ── API state ──────────────────────────────── */
  const [variants, setVariants] = useState<CreativeVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedVariant, setSelectedVariant] = useState<CreativeVariant | null>(null);
  const [copied, setCopied] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [savingId, setSavingId] = useState<string>("");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  /* ── Image generation state ──────────────── */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [imageStatuses, setImageStatuses] = useState<Record<string, { status: string; image_url?: string; design_layers?: any[] }>>({}); 
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  /* ── Save creative to DB (Post — Düzenle/Studio için) ─────────────────── */
  const saveCreative = useCallback(async (v: CreativeVariant, openStudio = false) => {
    if (!activeCompany) return;
    setSavingId(v.id);
    try {
      // AI Vision ile belirlenen design_layers varsa ekle
      const visionLayers = imageStatuses[v.id]?.design_layers;
      const { data } = await api.post("/api/protected/save-creative", {
        company_id: activeCompany.id,
        variant_name: v.name,
        headline: v.headline,
        sub_headline: v.sub_headline,
        caption: v.caption,
        cta: v.cta,
        hashtags: v.hashtags,
        format: v.format,
        platform: Array.from(platforms)[0] || "instagram",
        visual_description: v.visual_description,
        color_palette: v.color_palette,
        design_notes: v.design_notes,
        ai_score: v.ai_score,
        image_url: v.image_url || "",
        design_layers: visionLayers || [],
      });
      setSavedIds((prev) => new Set(prev).add(v.id));
      if (openStudio && data.post_id && onStudioNavigate) {
        onStudioNavigate(data.post_id);
      }
    } catch {
      // Silent fail — user can retry
    } finally {
      setSavingId("");
    }
  }, [activeCompany, platforms, onStudioNavigate, imageStatuses]);

  /* ── Save single creative to ai_ideas (Kaydet butonu) ─── */
  const saveCreativeIdea = useCallback(async (v: CreativeVariant) => {
    if (!activeCompany) return;
    setSavingId(v.id);
    try {
      await api.post("/api/protected/save-creative-idea", {
        company_id: activeCompany.id,
        topic: initialTopics[0] || "",
        platform: Array.from(platforms)[0] || "instagram",
        campaign_type: emphasis,
        variant_name: v.name,
        headline: v.headline,
        sub_headline: v.sub_headline,
        caption: v.caption,
        cta: v.cta,
        hashtags: v.hashtags,
        format: v.format,
        visual_description: v.visual_description,
        color_palette: v.color_palette,
        design_notes: v.design_notes,
        ai_score: v.ai_score,
        image_url: v.image_url || "",
      });
      setSavedIds((prev) => new Set(prev).add(v.id));
    } catch {
      // Silent fail
    } finally {
      setSavingId("");
    }
  }, [activeCompany, platforms, emphasis, initialTopics]);

  /* ── Taslak Kaydet — batch save all variants to ai_ideas ─── */
  const [draftSaving, setDraftSaving] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const saveDraftAll = useCallback(async () => {
    if (!activeCompany || variants.length === 0) return;
    setDraftSaving(true);
    try {
      await api.post("/api/protected/save-creative-ideas-batch", {
        company_id: activeCompany.id,
        topic: initialTopics[0] || "",
        platform: Array.from(platforms)[0] || "instagram",
        campaign_type: emphasis,
        variants: variants.map(v => ({
          variant_name: v.name,
          headline: v.headline,
          sub_headline: v.sub_headline,
          caption: v.caption,
          cta: v.cta,
          hashtags: v.hashtags,
          format: v.format,
          visual_description: v.visual_description,
          color_palette: v.color_palette,
          design_notes: v.design_notes,
          ai_score: v.ai_score,
          image_url: v.image_url || "",
        })),
      });
      setDraftSaved(true);
      setSavedIds(new Set(variants.map(v => v.id)));
      setTimeout(() => setDraftSaved(false), 3000);
    } catch {
      // Silent fail
    } finally {
      setDraftSaving(false);
    }
  }, [activeCompany, variants, platforms, emphasis, initialTopics]);

  /* ── Toggle helpers ─────────────────────────── */
  const toggleSet = (set: Set<string>, key: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(key)) { if (next.size > 1) next.delete(key); }
    else next.add(key);
    setter(next);
  };

  /* ── Polling for image status ─────────────────── */
  const startPolling = useCallback((jobId: string) => {
    // Eski polling varsa temizle
    if (pollingRef.current) clearInterval(pollingRef.current);
    
    const poll = async () => {
      try {
        const { data } = await api.get(`/api/protected/creative-images-status?job_id=${jobId}`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const images: Array<{ variant_id: string; status: string; image_url?: string; error?: string; design_layers?: any[] }> = data.images || [];
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newStatuses: Record<string, { status: string; image_url?: string; design_layers?: any[] }> = {};
        images.forEach(img => {
          newStatuses[img.variant_id] = { status: img.status, image_url: img.image_url, design_layers: img.design_layers };
        });
        setImageStatuses(newStatuses);

        // Hazır olan görsellerin URL'lerini varyantlara ekle
        setVariants(prev => prev.map(v => {
          const imgData = newStatuses[v.id];
          if (imgData?.status === "done" && imgData.image_url && !v.image_url) {
            return { ...v, image_url: imgData.image_url };
          }
          return v;
        }));

        // Seçili varyantı güncelle
        setSelectedVariant(prev => {
          if (!prev) return prev;
          const imgData = newStatuses[prev.id];
          if (imgData?.status === "done" && imgData.image_url && !prev.image_url) {
            return { ...prev, image_url: imgData.image_url };
          }
          return prev;
        });

        // Tamamlandıysa polling'i durdur
        if (data.status === "completed" || data.completed === data.total) {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      } catch {
        // Polling hatası — devam et
      }
    };
    
    // İlk çağrıyı hızlı yap, sonra her 2 saniyede bir (paralel üretim hızlı)
    setTimeout(poll, 1500);
    pollingRef.current = setInterval(poll, 2000);
  }, []);

  /* ── Start image generation after variants are ready ─── */
  const startImageGeneration = useCallback(async (generatedVariants: CreativeVariant[]) => {
    if (!activeCompany || generatedVariants.length === 0) return;
    
    // Tüm varyantları "pending" olarak işaretle
    const initialStatuses: Record<string, { status: string; image_url?: string }> = {};
    generatedVariants.forEach(v => {
      initialStatuses[v.id] = { status: "pending" };
    });
    setImageStatuses(initialStatuses);

    try {
      const platformVal = Array.from(platforms)[0] || "instagram";
      const { data } = await api.post("/api/protected/generate-creative-images", {
        company_id: activeCompany.id,
        variants: generatedVariants.map(v => ({
          variant_id: v.id,
          visual_description: v.visual_description,
          headline: v.headline,
          sub_headline: v.sub_headline,
          color_palette: v.color_palette,
          format: v.format,
          platform: platformVal,
          emphasis: v.emphasis,
          is_ai_recommended: v.is_ai_recommended,
        })),
      });
      
      if (data.job_id) {
        startPolling(data.job_id);
      }
    } catch {
      // Görsel üretimi başarısız — sessiz fail, gradient gösterilmeye devam eder
    }
  }, [activeCompany, platforms, startPolling]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  /* ── Generate creatives ─────────────────────── */
  const generate = useCallback(async () => {
    if (!activeCompany) return;
    setLoading(true);
    setError("");
    setSelectedVariant(null);
    setImageStatuses({});
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
    try {
      const { data } = await api.post("/api/protected/generate-creatives", {
        company_id: activeCompany.id,
        topics: initialTopics.length > 0 ? initialTopics : ["Genel içerik"],
        emphasis,
        platforms: Array.from(platforms),
        formats: Array.from(formats),
        variant_count: variantCount,
      });
      const v: CreativeVariant[] = data.variants || [];
      setVariants(v);
      // Auto-select AI recommended
      const recommended = v.find((x) => x.is_ai_recommended) || v[0];
      if (recommended) setSelectedVariant(recommended);
      
      // Hemen ardından asenkron görsel üretimini başlat
      if (v.length > 0) {
        startImageGeneration(v);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Kreatifler üretilemedi";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [activeCompany, initialTopics, emphasis, platforms, formats, variantCount, startImageGeneration]);

  /* ── Copy caption ───────────────────────────── */
  const copyCaption = () => {
    if (!selectedVariant) return;
    const text = selectedVariant.caption + "\n\n" + (selectedVariant.hashtags || []).map((h) => (h.startsWith("#") ? h : "#" + h)).join(" ");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ═════════════════════════════════════════════
     SHIMMER SKELETON
     ═════════════════════════════════════════════ */
  const VariantSkeleton = () => (
    <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">
      <div className="relative h-40 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-100 via-zinc-200/60 to-zinc-100 animate-shimmer" style={{ backgroundSize: "200% 100%" }} />
        <div className="absolute top-3 left-3 h-5 w-16 rounded-md bg-white/30 backdrop-blur" />
        <div className="absolute top-3 right-3 h-9 w-9 rounded-xl bg-white/30 backdrop-blur" />
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-zinc-200 rounded w-24 animate-pulse" />
          <div className="h-4 bg-zinc-100 rounded w-14 animate-pulse" />
        </div>
        <div className="flex gap-2 pt-1">
          <div className="h-8 bg-zinc-100 rounded-lg flex-1 animate-pulse" />
          <div className="h-8 bg-zinc-100 rounded-lg flex-1 animate-pulse" />
        </div>
      </div>
    </div>
  );

  const DetailSkeleton = () => (
    <div className="space-y-5 animate-pulse">
      <div className="h-6 bg-zinc-200 rounded w-1/2" />
      <div className="h-32 bg-zinc-100 rounded-xl" />
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex justify-between">
            <div className="h-3 bg-zinc-100 rounded w-1/3" />
            <div className="h-3 bg-zinc-200 rounded w-1/4" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-6rem)] flex flex-col">
      {/* ══════ TOP BAR ══════ */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-100">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Geri
          </button>
          <span className="text-zinc-300">|</span>
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>Kreatif Stüdyo</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            <span>Konu Seç</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            <span className="font-semibold text-foreground">Kreatifleri Oluştur</span>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {variants.length > 0 && (
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              {variants.length} kreatif hazır
            </span>
          )}
          {initialTopics.length > 0 && (
            <div className="hidden md:flex items-center gap-1.5">
              <span className="text-xs text-muted">Konu:</span>
              <span className="text-xs font-semibold text-foreground bg-orange-50 border border-orange-100 rounded-full px-2.5 py-0.5 flex items-center gap-1">
                <span className="text-[10px] text-orange-500">🔥</span>
                {initialTopics[0]}
                {initialTopics.length > 1 && <span className="text-muted"> +{initialTopics.length - 1}</span>}
              </span>
            </div>
          )}
          <button
            onClick={saveDraftAll}
            disabled={draftSaving || draftSaved || variants.length === 0}
            className={`hidden sm:inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-medium transition disabled:opacity-50 ${
              draftSaved
                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                : "border-zinc-200 bg-white text-foreground hover:bg-zinc-50"
            }`}
          >
            {draftSaved ? "✓ Kaydedildi" : draftSaving ? "Kaydediliyor…" : "Taslak Kaydet"}
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-foreground text-white px-4 py-2 text-xs font-semibold shadow-sm hover:bg-foreground/90 transition">
            Yayınla
          </button>
        </div>
      </div>

      {/* ══════ MAIN 3-COLUMN LAYOUT ══════ */}
      <div className="flex gap-5 flex-1 min-h-0">

        {/* ═══ LEFT SIDEBAR — Kreatif Ayarları ═══ */}
        <aside className="hidden lg:flex flex-col w-[240px] flex-shrink-0 h-[calc(100vh-10rem)]">
          {/* Scrollable settings */}
          <div className="flex-1 overflow-y-auto space-y-5 pr-1 pb-3 scrollbar-thin">
            {/* Ne Öne Çıksın */}
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted mb-3">Ne Öne Çıksın?</h3>
              <div className="space-y-2">
                {EMPHASIS_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setEmphasis(opt.key)}
                    className={`w-full text-left rounded-xl border-2 p-3 transition-all ${
                      emphasis === opt.key
                        ? "border-brand bg-red-50/50 shadow-sm"
                        : "border-zinc-100 hover:border-zinc-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="text-base mt-0.5">{opt.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-foreground leading-tight">{opt.label}</p>
                        <p className="text-[10px] text-muted mt-0.5">{opt.desc}</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
                        emphasis === opt.key ? "border-brand bg-brand" : "border-zinc-300"
                      }`}>
                        {emphasis === opt.key && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Platform */}
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted mb-3">Platform</h3>
              <div className="flex flex-wrap gap-1.5">
                {PLATFORM_OPTIONS.map((p) => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.key}
                      onClick={() => toggleSet(platforms, p.key, setPlatforms)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium border transition ${
                        platforms.has(p.key)
                          ? "bg-foreground text-white border-foreground"
                          : "bg-white text-foreground border-zinc-200 hover:border-zinc-300"
                      }`}
                    >
                      <Icon /> {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Format */}
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted mb-3">Format</h3>
              <div className="flex flex-wrap gap-1.5">
                {FORMAT_OPTIONS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => toggleSet(formats, f.key, setFormats)}
                    className={`rounded-full px-3 py-1.5 text-[12px] font-medium border transition ${
                      formats.has(f.key)
                        ? "bg-foreground text-white border-foreground"
                        : "bg-white text-foreground border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Varyant Sayısı */}
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted mb-3">Varyant Sayısı</h3>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-muted">Kaç kreatif?</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setVariantCount(Math.max(1, variantCount - 1))} className="h-7 w-7 rounded-lg border border-zinc-200 flex items-center justify-center text-sm text-foreground hover:bg-zinc-50 transition">−</button>
                  <span className="text-sm font-bold text-foreground w-6 text-center">{variantCount}</span>
                  <button onClick={() => setVariantCount(Math.min(12, variantCount + 1))} className="h-7 w-7 rounded-lg border border-zinc-200 flex items-center justify-center text-sm text-foreground hover:bg-zinc-50 transition">+</button>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Generate Button — always visible */}
          <div className="pt-3 border-t border-zinc-100 flex-shrink-0">
            <button
              onClick={generate}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand text-white px-4 py-3 text-sm font-semibold shadow-lg shadow-brand/25 transition-all hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" strokeDasharray="32" strokeLinecap="round" /></svg>
                  Üretiliyor...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                  {variants.length > 0 ? "+ Yeniden Oluştur" : "Oluştur"}
                </>
              )}
            </button>
          </div>
        </aside>

        {/* ═══ CENTER — Variant Grid ═══ */}
        <div className="flex-1 min-w-0">
          {/* Grid header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              {variants.length > 0 && (
                <p className="text-sm text-muted">
                  <span className="font-bold text-foreground">{variants.length} kreatif</span>{" "}
                  marka profilinize göre önerildi
                </p>
              )}
              {variants.length > 0 && (
                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted">
                  <span>Skor: <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> 80–100 Yüksek</span></span>
                  <span><span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> 60–79 Orta</span></span>
                  <span className="hidden sm:inline">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-500 font-semibold">AI Önerisi</span>
                    = AI&apos;ın öncelikli önerdiği
                  </span>
                </div>
              )}
            </div>
            {variants.length > 0 && (
              <button
                onClick={generate}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand/10 text-brand px-3 py-1.5 text-xs font-semibold hover:bg-brand/20 transition disabled:opacity-50"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                Yenile
              </button>
            )}
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-600 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              {error}
              <button onClick={generate} className="ml-auto text-xs font-semibold underline">Tekrar Dene</button>
            </div>
          )}

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {loading ? (
              [...Array(variantCount)].map((_, i) => <VariantSkeleton key={i} />)
            ) : variants.length === 0 ? (
              <div className="col-span-3 flex flex-col items-center justify-center py-20 text-center">
                <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-brand/10 to-orange-50 flex items-center justify-center mb-5">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Kreatifleri oluşturmaya hazır</h3>
                <p className="text-sm text-muted max-w-md mb-5">
                  Soldaki ayarları yapılandırın ve <strong>&quot;Oluştur&quot;</strong> butonuna basın.
                  AI, marka profilinize özel {variantCount} farklı kreatif varyant üretecek.
                </p>
                {/* Generate button — visible on ALL screen sizes */}
                <button
                  onClick={generate}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand text-white px-6 py-3 text-sm font-semibold shadow-lg shadow-brand/25 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" strokeDasharray="32" strokeLinecap="round" /></svg>
                      Üretiliyor...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                      Oluştur
                    </>
                  )}
                </button>
              </div>
            ) : (
              variants.map((v, idx) => {
                const isSelected = selectedVariant?.id === v.id;
                return (
                  <div
                    key={v.id}
                    onClick={() => { setSelectedVariant(v); setFeedbackRating(0); }}
                    className={`group text-left rounded-2xl border-2 overflow-hidden transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? `border-brand shadow-lg shadow-brand/10 ${scoreBorder(v.ai_score)}`
                        : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-md hover:-translate-y-0.5"
                    }`}
                  >
                    {/* Visual Preview Area — AI Generated Image */}
                    <div className="relative h-44">
                      <VariantImage variant={v} className="h-full w-full" imageStatus={imageStatuses[v.id]?.status || "pending"} />
                      {/* AI Recommended badge */}
                      {v.is_ai_recommended && (
                        <div className="absolute top-3 left-3 z-20 rounded-md bg-red-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 shadow-sm">
                          AI Önerisi
                        </div>
                      )}
                      {/* New badge for low-score experimental ones */}
                      {v.ai_score < 70 && (
                        <div className="absolute top-3 right-14 z-20 rounded-md bg-blue-500/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5">
                          Yeni
                        </div>
                      )}
                      {/* Score badge */}
                      <div className={`absolute top-3 right-3 z-20 flex h-9 w-9 items-center justify-center rounded-xl ${scoreColor(v.ai_score)} text-xs font-bold shadow-lg ring-2`}>
                        {v.ai_score}
                      </div>
                      {/* Format badge */}
                      <div className="absolute bottom-3 left-3 z-20 rounded-md bg-black/40 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5">
                        {v.format}
                      </div>
                      {/* Headline overlay */}
                      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-3 pt-8">
                        <p className="text-white text-[13px] font-bold leading-tight drop-shadow-md line-clamp-2">{v.headline}</p>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="p-3.5 bg-white">
                      <div className="flex items-center justify-between mb-2.5">
                        <h4 className="text-[13px] font-bold text-foreground">{v.name}</h4>
                        <span className="text-[11px] font-medium text-muted">{v.ai_score}/100</span>
                      </div>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => { e.stopPropagation(); saveCreative(v, true); }}
                          disabled={savingId === v.id}
                          className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-zinc-200 text-[11px] font-medium text-foreground py-1.5 hover:bg-zinc-50 transition disabled:opacity-50"
                        >
                          {savingId === v.id ? (
                            <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" strokeDasharray="32" strokeLinecap="round" /></svg>
                          ) : (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          )}
                          Düzenle
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); saveCreativeIdea(v); }}
                          disabled={savingId === v.id || savedIds.has(v.id)}
                          className={`flex-1 inline-flex items-center justify-center gap-1 rounded-lg text-[11px] font-semibold py-1.5 transition ${
                            savedIds.has(v.id)
                              ? "bg-emerald-500 text-white"
                              : isSelected
                                ? "bg-brand text-white hover:bg-brand/90"
                                : "bg-zinc-100 text-foreground hover:bg-zinc-200"
                          } disabled:opacity-50`}
                        >
                          {savedIds.has(v.id) ? (
                            <>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                              Kaydedildi
                            </>
                          ) : savingId === v.id ? (
                            <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" strokeDasharray="32" strokeLinecap="round" /></svg>
                          ) : (
                            <>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                              Kaydet
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ═══ RIGHT SIDEBAR — Variant Details ═══ */}
        <aside className="hidden xl:block w-[280px] flex-shrink-0">
          <div className="sticky top-0 space-y-4">
            {loading ? (
              <DetailSkeleton />
            ) : selectedVariant ? (
              <>
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-foreground">{selectedVariant.name}</h3>
                  <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${scoreColor(selectedVariant.ai_score)} text-xs font-bold shadow ring-2`}>
                    {selectedVariant.ai_score}
                  </span>
                </div>

                {/* Preview mini — AI Generated Image */}
                <div className="relative rounded-xl h-28 overflow-hidden">
                  <VariantImage variant={selectedVariant} className="h-full w-full rounded-xl" imageStatus={imageStatuses[selectedVariant.id]?.status || "pending"} />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2.5 pt-6 rounded-b-xl">
                    <span className="rounded-md bg-black/40 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5">
                      {selectedVariant.format}
                    </span>
                  </div>
                </div>

                {/* Performance */}
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted mb-2.5">Performans Tahmini</h4>
                  <div className="space-y-2">
                    {[
                      ["Tahmini erişim", selectedVariant.performance?.estimated_reach],
                      ["Etkileşim oranı", selectedVariant.performance?.engagement_rate],
                      ["En iyi saat", selectedVariant.performance?.best_time],
                      ["Marka uyumu", selectedVariant.performance?.brand_fit ? `${selectedVariant.performance.brand_fit} / 100` : undefined],
                      ["Rakip yoğunluğu", selectedVariant.performance?.competitor_density],
                    ].filter(([, val]) => val).map(([label, val]) => (
                      <div key={label} className="flex items-center justify-between text-[12px]">
                        <span className="text-muted">{label}</span>
                        <span className="font-semibold text-foreground">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Caption */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted">Caption</h4>
                  </div>
                  <div className="rounded-xl bg-zinc-50 border border-zinc-100 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase text-muted tracking-wider">Metin</span>
                      <button onClick={copyCaption} className="text-[11px] font-semibold text-brand hover:text-brand-dark transition">
                        {copied ? "✓ Kopyalandı" : "Kopyala"}
                      </button>
                    </div>
                    <p className="text-[12px] text-foreground leading-relaxed">{selectedVariant.caption}</p>
                  </div>
                </div>

                {/* Hashtags */}
                {selectedVariant.hashtags?.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted mb-2">Hashtags</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedVariant.hashtags.map((h) => (
                        <span key={h} className="rounded-full bg-zinc-100 border border-zinc-200 px-2.5 py-0.5 text-[11px] font-medium text-foreground">
                          {h.startsWith("#") ? h : "#" + h}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Feedback */}
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted mb-2">Feedback</h4>
                  <div className="flex gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setFeedbackRating(star)}
                        className={`text-lg transition ${star <= feedbackRating ? "text-amber-400" : "text-zinc-200 hover:text-zinc-300"}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {["Başlık", "Renk", "Görsel", "CTA"].map((tag) => (
                      <span key={tag} className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[10px] font-medium text-foreground cursor-pointer hover:bg-zinc-50 transition">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <textarea
                    placeholder="Notun varsa yaz..."
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[12px] text-foreground placeholder:text-muted resize-none h-16 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition"
                  />
                </div>

                {/* Regenerate */}
                <button
                  onClick={generate}
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand text-white px-4 py-2.5 text-[13px] font-semibold shadow-md shadow-brand/20 hover:shadow-lg transition disabled:opacity-50"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                  Yeniden Oluştur
                </button>

                {/* Design Notes */}
                {selectedVariant.design_notes && (
                  <div className="rounded-xl bg-amber-50/50 border border-amber-100 p-3">
                    <h4 className="text-[10px] font-bold uppercase text-amber-600 mb-1">Tasarımcı Notu</h4>
                    <p className="text-[11px] text-amber-800 leading-relaxed">{selectedVariant.design_notes}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-14 w-14 rounded-2xl bg-zinc-100 flex items-center justify-center mb-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                  </svg>
                </div>
                <p className="text-sm font-medium text-foreground">Varyant seçin</p>
                <p className="text-xs text-muted mt-1">Detaylar burada görünecek</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
