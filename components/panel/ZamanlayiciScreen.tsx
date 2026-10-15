"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

// ── Types ─────────────────────────────────────
type PendingItem = {
  id: number;
  type: "idea" | "post";
  title: string;
  content: string;
  platform: string;
  format: string;
  image_url: string;
  suggested_time: string;
  created_at: string;
};

type ScheduleItem = {
  id: number;
  post_id: number | null;
  idea_id: number | null;
  company_id: number;
  title: string;
  content: string;
  platform: string;
  image_url: string;
  post_status: string;
  status: string;
  scheduled_at: string;
  source_type: string;
};

// ── Constants ─────────────────────────────────
const DAYS_TR = ["PZT", "SAL", "ÇAR", "PER", "CUM", "CMT", "PAZ"];
const MONTHS_TR = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

const PLATFORM_ICONS: Record<string, string> = {
  instagram: "📸", tiktok: "🎵", linkedin: "💼", twitter: "🐦",
  facebook: "📘", youtube: "▶️", website: "🌐",
  Instagram: "📸", TikTok: "🎵", LinkedIn: "💼", "X (Twitter)": "🐦",
  Facebook: "📘", YouTube: "▶️", Website: "🌐",
};

const PILL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  instagram: { bg: "#dcfce7", text: "#16a34a", border: "#86efac" },
  tiktok: { bg: "#fef3c7", text: "#d97706", border: "#fcd34d" },
  linkedin: { bg: "#dbeafe", text: "#2563eb", border: "#93c5fd" },
  twitter: { bg: "#e0f2fe", text: "#0284c7", border: "#7dd3fc" },
  facebook: { bg: "#dbeafe", text: "#1d4ed8", border: "#93c5fd" },
  youtube: { bg: "#fee2e2", text: "#dc2626", border: "#fca5a5" },
};

const AUDIENCE_HOURS = [
  { time: "19:00", pct: 91, label: "En iyi" },
  { time: "21:00", pct: 74, label: "" },
  { time: "13:00", pct: 63, label: "" },
  { time: "09:00", pct: 54, label: "" },
];

// ── Helpers ───────────────────────────────────
function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  let startDayOfWeek = firstDay.getDay(); // 0=Sun
  startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // convert to Mon=0

  const days: { date: Date; isCurrentMonth: boolean }[] = [];

  // Previous month trailing days
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push({ date: d, isCurrentMonth: false });
  }

  // Current month days
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push({ date: new Date(year, month, i), isCurrentMonth: true });
  }

  // Fill remaining cells to complete the grid (6 rows * 7 cols = 42)
  while (days.length < 42) {
    const nextDate = new Date(year, month + 1, days.length - lastDay.getDate() - startDayOfWeek + 1);
    days.push({ date: nextDate, isCurrentMonth: false });
  }

  // If last row is all next month, trim to 35
  if (days.length > 35) {
    const lastRow = days.slice(35);
    if (lastRow.every((d) => !d.isCurrentMonth)) {
      days.splice(35);
    }
  }

  return days;
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDayOfWeek(d: Date) {
  const days = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
  return days[d.getDay()];
}

// ── Draggable Card ────────────────────────────
function DraggableCard({
  item,
  index,
  isSelected,
  onClick,
}: {
  item: PendingItem;
  index: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `pending-${item.type}-${item.id}`,
    data: { item },
  });

  const platformKey = item.platform.toLowerCase();
  const icon = PLATFORM_ICONS[item.platform] || PLATFORM_ICONS[platformKey] || "📝";

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`group relative flex items-start gap-3 rounded-xl border p-3 cursor-grab active:cursor-grabbing transition-all duration-200 ${
        isDragging ? "opacity-30 scale-95" : "hover:shadow-md hover:border-zinc-300"
      } ${isSelected ? "border-[#E73932] bg-[#FFF5F3] ring-2 ring-[#E73932]/10" : "border-zinc-200 bg-white"}`}
    >
      {/* Number badge */}
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-bold text-white">
        {index + 1}
      </div>

      {/* Image preview */}
      {item.image_url ? (
        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-100">
          <img
            src={item.image_url.startsWith("/") ? `${process.env.NEXT_PUBLIC_API_URL}${item.image_url}` : item.image_url}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-zinc-100 to-zinc-50 text-lg">
          {icon}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[13px] font-semibold text-foreground truncate">{item.title || "İsimsiz İçerik"}</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted">
          <span>{item.format}</span>
          <span>•</span>
          <span className="flex items-center gap-0.5">{icon} {item.platform}</span>
        </div>
      </div>

      {/* Time suggestion */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-[13px] font-bold text-foreground">{item.suggested_time}</span>
        <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-600">
          AI önerisi
        </span>
      </div>
    </div>
  );
}

// ── Droppable Day Cell ────────────────────────
function DroppableDay({
  dateObj,
  isCurrentMonth,
  isToday,
  pills,
  onPillClick,
}: {
  dateObj: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  pills: ScheduleItem[];
  onPillClick: (item: ScheduleItem) => void;
}) {
  const key = dateKey(dateObj);
  const { isOver, setNodeRef } = useDroppable({ id: `day-${key}` });

  return (
    <div
      ref={setNodeRef}
      className={`relative min-h-[100px] border-b border-r p-1.5 transition-colors duration-150 ${
        !isCurrentMonth ? "bg-zinc-50/50" : "bg-white"
      } ${isOver ? "bg-[#FFF5F3] ring-2 ring-inset ring-[#E73932]/30" : ""} ${
        isToday ? "bg-orange-50/60" : ""
      }`}
    >
      <span
        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-semibold ${
          isToday ? "bg-[#E73932] text-white" : isCurrentMonth ? "text-foreground" : "text-zinc-300"
        }`}
      >
        {dateObj.getDate()}
      </span>

      {/* Pills */}
      <div className="mt-0.5 space-y-[3px]">
        {pills.slice(0, 3).map((pill) => {
          const colors = PILL_COLORS[pill.platform.toLowerCase()] || { bg: "#f4f4f5", text: "#52525b", border: "#d4d4d8" };
          return (
            <button
              key={pill.id}
              onClick={(e) => { e.stopPropagation(); onPillClick(pill); }}
              className="flex w-full items-center gap-1 rounded-md px-1.5 py-[2px] text-[10px] font-semibold truncate transition hover:brightness-95"
              style={{ backgroundColor: colors.bg, color: colors.text, borderLeft: `3px solid ${colors.border}` }}
            >
              <span className="flex-shrink-0">{PLATFORM_ICONS[pill.platform] || "📝"}</span>
              <span className="truncate">{pill.title}</span>
              <span className="ml-auto flex-shrink-0 text-[9px] opacity-70">
                {new Date(pill.scheduled_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </button>
          );
        })}
        {pills.length > 3 && (
          <span className="block text-center text-[9px] font-bold text-[#E73932]">+{pills.length - 3} daha</span>
        )}
      </div>
    </div>
  );
}

// ── Drag Overlay Card ─────────────────────────
function DragOverlayCard({ item }: { item: PendingItem }) {
  const icon = PLATFORM_ICONS[item.platform] || "📝";
  return (
    <div className="flex items-center gap-2 rounded-xl border-2 border-[#E73932] bg-white p-3 shadow-2xl w-[260px]">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#FFF5F3] text-lg">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-foreground truncate">{item.title}</p>
        <p className="text-[10px] text-muted">{item.platform} • {item.format}</p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════
export default function ZamanlayiciScreen({ initialPostId }: { initialPostId?: number } = {}) {
  const { activeCompany } = useAuth();
  const today = new Date();

  // ── State ───────────────────────────────────
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loadingPending, setLoadingPending] = useState(true);
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [selectedItem, setSelectedItem] = useState<PendingItem | ScheduleItem | null>(null);
  const [selectedType, setSelectedType] = useState<"pending" | "schedule" | null>(null);
  const [draggedItem, setDraggedItem] = useState<PendingItem | null>(null);
  const [viewMode, setViewMode] = useState<"Hafta" | "Ay">("Ay");

  // ── Detail panel state ──────────────────────
  const [detailDate, setDetailDate] = useState("");
  const [detailTime, setDetailTime] = useState("19:00");
  const [detailPlatforms, setDetailPlatforms] = useState<Record<string, boolean>>({
    instagram: true,
    tiktok: false,
  });
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // ── DnD sensors ─────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // ── Fetch pending ───────────────────────────
  const fetchPending = useCallback(() => {
    if (!activeCompany) return;
    setLoadingPending(true);
    api
      .get(`/api/protected/pending-contents?company_id=${activeCompany.id}`)
      .then(({ data }) => setPendingItems(data.items || []))
      .catch(() => setPendingItems([]))
      .finally(() => setLoadingPending(false));
  }, [activeCompany]);

  // ── Fetch schedules ─────────────────────────
  const fetchSchedules = useCallback(() => {
    if (!activeCompany) return;
    setLoadingSchedules(true);
    api
      .get(`/api/protected/schedules?company_id=${activeCompany.id}&month=${currentMonth + 1}&year=${currentYear}`)
      .then(({ data }) => setSchedules(data.schedules || []))
      .catch(() => setSchedules([]))
      .finally(() => setLoadingSchedules(false));
  }, [activeCompany, currentMonth, currentYear]);

  useEffect(() => { fetchPending(); }, [fetchPending]);
  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  // ── Calendar days ───────────────────────────
  const calendarDays = useMemo(() => getCalendarDays(currentYear, currentMonth), [currentYear, currentMonth]);

  // ── Schedule map by date ────────────────────
  const schedulesByDate = useMemo(() => {
    const map: Record<string, ScheduleItem[]> = {};
    for (const s of schedules) {
      const d = new Date(s.scheduled_at);
      const key = dateKey(d);
      if (!map[key]) map[key] = [];
      map[key].push(s);
    }
    return map;
  }, [schedules]);

  // ── Drag handlers ──────────────────────────
  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as { item: PendingItem } | undefined;
    if (data?.item) setDraggedItem(data.item);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setDraggedItem(null);
    const { active, over } = event;
    if (!over) return;

    const droppedId = String(over.id);
    if (!droppedId.startsWith("day-")) return;

    const dateStr = droppedId.replace("day-", "");
    const data = active.data.current as { item: PendingItem } | undefined;
    if (!data?.item) return;

    const item = data.item;

    // Direkt kaydet — onay beklemeden
    const scheduledAt = new Date(`${dateStr}T19:00:00`).toISOString();
    const body: Record<string, unknown> = {
      scheduled_at: scheduledAt,
      platforms: [item.platform.toLowerCase() || "instagram"],
    };
    if (item.type === "post") body.post_id = item.id;
    else body.idea_id = item.id;

    try {
      await api.post("/api/protected/schedules", body);
      // Başarılı — listeyi yenile
      fetchSchedules();
      fetchPending();
      // Detail panel'i bu içerikle aç (düzenleme için)
      setSelectedItem(item);
      setSelectedType("pending");
      setDetailDate(dateStr);
      setDetailTime("19:00");
      setSaveResult({ type: "success", msg: "İçerik takvime eklendi!" });
      setTimeout(() => setSaveResult(null), 2000);
    } catch {
      setSaveResult({ type: "error", msg: "Kayıt başarısız" });
      setTimeout(() => setSaveResult(null), 2000);
    }
  };

  // ── Navigate month ──────────────────────────
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const goToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  // ── Save schedule ───────────────────────────
  const handleSave = async () => {
    if (!selectedItem || !detailDate) return;
    setSaving(true);
    setSaveResult(null);

    const platforms = Object.entries(detailPlatforms)
      .filter(([, val]) => val)
      .map(([key]) => key);
    if (platforms.length === 0) {
      setSaveResult({ type: "error", msg: "En az bir platform seçin" });
      setSaving(false);
      return;
    }

    const scheduledAt = new Date(`${detailDate}T${detailTime}:00`).toISOString();

    const body: Record<string, unknown> = {
      scheduled_at: scheduledAt,
      platforms,
    };

    if (selectedType === "pending") {
      const pending = selectedItem as PendingItem;
      if (pending.type === "post") body.post_id = pending.id;
      else body.idea_id = pending.id;
    } else if (selectedType === "schedule") {
      // Editing existing schedule — use update endpoint instead
      const sched = selectedItem as ScheduleItem;
      try {
        await api.post("/api/protected/schedules/update", {
          schedule_id: sched.id,
          scheduled_at: scheduledAt,
        });
        setSaveResult({ type: "success", msg: "Zamanlama güncellendi!" });
        fetchSchedules();
        fetchPending();
        setTimeout(() => {
          setSelectedItem(null);
          setSelectedType(null);
          setSaveResult(null);
        }, 1200);
      } catch {
        setSaveResult({ type: "error", msg: "Güncelleme başarısız" });
      } finally {
        setSaving(false);
      }
      return;
    }

    try {
      await api.post("/api/protected/schedules", body);
      setSaveResult({ type: "success", msg: "İçerik takvime eklendi!" });
      fetchSchedules();
      fetchPending();
      setTimeout(() => {
        setSelectedItem(null);
        setSelectedType(null);
        setSaveResult(null);
      }, 1200);
    } catch {
      setSaveResult({ type: "error", msg: "Kayıt başarısız oldu" });
    } finally {
      setSaving(false);
    }
  };

  // ── Select a pill from calendar ─────────────
  const handlePillClick = (item: ScheduleItem) => {
    setSelectedItem(item);
    setSelectedType("schedule");
    const d = new Date(item.scheduled_at);
    setDetailDate(dateKey(d));
    setDetailTime(d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }));
    setDetailPlatforms({ instagram: item.platform.toLowerCase() === "instagram", tiktok: item.platform.toLowerCase() === "tiktok" });
    setSaveResult(null);
  };

  // ── Select a pending item from sidebar ──────
  const handlePendingClick = (item: PendingItem) => {
    setSelectedItem(item);
    setSelectedType("pending");
    setDetailDate("");
    setDetailTime(item.suggested_time || "19:00");
    setSaveResult(null);
  };

  // ── Helper to get title from selected ───────
  // Stüdyodan "Zamanla" ile gelindiyse o gönderiyi seçili aç
  const [autoSelectedId, setAutoSelectedId] = useState<number | undefined>();
  useEffect(() => {
    if (!initialPostId || autoSelectedId === initialPostId || loadingPending) return;
    const item = pendingItems.find(p => p.type === "post" && p.id === initialPostId);
    if (item) handlePendingClick(item);
    setAutoSelectedId(initialPostId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPostId, pendingItems, loadingPending]);

  const getSelectedTitle = () => {
    if (!selectedItem) return "";
    if (selectedType === "pending") return (selectedItem as PendingItem).title;
    return (selectedItem as ScheduleItem).title;
  };

  const getSelectedImage = () => {
    if (!selectedItem) return "";
    if (selectedType === "pending") return (selectedItem as PendingItem).image_url;
    return (selectedItem as ScheduleItem).image_url;
  };

  const pendingCount = pendingItems.length;
  const scheduledCount = schedules.length;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-full -m-4 md:-m-6 lg:-m-8">
        {/* ═══ Top Toolbar ═══ */}
        <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-2.5 flex-shrink-0">
          {/* Left nav links */}
          <div className="flex items-center gap-6 text-[13px] text-muted">
            <span className="text-foreground font-semibold cursor-pointer border-b-2 border-[#E73932] pb-1">Zamanlama Ayarla</span>
          </div>

          {/* Center info */}
          <div className="flex items-center gap-3">
            {pendingCount > 0 && (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {pendingCount} içerik zamanlamaya hazır
              </span>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-[12px] font-medium text-foreground transition hover:bg-zinc-50">
              Taslak Kaydet
            </button>
            <button className="rounded-lg bg-[#E73932] px-4 py-1.5 text-[12px] font-semibold text-white shadow-sm shadow-[#E73932]/20 transition hover:bg-[#d32f2f] hover:shadow-md flex items-center gap-1.5">
              Tümünü Zamanla →
            </button>
          </div>
        </div>

        {/* ═══ Main 3-Column Layout ═══ */}
        <div className="flex flex-1 overflow-hidden">
          {/* ──── LEFT SIDEBAR: Pending Contents ──── */}
          <div className="w-[280px] flex-shrink-0 border-r border-zinc-200 bg-white flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-4 pt-4 pb-3 border-b border-zinc-100">
              <h2 className="text-[14px] font-bold text-foreground">Kampanya İçerikleri</h2>
              <p className="text-[11px] text-muted mt-0.5">Bir içeriğe tıkla, zamanlamasını düzenle</p>
            </div>

            {/* AI suggestion card */}
            <div className="mx-3 mt-3 rounded-xl bg-zinc-50 border border-zinc-200 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-[11px] font-semibold text-foreground leading-tight">
                    AI tüm zamanlama onaylarınızı ayarladık.
                  </p>
                  <p className="text-[10px] text-muted mt-1 leading-snug">
                    Kitleniz 19:00'da en aktif. Sadece onayla veya istediğini değiştir.
                  </p>
                </div>
                <button className="flex-shrink-0 rounded-lg bg-emerald-500 px-2.5 py-1.5 text-[10px] font-bold text-white transition hover:bg-emerald-600">
                  Tümünü Onayla
                </button>
              </div>
            </div>

            {/* Pending items list */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 sidebar-nav">
              {loadingPending ? (
                <div className="flex justify-center py-10">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-[#E73932]" />
                </div>
              ) : pendingItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <span className="text-3xl mb-2 opacity-30">📋</span>
                  <p className="text-[12px] font-medium text-foreground">Tüm içerikler planlandı!</p>
                  <p className="text-[10px] text-muted mt-1">Yeni içerik oluşturarak planlama yapabilirsiniz</p>
                </div>
              ) : (
                pendingItems.map((item, i) => (
                  <DraggableCard
                    key={`${item.type}-${item.id}`}
                    item={item}
                    index={i}
                    isSelected={
                      selectedType === "pending" &&
                      selectedItem !== null &&
                      (selectedItem as PendingItem).id === item.id &&
                      (selectedItem as PendingItem).type === item.type
                    }
                    onClick={() => handlePendingClick(item)}
                  />
                ))
              )}
            </div>
          </div>

          {/* ──── CENTER: Calendar Grid ──── */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            {/* Calendar toolbar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100">
              {/* Month nav */}
              <div className="flex items-center gap-3">
                <h2 className="text-[18px] font-bold text-foreground">
                  {MONTHS_TR[currentMonth]} {currentYear}
                </h2>
                <div className="flex items-center gap-1">
                  <button onClick={prevMonth} className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 text-sm transition hover:bg-zinc-50">←</button>
                  <button onClick={goToday} className="rounded-lg border border-zinc-200 px-2.5 py-1 text-[11px] font-semibold text-foreground transition hover:bg-zinc-50">Bugün</button>
                  <button onClick={nextMonth} className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 text-sm transition hover:bg-zinc-50">→</button>
                </div>
              </div>

              {/* View toggle */}
              <div className="flex rounded-lg border border-zinc-200 overflow-hidden">
                {(["Hafta", "Ay"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setViewMode(v)}
                    className={`px-3 py-1 text-[11px] font-semibold transition ${
                      viewMode === v ? "bg-zinc-900 text-white" : "bg-white text-zinc-500 hover:bg-zinc-50"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50/50">
              {DAYS_TR.map((d) => (
                <div key={d} className="border-r last:border-r-0 px-2 py-2 text-center text-[11px] font-bold uppercase tracking-wider text-muted">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-7">
                {calendarDays.map(({ date, isCurrentMonth }) => {
                  const key = dateKey(date);
                  const isToday =
                    date.getDate() === today.getDate() &&
                    date.getMonth() === today.getMonth() &&
                    date.getFullYear() === today.getFullYear();
                  const pills = schedulesByDate[key] || [];

                  return (
                    <DroppableDay
                      key={key}
                      dateObj={date}
                      isCurrentMonth={isCurrentMonth}
                      isToday={isToday}
                      pills={pills}
                      onPillClick={handlePillClick}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* ──── RIGHT SIDEBAR: Detail Panel ──── */}
          <div
            className={`w-[320px] flex-shrink-0 border-l border-zinc-200 bg-white flex flex-col overflow-hidden transition-all duration-300 ${
              selectedItem ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0 pointer-events-none"
            }`}
          >
            {selectedItem && (
              <>
                {/* Close button */}
                <div className="flex items-center justify-between px-4 pt-3 pb-2">
                  <h3 className="text-[14px] font-bold text-foreground truncate">
                    {getSelectedTitle() ? `İçerik — ${getSelectedTitle()}` : "İçerik Detayları"}
                  </h3>
                  <button
                    onClick={() => { setSelectedItem(null); setSelectedType(null); }}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-muted transition hover:bg-zinc-100 hover:text-foreground text-sm"
                  >
                    ✕
                  </button>
                </div>

                {/* Image preview */}
                <div className="mx-4 h-[180px] rounded-xl overflow-hidden bg-gradient-to-br from-zinc-100 to-zinc-50 flex items-center justify-center">
                  {getSelectedImage() ? (
                    <img
                      src={
                        getSelectedImage().startsWith("/")
                          ? `${process.env.NEXT_PUBLIC_API_URL}${getSelectedImage()}`
                          : getSelectedImage()
                      }
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="text-center">
                      <span className="text-4xl opacity-20">🖼️</span>
                      <p className="text-[10px] text-muted mt-1">Görsel henüz üretilmedi</p>
                    </div>
                  )}
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 sidebar-nav">
                  {/* ── Date & Time ── */}
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2.5">TARİH & SAAT</h4>
                    <div className="space-y-2">
                      {/* Date */}
                      <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2.5">
                        <div className="flex items-center gap-2 text-[13px]">
                          <span>📅</span>
                          <span className="font-medium text-foreground">Tarih</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {detailDate ? (
                            <span className="text-[12px] font-semibold text-foreground">
                              {(() => {
                                const d = new Date(detailDate + "T00:00:00");
                                return `${formatDayOfWeek(d)}, ${d.getDate()} ${MONTHS_TR[d.getMonth()]}`;
                              })()}
                            </span>
                          ) : (
                            <span className="text-[12px] text-muted">Seçilmedi</span>
                          )}
                          <input
                            type="date"
                            value={detailDate}
                            onChange={(e) => setDetailDate(e.target.value)}
                            className="absolute opacity-0 w-0 h-0"
                            id="detail-date-input"
                          />
                          <label
                            htmlFor="detail-date-input"
                            className="cursor-pointer text-[11px] font-semibold text-[#E73932] hover:underline"
                          >
                            Değiştir
                          </label>
                        </div>
                      </div>

                      {/* Time */}
                      <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2.5">
                        <div className="flex items-center gap-2 text-[13px]">
                          <span>🕐</span>
                          <span className="font-medium text-foreground">Saat</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-semibold text-foreground">{detailTime}</span>
                          <input
                            type="time"
                            value={detailTime}
                            onChange={(e) => setDetailTime(e.target.value)}
                            className="absolute opacity-0 w-0 h-0"
                            id="detail-time-input"
                          />
                          <label
                            htmlFor="detail-time-input"
                            className="cursor-pointer text-[11px] font-semibold text-[#E73932] hover:underline"
                          >
                            Değiştir
                          </label>
                        </div>
                      </div>

                      {/* Repeat */}
                      <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2.5">
                        <div className="flex items-center gap-2 text-[13px]">
                          <span>🔄</span>
                          <span className="font-medium text-foreground">Tekrar</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-semibold text-foreground">Bir kez</span>
                          <span className="text-[11px] font-semibold text-[#E73932] cursor-pointer hover:underline">Değiştir</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Analytics ── */}
                  <div className="rounded-xl border border-zinc-200 p-3">
                    <p className="text-[12px] font-semibold text-foreground mb-3">Kitleniz bu saatlerde en aktif</p>
                    <div className="space-y-2.5">
                      {AUDIENCE_HOURS.map((h) => (
                        <div key={h.time} className="flex items-center gap-2">
                          <span className="w-[40px] text-[12px] font-bold text-foreground">{h.time}</span>
                          <div className="flex-1 h-[8px] rounded-full bg-zinc-100 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${h.pct}%`,
                                background: h.pct > 80 ? "#E73932" : "#22c55e",
                              }}
                            />
                          </div>
                          <span className="text-[11px] font-semibold text-muted w-[40px] text-right">
                            %{h.pct}
                          </span>
                          {h.label && (
                            <span className="rounded bg-[#FFF5F3] px-1.5 py-0.5 text-[9px] font-bold text-[#E73932]">
                              {h.label}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Platform Switches ── */}
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2.5">PLATFORM</h4>
                    <div className="space-y-2">
                      {/* Instagram */}
                      <div
                        className={`flex items-center justify-between rounded-xl border-2 p-3 transition-all cursor-pointer ${
                          detailPlatforms.instagram ? "border-[#E73932] bg-[#FFF5F3]" : "border-zinc-200 bg-white"
                        }`}
                        onClick={() => setDetailPlatforms((p) => ({ ...p, instagram: !p.instagram }))}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">📸</span>
                          <div>
                            <p className="text-[13px] font-semibold text-foreground">Instagram</p>
                            <p className="text-[10px] text-muted">@markaadi</p>
                          </div>
                        </div>
                        <div
                          className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${
                            detailPlatforms.instagram ? "bg-[#E73932]" : "bg-zinc-300"
                          }`}
                        >
                          <div
                            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                              detailPlatforms.instagram ? "translate-x-[22px]" : "translate-x-0.5"
                            }`}
                          />
                        </div>
                      </div>

                      {/* TikTok */}
                      <div
                        className={`flex items-center justify-between rounded-xl border-2 p-3 transition-all cursor-pointer ${
                          detailPlatforms.tiktok ? "border-[#E73932] bg-[#FFF5F3]" : "border-zinc-200 bg-white"
                        }`}
                        onClick={() => setDetailPlatforms((p) => ({ ...p, tiktok: !p.tiktok }))}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">🎵</span>
                          <div>
                            <p className="text-[13px] font-semibold text-foreground">TikTok</p>
                            <p className="text-[10px] text-muted">@markaadi</p>
                          </div>
                        </div>
                        <div
                          className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${
                            detailPlatforms.tiktok ? "bg-[#E73932]" : "bg-zinc-300"
                          }`}
                        >
                          <div
                            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                              detailPlatforms.tiktok ? "translate-x-[22px]" : "translate-x-0.5"
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Bottom Actions ── */}
                <div className="px-4 pb-4 pt-2 space-y-2 flex-shrink-0 border-t border-zinc-100">
                  {saveResult && (
                    <div
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-medium ${
                        saveResult.type === "success"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {saveResult.type === "success" ? "✅" : "⚠️"} {saveResult.msg}
                    </div>
                  )}

                  <button
                    onClick={handleSave}
                    disabled={saving || !detailDate || saveResult?.type === "success"}
                    className="w-full rounded-xl bg-[#E73932] py-3 text-[13px] font-bold text-white shadow-sm shadow-[#E73932]/20 transition hover:bg-[#d32f2f] hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <span className="spinner" style={{ width: 16, height: 16 }} /> Kaydediliyor...
                      </>
                    ) : saveResult?.type === "success" ? (
                      "✅ Kaydedildi"
                    ) : (
                      "✓ Bu İçeriği Kaydet"
                    )}
                  </button>

                  <button className="w-full rounded-xl bg-zinc-900 py-3 text-[13px] font-bold text-white transition hover:bg-zinc-800 flex items-center justify-center gap-2">
                    📦 Tüm Kampanyayı Zamanla →
                  </button>
                </div>
              </>
            )}

            {/* Empty state when nothing selected */}
            {!selectedItem && (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                <span className="text-4xl opacity-20 mb-3">👆</span>
                <p className="text-[13px] font-semibold text-foreground">İçerik Seçin</p>
                <p className="text-[11px] text-muted mt-1 leading-relaxed">
                  Sol taraftan bir içeriğe tıklayın veya takvime sürükleyin
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Drag Overlay ── */}
      <DragOverlay>
        {draggedItem ? <DragOverlayCard item={draggedItem} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
