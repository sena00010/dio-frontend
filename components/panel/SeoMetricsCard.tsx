"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

// ═══════════════════════════════════════════════════
// SeoMetricsCard — Dashboard SEO Kartı
// GSC verilerinden gerçek Organik Trafik, Anahtar Kelime, İlk Sayfa
// Modern SaaS tasarımı — Tailwind CSS
// ═══════════════════════════════════════════════════

interface SEOMetricItem {
  value: number;
  trend: number;
  is_positive: boolean;
}

interface SEOSummary {
  organic_traffic: SEOMetricItem;
  total_keywords: SEOMetricItem;
  first_page_keywords: SEOMetricItem;
  period_label: string;
  period_start: string;
  period_end: string;
  has_data: boolean;
  active_site_url: string;
  available_sites: { site_url: string; display_name: string }[];
}

export default function SeoMetricsCard() {
  const { activeCompany } = useAuth();
  const [data, setData] = useState<SEOSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeSite, setActiveSite] = useState("");

  const fetchData = (siteUrl?: string) => {
    if (!activeCompany) return;
    setLoading(true);
    const siteParam = siteUrl ? `&site_url=${encodeURIComponent(siteUrl)}` : "";
    api
      .get(`/api/seo/dashboard/summary?company_id=${activeCompany.id}${siteParam}&range=30`)
      .then(({ data: d }) => {
        setData(d);
        if (d.active_site_url) setActiveSite(d.active_site_url);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [activeCompany]);

  const handleSiteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const site = e.target.value;
    setActiveSite(site);
    fetchData(site);
  };

  const handleSync = () => {
    if (!activeCompany || syncing) return;
    setSyncing(true);
    const siteParam = activeSite ? `&site_url=${encodeURIComponent(activeSite)}` : "";
    api
      .post(`/api/seo/dashboard/sync-cache?company_id=${activeCompany.id}${siteParam}`)
      .then(() => fetchData(activeSite))
      .catch(() => {})
      .finally(() => setSyncing(false));
  };

  // ── Sayı formatlama: 45230 → 45.230 ──
  const fmtNumber = (n: number): string => {
    return new Intl.NumberFormat("tr-TR").format(Math.round(n));
  };

  // ── Kart verisi ──
  const metrics = data?.has_data
    ? [
        {
          label: "Organik Trafik",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          ),
          iconBg: "bg-blue-50 text-blue-600",
          ...data.organic_traffic,
        },
        {
          label: "Toplam Anahtar Kelime",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
          ),
          iconBg: "bg-violet-50 text-violet-600",
          ...data.total_keywords,
        },
        {
          label: "İlk Sayfa Kelimeleri",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          iconBg: "bg-emerald-50 text-emerald-600",
          ...data.first_page_keywords,
        },
      ]
    : null;

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-200/60 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="h-5 w-40 rounded-lg bg-zinc-100 animate-pulse" />
          <div className="h-8 w-28 rounded-lg bg-zinc-100 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-5">
              <div className="h-4 w-24 rounded bg-zinc-200 animate-pulse mb-3" />
              <div className="h-8 w-20 rounded bg-zinc-200 animate-pulse mb-2" />
              <div className="h-3 w-16 rounded bg-zinc-200 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Empty state ──
  if (!data?.has_data) {
    return (
      <div className="rounded-2xl border border-zinc-200/60 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100">
            <svg className="w-7 h-7 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-zinc-900 mb-1">SEO Verileri Yükleniyor</h3>
          <p className="text-sm text-zinc-500 mb-4 max-w-xs">
            Google Search Console verileriniz arka planda çekiliyor. Bu işlem ilk seferde birkaç dakika sürebilir.
          </p>
          {data?.available_sites && data.available_sites.length > 0 && (
            <select
              value={activeSite}
              onChange={handleSiteChange}
              className="mb-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-700 outline-none transition-colors hover:bg-zinc-100 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            >
              {data.available_sites.map((s) => (
                <option key={s.site_url} value={s.site_url}>
                  {s.display_name || s.site_url.replace(/^(sc-domain:|https?:\/\/)/, "")}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow-md active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncing ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Çekiliyor...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                GSC Verilerini Çek
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ── Tam kart — 3 metrik ──
  return (
    <div className="rounded-2xl border border-zinc-200/60 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm">
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">SEO Performansı</h3>
            <p className="text-xs text-zinc-400">{data.period_label}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Site Seçici */}
          {data.available_sites && data.available_sites.length > 0 && (
            <select
              value={activeSite}
              onChange={handleSiteChange}
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 outline-none transition-colors hover:bg-zinc-100 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            >
              {data.available_sites.map((s) => (
                <option key={s.site_url} value={s.site_url}>
                  {s.display_name || s.site_url.replace(/^(sc-domain:|https?:\/\/)/, "")}
                </option>
              ))}
            </select>
          )}
          {/* Sync butonu */}
          <button
            onClick={handleSync}
            disabled={syncing}
            title="Verileri güncelle"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-500 transition-all hover:bg-zinc-100 hover:text-zinc-700 active:scale-90 disabled:opacity-40"
          >
            <svg className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 divide-y md:grid-cols-3 md:divide-y-0 md:divide-x divide-zinc-100">
        {metrics!.map((m) => (
          <div key={m.label} className="flex flex-col gap-1 px-6 py-5 transition-colors hover:bg-zinc-50/60">
            <div className="flex items-center gap-2.5 mb-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${m.iconBg}`}>
                {m.icon}
              </div>
              <span className="text-xs font-medium text-zinc-500">{m.label}</span>
            </div>
            <span className="text-2xl font-bold tracking-tight text-zinc-900">
              {fmtNumber(m.value)}
            </span>
            <div className={`inline-flex items-center gap-1 text-xs font-semibold ${m.is_positive ? "text-emerald-600" : "text-rose-500"}`}>
              {/* Trend ok ikonu */}
              {m.is_positive ? (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 17l9.2-9.2M17 17V7H7" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 7l-9.2 9.2M7 7v10h10" />
                </svg>
              )}
              <span>{m.is_positive ? "+" : ""}{m.trend}%</span>
              <span className="text-zinc-400 font-normal ml-0.5">önceki döneme göre</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
