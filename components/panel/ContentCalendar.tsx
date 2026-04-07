"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  dateFnsLocalizer,
  Views,
} from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { tr } from "date-fns/locale/tr";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

// ── Localizer ─────────────────────────────────
const locales = { tr };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

// ── Drag-and-drop wrapper ─────────────────────
const DnDCalendar = withDragAndDrop(Calendar);

// ── Constants ─────────────────────────────────
const PLATFORM_ICONS: Record<string, string> = {
  Instagram: "📸", TikTok: "🎵", LinkedIn: "💼", "X (Twitter)": "🐦",
  Facebook: "📘", YouTube: "▶️", Website: "🌐",
};

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  draft:    { bg: "#f4f4f5", border: "#d4d4d8", text: "#52525b" },
  approved: { bg: "#dbeafe", border: "#93c5fd", text: "#1d4ed8" },
  ready:    { bg: "#dcfce7", border: "#86efac", text: "#16a34a" },
  planned:  { bg: "#dcfce7", border: "#86efac", text: "#16a34a" },
  published:{ bg: "#f0fdf4", border: "#4ade80", text: "#15803d" },
};

const PLATFORM_OPTIONS = ["Tümü", "Instagram", "TikTok", "LinkedIn", "X (Twitter)", "Facebook", "YouTube", "Website"];

// ── Types ─────────────────────────────────────
type ScheduleData = {
  id: number;
  post_id: number;
  company_id: number;
  title: string;
  content: string;
  platform: string;
  image_url: string;
  post_status: string;
  status: string;
  scheduled_at: string;
};

type CalEvent = {
  id: number;
  scheduleId: number;
  postId: number;
  title: string;
  content: string;
  platform: string;
  imageUrl: string;
  postStatus: string;
  start: Date;
  end: Date;
};

// ──────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────
export default function ContentCalendar({
  onOpenStudio,
}: {
  onOpenStudio?: (postId: number) => void;
}) {
  const { activeCompany } = useAuth();
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [platformFilter, setPlatformFilter] = useState("Tümü");
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);
  const [popoverPos, setPopoverPos] = useState({ x: 0, y: 0 });

  // ── Fetch ───────────────────────────────────
  const fetchSchedules = useCallback(() => {
    if (!activeCompany) return;
    setLoading(true);
    api.get(`/api/protected/schedules?company_id=${activeCompany.id}`)
      .then(({ data }) => {
        const items: CalEvent[] = (data.schedules || []).map((s: ScheduleData) => ({
          id: s.id,
          scheduleId: s.id,
          postId: s.post_id,
          title: s.title || "İsimsiz İçerik",
          content: s.content,
          platform: s.platform,
          imageUrl: s.image_url,
          postStatus: s.post_status || s.status,
          start: new Date(s.scheduled_at),
          end: new Date(s.scheduled_at),
        }));
        setEvents(items);
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [activeCompany]);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  // ── Filtered events ─────────────────────────
  const filtered = platformFilter === "Tümü"
    ? events
    : events.filter((e) => e.platform === platformFilter);

  // ── Drag & drop handler ─────────────────────
  const handleEventDrop = useCallback(
    async ({ event, start }: { event: CalEvent; start: Date }) => {
      // Optimistic update
      setEvents((prev) =>
        prev.map((e) => (e.id === event.id ? { ...e, start, end: start } : e))
      );
      try {
        await api.post("/api/protected/schedules/update", {
          schedule_id: event.scheduleId,
          scheduled_at: start.toISOString(),
        });
      } catch {
        // Revert on error
        fetchSchedules();
      }
    },
    [fetchSchedules],
  );

  // ── Delete handler ──────────────────────────
  const handleDelete = useCallback(
    async (scheduleId: number) => {
      try {
        await api.delete(`/api/protected/schedules/${scheduleId}`);
        setEvents((prev) => prev.filter((e) => e.scheduleId !== scheduleId));
        setSelectedEvent(null);
      } catch { /* ignore */ }
    },
    [],
  );

  // ── Event click (popover) ───────────────────
  const handleSelectEvent = useCallback(
    (event: CalEvent, e: React.SyntheticEvent) => {
      const target = e.target as HTMLElement;
      const rect = target.getBoundingClientRect();
      setPopoverPos({ x: rect.left + rect.width / 2, y: rect.top });
      setSelectedEvent(event);
    },
    [],
  );

  // ── Custom event component ──────────────────
  const EventComponent = ({ event }: { event: CalEvent }) => {
    const icon = PLATFORM_ICONS[event.platform] || "📝";
    const colors = STATUS_COLORS[event.postStatus] || STATUS_COLORS.draft;
    return (
      <div
        className="flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[11px] font-medium leading-tight truncate"
        style={{ backgroundColor: colors.bg, borderLeft: `3px solid ${colors.border}`, color: colors.text }}
        title={`${event.title} (${event.platform})`}
      >
        <span className="flex-shrink-0">{icon}</span>
        <span className="truncate">{event.title}</span>
      </div>
    );
  };

  // ── TR messages ─────────────────────────────
  const messages = {
    today: "Bugün",
    previous: "Geri",
    next: "İleri",
    month: "Ay",
    week: "Hafta",
    day: "Gün",
    agenda: "Liste",
    date: "Tarih",
    time: "Saat",
    event: "İçerik",
    noEventsInRange: "Bu aralıkta planlanmış içerik yok",
  };

  // ── Event style getter ──────────────────────
  const eventStyleGetter = (event: CalEvent) => {
    const colors = STATUS_COLORS[event.postStatus] || STATUS_COLORS.draft;
    return {
      style: {
        backgroundColor: colors.bg,
        borderColor: colors.border,
        color: colors.text,
        borderRadius: "6px",
        border: `1px solid ${colors.border}`,
        fontSize: "11px",
        padding: "1px 4px",
      },
    };
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">📅 İçerik Takvimi</h1>
          <p className="subtle text-sm">{activeCompany?.name || ""} markasının içerik planını yönetin</p>
        </div>
      </div>

      {/* Filters + Legend */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Platform filter */}
        <div className="flex flex-wrap gap-1.5">
          {PLATFORM_OPTIONS.map((p) => (
            <button
              key={p} type="button" onClick={() => setPlatformFilter(p)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                platformFilter === p
                  ? "border-brand bg-brand/5 text-brand font-semibold"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
              }`}
            >
              {p !== "Tümü" && <span className="mr-1">{PLATFORM_ICONS[p]}</span>}{p}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[10px] font-semibold text-muted">
          <div className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-zinc-300" />Taslak</div>
          <div className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-blue-400" />Onaylı</div>
          <div className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" />Hazır</div>
        </div>
      </div>

      {/* Calendar */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-brand" />
            <p className="text-sm text-muted">Takvim yükleniyor…</p>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden p-2 sm:p-4">
          <style>{`
            .rbc-calendar { font-family: inherit !important; }
            .rbc-toolbar { gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
            .rbc-toolbar button { border-radius: 8px !important; border: 1px solid #e4e4e7 !important; font-size: 12px !important; font-weight: 600 !important; padding: 6px 14px !important; transition: all 0.15s !important; }
            .rbc-toolbar button:hover { background: #f4f4f5 !important; }
            .rbc-toolbar button.rbc-active { background: var(--brand, #e6272f) !important; color: white !important; border-color: var(--brand, #e6272f) !important; }
            .rbc-header { font-size: 11px !important; font-weight: 700 !important; text-transform: uppercase !important; letter-spacing: 0.05em !important; color: #71717a !important; padding: 10px 4px !important; background: #fafafa !important; border-bottom: 1px solid #f4f4f5 !important; }
            .rbc-month-view { border-radius: 12px !important; border: 1px solid #e4e4e7 !important; overflow: hidden; }
            .rbc-day-bg { transition: background 0.15s; }
            .rbc-day-bg:hover { background: #fafafa; }
            .rbc-today { background: #fef9f9 !important; }
            .rbc-off-range-bg { background: #fafafa !important; }
            .rbc-date-cell { font-size: 12px !important; font-weight: 600 !important; padding: 6px 8px !important; }
            .rbc-event { padding: 0 !important; background: transparent !important; border: none !important; box-shadow: none !important; }
            .rbc-event-content { overflow: visible !important; }
            .rbc-show-more { font-size: 10px !important; font-weight: 700 !important; color: var(--brand, #e6272f) !important; }
            .rbc-month-row { min-height: 100px; }
            .rbc-time-view, .rbc-agenda-view { border-radius: 12px !important; border: 1px solid #e4e4e7 !important; overflow: hidden; }
          `}</style>

          <DnDCalendar
            localizer={localizer}
            events={filtered}
            views={[Views.MONTH, Views.WEEK, Views.AGENDA]}
            defaultView={Views.MONTH}
            style={{ height: 650 }}
            messages={messages}
            culture="tr"
            popup
            resizable={false}
            onEventDrop={handleEventDrop as any}
            onSelectEvent={handleSelectEvent as any}
            components={{ event: EventComponent as any }}
            eventPropGetter={eventStyleGetter as any}
            draggableAccessor={() => true}
          />
        </div>
      )}

      {/* Empty state when no events */}
      {!loading && events.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <span className="text-5xl mb-3 opacity-30">📅</span>
          <p className="text-sm font-medium text-foreground">Takvimde henüz içerik yok</p>
          <p className="mt-1 text-xs text-muted">&quot;İçerik Yönetimi&quot; sayfasından postlarınızı takvime ekleyebilirsiniz</p>
        </div>
      )}

      {/* ════════ Quick-look Popover ════════ */}
      {selectedEvent && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setSelectedEvent(null)} />

          {/* Popover card */}
          <div
            className="fixed z-50 w-80 card shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2"
            style={{
              left: Math.min(popoverPos.x - 160, window.innerWidth - 340),
              top: Math.min(popoverPos.y + 10, window.innerHeight - 350),
            }}
          >
            {/* Image */}
            {selectedEvent.imageUrl && (
              <div className="h-36 overflow-hidden bg-zinc-100">
                <img
                  src={selectedEvent.imageUrl.startsWith("/") ? `${process.env.NEXT_PUBLIC_API_URL}${selectedEvent.imageUrl}` : selectedEvent.imageUrl}
                  alt={selectedEvent.title}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <div className="p-4 space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">{PLATFORM_ICONS[selectedEvent.platform] || "📝"}</span>
                  <span className="text-xs font-medium text-muted">{selectedEvent.platform}</span>
                  <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    selectedEvent.postStatus === "ready" ? "bg-emerald-50 text-emerald-600" :
                    selectedEvent.postStatus === "approved" ? "bg-blue-50 text-blue-600" :
                    "bg-zinc-100 text-zinc-500"
                  }`}>
                    {selectedEvent.postStatus === "ready" ? "Hazır" : selectedEvent.postStatus === "approved" ? "Onaylı" : "Taslak"}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-foreground">{selectedEvent.title}</h3>
                <p className="mt-1 text-xs text-muted line-clamp-2 leading-relaxed">{selectedEvent.content}</p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted">
                <span>📅 {format(selectedEvent.start, "d MMM yyyy, HH:mm", { locale: tr })}</span>
              </div>

              <div className="flex gap-2">
                {onOpenStudio && (
                  <button
                    onClick={() => { setSelectedEvent(null); onOpenStudio(selectedEvent.postId); }}
                    className="flex-1 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-brand/20 transition hover:shadow-md"
                  >
                    🎨 Stüdyoda Düzenle
                  </button>
                )}
                <button
                  onClick={() => handleDelete(selectedEvent.scheduleId)}
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                >
                  🗑️ Sil
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
