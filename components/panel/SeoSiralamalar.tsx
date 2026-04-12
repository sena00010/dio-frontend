"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api";

/* ═══════════════════════════════════════════
   SEO SIRALAMALAR SAYFASI — Gerçek Veri
   ═══════════════════════════════════════════ */

/* ─── ALT SEKMELER ─── */
const RANKING_TABS = [
  { key: "all", label: "Tüm Kelimeler", icon: "📋" },
  { key: "rising", label: "Yükselen", icon: "↑" },
  { key: "falling", label: "Düşen", icon: "↓" },
  { key: "commercial", label: "Ticari Kelimeler", icon: "🛒" },
  { key: "near_first", label: "İlk Sayfaya Yakın", icon: "🎯" },
];

const RANK_FILTERS = ["Tümü", "1-3", "4-10", "11-20", "20+"];

interface RankedKeyword {
  id: number;
  keyword: string;
  segment: string;
  intent: string;
  current_position: number;
  change_28d: number;
  impressions: number;
  clicks: number;
  ctr: number;
  trend_7d: number[];
  trend_direction: string;
  estimated_increase: string;
}

interface Summary {
  top_3: number;
  top_10: number;
  top_20: number;
  beyond_20: number;
  total: number;
}

interface Props {
  activeProjectId: number | null;
}

export default function SeoSiralamalar({ activeProjectId }: Props) {
  const { activeCompany } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [rankFilter, setRankFilter] = useState("Tümü");
  const [keywords, setKeywords] = useState<RankedKeyword[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const cid = activeCompany?.id;

  // Veri çek
  const fetchData = useCallback(() => {
    if (!activeProjectId || !cid) return;
    setLoading(true);
    Promise.all([
      api.get(`/api/seo/rankings/list?projectId=${activeProjectId}&company_id=${cid}`),
      api.get(`/api/seo/rankings/summary?projectId=${activeProjectId}&company_id=${cid}`),
    ]).then(([listRes, summaryRes]) => {
      setKeywords(listRes.data.keywords || []);
      setSummary(summaryRes.data);
    }).catch(() => {
      setKeywords([]);
      setSummary(null);
    }).finally(() => setLoading(false));
  }, [activeProjectId, cid]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Sync tetikle
  const handleSync = async () => {
    if (!activeProjectId || !cid) return;
    setSyncing(true);
    try {
      await api.get(`/api/seo/rankings/sync?projectId=${activeProjectId}&company_id=${cid}`);
      fetchData();
    } catch (e) { console.error("Rankings sync hatası:", e); }
    finally { setSyncing(false); }
  };

  // Filtreleme
  const filterByRank = (kw: RankedKeyword) => {
    if (rankFilter === "Tümü") return true;
    if (rankFilter === "1-3") return kw.current_position <= 3;
    if (rankFilter === "4-10") return kw.current_position > 3 && kw.current_position <= 10;
    if (rankFilter === "11-20") return kw.current_position > 10 && kw.current_position <= 20;
    if (rankFilter === "20+") return kw.current_position > 20;
    return true;
  };

  const allFiltered = keywords.filter(filterByRank);
  const rising = keywords.filter(kw => kw.change_28d > 3).sort((a, b) => b.change_28d - a.change_28d);
  const falling = keywords.filter(kw => kw.change_28d < -3).sort((a, b) => a.change_28d - b.change_28d);
  const commercial = keywords.filter(kw => kw.intent === "commercial");
  const nearFirst = keywords.filter(kw => kw.current_position >= 11 && kw.current_position <= 20);

  // Badge sayıları
  const risingCount = rising.length;
  const fallingCount = falling.length;

  // Boş state
  if (!loading && keywords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-2xl">📈</div>
        <h2 className="text-lg font-bold text-zinc-800">Sıralama Verileri Henüz Yok</h2>
        <p className="mt-2 max-w-md text-sm text-zinc-500">
          GSC&apos;den keyword sıralama verilerini çekmek için senkronizasyon başlatın.
        </p>
        <button onClick={handleSync} disabled={syncing}
          className="mt-4 rounded-xl bg-[#E73932] px-6 py-3 text-sm font-bold text-white shadow-lg disabled:opacity-50 transition hover:bg-[#D32F2F]">
          {syncing ? "Senkronize ediliyor..." : "📊 Sıralama Verilerini Çek"}
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-zinc-200 border-t-[#E73932]" />
        <span className="ml-3 text-sm text-zinc-500">Sıralamalar yükleniyor...</span>
      </div>
    );
  }

  const s = summary || { top_3: 0, top_10: 0, top_20: 0, beyond_20: 0, total: 0 };

  return (
    <div className="space-y-5">
      {/* ════════════════════════════════════════
          AI BANNER
          ════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#2A1215] via-[#1F1F1F] to-[#1A1A1A] px-6 py-5 text-white">
        <div className="absolute left-0 top-0 h-full w-1 bg-[#E73932]" />
        <div className="flex items-start gap-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-base">🤖</div>
          <div className="flex-1">
            <h3 className="text-sm font-bold">Bu ay güzel bir ivme var</h3>
            <p className="mt-2 text-[12px] leading-5 text-zinc-300">
              {s.top_3} kelime ilk 3&apos;te, {s.top_10} kelime ilk sayfada. Ama <strong className="text-white">{s.beyond_20} kelime hâlâ 2. sayfa ve sonrasında</strong> — bunları ilk sayfaya taşımak tek başına +1.2K tık/ay sağlayabilir. &quot;Yükselen&quot; sekmesinde bakılması gereken {risingCount} kelime var.
            </p>
          </div>
          <button onClick={handleSync} disabled={syncing}
            className="shrink-0 rounded-lg bg-white/10 px-3 py-1.5 text-[10px] font-bold text-white transition hover:bg-white/20 disabled:opacity-50">
            {syncing ? "⏳ Çalışıyor..." : "↻ Yenile"}
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════
          ÖZET KARTLARI (4'lü sıra grubu)
          ════════════════════════════════════════ */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { value: s.top_3, label: "1–3. sıra", sub: "İlk 3 — En İyi", border: "border-emerald-300", text: "text-emerald-600", bg: "bg-emerald-50" },
          { value: s.top_10, label: "4–10. sıra", sub: "İlk sayfa ✓", border: "border-blue-300", text: "text-blue-600", bg: "bg-blue-50" },
          { value: s.top_20, label: "11–20. sıra", sub: "2. sayfa — yakın", border: "border-orange-300", text: "text-orange-600", bg: "bg-orange-50" },
          { value: s.beyond_20, label: "20+ sıra", sub: "3. sayfa+ — fırsat", border: "border-red-300", text: "text-red-600", bg: "bg-red-50" },
        ].map((card, i) => (
          <div key={i} className={`rounded-2xl border-2 ${card.border} ${card.bg} px-5 py-4 text-center`}>
            <p className={`text-3xl font-black ${card.text}`}>{card.value}</p>
            <p className={`mt-0.5 text-[13px] font-bold ${card.text} opacity-80`}>{card.label}</p>
            <p className="mt-1 text-[10px] font-semibold text-zinc-400">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* ════════════════════════════════════════
          ALT SEKMELER
          ════════════════════════════════════════ */}
      <div className="flex items-center gap-0 border-b border-zinc-200">
        {RANKING_TABS.map(tab => {
          const badge = tab.key === "rising" ? risingCount : tab.key === "falling" ? fallingCount : 0;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`relative flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-semibold transition ${
                activeTab === tab.key ? "border-b-2 border-[#E73932] text-[#E73932]" : "text-zinc-500 hover:text-zinc-700"
              }`}>
              <span>{tab.icon}</span> {tab.label}
              {badge > 0 && (
                <span className="ml-0.5 rounded-full bg-zinc-100 px-1.5 py-[1px] text-[9px] font-bold text-zinc-500">{badge}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ════════════════════════════════════════
          TAB İÇERİKLERİ
          ════════════════════════════════════════ */}

      {/* ── TÜM KELİMELER ── */}
      {activeTab === "all" && (
        <div className="rounded-2xl border border-zinc-200 bg-white">
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Tüm Sıralamalar</h3>
              <p className="text-[10px] text-zinc-400">{s.total} kelime takip ediliyor · Günlük güncelleme</p>
            </div>
            <div className="flex rounded-lg border border-zinc-200 p-0.5">
              {RANK_FILTERS.map(f => (
                <button key={f} onClick={() => setRankFilter(f)}
                  className={`rounded-md px-2.5 py-1 text-[10px] font-bold transition ${
                    rankFilter === f ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-700"
                  }`}>{f}</button>
              ))}
            </div>
          </div>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-zinc-100 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                <th className="px-5 py-3 text-left">Kelime</th>
                <th className="px-4 py-3 text-left">Segment</th>
                <th className="px-4 py-3 text-center">Sıra</th>
                <th className="px-4 py-3 text-center">28G Değişim</th>
                <th className="px-4 py-3 text-center">Görüntülenme</th>
                <th className="px-4 py-3 text-center">Tıklanma</th>
                <th className="px-4 py-3 text-center">7G Trend</th>
                <th className="px-4 py-3 text-right">Aksiyon</th>
              </tr>
            </thead>
            <tbody>
              {allFiltered.map(kw => (
                <tr key={kw.id} className="border-b border-zinc-50 transition hover:bg-zinc-50/50">
                  <td className="px-5 py-3.5 font-bold text-zinc-900">{kw.keyword}</td>
                  <td className="px-4 py-3.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold ${
                      kw.segment === "Brand" ? "bg-purple-100 text-purple-700" : "bg-zinc-100 text-zinc-600"
                    }`}>{kw.segment}</span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`font-bold ${posColor(kw.current_position)}`}>{kw.current_position}</span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <ChangeCell value={kw.change_28d} />
                  </td>
                  <td className="px-4 py-3.5 text-center text-zinc-600">{fmtK(kw.impressions)}</td>
                  <td className="px-4 py-3.5 text-center text-zinc-600">%{kw.ctr}</td>
                  <td className="px-4 py-3.5 text-center">
                    <TrendMini data={kw.trend_7d} direction={kw.trend_direction} />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <ActionBtn kw={kw} />
                  </td>
                </tr>
              ))}
              {allFiltered.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-8 text-center text-zinc-400">Bu aralıkta kelime yok</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── YÜKSELEN ── */}
      {activeTab === "rising" && (
        <div className="rounded-2xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 px-5 py-4">
            <h3 className="text-sm font-bold text-zinc-900">↑ Yükselen Kelimeler</h3>
            <p className="text-[10px] text-zinc-400">Son 28 günde en fazla sıra kazanan</p>
          </div>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-zinc-100 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                <th className="px-5 py-3 text-left">Kelime</th>
                <th className="px-4 py-3 text-center">Şu An</th>
                <th className="px-4 py-3 text-center">28G Önce</th>
                <th className="px-4 py-3 text-center">Değişim</th>
                <th className="px-4 py-3 text-center">Görüntülenme</th>
                <th className="px-4 py-3 text-right">Aksiyon</th>
              </tr>
            </thead>
            <tbody>
              {rising.map(kw => (
                <tr key={kw.id} className="border-b border-zinc-50 transition hover:bg-zinc-50/50">
                  <td className="px-5 py-3.5">
                    <span className="font-bold text-zinc-900">{kw.keyword}</span>
                    {kw.change_28d > 30 && <span className="ml-2 rounded bg-red-100 px-1.5 py-[1px] text-[8px] font-bold text-red-600">TREND</span>}
                  </td>
                  <td className="px-4 py-3.5 text-center font-bold text-emerald-600">{kw.current_position}</td>
                  <td className="px-4 py-3.5 text-center text-zinc-400">{(kw.current_position + kw.change_28d).toFixed(1)}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="font-bold text-emerald-600">↑{kw.change_28d} sıra</span>
                  </td>
                  <td className="px-4 py-3.5 text-center text-zinc-600">{fmtK(kw.impressions)}</td>
                  <td className="px-4 py-3.5 text-right"><ActionBtn kw={kw} /></td>
                </tr>
              ))}
              {rising.length === 0 && <tr><td colSpan={6} className="px-5 py-8 text-center text-zinc-400">Yükselen kelime bulunamadı</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* ── DÜŞEN ── */}
      {activeTab === "falling" && (
        <div className="rounded-2xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 px-5 py-4">
            <h3 className="text-sm font-bold text-zinc-900">↓ Düşen Kelimeler</h3>
            <p className="text-[10px] text-zinc-400">Son 28 günde en fazla sıra kaybeden — acil önlem al</p>
          </div>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-zinc-100 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                <th className="px-5 py-3 text-left">Kelime</th>
                <th className="px-4 py-3 text-center">Şu An</th>
                <th className="px-4 py-3 text-center">28G Önce</th>
                <th className="px-4 py-3 text-center">Kayıp</th>
                <th className="px-4 py-3 text-center">Görüntülenme</th>
                <th className="px-4 py-3 text-right">Aksiyon</th>
              </tr>
            </thead>
            <tbody>
              {falling.map((kw, i) => (
                <tr key={kw.id} className={`border-b border-zinc-50 transition hover:bg-zinc-50/50 ${i === 0 ? "bg-red-50/40" : ""}`}>
                  <td className="px-5 py-3.5 font-bold text-zinc-900">{kw.keyword}</td>
                  <td className="px-4 py-3.5 text-center font-bold text-red-500">{kw.current_position}</td>
                  <td className="px-4 py-3.5 text-center text-zinc-400">{(kw.current_position + kw.change_28d).toFixed(1)}</td>
                  <td className="px-4 py-3.5 text-center"><span className="font-bold text-red-500">↓{Math.abs(kw.change_28d)} sıra</span></td>
                  <td className="px-4 py-3.5 text-center text-zinc-600">{fmtK(kw.impressions)}</td>
                  <td className="px-4 py-3.5 text-right"><ActionBtn kw={kw} /></td>
                </tr>
              ))}
              {falling.length === 0 && <tr><td colSpan={6} className="px-5 py-8 text-center text-zinc-400">Düşen kelime bulunamadı</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* ── TİCARİ KELİMELER ── */}
      {activeTab === "commercial" && (
        <div className="rounded-2xl border border-zinc-200 bg-white">
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">🛒 Ticari Kelimeler</h3>
              <p className="text-[10px] text-zinc-400">Satın alma niyeti yüksek — &quot;al&quot;, &quot;fiyat&quot;, &quot;satın&quot; gibi kelimeler</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5">
              <span className="text-[10px]">💰</span>
              <span className="text-[10px] font-bold text-amber-800">Bu kelimeler doğrudan satışa dönüşür</span>
            </div>
          </div>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-zinc-100 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                <th className="px-5 py-3 text-left">Kelime</th>
                <th className="px-4 py-3 text-center">Sıra</th>
                <th className="px-4 py-3 text-center">Arama Hacmi</th>
                <th className="px-4 py-3 text-center">Tıklanma</th>
                <th className="px-4 py-3 text-center">Ticari Değer</th>
                <th className="px-4 py-3 text-right">Aksiyon</th>
              </tr>
            </thead>
            <tbody>
              {commercial.map(kw => (
                <tr key={kw.id} className="border-b border-zinc-50 transition hover:bg-zinc-50/50">
                  <td className="px-5 py-3.5 font-bold text-zinc-900">{kw.keyword}</td>
                  <td className="px-4 py-3.5 text-center font-bold text-orange-500">{kw.current_position}</td>
                  <td className="px-4 py-3.5 text-center text-zinc-600">{fmtK(kw.impressions)}</td>
                  <td className="px-4 py-3.5 text-center text-zinc-600">%{kw.ctr}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      kw.impressions > 10000 ? "bg-red-100 text-red-700" :
                      kw.impressions > 5000 ? "bg-orange-100 text-orange-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>{kw.impressions > 10000 ? "Çok Yüksek" : kw.impressions > 5000 ? "Yüksek" : "Orta"}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button className="rounded-lg bg-[#E73932] px-3 py-1 text-[10px] font-bold text-white shadow-sm">İçerik Üret</button>
                  </td>
                </tr>
              ))}
              {commercial.length === 0 && <tr><td colSpan={6} className="px-5 py-8 text-center text-zinc-400">Ticari kelime bulunamadı</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* ── İLK SAYFAYA YAKIN ── */}
      {activeTab === "near_first" && (
        <div className="rounded-2xl border border-zinc-200 bg-white">
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">🎯 İlk Sayfaya Yakın</h3>
              <p className="text-[10px] text-zinc-400">11–20. sırada olan kelimeler — küçük çabayla ilk sayfaya taşınabilir</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5">
              <span className="text-[10px]">🚀</span>
              <span className="text-[10px] font-bold text-emerald-800">En hızlı kazanç bu gruptaki kelimelerden gelir</span>
            </div>
          </div>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-zinc-100 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                <th className="px-5 py-3 text-left">Kelime</th>
                <th className="px-4 py-3 text-center">Şu An</th>
                <th className="px-4 py-3 text-center">Görüntülenme</th>
                <th className="px-4 py-3 text-center">Tahmini Artış</th>
                <th className="px-4 py-3 text-right">Aksiyon</th>
              </tr>
            </thead>
            <tbody>
              {nearFirst.map(kw => (
                <tr key={kw.id} className="border-b border-zinc-50 transition hover:bg-zinc-50/50">
                  <td className="px-5 py-3.5 font-bold text-zinc-900">{kw.keyword}</td>
                  <td className="px-4 py-3.5 text-center font-bold text-orange-500">{kw.current_position}</td>
                  <td className="px-4 py-3.5 text-center text-zinc-600">{fmtK(kw.impressions)}</td>
                  <td className="px-4 py-3.5 text-center"><span className="font-bold text-emerald-600">{kw.estimated_increase || "+%0 tık"}</span></td>
                  <td className="px-4 py-3.5 text-right">
                    <button className="rounded-lg bg-[#E73932] px-3 py-1 text-[10px] font-bold text-white shadow-sm">AI Yaz</button>
                  </td>
                </tr>
              ))}
              {nearFirst.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-zinc-400">İlk sayfaya yakın kelime bulunamadı</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   ALT BİLEŞENLER
   ═══════════════════════════════════════════ */

function ChangeCell({ value }: { value: number }) {
  if (value > 0) return <span className="font-bold text-emerald-600">↑{value}</span>;
  if (value < 0) return <span className="font-bold text-red-500">↓{Math.abs(value)}</span>;
  return <span className="text-zinc-300">—</span>;
}

function ActionBtn({ kw }: { kw: RankedKeyword }) {
  if (kw.ctr < 2) return <button className="rounded-lg bg-[#E73932] px-3 py-1 text-[10px] font-bold text-white shadow-sm">AI Yaz</button>;
  if (kw.current_position > 3) return <button className="rounded-lg border border-zinc-200 bg-white px-3 py-1 text-[10px] font-bold text-zinc-600 shadow-sm">Optimize</button>;
  return <span className="text-zinc-300">—</span>;
}

function TrendMini({ data, direction }: { data: number[]; direction: string }) {
  if (!data || data.length < 2) {
    return <span className="text-zinc-300">—</span>;
  }

  const minV = Math.min(...data);
  const maxV = Math.max(...data);
  const range = maxV - minV || 1;

  // Pozisyon: düşük = iyi, bu yüzden y'yi ters çeviriyoruz
  const points = data.map((v, i) => {
    const x = 2 + (i / (data.length - 1)) * 44;
    const y = 2 + ((v - minV) / range) * 16;
    return `${x},${y}`;
  }).join(" L");

  const color = direction === "up" ? "#22C55E" : direction === "down" ? "#EF4444" : "#F59E0B";

  return (
    <svg width="48" height="20" viewBox="0 0 48 20" className="inline-block">
      <path d={`M${points}`} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function posColor(pos: number) {
  if (pos <= 3) return "text-emerald-600";
  if (pos <= 10) return "text-blue-600";
  if (pos <= 20) return "text-orange-500";
  return "text-red-500";
}

function fmtK(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(Math.round(n));
}
