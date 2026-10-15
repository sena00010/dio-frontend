"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import api from "@/lib/api";
import { toPng } from "html-to-image";

// ── Types ──
type PostData = {
  id: number; company_id: number; title: string; content: string; platform: string;
  hashtags: string; image_prompt: string; image_url: string; status: string; format?: string;
  suggested_layout: string; suggested_font: string; content_items: string; design_layers: string;
  logo_position?: string;
};
type LogoPositionData = { x: number; y: number; max_width: number; max_height: number; reasoning?: string };
type CompanyData = { id: number; brand_colors: string; logo_url: string; name: string; sector: string; };
type DesignLayer = {
  id: string; type: "headline" | "description" | "cta" | "badge"; text: string;
  x: number; y: number; max_width: number; font_family: string; font_size: number;
  font_weight: number; color: string; text_align: "left" | "center" | "right";
  bg_color?: string; border_radius?: number; padding?: number; line_height?: number;
  opacity?: number; letter_spacing?: number; text_transform?: "uppercase" | "capitalize" | "none";
  text_shadow?: boolean; rotation?: number; font_style?: "normal" | "italic";
};

// ── Constants ──
const IMAGE_STYLES = [
  { value: "realistic", label: "📷 Gerçekçi Fotoğraf" },
  { value: "illustration", label: "🎨 İllüstrasyon" },
  { value: "3d-render", label: "🧊 3D Render" },
  { value: "minimalist", label: "✨ Minimalist" },
];
const LAYER_TYPE_LABELS: Record<string, string> = { headline: "📰 Başlık", description: "📝 Açıklama", cta: "🔗 CTA", badge: "🏷️ Badge" };
const LAYER_TYPE_COLORS: Record<string, string> = { headline: "bg-blue-500", description: "bg-emerald-500", cta: "bg-amber-500", badge: "bg-violet-500" };
const CTA_STYLES = [
  { id: "pill", label: "💊 Yuvarlak", bg_color: "rgba(233,69,96,0.9)", border_radius: 24, padding: 10, color: "#ffffff" },
  { id: "square", label: "⬜ Kare", bg_color: "rgba(0,0,0,0.8)", border_radius: 4, padding: 10, color: "#ffffff" },
  { id: "outline", label: "⭕ Çerçeve", bg_color: "transparent", border_radius: 24, padding: 8, color: "#ffffff" },
  { id: "gradient", label: "🌈 Gradient", bg_color: "linear-gradient(135deg,#667eea,#764ba2)", border_radius: 20, padding: 10, color: "#ffffff" },
  { id: "ghost", label: "👻 Şeffaf", bg_color: "rgba(255,255,255,0.15)", border_radius: 12, padding: 10, color: "#ffffff" },
  { id: "neon", label: "💡 Neon", bg_color: "rgba(0,255,136,0.15)", border_radius: 20, padding: 10, color: "#00ff88" },
  { id: "dark", label: "🌑 Koyu", bg_color: "rgba(26,26,46,0.9)", border_radius: 8, padding: 10, color: "#ffffff" },
  { id: "minimal", label: "➡ Minimal", bg_color: "transparent", border_radius: 0, padding: 4, color: "#ffffff" },
];

// ── 20+ Design Templates ──
const DESIGN_TEMPLATES: { id: string; name: string; preview: string; layers: Partial<DesignLayer>[] }[] = [
  { id: "bold-modern", name: "Bold Modern", preview: "🔥", layers: [{ type: "headline", font_family: "Bebas Neue", font_size: 44, font_weight: 800, color: "#ffffff", text_transform: "uppercase", letter_spacing: 2, x: 5, y: 60, max_width: 90, text_shadow: true }, { type: "description", font_family: "Inter", font_size: 14, color: "#ffffffcc", x: 5, y: 82, max_width: 70 }] },
  { id: "elegant-serif", name: "Elegant Serif", preview: "✨", layers: [{ type: "headline", font_family: "Playfair Display", font_size: 36, font_weight: 700, color: "#ffffff", x: 8, y: 55, max_width: 80, font_style: "italic", text_shadow: true }, { type: "description", font_family: "Lato", font_size: 13, color: "#ffffffbb", x: 8, y: 78, max_width: 65 }] },
  { id: "minimal-clean", name: "Minimal Clean", preview: "◻️", layers: [{ type: "headline", font_family: "DM Sans", font_size: 28, font_weight: 700, color: "#ffffff", x: 10, y: 70, max_width: 80, letter_spacing: 1 }, { type: "description", font_family: "DM Sans", font_size: 12, color: "#ffffffaa", x: 10, y: 85, max_width: 60 }] },
  { id: "street-urban", name: "Street Urban", preview: "🏙️", layers: [{ type: "headline", font_family: "Archivo Black", font_size: 42, font_weight: 800, color: "#ffffff", text_transform: "uppercase", x: 5, y: 10, max_width: 85, rotation: -2, text_shadow: true }, { type: "badge", font_family: "Oswald", font_size: 11, color: "#000", bg_color: "#ffff00", padding: 8, border_radius: 0, x: 5, y: 4, text_transform: "uppercase", letter_spacing: 3 }] },
  { id: "luxury-gold", name: "Luxury Gold", preview: "👑", layers: [{ type: "headline", font_family: "Cormorant Garamond", font_size: 38, font_weight: 600, color: "#d4af37", x: 10, y: 60, max_width: 80, font_style: "italic", letter_spacing: 2 }, { type: "description", font_family: "Raleway", font_size: 12, color: "#d4af37aa", x: 10, y: 80, max_width: 65, letter_spacing: 3, text_transform: "uppercase" }] },
  { id: "neon-pop", name: "Neon Pop", preview: "💜", layers: [{ type: "headline", font_family: "Righteous", font_size: 40, font_weight: 400, color: "#00ff88", x: 5, y: 55, max_width: 90, text_shadow: true }, { type: "cta", font_family: "Poppins", font_size: 13, color: "#00ff88", bg_color: "rgba(0,255,136,0.15)", border_radius: 20, padding: 10, x: 5, y: 88 }] },
  { id: "magazine", name: "Magazine", preview: "📰", layers: [{ type: "headline", font_family: "Abril Fatface", font_size: 48, font_weight: 400, color: "#ffffff", x: 5, y: 15, max_width: 60, line_height: 1.05, text_shadow: true }, { type: "description", font_family: "Source Sans 3", font_size: 13, color: "#ffffffcc", x: 5, y: 80, max_width: 70 }] },
  { id: "playful", name: "Playful Fun", preview: "🎉", layers: [{ type: "headline", font_family: "Fredoka One", font_size: 38, font_weight: 400, color: "#FFD93D", x: 8, y: 58, max_width: 85, rotation: 2, text_shadow: true }, { type: "description", font_family: "Quicksand", font_size: 14, color: "#ffffff", x: 8, y: 80, max_width: 75 }] },
  { id: "tech-futuristic", name: "Tech Future", preview: "🚀", layers: [{ type: "badge", font_family: "Space Grotesk", font_size: 10, color: "#fff", bg_color: "rgba(99,102,241,0.8)", border_radius: 4, padding: 6, x: 5, y: 5, text_transform: "uppercase", letter_spacing: 3 }, { type: "headline", font_family: "Space Grotesk", font_size: 34, font_weight: 700, color: "#ffffff", x: 5, y: 65, max_width: 85, text_shadow: true }] },
  { id: "retro-vintage", name: "Retro Vintage", preview: "📻", layers: [{ type: "headline", font_family: "Lobster", font_size: 42, font_weight: 400, color: "#F4E4BA", x: 10, y: 55, max_width: 80, text_shadow: true }, { type: "description", font_family: "Merriweather", font_size: 12, color: "#F4E4BAaa", x: 10, y: 78, max_width: 65, font_style: "italic" }] },
  { id: "corporate", name: "Corporate", preview: "💼", layers: [{ type: "headline", font_family: "Montserrat", font_size: 30, font_weight: 700, color: "#ffffff", x: 8, y: 65, max_width: 80 }, { type: "description", font_family: "Roboto", font_size: 13, color: "#ffffffcc", x: 8, y: 80, max_width: 70 }, { type: "cta", font_family: "Montserrat", font_size: 12, color: "#fff", bg_color: "rgba(37,99,235,0.9)", border_radius: 6, padding: 10, x: 8, y: 90, font_weight: 600 }] },
  { id: "handwritten", name: "El Yazısı", preview: "✍️", layers: [{ type: "headline", font_family: "Caveat", font_size: 44, font_weight: 700, color: "#ffffff", x: 8, y: 55, max_width: 85, rotation: -1, text_shadow: true }, { type: "description", font_family: "Dancing Script", font_size: 16, color: "#ffffffcc", x: 8, y: 78, max_width: 70 }] },
  { id: "dark-cinematic", name: "Dark Cinema", preview: "🎬", layers: [{ type: "headline", font_family: "Oswald", font_size: 40, font_weight: 700, color: "#ffffff", text_transform: "uppercase", letter_spacing: 4, x: 5, y: 70, max_width: 90, text_shadow: true }, { type: "description", font_family: "Inter", font_size: 11, color: "#ffffff88", x: 5, y: 88, max_width: 60, letter_spacing: 2, text_transform: "uppercase" }] },
  { id: "pastel-soft", name: "Pastel Soft", preview: "🌸", layers: [{ type: "headline", font_family: "Quicksand", font_size: 32, font_weight: 700, color: "#ffffff", x: 10, y: 60, max_width: 80 }, { type: "description", font_family: "Nunito", font_size: 14, color: "#ffffffcc", x: 10, y: 78, max_width: 65 }] },
  { id: "sale-promo", name: "İndirim", preview: "🏷️", layers: [{ type: "badge", font_family: "Bebas Neue", font_size: 12, color: "#fff", bg_color: "rgba(239,68,68,0.95)", border_radius: 4, padding: 8, x: 5, y: 5, text_transform: "uppercase", letter_spacing: 2 }, { type: "headline", font_family: "Russo One", font_size: 44, font_weight: 400, color: "#ffffff", x: 5, y: 55, max_width: 90, text_shadow: true }, { type: "cta", font_family: "Inter", font_size: 13, color: "#fff", bg_color: "rgba(239,68,68,0.9)", border_radius: 24, padding: 10, x: 5, y: 88, font_weight: 600 }] },
  { id: "story-tall", name: "Story", preview: "📱", layers: [{ type: "headline", font_family: "Poppins", font_size: 36, font_weight: 800, color: "#ffffff", x: 8, y: 40, max_width: 85, text_align: "center", text_shadow: true }, { type: "description", font_family: "Poppins", font_size: 14, color: "#ffffffcc", x: 8, y: 60, max_width: 85, text_align: "center" }] },
  { id: "artistic", name: "Artistic", preview: "🎨", layers: [{ type: "headline", font_family: "Satisfy", font_size: 42, font_weight: 400, color: "#ffffff", x: 10, y: 50, max_width: 80, rotation: -3, text_shadow: true }, { type: "badge", font_family: "Outfit", font_size: 10, color: "#000", bg_color: "#ffffff", border_radius: 20, padding: 6, x: 75, y: 8, text_transform: "uppercase", letter_spacing: 2 }] },
  { id: "sporty", name: "Spor", preview: "⚡", layers: [{ type: "headline", font_family: "Kanit", font_size: 42, font_weight: 800, color: "#ffffff", text_transform: "uppercase", x: 5, y: 60, max_width: 90, font_style: "italic", text_shadow: true }, { type: "cta", font_family: "Kanit", font_size: 13, color: "#000", bg_color: "#FFD93D", border_radius: 4, padding: 10, x: 5, y: 88, font_weight: 700, text_transform: "uppercase" }] },
  { id: "quote", name: "Alıntı", preview: "💬", layers: [{ type: "headline", font_family: "Libre Baskerville", font_size: 28, font_weight: 400, color: "#ffffff", x: 12, y: 35, max_width: 76, text_align: "center", font_style: "italic", line_height: 1.5, text_shadow: true }] },
  { id: "brutalist", name: "Brutalist", preview: "🏗️", layers: [{ type: "headline", font_family: "Archivo Black", font_size: 48, font_weight: 400, color: "#ffffff", text_transform: "uppercase", x: 3, y: 5, max_width: 95, line_height: 0.95, letter_spacing: -1 }, { type: "description", font_family: "IBM Plex Sans", font_size: 11, color: "#ffffff99", x: 3, y: 90, max_width: 50, text_transform: "uppercase", letter_spacing: 3 }] },
];

const SEED_FONTS = [
  "Inter","Roboto","Poppins","Montserrat","Lato","Oswald","Raleway","Nunito",
  "Playfair Display","Bebas Neue","Merriweather","Lobster","Pacifico",
  "Dancing Script","Caveat","Quicksand","Abril Fatface","Righteous",
  "Russo One","Permanent Marker","Satisfy","Fredoka One","Comic Neue",
  "Source Sans 3","Cormorant Garamond","Archivo Black","Titan One",
  "Comfortaa","Josefin Sans","DM Sans","Space Grotesk","Outfit",
  "Lexend","Rubik","Work Sans","Manrope","Barlow","Fira Sans",
  "Kanit","Bitter","Libre Baskerville","Cinzel","Amatic SC",
  "PT Serif","Noto Sans","IBM Plex Sans","Karla","Sora","Exo 2",
];

// ── Helpers ──
const CANVAS_SIZE = 520;
const loadedFonts = new Set<string>();
function loadGoogleFont(f: string) { if (loadedFonts.has(f)) return; loadedFonts.add(f); const l = document.createElement("link"); l.rel = "stylesheet"; l.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(f)}:ital,wght@0,400;0,600;0,700;0,800;1,400;1,700&display=swap`; document.head.appendChild(l); }
function loadAllLayerFonts(layers: DesignLayer[]) { new Set(layers.map(l => l.font_family)).forEach(f => loadGoogleFont(f)); }

/** Estimate vertical space a layer occupies as % of canvas */
function estimateLayerHeight(fontSize: number, text: string, maxWidth: number): number {
  // Rough character estimate for line wrapping
  const charsPerLine = Math.max(10, Math.floor(maxWidth * 0.6));
  const lineCount = Math.max(1, Math.ceil(text.length / charsPerLine));
  const singleLineHeight = fontSize >= 48 ? 10 : fontSize >= 36 ? 8 : fontSize >= 24 ? 6 : fontSize >= 16 ? 4.5 : 3.5;
  return singleLineHeight * lineCount;
}

/** Sort layers by priority and resolve overlapping y coordinates */
function resolveLayerCollisions(layers: DesignLayer[]): DesignLayer[] {
  if (layers.length <= 1) return layers;

  // Deduplicate: if multiple layers have the same type, keep only the first
  const seenTypes = new Set<string>();
  layers = layers.filter(l => {
    if (seenTypes.has(l.type)) return false;
    seenTypes.add(l.type);
    return true;
  });

  const priority: Record<string, number> = { headline: 0, description: 1, cta: 2, badge: 3 };
  const sorted = [...layers].sort((a, b) => {
    if (Math.abs(a.y - b.y) < 3) {
      return (priority[a.type] ?? 9) - (priority[b.type] ?? 9);
    }
    return a.y - b.y;
  });

  // Fix collisions: ensure each layer starts after the previous one ends + proportional gap
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const prevHeight = estimateLayerHeight(prev.font_size, prev.text, prev.max_width || 80);
    // Proportional gap: larger font = larger gap
    const proportionalGap = Math.max(5, (prev.font_size * 1.5) / 6);
    const minY = prev.y + prevHeight + proportionalGap;

    if (sorted[i].y < minY) {
      sorted[i] = { ...sorted[i], y: Math.round(minY) };
    }
  }

  // Keep ALL layers within safe zone (y=78 max bottom — logo zone below)
  const maxBottom = 78;
  for (let i = sorted.length - 1; i >= 0; i--) {
    const layerHeight = estimateLayerHeight(sorted[i].font_size, sorted[i].text, sorted[i].max_width || 80);
    if (sorted[i].y + layerHeight > maxBottom) {
      const newY = maxBottom - layerHeight;
      sorted[i] = { ...sorted[i], y: Math.max(5, Math.round(newY)) };
      // If still overflows, shrink font
      if (sorted[i].y + estimateLayerHeight(sorted[i].font_size, sorted[i].text, sorted[i].max_width || 80) > maxBottom) {
        sorted[i] = { ...sorted[i], font_size: Math.max(10, Math.round(sorted[i].font_size * 0.75)) };
      }
    }
  }

  // X-alignment: all text layers should share the same x (except CTA/badge)
  if (sorted.length >= 2) {
    const refX = sorted[0].x;
    const refAlign = sorted[0].text_align || "left";
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].type !== "cta" && sorted[i].type !== "badge") {
        sorted[i] = { ...sorted[i], x: refX, text_align: refAlign };
      }
    }
  }

  return sorted;
}
function smartLogoPosition(layers: DesignLayer[], logoPositionData?: LogoPositionData | null, aiHint?: string) {
  // 1) AI Vision analizi varsa — dinamik x,y pozisyonunu kullan
  if (logoPositionData && typeof logoPositionData.x === 'number' && typeof logoPositionData.y === 'number') {
    return { x: Math.round((logoPositionData.x / 100) * CANVAS_SIZE), y: Math.round((logoPositionData.y / 100) * CANVAS_SIZE) };
  }
  // 2) Eski köşe hint'i varsa fallback (geriye uyumluluk)
  if (aiHint) {
    const far = CANVAS_SIZE - 70;
    if (aiHint.includes("top_right")) return { x: far, y: 16 };
    if (aiHint.includes("top_left")) return { x: 16, y: 16 };
    if (aiHint.includes("bottom_right")) return { x: far, y: far };
    if (aiHint.includes("bottom_left")) return { x: 16, y: far };
  }
  // 3) Katmanlara göre otomatik hesapla
  if (!layers.length) return { x: 16, y: 16 };
  const far = CANVAS_SIZE - 70;
  const corners = [{ x: 16, y: 16 }, { x: far, y: 16 }, { x: 16, y: far }, { x: far, y: far }];
  let best = corners[0], bestS = Infinity;
  for (const c of corners) { let s = 0; for (const l of layers) { s += Math.max(0, 250 - Math.sqrt(((l.x/100)*CANVAS_SIZE - c.x)**2 + ((l.y/100)*CANVAS_SIZE - c.y)**2)); } if (s < bestS) { bestS = s; best = c; } }
  return best;
}
function getGradientForLayers(layers: DesignLayer[], opacity: number): React.CSSProperties {
  if (!layers.length) return {};
  const avgY = layers.reduce((s, l) => s + l.y, 0) / layers.length;
  const avgX = layers.reduce((s, l) => s + l.x, 0) / layers.length;
  const o = opacity, base: React.CSSProperties = { position: "absolute", inset: 0, zIndex: 5, pointerEvents: "none" };
  if (avgY > 60) return { ...base, background: `linear-gradient(to top, rgba(0,0,0,${o}) 0%, rgba(0,0,0,${o*0.5}) 40%, transparent 75%)` };
  if (avgY < 30) return { ...base, background: `linear-gradient(to bottom, rgba(0,0,0,${o}) 0%, rgba(0,0,0,${o*0.5}) 40%, transparent 75%)` };
  return { ...base, background: `radial-gradient(circle at ${avgX}% ${avgY}%, rgba(0,0,0,${o*0.6}) 0%, transparent 60%)` };
}

// ── Component ──
export default function ImageStudio({ postId, onBack, onComplete, onOpenCarousel }: { postId: number; onBack: () => void; onComplete: () => void; onOpenCarousel?: () => void }) {
  const [post, setPost] = useState<PostData | null>(null);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [bgDataUrl, setBgDataUrl] = useState("");
  // Tuval yüksekliği görselin oranına göre (4:5 → 650, 1:1 → 520)
  const [canvasH, setCanvasH] = useState(CANVAS_SIZE);
  const [imageStyle, setImageStyle] = useState("realistic");
  const [customPrompt, setCustomPrompt] = useState("");
  const [autoGenTriggered, setAutoGenTriggered] = useState(false);
  const [layers, setLayers] = useState<DesignLayer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [logoEnabled, setLogoEnabled] = useState(false);
  const [logoX, setLogoX] = useState(16);
  const [logoY, setLogoY] = useState(16);
  const [logoWidth, setLogoWidth] = useState(56);
  const [logoDataUrl, setLogoDataUrl] = useState("");
  const [logoDragging, setLogoDragging] = useState(false);
  const [logoDragOffset, setLogoDragOffset] = useState({ dx: 0, dy: 0 });
  // Layer dragging state
  const [draggingLayerId, setDraggingLayerId] = useState<string | null>(null);
  const [layerDragStart, setLayerDragStart] = useState<{ mouseX: number; mouseY: number; layerX: number; layerY: number } | null>(null);
  // Inline text editing
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [gradientEnabled, setGradientEnabled] = useState(true);
  const [gradientOpacity, setGradientOpacity] = useState(0.4);
  type SidePanel = "design" | "text" | "image" | "logo" | "effects" | "layers" | "templates" | null;
  const [activePanel, setActivePanel] = useState<SidePanel>("design");
  const [allFonts, setAllFonts] = useState<string[]>(SEED_FONTS);
  const [fontSearch, setFontSearch] = useState("");
  const [fontDropdownOpen, setFontDropdownOpen] = useState(false);
  const fontListRef = useRef<HTMLDivElement>(null);
  const [fontsPage, setFontsPage] = useState(1);
  const compositeRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadPrompt, setUploadPrompt] = useState("");
  const [uploadedRefUrl, setUploadedRefUrl] = useState("");
  const [uploadingRef, setUploadingRef] = useState(false);
  const brandColors: string[] = (() => { if (!company?.brand_colors) return ["#ffffff", "#f0f0f0", "#000000", "#1a1a2e", "#e6272f"]; try { return [...JSON.parse(company.brand_colors), "#ffffff", "#000000"]; } catch { return ["#ffffff", "#000000", "#e6272f"]; } })();
  const selectedLayer = layers.find(l => l.id === selectedLayerId) || null;

  const fetchGoogleFonts = useCallback(async () => {
    if (allFonts.length > SEED_FONTS.length) return;
    try { const r = await fetch(`https://www.googleapis.com/webfonts/v1/webfonts?key=${process.env.NEXT_PUBLIC_GOOGLE_FONTS_KEY}&sort=popularity`); const d = await r.json(); if (d.items) setAllFonts(d.items.map((f: {family:string}) => f.family)); } catch (e) { console.warn("Fonts API err:", e); }
  }, [allFonts.length]);
  const filteredFonts = useMemo(() => { const q = fontSearch.toLowerCase().trim(); const list = q ? allFonts.filter(f => f.toLowerCase().includes(q)) : allFonts; return list.slice(0, fontsPage * 30); }, [allFonts, fontSearch, fontsPage]);

  // Apply template — keeps existing text, changes styling
  const applyTemplate = useCallback((tpl: typeof DESIGN_TEMPLATES[0]) => {
    const existingTexts = layers.reduce((m, l) => { m[l.type] = l.text; return m; }, {} as Record<string, string>);
    const newLayers: DesignLayer[] = tpl.layers.map((tl, i) => ({
      id: `${tl.type}_${Date.now()}_${i}`, type: tl.type || "headline",
      text: existingTexts[tl.type || "headline"] || (tl.type === "cta" ? "Hemen Keşfet →" : tl.type === "badge" ? "YENİ" : tl.type === "headline" ? post?.title || "Başlık" : post?.content?.substring(0, 120) || "Açıklama"),
      x: tl.x ?? 5, y: tl.y ?? 50, max_width: tl.max_width ?? 80, font_family: tl.font_family || "Inter",
      font_size: tl.font_size ?? 28, font_weight: tl.font_weight ?? 700, color: tl.color || "#ffffff",
      text_align: tl.text_align || "left", bg_color: tl.bg_color, border_radius: tl.border_radius,
      padding: tl.padding, line_height: tl.line_height, opacity: tl.opacity ?? 1,
      letter_spacing: tl.letter_spacing, text_transform: tl.text_transform, text_shadow: tl.text_shadow,
      rotation: tl.rotation ?? 0, font_style: tl.font_style,
    } as DesignLayer));
    loadAllLayerFonts(newLayers);
    setLayers(newLayers); setSelectedLayerId(newLayers[0]?.id || null);
  }, [layers, post]);

  // Image upload handler — ONLY uploads and stores reference, does NOT auto-generate
  const handleImageUpload = useCallback(async (file: File) => {
    setUploadingRef(true); setError("");
    try {
      const fd = new FormData();
      fd.append("canvas", file, file.name);
      const up = await api.post("/api/protected/upload-canvas", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const uploadedUrl = up.data.url;
      setUploadedRefUrl(uploadedUrl);
    } catch { setError("Referans görsel yüklenemedi"); } finally { setUploadingRef(false); }
  }, []);

  // ── Data fetch ──
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/api/protected/posts/${postId}`);
        const p = data.post, c = data.company;
        // Carousel gönderileri kendi düzenleyicisinde açılır
        if (p.format === "carousel" && onOpenCarousel) { onOpenCarousel(); return; }
        setPost(p); setCompany(c); setCustomPrompt(p.image_prompt || "");
        if (p.image_url) setImageUrl(p.image_url);
        let parsed: DesignLayer[] = [];
        if (p.design_layers) { try { const dl = JSON.parse(p.design_layers); if (Array.isArray(dl) && dl.length) parsed = dl; } catch {/* */} }
        // Sanitize AI-generated layers: force rotation=0 and ensure good text rendering
        parsed = parsed.map(l => ({
          ...l,
          rotation: 0, // NEVER use rotated text — always straight for professional look
          text_shadow: l.text_shadow !== false, // Enable text shadow by default
          line_height: l.line_height || (l.type === "headline" ? 1.15 : 1.4),
          letter_spacing: (l.letter_spacing !== undefined && l.letter_spacing !== null) ? l.letter_spacing : (l.type === "headline" ? 0.5 : 0),
          opacity: l.opacity ?? 1,
        }));
        if (!parsed.length) {
          // design_layers boşsa, hiç otomatik katman ekleme.
          // Kullanıcı isterse stüdyodan kendisi metin/başlık ekleyebilir.
        }
        // Çakışma önleme — katmanları sıralayıp gap ekle
        if (parsed.length) {
          parsed = resolveLayerCollisions(parsed);
          loadAllLayerFonts(parsed);
        }
        setLayers(parsed); setSelectedLayerId(parsed[0]?.id || null);
        // AI Vision logo pozisyonunu kontrol et
        let lpData: LogoPositionData | null = null;
        if (p.logo_position) { try { lpData = JSON.parse(p.logo_position); } catch {/* */} }
        const lp = smartLogoPosition(parsed, lpData, p.suggested_layout); setLogoX(lp.x); setLogoY(lp.y);
        if (lpData?.max_width) setLogoWidth(Math.round((lpData.max_width / 100) * 600));
      } catch { setError("Post verisi yüklenemedi"); } finally { setLoading(false); }
    })();
  }, [postId]);

  useEffect(() => {
    if (!bgDataUrl) return;
    const img = new Image();
    img.onload = () => {
      if (!img.naturalWidth || !img.naturalHeight) return;
      const h = Math.round(CANVAS_SIZE * img.naturalHeight / img.naturalWidth);
      setCanvasH(prev => {
        // Alt yarıdaki logo yeni tuvalin altına kaysın
        if (h !== prev) setLogoY(y => (y > prev / 2 ? Math.max(0, y + h - prev) : y));
        return h;
      });
    };
    img.src = bgDataUrl;
  }, [bgDataUrl]);

  useEffect(() => { if (!imageUrl) { setBgDataUrl(""); return; } const u = imageUrl.startsWith("/") ? `${process.env.NEXT_PUBLIC_API_URL}${imageUrl}` : imageUrl; fetch(u).then(r => r.blob()).then(b => { const r = new FileReader(); r.onload = () => setBgDataUrl(r.result as string); r.readAsDataURL(b); }).catch(() => setBgDataUrl(u)); }, [imageUrl]);

  useEffect(() => {
    if (!company?.logo_url) { const ini = (company?.name || "?").charAt(0).toUpperCase(); let pc = "#e6272f"; if (company?.brand_colors) { try { const c = JSON.parse(company.brand_colors); if (c.length) pc = c[0]; } catch {/* */} } const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" rx="40" fill="${pc}"/><text x="100" y="100" text-anchor="middle" dominant-baseline="central" font-family="Inter,sans-serif" font-size="100" font-weight="700" fill="white">${ini}</text></svg>`; setLogoDataUrl(`data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`); return; }
    const fullUrl = company.logo_url.startsWith("/") ? `${process.env.NEXT_PUBLIC_API_URL}${company.logo_url}` : company.logo_url;
    fetch(fullUrl, { mode: "cors" }).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.blob(); }).then(b => { const r = new FileReader(); r.onload = () => { setLogoDataUrl(r.result as string); setLogoEnabled(true); }; r.readAsDataURL(b); }).catch(() => { const img = new Image(); img.crossOrigin = "anonymous"; img.onload = () => { const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight; const ctx = c.getContext("2d"); if (ctx) { ctx.drawImage(img,0,0); setLogoDataUrl(c.toDataURL("image/png")); } }; img.onerror = () => setLogoDataUrl(""); img.src = fullUrl; });
  }, [company?.logo_url, company?.name, company?.brand_colors]);

  useEffect(() => { if (!logoDragging) return; const hm = (e: MouseEvent) => { const r = canvasRef.current?.getBoundingClientRect(); if (!r) return; setLogoX(Math.max(0, Math.min(CANVAS_SIZE-logoWidth, e.clientX-r.left-logoDragOffset.dx))); setLogoY(Math.max(0, Math.min(canvasH-logoWidth, e.clientY-r.top-logoDragOffset.dy))); }; const hu = () => setLogoDragging(false); window.addEventListener("mousemove", hm); window.addEventListener("mouseup", hu); return () => { window.removeEventListener("mousemove", hm); window.removeEventListener("mouseup", hu); }; }, [logoDragging, logoDragOffset, logoWidth, canvasH]);

  const updateLayer = useCallback((id: string, u: Partial<DesignLayer>) => { setLayers(p => p.map(l => l.id === id ? { ...l, ...u } : l)); if (u.font_family) loadGoogleFont(u.font_family); }, []);

  // ── Layer drag handler ──
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

  useEffect(() => { loadAllLayerFonts(layers); }, [layers]);

  const handleGenerate = useCallback(async () => {
    setGenerating(true); setError("");
    try {
      // Build the prompt: if a reference image was uploaded, include that context
      let finalPrompt = customPrompt || undefined;
      if (uploadedRefUrl && !finalPrompt) {
        finalPrompt = uploadPrompt
          ? `Referans görsel yüklendi. Bu görsele benzer veya daha iyi bir versiyon oluştur. Ek talimat: ${uploadPrompt}`
          : `Referans görsel yüklendi. Bu görselden ilham alarak profesyonel bir sosyal medya görseli oluştur.`;
      } else if (uploadedRefUrl && finalPrompt) {
        finalPrompt = `Referans görsel yüklendi. ${finalPrompt}`;
      }
      const { data } = await api.post("/api/protected/generate-image", { post_id: postId, style: imageStyle, custom_prompt: finalPrompt });
      setImageUrl(data.image_url); setPost(data.post);
      // AI Vision logo pozisyonunu uygula
      let lpData: LogoPositionData | null = null;
      if (data.logo_position) { lpData = data.logo_position as LogoPositionData; }
      else if (data.post?.logo_position) { try { lpData = JSON.parse(data.post.logo_position); } catch {/* */} }
      if (data.post?.design_layers) { try { let nl: DesignLayer[] = JSON.parse(data.post.design_layers); if (Array.isArray(nl) && nl.length) { nl = nl.map(l => ({ ...l, rotation: 0, text_shadow: l.text_shadow !== false, line_height: l.line_height || (l.type === "headline" ? 1.15 : 1.4) })); nl = resolveLayerCollisions(nl); setLayers(nl); setSelectedLayerId(nl[0]?.id||null); loadAllLayerFonts(nl); const lp = smartLogoPosition(nl, lpData, data.post.suggested_layout); setLogoX(lp.x); setLogoY(lp.y); if (lpData?.max_width) setLogoWidth(Math.round((lpData.max_width / 100) * 600)); setActivePanel("layers"); } else { setLayers([]); setSelectedLayerId(null); } } catch {/* */} }
      else { setLayers([]); setSelectedLayerId(null); if (lpData) { const lp = smartLogoPosition([], lpData); setLogoX(lp.x); setLogoY(lp.y); if (lpData.max_width) setLogoWidth(Math.round((lpData.max_width / 100) * 600)); } }
    } catch (e: unknown) { const m = e && typeof e === "object" && "response" in e ? (e as {response?:{data?:{error?:string}}}).response?.data?.error : "Hata"; setError(m || "Hata"); } finally { setGenerating(false); }
  }, [postId, imageStyle, customPrompt, uploadedRefUrl, uploadPrompt]);

  // Auto-generate on mount if there's no image
  useEffect(() => {
    if (!loading && post && !post.image_url && !autoGenTriggered && !imageUrl) {
      setAutoGenTriggered(true);
      handleGenerate();
    }
  }, [loading, post, autoGenTriggered, imageUrl, handleGenerate]);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const handleSave = useCallback(async (): Promise<boolean> => {
    if (!compositeRef.current || !bgDataUrl) return false; setSaving(true); setError(""); setSaveSuccess(false);
    try {
      // 1080 px genişlikte dışa aktar (4:5 → 1080x1350)
      const du = await toPng(compositeRef.current, { pixelRatio: 1080 / CANVAS_SIZE, quality: 1, skipFonts: true, cacheBust: true });
      const r = await fetch(du); const b = await r.blob();
      const fd = new FormData(); fd.append("canvas", b, `canvas_${postId}.png`);
      const up = await api.post("/api/protected/upload-canvas", fd, { headers: { "Content-Type": "multipart/form-data" } });
      // Katmanları da kaydet — tekrar yüklendiğinde çiftlenmesin
      const layersJSON = JSON.stringify(layers);
      await api.patch(`/api/protected/posts/${postId}`, { image_url: up.data.url, status: "ready", design_layers: layersJSON });
      // Sayfada kal, başarılı mesajı göster
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      return true;
    } catch { setError("Kaydetme hatası"); return false; } finally { setSaving(false); }
  }, [bgDataUrl, postId, layers]);

  const addLayer = useCallback((type: DesignLayer["type"]) => {
    const id = `${type}_${Date.now()}`;
    const nl: DesignLayer = { id, type, text: type==="cta"?"Hemen Keşfet →":type==="badge"?"YENİ":type==="headline"?"Başlık":"Açıklama metni", x: 5, y: 50, max_width: 60, font_family: type==="headline"?"Bebas Neue":"Inter", font_size: type==="headline"?38:type==="description"?14:12, font_weight: type==="headline"?800:type==="cta"?600:400, color: "#ffffff", text_align: "left", opacity: 1, letter_spacing: type==="badge"?2:0, text_transform: type==="badge"?"uppercase":"none", text_shadow: type==="headline"||type==="description", rotation: 0, ...(type==="badge"?{bg_color:"rgba(0,0,0,0.45)",border_radius:20,padding:8,font_size:11}:{}), ...(type==="cta"?{bg_color:"rgba(255,255,255,0.2)",border_radius:24,padding:10,font_size:13}:{}) };
    setLayers(p => [...p, nl]); setSelectedLayerId(id); setActivePanel("layers");
  }, []);
  const removeLayer = useCallback((id: string) => { setLayers(p => p.filter(l => l.id !== id)); setSelectedLayerId(p => p === id ? null : p); }, []);

  if (loading) return <div className="flex h-96 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-brand" /></div>;
  if (!post) return <div className="flex h-96 flex-col items-center justify-center gap-3"><span className="text-4xl">😕</span><p className="text-sm text-muted">Post bulunamadı</p><button onClick={onBack} className="text-sm text-brand hover:underline">← Geri</button></div>;

  return (
    <div className="space-y-2">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-2.5">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex h-8 w-8 items-center justify-center rounded-lg text-sm text-muted hover:bg-zinc-100 transition">←</button>
          <div className="h-5 w-px bg-zinc-200" />
          <h1 className="text-sm font-semibold">🎨 Görsel Stüdyosu</h1>
        </div>
        <div className="flex items-center gap-2">
          {error && <span className="text-xs text-red-500">⚠️ {error}</span>}
          {bgDataUrl && <button onClick={handleSave} disabled={saving} className={`rounded-lg px-4 py-1.5 text-xs font-medium text-white transition ${saveSuccess ? "bg-emerald-600 hover:bg-emerald-700" : "bg-zinc-900 hover:bg-zinc-800"} disabled:opacity-50`}>{saving ? "Kaydediliyor…" : saveSuccess ? "✓ Kaydedildi" : "💾 Kaydet"}</button>}
          {bgDataUrl && <button onClick={async () => { if (await handleSave()) onComplete(); }} disabled={saving} className="rounded-lg bg-gradient-to-r from-brand to-brand-dark px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:shadow-md disabled:opacity-50">Kaydet ve Zamanla →</button>}
        </div>
      </div>

      {/* ═══ MAIN: Sidebar + Canvas + Properties ═══ */}
      <div className="flex rounded-2xl border border-zinc-200 bg-white overflow-hidden" style={{ minHeight: 580, overflowX: 'hidden' }}>

        {/* LEFT ICON SIDEBAR */}
        <div className="flex-shrink-0 w-[56px] bg-zinc-50 border-r border-zinc-200 flex flex-col py-2">
          {([["design","✨","Tasarım"],["text","T","Metin"],["image","🖼️","Görsel"],["logo","🏷️","Logo"],["layers","📑","Katmanlar"],["templates","🎭","Şablonlar"],["effects","🌗","Efektler"]] as [SidePanel,string,string][]).map(([id,icon,label]) => (
            <button key={id} onClick={() => setActivePanel(activePanel===id ? null : id)} className={`flex flex-col items-center gap-0.5 px-1 py-2.5 rounded-lg mx-1 mb-0.5 transition-all ${activePanel===id ? "bg-white shadow-sm text-brand border border-zinc-200" : "text-zinc-500 hover:bg-white/60 border border-transparent"}`}>
              <span className="text-base">{icon}</span>
              <span className="text-[9px] font-medium mt-0.5">{label}</span>
            </button>
          ))}
        </div>

        {/* SECONDARY TOOL PANEL */}
        {activePanel && (
          <div className="flex-shrink-0 w-[220px] border-r border-zinc-200 overflow-y-auto" style={{ maxHeight: 580 }}>
            <div className="p-4 space-y-4">

              {activePanel === "design" && (<>
                <h3 className="text-sm font-semibold">✨ AI Tasarım Motoru</h3>
                <div><label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted">Stil</label>
                  <select value={imageStyle} onChange={e => setImageStyle(e.target.value)} className="w-full rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-xs outline-none focus:border-brand">{IMAGE_STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
                <div><label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted">Özel Prompt</label>
                  <textarea value={customPrompt} onChange={e => setCustomPrompt(e.target.value)} rows={3} className="w-full rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-xs outline-none focus:border-brand" placeholder="Görseli tarif edin…" /></div>
                <button onClick={handleGenerate} disabled={generating} className="auth-btn auth-btn-primary flex w-full items-center justify-center gap-2 text-sm">{generating ? "Hazırlanıyor…" : imageUrl ? "🔄 Yeniden Üret" : "✨ AI Tasarım Oluştur"}</button>
                {(customPrompt||post.image_prompt) && <div className="rounded-lg bg-zinc-50 p-3"><label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted">🧠 Aktif Prompt</label><p className="text-[11px] text-zinc-600">{customPrompt||post.image_prompt}</p></div>}
              </>)}

              {activePanel === "text" && (<>
                <h3 className="text-sm font-semibold">T Metin Ekle</h3>
                <p className="text-[11px] text-muted">Canvas&apos;a metin katmanı ekleyin</p>
                <button onClick={() => addLayer("headline")} className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-bold text-white hover:bg-zinc-800 transition">Başlık Ekle</button>
                <button onClick={() => addLayer("description")} className="w-full rounded-xl bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-200 transition">Alt Başlık Ekle</button>
                <button onClick={() => addLayer("badge")} className="w-full rounded-xl border-2 border-dashed border-zinc-300 px-4 py-3 text-xs font-medium text-zinc-500 hover:border-brand/40 transition">🏷️ Badge Ekle</button>
                <button onClick={() => addLayer("cta")} className="w-full rounded-xl border-2 border-zinc-300 px-4 py-3 text-xs font-medium text-zinc-500 hover:border-brand/40 transition">🔗 CTA Butonu Ekle</button>
              </>)}

              {activePanel === "image" && (<>
                <h3 className="text-sm font-semibold">🖼️ Görsel</h3>
                <button onClick={handleGenerate} disabled={generating || uploadingRef} className="auth-btn auth-btn-primary flex w-full items-center justify-center gap-2 text-sm">{generating ? "Hazırlanıyor…" : uploadedRefUrl ? "🔄 Referansla Yeniden Üret" : "✨ AI Görsel Üret"}</button>
                {uploadedRefUrl && (
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={uploadedRefUrl.startsWith("/") ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}${uploadedRefUrl}` : uploadedRefUrl} alt="Referans" className="h-10 w-10 rounded-lg object-cover border border-emerald-300" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-emerald-700">✓ Referans yüklendi</p>
                      <p className="text-[10px] text-emerald-600">Üret butonuna basarak kullanın</p>
                    </div>
                    <button onClick={() => setUploadedRefUrl("")} className="text-[10px] text-emerald-500 hover:text-red-500 transition">✕</button>
                  </div>
                )}
                <div className="relative">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-2">📁 Referans Görsel Yükle</p>
                  <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
                  <div onClick={() => fileInputRef.current?.click()} className={`rounded-xl border-2 border-dashed p-5 text-center cursor-pointer transition group ${uploadingRef ? "border-brand/40 bg-brand/5" : "border-zinc-300 hover:border-brand/40 hover:bg-brand/5"}`}>
                    {uploadingRef ? (
                      <><div className="h-6 w-6 mx-auto animate-spin rounded-full border-2 border-zinc-200 border-t-brand" /><p className="text-xs text-muted mt-2">Yükleniyor...</p></>
                    ) : (
                      <><span className="text-2xl opacity-40 group-hover:opacity-70 transition">📁</span><p className="text-xs text-muted mt-2">Tıklayarak görsel seçin</p><p className="text-[10px] text-zinc-400 mt-1">PNG, JPG, WebP · Sadece referans olarak</p></>
                    )}
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted">Ek Talimat (opsiyonel)</label>
                  <textarea value={uploadPrompt} onChange={e => setUploadPrompt(e.target.value)} rows={2} className="w-full rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-xs outline-none focus:border-brand" placeholder="Yüklenen görsele dayalı ek yönerge…" />
                </div>
              </>)}

              {activePanel === "logo" && (<>
                <h3 className="text-sm font-semibold">🏷️ Marka Logosu</h3>
                <div className="flex items-center justify-between"><span className="text-xs">Logo Göster</span>
                  <label className="relative inline-flex cursor-pointer items-center"><input type="checkbox" checked={logoEnabled} onChange={e => setLogoEnabled(e.target.checked)} className="peer sr-only" /><div className="h-5 w-9 rounded-full bg-zinc-200 transition peer-checked:bg-brand after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full" /></label>
                </div>
                {logoEnabled && logoDataUrl && (<>
                  <div className="flex items-center gap-3 rounded-lg bg-zinc-50 p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logoDataUrl} alt="Logo" className="h-12 w-12 rounded-lg border border-zinc-200 object-contain bg-white p-1" />
                    <div><p className="text-xs font-medium">{company?.name}</p><p className={`text-[10px] ${company?.logo_url?"text-emerald-600":"text-blue-500"}`}>{company?.logo_url?"✓ Yüklenen":"✎ Otomatik"}</p></div>
                  </div>
                  <div><label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted">Boyut: {logoWidth}px</label>
                    <input type="range" min={24} max={140} value={logoWidth} onChange={e => setLogoWidth(Number(e.target.value))} className="h-2 w-full cursor-pointer rounded-full bg-zinc-200 accent-brand" /></div>
                  <p className="text-[10px] text-muted">💡 Canvas üzerinde sürükleyin</p>
                </>)}
              </>)}

              {activePanel === "layers" && (<>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">📑 Katmanlar <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px]">{layers.length}</span></h3>
                  <div className="relative group"><button className="rounded-lg border border-zinc-200 px-2 py-1 text-[10px] font-medium text-zinc-500 hover:bg-zinc-50">+ Ekle</button>
                    <div className="absolute right-0 top-full z-40 mt-1 hidden w-36 rounded-xl border bg-white p-1.5 shadow-xl group-hover:block">
                      {(["headline","description","cta","badge"] as const).map(t => <button key={t} onClick={() => addLayer(t)} className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs hover:bg-zinc-50"><span className={`h-2 w-2 rounded-full ${LAYER_TYPE_COLORS[t]}`} />{LAYER_TYPE_LABELS[t]}</button>)}
                    </div>
                  </div>
                </div>
                <div className="space-y-1">{layers.map(layer => (
                  <div key={layer.id} role="button" tabIndex={0} onClick={() => setSelectedLayerId(layer.id)} className={`flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition ${selectedLayerId===layer.id ? "bg-indigo-50 border border-indigo-200" : "hover:bg-zinc-50 border border-transparent"}`}>
                    <span className={`h-2.5 w-2.5 rounded-full ${LAYER_TYPE_COLORS[layer.type]}`} />
                    <div className="flex-1 min-w-0"><p className="text-xs font-medium truncate">{layer.text}</p><p className="text-[10px] text-muted">{layer.font_family} · {layer.font_size}px</p></div>
                    {layers.length > 1 && <span role="button" tabIndex={0} onClick={e => { e.stopPropagation(); removeLayer(layer.id); }} className="text-[10px] text-zinc-400 hover:text-red-500 cursor-pointer">✕</span>}
                  </div>
                ))}</div>
              </>)}

              {activePanel === "effects" && (<>
                <h3 className="text-sm font-semibold">🌗 Efektler</h3>
                <div className="flex items-center justify-between"><span className="text-xs">Gradient Overlay</span>
                  <label className="relative inline-flex cursor-pointer items-center"><input type="checkbox" checked={gradientEnabled} onChange={e => setGradientEnabled(e.target.checked)} className="peer sr-only" /><div className="h-5 w-9 rounded-full bg-zinc-200 transition peer-checked:bg-brand after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full" /></label>
                </div>
                {gradientEnabled && <div><label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted">Yoğunluk: {Math.round(gradientOpacity*100)}%</label><input type="range" min={0} max={90} value={Math.round(gradientOpacity*100)} onChange={e => setGradientOpacity(Number(e.target.value)/100)} className="h-2 w-full cursor-pointer rounded-full bg-zinc-200 accent-brand" /></div>}
              </>)}

              {activePanel === "templates" && (<>
                <h3 className="text-sm font-semibold">🎭 Tasarım Şablonları</h3>
                <p className="text-[11px] text-muted">Tek tıkla profesyonel tasarım uygulayın. Mevcut metinleriniz korunur.</p>
                <div className="grid grid-cols-2 gap-2">
                  {DESIGN_TEMPLATES.map(tpl => (
                    <button key={tpl.id} onClick={() => applyTemplate(tpl)} className="group rounded-xl border border-zinc-200 p-3 text-left hover:border-brand/40 hover:bg-brand/5 transition">
                      <span className="text-2xl block mb-1">{tpl.preview}</span>
                      <p className="text-[11px] font-semibold text-zinc-700 group-hover:text-brand transition">{tpl.name}</p>
                      <p className="text-[9px] text-muted mt-0.5">{tpl.layers.length} katman</p>
                    </button>
                  ))}
                </div>
              </>)}
            </div>
          </div>
        )}

        {/* CENTER CANVAS */}
        <div className="flex-1 flex items-center justify-center p-4 bg-zinc-100/50 min-w-0 border-l border-zinc-200">
          <div ref={compositeRef} className="relative" style={{ width: CANVAS_SIZE, height: canvasH, maxWidth: "100%" }}>
            {bgDataUrl ? (
              <div ref={canvasRef} className="relative overflow-hidden rounded-xl shadow-2xl" style={{ width: "100%", aspectRatio: `${CANVAS_SIZE}/${canvasH}` }} onClick={() => { setSelectedLayerId(null); setEditingLayerId(null); }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={bgDataUrl} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
                {gradientEnabled && <div style={getGradientForLayers(layers, gradientOpacity)} />}
                {logoEnabled && logoDataUrl && (
                  <div
                    onMouseDown={e => { e.preventDefault(); const r = canvasRef.current?.getBoundingClientRect(); if (!r) return; setLogoDragging(true); setLogoDragOffset({ dx: e.clientX-r.left-logoX, dy: e.clientY-r.top-logoY }); setSelectedLayerId(null); }}
                    style={{ position:"absolute", left:logoX, top:logoY, width:logoWidth, zIndex:20, cursor:logoDragging?"grabbing":"grab", outline:logoDragging?"2px solid rgba(99,102,241,0.8)":"none" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logoDataUrl} alt="Logo" draggable={false}
                      style={{ width:"100%", height:"auto", objectFit:"contain", display:"block" }} />
                  </div>
                )}
                {layers.map(layer => {
                  const isSel = layer.id === selectedLayerId;
                  const isEditing = editingLayerId === layer.id;
                  const isDragging = draggingLayerId === layer.id;
                  return (
                    <div key={layer.id}
                      onMouseDown={e => {
                        if (isEditing) return; // editing mode’da drag başlatma
                        e.stopPropagation(); e.preventDefault();
                        setSelectedLayerId(layer.id); setActivePanel("layers");
                        setDraggingLayerId(layer.id);
                        setLayerDragStart({ mouseX: e.clientX, mouseY: e.clientY, layerX: layer.x, layerY: layer.y });
                      }}
                      onDoubleClick={e => {
                        e.stopPropagation();
                        setEditingLayerId(layer.id);
                        setSelectedLayerId(layer.id);
                        setDraggingLayerId(null);
                      }}
                      style={{ position:"absolute", left:`${layer.x}%`, top:`${layer.y}%`, maxWidth:`${layer.max_width}%`, zIndex:layer.type==="badge"?14:layer.type==="headline"?12:11, cursor: isEditing ? "text" : isDragging ? "grabbing" : "grab", outline:isSel?"2px solid rgba(99,102,241,0.8)":"2px solid transparent", outlineOffset:4, borderRadius:layer.border_radius||0, backgroundColor:layer.bg_color?.startsWith("linear")?undefined:(layer.bg_color||"transparent"), backgroundImage:layer.bg_color?.startsWith("linear")?layer.bg_color:undefined, padding:layer.padding||0, border:layer.type==="cta"&&(!layer.bg_color||layer.bg_color==="transparent")?`2px solid ${layer.color||"#fff"}`:"none", opacity:layer.opacity??1, transform:layer.rotation?`rotate(${layer.rotation}deg)`:"none", userSelect: isEditing ? "text" : "none" }}>
                      {isEditing ? (
                        <span
                          contentEditable
                          suppressContentEditableWarning
                          autoFocus
                          onBlur={e => {
                            const newText = e.currentTarget.innerText?.trim() || layer.text;
                            updateLayer(layer.id, { text: newText });
                            setEditingLayerId(null);
                          }}
                          onKeyDown={e => { if (e.key === "Escape") { setEditingLayerId(null); } }}
                          ref={el => { if (el && isEditing) { el.focus(); const range = document.createRange(); range.selectNodeContents(el); const sel = window.getSelection(); sel?.removeAllRanges(); sel?.addRange(range); } }}
                          style={{ display:"block", fontFamily:`'${layer.font_family}',sans-serif`, fontSize:layer.font_size, fontWeight:layer.font_weight, fontStyle:layer.font_style||"normal", color:layer.color, textAlign:layer.text_align, lineHeight:layer.line_height||(layer.type==="headline"?1.15:1.4), letterSpacing:layer.letter_spacing?`${layer.letter_spacing}px`:"0", textTransform:(layer.text_transform as React.CSSProperties["textTransform"])||"none", textShadow:(layer.text_shadow!==false&&!layer.bg_color)?"0 2px 12px rgba(0,0,0,0.8),0 1px 3px rgba(0,0,0,0.6)":"none", wordBreak:"break-word", outline:"none", minWidth:40, caretColor:layer.color }}
                        >{layer.text}</span>
                      ) : (
                        <span style={{ display:"block", fontFamily:`'${layer.font_family}',sans-serif`, fontSize:layer.font_size, fontWeight:layer.font_weight, fontStyle:layer.font_style||"normal", color:layer.color, textAlign:layer.text_align, lineHeight:layer.line_height||(layer.type==="headline"?1.15:1.4), letterSpacing:layer.letter_spacing?`${layer.letter_spacing}px`:"0", textTransform:(layer.text_transform as React.CSSProperties["textTransform"])||"none", textShadow:(layer.text_shadow!==false&&!layer.bg_color)?"0 2px 12px rgba(0,0,0,0.8),0 1px 3px rgba(0,0,0,0.6)":"none", wordBreak:"break-word" }}>{layer.text}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : generating ? (
              <div className="flex flex-col items-center justify-center gap-3 p-10"><div className="h-10 w-10 animate-spin rounded-full border-3 border-zinc-200 border-t-brand" /><p className="text-sm font-medium">Hazırlanıyor…</p></div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 p-10 text-center"><div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-50"><span className="text-4xl opacity-40">🖼️</span></div><p className="text-sm font-medium">Henüz görsel üretilmedi</p><p className="text-xs text-muted">Sol panelden <strong>Tasarım</strong> ile başlayın</p></div>
            )}
          </div>
        </div>

        {/* RIGHT PROPERTY PANEL (ALWAYS VISIBLE) */}
        <div className="flex-shrink-0 w-[240px] border-l border-zinc-200 overflow-y-auto bg-white" style={{ maxHeight: 580 }}>
          {bgDataUrl ? (
            selectedLayer ? (
              <div className="p-4 space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold mb-4"><span className={`h-3 w-3 rounded-full ${LAYER_TYPE_COLORS[selectedLayer.type]}`} />{LAYER_TYPE_LABELS[selectedLayer.type]} Özellikleri</h3>
                <textarea value={selectedLayer.text} onChange={e => updateLayer(selectedLayer.id, { text: e.target.value })} rows={2} className="w-full rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-sm outline-none focus:border-brand" />
                {/* Font picker */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted">Font</label>
                  <div className="relative">
                    <button onClick={() => { setFontDropdownOpen(!fontDropdownOpen); if (!fontDropdownOpen) fetchGoogleFonts(); }} className="flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-xs hover:bg-zinc-100 transition" style={{ fontFamily: `'${selectedLayer.font_family}',sans-serif` }}>
                      <span className="truncate">{selectedLayer.font_family}</span><span className="text-zinc-400 text-[10px]">{fontDropdownOpen?"▲":"▼"}</span>
                    </button>
                    {fontDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border bg-white shadow-xl overflow-hidden">
                        <div className="p-2 border-b border-zinc-100"><input autoFocus type="text" value={fontSearch} onChange={e => { setFontSearch(e.target.value); setFontsPage(1); }} placeholder="Font ara…" className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs outline-none focus:border-brand" /></div>
                        <div ref={fontListRef} className="max-h-48 overflow-y-auto" onScroll={e => { const el = e.currentTarget; if (el.scrollTop+el.clientHeight >= el.scrollHeight-20) setFontsPage(p => p+1); }}>
                          {filteredFonts.map(f => <button key={f} onClick={() => { updateLayer(selectedLayer.id, { font_family: f }); loadGoogleFont(f); setFontDropdownOpen(false); setFontSearch(""); }} className={`block w-full px-3 py-1.5 text-left text-xs hover:bg-brand/5 ${selectedLayer.font_family===f?"bg-brand/10 text-brand font-semibold":""}`} style={{ fontFamily: `'${f}',sans-serif` }}>{f}</button>)}
                          {!filteredFonts.length && <p className="px-3 py-4 text-xs text-muted text-center">Sonuç yok</p>}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <div><label className="block text-[10px] font-semibold text-muted mb-1">{selectedLayer.font_size}px</label><input type="range" min={8} max={56} value={selectedLayer.font_size} onChange={e => updateLayer(selectedLayer.id, { font_size: Number(e.target.value) })} className="h-2 w-full cursor-pointer rounded-full bg-zinc-200 accent-brand" /></div>
                    <button onClick={() => updateLayer(selectedLayer.id, { font_weight: selectedLayer.font_weight>=700?400:700 })} className={`rounded-lg border py-1.5 text-xs font-bold transition ${selectedLayer.font_weight>=700?"border-brand bg-brand/5 text-brand":"border-zinc-200 text-zinc-500"}`}>B</button>
                    <button onClick={() => updateLayer(selectedLayer.id, { font_style: selectedLayer.font_style==="italic"?"normal":"italic" })} className={`rounded-lg border py-1.5 text-xs italic transition ${selectedLayer.font_style==="italic"?"border-brand bg-brand/5 text-brand":"border-zinc-200 text-zinc-500"}`}>I</button>
                  </div>
                </div>
                {/* Align */}
                <div className="flex gap-1">{(["left","center","right"] as const).map(a => <button key={a} onClick={() => updateLayer(selectedLayer.id, { text_align: a })} className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition ${selectedLayer.text_align===a?"border-brand bg-brand/5 text-brand":"border-zinc-200 text-zinc-500"}`}>{a==="left"?"◀":a==="center"?"◆":"▶"}</button>)}</div>
                {/* CTA styles */}
                {selectedLayer.type === "cta" && (<div><label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted">🎯 Buton Stili</label><div className="grid grid-cols-4 gap-1">{CTA_STYLES.map(s => <button key={s.id} onClick={() => updateLayer(selectedLayer.id, { bg_color: s.bg_color, border_radius: s.border_radius, padding: s.padding, color: s.color })} className="rounded-lg border border-zinc-200 px-1 py-1.5 text-[9px] font-medium text-zinc-600 hover:border-brand/30 transition text-center">{s.label}</button>)}</div></div>)}
                {/* Position */}
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="block text-[10px] font-semibold text-muted mb-1">X: {selectedLayer.x}%</label><input type="range" min={0} max={80} value={selectedLayer.x} onChange={e => updateLayer(selectedLayer.id, { x: Number(e.target.value) })} className="h-2 w-full cursor-pointer rounded-full bg-zinc-200 accent-brand" /></div>
                  <div><label className="block text-[10px] font-semibold text-muted mb-1">Y: {selectedLayer.y}%</label><input type="range" min={0} max={95} value={selectedLayer.y} onChange={e => updateLayer(selectedLayer.id, { y: Number(e.target.value) })} className="h-2 w-full cursor-pointer rounded-full bg-zinc-200 accent-brand" /></div>
                </div>
                <div><label className="block text-[10px] font-semibold text-muted mb-1">Genişlik: {selectedLayer.max_width}%</label><input type="range" min={15} max={95} value={selectedLayer.max_width} onChange={e => updateLayer(selectedLayer.id, { max_width: Number(e.target.value) })} className="h-2 w-full cursor-pointer rounded-full bg-zinc-200 accent-brand" /></div>
                {/* Color */}
                <div><label className="block text-[10px] font-semibold text-muted mb-1">Renk</label>
                  <div className="flex flex-wrap gap-1.5">{brandColors.map((c,i) => <button key={i} onClick={() => updateLayer(selectedLayer.id, { color: c })} className={`h-6 w-6 rounded-lg border-2 transition-transform hover:scale-110 ${selectedLayer.color===c?"border-brand ring-2 ring-brand/30":"border-zinc-300"}`} style={{ backgroundColor: c }} />)}
                    <label className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 text-[10px] text-muted">+<input type="color" value={selectedLayer.color.startsWith("#")?selectedLayer.color.slice(0,7):"#ffffff"} onChange={e => updateLayer(selectedLayer.id, { color: e.target.value })} className="sr-only" /></label>
                  </div></div>
                {/* BG for badge/cta */}
                {(selectedLayer.type==="badge"||selectedLayer.type==="cta") && <div><label className="block text-[10px] font-semibold text-muted mb-1">Arka Plan</label><div className="flex gap-1 flex-wrap">{[{l:"Koyu",v:"rgba(0,0,0,0.45)"},{l:"Açık",v:"rgba(255,255,255,0.25)"},{l:"Marka",v:brandColors[0]?`${brandColors[0]}cc`:"rgba(233,69,96,0.6)"},{l:"Yok",v:""}].map(c => <button key={c.l} onClick={() => updateLayer(selectedLayer.id, { bg_color: c.v })} className={`rounded-lg border-2 px-2 py-1 text-[10px] font-medium transition ${selectedLayer.bg_color===c.v?"border-brand bg-brand/5 text-brand":"border-zinc-200 text-zinc-500"}`}>{c.l}</button>)}</div></div>}
                {/* Advanced */}
                <div className="border-t border-zinc-100 pt-3 space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">🎛️ Gelişmiş</p>
                  <div><label className="block text-[10px] text-muted mb-1">Opaklık: {Math.round((selectedLayer.opacity??1)*100)}%</label><input type="range" min={10} max={100} value={Math.round((selectedLayer.opacity??1)*100)} onChange={e => updateLayer(selectedLayer.id, { opacity: Number(e.target.value)/100 })} className="h-2 w-full cursor-pointer rounded-full bg-zinc-200 accent-brand" /></div>
                  <div><label className="block text-[10px] text-muted mb-1">Harf Aralığı: {selectedLayer.letter_spacing??0}px</label><input type="range" min={-2} max={10} step={0.5} value={selectedLayer.letter_spacing??0} onChange={e => updateLayer(selectedLayer.id, { letter_spacing: Number(e.target.value) })} className="h-2 w-full cursor-pointer rounded-full bg-zinc-200 accent-brand" /></div>
                  <div><label className="block text-[10px] text-muted mb-1">Dönüşüm</label><div className="flex gap-1">{([["uppercase","AA"],["capitalize","Aa"],["none","ab"]] as const).map(([v,l]) => <button key={v} onClick={() => updateLayer(selectedLayer.id, { text_transform: v })} className={`flex-1 rounded-lg border py-1 text-xs transition ${(selectedLayer.text_transform||"none")===v?"border-brand bg-brand/5 text-brand":"border-zinc-200 text-zinc-500"}`}>{l}</button>)}</div></div>
                  <div><label className="block text-[10px] text-muted mb-1">Döndürme: {selectedLayer.rotation??0}°</label><input type="range" min={-15} max={15} step={1} value={selectedLayer.rotation??0} onChange={e => updateLayer(selectedLayer.id, { rotation: Number(e.target.value) })} className="h-2 w-full cursor-pointer rounded-full bg-zinc-200 accent-brand" /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => updateLayer(selectedLayer.id, { text_shadow: !selectedLayer.text_shadow })} className={`rounded-lg border py-1.5 text-[10px] font-medium transition ${selectedLayer.text_shadow?"border-brand bg-brand/5 text-brand":"border-zinc-200 text-zinc-500"}`}>{selectedLayer.text_shadow?"Gölge ✓":"Gölge"}</button>
                    <div><label className="block text-[10px] text-muted mb-1">Satır: {(selectedLayer.line_height??1.3).toFixed(1)}</label><input type="range" min={0.8} max={2} step={0.1} value={selectedLayer.line_height??1.3} onChange={e => updateLayer(selectedLayer.id, { line_height: Number(e.target.value) })} className="h-2 w-full cursor-pointer rounded-full bg-zinc-200 accent-brand" /></div>
                  </div>
                  <div className="flex gap-1 pt-1">
                    <button onClick={() => { const d = { ...selectedLayer, id: `${selectedLayer.type}_${Date.now()}`, x: selectedLayer.x+3, y: selectedLayer.y+3 }; setLayers(p => [...p,d]); setSelectedLayerId(d.id); }} className="flex-1 rounded-lg border border-zinc-200 py-1.5 text-[10px] font-medium text-zinc-600 hover:bg-zinc-50">📋 Çoğalt</button>
                    <button onClick={() => setLayers(p => { const i = p.findIndex(l => l.id===selectedLayer.id); if (i<=0) return p; const a = [...p]; [a[i-1],a[i]]=[a[i],a[i-1]]; return a; })} className="rounded-lg border border-zinc-200 px-2 py-1.5 text-[10px] text-zinc-600 hover:bg-zinc-50">↑</button>
                    <button onClick={() => setLayers(p => { const i = p.findIndex(l => l.id===selectedLayer.id); if (i>=p.length-1) return p; const a = [...p]; [a[i],a[i+1]]=[a[i+1],a[i]]; return a; })} className="rounded-lg border border-zinc-200 px-2 py-1.5 text-[10px] text-zinc-600 hover:bg-zinc-50">↓</button>
                    <button onClick={() => removeLayer(selectedLayer.id)} className="rounded-lg border border-red-200 bg-red-50 text-red-600 px-2 py-1.5 text-[10px] font-medium hover:bg-red-100 transition">SİL</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full bg-zinc-50/50">
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 text-zinc-500">
                  <div className="p-4 bg-white shadow-sm border border-zinc-200 text-2xl rounded-full mb-2">🖱️</div>
                  <p className="text-sm font-medium text-zinc-700">Tasarım hazır!</p>
                  <p className="text-xs">Detaylı düzenleme yapmak için görsel üzerindeki metinlere tıklayabilirsiniz.</p>
                </div>
                {/* Global Settings */}
                <div className="p-4 border-t border-zinc-200 bg-white space-y-4 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] flex-shrink-0">
                   <h3 className="text-sm font-bold text-zinc-800">📸 Çerçeve Ayarları</h3>
                   
                   <div>
                     <div className="flex items-center justify-between mb-2">
                       <label className="text-xs font-semibold text-zinc-600">Logo Gösterimi</label>
                       <label className="relative inline-flex cursor-pointer items-center"><input type="checkbox" checked={logoEnabled} onChange={e => setLogoEnabled(e.target.checked)} className="peer sr-only" /><div className="h-5 w-9 rounded-full bg-zinc-200 transition peer-checked:bg-brand after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full" /></label>
                     </div>
                     {logoEnabled && (
                       <div className="pl-1">
                         <div className="flex justify-between items-end mb-1">
                           <span className="text-[10px] uppercase text-zinc-500 font-bold">Logo Büyüklüğü</span>
                           <span className="text-[10px] text-zinc-500">{logoWidth}px</span>
                         </div>
                         <input type="range" min={24} max={250} value={logoWidth} onChange={e => setLogoWidth(Number(e.target.value))} className="h-2 w-full cursor-pointer rounded-full bg-zinc-200 accent-brand" />
                       </div>
                     )}
                   </div>

                   <div className="pt-2 border-t border-zinc-100">
                     <div className="flex justify-between items-end mb-1">
                       <span className="text-[10px] uppercase text-zinc-500 font-bold">Genel Karartma (Overlay)</span>
                       <span className="text-[10px] text-zinc-500">{Math.round(gradientOpacity * 100)}%</span>
                     </div>
                     <input type="range" min={0} max={90} value={Math.round(gradientOpacity * 100)} onChange={e => setGradientOpacity(Number(e.target.value)/100)} className="h-2 w-full cursor-pointer rounded-full bg-zinc-200 accent-brand" />
                   </div>
                </div>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full space-y-4 p-6 text-center text-zinc-400">
              <div className="p-4 bg-zinc-50 rounded-full text-2xl">{generating ? "✨" : "🖼️"}</div>
              <p className="text-sm font-medium">{generating ? "Tasarım hazırlanıyor..." : "Görsel bekleniyor"}</p>
            </div>
          )}
        </div>
      </div>

      {generating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md card overflow-hidden p-6 text-center">
            <div className="mb-4 flex justify-center"><div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-brand to-brand-dark shadow-lg shadow-brand/30 flex items-center justify-center animate-pulse-ring"><span className="text-3xl">🎨</span></div></div>
            <h3 className="mb-1 text-lg font-semibold">AI Tasarım Hazırlanıyor</h3>
            <p className="mb-2 text-sm text-muted">{IMAGE_STYLES.find(s => s.value===imageStyle)?.label}</p>
            <div className="mx-auto h-1.5 w-48 overflow-hidden rounded-full bg-zinc-100"><div className="h-full rounded-full bg-gradient-to-r from-brand to-brand-light" style={{ animation: "shimmer 2s ease-in-out infinite", backgroundSize: "200% 100%", width: "100%" }} /></div>
            <p className="mt-4 text-xs text-muted">15-30 saniye sürebilir…</p>
          </div>
        </div>
      )}
    </div>
  );
}
