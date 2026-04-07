"use client";

import { useState } from "react";
import api from "@/lib/api";

interface DataSourceResult {
  sourceType: "ai" | "manual";
  webUrl?: string;
  socialHandle?: string;
  aiResult?: {
    name: string;
    sector: string;
    description: string;
    slogan: string;
    customer_type: string[];
    product_categories: string;
    tone_of_voice: string;
    tone_examples: { id: string; example: string; tags: string[] }[];
    goal: string;
    content_language: string;
    brand_colors: string[];
    competitive_edge: string[];
    logo_url?: string;
    website?: string;
  };
}

export default function DataSourceSelection({ onNext }: { onNext: (data: DataSourceResult) => void }) {
  const [sources, setSources] = useState({
    web: false,
    social: false,
    manual: false,
  });

  const [webUrl, setWebUrl] = useState("");
  const [socialHandle, setSocialHandle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleSource = (source: "web" | "social" | "manual") => {
    setSources((prev) => {
      if (source === "manual") {
        return { web: false, social: false, manual: !prev.manual };
      }
      return {
        ...prev,
        manual: false,
        [source]: !prev[source],
      };
    });
    setError("");
  };

  const handleContinue = async () => {
    if (!sources.web && !sources.social && !sources.manual) return;

    if (sources.manual) {
      onNext({ sourceType: "manual" });
      return;
    }

    // Validation
    if (sources.web && !webUrl.trim()) {
      setError("Lütfen web sitenizin adresini girin");
      return;
    }
    if (sources.social && !socialHandle.trim()) {
      setError("Lütfen sosyal medya kullanıcı adınızı girin");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data } = await api.post("/api/onboarding/research", {
        web_url: sources.web ? webUrl.trim() : "",
        social_handle: sources.social ? socialHandle.trim().replace("@", "") : "",
      });

      onNext({
        sourceType: "ai",
        webUrl: sources.web ? webUrl : undefined,
        socialHandle: sources.social ? socialHandle : undefined,
        aiResult: data.result,
      });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || "Araştırma sırasında bir hata oluştu. Manuel olarak devam edebilirsiniz.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in-up max-w-3xl mx-auto w-full">
      {/* Başlık */}
      <div className="mb-6 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-2">
          ADIM 1 / 7 — BAŞLAYALIM
        </p>
        <h2 className="text-xl md:text-2xl font-bold text-zinc-900 mb-2 tracking-tight">
          Markanız hakkında bilgiyi nereden alalım?
        </h2>
        <p className="text-[13px] text-zinc-500 max-w-md mx-auto leading-relaxed">
          AI seçtiğin kaynaktan marka sesini, ürünlerini ve stilini öğrenir.
          <br />
          Sonra profil soruları gelecek — hızlı ve kısa.
        </p>
      </div>

      {/* Hata Mesajı */}
      {error && (
        <div className="auth-error mb-4 animate-fade-in-up">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 5v3.5M8 10.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {error}
        </div>
      )}

      {/* Kartlar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-6">
        {/* Web Sitesi */}
        <div
          className={`relative flex flex-col items-start gap-3 rounded-2xl border-2 p-5 text-left transition-all duration-300 cursor-pointer hover:shadow-md ${
            sources.web ? "border-brand bg-red-50/30 shadow-sm" : "border-zinc-200 bg-white hover:border-zinc-300"
          }`}
          onClick={() => toggleSource("web")}
        >
          {!sources.web && !sources.social && !sources.manual && (
            <span className="absolute -top-2.5 left-5 inline-flex items-center rounded-full bg-brand px-2 py-[2px] text-[9px] font-bold text-white uppercase tracking-wider">
              Önerilen
            </span>
          )}

          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🌐</span>
              <h3 className="font-bold text-[15px] text-zinc-900">Web Sitesi</h3>
            </div>
            <div className={`h-[18px] w-[18px] rounded-md border-2 flex items-center justify-center transition-colors ${sources.web ? "bg-brand border-brand" : "border-zinc-300"}`}>
              {sources.web && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              )}
            </div>
          </div>

          <p className="text-[12.5px] text-zinc-500 leading-relaxed">
            Sitenizi tarıyoruz — ürünleri, tonu ve stili otomatik öğreniyoruz.
          </p>

          <span className="inline-block rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">En hızlı yöntem</span>

          <div
            className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out w-full ${sources.web ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="overflow-hidden">
              <input
                type="url"
                placeholder="https://www.ornek.com"
                value={webUrl}
                onChange={(e) => setWebUrl(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-[13px] outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>
        </div>

        {/* Sosyal Medya */}
        <div
          className={`relative flex flex-col items-start gap-3 rounded-2xl border-2 p-5 text-left transition-all duration-300 cursor-pointer hover:shadow-md ${
            sources.social ? "border-brand bg-red-50/30 shadow-sm" : "border-zinc-200 bg-white hover:border-zinc-300"
          }`}
          onClick={() => toggleSource("social")}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">📱</span>
              <h3 className="font-bold text-[15px] text-zinc-900">Sosyal Medya</h3>
            </div>
            <div className={`h-[18px] w-[18px] rounded-md border-2 flex items-center justify-center transition-colors ${sources.social ? "bg-brand border-brand" : "border-zinc-300"}`}>
              {sources.social && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              )}
            </div>
          </div>

          <p className="text-[12.5px] text-zinc-500 leading-relaxed">
            Instagram veya TikTok hesabınızı bağlayın — içeriklerinizden öğrenelim.
          </p>

          <span className="inline-block rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">Hesap bağlantısı</span>

          <div
            className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out w-full ${sources.social ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="overflow-hidden">
              <input
                type="text"
                placeholder="@kullaniciadi"
                value={socialHandle}
                onChange={(e) => setSocialHandle(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-[13px] outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>
        </div>

        {/* Manuel Giriş */}
        <div
          className={`relative flex flex-col items-start gap-3 rounded-2xl border-2 p-5 text-left transition-all duration-300 cursor-pointer hover:shadow-md ${
            sources.manual ? "border-brand bg-red-50/30 shadow-sm" : "border-zinc-200 bg-white hover:border-zinc-300"
          }`}
          onClick={() => toggleSource("manual")}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">✏️</span>
              <h3 className="font-bold text-[15px] text-zinc-900">Manuel Giriş</h3>
            </div>
            <div className={`h-[18px] w-[18px] rounded-full border-2 flex items-center justify-center transition-colors ${sources.manual ? "bg-brand border-brand" : "border-zinc-300"}`}>
              {sources.manual && <div className="h-2 w-2 rounded-full bg-white" />}
            </div>
          </div>

          <p className="text-[12.5px] text-zinc-500 leading-relaxed">
            Henüz web sitesi veya aktif hesabım yok — sorularla ilerleyelim.
          </p>

          <span className="inline-block rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">Sorularla ilerie</span>
        </div>
      </div>

      {/* Alt Bilgi & Buton */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-t border-zinc-100 pt-5">
        <div className="flex items-start gap-2 max-w-lg">
          <span className="text-base leading-none mt-0.5">💡</span>
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            Birden fazla kaynak seçebilirsiniz — AI hepsini birleştirerek daha doğru bir profil oluşturur.
          </p>
        </div>

        <button
          onClick={handleContinue}
          disabled={loading || (!sources.web && !sources.social && !sources.manual)}
          className="group relative flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-[13px] font-bold text-white shadow-md shadow-brand/20 transition-all hover:bg-brand-dark hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none w-full md:w-auto justify-center"
        >
          {loading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent flex-shrink-0" />
              <span>AI Araştırıyor...</span>
            </>
          ) : (
            <>
              <span>Devam Et</span>
              <svg className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
