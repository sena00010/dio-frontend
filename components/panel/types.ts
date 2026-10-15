export const SCREEN_KEYS = [
  "dashboard",
  "reklam",
  "seo",
  "seo-genel-bakis",
  "seo-aksiyonlar",
  "seo-siralamalar",
  "seo-kelimeler",
  "seo-icerik",
  "seo-teknik",
  "seo-backlink",
  "seo-ai",
  "sosyal",
  "performans",
  "yapay-zeka",
  "icerik",
  "yeni-icerik",
  "studio",
  "ekip",
  "takvim",
  "zamanlayici",
  "kreatif-studyo",
  "urun-gorseli-studyosu",
  "kreatif-olustur",
  "profil",
  "marka-detay",
  "ayarlar",
] as const;

export type ScreenKey = (typeof SCREEN_KEYS)[number];

export type NavItem = {
  key: ScreenKey;
  label: string;
  icon: string | React.ComponentType<any>;
  badge?: {
    text: string;
    variant: "new" | "count";
  };
  children?: NavItem[];
};

export type NavGroup = {
  id: string;
  label: string;
  icon?: string;
  items: NavItem[];
};

export type Metric = {
  title: string;
  value: string;
  delta?: string;
  accent?: "green" | "red" | "blue" | "orange";
};
