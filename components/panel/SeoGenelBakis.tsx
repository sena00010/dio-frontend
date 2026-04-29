"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";

const SeoAksiyonlar = dynamic(() => import("./SeoAksiyonlar"), { ssr: false });
const SeoSiralamalar = dynamic(() => import("./SeoSiralamalar"), { ssr: false });
const SeoKelimeler = dynamic(() => import("./SeoKelimeler"), { ssr: false });
const SeoIcerikUretimi = dynamic(() => import("./SeoIcerikUretimi"), { ssr: false });
const SeoTeknik = dynamic(() => import("./SeoTeknik"), { ssr: false });
const SeoBacklink = dynamic(() => import("./SeoBacklink"), { ssr: false });
const SeoAIVisibility = dynamic(() => import("./SeoAIVisibility"), { ssr: false });
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */

interface SeoProject {
  id: number;
  site_url: string;
  display_name: string;
  last_sync_at: string | null;
}

interface OverviewData {
  project: { id: number; site_url: string; display_name: string; last_sync_at: string | null };
  kpi: {
    total_clicks: number; total_impressions: number; avg_ctr: number; avg_position: number;
    click_delta: number; impression_delta: number; ctr_delta: number; position_delta: number;
  };
  brand: { brand_clicks: number; non_brand_clicks: number; brand_ctr: number; non_brand_ctr: number };
  trend: { date: string; clicks: number; impressions: number }[];
  ai_summary: string;
  device: { name: string; value: number; pct: number; color: string }[] | null;
  country: { code: string; name: string; value: number; pct: number }[] | null;
  search_type: { name: string; value: number; pct: number; color: string }[] | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  top_queries: any[] | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  top_pages: any[] | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctr_opportunities: any[] | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rising_queries: any[] | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  falling_queries: any[] | null;
  period: string;
}

const SUB_TABS = [
  { key: "genel", label: "Genel Bakış", icon: "📊" },
  { key: "aksiyonlar", label: "Aksiyonlar", badge: "9", icon: "⚡" },
  { key: "siralamalar", label: "Sıralamalar", icon: "📈" },
  { key: "kelimeler", label: "Kelimeler", icon: "🔑" },
  { key: "icerik", label: "İçerik Üretimi", badge: "YENİ", badgeVariant: "new" as const, icon: "✍️" },
  { key: "teknik", label: "Teknik", icon: "⚙️" },
  { key: "backlink", label: "Backlink", icon: "🔗" },
  { key: "ai", label: "AI Görünürlük", badge: "2026", icon: "🤖" },
];

const PERIODS = [
  { key: "7d", label: "7G", days: 7 },
  { key: "28d", label: "28G", days: 28 },
  { key: "90d", label: "90G", days: 90 },
  { key: "12m", label: "12A", days: 365 },
];

const BRAND_COLORS = ["#7C3AED", "#3B82F6"];

/* ═══════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════ */

function fmtNum(n: number): string {
  if (!n) return "0";
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toLocaleString("tr-TR");
}

function fmtDelta(d: number): string {
  if (!d) return "0";
  return (d >= 0 ? "↑ " : "↓ ") + "%" + Math.abs(d).toFixed(0);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TrendTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs font-bold text-zinc-800">{payload[0]?.value?.toLocaleString()} tık · {label}</p>
    </div>
  );
}

function Sparkline({ data, color, height = 32 }: { data: { v: number }[]; color: string; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
        <defs>
          <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
          fill={`url(#spark-${color.replace("#", "")})`} dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */
export default function SeoGenelBakis({ onNavigateToKreatif, initialTab }: { onNavigateToKreatif?: (topics: string[]) => void; initialTab?: string }) {
  const { activeCompany } = useAuth();

  const [projects, setProjects] = useState<SeoProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState("28d");
  const [activeSubTab, setActiveSubTab] = useState(initialTab || "genel");
  const [querySort, setQuerySort] = useState<"clicks" | "impressions" | "ctr">("clicks");
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);

  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [connected, setConnected] = useState<boolean | null>(null);

  // initialTab değiştiğinde sub-tab'ı güncelle (sidebar navigasyonu)
  useEffect(() => { if (initialTab) setActiveSubTab(initialTab); }, [initialTab]);

  // 1) Projeleri çek
  useEffect(() => {
    if (!activeCompany?.id) return;
    api.get(`/api/seo/projects?company_id=${activeCompany.id}`)
      .then(({ data }) => {
        setConnected(data.connected);
        if (data.projects?.length > 0) {
          setProjects(data.projects);
          setActiveProjectId(data.projects[0].id);
        }
      })
      .catch(() => setConnected(false));
  }, [activeCompany?.id]);

  // 2) Overview verisi çek (activeProjectId veya period değiştiğinde)
  const fetchOverview = useCallback(() => {
    if (!activeProjectId || !activeCompany?.id) return;
    setLoading(true);
    api.get(`/api/seo/projects/${activeProjectId}/overview?company_id=${activeCompany.id}&period=${selectedPeriod}`)
      .then(({ data }) => {
        // Henüz sync yapılmamışsa overview'u null bırak (CTA göster)
        if (!data.project?.last_sync_at) {
          setOverview(null);
        } else {
          setOverview(data);
        }
      })
      .catch(() => setOverview(null))
      .finally(() => setLoading(false));
  }, [activeProjectId, activeCompany?.id, selectedPeriod]);

  useEffect(() => { fetchOverview(); }, [fetchOverview]);

  // 3) Senkronizasyon tetikle — her tıklamada çalışır
  const handleSync = async () => {
    if (!activeProjectId || !activeCompany?.id) {
      console.warn("Sync: activeProjectId veya companyId eksik", { activeProjectId, cid: activeCompany?.id });
      return;
    }
    setSyncing(true);
    try {
      console.log("🔄 GSC Sync başlıyor... projectId:", activeProjectId, "period:", selectedPeriod);

      // 1) Ana GSC verilerini senkronize et (snapshot + discovery)
      await api.post(`/api/seo/projects/${activeProjectId}/sync?company_id=${activeCompany.id}&period=${selectedPeriod}`, {});

      // 2) Rankings/Keyword verilerini de çek (kelimeler & sıralamalar için)
      try {
        await api.get(`/api/seo/rankings/sync?projectId=${activeProjectId}&company_id=${activeCompany.id}`);
      } catch { /* rankings hatası kritik değil */ }

      // 3) Action engine'i çalıştır
      try {
        await api.get(`/api/seo/actions/run-engine?projectId=${activeProjectId}&company_id=${activeCompany.id}`);
      } catch { /* action engine hatası kritik değil */ }

      console.log("✅ GSC Sync tamamlandı");

      // Verileri yenile
      fetchOverview();
    } catch (e: unknown) {
      console.error("❌ Sync hatası:", e);
      const errMsg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error || "Bilinmeyen hata";
      alert("Senkronizasyon hatası: " + errMsg);
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!activeCompany?.id) return;
    if (!confirm("SEO entegrasyonunun bağlantısını kesmek istediğinize emin misiniz?")) return;
    try {
      await api.delete(`/api/seo/integration/disconnect?company_id=${activeCompany.id}`);
      setConnected(false);
      setProjects([]);
      setOverview(null);
    } catch (e) {
      alert("Bağlantı kesilirken bir hata oluştu.");
    }
  };

  // Bağlantı yoksa CTA göster
  if (connected === false) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-2xl">🔗</div>
        <h2 className="text-xl font-bold text-zinc-800">Google Search Console Bağlantısı Gerekli</h2>
        <p className="mt-2 max-w-md text-sm text-zinc-500">
          SEO verilerini görebilmek için önce Google Search Console hesabınızı bağlayın.
        </p>
        <button
          onClick={() => {
            api.get(`/api/seo/auth/google/login?company_id=${activeCompany?.id}`)
              .then(({ data }) => { if (data.url) window.location.href = data.url; });
          }}
          className="mt-6 rounded-xl bg-[#E73932] px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-[#D32F2F]"
        >
          Google Search Console Bağla
        </button>
      </div>
    );
  }

  const activeProject = projects.find(p => p.id === activeProjectId);

  // Sparkline verisi üretmek için trend
  const trendClicks = (overview?.trend || []).map(t => ({ v: t.clicks }));
  const trendImps = (overview?.trend || []).map(t => ({ v: t.impressions }));
  // CTR ve Position sparkline (trends'ten hesapla)
  const trendCTR = (overview?.trend || []).map(t => ({ v: t.impressions > 0 ? (t.clicks / t.impressions) : 0 }));
  const trendPos = trendClicks.map(() => ({ v: overview?.kpi?.avg_position || 0 }));

  const kpi = overview?.kpi;
  const brand = overview?.brand;
  const brandTotal = (brand?.brand_clicks || 0) + (brand?.non_brand_clicks || 0);
  const brandPct = brandTotal > 0 ? Math.round((brand?.brand_clicks || 0) / brandTotal * 100) : 0;

  const devices = overview?.device || [];
  const countries = overview?.country || [];
  const searchTypes = overview?.search_type || [];
  const topQueries = overview?.top_queries || [];
  const topPages = overview?.top_pages || [];
  const ctrOpps = overview?.ctr_opportunities || [];
  const risingQ = overview?.rising_queries || [];
  const fallingQ = overview?.falling_queries || [];

  return (
    <div className="space-y-4">
      {/* ════════════════════════════════════════
          HEADER: Breadcrumb + Tabs + Actions
          ════════════════════════════════════════ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-xs text-zinc-400">DIO</span>
          <span className="hidden sm:inline text-xs text-zinc-300">›</span>
          <span className="hidden sm:inline text-xs text-zinc-400">SEO Merkezi:</span>
          <h1 className="text-base sm:text-lg font-bold text-zinc-900">
            {activeSubTab === "aksiyonlar" ? "Aksiyonlar" : activeSubTab === "siralamalar" ? "Sıralamalar" : activeSubTab === "kelimeler" ? "Kelimeler" : activeSubTab === "icerik" ? "İçerik Üretimi" : activeSubTab === "teknik" ? "Teknik SEO" : activeSubTab === "backlink" ? "Backlink" : activeSubTab === "ai" ? "AI Görünürlük" : "Genel Bakış"}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Domain Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProjectDropdown(!showProjectDropdown)}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold text-zinc-700">
                {activeProject?.display_name || "Site seçin..."}
              </span>
              <span className="text-[10px] text-zinc-400">▼</span>
            </button>
            {showProjectDropdown && (
              <div className="absolute right-0 top-full z-50 mt-1 min-w-[200px] rounded-xl border border-zinc-200 bg-white py-1 shadow-xl">
                {projects.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { setActiveProjectId(p.id); setShowProjectDropdown(false); }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition hover:bg-zinc-50 ${activeProjectId === p.id ? "font-bold text-[#E73932]" : "text-zinc-700"}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${activeProjectId === p.id ? "bg-[#E73932]" : "bg-zinc-300"}`} />
                    {p.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Period */}
          <div className="flex rounded-lg border border-zinc-200 bg-white p-0.5">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setSelectedPeriod(p.key)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition ${
                  selectedPeriod === p.key ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {/* Actions */}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50"
          >
            {syncing ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" /> : "↻"} Tara
          </button>
          <button onClick={handleDisconnect} className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 shadow-sm transition hover:bg-red-50">
            Bağlantıyı Kes
          </button>
          <button className="rounded-lg bg-[#E73932] px-4 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#D32F2F]">
            ● Rapor
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-0 border-b border-zinc-200 overflow-x-auto scrollbar-none">
        {SUB_TABS.map((tab) => (
          <button key={tab.key} onClick={() => setActiveSubTab(tab.key)}
            className={`relative flex items-center gap-1.5 whitespace-nowrap px-3 py-2 sm:px-4 sm:py-2.5 text-[11px] sm:text-[12px] font-semibold transition ${
              activeSubTab === tab.key ? "border-b-2 border-[#E73932] text-[#E73932]" : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <span className="text-[11px]">{tab.icon}</span> {tab.label}
            {tab.badge && (
              <span className={`ml-0.5 rounded-full px-1.5 py-[1px] text-[9px] font-bold ${
                tab.badgeVariant === "new" ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"
              }`}>{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* AKSİYONLAR TAB */}
      {activeSubTab === "aksiyonlar" && <SeoAksiyonlar activeProjectId={activeProjectId} />}

      {/* SIRALAMALAR TAB */}
      {activeSubTab === "siralamalar" && <SeoSiralamalar activeProjectId={activeProjectId} />}

      {/* KELİMELER TAB */}
      {activeSubTab === "kelimeler" && <SeoKelimeler activeProjectId={activeProjectId} />}

      {/* İÇERİK ÜRETİMİ TAB */}
      {activeSubTab === "icerik" && <SeoIcerikUretimi activeProjectId={activeProjectId} onNavigateToKreatif={onNavigateToKreatif} />}

      {/* TEKNİK SEO TAB */}
      {activeSubTab === "teknik" && <SeoTeknik activeProjectId={activeProjectId} />}

      {/* BACKLINK TAB */}
      {activeSubTab === "backlink" && <SeoBacklink activeProjectId={activeProjectId} />}

      {/* AI GÖRÜNÜRLÜK TAB */}
      {activeSubTab === "ai" && <SeoAIVisibility activeProjectId={activeProjectId} />}

      {/* GENEL BAKIŞ TAB */}
      {activeSubTab === "genel" && (
        <>
          {/* LOADING STATE */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-zinc-200 border-t-[#E73932]" />
              <span className="ml-3 text-sm text-zinc-500">Veriler yükleniyor...</span>
            </div>
          )}

      {!loading && overview && (
        <>
          {/* ════════════════════════════════════════
              AI SUMMARY CARD
              ════════════════════════════════════════ */}
          {overview.ai_summary && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#2A1215] via-[#1F1F1F] to-[#1A1A1A] px-6 py-5 text-white">
              <div className="absolute left-0 top-0 h-full w-1 bg-[#E73932]" />
              <div className="flex items-start gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-base">🤖</div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold">Son {PERIODS.find(p => p.key === selectedPeriod)?.label || "28G"} özeti — GSC verilerinden</h3>
                  <p className="mt-2 text-[12px] leading-5 text-zinc-300">{overview.ai_summary}</p>
                  <div className="mt-3 flex gap-2">
                    <button className="rounded-lg bg-[#E73932] px-3.5 py-1.5 text-[11px] font-bold text-white shadow-sm">
                      Aksiyonları Gör →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════
              KPI CARDS
              ════════════════════════════════════════ */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {[
              { label: "Toplam Tıklama", value: fmtNum(kpi?.total_clicks || 0), delta: fmtDelta(kpi?.click_delta || 0), color: "#E73932", sparkData: trendClicks, sparkColor: "#22C55E", badge: "GSC" },
              { label: "Toplam Gösterim", value: fmtNum(kpi?.total_impressions || 0), delta: fmtDelta(kpi?.impression_delta || 0), color: "#F59E0B", sparkData: trendImps, sparkColor: "#3B82F6", badge: "GSC" },
              { label: "Ort. CTR", value: `%${((kpi?.avg_ctr || 0) * 100).toFixed(1)}`, delta: `${(kpi?.ctr_delta || 0) >= 0 ? "↑" : "↓"} %${Math.abs(kpi?.ctr_delta || 0).toFixed(1)}`, color: "#F97316", sparkData: trendCTR, sparkColor: "#F97316", badge: "hedef: %3.5" },
              { label: "Ort. Pozisyon", value: (kpi?.avg_position || 0).toFixed(1), delta: `${(kpi?.position_delta || 0) >= 0 ? "↓" : "↑"} ${Math.abs(kpi?.position_delta || 0).toFixed(1)} iyileşme`, color: "#8B5CF6", sparkData: trendPos, sparkColor: "#8B5CF6", badge: "< = iyi" },
            ].map((card, i) => (
              <div key={i} className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4">
                <div className="absolute left-0 top-3 h-6 w-1 rounded-r-full" style={{ backgroundColor: card.color }} />
                <div className="flex items-start justify-between">
                  <div className="pl-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-medium text-zinc-500">{card.label}</span>
                      <span className="rounded bg-zinc-100 px-1.5 py-[1px] text-[8px] font-bold text-zinc-400">{card.badge}</span>
                    </div>
                    <p className="mt-1 text-2xl font-extrabold text-zinc-900">{card.value}</p>
                    <p className="mt-0.5 text-[10px] font-medium text-emerald-600">{card.delta}</p>
                  </div>
                  <div className="w-20">
                    <Sparkline data={card.sparkData.length > 0 ? card.sparkData : [{ v: 0 }]} color={card.sparkColor} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ════════════════════════════════════════
              TREND CHART + BRAND/NON-BRAND
              ════════════════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-3">
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">Tıklama & Gösterim Trendi</h3>
                  <p className="text-[10px] text-zinc-400">Son {PERIODS.find(p => p.key === selectedPeriod)?.label} · GSC</p>
                </div>
                <div className="flex items-center gap-4 text-[10px]">
                  <div className="flex items-center gap-1"><span className="h-[3px] w-4 rounded-full bg-[#8B5CF6]" /><span className="font-medium text-zinc-500">Tıklama</span></div>
                  <div className="flex items-center gap-1"><span className="h-0 w-4 border-t-2 border-dashed border-[#3B82F6]" /><span className="font-medium text-zinc-500">Gösterim</span></div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={overview.trend || []} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fill: "#a1a1aa", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fill: "#a1a1aa", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: "#a1a1aa", fontSize: 10 }} axisLine={false} tickLine={false} hide />
                  <Tooltip content={<TrendTooltip />} />
                  <Line yAxisId="left" type="monotone" dataKey="clicks" stroke="#8B5CF6" strokeWidth={2.5} dot={false}
                    activeDot={{ r: 4, fill: "#8B5CF6", strokeWidth: 2, stroke: "#fff" }} />
                  <Line yAxisId="right" type="monotone" dataKey="impressions" stroke="#3B82F6" strokeWidth={2}
                    strokeDasharray="6 4" dot={false} opacity={0.5} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Brand / Non-Brand */}
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-bold text-zinc-900">Brand / Non-Brand</h3>
                <span className="text-[10px] text-zinc-400">*Arama dağılımı</span>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative">
                  <PieChart width={130} height={130}>
                    <Pie data={[
                      { name: "Brand", value: brandPct || 1 },
                      { name: "Non-Brand", value: 100 - (brandPct || 1) },
                    ]} cx={65} cy={65} innerRadius={40} outerRadius={58} dataKey="value"
                      startAngle={90} endAngle={-270} paddingAngle={2} stroke="none">
                      {[0, 1].map(idx => <Cell key={idx} fill={BRAND_COLORS[idx]} />)}
                    </Pie>
                  </PieChart>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-extrabold text-zinc-800">%{brandPct}</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2">
                  <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-[#7C3AED]" /><span className="text-[11px] font-semibold text-zinc-700">Brand</span></div>
                  <div className="text-right"><span className="text-[11px] font-bold text-zinc-700">{fmtNum(brand?.brand_clicks || 0)}</span><span className="ml-1 text-[10px] text-zinc-400">tık · %{((brand?.brand_ctr || 0) * 100).toFixed(1)} CTR</span></div>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2">
                  <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-[#3B82F6]" /><span className="text-[11px] font-semibold text-zinc-700">Non-Brand</span></div>
                  <div className="text-right"><span className="text-[11px] font-bold text-zinc-700">{fmtNum(brand?.non_brand_clicks || 0)}</span><span className="ml-1 text-[10px] text-zinc-400">tık · %{((brand?.non_brand_ctr || 0) * 100).toFixed(1)} CTR</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════
              CİHAZ / ÜLKE / ARAMA TÜRÜ
              ════════════════════════════════════════ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Cihaz Kırılımı */}
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <h3 className="mb-3 text-sm font-bold text-zinc-900">Cihaz Kırılımı</h3>
              <div className="space-y-2.5">
                {devices.map((d) => (
                  <div key={d.name} className="flex items-center gap-3">
                    <div className="flex items-center gap-2 w-20"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: d.color || "#94a3b8" }} /><span className="text-[11px] font-medium text-zinc-600">{d.name}</span></div>
                    <div className="flex-1 h-5 rounded-full bg-zinc-100 overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${d.pct}%`, backgroundColor: d.color || "#94a3b8" }} /></div>
                    <div className="flex items-center gap-1.5 text-right w-24"><span className="text-[11px] font-bold text-zinc-700">{fmtNum(d.value)}</span><span className="text-[10px] text-zinc-400">%{d.pct}</span></div>
                  </div>
                ))}
                {devices.length === 0 && <p className="text-[10px] text-zinc-400 py-4 text-center">Veri yok</p>}
              </div>
            </div>
            {/* Ülke / Bölge */}
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-bold text-zinc-900">Ülke / Bölge</h3><span className="text-[10px] text-zinc-400">Top 5</span></div>
              <div className="space-y-2">
                {countries.slice(0, 5).map((c) => (
                  <div key={c.code} className="flex items-center gap-2.5">
                    <span className="w-5 text-[10px] font-bold text-zinc-400">{c.code}</span>
                    <span className="w-16 truncate text-[11px] font-medium text-zinc-600">{c.name}</span>
                    <div className="flex-1 h-4 rounded bg-zinc-100 overflow-hidden"><div className="h-full rounded bg-gradient-to-r from-[#F97316] to-[#EF4444] transition-all" style={{ width: `${c.pct}%` }} /></div>
                    <div className="flex items-center gap-1.5 text-right w-20"><span className="text-[11px] font-bold text-zinc-700">{fmtNum(c.value)}</span><span className="text-[10px] text-zinc-400">%{c.pct}</span></div>
                  </div>
                ))}
                {countries.length === 0 && <p className="text-[10px] text-zinc-400 py-4 text-center">Veri yok</p>}
              </div>
            </div>
            {/* Arama Türü */}
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-bold text-zinc-900">Arama Türü</h3><span className="text-[10px] text-zinc-400">*Tıklama dağılımı</span></div>
              <div className="space-y-2.5">
                {searchTypes.map((s) => (
                  <div key={s.name} className="flex items-center gap-3">
                    <div className="flex items-center gap-2 w-24"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color || "#94a3b8" }} /><span className="text-[11px] font-medium text-zinc-600">{s.name}</span></div>
                    <div className="flex-1 h-4 rounded bg-zinc-100 overflow-hidden"><div className="h-full rounded transition-all" style={{ width: `${s.pct}%`, backgroundColor: s.color || "#94a3b8" }} /></div>
                    <div className="flex items-center gap-1.5 text-right w-20"><span className="text-[11px] font-bold text-zinc-700">{fmtNum(s.value)}</span><span className="text-[10px] text-zinc-400">%{s.pct}</span></div>
                  </div>
                ))}
                {searchTypes.length === 0 && <p className="text-[10px] text-zinc-400 py-4 text-center">Veri yok</p>}
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════
              EN İYİ ARAMA SORGULARI + EN İYİ SAYFALAR
              ════════════════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-3">
            {/* En İyi Arama Sorguları */}
            <div className="rounded-xl border border-zinc-200 bg-white">
              <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
                <div><h3 className="text-sm font-bold text-zinc-900">En İyi Arama Sorguları</h3><p className="text-[10px] text-zinc-400">Son {PERIODS.find(p => p.key === selectedPeriod)?.label} · tıklamaya göre</p></div>
                <div className="flex rounded-lg border border-zinc-200 p-0.5">
                  {(["clicks", "impressions", "ctr"] as const).map((k) => {
                    const labels = { clicks: "Tıklama", impressions: "Gösterim", ctr: "CTR" };
                    return (<button key={k} onClick={() => setQuerySort(k)} className={`rounded-md px-2.5 py-1 text-[10px] font-bold transition ${querySort === k ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-700"}`}>{labels[k]}</button>);
                  })}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead><tr className="border-b border-zinc-100 text-[10px] uppercase text-zinc-400">
                    <th className="px-4 py-2 text-left font-semibold">Sorgu</th>
                    <th className="px-2 py-2 text-left font-semibold">Tür</th>
                    <th className="px-2 py-2 text-right font-semibold">Tık.</th>
                    <th className="px-2 py-2 text-right font-semibold">Göst.</th>
                    <th className="px-2 py-2 text-right font-semibold">CTR</th>
                    <th className="px-3 py-2 text-right font-semibold">Poz.</th>
                  </tr></thead>
                  <tbody>
                    {(topQueries.length > 0
                      ? [...topQueries].sort((a, b) => (b[querySort] || 0) - (a[querySort] || 0)).slice(0, 15)
                      : []
                    ).map((q, i) => (
                      <tr key={i} className="border-b border-zinc-50 transition hover:bg-zinc-50/50">
                        <td className="px-4 py-2.5 font-semibold text-zinc-800">{q.query}</td>
                        <td className="px-2 py-2.5"><span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${q.type === "Brand" ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>{q.type}</span></td>
                        <td className="px-2 py-2.5 text-right font-bold text-zinc-800">{q.clicks}</td>
                        <td className="px-2 py-2.5 text-right text-zinc-500">{fmtNum(q.impressions)}</td>
                        <td className="px-2 py-2.5 text-right font-semibold text-zinc-700">%{q.ctr}</td>
                        <td className="px-3 py-2.5 text-right text-zinc-500">{q.pos}</td>
                      </tr>
                    ))}
                    {topQueries.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-400">Henüz veri yok — Tara butonuna tıklayın</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            {/* En İyi Sayfalar */}
            <div className="rounded-xl border border-zinc-200 bg-white">
              <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
                <div><h3 className="text-sm font-bold text-zinc-900">En İyi Sayfalar</h3><p className="text-[10px] text-zinc-400">Son {PERIODS.find(p => p.key === selectedPeriod)?.label}</p></div>
                <button className="text-[10px] font-semibold text-zinc-400 hover:text-zinc-600">Tümünü gör →</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead><tr className="border-b border-zinc-100 text-[10px] uppercase text-zinc-400">
                    <th className="px-4 py-2 text-left font-semibold">Sayfa</th>
                    <th className="px-2 py-2 text-right font-semibold">Tık.</th>
                    <th className="px-2 py-2 text-right font-semibold">Göst.</th>
                    <th className="px-2 py-2 text-right font-semibold">CTR</th>
                    <th className="px-3 py-2 text-right font-semibold">Poz.</th>
                  </tr></thead>
                  <tbody>
                    {(topPages.slice(0, 10)).map((p, i) => (
                      <tr key={i} className="border-b border-zinc-50 transition hover:bg-zinc-50/50">
                        <td className="px-4 py-2.5 font-semibold text-blue-600 max-w-[200px] truncate">{p.page}</td>
                        <td className="px-2 py-2.5 text-right font-bold text-zinc-800">{p.clicks}</td>
                        <td className="px-2 py-2.5 text-right text-zinc-500">{fmtNum(p.impressions)}</td>
                        <td className="px-2 py-2.5 text-right font-semibold text-zinc-700">%{p.ctr}</td>
                        <td className="px-3 py-2.5 text-right"><span className={`font-bold ${p.pos <= 10 ? "text-emerald-600" : p.pos <= 20 ? "text-orange-500" : "text-red-500"}`}>{p.pos}</span></td>
                      </tr>
                    ))}
                    {topPages.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-zinc-400">Henüz veri yok</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════
              CTR FIRSATLARI + DİZİN + AKSİYONLAR
              ════════════════════════════════════════ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* CTR Fırsatları */}
                <div className="rounded-xl border border-zinc-200 bg-white p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div><h3 className="text-sm font-bold text-zinc-900">CTR Fırsatları</h3><p className="text-[10px] text-zinc-400">Yüksek gösterim ama düşük CTR</p></div>
                    <button className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-[10px] font-bold text-zinc-500 hover:bg-zinc-100">AI Analiz</button>
                  </div>
                  <div className="space-y-2.5">
                    {ctrOpps.map((item, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-2.5 transition hover:border-zinc-200 hover:bg-zinc-50/50">
                        <div><p className="text-[12px] font-bold text-[#E73932]">{item.query}</p><p className="mt-0.5 text-[10px] text-zinc-400">{item.detail}</p></div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">{item.gain}</span>
                          <button className="rounded-lg bg-[#E73932] px-2.5 py-1 text-[10px] font-bold text-white hover:bg-[#D32F2F]">AI Yaz</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dizin Alınma + Bekleyen Aksiyonlar */}
                <div className="flex flex-col gap-3">
                  {/* Dizin Alınma */}
                  <div className="rounded-xl border border-zinc-200 bg-white p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-zinc-900">Dizin Alınma</h3>
                      <button className="rounded-lg border border-zinc-200 bg-white px-3 py-1 text-[10px] font-bold text-zinc-500 transition hover:bg-zinc-50">Teknik →</button>
                    </div>
                    {/* 3'lü özet kartları */}
                    <div className="mb-3 grid grid-cols-3 gap-2">
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-center">
                        <p className="text-xl font-black text-emerald-700">132</p>
                        <p className="text-[9px] font-semibold text-emerald-600">Dizin Alındı</p>
                      </div>
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-center">
                        <p className="text-xl font-black text-amber-700">8</p>
                        <p className="text-[9px] font-semibold text-amber-600">Alınmadı</p>
                      </div>
                      <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-center">
                        <p className="text-xl font-black text-red-600">4</p>
                        <p className="text-[9px] font-semibold text-red-500">Bekliyor</p>
                      </div>
                    </div>
                    {/* Sorun listesi */}
                    <div className="space-y-1.5">
                      {[
                        { label: "404 — Bulunamadı", value: "4 sayfa", color: "bg-red-100 text-red-700" },
                        { label: "Robots.txt engeli", value: "1 sayfa", color: "bg-orange-100 text-orange-700" },
                        { label: "Canonical sorunu", value: "3 sayfa", color: "bg-amber-100 text-amber-700" },
                        { label: "Core Web Vitals", value: "✓ Geçti", color: "bg-emerald-100 text-emerald-700" },
                      ].map((issue, i) => (
                        <div key={i} className="flex items-center justify-between py-1.5 text-[11px]">
                          <span className="text-zinc-600">{issue.label}</span>
                          <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${issue.color}`}>{issue.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bekleyen Aksiyonlar */}
                  <div className="rounded-xl border border-zinc-200 bg-white p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-zinc-900">Bekleyen Aksiyonlar</h3>
                      <button className="rounded-lg border border-zinc-200 bg-white px-3 py-1 text-[10px] font-bold text-zinc-500 transition hover:bg-zinc-50">Tümü (9) →</button>
                    </div>
                    <div className="space-y-2">
                      {[
                        { text: "4 sayfada 404 hatası", tag: "Kritik", tagColor: "bg-red-100 text-red-700", btn: "Düzelt", btnColor: "bg-[#E73932] text-white" },
                        { text: "7 sorgu düşük CTR", tag: "CTR", tagColor: "bg-orange-100 text-orange-700", btn: "AI Yaz", btnColor: "bg-[#22C55E] text-white" },
                        { text: "Rakip B 5 sıra geriledi", tag: "Fırsat", tagColor: "bg-blue-100 text-blue-700", btn: "İçerik Üret", btnColor: "bg-[#22C55E] text-white" },
                        { text: "48 sayfada Schema eksik", tag: "GEO", tagColor: "bg-zinc-100 text-zinc-600", btn: "Kodu Al", btnColor: "bg-zinc-900 text-white" },
                      ].map((action, i) => (
                        <div key={i} className="flex items-center justify-between border-b border-zinc-50 py-2 last:border-0">
                          <span className="text-[12px] font-semibold text-zinc-800">{action.text}</span>
                          <div className="flex items-center gap-1.5">
                            <span className={`rounded-md px-2 py-0.5 text-[9px] font-bold ${action.tagColor}`}>{action.tag}</span>
                            <button className={`rounded-md px-2.5 py-1 text-[9px] font-bold ${action.btnColor} shadow-sm transition hover:opacity-90`}>{action.btn}</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
          </div>

          {/* Yükselen + Düşen Sorgular */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-zinc-200 bg-white">
                  <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
                    <h3 className="text-sm font-bold text-zinc-900">↑ Yükselen Sorgular</h3>
                    <span className="text-[10px] text-zinc-400">Son 7 günde ivme kazanan</span>
                  </div>
                  <div className="overflow-x-auto"><table className="w-full text-[11px]">
                    <thead><tr className="border-b border-zinc-100 text-[10px] uppercase text-zinc-400">
                      <th className="px-4 py-2 text-left font-semibold">Sorgu</th><th className="px-2 py-2 text-right font-semibold">Gösterim</th><th className="px-3 py-2 text-right font-semibold">7G Değ.</th>
                    </tr></thead>
                    <tbody>{risingQ.map((q, i) => (
                      <tr key={i} className="border-b border-zinc-50 transition hover:bg-zinc-50/50">
                        <td className="px-4 py-2.5"><div className="flex items-center gap-1.5"><span className="font-semibold text-zinc-800">{q.query}</span>{q.isNew && <span className="rounded bg-red-100 px-1.5 py-[1px] text-[8px] font-bold text-red-600">YENİ</span>}</div></td>
                        <td className="px-2 py-2.5 text-right text-zinc-500">{q.impressions}</td>
                        <td className="px-3 py-2.5 text-right"><span className="font-bold text-emerald-600">↑{q.change}</span></td>
                      </tr>
                    ))}{risingQ.length === 0 && <tr><td colSpan={3} className="px-4 py-6 text-center text-zinc-400">Henüz veri yok</td></tr>}</tbody>
                  </table></div>
                </div>

                <div className="rounded-xl border border-zinc-200 bg-white">
                  <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
                    <h3 className="text-sm font-bold text-zinc-900">↓ Düşen Sorgular</h3>
                    <span className="text-[10px] text-zinc-400">Son 7 günde ivme kaybeden</span>
                  </div>
                  <div className="overflow-x-auto"><table className="w-full text-[11px]">
                    <thead><tr className="border-b border-zinc-100 text-[10px] uppercase text-zinc-400">
                      <th className="px-4 py-2 text-left font-semibold">Sorgu</th><th className="px-2 py-2 text-right font-semibold">Poz.</th><th className="px-3 py-2 text-right font-semibold">Aksiyon</th>
                    </tr></thead>
                    <tbody>{fallingQ.map((q, i) => (
                      <tr key={i} className="border-b border-zinc-50 transition hover:bg-zinc-50/50">
                        <td className="px-4 py-2.5 font-semibold text-zinc-800">{q.query}</td>
                        <td className="px-2 py-2.5 text-right text-zinc-500">{q.pos}</td>
                        <td className="px-3 py-2.5 text-right"><button className="rounded-lg bg-[#E73932] px-2.5 py-1 text-[10px] font-bold text-white hover:bg-[#D32F2F]">{q.action || "AI Yaz"}</button></td>
                      </tr>
                    ))}{fallingQ.length === 0 && <tr><td colSpan={3} className="px-4 py-6 text-center text-zinc-400">Henüz veri yok</td></tr>}</tbody>
                  </table></div>
                </div>
          </div>

        </>
      )}

      {/* Veri yoksa sync CTA — hem genel bakışta hem tüm tab'larda görünür */}
      {!loading && !overview && connected && projects.length > 0 && activeSubTab === "genel" && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-2xl">📊</div>
          <h2 className="text-lg font-bold text-zinc-800">Veriler Henüz Senkronize Edilmedi</h2>
          <p className="mt-2 max-w-md text-sm text-zinc-500">
            GSC verilerini çekmek için &ldquo;Verileri Tara&rdquo; butonuna tıklayın. Her tıklamada en güncel veriler çekilir.
          </p>
          <button onClick={handleSync} disabled={syncing}
            className="mt-4 rounded-xl bg-[#E73932] px-6 py-3 text-sm font-bold text-white shadow-lg disabled:opacity-50 transition hover:bg-[#D32F2F]">
            {syncing ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                GSC verileri çekiliyor...
              </span>
            ) : "↻ Verileri Tara"}
          </button>
          {syncing && (
            <p className="mt-3 text-xs text-zinc-400">Bu işlem 10-30 saniye sürebilir, lütfen bekleyin...</p>
          )}
        </div>
      )}
      </>
      )}
    </div>
  );
}
