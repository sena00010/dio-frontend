"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import api from "@/lib/api";
import { toPng } from "html-to-image";

// ── Types ──
type DesignLayer = {
  id: string;
  type: "headline" | "description" | "cta" | "badge" | "sticker" | "button";
  text: string;
  x: number; y: number; max_width: number;
  font_family: string; font_size: number; font_weight: number;
  color: string; text_align: "left" | "center" | "right";
  bg_color?: string; border_radius?: number; padding?: number;
  line_height?: number; opacity?: number; letter_spacing?: number;
  text_transform?: "uppercase" | "capitalize" | "none";
  text_shadow?: boolean; rotation?: number;
  font_style?: "normal" | "italic";
  stroke_color?: string; stroke_width?: number;
  glow_color?: string; glow_spread?: number;
};

type ImageEffects = {
  // Overlay efektleri
  gradient: boolean;
  gradientOpacity: number;
  gradientDirection: "to top" | "to bottom" | "to left" | "to right" | "to bottom right" | "to bottom left";
  gradientColor: string;
  gradientColor2: string;
  // Vignette
  vignette: boolean;
  vignetteOpacity: number;
  vignetteColor: string;
  // Renk filtresi
  colorFilter: "none" | "sepia" | "cool" | "warm" | "vintage" | "dramatic" | "fade" | "hdr" | "duotone" | "noir";
  filterIntensity: number;
  // Parlaklık / Kontrast
  brightness: number;
  contrast: number;
  saturation: number;
  hueRotate: number;
  // Blur
  blurAmount: number;
  // Solid overlay
  colorOverlay: boolean;
  colorOverlayColor: string;
  colorOverlayOpacity: number;
  // Noise/grain
  noise: boolean;
  noiseOpacity: number;
  // Border/Frame
  frameBorder: boolean;
  frameBorderColor: string;
  frameBorderWidth: number;
  frameBorderRadius: number;
  // Arka plan rengi (görsel yoksa)
  bgColor: string;
};

const DEFAULT_EFFECTS: ImageEffects = {
  gradient: false, gradientOpacity: 0.45,
  gradientDirection: "to top", gradientColor: "#000000", gradientColor2: "transparent",
  vignette: false, vignetteOpacity: 0.6, vignetteColor: "#000000",
  colorFilter: "none", filterIntensity: 100,
  brightness: 100, contrast: 100, saturation: 100, hueRotate: 0,
  blurAmount: 0,
  colorOverlay: false, colorOverlayColor: "#ff0000", colorOverlayOpacity: 20,
  noise: false, noiseOpacity: 5,
  frameBorder: false, frameBorderColor: "#ffffff", frameBorderWidth: 4, frameBorderRadius: 16,
  bgColor: "#1a1a2e",
};

// ── Constants ──
const LAYER_TYPE_LABELS: Record<string, string> = {
  headline: "📰 Başlık", description: "📝 Açıklama", cta: "🔗 CTA", badge: "🏷️ Badge", sticker: "⭐ Sticker", button: "🔘 Buton",
};
const LAYER_TYPE_COLORS: Record<string, string> = {
  headline: "bg-blue-500", description: "bg-emerald-500", cta: "bg-amber-500", badge: "bg-violet-500", sticker: "bg-pink-500", button: "bg-rose-500",
};
const CTA_STYLES = [
  { id: "pill-red", label: "🔴 Kırmızı", bg_color: "rgba(241,75,42,0.92)", border_radius: 24, padding: 10, color: "#ffffff" },
  { id: "pill-black", label: "⚫ Siyah", bg_color: "rgba(0,0,0,0.85)", border_radius: 24, padding: 10, color: "#ffffff" },
  { id: "pill-white", label: "⚪ Beyaz", bg_color: "rgba(255,255,255,0.9)", border_radius: 24, padding: 10, color: "#111" },
  { id: "ghost", label: "👻 Şeffaf", bg_color: "rgba(255,255,255,0.15)", border_radius: 24, padding: 10, color: "#ffffff" },
  { id: "gradient", label: "🌈 Gradient", bg_color: "linear-gradient(135deg,#F14B2A,#ff8c42)", border_radius: 24, padding: 10, color: "#ffffff" },
  { id: "neon", label: "💡 Neon", bg_color: "rgba(0,255,136,0.15)", border_radius: 20, padding: 10, color: "#00ff88" },
  { id: "square", label: "⬜ Kare", bg_color: "rgba(0,0,0,0.8)", border_radius: 4, padding: 10, color: "#ffffff" },
  { id: "minimal", label: "➡ Minimal", bg_color: "transparent", border_radius: 0, padding: 4, color: "#ffffff" },
];
// ── 50 Tasarım Şablonu ──
const DESIGN_TEMPLATES = [
  // 🔥 BOLD COLLECTION
  { id: "bold-1", name: "Bold Modern", preview: "🔥", cat: "Bold", layers: [{ type: "headline" as const, font_family: "Bebas Neue", font_size: 44, font_weight: 800, color: "#ffffff", text_transform: "uppercase" as const, letter_spacing: 2, x: 5, y: 60, max_width: 90, text_shadow: true }, { type: "description" as const, font_family: "Inter", font_size: 14, color: "#ffffffcc", x: 5, y: 82, max_width: 70 }] },
  { id: "bold-2", name: "Bold + CTA", preview: "🔥", cat: "Bold", layers: [{ type: "headline" as const, font_family: "Bebas Neue", font_size: 48, font_weight: 900, color: "#ffffff", text_transform: "uppercase" as const, x: 5, y: 50, max_width: 90, text_shadow: true }, { type: "description" as const, font_family: "Inter", font_size: 13, color: "#ffffffcc", x: 5, y: 75, max_width: 70 }, { type: "cta" as const, font_family: "Inter", font_size: 13, color: "#fff", bg_color: "rgba(241,75,42,0.9)", border_radius: 24, padding: 10, x: 5, y: 88, font_weight: 600 }] },
  { id: "bold-3", name: "Impact", preview: "💥", cat: "Bold", layers: [{ type: "badge" as const, font_family: "Bebas Neue", font_size: 11, color: "#000", bg_color: "#FFD93D", border_radius: 4, padding: 8, x: 5, y: 5, text_transform: "uppercase" as const }, { type: "headline" as const, font_family: "Archivo Black", font_size: 46, font_weight: 900, color: "#ffffff", x: 5, y: 55, max_width: 90, text_shadow: true }] },
  { id: "bold-4", name: "Grunge", preview: "⚫", cat: "Bold", layers: [{ type: "headline" as const, font_family: "Oswald", font_size: 50, font_weight: 800, color: "#ffffff", text_transform: "uppercase" as const, letter_spacing: -1, x: 5, y: 55, max_width: 90, text_shadow: true }, { type: "cta" as const, font_family: "Oswald", font_size: 12, color: "#fff", bg_color: "rgba(0,0,0,0.8)", border_radius: 4, padding: 10, x: 5, y: 88, text_transform: "uppercase" as const }] },
  { id: "bold-5", name: "Contrast", preview: "🖤", cat: "Bold", layers: [{ type: "headline" as const, font_family: "Bebas Neue", font_size: 36, font_weight: 800, color: "#FFD93D", text_transform: "uppercase" as const, x: 5, y: 58, max_width: 85, letter_spacing: 3, text_shadow: true }] },

  // ✨ ELEGANT COLLECTION
  { id: "ele-1", name: "Elegant", preview: "✨", cat: "Elegant", layers: [{ type: "headline" as const, font_family: "Playfair Display", font_size: 36, font_weight: 700, color: "#ffffff", x: 8, y: 55, max_width: 80, font_style: "italic" as const, text_shadow: true }, { type: "description" as const, font_family: "Lato", font_size: 13, color: "#ffffffbb", x: 8, y: 78, max_width: 65 }] },
  { id: "ele-2", name: "Luxury Gold", preview: "👑", cat: "Elegant", layers: [{ type: "headline" as const, font_family: "Cormorant Garamond", font_size: 38, font_weight: 600, color: "#d4af37", x: 10, y: 60, max_width: 80, font_style: "italic" as const, letter_spacing: 2, text_shadow: true }, { type: "description" as const, font_family: "Raleway", font_size: 11, color: "#d4af37aa", x: 10, y: 78, max_width: 65, letter_spacing: 3, text_transform: "uppercase" as const }] },
  { id: "ele-3", name: "Serif Classic", preview: "📖", cat: "Elegant", layers: [{ type: "headline" as const, font_family: "Abril Fatface", font_size: 34, font_weight: 400, color: "#ffffff", x: 10, y: 55, max_width: 80, text_shadow: true }, { type: "description" as const, font_family: "Raleway", font_size: 12, color: "#ffffffcc", x: 10, y: 78, max_width: 68, letter_spacing: 2, text_transform: "uppercase" as const }] },
  { id: "ele-4", name: "Gold Badge", preview: "🏅", cat: "Elegant", layers: [{ type: "badge" as const, font_family: "Cormorant Garamond", font_size: 12, color: "#d4af37", bg_color: "rgba(0,0,0,0.5)", border_radius: 2, padding: 8, x: 8, y: 6, letter_spacing: 3, text_transform: "uppercase" as const }, { type: "headline" as const, font_family: "Playfair Display", font_size: 34, font_weight: 700, color: "#d4af37", x: 8, y: 60, max_width: 80, font_style: "italic" as const }] },
  { id: "ele-5", name: "Monogram", preview: "🔡", cat: "Elegant", layers: [{ type: "headline" as const, font_family: "Cormorant Garamond", font_size: 80, font_weight: 300, color: "#ffffff", x: 60, y: 5, max_width: 35, letter_spacing: -2 }, { type: "description" as const, font_family: "Raleway", font_size: 11, color: "#ffffffaa", x: 5, y: 85, max_width: 50, letter_spacing: 4, text_transform: "uppercase" as const }] },

  // 🏷️ SALE / PROMO COLLECTION
  { id: "sale-1", name: "İndirim", preview: "🏷️", cat: "Promo", layers: [{ type: "badge" as const, font_family: "Bebas Neue", font_size: 12, color: "#fff", bg_color: "rgba(239,68,68,0.95)", border_radius: 4, padding: 8, x: 5, y: 5, text_transform: "uppercase" as const }, { type: "headline" as const, font_family: "Russo One", font_size: 44, font_weight: 400, color: "#ffffff", x: 5, y: 55, max_width: 90, text_shadow: true }, { type: "cta" as const, font_family: "Inter", font_size: 13, color: "#fff", bg_color: "rgba(239,68,68,0.9)", border_radius: 24, padding: 10, x: 5, y: 88, font_weight: 600 }] },
  { id: "sale-2", name: "%50 İndirim", preview: "💸", cat: "Promo", layers: [{ type: "headline" as const, font_family: "Bebas Neue", font_size: 70, font_weight: 900, color: "#F14B2A", x: 5, y: 40, max_width: 90, text_shadow: true }, { type: "description" as const, font_family: "Inter", font_size: 14, color: "#ffffff", x: 5, y: 75, max_width: 75, font_weight: 600 }, { type: "cta" as const, font_family: "Inter", font_size: 12, color: "#fff", bg_color: "#F14B2A", border_radius: 24, padding: 10, x: 5, y: 88 }] },
  { id: "sale-3", name: "Flash Sale", preview: "⚡", cat: "Promo", layers: [{ type: "badge" as const, font_family: "Bebas Neue", font_size: 11, color: "#000", bg_color: "#FFD93D", border_radius: 0, padding: 8, x: 5, y: 5, text_transform: "uppercase" as const, letter_spacing: 2 }, { type: "headline" as const, font_family: "Kanit", font_size: 42, font_weight: 800, color: "#FFD93D", x: 5, y: 50, max_width: 90, text_transform: "uppercase" as const, font_style: "italic" as const, text_shadow: true }, { type: "cta" as const, font_family: "Kanit", font_size: 13, color: "#000", bg_color: "#FFD93D", border_radius: 8, padding: 10, x: 5, y: 88, font_weight: 700 }] },
  { id: "sale-4", name: "Kampanya", preview: "🎁", cat: "Promo", layers: [{ type: "headline" as const, font_family: "Poppins", font_size: 28, font_weight: 800, color: "#ffffff", x: 5, y: 45, max_width: 85, text_shadow: true }, { type: "description" as const, font_family: "Poppins", font_size: 13, color: "#ffffffcc", x: 5, y: 70, max_width: 75 }, { type: "badge" as const, font_family: "Poppins", font_size: 11, color: "#fff", bg_color: "linear-gradient(135deg,#F14B2A,#ff8c42)", border_radius: 20, padding: 8, x: 5, y: 5, font_weight: 700 }, { type: "cta" as const, font_family: "Poppins", font_size: 12, color: "#fff", bg_color: "rgba(241,75,42,0.9)", border_radius: 24, padding: 10, x: 5, y: 88 }] },
  { id: "sale-5", name: "Son Şans", preview: "🔔", cat: "Promo", layers: [{ type: "badge" as const, font_family: "Inter", font_size: 10, color: "#fff", bg_color: "rgba(239,68,68,1)", border_radius: 4, padding: 8, x: 5, y: 5, font_weight: 700, letter_spacing: 1, text_transform: "uppercase" as const }, { type: "headline" as const, font_family: "Montserrat", font_size: 32, font_weight: 800, color: "#ffffff", x: 5, y: 50, max_width: 85, text_shadow: true }, { type: "cta" as const, font_family: "Montserrat", font_size: 12, color: "#000", bg_color: "#ffffff", border_radius: 24, padding: 10, x: 5, y: 88, font_weight: 700 }] },

  // 📱 SOCIAL MEDIA COLLECTION
  { id: "social-1", name: "Story", preview: "📱", cat: "Sosyal", layers: [{ type: "headline" as const, font_family: "Poppins", font_size: 36, font_weight: 800, color: "#ffffff", x: 8, y: 40, max_width: 85, text_align: "center" as const, text_shadow: true }, { type: "cta" as const, font_family: "Poppins", font_size: 14, color: "#fff", bg_color: "rgba(241,75,42,0.9)", border_radius: 24, padding: 10, x: 20, y: 75, font_weight: 600 }] },
  { id: "social-2", name: "Instagram", preview: "📸", cat: "Sosyal", layers: [{ type: "headline" as const, font_family: "Montserrat", font_size: 30, font_weight: 700, color: "#ffffff", x: 8, y: 65, max_width: 85, text_shadow: true }, { type: "description" as const, font_family: "Montserrat", font_size: 12, color: "#ffffffaa", x: 8, y: 82, max_width: 70 }] },
  { id: "social-3", name: "Facebook Ad", preview: "👤", cat: "Sosyal", layers: [{ type: "headline" as const, font_family: "Roboto", font_size: 28, font_weight: 700, color: "#ffffff", x: 5, y: 55, max_width: 90, text_shadow: true }, { type: "description" as const, font_family: "Roboto", font_size: 13, color: "#ffffffdd", x: 5, y: 76, max_width: 80 }, { type: "cta" as const, font_family: "Roboto", font_size: 12, color: "#fff", bg_color: "rgba(24,119,242,0.9)", border_radius: 6, padding: 10, x: 5, y: 90, font_weight: 600 }] },
  { id: "social-4", name: "Pinterest", preview: "📌", cat: "Sosyal", layers: [{ type: "headline" as const, font_family: "Playfair Display", font_size: 32, font_weight: 700, color: "#ffffff", x: 8, y: 70, max_width: 85, font_style: "italic" as const, text_shadow: true }, { type: "description" as const, font_family: "Inter", font_size: 12, color: "#ffffffcc", x: 8, y: 88, max_width: 70 }] },
  { id: "social-5", name: "TikTok", preview: "🎵", cat: "Sosyal", layers: [{ type: "headline" as const, font_family: "Poppins", font_size: 32, font_weight: 900, color: "#ffffff", x: 5, y: 30, max_width: 90, text_shadow: true }, { type: "badge" as const, font_family: "Poppins", font_size: 11, color: "#fff", bg_color: "rgba(241,75,42,0.9)", border_radius: 20, padding: 8, x: 5, y: 5, font_weight: 700 }, { type: "cta" as const, font_family: "Poppins", font_size: 13, color: "#000", bg_color: "#ffffff", border_radius: 24, padding: 10, x: 5, y: 85, font_weight: 700 }] },

  // ◻️ MINIMAL COLLECTION
  { id: "min-1", name: "Minimal Clean", preview: "◻️", cat: "Minimal", layers: [{ type: "headline" as const, font_family: "DM Sans", font_size: 28, font_weight: 700, color: "#ffffff", x: 10, y: 70, max_width: 80 }, { type: "description" as const, font_family: "DM Sans", font_size: 12, color: "#ffffffaa", x: 10, y: 85, max_width: 60 }] },
  { id: "min-2", name: "Whitespace", preview: "⬜", cat: "Minimal", layers: [{ type: "headline" as const, font_family: "Work Sans", font_size: 24, font_weight: 600, color: "#ffffff", x: 8, y: 72, max_width: 75, letter_spacing: 1 }] },
  { id: "min-3", name: "Line", preview: "📏", cat: "Minimal", layers: [{ type: "headline" as const, font_family: "Space Grotesk", font_size: 26, font_weight: 700, color: "#ffffff", x: 8, y: 68, max_width: 80 }, { type: "description" as const, font_family: "Space Grotesk", font_size: 11, color: "#ffffff88", x: 8, y: 84, max_width: 65, letter_spacing: 2, text_transform: "uppercase" as const }] },
  { id: "min-4", name: "Center Type", preview: "🔤", cat: "Minimal", layers: [{ type: "headline" as const, font_family: "Outfit", font_size: 30, font_weight: 800, color: "#ffffff", x: 10, y: 40, max_width: 80, text_align: "center" as const, text_shadow: true }, { type: "description" as const, font_family: "Outfit", font_size: 13, color: "#ffffffbb", x: 10, y: 65, max_width: 80, text_align: "center" as const }] },
  { id: "min-5", name: "Logo Only", preview: "🔳", cat: "Minimal", layers: [{ type: "badge" as const, font_family: "Montserrat", font_size: 10, color: "#ffffff", bg_color: "rgba(255,255,255,0.12)", border_radius: 6, padding: 10, x: 5, y: 5, font_weight: 600, letter_spacing: 3, text_transform: "uppercase" as const }] },

  // 💜 NEON COLLECTION
  { id: "neon-1", name: "Neon Pop", preview: "💜", cat: "Neon", layers: [{ type: "headline" as const, font_family: "Righteous", font_size: 40, font_weight: 400, color: "#00ff88", x: 5, y: 55, max_width: 90, text_shadow: true }, { type: "cta" as const, font_family: "Poppins", font_size: 13, color: "#00ff88", bg_color: "rgba(0,255,136,0.15)", border_radius: 20, padding: 10, x: 5, y: 88 }] },
  { id: "neon-2", name: "Neon Pink", preview: "🌸", cat: "Neon", layers: [{ type: "headline" as const, font_family: "Bebas Neue", font_size: 44, font_weight: 800, color: "#ff00cc", x: 5, y: 55, max_width: 90, text_shadow: true, text_transform: "uppercase" as const, letter_spacing: 2 }, { type: "cta" as const, font_family: "Inter", font_size: 12, color: "#ff00cc", bg_color: "rgba(255,0,204,0.12)", border_radius: 20, padding: 10, x: 5, y: 88 }] },
  { id: "neon-3", name: "Neon Blue", preview: "💎", cat: "Neon", layers: [{ type: "headline" as const, font_family: "Righteous", font_size: 38, font_weight: 400, color: "#00ccff", x: 5, y: 52, max_width: 90, text_shadow: true }, { type: "description" as const, font_family: "Space Grotesk", font_size: 12, color: "#00ccffaa", x: 5, y: 73, max_width: 72 }] },
  { id: "neon-4", name: "Cyberpunk", preview: "🤖", cat: "Neon", layers: [{ type: "badge" as const, font_family: "Bebas Neue", font_size: 10, color: "#00ff88", bg_color: "rgba(0,0,0,0.7)", border_radius: 2, padding: 8, x: 5, y: 5, letter_spacing: 3, text_transform: "uppercase" as const }, { type: "headline" as const, font_family: "Bebas Neue", font_size: 42, font_weight: 800, color: "#00ff88", x: 5, y: 55, max_width: 90, text_transform: "uppercase" as const, letter_spacing: 3, text_shadow: true }, { type: "cta" as const, font_family: "Bebas Neue", font_size: 13, color: "#000", bg_color: "#00ff88", border_radius: 4, padding: 10, x: 5, y: 88, letter_spacing: 2, text_transform: "uppercase" as const }] },
  { id: "neon-5", name: "Gradient Neon", preview: "🌈", cat: "Neon", layers: [{ type: "headline" as const, font_family: "Kanit", font_size: 44, font_weight: 800, color: "#ff6ec7", x: 5, y: 55, max_width: 90, text_shadow: true, text_transform: "uppercase" as const }] },

  // ⚡ SPORT/ACTION COLLECTION
  { id: "sport-1", name: "Spor", preview: "⚡", cat: "Spor", layers: [{ type: "headline" as const, font_family: "Kanit", font_size: 42, font_weight: 800, color: "#ffffff", text_transform: "uppercase" as const, x: 5, y: 60, max_width: 90, font_style: "italic" as const, text_shadow: true }, { type: "cta" as const, font_family: "Kanit", font_size: 13, color: "#000", bg_color: "#FFD93D", border_radius: 4, padding: 10, x: 5, y: 88, font_weight: 700, text_transform: "uppercase" as const }] },
  { id: "sport-2", name: "Athletic", preview: "🏃", cat: "Spor", layers: [{ type: "headline" as const, font_family: "Oswald", font_size: 46, font_weight: 700, color: "#ffffff", text_transform: "uppercase" as const, x: 5, y: 55, max_width: 90, letter_spacing: -1, text_shadow: true }, { type: "description" as const, font_family: "Barlow", font_size: 13, color: "#FF4500", x: 5, y: 78, max_width: 65, font_weight: 600, text_transform: "uppercase" as const, letter_spacing: 2 }] },
  { id: "sport-3", name: "Champion", preview: "🏆", cat: "Spor", layers: [{ type: "badge" as const, font_family: "Barlow", font_size: 10, color: "#000", bg_color: "#FFD93D", border_radius: 0, padding: 8, x: 5, y: 5, font_weight: 800, text_transform: "uppercase" as const, letter_spacing: 2 }, { type: "headline" as const, font_family: "Barlow", font_size: 44, font_weight: 900, color: "#ffffff", x: 5, y: 50, max_width: 90, font_style: "italic" as const, text_transform: "uppercase" as const, text_shadow: true }] },
  { id: "sport-4", name: "Energy", preview: "🔋", cat: "Spor", layers: [{ type: "headline" as const, font_family: "Archivo Black", font_size: 40, font_weight: 900, color: "#FF4500", text_transform: "uppercase" as const, x: 5, y: 55, max_width: 90, text_shadow: true }, { type: "cta" as const, font_family: "Archivo Black", font_size: 12, color: "#fff", bg_color: "#FF4500", border_radius: 4, padding: 10, x: 5, y: 88, text_transform: "uppercase" as const }] },
  { id: "sport-5", name: "Race", preview: "🏁", cat: "Spor", layers: [{ type: "headline" as const, font_family: "Bebas Neue", font_size: 52, font_weight: 800, color: "#ffffff", x: 5, y: 50, max_width: 90, text_shadow: true, letter_spacing: 4, text_transform: "uppercase" as const }, { type: "description" as const, font_family: "Barlow", font_size: 11, color: "#ffffff88", x: 5, y: 80, max_width: 70, letter_spacing: 3, text_transform: "uppercase" as const }] },

  // 🎭 POP / LIFESTYLE COLLECTION
  { id: "pop-1", name: "Pop Art", preview: "🎨", cat: "Lifestyle", layers: [{ type: "headline" as const, font_family: "Abril Fatface", font_size: 36, font_weight: 400, color: "#FFD93D", x: 5, y: 55, max_width: 90, text_shadow: true }, { type: "description" as const, font_family: "Poppins", font_size: 13, color: "#ffffff", x: 5, y: 78, max_width: 70 }] },
  { id: "pop-2", name: "Fun", preview: "🎪", cat: "Lifestyle", layers: [{ type: "headline" as const, font_family: "Fredoka One", font_size: 40, font_weight: 400, color: "#ffffff", x: 5, y: 55, max_width: 90, text_shadow: true }, { type: "cta" as const, font_family: "Fredoka One", font_size: 14, color: "#fff", bg_color: "linear-gradient(135deg,#f093fb,#f5576c)", border_radius: 24, padding: 10, x: 5, y: 85 }] },
  { id: "pop-3", name: "Vintage", preview: "📷", cat: "Lifestyle", layers: [{ type: "badge" as const, font_family: "Bebas Neue", font_size: 10, color: "#d4af37", bg_color: "rgba(0,0,0,0.5)", border_radius: 2, padding: 8, x: 5, y: 5, letter_spacing: 3, text_transform: "uppercase" as const }, { type: "headline" as const, font_family: "Lobster", font_size: 36, font_weight: 400, color: "#d4af37", x: 8, y: 60, max_width: 80, text_shadow: true }] },
  { id: "pop-4", name: "Handwritten", preview: "✍️", cat: "Lifestyle", layers: [{ type: "headline" as const, font_family: "Dancing Script", font_size: 42, font_weight: 700, color: "#ffffff", x: 8, y: 55, max_width: 85, text_shadow: true }, { type: "description" as const, font_family: "Inter", font_size: 12, color: "#ffffffaa", x: 8, y: 80, max_width: 65 }] },
  { id: "pop-5", name: "Comic", preview: "💬", cat: "Lifestyle", layers: [{ type: "headline" as const, font_family: "Fredoka One", font_size: 36, font_weight: 400, color: "#ffffff", x: 5, y: 48, max_width: 90, text_shadow: true }, { type: "badge" as const, font_family: "Fredoka One", font_size: 11, color: "#fff", bg_color: "rgba(241,75,42,0.9)", border_radius: 20, padding: 8, x: 5, y: 5 }, { type: "cta" as const, font_family: "Fredoka One", font_size: 14, color: "#000", bg_color: "#FFD93D", border_radius: 24, padding: 10, x: 5, y: 85 }] },

  // 🏢 CORPORATE / PROFESSIONAL COLLECTION
  { id: "corp-1", name: "Corporate", preview: "💼", cat: "Kurumsal", layers: [{ type: "headline" as const, font_family: "Montserrat", font_size: 28, font_weight: 700, color: "#ffffff", x: 8, y: 60, max_width: 80, text_shadow: true }, { type: "description" as const, font_family: "Montserrat", font_size: 12, color: "#ffffffcc", x: 8, y: 78, max_width: 68 }, { type: "badge" as const, font_family: "Montserrat", font_size: 9, color: "#fff", bg_color: "rgba(59,130,246,0.9)", border_radius: 4, padding: 8, x: 8, y: 5, font_weight: 600, letter_spacing: 2, text_transform: "uppercase" as const }] },
  { id: "corp-2", name: "Trust", preview: "🤝", cat: "Kurumsal", layers: [{ type: "headline" as const, font_family: "IBM Plex Sans", font_size: 26, font_weight: 700, color: "#ffffff", x: 8, y: 58, max_width: 85, text_shadow: true }, { type: "description" as const, font_family: "IBM Plex Sans", font_size: 12, color: "#ffffffdd", x: 8, y: 77, max_width: 75 }, { type: "cta" as const, font_family: "IBM Plex Sans", font_size: 12, color: "#fff", bg_color: "rgba(37,99,235,0.9)", border_radius: 6, padding: 10, x: 8, y: 90, font_weight: 600 }] },
  { id: "corp-3", name: "Professional", preview: "📊", cat: "Kurumsal", layers: [{ type: "badge" as const, font_family: "Roboto", font_size: 9, color: "#fff", bg_color: "rgba(15,23,42,0.85)", border_radius: 4, padding: 8, x: 8, y: 5, letter_spacing: 2, text_transform: "uppercase" as const }, { type: "headline" as const, font_family: "Roboto", font_size: 28, font_weight: 700, color: "#ffffff", x: 8, y: 60, max_width: 82, text_shadow: true }] },
  { id: "corp-4", name: "Brand Focus", preview: "🔵", cat: "Kurumsal", layers: [{ type: "headline" as const, font_family: "Work Sans", font_size: 30, font_weight: 800, color: "#ffffff", x: 8, y: 55, max_width: 85, text_shadow: true }, { type: "description" as const, font_family: "Work Sans", font_size: 12, color: "#ffffffbb", x: 8, y: 74, max_width: 70 }, { type: "cta" as const, font_family: "Work Sans", font_size: 12, color: "#1d4ed8", bg_color: "#ffffff", border_radius: 6, padding: 10, x: 8, y: 88, font_weight: 700 }] },
  { id: "corp-5", name: "Premium B2B", preview: "🏛️", cat: "Kurumsal", layers: [{ type: "headline" as const, font_family: "Karla", font_size: 26, font_weight: 700, color: "#ffffff", x: 8, y: 55, max_width: 80, letter_spacing: 1 }, { type: "description" as const, font_family: "Karla", font_size: 12, color: "#ffffffcc", x: 8, y: 72, max_width: 72 }, { type: "badge" as const, font_family: "Karla", font_size: 9, color: "#d4af37", bg_color: "rgba(0,0,0,0.4)", border_radius: 3, padding: 8, x: 8, y: 88, letter_spacing: 2, text_transform: "uppercase" as const }] },

  // 🛍️ E-COMMERCE SPECIAL
  { id: "ecom-1", name: "Ürün Lansman", preview: "🛍️", cat: "E-ticaret", layers: [{ type: "badge" as const, font_family: "Poppins", font_size: 10, color: "#fff", bg_color: "linear-gradient(135deg,#F14B2A,#ff8c42)", border_radius: 20, padding: 8, x: 5, y: 5, font_weight: 700 }, { type: "headline" as const, font_family: "Poppins", font_size: 30, font_weight: 800, color: "#ffffff", x: 5, y: 48, max_width: 88, text_shadow: true }, { type: "description" as const, font_family: "Poppins", font_size: 13, color: "#ffffffcc", x: 5, y: 72, max_width: 78 }, { type: "cta" as const, font_family: "Poppins", font_size: 13, color: "#fff", bg_color: "linear-gradient(135deg,#F14B2A,#ff8c42)", border_radius: 24, padding: 10, x: 5, y: 88, font_weight: 600 }] },
  { id: "ecom-2", name: "Sepete Ekle", preview: "🛒", cat: "E-ticaret", layers: [{ type: "headline" as const, font_family: "Nunito", font_size: 28, font_weight: 800, color: "#ffffff", x: 5, y: 55, max_width: 88, text_shadow: true }, { type: "cta" as const, font_family: "Nunito", font_size: 13, color: "#fff", bg_color: "rgba(22,163,74,0.9)", border_radius: 24, padding: 10, x: 5, y: 82, font_weight: 700 }] },
  { id: "ecom-3", name: "Fiyat", preview: "💰", cat: "E-ticaret", layers: [{ type: "headline" as const, font_family: "Bebas Neue", font_size: 60, font_weight: 900, color: "#FFD93D", x: 5, y: 45, max_width: 90, text_shadow: true }, { type: "description" as const, font_family: "Inter", font_size: 13, color: "#ffffff", x: 5, y: 73, max_width: 75 }, { type: "cta" as const, font_family: "Inter", font_size: 13, color: "#000", bg_color: "#FFD93D", border_radius: 24, padding: 10, x: 5, y: 88, font_weight: 700 }] },
  { id: "ecom-4", name: "Bestseller", preview: "🥇", cat: "E-ticaret", layers: [{ type: "badge" as const, font_family: "Montserrat", font_size: 10, color: "#000", bg_color: "#FFD93D", border_radius: 4, padding: 8, x: 5, y: 5, font_weight: 800, text_transform: "uppercase" as const }, { type: "headline" as const, font_family: "Montserrat", font_size: 28, font_weight: 700, color: "#ffffff", x: 5, y: 55, max_width: 88, text_shadow: true }, { type: "cta" as const, font_family: "Montserrat", font_size: 12, color: "#fff", bg_color: "rgba(241,75,42,0.9)", border_radius: 24, padding: 10, x: 5, y: 88, font_weight: 600 }] },
  { id: "ecom-5", name: "Ücretsiz Kargo", preview: "🚚", cat: "E-ticaret", layers: [{ type: "badge" as const, font_family: "Inter", font_size: 10, color: "#fff", bg_color: "rgba(22,163,74,0.9)", border_radius: 4, padding: 8, x: 5, y: 5, font_weight: 700, text_transform: "uppercase" as const, letter_spacing: 1 }, { type: "headline" as const, font_family: "Inter", font_size: 28, font_weight: 800, color: "#ffffff", x: 5, y: 55, max_width: 88, text_shadow: true }, { type: "cta" as const, font_family: "Inter", font_size: 12, color: "#fff", bg_color: "rgba(22,163,74,0.9)", border_radius: 24, padding: 10, x: 5, y: 88, font_weight: 600 }] },
  { id: "ecom-6", name: "Tükeniyor", preview: "⏳", cat: "E-ticaret", layers: [{ type: "badge" as const, font_family: "Poppins", font_size: 10, color: "#fff", bg_color: "rgba(239,68,68,0.95)", border_radius: 4, padding: 8, x: 5, y: 5, font_weight: 700, text_transform: "uppercase" as const }, { type: "headline" as const, font_family: "Poppins", font_size: 26, font_weight: 800, color: "#ffffff", x: 5, y: 48, max_width: 88, text_shadow: true }, { type: "description" as const, font_family: "Poppins", font_size: 13, color: "#ffffffcc", x: 5, y: 71, max_width: 78 }, { type: "cta" as const, font_family: "Poppins", font_size: 12, color: "#fff", bg_color: "rgba(239,68,68,0.9)", border_radius: 24, padding: 10, x: 5, y: 87, font_weight: 600 }] },
  { id: "ecom-7", name: "Sınırlı Stok", preview: "🔖", cat: "E-ticaret", layers: [{ type: "headline" as const, font_family: "Kanit", font_size: 30, font_weight: 800, color: "#ffffff", x: 5, y: 52, max_width: 88, text_shadow: true, text_transform: "uppercase" as const }, { type: "badge" as const, font_family: "Kanit", font_size: 10, color: "#fff", bg_color: "rgba(124,58,237,0.9)", border_radius: 4, padding: 8, x: 5, y: 5, font_weight: 700, letter_spacing: 1, text_transform: "uppercase" as const }, { type: "cta" as const, font_family: "Kanit", font_size: 13, color: "#fff", bg_color: "rgba(124,58,237,0.9)", border_radius: 24, padding: 10, x: 5, y: 88, font_weight: 700 }] },
];
const FONTS = [
  "Inter","Roboto","Poppins","Montserrat","Lato","Oswald","Raleway","Nunito",
  "Playfair Display","Bebas Neue","DM Sans","Quicksand","Cormorant Garamond",
  "Russo One","Archivo Black","Space Grotesk","Outfit","Kanit","Work Sans",
  "Righteous","Fredoka One","Lobster","Pacifico","Caveat","Dancing Script",
  "Abril Fatface","Merriweather","IBM Plex Sans","Barlow","Karla",
];
const COLOR_FILTERS: Record<string, string> = {
  none: "none",
  sepia: "sepia(1) saturate(0.8) brightness(0.9)",
  cool: "hue-rotate(200deg) saturate(1.2) brightness(1.05)",
  warm: "sepia(0.4) saturate(1.3) brightness(1.05)",
  vintage: "sepia(0.5) contrast(1.1) brightness(0.9) saturate(0.8)",
  dramatic: "contrast(1.4) brightness(0.85) saturate(1.2)",
  fade: "contrast(0.85) brightness(1.1) saturate(0.7)",
  hdr: "contrast(1.3) saturate(1.5) brightness(0.95)",
  noir: "grayscale(1) contrast(1.3) brightness(0.9)",
  duotone: "sepia(1) hue-rotate(280deg) saturate(3)",
};
const STICKER_CATEGORIES = [
  { name: "🔥 Popüler", items: ["🔥","⭐","💎","🚀","✨","💯","🎯","⚡","🌟","💫","🏆","❤️","💪","👑","🌈","🔮","💥","🎪","🎨","🎭"] },
  { name: "😍 İfadeler", items: ["😍","🥰","😎","🤩","🥳","😜","🤑","😏","🤭","😲","🤯","🥺","😤","🤬","🫶","👏","🙌","💋","😻","🫡"] },
  { name: "💚 Doğa", items: ["🌸","🌺","🌻","🍀","🌿","🌴","🌊","🌙","☀️","⛅","🌈","🦋","🐝","🌱","🍃","🌵","🍄","🦁","🐯","🦊"] },
  { name: "🍕 Yemek", items: ["🍕","🍔","🍦","🎂","🍩","🍪","☕","🥤","🍷","🥂","🍫","🍭","🍓","🍒","🥑","🌮","🍜","🥗","🍱","🧁"] },
  { name: "🎁 Alışveriş", items: ["🎁","🛍️","💸","💰","💳","🛒","🏷️","🎀","🎊","🎉","🛠️","📦","🚚","📬","💌","🔑","🏆","🥇","🎯","🎖️"] },
  { name: "📣 Promosyon", items: ["🆕","🔝","🆒","🆓","🉐","📢","📣","‼️","❗","❕","✅","☑️","🔔","📍","📌","🔖","🏷️","💬","🗨️","📝"] },
  { name: "✈️ Lifestyle", items: ["✈️","🏖️","🏝️","🌍","🏠","🎸","🎵","🎬","📸","🏋️","🧘","🏄","🎾","⚽","🏀","🎮","🎲","🃏","🎡","🎢"] },
  { name: "💜 Renkler", items: ["🔴","🟠","🟡","🟢","🔵","🟣","⚫","⚪","🔶","🔷","🔸","🔹","🟥","🟧","🟨","🟩","🟦","🟪","⬛","⬜"] },
  { name: "➡️ Oklar", items: ["➡️","⬅️","⬆️","⬇️","↗️","↘️","↙️","↖️","↕️","↔️","🔄","🔃","▶️","⏩","⏭️","🔜","🔛","🔚","🔝","↩️"] },
  { name: "⭐ Geometri", items: ["⭐","🌟","✨","💫","❄️","🔷","🔹","🔶","🔸","💠","🔘","🔲","🔳","▪️","▫️","◼️","◻️","◾","◽","🔵"] },
];
const STICKERS = STICKER_CATEGORIES.flatMap((c) => c.items);
const GRADIENT_DIRS = [
  { label: "↑ Yukarı", value: "to top" },
  { label: "↓ Aşağı", value: "to bottom" },
  { label: "← Sol", value: "to left" },
  { label: "→ Sağ", value: "to right" },
  { label: "↗ Çapraz", value: "to bottom left" },
  { label: "↖ Çapraz", value: "to bottom right" },
];

const CANVAS_SIZE = 520;
const loadedFonts = new Set<string>();
function loadGoogleFont(f: string) {
  if (loadedFonts.has(f)) return;
  loadedFonts.add(f);
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(f)}:ital,wght@0,400;0,600;0,700;0,800;1,400;1,700&display=swap`;
  document.head.appendChild(l);
}

// ── Sub-components ──
type TemplateDef = typeof DESIGN_TEMPLATES[0];
function TemplatesPanel({ templates, applyTemplate }: { templates: TemplateDef[]; applyTemplate: (t: TemplateDef) => void }) {
  const cats = Array.from(new Set(templates.map((t) => (t as { cat?: string }).cat || "Diğer")));
  const [activeCat, setActiveCat] = useState(cats[0] || "");
  const filtered = templates.filter((t) => ((t as { cat?: string }).cat || "Diğer") === activeCat);
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold">🎭 Şablonlar <span className="rounded-full bg-zinc-100 px-1.5 text-[10px] text-zinc-500">{templates.length}</span></h3>
      {/* Category pills */}
      <div className="flex flex-wrap gap-1">
        {cats.map((c) => (
          <button key={c} type="button" onClick={() => setActiveCat(c)} className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold transition ${activeCat === c ? "border-[#F14B2A] bg-orange-50 text-[#E64A2E]" : "border-zinc-200 text-zinc-500 hover:bg-zinc-50"}`}>
            {c}
          </button>
        ))}
      </div>
      {/* Filtered templates grid */}
      <div className="grid grid-cols-2 gap-2">
        {filtered.map((tpl) => (
          <button key={tpl.id} type="button" onClick={() => applyTemplate(tpl)} className="group rounded-xl border border-zinc-200 p-2.5 text-left transition hover:border-orange-300 hover:bg-orange-50 active:scale-95">
            <span className="block text-2xl">{tpl.preview}</span>
            <p className="mt-1 text-[11px] font-bold text-zinc-700 group-hover:text-[#E64A2E] leading-tight">{tpl.name}</p>
            <p className="text-[9px] text-zinc-400">{tpl.layers.length} katman</p>
          </button>
        ))}
      </div>
      <p className="text-center text-[10px] text-zinc-300">Metinleri seçtikten sonra düzenle</p>
    </div>
  );
}

type StickerCat = { name: string; items: string[] };
function StickerPanel({ categories, addLayer }: { categories: StickerCat[]; addLayer: (type: "sticker", text: string) => void }) {
  const [activeCat, setActiveCat] = useState(0);
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold">⭐ Sticker Ekle <span className="rounded-full bg-zinc-100 px-1.5 text-[10px] text-zinc-500">{categories.reduce((s, c) => s + c.items.length, 0)}</span></h3>
      <p className="text-[10px] text-zinc-400">Tıkla ekle, sürükle taşı, boyutu ayarla.</p>
      {/* Category tabs */}
      <div className="flex flex-wrap gap-1">
        {categories.map((c, i) => (
          <button key={c.name} type="button" onClick={() => setActiveCat(i)} className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold transition ${activeCat === i ? "border-[#F14B2A] bg-orange-50 text-[#E64A2E]" : "border-zinc-200 text-zinc-500 hover:bg-zinc-50"}`}>
            {c.name.split(" ")[0]}
          </button>
        ))}
      </div>
      {/* Emoji grid */}
      <div className="grid grid-cols-5 gap-1">
        {categories[activeCat]?.items.map((s) => (
          <button key={s} type="button" onClick={() => addLayer("sticker", s)} className="flex aspect-square items-center justify-center rounded-xl border border-zinc-200 text-xl transition hover:border-orange-300 hover:bg-orange-50 active:scale-90">
            {s}
          </button>
        ))}
      </div>
      <p className="text-center text-[9px] text-zinc-300">Boyut ve konumu sol panelden ayarlayın</p>
    </div>
  );
}


type Props = {
  imageUrl: string;
  variantId: number;
  variantName: string;
  isAdVariant?: boolean;
  onBack: () => void;
  onSaved?: (newUrl: string) => void;
};

type Tab = "layers" | "templates" | "text" | "effects" | "stickers";

export default function ProductCanvasStudio({ imageUrl, variantId, variantName, isAdVariant = false, onBack, onSaved }: Props) {
  const compositeRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const [bgDataUrl, setBgDataUrl] = useState("");
  const [layers, setLayers] = useState<DesignLayer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [draggingLayerId, setDraggingLayerId] = useState<string | null>(null);
  const [layerDragStart, setLayerDragStart] = useState<{ mouseX: number; mouseY: number; layerX: number; layerY: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState("");
  const [effects, setEffects] = useState<ImageEffects>(DEFAULT_EFFECTS);
  const [activeTab, setActiveTab] = useState<Tab>("layers");
  const selectedLayer = layers.find((l) => l.id === selectedLayerId) || null;

  const setFx = useCallback(<K extends keyof ImageEffects>(key: K, val: ImageEffects[K]) => {
    setEffects((p) => ({ ...p, [key]: val }));
  }, []);

  const updateLayer = useCallback((id: string, u: Partial<DesignLayer>) => {
    setLayers((p) => p.map((l) => l.id === id ? { ...l, ...u } : l));
    if (u.font_family) loadGoogleFont(u.font_family);
  }, []);

  // Load image as data URL
  useEffect(() => {
    if (!imageUrl) return;
    const url = imageUrl.startsWith("/") ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}${imageUrl}` : imageUrl;
    fetch(url).then((r) => r.blob()).then((b) => {
      const reader = new FileReader();
      reader.onload = () => setBgDataUrl(reader.result as string);
      reader.readAsDataURL(b);
    }).catch(() => setBgDataUrl(url));
  }, [imageUrl]);

  // Layer drag
  useEffect(() => {
    if (!draggingLayerId || !layerDragStart) return;
    const hm = (e: MouseEvent) => {
      const r = canvasRef.current?.getBoundingClientRect();
      if (!r) return;
      const newX = Math.max(0, Math.min(95, layerDragStart.layerX + ((e.clientX - layerDragStart.mouseX) / r.width) * 100));
      const newY = Math.max(0, Math.min(95, layerDragStart.layerY + ((e.clientY - layerDragStart.mouseY) / r.height) * 100));
      updateLayer(draggingLayerId, { x: Math.round(newX), y: Math.round(newY) });
    };
    const hu = () => { setDraggingLayerId(null); setLayerDragStart(null); };
    window.addEventListener("mousemove", hm);
    window.addEventListener("mouseup", hu);
    return () => { window.removeEventListener("mousemove", hm); window.removeEventListener("mouseup", hu); };
  }, [draggingLayerId, layerDragStart, updateLayer]);

  const addLayer = useCallback((type: DesignLayer["type"], text?: string) => {
    const id = `${type}_${Date.now()}`;
    const nl: DesignLayer = {
      id, type,
      text: text || (
        type === "cta" ? "Hemen İncele →" :
        type === "badge" ? "YENİ" :
        type === "headline" ? "Başlık" :
        type === "sticker" ? "⭐" :
        type === "button" ? "Alışverişe Başla" :
        "Açıklama"
      ),
      x: 5, y: 50, max_width: type === "sticker" ? 20 : type === "button" ? 55 : 60,
      font_family: type === "headline" ? "Bebas Neue" : type === "button" ? "Poppins" : "Inter",
      font_size: type === "headline" ? 38 : type === "sticker" ? 48 : type === "button" ? 15 : type === "description" ? 14 : 12,
      font_weight: type === "headline" ? 800 : type === "cta" ? 600 : type === "button" ? 700 : 400,
      color: "#ffffff", text_align: type === "button" ? "center" : "left", opacity: 1,
      letter_spacing: type === "badge" ? 2 : 0,
      text_transform: type === "badge" ? "uppercase" : "none",
      text_shadow: type === "headline" || type === "description",
      rotation: 0,
      ...(type === "badge" ? { bg_color: "rgba(0,0,0,0.45)", border_radius: 20, padding: 8, font_size: 11 } : {}),
      ...(type === "cta" ? { bg_color: "rgba(241,75,42,0.9)", border_radius: 24, padding: 10, font_size: 13 } : {}),
      ...(type === "button" ? { bg_color: "linear-gradient(135deg,#F14B2A,#ff8c42)", border_radius: 12, padding: 14, font_size: 15, font_weight: 700, text_align: "center" as const } : {}),
    };
    loadGoogleFont(nl.font_family);
    setLayers((p) => [...p, nl]);
    setSelectedLayerId(id);
    setActiveTab("layers");
  }, []);

  const removeLayer = useCallback((id: string) => {
    setLayers((p) => p.filter((l) => l.id !== id));
    setSelectedLayerId((p) => (p === id ? null : p));
  }, []);

  const applyTemplate = useCallback((tpl: typeof DESIGN_TEMPLATES[0]) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newLayers: DesignLayer[] = tpl.layers.map((tl: any, i: number) => ({
      id: `${tl.type}_${Date.now()}_${i}`,
      type: tl.type, text: tl.type === "cta" ? "Hemen İncele →" : tl.type === "badge" ? "YENİ" : tl.type === "headline" ? "Başlığınız" : "Açıklamanız",
      x: tl.x ?? 5, y: tl.y ?? 50, max_width: tl.max_width ?? 80,
      font_family: tl.font_family || "Inter", font_size: tl.font_size ?? 28, font_weight: tl.font_weight ?? 700,
      color: tl.color || "#ffffff", text_align: tl.text_align || "left",
      bg_color: tl.bg_color, border_radius: tl.border_radius, padding: tl.padding,
      line_height: tl.line_height, opacity: 1, letter_spacing: tl.letter_spacing,
      text_transform: tl.text_transform, text_shadow: tl.text_shadow, rotation: 0,
      font_style: tl.font_style,
    } as DesignLayer));
    newLayers.forEach((l) => loadGoogleFont(l.font_family));
    setLayers(newLayers);
    setSelectedLayerId(newLayers[0]?.id || null);
    setActiveTab("layers");
  }, []);

  // Build CSS filter string from effects
  const buildCssFilter = () => {
    const parts: string[] = [];
    if (effects.colorFilter !== "none") parts.push(COLOR_FILTERS[effects.colorFilter] || "");
    if (effects.brightness !== 100) parts.push(`brightness(${effects.brightness / 100})`);
    if (effects.contrast !== 100) parts.push(`contrast(${effects.contrast / 100})`);
    if (effects.saturation !== 100) parts.push(`saturate(${effects.saturation / 100})`);
    if (effects.hueRotate !== 0) parts.push(`hue-rotate(${effects.hueRotate}deg)`);
    if (effects.blurAmount > 0) parts.push(`blur(${effects.blurAmount}px)`);
    return parts.join(" ") || "none";
  };

  const handleSave = useCallback(async () => {
    if (!compositeRef.current || !bgDataUrl) return;
    setSaving(true); setError(""); setSaveSuccess(false);
    try {
      const dataUrl = await toPng(compositeRef.current, { pixelRatio: 2, quality: 1, skipFonts: true, cacheBust: true });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const fd = new FormData();
      fd.append("canvas", blob, `canvas_${variantId}.png`);
      const up = await api.post("/api/protected/upload-canvas", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const newUrl: string = up.data.url;
      const endpoint = isAdVariant
        ? `/api/protected/product-image-studio/ad-variants/${variantId}/update-preview`
        : `/api/protected/product-image-studio/variants/${variantId}/update-preview`;
      await api.patch(endpoint, { preview_url: newUrl }).catch(() => {/* silent */});
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      onSaved?.(newUrl);
    } catch { setError("Kaydetme hatası"); } finally { setSaving(false); }
  }, [bgDataUrl, variantId, isAdVariant, onSaved]);

  // ── Slider helper ──
  const Slider = ({ label, value, min, max, step = 1, onChange, unit = "" }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; unit?: string }) => (
    <div>
      <div className="mb-1 flex justify-between">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{label}</label>
        <span className="text-[10px] text-zinc-400">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="h-2 w-full cursor-pointer rounded-full bg-zinc-200 accent-[#F14B2A]" />
    </div>
  );

  const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-zinc-700">{label}</span>
      <label className="relative inline-flex cursor-pointer items-center">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <div className="h-5 w-9 rounded-full bg-zinc-200 transition peer-checked:bg-[#F14B2A] after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full" />
      </label>
    </div>
  );

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      {/* TOP BAR */}
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 py-2">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack} className="flex h-8 w-8 items-center justify-center rounded-lg text-sm text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-800">←</button>
          <div className="h-4 w-px bg-zinc-200" />
          <div>
            <h1 className="text-sm font-bold text-zinc-900">🎨 Canvas Stüdyosu</h1>
            <p className="truncate text-[10px] text-zinc-400 max-w-[220px]">{variantName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {error && <span className="text-[11px] text-red-500">⚠️ {error}</span>}
          <button type="button" onClick={() => { setLayers([]); setEffects(DEFAULT_EFFECTS); }} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-500 transition hover:bg-zinc-50">↺ Sıfırla</button>
          <button type="button" onClick={handleSave} disabled={saving || !bgDataUrl} className={`rounded-lg px-4 py-1.5 text-xs font-bold text-white transition disabled:opacity-50 ${saveSuccess ? "bg-emerald-600" : "bg-[#F14B2A] hover:bg-[#D93E1F]"}`}>
            {saving ? "Kaydediliyor…" : saveSuccess ? "✓ Kaydedildi" : "💾 Kaydet"}
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div className="flex min-h-0 flex-1 overflow-hidden">

        {/* LEFT ICON TABS */}
        <div className="flex w-14 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50 py-2">
          {([
            ["layers", "📑", "Katman"],
            ["templates", "🎭", "Şablon"],
            ["text", "T", "Metin"],
            ["stickers", "⭐", "Sticker"],
            ["effects", "🌗", "Efektler"],
          ] as [Tab, string, string][]).map(([id, icon, label]) => (
            <button key={id} type="button" onClick={() => setActiveTab(id)}
              className={`mx-1 mb-0.5 flex flex-col items-center gap-0.5 rounded-lg px-1 py-2.5 transition-all ${activeTab === id ? "border border-zinc-200 bg-white text-[#E64A2E] shadow-sm" : "border border-transparent text-zinc-500 hover:bg-white/60"}`}>
              <span className="text-base">{icon}</span>
              <span className="mt-0.5 text-[9px] font-medium">{label}</span>
            </button>
          ))}
        </div>

        {/* LEFT PANEL CONTENT */}
        <div className="w-[230px] shrink-0 overflow-y-auto border-r border-zinc-200 bg-white" style={{ maxHeight: "calc(100vh - 100px)" }}>
          <div className="space-y-4 p-3">

            {/* ── LAYERS TAB ── */}
            {activeTab === "layers" && (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold">📑 Katmanlar <span className="rounded-full bg-zinc-100 px-1.5 text-[10px] text-zinc-500">{layers.length}</span></h3>
                  <div className="relative group">
                    <button type="button" className="rounded-lg border border-zinc-200 px-2 py-0.5 text-[10px] font-bold text-zinc-500 hover:bg-zinc-50">+ Ekle ▾</button>
                    <div className="absolute right-0 top-full z-40 mt-1 hidden w-40 rounded-xl border bg-white p-1.5 shadow-xl group-hover:block">
                      {(["headline", "description", "badge", "cta", "button"] as const).map((t) => (
                        <button key={t} type="button" onClick={() => addLayer(t)} className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs hover:bg-zinc-50">
                          <span className={`h-2 w-2 rounded-full ${LAYER_TYPE_COLORS[t]}`} />{LAYER_TYPE_LABELS[t]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {layers.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-zinc-200 p-4 text-center">
                    <p className="text-[11px] text-zinc-400">Henüz katman yok</p>
                    <p className="text-[10px] text-zinc-300 mt-0.5">Şablondan başlayın</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {layers.map((layer) => (
                      <div key={layer.id} role="button" tabIndex={0} onClick={() => setSelectedLayerId(layer.id)}
                        className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2 py-1.5 transition ${selectedLayerId === layer.id ? "border-indigo-200 bg-indigo-50" : "border-transparent hover:bg-zinc-50"}`}>
                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${LAYER_TYPE_COLORS[layer.type]}`} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium">{layer.text.length > 18 ? layer.text.slice(0, 18) + "…" : layer.text}</p>
                          <p className="text-[10px] text-zinc-400">{layer.font_family} · {layer.font_size}px</p>
                        </div>
                        <button type="button" onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }} className="shrink-0 text-[10px] text-zinc-300 hover:text-red-500">✕</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Selected layer properties */}
                {selectedLayer && (
                  <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                      <span className={`h-2 w-2 rounded-full ${LAYER_TYPE_COLORS[selectedLayer.type]}`} />{LAYER_TYPE_LABELS[selectedLayer.type]}
                    </p>

                    {/* Text */}
                    <textarea value={selectedLayer.text} onChange={(e) => updateLayer(selectedLayer.id, { text: e.target.value })} rows={2} className="w-full resize-none rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-[#E64A2E]" />

                    {/* Font */}
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase text-zinc-400">Font</label>
                      <select value={selectedLayer.font_family} onChange={(e) => { updateLayer(selectedLayer.id, { font_family: e.target.value }); loadGoogleFont(e.target.value); }} className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs outline-none">
                        {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>

                    {/* Size + Bold + Italic */}
                    <div className="grid grid-cols-3 gap-1.5">
                      <div>
                        <label className="mb-0.5 block text-[10px] text-zinc-400">{selectedLayer.font_size}px</label>
                        <input type="range" min={8} max={80} value={selectedLayer.font_size} onChange={(e) => updateLayer(selectedLayer.id, { font_size: Number(e.target.value) })} className="h-2 w-full cursor-pointer rounded-full bg-zinc-200 accent-[#F14B2A]" />
                      </div>
                      <button type="button" onClick={() => updateLayer(selectedLayer.id, { font_weight: selectedLayer.font_weight >= 700 ? 400 : 700 })} className={`rounded-lg border py-1 text-xs font-bold transition ${selectedLayer.font_weight >= 700 ? "border-[#F14B2A] bg-orange-50 text-[#F14B2A]" : "border-zinc-200 text-zinc-500"}`}>B</button>
                      <button type="button" onClick={() => updateLayer(selectedLayer.id, { font_style: selectedLayer.font_style === "italic" ? "normal" : "italic" })} className={`rounded-lg border py-1 text-xs italic transition ${selectedLayer.font_style === "italic" ? "border-[#F14B2A] bg-orange-50 text-[#F14B2A]" : "border-zinc-200 text-zinc-500"}`}>I</button>
                    </div>

                    {/* Text Align */}
                    <div className="flex gap-1">
                      {(["left", "center", "right"] as const).map((a) => (
                        <button key={a} type="button" onClick={() => updateLayer(selectedLayer.id, { text_align: a })} className={`flex-1 rounded-lg border py-1 text-xs transition ${selectedLayer.text_align === a ? "border-[#F14B2A] bg-orange-50 text-[#F14B2A]" : "border-zinc-200 text-zinc-500"}`}>
                          {a === "left" ? "◀" : a === "center" ? "◆" : "▶"}
                        </button>
                      ))}
                    </div>

                    {/* Letter spacing + Line height */}
                    <Slider label="Harf Aralığı" value={selectedLayer.letter_spacing ?? 0} min={-2} max={12} step={0.5} unit="px" onChange={(v) => updateLayer(selectedLayer.id, { letter_spacing: v })} />
                    <Slider label="Satır Yüksekliği" value={Math.round((selectedLayer.line_height ?? 1.3) * 10) / 10} min={0.8} max={2.5} step={0.1} onChange={(v) => updateLayer(selectedLayer.id, { line_height: v })} />

                    {/* Color */}
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase text-zinc-400">Metin Rengi</label>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <input type="color" value={selectedLayer.color.startsWith("#") ? selectedLayer.color.slice(0, 7) : "#ffffff"} onChange={(e) => updateLayer(selectedLayer.id, { color: e.target.value })} className="h-7 w-7 cursor-pointer rounded-lg border border-zinc-200" />
                        {["#ffffff", "#000000", "#F14B2A", "#FFD93D", "#22c55e", "#3b82f6", "#d4af37"].map((c) => (
                          <button key={c} type="button" onClick={() => updateLayer(selectedLayer.id, { color: c })} className={`h-5 w-5 rounded-md border-2 transition hover:scale-110 ${selectedLayer.color === c ? "border-[#F14B2A]" : "border-zinc-200"}`} style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    </div>

                    {/* Text Transform */}
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase text-zinc-400">Büyük Harf</label>
                      <div className="flex gap-1">
                        {([["uppercase", "AA"], ["capitalize", "Aa"], ["none", "ab"]] as const).map(([v, l]) => (
                          <button key={v} type="button" onClick={() => updateLayer(selectedLayer.id, { text_transform: v })} className={`flex-1 rounded-lg border py-1 text-xs transition ${(selectedLayer.text_transform || "none") === v ? "border-[#F14B2A] bg-orange-50 text-[#F14B2A]" : "border-zinc-200 text-zinc-500"}`}>{l}</button>
                        ))}
                      </div>
                    </div>

                    {/* Text Shadow / Glow */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <button type="button" onClick={() => updateLayer(selectedLayer.id, { text_shadow: !selectedLayer.text_shadow })} className={`rounded-lg border py-1.5 text-[10px] font-medium transition ${selectedLayer.text_shadow ? "border-[#F14B2A] bg-orange-50 text-[#F14B2A]" : "border-zinc-200 text-zinc-500"}`}>
                        {selectedLayer.text_shadow ? "Gölge ✓" : "Gölge Ekle"}
                      </button>
                      <div>
                        <label className="mb-0.5 block text-[9px] text-zinc-400">Opaklık: {Math.round((selectedLayer.opacity ?? 1) * 100)}%</label>
                        <input type="range" min={10} max={100} value={Math.round((selectedLayer.opacity ?? 1) * 100)} onChange={(e) => updateLayer(selectedLayer.id, { opacity: Number(e.target.value) / 100 })} className="h-2 w-full cursor-pointer rounded-full bg-zinc-200 accent-[#F14B2A]" />
                      </div>
                    </div>

                    {/* Stroke */}
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase text-zinc-400">Metin Çerçevesi (Stroke)</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={selectedLayer.stroke_color || "#000000"} onChange={(e) => updateLayer(selectedLayer.id, { stroke_color: e.target.value })} className="h-6 w-6 cursor-pointer rounded border border-zinc-200" />
                        <input type="range" min={0} max={8} step={0.5} value={selectedLayer.stroke_width ?? 0} onChange={(e) => updateLayer(selectedLayer.id, { stroke_width: Number(e.target.value) })} className="flex-1 h-2 cursor-pointer rounded-full bg-zinc-200 accent-[#F14B2A]" />
                        <span className="text-[10px] text-zinc-400 w-5">{selectedLayer.stroke_width ?? 0}</span>
                      </div>
                    </div>

                    {/* Rotation */}
                    <Slider label="Döndürme" value={selectedLayer.rotation ?? 0} min={-180} max={180} step={1} unit="°" onChange={(v) => updateLayer(selectedLayer.id, { rotation: v })} />

                    {/* Position */}
                    <div className="grid grid-cols-2 gap-2">
                      <Slider label={`X: ${selectedLayer.x}%`} value={selectedLayer.x} min={0} max={90} onChange={(v) => updateLayer(selectedLayer.id, { x: v })} />
                      <Slider label={`Y: ${selectedLayer.y}%`} value={selectedLayer.y} min={0} max={95} onChange={(v) => updateLayer(selectedLayer.id, { y: v })} />
                    </div>
                    <Slider label={`Genişlik: ${selectedLayer.max_width}%`} value={selectedLayer.max_width} min={10} max={95} onChange={(v) => updateLayer(selectedLayer.id, { max_width: v })} />

                    {/* CTA specific */}
                    {(selectedLayer.type === "cta" || selectedLayer.type === "badge") && (
                      <>
                        <div>
                          <label className="mb-1 block text-[10px] font-bold uppercase text-zinc-400">Arka Plan Rengi</label>
                          <div className="flex flex-wrap gap-1">
                            {CTA_STYLES.map((s) => (
                              <button key={s.id} type="button" onClick={() => updateLayer(selectedLayer.id, { bg_color: s.bg_color, border_radius: s.border_radius, padding: s.padding, color: s.color })} className="rounded-lg border border-zinc-200 px-2 py-1 text-[9px] font-medium text-zinc-600 hover:border-orange-300 transition">
                                {s.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <Slider label={`Köşe Yuvarlama: ${selectedLayer.border_radius ?? 0}px`} value={selectedLayer.border_radius ?? 0} min={0} max={40} onChange={(v) => updateLayer(selectedLayer.id, { border_radius: v })} />
                        <Slider label={`İç Boşluk: ${selectedLayer.padding ?? 0}px`} value={selectedLayer.padding ?? 0} min={0} max={24} onChange={(v) => updateLayer(selectedLayer.id, { padding: v })} />
                      </>
                    )}

                    {/* Actions */}
                    <div className="flex gap-1 pt-1">
                      <button type="button" onClick={() => { const d = { ...selectedLayer, id: `${selectedLayer.type}_${Date.now()}`, x: selectedLayer.x + 3, y: selectedLayer.y + 3 }; setLayers((p) => [...p, d]); setSelectedLayerId(d.id); }} className="flex-1 rounded-lg border border-zinc-200 py-1.5 text-[10px] font-medium text-zinc-600 hover:bg-zinc-50">📋 Kopyala</button>
                      <button type="button" onClick={() => setLayers((p) => { const i = p.findIndex((l) => l.id === selectedLayer.id); if (i <= 0) return p; const a = [...p]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; return a; })} className="rounded-lg border border-zinc-200 px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-50">↑</button>
                      <button type="button" onClick={() => setLayers((p) => { const i = p.findIndex((l) => l.id === selectedLayer.id); if (i >= p.length - 1) return p; const a = [...p]; [a[i], a[i + 1]] = [a[i + 1], a[i]]; return a; })} className="rounded-lg border border-zinc-200 px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-50">↓</button>
                      <button type="button" onClick={() => removeLayer(selectedLayer.id)} className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-bold text-red-500 hover:bg-red-100">SİL</button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── TEMPLATES TAB ── */}
            {activeTab === "templates" && (
              <TemplatesPanel templates={DESIGN_TEMPLATES} applyTemplate={applyTemplate} />
            )}

            {/* ── TEXT TAB ── */}
            {activeTab === "text" && (
              <>
                <h3 className="text-sm font-bold">T Metin Ekle</h3>
                <div className="space-y-1.5">
                  {(["headline", "description", "badge", "cta", "button"] as const).map((t) => (
                    <button key={t} type="button" onClick={() => addLayer(t)} className="flex w-full items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2.5 text-left text-xs font-semibold text-zinc-700 transition hover:border-orange-300 hover:bg-orange-50">
                      <span className={`h-2.5 w-2.5 rounded-full ${LAYER_TYPE_COLORS[t]}`} />{LAYER_TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* ── STICKERS TAB ── */}
            {activeTab === "stickers" && (
              <StickerPanel categories={STICKER_CATEGORIES} addLayer={addLayer} />
            )}

            {/* ── EFFECTS TAB ── */}
            {activeTab === "effects" && (
              <div className="space-y-5">
                <h3 className="text-sm font-bold">🌗 Görsel Efektleri</h3>

                {/* Color Filter */}
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-zinc-400">🎨 Renk Filtresi</label>
                  <div className="grid grid-cols-3 gap-1">
                    {(["none", "warm", "cool", "sepia", "vintage", "dramatic", "fade", "hdr", "noir", "duotone"] as const).map((f) => (
                      <button key={f} type="button" onClick={() => setFx("colorFilter", f)} className={`rounded-lg border py-1.5 text-[10px] font-semibold capitalize transition ${effects.colorFilter === f ? "border-[#F14B2A] bg-orange-50 text-[#E64A2E]" : "border-zinc-200 text-zinc-500 hover:bg-zinc-50"}`}>
                        {f === "none" ? "Normal" : f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Brightness / Contrast / Saturation */}
                <div className="space-y-3 border-t border-zinc-100 pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">⚙️ Ton Ayarları</p>
                  <Slider label="Parlaklık" value={effects.brightness} min={50} max={200} unit="%" onChange={(v) => setFx("brightness", v)} />
                  <Slider label="Kontrast" value={effects.contrast} min={50} max={200} unit="%" onChange={(v) => setFx("contrast", v)} />
                  <Slider label="Doygunluk" value={effects.saturation} min={0} max={300} unit="%" onChange={(v) => setFx("saturation", v)} />
                  <Slider label="Renk Tonu" value={effects.hueRotate} min={0} max={360} unit="°" onChange={(v) => setFx("hueRotate", v)} />
                  <Slider label="Bulanıklık" value={effects.blurAmount} min={0} max={10} step={0.5} unit="px" onChange={(v) => setFx("blurAmount", v)} />
                  <button type="button" onClick={() => { setFx("brightness", 100); setFx("contrast", 100); setFx("saturation", 100); setFx("hueRotate", 0); setFx("blurAmount", 0); setFx("colorFilter", "none"); }} className="w-full rounded-lg border border-zinc-200 py-1.5 text-[10px] font-medium text-zinc-500 hover:bg-zinc-50 transition">↺ Ton Sıfırla</button>
                </div>

                {/* Gradient Overlay */}
                <div className="border-t border-zinc-100 pt-4 space-y-3">
                  <Toggle label="🌇 Gradient Overlay" checked={effects.gradient} onChange={(v) => setFx("gradient", v)} />
                  {effects.gradient && (
                    <>
                      <Slider label="Yoğunluk" value={Math.round(effects.gradientOpacity * 100)} min={0} max={100} unit="%" onChange={(v) => setFx("gradientOpacity", v / 100)} />
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase text-zinc-400">Yön</label>
                        <div className="grid grid-cols-3 gap-1">
                          {GRADIENT_DIRS.map((d) => (
                            <button key={d.value} type="button" onClick={() => setFx("gradientDirection", d.value as ImageEffects["gradientDirection"])} className={`rounded-lg border py-1 text-[10px] transition ${effects.gradientDirection === d.value ? "border-[#F14B2A] bg-orange-50 text-[#E64A2E]" : "border-zinc-200 text-zinc-500"}`}>{d.label}</button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <label className="mb-1 block text-[10px] text-zinc-400">Renk 1</label>
                          <input type="color" value={effects.gradientColor} onChange={(e) => setFx("gradientColor", e.target.value)} className="h-8 w-full cursor-pointer rounded-lg border border-zinc-200" />
                        </div>
                        <div className="flex-1">
                          <label className="mb-1 block text-[10px] text-zinc-400">Renk 2</label>
                          <input type="color" value={effects.gradientColor2 === "transparent" ? "#ffffff" : effects.gradientColor2} onChange={(e) => setFx("gradientColor2", e.target.value)} className="h-8 w-full cursor-pointer rounded-lg border border-zinc-200" />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Vignette */}
                <div className="border-t border-zinc-100 pt-4 space-y-3">
                  <Toggle label="🔲 Vignette (Köşe Karartma)" checked={effects.vignette} onChange={(v) => setFx("vignette", v)} />
                  {effects.vignette && (
                    <>
                      <Slider label="Yoğunluk" value={Math.round(effects.vignetteOpacity * 100)} min={0} max={100} unit="%" onChange={(v) => setFx("vignetteOpacity", v / 100)} />
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] text-zinc-400">Renk</label>
                        <input type="color" value={effects.vignetteColor} onChange={(e) => setFx("vignetteColor", e.target.value)} className="h-7 w-16 cursor-pointer rounded-lg border border-zinc-200" />
                      </div>
                    </>
                  )}
                </div>

                {/* Color Overlay */}
                <div className="border-t border-zinc-100 pt-4 space-y-3">
                  <Toggle label="🎨 Renk Overlay" checked={effects.colorOverlay} onChange={(v) => setFx("colorOverlay", v)} />
                  {effects.colorOverlay && (
                    <>
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] text-zinc-400">Renk</label>
                        <input type="color" value={effects.colorOverlayColor} onChange={(e) => setFx("colorOverlayColor", e.target.value)} className="h-7 w-16 cursor-pointer rounded-lg border border-zinc-200" />
                      </div>
                      <Slider label="Opaklık" value={effects.colorOverlayOpacity} min={1} max={90} unit="%" onChange={(v) => setFx("colorOverlayOpacity", v)} />
                    </>
                  )}
                </div>

                {/* Noise/Grain */}
                <div className="border-t border-zinc-100 pt-4 space-y-3">
                  <Toggle label="📺 Noise / Grain" checked={effects.noise} onChange={(v) => setFx("noise", v)} />
                  {effects.noise && (
                    <Slider label="Yoğunluk" value={effects.noiseOpacity} min={1} max={40} unit="%" onChange={(v) => setFx("noiseOpacity", v)} />
                  )}
                </div>

                {/* Frame / Border */}
                <div className="border-t border-zinc-100 pt-4 space-y-3">
                  <Toggle label="🖼️ Çerçeve (Frame)" checked={effects.frameBorder} onChange={(v) => setFx("frameBorder", v)} />
                  {effects.frameBorder && (
                    <>
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] text-zinc-400">Renk</label>
                        <input type="color" value={effects.frameBorderColor} onChange={(e) => setFx("frameBorderColor", e.target.value)} className="h-7 w-16 cursor-pointer rounded-lg border border-zinc-200" />
                      </div>
                      <Slider label="Kalınlık" value={effects.frameBorderWidth} min={1} max={20} unit="px" onChange={(v) => setFx("frameBorderWidth", v)} />
                      <Slider label="Yuvarlama" value={effects.frameBorderRadius} min={0} max={40} unit="px" onChange={(v) => setFx("frameBorderRadius", v)} />
                    </>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* CENTER CANVAS */}
        <div className="flex flex-1 items-center justify-center overflow-auto bg-[#f4f4f5] p-6">
          <div ref={compositeRef} className="relative" style={{ width: CANVAS_SIZE, height: CANVAS_SIZE, maxWidth: "100%" }}>
            {bgDataUrl ? (
              <div
                ref={canvasRef}
                className="relative overflow-hidden"
                style={{
                  width: "100%", aspectRatio: "1/1",
                  borderRadius: effects.frameBorder ? effects.frameBorderRadius : 16,
                  outline: effects.frameBorder ? `${effects.frameBorderWidth}px solid ${effects.frameBorderColor}` : "none",
                  outlineOffset: "0px",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
                }}
                onClick={() => { setSelectedLayerId(null); setEditingLayerId(null); }}
              >
                {/* Background image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={bgDataUrl} alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  draggable={false}
                  style={{ filter: buildCssFilter() }}
                />

                {/* Color overlay */}
                {effects.colorOverlay && (
                  <div style={{ position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none", backgroundColor: effects.colorOverlayColor, opacity: effects.colorOverlayOpacity / 100 }} />
                )}

                {/* Gradient overlay */}
                {effects.gradient && (
                  <div style={{ position: "absolute", inset: 0, zIndex: 4, pointerEvents: "none", background: `linear-gradient(${effects.gradientDirection}, ${effects.gradientColor}${Math.round(effects.gradientOpacity * 255).toString(16).padStart(2, "0")}, ${effects.gradientColor2 === "transparent" ? "transparent" : effects.gradientColor2 + "00"})` }} />
                )}

                {/* Vignette */}
                {effects.vignette && (
                  <div style={{ position: "absolute", inset: 0, zIndex: 5, pointerEvents: "none", background: `radial-gradient(ellipse at center, transparent 40%, ${effects.vignetteColor}${Math.round(effects.vignetteOpacity * 255).toString(16).padStart(2, "0")} 100%)` }} />
                )}

                {/* Noise overlay (SVG filter trick) */}
                {effects.noise && (
                  <div style={{ position: "absolute", inset: 0, zIndex: 6, pointerEvents: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`, opacity: effects.noiseOpacity / 100 }} />
                )}

                {/* Layers */}
                {layers.map((layer) => {
                  const isSel = layer.id === selectedLayerId;
                  const isEditing = editingLayerId === layer.id;
                  const isDragging = draggingLayerId === layer.id;
                  const textShadowCss = layer.text_shadow && !layer.bg_color ? "0 2px 12px rgba(0,0,0,0.85),0 1px 3px rgba(0,0,0,0.6)" : "none";
                  const strokeCss = (layer.stroke_width && layer.stroke_width > 0 && layer.stroke_color)
                    ? `0 0 0 ${layer.stroke_width}px ${layer.stroke_color}`
                    : undefined;
                  const shadowFull = [textShadowCss !== "none" ? textShadowCss : undefined, strokeCss].filter(Boolean).join(",") || "none";

                  return (
                    <div key={layer.id}
                      onMouseDown={(e) => {
                        if (isEditing) return;
                        e.stopPropagation(); e.preventDefault();
                        setSelectedLayerId(layer.id); setActiveTab("layers");
                        setDraggingLayerId(layer.id);
                        setLayerDragStart({ mouseX: e.clientX, mouseY: e.clientY, layerX: layer.x, layerY: layer.y });
                      }}
                      onDoubleClick={(e) => { e.stopPropagation(); setEditingLayerId(layer.id); setSelectedLayerId(layer.id); setDraggingLayerId(null); }}
                      style={{
                        position: "absolute", left: `${layer.x}%`, top: `${layer.y}%`,
                        maxWidth: `${layer.max_width}%`,
                        zIndex: layer.type === "badge" ? 14 : layer.type === "headline" ? 12 : 11,
                        cursor: isEditing ? "text" : isDragging ? "grabbing" : "grab",
                        outline: isSel ? "2px solid rgba(99,102,241,0.85)" : "2px solid transparent",
                        outlineOffset: 4,
                        borderRadius: layer.border_radius || 0,
                        backgroundColor: layer.bg_color?.startsWith("linear") ? undefined : (layer.bg_color || "transparent"),
                        backgroundImage: layer.bg_color?.startsWith("linear") ? layer.bg_color : undefined,
                        padding: layer.padding || 0,
                        opacity: layer.opacity ?? 1,
                        transform: layer.rotation ? `rotate(${layer.rotation}deg)` : "none",
                        userSelect: isEditing ? "text" : "none",
                      }}
                    >
                      {isEditing ? (
                        <span contentEditable suppressContentEditableWarning autoFocus
                          onBlur={(e) => { updateLayer(layer.id, { text: e.currentTarget.innerText?.trim() || layer.text }); setEditingLayerId(null); }}
                          onKeyDown={(e) => { if (e.key === "Escape") setEditingLayerId(null); }}
                          ref={(el) => { if (el && isEditing) { el.focus(); const range = document.createRange(); range.selectNodeContents(el); const sel = window.getSelection(); sel?.removeAllRanges(); sel?.addRange(range); } }}
                          style={{ display: "block", fontFamily: `'${layer.font_family}',sans-serif`, fontSize: layer.font_size, fontWeight: layer.font_weight, fontStyle: layer.font_style || "normal", color: layer.color, textAlign: layer.text_align, lineHeight: layer.line_height || (layer.type === "headline" ? 1.15 : 1.4), letterSpacing: layer.letter_spacing ? `${layer.letter_spacing}px` : "0", textTransform: (layer.text_transform as React.CSSProperties["textTransform"]) || "none", textShadow: shadowFull, wordBreak: "break-word", outline: "none", minWidth: 40, caretColor: layer.color }}
                        >{layer.text}</span>
                      ) : (
                        <span style={{ display: "block", fontFamily: `'${layer.font_family}',sans-serif`, fontSize: layer.font_size, fontWeight: layer.font_weight, fontStyle: layer.font_style || "normal", color: layer.color, textAlign: layer.text_align, lineHeight: layer.line_height || (layer.type === "headline" ? 1.15 : 1.4), letterSpacing: layer.letter_spacing ? `${layer.letter_spacing}px` : "0", textTransform: (layer.text_transform as React.CSSProperties["textTransform"]) || "none", textShadow: shadowFull, wordBreak: "break-word" }}>
                          {layer.text}
                        </span>
                      )}
                    </div>
                  );
                })}

                {/* Empty state hint — above canvas, not on it */}
                {layers.length === 0 && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap">
                    <div className="rounded-lg bg-zinc-800 px-3 py-1.5 text-[11px] font-medium text-zinc-300 shadow-lg">
                      💡 Sol panelden şablon seçin veya katman ekleyin
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex aspect-square w-full items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 bg-white shadow-inner">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-200 border-t-[#F14B2A]" />
                  <p className="text-xs text-zinc-400">Görsel yükleniyor…</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Tips */}
        <div className="w-[160px] shrink-0 overflow-y-auto border-l border-zinc-200 bg-zinc-50/50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-3">İpuçları</p>
          <div className="space-y-3">
            {[
              { icon: "🖱️", text: "Katmanı sürükle taşı" },
              { icon: "✏️", text: "Çift tık → metin düzenle" },
              { icon: "📑", text: "Sol panel → katman seç" },
              { icon: "🎭", text: "Şablon ile hızlı başla" },
              { icon: "🌗", text: "Efektler ile görsel ayarla" },
              { icon: "⭐", text: "Sticker ile zenginleştir" },
              { icon: "💾", text: "Kaydet → ürün güncellenir" },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-start gap-1.5">
                <span>{icon}</span>
                <p className="text-[10px] leading-[1.4] text-zinc-500">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
