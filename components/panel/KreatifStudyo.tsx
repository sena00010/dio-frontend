"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api";

/* ────────────────────────────────────────────────────────────
   Types — mirrors the ai_topic_suggestions structure
   ──────────────────────────────────────────────────────────── */
type TopicCategory = "Bugün için" | "Trendde" | "Planlı" | "Evergreen";

interface TopicSuggestion {
  id: number;
  topic_title: string;
  category: TopicCategory;
  score: number;
  ai_reasoning: string;
  trend_data: string;
  suggested_formats: string[];
  urgency_tag?: string;
  days_left?: number;
}

interface TrendItem {
  keyword: string;
  source: string;
  change: string;
}

interface CompetitorGap {
  title: string;
  desc: string;
}

/* ── Filter Tabs ──────────────────────────────────────────── */
const CATEGORIES: (TopicCategory | "Tümü")[] = [
  "Tümü",
  "Bugün için",
  "Trendde",
  "Planlı",
  "Evergreen",
];

const CATEGORY_ICONS: Record<string, string> = {
  "Tümü": "🔥",
  "Bugün için": "⚡",
  "Trendde": "📈",
  "Planlı": "📅",
  "Evergreen": "🌿",
};

/* ── Score Color Helpers ──────────────────────────────────── */
function getScoreGradient(score: number) {
  if (score >= 80) return "from-emerald-500 to-green-600";
  if (score >= 50) return "from-teal-500 to-cyan-600";
  if (score >= 35) return "from-orange-500 to-amber-600";
  if (score >= 25) return "from-rose-500 to-pink-600";
  return "from-red-600 to-red-700";
}

function getScoreRing(score: number) {
  if (score >= 80) return "ring-emerald-200";
  if (score >= 50) return "ring-teal-200";
  if (score >= 35) return "ring-orange-200";
  if (score >= 25) return "ring-rose-200";
  return "ring-red-300";
}

/* ── Category Badge Colors ─────────────────────────────── */
function getCategoryStyle(cat: string) {
  switch (cat) {
    case "Bugün için":
      return "bg-red-50 text-red-600 border-red-100";
    case "Trendde":
      return "bg-emerald-50 text-emerald-600 border-emerald-100";
    case "Planlı":
      return "bg-blue-50 text-blue-600 border-blue-100";
    case "Evergreen":
      return "bg-violet-50 text-violet-600 border-violet-100";
    default:
      return "bg-zinc-50 text-zinc-600 border-zinc-100";
  }
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function KreatifStudyoScreen({
  onKreatifNavigate,
}: {
  onKreatifNavigate?: (topics: string[]) => void;
}) {
  const { activeCompany } = useAuth();
  const [activeFilter, setActiveFilter] = useState<TopicCategory | "Tümü">("Tümü");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // API Data States
  const [topics, setTopics] = useState<TopicSuggestion[]>([]);
  const [trendRadar, setTrendRadar] = useState<TrendItem[]>([]);
  const [competitorGaps, setCompetitorGaps] = useState<CompetitorGap[]>([]);

  // Loading & Error States
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [trendLoading, setTrendLoading] = useState(false);
  const [topicsError, setTopicsError] = useState("");
  const [trendError, setTrendError] = useState("");

  /* ── Fetch Combined Dashboard (Parallel Backend) ──── */
  const fetchDashboard = useCallback(async (force = false) => {
    if (!activeCompany) return;
    setTopicsLoading(true);
    setTrendLoading(true);
    setTopicsError("");
    setTrendError("");
    try {
      const { data } = await api.post("/api/protected/creative-dashboard", {
        company_id: activeCompany.id,
        force,
      });
      // Topics
      const suggestions: TopicSuggestion[] = (data.suggestions || []).map(
        (s: TopicSuggestion, i: number) => ({ ...s, id: i + 1 })
      );
      setTopics(suggestions);
      // Trends
      const trendData = data.trend_data || {};
      setTrendRadar(trendData.trend_radar || []);
      setCompetitorGaps(trendData.competitor_gaps || []);
      if (data.cached) {
        console.log(`⚡ Dashboard cache hit — ${data.response_ms}ms`);
      } else {
        console.log(`✅ Dashboard fresh — ${data.response_ms}ms`);
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Dashboard verileri yüklenemedi";
      setTopicsError(msg);
      setTrendError(msg);
    } finally {
      setTopicsLoading(false);
      setTrendLoading(false);
    }
  }, [activeCompany]);

  /* ── Initial Load ────────────────────────────────────── */
  useEffect(() => {
    if (activeCompany) {
      fetchDashboard();
    }
  }, [activeCompany, fetchDashboard]);

  /* ── Filtered topics ─────────────────────────────────── */
  const filteredTopics = useMemo(() => {
    if (activeFilter === "Tümü") return topics;
    return topics.filter((t) => t.category === activeFilter);
  }, [activeFilter, topics]);

  /* ── Toggle selection ───────────────────────────────── */
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const removeSelection = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const selectedTopics = topics.filter((t) => selectedIds.has(t.id));

  /* ── Loading Skeleton ────────────────────────────────── */
  const CardSkeleton = () => (
    <div className="rounded-2xl border-2 border-zinc-100 bg-white p-5 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="h-5 bg-zinc-200 rounded w-3/4 mb-3" />
          <div className="flex gap-1.5 mb-3">
            <div className="h-5 bg-zinc-100 rounded w-12" />
            <div className="h-5 bg-zinc-100 rounded w-10" />
          </div>
          <div className="h-4 bg-zinc-100 rounded-full w-28 mb-3" />
          <div className="space-y-1.5">
            <div className="h-3 bg-zinc-100 rounded w-full" />
            <div className="h-3 bg-zinc-100 rounded w-5/6" />
            <div className="h-3 bg-zinc-100 rounded w-2/3" />
          </div>
        </div>
        <div className="h-10 w-10 bg-zinc-200 rounded-xl ml-4" />
      </div>
    </div>
  );

  const TrendSkeleton = () => (
    <div className="space-y-3 animate-pulse">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-5 h-4 bg-zinc-200 rounded" />
          <div className="flex-1">
            <div className="h-4 bg-zinc-200 rounded w-3/4 mb-1" />
            <div className="h-3 bg-zinc-100 rounded w-1/3" />
          </div>
          <div className="w-16 h-4 bg-zinc-200 rounded" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="relative min-h-[calc(100vh-6rem)]">
      {/* ── Top status bar ──────────────────────────── */}
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">
          Kreatif Stüdyo
        </p>
        <div className="flex items-center gap-3">
          {topics.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-emerald-600">
                {topics.length} konu önerisi hazır
              </span>
            </div>
          )}
          <button
            onClick={() => { fetchDashboard(true); }}
            disabled={topicsLoading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-zinc-50 disabled:opacity-50"
          >
            <svg className={`w-3.5 h-3.5 ${topicsLoading ? "animate-spin" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            {topicsLoading ? "Üretiliyor..." : "Yenile"}
          </button>
        </div>
      </div>

      {/* ── Hero Header ─────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Bugün ne içerik yaparsınız?
        </h1>
        <p className="mt-1.5 text-sm text-muted leading-relaxed max-w-2xl">
          {activeCompany ? (
            <>
              <strong className="text-foreground">{activeCompany.name}</strong> markası için
              platform trendleri ve rakip boşlukları analiz edildi
              {topics.length > 0 && (
                <>
                  {" — "}
                  <strong className="text-foreground">{topics.length} konu önerisi</strong>{" "}
                  hazırlandı
                </>
              )}
              . Bir veya birkaç konu seçin, AI kreatiﬂerinizi oluştursun.
            </>
          ) : (
            "Marka seçilmedi. Lütfen bir marka seçin."
          )}
        </p>
      </div>

      {/* ── Error Display ───────────────────────────── */}
      {topicsError && (
        <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-600 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          {topicsError}
          <button onClick={() => fetchDashboard(true)} className="ml-auto text-xs font-semibold underline">Tekrar Dene</button>
        </div>
      )}

      {/* ── Main Layout (Left + Right Sidebar) ─────── */}
      <div className="flex gap-5">
        {/* ══════ LEFT — Topic Suggestions ══════ */}
        <div className="flex-1 min-w-0">
          {/* Filter Tabs */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const isActive = activeFilter === cat;
                const count =
                  cat === "Tümü"
                    ? topics.length
                    : topics.filter((t) => t.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveFilter(cat)}
                    className={`group inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium border transition-all duration-200 ${
                      isActive
                        ? "bg-foreground text-white border-foreground shadow-md shadow-black/10"
                        : "bg-white text-foreground/80 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-sm"
                    }`}
                  >
                    <span className="text-sm">{CATEGORY_ICONS[cat]}</span>
                    {cat}
                    {cat !== "Tümü" && (
                      <span
                        className={`ml-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-zinc-100 text-zinc-500"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <span className="text-xs text-muted hidden lg:block">
              Birden fazla seçebilirsiniz
            </span>
          </div>

          {/* ── Grid Cards ──────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-28">
            {topicsLoading ? (
              // Skeleton loading state
              <>
                {[...Array(6)].map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </>
            ) : filteredTopics.length === 0 ? (
              <div className="col-span-2 flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">
                  {topics.length === 0 ? "Henüz konu önerisi yok" : "Bu filtrede öneri yok"}
                </h3>
                <p className="text-sm text-muted max-w-sm">
                  {topics.length === 0
                    ? "\"Yenile\" butonuna tıklayarak AI'dan marka profilinize özel konu önerileri alın."
                    : "Diğer kategorileri deneyin veya tüm önerileri görüntüleyin."}
                </p>
                {topics.length === 0 && (
                  <button
                    onClick={() => fetchDashboard(true)}
                    disabled={topicsLoading}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition hover:shadow-xl hover:-translate-y-0.5"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                    AI ile Önerileri Üret
                  </button>
                )}
              </div>
            ) : (
              filteredTopics.map((topic) => {
                const isSelected = selectedIds.has(topic.id);
                const gradient = getScoreGradient(topic.score);
                const ring = getScoreRing(topic.score);
                return (
                  <button
                    key={topic.id}
                    onClick={() => toggleSelect(topic.id)}
                    className={`group relative text-left rounded-2xl border-2 p-5 transition-all duration-250 cursor-pointer ${
                      isSelected
                        ? "border-brand bg-red-50/30 shadow-lg shadow-brand/8 ring-1 ring-brand/20"
                        : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-md hover:-translate-y-0.5"
                    }`}
                  >
                    {/* Selection indicator */}
                    <div
                      className={`absolute top-4 left-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? "bg-brand border-brand scale-110"
                          : "border-zinc-300 group-hover:border-zinc-400"
                      }`}
                    >
                      {isSelected && (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>

                    {/* AI Score — top right */}
                    <div className={`absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white text-sm font-bold shadow-lg ring-2 ${ring}`}>
                      {topic.score}
                    </div>

                    {/* Content area */}
                    <div className="mt-4">
                      <h3 className="text-base font-semibold text-foreground pr-12 leading-snug">
                        {topic.topic_title}
                      </h3>

                      {/* Format tags */}
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {(topic.suggested_formats || []).map((fmt) => (
                          <span key={fmt} className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
                            {fmt}
                          </span>
                        ))}
                      </div>

                      {/* Category + urgency tag */}
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${getCategoryStyle(topic.category)}`}>
                          <span className="text-[10px]">
                            {topic.category === "Bugün için" && "🔴"}
                            {topic.category === "Trendde" && "📈"}
                            {topic.category === "Planlı" && "📅"}
                            {topic.category === "Evergreen" && "🌿"}
                          </span>
                          {topic.urgency_tag || topic.category}
                        </span>
                        {topic.days_left && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-600">
                            📅 {topic.days_left} gün kaldı
                          </span>
                        )}
                      </div>

                      {/* AI Reasoning */}
                      <p className="mt-3 text-[12.5px] leading-relaxed text-muted line-clamp-3">
                        {topic.ai_reasoning}
                      </p>

                      {/* Trend data footer */}
                      <div className="mt-3 flex items-center gap-1.5 pt-2 border-t border-dashed border-zinc-100">
                        <span className="text-[10px] text-rose-500">●</span>
                        <span className="text-[11px] text-muted">
                          Trend Radar:{" "}
                          <span className="font-semibold text-foreground">{topic.trend_data}</span>
                          {" · "}
                          {(topic.suggested_formats || []).length > 1
                            ? (topic.suggested_formats || []).join(" + ")
                            : (topic.suggested_formats || [])[0] || ""}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ══════ RIGHT SIDEBAR — Trend Radar + Rakip Boşluğu ══════ */}
        <aside className="hidden xl:block w-[300px] flex-shrink-0 space-y-5">
          {/* ── Trend Radar ──────────────────────────── */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-orange-50 text-xs">📡</span>
                Trend Radar
              </h3>
              <p className="mt-1 text-[11px] text-muted leading-relaxed">
                {activeCompany
                  ? `${activeCompany.name} sektöründe bu hafta yükselen aramalar`
                  : "Sektörünüzde bu hafta yükselen aramalar"}
              </p>
            </div>

            {trendLoading ? (
              <TrendSkeleton />
            ) : trendError ? (
              <p className="text-xs text-rose-500">{trendError}</p>
            ) : trendRadar.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-xs text-muted">Trend verisi yüklenecek...</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {trendRadar.map((item, i) => (
                  <div key={item.keyword} className="flex items-center gap-3 group">
                    <span className="flex-shrink-0 w-5 text-[11px] font-bold text-muted">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-foreground truncate">{item.keyword}</p>
                      <p className="text-[10px] text-muted">{item.source}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-12 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${
                          i === 0 ? "w-full bg-red-500"
                            : i === 1 ? "w-4/5 bg-orange-500"
                            : i === 2 ? "w-3/5 bg-amber-500"
                            : i === 3 ? "w-2/5 bg-emerald-500"
                            : "w-1/3 bg-blue-500"
                        }`} />
                      </div>
                      <span className={`text-[11px] font-bold ${
                        i < 2 ? "text-red-500" : i < 4 ? "text-orange-500" : "text-emerald-500"
                      }`}>
                        ↑{item.change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Rakip Boşluğu ────────────────────────── */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-xs">🎯</span>
              Rakip Boşluğu
            </h3>
            {trendLoading ? (
              <div className="space-y-3 animate-pulse">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="rounded-xl bg-zinc-50 p-3">
                    <div className="h-4 bg-zinc-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-zinc-100 rounded w-full" />
                  </div>
                ))}
              </div>
            ) : competitorGaps.length === 0 ? (
              <p className="text-xs text-muted text-center py-3">Analiz yüklenecek...</p>
            ) : (
              <div className="space-y-3">
                {competitorGaps.map((gap) => (
                  <div key={gap.title} className="rounded-xl bg-zinc-50 border border-zinc-100 p-3 transition hover:bg-zinc-100/70">
                    <h4 className="text-[13px] font-semibold text-foreground">{gap.title}</h4>
                    <p className="mt-1 text-[11px] text-muted leading-relaxed">{gap.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ══════ STICKY BOTTOM BAR ══════ */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 animate-fade-in-up">
          <div className="mx-auto max-w-[1600px]">
            <div className="mx-2 mb-3 lg:mx-6 lg:mb-4 rounded-2xl bg-white border border-zinc-200 shadow-2xl shadow-black/10 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-4 px-5 py-3.5">
                {/* Left — selection info */}
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex-shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white text-sm font-bold shadow-sm">
                    {selectedIds.size}
                  </span>
                  <span className="text-sm font-medium text-foreground flex-shrink-0">konu seçildi</span>

                  {/* Tags */}
                  <div className="hidden md:flex items-center gap-2 overflow-x-auto max-w-md">
                    {selectedTopics.map((t) => (
                      <span key={t.id} className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 pl-2.5 pr-1 py-1 text-[12px] font-medium text-foreground whitespace-nowrap group">
                        {t.topic_title}
                        <button
                          onClick={(e) => { e.stopPropagation(); removeSelection(t.id); }}
                          className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-zinc-300/60 text-muted hover:text-foreground transition"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right — Action buttons */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <button className="hidden sm:inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" />
                    </svg>
                    Dashboard
                  </button>
                  <button
                    onClick={() => {
                      const topicTitles = selectedTopics.map((t) => t.topic_title);
                      onKreatifNavigate?.(topicTitles);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-brand/25 transition-all hover:shadow-xl hover:shadow-brand/30 hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                    Kreatifleri Oluştur
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
