"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api";

/* ═══════════════════════════════════════════
   SEO AKSİYONLAR SAYFASI — Gerçek Veri
   ═══════════════════════════════════════════ */

interface ActionTask {
  id: number;
  project_id: number;
  category: string;
  task_type: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  potential_gain: number;
  action_data: Record<string, any>;
  action_label: string;
}

interface ActionSummary {
  total: number;
  critical: number;
  ctr_opportunity: number;
  growth: number;
  total_gain: number;
  critical_gain: number;
  ctr_gain: number;
  growth_gain: number;
}

interface Props {
  activeProjectId: number | null;
}

export default function SeoAksiyonlar({ activeProjectId }: Props) {
  const { activeCompany } = useAuth();
  const [tasks, setTasks] = useState<ActionTask[]>([]);
  const [summary, setSummary] = useState<ActionSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);

  // Aksiyonları çek
  const fetchActions = useCallback(() => {
    if (!activeProjectId || !activeCompany?.id) return;
    setLoading(true);
    api.get(`/api/seo/actions/list?projectId=${activeProjectId}&company_id=${activeCompany.id}`)
      .then(({ data }) => {
        setTasks(data.tasks || []);
        setSummary(data.summary || null);
      })
      .catch(() => { setTasks([]); setSummary(null); })
      .finally(() => setLoading(false));
  }, [activeProjectId, activeCompany?.id]);

  useEffect(() => { fetchActions(); }, [fetchActions]);

  // Engine'i çalıştır (ilk kez veya yenileme)
  const handleRunEngine = async () => {
    if (!activeProjectId || !activeCompany?.id) return;
    setRunning(true);
    try {
      await api.get(`/api/seo/actions/run-engine?projectId=${activeProjectId}&company_id=${activeCompany.id}`);
      fetchActions();
    } catch (e) {
      console.error("Action Engine hatası:", e);
    } finally {
      setRunning(false);
    }
  };

  // Kategorilere göre grupla
  const criticals = tasks.filter(t => t.category === "critical" && t.status === "open");
  const ctrTasks = tasks.filter(t => t.category === "ctr_opportunity" && t.status === "open");
  const growthTasks = tasks.filter(t => t.category === "growth" && t.status === "open");

  // Boş state
  if (!loading && tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-2xl">⚡</div>
        <h2 className="text-lg font-bold text-zinc-800">Aksiyonlar Henüz Oluşturulmadı</h2>
        <p className="mt-2 max-w-md text-sm text-zinc-500">
          Action Engine'i çalıştırarak GSC verilerinden otomatik aksiyon önerileri üretebilirsiniz.
        </p>
        <button onClick={handleRunEngine} disabled={running}
          className="mt-4 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white shadow-lg disabled:opacity-50 transition hover:bg-brand-dark">
          {running ? "Analiz ediliyor..." : "⚡ Aksiyon Motoru Çalıştır"}
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-zinc-200 border-t-brand" />
        <span className="ml-3 text-sm text-zinc-500">Aksiyonlar yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ════════════════════════════════════════
          ÖZET KARTLARI (4'lü grid)
          ════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <div className="rounded-2xl bg-gradient-to-br from-brand to-[#F05E57] px-5 py-4 text-white">
          <p className="text-3xl font-black">{summary?.total || 0}</p>
          <p className="mt-0.5 text-[13px] font-bold opacity-95">Toplam Aksiyon</p>
          <p className="mt-1 text-[11px] font-semibold opacity-75">+{Math.round(summary?.total_gain || 0)} tık/ay potansiyeli</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-[#F97316] to-[#FB923C] px-5 py-4 text-white">
          <p className="text-3xl font-black">{summary?.critical || 0}</p>
          <p className="mt-0.5 text-[13px] font-bold opacity-95">Kritik — Hemen Yap</p>
          <p className="mt-1 text-[11px] font-semibold opacity-75">-{Math.round(summary?.critical_gain || 0)} tık/ay kayıp var</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-[#F59E0B] to-[#FBBF24] px-5 py-4 text-white">
          <p className="text-3xl font-black">{summary?.ctr_opportunity || 0}</p>
          <p className="mt-0.5 text-[13px] font-bold opacity-95">CTR Fırsatı</p>
          <p className="mt-1 text-[11px] font-semibold opacity-75">+{Math.round(summary?.ctr_gain || 0)} tık/ay ekstra</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-[#22C55E] to-[#4ADE80] px-5 py-4 text-white">
          <p className="text-3xl font-black">{summary?.growth || 0}</p>
          <p className="mt-0.5 text-[13px] font-bold opacity-95">Büyüme Fırsatı</p>
          <p className="mt-1 text-[11px] font-semibold opacity-75">+{Math.round(summary?.growth_gain || 0)} tık/ay potansiyel</p>
        </div>
      </div>

      {/* ════════════════════════════════════════
          AI BANNER — Nereden başlamalısın?
          ════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#2A1215] via-[#1F1F1F] to-[#1A1A1A] px-4 py-4 sm:px-6 sm:py-5 text-white">
        <div className="absolute left-0 top-0 h-full w-1 bg-brand" />
        <div className="flex items-start gap-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-base">🤖</div>
          <div className="flex-1">
            <h3 className="text-sm font-bold">Nereden başlamalısın?</h3>
            <p className="mt-2 text-[12px] leading-5 text-zinc-300">
              {criticals.length > 0 && <>Önce <strong className="text-white">{criticals.length} kritik sorunu</strong> düzelt — tek değişiklikle -{Math.round(summary?.critical_gain || 0)} tık/ay kaybı geri alınır. </>}
              {ctrTasks.length > 0 && <>Sonra <strong className="text-white">CTR fırsatlarına geç</strong> — başlık ve meta desc güncellemesi için AI hazır. </>}
              {(summary?.total_gain || 0) > 0 && <><strong className="text-orange-300">+{Math.round(summary?.total_gain || 0)} tık/ay</strong> kazanabilirsin.</>}
            </p>
          </div>
          <button onClick={handleRunEngine} disabled={running}
            className="shrink-0 rounded-lg bg-white/10 px-3 py-1.5 text-[10px] font-bold text-white transition hover:bg-white/20 disabled:opacity-50">
            {running ? "⏳ Çalışıyor..." : "↻ Yenile"}
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════
          KRİTİK — Hemen yapılmalı
          ════════════════════════════════════════ */}
      {criticals.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-brand" />
              <h2 className="text-sm font-black text-zinc-900">KRİTİK — Hemen yapılmalı</h2>
            </div>
            <span className="text-[11px] font-semibold text-zinc-400">{criticals.length} aksiyon</span>
          </div>
          <div className="space-y-3">
            {criticals.map(task => (
              <CriticalCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          CTR FIRSATI — Bu hafta yapılmalı
          ════════════════════════════════════════ */}
      {ctrTasks.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#F97316]" />
              <h2 className="text-sm font-black text-zinc-900">CTR FIRSATI — Bu hafta yapılmalı</h2>
            </div>
            <span className="text-[11px] font-semibold text-zinc-400">{ctrTasks.length} aksiyon</span>
          </div>

          {/* Bilgi kutusu */}
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-[11px] leading-4 text-amber-800">
              <span className="mr-1">⚡</span>
              <strong>CTR nedir?</strong> Google&apos;da sayfan çıktığında kaç kişinin tıkladığının oranı.
              Düşükse başlık veya açıklama metni yeterince ilgi çekmiyor — değiştirince tıklama artar, ücretsiz!
            </p>
          </div>

          {/* CTR Tablosu */}
          <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
            <table className="w-full text-[12px] min-w-[600px]">
              <thead>
                <tr className="border-b border-zinc-100 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  <th className="px-5 py-3 text-left">Sayfa</th>
                  <th className="px-4 py-3 text-left">Sıralaması</th>
                  <th className="px-4 py-3 text-left">Görüntülenme</th>
                  <th className="px-4 py-3 text-left">Tıklanma Oranı</th>
                  <th className="px-4 py-3 text-left">Kazanç Tahmini</th>
                  <th className="px-4 py-3 text-right">Aksiyon</th>
                </tr>
              </thead>
              <tbody>
                {ctrTasks.map(task => {
                  const d = task.action_data || {};
                  return (
                    <tr key={task.id} className="border-b border-zinc-50 transition hover:bg-zinc-50/50">
                      <td className="px-5 py-4">
                        <p className="text-[12px] font-bold text-zinc-900">{task.title}</p>
                        <p className="mt-0.5 text-[10px] text-zinc-400">{d.page_url}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-[12px] font-bold text-[#22C55E]">{Math.round(d.position || 0)}. sıra</p>
                        <p className="mt-0.5 text-[10px] text-zinc-400">{d.rank_page || 1}. sayfa</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-[12px] font-bold text-zinc-700">{fmtK(d.impressions)}</p>
                        <p className="mt-0.5 text-[10px] text-zinc-400">kişi gördü</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-[12px] font-bold text-brand">%{d.current_ctr || 0}</p>
                        <p className="mt-0.5 text-[10px] text-zinc-400">çok düşük</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-[12px] font-bold text-emerald-600">+{Math.round(task.potential_gain)} tık/ay</span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button className="rounded-lg bg-brand px-3.5 py-1.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-brand-dark">
                          {task.action_label || "AI Başlık Yaz"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          BÜYÜME FIRSATI — Bu ay yapılmalı
          ════════════════════════════════════════ */}
      {growthTasks.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#22C55E]" />
              <h2 className="text-sm font-black text-zinc-900">BÜYÜME FIRSATI — Bu ay yapılmalı</h2>
            </div>
            <span className="text-[11px] font-semibold text-zinc-400">{growthTasks.length} aksiyon</span>
          </div>

          <div className="space-y-3">
            {growthTasks.map(task => (
              <GrowthCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   ALT BİLEŞENLER
   ═══════════════════════════════════════════ */

function CriticalCard({ task }: { task: ActionTask }) {
  const d = task.action_data || {};

  if (task.task_type === "cannibalization") {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-3 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex items-start gap-3.5">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-50">
              <span className="text-base">📄</span>
            </div>
            <div>
              <h3 className="text-[13px] font-bold text-zinc-900">{task.title}</h3>
              <p className="mt-1 text-[11px] leading-4 text-zinc-500">{task.description}</p>
              <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:gap-3">
                <div className="flex-1 rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2.5">
                  <p className="text-[11px] font-bold text-emerald-700">{d.primary_url}</p>
                  <p className="mt-0.5 text-[10px] text-zinc-400">Poz. {d.primary_pos} — ana sayfa ✓</p>
                </div>
                <div className="flex-1 rounded-xl border border-orange-100 bg-orange-50/50 px-3 py-2.5">
                  <p className="text-[11px] font-bold text-orange-600">{d.conflict_url}</p>
                  <p className="mt-0.5 text-[10px] text-zinc-400">Poz. {d.conflict_pos} — çakışıyor</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 shrink-0 sm:ml-6">
            <span className="text-[12px] font-bold text-zinc-500">Pozisyon kaybı</span>
            <button className="rounded-lg bg-[#F97316] px-4 py-1.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-[#EA580C]">
              {task.action_label}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Varsayılan kritik kart (404 vb.)
  const urls = (d.affected_urls as string[]) || [];
  const extraCount = (d.extra_count as number) || 0;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-3 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex items-start gap-3.5">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-50">
            <span className="text-base">⊘</span>
          </div>
          <div>
            <h3 className="text-[13px] font-bold text-zinc-900">{task.title}</h3>
            <p className="mt-1 text-[11px] leading-4 text-zinc-500">{task.description}</p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {urls.map((url, i) => (
                <span key={i} className="rounded-lg bg-zinc-100 px-2.5 py-1 text-[10px] font-semibold text-zinc-600">{url}</span>
              ))}
              {extraCount > 0 && (
                <span className="rounded-lg bg-zinc-100 px-2.5 py-1 text-[10px] font-semibold text-blue-600">+{extraCount} sayfa</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 shrink-0 sm:ml-6">
          <span className="text-[12px] font-bold text-brand">-{Math.round(task.potential_gain)} tık/ay kayıp</span>
          <button className="rounded-lg bg-[#22C55E] px-4 py-1.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-[#16A34A]">
            {task.action_label}
          </button>
          <button className="text-[10px] font-medium text-zinc-400 underline decoration-dotted hover:text-zinc-600">
            Nasıl düzeltirim?
          </button>
        </div>
      </div>
    </div>
  );
}

function GrowthCard({ task }: { task: ActionTask }) {
  const d = task.action_data || {};

  if (task.task_type === "competitor_weakness") {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-3 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex items-start gap-3.5">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50">
              <span className="text-base">🎯</span>
            </div>
            <div className="flex-1">
              <h3 className="text-[13px] font-bold text-zinc-900">{task.title}</h3>
              <p className="mt-1 text-[11px] leading-4 text-zinc-500">{task.description}</p>
              <div className="mt-3 grid grid-cols-3 gap-1.5 sm:gap-2.5">
                <div className="rounded-xl bg-zinc-900 px-2 py-2 sm:px-4 sm:py-3">
                  <p className="text-[9px] font-semibold text-zinc-400">Sen</p>
                  <p className="mt-0.5 text-sm sm:text-lg font-black text-white">{d.my_position}. sıra</p>
                </div>
                <div className="rounded-xl bg-zinc-100 px-2 py-2 sm:px-4 sm:py-3">
                  <p className="text-[9px] font-semibold text-zinc-400 truncate">{d.competitor_name}</p>
                  <p className="mt-0.5 text-sm sm:text-lg font-black text-zinc-700">{d.competitor_new_position}. <span className="hidden sm:inline">sıra </span><span className="text-xs sm:text-sm text-red-500">↓{d.competitor_new_position - 12}</span></p>
                </div>
                <div className="rounded-xl bg-zinc-100 px-2 py-2 sm:px-4 sm:py-3">
                  <p className="text-[9px] font-semibold text-zinc-400">Hedef</p>
                  <p className="mt-0.5 text-sm sm:text-lg font-black text-emerald-600">İlk {d.target_position}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 shrink-0 sm:ml-6">
            <span className="text-[12px] font-bold text-emerald-600">+{Math.round(task.potential_gain)} tık/ay</span>
            <button className="rounded-lg bg-[#22C55E] px-4 py-1.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-[#16A34A]">
              {task.action_label}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (task.task_type === "schema_missing") {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-3 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex items-start gap-3.5">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-50">
              <span className="text-base">⭐</span>
            </div>
            <div>
              <h3 className="text-[13px] font-bold text-zinc-900">{task.title}</h3>
              <p className="mt-1 text-[11px] leading-4 text-zinc-500">{task.description}</p>
              <p className="mt-2 text-[10px] font-medium text-zinc-400">{d.note}</p>
            </div>
          </div>
          <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 shrink-0 sm:ml-6">
            <span className="text-[12px] font-bold text-emerald-600">CTR {d.estimated_ctr_boost} tahmini</span>
            <button className="rounded-lg bg-zinc-900 px-4 py-1.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-zinc-800">
              {task.action_label}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // backlink_opportunity
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-3 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex items-start gap-3.5">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-50">
            <span className="text-base">🔗</span>
          </div>
          <div>
            <h3 className="text-[13px] font-bold text-zinc-900">{task.title}</h3>
            <p className="mt-1 text-[11px] leading-4 text-zinc-500">{task.description}</p>
          </div>
        </div>
        <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 shrink-0 sm:ml-6">
          <span className="text-[12px] font-bold text-zinc-500">Otorite artışı</span>
          <button className="rounded-lg border border-zinc-200 bg-white px-4 py-1.5 text-[11px] font-bold text-zinc-700 shadow-sm transition hover:bg-zinc-50">
            {task.action_label}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   YARDIMCI
   ═══════════════════════════════════════════ */

function fmtK(n: number | undefined) {
  if (!n) return "0";
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(Math.round(n));
}
