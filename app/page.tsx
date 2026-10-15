"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { navigationGroups } from "@/components/panel/data";
import { ScreenRenderer } from "@/components/panel/screens";
import { clearWizardDraft } from "@/components/panel/NewContentWizard";
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
  ChevronDownIcon,
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

/* ── Menüdeki ana eylem: her yerden tek tıkla yeni içerik ── */
function NewContentButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-brand-dark px-4 py-2.5 text-[14px] font-semibold text-white shadow-md shadow-brand/20 transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <SparklesIcon className="h-[18px] w-[18px]" />
      Yeni İçerik Oluştur
    </button>
  );
}

export default function Home() {
  const { user, companies, activeCompany, setActiveCompany, loading, logout } = useAuth();
  const [active, setActiveRaw] = useState<ScreenKey>(() => getScreenFromHash());
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [brandMenuOpen, setBrandMenuOpen] = useState(false);
  const [studioPostId, setStudioPostId] = useState<number | undefined>(() => (["studio", "carousel"].includes(parseHash().screen) ? parseHash().param : undefined));
  const [schedulePostId, setSchedulePostId] = useState<number | undefined>(() => (parseHash().screen === "zamanlayici" ? parseHash().param : undefined));
  const [kreatifTopics, setKreatifTopics] = useState<string[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
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
  const initials = [user.first_name?.[0], user.last_name?.[0]].filter(Boolean).join("").toUpperCase() || "U";
  const companyName = activeCompany?.name || "DIO";
  const companyInitials = companyName.split(" ").length > 1 
    ? companyName.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase()
    : companyName.substring(0, 2).toUpperCase();

  const handleNavClick = (key: string) => {
    setActive(key as ScreenKey);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-foreground flex flex-col md:flex-row">
      
      {/* ═══ Mobile Top Bar ═══ */}
      <div className="md:hidden flex items-center justify-between bg-white border-b border-zinc-200 px-4 py-3 sticky top-0 z-30 shadow-sm shadow-zinc-100">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 -ml-1.5 text-foreground hover:bg-zinc-100 rounded-lg transition"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <img src="/dio.svg" alt="DIO" className="h-6 w-auto" />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { setActive("profil" as ScreenKey); setMobileMenuOpen(false); }} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E73932] text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
            {initials}
          </button>
        </div>
      </div>

      {/* ═══ Mobile Drawer Menu ═══ */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden transition-opacity" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      <div className={`fixed inset-y-0 left-0 bg-white w-[280px] shadow-2xl z-50 md:hidden transform transition-transform duration-300 ease-in-out flex flex-col ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col border-b border-zinc-100">
          <div className="flex items-center justify-between px-5 pt-6 pb-5">
             <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E73932] text-[13px] font-bold text-white shadow-sm">
                DIO
              </span>
              <div className="flex flex-col leading-tight">
                <span className="text-[17px] font-extrabold text-zinc-900 tracking-tight">DIO</span>
                <span className="text-[11px] font-medium text-zinc-400 mt-[1px]">DİJİTAL İŞ ORTAĞI</span>
              </div>
            </div>
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 text-muted hover:bg-zinc-100 hover:text-foreground rounded-lg transition"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Content */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 sidebar-nav">
          <NewContentButton onClick={() => { clearWizardDraft(); handleNavClick("yeni-icerik"); }} />
          {navigationGroups.map((group) => (
            <div key={group.id} className="space-y-1">
              <p className="px-2 mb-2 text-[11px] font-bold uppercase tracking-widest text-[#A1A1A8]">{group.label}</p>
              <div className="space-y-[2px]">
                {group.items.map((item) => {
                  const selected = item.key === active;
                  const hasChildren = item.children && item.children.length > 0;
                  const isExpanded = expandedMenus[item.key] || item.children?.some(c => c.key === active);
                  return (
                    <div key={item.key}>
                      <button
                        onClick={() => {
                          if (hasChildren) {
                            setExpandedMenus(prev => ({ ...prev, [item.key]: !prev[item.key] }));
                          }
                          handleNavClick(item.key);
                        }}
                        className={`flex w-full items-center gap-3.5 rounded-xl px-3 py-2.5 text-left text-[14px] transition-all duration-150 ${
                          selected 
                            ? "bg-[#FFF5F3] text-[#E73932] font-semibold" 
                            : "text-[#6B7280] hover:bg-zinc-50 hover:text-zinc-900 font-medium"
                        }`}
                      >
                        {(() => { 
                           const Icon = NAV_ICONS[item.key];
                           return Icon ? (
                             <Icon className={`w-[20px] h-[20px] flex-shrink-0 ${selected ? "text-[#E73932]" : "text-[#9CA3AF]"}`} />
                           ) : (
                             <span className={`w-[20px] h-[20px] flex items-center justify-center text-[12px] font-bold flex-shrink-0 ${selected ? "text-[#E73932]" : "text-[#9CA3AF]"}`}>{item.icon as string}</span>
                           );
                        })()}
                        <span>{item.label}</span>
                        {item.badge && (
                            <span
                              className={
                                item.badge.variant === "new"
                                  ? "ml-auto rounded-full bg-[#D1FAE5] px-2 py-[2px] text-[10px] font-bold text-[#059669]"
                                  : "ml-auto flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#E73932] text-[10px] font-bold text-white shadow-sm"
                              }
                            >
                              {item.badge.text}
                            </span>
                        )}
                        {hasChildren && (
                          <ChevronDownIcon className={`ml-auto h-4 w-4 text-zinc-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                        )}
                      </button>
                      {hasChildren && isExpanded && (
                        <div className="ml-7 mt-0.5 space-y-[2px] border-l-2 border-zinc-100 pl-3">
                          {item.children!.map((child) => {
                            const childSelected = child.key === active;
                            return (
                              <button
                                key={child.key}
                                onClick={() => handleNavClick(child.key)}
                                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition-all duration-150 ${
                                  childSelected
                                    ? "bg-[#FFF5F3] text-[#E73932] font-semibold"
                                    : "text-[#6B7280] hover:bg-zinc-50 hover:text-zinc-900 font-medium"
                                }`}
                              >
                                {(() => {
                                  const ChildIcon = NAV_ICONS[child.key];
                                  return ChildIcon ? (
                                    <ChildIcon className={`w-[16px] h-[16px] flex-shrink-0 ${childSelected ? "text-[#E73932]" : "text-[#9CA3AF]"}`} />
                                  ) : (
                                    <span className={`w-[16px] h-[16px] flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${childSelected ? "text-[#E73932]" : "text-[#9CA3AF]"}`}>{child.icon as string}</span>
                                  );
                                })()}
                                <span>{child.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        
        {/* Mobile Bottom Profile Area */}
        <div className="p-4 border-t border-zinc-100 relative">
          <button onClick={() => setBrandMenuOpen(!brandMenuOpen)} className="w-full flex items-center gap-3 rounded-[14px] bg-[#F4F4F5] p-3 mx-auto text-left transition hover:bg-[#EBEBEB]">
             <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E73932] text-[12px] font-bold text-white shadow-sm flex-shrink-0">
               {companyInitials}
             </div>
             <div className="flex flex-col min-w-0">
               <span className="text-[14px] font-bold text-zinc-900 truncate">{companyName}</span>
               <span className="text-[12px] font-medium text-zinc-500">Pro Plan</span>
             </div>
          </button>
          
          {brandMenuOpen && (
              <div className="absolute bottom-[calc(100%+8px)] left-4 right-4 z-50 rounded-xl border border-zinc-200 bg-white shadow-xl max-h-60 overflow-y-auto">
                <div className="p-2">
                  <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">Markalarınız</p>
                  {companies.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setActiveCompany(c);
                        setBrandMenuOpen(false);
                        setMobileMenuOpen(false);
                        setActive("dashboard");
                      }}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition ${
                        activeCompany?.id === c.id
                          ? "bg-[#FFF5F3] text-[#E73932] font-medium"
                          : "text-zinc-600 hover:bg-zinc-50"
                      }`}
                    >
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-zinc-100 text-[10px] font-bold text-zinc-700">
                        {c.name.substring(0,2).toUpperCase()}
                      </span>
                      <span className="truncate text-[13px]">{c.name}</span>
                      {activeCompany?.id === c.id && <span className="ml-auto text-[#E73932] text-xs">✓</span>}
                    </button>
                  ))}
                </div>
                <div className="border-t border-zinc-100 p-2">
                   <button onClick={() => logout()} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50">
                      Çıkış Yap
                   </button>
                </div>
              </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex max-w-[1600px] mx-auto w-full md:overflow-hidden">
        {/* ═══ Desktop Sidebar Panel ═══ */}
        <aside className="sidebar-panel hidden md:flex flex-col w-[260px] h-screen bg-white flex-shrink-0">
          
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
            <NewContentButton onClick={() => { clearWizardDraft(); handleNavClick("yeni-icerik"); }} />
            {navigationGroups.map((group) => (
              <div key={group.id} className="space-y-1.5">
                <p className="px-2 mb-2.5 text-[11px] font-extrabold tracking-widest text-[#9CA3AF] uppercase">
                  {group.label}
                </p>
                <div className="space-y-[4px]">
                  {group.items.map((item) => {
                    const selected = item.key === active;
                    const hasChildren = item.children && item.children.length > 0;
                    const isExpanded = expandedMenus[item.key] || item.children?.some(c => c.key === active);
                    return (
                      <div key={item.key}>
                        <button
                          onClick={() => {
                            if (hasChildren) {
                              setExpandedMenus(prev => ({ ...prev, [item.key]: !prev[item.key] }));
                            }
                            handleNavClick(item.key);
                          }}
                          className={`group flex w-full items-center gap-3.5 rounded-[12px] px-3 py-[9px] text-left text-[14.5px] transition-all duration-150 ${
                            selected
                              ? "bg-[#FFF5F3] text-[#E73932] font-semibold"
                              : "text-[#6B7280] hover:bg-zinc-50 hover:text-[#111827] font-medium"
                          }`}
                        >
                          {(() => { 
                             const Icon = NAV_ICONS[item.key];
                             return Icon ? (
                               <Icon className={`w-[20px] h-[20px] flex-shrink-0 transition-transform group-hover:scale-110 duration-200 ${selected ? "text-[#E73932]" : "text-[#9CA3AF] group-hover:text-[#6B7280]"}`} />
                             ) : (
                               <span className={`w-[20px] h-[20px] flex items-center justify-center text-[13px] font-bold flex-shrink-0 transition-transform group-hover:scale-110 duration-200 ${selected ? "text-[#E73932]" : "text-[#9CA3AF] group-hover:text-[#6B7280]"}`}>{item.icon as string}</span>
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
                          {hasChildren && (
                            <ChevronDownIcon className={`ml-auto h-4 w-4 text-zinc-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                          )}
                        </button>
                        {hasChildren && isExpanded && (
                          <div className="ml-8 mt-0.5 space-y-[2px] border-l-2 border-zinc-100 pl-3">
                            {item.children!.map((child) => {
                              const childSelected = child.key === active;
                              return (
                                <button
                                  key={child.key}
                                  onClick={() => handleNavClick(child.key)}
                                  className={`group flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-[7px] text-left text-[13.5px] transition-all duration-150 ${
                                    childSelected
                                      ? "bg-[#FFF5F3] text-[#E73932] font-semibold"
                                      : "text-[#6B7280] hover:bg-zinc-50 hover:text-[#111827] font-medium"
                                  }`}
                                >
                                  {(() => {
                                    const ChildIcon = NAV_ICONS[child.key];
                                    return ChildIcon ? (
                                      <ChildIcon className={`w-[16px] h-[16px] flex-shrink-0 transition-transform group-hover:scale-110 duration-200 ${childSelected ? "text-[#E73932]" : "text-[#9CA3AF] group-hover:text-[#6B7280]"}`} />
                                    ) : (
                                      <span className={`w-[16px] h-[16px] flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${childSelected ? "text-[#E73932]" : "text-[#9CA3AF]"}`}>{child.icon as string}</span>
                                    );
                                  })()}
                                  <span>{child.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Bottom Profile Header */}
          <div className="p-[20px] border-t border-[#EAEAEA] relative bg-white">
            <button
              onClick={() => setBrandMenuOpen(!brandMenuOpen)}
              className="w-full flex items-center gap-3 rounded-[12px] bg-[#F4F4F5] p-3.5 text-left transition hover:bg-[#EBEBEB]"
            >
              <div className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-[#E73932] text-[14px] font-bold text-white flex-shrink-0">
                {companyInitials}
              </div>
              <div className="flex flex-col min-w-0 pt-[1px]">
                <span className="text-[15px] font-bold text-[#111827] truncate leading-tight">{companyName}</span>
                <span className="text-[12px] font-medium text-[#6B7280] mt-[2px]">Pro Plan</span>
              </div>
            </button>
            {/* Brand Dropdown */}
            {brandMenuOpen && (
               <>
                 <div className="fixed inset-0 z-40" onClick={() => setBrandMenuOpen(false)} />
                 <div className="absolute left-5 right-5 bottom-[100%] mb-3 z-50 rounded-[14px] border border-zinc-200 bg-white shadow-xl shadow-black/5 animate-fade-in-up overflow-hidden">
                   <div className="max-h-60 overflow-y-auto p-2">
                     <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">Markalarınız</p>
                     <div className="space-y-1">
                       {companies.map((c) => (
                         <button
                           key={c.id}
                           onClick={() => {
                             setActiveCompany(c);
                             setBrandMenuOpen(false);
                             setActive("dashboard");
                           }}
                           className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14.5px] transition ${
                             activeCompany?.id === c.id
                               ? "bg-[#FFF5F3] text-[#E73932] font-semibold"
                               : "text-[#4B5563] hover:bg-zinc-50 font-medium"
                           }`}
                         >
                           {c.logo_url ? (
                             <img src={`${process.env.NEXT_PUBLIC_API_URL}${c.logo_url}`} alt={c.name} className="h-8 w-8 rounded-full object-cover border border-zinc-100" />
                           ) : (
                             <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-[11px] font-bold text-zinc-600 border border-zinc-100">
                               {c.name.substring(0,2).toUpperCase()}
                             </span>
                           )}
                           <span className="truncate">{c.name}</span>
                           {activeCompany?.id === c.id && <span className="ml-auto text-[#E73932] text-sm">✓</span>}
                         </button>
                       ))}
                     </div>
                   </div>
                   <div className="border-t border-[#EAEAEA] p-2 bg-zinc-50/50">
                     <button
                       onClick={() => { setBrandMenuOpen(false); setActive("profil"); }}
                       className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-[14px] font-semibold text-[#E73932] transition hover:bg-[#FFF5F3]"
                     >
                       <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border-2 border-dashed border-[#E73932]/40 text-[#E73932] text-xs">+</span>
                       Yeni Marka Ekle
                     </button>
                     <button onClick={() => logout()} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 mt-1 text-[14px] font-semibold text-red-600 transition hover:bg-red-50">
                        Çıkış Yap
                     </button>
                   </div>
                 </div>
               </>
            )}
          </div>
        </aside>

        {/* ═══ Main content ═══════════════════ */}
        <main className="flex-1 w-full max-w-full overflow-y-auto md:overflow-y-auto min-h-screen md:h-screen bg-white">
          <div className="min-h-[calc(100vh-3.5rem)] md:min-h-0 md:h-full p-4 md:p-6 w-full max-w-full overflow-x-auto overflow-y-auto relative z-10">
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
    </div>
  );
}
