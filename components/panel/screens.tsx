"use client";

import { useState, useEffect, useRef } from "react";
import { PanelTitle, SectionCard, StatusPill } from "./ui";
import type { ScreenKey } from "./types";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import NewContentWizard from "./NewContentWizard";
import dynamic from "next/dynamic";
import { PhotoIcon, BuildingOffice2Icon, SparklesIcon, ShareIcon, PaintBrushIcon, ComputerDesktopIcon, AdjustmentsHorizontalIcon, LinkIcon, LanguageIcon, TagIcon, BuildingLibraryIcon, UserGroupIcon, IdentificationIcon, EyeIcon, MagnifyingGlassIcon, UsersIcon } from "@heroicons/react/24/outline";
import { CustomSelect, SearchableFontSelect, GenderToggle, SocialMediaManager } from "./AdvancedInputs";
import { useMarketingData } from "./useMarketingData";

const ImageStudio = dynamic(() => import("./ImageStudio"), { ssr: false });
const ContentCalendar = dynamic(() => import("./ContentCalendar"), { ssr: false });
const KreatifStudyoScreen = dynamic(() => import("./KreatifStudyo"), { ssr: false });
const KreatifOlusturScreen = dynamic(() => import("./KreatifOlustur"), { ssr: false });
const ZamanlayiciScreen = dynamic(() => import("./ZamanlayiciScreen"), { ssr: false });
const ProductImageStudio = dynamic(() => import("./ProductImageStudio"), { ssr: false });
const SeoGenelBakis = dynamic(() => import("./SeoGenelBakis"), { ssr: false });
const SeoMetricsCard = dynamic(() => import("./SeoMetricsCard"), { ssr: false });
const BrandDetail = dynamic(() => import("./BrandDetail"), { ssr: false });
import BrandProfileDetail from "./BrandProfileDetail";

// Recharts — lazy import to avoid SSR issues
const {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip: RechartsTooltip,
  Legend,
} = require("recharts");

function DatePickerDropdown({
  datePreset, setDatePreset,
  customDates, setCustomDates,
  datePickerOpen, setDatePickerOpen,
  datePickerRef
}: any) {
  return (
    <div className="relative" ref={datePickerRef}>
      {/* TETİKLEYİCİ BUTON */}
      <div 
        onClick={() => setDatePickerOpen(!datePickerOpen)}
        className="cursor-pointer flex flex-col sm:flex-row items-center gap-2.5 rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 pl-4 pr-3 py-2 text-white shadow-lg shadow-slate-900/20 hover:ring-2 hover:ring-slate-700 transition-all"
      >
        <div className="hidden sm:flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
        </div>
        <div className="flex flex-col pr-4 text-center sm:text-left">
          <span className="text-[11px] font-medium text-white/60 leading-none mb-1 hidden sm:block">Analiz Dönemi</span>
          <span className="text-sm font-semibold leading-tight">
            {datePreset === "custom" ? (customDates.start && customDates.end ? `${customDates.start} - ${customDates.end}` : "Özel Tarih Seçimi") : `Son ${datePreset} Gün`}
          </span>
        </div>
        <div className="pointer-events-none hidden sm:block">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5L9 4.5" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      </div>

      {/* AÇILIR MENÜ */}
      {datePickerOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl bg-white border border-zinc-200 shadow-xl overflow-hidden" style={{ animation: 'fade-in 0.15s ease-out' }}>
          <div className="p-1.5 flex flex-col gap-0.5">
            {[7, 30, 90].map(days => (
              <button
                key={days}
                onClick={() => { setDatePreset(days.toString()); setDatePickerOpen(false); }}
                className={`text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors ${datePreset === days.toString() ? 'bg-blue-50 text-blue-600' : 'text-zinc-700 hover:bg-zinc-100'}`}
              >
                Son {days} Gün
              </button>
            ))}
            <button
              onClick={() => setDatePreset("custom")}
              className={`text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors ${datePreset === "custom" ? 'bg-indigo-50 text-indigo-600' : 'text-zinc-700 hover:bg-zinc-100'}`}
            >
              Spesifik Tarih Seçin
            </button>
          </div>
          {datePreset === "custom" && (
            <div className="p-3 bg-zinc-50 border-t border-zinc-100 flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-zinc-600">Başlangıç Tarihi</label>
                <input 
                  type="date"
                  value={customDates.start}
                  onChange={(e) => setCustomDates((p: any) => ({ ...p, start: e.target.value }))}
                  className="rounded-lg border border-zinc-300 py-1.5 px-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-zinc-600">Bitiş Tarihi</label>
                <input 
                  type="date"
                  value={customDates.end}
                  onChange={(e) => setCustomDates((p: any) => ({ ...p, end: e.target.value }))}
                  className="rounded-lg border border-zinc-300 py-1.5 px-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                />
              </div>
              <button 
                onClick={() => setDatePickerOpen(false)}
                disabled={!customDates.start || !customDates.end}
                className="mt-1 w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white py-2 rounded-lg text-sm font-medium transition"
              >
                Verileri Getir
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DashboardScreen() {
  const { activeCompany } = useAuth();
  const {
    adPlatform, setAdPlatform,
    isMetaConnected, setIsMetaConnected, metaLoading, metaInsights, setMetaInsights, metaCampaigns, setMetaCampaigns, metaAdAccounts, selectedMetaAccount,
    isGadsConnected, setIsGadsConnected, gadsLoading, gadsError, gadsInsights, setGadsInsights, gadsCampaigns, setGadsCampaigns,
    isTikTokConnected, setIsTikTokConnected, tiktokLoading, tiktokInsights, setTiktokInsights,
    isLinkedInConnected, setIsLinkedInConnected, linkedinLoading, linkedinInsights, setLinkedinInsights, linkedinCampaigns, setLinkedinCampaigns, linkedinSocialData,
    linkedinAdAccounts, selectedLinkedinAccount, linkedinDebug,
    campaignFilter, setCampaignFilter,
    datePreset, setDatePreset,
    customDates, setCustomDates,
    datePickerOpen, setDatePickerOpen,
    datePickerRef,
    omniStats, omniLoading,
    handleMetaAccountChange, handleLinkedinAccountChange
  } = useMarketingData();

  // ── Disconnect handlers ──
  const handleMetaDisconnect = () => {
    if (!activeCompany) return;
    if (!confirm("Meta Ads bağlantısını kaldırmak istediğinize emin misiniz?")) return;
    api.delete(`/api/meta/disconnect?company_id=${activeCompany.id}`)
      .then(() => { setIsMetaConnected(false); setMetaInsights(null); setMetaCampaigns([]); })
      .catch(() => {});
  };
  const handleGadsDisconnect = () => {
    if (!activeCompany) return;
    if (!confirm("Google Ads bağlantısını kaldırmak istediğinize emin misiniz?")) return;
    api.delete(`/api/google-ads/disconnect?company_id=${activeCompany.id}`)
      .then(() => { setIsGadsConnected(false); setGadsInsights(null); setGadsCampaigns([]); })
      .catch(() => {});
  };
  const handleTikTokDisconnect = () => {
    if (!activeCompany) return;
    if (!confirm("TikTok Ads bağlantısını kaldırmak istediğinize emin misiniz?")) return;
    api.delete(`/api/tiktok/disconnect?company_id=${activeCompany.id}`)
      .then(() => { setIsTikTokConnected(false); setTiktokInsights(null); })
      .catch(() => {});
  };
  const handleLinkedInDisconnect = () => {
    if (!activeCompany) return;
    if (!confirm("LinkedIn Ads bağlantısını kaldırmak istediğinize emin misiniz?")) return;
    api.delete(`/api/linkedin/disconnect?company_id=${activeCompany.id}`)
      .then(() => { setIsLinkedInConnected(false); setLinkedinInsights(null); })
      .catch(() => {});
  };

  // ── Connect handlers ──
  const handleMetaConnect = () => {
    if (!activeCompany) return;
    api.get(`/api/meta/auth/login?company_id=${activeCompany.id}`)
      .then(({ data }) => { if (data.url) window.location.href = data.url; }).catch(() => {});
  };
  const handleGadsConnect = () => {
    if (!activeCompany) return;
    api.get(`/api/google-ads/auth/login?company_id=${activeCompany.id}`)
      .then(({ data }) => { if (data.url) window.location.href = data.url; }).catch(() => {});
  };
  const handleLinkedInConnect = () => {
    if (!activeCompany) return;
    api.get(`/api/linkedin/auth/login?company_id=${activeCompany.id}`)
      .then(({ data }) => { if (data.url) window.location.href = data.url; }).catch(() => {});
  };

  const fmtMoney = (n: number) => {
    if (n >= 1000000) return "₺" + (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return "₺" + n.toLocaleString("tr-TR", { maximumFractionDigits: 0 });
    return "₺" + n.toFixed(2);
  };
  const fmtNum = (n: number | undefined | null) => (n ?? 0).toLocaleString("tr-TR");

  const statusMap: Record<string, { label: string; tone: "ok" | "warn" | "muted" | "bad" }> = {
    ACTIVE: { label: "Aktif", tone: "ok" },
    ENABLED: { label: "Aktif", tone: "ok" },
    PAUSED: { label: "Duraklatıldı", tone: "warn" },
    COMPLETED: { label: "Tamamlandı", tone: "muted" },
    DRAFT: { label: "Taslak", tone: "muted" },
    REMOVED: { label: "Kaldırıldı", tone: "bad" },
    CANCELED: { label: "İptal Edildi", tone: "bad" },
    ARCHIVED: { label: "Arşivlendi", tone: "muted" },
  };

  // ── Platform bilgi haritası ──
  const platformInfo: Record<string, { label: string; color: string }> = {
    all: { label: "Tüm Platformlar", color: "#6366f1" },
    meta: { label: "Meta Ads", color: "#1877F2" },
    google: { label: "Google Ads", color: "#4285F4" },
    tiktok: { label: "TikTok Ads", color: "#000000" },
    linkedin: { label: "LinkedIn Ads", color: "#0A66C2" },
  };

  // ── Aktif platform verileri ──
  const getIsConnected = () => {
    if (adPlatform === "all") return isMetaConnected || isGadsConnected || isTikTokConnected || isLinkedInConnected;
    if (adPlatform === "meta") return isMetaConnected;
    if (adPlatform === "google") return isGadsConnected;
    if (adPlatform === "tiktok") return isTikTokConnected;
    if (adPlatform === "linkedin") return isLinkedInConnected;
    return false;
  };
  const getIsLoading = () => {
    if (adPlatform === "all") return omniLoading;
    if (adPlatform === "meta") return metaLoading;
    if (adPlatform === "google") return gadsLoading;
    if (adPlatform === "tiktok") return tiktokLoading;
    if (adPlatform === "linkedin") return linkedinLoading;
    return false;
  };
  const getHandleDisconnect = () => {
    if (adPlatform === "meta") return handleMetaDisconnect;
    if (adPlatform === "google") return handleGadsDisconnect;
    if (adPlatform === "tiktok") return handleTikTokDisconnect;
    if (adPlatform === "linkedin") return handleLinkedInDisconnect;
    return () => {};
  };
  const getHandleConnect = () => {
    if (adPlatform === "meta") return handleMetaConnect;
    if (adPlatform === "google") return handleGadsConnect;
    if (adPlatform === "linkedin") return handleLinkedInConnect;
    // TikTok için OAuth henüz eklenmediğinden boş
    return () => {};
  };

  const isConnected = getIsConnected();
  const isLoading = getIsLoading();
  const handleDisconnect = getHandleDisconnect();
  const handleConnect = getHandleConnect();
  const platformLabel = platformInfo[adPlatform]?.label || "Platform";
  const platformColor = platformInfo[adPlatform]?.color || "#6366f1";

  // Aktif platforma göre metrik kartları
  const getMetricCards = () => {
    const dLabel = datePreset === "custom" && customDates.start && customDates.end 
      ? `${customDates.start} ~ ${customDates.end}` 
      : `Son ${datePreset} gün`;

    // ── ALL: Omnichannel toplamlar ──
    if (adPlatform === "all" && omniStats?.totals) {
      const t = omniStats.totals;
      return [
        { title: "Toplam Harcama", value: fmtMoney(t.spend), delta: `Tüm Platformlar • ${dLabel}` },
        { title: "Toplam Tıklama", value: fmtNum(t.clicks), delta: `Tüm Platformlar • ${dLabel}` },
        { title: "Toplam Dönüşüm", value: t.conversions.toFixed(0), delta: `Tüm Platformlar • ${dLabel}` },
      ];
    }
    if (adPlatform === "meta" && metaInsights) {
      return [
        { title: "Toplam Harcama", value: fmtMoney(metaInsights.spend), delta: dLabel },
        { title: "Toplam Gelir", value: fmtMoney(metaInsights.revenue), delta: dLabel },
        { title: "ROAS", value: metaInsights.roas.toFixed(1) + "x", delta: dLabel },
      ];
    }
    if (adPlatform === "google" && gadsInsights) {
      return [
        { title: "Toplam Harcama", value: fmtMoney(gadsInsights.spend), delta: dLabel },
        { title: "Tıklama", value: fmtNum(gadsInsights.clicks), delta: dLabel },
        { title: "Dönüşüm", value: gadsInsights.conversions.toFixed(0), delta: dLabel },
      ];
    }
    if (adPlatform === "tiktok" && tiktokInsights) {
      return [
        { title: "Toplam Harcama", value: fmtMoney(tiktokInsights.spend), delta: dLabel },
        { title: "Tıklama", value: fmtNum(tiktokInsights.clicks), delta: dLabel },
        { title: "Dönüşüm", value: tiktokInsights.conversions.toFixed(0), delta: dLabel },
      ];
    }
    if (adPlatform === "linkedin" && linkedinInsights) {
      return [
        { title: "Toplam Harcama", value: fmtMoney(linkedinInsights.spend), delta: dLabel },
        { title: "Tıklama", value: fmtNum(linkedinInsights.clicks), delta: dLabel },
        { title: "Dönüşüm", value: linkedinInsights.conversions.toFixed(0), delta: dLabel },
      ];
    }
    return null;
  };

  const metricCards = getMetricCards();

  // Platform icon SVG helper
  const PlatformIcon = ({ platform, size = 28 }: { platform: string; size?: number }) => {
    if (platform === "meta") return <svg viewBox="0 0 24 24" width={size} height={size} fill="none"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" fill="#1877F2"/></svg>;
    if (platform === "google") return <svg viewBox="0 0 24 24" width={size} height={size} fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>;
    if (platform === "tiktok") return <svg viewBox="0 0 24 24" width={size} height={size} fill="none"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V9.4a8.16 8.16 0 004.76 1.52V7.5a4.85 4.85 0 01-1-.81z" fill="#000000"/></svg>;
    if (platform === "linkedin") return <svg viewBox="0 0 24 24" width={size} height={size} fill="none"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" fill="#0A66C2"/></svg>;
    // all - omnichannel icon
    return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>;
  };

  // Platform Bağlan Empty State
  const AdPlatformEmptyState = ({ variant = "card" }: { variant?: "card" | "full" }) => {
    const isFullWidth = variant === "full";
    if (adPlatform === "all") {
      return (
        <div className={`rounded-2xl border-2 border-dashed border-zinc-200 ${isFullWidth ? "p-8 md:p-12" : "p-6 md:p-8"} flex flex-col items-center justify-center text-center`}>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl mb-4 bg-indigo-50">
            <PlatformIcon platform="all" size={28} />
          </div>
          <h3 className={`font-semibold text-zinc-800 ${isFullWidth ? "text-lg" : "text-base"}`}>
            Henüz hiçbir reklam platformu bağlı değil
          </h3>
          <p className={`mt-2 text-zinc-500 max-w-sm leading-relaxed ${isFullWidth ? "text-sm" : "text-xs"}`}>
            Meta, Google, TikTok veya LinkedIn hesaplarınızı bağlayarak reklam performansınızı takip edin.
          </p>
        </div>
      );
    }
    return (
      <div className={`rounded-2xl border-2 border-dashed border-zinc-200 ${isFullWidth ? "p-8 md:p-12" : "p-6 md:p-8"} flex flex-col items-center justify-center text-center`}>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl mb-4" style={{ background: `${platformColor}12` }}>
          <PlatformIcon platform={adPlatform} size={28} />
        </div>
        <h3 className={`font-semibold text-zinc-800 ${isFullWidth ? "text-lg" : "text-base"}`}>
          {isFullWidth ? `${platformLabel} hesabınızı bağlayarak kampanya verilerinizi görün` : `${platformLabel} hesabınızı bağlayın`}
        </h3>
        <p className={`mt-2 text-zinc-500 max-w-sm leading-relaxed ${isFullWidth ? "text-sm" : "text-xs"}`}>
          {platformLabel} hesabınızı bağlayarak reklam performansınızı gerçek zamanlı takip edin.
        </p>
        {(adPlatform === "meta" || adPlatform === "google" || adPlatform === "linkedin") && (
          <button
            onClick={handleConnect}
            className="mt-5 inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:opacity-90"
            style={{ background: platformColor }}
          >
            {platformLabel} ile Bağlan
          </button>
        )}
        {adPlatform === "tiktok" && (
          <p className="mt-3 text-xs text-zinc-400 italic">OAuth entegrasyonu yakında eklenecek. Token'ları veritabanına manuel ekleyebilirsiniz.</p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="subtle text-sm">Dijital pazarlama performansınızı takip edin</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* ── Platform Dropdown ── */}
          <div className="relative">
            <select
              value={adPlatform}
              onChange={(e) => setAdPlatform(e.target.value as any)}
              className="appearance-none rounded-xl border border-zinc-200 bg-white pl-10 pr-8 py-2.5 text-sm font-medium text-zinc-800 shadow-sm transition hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 cursor-pointer"
            >
              <option value="all">Tüm Platformlar</option>
              <option value="meta">Meta Ads</option>
              <option value="google">Google Ads</option>
              <option value="tiktok">TikTok Ads</option>
              <option value="linkedin">LinkedIn Ads</option>
            </select>
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
              <PlatformIcon platform={adPlatform} size={16} />
            </div>
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5L9 4.5" stroke="#71717a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
          {/* ── Dönem Seçici ── */}
          <div className="z-50">
            <DatePickerDropdown 
              datePreset={datePreset} setDatePreset={setDatePreset} 
              customDates={customDates} setCustomDates={setCustomDates} 
              datePickerOpen={datePickerOpen} setDatePickerOpen={setDatePickerOpen} 
              datePickerRef={datePickerRef} 
            />
          </div>
        </div>
      </div>

      {/* ── Bağlantı Durum Barı + Metrik Kartları ── */}
      {isConnected && metricCards ? (
        <>
          <div className="flex items-center justify-between rounded-xl border px-4 py-2.5" style={{
            background: `linear-gradient(135deg, ${platformColor}08, ${platformColor}14)`,
            borderColor: `${platformColor}25`,
          }}>
            <div className="flex items-center gap-2">
              <PlatformIcon platform={adPlatform} size={18} />
              <span className="text-sm font-medium" style={{ color: platformColor }}>{platformLabel} {adPlatform === "all" ? "" : "Bağlı"}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Aktif</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Meta Ad Hesabı Seçici */}
              {adPlatform === "meta" && metaAdAccounts.length > 1 && (
                <select
                  value={selectedMetaAccount}
                  onChange={(e) => handleMetaAccountChange(e.target.value)}
                  className="appearance-none rounded-lg border border-zinc-200 bg-white pl-3 pr-7 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer max-w-[220px] truncate"
                >
                  {metaAdAccounts.map((acc) => (
                    <option key={acc.account_id} value={acc.account_id}>
                      {acc.name || `Hesap ${acc.account_id}`} ({acc.status})
                    </option>
                  ))}
                </select>
              )}
              {/* LinkedIn Ad Hesabı Seçici */}
              {adPlatform === "linkedin" && linkedinAdAccounts.length > 1 && (
                <select
                  value={selectedLinkedinAccount}
                  onChange={(e) => handleLinkedinAccountChange(e.target.value)}
                  className="appearance-none rounded-lg border border-zinc-200 bg-white pl-3 pr-7 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer max-w-[220px] truncate"
                >
                  {linkedinAdAccounts.map((acc) => (
                    <option key={acc.urn} value={acc.urn}>
                      {acc.name} ({acc.serving === "RUNNABLE" ? "Aktif" : acc.serving})
                    </option>
                  ))}
                </select>
              )}
              {adPlatform !== "all" && (
                <button onClick={handleDisconnect} className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50">Bağlantıyı Kes</button>
              )}
            </div>
          </div>
          <section className="grid grid-cols-2 gap-3 xl:grid-cols-3">
            {metricCards.map((item) => (
              <article className="card p-4" key={item.title}>
                <p className="subtle text-xs">{item.title}</p>
                <p className="mt-1 text-2xl sm:text-3xl lg:text-4xl font-semibold leading-tight truncate">{item.value}</p>
                <p className="mt-1 text-xs font-medium text-emerald-600">{item.delta}</p>
              </article>
            ))}
          </section>
        </>
      ) : isConnected && !isLoading && (adPlatform === "google" && gadsError) ? (
        <>
          {/* Bağlı ama veri çekilemiyor */}
          <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <PlatformIcon platform="google" size={18} />
              <span className="text-sm font-medium text-amber-800">Google Ads Bağlı</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Onay Bekliyor</span>
            </div>
            <button onClick={handleDisconnect} className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50">Bağlantıyı Kes</button>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-amber-900">Google Ads API Erişimi Bekliyor</h3>
                <p className="mt-1 text-xs text-amber-700 leading-relaxed">{gadsError}</p>
                <p className="mt-2 text-xs text-amber-600">Google Ads hesabınız başarıyla bağlandı. Developer token onaylandıktan sonra veriler otomatik olarak görünecektir.</p>
              </div>
            </div>
          </div>
        </>
      ) : isLoading ? (
        <section className="grid grid-cols-2 gap-3 xl:grid-cols-3">
          {["Toplam Harcama", "Tıklama / Gelir", "Dönüşüm / ROAS"].map((title) => (
            <article className="card p-4 animate-pulse" key={title}>
              <p className="subtle text-xs">{title}</p>
              <div className="mt-2 h-8 bg-zinc-100 rounded-lg w-2/3" />
              <div className="mt-2 h-3 bg-zinc-50 rounded w-1/3" />
            </article>
          ))}
        </section>
      ) : (
        <AdPlatformEmptyState variant="card" />
      )}

      {/* ── SEO Metrikleri ── */}
      <SeoMetricsCard />

      {/* ── Alt Kartlar ── */}
      <section className="grid gap-4 xl:grid-cols-2">
        {isConnected && metricCards ? (
          <SectionCard title="Reklam">
            <ul className="space-y-2 text-sm">
              {adPlatform === "all" && omniStats?.totals ? (
                <>
                  <li className="flex justify-between"><span>Toplam Harcama</span><strong>{fmtMoney(omniStats.totals.spend)}</strong></li>
                  <li className="flex justify-between"><span>Toplam Tıklama</span><strong>{fmtNum(omniStats.totals.clicks)}</strong></li>
                  <li className="flex justify-between"><span>Toplam Dönüşüm</span><strong>{omniStats.totals.conversions.toFixed(0)}</strong></li>
                  {omniStats.totals.roas > 0 && <li className="flex justify-between"><span>Ort. ROAS</span><strong className="text-emerald-600">{omniStats.totals.roas.toFixed(1)}x</strong></li>}
                </>
              ) : adPlatform === "meta" && metaInsights ? (
                <>
                  <li className="flex justify-between"><span>Harcama</span><strong>{fmtMoney(metaInsights.spend)}</strong></li>
                  <li className="flex justify-between"><span>ROAS</span><strong className="text-emerald-600">{metaInsights.roas.toFixed(1)}x</strong></li>
                  <li className="flex justify-between"><span>Dönüşüm</span><strong>{metaInsights.conversions.toLocaleString("tr-TR")}</strong></li>
                </>
              ) : adPlatform === "google" && gadsInsights ? (
                <>
                  <li className="flex justify-between"><span>Harcama</span><strong>{fmtMoney(gadsInsights.spend)}</strong></li>
                  <li className="flex justify-between"><span>CPC</span><strong className="text-blue-600">{fmtMoney(gadsInsights.cpc)}</strong></li>
                  <li className="flex justify-between"><span>CTR</span><strong className="text-emerald-600">{gadsInsights.ctr.toFixed(2)}%</strong></li>
                  <li className="flex justify-between"><span>Gösterim</span><strong>{fmtNum(gadsInsights.impressions)}</strong></li>
                </>
              ) : adPlatform === "tiktok" && tiktokInsights ? (
                <>
                  <li className="flex justify-between"><span>Harcama</span><strong>{fmtMoney(tiktokInsights.spend)}</strong></li>
                  <li className="flex justify-between"><span>Tıklama</span><strong>{fmtNum(tiktokInsights.clicks)}</strong></li>
                  <li className="flex justify-between"><span>CPA</span><strong className="text-blue-600">{fmtMoney(tiktokInsights.cpa)}</strong></li>
                  <li className="flex justify-between"><span>Dönüşüm Oranı</span><strong className="text-emerald-600">{(tiktokInsights.conversion_rate * 100).toFixed(2)}%</strong></li>
                </>
              ) : adPlatform === "linkedin" && linkedinInsights ? (
                <>
                  <li className="flex justify-between"><span>Harcama</span><strong>{fmtMoney(linkedinInsights.spend)}</strong></li>
                  <li className="flex justify-between"><span>Tıklama</span><strong>{fmtNum(linkedinInsights.clicks)}</strong></li>
                  <li className="flex justify-between"><span>Gösterim</span><strong>{fmtNum(linkedinInsights.impressions)}</strong></li>
                  <li className="flex justify-between"><span>Dönüşüm</span><strong>{linkedinInsights.conversions.toFixed(0)}</strong></li>
                </>
              ) : null}
            </ul>
          </SectionCard>
        ) : isLoading ? (
          <div className="card rounded-xl p-4 animate-pulse">
            <div className="h-5 bg-zinc-100 rounded w-1/4 mb-4" />
            <div className="space-y-3"><div className="h-4 bg-zinc-50 rounded" /><div className="h-4 bg-zinc-50 rounded" /><div className="h-4 bg-zinc-50 rounded" /></div>
          </div>
        ) : (
          <div className="card rounded-xl overflow-hidden">
            <div className="px-4 pt-4 pb-2"><h3 className="text-base font-semibold text-zinc-900">Reklam</h3></div>
            <div className="px-4 pb-4">
              {isConnected ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl mb-3" style={{ background: `${platformColor}12` }}>
                    <PlatformIcon platform={adPlatform} size={20} />
                  </div>
                  <p className="text-sm font-medium text-zinc-700">Reklam verisi henüz mevcut değil</p>
                  <p className="mt-1 text-xs text-zinc-400">Aktif reklam kampanyalarınız olduğunda veriler burada görünecektir.</p>
                </div>
              ) : (
                <AdPlatformEmptyState variant="card" />
              )}
            </div>
          </div>
        )}
        <SectionCard title="Sosyal Medya">
          {isConnected ? (
            linkedinSocialData ? (
              <div className="space-y-3">
                {/* Takipçi & Engagement */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                      <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Takipçi</p>
                      <p className="text-lg font-bold text-zinc-900">{fmtNum(linkedinSocialData.followers)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-500">Etkileşim</p>
                    <p className="text-lg font-bold text-emerald-600">{linkedinSocialData.engagement.toFixed(1)}%</p>
                  </div>
                </div>
                {/* Sayfa Görüntülenme */}
                <div className="rounded-lg bg-zinc-50 p-3">
                  <p className="text-xs font-medium text-zinc-500 mb-2">Sayfa Görüntülenme</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-base font-bold text-zinc-900">{fmtNum(linkedinSocialData.total_views)}</p>
                      <p className="text-[10px] text-zinc-400">Toplam</p>
                    </div>
                    <div>
                      <p className="text-base font-bold text-zinc-900">{fmtNum(linkedinSocialData.desktop_views)}</p>
                      <p className="text-[10px] text-zinc-400">Masaüstü</p>
                    </div>
                    <div>
                      <p className="text-base font-bold text-zinc-900">{fmtNum(linkedinSocialData.mobile_views)}</p>
                      <p className="text-[10px] text-zinc-400">Mobil</p>
                    </div>
                  </div>
                </div>
                {/* Alt Detaylar */}
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>Genel Bakış: <strong className="text-zinc-700">{fmtNum(linkedinSocialData.overview_views)}</strong></span>
                  <span>Hakkımızda: <strong className="text-zinc-700">{fmtNum(linkedinSocialData.about_views)}</strong></span>
                </div>
              </div>
            ) : (
              <div className="flex justify-center py-4">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl mb-3" style={{ background: `${platformColor}12` }}>
                <PlatformIcon platform={adPlatform} size={20} />
              </div>
              <p className="text-sm text-zinc-500">{platformLabel} hesabınıza bağlanmadan bu verileri göremezsiniz.</p>
            </div>
          )}
        </SectionCard>
      </section>

      {/* ── LinkedIn Sosyal Debug ── */}
      {/* 
      {adPlatform === "linkedin" && isConnected && linkedinDebug && (
        <div className="card p-4 mt-4">
          <h3 className="text-base font-semibold text-zinc-900 mb-3">🔍 LinkedIn Sosyal API Debug</h3>
          <pre className="bg-zinc-900 text-green-400 p-4 rounded-lg text-xs overflow-auto max-h-[600px] whitespace-pre-wrap">
            {JSON.stringify(linkedinDebug, null, 2)}
          </pre>
        </div>
      )}
      */}

      {/* ── Son Kampanyalar ── */}
      {isConnected && ((adPlatform === "meta" && metaCampaigns.length > 0) || (adPlatform === "google" && gadsCampaigns.length > 0) || (adPlatform === "linkedin" && linkedinCampaigns.length > 0)) ? (
        <SectionCard title="Son Kampanyalar" action="Tümünü Gör">
          <div className="flex justify-end mb-4 px-1">
            <select
              value={campaignFilter}
              onChange={(e) => setCampaignFilter(e.target.value)}
              className="appearance-none rounded-lg border border-zinc-200 bg-zinc-50 pl-3 pr-8 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="Aktif">Aktif</option>
              <option value="Tamamlandı">Tamamlandı</option>
              <option value="Duraklatıldı">Duraklatıldı</option>
              <option value="Taslak">Taslak</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="subtle text-left">
                <tr><th className="py-2">Kampanya</th><th>Platform</th><th>Harcama</th><th>{adPlatform === "meta" ? "ROAS" : "Tıklama"}</th><th>Durum</th></tr>
              </thead>
              <tbody>
                {adPlatform === "meta" ? metaCampaigns.filter(c => campaignFilter === "all" || statusMap[c.status]?.label === campaignFilter).map((c) => {
                  const st = statusMap[c.status] || { label: c.status, tone: "warn" as const };
                  return (
                    <tr className="border-t" key={c.id}>
                      <td className="py-2">{c.name}</td><td>Meta Ads</td><td>{fmtMoney(c.spend || c.daily_budget)}</td>
                      <td className={c.roas < 2 ? "font-semibold text-amber-600" : "font-semibold text-emerald-600"}>{c.roas.toFixed(1)}x</td>
                      <td><StatusPill label={st.label} tone={st.tone} /></td>
                    </tr>
                  );
                }) : adPlatform === "google" ? gadsCampaigns.filter(c => campaignFilter === "all" || statusMap[c.status]?.label === campaignFilter).map((c) => {
                  const st = statusMap[c.status] || { label: c.status, tone: "warn" as const };
                  return (
                    <tr className="border-t" key={c.id}>
                      <td className="py-2">{c.name}</td><td>Google Ads</td><td>{fmtMoney(c.spend)}</td>
                      <td className="font-semibold">{fmtNum(c.clicks)}</td>
                      <td><StatusPill label={st.label} tone={st.tone} /></td>
                    </tr>
                  );
                }) : linkedinCampaigns.filter(c => campaignFilter === "all" || statusMap[c.status]?.label === campaignFilter).map((c) => {
                  const st = statusMap[c.status] || { label: c.status, tone: "warn" as const };
                  return (
                    <tr className="border-t" key={c.id}>
                      <td className="py-2">{c.name}</td><td>LinkedIn Ads</td><td>{fmtMoney(c.spend)}</td>
                      <td className="font-semibold">{fmtNum(c.clicks)}</td>
                      <td><StatusPill label={st.label} tone={st.tone} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>
      ) : isLoading ? (
        <div className="card rounded-xl p-4 animate-pulse">
          <div className="h-5 bg-zinc-100 rounded w-1/3 mb-4" />
          <div className="space-y-3"><div className="h-4 bg-zinc-50 rounded" /><div className="h-4 bg-zinc-50 rounded" /><div className="h-4 bg-zinc-50 rounded" /><div className="h-4 bg-zinc-50 rounded" /></div>
        </div>
      ) : (
        <div className="card rounded-xl overflow-hidden">
          <div className="px-4 pt-4 pb-2"><h3 className="text-base font-semibold text-zinc-900">Son Kampanyalar</h3></div>
          <div className="px-4 pb-4">
            {isConnected ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl mb-3" style={{ background: `${platformColor}12` }}>
                  <PlatformIcon platform={adPlatform} size={24} />
                </div>
                <p className="text-sm font-medium text-zinc-700">Henüz kampanya verisi bulunamadı</p>
                <p className="mt-1 text-xs text-zinc-400">Aktif kampanyalarınız olduğunda veriler burada görünecektir.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl mb-3" style={{ background: `${platformColor}12` }}>
                  <PlatformIcon platform={adPlatform} size={24} />
                </div>
                <p className="text-sm text-zinc-500">{platformLabel} hesabınıza bağlanmadan kampanya verilerini göremezsiniz.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ReklamScreen() {
  const {
    metaInsights, metaCampaigns, gadsInsights, gadsCampaigns, linkedinInsights, linkedinCampaigns, tiktokInsights,
    datePreset, setDatePreset, customDates, setCustomDates, datePickerOpen, setDatePickerOpen, datePickerRef
  } = useMarketingData();
  const [activeTab, setActiveTab] = useState("Meta Ads");

  const platforms = ["Meta Ads", "Google Ads", "LinkedIn Ads", "TikTok Ads"];

  const getInsights = () => {
    if (activeTab === "Meta Ads") return metaInsights;
    if (activeTab === "Google Ads") return gadsInsights;
    if (activeTab === "LinkedIn Ads") return linkedinInsights;
    if (activeTab === "TikTok Ads") return tiktokInsights;
    return null;
  };

  const getCampaigns = () => {
    if (activeTab === "Meta Ads") return metaCampaigns || [];
    if (activeTab === "Google Ads") return gadsCampaigns || [];
    if (activeTab === "LinkedIn Ads") return linkedinCampaigns || [];
    return [];
  };

  const insights: any = getInsights();
  const campaigns: any[] = getCampaigns();

  const fmtMoney = (val?: number) => val != null ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val) : "₺0,00";
  const fmtNum = (val?: number) => val != null ? new Intl.NumberFormat('tr-TR').format(val) : "0";

  return (
    <div className="space-y-4">
      <PanelTitle title="Reklam Yönetimi" description="Tüm reklam kampanyalarınızı yönetin" />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="inline-flex rounded-lg bg-zinc-100 p-1">
          {platforms.map((tab) => (
            <button
              className={`rounded-md px-3 py-1.5 text-sm transition ${activeTab === tab ? "bg-white font-medium text-foreground shadow-sm" : "text-zinc-600 hover:text-foreground"}`}
              key={tab}
              onClick={() => setActiveTab(tab)}
              type="button"
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="z-50">
          <DatePickerDropdown 
            datePreset={datePreset} setDatePreset={setDatePreset} 
            customDates={customDates} setCustomDates={setCustomDates} 
            datePickerOpen={datePickerOpen} setDatePickerOpen={setDatePickerOpen} 
            datePickerRef={datePickerRef} 
          />
        </div>
      </div>
      
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { title: "Harcama", value: fmtMoney(insights?.spend), accent: "" },
          { title: "Gösterim", value: fmtNum(insights?.impressions || 0), accent: "" },
          { title: "Tıklama", value: fmtNum(insights?.clicks || 0), accent: "" },
          { title: "Dönüşüm", value: fmtNum(insights?.conversions || 0), accent: "" },
          { title: "ROAS", value: insights?.roas ? `${insights.roas.toFixed(2)}x` : "-", accent: "text-emerald-600" },
        ].map((item) => (
          <article className="card p-4" key={item.title}>
            <p className="subtle text-xs">{item.title}</p>
            <p className={`mt-1 text-xl sm:text-2xl lg:text-3xl font-semibold leading-tight truncate ${item.accent}`}>{item.value}</p>
          </article>
        ))}
      </section>
      
      {campaigns && campaigns.length > 0 ? (
        <SectionCard title="Kampanyalar">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="subtle text-left">
                <tr>
                  <th className="py-2">Kampanya Adı</th>
                  <th>Platform</th>
                  <th>Bütçe</th>
                  <th>Harcama</th>
                  <th>Tıklama</th>
                  <th>Dönüşüm</th>
                  <th>ROAS</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c: any) => {
                  const spend = c.spend || 0;
                  const budget = c.daily_budget || 0;
                  const roas = c.roas || 0;
                  const clicks = c.clicks || 0;
                  const conv = c.conversions || 0;
                  return (
                    <tr className="border-t" key={c.id || c.name}>
                      <td className="py-2">{c.name}</td>
                      <td>{activeTab}</td>
                      <td>{budget ? fmtMoney(budget) : "-"}</td>
                      <td>{fmtMoney(spend)}</td>
                      <td>{fmtNum(clicks)}</td>
                      <td>{fmtNum(conv)}</td>
                      <td className="font-semibold text-emerald-600">{roas ? `${roas.toFixed(1)}x` : "-"}</td>
                      <td>
                        <StatusPill label={c.status} tone={c.status === "ACTIVE" || c.status === "Aktif" ? "ok" : "warn"} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>
      ) : (
        <div className="card p-8 flex flex-col items-center justify-center text-center">
            <p className="text-sm font-medium text-zinc-700">Henüz kampanya verisi bulunamadı</p>
            <p className="mt-1 text-xs text-zinc-400">{activeTab} hesabınız bağlı olmayabilir veya aktif kampanya yok.</p>
        </div>
      )}
    </div>
  );
}

/* ── SEO Trend Chart ──────────────────────── */
function SeoTrendChart({ data }: { data: Array<{ date: string; clicks: number; impressions: number; ctr: number; position: number }> }) {
  const formatDate = (d: string) => {
    const parts = d.split("-");
    return `${parts[2]}/${parts[1]}`;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={{ stroke: "#e2e8f0" }}
          tickLine={false}
        />
        <YAxis
          yAxisId="left"
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          width={50}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          width={60}
        />
        <RechartsTooltip
          contentStyle={{
            backgroundColor: "#1e293b",
            border: "none",
            borderRadius: "10px",
            padding: "10px 14px",
            fontSize: "12px",
            color: "#fff",
            boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
          }}
          labelFormatter={formatDate}
          formatter={(value: number, name: string) => {
            const labels: Record<string, string> = {
              clicks: "Tıklama",
              impressions: "Gösterim",
            };
            return [typeof value === "number" ? value.toLocaleString("tr-TR") : value, labels[name] || name];
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
          formatter={(value: string) => {
            const labels: Record<string, string> = {
              clicks: "Tıklama",
              impressions: "Gösterim",
            };
            return labels[value] || value;
          }}
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="clicks"
          stroke="#3b82f6"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5, strokeWidth: 2, fill: "#fff" }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="impressions"
          stroke="#10b981"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5, strokeWidth: 2, fill: "#fff" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}


function SeoScreen() {
  const { activeCompany } = useAuth();
  const [integrationStatus, setIntegrationStatus] = useState<{ connected: boolean; site_url?: string } | null>(null);
  const [siteList, setSiteList] = useState<{url: string; permission_level: string}[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>("");
  const [metrics, setMetrics] = useState<{
    summary: { clicks: number; impressions: number; ctr: number; position: number };
    trend: Array<{ date: string; clicks: number; impressions: number; ctr: number; position: number }>;
    period: { start: string; end: string };
    site_url: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);
  const [error, setError] = useState("");

  // Bağlantı durumunu kontrol et
  useEffect(() => {
    if (!activeCompany) return;
    setLoading(true);
    setError("");
    api
      .get(`/api/seo/integration/status?company_id=${activeCompany.id}`)
      .then(({ data }) => {
        setIntegrationStatus(data);
        if (data.connected) {
          fetchSitesAndMetrics(data.site_url);
        }
      })
      .catch(() => {
        setIntegrationStatus({ connected: false });
      })
      .finally(() => setLoading(false));
  }, [activeCompany]);

  const fetchSitesAndMetrics = (defaultSite?: string) => {
    if (!activeCompany) return;
    api.get(`/api/seo/sites?company_id=${activeCompany.id}`).then(({data}) => {
      if (data.sites) {
        setSiteList(data.sites);
        const currentSite = defaultSite || data.current_site || (data.sites.length > 0 ? data.sites[0].url : "");
        setSelectedSite(currentSite);
        fetchMetrics(currentSite);
      } else {
        fetchMetrics(defaultSite);
      }
    }).catch(() => {
        fetchMetrics(defaultSite);
    });
  }

  // GSC metriklerini çek
  const fetchMetrics = (overrideSiteUrl?: string) => {
    if (!activeCompany) return;
    setMetricsLoading(true);
    setError("");
    
    // Eğer override yoksa state'ten al
    const targetSite = overrideSiteUrl || selectedSite;
    const urlParam = targetSite ? `&site_url=${encodeURIComponent(targetSite)}` : "";

    api
      .get(`/api/seo/dashboard/metrics?company_id=${activeCompany.id}${urlParam}`)
      .then(({ data }) => setMetrics(data))
      .catch((err) => {
        const msg = err.response?.data?.error || "Metrikler alınamadı";
        setError(msg);
      })
      .finally(() => setMetricsLoading(false));
  };

  const handleSiteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSite = e.target.value;
    setSelectedSite(newSite);
    fetchMetrics(newSite);
  };

  // Google OAuth bağlantısı başlat
  const handleConnect = () => {
    if (!activeCompany) return;
    setConnectLoading(true);
    api
      .get(`/api/seo/auth/google/login?company_id=${activeCompany.id}`)
      .then(({ data }) => {
        window.location.href = data.url;
      })
      .catch(() => {
        setError("Google bağlantı URL'si alınamadı");
        setConnectLoading(false);
      });
  };

  // Bağlantıyı kaldır
  const handleDisconnect = () => {
    if (!activeCompany) return;
    if (!confirm("Google Search Console bağlantısını kaldırmak istediğinize emin misiniz?")) return;
    api
      .delete(`/api/seo/integration/disconnect?company_id=${activeCompany.id}`)
      .then(() => {
        setIntegrationStatus({ connected: false });
        setMetrics(null);
      })
      .catch(() => setError("Bağlantı kaldırılamadı"));
  };

  const fmt = (n: number) => n >= 1000 ? (n >= 1000000 ? (n / 1000000).toFixed(1) + "M" : (n / 1000).toFixed(1) + "K") : String(Math.round(n));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="spinner-dark" />
        <span className="ml-3 text-sm text-muted">SEO modülü yükleniyor...</span>
      </div>
    );
  }

  // ────────── Bağlı değil → Connect UI ──────────
  if (!integrationStatus?.connected) {
    return (
      <div className="space-y-4">
        <PanelTitle title="SEO Analiz" description="Google Search Console verilerinizi görüntüleyin" />
        <div className="flex items-center justify-center py-12">
          <div className="max-w-md text-center space-y-6">
            {/* Google icon */}
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-emerald-50 shadow-inner">
              <svg viewBox="0 0 24 24" width="40" height="40" className="drop-shadow-sm">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-foreground">Google Search Console'u Bağla</h2>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                Web sitenizin organik arama performansını takip etmek için Google Search Console hesabınızı bağlayın.
                Tıklama, gösterim, CTR ve ortalama konum verilerinizi gerçek zamanlı göreceksiniz.
              </p>
            </div>

            <button
              onClick={handleConnect}
              disabled={connectLoading}
              className="inline-flex items-center gap-2.5 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-foreground border border-zinc-200 shadow-sm transition hover:shadow-md hover:border-zinc-300 disabled:opacity-60"
            >
              {connectLoading ? (
                <div className="spinner-dark" />
              ) : (
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              Google ile Bağlan
            </button>

            <div className="rounded-xl bg-zinc-50 p-4 text-left text-xs text-muted space-y-1.5">
              <p className="font-semibold text-foreground text-sm">Nasıl çalışır?</p>
              <p>1. Google hesabınızla giriş yapın</p>
              <p>2. Search Console erişim izni verin</p>
              <p>3. Site verileriniz otomatik olarak yüklenir</p>
            </div>

            {error && (
              <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-4 py-2">{error}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ────────── Bağlı → Dashboard ──────────
  const s = metrics?.summary;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-64">
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            SEO Dashboard
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Bağlı
            </span>
          </h1>
          <div className="mt-2 text-sm subtle">
            {siteList.length > 0 ? (
              <select 
                value={selectedSite} 
                onChange={handleSiteChange}
                disabled={metricsLoading}
                className="w-full bg-white border border-zinc-200 text-foreground text-sm rounded-md focus:ring-brand focus:border-brand py-1.5 px-3 transition shadow-sm outline-none cursor-pointer disabled:opacity-50"
              >
                {siteList.map(s => (
                  <option key={s.url} value={s.url}>{s.url}</option>
                ))}
              </select>
            ) : (
              metrics?.site_url || integrationStatus?.site_url || "Google Search Console verileri"
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchMetrics()}
            disabled={metricsLoading}
            className="rounded-lg border bg-white px-3 py-2 text-sm font-medium transition hover:bg-zinc-50 disabled:opacity-50"
          >
            {metricsLoading ? "Yükleniyor..." : "↻ Yenile"}
          </button>
          <button
            onClick={handleDisconnect}
            className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
          >
            Bağlantıyı Kes
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-600">{error}</div>
      )}

      {/* KPI Cards */}
      {s && (
        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <article className="card p-4">
            <p className="subtle text-xs">Toplam Tıklama</p>
            <p className="mt-1 text-2xl sm:text-3xl lg:text-4xl font-semibold leading-tight truncate text-blue-600">{fmt(s.clicks)}</p>
            <p className="mt-1 text-xs text-muted">Son 30 gün</p>
          </article>
          <article className="card p-4">
            <p className="subtle text-xs">Toplam Gösterim</p>
            <p className="mt-1 text-2xl sm:text-3xl lg:text-4xl font-semibold leading-tight truncate text-emerald-600">{fmt(s.impressions)}</p>
            <p className="mt-1 text-xs text-muted">Son 30 gün</p>
          </article>
          <article className="card p-4">
            <p className="subtle text-xs">Ortalama TO (CTR)</p>
            <p className="mt-1 text-2xl sm:text-3xl lg:text-4xl font-semibold leading-tight truncate text-amber-600">{(s.ctr * 100).toFixed(1)}%</p>
            <p className="mt-1 text-xs text-muted">Son 30 gün</p>
          </article>
          <article className="card p-4">
            <p className="subtle text-xs">Ortalama Konum</p>
            <p className="mt-1 text-2xl sm:text-3xl lg:text-4xl font-semibold leading-tight truncate">{s.position.toFixed(1)}</p>
            <p className="mt-1 text-xs text-muted">Son 30 gün</p>
          </article>
        </section>
      )}

      {/* Trend Chart */}
      {metrics?.trend && metrics.trend.length > 0 && (
        <SectionCard title="Son 30 Gün Performans Trendi">
          <div className="h-[340px] w-full">
            <SeoTrendChart data={metrics.trend} />
          </div>
        </SectionCard>
      )}

      {metricsLoading && !metrics && (
        <div className="flex items-center justify-center py-16">
          <div className="spinner-dark" />
          <span className="ml-3 text-sm text-muted">GSC verileri yükleniyor...</span>
        </div>
      )}
    </div>
  );
}

function SeoGenelBakisScreen() {
  return <SeoGenelBakis />;
}

function SosyalScreen() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sosyal Medya Yönetimi</h1>
          <p className="subtle text-sm">İçerik planlama, takvim ve yayın yönetimi</p>
        </div>
        <button className="rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white">+ Yeni İçerik</button>
      </div>

      <div className="flex flex-wrap gap-3 border-b pb-2">
        {["Tümü", "Instagram", "Facebook", "LinkedIn", "TikTok", "Twitter", "YouTube"].map((tab, i) => (
          <button
            key={tab}
            className={`pb-1 text-sm ${i === 0 ? "border-b-2 border-rose-500 font-semibold text-rose-600" : "text-zinc-600"}`}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[2.2fr_0.9fr]">
        <section className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-2xl font-semibold">İçerik Takvimi — Mart 2026</h2>
            <div className="flex gap-2">
              <button className="rounded-md border px-3 py-1 text-xs">Önceki</button>
              <button className="rounded-md border px-3 py-1 text-xs">Sonraki</button>
            </div>
          </div>
          <div className="grid grid-cols-7 border-t text-xs">
            {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((d) => (
              <div className="subtle border-r px-2 py-2 text-center last:border-r-0" key={d}>
                {d}
              </div>
            ))}
          </div>
          <div className="grid min-h-[430px] grid-cols-7 border-t text-xs">
            {[
              "23|Instagram Post",
              "24|LinkedIn Makale",
              "25|",
              "26|TikTok Video",
              "27|",
              "28|Facebook Kampanya",
              "29|",
              "30|Twitter Thread",
              "31|",
              "1|Instagram Reel",
              "2|YouTube Video",
              "3|",
              "4|",
              "5|",
            ].map((cell) => {
              const [day, event] = cell.split("|");
              const eventClass = event?.includes("Instagram")
                ? "bg-rose-50 text-rose-600"
                : event?.includes("LinkedIn")
                  ? "bg-blue-50 text-blue-600"
                  : event?.includes("TikTok")
                    ? "bg-amber-50 text-amber-700"
                    : event?.includes("Facebook")
                      ? "bg-emerald-50 text-emerald-700"
                      : event?.includes("Twitter")
                        ? "bg-yellow-50 text-yellow-700"
                        : event?.includes("YouTube")
                          ? "bg-sky-50 text-sky-700"
                          : "bg-zinc-100 text-zinc-700";
              return (
                <div className="border-r border-b p-2 align-top last:border-r-0" key={cell}>
                  <p className="subtle">{day}</p>
                  {event ? <p className={`mt-1 rounded px-1 py-0.5 text-[11px] ${eventClass}`}>{event}</p> : null}
                </div>
              );
            })}
          </div>
        </section>

        <div className="space-y-4">
          <SectionCard title="Yaklaşan İçerikler">
            <ul className="space-y-2 text-sm">
              <li>
                <p><span className="mr-2 text-rose-600">●</span>Instagram Post - Ürün Tanıtımı</p>
                <p className="subtle text-xs">28 Mart, 14:00</p>
              </li>
              <li>
                <p><span className="mr-2 text-amber-600">●</span>TikTok Video - Trend İçerik</p>
                <p className="subtle text-xs">26 Mart, 18:00</p>
              </li>
              <li>
                <p><span className="mr-2 text-yellow-600">●</span>Twitter Thread - SEO İpuçları</p>
                <p className="subtle text-xs">30 Mart, 10:00</p>
              </li>
              <li>
                <p><span className="mr-2 text-blue-600">●</span>LinkedIn Makale - Vaka Çalışması</p>
                <p className="subtle text-xs">24 Mart, 09:00</p>
              </li>
            </ul>
          </SectionCard>
          <SectionCard title="İçerik Üretim Süreci">
            <ul className="space-y-2 text-sm">
              {["1 Brief Oluştur", "2 Taslak Hazırla", "3 Onay Süreci", "4 Yayınla"].map((step, i) => (
                <li className="flex items-center gap-2" key={step}>
                  <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${i === 0 ? "bg-rose-500 text-white" : "bg-rose-100 text-rose-600"}`}>
                    {i + 1}
                  </span>
                  <span>{step.slice(2)}</span>
                </li>
              ))}
            </ul>
          </SectionCard>
          <SectionCard title="Platform İstatistikleri">
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between"><span>Instagram</span><strong>12.4K takipçi</strong></li>
              <li className="flex justify-between"><span>TikTok</span><strong>23.1K takipçi</strong></li>
              <li className="flex justify-between"><span>Facebook</span><strong>8.7K takipçi</strong></li>
              <li className="flex justify-between"><span>LinkedIn</span><strong>5.2K takipçi</strong></li>
              <li className="flex justify-between"><span>Twitter</span><strong>3.8K takipçi</strong></li>
            </ul>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function PerformansScreen() {
  const {
    omniStats, datePreset, setDatePreset, customDates, setCustomDates, datePickerOpen, setDatePickerOpen, datePickerRef
  } = useMarketingData();

  const fmtMoney = (val?: number) => val != null ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val) : "₺0,00";

  const t = omniStats?.totals;
  const revenue = t && t.spend && t.roas ? t.spend * t.roas : 0;
  
  const totalSpend = t?.spend || 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Performans ve Raporlama</h1>
          <p className="subtle text-sm">Tüm kanalların performansını tek panelden izleyin</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="z-50">
            <DatePickerDropdown 
              datePreset={datePreset} setDatePreset={setDatePreset} 
              customDates={customDates} setCustomDates={setCustomDates} 
              datePickerOpen={datePickerOpen} setDatePickerOpen={setDatePickerOpen} 
              datePickerRef={datePickerRef} 
            />
          </div>
          <button className="rounded-lg border bg-white px-3 py-2 text-sm font-medium">Rapor İndir</button>
          <button className="rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white">Yeni Rapor Oluştur</button>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        {[
          { title: "Toplam Harcama", value: fmtMoney(t?.spend || 0), delta: "", tone: "text-rose-600" },
          { title: "Toplam Gelir", value: fmtMoney(revenue), delta: "", tone: "text-emerald-600" },
          { title: "ROAS", value: t?.roas ? `${t.roas.toFixed(2)}x` : "-", delta: "", tone: "text-emerald-600" },
          { title: "Tıklama", value: t?.clicks?.toLocaleString('tr-TR') || "0", delta: "", tone: "text-emerald-600" },
          { title: "Dönüşüm", value: t?.conversions?.toLocaleString('tr-TR') || "0", delta: "", tone: "text-emerald-600" },
        ].map((item) => (
          <article className="card p-4" key={item.title}>
            <p className="subtle text-xs">{item.title}</p>
            <p className="mt-1 text-xl sm:text-2xl lg:text-3xl font-semibold leading-tight truncate">{item.value}</p>
            {item.delta && <p className={`mt-1 text-xs font-medium ${item.tone}`}>{item.delta}</p>}
          </article>
        ))}
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard title="Reklam Platformları Harcamaları" action="Aktif">
          <div className="space-y-3 text-sm">
            {omniStats?.platforms?.map((p: any) => {
              const platformColors: Record<string, string> = { "meta": "bg-rose-500", "google": "bg-blue-500", "linkedin": "bg-emerald-500", "tiktok": "bg-amber-500" };
              const platformLabels: Record<string, string> = { "meta": "Meta Ads", "google": "Google Ads", "linkedin": "LinkedIn Ads", "tiktok": "TikTok Ads" };
              const ratio = totalSpend > 0 ? (p.spend / totalSpend) * 100 : 0;
              return (
                <div key={p.platform}>
                  <div className="mb-1 flex items-center justify-between">
                    <span>{platformLabels[p.platform] || p.platform}</span>
                    <strong>{fmtMoney(p.spend)}</strong>
                  </div>
                  <div className="h-1.5 rounded-full bg-zinc-100">
                    <div className={`h-1.5 rounded-full ${platformColors[p.platform] || "bg-indigo-500"}`} style={{ width: `${ratio}%` }} />
                  </div>
                </div>
              );
            })}
            {(!omniStats || omniStats.platforms.length === 0) && (
              <p className="text-xs text-zinc-500 text-center py-4">Veri bulunamadı.</p>
            )}
          </div>
        </SectionCard>

        <SectionCard title="SEO Performansı">
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between"><span>Organik Trafik</span><strong>45,230</strong></li>
            <li className="flex justify-between"><span>İlk Sayfa Kelimeler</span><strong>342</strong></li>
            <li className="flex justify-between"><span>Teknik SEO Skoru</span><strong className="text-emerald-600">87/100</strong></li>
            <li className="flex justify-between"><span>Backlink Sayısı</span><strong>12,400</strong></li>
          </ul>
          <div className="mt-5 border-t pt-4">
            <h3 className="mb-2 text-base font-semibold">Sosyal Medya Etkileşimi</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between"><span>Toplam Etkileşim</span><strong>89,450</strong></li>
              <li className="flex justify-between"><span>Yeni Takipçi</span><strong className="text-emerald-600">+2,340</strong></li>
            </ul>
          </div>
        </SectionCard>

        <SectionCard title="Son Raporlar" action="Tümünü Gör">
          <ul className="space-y-2 text-sm">
            <li className="rounded-lg border p-2">
              <div className="flex items-center justify-between">
                <span>Haftalık Performans Raporu</span>
                <strong className="text-emerald-600">Hazır</strong>
              </div>
              <p className="subtle mt-1 text-xs">28 Mart 2026</p>
            </li>
            <li className="rounded-lg border p-2">
              <div className="flex items-center justify-between">
                <span>Aylık Kampanya Raporu</span>
                <strong className="text-emerald-600">Hazır</strong>
              </div>
              <p className="subtle mt-1 text-xs">1 Mart 2026</p>
            </li>
            <li className="rounded-lg border p-2">
              <div className="flex items-center justify-between">
                <span>Kanal Bazlı Rapor</span>
                <strong className="text-amber-600">Bekliyor</strong>
              </div>
              <p className="subtle mt-1 text-xs">15 Mart 2026</p>
            </li>
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}

function AiAssistantScreen() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Yapay Zeka Asistanı</h1>
          <p className="subtle text-sm">AI destekli öneriler ve otomatik optimizasyonlar</p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-lg border bg-white px-3 py-2 text-sm font-medium">AI Ayarları</button>
          <button className="rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white">Yeni Analiz Başlat</button>
        </div>
      </div>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-base font-semibold">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-rose-50 text-sm text-rose-600">
                📣
              </span>
              Reklam Optimizasyon
            </h3>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">3 Öneri</span>
          </div>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2 rounded-md bg-zinc-100 px-3 py-2"><span className="text-rose-500">↗</span>Google Ads bütçe %15 artır</li>
            <li className="flex items-center gap-2 rounded-md bg-zinc-100 px-3 py-2"><span className="text-rose-500">◎</span>Hedef kitle yaş aralığı daralt</li>
            <li className="flex items-center gap-2 rounded-md bg-zinc-100 px-3 py-2"><span className="text-rose-500">◌</span>Reklam saatlerini optimize et</li>
          </ul>
        </article>
        <article className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-base font-semibold">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-sky-50 text-sm text-sky-600">
                🔎
              </span>
              SEO İçerik Önerileri
            </h3>
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">5 Öneri</span>
          </div>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2 rounded-md bg-zinc-100 px-3 py-2"><span className="text-sky-600">📄</span>Meta açıklama güncelle (12 sayfa)</li>
            <li className="flex items-center gap-2 rounded-md bg-zinc-100 px-3 py-2"><span className="text-sky-600">🔗</span>İç bağlantı yapısını iyileştir</li>
            <li className="flex items-center gap-2 rounded-md bg-zinc-100 px-3 py-2"><span className="text-sky-600">🖼</span>Alt text eksik görseller (8 adet)</li>
          </ul>
        </article>
        <article className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-base font-semibold">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-amber-50 text-sm text-amber-600">
                🔗
              </span>
              Sosyal Medya AI
            </h3>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">4 Öneri</span>
          </div>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2 rounded-md bg-zinc-100 px-3 py-2"><span className="text-amber-600">🗓</span>En iyi paylaşım saatleri öner</li>
            <li className="flex items-center gap-2 rounded-md bg-zinc-100 px-3 py-2"><span className="text-amber-600">#</span>Trend hashtag analizi yap</li>
            <li className="flex items-center gap-2 rounded-md bg-zinc-100 px-3 py-2"><span className="text-amber-600">✎</span>İçerik takvimi otomatik oluştur</li>
          </ul>
        </article>
      </section>

      <div className="grid gap-4 xl:grid-cols-[2.1fr_1fr]">
        <section className="card p-0">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="flex items-center gap-2 text-base font-semibold">
                <span className="text-rose-600">🤖</span>AI Asistan
              </h3>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">Aktif</span>
            </div>
          </div>
          <div className="space-y-3 px-4 py-4">
            <div className="max-w-[78%] rounded-xl bg-rose-50 p-3 text-sm">
              Merhaba! Google Ads kampanyalarınızda CPC maliyetini %12 düşürebilecek 3 optimizasyon fırsatı tespit ettim.
              Detayları incelemek ister misiniz?
              <p className="subtle mt-1 text-xs">14:32</p>
            </div>
            <div className="ml-auto max-w-[45%] rounded-xl bg-zinc-100 p-3 text-sm">
              Evet, lütfen detayları göster.
              <p className="subtle mt-1 text-xs">14:33</p>
            </div>
          </div>
          <div className="border-t p-3">
            <div className="flex items-center gap-2 rounded-xl border px-3 py-2">
              <input
                type="text"
                placeholder="AI asistana bir soru sorun..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
              />
              <button className="rounded-md bg-brand px-2 py-1 text-xs font-semibold text-white">➤</button>
            </div>
          </div>
        </section>

        <div className="space-y-4">
          <section className="card p-4">
            <h3 className="mb-3 flex items-center gap-2 text-base font-semibold"><span className="text-rose-600">✨</span>Haftalık AI Özeti</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between rounded-md bg-rose-50 px-3 py-2"><span>Uygulanan Öneriler</span><strong className="text-rose-600">24/31</strong></li>
              <li className="flex justify-between px-1 py-1"><span>Tahmini Tasarruf</span><strong className="text-emerald-600">₺8,450</strong></li>
              <li className="flex justify-between px-1 py-1"><span>Performans Artışı</span><strong className="text-sky-600">+18.5%</strong></li>
              <li className="flex justify-between px-1 py-1"><span>AI Doğruluk Oranı</span><strong>%94.2</strong></li>
            </ul>
          </section>

          <section className="card p-4">
            <h3 className="mb-3 flex items-center gap-2 text-base font-semibold"><span className="text-rose-600">👥</span>AI Erişim Rolleri</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-500" />
                  <span>Admin</span>
                </div>
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">Tam</span>
              </li>
              <li className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-blue-500" />
                  <span>Pazarlama Müdürü</span>
                </div>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">Yazma</span>
              </li>
              <li className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-amber-500" />
                  <span>İçerik Yöneticisi</span>
                </div>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Okuma</span>
              </li>
              <li className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span>Analist</span>
                </div>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">Görüntüle</span>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

function SettingsScreen() {
  return (
    <div className="space-y-4">
      <PanelTitle title="Ayarlar" description="Panel ayarlari ve kullanici tercihleri" />
      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Hesap">
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between"><span>Kullanici</span><strong>Ahmet Y.</strong></li>
            <li className="flex justify-between"><span>E-posta</span><strong>ahmet@dio.com</strong></li>
            <li className="flex justify-between"><span>Rol</span><strong>Marketing Manager</strong></li>
          </ul>
        </SectionCard>
        <SectionCard title="Bildirimler">
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between"><span>Email Ozeti</span><StatusPill label="Acik" tone="ok" /></li>
            <li className="flex justify-between"><span>Haftalik Rapor</span><StatusPill label="Acik" tone="ok" /></li>
            <li className="flex justify-between"><span>Gercek Zamanli Alarm</span><StatusPill label="Kapali" tone="muted" /></li>
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// İçerik Yönetimi Ekranı — Gerçek Veri
// ──────────────────────────────────────────────

type RealPost = {
  id: number;
  company_id: number;
  title: string;
  content: string;
  platform: string;
  hashtags: string;
  image_url: string;
  status: string;
  created_at: string;
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft: { label: "Taslak", color: "bg-zinc-100 text-zinc-600" },
  ready: { label: "Hazır", color: "bg-emerald-50 text-emerald-600" },
  approved: { label: "Onaylandı", color: "bg-blue-50 text-blue-600" },
  published: { label: "Yayında", color: "bg-emerald-50 text-emerald-600" },
};

const PLATFORM_ICONS: Record<string, string> = {
  Instagram: "📸", TikTok: "🎵", LinkedIn: "💼", "X (Twitter)": "🐦",
  Facebook: "📘", YouTube: "▶️", Website: "🌐",
};

function IcerikScreen({ onNewContent, onOpenStudio }: { onNewContent?: () => void; onOpenStudio?: (postId: number) => void }) {
  const { companies, activeCompany } = useAuth();
  const [posts, setPosts] = useState<RealPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  // Brand filter — "all" = tüm markalar, otherwise company_id
  const [brandFilter, setBrandFilter] = useState<string>(String(activeCompany?.id || "all"));

  // Schedule modal state
  const [scheduleModal, setScheduleModal] = useState<{ open: boolean; postId: number | null; postTitle: string }>({ open: false, postId: null, postTitle: "" });
  const [scheduleDate, setScheduleDate] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleResult, setScheduleResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // İlk açılışta eski AI ideas'ları Posts'a migrate et (session'da 1 kere)
  const [migrated, setMigrated] = useState(false);
  useEffect(() => {
    if (migrated) return;
    api.post("/api/protected/migrate-ideas-to-posts").then(() => {
      setMigrated(true);
    }).catch(() => setMigrated(true));
  }, [migrated]);

  useEffect(() => {
    if (!migrated) return; // migration bitene kadar bekle
    setPostsLoading(true);
    const url = brandFilter === "all"
      ? "/api/protected/posts"
      : `/api/protected/posts?company_id=${brandFilter}`;
    api.get(url)
      .then(({ data }) => setPosts(data.posts || []))
      .catch(() => setPosts([]))
      .finally(() => setPostsLoading(false));
  }, [brandFilter, migrated]);

  const filtered = statusFilter === "all" ? posts : posts.filter((p) => p.status === statusFilter);

  // Brand name lookup helper
  const getBrandName = (companyId: number) => companies.find((c) => c.id === companyId)?.name || "";

  // Stats
  const stats = [
    { title: "Toplam İçerik", value: String(posts.length), delta: "" },
    { title: "Hazır", value: String(posts.filter((p) => p.status === "ready").length), delta: "" },
    { title: "Onaylı", value: String(posts.filter((p) => p.status === "approved").length), delta: "" },
    { title: "Taslak", value: String(posts.filter((p) => p.status === "draft").length), delta: "" },
  ];

  const openScheduleModal = (postId: number, postTitle: string) => {
    setScheduleDate(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
    setScheduleResult(null);
    setScheduleModal({ open: true, postId, postTitle });
  };

  const closeScheduleModal = () => {
    setScheduleModal({ open: false, postId: null, postTitle: "" });
    setScheduleResult(null);
  };

  const handleScheduleSubmit = async () => {
    if (!scheduleModal.postId || !scheduleDate) return;
    setScheduleLoading(true);
    setScheduleResult(null);
    try {
      await api.post("/api/protected/schedules", {
        post_id: scheduleModal.postId,
        scheduled_at: new Date(scheduleDate).toISOString(),
      });
      setScheduleResult({ type: "success", message: "İçerik başarıyla takvime eklendi!" });
      setTimeout(closeScheduleModal, 1500);
    } catch {
      setScheduleResult({ type: "error", message: "Bu post zaten takvimde veya bir hata oluştu." });
    } finally {
      setScheduleLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">İçerik Yönetimi</h1>
          <p className="subtle text-sm">
            {brandFilter === "all"
              ? "Tüm markalarınızın içeriklerini yönetin"
              : `${getBrandName(Number(brandFilter))} markasının içeriklerini yönetin`}
          </p>
        </div>
        <button
          onClick={onNewContent}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm shadow-brand/20 transition hover:shadow-md"
        >
          + Yeni İçerik
        </button>
      </div>

      {/* Brand Filter + Status Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Status tabs */}
        <div className="flex flex-wrap gap-2">
          {[{ id: "all", label: "Tümü" }, { id: "draft", label: "Taslak" }, { id: "approved", label: "Onaylı" }, { id: "ready", label: "Hazır" }].map((f) => (
            <button key={f.id} type="button" onClick={() => setStatusFilter(f.id)}
              className={`rounded-lg border px-3 py-2 text-sm transition-all ${statusFilter === f.id ? "border-brand bg-brand/5 font-semibold text-brand" : "border-zinc-200 bg-white text-foreground hover:border-zinc-300 hover:bg-zinc-50"}`}
            >{f.label}</button>
          ))}
        </div>

        {/* Brand filter */}
        {companies.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted">Marka:</span>
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
            >
              <option value="all">🏢 Tüm Markalar</option>
              {companies.map((c) => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((item) => (
          <article className="card p-4" key={item.title}>
            <p className="subtle text-xs">{item.title}</p>
            <p className="mt-1 text-xl sm:text-2xl lg:text-3xl font-semibold leading-tight truncate">{item.value}</p>
          </article>
        ))}
      </section>

      {/* Posts Grid */}
      {postsLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-brand" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-5xl mb-3 opacity-30">📝</span>
          <p className="text-sm font-medium text-foreground">Henüz içerik yok</p>
          <p className="mt-1 text-xs text-muted">&quot;+ Yeni İçerik&quot; butonu ile AI destekli içerik üretmeye başlayın</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((post) => {
            const st = STATUS_MAP[post.status] || { label: post.status, color: "bg-zinc-100 text-zinc-600" };
            const icon = PLATFORM_ICONS[post.platform] || "📝";
            const brandName = getBrandName(post.company_id);
            return (
              <article key={post.id} className="card group relative overflow-hidden p-4 transition-all duration-200 hover:shadow-md hover:border-zinc-300">
                <div className="mb-3 h-36 rounded-lg overflow-hidden bg-gradient-to-br from-zinc-100 to-zinc-50 flex items-center justify-center">
                  {post.image_url ? (
                    <img src={post.image_url.startsWith("/") ? `${process.env.NEXT_PUBLIC_API_URL}${post.image_url}` : post.image_url} alt={post.title} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-4xl opacity-30">🖼️</span>
                  )}
                </div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-sm">{icon}</span>
                  <span className="text-xs font-medium text-muted">{post.platform}</span>
                  <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold ${st.color}`}>{st.label}</span>
                </div>
                <h3 className="text-sm font-semibold text-foreground line-clamp-1">{post.title}</h3>
                <p className="mt-1 text-xs text-muted line-clamp-2 leading-relaxed">{post.content}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[11px] text-muted">{new Date(post.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}</span>
                  {brandFilter === "all" && brandName && (
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-500">{brandName}</span>
                  )}
                </div>
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 rounded-xl">
                  <button
                    onClick={() => onOpenStudio?.(post.id)}
                    className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-foreground shadow-lg transition hover:bg-zinc-50"
                  >
                    🎨 Stüdyoyu Aç
                  </button>
                  <button
                    onClick={() => openScheduleModal(post.id, post.title)}
                    className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-foreground shadow-lg transition hover:bg-zinc-50"
                  >
                    📅
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ════════ Schedule Modal ════════ */}
      {scheduleModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={closeScheduleModal}>
          <div
            className="w-full max-w-md animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card overflow-hidden shadow-2xl">
              {/* Modal header */}
              <div className="relative bg-gradient-to-br from-brand/10 via-transparent to-brand-light/5 px-6 pt-6 pb-4">
                <button
                  onClick={closeScheduleModal}
                  className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-zinc-100 hover:text-foreground"
                >
                  ✕
                </button>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-xl">
                    📅
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">İçerik Planla</h3>
                    <p className="text-xs text-muted">Takvime eklemek için tarih seçin</p>
                  </div>
                </div>
              </div>

              {/* Modal body */}
              <div className="px-6 py-5 space-y-4">
                {/* Post title preview */}
                <div className="rounded-lg bg-zinc-50 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-1">İçerik</p>
                  <p className="text-sm font-medium text-foreground line-clamp-1">{scheduleModal.postTitle}</p>
                </div>

                {/* Date input */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground">Planlama Tarihi</label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 10)}
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/10"
                  />
                </div>

                {/* Result message */}
                {scheduleResult && (
                  <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium ${
                    scheduleResult.type === "success"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-rose-50 text-rose-700 border border-rose-200"
                  }`}>
                    <span>{scheduleResult.type === "success" ? "✅" : "⚠️"}</span>
                    {scheduleResult.message}
                  </div>
                )}
              </div>

              {/* Modal footer */}
              <div className="flex gap-3 border-t border-zinc-100 bg-zinc-50/50 px-6 py-4">
                <button
                  onClick={closeScheduleModal}
                  className="flex-1 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-zinc-50 hover:border-zinc-300"
                >
                  İptal
                </button>
                <button
                  onClick={handleScheduleSubmit}
                  disabled={scheduleLoading || !scheduleDate || scheduleResult?.type === "success"}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand to-brand-dark px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand/20 transition hover:shadow-md disabled:opacity-50"
                >
                  {scheduleLoading ? (
                    <>
                      <span className="spinner" style={{ width: 16, height: 16 }} /> Ekleniyor...
                    </>
                  ) : scheduleResult?.type === "success" ? (
                    <>✅ Eklendi</>
                  ) : (
                    <>📅 Takvime Ekle</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ──────────────────────────────────────────────
// Ekip Yönetimi Ekranı
// ──────────────────────────────────────────────

const ROLE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  owner:  { label: "Sahip",         color: "bg-amber-50 text-amber-700 border-amber-200",    icon: "👑" },
  admin:  { label: "Admin",         color: "bg-purple-50 text-purple-700 border-purple-200",  icon: "🛡️" },
  member: { label: "Ekip Üyesi",    color: "bg-blue-50 text-blue-700 border-blue-200",       icon: "👤" },
  client: { label: "Müşteri",       color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: "🤝" },
  viewer: { label: "Görüntüleyici", color: "bg-zinc-50 text-zinc-600 border-zinc-200",       icon: "👁️" },
};

const ROLE_OPTIONS = [
  { value: "admin",  label: "🛡️ Admin",         desc: "Tam yetki — marka ayarlarını düzenleyebilir" },
  { value: "member", label: "👤 Ekip Üyesi",    desc: "İçerik oluşturabilir ve düzenleyebilir" },
  { value: "client", label: "🤝 Müşteri",       desc: "İçerikleri görüp onaylayabilir" },
  { value: "viewer", label: "👁️ Görüntüleyici", desc: "Sadece okuma yetkisi" },
];

type TeamMember = {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  created_at: string;
};

function EkipScreen() {
  const { activeCompany } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // ── Form state ──
  const [fFirst, setFFirst] = useState("");
  const [fLast, setFLast] = useState("");
  const [fEmail, setFEmail] = useState("");
  const [fPassword, setFPassword] = useState("");
  const [fRole, setFRole] = useState("member");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchMembers = () => {
    if (!activeCompany) return;
    setLoading(true);
    api.get(`/api/protected/team?company_id=${activeCompany.id}`)
      .then(({ data }) => setMembers(data.members || []))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchMembers(); }, [activeCompany]);

  const resetForm = () => {
    setFFirst(""); setFLast(""); setFEmail("");
    setFPassword(""); setFRole("member"); setFormError("");
  };

  const handleAdd = async () => {
    if (!activeCompany) return;
    if (!fFirst.trim() || !fEmail.trim() || !fPassword.trim()) {
      setFormError("Lütfen zorunlu alanları doldurun");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      await api.post("/api/protected/team/add", {
        company_id: activeCompany.id,
        first_name: fFirst.trim(),
        last_name: fLast.trim(),
        email: fEmail.trim(),
        password: fPassword,
        role: fRole,
      });
      resetForm();
      setShowModal(false);
      fetchMembers();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : "Ekip üyesi eklenemedi";
      setFormError(msg || "Bir hata oluştu");
    } finally { setSaving(false); }
  };

  const inputCls = "w-full rounded-lg border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/10";
  const labelCls = "mb-1.5 block text-xs font-semibold text-foreground";

  // Stats
  const adminCount  = members.filter(m => m.role === "admin" || m.role === "owner").length;
  const memberCount = members.filter(m => m.role === "member").length;
  const clientCount = members.filter(m => m.role === "client").length;
  const viewerCount = members.filter(m => m.role === "viewer").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ekip Yönetimi</h1>
          <p className="subtle text-sm">
            {activeCompany?.name || ""} markasının ekip üyelerini yönetin
          </p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }}
          className="rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-brand/20 transition hover:shadow-md"
        >
          + Yeni Üye Ekle
        </button>
      </div>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { title: "Toplam Üye", value: String(members.length), icon: "👥" },
          { title: "Admin / Sahip", value: String(adminCount), icon: "🛡️" },
          { title: "Ekip Üyesi", value: String(memberCount), icon: "👤" },
          { title: "Müşteri / İzleyici", value: String(clientCount + viewerCount), icon: "🤝" },
        ].map((item) => (
          <article className="card p-4" key={item.title}>
            <div className="flex items-center justify-between">
              <p className="subtle text-xs">{item.title}</p>
              <span className="text-lg">{item.icon}</span>
            </div>
            <p className="mt-1 text-xl sm:text-2xl lg:text-3xl font-semibold leading-tight truncate">{item.value}</p>
          </article>
        ))}
      </section>

      {/* Members list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-brand" />
        </div>
      ) : members.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-50 border border-zinc-100">
            <UserGroupIcon className="h-8 w-8 text-zinc-300" />
          </div>
          <p className="text-sm font-medium text-foreground">Henüz ekip üyesi yok</p>
          <p className="mt-1 text-xs text-muted">&quot;+ Yeni Üye Ekle&quot; butonu ile ekibinize kişi ekleyin</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid md:grid-cols-[1fr_1fr_1fr_120px] gap-4 border-b border-zinc-100 bg-zinc-50/50 px-5 py-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Üye</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">E-posta</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Rol</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Katılım</span>
          </div>
          {/* Table rows */}
          {members.map((m) => {
            const role = ROLE_LABELS[m.role] || ROLE_LABELS.member;
            const initials = `${m.first_name?.[0] || ""}${m.last_name?.[0] || ""}`.toUpperCase();
            return (
              <div key={m.id || m.user_id}
                className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_120px] gap-2 md:gap-4 items-center border-b border-zinc-50 px-5 py-4 transition hover:bg-zinc-50/50 last:border-b-0"
              >
                {/* Name + avatar */}
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand/10 to-brand-light/10 text-xs font-bold text-brand">
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{m.first_name} {m.last_name}</p>
                    <p className="text-[11px] text-muted md:hidden">{m.email}</p>
                  </div>
                </div>

                {/* Email — hidden on mobile, shown in name block */}
                <p className="hidden md:block text-sm text-muted truncate">{m.email}</p>

                {/* Role badge */}
                <div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${role.color}`}>
                    <span>{role.icon}</span>
                    {role.label}
                  </span>
                </div>

                {/* Date */}
                <p className="text-xs text-muted">
                  {new Date(m.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* ════════ Add Member Modal ════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg">
            <div className="card overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/30 px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Yeni Ekip Üyesi</h2>
                  <p className="mt-0.5 text-xs text-muted">{activeCompany?.name} markasına üye ekleyin</p>
                </div>
                <button onClick={() => setShowModal(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-zinc-100 hover:text-foreground"
                >✕</button>
              </div>

              {/* Form */}
              <div className="space-y-4 p-6">
                {formError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">⚠️ {formError}</div>
                )}

                {/* Name row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Ad *</label>
                    <input value={fFirst} onChange={e => setFFirst(e.target.value)} placeholder="Ahmet" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Soyad</label>
                    <input value={fLast} onChange={e => setFLast(e.target.value)} placeholder="Yılmaz" className={inputCls} />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>E-posta *</label>
                  <input type="email" value={fEmail} onChange={e => setFEmail(e.target.value)} placeholder="ahmet@firma.com" className={inputCls} />
                </div>

                <div>
                  <label className={labelCls}>Geçici Şifre *</label>
                  <input type="text" value={fPassword} onChange={e => setFPassword(e.target.value)} placeholder="Min 6 karakter" className={inputCls} />
                  <p className="mt-1 text-[10px] text-muted">Kullanıcıya bu şifre ile giriş yapması iletilecek</p>
                </div>

                {/* Role selector */}
                <div>
                  <label className={labelCls}>Rol *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ROLE_OPTIONS.map((r) => (
                      <button key={r.value} type="button" onClick={() => setFRole(r.value)}
                        className={`rounded-lg border p-3 text-left transition-all ${
                          fRole === r.value
                            ? "border-brand bg-brand/5 ring-2 ring-brand/10"
                            : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
                        }`}
                      >
                        <span className="block text-sm font-semibold">{r.label}</span>
                        <span className="mt-0.5 block text-[10px] text-muted leading-tight">{r.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 border-t border-zinc-100 bg-zinc-50/30 px-6 py-4">
                <button onClick={() => { setShowModal(false); resetForm(); }}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-zinc-50"
                >İptal</button>
                <button onClick={handleAdd} disabled={saving || !fFirst.trim() || !fEmail.trim() || !fPassword.trim()}
                  className="rounded-lg bg-brand px-5 py-2 text-sm font-medium text-white shadow-sm shadow-brand/20 transition hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <span className="flex items-center gap-2"><span className="spinner" /> Ekleniyor...</span>
                  ) : "Üyeyi Ekle"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Firma ve Markalar Ekranı (Ajans Modeli)
// ──────────────────────────────────────────────

const SECTOR_LABELS: Record<string, string> = {
  moda: "Moda & Giyim", yiyecek: "Yiyecek & İçecek", guzellik: "Güzellik & Bakım",
  saglik: "Sağlık & Yaşam", ev: "Ev & Yaşam Alanı", teknoloji: "Teknoloji & Hizmet",
  egitim: "Eğitim & Kültür", finans: "Finans & Sigorta", turizm: "Turizm & Konaklama",
};

const TONE_OPTIONS = [
  { value: "", label: "Seçiniz" },
  { value: "samimi", label: "🤝 Samimi" },
  { value: "kurumsal", label: "🏛️ Kurumsal" },
  { value: "esprili", label: "😄 Esprili" },
  { value: "ilham-verici", label: "✨ İlham Verici" },
  { value: "bilgilendirici", label: "📚 Bilgilendirici" },
  { value: "lüks", label: "💎 Lüks / Premium" },
  { value: "genc", label: "🚀 Genç / Dinamik" },
];

const inputCls = "w-full rounded-lg border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/10";
const labelCls = "mb-1.5 block text-xs font-semibold text-foreground";
const sectionTitleCls = "mb-3 flex items-center gap-2 text-sm font-semibold text-foreground border-b border-zinc-100 pb-2";

function ProfilScreen() {
  const { user, companies, activeCompany, setActiveCompany, refreshCompanies } = useAuth();

  // ── Form state ──
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Basic
  const [fName, setFName] = useState("");
  const [fSector, setFSector] = useState("");
  const [fWebsite, setFWebsite] = useState("");
  const [fLang, setFLang] = useState("tr");
  // AI context
  const [fDescription, setFDescription] = useState("");
  const [fTarget, setFTarget] = useState("");
  const [fSlogan, setFSlogan] = useState("");
  const [fForbidden, setFForbidden] = useState("");
  const [fTone, setFTone] = useState("");
  // Logo
  const [fLogoFile, setFLogoFile] = useState<File | null>(null);
  const [fLogoPreview, setFLogoPreview] = useState("");
  // Brand colors
  const [fColors, setFColors] = useState<string[]>([]);
  const [colorInput, setColorInput] = useState("#E11D48");
  // Advanced Brand Settings
  const [fBrandType, setFBrandType] = useState("");
  const [fBrandFont, setFBrandFont] = useState("Inter");
  const [fSocials, setFSocials] = useState({ instagram: "", twitter: "", linkedin: "", youtube: "", tiktok: "" });
  const [fTargetGenders, setFTargetGenders] = useState<string[]>([]);
  const [fTargetAges, setFTargetAges] = useState<string[]>([]);
  // UI states
  const [descLoading, setDescLoading] = useState(false);
  const [colorExtracting, setColorExtracting] = useState(false);

  // Detail view
  const [detailBrand, setDetailBrand] = useState<typeof companies[0] | null>(null);
  // Edit mode (null = create new, number = editing existing)
  const [editingBrandId, setEditingBrandId] = useState<number | null>(null);

  // Detail View Competitors Management
  const [detailCompetitors, setDetailCompetitors] = useState<{id?: number, name: string, website: string}[]>([]);
  const [newDetailCompName, setNewDetailCompName] = useState("");
  const [newDetailCompWeb, setNewDetailCompWeb] = useState("");

  const handleAddCompetitor = async () => {
    if (!newDetailCompName.trim() || !editingBrandId) return;
    try {
      await api.post(`/api/protected/companies/${editingBrandId}/competitors`, [{ name: newDetailCompName, website: newDetailCompWeb }]);
      setNewDetailCompName(""); setNewDetailCompWeb("");
      await refreshCompanies();
      const { data } = await api.get(`/api/protected/companies/${editingBrandId}/competitors`);
      setDetailCompetitors(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCompetitor = async (compId: number) => {
    if (!editingBrandId) return;
    try {
      await api.delete(`/api/protected/companies/${editingBrandId}/competitors/${compId}`);
      await refreshCompanies();
      const { data } = await api.get(`/api/protected/companies/${editingBrandId}/competitors`);
      setDetailCompetitors(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (editingBrandId && companies) {
      const br = companies.find((c: any) => c.id === editingBrandId);
      if (br) setDetailCompetitors(br.competitors || []);
    } else {
      setDetailCompetitors([]);
      setNewDetailCompName("");
      setNewDetailCompWeb("");
    }
  }, [editingBrandId, companies]);

  const resetForm = () => {
    setFName(""); setFSector(""); setFWebsite(""); setFLang("tr");
    setFDescription(""); setFTarget(""); setFSlogan(""); setFForbidden(""); setFTone("");
    setFLogoFile(null); setFLogoPreview(""); setFColors([]); setColorInput("#E11D48");
    setFBrandType(""); setFBrandFont("Inter"); setFSocials({ instagram: "", twitter: "", linkedin: "", youtube: "", tiktok: "" });
    setFTargetGenders([]); setFTargetAges([]);
    setSaveError("");
    setEditingBrandId(null);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      setFLogoPreview(src);
      // Extract ALL brand colors from logo
      setColorExtracting(true);
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = src;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width; canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        if (ctx) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const pixels = imageData.data;
          
          // Tüm pikselleri tara (performans için her 4. piksel)
          const colorMap: Record<string, number> = {};
          const step = 4; // Her 4 pikselden biri
          for (let i = 0; i < pixels.length; i += 4 * step) {
            const r = pixels[i], g = pixels[i+1], b = pixels[i+2], a = pixels[i+3];
            // Transparan pikselleri atla
            if (a < 128) continue;
            // Siyah, beyaz ve gri tonlarını atla
            const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
            if (brightness > 240 || brightness < 15) continue; // Beyaz/siyaha çok yakın
            const saturation = Math.max(r, g, b) - Math.min(r, g, b);
            if (saturation < 20 && brightness > 50 && brightness < 200) continue; // Gri tonları
            
            // 8'e yuvarlayarak benzer renkleri grupla
            const qr = Math.round(r / 8) * 8;
            const qg = Math.round(g / 8) * 8;
            const qb = Math.round(b / 8) * 8;
            const hex = "#" + [qr,qg,qb].map(x => Math.min(255, Math.max(0, x)).toString(16).padStart(2,'0')).join('');
            colorMap[hex] = (colorMap[hex] || 0) + 1;
          }
          
          // Frekansa göre sırala
          const sorted = Object.entries(colorMap).sort((a, b) => b[1] - a[1]);
          
          // Benzer renkleri birleştir (Euclidean distance < 60)
          const hexToRgb = (hex: string) => {
            const n = parseInt(hex.slice(1), 16);
            return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
          };
          const colorDist = (c1: number[], c2: number[]) => 
            Math.sqrt((c1[0]-c2[0])**2 + (c1[1]-c2[1])**2 + (c1[2]-c2[2])**2);
          
          const distinctColors: string[] = [];
          for (const [color] of sorted) {
            if (distinctColors.length >= 5) break;
            const rgb = hexToRgb(color);
            const tooSimilar = distinctColors.some(existing => 
              colorDist(rgb, hexToRgb(existing)) < 60
            );
            if (!tooSimilar) distinctColors.push(color);
          }
          
          if (distinctColors.length > 0) {
            // Mevcut renklere ekle, duplike olmayanları
            const merged = [...fColors];
            for (const c of distinctColors) {
              if (!merged.some(existing => {
                const d = colorDist(hexToRgb(c), hexToRgb(existing));
                return d < 40; // Çok benzer olanları ekleme
              })) {
                merged.push(c);
              }
            }
            setFColors(merged.slice(0, 5)); // Max 5 renk
          }
        }
        setColorExtracting(false);
      };
    };
    reader.readAsDataURL(file);
  };

  const addColor = () => {
    if (fColors.length >= 5) return;
    if (!fColors.includes(colorInput)) setFColors([...fColors, colorInput]);
  };
  const removeColor = (idx: number) => setFColors(fColors.filter((_, i) => i !== idx));

  const handleSaveBrand = async () => {
    if (!fName.trim()) return;
    setSaving(true);
    setSaveError("");

    try {
      const fd = new FormData();
      fd.append("name", fName.trim());
      if (fSector) fd.append("sector", fSector);
      if (fWebsite) fd.append("website", fWebsite);
      fd.append("content_language", fLang);
      if (fDescription) fd.append("description", fDescription);
      
      // Pack advanced target audience into JSON
      const targetObj = { text: fTarget, genders: fTargetGenders, ages: fTargetAges };
      fd.append("target_audience", JSON.stringify(targetObj));
      
      if (fSlogan) fd.append("slogan", fSlogan);
      if (fForbidden) fd.append("forbidden_words", fForbidden);
      if (fTone) fd.append("tone_of_voice", fTone);
      if (fColors.length > 0) fd.append("brand_colors", JSON.stringify(fColors));
      if (fBrandType) fd.append("brand_type", fBrandType);
      if (fBrandFont) fd.append("brand_font", fBrandFont);
      fd.append("social_media", JSON.stringify(fSocials));
      if (fLogoFile) fd.append("logo", fLogoFile);

      if (editingBrandId) {
        // UPDATE existing brand
        await api.put(`/api/protected/companies/${editingBrandId}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        // CREATE new brand
        const { data } = await api.post("/api/protected/companies", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (data.company) setActiveCompany(data.company);
      }

      await refreshCompanies();
      setShowForm(false);
      resetForm();
    } catch {
      setSaveError(editingBrandId ? "Marka güncellenemedi. Lütfen tekrar deneyin." : "Marka oluşturulamadı. Lütfen tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateDesc = async () => {
    if (!fName && !fWebsite) {
      setSaveError("Marka açıklaması oluşturmak için Marka Adı veya Web Sitesi alanlarını doldurun.");
      return;
    }
    setDescLoading(true); setSaveError("");
    try {
      const { data } = await api.post("/api/protected/generate-description", {
        company_name: fName,
        website: fWebsite,
        sector: fSector,
        slogan: fSlogan,
      });
      if (data.description) setFDescription(data.description);
    } catch {
      setSaveError("Açıklama üretilirken hata oluştu.");
    } finally { setDescLoading(false); }
  };

  const fullName = user ? [user.first_name, user.last_name].filter(Boolean).join(" ") : "Kullanıcı";
  const initials = user ? [user.first_name?.[0], user.last_name?.[0]].filter(Boolean).join("").toUpperCase() : "U";

  if (detailBrand) {
    return (
      <BrandProfileDetail 
        brand={detailBrand} 
        onBack={() => setDetailBrand(null)}
        onEdit={() => {
          const parsedTA2 = (() => { try { return JSON.parse(detailBrand.target_audience || "{}"); } catch { return {}; } })();
          const parsedColors2: string[] = (() => { try { return JSON.parse(detailBrand.brand_colors || "[]"); } catch { return []; } })();
          const parsedSocials2 = (() => { try { return JSON.parse(detailBrand.social_media || "{}"); } catch { return {}; } })();
          setFName(detailBrand.name || "");
          setFSector(detailBrand.sector || "");
          setFWebsite(detailBrand.website || "");
          setFLang(detailBrand.content_language || "tr");
          setFDescription(detailBrand.description || "");
          setFTarget(parsedTA2.text || "");
          setFSlogan(detailBrand.slogan || "");
          setFForbidden(detailBrand.forbidden_words || "");
          setFTone(detailBrand.tone_of_voice || "");
          setFColors(parsedColors2);
          setFBrandType(detailBrand.brand_type || "");
          setFBrandFont(detailBrand.brand_font || "Inter");
          setFTargetGenders(parsedTA2.genders || []);
          setFTargetAges(parsedTA2.ages || []);
          setFSocials({ instagram: parsedSocials2.instagram || "", twitter: parsedSocials2.twitter || "", linkedin: parsedSocials2.linkedin || "", youtube: parsedSocials2.youtube || "", tiktok: parsedSocials2.tiktok || "" });
          if (detailBrand.logo_url) setFLogoPreview(`${process.env.NEXT_PUBLIC_API_URL}${detailBrand.logo_url}`);
          setEditingBrandId(detailBrand.id);
          setDetailBrand(null);
          setShowForm(true);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <BuildingLibraryIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Firma ve Markalar</h1>
            <p className="subtle text-sm">Firmanızı ve yönettiğiniz markaları görüntüleyin</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm shadow-brand/20 transition hover:shadow-md"
        >
          + Yeni Marka Ekle
        </button>
      </div>

      {/* ═══════ Firma Bilgileri ═══════ */}
      <SectionCard title="Firma Bilgileri (Ajans)">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-dark text-xl font-bold text-white shadow-md shadow-brand/25">
            {initials}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{fullName}</h2>
            <p className="text-sm text-muted">{user?.email}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Aktif
              </span>
              <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[10px] font-semibold text-zinc-600">
                {companies.length} Marka
              </span>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ═══════ Yönetilen Markalar ═══════ */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Yönetilen Markalar</h2>
        {companies.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-50 border border-zinc-100">
              <IdentificationIcon className="h-8 w-8 text-zinc-300" />
            </div>
            <p className="text-sm font-medium text-foreground">Henüz marka eklenmemiş</p>
            <p className="mt-1 text-xs text-muted">&quot;+ Yeni Marka Ekle&quot; butonu ile ilk markanızı oluşturun</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {companies.map((brand) => {
              const isActive = activeCompany?.id === brand.id;
              const colors: string[] = (() => { try { return JSON.parse(brand.brand_colors || "[]"); } catch { return []; } })();
              return (
                <article
                  key={brand.id}
                  className={`card group relative overflow-hidden p-4 transition-all duration-200 hover:shadow-md cursor-pointer ${
                    isActive ? "ring-2 ring-brand border-brand/30" : "hover:border-zinc-300"
                  }`}
                  onClick={() => { setActiveCompany(brand); }}
                >
                  {isActive && (
                    <span className="absolute right-3 top-3 rounded-full bg-brand px-2 py-0.5 text-[9px] font-bold text-white">AKTİF</span>
                  )}
                  <div className="flex items-center gap-3 mb-3">
                    {brand.logo_url ? (
                      <img src={`${process.env.NEXT_PUBLIC_API_URL}${brand.logo_url}`} alt={brand.name} className="h-12 w-12 rounded-xl border border-zinc-200 object-cover shadow-sm" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-50 border border-zinc-200 shadow-sm">
                        <span className="text-lg font-bold text-zinc-400">{brand.name[0]?.toUpperCase()}</span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-foreground truncate">{brand.name}</h3>
                      <p className="text-[11px] text-muted">{SECTOR_LABELS[brand.sector] || brand.sector || "Sektör belirtilmemiş"}</p>
                    </div>
                  </div>
                  {colors.length > 0 && (
                    <div className="mb-3 flex gap-1">
                      {colors.slice(0, 5).map((c, i) => (
                        <div key={i} className="h-4 w-4 rounded-md border border-zinc-200" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[11px] text-muted">
                    <span>{brand.website || "Web sitesi yok"}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDetailBrand(brand); }}
                      className="font-medium text-brand opacity-0 transition group-hover:opacity-100 hover:underline"
                    >
                      Detaylar →
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════
          KAPSAMLI YENİ MARKA MODAL
          ═══════════════════════════════════════════════ */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="card overflow-hidden shadow-2xl">
              {/* Modal Header */}
              <div className="sticky top-0 z-10 border-b px-6 py-4 bg-white/95 backdrop-blur-sm bg-gradient-to-r from-brand/5 to-transparent">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{editingBrandId ? "✏️ Markayı Düzenle" : "✨ Yeni Marka Ekle"}</h2>
                    <p className="mt-1 text-xs text-muted">{editingBrandId ? "Marka bilgilerini güncelleyin" : "Marka bilgilerini eksiksiz doldurun — AI içerik üretiminde kullanılacak"}</p>
                  </div>
                  <button onClick={() => { setShowForm(false); resetForm(); }} className="text-muted hover:text-foreground transition text-lg p-1">✕</button>
                </div>
              </div>

              <div className="space-y-8 p-6">
                {saveError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2"><span>⚠️</span>{saveError}</div>}

                {/* ── LOGO ── */}
                <div>
                  <p className={sectionTitleCls}><PhotoIcon className="w-5 h-5 text-brand" /> Marka Logosu</p>
                  <div className="flex items-center gap-4">
                    {fLogoPreview ? (
                      <img src={fLogoPreview} alt="Preview" className="h-20 w-20 rounded-2xl border border-zinc-200 object-cover shadow-sm" />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-zinc-50 border-2 border-dashed border-zinc-200">
                        <span className="text-2xl text-zinc-300">🖼️</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-zinc-50 hover:border-zinc-300">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        Logo Yükle
                        <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                      </label>
                      <p className="mt-1.5 text-[11px] text-muted">PNG, JPG, WebP — Max 5MB</p>
                    </div>
                  </div>
                </div>

                {/* ── TEMEL BİLGİLER ── */}
                <div>
                  <p className={sectionTitleCls}><BuildingOffice2Icon className="w-5 h-5 text-brand" /> Temel Bilgiler</p>
                  <div className="grid gap-4 mt-4">
                    <div>
                      <label className={labelCls}>Marka Adı <span className="text-red-500">*</span></label>
                      <input type="text" value={fName} onChange={(e) => setFName(e.target.value)} placeholder="Örn: Acme Corp" autoFocus className={inputCls} />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className={labelCls}><TagIcon className="w-3.5 h-3.5 inline mr-1 text-muted" />Marka Tipi</label>
                        <CustomSelect 
                          value={fBrandType} 
                          onChange={setFBrandType}
                          options={[
                            { value: "kisisel", label: "Kişisel Marka" },
                            { value: "startup", label: "Startup" },
                            { value: "e-ticaret", label: "E-Ticaret" },
                            { value: "kurumsal", label: "Kurumsal" },
                            { value: "ajans", label: "Ajans / Hizmet" }
                          ]} 
                          placeholder="Marka Tipi Seçin"
                        />
                      </div>
                      <div>
                        <label className={labelCls}><AdjustmentsHorizontalIcon className="w-3.5 h-3.5 inline mr-1 text-muted" />Mevcut Sektör</label>
                        <CustomSelect 
                          value={fSector} 
                          onChange={setFSector}
                          options={Object.entries(SECTOR_LABELS).map(([k, v]) => ({ value: k, label: v }))} 
                          placeholder="Sektör Seçin"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className={labelCls}><LanguageIcon className="w-3.5 h-3.5 inline mr-1 text-muted" />İçerik Dili</label>
                        <CustomSelect 
                          value={fLang} 
                          onChange={setFLang}
                          options={[
                            { value: "tr", label: "🇹🇷 Türkçe" },
                            { value: "en", label: "🇬🇧 İngilizce" },
                            { value: "de", label: "🇩🇪 Almanca" },
                            { value: "fr", label: "🇫🇷 Fransızca" },
                            { value: "ar", label: "🇸🇦 Arapça" }
                          ]} 
                        />
                      </div>
                      <div>
                        <label className={labelCls}><LinkIcon className="w-3.5 h-3.5 inline mr-1 text-muted" />Web Sitesi</label>
                        <input type="url" value={fWebsite} onChange={(e) => setFWebsite(e.target.value)} placeholder="https://..." className={inputCls} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── AI BAĞLAMI ── */}
                <div className="bg-zinc-50/50 -mx-6 px-6 py-6 border-y border-zinc-100">
                  <p className={sectionTitleCls + " border-none"}><SparklesIcon className="w-5 h-5 text-brand" /> AI İçerik Bağlamı</p>
                  <p className="mb-5 text-xs text-muted -mt-3">Bu bilgiler, Yapay Zekanın markanızın karakterini tam olarak anlamasını ve size özel içerikler üretmesini sağlar.</p>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-foreground">Marka Açıklaması</label>
                        <button type="button" onClick={handleGenerateDesc} disabled={descLoading} className="flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-600 transition hover:bg-amber-100 disabled:opacity-50">
                          {descLoading ? <span className="spinner" style={{width:10,height:10}}/> : "✨"} AI ile Oluştur
                        </button>
                      </div>
                      <textarea value={fDescription} onChange={(e) => setFDescription(e.target.value)} rows={4} placeholder="Markanız ne yapar? Vizyonu ve misyonu nedir? Neyi temsil eder?" className={inputCls + " resize-none bg-white"} />
                    </div>
                    <div>
                      <label className={labelCls}>Hedef Kitle</label>
                      <div className="rounded-xl border border-zinc-200 bg-white p-4 space-y-4 shadow-sm">
                        <div>
                          <p className="text-[10px] font-bold uppercase text-muted mb-2">Cinsiyet Grubu</p>
                          <GenderToggle selected={fTargetGenders} onChange={setFTargetGenders} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase text-muted mb-2">Yaş Aralığı</p>
                          <div className="flex flex-wrap gap-2">
                            {["18-24", "25-34", "35-44", "45-54", "55+"].map(a => (
                              <label key={a} className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer">
                                <input type="checkbox" checked={fTargetAges.includes(a)} onChange={(e) => {
                                  if (e.target.checked) setFTargetAges([...fTargetAges, a]);
                                  else setFTargetAges(fTargetAges.filter(x => x !== a));
                                }} className="rounded border-zinc-300 text-brand focus:ring-brand" /> {a}
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className={labelCls}>Slogan / Motto</label>
                        <input type="text" value={fSlogan} onChange={(e) => setFSlogan(e.target.value)} placeholder="Örn: Just Do It" className={inputCls + " bg-white"} />
                      </div>
                      <div>
                        <label className={labelCls}>Marka Üslubu (Tone of Voice)</label>
                        <CustomSelect 
                          value={fTone} 
                          onChange={setFTone}
                          options={TONE_OPTIONS} 
                          placeholder="Üslup Seçin"
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Yasaklı Kelimeler</label>
                      <input type="text" value={fForbidden} onChange={(e) => setFForbidden(e.target.value)} placeholder="Virgülle ayırın: ucuz, kalitesiz" className={inputCls + " bg-white"} />
                      <p className="mt-1 text-[10px] text-muted">AI üretimlerinde geçmemesi gereken kelimeler.</p>
                    </div>
                  </div>
                </div>

                {/* ── SOSYAL MEDYA HESAPLARI ── */}
                <div className="border-t border-zinc-100 pt-6">
                  <p className={sectionTitleCls + " border-none"}><ShareIcon className="w-5 h-5 text-brand" /> Sosyal Medya Hesapları</p>
                  <p className="mb-4 text-xs text-muted -mt-3">Markanıza ait olan platformları seçerek adreslerini girin.</p>
                  <SocialMediaManager socials={fSocials} onChange={setFSocials} />
                </div>

                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                  {/* ── GÖRSEL KİMLİK / FONT ── */}
                  <div>
                    <p className={sectionTitleCls}><ComputerDesktopIcon className="w-5 h-5 text-brand" /> Anagörsel & Tipografi</p>
                    <div className="mt-4">
                      <label className={labelCls}>Marka Ana Fontu</label>
                      <SearchableFontSelect value={fBrandFont} onChange={setFBrandFont} />
                      <p className="mt-2 text-[10px] text-muted leading-relaxed">Studio ve AI görsellerinde varsayılan olarak kullanılır.</p>
                    </div>
                  </div>

                  {/* ── MARKA RENKLERİ ── */}
                  <div>
                    <p className={sectionTitleCls}><PaintBrushIcon className="w-5 h-5 text-brand" /> Marka Renkleri</p>
                    <div className="mt-4">
                      <div className="flex items-center gap-3">
                        <div className="relative group flex items-center shrink-0">
                          <input
                            type="color"
                            value={colorInput}
                            onChange={(e) => setColorInput(e.target.value)}
                            className="absolute opacity-0 inset-0 w-full h-full cursor-pointer z-10"
                          />
                          <div className="h-10 w-10 cursor-pointer rounded-[10px] border border-zinc-200 shadow-sm" style={{ backgroundColor: colorInput }} />
                        </div>
                        <input type="text" value={colorInput} onChange={(e) => setColorInput(e.target.value)} className={inputCls + " flex-1 font-mono text-xs"} placeholder="#Hex" />
                        <button
                          onClick={addColor}
                          disabled={fColors.length >= 5}
                          className="shrink-0 rounded-lg border border-brand/20 bg-brand/5 px-3 py-2 text-xs font-semibold text-brand transition hover:bg-brand/10 disabled:opacity-40 whitespace-nowrap"
                        >
                          + Ekle
                        </button>
                      </div>
                      <p className="mt-1.5 mb-3 text-[10px] text-muted">{fColors.length}/5 Eklendi</p>
                    </div>
                    {fColors.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {fColors.map((c, i) => (
                          <div key={i} className="group relative flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 shadow-sm transition hover:border-zinc-300">
                            <div className="h-4 w-4 rounded-md border border-zinc-300 shadow-inner" style={{ backgroundColor: c }} />
                            <span className="text-[11px] font-mono font-medium text-foreground">{c.toUpperCase()}</span>
                            <button onClick={() => removeColor(i)} className="ml-1 text-zinc-400 hover:text-red-500 transition text-sm leading-none flex items-center justify-center p-0.5" title="Kaldır">&times;</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {/* ── RAKİP YÖNETİMİ ── */}
                <div className="border-t border-zinc-100 pt-6">
                  <p className={sectionTitleCls + " border-none"}><UsersIcon className="w-5 h-5 text-brand" /> Rakip Yönetimi</p>
                  {editingBrandId ? (
                    <>
                      <p className="mb-4 text-xs text-muted -mt-3">Aşağıya eklediğiniz rakipler doğrudan AI analizine dahil edilir.</p>
                      
                      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <input className={inputCls} placeholder="Rakip Adı (Örn: Apple)" value={newDetailCompName} onChange={e => setNewDetailCompName(e.target.value)} />
                        <div className="flex gap-2">
                          <input className={inputCls + " flex-1"} placeholder="Web sitesi (Opsiyonel)" value={newDetailCompWeb} onChange={e => setNewDetailCompWeb(e.target.value)} />
                          <button type="button" onClick={handleAddCompetitor} disabled={!newDetailCompName.trim()} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50">Ekle</button>
                        </div>
                      </div>

                      {detailCompetitors && detailCompetitors.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {detailCompetitors.map((comp, idx) => (
                            <div key={comp.id || idx} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-3 shadow-sm transition hover:border-zinc-300">
                              <div className="flex flex-col min-w-0">
                                <span className="text-sm font-semibold text-foreground truncate">{comp.name}</span>
                                {comp.website && <span className="text-[11px] text-brand truncate">{comp.website}</span>}
                              </div>
                              {comp.id && (
                                <button type="button" onClick={() => handleDeleteCompetitor(comp.id!)} className="ml-2 text-red-500 hover:text-red-700 text-xs font-semibold px-2 py-1 bg-red-50 rounded-md border border-red-100 hover:bg-red-100 transition">
                                  Sil
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted">Henüz rakip eklenmemiş. Rakip ekleyerek yapay zekanın sizi daha iyi anlamasını sağlayabilirsiniz.</p>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-muted -mt-2 bg-slate-50 p-3 rounded-lg border border-dashed border-slate-200">
                      Rakiplerinizi eklemek ve yapay zeka analizi başlatmak için önce detayları kaydedip markanızı oluşturun. Ardından Markayı Düzenle penceresinden rakiplerinizi tanımlayabilirsiniz.
                    </p>
                  )}
                </div>

              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 flex gap-3 border-t bg-white px-6 py-4">
                <button onClick={() => { setShowForm(false); resetForm(); }} className="flex-1 rounded-lg border border-zinc-200 py-2.5 text-sm font-medium text-foreground transition hover:bg-zinc-50">
                  İptal
                </button>
                <button onClick={handleSaveBrand} disabled={!fName.trim() || saving}
                  className="flex-1 rounded-lg bg-brand py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand/20 transition hover:shadow-md disabled:opacity-50">
                  {saving ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      {editingBrandId ? "Güncelleniyor..." : "Oluşturuluyor..."}
                    </span>
                  ) : editingBrandId ? "Güncelle" : "Marka Oluştur"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}

export function ScreenRenderer({
  screen,
  onNavigate,
  studioPostId,
  onStudioNavigate,
  kreatifTopics,
  onKreatifNavigate,
  brandDetailId,
  onBrandDetailNavigate,
  initialTopic,
  onSetInitialTopic,
}: {
  screen: ScreenKey;
  onNavigate?: (key: ScreenKey) => void;
  studioPostId?: number;
  onStudioNavigate?: (postId: number) => void;
  kreatifTopics?: string[];
  onKreatifNavigate?: (topics: string[]) => void;
  brandDetailId?: number;
  onBrandDetailNavigate?: (id: number) => void;
  initialTopic?: string;
  onSetInitialTopic?: (topic: string) => void;
}) {
  if (screen === "dashboard") return <DashboardScreen />;
  if (screen === "icerik") return <IcerikScreen onNewContent={() => onNavigate?.("yeni-icerik")} onOpenStudio={(postId) => onStudioNavigate?.(postId)} />;
  if (screen === "yeni-icerik")
    return (
      <NewContentWizard
        onBack={() => onNavigate?.("icerik")}
        onApproved={(postId) => onStudioNavigate?.(postId)}
        initialTopic={initialTopic}
      />
    );
  if (screen === "studio" && studioPostId)
    return (
      <ImageStudio
        postId={studioPostId}
        onBack={() => onNavigate?.("icerik")}
        onComplete={() => onNavigate?.("dashboard")}
      />
    );
  if (screen === "takvim") return <ContentCalendar onOpenStudio={(postId) => onStudioNavigate?.(postId)} />;
  if (screen === "zamanlayici") return <ZamanlayiciScreen />;
  if (screen === "reklam") return <ReklamScreen />;
  if (screen === "ekip") return <EkipScreen />;
  if (screen === "seo") return <SeoScreen />;
  if (screen === "seo-genel-bakis" || screen === "seo-aksiyonlar" || screen === "seo-siralamalar" || screen === "seo-kelimeler" || screen === "seo-icerik" || screen === "seo-teknik" || screen === "seo-backlink" || screen === "seo-ai") {
    const tabMap: Record<string, string> = {
      "seo-genel-bakis": "genel",
      "seo-aksiyonlar": "aksiyonlar",
      "seo-siralamalar": "siralamalar",
      "seo-kelimeler": "kelimeler",
      "seo-icerik": "icerik",
      "seo-teknik": "teknik",
      "seo-backlink": "backlink",
      "seo-ai": "ai_visibility",
    };
    return (
      <SeoGenelBakis
        initialTab={tabMap[screen] || "genel"}
        onNavigateToKreatif={(topics) => {
          onKreatifNavigate?.(topics);
          onNavigate?.("kreatif-olustur");
        }}
      />
    );
  }
  if (screen === "sosyal") return <SosyalScreen />;
  if (screen === "performans") return <PerformansScreen />;
  if (screen === "yapay-zeka") return <AiAssistantScreen />;
  if (screen === "urun-gorseli-studyosu") return <ProductImageStudio />;
  if (screen === "kreatif-studyo")
    return <KreatifStudyoScreen onKreatifNavigate={onKreatifNavigate} />;
  if (screen === "kreatif-olustur")
    return (
      <KreatifOlusturScreen
        topics={kreatifTopics || []}
        onBack={() => onNavigate?.("kreatif-studyo")}
        onStudioNavigate={(postId) => onStudioNavigate?.(postId)}
      />
    );
  if (screen === "marka-detay" && brandDetailId) return <ProfilScreen />;
  if (screen === "profil") return <ProfilScreen />;
  return <SettingsScreen />;
}
