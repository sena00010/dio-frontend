import type { NavGroup } from "./types";

// Menü işe göre gruplanır: önce günlük içerik işi, sonra analiz/reklam, en sonda SEO.
export const navigationGroups: NavGroup[] = [
  {
    id: "icerik",
    label: "İçerik",
    icon: "📱",
    items: [
      { key: "dashboard", label: "Ana Sayfa", icon: "DB" },
      { key: "icerik", label: "İçerik Yönetimi", icon: "İY" },
      { key: "takvim", label: "İçerik Takvimi", icon: "TK" },
      { key: "zamanlayici", label: "Zamanlama", icon: "ZA" },
      { key: "kreatif-studyo", label: "Kreatif Stüdyo", icon: "KS" },
      { key: "urun-gorseli-studyosu", label: "Ürün Görseli Stüdyosu", icon: "ÜG" },
    ],
  },
  {
    id: "analiz",
    label: "Analiz & Reklam",
    icon: "📈",
    items: [
      { key: "sosyal", label: "Sosyal Medya Analizi", icon: "SM" },
      { key: "performans", label: "Performans", icon: "PF" },
      { key: "reklam", label: "Reklam Yönetimi", icon: "RY" },
      { key: "yapay-zeka", label: "Yapay Zeka Asistanı", icon: "YZ" },
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
    id: "profil",
    label: "Hesap",
    icon: "👤",
    items: [
      { key: "profil", label: "Firma ve Markalar", icon: "FM" },
      { key: "ekip", label: "Ekip Yönetimi", icon: "EY" },
    ],
  },
];
