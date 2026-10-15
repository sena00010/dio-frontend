"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api";

/* ═══════════════════════════════════════════
   SEO İÇERİK ÜRETİMİ — Tasarıma Birebir
   ═══════════════════════════════════════════ */

const CONTENT_TABS = [
  { key: "ai", label: "AI İçerik Önerileri" },
  { key: "keywords", label: "Kelimelerden İçerik" },
  { key: "title", label: "Başlıktan İçerik" },
  { key: "manual", label: "Manuel Oluştur" },
];

interface Badge { label: string; color: string }
interface Opportunity {
  title: string;
  badges: Badge[];
  position: number;
  impressions: string;
  ctr: string;
  keywords: string[];
  estimated_clicks: number;
  type: string;
}

interface Props {
  activeProjectId: number | null;
  onNavigateToKreatif?: (topics: string[]) => void;
}

export default function SeoIcerikUretimi({ activeProjectId, onNavigateToKreatif }: Props) {
  const { activeCompany } = useAuth();
  const [activeTab, setActiveTab] = useState("ai");
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState<number | null>(null);
  const [titleInput, setTitleInput] = useState("");
  const [contentType, setContentType] = useState("blog");

  const cid = activeCompany?.id;

  const fetchData = useCallback(() => {
    if (!activeProjectId || !cid) return;
    setLoading(true);
    api.get(`/api/seo/content/opportunities?projectId=${activeProjectId}&company_id=${cid}`)
      .then(({ data: d }) => setOpportunities(d.opportunities || []))
      .catch(() => setOpportunities([]))
      .finally(() => setLoading(false));
  }, [activeProjectId, cid]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalEstimated = opportunities.reduce((sum, o) => sum + o.estimated_clicks, 0);

  /* İçerik Brief üret & Kreatif Stüdyoya git */
  const handleGenerateBrief = async (opp: Opportunity, index: number) => {
    if (!activeProjectId || !cid) return;
    setGenerating(index);
    try {
      await api.post(`/api/seo/content/generate-brief?company_id=${cid}`, {
        project_id: activeProjectId,
        title: opp.title,
        opportunity_type: opp.type,
        target_keywords: opp.keywords,
        position: opp.position,
        impressions: parseFloat(opp.impressions.replace(/[KM]/g, "")) * (opp.impressions.includes("M") ? 1000000 : opp.impressions.includes("K") ? 1000 : 1),
        ctr: parseFloat(opp.ctr.replace("%", "")),
        estimated_clicks: opp.estimated_clicks,
      });

      // Kreatif stüdyoya yönlendir
      if (onNavigateToKreatif) {
        onNavigateToKreatif(opp.keywords);
      }
    } catch (err) {
      console.error("Brief üretim hatası:", err);
    } finally {
      setGenerating(null);
    }
  };

  /* Başlıktan brief üret */
  const handleTitleBrief = async () => {
    if (!titleInput.trim() || !activeProjectId || !cid) return;
    setGenerating(-1);
    try {
      await api.post(`/api/seo/content/generate-brief?company_id=${cid}`, {
        project_id: activeProjectId,
        title: titleInput,
        opportunity_type: contentType,
        target_keywords: titleInput.split(" ").filter(w => w.length > 3),
        position: 0,
        impressions: 0,
        ctr: 0,
        estimated_clicks: 0,
      });
      if (onNavigateToKreatif) {
        onNavigateToKreatif(titleInput.split(" ").filter(w => w.length > 3));
      }
    } catch (err) { console.error(err); }
    finally { setGenerating(null); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-zinc-200 border-t-brand" />
        <span className="ml-3 text-sm text-zinc-500">İçerik fırsatları analiz ediliyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ═══ İÇ SEKMELER ═══ */}
      <div className="flex items-center gap-0 border-b border-zinc-200 overflow-x-auto scrollbar-none">
        {CONTENT_TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`relative whitespace-nowrap px-3 py-2 sm:px-4 sm:py-2.5 text-[11px] sm:text-[12px] font-semibold transition ${
              activeTab === tab.key
                ? "border-b-2 border-brand text-brand"
                : "text-zinc-500 hover:text-zinc-700"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════
          TAB 1: AI İÇERİK ÖNERİLERİ
          ═══════════════════════════════════════════ */}
      {activeTab === "ai" && (
        <>
          {/* AI Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#2A1215] via-[#1F1F1F] to-[#1A1A1A] px-4 py-3 sm:px-6 sm:py-4 text-white">
            <div className="absolute left-0 top-0 h-full w-1 bg-brand" />
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-sm">🤖</div>
              <div className="flex-1">
                <h3 className="text-sm font-bold">
                  GSC&apos;den {opportunities.length} içerik fırsatı — toplam +{totalEstimated} tık/ay
                </h3>
                <p className="mt-1 text-[11px] text-zinc-400">
                  Bu sayfalar yüksek gösterim alıyor ama düşük CTR&apos;den zarar görüyor. Her biri için bir blog yazısı veya ürün içeriği oluşturun.
                </p>
              </div>
            </div>
          </div>

          {/* KARTLAR — 2x2 grid */}
          {opportunities.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {opportunities.map((opp, i) => (
                <div key={i} className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:shadow-lg">
                  {/* Sol kırmızı çizgi */}
                  <div className="absolute left-0 top-0 h-full w-1 rounded-l-2xl bg-brand" />

                  <div className="pl-4 pr-4 pt-3 pb-3 sm:pl-5 sm:pr-5 sm:pt-4 sm:pb-4">
                    {/* Badge'lar */}
                    <div className="flex items-center gap-1.5">
                      {opp.badges.map((b, j) => (
                        <span key={j} className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold ${badgeColor(b.color)}`}>
                          {b.label}
                        </span>
                      ))}
                    </div>

                    {/* Başlık */}
                    <h4 className="mt-2 text-[13px] font-bold text-zinc-900 leading-snug">{opp.title}</h4>

                    {/* Metrikler */}
                    <div className="mt-1.5 flex items-center gap-4 text-[10px] text-zinc-500">
                      <span>Pos: <strong className="text-zinc-700">{opp.position}</strong></span>
                      <span><strong className="text-zinc-700">{opp.impressions}</strong> gösterim</span>
                      <span>CTR: <strong className="text-zinc-700">{opp.ctr}</strong></span>
                    </div>

                    {/* İlgili keyword tag'lar */}
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {opp.keywords.slice(0, 4).map((kw, k) => (
                        <span key={k} className="rounded-md bg-zinc-100 px-2 py-0.5 text-[9px] font-medium text-zinc-600">{kw}</span>
                      ))}
                    </div>

                    {/* Alt bar: AI avatar + fırsat skoru + kreatif oluştur */}
                    <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t border-zinc-100 pt-3">
                      <div className="flex items-center gap-2">
                        <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold text-white ${avatarGradient(i)}`}>AI</div>
                        <span className="text-[10px] font-semibold text-zinc-400">Fırsat skoru</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-emerald-600">+{opp.estimated_clicks} tık/ay</span>
                        <button
                          onClick={() => handleGenerateBrief(opp, i)}
                          disabled={generating === i}
                          className="rounded-lg bg-brand px-3 py-1.5 text-[9px] font-bold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-50">
                          {generating === i ? (
                            <span className="flex items-center gap-1.5">
                              <span className="h-3 w-3 animate-spin rounded-full border border-white/30 border-t-white" />
                              Üretiliyor...
                            </span>
                          ) : "Kreatif Oluştur →"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════
          TAB 2: KELİMELERDEN İÇERİK
          ═══════════════════════════════════════════ */}
      {activeTab === "keywords" && (
        <div className="rounded-2xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-base">🔑</div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Kelimelerden İçerik Üret</h3>
                <p className="text-[10px] text-zinc-400">SEO veritabanınızdaki kelimelerden otomatik blog/sayfa içeriği oluşturun</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 sm:p-5">
            {opportunities.slice(0, 6).map((opp, i) => (
              <div key={i} className="group relative cursor-pointer overflow-hidden rounded-xl border border-zinc-100 p-4 transition hover:border-brand hover:shadow-md">
                <div className="absolute left-0 top-0 h-full w-0.5 bg-zinc-200 transition group-hover:bg-brand" />
                <div className="flex items-center gap-2 mb-2">
                  {opp.badges.slice(0, 1).map((b, j) => (
                    <span key={j} className={`rounded-full px-2 py-0.5 text-[8px] font-bold ${badgeColor(b.color)}`}>{b.label}</span>
                  ))}
                </div>
                <p className="text-xs font-bold text-zinc-900 leading-snug">{opp.title}</p>
                <div className="mt-2 flex items-center gap-3 text-[10px] text-zinc-400">
                  <span>Sıra: {opp.position}</span>
                  <span>{opp.impressions} göst.</span>
                </div>
                <button
                  onClick={() => handleGenerateBrief(opp, i + 100)}
                  disabled={generating === i + 100}
                  className="mt-3 w-full rounded-lg bg-brand py-1.5 text-[10px] font-bold text-white transition hover:bg-brand-dark disabled:opacity-50">
                  {generating === i + 100 ? "Üretiliyor..." : "İçerik Oluştur →"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          TAB 3: BAŞLIKTAN İÇERİK
          ═══════════════════════════════════════════ */}
      {activeTab === "title" && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-lg">✏️</div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Başlıktan İçerik Üret</h3>
              <p className="text-[10px] text-zinc-400">Bir başlık yazın, AI sizin için SEO uyumlu tam içerik brief&apos;i oluşturup Kreatif Stüdyo&apos;ya göndersin</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-700">İçerik Başlığı</label>
              <input
                type="text"
                value={titleInput}
                onChange={e => setTitleInput(e.target.value)}
                placeholder="Örn: 2026 Yaz Modası Trendleri — Kadın Giyim Rehberi"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-700">İçerik Türü</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { key: "blog", label: "Blog Yazısı", icon: "📰" },
                  { key: "category", label: "Kategori Sayfası", icon: "🏷️" },
                  { key: "product", label: "Ürün Açıklaması", icon: "📦" },
                  { key: "guide", label: "Rehber Sayfa", icon: "📖" },
                ].map(t => (
                  <button key={t.key} onClick={() => setContentType(t.key)}
                    className={`rounded-xl border px-3 py-2.5 text-[11px] font-semibold transition ${
                      contentType === t.key
                        ? "border-brand bg-red-50 text-brand"
                        : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                    }`}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleTitleBrief}
              disabled={!titleInput.trim() || generating === -1}
              className="w-full rounded-xl bg-brand py-3 text-sm font-bold text-white shadow-lg transition hover:bg-brand-dark disabled:opacity-40">
              {generating === -1 ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Brief üretiliyor...
                </span>
              ) : "🤖 Brief Oluştur & Kreatif Stüdyoya Git →"}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          TAB 4: MANUEL OLUŞTUR
          ═══════════════════════════════════════════ */}
      {activeTab === "manual" && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-lg">📝</div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Manuel İçerik Oluştur</h3>
              <p className="text-[10px] text-zinc-400">Kendi başlık ve anahtar kelimelerinizle sıfırdan içerik yazın</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-700">Başlık</label>
              <input type="text" placeholder="İçerik başlığını girin..."
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-700">Hedef Kelimeler (virgülle ayırın)</label>
              <input type="text" placeholder="oversize tişört, yazlık elbise, kadın giyim..."
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand focus:outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-700">İçerik Türü</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {["Blog Yazısı", "Kategori Sayfası", "Ürün Açıklaması", "Landing Page"].map((type, i) => (
                  <button key={i} className={`rounded-xl border px-3 py-2.5 text-[11px] font-semibold transition ${
                    i === 0 ? "border-brand bg-red-50 text-brand" : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                  }`}>
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <button className="w-full rounded-xl bg-brand py-3 text-sm font-bold text-white shadow-lg transition hover:bg-brand-dark">
              📝 İçerik Üretmeye Başla
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   YARDIMCI FONKSİYONLAR
   ═══════════════════════════════════════════ */

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">✍️</div>
      <h2 className="text-lg font-bold text-zinc-800">Henüz İçerik Fırsatı Yok</h2>
      <p className="mt-2 max-w-md text-sm text-zinc-500">
        Kelime verilerini senkronize ettikten sonra AI içerik önerileri otomatik oluşur.
      </p>
    </div>
  );
}

function badgeColor(color: string): string {
  switch (color) {
    case "trend": return "bg-red-100 text-red-700";
    case "category": return "bg-amber-100 text-amber-700";
    case "ctr": return "bg-blue-100 text-blue-700";
    case "blog": return "bg-purple-100 text-purple-700";
    case "new": return "bg-emerald-100 text-emerald-700";
    default: return "bg-zinc-100 text-zinc-600";
  }
}

function avatarGradient(i: number): string {
  const gradients = [
    "bg-gradient-to-br from-brand to-[#FF6B35]",
    "bg-gradient-to-br from-[#6366F1] to-[#A855F7]",
    "bg-gradient-to-br from-[#10B981] to-[#34D399]",
    "bg-gradient-to-br from-[#F59E0B] to-[#EF4444]",
    "bg-gradient-to-br from-[#3B82F6] to-[#6366F1]",
    "bg-gradient-to-br from-[#EC4899] to-[#F43F5E]",
  ];
  return gradients[i % gradients.length];
}
