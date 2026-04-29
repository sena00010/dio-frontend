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
      { key: "urun-gorseli-studyosu", label: "Ürün Görseli Stüdyosu", icon: "ÜG" },
    ],
  },
  {
    id: "seo-analiz",
    label: "SEO & Analiz",
    icon: "📊",
    items: [
      { key: "seo-genel-bakis", label: "Genel Bakış", icon: "📊" },
      { key: "seo-aksiyonlar", label: "Aksiyonlar", icon: "⚡" },
      { key: "seo-siralamalar", label: "Sıralamalar", icon: "📈" },
      { key: "seo-kelimeler", label: "Kelimeler", icon: "🔑" },
      { key: "seo-icerik", label: "İçerik Üretimi", icon: "✍️" },
      { key: "seo-teknik", label: "Teknik", icon: "⚙️" },
      { key: "seo-backlink", label: "Backlink", icon: "🔗" },
      { key: "seo-ai", label: "AI Görünürlük", icon: "🤖" },
      { key: "reklam", label: "Reklam Yönetimi", icon: "RY" },
      { key: "performans", label: "Performans", icon: "PF" },
      { key: "yapay-zeka", label: "Yapay Zeka", icon: "YZ" },
    ],
  },
];
