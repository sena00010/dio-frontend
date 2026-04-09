"use client";

import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type SidebarModule = {
  key: string;
  label: string;
  icon: string;
  route: string;
  enabled: boolean;
  active: boolean;
  badge?: string;
  description: string;
};

type OrderTab = {
  key: string;
  label: string;
  active: boolean;
};

type CategoryItem = {
  key: string;
  label: string;
  active: boolean;
};

type ProductVariant = {
  id: number;
  studio_id: number;
  variant_key: string;
  name: string;
  platform: string;
  format_label: string;
  width: number;
  height: number;
  background: string;
  score: number;
  status: string;
  preview_url: string;
  provider?: string;
  badge_label?: string;
  badge_tone?: string;
  design_notes?: string;
  is_recommended: boolean;
  sort_order: number;
};

type AdFormat = {
  key: string;
  name: string;
  platform: string;
  format_label: string;
  width: number;
  height: number;
  badge_label: string;
  badge_tone: string;
  score: number;
  text_position: string;
  text_align: "left" | "center" | "right";
  is_recommended: boolean;
  design_notes: string;
};

type AdVariant = {
  id: number;
  studio_id: number;
  variant_key: string;
  name: string;
  format_key: string;
  platform: string;
  width: number;
  height: number;
  score: number;
  status: string;
  preview_url: string;
  prompt?: string;
  provider?: string;
  badge_label?: string;
  badge_tone?: string;
  headline?: string;
  sub_headline?: string;
  cta?: string;
  text_mode?: string;
  text_align?: "left" | "center" | "right";
  text_position?: string;
  format_label: string;
  design_notes?: string;
  is_recommended: boolean;
  sort_order: number;
};

type Studio = {
  id: number;
  title: string;
  status: string;
  active_tab: string;
  source_image: string;
  source_file: string;
  source_summary?: string;
  left_panel: {
    hint: string;
    order_tabs: OrderTab[];
    categories: CategoryItem[];
  };
  header: {
    title: string;
    subtitle: string;
    variant_count: number;
  };
  ad_header?: {
    title: string;
    subtitle: string;
    variant_count: number;
    formats: AdFormat[];
  };
  variants: ProductVariant[];
  ad_variants: AdVariant[];
  selected_variant?: ProductVariant | null;
  selected_ad_variant?: AdVariant | null;
};

type JobState = {
  job_id: string;
  studio_id: number;
  mode?: "product" | "ad";
  status: string;
  total: number;
  completed: number;
};

const CATEGORY_CHOICES = [
  "Otomatik Algila",
  "Giyim & Moda",
  "Ayakkabi",
  "Evcil Hayvan",
  "Ev Dekorasyon",
  "Elektronik",
];

const SLOT_CHOICES = [
  { key: "1-ana", label: "1. Ana" },
  { key: "2-4-ek", label: "2-4. Ek" },
  { key: "5-8-yasam", label: "5-8. Yasam" },
];

function toneClasses(tone?: string) {
  switch (tone) {
    case "success":
      return "bg-orange-500 text-white";
    case "danger":
      return "bg-red-500 text-white";
    case "warning":
      return "bg-fuchsia-600 text-white";
    case "info":
      return "bg-emerald-600 text-white";
    default:
      return "bg-zinc-800 text-white";
  }
}

function scoreClasses(score: number) {
  if (score >= 90) return "bg-emerald-500 text-white";
  if (score >= 80) return "bg-green-500 text-white";
  if (score >= 70) return "bg-amber-500 text-white";
  return "bg-orange-500 text-white";
}

function statusText(status: string) {
  switch (status) {
    case "uploaded":
      return "Kaynak Yuklendi";
    case "processing":
      return "Uretiliyor";
    case "ready":
      return "Hazir";
    case "generating":
      return "Duzenleniyor";
    default:
      return status;
  }
}

function creativeBrief(activeTab: "urun-gorseli-studyosu" | "reklam-studyosu", category: string) {
  const categoryText = category === "Otomatik Algila" ? "yuklenen urun" : category.toLowerCase();

  if (activeTab === "reklam-studyosu") {
    return {
      title: "Sosyal Medya Kreatif Brifi",
      body: `${categoryText} icin yuklenen gorselin kendisini kullanarak sosyal medya ve reklam kanallarinda paylasilabilir kampanya kreatifleri uret. Yeni urun tasarlama, DIO veya ekstra logo basma; ayni urunu daha guclu bir kampanya sahnesine tası.`,
    };
  }

  return {
    title: "Pazaryeri ve Feed Brifi",
    body: `${categoryText} icin yuklenen gorseli kesinlikle kaynak alarak Hepsiburada, Trendyol ve sosyal medya icin paylasilabilir platform gorselleri uret. Yeni tasarim urun uretme, DIO ekleme ya da farkli urune donusturme; ayni urunu sadece daha iyi sahnele.`,
  };
}

function AdPreview({
  imageUrl,
  variant,
  className,
}: {
  imageUrl: string;
  variant: AdVariant;
  className?: string;
}) {
  const isWide = variant.width > variant.height;
  const isStory = variant.height >= 1600;
  const isSquare = variant.width === variant.height;
  const formatKey = variant.format_key || "";
  const headline = variant.headline || variant.name;
  const subHeadline = variant.sub_headline || "";
  const cta = variant.cta || "Kesfet";

  return (
    <div className={`relative overflow-hidden ${className || ""}`}>
      <img src={imageUrl} alt={variant.name} className="h-full w-full object-cover" />
      <div className={`absolute inset-0 ${isWide ? "bg-gradient-to-r from-black/25 via-black/5 to-transparent" : "bg-gradient-to-t from-black/40 via-transparent to-transparent"}`} />
      {variant.is_recommended && (
        <div className="absolute right-3 top-3 z-20 rounded-full bg-[#4CAF50] px-3 py-1.5 text-[11px] font-bold text-white shadow-sm">
          YENI
        </div>
      )}

      {formatKey === "instagram_story" && (
        <>
          <div className="absolute left-4 top-4 z-20 flex flex-col items-start gap-2">
            <span className="inline-flex rounded-sm bg-white px-2.5 py-1 text-[10px] font-bold text-zinc-900 shadow-sm">
              {cta}
            </span>
          </div>
          <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/70 via-black/50 to-transparent px-4 pb-8 pt-20">
            <div className="max-w-[80%]">
              <h3 className="text-[30px] font-extrabold leading-[0.96] text-white drop-shadow-sm">
                {headline}
              </h3>
              {subHeadline && <p className="mt-2 text-sm leading-5 text-white/90">{subHeadline}</p>}
            </div>
          </div>
        </>
      )}

      {formatKey === "feed_square" && (
        <>
          <div className="absolute left-0 right-0 top-0 z-20 h-[28%] bg-[#F43316]" />
          <div className="absolute left-4 top-4 z-30 flex flex-col items-start gap-2">
            <span className="inline-flex rounded-sm bg-white px-2.5 py-1 text-[10px] font-bold text-zinc-900 shadow-sm">
              {cta}
            </span>
          </div>
          <div className="absolute inset-x-0 bottom-0 z-20 bg-[#7F180B]/92 px-4 py-5">
            <div className="max-w-[78%]">
              <h3 className="text-[20px] font-extrabold leading-[1] text-white">
                {headline}
              </h3>
              {subHeadline && <p className="mt-1 text-xs leading-5 text-white/90">{subHeadline}</p>}
            </div>
          </div>
        </>
      )}

      {formatKey === "facebook_banner" && (
        <>
          <div className="absolute left-0 top-0 z-20 h-full w-[52%] bg-[linear-gradient(90deg,rgba(93,80,196,0.92)_0%,rgba(93,80,196,0.74)_58%,rgba(93,80,196,0)_100%)]" />
          <div className="absolute left-5 top-5 z-30 flex max-w-[42%] flex-col items-start">
            <h3 className="text-[17px] font-extrabold leading-[1.02] text-white">
              {headline}
            </h3>
            {subHeadline && <p className="mt-1 text-[11px] leading-4 text-white/90">{subHeadline}</p>}
            <span className="mt-3 inline-flex rounded-sm bg-white px-2.5 py-1 text-[10px] font-bold text-[#5D50C4]">
              {cta}
            </span>
          </div>
        </>
      )}

      {formatKey === "trendyol_banner" && (
        <>
          <div className="absolute inset-x-0 top-[42%] z-20 h-[22%] bg-black/38" />
          <div className="absolute left-4 top-4 z-30 flex flex-col items-start gap-2">
            <span className="inline-flex rounded-sm bg-[#F43316] px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
              {cta}
            </span>
          </div>
          <div className="absolute left-4 top-[44%] z-30 max-w-[55%]">
            <h3 className="text-[18px] font-extrabold leading-[1] text-white drop-shadow-sm">
              {headline}
            </h3>
            {subHeadline && <p className="mt-1 text-[11px] leading-4 text-white/90">{subHeadline}</p>}
          </div>
        </>
      )}

      {!["instagram_story", "feed_square", "facebook_banner", "trendyol_banner"].includes(formatKey) && (
        <>
          <div className="absolute left-4 top-4 z-20 flex flex-col items-start gap-2">
            <span className="inline-flex rounded-sm bg-white px-2.5 py-1 text-[10px] font-bold text-zinc-900 shadow-sm">
              {cta}
            </span>
            {!isWide && variant.badge_label && (
              <span className={`inline-flex rounded-sm px-2.5 py-1 text-[10px] font-bold ${toneClasses(variant.badge_tone)}`}>
                {variant.badge_label}
              </span>
            )}
          </div>

          <div className={`absolute ${isWide ? "left-4 top-1/2 w-[48%] -translate-y-1/2" : isSquare ? "left-4 right-4 bottom-4" : "left-4 right-4 bottom-6"} z-20`}>
            <div className={`${isWide ? "bg-black/45 p-3 backdrop-blur-[1px]" : "bg-transparent"} rounded-sm`}>
              <h3 className={`${isStory ? "text-[26px]" : isWide ? "text-[20px]" : "text-[18px]"} font-extrabold leading-[1.02] text-white drop-shadow-sm`}>
                {headline}
              </h3>
              {subHeadline && (
                <p className={`mt-1 ${isWide ? "text-[12px]" : "text-xs sm:text-sm"} leading-5 text-white/92`}>
                  {subHeadline}
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function ProductImageStudio() {
  const { activeCompany } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [modules, setModules] = useState<SidebarModule[]>([]);
  const [studios, setStudios] = useState<Studio[]>([]);
  const [currentStudio, setCurrentStudio] = useState<Studio | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [selectedAdVariantId, setSelectedAdVariantId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("Otomatik Algila");
  const [selectedSlot, setSelectedSlot] = useState("2-4-ek");
  const [title, setTitle] = useState("Urun Fotografi");
  const [sourceSummaryDraft, setSourceSummaryDraft] = useState("");
  const [activeTab, setActiveTab] = useState<"urun-gorseli-studyosu" | "reklam-studyosu">("urun-gorseli-studyosu");
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [textMode, setTextMode] = useState<"ai" | "manual">("ai");
  const [manualHeadline, setManualHeadline] = useState("");
  const [manualSubHeadline, setManualSubHeadline] = useState("");
  const [manualCTA, setManualCTA] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [savingStudio, setSavingStudio] = useState(false);
  const [analyzingStudio, setAnalyzingStudio] = useState(false);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [job, setJob] = useState<JobState | null>(null);

  const mediaUrl = useCallback((path?: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    return `${base}${path}`;
  }, []);

  const fetchSidebar = useCallback(async () => {
    try {
      const { data } = await api.get("/api/protected/product-image-studio/sidebar");
      setModules(data.modules || []);
    } catch {
      setModules([]);
    }
  }, []);

  const fetchStudios = useCallback(async () => {
    if (!activeCompany?.id) return;
    try {
      const { data } = await api.get("/api/protected/product-image-studio", {
        params: { company_id: activeCompany.id },
      });
      const nextStudios: Studio[] = data.studios || [];
      setStudios(nextStudios);
      setCurrentStudio((prev) => {
        if (!nextStudios.length) return null;
        if (!prev) return nextStudios[0];
        return nextStudios.find((studio) => studio.id === prev.id) || nextStudios[0];
      });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || "Stüdyo verileri getirilemedi");
    }
  }, [activeCompany?.id]);

  useEffect(() => {
    if (!activeCompany?.id) return;
    setLoading(true);
    setError("");
    Promise.all([fetchSidebar(), fetchStudios()]).finally(() => setLoading(false));
  }, [activeCompany?.id, fetchSidebar, fetchStudios]);

  useEffect(() => {
    if (!currentStudio) {
      setSelectedVariantId(null);
      setSelectedAdVariantId(null);
      return;
    }
    setSelectedVariantId(currentStudio.selected_variant?.id || currentStudio.variants?.[0]?.id || null);
    setSelectedAdVariantId(currentStudio.selected_ad_variant?.id || currentStudio.ad_variants?.[0]?.id || null);
    setActiveTab(
      currentStudio.active_tab === "reklam-studyosu"
        ? "reklam-studyosu"
        : "urun-gorseli-studyosu"
    );
    const activeCategory = currentStudio.left_panel?.categories?.find((item) => item.active)?.label;
    const activeSlot = currentStudio.left_panel?.order_tabs?.find((item) => item.active)?.key;
    if (activeCategory) setSelectedCategory(activeCategory);
    if (activeSlot) setSelectedSlot(activeSlot);
    setTitle(currentStudio.title || "Urun Fotografi");
    setSourceSummaryDraft(currentStudio.source_summary || "");
    if (currentStudio.ad_header?.formats?.length) {
      setSelectedFormats((prev) => prev.length ? prev : currentStudio.ad_header!.formats.map((item) => item.key));
    }
  }, [currentStudio, selectedFormats.length]);

  useEffect(() => {
    if (!job?.job_id) return;
    const timer = window.setInterval(async () => {
      try {
        const { data } = await api.get(`/api/protected/product-image-studio/jobs/${job.job_id}`);
        setJob(data.job);
        setCurrentStudio(data.studio);
        if (data.job?.status === "completed" || data.job?.completed >= data.job?.total) {
          setGenerating(false);
          window.clearInterval(timer);
          fetchStudios();
        }
      } catch {
        setGenerating(false);
        window.clearInterval(timer);
      }
    }, 2500);

    return () => window.clearInterval(timer);
  }, [job?.job_id, fetchStudios]);

  const selectedVariant = useMemo(() => {
    if (!currentStudio?.variants?.length) return null;
    return currentStudio.variants.find((variant) => variant.id === selectedVariantId) || currentStudio.selected_variant || currentStudio.variants[0];
  }, [currentStudio, selectedVariantId]);

  const selectedAdVariant = useMemo(() => {
    if (!currentStudio?.ad_variants?.length) return null;
    return currentStudio.ad_variants.find((variant) => variant.id === selectedAdVariantId) || currentStudio.selected_ad_variant || currentStudio.ad_variants[0];
  }, [currentStudio, selectedAdVariantId]);

  const handleUpload = useCallback(async (file: File) => {
    if (!activeCompany?.id) return;
    setUploading(true);
    setError("");
    setSaveMessage("");
    try {
      const formData = new FormData();
      formData.append("company_id", String(activeCompany.id));
      formData.append("image", file);
      formData.append("title", title);
      formData.append("category", selectedCategory);
      formData.append("slot_group", selectedSlot);

      const { data } = await api.post("/api/protected/product-image-studio/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setCurrentStudio(data.studio);
      const generation = await api.post(`/api/protected/product-image-studio/${data.studio.id}/generate`, { force: true });
      setGenerating(true);
      setJob(generation.data);
      await fetchStudios();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || "Gorsel yuklenemedi");
    } finally {
      setUploading(false);
    }
  }, [activeCompany?.id, fetchStudios, selectedCategory, selectedSlot, title]);

  const handleGenerateProducts = useCallback(async (force = false) => {
    if (!currentStudio?.id) return;
    setGenerating(true);
    setError("");
    setSaveMessage("");
    try {
      await api.patch(`/api/protected/product-image-studio/${currentStudio.id}`, {
        title,
        category: selectedCategory,
        source_summary: sourceSummaryDraft,
        active_tab: "urun-gorseli-studyosu",
      });
      const { data } = await api.post(`/api/protected/product-image-studio/${currentStudio.id}/generate`, { force });
      setJob(data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setGenerating(false);
      setError(msg || "Varyantlar olusturulamadi");
    }
  }, [currentStudio?.id, selectedCategory, sourceSummaryDraft, title]);

  const handleSaveStudioSettings = useCallback(async (nextTab?: "urun-gorseli-studyosu" | "reklam-studyosu") => {
    if (!currentStudio?.id) return;
    setSavingStudio(true);
    setError("");
    setSaveMessage("");
    try {
      const { data } = await api.patch(`/api/protected/product-image-studio/${currentStudio.id}`, {
        title,
        category: selectedCategory,
        source_summary: sourceSummaryDraft,
        active_tab: nextTab || activeTab,
      });
      setCurrentStudio(data.studio);
      setSaveMessage("Prompt kaydedildi. Veritabani kaydi: product_image_studios.source_analysis");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || "Studio ayarlari kaydedilemedi");
    } finally {
      setSavingStudio(false);
    }
  }, [activeTab, currentStudio?.id, selectedCategory, sourceSummaryDraft, title]);

  const handleAnalyzeStudio = useCallback(async () => {
    if (!currentStudio?.id) return;
    setAnalyzingStudio(true);
    setError("");
    setSaveMessage("");
    try {
      await api.patch(`/api/protected/product-image-studio/${currentStudio.id}`, {
        category: selectedCategory,
        active_tab: activeTab,
      });
      const { data } = await api.post(`/api/protected/product-image-studio/${currentStudio.id}/analyze`);
      setCurrentStudio(data.studio);
      setSourceSummaryDraft(data.studio?.source_summary || "");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || "AI analiz yapilamadi");
    } finally {
      setAnalyzingStudio(false);
    }
  }, [activeTab, currentStudio?.id, selectedCategory]);

  const handleGenerateAds = useCallback(async (force = false) => {
    if (!currentStudio?.id) return;
    setGenerating(true);
    setError("");
    setSaveMessage("");
    try {
      await api.patch(`/api/protected/product-image-studio/${currentStudio.id}`, {
        title,
        category: selectedCategory,
        source_summary: sourceSummaryDraft,
        active_tab: "reklam-studyosu",
      });
      const { data } = await api.post(`/api/protected/product-image-studio/${currentStudio.id}/generate-ads`, {
        force,
        formats: selectedFormats,
        text_mode: textMode,
        manual_headline: manualHeadline,
        manual_sub_headline: manualSubHeadline,
        manual_cta: manualCTA,
      });
      setJob(data);
      setActiveTab("reklam-studyosu");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setGenerating(false);
      setError(msg || "Reklam varyantlari olusturulamadi");
    }
  }, [currentStudio?.id, manualCTA, manualHeadline, manualSubHeadline, selectedCategory, selectedFormats, sourceSummaryDraft, textMode, title]);

  const handleVariantSelect = useCallback(async (variantId: number) => {
    if (!currentStudio) return;
    setSelectedVariantId(variantId);
    try {
      await api.post(`/api/protected/product-image-studio/variants/${variantId}/select`);
      await fetchStudios();
    } catch {}
  }, [currentStudio, fetchStudios]);

  const handleAdVariantSelect = useCallback(async (variantId: number) => {
    if (!currentStudio) return;
    setSelectedAdVariantId(variantId);
    try {
      await api.post(`/api/protected/product-image-studio/ad-variants/${variantId}/select`);
      await fetchStudios();
    } catch {}
  }, [currentStudio, fetchStudios]);

  const handleRegenerateFromPrompt = useCallback(async () => {
    if (!currentStudio?.id) return;
    if (activeTab === "reklam-studyosu") {
      await handleGenerateAds(true);
      return;
    }
    await handleGenerateProducts(true);
  }, [activeTab, currentStudio?.id, handleGenerateAds, handleGenerateProducts]);

  const progress = job ? Math.min(100, Math.round((job.completed / Math.max(job.total, 1)) * 100)) : 0;
  const brief = creativeBrief(activeTab, selectedCategory);

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
        <div className="border-b border-zinc-200 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-wrap items-end gap-6">
            {modules.map((module) => {
              const isActive =
                (module.key === "product-image-studio" && activeTab === "urun-gorseli-studyosu") ||
                (module.key === "ad-studio" && activeTab === "reklam-studyosu");
              return (
                <button
                  key={module.key}
                  type="button"
                  onClick={() => {
                    if (module.key === "ad-studio") {
                      setActiveTab("reklam-studyosu");
                      if (currentStudio?.id) handleSaveStudioSettings("reklam-studyosu");
                    }
                    if (module.key === "product-image-studio") {
                      setActiveTab("urun-gorseli-studyosu");
                      if (currentStudio?.id) handleSaveStudioSettings("urun-gorseli-studyosu");
                    }
                  }}
                  className={`inline-flex items-center gap-2 border-b-[3px] pb-4 text-[15px] font-bold transition ${
                    isActive ? "border-[#F14B2A] text-[#E64A2E]" : "border-transparent text-zinc-500"
                  }`}
                >
                  <span>{module.icon}</span>
                  {module.label}
                  {module.badge && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">{module.badge}</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-0 2xl:grid-cols-[320px_minmax(0,1fr)_340px]">
          <aside className="border-b border-zinc-200 p-4 lg:p-5 2xl:border-b-0 2xl:border-r">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-zinc-400">Urun Fotografi</p>

            <div className="mt-4 rounded-[26px] border border-emerald-200 bg-[#FBFEFC] p-4">
              <div className="relative overflow-hidden rounded-[20px] border border-zinc-100 bg-[#F6F0E9]">
                {currentStudio?.source_image ? (
                  <img src={mediaUrl(currentStudio.source_image)} alt="Kaynak urun" className="aspect-square w-full object-cover" />
                ) : (
                  <div className="flex aspect-square items-center justify-center bg-[radial-gradient(circle_at_center,_#EFE7D8_0%,_#E8DFCF_45%,_#DDD6CA_100%)] text-center text-sm font-medium text-zinc-500">
                    Uygun bir urun fotografi yukleyin
                  </div>
                )}
              </div>

              <div className="mt-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="min-w-0 truncate font-semibold text-emerald-700">{currentStudio?.source_file || "urun_fotografi.jpg"}</p>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="shrink-0 rounded-full px-3 py-2 text-sm font-semibold text-[#E64A2E] transition hover:bg-[#FFF2EF]">
                    {uploading ? "Yukleniyor..." : "Fotografi Degistir"}
                  </button>
                </div>
                <div className="mt-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">AI Varsayilan Brief</p>
                    <button
                      type="button"
                      onClick={() => {
                        promptTextareaRef.current?.focus();
                        promptTextareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                      }}
                      className="text-xs font-semibold text-[#E64A2E] transition hover:opacity-80"
                    >
                      Promptu Duzenle
                    </button>
                  </div>
                  <textarea
                    ref={promptTextareaRef}
                    value={sourceSummaryDraft}
                    onChange={(event) => setSourceSummaryDraft(event.target.value)}
                    className="h-44 w-full resize-y rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm leading-6 text-zinc-700 outline-none transition focus:border-[#E64A2E]"
                    placeholder="Ornek: Bu urunu kullanarak harika bir tasarimla revize et. Hepsiburada, Trendyol ve sosyal medya hesaplarinda paylasilacak sekilde yeniden kurgula. Yuklenen gorseli kesinlikle kullan, yeni urun uretme ve DIO/logo ekleme."
                  />
                  <p className="mt-2 text-xs leading-5 text-zinc-500">
                    Bu brief dogrudan uretime gider. Yuklenen gorselin ayni urun olarak kalmasini, yeni tasarim urun uretilmemesini ve DIO/logo eklenmemesini burada net belirtebilirsiniz.
                  </p>
                </div>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleUpload(file);
                event.currentTarget.value = "";
              }}
            />

            <div className="mt-5 space-y-3">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#E64A2E]"
                placeholder="Calisma adi"
              />
              <div className="grid grid-cols-3 gap-2">
                {SLOT_CHOICES.map((slot) => (
                  <button
                    key={slot.key}
                    type="button"
                    onClick={() => setSelectedSlot(slot.key)}
                    className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                      selectedSlot === slot.key ? "border-[#F14B2A] bg-[#F14B2A] text-white" : "border-zinc-200 bg-white text-zinc-600"
                    }`}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
              <div className="rounded-[24px] border border-[#FFD7CC] bg-[linear-gradient(135deg,#FFF8F5_0%,#FFF1EC_100%)] px-4 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D96A4A]">{brief.title}</p>
                <p className="mt-2 text-sm leading-6 text-[#8F4E3B]">{brief.body}</p>
              </div>
              <button
                type="button"
                onClick={() => handleAnalyzeStudio()}
                disabled={!currentStudio?.id || analyzingStudio}
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-bold text-zinc-800 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {analyzingStudio ? "Urun Analiz Ediliyor..." : "Yuklenen Urune Gore Varsayilan Brief Olustur"}
              </button>
              <button
                type="button"
                onClick={() => handleRegenerateFromPrompt()}
                disabled={!currentStudio?.id || generating}
                className="w-full rounded-2xl border border-[#FFD2C7] bg-[#FFF4F1] px-4 py-3 text-sm font-bold text-[#E64A2E] transition hover:bg-[#FFEAE4] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {generating
                  ? activeTab === "reklam-studyosu"
                    ? "Kreatifler Yeniden Uretiliyor..."
                    : "Gorseller Yeniden Uretiliyor..."
                  : activeTab === "reklam-studyosu"
                    ? "Brieften Reklam Kreatiflerini Uret"
                    : "Brieften Platform Gorsellerini Uret"}
              </button>
              <button
                type="button"
                onClick={() => handleSaveStudioSettings()}
                disabled={!currentStudio?.id || savingStudio}
                className="w-full rounded-2xl bg-[#181512] px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingStudio ? "Kaydediliyor..." : "Briefi ve Ayarlari Kaydet"}
              </button>
              {saveMessage && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs leading-5 text-emerald-700">
                  {saveMessage}
                </div>
              )}
            </div>

            <div className="mt-6">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-zinc-400">Urun Kategorisi</p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {CATEGORY_CHOICES.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`rounded-[22px] border px-4 py-5 text-left text-sm font-semibold transition ${
                      selectedCategory === category ? "border-[#FFC8BB] bg-[#FFF2EF] text-[#E64A2E]" : "border-zinc-200 bg-white text-zinc-600"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <section className="border-b border-zinc-200 p-4 lg:p-5 2xl:border-b-0 2xl:border-r">
            {activeTab === "urun-gorseli-studyosu" ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-[26px] font-extrabold tracking-tight text-zinc-900 sm:text-[32px]">
                      {currentStudio?.header?.variant_count || 0} gorsel hazir
                    </h2>
                    <p className="text-sm text-zinc-500">
                      {currentStudio?.header?.subtitle || "Trendyol + Hepsiburada + Sosyal Medya"}
                    </p>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                      Yuklenen gorselin kendisini kullanan, urun kimligini koruyan ve Hepsiburada, Trendyol ile sosyal medya icin optimize edilmis paylasilabilir gorseller.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button type="button" onClick={() => fetchStudios()} className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50">
                      Yenile
                    </button>
                    <button type="button" disabled={!currentStudio || generating} onClick={() => handleGenerateProducts(true)} className="rounded-2xl bg-[#181512] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
                      {generating && job?.mode === "product" ? "Uretiliyor..." : "Platform Gorsellerini Uret"}
                    </button>
                  </div>
                </div>

                {job && (
                  <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <div className="flex items-center justify-between text-sm font-semibold text-zinc-700">
                      <span>{statusText(job.status)}</span>
                      <span>{job.completed}/{job.total}</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-200">
                      <div className="h-full rounded-full bg-[#F14B2A] transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </div>
                )}

                {!currentStudio && !loading && (
                  <div className="mt-6 rounded-[28px] border border-dashed border-zinc-300 bg-zinc-50 px-8 py-16 text-center">
                    <p className="text-lg font-bold text-zinc-900">Urun gorseli yukleyerek baslayin</p>
                    <p className="mt-2 text-sm leading-6 text-zinc-500">Sistem once yuklenen urunu analiz eder, sonra ayni urune sadik kalarak pazaryeri ve sosyal medya icin birden fazla kreatif varyant olusturur.</p>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-5 rounded-2xl bg-[#F14B2A] px-5 py-3 text-sm font-bold text-white">
                      Gorsel Yukle
                    </button>
                  </div>
                )}

                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
                  {currentStudio?.variants?.map((variant) => {
                    const selected = selectedVariant?.id === variant.id;
                    return (
                      <article key={variant.id} className={`overflow-hidden rounded-[28px] border bg-white transition ${selected ? "border-[#F14B2A] shadow-[0_18px_40px_rgba(241,75,42,0.16)]" : "border-zinc-200"}`}>
                        <div className={`relative ${variant.background.toLowerCase().includes("koyu") || variant.background.toLowerCase().includes("gece") ? "bg-[#181512]" : "bg-[#FAF7F2]"}`}>
                          <div className="absolute left-3 right-3 top-3 z-10 flex items-start justify-between gap-2">
                            <span className={`max-w-[65%] truncate rounded-xl px-3 py-1.5 text-xs font-bold ${toneClasses(variant.badge_tone)}`}>{variant.badge_label || variant.platform}</span>
                            <span className={`shrink-0 rounded-full px-3 py-2 text-sm font-bold ${scoreClasses(variant.score)}`}>{variant.score}</span>
                          </div>
                          <button type="button" onClick={() => handleVariantSelect(variant.id)} className="block w-full">
                            <img src={mediaUrl(variant.preview_url || currentStudio.source_image)} alt={variant.name} className="aspect-[4/5] w-full object-cover" />
                          </button>
                        </div>
                        <div className="space-y-3 p-4">
                          <div>
                            <div className="mb-2 inline-flex rounded-xl bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-500">
                              {variant.format_label || `${variant.width}x${variant.height}`}
                            </div>
                            <h3 className="text-[17px] font-extrabold leading-tight text-zinc-900 sm:text-[18px]">{variant.name}</h3>
                            <p className="mt-1 text-sm text-zinc-500">{variant.platform} • {variant.background}</p>
                          </div>
                          <div className="grid grid-cols-1 gap-2 min-[1380px]:grid-cols-2 2xl:grid-cols-2">
                            <button
                              type="button"
                              onClick={() => {
                                handleVariantSelect(variant.id);
                                promptTextareaRef.current?.focus();
                                promptTextareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                              }}
                              className="w-full min-w-0 rounded-2xl border border-zinc-200 px-3 py-3 text-center text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                            >
                              Sec
                            </button>
                            <a href={mediaUrl(variant.preview_url)} target="_blank" rel="noreferrer" className="block w-full min-w-0 rounded-2xl bg-[#F14B2A] px-3 py-3 text-center text-sm font-bold text-white transition hover:opacity-90">
                              Indir
                            </a>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-[24px] font-extrabold tracking-tight text-zinc-900 sm:text-[30px]">
                      {currentStudio?.ad_header?.title || "Reklam Studyosu"}
                    </h2>
                    <p className="text-sm text-zinc-500">
                      {currentStudio?.ad_header?.subtitle || "Urun gorselinizden banner ve kreatif olusturun"}
                    </p>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                      Yuklenen urunun kendisini kullanan, kampanya yayina hazir, urune sadik ve metin guvenli alanlara sahip sosyal medya kreatifleri.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button type="button" onClick={() => fetchStudios()} className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50">
                      Yenile
                    </button>
                    <button type="button" disabled={!currentStudio || generating} onClick={() => handleGenerateAds(true)} className="rounded-2xl bg-[#181512] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
                      {generating && job?.mode === "ad" ? "Uretiliyor..." : "Sosyal Medya Kreatiflerini Uret"}
                    </button>
                  </div>
                </div>

                <div className="mt-5 border-y border-zinc-200 bg-[#FCFBF9]">
                  <div className="flex flex-wrap items-center gap-3 px-4 py-4">
                    <span className="text-sm font-bold uppercase tracking-[0.16em] text-zinc-400">FORMAT:</span>
                    {currentStudio?.ad_header?.formats?.map((format) => {
                      const active = selectedFormats.includes(format.key);
                      return (
                        <button
                          key={format.key}
                          type="button"
                          onClick={() =>
                            setSelectedFormats((prev) =>
                              prev.includes(format.key)
                                ? prev.filter((item) => item !== format.key)
                                : [...prev, format.key]
                            )
                          }
                          className={`rounded-2xl px-4 py-2 text-sm font-bold transition ${active ? "bg-[#F14B2A] text-white" : "border border-zinc-200 bg-white text-zinc-600"}`}
                        >
                          {format.format_label}
                        </button>
                      );
                    })}
                    <span className="ml-auto text-sm font-bold uppercase tracking-[0.16em] text-zinc-400">METIN:</span>
                    <button type="button" onClick={() => setTextMode("ai")} className={`rounded-2xl px-4 py-2 text-sm font-bold transition ${textMode === "ai" ? "bg-[#F14B2A] text-white" : "border border-zinc-200 bg-white text-zinc-600"}`}>
                      AI Olustursun
                    </button>
                  </div>

                  <div className="px-4 pb-4">
                    <button type="button" onClick={() => setTextMode("manual")} className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${textMode === "manual" ? "border border-zinc-200 bg-white text-zinc-900 shadow-sm" : "border border-zinc-200 bg-white text-zinc-500"}`}>
                      Manuel Gir
                    </button>
                  </div>

                  {textMode === "manual" && (
                    <div className="grid gap-3 border-t border-zinc-200 px-4 py-4 lg:grid-cols-3">
                      <input value={manualHeadline} onChange={(e) => setManualHeadline(e.target.value)} placeholder="Baslik" className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none" />
                      <input value={manualSubHeadline} onChange={(e) => setManualSubHeadline(e.target.value)} placeholder="Alt baslik" className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none" />
                      <input value={manualCTA} onChange={(e) => setManualCTA(e.target.value)} placeholder="CTA" className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none" />
                    </div>
                  )}
                </div>

                {job && (
                  <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <div className="flex items-center justify-between text-sm font-semibold text-zinc-700">
                      <span>{statusText(job.status)}</span>
                      <span>{job.completed}/{job.total}</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-200">
                      <div className="h-full rounded-full bg-[#F14B2A] transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}

                <div className="mt-6 grid gap-4 xl:grid-cols-2">
                  {currentStudio?.ad_variants?.map((variant) => {
                    const selected = selectedAdVariant?.id === variant.id;
                    return (
                      <article key={variant.id} className={`overflow-hidden rounded-[28px] border bg-white transition ${selected ? "border-[#F14B2A] shadow-[0_18px_40px_rgba(241,75,42,0.16)]" : "border-zinc-200"}`}>
                        <div className="relative">
                          <div className="absolute left-3 right-3 top-3 z-10 flex items-start justify-between gap-2">
                            <span className={`max-w-[70%] truncate rounded-xl px-3 py-1.5 text-xs font-bold ${toneClasses(variant.badge_tone)}`}>
                              {variant.badge_label || variant.platform}
                            </span>
                            <span className={`shrink-0 rounded-full px-3 py-2 text-sm font-bold ${scoreClasses(variant.score)}`}>
                              {variant.score}
                            </span>
                          </div>
                          <button type="button" onClick={() => handleAdVariantSelect(variant.id)} className="block w-full">
                            <AdPreview imageUrl={mediaUrl(variant.preview_url || currentStudio.source_image)} variant={variant} className={`w-full ${variant.width > variant.height ? "aspect-[16/8]" : variant.height > 1500 ? "aspect-[4/5]" : "aspect-square"}`} />
                          </button>
                        </div>
                        <div className="space-y-3 p-4">
                          <div>
                            <h3 className="text-[17px] font-extrabold leading-tight text-zinc-900 sm:text-[18px]">{variant.name}</h3>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                handleAdVariantSelect(variant.id);
                                promptTextareaRef.current?.focus();
                                promptTextareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                              }}
                              className="w-full rounded-2xl border border-zinc-200 px-3 py-3 text-center text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                            >
                              Sec
                            </button>
                            <a href={mediaUrl(variant.preview_url)} target="_blank" rel="noreferrer" className="block w-full rounded-2xl bg-[#F14B2A] px-3 py-3 text-center text-sm font-bold text-white transition hover:opacity-90">
                              Indir
                            </a>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </section>

          <aside className="p-4 lg:p-5 2xl:p-5 2xl:block 2xl:min-w-0 2xl:self-start 2xl:sticky 2xl:top-0 2xl:max-h-none xl:col-span-2 2xl:col-span-1">
            <div className="flex items-center justify-between">
              <h3 className="text-[20px] font-extrabold text-zinc-900">
                {activeTab === "reklam-studyosu" ? selectedAdVariant?.name || "Reklam Onizleme" : selectedVariant?.name || "Onizleme"}
              </h3>
              <span className="text-2xl text-zinc-300">×</span>
            </div>

            <p className="mt-5 text-sm font-bold uppercase tracking-[0.18em] text-zinc-400">Onizleme</p>
            <div className="mt-4 overflow-hidden rounded-[28px] border border-zinc-200 bg-white">
              {activeTab === "reklam-studyosu" ? (
                selectedAdVariant ? (
                  <AdPreview imageUrl={mediaUrl(selectedAdVariant.preview_url || currentStudio?.source_image)} variant={selectedAdVariant} className={`w-full ${selectedAdVariant.width > selectedAdVariant.height ? "aspect-[16/8]" : selectedAdVariant.height > 1500 ? "aspect-[4/5]" : "aspect-square"}`} />
                ) : (
                  <div className="flex aspect-[16/8] items-center justify-center text-sm text-zinc-400">Reklam varyanti secin</div>
                )
              ) : selectedVariant ? (
                <img src={mediaUrl(selectedVariant.preview_url || currentStudio?.source_image)} alt={selectedVariant.name} className="aspect-[4/5] w-full object-cover" />
              ) : (
                <div className="flex aspect-[4/5] items-center justify-center text-sm text-zinc-400">Varyant secin</div>
              )}
            </div>

            <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
              {(activeTab === "reklam-studyosu" ? currentStudio?.ad_variants : currentStudio?.variants)?.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() =>
                    activeTab === "reklam-studyosu"
                      ? setSelectedAdVariantId(variant.id)
                      : setSelectedVariantId(variant.id)
                  }
                  className={`overflow-hidden rounded-[18px] border transition ${
                    (activeTab === "reklam-studyosu" ? selectedAdVariant?.id : selectedVariant?.id) === variant.id
                      ? "border-[#F14B2A]"
                      : "border-zinc-200"
                  }`}
                >
                  {activeTab === "reklam-studyosu" ? (
                    <div className="h-24 w-24 overflow-hidden">
                      <AdPreview imageUrl={mediaUrl((variant as AdVariant).preview_url || currentStudio?.source_image)} variant={variant as AdVariant} className="h-full w-full" />
                    </div>
                  ) : (
                    <img src={mediaUrl((variant as ProductVariant).preview_url || currentStudio?.source_image)} alt={variant.name} className="h-24 w-24 object-cover" />
                  )}
                </button>
              ))}
            </div>

            <div className="mt-8">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-zinc-400">
                {activeTab === "reklam-studyosu" ? "Reklam Bilgisi" : "Gorsel Bilgisi"}
              </p>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-zinc-500">Boyut</dt>
                  <dd className="font-bold text-zinc-900">
                    {activeTab === "reklam-studyosu"
                      ? selectedAdVariant ? `${selectedAdVariant.width}×${selectedAdVariant.height} px` : "-"
                      : selectedVariant ? `${selectedVariant.width}×${selectedVariant.height} px` : "-"}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-zinc-500">Platform</dt>
                  <dd className="font-bold text-zinc-900">
                    {activeTab === "reklam-studyosu" ? selectedAdVariant?.platform || "-" : selectedVariant?.platform || "-"}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-zinc-500">Format</dt>
                  <dd className="font-bold text-zinc-900">
                    {activeTab === "reklam-studyosu" ? selectedAdVariant?.format_label || "-" : selectedVariant?.format_label || "-"}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-zinc-500">Genel Skor</dt>
                  <dd className="font-bold text-emerald-600">
                    {activeTab === "reklam-studyosu"
                      ? selectedAdVariant ? `${selectedAdVariant.score}/100` : "-"
                      : selectedVariant ? `${selectedVariant.score}/100` : "-"}
                  </dd>
                </div>
                {activeTab === "reklam-studyosu" && selectedAdVariant?.cta && (
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-zinc-500">CTA</dt>
                    <dd className="font-bold text-zinc-900">{selectedAdVariant.cta}</dd>
                  </div>
                )}
              </dl>
            </div>

            {(activeTab === "reklam-studyosu" ? selectedAdVariant?.design_notes : selectedVariant?.design_notes) && (
              <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm leading-6 text-zinc-600">
                {activeTab === "reklam-studyosu" ? selectedAdVariant?.design_notes : selectedVariant?.design_notes}
              </div>
            )}

            {!!studios.length && (
              <div className="mt-8">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-zinc-400">Son Calismalar</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-1">
                  {studios.map((studio) => (
                    <button
                      key={studio.id}
                      type="button"
                      onClick={() => setCurrentStudio(studio)}
                      className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                        currentStudio?.id === studio.id ? "border-[#FBC7B9] bg-[#FFF3EF]" : "border-zinc-200 bg-white"
                      }`}
                    >
                      <img src={mediaUrl(studio.source_image)} alt={studio.title} className="h-14 w-14 rounded-xl object-cover" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-zinc-900">{studio.title}</p>
                        <p className="truncate text-xs text-zinc-500">{statusText(studio.status)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
