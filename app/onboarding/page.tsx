"use client";

import React, { useState, useRef, useEffect, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { FullPageSpinner } from "@/components/ui/spinner";
import DataSourceSelection from "@/components/onboarding/DataSourceSelection";
import { navigationGroups } from "@/components/panel/data";
import {
  Squares2X2Icon,
  BuildingStorefrontIcon,
  UserGroupIcon,
  PencilSquareIcon,
  CalendarDaysIcon,
  ShareIcon,
  MagnifyingGlassIcon,
  StarIcon,
  ChartBarIcon,
  CpuChipIcon,
  SparklesIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

const NAV_ICONS: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  dashboard: Squares2X2Icon,
  profil: BuildingStorefrontIcon,
  ekip: UserGroupIcon,
  icerik: PencilSquareIcon,
  takvim: CalendarDaysIcon,
  zamanlayici: ClockIcon,
  sosyal: ShareIcon,
  seo: MagnifyingGlassIcon,
  reklam: StarIcon,
  performans: ChartBarIcon,
  "yapay-zeka": CpuChipIcon,
  "kreatif-studyo": SparklesIcon,
};

// ─── Sabit veriler ──────────────────────────────────────

const SECTORS = [
  { id: "moda", icon: "👗", label: "Moda & Giyim", desc: "Kıyafet, aksesuar, ayakkabı, tekstil" },
  { id: "yiyecek", icon: "🍕", label: "Yiyecek & İçecek", desc: "Restoran, kafe, market, üretim" },
  { id: "guzellik", icon: "💄", label: "Güzellik & Bakım", desc: "Kozmetik, cilt bakımı, saç" },
  { id: "saglik", icon: "🌿", label: "Sağlık & Yaşam", desc: "Spor, organik ürün, wellness" },
  { id: "ev", icon: "🏠", label: "Ev & Yaşam Alanı", desc: "Mobilya, dekor, ev tekstili" },
  { id: "teknoloji", icon: "💻", label: "Teknoloji & Hizmet", desc: "Yazılım, danışmanlık, SaaS" },
  { id: "egitim", icon: "📚", label: "Eğitim & Kültür", desc: "Kurs, okul, içerik, yayın" },
  { id: "finans", icon: "🏦", label: "Finans & Sigorta", desc: "Banka, sigorta, yatırım" },
  { id: "turizm", icon: "✈️", label: "Turizm & Konaklama", desc: "Otel, tur, seyahat acentesi" },
];

const COMPETITIVE_EDGES = [
  { id: "fiyat", icon: "💰", label: "Fiyat & Kampanya", desc: "En uygun fiyat, en büyük indirim. Müşteri fiyat için geliyor." },
  { id: "trend", icon: "🔥", label: "Trend & Yenilik", desc: "En güncel parçalar burada. Müşteri trendi takip etmek için geliyor." },
  { id: "kalite", icon: "💎", label: "Kalite & Dayanıklılık", desc: 'Uygun fiyata sağlam ürün. "Fiyatına göre harika" dedirtmek.' },
  { id: "cesit", icon: "🌈", label: "Çeşit & Uygunluk", desc: "Her bedene, her zevke bir şey var. Seçenek çokluğu ön planda." },
  { id: "hiz", icon: "🚀", label: "Hız & Kolaylık", desc: "Sipariş kolay, kargo hızlı, iade zahmetsiz. Pratiklik ön planda." },
];

const CUSTOMER_TYPES = [
  { id: "impulsif", icon: "⚡", label: "İmpulsif / Hızlı Alıcı", desc: "Hızlı karar verir; ihtiyacını gördüğü anda çözüme odaklanır." },
  { id: "analitik", icon: "🔍", label: "Analitik / Temkinli", desc: "Detaylı araştırma yapar; referansları ve vaka analizlerini inceler." },
  { id: "fiyat_duyarli", icon: "💰", label: "Fiyat Duyarlı", desc: "Bütçe odaklıdır; fiyat-performans avantajı veya kampanya bekler." },
  { id: "premium", icon: "💎", label: "Değer / Premium Odaklı", desc: "Kalite ve değer odaklıdır; toplam faydaya önem verir." },
  { id: "referans", icon: "🤝", label: "Referans Odaklı", desc: "Güven odaklıdır; sosyal kanıta ve tavsiyelere göre hareket eder." },
  { id: "konfor", icon: "🛋️", label: "Konfor / Hizmet Odaklı", desc: "Süreç ve operasyonel mükemmellik (hız/destek) bekler." },
];

const TONE_OPTIONS = [
  { id: "genc_enerjik", icon: "🔥", label: "Genç & Enerjik" },
  { id: "samimi_sicak", icon: "🤗", label: "Samimi & Sıcak" },
  { id: "eglenceli", icon: "😄", label: "Eğlenceli & Espri" },
  { id: "sik_sofistike", icon: "✨", label: "Şık & Sofistike" },
  { id: "ilhamli_hikaye", icon: "📖", label: "İlhamlı & Hikaye" },
  { id: "guvenilir_kurumsal", icon: "🏛️", label: "Güvenilir & Kurumsal" },
];

// ── Platform SVG Icons ──
const PlatformSvgIcons: Record<string, React.ReactElement> = {
  instagram: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>,
  facebook: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
  twitter: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
  linkedin: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
  tiktok: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>,
  youtube: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>,
  pinterest: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641 0 12.017 0z"/></svg>,
  threads: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.182.408-2.256 1.33-3.022.88-.732 2.07-1.128 3.543-1.18 1.07-.037 2.063.075 2.964.332-.075-1.263-.57-2.175-1.52-2.79-.673-.437-1.56-.674-2.627-.696l-.007-.002c-1.357.017-2.406.406-3.118 1.153-.682.717-1.042 1.725-1.069 2.996l-2.112-.032c.037-1.768.575-3.2 1.6-4.255 1.078-1.114 2.594-1.714 4.385-1.738l.247-.002c.15 0 .298.003.444.01 1.549.1 2.8.553 3.716 1.345.95.82 1.553 1.997 1.74 3.402.23-.05.465-.09.706-.118l.007-.001c.34-.037.696-.037 1.062.014 2.367.33 3.958 1.812 4.473 4.168.385 1.76.082 3.836-1.382 5.337C18.19 23.123 15.584 23.974 12.186 24zm-1.418-8.174c-.015 0-.03 0-.044.002-1.63.088-2.596.82-2.546 1.747.026.492.342.97.872 1.314.594.386 1.37.575 2.186.532 1.118-.06 1.963-.464 2.514-1.148.424-.527.712-1.26.856-2.18-.805-.313-1.752-.49-2.84-.49-.33 0-.667.017-1 .05z"/></svg>,
};

const PLATFORMS = [
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
  { id: "twitter", label: "X (Twitter)" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "tiktok", label: "TikTok" },
  { id: "youtube", label: "YouTube" },
  { id: "pinterest", label: "Pinterest" },
  { id: "threads", label: "Threads" },
];

const LANGUAGES = [
  { id: "tr", label: "🇹🇷 Türkçe" },
  { id: "en", label: "🇬🇧 İngilizce" },
  { id: "de", label: "🇩🇪 Almanca" },
  { id: "fr", label: "🇫🇷 Fransızca" },
  { id: "ar", label: "🇸🇦 Arapça" },
];

const STEPS = [
  { num: 1, label: "Kaynak Seç" },
  { num: 2, label: "Ne Satarsınız" },
  { num: 3, label: "Marka Bilgileri" },
  { num: 4, label: "Neden Seçerler" },
  { num: 5, label: "Nasıl Konuşur" },
  { num: 6, label: "Müşteri Tipi" },
  { num: 7, label: "Rakipler" },
  { num: 8, label: "Tasarım" },
];

interface ToneExampleData {
  id: string;
  example: string;
  tags: string[];
}

// ─── Component ──────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [generatingDesc, setGeneratingDesc] = useState(false);

  // Step 2 — Sektör
  const [sector, setSector] = useState("");
  // Step 3 — Marka Bilgileri
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [contentLanguage, setContentLanguage] = useState("tr");
  const [goal, setGoal] = useState("");
  const [slogan, setSlogan] = useState("");
  const [description, setDescription] = useState("");
  const [forbiddenWords, setForbiddenWords] = useState("");
  const [productCategories, setProductCategories] = useState("");
  // Step 4 — Neden Seçerler (çoklu)
  const [competitiveEdge, setCompetitiveEdge] = useState<string[]>([]);
  // Step 5 — Nasıl Konuşur
  const [toneOfVoice, setToneOfVoice] = useState("");
  const [toneExamples, setToneExamples] = useState<ToneExampleData[]>([]);
  // Step 6 — Müşteri Tipi (çoklu)
  const [customerType, setCustomerType] = useState<string[]>([]);
  // Step 7 — Rakipler
  const [competitors, setCompetitors] = useState<{name: string, website: string}[]>([]);
  const [newCompetitorName, setNewCompetitorName] = useState("");
  const [newCompetitorWeb, setNewCompetitorWeb] = useState("");
  const [suggestingCompetitors, setSuggestingCompetitors] = useState(false);
  // Step 8 — Tasarım (Platformlar, Renkler, Logo)
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [brandColors, setBrandColors] = useState<string[]>(["#e6272f", "#1c1f26"]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [externalLogoUrl, setExternalLogoUrl] = useState<string>("");
  const [dragActive, setDragActive] = useState(false);

  // ─── Resume from saved step ─────────────
  useEffect(() => {
    async function loadCompanyData() {
      try {
        const { data } = await api.get("/api/companies/me");
        if (data.companies && data.companies.length > 0) {
          const c = data.companies[0];
          if (c.sector) setSector(c.sector);
          if (c.name) setName(c.name);
          if (c.website) setWebsite(c.website);
          if (c.content_language) setContentLanguage(c.content_language);
          if (c.goal) setGoal(c.goal);
          if (c.slogan) setSlogan(c.slogan);
          if (c.description) setDescription(c.description);
          if (c.forbidden_words) setForbiddenWords(c.forbidden_words);
          if (c.product_categories) setProductCategories(c.product_categories);
          if (c.tone_of_voice) setToneOfVoice(c.tone_of_voice);
          if (c.target_audience) {
            try { setCustomerType(JSON.parse(c.target_audience)); } catch { setCustomerType([]); }
          }
          if (c.competitive_edge) {
            try { setCompetitiveEdge(JSON.parse(c.competitive_edge)); } catch { setCompetitiveEdge([]); }
          }
          if (c.platforms) {
            try { setPlatforms(JSON.parse(c.platforms)); } catch { /* ignore */ }
          }
          if (c.brand_colors) {
            try { setBrandColors(JSON.parse(c.brand_colors)); } catch { /* ignore */ }
          }
          if (c.logo_url) {
            const fullUrl = c.logo_url.startsWith('http') ? c.logo_url : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080") + c.logo_url;
            setLogoPreview(fullUrl);
            // Eğer logo backend'den kaydedilmiş bir dosya değilse (harici URL), externalLogoUrl'e de set et
            if (c.logo_url.startsWith('http')) setExternalLogoUrl(c.logo_url);
          }
          const savedStep = c.current_step || 0;
          setStep(Math.min(Math.max(savedStep + 1, 1), 7));
        }
      } catch {
        const savedStep = parseInt(localStorage.getItem("current_step") || "0");
        if (savedStep > 0) setStep(Math.min(savedStep + 1, 7));
      }
      setInitialLoading(false);
    }
    loadCompanyData();
  }, []);

  const beforeUnloadRef = useRef<((e: BeforeUnloadEvent) => void) | null>(null);
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) { e.preventDefault(); e.returnValue = ""; }
    beforeUnloadRef.current = handleBeforeUnload;
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // ─── Step 5'e gelindiğinde ton örneklerini otomatik üret ──
  const [toneLoading, setToneLoading] = useState(false);
  useEffect(() => {
    if (step !== 5 || toneExamples.length > 0 || toneLoading) return;
    const fetchToneExamples = async () => {
      setToneLoading(true);
      try {
        const { data } = await api.post("/api/protected/generate-tone-examples", {
          company_name: name,
          sector: sector,
          product_categories: productCategories,
          competitive_edge: competitiveEdge,
          description: description,
        });
        if (data.tone_examples && data.tone_examples.length > 0) {
          setToneExamples(data.tone_examples);
        }
      } catch (err) {
        console.error("Ton örnekleri üretilemedi:", err);
      } finally {
        setToneLoading(false);
      }
    };
    fetchToneExamples();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // ─── Backend'e kaydet ────────────────────
  async function saveStepToBackend(currentStep: number) {
    try {
      const formData = new FormData();
      formData.append("current_step", String(currentStep));
      if (sector) formData.append("sector", sector);
      if (name) formData.append("name", name);
      if (website) formData.append("website", website);
      if (contentLanguage) formData.append("content_language", contentLanguage);
      if (goal) formData.append("goal", goal);
      if (slogan) formData.append("slogan", slogan);
      if (description) formData.append("description", description);
      if (forbiddenWords) formData.append("forbidden_words", forbiddenWords);
      if (productCategories) formData.append("product_categories", productCategories);
      if (toneOfVoice) formData.append("tone_of_voice", toneOfVoice);
      if (customerType.length > 0) formData.append("target_audience", JSON.stringify(customerType));
      if (competitiveEdge.length > 0) formData.append("competitive_edge", JSON.stringify(competitiveEdge));
      if (platforms.length > 0) formData.append("platforms", JSON.stringify(platforms));
      if (brandColors.length > 0) formData.append("brand_colors", JSON.stringify(brandColors));
      if (externalLogoUrl) formData.append("external_logo_url", externalLogoUrl);
      await api.post("/api/companies/onboarding", formData, { headers: { "Content-Type": "multipart/form-data" } });
      localStorage.setItem("current_step", String(currentStep));
    } catch { /* sessiz */ }
  }

  function nextStep() {
    setError("");
    if (step === 2 && !sector) { setError("Lütfen bir sektör seçin"); return; }
    if (step === 3 && !name.trim()) { setError("Marka adı zorunludur"); return; }
    if (step === 4 && competitiveEdge.length === 0) { setError("En az bir rekabet avantajı seçin"); return; }
    if (step === 5 && !toneOfVoice) { setError("Bir marka tonu seçin"); return; }
    if (step === 6 && customerType.length === 0) { setError("En az bir müşteri tipi seçin"); return; }
    // if (step === 7) // optional: warn if competitors empty, but user can skip
    const next = Math.min(step + 1, 8);
    saveStepToBackend(step);
    setStep(next);
  }

  function prevStep() { setError(""); setStep((s) => Math.max(s - 1, 1)); }

  function toggleItem(list: string[], setList: (v: string[]) => void, id: string) {
    setList(list.includes(id) ? list.filter((p) => p !== id) : [...list, id]);
  }

  function updateColor(i: number, v: string) { setBrandColors((p) => { const c = [...p]; c[i] = v; return c; }); }
  function addColor() { if (brandColors.length < 5) setBrandColors((p) => [...p, "#6e7583"]); }
  function removeColor(i: number) { if (brandColors.length > 1) setBrandColors((p) => p.filter((_, j) => j !== i)); }

  function handleLogoSelect(file: File | undefined) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("Logo dosyası 5MB'dan büyük olamaz"); return; }
    setLogoFile(file);
    setExternalLogoUrl(""); // Kullanıcı kendi logosunu yüklüyorsa, harici logo iptal
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      setLogoPreview(src);
      // Logo'dan otomatik renk çıkar
      extractColorsFromLogo(src);
    };
    reader.readAsDataURL(file);
    setError("");
  }

  function extractColorsFromLogo(src: string) {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = src;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = img.width; canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      if (!ctx) return;
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      const colorMap: Record<string, number> = {};
      const step = 4;
      for (let i = 0; i < pixels.length; i += 4 * step) {
        const r = pixels[i], g = pixels[i+1], b = pixels[i+2], a = pixels[i+3];
        if (a < 128) continue;
        const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
        if (brightness > 240 || brightness < 15) continue;
        const saturation = Math.max(r, g, b) - Math.min(r, g, b);
        if (saturation < 20 && brightness > 50 && brightness < 200) continue;
        const qr = Math.round(r / 8) * 8;
        const qg = Math.round(g / 8) * 8;
        const qb = Math.round(b / 8) * 8;
        const hex = "#" + [qr,qg,qb].map(x => Math.min(255, Math.max(0, x)).toString(16).padStart(2,'0')).join('');
        colorMap[hex] = (colorMap[hex] || 0) + 1;
      }
      const sorted = Object.entries(colorMap).sort((a, b) => b[1] - a[1]);
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
        const merged = [...brandColors];
        for (const c of distinctColors) {
          if (!merged.some(existing => colorDist(hexToRgb(c), hexToRgb(existing)) < 40)) {
            merged.push(c);
          }
        }
        setBrandColors(merged.slice(0, 5));
      }
    };
  }

  function handleDrop(e: DragEvent) { e.preventDefault(); setDragActive(false); handleLogoSelect(e.dataTransfer.files[0]); }

  async function handleSubmit() {
    console.log("🚀 handleSubmit ÇAĞRILDI - step:", step);
    if (step !== 8) {
      console.log("❌ handleSubmit ENGELLENDI - step 8 değil, step:", step);
      return;
    }
    setError("");
    setLoading(true);
    console.log("📤 Backend'e gönderiliyor...");
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("sector", sector);
      formData.append("goal", goal);
      formData.append("content_language", contentLanguage);
      formData.append("platforms", JSON.stringify(platforms));
      formData.append("website", website);
      formData.append("brand_colors", JSON.stringify(brandColors));
      formData.append("slogan", slogan);
      formData.append("description", description);
      formData.append("forbidden_words", forbiddenWords);
      formData.append("target_audience", JSON.stringify(customerType));
      formData.append("product_categories", productCategories);
      formData.append("competitive_edge", JSON.stringify(competitiveEdge));
      formData.append("tone_of_voice", toneOfVoice);
      formData.append("current_step", "8");
      if (logoFile) {
        formData.append("logo", logoFile);
        console.log("📎 Logo dosyası eklendi:", logoFile.name);
      } else if (externalLogoUrl) {
        formData.append("external_logo_url", externalLogoUrl);
        console.log("🔗 Harici logo URL eklendi:", externalLogoUrl);
      } else {
        console.log("⚠️ Logo yok - dosya da URL de yok");
      }
      const res = await api.post("/api/companies/onboarding", formData, { headers: { "Content-Type": "multipart/form-data" } });
      
      const companyId = res.data?.company?.id;
      if (companyId && competitors.length > 0) {
        await api.post(`/api/protected/companies/${companyId}/competitors`, competitors);
        console.log("✅ Rakipler backend'e kaydedildi.");
      }

      console.log("✅ Backend kayıt başarılı!");
      localStorage.setItem("onboarding_completed", "true");
      localStorage.setItem("current_step", "8");
      await refreshUser();
      console.log("📊 SEO Genel Bakış'a yönlendiriliyor...");
      // beforeunload uyarısını kaldır
      if (beforeUnloadRef.current) {
        window.removeEventListener("beforeunload", beforeUnloadRef.current);
      }
      window.onbeforeunload = null;
      window.location.href = "/#seo-genel-bakis";
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      console.error("❌ Kayıt hatası:", axiosErr.response?.data);
      setError(axiosErr.response?.data?.error || "Bir hata oluştu.");
    } finally { setLoading(false); }
  }

  // ─── Step Indicator ───────────────────
  function renderStepIndicator() {
    return (
      <div className="mb-8 flex items-center justify-center gap-1 flex-wrap">
        {STEPS.map((s, i) => (
          <div key={s.num} className="flex items-center gap-1">
            <button type="button" onClick={() => { if (s.num < step) setStep(s.num); }}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-300 ${s.num === step ? "bg-brand text-white shadow-md shadow-brand/25" : s.num < step ? "bg-brand/10 text-brand cursor-pointer hover:bg-brand/20" : "bg-zinc-100 text-zinc-400"}`}>
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${s.num < step ? "bg-brand text-white" : s.num === step ? "bg-white/25 text-white" : "bg-zinc-200 text-zinc-400"}`}>
                {s.num < step ? "✓" : s.num}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && <div className={`h-px w-3 sm:w-5 transition-colors duration-300 ${s.num < step ? "bg-brand/30" : "bg-zinc-200"}`} />}
          </div>
        ))}
      </div>
    );
  }

  // ─── Step 1: Kaynak Seç ───────────────
  function renderStep1() {
    return (
      <DataSourceSelection
        onNext={(data) => {
          if (data.sourceType === "ai" && data.aiResult) {
            const r = data.aiResult;
            if (r.name) setName(r.name);
            if (r.sector) setSector(r.sector);
            if (r.description) setDescription(r.description);
            if (r.slogan) setSlogan(r.slogan);
            if (r.product_categories) setProductCategories(r.product_categories);
            if (r.tone_of_voice) setToneOfVoice(r.tone_of_voice);
            if (r.tone_examples && r.tone_examples.length > 0) setToneExamples(r.tone_examples);
            if (r.goal) setGoal(r.goal);
            if (r.content_language) setContentLanguage(r.content_language);
            if (r.brand_colors && r.brand_colors.length > 0) setBrandColors(r.brand_colors);
            if (r.competitive_edge && r.competitive_edge.length > 0) setCompetitiveEdge(r.competitive_edge);
            if (r.customer_type && r.customer_type.length > 0) setCustomerType(r.customer_type);
            if (r.logo_url) { setExternalLogoUrl(r.logo_url); setLogoPreview(r.logo_url); }
            if (r.website) setWebsite(r.website);
            if (data.webUrl) setWebsite(data.webUrl);
          }
          saveStepToBackend(1);
          setStep(2);
        }}
      />
    );
  }

  // ─── Step 2: Ne Satarsınız ───────────
  function renderStep2() {
    return (
      <div className="animate-fade-in-up">
        <div className="mb-6 text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-muted mb-2">ADIM 2 / 7</p>
          <h2 className="text-xl font-bold text-foreground">Ne satıyorsunuz?</h2>
          <p className="text-sm text-muted mt-1">Sektörünüzü seçin — tıkladığınızda otomatik ilerler</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SECTORS.map((s) => (
            <button key={s.id} type="button" onClick={() => { setSector(s.id); setTimeout(() => { setError(""); saveStepToBackend(2); setStep(3); }, 300); }}
              className={`group relative flex items-start gap-3 rounded-xl border-2 p-4 pr-10 text-left transition-all duration-200 hover:shadow-md ${sector === s.id ? "border-brand bg-brand/5 shadow-md shadow-brand/10" : "border-transparent bg-white hover:border-zinc-200"}`}>
              <span className="text-2xl flex-shrink-0 mt-0.5">{s.icon}</span>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-foreground">{s.label}</p>
                <p className="text-xs text-muted mt-0.5 leading-relaxed">{s.desc}</p>
              </div>
              <div className={`absolute top-3 right-3 h-5 w-5 rounded-full border-2 transition-all flex items-center justify-center ${sector === s.id ? "border-brand bg-brand" : "border-zinc-300 group-hover:border-zinc-400"}`}>
                {sector === s.id && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ─── Step 3: Marka Bilgileri ──────────
  function renderStep3() {
    return (
      <div className="animate-fade-in-up space-y-5">
        <div className="mb-6 text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-muted mb-2">ADIM 3 / 7</p>
          <h2 className="text-xl font-bold text-foreground">Marka bilgileriniz</h2>
          <p className="text-sm text-muted mt-1">Temel bilgileri girin veya AI'ın doldurduklarını kontrol edin</p>
        </div>
        <div>
          <label className="auth-label">Marka / Şirket Adı <span className="text-brand">*</span></label>
          <input className="auth-input" placeholder="Örn: DIO Digital Marketing" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="auth-label">Web Sitesi</label>
          <input className="auth-input" placeholder="https://ornek.com" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </div>
        <div>
          <label className="auth-label">İçerik Dili</label>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((l) => (
              <button key={l.id} type="button" onClick={() => setContentLanguage(l.id)}
                className={`rounded-lg px-4 py-2 text-sm font-medium border transition-all ${contentLanguage === l.id ? "border-brand bg-brand/5 text-brand" : "border-zinc-200 bg-white text-foreground hover:border-zinc-300"}`}>
                {l.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="auth-label">Hedef</label>
          <input className="auth-input" placeholder="Örn: Marka bilinirliğini artırmak, satış yapmak..." value={goal} onChange={(e) => setGoal(e.target.value)} />
        </div>
        <div>
          <label className="auth-label">Slogan</label>
          <input className="auth-input" placeholder="Örn: Dijitalde Fark Yarat" value={slogan} onChange={(e) => setSlogan(e.target.value)} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="auth-label !mb-0">Açıklama</label>
            <button
              type="button"
              disabled={generatingDesc}
              onClick={async () => {
                if (!name.trim() && !website.trim()) { setError("AI açıklama için marka adı veya website gerekli"); return; }
                setGeneratingDesc(true); setError("");
                try {
                  const { data } = await api.post("/api/protected/generate-description", {
                    company_name: name,
                    website: website,
                    sector: sector,
                    product_categories: productCategories,
                    goal: goal,
                    slogan: slogan,
                  });
                  if (data.description) setDescription(data.description);
                } catch { setError("Açıklama üretilirken hata oluştu."); } finally { setGeneratingDesc(false); }
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm shadow-violet-500/25 transition-all hover:shadow-md hover:shadow-violet-500/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generatingDesc ? (
                <><span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />Üretiliyor...</>
              ) : (
                <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>AI ile Üret</>
              )}
            </button>
          </div>
          <textarea className="auth-input min-h-[100px] resize-none" placeholder="Markanızı kısaca anlatın... veya 'AI ile Üret' butonuna tıklayın" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label className="auth-label">Ürün / Hizmet Kategorileri</label>
          <textarea className="auth-input min-h-[70px] resize-none" placeholder="Sunduğunuz ürün veya hizmet kategorileri (virgülle ayırın)" value={productCategories} onChange={(e) => setProductCategories(e.target.value)} />
        </div>
        <div>
          <label className="auth-label">Yasaklı Kelimeler</label>
          <textarea className="auth-input min-h-[70px] resize-none" placeholder="İçeriklerde kullanılmasını istemediğiniz kelimeler (virgülle ayırın)" value={forbiddenWords} onChange={(e) => setForbiddenWords(e.target.value)} />
        </div>
      </div>
    );
  }

  // ─── Step 4: Neden Seçerler ───────────
  function renderStep4() {
    return (
      <div className="animate-fade-in-up">
        <div className="mb-6 text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-muted mb-2">ADIM 4 / 7</p>
          <h2 className="text-xl font-bold text-foreground">Müşteri sizi neden tercih eder?</h2>
          <p className="text-sm text-muted mt-1">Birden fazla seçebilirsiniz — size en uygun olanları işaretleyin</p>
        </div>
        <div className="space-y-3">
          {COMPETITIVE_EDGES.map((edge) => {
            const selected = competitiveEdge.includes(edge.id);
            return (
              <button key={edge.id} type="button" onClick={() => toggleItem(competitiveEdge, setCompetitiveEdge, edge.id)}
                className={`w-full flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all duration-200 hover:shadow-md ${selected ? "border-brand bg-brand/5 shadow-sm shadow-brand/10" : "border-zinc-100 bg-white hover:border-zinc-200"}`}>
                <span className="text-2xl flex-shrink-0">{edge.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm ${selected ? "text-brand" : "text-foreground"}`}>{edge.label}</p>
                  <p className="text-xs text-muted mt-0.5 leading-relaxed">{edge.desc}</p>
                </div>
                <div className={`h-5 w-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-colors ${selected ? "bg-brand border-brand" : "border-zinc-300"}`}>
                  {selected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── Step 5: Nasıl Konuşur (Ton seçimi) ───
  function renderStep5() {
    // AI'dan gelen örnekleri id ile eşle, yoksa boş göster
    const getExample = (id: string) => toneExamples.find((t) => t.id === id);

    return (
      <div className="animate-fade-in-up">
        <div className="mb-2 text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-muted mb-2">ADIM 5 / 7</p>
          <h2 className="text-xl font-bold text-foreground">Markanız nasıl konuşur?</h2>
          <p className="text-sm text-muted mt-1">
            {toneLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />
                AI markanıza özel örnek cümleler üretiyor...
              </span>
            ) : (
              "Her kartın içindeki örnek cümleyi okuyun — sizi en çok hangisi anlatıyor?"
            )}
          </p>
        </div>

        {/* AI'dan gelen context bilgisi */}
        {(sector || name) && (
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {SECTORS.find(s => s.id === sector) && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                {SECTORS.find(s => s.id === sector)?.icon} {SECTORS.find(s => s.id === sector)?.label}
              </span>
            )}
            {competitiveEdge.slice(0, 2).map(ce => {
              const edge = COMPETITIVE_EDGES.find(e => e.id === ce);
              return edge ? (
                <span key={ce} className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                  {edge.icon} {edge.label}
                </span>
              ) : null;
            })}
          </div>
        )}

        <div className="space-y-3">
          {TONE_OPTIONS.map((tone) => {
            const selected = toneOfVoice === tone.id;
            const example = getExample(tone.id);
            return (
              <button key={tone.id} type="button" onClick={() => setToneOfVoice(tone.id)}
                className={`w-full flex items-start gap-4 rounded-xl border-2 p-5 text-left transition-all duration-200 hover:shadow-md ${selected ? "border-brand bg-brand/5 shadow-sm shadow-brand/10" : "border-zinc-100 bg-white hover:border-zinc-200"}`}>
                <div className="flex flex-col items-center gap-1 flex-shrink-0 w-16 pt-1">
                  <span className="text-2xl">{tone.icon}</span>
                  <span className={`text-[11px] font-bold text-center leading-tight ${selected ? "text-brand" : "text-zinc-500"}`}>{tone.label}</span>
                </div>
                <div className="flex-1 min-w-0">
                  {example ? (
                    <>
                      <p className={`text-sm leading-relaxed ${selected ? "text-brand font-medium" : "text-foreground"}`}>
                        {example.example}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {example.tags.map((tag) => (
                          <span key={tag} className="inline-block rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </>
                  ) : toneLoading ? (
                    <div className="space-y-2 animate-pulse">
                      <div className="h-4 bg-zinc-200 rounded w-4/5" />
                      <div className="h-4 bg-zinc-100 rounded w-3/5" />
                      <div className="flex gap-1.5 mt-1">
                        <div className="h-4 w-12 bg-zinc-100 rounded" />
                        <div className="h-4 w-10 bg-zinc-100 rounded" />
                        <div className="h-4 w-14 bg-zinc-100 rounded" />
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted italic">Örnek cümle yükleniyor...</p>
                  )}
                </div>
                <div className={`h-5 w-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors mt-2 ${selected ? "bg-brand border-brand" : "border-zinc-300"}`}>
                  {selected && <div className="h-2 w-2 rounded-full bg-white" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── Step 6: Müşteri Tipi ─────────────
  function renderStep6() {
    return (
      <div className="animate-fade-in-up">
        <div className="mb-6 text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-muted mb-2">ADIM 6 / 7</p>
          <h2 className="text-xl font-bold text-foreground">Müşteri tipiniz hangisi?</h2>
          <p className="text-sm text-muted mt-1">Birden fazla seçebilirsiniz — AI içerikleri bu profile göre optimize eder</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CUSTOMER_TYPES.map((ct) => {
            const selected = customerType.includes(ct.id);
            return (
              <button key={ct.id} type="button" onClick={() => toggleItem(customerType, setCustomerType, ct.id)}
                className={`flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all duration-200 hover:shadow-md ${selected ? "border-brand bg-brand/5 shadow-sm shadow-brand/10" : "border-zinc-100 bg-white hover:border-zinc-200"}`}>
                <span className="text-2xl flex-shrink-0">{ct.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm ${selected ? "text-brand" : "text-foreground"}`}>{ct.label}</p>
                  <p className="text-xs text-muted mt-0.5 leading-relaxed">{ct.desc}</p>
                </div>
                <div className={`h-5 w-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-colors ${selected ? "bg-brand border-brand" : "border-zinc-300"}`}>
                  {selected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── Step 7: Rakipler ─────────────────
  function renderStep7() {
    return (
      <div className="animate-fade-in-up space-y-5">
        <div className="mb-2 text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-muted mb-2">ADIM 7 / 8</p>
          <h2 className="text-xl font-bold text-foreground">Rakipleriniz</h2>
          <p className="text-sm text-muted mt-1">Sektörünüzden ilham alacağınız rakipleri ekleyin veya AI'dan öneri alın</p>
        </div>

        <div className="flex items-center justify-end">
          <button
            type="button"
            disabled={suggestingCompetitors || !sector}
            onClick={async () => {
              if (!sector) { setError("Öneri için sektör seçmelisiniz (1. veya 2. adımı kontrol edin)"); return; }
              setSuggestingCompetitors(true); setError("");
              try {
                const { data } = await api.post("/api/protected/suggest-competitors", {
                  name,
                  website,
                  sector
                });
                if (data && data.length > 0) {
                  // Mevcut rakiplere ekle (aynı website/isim varsa eksiğini tamamlayabilirsin veya duplicate engellersin)
                  const existingSet = new Set(competitors.map(c => c.website || c.name));
                  const toAdd = data.filter((c: any) => !existingSet.has(c.website || c.name));
                  setCompetitors(prev => [...prev, ...toAdd]);
                }
              } catch { setError("Rakip önerisi alınamadı."); } finally { setSuggestingCompetitors(false); }
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm shadow-emerald-500/25 transition-all hover:shadow-md disabled:opacity-50"
          >
            {suggestingCompetitors ? (
              <><span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />Aranıyor...</>
            ) : (
              <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>AI ile Rakip Önerisi Al</>
            )}
          </button>
        </div>

        <div className="space-y-3">
          {competitors.map((comp, idx) => (
            <div key={idx} className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-3 pr-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500"><BuildingStorefrontIcon className="h-5 w-5" /></div>
                <div>
                  <p className="text-sm font-bold text-foreground">{comp.name}</p>
                  {comp.website && <p className="text-xs text-brand">{comp.website}</p>}
                </div>
              </div>
              <button type="button" onClick={() => setCompetitors(competitors.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700">
                 Sil
              </button>
            </div>
          ))}

          {competitors.length === 0 && (
            <div className="rounded-xl border border-dashed border-zinc-300 p-6 text-center">
              <p className="text-sm text-zinc-500">Henüz rakip eklemediniz.</p>
            </div>
          )}
        </div>

        <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <h4 className="mb-3 text-xs font-bold uppercase text-zinc-500">Manuel Rakip Ekle</h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input className="auth-input !text-sm" placeholder="Firma Adı (Örn: Apple)" value={newCompetitorName} onChange={e => setNewCompetitorName(e.target.value)} />
            <div className="flex gap-2">
              <input className="auth-input !text-sm" placeholder="Web Sitesi (Opsiyonel)" value={newCompetitorWeb} onChange={e => setNewCompetitorWeb(e.target.value)} />
              <button type="button" onClick={() => {
                if (newCompetitorName.trim()) {
                   setCompetitors([...competitors, { name: newCompetitorName, website: newCompetitorWeb }]);
                   setNewCompetitorName(""); setNewCompetitorWeb("");
                }
              }} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-bold text-white hover:bg-zinc-800">Ekle</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Step 8: Tasarım (Logo önce, Platformlar, Renkler) ───
  function renderStep8() {
    const hasAILogo = externalLogoUrl && !logoFile;

    return (
      <div className="animate-fade-in-up space-y-6">
        <div className="mb-2 text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-muted mb-2">ADIM 8 / 8 — SON ADIM</p>
          <h2 className="text-xl font-bold text-foreground">Logo & Tasarım</h2>
          <p className="text-sm text-muted mt-1">Logonuzu onaylayın, platformları ve renkleri ayarlayın</p>
        </div>

        {/* ─── Logo Section (Hero) ─── */}
        <div className="rounded-2xl border-2 border-zinc-200 bg-gradient-to-b from-zinc-50 to-white p-6">
          <label className="flex items-center gap-2 text-sm font-bold text-foreground mb-4">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
            Marka Logosu
          </label>

          {logoPreview ? (
            <div className="flex flex-col items-center gap-4">
              {/* Logo preview */}
              <div className="relative">
                <div className="rounded-2xl border-2 border-zinc-200 bg-white p-4 shadow-lg shadow-zinc-200/50">
                  <img src={logoPreview} alt="Marka Logosu" className="h-32 w-32 object-contain" onError={() => { setLogoPreview(null); setExternalLogoUrl(""); }} />
                </div>
                {hasAILogo && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-500 px-3 py-1 text-[11px] font-bold text-white shadow-md shadow-green-500/30">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      AI tarafından bulundu
                    </span>
                  </div>
                )}
              </div>

              {logoFile && <p className="text-xs text-muted">{logoFile.name}</p>}

              {/* Action buttons */}
              <div className="flex items-center gap-3">
                <button type="button" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  className="flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-xs font-semibold text-foreground transition-all hover:bg-zinc-50 hover:border-zinc-400 hover:shadow-sm">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                  Farklı Logo Yükle
                </button>
                <button type="button" onClick={(e) => { e.stopPropagation(); setLogoFile(null); setLogoPreview(null); setExternalLogoUrl(""); }}
                  className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600 transition-all hover:bg-red-100 hover:border-red-300">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  Kaldır
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(e) => handleLogoSelect(e.target.files?.[0])} />
            </div>
          ) : (
            /* Upload area - no logo found */
            <div onDragOver={(e) => { e.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-all duration-300 ${dragActive ? "border-brand bg-brand/5 scale-[1.02]" : "border-zinc-300 bg-zinc-50/50 hover:border-brand/50 hover:bg-brand/5"}`}>
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(e) => handleLogoSelect(e.target.files?.[0])} />
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white border border-zinc-200 shadow-sm">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-foreground">Logonuzu yükleyin</p>
              <p className="mt-1 text-xs text-muted">Sürükle & bırak veya <span className="text-brand font-medium">dosya seçin</span></p>
              <p className="mt-1 text-[10px] text-zinc-400">PNG, JPG, WebP veya SVG — Max 5MB</p>
            </div>
          )}
        </div>

        {/* ─── Platforms ─── */}
        <div>
          <label className="auth-label">Platformlar</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {PLATFORMS.map((p) => {
              const selected = platforms.includes(p.id);
              return (
                <button key={p.id} type="button" onClick={() => toggleItem(platforms, setPlatforms, p.id)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3 text-center transition-all duration-200 ${selected ? "border-brand bg-brand/5 shadow-sm shadow-brand/10" : "border-zinc-100 bg-white hover:border-zinc-200 hover:shadow-sm"}`}>
                  <span className={`${selected ? "text-[#E73932]" : "text-zinc-500"}`}>{PlatformSvgIcons[p.id]}</span>
                  <span className={`text-xs font-medium ${selected ? "text-brand" : "text-foreground"}`}>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Brand Colors ─── */}
        <div>
          <label className="auth-label">Marka Renkleri</label>
          <div className="flex flex-wrap items-center gap-3">
            {brandColors.map((color, i) => (
              <div key={i} className="group relative">
                <label className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl border-2 border-zinc-200 transition-all hover:border-zinc-400 hover:shadow-md" style={{ backgroundColor: color }}>
                  <input type="color" value={color} onChange={(e) => updateColor(i, e.target.value)} className="sr-only" />
                </label>
                <span className="mt-1 block text-center text-[10px] text-muted font-mono">{color}</span>
                {brandColors.length > 1 && (
                  <button type="button" onClick={() => removeColor(i)} className="absolute -top-1.5 -right-1.5 hidden h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-[10px] text-white group-hover:flex transition-all hover:bg-red-500">✕</button>
                )}
              </div>
            ))}
            {brandColors.length < 5 && (
              <button type="button" onClick={addColor} className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 text-zinc-400 transition-all hover:border-brand hover:text-brand hover:bg-brand/5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── Main render ──────────────────────
  const stepRenderers = [renderStep1, renderStep2, renderStep3, renderStep4, renderStep5, renderStep6, renderStep7, renderStep8];
  const currentStepRenderer = stepRenderers[step - 1];

  if (authLoading || !user) return <FullPageSpinner message="Kontrol ediliyor…" />;
  if (initialLoading) return <FullPageSpinner message="Bilgileriniz yükleniyor…" />;

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* ═══ LEFT SIDEBAR — Birebir ana uygulama sidebar'ı ═══ */}
      <aside className="sidebar-panel hidden lg:flex flex-col w-[260px] h-screen bg-white flex-shrink-0">
        {/* Logo Section */}
        <div className="flex items-center gap-3 px-6 pt-7 pb-6 border-b border-[#EAEAEA]">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E73932] text-[15px] tracking-tight font-extrabold text-white shadow-sm">
            DIO
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-[17px] font-extrabold text-[#111827] tracking-tight">DIO</span>
            <span className="text-[11px] font-semibold text-[#9CA3AF] mt-[2px]">DİJİTAL İŞ ORTAĞI</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-5 py-6 space-y-[26px] sidebar-nav">
          {navigationGroups.map((group) => (
            <div key={group.id} className="space-y-1.5">
              <p className="px-2 mb-2.5 text-[11px] font-extrabold tracking-widest text-[#9CA3AF] uppercase">
                {group.label}
              </p>
              <div className="space-y-[4px]">
                {group.items.map((item) => {
                  const selected = item.key === "kreatif-studyo";
                  return (
                    <div
                      key={item.key}
                      className={`group flex w-full items-center gap-3.5 rounded-[12px] px-3 py-[9px] text-left text-[14.5px] transition-all duration-150 ${
                        selected
                          ? "bg-[#FFF5F3] text-[#E73932] font-semibold"
                          : "text-[#6B7280] font-medium"
                      }`}
                    >
                      {(() => {
                        const Icon = NAV_ICONS[item.key];
                        return Icon ? (
                          <Icon className={`w-[20px] h-[20px] flex-shrink-0 ${selected ? "text-[#E73932]" : "text-[#9CA3AF]"}`} />
                        ) : (
                          <span className={`w-[20px] h-[20px] flex items-center justify-center text-[13px] font-bold flex-shrink-0 ${selected ? "text-[#E73932]" : "text-[#9CA3AF]"}`}>{item.icon as string}</span>
                        );
                      })()}
                      <span>{item.label}</span>
                      {item.badge && (
                        <span
                          className={
                            item.badge.variant === "new"
                              ? "ml-auto rounded-full bg-[#D1FAE5] px-[7px] py-[2px] text-[10px] font-bold text-[#059669]"
                              : "ml-auto flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#E73932] text-[11px] font-bold text-white shadow-sm"
                          }
                        >
                          {item.badge.text}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Profile */}
        <div className="p-[20px] border-t border-[#EAEAEA] bg-white">
          <div className="w-full flex items-center gap-3 rounded-[12px] bg-[#F4F4F5] p-3.5 text-left">
            <div className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-[#E73932] text-[14px] font-bold text-white flex-shrink-0">
              {name ? name.substring(0,2).toUpperCase() : "YM"}
            </div>
            <div className="flex flex-col min-w-0 pt-[1px]">
              <span className="text-[15px] font-bold text-[#111827] truncate leading-tight">{name || "Yeni Marka"}</span>
              <span className="text-[12px] font-medium text-[#6B7280] mt-[2px]">Pro Plan</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ═══ RIGHT CONTENT AREA ═══ */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ── Top Header ── */}
        <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-zinc-200 flex-shrink-0">
          <div className="flex flex-col">
            <h1 className="text-[16px] font-bold text-zinc-900">Marka Profili Oluştur</h1>
            <p className="text-[11px] text-zinc-400 mt-0.5">Marka profili oluşturalım — 8 adım, ~5 dakika</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-green-500" />
            <span className="text-[12px] font-semibold text-zinc-600">Adım {step}/8</span>
          </div>
        </div>

        {/* ── Step Breadcrumb Bar ── */}
        <div className="px-6 py-3 bg-white border-b border-zinc-100 flex-shrink-0 overflow-x-auto">
          <div className="flex items-center gap-0 min-w-max">
            {STEPS.map((s, i) => {
              const isCompleted = s.num < step;
              const isCurrent = s.num === step;
              const isFuture = s.num > step;
              return (
                <div key={s.num} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => { if (s.num < step) setStep(s.num); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all whitespace-nowrap ${
                      isCurrent
                        ? "bg-[#E73932] text-white shadow-sm shadow-[#E73932]/20"
                        : isCompleted
                          ? "bg-[#E73932]/10 text-[#E73932] cursor-pointer hover:bg-[#E73932]/20"
                          : "text-zinc-400"
                    }`}
                  >
                    <span className={`flex h-[18px] w-[18px] items-center justify-center rounded-full text-[9px] font-bold ${
                      isCompleted ? "bg-[#E73932] text-white" : isCurrent ? "bg-white/25 text-white" : "border border-zinc-300 text-zinc-400"
                    }`}>
                      {isCompleted ? "✓" : s.num}
                    </span>
                    <span>{s.label}</span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div className={`h-[2px] w-5 mx-0.5 rounded-full transition-colors ${isCompleted ? "bg-[#E73932]/30" : "bg-zinc-200"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Main Content Area ── */}
        <div className="flex-1 overflow-y-auto relative bg-[#FAFAFA]">
          <div className="max-w-[780px] mx-auto px-6 py-6">
            {error && (
              <div className="auth-error mb-4 animate-fade-in-up">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" /><path d="M8 5v3.5M8 10.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                {error}
              </div>
            )}

            <div className="bg-white rounded-2xl border border-zinc-200 p-5 sm:p-6 shadow-sm">
              {currentStepRenderer()}
            </div>
          </div>
        </div>

        {/* ── Bottom Navigation Bar ── */}
        <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-zinc-200 flex-shrink-0">
          {/* Left: Brand info */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-[9px] font-bold text-zinc-600 flex-shrink-0">
              {name ? name.substring(0,2).toUpperCase() : "YM"}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[12px] font-semibold text-zinc-700 truncate">{name || "Yeni Marka"}</span>
              <span className="text-[10px] text-zinc-400">{sector ? SECTORS.find(s => s.id === sector)?.label : "Bir kaynak seçin"}</span>
            </div>
          </div>

          {/* Right: Navigation Buttons */}
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button type="button" onClick={prevStep}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-[12px] font-medium text-zinc-600 transition hover:bg-zinc-50 hover:border-zinc-300"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                Geri
              </button>
            )}
            {step < 8 ? (
              <button type="button" onClick={nextStep}
                className="flex items-center gap-1.5 rounded-xl bg-[#E73932] px-5 py-2 text-[12px] font-semibold text-white shadow-sm shadow-[#E73932]/20 transition hover:bg-[#d03030] hover:shadow-md"
              >
                Devam — {STEPS[step]?.label || "Tasarım"} →
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={loading}
                className="flex items-center gap-1.5 rounded-xl bg-[#E73932] px-5 py-2 text-[12px] font-semibold text-white shadow-sm shadow-[#E73932]/20 transition hover:bg-[#d03030] hover:shadow-md disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center gap-2"><span className="spinner" /> Kaydediliyor…</span>
                ) : (
                  <span className="flex items-center gap-1.5">Tamamla & Panele Geç <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg></span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
