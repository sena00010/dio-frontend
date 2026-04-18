"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  ArrowLeftIcon,
  SparklesIcon,
  PhotoIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  PaintBrushIcon,
  RocketLaunchIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  ClockIcon,
  LightBulbIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/outline";
import type { ScreenKey } from "./types";

/* ─── Platform icons (Heroicons + custom SVGs) ─── */
const PlatformIcon = ({ platform }: { platform: string }) => {
  const p = platform?.toLowerCase() || "";
  const cls = "w-4 h-4";
  if (p.includes("instagram"))
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    );
  if (p.includes("facebook"))
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    );
  if (p.includes("twitter") || p.includes("x"))
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  if (p.includes("linkedin"))
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    );
  if (p.includes("youtube"))
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    );
  if (p.includes("tiktok"))
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    );
  if (p.includes("pinterest"))
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24 18.635 24 24.001 18.634 24.001 12.015 24.001 5.394 18.634.028 12.017.028z" />
      </svg>
    );
  if (p.includes("trendyol"))
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
        <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="bold" fill="currentColor">T</text>
      </svg>
    );
  return <GlobeAltIcon className={cls} />;
};

/* ─── Sector labels ─── */
const SECTOR_MAP: Record<string, string> = {
  moda: "Moda & Giyim", yiyecek: "Yiyecek & İçecek", guzellik: "Güzellik & Bakım",
  saglik: "Sağlık & Yaşam", ev: "Ev & Yaşam Alanı", teknoloji: "Teknoloji & Hizmet",
  egitim: "Eğitim & Kültür", finans: "Finans & Sigorta", turizm: "Turizm & Konaklama",
};

/* ─── Time ago helper ─── */
const timeAgo = (d: string | undefined): string => {
  if (!d) return "—";
  const ms = Date.now() - new Date(d).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "Az önce";
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} saat önce`;
  const day = Math.floor(h / 24);
  if (day < 30) return `${day} gün önce`;
  return `${Math.floor(day / 30)} ay önce`;
};

/* ─── Types ─── */
interface IdeaSummary { id: number; title: string; platform: string; campaign_type: string; is_selected: boolean; ai_score: number; image_url?: string; created_at: string; }
interface StudioSummary { id: number; title: string; source_image_url: string; category: string; status: string; variant_count: number; ad_variant_count: number; created_at: string; }
interface BriefSummary { id: number; title: string; content: string; brief_type: string; tags?: string; is_favorite: boolean; used_count: number; created_at: string; }
interface ScheduleSummary { id: number; post_id?: number; platform: string; scheduled_at: string; status: string; created_at: string; }
interface AdVariantSummary { id: number; studio_id: number; name: string; platform: string; format_label: string; width: number; height: number; score: number; status: string; preview_url?: string; headline?: string; sub_headline?: string; cta?: string; }

interface DetailData {
  ideas: IdeaSummary[];
  studios: StudioSummary[];
  briefs: BriefSummary[];
  schedules: ScheduleSummary[];
  ad_variants: AdVariantSummary[];
  total_ideas: number;
  selected_ideas: number;
  total_posts: number;
  posts_with_image: number;
  total_studios: number;
  total_briefs: number;
  total_scheduled: number;
  total_ad_variants: number;
  total_img_variants: number;
}

/* ══════════════════════════════════════════════════
   BRAND DETAIL PAGE — Mini Dio Dashboard
   ══════════════════════════════════════════════════ */
export default function BrandDetail({
  brandId,
  onBack,
  onNavigate,
}: {
  brandId: number;
  onBack: () => void;
  onNavigate?: (screen: ScreenKey, opts?: { topic?: string }) => void;
}) {
  const { companies } = useAuth();
  const brand = companies.find((c) => c.id === brandId);

  const [data, setData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "ideas" | "studios" | "ads" | "briefs" | "schedule">("overview");

  useEffect(() => {
    if (!brandId) return;
    setLoading(true);
    api
      .get(`/api/protected/companies/${brandId}/detail`)
      .then(({ data: d }) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [brandId]);

  if (!brand) return null;

  // Parse brand data
  const colors: string[] = (() => { try { return JSON.parse(brand.brand_colors || "[]"); } catch { return []; } })();
  const socials: Record<string, string> = (() => { try { return JSON.parse(brand.social_media || "{}"); } catch { return {}; } })();
  const connectedPlatforms = Object.keys(socials).filter(k => socials[k]);

  const hasActivity = (data?.total_ideas ?? 0) > 0 || (data?.total_studios ?? 0) > 0;

  // ─── Navigate to new content with prefilled topic ───
  const handleCreateContent = (topic?: string) => {
    if (onNavigate) {
      onNavigate("yeni-icerik", { topic: topic || "" });
    }
  };

  return (
    <div className="space-y-6">
      {/* ═══ Back + Header ═══ */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="rounded-lg border border-zinc-200 bg-white p-2 text-zinc-500 transition hover:bg-zinc-50 hover:text-foreground">
          <ArrowLeftIcon className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {brand.logo_url ? (
            <img src={`${process.env.NEXT_PUBLIC_API_URL}${brand.logo_url}`} alt={brand.name} className="h-14 w-14 rounded-2xl border border-zinc-200 object-cover shadow-md" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-200 border border-zinc-200 shadow-md">
              <span className="text-xl font-bold text-zinc-400">{brand.name[0]?.toUpperCase()}</span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-foreground truncate">{brand.name}</h1>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-medium text-zinc-600">
                {SECTOR_MAP[brand.sector] || brand.sector || "Sektör yok"}
              </span>
              {brand.website && (
                <a href={brand.website.startsWith("http") ? brand.website : `https://${brand.website}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-brand hover:underline">
                  <GlobeAltIcon className="w-3 h-3" /> {brand.website}
                </a>
              )}
            </div>
          </div>
        </div>
        <button onClick={() => handleCreateContent()} className="hidden md:inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand/20 transition hover:shadow-md">
          <PlusCircleIcon className="w-4 h-4" />
          İçerik Üret
        </button>
      </div>

      {/* ═══ Connected Platforms Bar ═══ */}
      {connectedPlatforms.length > 0 && (
        <div className="card p-3 flex items-center gap-3 flex-wrap">
          <span className="text-xs font-semibold text-muted">Bağlı Platformlar</span>
          {connectedPlatforms.map((p) => (
            <span key={p} className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-50 border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700">
              <PlatformIcon platform={p} /> {p.charAt(0).toUpperCase() + p.slice(1)}
            </span>
          ))}
          {colors.length > 0 && (
            <>
              <span className="mx-2 h-5 w-px bg-zinc-200" />
              <span className="text-xs font-semibold text-muted">Renkler</span>
              {colors.map((c, i) => (
                <div key={i} className="h-5 w-5 rounded-md border border-zinc-200 shadow-sm" style={{ backgroundColor: c }} title={c.toUpperCase()} />
              ))}
            </>
          )}
        </div>
      )}

      {/* ═══ Loading skeleton ═══ */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-3 w-16 bg-zinc-200 rounded mb-3" />
              <div className="h-6 w-12 bg-zinc-200 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* ═══ KPI Row ═══ */}
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3">
            {[
              { label: "Toplam İçerik", value: data?.total_ideas ?? 0, icon: <SparklesIcon className="w-5 h-5" />, color: "text-violet-600 bg-violet-50" },
              { label: "Seçilen Fikir", value: data?.selected_ideas ?? 0, icon: <CheckCircleIcon className="w-5 h-5" />, color: "text-emerald-600 bg-emerald-50" },
              { label: "Görsel Stüdyo", value: data?.total_studios ?? 0, icon: <PhotoIcon className="w-5 h-5" />, color: "text-blue-600 bg-blue-50" },
              { label: "Reklam Varyantı", value: data?.total_ad_variants ?? 0, icon: <PaintBrushIcon className="w-5 h-5" />, color: "text-amber-600 bg-amber-50" },
              { label: "Zamanlanmış", value: data?.total_scheduled ?? 0, icon: <CalendarDaysIcon className="w-5 h-5" />, color: "text-rose-600 bg-rose-50" },
            ].map((kpi) => (
              <div key={kpi.label} className="card p-4 flex items-start gap-3">
                <div className={`rounded-xl p-2.5 ${kpi.color}`}>{kpi.icon}</div>
                <div>
                  <span className="text-2xl font-bold text-foreground">{kpi.value}</span>
                  <p className="text-[11px] text-muted mt-0.5">{kpi.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ═══ Tabs ═══ */}
          <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-50 p-1">
            {[
              { key: "overview", label: "Genel Bakış" },
              { key: "ideas", label: `İçerikler (${data?.total_ideas ?? 0})` },
              { key: "studios", label: `Stüdyolar (${data?.total_studios ?? 0})` },
              { key: "ads", label: `Reklam (${data?.total_ad_variants ?? 0})` },
              { key: "briefs", label: `Briefler (${data?.total_briefs ?? 0})` },
              { key: "schedule", label: `Takvim (${data?.total_scheduled ?? 0})` },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key as typeof tab)}
                className={`whitespace-nowrap rounded-lg px-4 py-2 text-xs font-medium transition-all ${
                  tab === t.key
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ═══ No Activity State ═══ */}
          {!hasActivity && tab === "overview" && (
            <div className="card p-10 flex flex-col items-center text-center">
              <div className="rounded-full bg-gradient-to-br from-brand/10 to-violet-100 p-5 mb-5">
                <RocketLaunchIcon className="w-10 h-10 text-brand" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Henüz hiç aktiviteniz yok</h3>
              <p className="text-sm text-muted max-w-md mb-1">
                <strong>{brand.name}</strong> markası için yapay zekâ destekli içerik üretmeye hemen başlayabilirsiniz.
                {brand.sector && ` ${SECTOR_MAP[brand.sector] || brand.sector} sektöründeki trendleri yakalamanız için AI motorumuz hazır.`}
              </p>
              <p className="text-xs text-muted mb-6">
                ✨ DIO&apos;nun LLM motorlarıyla markanıza özel, platformlara uygun içerik fikirleri otomatik oluşturulabilir.
              </p>
              <button
                onClick={() => handleCreateContent(`${brand.name} markanız için ${SECTOR_MAP[brand.sector] || "sektörünüze"} özel yeni sezon içerikleri`)}
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-md shadow-brand/20 transition hover:shadow-lg"
              >
                <SparklesIcon className="w-4 h-4" />
                AI ile İçerik Üretmeye Başla
              </button>
            </div>
          )}

          {/* ═══ OVERVIEW TAB ═══ */}
          {hasActivity && tab === "overview" && (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Recent ideas */}
              <div className="card overflow-hidden">
                <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <SparklesIcon className="w-4 h-4 text-violet-500" /> Son İçerik Fikirleri
                  </h3>
                  <button onClick={() => setTab("ideas")} className="text-[11px] font-medium text-brand hover:underline">Tümü →</button>
                </div>
                <div className="divide-y divide-zinc-50">
                  {(data?.ideas || []).slice(0, 5).map((idea) => (
                    <div key={idea.id} className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-50/50 transition-colors">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${idea.is_selected ? "bg-emerald-50 text-emerald-600" : "bg-zinc-100 text-zinc-400"}`}>
                        {idea.is_selected ? <CheckCircleIcon className="w-4 h-4" /> : <LightBulbIcon className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{idea.title || "İsimsiz Fikir"}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="inline-flex items-center gap-1 text-[10px] text-muted">
                            <PlatformIcon platform={idea.platform} /> {idea.platform || "—"}
                          </span>
                          <span className="text-[10px] text-muted">{timeAgo(idea.created_at)}</span>
                        </div>
                      </div>
                      {idea.ai_score > 0 && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${idea.ai_score >= 80 ? "bg-emerald-50 text-emerald-700" : idea.ai_score >= 50 ? "bg-amber-50 text-amber-700" : "bg-zinc-100 text-zinc-500"}`}>
                          {idea.ai_score}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent studios */}
              <div className="card overflow-hidden">
                <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <PhotoIcon className="w-4 h-4 text-blue-500" /> Görsel Stüdyolar
                  </h3>
                  <button onClick={() => setTab("studios")} className="text-[11px] font-medium text-brand hover:underline">Tümü →</button>
                </div>
                <div className="divide-y divide-zinc-50">
                  {(data?.studios || []).slice(0, 4).map((studio) => (
                    <div key={studio.id} className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-50/50 transition-colors">
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_URL}${studio.source_image_url}`}
                        alt={studio.title}
                        className="h-12 w-12 rounded-lg border border-zinc-200 object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{studio.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted">{studio.category}</span>
                          <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${studio.status === "ready" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                            {studio.status === "ready" ? "Hazır" : studio.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block text-xs font-bold text-foreground">{studio.variant_count}</span>
                        <span className="text-[10px] text-muted">varyant</span>
                      </div>
                    </div>
                  ))}
                  {(data?.studios || []).length === 0 && (
                    <div className="px-5 py-6 text-center text-xs text-muted">Henüz görsel stüdyosu oluşturulmamış</div>
                  )}
                </div>
              </div>

              {/* Briefs & Quick Actions */}
              <div className="card overflow-hidden lg:col-span-2">
                <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <DocumentTextIcon className="w-4 h-4 text-amber-500" /> Stüdyo Briefleri
                  </h3>
                </div>
                {(data?.briefs || []).length > 0 ? (
                  <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                    {(data?.briefs || []).slice(0, 6).map((brief) => (
                      <div key={brief.id} className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 hover:bg-white hover:border-zinc-200 transition-all group">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-sm font-semibold text-foreground truncate flex-1">{brief.title}</h4>
                          {brief.is_favorite && <span className="text-amber-500 text-xs ml-1">⭐</span>}
                        </div>
                        <p className="text-xs text-muted line-clamp-2 mb-3">{brief.content}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted">Kullanım: {brief.used_count}x</span>
                          <button
                            onClick={() => handleCreateContent(brief.content)}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-brand transition opacity-0 group-hover:opacity-100 hover:underline"
                          >
                            <SparklesIcon className="w-3 h-3" /> Bu brief ile içerik oluştur
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-sm text-muted mb-3">Henüz stüdyo brief&apos;i yok</p>
                    <p className="text-xs text-zinc-400 mb-4">Markanız için otomatik prompt oluşturabilirsiniz — AI, sektörünüzü ve marka kimliğinizi analiz ederek öneriler üretir.</p>
                    <button
                      onClick={() => handleCreateContent(`${brand.name} markası için ${brand.sector} sektöründe dikkat çekici sosyal medya içeriği`)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-brand/10 text-brand px-4 py-2 text-xs font-semibold transition hover:bg-brand/20"
                    >
                      <SparklesIcon className="w-3.5 h-3.5" /> Otomatik Prompt Oluştur
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ IDEAS TAB ═══ */}
          {tab === "ideas" && (
            <div className="card overflow-hidden divide-y divide-zinc-100">
              {(data?.ideas || []).length === 0 ? (
                <div className="p-10 text-center">
                  <LightBulbIcon className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
                  <p className="text-sm text-muted">Henüz hiç içerik fikri üretilmemiş</p>
                  <button onClick={() => handleCreateContent()} className="mt-3 inline-flex items-center gap-1 text-sm text-brand font-medium hover:underline">
                    <PlusCircleIcon className="w-4 h-4" /> İlk içerik fikrinizi üretin
                  </button>
                </div>
              ) : (
                (data?.ideas || []).map((idea) => (
                  <div key={idea.id} className="flex items-center gap-4 px-5 py-4 hover:bg-zinc-50/50 transition-colors">
                    {idea.image_url ? (
                      <img src={`${process.env.NEXT_PUBLIC_API_URL}${idea.image_url}`} alt="" className="h-14 w-14 rounded-xl border border-zinc-200 object-cover" />
                    ) : (
                      <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${idea.is_selected ? "bg-emerald-50" : "bg-zinc-100"}`}>
                        <LightBulbIcon className={`w-6 h-6 ${idea.is_selected ? "text-emerald-500" : "text-zinc-400"}`} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">{idea.title || "İsimsiz Fikir"}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted"><PlatformIcon platform={idea.platform} /> {idea.platform}</span>
                        {idea.campaign_type && <span className="text-[11px] text-muted bg-zinc-100 rounded px-1.5 py-0.5">{idea.campaign_type}</span>}
                        <span className="text-[10px] text-muted">{timeAgo(idea.created_at)}</span>
                      </div>
                    </div>
                    {idea.is_selected && <span className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[10px] font-bold">Seçildi ✓</span>}
                    {idea.ai_score > 0 && (
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${idea.ai_score >= 80 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                        Skor: {idea.ai_score}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* ═══ STUDIOS TAB ═══ */}
          {tab === "studios" && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(data?.studios || []).length === 0 ? (
                <div className="sm:col-span-3 card p-10 text-center">
                  <PhotoIcon className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
                  <p className="text-sm text-muted">Henüz görsel stüdyosu yok</p>
                </div>
              ) : (
                (data?.studios || []).map((s) => (
                  <div key={s.id} className="card overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="relative h-40 bg-zinc-100">
                      <img src={`${process.env.NEXT_PUBLIC_API_URL}${s.source_image_url}`} alt={s.title} className="h-full w-full object-cover" />
                      <span className={`absolute top-2 right-2 rounded-full px-2 py-0.5 text-[9px] font-bold ${s.status === "ready" ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"}`}>
                        {s.status === "ready" ? "Hazır" : s.status}
                      </span>
                    </div>
                    <div className="p-4">
                      <h4 className="text-sm font-semibold text-foreground">{s.title}</h4>
                      <p className="text-[11px] text-muted mt-0.5">{s.category} · {timeAgo(s.created_at)}</p>
                      <div className="flex items-center gap-4 mt-3 text-[11px] text-muted">
                        <span className="font-medium text-foreground">{s.variant_count} görsel varyant</span>
                        <span className="font-medium text-foreground">{s.ad_variant_count} reklam varyantı</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ═══ AD VARIANTS TAB ═══ */}
          {tab === "ads" && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(data?.ad_variants || []).length === 0 ? (
                <div className="sm:col-span-3 card p-10 text-center">
                  <PaintBrushIcon className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
                  <p className="text-sm text-muted">Henüz reklam varyantı yok</p>
                </div>
              ) : (
                (data?.ad_variants || []).map((ad) => (
                  <div key={ad.id} className="card overflow-hidden group hover:shadow-md transition-shadow">
                    {ad.preview_url && (
                      <div className="relative h-36 bg-zinc-100">
                        <img src={`${process.env.NEXT_PUBLIC_API_URL}${ad.preview_url}`} alt={ad.name} className="h-full w-full object-cover" />
                        <span className={`absolute top-2 right-2 rounded-full px-2 py-0.5 text-[9px] font-bold ${ad.status === "ready" ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"}`}>
                          {ad.status === "ready" ? "Hazır" : ad.status}
                        </span>
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <PlatformIcon platform={ad.platform} />
                        <h4 className="text-sm font-semibold text-foreground truncate">{ad.name}</h4>
                      </div>
                      <p className="text-[11px] text-muted">{ad.format_label} · {ad.width}×{ad.height}</p>
                      {ad.headline && <p className="text-xs text-foreground mt-2 font-medium line-clamp-1">&ldquo;{ad.headline}&rdquo;</p>}
                      {ad.score > 0 && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-[10px] text-muted mb-1">
                            <span>Skor</span><span className="font-bold text-foreground">{ad.score}/100</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${ad.score >= 90 ? "bg-emerald-500" : ad.score >= 70 ? "bg-blue-500" : "bg-amber-500"}`} style={{ width: `${ad.score}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ═══ BRIEFS TAB ═══ */}
          {tab === "briefs" && (
            <div className="space-y-3">
              {(data?.briefs || []).length === 0 ? (
                <div className="card p-10 text-center">
                  <DocumentTextIcon className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
                  <p className="text-sm text-muted mb-3">Henüz stüdyo brief&apos;i oluşturulmamış</p>
                  <p className="text-xs text-zinc-400 mb-4">Markanızın bilgilerini kullanarak otomatik prompt oluşturabilirsiniz.</p>
                  <button
                    onClick={() => handleCreateContent(`${brand.name} markası için ${brand.sector} sektöründe dikkat çekici içerik`)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand/10 text-brand px-4 py-2 text-xs font-semibold transition hover:bg-brand/20"
                  >
                    <SparklesIcon className="w-3.5 h-3.5" /> Otomatik Prompt Oluştur
                  </button>
                </div>
              ) : (
                (data?.briefs || []).map((brief) => (
                  <div key={brief.id} className="card p-5 group hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
                        <DocumentTextIcon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-foreground">{brief.title}</h4>
                          <div className="flex items-center gap-2">
                            {brief.is_favorite && <span className="text-amber-500">⭐</span>}
                            <span className="text-[10px] text-muted bg-zinc-100 rounded px-1.5 py-0.5">{brief.brief_type}</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted mt-1.5 line-clamp-3">{brief.content}</p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-[10px] text-muted">{brief.used_count}x kullanıldı · {timeAgo(brief.created_at)}</span>
                          <button
                            onClick={() => handleCreateContent(brief.content)}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-brand opacity-0 group-hover:opacity-100 transition hover:underline"
                          >
                            Bu brief ile içerik oluştur →
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ═══ SCHEDULE TAB ═══ */}
          {tab === "schedule" && (
            <div className="card overflow-hidden divide-y divide-zinc-100">
              {(data?.schedules || []).length === 0 ? (
                <div className="p-10 text-center">
                  <CalendarDaysIcon className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
                  <p className="text-sm text-muted">Henüz zamanlanmış içerik yok</p>
                </div>
              ) : (
                (data?.schedules || []).map((sched) => (
                  <div key={sched.id} className="flex items-center gap-4 px-5 py-4 hover:bg-zinc-50/50 transition-colors">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${sched.status === "published" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"}`}>
                      {sched.status === "published" ? <CheckCircleIcon className="w-5 h-5" /> : <ClockIcon className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <PlatformIcon platform={sched.platform} />
                        <span className="text-sm font-medium text-foreground">{sched.platform}</span>
                      </div>
                      <p className="text-[11px] text-muted mt-0.5">
                        {new Date(sched.scheduled_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${sched.status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>
                      {sched.status === "published" ? "Yayında" : sched.status === "planned" ? "Planlandı" : sched.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* ═══ Mobile CTA ═══ */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-30">
        <button
          onClick={() => handleCreateContent()}
          className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-brand px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand/30"
        >
          <SparklesIcon className="w-5 h-5" />
          İçerik Üret
        </button>
      </div>
    </div>
  );
}
