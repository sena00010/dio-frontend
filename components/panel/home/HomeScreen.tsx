"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  LightBulbIcon,
  PlusIcon,
  RectangleStackIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import ContentPlanModal from "../ContentPlanModal";
import type { ScreenKey } from "../types";

// "Bugün" ana sayfası: kullanıcı panele girince ne yapacağını tek bakışta görür.

type Schedule = {
  id: number; post_id?: number | null; idea_id?: number | null; title: string; platform: string;
  image_url?: string; post_status?: string; status: string; scheduled_at: string; source_type?: string;
};
type Pending = { id: number; type: "idea" | "post"; title: string; platform: string; image_url: string; format: string };
type SpecialDay = { date: string; name: string; kind: string };

const TR_MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const TR_DAYS = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
const TR_DAYS_SHORT = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
const API = process.env.NEXT_PUBLIC_API_URL || "";
const abs = (u?: string) => (!u ? "" : u.startsWith("/") ? `${API}${u}` : u);
const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function statusOf(s: Schedule): { label: string; dot: string } {
  if (s.status === "published") return { label: "Yayında", dot: "bg-emerald-500" };
  if (s.post_status === "ready") return { label: "Hazır", dot: "bg-emerald-500" };
  if (!s.post_id) return { label: "Fikir", dot: "bg-amber-400" };
  return { label: "Taslak", dot: "bg-zinc-300" };
}

type Props = {
  onNavigate: (key: ScreenKey) => void;
  onOpenStudio: (postId: number) => void;
  onScheduleNavigate: (postId: number) => void;
  onStartTopic: (topic: string) => void;
};

export default function HomeScreen({ onNavigate, onOpenStudio, onScheduleNavigate, onStartTopic }: Props) {
  const { user, activeCompany } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [pending, setPending] = useState<Pending[]>([]);
  const [specialDays, setSpecialDays] = useState<SpecialDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [planOpen, setPlanOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const now = useMemo(() => new Date(), []);

  useEffect(() => {
    if (!activeCompany) return;
    let cancelled = false;
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    Promise.allSettled([
      api.get(`/api/protected/schedules?company_id=${activeCompany.id}`),
      api.get(`/api/protected/pending-contents?company_id=${activeCompany.id}`),
      api.get(`/api/protected/special-days?year=${now.getFullYear()}&month=${now.getMonth() + 1}`),
      api.get(`/api/protected/special-days?year=${next.getFullYear()}&month=${next.getMonth() + 1}`),
    ]).then(([sch, pen, sd1, sd2]) => {
      if (cancelled) return;
      setSchedules(sch.status === "fulfilled" ? sch.value.data.schedules || [] : []);
      setPending(pen.status === "fulfilled" ? (pen.value.data.items || []).filter((p: Pending) => p.type === "post") : []);
      const days = [sd1, sd2].flatMap(r => (r.status === "fulfilled" ? r.value.data.days || [] : []));
      setSpecialDays(days.filter((d: SpecialDay) => d.date >= dayKey(now)).slice(0, 4));
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [activeCompany, now, reloadKey]);

  const week = useMemo(() => Array.from({ length: 7 }, (_, i) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + i)), [now]);
  const byDay = useMemo(() => {
    const m: Record<string, Schedule[]> = {};
    for (const s of schedules) {
      const k = dayKey(new Date(s.scheduled_at));
      (m[k] ||= []).push(s);
    }
    Object.values(m).forEach(list => list.sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at)));
    return m;
  }, [schedules]);

  const stats = useMemo(() => {
    const weekEnd = week[6];
    const inWeek = schedules.filter(s => { const d = new Date(s.scheduled_at); return d >= week[0] && d <= new Date(weekEnd.getTime() + 864e5); });
    const inMonth = schedules.filter(s => { const d = new Date(s.scheduled_at); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
    return {
      week: inWeek.length,
      month: inMonth.length,
      ready: pending.length,
      ideas: inMonth.filter(s => !s.post_id && new Date(s.scheduled_at) >= now).length,
    };
  }, [schedules, pending, week, now]);

  const hour = now.getHours();
  const greeting = hour < 12 ? "Günaydın" : hour < 18 ? "İyi günler" : "İyi akşamlar";
  const hasAnyPlan = schedules.length > 0;

  const statCards = [
    { label: "Bu hafta planlı", value: stats.week, icon: CalendarDaysIcon },
    { label: "Bu ay planlı", value: stats.month, icon: RectangleStackIcon },
    { label: "Yayına hazır", value: stats.ready, icon: CheckCircleIcon },
    { label: "Hazırlanacak fikir", value: stats.ideas, icon: LightBulbIcon },
  ];

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-muted">{now.getDate()} {TR_MONTHS[now.getMonth()]} {TR_DAYS[now.getDay()]}</p>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight md:text-[28px]">{greeting}, {user?.first_name || "hoş geldiniz"}</h1>
          <p className="mt-1 text-sm text-muted">{activeCompany?.name} için bugün yapılacaklar burada.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setPlanOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:bg-zinc-50">
            <CalendarDaysIcon className="h-[18px] w-[18px] text-brand" /> Ayın Planı
          </button>
          <button type="button" onClick={() => onNavigate("yeni-icerik")}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand/30 transition hover:bg-brand-dark">
            <SparklesIcon className="h-[18px] w-[18px]" /> Yeni İçerik
          </button>
        </div>
      </div>

      {/* İlk kullanım */}
      {!loading && !hasAnyPlan && (
        <div className="overflow-hidden rounded-2xl border border-brand/20 bg-gradient-to-br from-brand-soft to-white p-6 md:p-8">
          <p className="text-xs font-bold uppercase tracking-widest text-brand">Başlangıç</p>
          <h2 className="mt-2 text-xl font-bold md:text-2xl">İlk ayınızı 1 dakikada planlayın</h2>
          <p className="mt-2 max-w-xl text-sm text-muted">DIO; eğitici, etkileşim, sosyal kanıt ve kampanya içeriklerini dengeli dağıtır, özel günleri ekler ve her gönderiyi takviminize yerleştirir.</p>
          <button type="button" onClick={() => setPlanOpen(true)} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-dark">
            <SparklesIcon className="h-5 w-5" /> Ayın Planını Oluştur
          </button>
        </div>
      )}

      {/* Özet */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map(c => (
          <div key={c.label} className="rounded-2xl border border-line bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-medium text-muted">{c.label}</p>
              <c.icon className="h-5 w-5 text-zinc-300" />
            </div>
            <p className="mt-2 text-3xl font-bold tracking-tight">{loading ? "–" : c.value}</p>
          </div>
        ))}
      </div>

      {/* Bu hafta */}
      <section className="rounded-2xl border border-line bg-white p-4 shadow-sm md:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold">Bu Hafta</h2>
          <button type="button" onClick={() => onNavigate("takvim")} className="text-sm font-semibold text-brand hover:underline">Takvimi aç →</button>
        </div>
        <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:grid sm:grid-cols-7 sm:overflow-visible sm:px-0">
          {week.map((d, i) => {
            const items = byDay[dayKey(d)] || [];
            return (
              <div key={i} className={`min-h-[120px] min-w-[150px] snap-start rounded-xl border p-2.5 sm:min-w-0 ${i === 0 ? "border-brand/30 bg-brand-soft/60" : "border-line bg-zinc-50/50"}`}>
                <p className={`text-[11px] font-bold uppercase tracking-wide ${i === 0 ? "text-brand" : "text-muted"}`}>{i === 0 ? "Bugün" : TR_DAYS_SHORT[d.getDay()]}</p>
                <p className="text-lg font-bold leading-tight">{d.getDate()}</p>
                <div className="mt-2 space-y-1.5">
                  {items.slice(0, 3).map(s => {
                    const st = statusOf(s);
                    const t = new Date(s.scheduled_at);
                    return (
                      <button key={s.id} type="button" title={s.title}
                        onClick={() => (s.post_id ? onOpenStudio(s.post_id) : onNavigate("takvim"))}
                        className="block w-full rounded-lg border border-line bg-white px-2 py-1.5 text-left shadow-sm transition hover:border-brand/40">
                        <span className="flex items-center gap-1.5 text-[10px] font-semibold text-muted">
                          <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                          {String(t.getHours()).padStart(2, "0")}:{String(t.getMinutes()).padStart(2, "0")} · {st.label}
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-[12px] font-medium leading-snug">{s.title}</span>
                      </button>
                    );
                  })}
                  {items.length > 3 && <p className="text-[11px] font-semibold text-muted">+{items.length - 3} daha</p>}
                  {items.length === 0 && (
                    <button type="button" onClick={() => onNavigate("yeni-icerik")}
                      className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-zinc-300 py-2 text-[11px] font-semibold text-muted transition hover:border-brand hover:text-brand">
                      <PlusIcon className="h-3.5 w-3.5" /> Ekle
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Yayına hazır */}
        <section className="rounded-2xl border border-line bg-white p-4 shadow-sm md:p-5">
          <h2 className="mb-1 text-base font-bold">Yayına Hazır Bekleyenler</h2>
          <p className="mb-4 text-xs text-muted">Görseli hazır ama henüz takvime eklenmemiş gönderiler</p>
          {pending.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line py-8 text-center">
              <p className="text-sm font-medium">Bekleyen gönderi yok</p>
              <p className="mt-1 text-xs text-muted">Yeni bir içerik üretin; hazır olunca burada görünür.</p>
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {pending.slice(0, 6).map(p => (
                <li key={p.id} className="flex gap-3 rounded-xl border border-line p-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={abs(p.image_url)} alt="" className="h-20 w-16 shrink-0 rounded-lg bg-zinc-100 object-cover" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="line-clamp-2 text-[13px] font-semibold leading-snug">{p.title}</p>
                    <p className="mt-0.5 text-[11px] text-muted">{p.platform} · {p.format}</p>
                    <div className="mt-auto flex gap-1.5 pt-2">
                      <button type="button" onClick={() => onScheduleNavigate(p.id)} className="inline-flex items-center gap-1 rounded-lg bg-brand px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-brand-dark">
                        <ClockIcon className="h-3.5 w-3.5" /> Zamanla
                      </button>
                      <button type="button" onClick={() => onOpenStudio(p.id)} className="rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-semibold hover:bg-zinc-50">Düzenle</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Özel günler */}
        <section className="rounded-2xl border border-line bg-white p-4 shadow-sm md:p-5">
          <h2 className="mb-1 text-base font-bold">Yaklaşan Özel Günler</h2>
          <p className="mb-4 text-xs text-muted">Önceden hazırlanın, son güne bırakmayın</p>
          {specialDays.length === 0 ? (
            <p className="text-sm text-muted">Önümüzdeki iki ayda kayıtlı özel gün yok.</p>
          ) : (
            <ul className="space-y-2">
              {specialDays.map(d => {
                const dt = new Date(d.date + "T00:00:00");
                const daysLeft = Math.round((dt.getTime() - new Date(dayKey(now) + "T00:00:00").getTime()) / 864e5);
                return (
                  <li key={d.date + d.name} className="flex items-center gap-3 rounded-xl border border-line p-2.5">
                    <div className="w-12 shrink-0 rounded-lg bg-zinc-50 py-1 text-center">
                      <p className="text-base font-bold leading-none">{dt.getDate()}</p>
                      <p className="text-[10px] font-semibold text-muted">{TR_MONTHS[dt.getMonth()].slice(0, 3)}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold">{d.name}</p>
                      <p className="text-[11px] text-muted">{daysLeft === 0 ? "Bugün" : `${daysLeft} gün kaldı`}</p>
                    </div>
                    {d.kind !== "memorial" && (
                      <button type="button" onClick={() => onStartTopic(`${d.name} için içerik`)} className="shrink-0 rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-semibold text-brand hover:bg-brand-soft">
                        Hazırla
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {planOpen && (
        <ContentPlanModal
          onClose={() => { setPlanOpen(false); setReloadKey(k => k + 1); }}
          onDone={() => { setPlanOpen(false); onNavigate("takvim"); }}
        />
      )}
    </div>
  );
}
