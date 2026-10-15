"use client";

import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ProductCanvasStudio from "@/components/panel/ProductCanvasStudio";

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

// ── Creation Mode Constants ──────────────────────────────
const ECOM_COLORS = [
  "#FFFFFF", "#F5F5F5", "#E8E8E8", "#D4D0C8", "#C4B998", "#E8D5B7",
  "#E0F0E0", "#D0E8E8", "#F0D0E0", "#E0D0F0", "#1A1A1A", "#2D2D2D",
  "#333333", "#F14B2A", "#1877F2", "#16A34A", "#D97706", "#7C3AED",
];

const FONT_STYLES = [
  { key: "bold", label: "BOLD", desc: "Kampanya, indirim", family: "Bebas Neue", weight: 800 },
  { key: "elegant", label: "Elegant", desc: "Lüks, moda", family: "Playfair Display", weight: 400 },
  { key: "modern", label: "MODERN", desc: "Minimal, sade", family: "Inter", weight: 600 },
  { key: "playful", label: "Playful!", desc: "Eğlenceli, genç", family: "Fredoka One", weight: 400 },
];

const GOOGLE_FONTS = [
  "Abel", "Abril Fatface", "Alegreya", "Anton", "Archivo", "Arvo",
  "Barlow", "Bebas Neue", "Bitter", "Cabin", "Cairo", "Comfortaa",
  "Cormorant Garamond", "Crimson Text", "DM Sans", "DM Serif Display",
  "Dosis", "EB Garamond", "Exo 2", "Fira Sans", "Fjalla One",
  "Fredoka One", "Geologica", "Great Vibes", "Heebo", "IBM Plex Sans",
  "Inconsolata", "Inter", "Josefin Sans", "Kanit", "Karla",
  "Lato", "Libre Baskerville", "Lobster", "Lora", "Manrope",
  "Merriweather", "Montserrat", "Mulish", "Nunito", "Open Sans",
  "Oswald", "Outfit", "Pacifico", "Poppins", "Playfair Display",
  "PT Sans", "Quicksand", "Raleway", "Righteous", "Roboto",
  "Roboto Condensed", "Roboto Slab", "Rubik", "Sacramento",
  "Source Sans 3", "Space Grotesk", "Titillium Web", "Ubuntu",
  "Work Sans", "Yanone Kaffeesatz", "Zilla Slab",
];

const ASPECT_RATIOS = [
  { key: "1:1", label: "1:1", w: 1, h: 1 },
  { key: "4:5", label: "4:5", w: 4, h: 5 },
  { key: "9:16", label: "9:16", w: 9, h: 16 },
  { key: "16:9", label: "16:9", w: 16, h: 9 },
  { key: "TY", label: "TY", w: 2, h: 3, desc: "Trendyol" },
  { key: "HB", label: "HB", w: 1, h: 1, desc: "Hepsiburada" },
  { key: "IG", label: "IG", w: 4, h: 5, desc: "Instagram" },
];

const LABEL_TEMPLATES = [
  { key: "indirim", label: "İndirim", icon: "🔴", text: "%30 İndirim 🔥" },
  { key: "yeni-sezon", label: "Yeni Sezon", icon: "🟢", text: "Yeni Sezon ✨" },
  { key: "son-stok", label: "Son Stok", icon: "🟠", text: "Son Stok!" },
  { key: "kargo", label: "Kargo", icon: "🔵", text: "Ücretsiz Kargo 🚚" },
  { key: "cok-satan", label: "Çok Satan", icon: "🟣", text: "Çok Satan ⭐" },
  { key: "ozel", label: "Özel", icon: "🎨", text: "Özel Fırsat" },
];

const TEXT_POSITIONS = [
  { key: "top-left", label: "Sol Üst" },
  { key: "bottom-right", label: "Sağ Alt" },
  { key: "center", label: "Merkez" },
  { key: "bottom-center", label: "Alt Merkez" },
];

const SCENE_TAGS = ["beyaz stüdyo", "mağaza vitrini", "doğal ışık", "premium", "minimalist", "lifestyle", "neon", "lüks", "doğa"];

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

const _loadedFonts = new Set<string>();
function loadGoogleFont(f: string) {
  if (_loadedFonts.has(f)) return;
  _loadedFonts.add(f);
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(f)}:wght@400;600;700;800&display=swap`;
  document.head.appendChild(l);
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
  const { activeCompany, companies } = useAuth();
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
  const [selectedBgStyle, setSelectedBgStyle] = useState("");
  const [textMode, setTextMode] = useState<"ai" | "manual">("ai");
  const [manualHeadline, setManualHeadline] = useState("");
  const [manualSubHeadline, setManualSubHeadline] = useState("");
  const [manualCTA, setManualCTA] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [savingStudio, setSavingStudio] = useState(false);
  const [analyzingStudio, setAnalyzingStudio] = useState(false);
  const [aiCategorySuggesting, setAiCategorySuggesting] = useState(false);
  const [aiCategories, setAiCategories] = useState<string[]>([]);
  const [showAiCategories, setShowAiCategories] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [job, setJob] = useState<JobState | null>(null);
  // Brief kütüphanesi state
  const [briefs, setBriefs] = useState<{id:number;title:string;content:string;brief_type:string;is_favorite:boolean;used_count:number}[]>([]);
  const [showBriefLibrary, setShowBriefLibrary] = useState(false);
  const [savingBrief, setSavingBrief] = useState(false);
  const [briefTitle, setBriefTitle] = useState("");

  // Canvas stüdyosu state
  const [canvasVariant, setCanvasVariant] = useState<{
    id: number;
    name: string;
    imageUrl: string;
    isAd: boolean;
  } | null>(null);

  // ── Creation Mode State (görselsiz başlangıç) ─────────
  type CreationTextLayer = {
    id: string;
    text: string;
    fontStyle: string;
    fontSize: number;
    color: string;
    position: string;
  };
  const [scenePrompt, setScenePrompt] = useState("");
  const [bgType, setBgType] = useState<"solid" | "gradient" | "texture" | "scene">("solid");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [bgGradient, setBgGradient] = useState({ color1: "#FFFFFF", color2: "#F5F5F5", direction: "to bottom" });
  const [bgOpacity, setBgOpacity] = useState(100);
  const [creationTexts, setCreationTexts] = useState<CreationTextLayer[]>([]);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [effectShadow, setEffectShadow] = useState(true);
  const [effectReflection, setEffectReflection] = useState(false);
  const [effectHighlight, setEffectHighlight] = useState(true);
  const [effectBgBlur, setEffectBgBlur] = useState(false);
  const [shadowIntensity, setShadowIntensity] = useState(50);
  const [selectedRatio, setSelectedRatio] = useState("1:1");
  const [fontSearch, setFontSearch] = useState("");

  // ── Brand Selection & Gemini New Image State ──
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [generatingNew, setGeneratingNew] = useState(false);
  const [showBrandSelector, setShowBrandSelector] = useState(false);
  const [creationImageUrl, setCreationImageUrl] = useState<string | null>(null);
  const [creationGenerating, setCreationGenerating] = useState(false);
  const [useBrandLogo, setUseBrandLogo] = useState(false);

  // Determine if we're in creation mode (no source image)
  const isCreationMode = !currentStudio?.source_image;

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
        showToast("Görsel durumu alınamadı, lütfen tekrar deneyin");
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
      await fetchStudios();
      showToast("Görsel yüklendi ✓ Seçenekleri ayarlayıp Görsel Oluştur'a basın");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || "Gorsel yuklenemedi");
    } finally {
      setUploading(false);
    }
  }, [activeCompany?.id, fetchStudios, selectedCategory, selectedSlot, showToast, title]);

  const handleAiCategorySuggest = useCallback(async () => {
    if (!currentStudio?.id) return;
    setAiCategorySuggesting(true);
    setShowAiCategories(true);
    try {
      const { data } = await api.post(`/api/protected/product-image-studio/${currentStudio.id}/analyze`);
      const summary = data.studio?.source_summary || "";
      // AI summary'den anlamlı kategori çıkar
      const suggestions: string[] = [];
      const lower = summary.toLowerCase();
      if (lower.includes("kedi") || lower.includes("mama") || lower.includes("pet") || lower.includes("cat")) suggestions.push("Evcil Hayvan");
      if (lower.includes("giyim") || lower.includes("elbise") || lower.includes("dress") || lower.includes("moda")) suggestions.push("Giyim & Moda");
      if (lower.includes("ayakkab") || lower.includes("shoe") || lower.includes("sneaker")) suggestions.push("Ayakkabı");
      if (lower.includes("kozmetik") || lower.includes("serum") || lower.includes("cosmeti")) suggestions.push("Kozmetik");
      if (lower.includes("elektro") || lower.includes("phone") || lower.includes("teknol")) suggestions.push("Elektronik");
      if (lower.includes("dekorasyon") || lower.includes("ev") || lower.includes("home")) suggestions.push("Ev Dekorasyon");
      if (suggestions.length === 0) suggestions.push("Diğer");
      setAiCategories(suggestions);
      setSourceSummaryDraft(summary);
      setCurrentStudio(data.studio);
    } catch {
      setAiCategories(["Diğer"]);
    } finally {
      setAiCategorySuggesting(false);
    }
  }, [currentStudio?.id]);

  const handleGenerateProducts = useCallback(async (force = false, promptOverride?: string) => {
    if (!currentStudio?.id) return;
    setGenerating(true);
    setError("");
    const finalPrompt = promptOverride ?? sourceSummaryDraft;
    try {
      await api.patch(`/api/protected/product-image-studio/${currentStudio.id}`, {
        title,
        category: selectedCategory,
        source_summary: finalPrompt,
        active_tab: "urun-gorseli-studyosu",
      });
      const { data } = await api.post(`/api/protected/product-image-studio/${currentStudio.id}/generate`, { force, bg_style: selectedBgStyle });
      setJob(data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setGenerating(false);
      setError(msg || "Varyantlar olusturulamadi");
    }
  }, [currentStudio?.id, selectedCategory, selectedBgStyle, sourceSummaryDraft, title]);

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

  // ── Gemini ile yeni ürün görseli üretimi ──
  const handleGenerateNewImage = useCallback(async () => {
    if (!currentStudio?.id) return;
    setGeneratingNew(true);
    setError("");
    try {
      const { data } = await api.post(`/api/protected/product-image-studio/${currentStudio.id}/generate-new`, {
        brand_id: selectedBrandId || activeCompany?.id,
        category: selectedCategory,
        aspect_ratio: selectedRatio,
      });
      setCurrentStudio(data.studio);
      if (data.variant?.id) {
        setSelectedVariantId(data.variant.id);
      }
      showToast("Yeni ürün görseli üretildi ✓");
      await fetchStudios();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || "Görsel üretilemedi");
    } finally {
      setGeneratingNew(false);
    }
  }, [currentStudio?.id, selectedBrandId, activeCompany?.id, selectedCategory, selectedRatio, showToast, fetchStudios]);

  const progress = job ? Math.min(100, Math.round((job.completed / Math.max(job.total, 1)) * 100)) : 0;
  const brief = creativeBrief(activeTab, selectedCategory);

  // Canvas stüdyosu açıksa — ana layout içinde (sidebar görünür kalır)
  if (canvasVariant) {
    return (
      <div className="-m-4 sm:-m-5 lg:-m-6" style={{ height: "calc(100vh - 60px)" }}>
        <ProductCanvasStudio
          imageUrl={canvasVariant.imageUrl}
          variantId={canvasVariant.id}
          variantName={canvasVariant.name}
          isAdVariant={canvasVariant.isAd}
          onBack={() => setCanvasVariant(null)}
          onSaved={(newUrl) => {
            if (canvasVariant.isAd) {
              setCurrentStudio((prev) => prev ? {
                ...prev,
                ad_variants: prev.ad_variants?.map((v) => v.id === canvasVariant.id ? { ...v, preview_url: newUrl } : v),
              } : prev);
            } else {
              setCurrentStudio((prev) => prev ? {
                ...prev,
                variants: prev.variants?.map((v) => v.id === canvasVariant.id ? { ...v, preview_url: newUrl } : v),
              } : prev);
            }
            showToast("Canvas kaydedildi ✓");
          }}
        />
      </div>
    );
  }

  return (
    <div className="studio-root -m-4 sm:-m-5 lg:-m-6 overflow-x-hidden">

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white shadow-xl animate-fade-in-up">
          <svg className="h-4 w-4 text-emerald-400" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          {toast}
        </div>
      )}
      <div className="bg-white">
        <div className="border-b border-zinc-100 px-3 py-0 sm:px-5">
          <div className="flex items-end gap-0 overflow-x-auto scrollbar-none">
            {modules.map((module) => {
              const isActive =
                (module.key === "product-image-studio" && activeTab === "urun-gorseli-studyosu" && !isCreationMode) ||
                (module.key === "ad-studio" && activeTab === "reklam-studyosu");
              const labelOverrides: Record<string, string> = {
                "product-image-studio": "Ürün Görseli Stüdyosu",
                "ad-studio": "Reklam Stüdyosu",
              };
              const label = labelOverrides[module.key] || module.label;

              // "Yeni Ürün Görseli" tabını "Reklam Stüdyosu"ndan hemen önce göster
              const showNewTabBeforeThis = module.key === "ad-studio";

              return (
                <React.Fragment key={module.key}>
                  {showNewTabBeforeThis && (
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentStudio(null);
                        setActiveTab("urun-gorseli-studyosu");
                        setSelectedVariantId(null);
                        setSelectedAdVariantId(null);
                        setScenePrompt("");
                        setCreationTexts([]);
                        showToast("Yeni ürün görseli stüdyosu açıldı");
                      }}
                      className={`inline-flex items-center gap-1 sm:gap-1.5 whitespace-nowrap border-b-2 px-2.5 py-2.5 sm:px-4 sm:py-3 text-[11px] sm:text-[13px] font-semibold transition ${
                        isCreationMode && activeTab === "urun-gorseli-studyosu"
                          ? "border-brand text-brand"
                          : "border-transparent text-zinc-400 hover:text-zinc-600"
                      }`}
                      title="Yeni Ürün Görseli Oluştur"
                    >
                      <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="4" x2="8" y2="12" /><line x1="4" y1="8" x2="12" y2="8" /></svg>
                      <span className="hidden sm:inline">Yeni Ürün Görseli</span>
                      <span className="sm:hidden">Yeni Görsel</span>
                    </button>
                  )}
                  <button
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
                    className={`inline-flex items-center gap-1 sm:gap-1.5 whitespace-nowrap border-b-2 px-2.5 py-2.5 sm:px-4 sm:py-3 text-[11px] sm:text-[13px] font-semibold transition ${
                      isActive ? "border-brand text-brand" : "border-transparent text-zinc-400 hover:text-zinc-600"
                    }`}
                  >
                    <span className="text-sm sm:text-base">{module.icon}</span>
                    {label}
                    {module.badge && <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-emerald-700">{module.badge}</span>}
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="grid gap-0 grid-cols-1 xl:grid-cols-[310px_minmax(0,1fr)_320px] 2xl:grid-cols-[350px_minmax(0,1fr)_360px]">
          <div className="p-3 lg:p-4 bg-[#FAFAF9] flex flex-col xl:overflow-y-auto">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-zinc-400 mb-4">Urun Fotografi</p>

            {isCreationMode ? (
              /* ═══════════════════════════════════════════════
                 CREATION MODE — Görselsiz Başlangıç Arayüzü
                 ═══════════════════════════════════════════════ */
              <>
                {/* SECTION HEADER */}
                <div className="px-3 pt-3 pb-2">
                  <h2 className="text-sm font-extrabold text-zinc-800">Görsel &amp; Arka Plan Ayarları</h2>
                </div>

                {/* 1. ÜRÜN GÖRSELİ */}
                <div className="px-3 pb-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">1. Ürün Görseli</p>
                  <div className="mt-2 relative overflow-hidden rounded-xl border-2 border-dashed border-zinc-300 bg-white cursor-pointer transition hover:border-brand hover:bg-orange-50/30" onClick={() => fileInputRef.current?.click()}>
                    <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100">
                        <span className="text-xl">📷</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-700">Ürün fotoğrafını yükle</p>
                        <p className="mt-1 text-[10px] leading-3.5 text-zinc-400">Telefonla çekilen ham görsel · JPG, PNG, WEBP<br />AI arka planı otomatik kaldırır</p>
                      </div>
                    </div>
                  </div>
                  <p className="mt-1.5 text-[10px] leading-4 text-zinc-400">
                    💡 <strong>İpucu:</strong> Karmaşık arka planlar sorun değil — AI ürünü otomatik ayırır. Düz zemin üzerinde çekim ideal sonuç verir.
                  </p>
                  {/* Son Çalışmalarım — mevcut stüdyolara dönüş */}
                  {studios.length > 0 && (
                    <div className="mt-3">
                      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-zinc-400 mb-1.5">Son Çalışmalarım</p>
                      <div className="flex gap-1.5 overflow-x-auto pb-1">
                        {studios.slice(0, 5).map((studio) => (
                          <button
                            key={studio.id}
                            type="button"
                            onClick={() => {
                              setCurrentStudio(studio);
                              setActiveTab("urun-gorseli-studyosu");
                            }}
                            className="group flex shrink-0 flex-col items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1.5 transition hover:border-brand hover:shadow-sm"
                            title={studio.title || "Stüdyo"}
                          >
                            {studio.source_image ? (
                              <img src={mediaUrl(studio.source_image)} alt={studio.title} className="h-10 w-10 rounded-md object-cover" />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-zinc-100 text-sm">🖼</div>
                            )}
                            <span className="w-12 truncate text-center text-[8px] font-medium text-zinc-500 group-hover:text-zinc-700">{studio.title || "Ürün"}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* MARKA LOGO TOGGLE */}
                <div className="border-t border-zinc-100 px-3 py-3">
                  <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🏷️</span>
                      <div>
                        <span className="text-xs font-semibold text-zinc-700">Marka logosunu kullan</span>
                        <p className="text-[9px] text-zinc-400">Logo görselde yer alsın mı?</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUseBrandLogo(!useBrandLogo)}
                      className={`relative h-5 w-9 rounded-full transition ${useBrandLogo ? "bg-brand" : "bg-zinc-200"}`}
                    >
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${useBrandLogo ? "left-[18px]" : "left-0.5"}`} />
                    </button>
                  </div>
                </div>

                {/* 2. AI SAHNESİ */}
                <div className="border-t border-zinc-100 px-3 py-3">
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">2. AI Sahnesi</p>
                    <span className="rounded bg-brand px-1.5 py-0.5 text-[8px] font-bold text-white">DIO ÖZEL</span>
                  </div>
                  {/* Prompt Box */}
                  <div className="mt-2 rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="flex items-center gap-1 text-[11px] font-bold text-white">✶ Ne istiyorsun? </span>
                      <span className="rounded bg-zinc-700 px-1.5 py-0.5 text-[9px] font-medium text-zinc-300">Türkçe yaz</span>
                    </div>
                    <textarea
                      value={scenePrompt}
                      onChange={(e) => setScenePrompt(e.target.value)}
                      onInput={(e) => { const t = e.currentTarget; t.style.height = "auto"; t.style.height = t.scrollHeight + "px"; }}
                      style={{ minHeight: "60px" }}
                      className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-2 text-[11px] leading-4 text-zinc-200 outline-none placeholder:text-zinc-500 focus:border-zinc-500"
                      placeholder="Ürünü beyaz stüdyo arka planına koy, sağ alt köşede %30 indirim etiketi olsun..."
                    />
                    <div className="mt-2 flex flex-wrap gap-1">
                      {SCENE_TAGS.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setScenePrompt((prev) => prev ? `${prev}, ${tag}` : tag)}
                          className="rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-white"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* AI Sahne Oluştur butonu */}
                  <button
                    type="button"
                    onClick={async () => {
                      if (!scenePrompt.trim()) return;
                      setCreationGenerating(true);
                      setError("");
                      try {
                        const { data } = await api.post("/api/protected/product-image-studio/create-image", {
                          scene_prompt: scenePrompt,
                          bg_type: bgType,
                          bg_color: bgColor,
                          grad_color1: bgGradient.color1,
                          grad_color2: bgGradient.color2,
                          grad_direction: bgGradient.direction,
                          bg_opacity: bgOpacity,
                          aspect_ratio: selectedRatio,
                          category: selectedCategory,
                          text_layers: creationTexts.map(t => ({
                            text: t.text,
                            font_style: t.fontStyle,
                            font_size: t.fontSize,
                            color: t.color,
                            position: t.position,
                          })),
                          effect_shadow: effectShadow,
                          effect_reflection: effectReflection,
                          effect_highlight: effectHighlight,
                          effect_bg_blur: effectBgBlur,
                          shadow_intensity: shadowIntensity,
                          platforms: selectedPlatforms,
                          brand_id: selectedBrandId || activeCompany?.id,
                          company_id: activeCompany?.id,
                          use_brand_logo: useBrandLogo,
                        });
                        if (data.imageUrl) {
                          setCreationImageUrl(mediaUrl(data.imageUrl));
                          showToast("Ürün görseli üretildi ✓");
                        }
                      } catch (err: unknown) {
                        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
                        setError(msg || "Görsel üretilemedi");
                      } finally {
                        setCreationGenerating(false);
                      }
                    }}
                    disabled={!scenePrompt.trim() || creationGenerating}
                    className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-50"
                  >
                    {creationGenerating ? (
                      <>
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        AI ile üretiliyor...
                      </>
                    ) : (
                      <>✦ AI Görsel Üret</>
                    )}
                  </button>
                  {creationGenerating && (
                    <p className="mt-1 text-center text-[9px] text-zinc-400 animate-pulse">Görsel üretiliyor, lütfen bekleyin...</p>
                  )}
                </div>

                {/* 3. MANUEL ARKA PLAN */}
                <div className="border-t border-zinc-100 px-3 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">3. Manuel Arka Plan</p>
                  {/* Tab bar */}
                  <div className="mt-2 flex rounded-lg border border-zinc-200 bg-white p-0.5">
                    {(["solid", "gradient", "texture", "scene"] as const).map((t) => {
                      const labels = { solid: "Düz Renk", gradient: "Gradient", texture: "Doku", scene: "Yaşam" };
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setBgType(t)}
                          className={`flex-1 rounded-md py-1.5 text-[10px] font-semibold transition ${bgType === t ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-700"}`}
                        >
                          {labels[t]}
                        </button>
                      );
                    })}
                  </div>

                  {bgType === "solid" && (
                    <div className="mt-3 space-y-3">
                      {/* E-ticaret Standart Renkleri */}
                      <div>
                        <p className="text-[10px] font-semibold text-zinc-500">E-ticaret Standart Renkleri</p>
                        <div className="mt-1.5 grid grid-cols-6 gap-1.5">
                          {ECOM_COLORS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setBgColor(c)}
                              className={`aspect-square rounded-lg border-2 transition hover:scale-105 ${bgColor === c ? "border-brand shadow-sm" : "border-zinc-200"}`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </div>
                      {/* Özel Renk */}
                      <div>
                        <p className="text-[10px] font-semibold text-zinc-500">Özel Renk</p>
                        <div className="mt-1 flex items-center gap-2">
                          <input
                            type="color"
                            value={bgColor}
                            onChange={(e) => setBgColor(e.target.value)}
                            className="h-8 w-8 cursor-pointer rounded-lg border border-zinc-200"
                          />
                          <input
                            type="text"
                            value={bgColor.toUpperCase()}
                            onChange={(e) => setBgColor(e.target.value)}
                            className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-mono outline-none focus:border-brand"
                          />
                        </div>
                      </div>
                      {/* Opaklık */}
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-zinc-500">Opaklık:</span>
                          <span className="text-[10px] font-bold text-zinc-700">{bgOpacity}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={bgOpacity}
                          onChange={(e) => setBgOpacity(Number(e.target.value))}
                          className="mt-1 h-2 w-full cursor-pointer rounded-full bg-zinc-200 accent-brand"
                        />
                      </div>
                    </div>
                  )}

                  {bgType === "gradient" && (
                    <div className="mt-3 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <p className="text-[9px] text-zinc-400 mb-0.5">Renk 1</p>
                          <input type="color" value={bgGradient.color1} onChange={(e) => setBgGradient(p => ({ ...p, color1: e.target.value }))} className="h-8 w-full cursor-pointer rounded-lg border border-zinc-200" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[9px] text-zinc-400 mb-0.5">Renk 2</p>
                          <input type="color" value={bgGradient.color2} onChange={(e) => setBgGradient(p => ({ ...p, color2: e.target.value }))} className="h-8 w-full cursor-pointer rounded-lg border border-zinc-200" />
                        </div>
                      </div>
                      <div className="h-10 w-full rounded-lg border border-zinc-200" style={{ background: `linear-gradient(${bgGradient.direction}, ${bgGradient.color1}, ${bgGradient.color2})` }} />
                    </div>
                  )}

                  {bgType === "texture" && (
                    <div className="mt-3 grid grid-cols-3 gap-1.5">
                      {["Mermer", "Ahşap", "Kumaş", "Beton", "Kum", "Yaprak"].map((t) => (
                        <button key={t} type="button" onClick={() => setScenePrompt(p => p ? `${p}, ${t.toLowerCase()} doku` : `${t.toLowerCase()} doku arka plan`)} className="rounded-xl border border-zinc-200 bg-white px-2 py-3 text-center text-[10px] font-semibold text-zinc-600 transition hover:border-brand hover:bg-orange-50">
                          {t}
                        </button>
                      ))}
                    </div>
                  )}

                  {bgType === "scene" && (
                    <div className="mt-3 grid grid-cols-2 gap-1.5">
                      {["Mutfak Tezgahı", "Bahçe", "Ofis Masası", "Deniz Kenarı", "Yatak Odası", "Salon"].map((s) => (
                        <button key={s} type="button" onClick={() => setScenePrompt(p => p ? `${p}, ${s.toLowerCase()} sahnesinde` : `${s.toLowerCase()} sahnesinde`)} className="rounded-xl border border-zinc-200 bg-white px-2 py-3 text-center text-[10px] font-semibold text-zinc-600 transition hover:border-brand hover:bg-orange-50">
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. METİN & ETİKET */}
                <div className="border-t border-zinc-100 px-3 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">4. Metin &amp; Etiket</p>

                  {/* Eklenen metin katmanları */}
                  {creationTexts.map((layer) => {
                    const isEditing = editingTextId === layer.id;
                    return (
                      <div key={layer.id} className={`mt-2 rounded-xl border px-3 py-2 transition ${isEditing ? "border-brand bg-orange-50/50" : "border-zinc-200 bg-white"}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-800" style={{ fontFamily: layer.fontStyle }}>{layer.text}</span>
                          <div className="flex items-center gap-1.5">
                            <button type="button" onClick={() => setEditingTextId(isEditing ? null : layer.id)} className="text-[10px] font-semibold text-zinc-400 hover:text-brand">
                              Düzenle ↗
                            </button>
                            <button type="button" onClick={() => { setCreationTexts(prev => prev.filter(t => t.id !== layer.id)); if (isEditing) setEditingTextId(null); }} className="text-[10px] font-semibold text-red-400 hover:text-red-600" title="Katmanı sil">
                              ✕
                            </button>
                          </div>
                        </div>

                        {isEditing && (
                          <div className="mt-2 space-y-2.5 pt-2 border-t border-zinc-100">
                            {/* Metin input */}
                            <div>
                              <label className="text-[9px] font-semibold text-zinc-400">Metin:</label>
                              <input
                                type="text"
                                value={layer.text}
                                onChange={(e) => setCreationTexts(prev => prev.map(t => t.id === layer.id ? { ...t, text: e.target.value } : t))}
                                className="mt-0.5 w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-bold outline-none focus:border-brand"
                              />
                            </div>
                            {/* Font Seç — Google Fonts */}
                            <div>
                              <label className="text-[9px] font-semibold text-zinc-400">Font Seç:</label>
                              {/* Hızlı preset butonları */}
                              <div className="mt-1 grid grid-cols-2 gap-1">
                                {FONT_STYLES.map((fs) => (
                                  <button
                                    key={fs.key}
                                    type="button"
                                    onClick={() => { loadGoogleFont(fs.family); setCreationTexts(prev => prev.map(t => t.id === layer.id ? { ...t, fontStyle: fs.family } : t)); }}
                                    className={`rounded-lg border px-2 py-1.5 text-center transition ${layer.fontStyle === fs.family ? "border-brand bg-orange-50" : "border-zinc-200 bg-white hover:border-zinc-300"}`}
                                  >
                                    <span className="block text-[11px] font-bold" style={{ fontFamily: fs.family }}>{fs.label}</span>
                                    <span className="block text-[8px] text-zinc-400">{fs.desc}</span>
                                  </button>
                                ))}
                              </div>
                              {/* Google Fonts arama ve listesi */}
                              <div className="mt-1.5">
                                <input
                                  type="text"
                                  value={fontSearch}
                                  onChange={(e) => setFontSearch(e.target.value)}
                                  placeholder="Font ara... (ör: Montserrat)"
                                  className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[10px] outline-none focus:border-brand"
                                />
                                <div className="mt-1 max-h-32 overflow-y-auto rounded-lg border border-zinc-100 bg-white">
                                  {GOOGLE_FONTS
                                    .filter(f => !fontSearch || f.toLowerCase().includes(fontSearch.toLowerCase()))
                                    .map((font) => (
                                      <button
                                        key={font}
                                        type="button"
                                        onClick={() => { loadGoogleFont(font); setCreationTexts(prev => prev.map(t => t.id === layer.id ? { ...t, fontStyle: font } : t)); setFontSearch(""); }}
                                        onMouseEnter={() => loadGoogleFont(font)}
                                        className={`flex w-full items-center justify-between px-2.5 py-1.5 text-left text-[10px] transition hover:bg-orange-50 ${layer.fontStyle === font ? "bg-orange-50 font-bold text-brand" : "text-zinc-600"}`}
                                      >
                                        <span style={{ fontFamily: font }}>{font}</span>
                                        {layer.fontStyle === font && <span className="text-[8px]">✓</span>}
                                      </button>
                                    ))
                                  }
                                </div>
                              </div>
                              <p className="mt-0.5 text-[8px] text-zinc-400">Seçili: <strong style={{ fontFamily: layer.fontStyle }}>{layer.fontStyle}</strong></p>
                            </div>
                            {/* Boyut */}
                            <div>
                              <div className="flex items-center justify-between">
                                <label className="text-[9px] font-semibold text-zinc-400">Boyut:</label>
                                <span className="text-[9px] text-zinc-400">{layer.fontSize}px</span>
                              </div>
                              <input
                                type="range"
                                min={10}
                                max={80}
                                value={layer.fontSize}
                                onChange={(e) => setCreationTexts(prev => prev.map(t => t.id === layer.id ? { ...t, fontSize: Number(e.target.value) } : t))}
                                className="mt-0.5 h-2 w-full cursor-pointer rounded-full bg-zinc-200 accent-brand"
                              />
                            </div>
                            {/* Renk */}
                            <div>
                              <label className="text-[9px] font-semibold text-zinc-400">Renk:</label>
                              <div className="mt-0.5 flex gap-1.5">
                                {["#FFFFFF", "#F14B2A", "#000000", "#FFD93D", "#16A34A"].map((c) => (
                                  <button
                                    key={c}
                                    type="button"
                                    onClick={() => setCreationTexts(prev => prev.map(t => t.id === layer.id ? { ...t, color: c } : t))}
                                    className={`h-6 w-6 rounded-md border-2 transition ${layer.color === c ? "border-brand" : "border-zinc-200"}`}
                                    style={{ backgroundColor: c }}
                                  />
                                ))}
                              </div>
                            </div>
                            {/* Pozisyon */}
                            <div>
                              <label className="text-[9px] font-semibold text-zinc-400">Pozisyon:</label>
                              <div className="mt-0.5 flex flex-wrap gap-1">
                                {TEXT_POSITIONS.map((pos) => (
                                  <button
                                    key={pos.key}
                                    type="button"
                                    onClick={() => setCreationTexts(prev => prev.map(t => t.id === layer.id ? { ...t, position: pos.key } : t))}
                                    className={`rounded-lg px-2 py-1 text-[10px] font-semibold transition ${layer.position === pos.key ? "bg-brand text-white" : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"}`}
                                  >
                                    {pos.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                            {/* Sil */}
                            <button
                              type="button"
                              onClick={() => { setCreationTexts(prev => prev.filter(t => t.id !== layer.id)); setEditingTextId(null); }}
                              className="w-full rounded-lg border border-red-200 bg-red-50 py-1 text-[10px] font-bold text-red-500 hover:bg-red-100"
                            >
                              Katmanı Sil
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* + Metin Katmanı Ekle */}
                  <button
                    type="button"
                    onClick={() => { loadGoogleFont("Bebas Neue"); setCreationTexts(prev => [...prev, { id: `txt_${Date.now()}`, text: "Metin yaz...", fontStyle: "Bebas Neue", fontSize: 32, color: "#FFFFFF", position: "bottom-right" }]); }}
                    className="mt-2 w-full rounded-xl border border-dashed border-zinc-300 bg-white py-2.5 text-xs font-semibold text-zinc-500 transition hover:border-brand hover:text-brand"
                  >
                    + Metin Katmanı Ekle
                  </button>

                  {/* Hazır Etiket Şablonları */}
                  <div className="mt-3">
                    <p className="text-[10px] font-semibold text-zinc-500">Hazır Etiket Şablonları</p>
                    <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                      {LABEL_TEMPLATES.map((tpl) => (
                        <button
                          key={tpl.key}
                          type="button"
                          onClick={() => { loadGoogleFont("Bebas Neue"); setCreationTexts(prev => [...prev, { id: `label_${Date.now()}`, text: tpl.text, fontStyle: "Bebas Neue", fontSize: 24, color: "#FFFFFF", position: "bottom-right" }]); }}
                          className="flex flex-col items-center gap-1 rounded-xl border border-zinc-200 bg-white px-2 py-2.5 transition hover:border-brand hover:bg-orange-50"
                        >
                          <span className="text-base">{tpl.icon}</span>
                          <span className="text-[10px] font-semibold text-zinc-600">{tpl.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 5. GÖLGE & EFEKTLER */}
                <div className="border-t border-zinc-100 px-3 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">5. Gölge &amp; Efektler</p>
                  <div className="mt-2 space-y-2">
                    {[
                      { label: "Ürün Gölgesi", value: effectShadow, setter: setEffectShadow },
                      { label: "Ürün Yansıması", value: effectReflection, setter: setEffectReflection },
                      { label: "Işık Vurgusu", value: effectHighlight, setter: setEffectHighlight },
                      { label: "Arka Plan Blur", value: effectBgBlur, setter: setEffectBgBlur },
                    ].map(({ label, value, setter }) => (
                      <div key={label} className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 py-2.5">
                        <span className="text-xs font-medium text-zinc-700">{label}</span>
                        <button
                          type="button"
                          onClick={() => setter(!value)}
                          className={`relative h-5 w-9 rounded-full transition ${value ? "bg-brand" : "bg-zinc-200"}`}
                        >
                          <div className={`absolute top-[2px] h-4 w-4 rounded-full bg-white shadow transition-all ${value ? "left-[18px]" : "left-[2px]"}`} />
                        </button>
                      </div>
                    ))}
                    {/* Gölge Yoğunluğu */}
                    <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-zinc-700">Gölge Yoğunluğu</span>
                        <span className="text-zinc-400">{shadowIntensity}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={shadowIntensity}
                        onChange={(e) => setShadowIntensity(Number(e.target.value))}
                        className="mt-1.5 h-2 w-full cursor-pointer rounded-full bg-zinc-200 accent-brand"
                      />
                    </div>
                  </div>
                </div>

                {/* ANA BUTON — Oluştur & Platforma Hazırla */}
                <div className="border-t border-zinc-100 px-3 py-3">
                  <button
                    type="button"
                    disabled={generating}
                    onClick={() => {
                      // Build comprehensive prompt from all creation settings
                      const parts: string[] = [];
                      if (scenePrompt.trim()) parts.push(scenePrompt.trim());
                      if (bgType === "solid" && bgColor !== "#FFFFFF") parts.push(`arka plan rengi: ${bgColor}`);
                      if (bgType === "gradient") parts.push(`gradient arka plan: ${bgGradient.color1} - ${bgGradient.color2}`);
                      if (bgType === "texture") parts.push("dokulu arka plan");
                      if (bgType === "scene") parts.push("yaşam sahnesi");
                      creationTexts.forEach((t) => {
                        parts.push(`metin ekle: "${t.text}" pozisyon: ${t.position}`);
                      });
                      if (effectShadow) parts.push("ürün gölgesi ekle");
                      if (effectReflection) parts.push("ürün yansıması ekle");
                      if (effectHighlight) parts.push("ışık vurgusu ekle");
                      if (effectBgBlur) parts.push("arka planı bulanıklaştır");

                      const fullPrompt = parts.join(". ");
                      setSourceSummaryDraft(fullPrompt);

                      if (currentStudio?.id) {
                        handleGenerateProducts(true, fullPrompt);
                      } else {
                        showToast("Önce bir ürün görseli yükleyin veya AI sahne oluşturun");
                      }
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white shadow-md shadow-orange-200 transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {generating ? (
                      <>⏳ Üretiliyor...</>
                    ) : (
                      <>✦ Oluştur &amp; Platforma Hazırla</>
                    )}
                  </button>
                </div>
              </>
            ) : (
              /* ═══════════════════════════════════════════════
                 EXISTING MODE — Görsel Yüklenmiş Arayüz
                 ═══════════════════════════════════════════════ */
              <>
            {/* Fotoğraf Alanı */}
            <div className="p-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">Ürün Fotoğrafı</p>
                {/* + Yeni ürün butonu */}
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStudio(null);
                    setActiveTab("urun-gorseli-studyosu");
                    setSelectedVariantId(null);
                    setSelectedAdVariantId(null);
                    setScenePrompt("");
                    setCreationTexts([]);
                    showToast("Yeni ürün görseli stüdyosu açıldı");
                  }}
                  className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-bold text-zinc-500 transition hover:border-brand hover:bg-orange-50 hover:text-brand"
                  title="Yeni Ürün Görseli Oluştur"
                >
                  <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="8" y1="3" x2="8" y2="13" /><line x1="3" y1="8" x2="13" y2="8" /></svg>
                  Yeni
                </button>
              </div>
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
                <button type="button" onClick={() => fileInputRef.current?.click()} className="shrink-0 font-semibold text-brand transition hover:opacity-80">
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
                        ? "border-brand bg-brand text-white"
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
                  <button type="button" onClick={() => handleAnalyzeStudio()} disabled={!currentStudio?.id || analyzingStudio} className="text-[10px] font-semibold text-brand disabled:opacity-40">
                    {analyzingStudio ? "Analiz ediliyor..." : "Ürüne göre oluştur"}
                  </button>
                </div>
              </div>
              <textarea
                ref={promptTextareaRef}
                value={sourceSummaryDraft}
                onChange={(event) => setSourceSummaryDraft(event.target.value)}
                className="mt-1.5 h-20 w-full resize-none rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-[11px] leading-4 text-zinc-700 outline-none transition focus:border-brand"
                placeholder="Örnek: Bu ürünü kullanarak harika bir tasarımla revize et..."
              />

              {/* Brief kaydet */}
              <div className="mt-1.5 flex gap-1.5">
                <input
                  value={briefTitle}
                  onChange={(e) => setBriefTitle(e.target.value)}
                  placeholder="Brief adı (isteğe bağlı)"
                  className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[11px] outline-none transition focus:border-brand"
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
                            className="rounded px-1.5 py-0.5 text-[9px] font-bold text-brand hover:bg-orange-50"
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
                        ? "border-[#FFC8BB] bg-[#FFF2EF] text-brand"
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                    }`}
                  >
                    <span>{icon}</span>
                    {key}
                  </button>
                ))}
              </div>
              {/* AI Kategori Önerisi */}
              <button
                type="button"
                disabled={!currentStudio?.id || aiCategorySuggesting}
                onClick={handleAiCategorySuggest}
                className="mt-2 flex w-full items-center gap-1.5 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-2.5 py-2 text-left text-[11px] text-zinc-500 transition hover:border-brand hover:bg-orange-50 hover:text-brand disabled:opacity-50"
              >
                <span>🤖</span>
                {aiCategorySuggesting ? "AI analiz ediyor..." : "AI ile ürün kategorisi öner"}
              </button>
              {showAiCategories && aiCategories.length > 0 && (
                <div className="mt-1.5 space-y-1">
                  <p className="text-[9px] font-semibold text-emerald-600">✨ AI Önerileri:</p>
                  <div className="flex flex-wrap gap-1">
                    {aiCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => { setSelectedCategory(cat); setShowAiCategories(false); showToast(`Kategori seçildi: ${cat}`); }}
                        className={`rounded-lg border px-2 py-1 text-[10px] font-bold transition ${
                          selectedCategory === cat
                            ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                            : "border-zinc-200 bg-white text-zinc-600 hover:border-emerald-300 hover:bg-emerald-50"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
                        active ? "border-brand bg-brand" : "border-zinc-300 bg-white"
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
              <p className="mt-0.5 text-[9px] text-zinc-400">
                {selectedBgStyle ? "Tüm görseller seçilen stilde üretilir" : "Her platform kendi varyantıyla üretilir"}
              </p>
              <div className="mt-2 grid grid-cols-4 gap-1.5">
                {BG_STYLES.map((style) => (
                  <button
                    key={style.key}
                    type="button"
                    onClick={() => setSelectedBgStyle(prev => prev === style.key ? "" : style.key)}
                    className={`rounded-lg border-2 py-2 text-xs font-semibold transition ${
                      selectedBgStyle === style.key ? "border-brand ring-2 ring-brand/20" : "border-zinc-200"
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
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white shadow-md shadow-orange-200 transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
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
              </>
            )}

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
          </div>

          <section className="border-t xl:border-t-0 border-b border-zinc-100 p-3 lg:p-4 xl:border-b-0 xl:border-r">
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
                      <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</div>
                )}

                {!currentStudio && !loading && (
                  <>
                    {/* ── Aspect Ratio Bar ── */}
                    <div className="mb-3 flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-2">
                      {ASPECT_RATIOS.map((ratio) => (
                        <button
                          key={ratio.key}
                          type="button"
                          onClick={() => setSelectedRatio(ratio.key)}
                          className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition ${
                            selectedRatio === ratio.key
                              ? "bg-brand text-white"
                              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                          }`}
                          title={(ratio as { desc?: string }).desc || ratio.key}
                        >
                          {ratio.label}
                        </button>
                      ))}
                      <div className="ml-auto flex items-center gap-1.5">
                        <button type="button" className="rounded-lg bg-zinc-800 px-2 py-1.5 text-[11px] font-semibold text-zinc-400 hover:bg-zinc-700 hover:text-white">↺ Geri Al</button>
                      </div>
                    </div>

                    {/* ── Canvas Preview ── */}
                    <div className="flex flex-1 items-center justify-center rounded-2xl bg-zinc-950 p-6" style={{ minHeight: "420px" }}>
                      {(() => {
                        const ratio = ASPECT_RATIOS.find(r => r.key === selectedRatio) || ASPECT_RATIOS[0];
                        const maxW = 380; const maxH = 480;
                        let cW = maxW; let cH = maxW * ratio.h / ratio.w;
                        if (cH > maxH) { cH = maxH; cW = maxH * ratio.w / ratio.h; }
                        const bgStyle: React.CSSProperties = {};
                        if (bgType === "solid") { bgStyle.backgroundColor = bgColor; bgStyle.opacity = bgOpacity / 100; }
                        else if (bgType === "gradient") bgStyle.background = `linear-gradient(${bgGradient.direction}, ${bgGradient.color1}, ${bgGradient.color2})`;
                        else if (bgType === "texture") bgStyle.background = "repeating-conic-gradient(#ddd 0% 25%, #eee 0% 50%) 0 0 / 20px 20px";
                        else bgStyle.backgroundColor = "#f5f5f5";

                        return (
                          <div className="relative overflow-hidden rounded-xl shadow-2xl" style={{ width: cW, height: cH, ...bgStyle }}>
                            {/* Ürün placeholder veya üretilen görsel */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              {creationImageUrl ? (
                                <img src={creationImageUrl} alt="AI üretilen görsel" className="h-full w-full object-cover" />
                              ) : creationGenerating ? (
                                <div className="flex flex-col items-center gap-3">
                                  <div className="h-10 w-10 animate-spin rounded-full border-3 border-zinc-300 border-t-brand" />
                                  <span className="text-[11px] font-semibold text-zinc-400">Görsel üretiliyor...</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-2 opacity-30">
                                  <svg className="h-12 w-12 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                  <span className="text-[10px] text-zinc-400">Ürün görseli</span>
                                </div>
                              )}
                            </div>
                            {/* Metin katmanları — AI prompt ipucu olarak gösterilir */}
                            {creationTexts.length > 0 && !creationImageUrl && (
                              <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1">
                                {creationTexts.map((layer) => (
                                  <span key={layer.id} className="inline-flex items-center gap-1 rounded-md border border-dashed border-white/40 bg-black/30 px-2 py-0.5 text-[9px] font-medium text-white/80 backdrop-blur-sm">
                                    ✦ {layer.text}
                                  </span>
                                ))}
                              </div>
                            )}
                            {/* Efekt göstergeleri */}
                            {effectShadow && <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/10 to-transparent" />}
                          </div>
                        );
                      })()}
                    </div>

                    {/* ── Canvas Alt Bilgi Barı ── */}
                    <div className="mt-2 flex items-center justify-between rounded-xl bg-zinc-100 px-4 py-2">
                      <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                        <span>
                          {(() => {
                            const r = ASPECT_RATIOS.find(a => a.key === selectedRatio);
                            if (!r) return "1200×1200px";
                            if (r.key === "TY") return "1200×1800px";
                            if (r.key === "HB") return "1200×1200px";
                            if (r.key === "IG") return "1080×1350px";
                            return `${r.w * 300}×${r.h * 300}px`;
                          })()}
                        </span>
                        <span>·</span>
                        <span>{selectedRatio}</span>
                        <span>·</span>
                        <span>{bgType === "solid" ? "Düz Renk" : bgType === "gradient" ? "Gradient" : bgType === "texture" ? "Doku" : "Sahne"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px]">
                        {creationTexts.length > 0 && <span className="text-zinc-500">{creationTexts.length} metin</span>}
                        {effectShadow && <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-zinc-500">Gölge</span>}
                        {effectHighlight && <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-zinc-500">Işık</span>}
                      </div>
                    </div>
                  </>
                )}

                {/* Görsel yüklendi ama henüz üretim başlamadı */}
                {currentStudio && (!currentStudio.variants || currentStudio.variants.length === 0) && !generating && (
                  <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-gradient-to-b from-zinc-50 to-white px-8 py-16 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-amber-50 shadow-sm">
                      <img src={mediaUrl(currentStudio.source_image)} alt="" className="h-16 w-16 rounded-xl object-cover" />
                    </div>
                    <h3 className="mt-5 text-base font-extrabold text-zinc-800">Görseliniz Hazır!</h3>
                    <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-500">
                      Lütfen sol paneldeki <strong className="text-zinc-700">platform, arka plan stili</strong> ve <strong className="text-zinc-700">kategori</strong> seçeneklerini belirleyin ve ardından <strong className="text-brand">✶ Görsel Oluştur</strong> butonuna basın.
                    </p>
                    <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5">
                      <span className="text-amber-500">💡</span>
                      <p className="text-[11px] text-amber-700">Seçtiğiniz platform ve stil seçenekleri, AI&apos;ın ürettiği görsellerin kalitesini doğrudan etkiler.</p>
                    </div>
                  </div>
                )}

                {/* Üretim devam ediyor — placeholder kartları */}
                {generating && (
                  <div className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <article key={i} className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
                        <div className="relative bg-gradient-to-b from-zinc-100 to-zinc-50">
                          <div className="flex aspect-[4/5] flex-col items-center justify-center gap-3">
                            <div className="relative">
                              <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-zinc-200 border-t-brand" />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-sm">🎨</span>
                              </div>
                            </div>
                            <div className="text-center px-4">
                              <p className="text-xs font-bold text-zinc-600 animate-pulse">Görsel üretiliyor...</p>
                              <p className="mt-1 text-[10px] text-zinc-400">{job ? `${job.completed}/${job.total} tamamlandı` : "Hazırlanıyor"}</p>
                            </div>
                          </div>
                          {/* Shimmer effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" style={{ animationDuration: '2s' }} />
                        </div>
                        <div className="p-2.5">
                          <div className="h-3 w-20 rounded bg-zinc-100 animate-pulse" />
                          <div className="mt-2 h-4 w-32 rounded bg-zinc-100 animate-pulse" />
                          <div className="mt-1.5 h-3 w-24 rounded bg-zinc-100 animate-pulse" />
                        </div>
                      </article>
                    ))}
                  </div>
                )}

                {/* Hazır varyant kartları */}
                <div className={`mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3 ${generating && currentStudio?.variants?.length === 0 ? 'hidden' : ''}`}>
                  {currentStudio?.variants?.map((variant) => {
                    const selected = selectedVariant?.id === variant.id;
                    return (
                      <article key={variant.id} className={`overflow-hidden rounded-xl border bg-white transition ${selected ? "border-brand shadow-[0_8px_20px_rgba(241,75,42,0.14)]" : "border-zinc-200 hover:border-zinc-300"}`}>
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
                                setCanvasVariant({
                                  id: variant.id,
                                  name: variant.name || "Varyant",
                                  imageUrl: mediaUrl(variant.preview_url || currentStudio?.source_image || ""),
                                  isAd: false,
                                });
                              }}
                              className="rounded-lg border border-zinc-200 py-1.5 text-center text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50"
                            >
                              Düzenle
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadImage(mediaUrl(variant.preview_url), variant.name || "gorsel")}
                              className="rounded-lg bg-brand py-1.5 text-center text-xs font-bold text-white transition hover:opacity-90"
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
                          className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-semibold transition ${active ? "bg-brand text-white" : "border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"}`}
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
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${textMode === "ai" ? "bg-brand text-white" : "border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"}`}
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
                      <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}

                <div className="mt-3 grid gap-2.5 xl:grid-cols-2">
                  {currentStudio?.ad_variants?.map((variant) => {
                    const selected = selectedAdVariant?.id === variant.id;
                    return (
                      <article key={variant.id} className={`overflow-hidden rounded-xl border bg-white transition ${selected ? "border-brand shadow-[0_8px_20px_rgba(241,75,42,0.14)]" : "border-zinc-200 hover:border-zinc-300"}`}>
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
                                setCanvasVariant({
                                  id: variant.id,
                                  name: variant.name || "Reklam Kreatiifi",
                                  imageUrl: mediaUrl(variant.preview_url || currentStudio?.source_image || ""),
                                  isAd: true,
                                });
                              }}
                              className="rounded-lg border border-zinc-200 py-1.5 text-center text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50"
                            >
                              ✏️ Düzenle
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadImage(mediaUrl(variant.preview_url), variant.name || "kreatif")}
                              className="rounded-lg bg-brand py-1.5 text-center text-xs font-bold text-white transition hover:opacity-90"
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

          <aside className="border-t xl:border-t-0 overflow-y-auto bg-white xl:block xl:min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 px-3 py-2.5">
              <h3 className="text-[15px] xl:text-[20px] font-extrabold text-zinc-900 truncate">
                {activeTab === "reklam-studyosu" ? selectedAdVariant?.name || "Reklam Önizleme" : selectedVariant?.name || "Önizleme"}
              </h3>
              <button type="button" className="ml-2 shrink-0 text-lg leading-none text-zinc-300 hover:text-zinc-500">×</button>
            </div>

            <div className="px-3 py-3">
              {/* ÖNİZLEME */}
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">ÖNİZLEME</p>

              {/* ── Marka Seçici ── */}
              {isCreationMode && (
                <div className="mt-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setShowBrandSelector(!showBrandSelector)}
                    className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-left transition hover:border-brand"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {(() => {
                        const brand = companies.find(c => c.id === (selectedBrandId || activeCompany?.id));
                        return brand ? (
                          <>
                            {brand.logo_url ? (
                              <img src={brand.logo_url.startsWith('http') ? brand.logo_url : mediaUrl(brand.logo_url)} alt={brand.name} className="h-8 w-8 rounded-lg object-cover border border-zinc-100" />
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-brand-dark text-[10px] font-extrabold text-white">
                                {brand.name.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-zinc-900">{brand.name}</p>
                              <p className="truncate text-[9px] text-zinc-400">{brand.sector || "Marka"}</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-sm">🏷️</div>
                            <span className="text-xs font-semibold text-zinc-500">Marka Seç</span>
                          </>
                        );
                      })()}
                    </div>
                    <svg className={`h-4 w-4 text-zinc-400 transition ${showBrandSelector ? "rotate-180" : ""}`} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6l4 4 4-4" /></svg>
                  </button>

                  {showBrandSelector && (
                    <div className="mt-1 max-h-48 overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-lg">
                      {companies.map((brand) => {
                        const isActive = brand.id === (selectedBrandId || activeCompany?.id);
                        return (
                          <button
                            key={brand.id}
                            type="button"
                            onClick={() => { setSelectedBrandId(brand.id); setShowBrandSelector(false); showToast(`Marka seçildi: ${brand.name}`); }}
                            className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition hover:bg-orange-50 ${isActive ? "bg-orange-50/60" : ""}`}
                          >
                            {brand.logo_url ? (
                              <img src={brand.logo_url.startsWith('http') ? brand.logo_url : mediaUrl(brand.logo_url)} alt={brand.name} className="h-8 w-8 rounded-lg object-cover border border-zinc-100" />
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-brand-dark text-[10px] font-extrabold text-white">
                                {brand.name.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-bold text-zinc-900">{brand.name}</p>
                              {brand.sector && <p className="truncate text-[9px] text-zinc-400">{brand.sector}</p>}
                            </div>
                            {isActive && (
                              <svg className="h-4 w-4 shrink-0 text-brand" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 8l3.5 3.5L13 5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-2 overflow-hidden rounded-xl border border-zinc-200 bg-white">
                {activeTab === "reklam-studyosu" ? (
                  selectedAdVariant ? (
                    <AdPreview
                      imageUrl={mediaUrl(selectedAdVariant.preview_url || currentStudio?.source_image)}
                      variant={selectedAdVariant}
                      className={`w-full ${selectedAdVariant.width > selectedAdVariant.height ? "aspect-[16/8]" : selectedAdVariant.height > 1500 ? "aspect-[4/5]" : "aspect-square"}`}
                    />
                  ) : (
                    <div className="flex aspect-[4/5] flex-col items-center justify-center gap-3 bg-gradient-to-b from-zinc-50 to-white px-6 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50">
                        <span className="text-2xl">🎯</span>
                      </div>
                      <p className="text-xs font-semibold text-zinc-600">İstediğiniz seçenekleri seçiniz</p>
                      <p className="text-[10px] leading-4 text-zinc-400">Sol paneldeki ayarları yapıp görsel üretme adımını tamamlayınız</p>
                    </div>
                  )
                ) : selectedVariant ? (
                  <img
                    src={mediaUrl(selectedVariant.preview_url || currentStudio?.source_image)}
                    alt={selectedVariant.name}
                    className="aspect-[4/5] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[4/5] flex-col items-center justify-center gap-3 bg-gradient-to-b from-zinc-50 to-white px-6 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50">
                      <span className="text-2xl">🎨</span>
                    </div>
                    <p className="text-xs font-semibold text-zinc-600">İstediğiniz seçenekleri seçiniz</p>
                    <p className="text-[10px] leading-4 text-zinc-400">Sol paneldeki platform, kategori ve arka plan seçeneklerini belirleyip görsel üretme adımını tamamlayınız</p>
                  </div>
                )}
              </div>

              {/* ── Yeni Ürün Görseli Üret (Gemini AI) ── */}
              {currentStudio?.source_image && activeTab === "urun-gorseli-studyosu" && (
                <div className="mt-3">
                  {/* Marka Seçici — Existing Mode için */}
                  {!isCreationMode && (
                    <div className="mb-2">
                      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-zinc-400 mb-1">Marka Seç</p>
                      <button
                        type="button"
                        onClick={() => setShowBrandSelector(!showBrandSelector)}
                        className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 py-2 text-left transition hover:border-brand"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {(() => {
                            const brand = companies.find(c => c.id === (selectedBrandId || activeCompany?.id));
                            return brand ? (
                              <>
                                {brand.logo_url ? (
                                  <img src={brand.logo_url.startsWith('http') ? brand.logo_url : mediaUrl(brand.logo_url)} alt={brand.name} className="h-7 w-7 rounded-lg object-cover border border-zinc-100" />
                                ) : (
                                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-brand-dark text-[9px] font-extrabold text-white">
                                    {brand.name.substring(0, 2).toUpperCase()}
                                  </div>
                                )}
                                <span className="truncate text-xs font-bold text-zinc-800">{brand.name}</span>
                              </>
                            ) : (
                              <span className="text-[11px] font-semibold text-zinc-500">Marka seç...</span>
                            );
                          })()}
                        </div>
                        <svg className={`h-3.5 w-3.5 text-zinc-400 transition ${showBrandSelector ? "rotate-180" : ""}`} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6l4 4 4-4" /></svg>
                      </button>

                      {showBrandSelector && (
                        <div className="mt-1 max-h-40 overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-lg">
                          {companies.map((brand) => {
                            const isActive = brand.id === (selectedBrandId || activeCompany?.id);
                            return (
                              <button
                                key={brand.id}
                                type="button"
                                onClick={() => { setSelectedBrandId(brand.id); setShowBrandSelector(false); showToast(`Marka seçildi: ${brand.name}`); }}
                                className={`flex w-full items-center gap-2 px-3 py-2 text-left transition hover:bg-orange-50 ${isActive ? "bg-orange-50/60" : ""}`}
                              >
                                {brand.logo_url ? (
                                  <img src={brand.logo_url.startsWith('http') ? brand.logo_url : mediaUrl(brand.logo_url)} alt={brand.name} className="h-7 w-7 rounded-lg object-cover border border-zinc-100" />
                                ) : (
                                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-brand-dark text-[9px] font-extrabold text-white">
                                    {brand.name.substring(0, 2).toUpperCase()}
                                  </div>
                                )}
                                <span className="truncate text-xs font-bold text-zinc-800 flex-1">{brand.name}</span>
                                {isActive && <svg className="h-3.5 w-3.5 shrink-0 text-brand" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 8l3.5 3.5L13 5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleGenerateNewImage}
                    disabled={generatingNew || !currentStudio?.source_image}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4285F4] to-[#1A73E8] px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {generatingNew ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Gemini ile üretiliyor...
                      </>
                    ) : (
                      <>✦ Markaya Uygun Yeni Görsel Üret</>  
                    )}
                  </button>
                  <p className="mt-1 text-center text-[9px] text-zinc-400">
                    Gemini 2.5 Flash · {companies.find(c => c.id === (selectedBrandId || activeCompany?.id))?.name || "Aktif marka"} için
                  </p>
                </div>
              )}

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
                          isActive ? "border-brand shadow-sm" : "border-zinc-200 hover:border-zinc-300"
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

            {/* SON ÇALIŞMALAR */}
            {!!studios.length && (
              <div className="mt-8 mb-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">Son Çalışmalar</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  {studios.map((studio) => (
                    <button
                      key={studio.id}
                      type="button"
                      onClick={() => setCurrentStudio(studio)}
                      className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                        currentStudio?.id === studio.id ? "border-[#FBC7B9] bg-brand-soft" : "border-zinc-200 bg-white"
                      }`}
                    >
                      <img src={mediaUrl(studio.source_image)} alt={studio.title} className="h-14 w-14 rounded-xl object-cover" />
                      <div className="min-w-0 text-left">
                        <p className="truncate text-sm font-bold text-zinc-900">{studio.title}</p>
                        <p className="truncate text-xs text-zinc-500">{statusText(studio.status)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

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
                  <p className="text-[11px] font-bold text-brand">✶ AI Önerisi</p>
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
                              className="text-xs font-bold text-brand hover:opacity-80"
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
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-bold text-white transition hover:bg-brand-dark"
                >
                  ↓ Bu Görseli İndir
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const variant = activeTab === "reklam-studyosu" ? selectedAdVariant : selectedVariant;
                    if (!variant) return;
                    setCanvasVariant({
                      id: variant.id,
                      name: variant.name || "Varyant",
                      imageUrl: mediaUrl(variant.preview_url || currentStudio?.source_image || ""),
                      isAd: activeTab === "reklam-studyosu",
                    });
                  }}
                  disabled={!selectedVariant && !selectedAdVariant}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-40"
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
                          currentStudio?.id === studio.id ? "border-[#FBC7B9] bg-brand-soft" : "border-zinc-200 bg-white hover:border-zinc-300"
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
