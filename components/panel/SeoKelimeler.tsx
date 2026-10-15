"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api";

/* ═══════════════════════════════════════════
   SEO KELİMELER SAYFASI — Keyword Intelligence
   Görsele birebir uyumlu tasarım
   ═══════════════════════════════════════════ */

interface SegmentMetrics {
  keyword_count: number;
  avg_position: number;
  avg_ctr: number;
  total_impressions: number;
}

interface RisingCommercial {
  keyword: string;
  intent_label: string;
  current_position: number;
  search_increase_pct: number;
  volume: number;
}

interface KeywordMapRow {
  id: number;
  keyword: string;
  segment: string;
  intent: string;
  intent_label: string;
  current_position: number;
  volume: number;
  difficulty: string;
  ctr: number;
  potential: string;
}

interface Dashboard {
  brand_metrics: SegmentMetrics;
  non_brand_metrics: SegmentMetrics;
  intent_counts: { transactional_count: number; informational_count: number; navigational_count: number };
  rising_commercial_keywords: RisingCommercial[];
  ai_summary: string;
  total_keywords: number;
  all_keywords: KeywordMapRow[];
}

interface Props {
  activeProjectId: number | null;
}

const MAP_FILTERS = ["Tümü", "Brand", "Non-Brand", "Ticari", "Fırsat"];

export default function SeoKelimeler({ activeProjectId }: Props) {
  const { activeCompany } = useAuth();
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [mapFilter, setMapFilter] = useState("Tümü");

  const cid = activeCompany?.id;

  const fetchData = useCallback(() => {
    if (!activeProjectId || !cid) return;
    setLoading(true);
    api.get(`/api/seo/keywords/dashboard?projectId=${activeProjectId}&company_id=${cid}`)
      .then(({ data: d }) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [activeProjectId, cid]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-zinc-200 border-t-brand" />
        <span className="ml-3 text-sm text-zinc-500">Kelime analizi yükleniyor...</span>
      </div>
    );
  }

  // Senkronizasyon tetikle
  const handleSync = async () => {
    if (!activeProjectId || !cid) return;
    setSyncing(true);
    try {
      await api.get(`/api/seo/rankings/sync?projectId=${activeProjectId}&company_id=${cid}`);
      fetchData();
    } catch (e) { console.error("Rankings sync hatası:", e); }
    finally { setSyncing(false); }
  };

  if (!data || data.total_keywords === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-2xl">🔑</div>
        <h2 className="text-lg font-bold text-zinc-800">Kelime Verisi Henüz Yok</h2>
        <p className="mt-2 max-w-md text-sm text-zinc-500">
          GSC&apos;den anahtar kelime verilerini çekerek intent analizi, brand/non-brand dağılımı ve ticari kelime tespiti yapılacak.
        </p>
        <button onClick={handleSync} disabled={syncing}
          className="mt-4 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white shadow-lg disabled:opacity-50 transition hover:bg-brand-dark">
          {syncing ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Kelimeler çekiliyor...
            </span>
          ) : "🔑 Kelime Verilerini Çek"}
        </button>
        {syncing && (
          <p className="mt-3 text-xs text-zinc-400">
            GSC&apos;den son 28 günün keyword verileri çekiliyor, bu 15-30 saniye sürebilir...
          </p>
        )}
      </div>
    );
  }

  const brand = data.brand_metrics;
  const nb = data.non_brand_metrics;
  const intent = data.intent_counts;
  const rising = data.rising_commercial_keywords || [];
  const allKws = data.all_keywords || [];

  // Kelime haritası filtresi
  const filteredMap = allKws.filter(kw => {
    if (mapFilter === "Tümü") return true;
    if (mapFilter === "Brand") return kw.segment === "Brand";
    if (mapFilter === "Non-Brand") return kw.segment !== "Brand";
    if (mapFilter === "Ticari") return kw.intent === "transactional" || kw.intent === "commercial";
    if (mapFilter === "Fırsat") return kw.current_position > 10;
    return true;
  });

  return (
    <div className="space-y-5">
      {/* ════════════════════════════════════════
          AI BANNER
          ════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#2A1215] via-[#1F1F1F] to-[#1A1A1A] px-4 py-4 sm:px-6 sm:py-5 text-white">
        <div className="absolute left-0 top-0 h-full w-1 bg-brand" />
        <div className="flex items-start gap-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-base">🤖</div>
          <div className="flex-1">
            <h3 className="text-sm font-bold">{data.total_keywords} kelime takip ediliyor · Intent analizi tamamlandı</h3>
            {data.ai_summary ? (
              <p className="mt-2 text-[12px] leading-5 text-zinc-300" dangerouslySetInnerHTML={{ __html: formatAISummary(data.ai_summary) }} />
            ) : (
              <p className="mt-2 flex items-center gap-2 text-[12px] leading-5 text-zinc-400">
                <span className="h-3 w-3 animate-spin rounded-full border border-zinc-500 border-t-white" />
                AI içgörü analizi yapılıyor... Sayfayı birkaç saniye sonra yenileyin.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          BRAND / NON-BRAND — İki kartlı hero (tasarıma birebir)
          ════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Brand */}
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <div className="px-4 pt-4 pb-3 sm:px-5 sm:pt-5">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm bg-[#7C3AED]" />
              <h3 className="text-sm font-bold text-zinc-900">Marka Kelimeleri (Brand)</h3>
              <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[9px] font-bold text-purple-700">{brand.keyword_count} kelime</span>
            </div>
            <p className="mt-1.5 text-[10px] text-zinc-400 leading-relaxed">
              Marka adınız veya logonuzu içeren aramalar. Bunlar zaten sizi arayan kişiler — sıralamalar çok yüksek olmalı.
            </p>
          </div>

          <div className="mx-4 sm:mx-5 mb-3 grid grid-cols-3 gap-1.5 sm:gap-2">
            <div className="rounded-xl bg-gradient-to-b from-purple-50 to-purple-100/50 px-2 py-2 sm:px-3 sm:py-3 text-center">
              <p className="text-lg sm:text-xl font-black text-emerald-600">{brand.avg_position || 0}</p>
              <p className="mt-0.5 text-[9px] font-medium text-zinc-500">Ort. Sıra</p>
            </div>
            <div className="rounded-xl bg-gradient-to-b from-purple-50 to-purple-100/50 px-2 py-2 sm:px-3 sm:py-3 text-center">
              <p className="text-lg sm:text-xl font-black text-[#7C3AED]">%{brand.avg_ctr}</p>
              <p className="mt-0.5 text-[9px] font-medium text-zinc-500">Tıklanma</p>
            </div>
            <div className="rounded-xl bg-gradient-to-b from-purple-50 to-purple-100/50 px-2 py-2 sm:px-3 sm:py-3 text-center">
              <p className="text-lg sm:text-xl font-black text-zinc-700">{fmtK(brand.total_impressions)}</p>
              <p className="mt-0.5 text-[9px] font-medium text-zinc-500">Gösterim</p>
            </div>
          </div>

          <div className={`mx-4 sm:mx-5 mb-4 sm:mb-5 rounded-lg px-3 py-2 ${brand.avg_position > 0 && brand.avg_position <= 5 ? "bg-emerald-50" : "bg-amber-50"}`}>
            <p className={`text-[10px] font-semibold ${brand.avg_position > 0 && brand.avg_position <= 5 ? "text-emerald-700" : "text-amber-700"}`}>
              {brand.avg_position > 0 && brand.avg_position <= 5
                ? `✓ Marka kelimeleri ort. ${brand.avg_position}. sırada — sektör ortalamalarının üstünde`
                : brand.keyword_count === 0
                  ? "— Henüz marka kelimesi tespit edilmedi"
                  : `⚠ Marka kelimeleri ort. ${brand.avg_position}. sırada — iyileştirme gerekli`
              }
            </p>
          </div>
        </div>

        {/* Non-Brand */}
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <div className="px-4 pt-4 pb-3 sm:px-5 sm:pt-5">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm bg-zinc-900" />
              <h3 className="text-sm font-bold text-zinc-900">Genel Kelimeler (Non-Brand)</h3>
              <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[9px] font-bold text-zinc-600">{nb.keyword_count} kelime</span>
            </div>
            <p className="mt-1.5 text-[10px] text-zinc-400 leading-relaxed">
              Marka adı olmayan aramalar{(() => {
                const topNB = allKws.filter(k => k.segment !== "Brand").sort((a, b) => b.volume - a.volume).slice(0, 2);
                return topNB.length > 0 ? ` — "${topNB.map(k => k.keyword).join('", "')}" gibi` : "";
              })()} . Yeni müşteri kazanmanın yolu bunlar.
            </p>
          </div>

          <div className="mx-4 sm:mx-5 mb-3 grid grid-cols-3 gap-1.5 sm:gap-2">
            <div className="rounded-xl bg-gradient-to-b from-orange-50 to-orange-100/50 px-2 py-2 sm:px-3 sm:py-3 text-center">
              <p className="text-lg sm:text-xl font-black text-orange-500">{nb.avg_position || 0}</p>
              <p className="mt-0.5 text-[9px] font-medium text-zinc-500">Ort. Sıra</p>
            </div>
            <div className="rounded-xl bg-gradient-to-b from-blue-50 to-blue-100/50 px-2 py-2 sm:px-3 sm:py-3 text-center">
              <p className="text-lg sm:text-xl font-black text-blue-600">%{nb.avg_ctr}</p>
              <p className="mt-0.5 text-[9px] font-medium text-zinc-500">Tıklanma</p>
            </div>
            <div className="rounded-xl bg-gradient-to-b from-emerald-50 to-emerald-100/50 px-2 py-2 sm:px-3 sm:py-3 text-center">
              <p className="text-lg sm:text-xl font-black text-zinc-700">{fmtK(nb.total_impressions)}</p>
              <p className="mt-0.5 text-[9px] font-medium text-zinc-500">Gösterim</p>
            </div>
          </div>

          {(() => {
            const beyondPage1 = allKws.filter(k => k.segment !== "Brand" && k.current_position > 10).length;
            return (
              <div className={`mx-5 mb-5 rounded-lg px-3 py-2 ${beyondPage1 > 0 ? "bg-amber-50" : "bg-emerald-50"}`}>
                <p className={`text-[10px] font-semibold ${beyondPage1 > 0 ? "text-amber-700" : "text-emerald-700"}`}>
                  {beyondPage1 > 0
                    ? `⚠ ${beyondPage1} kelime hâlâ 2. sayfa ve sonrasında — içerik güncellenmesi şart`
                    : nb.keyword_count > 0
                      ? "✓ Tüm non-brand kelimeler ilk sayfada"
                      : "— Henüz non-brand kelime verisi yok"
                  }
                </p>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ════════════════════════════════════════
          INTENT ANALİZİ + YÜKSELİŞTEKİ TİCARİ KELİMELER (tasarıma birebir)
          ════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* SOL: Arama Niyeti Analizi */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
          <h3 className="text-[15px] font-bold text-zinc-900">Arama Niyeti Analizi</h3>
          <p className="mt-0.5 text-[11px] text-zinc-400">Kullanıcı ne yapmak istiyor?</p>

          <div className="mt-5 space-y-3">
            {/* Transactional — Satın almak istiyor (yeşil/emerald tema) */}
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">🛒</span>
                  <span className="text-[13px] font-bold text-zinc-900">Satın almak istiyor</span>
                </div>
                <span className="text-lg font-black text-emerald-700">{intent.transactional_count} Kelime</span>
              </div>
              {/* Progress bar */}
              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-emerald-200/60">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${data.total_keywords > 0 ? Math.round((intent.transactional_count / data.total_keywords) * 100) : 0}%` }} />
              </div>
              {/* Örnek kelimeler — veritabanından dinamik */}
              <p className="mt-2 text-[10px] text-zinc-500">
                {allKws.filter(k => k.intent === "transactional").sort((a, b) => b.volume - a.volume).slice(0, 2).map(k => `"${k.keyword}"`).join(", ")}
              </p>
            </div>

            {/* Informational — Araştırıyor (mavi tema) */}
            <div className="rounded-xl border border-zinc-100 bg-white px-4 py-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">🔍</span>
                  <span className="text-[13px] font-bold text-zinc-900">Araştırıyor</span>
                </div>
                <span className="text-lg font-black text-zinc-700">{intent.informational_count} Kelime</span>
              </div>
              {/* Progress bar */}
              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-blue-100">
                <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${data.total_keywords > 0 ? Math.round((intent.informational_count / data.total_keywords) * 100) : 0}%` }} />
              </div>
              <p className="mt-2 text-[10px] text-zinc-500">
                {allKws.filter(k => k.intent === "informational").sort((a, b) => b.volume - a.volume).slice(0, 2).map(k => `"${k.keyword}"`).join(", ")}
              </p>
            </div>

            {/* Navigational — Siteye geliyor (mor tema) */}
            <div className="rounded-xl border border-zinc-100 bg-white px-4 py-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">🏠</span>
                  <span className="text-[13px] font-bold text-zinc-900">Siteye geliyor</span>
                </div>
                <span className="text-lg font-black text-emerald-600">{intent.navigational_count} Kelime</span>
              </div>
              {/* Progress bar */}
              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-purple-100">
                <div className="h-full rounded-full bg-[#7C3AED] transition-all" style={{ width: `${data.total_keywords > 0 ? Math.round((intent.navigational_count / data.total_keywords) * 100) : 0}%` }} />
              </div>
              <p className="mt-2 text-[10px] text-zinc-500">
                {allKws.filter(k => k.intent === "navigational").sort((a, b) => b.volume - a.volume).slice(0, 2).map(k => `"${k.keyword}"`).join(", ")}
              </p>
            </div>
          </div>
        </div>

        {/* SAĞ: Yükselişteki Ticari Kelimeler */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">🔥 Yükselişteki Ticari Kelimeler</h3>
              <p className="mt-0.5 text-[10px] text-zinc-400">Bu ay arama hacmi artan satın alma niyetli kelimeler</p>
            </div>
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-700">Fırsat Penceresi</span>
          </div>

          <div className="overflow-x-auto">
          <table className="mt-4 w-full text-[11px] min-w-[500px]">
            <thead>
              <tr className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                <th className="pb-2 text-left">Kelime</th>
                <th className="pb-2 text-left">Niyet</th>
                <th className="pb-2 text-center">Şu Anki Sıra</th>
                <th className="pb-2 text-center">Arama Artışı</th>
                <th className="pb-2 text-center">Hacim</th>
                <th className="pb-2 text-right">Aksiyon</th>
              </tr>
            </thead>
            <tbody>
              {rising.length === 0 && (
                <tr><td colSpan={6} className="py-6 text-center text-zinc-400">Yükselen ticari kelime bulunamadı</td></tr>
              )}
              {rising.slice(0, 5).map((kw, i) => (
                <tr key={i} className="border-t border-zinc-50">
                  <td className="py-2.5 font-bold text-zinc-900">{kw.keyword}</td>
                  <td className="py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold ${
                      kw.intent_label === "Satın Al" ? "bg-red-100 text-red-700" :
                      kw.intent_label === "Fiyat" ? "bg-amber-100 text-amber-700" :
                      "bg-blue-100 text-blue-700"
                    }`}>{kw.intent_label}</span>
                  </td>
                  <td className="py-2.5 text-center">
                    {kw.current_position > 0 ? (
                      <span className={`font-bold ${kw.current_position <= 10 ? "text-emerald-600" : "text-orange-500"}`}>{kw.current_position}</span>
                    ) : (
                      <span className="text-zinc-300">Yok</span>
                    )}
                  </td>
                  <td className="py-2.5 text-center">
                    <span className="font-bold text-emerald-600">↑%{kw.search_increase_pct} bu ay</span>
                  </td>
                  <td className="py-2.5 text-center text-zinc-600">{fmtK(kw.volume)}</td>
                  <td className="py-2.5 text-right">
                    <button className="rounded-lg bg-brand px-2.5 py-1 text-[9px] font-bold text-white shadow-sm">
                      {kw.current_position > 0 ? "İçerik Üret" : "İçerik Yaz"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          KELİME HARİTASI — Full tablo
          ════════════════════════════════════════ */}
      <div className="rounded-2xl border border-zinc-200 bg-white">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-100 px-4 py-3 sm:px-5 sm:py-4">
          <h3 className="text-sm font-bold text-zinc-900">Kelime Haritası</h3>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-zinc-200 p-0.5">
              {MAP_FILTERS.map(f => (
                <button key={f} onClick={() => setMapFilter(f)}
                  className={`rounded-md px-2.5 py-1 text-[10px] font-bold transition ${
                    mapFilter === f ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-700"
                  }`}>{f}</button>
              ))}
            </div>
            <button className="rounded-lg bg-brand px-3 py-1.5 text-[10px] font-bold text-white shadow-sm">+ İçerik Üret</button>
          </div>
        </div>

        <div className="overflow-x-auto">
        <table className="w-full text-[11px] min-w-[700px]">
          <thead>
            <tr className="border-b border-zinc-100 text-[9px] font-bold uppercase tracking-wider text-zinc-400">
              <th className="px-5 py-3 text-left">Kelime</th>
              <th className="px-3 py-3 text-left">Segment</th>
              <th className="px-3 py-3 text-left">Niyet</th>
              <th className="px-3 py-3 text-center">Sıra</th>
              <th className="px-3 py-3 text-center">Hacim</th>
              <th className="px-3 py-3 text-center">Zorluk</th>
              <th className="px-3 py-3 text-center">Tıklanma</th>
              <th className="px-3 py-3 text-center">Potansiyel</th>
              <th className="px-3 py-3 text-right">Aksiyon</th>
            </tr>
          </thead>
          <tbody>
            {filteredMap.slice(0, 20).map(kw => (
              <tr key={kw.id} className="border-b border-zinc-50 transition hover:bg-zinc-50/50">
                <td className="px-5 py-3 font-bold text-zinc-900">{kw.keyword}</td>
                <td className="px-3 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold ${
                    kw.segment === "Brand" ? "bg-purple-100 text-purple-700" : "bg-zinc-100 text-zinc-600"
                  }`}>{kw.segment}</span>
                </td>
                <td className="px-3 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold ${
                    kw.intent_label === "Satın Al" ? "bg-red-100 text-red-700" :
                    kw.intent_label === "Siteye Gel" ? "bg-purple-100 text-purple-700" :
                    "bg-blue-100 text-blue-700"
                  }`}>{kw.intent_label}</span>
                </td>
                <td className="px-3 py-3 text-center">
                  <span className={`font-bold ${kw.current_position <= 3 ? "text-emerald-600" : kw.current_position <= 10 ? "text-blue-600" : kw.current_position <= 20 ? "text-orange-500" : "text-red-500"}`}>
                    {kw.current_position}
                  </span>
                </td>
                <td className="px-3 py-3 text-center text-zinc-600">{fmtK(kw.volume)}</td>
                <td className="px-3 py-3 text-center text-amber-500">{kw.difficulty}</td>
                <td className="px-3 py-3 text-center text-zinc-600">%{kw.ctr}</td>
                <td className="px-3 py-3 text-center">
                  <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold ${
                    kw.potential === "Çok Yüksek" ? "bg-red-100 text-red-700" :
                    kw.potential === "Yüksek" ? "bg-orange-100 text-orange-700" :
                    kw.potential === "Fırsat" ? "bg-amber-100 text-amber-700" :
                    "bg-zinc-100 text-zinc-600"
                  }`}>{kw.potential}</span>
                </td>
                <td className="px-3 py-3 text-right">
                  {kw.potential === "Çok Yüksek" || kw.potential === "Fırsat" ? (
                    <button className="rounded-lg bg-brand px-2.5 py-1 text-[9px] font-bold text-white shadow-sm">AI Yaz</button>
                  ) : (
                    <button className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[9px] font-bold text-zinc-600 shadow-sm">Optimize</button>
                  )}
                </td>
              </tr>
            ))}
            {filteredMap.length === 0 && (
              <tr><td colSpan={9} className="px-5 py-8 text-center text-zinc-400">Bu filtrede kelime yok</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   YARDIMCI FONKSİYONLAR
   ═══════════════════════════════════════════ */

function fmtK(n: number) {
  if (!n) return "0";
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(Math.round(n));
}

function formatAISummary(text: string): string {
  if (!text) return "";
  // Bold keywords between ** markers and highlight numbers
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
    .replace(/([\d]+[\d,.]*K?\s*kelime)/g, '<strong class="text-white">$1</strong>')
    .replace(/(\+[\d,.]+[KM]?\s*tık\/ay)/g, '<strong class="text-orange-300">$1</strong>');
}
