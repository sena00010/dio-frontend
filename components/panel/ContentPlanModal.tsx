"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/Toast";
import { getApiError } from "@/lib/apiError";

// Tek tıkla aylık içerik planı: içerik türü dengesi + Türk özel günleri → takvime "planlandı" olarak eklenir

const TR_MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const PLATFORMS = ["Instagram", "Facebook", "LinkedIn"];
const PER_WEEK = [2, 3, 4, 5];

const KIND_STYLES: Record<string, string> = {
  commercial: "bg-amber-50 text-amber-700",
  celebration: "bg-sky-50 text-sky-700",
  national: "bg-red-50 text-red-700",
  religious: "bg-emerald-50 text-emerald-700",
  memorial: "bg-zinc-100 text-zinc-600",
};

type SpecialDay = { date: string; name: string; kind: string };
type PlanItem = { idea_id: number; date: string; pillar_label: string; title: string; special_day?: string };
type PlanJob = { status: string; total: number; done: number; failed: number; items: PlanItem[] };

export default function ContentPlanModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { activeCompany } = useAuth();
  const toast = useToast();
  const now = new Date();
  const monthOptions = [0, 1, 2].map(offset => {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    return { year: d.getFullYear(), month: d.getMonth() + 1, label: `${TR_MONTHS[d.getMonth()]} ${d.getFullYear()}` };
  });

  // Ayın son günlerindeysek varsayılan olarak sonraki ayı öner
  const [monthIdx, setMonthIdx] = useState(now.getDate() > 20 ? 1 : 0);
  const [perWeek, setPerWeek] = useState(3);
  const [platform, setPlatform] = useState("Instagram");
  const [specialDays, setSpecialDays] = useState<SpecialDay[]>([]);
  const [job, setJob] = useState<PlanJob | null>(null);
  const [starting, setStarting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const selected = monthOptions[monthIdx];

  useEffect(() => {
    api.get(`/api/protected/special-days?year=${selected.year}&month=${selected.month}`)
      .then(({ data }) => setSpecialDays(data.days || []))
      .catch(() => setSpecialDays([]));
  }, [selected.year, selected.month]);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const start = useCallback(async () => {
    if (!activeCompany) return;
    setStarting(true);
    try {
      const { data } = await api.post("/api/protected/content-plan", {
        company_id: activeCompany.id, year: selected.year, month: selected.month, posts_per_week: perWeek, platform,
      });
      setJob({ status: "running", total: data.total, done: 0, failed: 0, items: [] });
      const startedAt = Date.now();
      pollRef.current = setInterval(async () => {
        try {
          const { data: st } = await api.get(`/api/protected/content-plan/status?job_id=${data.job_id}`);
          setJob(st);
          if (st.status === "completed" || Date.now() - startedAt > 5 * 60 * 1000) {
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = null;
            if (st.failed > 0) toast.error(`${st.failed} gönderi üretilemedi; diğerleri takvime eklendi.`);
            else toast.success(`${st.done} gönderi takvime eklendi.`);
          }
        } catch (err) {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
          toast.error(getApiError(err, "Plan durumu alınamadı. Takvimi yenileyip kontrol edin."));
        }
      }, 2500);
    } catch (err) {
      toast.error(getApiError(err, "Plan oluşturulamadı."));
    } finally {
      setStarting(false);
    }
  }, [activeCompany, selected.year, selected.month, perWeek, platform, toast]);

  const running = job?.status === "running";
  const finished = job?.status === "completed";
  const items = [...(job?.items || [])].sort((a, b) => a.date.localeCompare(b.date));

  const chip = (active: boolean) =>
    `rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${active ? "border-brand bg-brand/5 text-brand" : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => !running && onClose()}>
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-zinc-100 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-foreground">✨ Ayın İçerik Planı</h2>
            <p className="mt-0.5 text-xs text-muted">{activeCompany?.name} için dengeli bir ay: eğitici, etkileşim, sosyal kanıt, sahne arkası ve en fazla %20 satış içeriği.</p>
          </div>
          {!running && <button type="button" onClick={onClose} aria-label="Kapat" className="text-xl leading-none text-zinc-400 hover:text-zinc-700">×</button>}
        </div>

        {!job && (
          <div className="space-y-4 px-5 py-4">
            <div>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">Ay</p>
              <div className="flex flex-wrap gap-1.5">
                {monthOptions.map((m, i) => <button key={m.label} type="button" className={chip(i === monthIdx)} onClick={() => setMonthIdx(i)}>{m.label}</button>)}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">Haftada kaç gönderi?</p>
              <div className="flex flex-wrap gap-1.5">
                {PER_WEEK.map(n => <button key={n} type="button" className={chip(n === perWeek)} onClick={() => setPerWeek(n)}>{n} gönderi</button>)}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">Platform</p>
              <div className="flex flex-wrap gap-1.5">
                {PLATFORMS.map(p => <button key={p} type="button" className={chip(p === platform)} onClick={() => setPlatform(p)}>{p}</button>)}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">Bu ayın özel günleri</p>
              {specialDays.length === 0 ? (
                <p className="text-xs text-muted">Bu ay için kayıtlı özel gün yok.</p>
              ) : (
                <ul className="flex flex-wrap gap-1.5">
                  {specialDays.map(d => (
                    <li key={d.date + d.name} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${KIND_STYLES[d.kind] || KIND_STYLES.celebration}`}>
                      {Number(d.date.slice(8, 10))} {TR_MONTHS[Number(d.date.slice(5, 7)) - 1]} · {d.name}
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-1.5 text-[11px] text-muted">Anma günlerinde satış içeriği üretilmez; bayramlarda saygılı kutlama yapılır.</p>
            </div>
            <button
              type="button"
              onClick={start}
              disabled={starting || !activeCompany}
              className="w-full rounded-xl bg-gradient-to-r from-brand to-brand-dark px-4 py-3 text-sm font-bold text-white shadow-lg shadow-brand/25 transition hover:-translate-y-0.5 disabled:opacity-60"
            >
              {starting ? "Başlatılıyor…" : `${selected.label} planını oluştur`}
            </button>
          </div>
        )}

        {job && (
          <div className="space-y-4 px-5 py-4">
            <div>
              <div className="mb-1.5 flex justify-between text-xs font-semibold">
                <span>{finished ? "Plan hazır" : "Gönderiler yazılıyor…"}</span>
                <span className="text-muted">{job.done}/{job.total}{job.failed ? ` · ${job.failed} başarısız` : ""}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${job.total ? ((job.done + job.failed) / job.total) * 100 : 0}%` }} />
              </div>
              {running && <p className="mt-1.5 text-[11px] text-muted">Bu işlem 30-60 saniye sürebilir. Pencereyi kapatmayın.</p>}
            </div>
            {items.length > 0 && (
              <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-100">
                {items.map(it => {
                  const d = new Date(it.date);
                  return (
                    <li key={it.idea_id} className="flex gap-3 px-3 py-2.5">
                      <div className="w-12 shrink-0 text-center">
                        <p className="text-base font-bold leading-none">{d.getDate()}</p>
                        <p className="text-[10px] text-muted">{TR_MONTHS[d.getMonth()].slice(0, 3)}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{it.title}</p>
                        <p className="text-[11px] text-muted">{it.special_day || it.pillar_label}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {finished && (
              <button type="button" onClick={onDone} className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-zinc-800">
                Takvimde Gör
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
