import type { NavGroup } from "./types";

// Ürünün üç ana bölümü (Sosyal Medya, Reklam, SEO) ayrı ve her zaman açık gruplar halinde.
export const navigationGroups: NavGroup[] = [
  {
    id: "genel",
    label: "Genel",
    icon: "🏠",
    items: [
      { key: "dashboard", label: "Ana Sayfa", icon: "DB" },
    ],
  },
  {
    id: "sosyal-medya",
    label: "Sosyal Medya",
    icon: "📱",
    items: [
      { key: "icerik", label: "İçerik Yönetimi", icon: "İY" },
      { key: "takvim", label: "İçerik Takvimi", icon: "TK" },
      { key: "zamanlayici", label: "Zamanlama", icon: "ZA" },
      { key: "kreatif-studyo", label: "Kreatif Stüdyo", icon: "KS" },
      { key: "urun-gorseli-studyosu", label: "Ürün Görseli Stüdyosu", icon: "ÜG" },
      { key: "sosyal", label: "Sosyal Medya Analizi", icon: "SM" },
    ],
  },
  {
    id: "reklam",
    label: "Reklam",
    icon: "📣",
    items: [
      { key: "reklam", label: "Reklam Yönetimi", icon: "RY" },
      { key: "performans", label: "Performans", icon: "PF" },
    ],
  },
  {
    id: "seo-analiz",
    label: "SEO",
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
    ],
  },
  {
    id: "hesap",
    label: "Araçlar ve Hesap",
    icon: "👤",
    items: [
      { key: "yapay-zeka", label: "Yapay Zeka Asistanı", icon: "YZ" },
      { key: "profil", label: "Firma ve Markalar", icon: "FM" },
      { key: "ekip", label: "Ekip Yönetimi", icon: "EY" },
    ],
  },
];
