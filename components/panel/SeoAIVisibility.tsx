"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api";

/* ═══════════════════════════════════════════
   AI GÖRÜNÜRLÜK 2026 — DataForSEO + EEAT
   ═══════════════════════════════════════════ */

interface Props {
  activeProjectId: number | null;
}

interface AICard {
  label: string;
  value: string;
  sub_label: string;
  delta: string;
  delta_color: string;
}

interface EEATComponent {
  name: string;
  score: number;
}

interface EEATCard {
  score: number;
  label: string;
  sub_label: string;
  components: EEATComponent[];
}

interface CompetitorAI {
  name: string;
  mentions: number;
  is_self: boolean;
}

interface PlatformStatus {
  platform: string;
  description: string;
  score: number;
  sector_avg: number;
  status: string;
}

interface AIAction {
  title: string;
  icon: string;
  description: string;
  impact: string;
  button_label: string;
  button_color: string;
}

interface AIVisData {
  chatgpt: AICard;
  perplexity: AICard;
  google_ai: AICard;
  eeat: EEATCard;
  competitors: CompetitorAI[];
  platforms: PlatformStatus[];
  actions: AIAction[];
  ai_summary: string;
  cached: boolean;
}

export default function SeoAIVisibility({ activeProjectId }: Props) {
  const { activeCompany } = useAuth();
  const [data, setData] = useState<AIVisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const cid = activeCompany?.id;

  const fetchData = useCallback(() => {
    if (!activeProjectId || !cid) return;
    setLoading(true);
    api.get(`/api/seo/ai-visibility/dashboard?projectId=${activeProjectId}&company_id=${cid}`)
      .then(({ data: d }) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [activeProjectId, cid]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSync = async () => {
    if (!activeProjectId || !cid) return;
    setSyncing(true);
    try {
      await api.get(`/api/seo/ai-visibility/sync?projectId=${activeProjectId}&company_id=${cid}`);
      setTimeout(() => { fetchData(); setSyncing(false); }, 5000);
    } catch {
      setSyncing(false);
    }
  };

  // Polling mechanism if analysis is running in background
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (data && !data.chatgpt?.value) {
      // Arka planda analiz devam ediyorsa her 3 saniyede bir kontrol et
      interval = setInterval(() => {
        api.get(`/api/seo/ai-visibility/dashboard?projectId=${activeProjectId}&company_id=${cid}`)
          .then(({ data: d }) => {
            if (d && d.chatgpt?.value) {
              setData(d);
            }
          });
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [data, activeProjectId, cid]);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-brand" />
        <span className="mt-4 text-sm font-bold text-zinc-700">AI Görünürlük Yükleniyor...</span>
      </div>
    );
  }

  if (!data || !data.chatgpt?.value) {
    // Veri yoksa veya arka planda yeni başlatıldıysa şık bir yükleniyor ekranı sun
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 animate-ping rounded-full bg-red-100 opacity-75" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand to-[#ff6b65] text-2xl shadow-xl shadow-red-200">
            🤖
          </div>
        </div>
        <h2 className="text-xl font-black text-zinc-900">AI Motorları Taranıyor</h2>
        <p className="mt-2 max-w-md text-sm text-zinc-500">
          ChatGPT, Perplexity ve Google AI üzerinde firmanızın atıfları, rakiplerinizin durumu ve E-E-A-T güven skorunuz hesaplanıyor...
        </p>
        
        {/* Progress Animasyonu */}
        <div className="mt-8 w-64 overflow-hidden rounded-full bg-zinc-100 h-2 relative">
          <div className="absolute left-0 top-0 h-full w-full animate-[progress_2s_ease-in-out_infinite] bg-brand rounded-full" style={{ left: '-100%' }} />
        </div>
        <p className="mt-3 text-[10px] uppercase font-bold tracking-widest text-brand animate-pulse">Lütfen Bekleyin</p>

        <style dangerouslySetInnerHTML={{__html: `
          @keyframes progress {
            0% { left: -100%; width: 100%; }
            50% { left: 0%; width: 10%; }
            100% { left: 100%; width: 100%; }
          }
        `}} />
      </div>
    );
  }

  const competitors = data.competitors || [];
  const maxMentions = Math.max(...competitors.map(c => c.mentions), 1);
  const platforms = data.platforms || [];
  const actions = data.actions || [];
  const eeat = data.eeat;

  return (
    <div className="space-y-5">
      {/* ════════════════════════════════════════
          AI BANNER — Kırmızı Uyarı
          ════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#2A1215] via-[#1F1F1F] to-[#1A1A1A] px-6 py-5 text-white">
        <div className="absolute left-0 top-0 h-full w-1 bg-brand" />
        <div className="flex items-start gap-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/20 text-base">🚨</div>
          <div className="flex-1">
            <h3 className="text-sm font-bold">
              2026&apos;da SEO sadece Google değil — AI araçları da seni sıralıyor
            </h3>
            <p className="mt-2 text-[12px] leading-5 text-zinc-300">{data.ai_summary}</p>
          </div>
          <button onClick={handleSync} disabled={syncing}
            className="shrink-0 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-bold text-white transition hover:bg-white/20 disabled:opacity-50">
            {syncing ? "Analiz ediliyor..." : "↻ Yenile"}
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════
          BİLGİ KUTUSU
          ════════════════════════════════════════ */}
      <div className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white px-5 py-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-sm">🤖</div>
        <div>
          <h4 className="text-[12px] font-bold text-zinc-800">AI Görünürlüğü nedir? — Yeni nesil SEO</h4>
          <p className="mt-1 text-[10px] leading-relaxed text-zinc-500">
            &quot;Hafta sonu elbiseleri neredem?&quot; sorusuna artık ChatGPT, Gemini veya Perplexity&apos;e soruylar. Bu araçlar bilgiyi web sitelerinden alıntılıyor. Eğer sen orada doğru içerik ve yapı ansa, AI seni gösteriyor ve rakibini öneriyor. Buna <strong>GEO (Generative Engine Optimization)</strong> deniyor — 2026&apos;nın en önemli SEO trendi.
          </p>
        </div>
      </div>

      {/* ════════════════════════════════════════
          4 KPI KART
          ════════════════════════════════════════ */}
      <div className="grid grid-cols-4 gap-3">
        {/* ChatGPT */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <span className="text-[10px] font-semibold text-zinc-400">ChatGPT Görünürlük</span>
          <p className="mt-1 text-3xl font-black text-zinc-900">{data.chatgpt.value}</p>
          <p className="mt-1 text-[10px] text-amber-500">Sektör: {data.chatgpt.sub_label}</p>
          <p className="mt-0.5 text-[9px] text-zinc-400">{data.chatgpt.delta}</p>
        </div>

        {/* Perplexity */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <span className="text-[10px] font-semibold text-zinc-400">Perplexity Atıfı</span>
          <p className="mt-1 text-3xl font-black text-zinc-900">{data.perplexity.value}</p>
          <p className="mt-1 text-[10px] text-blue-500">{data.perplexity.sub_label}</p>
          <p className="mt-0.5 text-[9px] text-zinc-400">{data.perplexity.delta}</p>
        </div>

        {/* Google AI */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <span className="text-[10px] font-semibold text-zinc-400">Google AI Özeti</span>
          <p className="mt-1 text-3xl font-black text-emerald-600">{data.google_ai.value}</p>
          <p className="mt-1 text-[10px] text-emerald-500">{data.google_ai.sub_label}</p>
          <p className="mt-0.5 text-[9px] text-zinc-400">{data.google_ai.delta}</p>
        </div>

        {/* E-E-A-T */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <span className="text-[10px] font-semibold text-zinc-400">E-E-A-T Skoru</span>
          <p className={`mt-1 text-3xl font-black ${
            eeat.score >= 80 ? "text-emerald-600" : eeat.score >= 60 ? "text-amber-500" : "text-red-500"
          }`}>{eeat.score}<span className="text-lg text-zinc-300">/100</span></p>
          <p className={`mt-1 text-[10px] ${
            eeat.score >= 80 ? "text-emerald-500" : eeat.score >= 60 ? "text-amber-500" : "text-red-500"
          }`}>{eeat.label}</p>
          <p className="mt-0.5 text-[9px] text-zinc-400">Detayları gör</p>
        </div>
      </div>

      {/* ════════════════════════════════════════
          RAKİP KARŞILAŞTIRMASI — Bar Chart
          ════════════════════════════════════════ */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-zinc-900">AI Platformlarında Rakip Karşılaştırması</h3>
          <span className="text-[9px] text-zinc-400">Son 30 gün · ChatGPT, Gemini, Perplexity atıf sayısı</span>
        </div>
        <div className="space-y-3">
          {competitors.map((comp, i) => {
            const pct = Math.min((comp.mentions / maxMentions) * 100, 100);
            const colors = ["bg-blue-500", "bg-purple-500", "bg-brand"];
            return (
              <div key={i} className="flex items-center gap-3">
                <span className={`w-14 text-[11px] font-bold ${comp.is_self ? "text-brand" : "text-zinc-600"}`}>
                  {comp.name}
                </span>
                <div className="flex-1 h-5 bg-zinc-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${colors[i] || "bg-blue-500"} transition-all`}
                    style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[10px] font-bold text-zinc-700 w-16 text-right">{comp.mentions} atıf(s)</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ════════════════════════════════════════
          3 AKSİYON KARTI
          ════════════════════════════════════════ */}
      <div className="grid grid-cols-3 gap-3">
        {actions.map((action, i) => {
          const borderColors = ["border-t-brand", "border-t-orange-400", "border-t-emerald-500"];
          const impactColors = ["text-emerald-500", "text-emerald-500", "text-zinc-500"];
          const btnColors = ["bg-brand hover:bg-brand-dark", "bg-orange-400 hover:bg-orange-500", "bg-emerald-500 hover:bg-emerald-600"];
          return (
            <div key={i} className={`rounded-xl border border-zinc-200 border-t-4 ${borderColors[i]} bg-white p-5 flex flex-col`}>
              <div className="flex items-center gap-2 mb-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-50 text-[11px]">{action.icon}</span>
                <h4 className="text-[12px] font-bold text-zinc-900">{action.title}</h4>
              </div>
              <p className="text-[10px] leading-relaxed text-zinc-500 flex-1">{action.description}</p>
              
              <div className="mt-3">
                <p className="text-[8px] text-zinc-400 mb-0.5">Tahmini etki:</p>
                <p className={`text-[10px] font-bold ${impactColors[i]}`}>{action.impact}</p>
              </div>

              <button className={`mt-4 rounded-md px-4 py-2.5 text-[10px] font-bold text-white ${btnColors[i]} transition w-full`}>
                {action.button_label}
              </button>
            </div>
          );
        })}
      </div>

      {/* ════════════════════════════════════════
          PLATFORM BAZLI DURUM
          ════════════════════════════════════════ */}
      <div className="rounded-2xl border border-zinc-200 bg-white">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <h3 className="text-sm font-bold text-zinc-900">Platform Bazlı AI Görünürlük</h3>
          <span className="text-[9px] text-zinc-400">Her AI platformundaki durumun</span>
        </div>
        <div className="divide-y divide-zinc-50">
          {platforms.map((platform, i) => {
            const icons = ["💬", "✨", "🔍"];
            return (
              <div key={i} className="flex items-center gap-4 px-5 py-4 hover:bg-zinc-50/50 transition">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-50 text-lg">{icons[i] || "🤖"}</div>
                <div className="flex-1">
                  <h4 className="text-[12px] font-bold text-zinc-900">{platform.platform}</h4>
                  <p className="text-[9px] text-zinc-400">{platform.description}</p>
                </div>
                <div className="text-right flex items-center gap-3">
                  {/* Score bar */}
                  <div className="w-20 h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${
                      platform.status === "Güçlü" ? "bg-emerald-500" :
                      platform.status === "Orta" ? "bg-amber-500" : "bg-red-400"
                    }`} style={{ width: `${Math.min(platform.score, 100)}%` }} />
                  </div>
                  <span className="text-[9px] text-zinc-500">
                    Sektör: %{platform.sector_avg.toFixed(0)}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold ${
                    platform.status === "Güçlü" ? "bg-emerald-100 text-emerald-700" :
                    platform.status === "Orta" ? "bg-amber-100 text-amber-700" :
                    "bg-red-100 text-red-700"
                  }`}>{platform.status}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ════════════════════════════════════════
          GEO BANNER
          ════════════════════════════════════════ */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-500 px-6 py-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold">🌍 GEO (Generative Engine Optimization) — 2026&apos;nın trendi</h3>
            <p className="mt-2 text-[11px] leading-relaxed text-emerald-100 max-w-3xl">
              Semrush ve Ahrefs gibi araçlar GEO çözümlerini 2025&apos;te ekledi. DIO bu strateji dönmü — marka profili oluşturma, SSS içerikleri, E-E-A-T sinyalleri ve Schema markup friendlerini tek bir yerden yönetebilmektir. Rakiplerininin çoğu henüz bu adımları atmadı.
            </p>
          </div>
          <button className="shrink-0 rounded-lg bg-white px-4 py-2.5 text-[10px] font-bold text-emerald-700 transition hover:bg-emerald-50">
            İçerik Üret →
          </button>
        </div>
      </div>
    </div>
  );
}
