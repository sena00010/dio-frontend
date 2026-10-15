"use client";

import { useState } from "react";
import type { ComponentType, SVGProps } from "react";
import {
  ArrowRightOnRectangleIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpDownIcon,
  PlusIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import type { NavGroup, ScreenKey } from "../types";

// Panelin tek kenar çubuğu: masaüstünde sabit, mobilde çekmece içinde aynı bileşen.

type Company = { id: number; name: string; logo_url?: string };
type Icon = ComponentType<SVGProps<SVGSVGElement>>;

type SidebarProps = {
  groups: NavGroup[];
  icons: Record<string, Icon>;
  active: ScreenKey;
  onNavigate: (key: ScreenKey) => void;
  onNewContent: () => void;
  companies: Company[];
  activeCompany: Company | null;
  onSelectCompany: (c: Company) => void;
  onAddBrand: () => void;
  userName: string;
  userEmail?: string;
  onLogout: () => void;
  // Uzun gruplar varsayılan olarak kapalı başlar (aktif ekran içindeyse açık)
  collapsibleGroupIds?: string[];
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
const initialsOf = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toLocaleUpperCase("tr-TR") || "?";

function BrandAvatar({ company, size = 36 }: { company: Company | null; size?: number }) {
  if (company?.logo_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={company.logo_url.startsWith("/") ? `${apiUrl}${company.logo_url}` : company.logo_url} alt="" className="rounded-lg bg-white object-contain" style={{ width: size, height: size }} />;
  }
  return (
    <span className="flex items-center justify-center rounded-lg bg-brand font-bold text-white" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initialsOf(company?.name || "DIO")}
    </span>
  );
}

export default function Sidebar({
  groups, icons, active, onNavigate, onNewContent, companies, activeCompany,
  onSelectCompany, onAddBrand, userName, userEmail, onLogout, collapsibleGroupIds = [],
}: SidebarProps) {
  const [brandOpen, setBrandOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  return (
    <div className="flex h-full flex-col bg-[#0d0d10] text-zinc-300">
      {/* Marka seçici */}
      <div className="relative px-3 pb-3 pt-4">
        <button
          type="button"
          onClick={() => setBrandOpen(o => !o)}
          aria-expanded={brandOpen}
          className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-2 text-left transition hover:bg-white/[0.07]"
        >
          <BrandAvatar company={activeCompany} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-semibold text-white">{activeCompany?.name || "Marka seçin"}</span>
            <span className="block text-[11px] text-zinc-500">DIO · Dijital İş Ortağı</span>
          </span>
          <ChevronUpDownIcon className="h-4 w-4 shrink-0 text-zinc-500" />
        </button>
        {brandOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setBrandOpen(false)} />
            <div className="absolute left-3 right-3 top-full z-50 mt-1 overflow-hidden rounded-xl border border-line bg-white shadow-xl shadow-black/5">
              <p className="px-3 pb-1 pt-2.5 text-[10px] font-bold uppercase tracking-widest text-muted">Markalarınız</p>
              <div className="max-h-64 overflow-y-auto p-1.5">
                {companies.map(c => (
                  <button key={c.id} type="button" onClick={() => { onSelectCompany(c); setBrandOpen(false); }}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-[13.5px] transition ${activeCompany?.id === c.id ? "bg-brand-soft font-semibold text-brand" : "text-foreground hover:bg-zinc-50"}`}>
                    <BrandAvatar company={c} size={28} />
                    <span className="truncate">{c.name}</span>
                    {activeCompany?.id === c.id && <CheckIcon className="ml-auto h-4 w-4" />}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => { onAddBrand(); setBrandOpen(false); }}
                className="flex w-full items-center gap-2 border-t border-line px-3.5 py-2.5 text-[13px] font-semibold text-brand hover:bg-brand-soft">
                <PlusIcon className="h-4 w-4" /> Yeni Marka Ekle
              </button>
            </div>
          </>
        )}
      </div>

      {/* Ana eylem */}
      <div className="px-3 pb-2">
        <button type="button" onClick={onNewContent}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-[14px] font-semibold text-white shadow-sm shadow-brand/30 transition hover:bg-brand-dark">
          <SparklesIcon className="h-[18px] w-[18px]" />
          Yeni İçerik Oluştur
        </button>
      </div>

      {/* Menü */}
      <nav className="sidebar-nav flex-1 space-y-5 overflow-y-auto px-3 py-3" aria-label="Ana menü">
        {groups.map(group => {
          const collapsible = collapsibleGroupIds.includes(group.id);
          const containsActive = group.items.some(i => i.key === active);
          const open = !collapsible || (openGroups[group.id] ?? containsActive);
          return (
            <div key={group.id}>
              {collapsible ? (
                <button type="button" onClick={() => setOpenGroups(g => ({ ...g, [group.id]: !open }))} aria-expanded={open}
                  className="mb-1 flex w-full items-center justify-between px-2.5 text-[11px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-300">
                  {group.label}
                  <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
                </button>
              ) : (
                <p className="mb-1 px-2.5 text-[11px] font-bold uppercase tracking-widest text-zinc-500">{group.label}</p>
              )}
              {open && (
                <ul className="space-y-0.5">
                  {group.items.map(item => {
                    const selected = item.key === active;
                    const Icon = icons[item.key];
                    return (
                      <li key={item.key}>
                        <button type="button" onClick={() => onNavigate(item.key)} aria-current={selected ? "page" : undefined}
                          className={`relative flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-[13.5px] transition ${selected ? "bg-white/10 font-semibold text-white" : "font-medium text-zinc-400 hover:bg-white/5 hover:text-white"}`}>
                          {selected && <span className="absolute -left-3 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-brand" />}
                          {Icon ? <Icon className={`h-[18px] w-[18px] shrink-0 ${selected ? "text-brand-light" : "text-zinc-500"}`} /> : <span className="w-[18px]" />}
                          <span className="truncate">{item.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      {/* Kullanıcı */}
      <div className="flex items-center gap-2.5 border-t border-white/10 px-3 py-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-[12px] font-bold text-white">{initialsOf(userName)}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold text-white">{userName}</span>
          {userEmail && <span className="block truncate text-[11px] text-zinc-500">{userEmail}</span>}
        </span>
        <button type="button" onClick={onLogout} aria-label="Çıkış yap" title="Çıkış yap"
          className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/10 hover:text-white">
          <ArrowRightOnRectangleIcon className="h-[18px] w-[18px]" />
        </button>
      </div>
    </div>
  );
}
