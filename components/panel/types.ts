export type ScreenKey =
  | "dashboard"
  | "reklam"
  | "seo"
  | "sosyal"
  | "performans"
  | "yapay-zeka"
  | "icerik"
  | "yeni-icerik"
  | "studio"
  | "ekip"
  | "takvim"
  | "zamanlayici"
  | "kreatif-studyo"
  | "kreatif-olustur"
  | "profil"
  | "ayarlar";

export type NavItem = {
  key: ScreenKey;
  label: string;
  icon: string | React.ComponentType<any>;
  badge?: {
    text: string;
    variant: "new" | "count";
  };
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
