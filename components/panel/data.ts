import type { NavGroup } from "./types";

export const navigationGroups: NavGroup[] = [
  {
    id: "profil",
    label: "Profil",
    icon: "👤",
    items: [
      { key: "dashboard", label: "Dashboard", icon: "DB" },
      { key: "profil", label: "Firma ve Markalar", icon: "FM" },
      { key: "ekip", label: "Ekip Yönetimi", icon: "EY" },
    ],
  },
  {
    id: "sosyal-medya",
    label: "Sosyal Medya",
    icon: "📱",
    items: [
      { key: "icerik", label: "İçerik Yönetimi", icon: "İY" },
      { key: "takvim", label: "İçerik Takvimi", icon: "TK" },
      { key: "zamanlayici", label: "Zamanlama Ayarla", icon: "ZA" },
      { key: "sosyal", label: "Sosyal Medya", icon: "SM" },
      { key: "kreatif-studyo", label: "Kreatif Stüdyo", icon: "KS" },
    ],
  },
  {
    id: "seo-analiz",
    label: "SEO & Analiz",
    icon: "📊",
    items: [
      { key: "seo", label: "SEO Analiz", icon: "SEO" },
      { key: "reklam", label: "Reklam Yönetimi", icon: "RY" },
      { key: "performans", label: "Performans", icon: "PF" },
      { key: "yapay-zeka", label: "Yapay Zeka", icon: "YZ" },
    ],
  },
];
