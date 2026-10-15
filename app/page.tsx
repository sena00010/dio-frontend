"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { navigationGroups } from "@/components/panel/data";
import { ScreenRenderer } from "@/components/panel/screens";
import { clearWizardDraft } from "@/components/panel/NewContentWizard";
import Sidebar from "@/components/panel/shell/Sidebar";
import { SCREEN_KEYS, type ScreenKey } from "@/components/panel/types";
import { FullPageSpinner } from "@/components/ui/spinner";
import {
  Bars3Icon,
  XMarkIcon,
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
  PhotoIcon,
  ChartPieIcon,
  BoltIcon,
  ArrowTrendingUpIcon,
  KeyIcon,
  DocumentTextIcon,
  WrenchScrewdriverIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";

/* ── Nav item icon map ────────────────────── */
const NAV_ICONS: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  dashboard: Squares2X2Icon,
  profil: BuildingStorefrontIcon,
  ekip: UserGroupIcon,
  icerik: PencilSquareIcon,
  takvim: CalendarDaysIcon,
  zamanlayici: ClockIcon,
  sosyal: ShareIcon,
  seo: MagnifyingGlassIcon,
  "seo-genel-bakis": ChartPieIcon,
  "seo-aksiyonlar": BoltIcon,
  "seo-siralamalar": ArrowTrendingUpIcon,
  "seo-kelimeler": KeyIcon,
  "seo-icerik": DocumentTextIcon,
  "seo-teknik": WrenchScrewdriverIcon,
  "seo-backlink": LinkIcon,
  "seo-ai": SparklesIcon,
  reklam: StarIcon,
  performans: ChartBarIcon,
  "yapay-zeka": CpuChipIcon,
  "kreatif-studyo": SparklesIcon,
  "urun-gorseli-studyosu": PhotoIcon,
};

/* ── Hash → screen sync helpers ──────── */
// Biçim: #ekran veya #ekran/parametre (örn. #studio/123) — yenilemede ekran ve kayıt korunur
function parseHash(): { screen: ScreenKey; param?: number } {
  if (typeof window === "undefined") return { screen: "dashboard" };
  const [key, raw] = window.location.hash.replace("#", "").split("/");
  if (!key || !(SCREEN_KEYS as readonly string[]).includes(key)) return { screen: "dashboard" };
  const param = raw ? Number(raw) : undefined;
  return { screen: key as ScreenKey, param: param && Number.isFinite(param) ? param : undefined };
}

function getScreenFromHash(): ScreenKey {
  const { screen, param } = parseHash();
  // Parametre gerektiren ekranlar parametresiz açılırsa üst ekrana dön
  if ((screen === "studio" || screen === "carousel") && !param) return "icerik";
  if (screen === "marka-detay" && !param) return "profil";
  return screen;
}

export default function Home() {
  const { user, companies, activeCompany, setActiveCompany, loading, logout } = useAuth();
  const [active, setActiveRaw] = useState<ScreenKey>(() => getScreenFromHash());
  const [studioPostId, setStudioPostId] = useState<number | undefined>(() => (["studio", "carousel"].includes(parseHash().screen) ? parseHash().param : undefined));
  const [schedulePostId, setSchedulePostId] = useState<number | undefined>(() => (parseHash().screen === "zamanlayici" ? parseHash().param : undefined));
  const [kreatifTopics, setKreatifTopics] = useState<string[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [brandDetailId, setBrandDetailId] = useState<number | undefined>(() => (parseHash().screen === "marka-detay" ? parseHash().param : undefined));
  const [initialTopic, setInitialTopic] = useState<string>("");

  const setActive = useCallback((key: ScreenKey, param?: number) => {
    setActiveRaw(key);
    setSchedulePostId(key === "zamanlayici" ? param : undefined);
    if (typeof window !== "undefined") {
      window.location.hash = key === "dashboard" ? "" : param ? `${key}/${param}` : key;
    }
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      const { screen, param } = parseHash();
      if ((screen === "studio" || screen === "carousel") && param) setStudioPostId(param);
      if (screen === "marka-detay" && param) setBrandDetailId(param);
      setSchedulePostId(screen === "zamanlayici" ? param : undefined);
      setActiveRaw(getScreenFromHash());
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  if (loading || !user) return <FullPageSpinner />;

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ") || "Kullanıcı";
  const companyName = activeCompany?.name || "DIO";

  const handleNavClick = (key: string) => {
    setActive(key as ScreenKey);
    setMobileMenuOpen(false);
  };

  const sidebarProps = {
    groups: navigationGroups,
    icons: NAV_ICONS,
    active,
    onNavigate: (key: ScreenKey) => handleNavClick(key),
    onNewContent: () => { clearWizardDraft(); handleNavClick("yeni-icerik"); },
    companies,
    activeCompany,
    onSelectCompany: (c: { id: number }) => {
      const company = companies.find(x => x.id === c.id);
      if (company) setActiveCompany(company);
      setMobileMenuOpen(false);
      setActive("dashboard");
    },
    onAddBrand: () => handleNavClick("profil"),
    userName: fullName,
    userEmail: user.email,
    onLogout: () => logout(),
    collapsibleGroupIds: ["seo-analiz"],
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* ═══ Masaüstü kenar çubuğu ═══ */}
      <aside className="sticky top-0 hidden h-screen w-[256px] shrink-0 md:block">
        <Sidebar {...sidebarProps} />
      </aside>

      {/* ═══ Mobil üst çubuk ═══ */}
      <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-line bg-white/90 px-4 py-2.5 backdrop-blur md:hidden">
        <button type="button" onClick={() => setMobileMenuOpen(true)} aria-label="Menüyü aç" className="-ml-1.5 rounded-lg p-1.5 hover:bg-zinc-100">
          <Bars3Icon className="h-6 w-6" />
        </button>
        <span className="truncate px-3 text-[15px] font-semibold">{companyName}</span>
        <button type="button" onClick={() => { clearWizardDraft(); handleNavClick("yeni-icerik"); }} aria-label="Yeni içerik"
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white">
          <SparklesIcon className="h-5 w-5" />
        </button>
      </header>

      {/* ═══ Mobil çekmece ═══ */}
      {mobileMenuOpen && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden" onClick={() => setMobileMenuOpen(false)} />}
      <div className={`fixed inset-y-0 left-0 z-50 w-[280px] shadow-2xl transition-transform duration-300 md:hidden ${mobileMenuOpen ? "translate-x-0" : "-translate-x-[calc(100%+3.5rem)]"}`}>
        <button type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Menüyü kapat" className="absolute -right-12 top-3 z-10 rounded-full bg-white p-2 text-foreground shadow-lg">
          <XMarkIcon className="h-5 w-5" />
        </button>
        <Sidebar {...sidebarProps} />
      </div>

      {/* ═══ İçerik ═══ */}
      <main className="h-screen min-w-0 flex-1 overflow-y-auto pt-14 md:pt-0">
        <div className="relative mx-auto w-full max-w-[1440px] overflow-x-auto p-4 md:p-8">
        <ScreenRenderer
          screen={active}
          onNavigate={(key) => setActive(key)}
          studioPostId={studioPostId}
          onStudioNavigate={(postId) => {
            setStudioPostId(postId);
            setActive("studio", postId);
          }}
          onCarouselNavigate={(postId: number) => {
            setStudioPostId(postId);
            setActive("carousel", postId);
          }}
          schedulePostId={schedulePostId}
          onScheduleNavigate={(postId: number) => {
            setSchedulePostId(postId);
            setActive("zamanlayici", postId);
          }}
          kreatifTopics={kreatifTopics}
          onKreatifNavigate={(topics: string[]) => {
            setKreatifTopics(topics);
            setActive("kreatif-olustur");
          }}
          brandDetailId={brandDetailId}
          onBrandDetailNavigate={(id: number) => {
            setBrandDetailId(id);
            setActive("marka-detay", id);
          }}
          initialTopic={initialTopic}
          onSetInitialTopic={(topic: string) => {
            setInitialTopic(topic);
          }}
        />
        </div>
      </main>
    </div>
  );
}
