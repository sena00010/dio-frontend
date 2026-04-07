"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDownIcon, MagnifyingGlassIcon, UserIcon, UserGroupIcon } from "@heroicons/react/24/outline";

export function CustomSelect({ value, onChange, options, placeholder = "Seçiniz" }: { value: string, onChange: (v: string) => void, options: {value: string, label: string}[], placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-foreground shadow-sm transition hover:bg-zinc-50 focus:border-brand focus:ring-2 focus:ring-brand/10 outline-none"
      >
        <span className={selectedOption ? "text-foreground" : "text-muted"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDownIcon className={`h-4 w-4 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-zinc-200 bg-white p-1 shadow-lg ring-1 ring-black/5">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                value === opt.value ? "bg-brand/10 text-brand font-medium" : "text-foreground hover:bg-zinc-100"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const TOP_GOOGLE_FONTS = [
  "Inter", "Roboto", "Montserrat", "Playfair Display", "Poppins", "Oswald", "Bebas Neue", 
  "Lato", "Open Sans", "Raleway", "Ubuntu", "Nunito", "Merriweather", "PT Sans", "Work Sans", 
  "Rubik", "Mukta", "Quicksand", "Karla", "Josefin Sans", "Libre Baskerville", "Fira Sans", 
  "Inconsolata", "Barlow", "Space Grotesk", "Syne", "Outfit", "Space Mono"
].sort();

export function SearchableFontSelect({ value, onChange }: { value: string, onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = TOP_GOOGLE_FONTS.filter(f => f.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-foreground shadow-sm transition hover:bg-zinc-50 focus:border-brand focus:ring-2 focus:ring-brand/10 outline-none"
      >
        <span>{value || "Font Seçin"}</span>
        <ChevronDownIcon className={`h-4 w-4 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      
      {open && (
        <div className="absolute z-50 mt-1 max-h-72 w-full flex flex-col rounded-lg border border-zinc-200 bg-white shadow-lg ring-1 ring-black/5">
          <div className="p-2 border-b border-zinc-100 sticky top-0 bg-white z-10 rounded-t-lg">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-2.5 top-2 h-4 w-4 text-muted" />
              <input 
                type="text" 
                autoFocus 
                placeholder="Font ara..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md border-none bg-zinc-100 py-1.5 pl-8 pr-3 text-sm focus:bg-zinc-200 focus:outline-none focus:ring-0"
              />
            </div>
          </div>
          <div className="overflow-y-auto p-1 max-h-60">
            {filtered.length === 0 ? (
              <div className="p-3 text-center text-xs text-muted">Font bulunamadı</div>
            ) : (
              filtered.map((font) => (
                <button
                  key={font}
                  type="button"
                  onClick={() => { onChange(font); setOpen(false); setSearch(""); }}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    value === font ? "bg-brand/10 text-brand font-medium" : "text-foreground hover:bg-zinc-100"
                  }`}
                  style={{ fontFamily: font }}
                >
                  {font}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function GenderToggle({ selected, onChange }: { selected: string[], onChange: (v: string[]) => void }) {
  const toggle = (g: string) => onChange(selected.includes(g) ? selected.filter(x => x !== g) : [...selected, g]);
  
  return (
    <div className="flex flex-wrap gap-2">
      {[
        { id: "Kadın", icon: <UserIcon className="w-3.5 h-3.5" /> },
        { id: "Erkek", icon: <UserIcon className="w-3.5 h-3.5" /> },
        { id: "Herkes", icon: <UserGroupIcon className="w-3.5 h-3.5" /> }
      ].map(g => {
        const isSelected = selected.includes(g.id);
        return (
          <button
            key={g.id}
            type="button"
            onClick={() => toggle(g.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
              isSelected 
                ? "bg-brand text-white border-brand shadow-sm shadow-brand/20" 
                : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
            }`}
          >
            {g.icon} {g.id}
          </button>
        );
      })}
    </div>
  );
}

// ── Social Media Brand SVG Icons ──
const SocialIcons: Record<string, (props: { className?: string }) => React.ReactElement> = {
  instagram: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
  ),
  facebook: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
  ),
  twitter: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
  ),
  linkedin: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
  ),
  youtube: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
  ),
  tiktok: ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
  ),
};

const SOCIAL_NETWORKS = [
  { id: "instagram", name: "Instagram", color: "#E1306C", activeColor: "#E1306C" },
  { id: "facebook", name: "Facebook", color: "#1877F2", activeColor: "#1877F2" },
  { id: "twitter", name: "X (Twitter)", color: "#000000", activeColor: "#ffffff" },
  { id: "linkedin", name: "LinkedIn", color: "#0A66C2", activeColor: "#0A66C2" },
  { id: "youtube", name: "YouTube", color: "#FF0000", activeColor: "#FF0000" },
  { id: "tiktok", name: "TikTok", color: "#000000", activeColor: "#ffffff" },
] as const;

export function SocialMediaManager({ socials, onChange }: { socials: any, onChange: (s: any) => void }) {
  const [activeIds, setActiveIds] = useState<string[]>([]);

  // auto fill initial active ids
  useEffect(() => {
    setActiveIds(Object.keys(socials).filter(k => socials[k]));
  }, []);

  const toggleNetwork = (id: string) => {
    if (activeIds.includes(id)) {
      setActiveIds(activeIds.filter(x => x !== id));
      onChange({ ...socials, [id]: "" });
    } else {
      setActiveIds([...activeIds, id]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {SOCIAL_NETWORKS.map(net => {
          const isActive = activeIds.includes(net.id);
          const IconComponent = SocialIcons[net.id];
          return (
            <button
              key={net.id}
              type="button"
              onClick={() => toggleNetwork(net.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                isActive ? "bg-zinc-900 border-zinc-900 text-white shadow-sm" : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
              }`}
            >
              {IconComponent && <IconComponent className={`w-3.5 h-3.5 ${isActive ? "text-white" : ""}`} />}
              {net.name}
            </button>
          )
        })}
      </div>
      
      {activeIds.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 p-4 bg-zinc-50/50 rounded-xl border border-zinc-200">
          {activeIds.map(id => {
            const net = SOCIAL_NETWORKS.find(n => n.id === id);
            const IconComponent = SocialIcons[id];
            return (
              <div key={id}>
                <label className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase text-foreground/80">
                  {IconComponent && <IconComponent className="w-3 h-3" />}
                  {net?.name} Adresi
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded bg-zinc-100 text-[10px] font-mono text-muted">@</div>
                  <input
                    type="text"
                    value={socials[id] || ""}
                    onChange={(e) => onChange({ ...socials, [id]: e.target.value })}
                    placeholder="kullanici_adi"
                    className="w-full rounded-md border border-zinc-200 bg-white py-2 pl-10 pr-3 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
