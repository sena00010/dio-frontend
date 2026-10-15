"use client";

import { useState, useCallback, useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api";
import PostPreview, { platformAspectClass } from "./PostPreview";
import { useToast } from "@/components/ui/Toast";
import { getApiError } from "@/lib/apiError";

// ── Taslak: stüdyoya gidip geri dönünce sihirbaz kaldığı yerden devam eder ──
const DRAFT_KEY = "dio:wizard-draft";
const STEP3_KEY = "dio:wizard-step3:";

function readSession<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeSession(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* depolama kapalıysa taslak tutulmaz */
  }
}

export function clearWizardDraft() {
  try {
    Object.keys(sessionStorage)
      .filter(k => k === DRAFT_KEY || k.startsWith(STEP3_KEY))
      .forEach(k => sessionStorage.removeItem(k));
  } catch {
    /* yok say */
  }
}

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

type AiIdea = {
  id: number;
  company_id: number;
  user_input_topic: string;
  platform: string;
  campaign_type: string;
  generated_title: string;
  generated_description: string;
  generated_hashtags: string;
  image_suggestion_prompt: string;
  suggested_layout: string;
  content_items: string; // JSON string
  is_selected: boolean;
};

const PLATFORM_ICONS: Record<string, ReactNode> = {
  Instagram: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  ),
  TikTok: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1 0-5.78 2.92 2.92 0 0 1 .88.13V9a6.34 6.34 0 1 0 5.45 6.28V9.44a8.18 8.18 0 0 0 3.77.96V7a4.76 4.76 0 0 1 0-.31z"/>
    </svg>
  ),
  LinkedIn: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
    </svg>
  ),
  "X (Twitter)": (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  ),
  Facebook: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  ),
  YouTube: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  ),
};

const PLATFORMS = [
  { value: "Instagram", color: "from-pink-500 to-purple-600" },
  { value: "TikTok", color: "from-gray-900 to-gray-700" },
  { value: "LinkedIn", color: "from-blue-600 to-blue-800" },
  { value: "X (Twitter)", color: "from-sky-400 to-sky-600" },
  { value: "Facebook", color: "from-blue-500 to-blue-700" },
  { value: "YouTube", color: "from-red-500 to-red-700" },
];

const CAMPAIGN_TYPES = [
  { value: "product_launch", label: "Ürün Tanıtımı", icon: "🚀" },
  { value: "brand_awareness", label: "Marka Bilinirliği", icon: "🌟" },
  { value: "engagement", label: "Etkileşim", icon: "💬" },
  { value: "sales", label: "Satış & Dönüşüm", icon: "🛒" },
  { value: "event", label: "Etkinlik", icon: "🎉" },
  { value: "educational", label: "Eğitim & Bilgi", icon: "📚" },
];

// ──────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────

export default function NewContentWizard({
  onBack,
  onApproved,
  initialTopic,
}: {
  onBack: () => void;
  onApproved: (postId: number) => void;
  initialTopic?: string;
}) {
  const { companies, activeCompany } = useAuth();
  type Draft = { step: 1 | 2 | 3; companyId: number; topic: string; platform: string; campaignType: string; count: number; ideas: AiIdea[]; selectedIdea: AiIdea | null };
  const [draft] = useState<Draft | null>(() => (initialTopic ? null : readSession<Draft>(DRAFT_KEY)));
  const [step, setStep] = useState<1 | 2 | 3>(draft?.step || 1);

  // Brand selection — defaults to activeCompany
  const [selectedCompanyId, setSelectedCompanyId] = useState<number>(
    draft?.companyId || activeCompany?.id || companies[0]?.id || 0
  );
  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);

  // Form state
  const [topic, setTopic] = useState(initialTopic || draft?.topic || "");
  const [platform, setPlatform] = useState(draft?.platform || "");
  const [campaignType, setCampaignType] = useState(draft?.campaignType || "");
  const [count, setCount] = useState(draft?.count || 3);

  // AI results
  const [ideas, setIdeas] = useState<AiIdea[]>(draft?.ideas || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 3 — selected idea for image generation
  const [selectedIdea, setSelectedIdea] = useState<AiIdea | null>(draft?.selectedIdea || null);

  useEffect(() => {
    writeSession(DRAFT_KEY, { step, companyId: selectedCompanyId, topic, platform, campaignType, count, ideas, selectedIdea });
  }, [step, selectedCompanyId, topic, platform, campaignType, count, ideas, selectedIdea]);

  // ── Generate Ideas ─────────────────────
  const handleGenerate = useCallback(async () => {
    if (!selectedCompanyId) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/api/protected/generate-ideas", {
        company_id: selectedCompanyId,
        topic,
        platform,
        count,
        campaign_type: campaignType,
      });
      setIdeas(data.ideas || []);
      setStep(2);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : "Bir hata oluştu";
      setError(msg || "AI fikir üretme başarısız oldu");
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyId, topic, platform, count, campaignType]);

  const isFormValid = topic.trim() && platform && campaignType && selectedCompanyId;

  // ── Navigate to step 3 (image generation page)
  const handleGoToImageStep = (idea: AiIdea) => {
    setSelectedIdea(idea);
    setStep(3);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (step === 3) { setStep(2); }
              else if (step === 2) { setStep(1); }
              else { clearWizardDraft(); onBack(); }
            }}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-sm text-muted transition hover:bg-zinc-50 hover:border-zinc-300"
            title="Geri"
          >
            ←
          </button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {step === 1 ? "AI İçerik Fikri Üret" : step === 2 ? "AI Sonuçları" : "Görsel Üretimi"}
            </h1>
            <p className="subtle text-sm">
              {step === 1
                ? "Konu, platform ve kampanya türünü seçerek AI ile içerik fikirleri üretin"
                : step === 2
                  ? `${ideas.length} fikir üretildi — düzenleyin, yeniden oluşturun veya onaylayın`
                  : `"${selectedIdea?.generated_title || ""}" için görsel üretiyoruz`}
            </p>
          </div>
        </div>
        {step === 2 && (
          <button
            onClick={() => setStep(1)}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium transition hover:bg-zinc-50"
          >
            ← Yeni Sorgu
          </button>
        )}
        {step === 3 && (
          <button
            onClick={() => setStep(2)}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium transition hover:bg-zinc-50"
          >
            ← Fikirlere Dön
          </button>
        )}
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        <div className={`flex items-center gap-1 sm:gap-2 rounded-full px-2 py-1 sm:px-4 sm:py-1.5 text-[10px] sm:text-xs font-semibold transition-all ${step === 1 ? "bg-brand text-white shadow-md shadow-brand/25" : step > 1 ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>
          <span className={`inline-flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full text-[9px] sm:text-[10px] ${step > 1 ? "bg-emerald-500 text-white" : "bg-white/20"}`}>
            {step > 1 ? "✓" : "1"}
          </span>
          <span className="hidden sm:inline">Konu & Platform</span>
          <span className="sm:hidden">Konu</span>
        </div>
        <div className="h-px w-4 sm:w-8 bg-zinc-200" />
        <div className={`flex items-center gap-1 sm:gap-2 rounded-full px-2 py-1 sm:px-4 sm:py-1.5 text-[10px] sm:text-xs font-semibold transition-all ${step === 2 ? "bg-brand text-white shadow-md shadow-brand/25" : step > 2 ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>
          <span className={`inline-flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full text-[9px] sm:text-[10px] ${step > 2 ? "bg-emerald-500 text-white" : "bg-white/20"}`}>
            {step > 2 ? "✓" : "2"}
          </span>
          <span className="hidden sm:inline">AI Sonuçları</span>
          <span className="sm:hidden">AI</span>
        </div>
        <div className="h-px w-4 sm:w-8 bg-zinc-200" />
        <div className={`flex items-center gap-1 sm:gap-2 rounded-full px-2 py-1 sm:px-4 sm:py-1.5 text-[10px] sm:text-xs font-semibold transition-all ${step === 3 ? "bg-brand text-white shadow-md shadow-brand/25" : "bg-zinc-100 text-zinc-500"}`}>
          <span className="inline-flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-white/20 text-[9px] sm:text-[10px]">3</span>
          <span className="hidden sm:inline">Görsel Üretimi</span>
          <span className="sm:hidden">Görsel</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="auth-error">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Step 1: Input Form */}
      {step === 1 && (
        <Step1Form
          companies={companies}
          selectedCompanyId={selectedCompanyId}
          setSelectedCompanyId={setSelectedCompanyId}
          selectedCompanyName={selectedCompany?.name || ""}
          topic={topic}
          setTopic={setTopic}
          platform={platform}
          setPlatform={setPlatform}
          campaignType={campaignType}
          setCampaignType={setCampaignType}
          count={count}
          setCount={setCount}
          onGenerate={handleGenerate}
          loading={loading}
          isValid={!!isFormValid}
        />
      )}

      {/* Step 2: AI Results */}
      {step === 2 && (
        <Step2Results
          ideas={ideas}
          setIdeas={setIdeas}
          onGoToImageStep={handleGoToImageStep}
        />
      )}

      {/* Step 3: Image Generation Page */}
      {step === 3 && selectedIdea && (
        <Step3ImageGeneration
          idea={selectedIdea}
          onApproved={onApproved}
          onBack={() => setStep(2)}
        />
      )}

      {/* Loading overlay */}
      {loading && <LoadingOverlay count={count} />}
    </div>
  );
}

// ──────────────────────────────────────────────
// Step 1: Input Form
// ──────────────────────────────────────────────

function Step1Form({
  companies, selectedCompanyId, setSelectedCompanyId, selectedCompanyName,
  topic, setTopic,
  platform, setPlatform,
  campaignType, setCampaignType,
  count, setCount,
  onGenerate, loading, isValid,
}: {
  companies: { id: number; name: string; logo_url?: string; sector?: string }[];
  selectedCompanyId: number; setSelectedCompanyId: (v: number) => void;
  selectedCompanyName: string;
  topic: string; setTopic: (v: string) => void;
  platform: string; setPlatform: (v: string) => void;
  campaignType: string; setCampaignType: (v: string) => void;
  count: number; setCount: (v: number) => void;
  onGenerate: () => void; loading: boolean; isValid: boolean;
}) {
  return (
    <div className="grid gap-3 sm:gap-5 xl:grid-cols-[1.2fr_0.8fr]">
      {/* Left — Main form */}
      <div className="min-w-0 space-y-3 sm:space-y-5">
        {/* Brand Selector */}
        <div className="card p-3 sm:p-5">
          <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-semibold text-foreground">
            🏷️ Hangi Marka İçin?
          </label>
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2 sm:grid-cols-3">
            {companies.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCompanyId(c.id)}
                className={`flex items-center gap-1.5 sm:gap-2.5 rounded-lg sm:rounded-xl border-2 px-2 py-1.5 sm:px-3 sm:py-2.5 text-xs sm:text-sm font-medium transition-all ${
                  selectedCompanyId === c.id
                    ? "border-brand bg-brand/5 text-brand shadow-sm shadow-brand/10"
                    : "border-zinc-200 bg-white text-foreground hover:border-zinc-300 hover:bg-zinc-50"
                }`}
              >
                {c.logo_url ? (
                  <img src={`${process.env.NEXT_PUBLIC_API_URL}${c.logo_url}`} alt={c.name} className="h-5 w-5 sm:h-6 sm:w-6 rounded-md object-cover" />
                ) : (
                  <span className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-md bg-zinc-100 text-[10px] font-bold text-zinc-500">
                    {c.name[0]?.toUpperCase()}
                  </span>
                )}
                <span className="truncate">{c.name}</span>
              </button>
            ))}
          </div>
          {companies.length === 0 && (
            <p className="mt-2 text-xs text-muted">Henüz marka eklenmemiş. Firma ve Markalar sayfasından ekleyin.</p>
          )}
        </div>

        {/* Topic Input */}
        <div className="card p-3 sm:p-5">
          <label className="mb-1.5 sm:mb-2 block text-xs sm:text-sm font-semibold text-foreground">
            📝 Konu / İçerik Açıklaması
          </label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Örn: Yaz koleksiyonumuz için günlük kombinleri tanıtan, genç kitleye hitap eden bir içerik..."
            rows={3}
            className="w-full resize-none rounded-lg sm:rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm outline-none transition placeholder:text-zinc-400 focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/10"
          />
          <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-muted">Ne kadar detaylı yazarsanız, AI o kadar isabetli fikirler üretir.</p>
        </div>

        {/* Platform Selection */}
        <div className="card p-3 sm:p-5">
          <label className="mb-2 sm:mb-3 block text-xs sm:text-sm font-semibold text-foreground">
            📱 Platform
          </label>
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2 sm:grid-cols-3">
            {PLATFORMS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPlatform(p.value)}
                className={`flex items-center gap-1.5 sm:gap-2.5 rounded-lg sm:rounded-xl border-2 px-2.5 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium transition-all ${
                  platform === p.value
                    ? "border-brand bg-brand/5 text-brand shadow-sm shadow-brand/10"
                    : "border-zinc-200 bg-white text-foreground hover:border-zinc-300 hover:bg-zinc-50"
                }`}
              >
                {PLATFORM_ICONS[p.value]}
                {p.value}
              </button>
            ))}
          </div>
        </div>

        {/* Campaign Type */}
        <div className="card p-3 sm:p-5">
          <label className="mb-2 sm:mb-3 block text-xs sm:text-sm font-semibold text-foreground">
            🎯 Kampanya Türü
          </label>
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2 sm:grid-cols-3">
            {CAMPAIGN_TYPES.map((ct) => (
              <button
                key={ct.value}
                type="button"
                onClick={() => setCampaignType(ct.value)}
                className={`flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl border-2 px-2 py-1.5 sm:px-3 sm:py-2.5 text-xs sm:text-sm font-medium transition-all ${
                  campaignType === ct.value
                    ? "border-brand bg-brand/5 text-brand shadow-sm shadow-brand/10"
                    : "border-zinc-200 bg-white text-foreground hover:border-zinc-300 hover:bg-zinc-50"
                }`}
              >
                <span>{ct.icon}</span>
                {ct.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Count + Submit */}
      <div className="min-w-0 space-y-3 sm:space-y-5">
        {/* Count selector */}
        <div className="card p-3 sm:p-5">
          <label className="mb-2 sm:mb-3 block text-xs sm:text-sm font-semibold text-foreground">
            🔢 Kaç Fikir Üretilsin?
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={1}
              max={10}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-brand"
            />
            <span className="flex h-10 w-14 items-center justify-center rounded-xl border border-brand/20 bg-brand/5 text-lg font-bold text-brand">
              {count}
            </span>
          </div>
          <p className="mt-2 text-xs text-muted">1 ile 10 arasında fikir üretebilirsiniz</p>
        </div>

        {/* Summary card */}
        <div className="card overflow-hidden">
          <div className="bg-gradient-to-br from-brand/5 via-transparent to-brand-light/5 p-3 sm:p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-brand/10 text-xs text-brand">✨</span>
              Özet
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between">
                <span className="text-muted">Marka</span>
                <span className="max-w-[60%] truncate font-medium">{selectedCompanyName || "—"}</span>
              </li>
              <li className="flex justify-between gap-3">
                <span className="shrink-0 text-muted">Konu</span>
                <span className="min-w-0 truncate font-medium text-right">{topic || "—"}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted">Platform</span>
                <span className="font-medium">{platform || "—"}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted">Kampanya</span>
                <span className="font-medium">
                  {CAMPAIGN_TYPES.find((c) => c.value === campaignType)?.label || "—"}
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted">Fikir Sayısı</span>
                <span className="font-bold text-brand">{count}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Submit button */}
        <button
          onClick={onGenerate}
          disabled={!isValid || loading}
          className="auth-btn auth-btn-primary flex items-center justify-center gap-2 text-base"
        >
          {loading ? (
            <>
              <span className="spinner" /> AI Üretiyor...
            </>
          ) : (
            <>
              ✨ Fikirler Üret
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Step 2: AI Results
// ──────────────────────────────────────────────

function Step2Results({
  ideas,
  setIdeas,
  onGoToImageStep,
}: {
  ideas: AiIdea[];
  setIdeas: React.Dispatch<React.SetStateAction<AiIdea[]>>;
  onGoToImageStep: (idea: AiIdea) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
      {ideas.map((idea, idx) => (
        <IdeaCard
          key={idea.id}
          idea={idea}
          index={idx}
          onUpdate={(updated) => {
            setIdeas((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
          }}
          onGoToImageStep={onGoToImageStep}
        />
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────
// Idea Card (Editable) — NO MODAL, navigates to step 3
// ──────────────────────────────────────────────

function IdeaCard({
  idea,
  index,
  onUpdate,
  onGoToImageStep,
}: {
  idea: AiIdea;
  index: number;
  onUpdate: (idea: AiIdea) => void;
  onGoToImageStep: (idea: AiIdea) => void;
}) {
  const [title, setTitle] = useState(idea.generated_title);
  const [description, setDescription] = useState(idea.generated_description);
  const [hashtags, setHashtags] = useState(idea.generated_hashtags);
  const [regenerating, setRegenerating] = useState(false);
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"" | "saved" | "error">("");

  // Platform badge info
  const platformInfo = PLATFORMS.find((p) => p.value === idea.platform);
  const campaignInfo = CAMPAIGN_TYPES.find((c) => c.value === idea.campaign_type);

  // ── Auto-save on blur ──────────────────
  const handleSave = useCallback(
    async (field: "title" | "description" | "hashtags", value: string) => {
      setSaving(true);
      setSaveStatus("");
      try {
        const payload: Record<string, unknown> = { id: idea.id };
        payload[field] = value;
        const { data } = await api.patch("/api/protected/update-idea", payload);
        onUpdate(data.idea);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus(""), 2000);
      } catch {
        setSaveStatus("error");
      } finally {
        setSaving(false);
      }
    },
    [idea.id, onUpdate]
  );

  // ── Regenerate ──────────────────────────
  const handleRegenerate = useCallback(async () => {
    setRegenerating(true);
    try {
      const { data } = await api.post("/api/protected/regenerate-idea", { id: idea.id });
      const updated = data.idea;
      setTitle(updated.generated_title);
      setDescription(updated.generated_description);
      setHashtags(updated.generated_hashtags);
      onUpdate(updated);
    } catch (err) {
      toast.error(getApiError(err, "Fikir yeniden üretilemedi."));
    } finally {
      setRegenerating(false);
    }
  }, [idea.id, onUpdate, toast]);

  return (
    <article
      className="card group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-zinc-300"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Gradient header */}
      <div className={`relative h-24 bg-gradient-to-br ${platformInfo?.color || "from-zinc-400 to-zinc-600"} p-4`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl drop-shadow-md">{PLATFORM_ICONS[idea.platform] || "📝"}</span>
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
              {idea.platform}
            </span>
          </div>
          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
            {campaignInfo?.icon} {campaignInfo?.label || idea.campaign_type}
          </span>
        </div>
        {(saving || saveStatus) && (
          <div className="absolute bottom-2 right-3">
            {saving && <span className="text-[10px] text-white/70">Kaydediliyor...</span>}
            {saveStatus === "saved" && <span className="text-[10px] text-emerald-200">✓ Kaydedildi</span>}
            {saveStatus === "error" && <span className="text-[10px] text-red-200">✗ Hata</span>}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-3 p-4">
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted">Başlık</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => { if (title !== idea.generated_title) handleSave("title", title); }}
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-sm font-semibold text-foreground outline-none transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/10"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted">Açıklama</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => { if (description !== idea.generated_description) handleSave("description", description); }}
            rows={3}
            className="w-full resize-none rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-sm leading-relaxed text-foreground outline-none transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/10"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted">Hashtagler</label>
          <input
            type="text"
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            onBlur={() => { if (hashtags !== idea.generated_hashtags) handleSave("hashtags", hashtags); }}
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-xs font-medium text-blue-600 outline-none transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/10"
          />
        </div>
        <div className="rounded-lg bg-zinc-50 p-3">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted">🖼️ Görsel Prompt (EN)</label>
          <p className="text-xs leading-relaxed text-zinc-500 line-clamp-3">{idea.image_suggestion_prompt}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {idea.suggested_layout && (
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-medium text-indigo-600 ring-1 ring-indigo-100">
              📐 {idea.suggested_layout.replace("_", " ")}
            </span>
          )}
          {idea.content_items && (() => {
            try {
              const items = JSON.parse(idea.content_items) as { icon: string; title: string }[];
              return items.map((item, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-amber-100">
                  {item.icon} {item.title}
                </span>
              ));
            } catch { return null; }
          })()}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 border-t p-3">
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white py-2 text-xs font-semibold text-foreground transition hover:bg-zinc-50 hover:border-zinc-300 disabled:opacity-50"
        >
          {regenerating ? (
            <><span className="spinner spinner-dark" style={{ width: 14, height: 14 }} /> Üretiliyor...</>
          ) : (
            <>🔄 Yeniden Oluştur</>
          )}
        </button>
        <button
          onClick={() => onGoToImageStep(idea)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-brand to-brand-dark py-2 text-xs font-semibold text-white shadow-sm shadow-brand/20 transition hover:shadow-md"
        >
          ✅ Onayla & Görsele Geç
        </button>
      </div>
    </article>
  );
}

// ──────────────────────────────────────────────
// Step 3: Image Generation — Full Page (Premium Design)
// ──────────────────────────────────────────────

function Step3ImageGeneration({
  idea,
  onApproved,
}: {
  idea: AiIdea;
  onApproved: (postId: number) => void;
  onBack: () => void;
}) {
  type Step3State = { postId: number | null; images: { url: string; seed: number }[]; selectedImageUrl: string | null };
  const [saved] = useState(() => readSession<Step3State>(STEP3_KEY + idea.id));
  const [imageCount, setImageCount] = useState(2);
  const [approving, setApproving] = useState(false);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<{ url: string; seed: number }[]>(saved?.images || []);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(saved?.selectedImageUrl || null);
  const [postId, setPostId] = useState<number | null>(saved?.postId || null);

  useEffect(() => {
    writeSession(STEP3_KEY + idea.id, { postId, images: generatedImages, selectedImageUrl });
  }, [idea.id, postId, generatedImages, selectedImageUrl]);
  const [genError, setGenError] = useState<string | null>(null);
  const { activeCompany } = useAuth();
  const toast = useToast();

  const platformInfo = PLATFORMS.find((p) => p.value === idea.platform);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  // ── Approve idea + generate multiple images
  const handleGenerateImages = useCallback(async () => {
    setGenError(null);
    setGeneratingImages(false);
    try {
      // Tekrar denemede aynı post'u kullan, mükerrer post oluşturma
      let createdPostId = postId;
      if (!createdPostId) {
        setApproving(true);
        const { data: approveData } = await api.post("/api/protected/approve-idea", { id: idea.id });
        createdPostId = approveData.post?.id;
        if (!createdPostId) throw new Error("Post oluşturulamadı");
        setPostId(createdPostId);
      }

      setApproving(false);
      setGeneratingImages(true);
      const { data: imgData } = await api.post("/api/protected/generate-multiple-images", {
        post_id: createdPostId,
        count: imageCount,
        style: "realistic",
      });

      const imgs = imgData.images || [];
      setGeneratedImages(imgs);
      if (imgs.length === 0) setGenError("Görsel üretilemedi. Lütfen tekrar deneyin.");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setGenError(msg || "Görsel üretilemedi. Lütfen birkaç saniye sonra tekrar deneyin.");
    } finally {
      setApproving(false);
      setGeneratingImages(false);
    }
  }, [idea.id, imageCount, postId]);

  // ── User selects an image
  const handleSelectImage = useCallback(async (url: string) => {
    setSelectedImageUrl(url);
    if (!postId) return;
    try {
      await api.post("/api/protected/select-image", {
        post_id: postId,
        image_url: url,
      });
    } catch (err) {
      toast.error(getApiError(err, "Görsel seçimi kaydedilemedi."));
    }
  }, [postId, toast]);

  const handleOpenStudio = () => {
    if (postId) {
      onApproved(postId);
    }
  };

  const isGenerating = approving || generatingImages;
  const hasImages = generatedImages.length > 0 && !generatingImages;

  return (
    <div className="max-w-3xl mx-auto space-y-3">
      {/* ═══ HERO HEADER — compact inline ═══ */}
      <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${platformInfo?.color || "from-zinc-500 to-zinc-700"} px-4 py-3 md:px-5 md:py-4`}>
        {/* Decorative circles */}
        <div className="absolute -top-6 -right-6 h-20 w-20 rounded-full bg-white/5" />
        <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-white/5" />

        <div className="relative z-10 flex items-start gap-3">
          {/* Platform icon */}
          <div className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm text-white mt-0.5">
            {PLATFORM_ICONS[idea.platform] || <span className="text-sm">📝</span>}
          </div>
          {/* Text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="rounded-full bg-white/20 px-2 py-px text-[10px] font-semibold text-white backdrop-blur-sm">
                {idea.platform}
              </span>
            </div>
            <h2 className="text-sm md:text-base font-bold text-white leading-snug drop-shadow-md line-clamp-1">
              {idea.generated_title}
            </h2>
            <p className="mt-0.5 text-[11px] text-white/60 line-clamp-1">
              {idea.generated_description}
            </p>
          </div>
        </div>
      </div>

      {/* ═══ IMAGE COUNT SELECTOR — Before generation ═══ */}
      {!isGenerating && !hasImages && (
        <div className="space-y-4">
          {/* Image count cards */}
          <div className="card p-4 md:p-5">
            <div className="text-center mb-4">
              <h3 className="text-sm font-bold text-foreground mb-0.5">Kaç Görsel Üretilsin?</h3>
              <p className="text-xs text-muted">AI her görsel için farklı açı ve kompozisyon deneyecek</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  onClick={() => setImageCount(n)}
                  className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-3 md:p-4 transition-all duration-200 ${
                    imageCount === n
                      ? "border-brand bg-gradient-to-b from-brand/5 to-brand/10 shadow-md shadow-brand/15 scale-[1.03]"
                      : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm hover:-translate-y-0.5"
                  }`}
                >
                  {/* Selection ring */}
                  {imageCount === n && (
                    <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white shadow-sm">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  )}
                  <div className={`flex items-center justify-center h-10 w-10 rounded-xl ${
                    imageCount === n ? "bg-brand/10" : "bg-zinc-100"
                  } transition-colors`}>
                    <span className="text-lg">{n === 1 ? "🖼️" : n === 2 ? "🎭" : n === 3 ? "🎨" : "💎"}</span>
                  </div>
                  <div className="text-center">
                    <span className={`text-lg font-bold ${imageCount === n ? "text-brand" : "text-foreground"}`}>{n}</span>
                    <p className="text-[10px] text-muted">Görsel</p>
                  </div>
                  <p className="text-[9px] text-muted leading-tight text-center">
                    {n === 1 ? "Hızlı üretim" : n === 2 ? "Önerilen" : n === 3 ? "Daha fazla seçenek" : "Maksimum çeşitlilik"}
                  </p>
                  {n === 2 && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-1.5 py-px text-[8px] font-bold text-white shadow-sm">
                      ÖNERİLEN
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-center gap-5 mt-3 text-[10px] text-muted">
              <span className="flex items-center gap-1">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                ~{imageCount * 15}-{imageCount * 30} sn
              </span>
              <span className="flex items-center gap-1">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                Yüksek kalite
              </span>
              <span className="flex items-center gap-1">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                AI destekli
              </span>
            </div>
          </div>

          {genError && (
            <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span>{genError}</span>
            </div>
          )}

          {/* Generate button */}
          <button
            onClick={handleGenerateImages}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-brand-dark text-white px-6 py-3.5 text-sm font-bold shadow-lg shadow-brand/25 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            {imageCount} Görsel Üret
          </button>

          {/* Collapsible content details */}
          <details className="card overflow-hidden group">
            <summary className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-zinc-50 transition text-xs font-semibold text-foreground">
              <span className="flex items-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                İçerik Detayları
              </span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted transition-transform group-open:rotate-180"><polyline points="6 9 12 15 18 9"/></svg>
            </summary>
            <div className="px-4 pb-4 space-y-2.5 border-t border-zinc-100 pt-3">
              <div>
                <label className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-muted">Hashtagler</label>
                <p className="text-[11px] font-medium text-blue-600">{idea.generated_hashtags}</p>
              </div>
              <div className="rounded-lg bg-zinc-50 p-2.5">
                <label className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wider text-muted">🖼️ Görsel Prompt</label>
                <p className="text-[11px] leading-relaxed text-zinc-500">{idea.image_suggestion_prompt}</p>
              </div>
            </div>
          </details>
        </div>
      )}

      {/* ═══ GENERATING STATE ═══ */}
      {isGenerating && (
        <div className="card p-6 md:p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            {/* Animated icon */}
            <div className="relative">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-brand to-brand-dark shadow-xl shadow-brand/40 flex items-center justify-center animate-pulse">
                <span className="text-3xl">{approving ? "✅" : "🎨"}</span>
              </div>
              {/* Spinning ring */}
              <div className="absolute -inset-2.5 rounded-[1.25rem] border-2 border-brand/20 border-t-brand animate-spin" style={{ animationDuration: "2s" }} />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-foreground mb-1">
                {approving ? "İçerik Onaylanıyor..." : `${imageCount} Görsel Üretiliyor...`}
              </h3>
              <p className="text-xs text-muted max-w-sm">
                {approving
                  ? "Fikir onaylanıyor ve post olarak kaydediliyor..."
                  : `AI, farklı açılardan ${imageCount} profesyonel görsel üretiyor. ~${imageCount * 15}-${imageCount * 30} saniye sürebilir.`}
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full max-w-xs">
              <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
                <div className="h-full rounded-full bg-gradient-to-r from-brand via-brand-light to-brand" style={{ animation: "shimmer 2s ease-in-out infinite", backgroundSize: "200% 100%", width: "100%" }} />
              </div>
            </div>
          </div>

          {/* Skeleton gallery preview */}
          <div className={`grid gap-3 mt-6 ${imageCount <= 2 ? "grid-cols-2 max-w-md mx-auto" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"}`}>
            {Array.from({ length: imageCount }).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-50 animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
            ))}
          </div>
        </div>
      )}

      {/* ═══ GENERATED IMAGES GALLERY ═══ */}
      {hasImages && (
        <div className="space-y-4">
          <div className="card p-4 md:p-5">
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 mb-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {generatedImages.length} görsel hazır
              </div>
              <h3 className="text-base font-bold text-foreground">Görseli Seçin</h3>
              <p className="text-xs text-muted mt-0.5">Beğendiğiniz görsele tıklayın, ardından stüdyoda düzenleyin</p>
            </div>

            <div className={`grid gap-3 ${
              generatedImages.length === 1 ? "grid-cols-1 max-w-xs mx-auto"
                : generatedImages.length === 2 ? "grid-cols-2 max-w-lg mx-auto"
                  : generatedImages.length === 3 ? "grid-cols-3 max-w-2xl mx-auto"
                    : "grid-cols-2 md:grid-cols-4"
            }`}>
              {generatedImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectImage(img.url)}
                  className={`group relative rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                    selectedImageUrl === img.url
                      ? "border-brand shadow-xl shadow-brand/25 ring-3 ring-brand/15 scale-[1.02]"
                      : "border-zinc-200 hover:border-zinc-300 hover:shadow-lg hover:-translate-y-0.5"
                  }`}
                >
                  <div className={`${platformAspectClass(idea.platform)} bg-zinc-100 relative`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url.startsWith("/") ? `${baseUrl}${img.url}` : img.url}
                      alt={`Görsel seçenek ${i + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {/* Hover overlay */}
                    {selectedImageUrl !== img.url && (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-foreground shadow-md">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                      </div>
                    )}
                    {/* Selection overlay */}
                    {selectedImageUrl === img.url && (
                      <div className="absolute inset-0 bg-brand/10 flex items-center justify-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white shadow-lg animate-scale-in">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                      </div>
                    )}
                    {/* Number badge */}
                    <div className="absolute top-2 left-2 flex h-6 w-6 items-center justify-center rounded-lg bg-black/50 text-white text-[11px] font-bold backdrop-blur-sm">
                      {i + 1}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Platform önizlemesi */}
          <div className="card p-4 md:p-5">
            <h3 className="mb-3 text-center text-sm font-bold text-foreground">{idea.platform} Önizlemesi</h3>
            <div className="flex justify-center">
              <PostPreview
                platform={idea.platform}
                brandName={activeCompany?.name || ""}
                logoUrl={activeCompany?.logo_url ? (activeCompany.logo_url.startsWith("/") ? `${baseUrl}${activeCompany.logo_url}` : activeCompany.logo_url) : undefined}
                imageUrl={(() => { const u = selectedImageUrl || generatedImages[0]?.url; return u ? (u.startsWith("/") ? `${baseUrl}${u}` : u) : null; })()}
                caption={idea.generated_description}
                hashtags={idea.generated_hashtags}
              />
            </div>
            <p className="mt-3 text-center text-[11px] text-muted">Başlık, CTA ve logo stüdyoda marka renklerinizle görsele eklenir.</p>
          </div>

          {/* Open Studio button */}
          <button
            onClick={handleOpenStudio}
            disabled={!selectedImageUrl}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-brand-dark text-white px-6 py-3.5 text-sm font-bold shadow-lg shadow-brand/25 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Seçilen Görseli Stüdyoda Aç
          </button>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Loading Overlay with Skeleton Cards
// ──────────────────────────────────────────────

function LoadingOverlay({ count }: { count: number }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-lg">
        <div className="card overflow-hidden p-6 text-center">
          {/* Animated logo */}
          <div className="mb-4 flex justify-center">
            <div className="relative">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-brand to-brand-dark shadow-lg shadow-brand/30 flex items-center justify-center animate-pulse-ring">
                <span className="text-3xl">✨</span>
              </div>
            </div>
          </div>

          <h3 className="mb-1 text-lg font-semibold text-foreground">AI Fikirleri Üretiyor</h3>
          <p className="mb-5 text-sm text-muted">
            {count} içerik fikri hazırlanıyor, lütfen bekleyin...
          </p>

          {/* Skeleton cards */}
          <div className="space-y-3">
            {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50 p-3"
                style={{ animationDelay: `${i * 200}ms` }}
              >
                <div className="h-10 w-10 animate-pulse rounded-lg bg-zinc-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-3/4 animate-pulse rounded-full bg-zinc-200" />
                  <div className="h-2 w-1/2 animate-pulse rounded-full bg-zinc-200" />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted">
            <span className="spinner spinner-dark" style={{ width: 14, height: 14 }} />
            Yapay Zeka ile üretiliyor…
          </div>
        </div>
      </div>
    </div>
  );
}
