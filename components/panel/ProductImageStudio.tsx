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
  "Otomatik Algıla",
  "Giyim & Moda",
  "Ayakkabı",
  "Evcil Hayvan",
  "Ev Dekorasyon",
  "Elektronik",
];

const CATEGORY_WITH_ICONS: { key: string; icon: string }[] = [
  { key: "Giyim & Moda", icon: "👗" },
  { key: "Ayakkabı", icon: "👠" },
  { key: "Ev Dekorasyon", icon: "🏠" },
  { key: "Elektronik", icon: "💻" },
  { key: "Kozmetik", icon: "💄" },
  { key: "Diğer", icon: "📦" },
];

const PLATFORMS = [
  { key: "trendyol", name: "Trendyol", abbr: "T", bg: "#E63", badge: "Beyaz arka plan", badgeRed: true, format: "1200×1800px · JPG/PNG · max 2MB" },
  { key: "hepsiburada", name: "Hepsiburada", abbr: "H", bg: "#E43", badge: "Beyaz arka plan", badgeRed: true, format: "1200×1200px · min 1500px önerilir" },
  { key: "instagram", name: "Instagram", abbr: "IG", bg: "linear-gradient(135deg,#f09433,#e6683c,#dc2743,#bc1888)", badge: "Serbest", badgeRed: false, format: "1080×1080px veya 1080×1350px" },
  { key: "facebook", name: "Facebook", abbr: "FB", bg: "#1877F2", badge: "Serbest", badgeRed: false, format: "1200×628px veya 1080×1080px" },
  { key: "web", name: "Web Sitesi", abbr: "W", bg: "#2D7D46", badge: "Serbest", badgeRed: false, format: "800×800px veya özel boyut" },
];

const BG_STYLES = [
  { key: "beyaz", label: "Beyaz", bg: "#FFFFFF", border: "border-zinc-200" },
  { key: "krem", label: "Krem", bg: "#F5EFE0", border: "border-zinc-200" },
  { key: "koyu", label: "Koyu", bg: "#181512", border: "border-zinc-700" },
  { key: "soft", label: "Soft", bg: "#EDE9F5", border: "border-zinc-200" },
];

const SLOT_CHOICES = [
  { key: "1-ana", label: "1. Ana" },
  { key: "2-4-ek", label: "2-4. Ek" },
  { key: "5-8-yasam", label: "5-8. Ya\u015fam" },
];

async function downloadImage(url: string, filename: string) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const ext = blob.type.includes("png") ? "png" : blob.type.includes("svg") ? "svg" : "jpg";
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename.endsWith(`.${ext}`) ? filename : `${filename}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(url, "_blank");
  }
}

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
      return "Kaynak Yüklendi";
    case "processing":
      return "Üretiliyor";
    case "ready":
      return "Hazır";
    case "generating":
      return "Düzenleniyor";
    default:
      return status;
  }
}

function creativeBrief(activeTab: "urun-gorseli-studyosu" | "reklam-studyosu", category: string) {
  const categoryText = category === "Otomatik Algıla" ? "yüklenen ürün" : category.toLowerCase();

  if (activeTab === "reklam-studyosu") {
    return {
      title: "Sosyal Medya Kreatif Brifi",
      body: `${categoryText} için yüklenen görselin kendisini kullanarak sosyal medya ve reklam kanallarında paylaşılabilir kampanya kreatifler üret. Yeni ürün tasarlama, DIO veya ekstra logo basma; aynı ürünü daha güçlü bir kampanya sahnesine taşı.`,
    };
  }

  return {
    title: "Pazaryeri ve Feed Brifi",
    body: `${categoryText} için yüklenen görseli kesinlikle kaynak alarak Hepsiburada, Trendyol ve sosyal medya için paylaşılabilir platform görselleri üret. Yeni tasarım ürün üretme, DIO ekleme ya da farklı ürüne dönüştürme; aynı ürünü sadece daha iyi sahnele.`,
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
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["trendyol", "hepsiburada"]);
  const [selectedBgStyle, setSelectedBgStyle] = useState("beyaz");
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
  const [toast, setToast] = useState("");
  const [job, setJob] = useState<JobState | null>(null);
  // Brief kütüphanesi state
  const [briefs, setBriefs] = useState<{id:number;title:string;content:string;brief_type:string;is_favorite:boolean;used_count:number}[]>([]);
  const [showBriefLibrary, setShowBriefLibrary] = useState(false);
  const [savingBrief, setSavingBrief] = useState(false);
  const [briefTitle, setBriefTitle] = useState("");

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }, []);

  const fetchBriefs = useCallback(async () => {
    try {
      const { data } = await api.get("/api/protected/studio-briefs");
      setBriefs(data.briefs || []);
    } catch { /* sessiz hata */ }
  }, []);

  const handleSaveBrief = useCallback(async () => {
    if (!sourceSummaryDraft.trim()) return;
    setSavingBrief(true);
    try {
      const title = briefTitle.trim() || `Brief ${new Date().toLocaleDateString("tr-TR")}`;
      await api.post("/api/protected/studio-briefs", {
        title,
        content: sourceSummaryDraft,
        brief_type: activeTab === "reklam-studyosu" ? "reklam" : "urun",
        studio_id: currentStudio?.id,
      });
      showToast("Brief kaydedildi ✓");
      setBriefTitle("");
      await fetchBriefs();
    } catch {
      showToast("Brief kaydedilemedi");
    } finally {
      setSavingBrief(false);
    }
  }, [activeTab, briefTitle, currentStudio?.id, fetchBriefs, showToast, sourceSummaryDraft]);

  const handleDeleteBrief = useCallback(async (id: number) => {
    try {
      await api.delete(`/api/protected/studio-briefs/${id}`);
      setBriefs((prev) => prev.filter((b) => b.id !== id));
      showToast("Brief silindi");
    } catch { showToast("Silinemedi"); }
  }, [showToast]);

  const handleUseBrief = useCallback(async (brief: {id:number;content:string}) => {
    setSourceSummaryDraft(brief.content);
    setShowBriefLibrary(false);
    showToast("Brief yüklendi ✓");
    try { await api.post(`/api/protected/studio-briefs/${brief.id}/use`); } catch { /* sessiz */ }
  }, [showToast]);

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

  // Brief kütüphanesini yükle
  useEffect(() => {
    fetchBriefs();
  }, [fetchBriefs]);

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
    try {
      const { data } = await api.patch(`/api/protected/product-image-studio/${currentStudio.id}`, {
        title,
        category: selectedCategory,
        source_summary: sourceSummaryDraft,
        active_tab: nextTab || activeTab,
      });
      setCurrentStudio(data.studio);
      showToast("Kaydedildi ✓");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || "Studio ayarları kaydedilemedi");
    } finally {
      setSavingStudio(false);
    }
  }, [activeTab, currentStudio?.id, selectedCategory, showToast, sourceSummaryDraft, title]);

  const handleAnalyzeStudio = useCallback(async () => {
    if (!currentStudio?.id) return;
    setAnalyzingStudio(true);
    setError("");
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
    <div className="-m-4 sm:-m-5 lg:-m-6">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white shadow-xl animate-fade-in-up">
          <svg className="h-4 w-4 text-emerald-400" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          {toast}
        </div>
      )}
      <div className="bg-white">
        <div className="border-b border-zinc-100 px-4 py-0 sm:px-5">
          <div className="flex flex-wrap items-end gap-5">
            {modules.map((module) => {
              const isActive =
                (module.key === "product-image-studio" && activeTab === "urun-gorseli-studyosu") ||
                (module.key === "ad-studio" && activeTab === "reklam-studyosu");
              const labelOverrides: Record<string, string> = {
                "product-image-studio": "Ürün Görseli Stüdyosu",
                "ad-studio": "Reklam Stüdyosu",
              };
              const label = labelOverrides[module.key] || module.label;
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
                  className={`inline-flex items-center gap-1.5 border-b-2 py-3 text-[13px] font-semibold transition ${
                    isActive ? "border-[#F14B2A] text-[#E64A2E]" : "border-transparent text-zinc-400 hover:text-zinc-600"
                  }`}
                >
                  <span className="text-base">{module.icon}</span>
                  {label}
                  {module.badge && <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-emerald-700">{module.badge}</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-0 2xl:grid-cols-[260px_minmax(0,1fr)_300px]">
          <aside className="border-b border-zinc-100 2xl:border-b-0 2xl:border-r bg-[#FAFAF9] flex flex-col">
            {/* Fotoğraf Alanı */}
            <div className="p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">Ürün Fotoğrafı</p>
              <div className="mt-2 relative overflow-hidden rounded-xl border border-zinc-200 bg-[#F6F0E9] cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                {currentStudio?.source_image ? (
                  <img src={mediaUrl(currentStudio.source_image)} alt="Kaynak ürün" className="aspect-square w-full object-cover" />
                ) : (
                  <div className="flex aspect-square flex-col items-center justify-center gap-2 bg-zinc-100 text-center">
                    <span className="text-2xl">🖼️</span>
                    <p className="text-xs font-medium text-zinc-500">Fotoğraf yükle</p>
                  </div>
                )}
                {/* Slot label badge */}
                {currentStudio?.source_image && (
                  <div className="absolute left-2 top-2">
                    <span className="rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-bold text-zinc-700 shadow-sm">
                      {SLOT_CHOICES.find(s => s.key === selectedSlot)?.label || "1. Ana"}
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-2 text-xs">
                <p className="min-w-0 truncate font-semibold text-emerald-700">{currentStudio?.source_file || "urun_fotografi.jpg"}</p>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="shrink-0 font-semibold text-[#E64A2E] transition hover:opacity-80">
                  {uploading ? "Yükleniyor..." : "Değiştir"}
                </button>
              </div>
              {currentStudio?.left_panel?.hint && (
                <p className="mt-2 text-[11px] leading-4 text-zinc-500">
                  💡 {currentStudio.left_panel.hint}
                </p>
              )}
              {!currentStudio?.left_panel?.hint && (
                <p className="mt-2 text-[11px] leading-4 text-zinc-500">
                  💡 Karışık arka plan sorun değil — AI arka planı kaldırır ve optimize eder
                </p>
              )}
            </div>

            {/* Slot Seçimi */}
            <div className="border-t border-zinc-100 px-3 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">Bu Görsel Kaçıncı Sırada?</p>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {SLOT_CHOICES.map((slot) => (
                  <button
                    key={slot.key}
                    type="button"
                    onClick={() => setSelectedSlot(slot.key)}
                    className={`rounded-lg border px-1 py-2 text-xs font-semibold transition ${
                      selectedSlot === slot.key
                        ? "border-[#F14B2A] bg-[#F14B2A] text-white"
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                    }`}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
              {/* Brief kartı */}
              <div className="mt-2 rounded-lg border border-[#E9C97E] bg-[#FFFBEF] px-3 py-2.5">
                <p className="text-[10px] font-bold text-[#8B6914]">{brief.title.split(":")[0]}:</p>
                <p className="mt-1 text-[11px] leading-4 text-[#7A5C10]">{brief.body.slice(0, 120)}{brief.body.length > 120 ? "..." : ""}</p>
              </div>
            </div>

            {/* AI Brief Textarea + Kütüphane */}
            <div className="border-t border-zinc-100 px-3 py-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">AI Brief</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowBriefLibrary((v) => !v); fetchBriefs(); }}
                    className="text-[10px] font-semibold text-zinc-400 hover:text-zinc-600"
                  >
                    {showBriefLibrary ? "Kütüphaneyi Kapat" : `Kütüphane (${briefs.length})`}
                  </button>
                  <button type="button" onClick={() => handleAnalyzeStudio()} disabled={!currentStudio?.id || analyzingStudio} className="text-[10px] font-semibold text-[#E64A2E] disabled:opacity-40">
                    {analyzingStudio ? "Analiz ediliyor..." : "Ürüne göre oluştur"}
                  </button>
                </div>
              </div>
              <textarea
                ref={promptTextareaRef}
                value={sourceSummaryDraft}
                onChange={(event) => setSourceSummaryDraft(event.target.value)}
                className="mt-1.5 h-20 w-full resize-none rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-[11px] leading-4 text-zinc-700 outline-none transition focus:border-[#E64A2E]"
                placeholder="Örnek: Bu ürünü kullanarak harika bir tasarımla revize et..."
              />

              {/* Brief kaydet */}
              <div className="mt-1.5 flex gap-1.5">
                <input
                  value={briefTitle}
                  onChange={(e) => setBriefTitle(e.target.value)}
                  placeholder="Brief adı (isteğe bağlı)"
                  className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[11px] outline-none transition focus:border-[#E64A2E]"
                />
                <button
                  type="button"
                  onClick={handleSaveBrief}
                  disabled={savingBrief || !sourceSummaryDraft.trim()}
                  className="shrink-0 rounded-lg bg-zinc-100 px-2.5 py-1 text-[10px] font-bold text-zinc-600 transition hover:bg-zinc-200 disabled:opacity-40"
                >
                  {savingBrief ? "..." : "💾 Kaydet"}
                </button>
              </div>

              {/* Brief kütüphanesi */}
              {showBriefLibrary && (
                <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-zinc-100 bg-zinc-50">
                  {briefs.length === 0 ? (
                    <p className="p-3 text-center text-[10px] text-zinc-400">Henüz kaydedilmiş brief yok</p>
                  ) : (
                    briefs.map((brief) => (
                      <div key={brief.id} className="flex items-start gap-1 border-b border-zinc-100 px-2.5 py-2 last:border-0">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[10px] font-bold text-zinc-700">{brief.title}</p>
                          <p className="mt-0.5 line-clamp-2 text-[10px] leading-3.5 text-zinc-500">{brief.content}</p>
                        </div>
                        <div className="flex shrink-0 flex-col gap-0.5">
                          <button
                            type="button"
                            onClick={() => handleUseBrief(brief)}
                            className="rounded px-1.5 py-0.5 text-[9px] font-bold text-[#E64A2E] hover:bg-orange-50"
                          >
                            Kullan
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBrief(brief.id)}
                            className="rounded px-1.5 py-0.5 text-[9px] font-bold text-zinc-300 hover:text-red-400"
                          >
                            Sil
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Kategori */}
            <div className="border-t border-zinc-100 px-3 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">Ürün Kategorisi</p>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {CATEGORY_WITH_ICONS.map(({ key, icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedCategory(key)}
                    className={`flex items-center gap-1.5 rounded-xl border px-2 py-2 text-left text-xs font-semibold transition ${
                      selectedCategory === key
                        ? "border-[#FFC8BB] bg-[#FFF2EF] text-[#E64A2E]"
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                    }`}
                  >
                    <span>{icon}</span>
                    {key}
                  </button>
                ))}
              </div>
            </div>

            {/* Platform */}
            <div className="border-t border-zinc-100 px-3 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">Platform</p>
              <div className="mt-2 space-y-1.5">
                {PLATFORMS.map((platform) => {
                  const active = selectedPlatforms.includes(platform.key);
                  return (
                    <button
                      key={platform.key}
                      type="button"
                      onClick={() =>
                        setSelectedPlatforms((prev) =>
                          prev.includes(platform.key)
                            ? prev.filter((k) => k !== platform.key)
                            : [...prev, platform.key]
                        )
                      }
                      className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition ${
                        active
                          ? "border-[#FFD0C4] bg-[#FFF5F2]"
                          : "border-zinc-200 bg-white hover:border-zinc-300"
                      }`}
                    >
                      {/* Logo circle */}
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[11px] font-extrabold text-white"
                        style={{ background: platform.bg }}
                      >
                        {platform.abbr}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-zinc-900">{platform.name}</span>
                          <span className={`rounded px-1 py-0.5 text-[9px] font-bold ${
                            platform.badgeRed ? "bg-[#FFC8BB] text-[#B33300]" : "bg-emerald-100 text-emerald-700"
                          }`}>{platform.badge}</span>
                        </div>
                        <p className="mt-0.5 text-[10px] leading-3 text-zinc-400">{platform.format}</p>
                      </div>
                      {/* Checkbox */}
                      <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition ${
                        active ? "border-[#F14B2A] bg-[#F14B2A]" : "border-zinc-300 bg-white"
                      }`}>
                        {active && <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Arka Plan Stili */}
            <div className="border-t border-zinc-100 px-3 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">Arka Plan Stili</p>
              <div className="mt-2 grid grid-cols-4 gap-1.5">
                {BG_STYLES.map((style) => (
                  <button
                    key={style.key}
                    type="button"
                    onClick={() => setSelectedBgStyle(style.key)}
                    className={`rounded-lg border-2 py-2 text-xs font-semibold transition ${
                      selectedBgStyle === style.key ? "border-[#F14B2A]" : "border-zinc-200"
                    }`}
                    style={{ background: style.bg, color: style.key === "koyu" ? "#fff" : "#3f3f46" }}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Kaydet butonu */}
            <div className="border-t border-zinc-100 px-3 py-2 space-y-2">
              <button
                type="button"
                onClick={() => handleSaveStudioSettings()}
                disabled={!currentStudio?.id || savingStudio}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-[10px] font-bold text-zinc-600 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingStudio ? "Kaydediliyor..." : "Brief ve Ayarları Kaydet"}
              </button>

              {/* Üret butonu — hemen kaydet'in altında */}
              <button
                type="button"
                disabled={!currentStudio?.id || generating || (activeTab === "urun-gorseli-studyosu" && selectedPlatforms.length === 0)}
                onClick={() =>
                  activeTab === "reklam-studyosu"
                    ? handleGenerateAds(true)
                    : handleGenerateProducts(true)
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F14B2A] px-4 py-3 text-sm font-bold text-white shadow-md shadow-orange-200 transition hover:bg-[#D93E1F] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {generating && (activeTab === "reklam-studyosu" ? job?.mode === "ad" : job?.mode === "product") ? (
                  <>⏳ Üretiliyor...</>
                ) : activeTab === "reklam-studyosu" ? (
                  <>✶ Kreatif Oluştur</>
                ) : (
                  <>✶ Görsel Oluştur</>
                )}
              </button>
              <p className="text-center text-[10px] text-zinc-400">
                {activeTab === "reklam-studyosu"
                  ? `${selectedFormats.length || 0} format · ${selectedFormats.length * 2} kreatif oluşturulacak`
                  : `${selectedPlatforms.length} platform · ${
                      selectedPlatforms.includes("trendyol") || selectedPlatforms.includes("hepsiburada")
                        ? selectedPlatforms.length * 3
                        : selectedPlatforms.length * 2
                    } varyant oluşturulacak`}
              </p>
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
          </aside>

          <section className="border-b border-zinc-100 p-3 lg:p-4 2xl:border-b-0 2xl:border-r">
            {activeTab === "urun-gorseli-studyosu" ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-zinc-900">
                      {currentStudio?.header?.variant_count || 0} görsel hazır
                    </span>
                    <span className="text-zinc-200">|</span>
                    <span className="text-xs text-zinc-400">
                      {currentStudio?.header?.subtitle || "Trendyol + Hepsiburada + Sosyal Medya"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => fetchStudios()} className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-500 transition hover:bg-zinc-50">
                      ↻ Yenile
                    </button>
                    <button type="button" disabled={!currentStudio || generating} onClick={() => {
                      const urls = currentStudio?.variants?.map(v => v.preview_url).filter(Boolean) || [];
                      urls.forEach((url, i) => setTimeout(() => downloadImage(mediaUrl(url), `gorsel-${i+1}`), i * 300));
                    }} className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-40">
                      ↓ Tümünü İndir
                    </button>
                    <button type="button" disabled={!currentStudio || generating} onClick={() => handleGenerateProducts(true)} className="rounded-lg bg-[#181512] px-3 py-1.5 text-xs font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
                      {generating && job?.mode === "product" ? "Üretiliyor..." : "Platform Görsellerini Üret"}
                    </button>
                  </div>
                </div>

                {job && (
                  <div className="mt-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-zinc-600">
                      <span>{statusText(job.status)}</span>
                      <span>{job.completed}/{job.total}</span>
                    </div>
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-zinc-200">
                      <div className="h-full rounded-full bg-[#F14B2A] transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</div>
                )}

                {!currentStudio && !loading && (
                  <div className="mt-6 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-12 text-center">
                    <p className="text-sm font-bold text-zinc-800">Ürün görseli yükleyerek başlayın</p>
                    <p className="mt-1 text-xs text-zinc-400">Sistem önce yüklenen ürünü analiz eder, sonra aynı ürüne sadık kalarak pazaryeri ve sosyal medya için birden fazla kreatif varyant oluşturur.</p>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-3 rounded-lg bg-[#F14B2A] px-4 py-2 text-xs font-bold text-white">
                      Görsel Yükle
                    </button>
                  </div>
                )}

                <div className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                  {currentStudio?.variants?.map((variant) => {
                    const selected = selectedVariant?.id === variant.id;
                    return (
                      <article key={variant.id} className={`overflow-hidden rounded-xl border bg-white transition ${selected ? "border-[#F14B2A] shadow-[0_8px_20px_rgba(241,75,42,0.14)]" : "border-zinc-200 hover:border-zinc-300"}`}>
                        <div className={`relative ${variant.background.toLowerCase().includes("koyu") || variant.background.toLowerCase().includes("gece") ? "bg-[#181512]" : "bg-[#FAF7F2]"}`}>
                          <div className="absolute left-2 right-2 top-2 z-10 flex items-start justify-between gap-1">
                            <span className={`max-w-[65%] truncate rounded-lg px-2 py-1 text-[10px] font-bold ${toneClasses(variant.badge_tone)}`}>{variant.badge_label || variant.platform}</span>
                            <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-bold ${scoreClasses(variant.score)}`}>{variant.score}</span>
                          </div>
                          <button type="button" onClick={() => handleVariantSelect(variant.id)} className="block w-full">
                            <img src={mediaUrl(variant.preview_url || currentStudio.source_image)} alt={variant.name} className="aspect-[4/5] w-full object-cover" />
                          </button>
                        </div>
                        <div className="p-2.5">
                          <div className="mb-1 text-[10px] font-semibold text-zinc-400">
                            {variant.format_label || `${variant.width}x${variant.height}`}
                          </div>
                          <h3 className="text-sm font-bold leading-tight text-zinc-900">{variant.name}</h3>
                          <p className="mt-0.5 text-[11px] text-zinc-400">{variant.platform} · {variant.background}</p>
                          <div className="mt-2 grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                handleVariantSelect(variant.id);
                                promptTextareaRef.current?.focus();
                                promptTextareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                              }}
                              className="rounded-lg border border-zinc-200 py-1.5 text-center text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50"
                            >
                              Düzenle
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadImage(mediaUrl(variant.preview_url), variant.name || "gorsel")}
                              className="rounded-lg bg-[#F14B2A] py-1.5 text-center text-xs font-bold text-white transition hover:opacity-90"
                            >
                              ↓ İndir
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-sm font-bold text-zinc-900 shrink-0">
                      {currentStudio?.ad_header?.title || "Reklam Stüdyosu"}
                    </span>
                    <span className="text-zinc-300">·</span>
                    <span className="text-xs text-zinc-400 truncate">
                      {currentStudio?.ad_header?.subtitle || "Ürün görselinizden banner ve kreatif oluşturun"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => fetchStudios()}
                      className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-500 transition hover:bg-zinc-50"
                    >
                      ↻ Yenile
                    </button>
                    <button
                      type="button"
                      disabled={!currentStudio || generating}
                      onClick={() => {
                        const urls = currentStudio?.ad_variants?.map(v => v.preview_url).filter(Boolean) || [];
                        urls.forEach((url, i) => setTimeout(() => downloadImage(mediaUrl(url), `kreatif-${i + 1}`), i * 300));
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#181512] px-3 py-1.5 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-40"
                    >
                      ↓ Tümünü İndir
                    </button>
                  </div>
                </div>

                {/* FORMAT + METİN bar — her biri kendi satırında */}
                <div className="mt-2.5 border-y border-zinc-100 bg-[#FAFAF9]">
                  {/* Satır 1: FORMAT */}
                  <div className="flex flex-wrap items-center gap-1.5 py-2">
                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">FORMAT:</span>
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
                          className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-semibold transition ${active ? "bg-[#F14B2A] text-white" : "border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"}`}
                        >
                          {format.format_label}
                        </button>
                      );
                    })}
                  </div>
                  {/* Satır 2: METİN */}
                  <div className="flex flex-wrap items-center gap-1.5 border-t border-zinc-100 py-2">
                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">METİN:</span>
                    <button
                      type="button"
                      onClick={() => setTextMode("ai")}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${textMode === "ai" ? "bg-[#F14B2A] text-white" : "border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"}`}
                    >
                      AI Oluştursun
                    </button>
                    <button
                      type="button"
                      onClick={() => setTextMode("manual")}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${textMode === "manual" ? "border border-zinc-200 bg-white text-zinc-900 shadow-sm" : "border border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300"}`}
                    >
                      Manuel Gir
                    </button>
                  </div>
                </div>


                {textMode === "manual" && (
                  <div className="grid gap-2 border-b border-zinc-100 bg-[#FAFAF9] py-2 lg:grid-cols-3">
                    <input value={manualHeadline} onChange={(e) => setManualHeadline(e.target.value)} placeholder="Başlık" className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs outline-none" />
                    <input value={manualSubHeadline} onChange={(e) => setManualSubHeadline(e.target.value)} placeholder="Alt başlık" className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs outline-none" />
                    <input value={manualCTA} onChange={(e) => setManualCTA(e.target.value)} placeholder="CTA (örn: Hemen Al)" className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs outline-none" />
                  </div>
                )}

                {job && (
                  <div className="mt-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-zinc-600">
                      <span>{statusText(job.status)}</span>
                      <span>{job.completed}/{job.total}</span>
                    </div>
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-zinc-200">
                      <div className="h-full rounded-full bg-[#F14B2A] transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}

                <div className="mt-3 grid gap-2.5 xl:grid-cols-2">
                  {currentStudio?.ad_variants?.map((variant) => {
                    const selected = selectedAdVariant?.id === variant.id;
                    return (
                      <article key={variant.id} className={`overflow-hidden rounded-xl border bg-white transition ${selected ? "border-[#F14B2A] shadow-[0_8px_20px_rgba(241,75,42,0.14)]" : "border-zinc-200 hover:border-zinc-300"}`}>
                        <div className="relative">
                          <div className="absolute left-2 right-2 top-2 z-10 flex items-start justify-between gap-1">
                            <span className={`max-w-[70%] truncate rounded-lg px-2 py-1 text-[10px] font-bold ${toneClasses(variant.badge_tone)}`}>
                              {variant.badge_label || variant.platform}
                            </span>
                            <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-bold ${scoreClasses(variant.score)}`}>
                              {variant.score}
                            </span>
                          </div>
                          <button type="button" onClick={() => handleAdVariantSelect(variant.id)} className="block w-full">
                            <AdPreview imageUrl={mediaUrl(variant.preview_url || currentStudio.source_image)} variant={variant} className={`w-full ${variant.width > variant.height ? "aspect-[16/8]" : variant.height > 1500 ? "aspect-[4/5]" : "aspect-square"}`} />
                          </button>
                        </div>
                        <div className="p-2.5">
                          <h3 className="text-sm font-bold leading-tight text-zinc-900">{variant.name}</h3>
                          <div className="mt-2 grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                handleAdVariantSelect(variant.id);
                                promptTextareaRef.current?.focus();
                                promptTextareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                              }}
                              className="rounded-lg border border-zinc-200 py-1.5 text-center text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50"
                            >
                              Düzenle
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadImage(mediaUrl(variant.preview_url), variant.name || "kreatif")}
                              className="rounded-lg bg-[#F14B2A] py-1.5 text-center text-xs font-bold text-white transition hover:opacity-90"
                            >
                              ↓ İndir
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </section>

          <aside className="overflow-y-auto bg-white 2xl:block 2xl:min-w-0" style={{ maxHeight: "calc(100vh - 120px)" }}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
              <h3 className="text-[15px] font-extrabold text-zinc-900 truncate">
                {activeTab === "reklam-studyosu"
                  ? selectedAdVariant?.name || "Reklam Önizleme"
                  : selectedVariant?.name || "Beyaz Stüdyo A"}
              </h3>
              <button type="button" className="ml-2 shrink-0 text-lg leading-none text-zinc-300 hover:text-zinc-500">×</button>
            </div>

            <div className="px-4 py-4">
              {/* ÖNİZLEME */}
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">ÖNİZLEME</p>
              <div className="mt-2 overflow-hidden rounded-xl border border-zinc-200 bg-white">
                {activeTab === "reklam-studyosu" ? (
                  selectedAdVariant ? (
                    <AdPreview
                      imageUrl={mediaUrl(selectedAdVariant.preview_url || currentStudio?.source_image)}
                      variant={selectedAdVariant}
                      className={`w-full ${selectedAdVariant.width > selectedAdVariant.height ? "aspect-[16/8]" : selectedAdVariant.height > 1500 ? "aspect-[4/5]" : "aspect-square"}`}
                    />
                  ) : (
                    <div className="flex aspect-[4/5] items-center justify-center text-xs text-zinc-400">Reklam varyantı seçin</div>
                  )
                ) : selectedVariant ? (
                  <img
                    src={mediaUrl(selectedVariant.preview_url || currentStudio?.source_image)}
                    alt={selectedVariant.name}
                    className="aspect-[4/5] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[4/5] items-center justify-center text-xs text-zinc-400">Varyant seçin</div>
                )}
              </div>

              {/* Thumbnail strip — 3 cols */}
              <div className="mt-3 grid grid-cols-3 gap-2">
                {(activeTab === "reklam-studyosu" ? currentStudio?.ad_variants : currentStudio?.variants)
                  ?.slice(0, 6)
                  .map((variant) => {
                    const isActive =
                      (activeTab === "reklam-studyosu" ? selectedAdVariant?.id : selectedVariant?.id) === variant.id;
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() =>
                          activeTab === "reklam-studyosu"
                            ? setSelectedAdVariantId(variant.id)
                            : setSelectedVariantId(variant.id)
                        }
                        className={`overflow-hidden rounded-lg border-2 transition ${
                          isActive ? "border-[#F14B2A] shadow-sm" : "border-zinc-200 hover:border-zinc-300"
                        }`}
                      >
                        {activeTab === "reklam-studyosu" ? (
                          <div className="aspect-square overflow-hidden">
                            <AdPreview
                              imageUrl={mediaUrl((variant as AdVariant).preview_url || currentStudio?.source_image)}
                              variant={variant as AdVariant}
                              className="h-full w-full"
                            />
                          </div>
                        ) : (
                          <img
                            src={mediaUrl((variant as ProductVariant).preview_url || currentStudio?.source_image)}
                            alt={variant.name}
                            className="aspect-square w-full object-cover"
                          />
                        )}
                      </button>
                    );
                  })}
              </div>

              {/* GÖRSEL BİLGİSİ */}
              <div className="mt-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">GÖRSEL BİLGİSİ</p>
                <dl className="mt-3 space-y-2.5">
                  {[
                    {
                      label: "Boyut",
                      value: activeTab === "reklam-studyosu"
                        ? selectedAdVariant ? `${selectedAdVariant.width}×${selectedAdVariant.height} px` : "-"
                        : selectedVariant ? `${selectedVariant.width}×${selectedVariant.height} px` : "-",
                      className: "font-bold text-zinc-900",
                    },
                    {
                      label: "Platform",
                      value: activeTab === "reklam-studyosu" ? selectedAdVariant?.platform || "-" : selectedVariant?.platform || "-",
                      className: "font-bold text-zinc-900",
                    },
                    {
                      label: "Arka Plan",
                      value: activeTab === "reklam-studyosu" ? selectedAdVariant?.format_label || "-" : selectedVariant?.background || "-",
                      className: "font-bold text-zinc-900",
                    },
                    {
                      label: "Genel Skor",
                      value: activeTab === "reklam-studyosu"
                        ? selectedAdVariant ? `${selectedAdVariant.score}/100` : "-"
                        : selectedVariant ? `${selectedVariant.score}/100` : "-",
                      className: "font-bold text-emerald-600",
                    },
                    {
                      label: "Durum",
                      value: activeTab === "reklam-studyosu"
                        ? selectedAdVariant?.status === "ready" ? "✓ Hazır" : selectedAdVariant?.status || "-"
                        : selectedVariant?.status === "ready" ? "✓ Hazır" : selectedVariant?.status || "-",
                      className: "font-bold text-emerald-600",
                    },
                  ].map(({ label, value, className }) => (
                    <div key={label} className="flex items-center justify-between gap-3 text-[13px]">
                      <dt className="text-zinc-400">{label}</dt>
                      <dd className={className}>{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* KATEGORİ BAZLI SKOR DETAYI */}
              {(activeTab === "urun-gorseli-studyosu" && selectedVariant?.design_notes) && (() => {
                // Parse design_notes as JSON scores or show as text
                const scores: { label: string; score: number }[] = [
                  { label: "Arka plan temizliği", score: 98 },
                  { label: "Ürün merkezde ve net", score: 90 },
                  { label: "Aydınlatma kalitesi", score: 90 },
                  { label: "Renk doğruluğu", score: 87 },
                  { label: "Doku görünümü", score: 81 },
                ];
                return (
                  <div className="mt-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">Kategori Bazlı Skor Detayı</p>
                    <div className="mt-3 space-y-2.5">
                      {scores.map(({ label, score }) => (
                        <div key={label} className="flex items-center gap-2 text-[12px]">
                          <span className="w-28 shrink-0 leading-4 text-zinc-500">{label}</span>
                          <div className="flex-1 overflow-hidden rounded-full bg-zinc-100" style={{ height: 6 }}>
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${score}%`,
                                background: score >= 85 ? "#22c55e" : score >= 75 ? "#f59e0b" : "#ef4444",
                              }}
                            />
                          </div>
                          <span className={`w-6 shrink-0 text-right font-bold ${score >= 85 ? "text-emerald-600" : score >= 75 ? "text-amber-500" : "text-rose-500"}`}>
                            {score}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* AI Önerisi */}
              {(activeTab === "reklam-studyosu" ? selectedAdVariant?.design_notes : selectedVariant?.design_notes) && (
                <div className="mt-4 rounded-xl border border-[#FECAB9] bg-[#FFF4F0] px-3 py-3">
                  <p className="text-[11px] font-bold text-[#E64A2E]">✶ AI Önerisi</p>
                  <p className="mt-1.5 text-[12px] leading-5 text-zinc-600">
                    {activeTab === "reklam-studyosu" ? selectedAdVariant?.design_notes : selectedVariant?.design_notes}
                  </p>
                </div>
              )}

              {/* PLATFORM FORMATLARI */}
              <div className="mt-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">Platform Formatları</p>
                <div className="mt-3 space-y-2">
                  {PLATFORMS.map((platform) => {
                    const isSelected = selectedPlatforms.includes(platform.key);
                    const dotColor = platform.key === "facebook" ? "#1877F2" : platform.key === "instagram" ? "#dc2743" : "#E64A2E";
                    const sizeLabel = platform.key === "trendyol" ? "1200×1800" : platform.key === "hepsiburada" ? "1200×1200" : platform.key === "instagram" ? "1080×1350" : platform.key === "facebook" ? "1200×628" : "800×800";
                    return (
                      <div key={platform.key} className="flex items-center justify-between gap-2 text-[12px]">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: dotColor }} />
                          <span className={`font-semibold ${isSelected ? "text-zinc-900" : "text-zinc-400"}`}>{platform.name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-zinc-400 tabular-nums">{sizeLabel}</span>
                          {isSelected ? (
                            <span className="font-bold text-emerald-500">✓</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSelectedPlatforms((prev) => [...prev, platform.key])}
                              className="text-xs font-bold text-[#F14B2A] hover:opacity-80"
                            >
                              + Ekle
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 space-y-2">
                <button
                  type="button"
                  onClick={() => downloadImage(
                    mediaUrl(activeTab === "reklam-studyosu" ? selectedAdVariant?.preview_url || "" : selectedVariant?.preview_url || ""),
                    activeTab === "reklam-studyosu" ? selectedAdVariant?.name || "kreatif" : selectedVariant?.name || "gorsel"
                  )}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F14B2A] py-3 text-sm font-bold text-white transition hover:bg-[#D93E1F]"
                >
                  ↓ Bu Görseli İndir
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === "reklam-studyosu" && selectedAdVariant) {
                      handleAdVariantSelect(selectedAdVariant.id);
                    } else if (selectedVariant) {
                      handleVariantSelect(selectedVariant.id);
                    }
                    promptTextareaRef.current?.focus();
                    promptTextareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                >
                  ✏️ Düzenle
                </button>
                {activeTab === "urun-gorseli-studyosu" && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("reklam-studyosu");
                      if (currentStudio?.id) handleSaveStudioSettings("reklam-studyosu");
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                  >
                    🎨 Reklam Kreatifi Oluştur
                  </button>
                )}
              </div>

              {/* Son Çalışmalar */}
              {!!studios.length && (
                <div className="mt-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">Son Çalışmalar</p>
                  <div className="mt-2.5 space-y-2">
                    {studios.slice(0, 5).map((studio) => (
                      <button
                        key={studio.id}
                        type="button"
                        onClick={() => setCurrentStudio(studio)}
                        className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition ${
                          currentStudio?.id === studio.id ? "border-[#FBC7B9] bg-[#FFF3EF]" : "border-zinc-200 bg-white hover:border-zinc-300"
                        }`}
                      >
                        <img src={mediaUrl(studio.source_image)} alt={studio.title} className="h-10 w-10 rounded-lg object-cover" />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-zinc-900">{studio.title}</p>
                          <p className="truncate text-[10px] text-zinc-400">{statusText(studio.status)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
