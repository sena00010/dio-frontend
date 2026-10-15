"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api";

/* ═══════════════════════════════════════════
   TEKNİK SEO — Backend API'den Gerçek Veri
   ═══════════════════════════════════════════ */

interface Props {
  activeProjectId: number | null;
}

interface SpeedMetricItem {
  label: string;
  value: string;
  raw_ms: number;
  status: "good" | "needs-improvement" | "poor";
  target: string;
}

interface TechnicalIssue {
  title: string;
  severity: "critical" | "warning" | "info";
  description: string;
  count: number;
  impact: string;
  actions: string[];
}

interface IssueDetailItem {
  id: number;
  task_type: string;
  title: string;
  description: string;
  target_url: string;
  priority: string;
  status: string;
}

interface SchemaItem {
  label: string;
  icon: string;
  status: "ok" | "missing";
}

interface TeknikData {
  health_snapshot: {
    health_score: number;
    mobile_score: number;
    desktop_score: number;
    mobile_friendly: boolean;
    schema_missing: number;
  };
  gsc_coverage: {
    indexed_pages: number;
    not_indexed_pages: number;
    total_submitted: number;
  };
  speed_metrics: {
    mobile: SpeedMetricItem[];
    desktop: SpeedMetricItem[];
  };
  technical_issues: TechnicalIssue[];
  schema_status: SchemaItem[];
  ai_summary: string;
}

export default function SeoTeknik({ activeProjectId }: Props) {
  const { activeCompany } = useAuth();
  const [data, setData] = useState<TeknikData | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [speedTab, setSpeedTab] = useState<"mobile" | "desktop">("mobile");
  const [detailPanel, setDetailPanel] = useState<{ open: boolean; title: string; taskType: string; loading: boolean; items: IssueDetailItem[] }>({
    open: false, title: "", taskType: "", loading: false, items: []
  });

  const cid = activeCompany?.id;

  const fetchIssueDetails = async (taskType: string, title: string) => {
    if (!activeProjectId || !cid) return;
    setDetailPanel({ open: true, title, taskType, loading: true, items: [] });
    try {
      const { data: d } = await api.get(`/api/seo/technical/issues/details?projectId=${activeProjectId}&company_id=${cid}&taskType=${taskType}`);
      setDetailPanel(prev => ({ ...prev, loading: false, items: d.issues || [] }));
    } catch {
      setDetailPanel(prev => ({ ...prev, loading: false }));
    }
  };


  const fetchData = useCallback(() => {
    if (!activeProjectId || !cid) return;
    setLoading(true);
    api.get(`/api/seo/technical/dashboard?projectId=${activeProjectId}&company_id=${cid}`)
      .then(({ data: d }) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [activeProjectId, cid]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSync = async () => {
    if (!activeProjectId || !cid) return;
    setSyncing(true);
    try {
      await api.get(`/api/seo/technical/sync?projectId=${activeProjectId}&company_id=${cid}`);
      // PSI 10-20 sn sürer, 15 sn sonra yeniden çek
      setTimeout(() => { fetchData(); setSyncing(false); }, 15000);
    } catch {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-zinc-200 border-t-brand" />
        <span className="ml-3 text-sm text-zinc-500">Teknik analiz yükleniyor...</span>
      </div>
    );
  }

  if (!data || !data.health_snapshot) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-50 text-2xl">⚙️</div>
        <h2 className="text-lg font-bold text-zinc-800">Teknik Veri Henüz Yok</h2>
        <p className="mt-2 max-w-md text-sm text-zinc-500">
          {data?.ai_summary || "Teknik SEO verilerini çekmek için aşağıdaki butona tıklayın."}
        </p>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="mt-4 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white shadow-lg disabled:opacity-50 transition hover:bg-brand-dark"
        >
          {syncing ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              PSI + GSC analiz ediliyor...
            </span>
          ) : "⚙️ Teknik Analizi Başlat"}
        </button>
      </div>
    );
  }

  const hs = data.health_snapshot;
  const cov = data.gsc_coverage;
  const issues = data.technical_issues || [];
  const schemas = data.schema_status || [];
  const mobileSpeed = data.speed_metrics?.mobile || [];
  const desktopSpeed = data.speed_metrics?.desktop || [];
  const activeSpeed = speedTab === "mobile" ? mobileSpeed : desktopSpeed;

  return (
    <div className="space-y-5">
      {/* ════════════════════════════════════════
          AI BANNER
          ════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#2A1215] via-[#1F1F1F] to-[#1A1A1A] px-4 py-4 sm:px-6 sm:py-5 text-white">
        <div className="absolute left-0 top-0 h-full w-1 bg-brand" />
        <div className="flex items-start gap-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-base">🤖</div>
          <div className="flex-1">
            <h3 className="text-sm font-bold">
              Teknik durum: {hs.health_score >= 80 ? "İyi" : hs.health_score >= 60 ? "Orta" : "Kritik"} — {issues.length > 0 ? `${issues.length} sorun tespit edildi` : "sorun yok"}
            </h3>
            <p className="mt-2 text-[12px] leading-5 text-zinc-300">{data.ai_summary}</p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="shrink-0 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-bold text-white transition hover:bg-white/20 disabled:opacity-50"
          >
            {syncing ? "Analiz ediliyor..." : "↻ Yenile"}
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════
          METRİK KARTLARI — 2 sıra x 4 kolon
          ════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {/* Site Sağlığı — Dairesel gauge (2 satır) */}
        <div className="row-span-2 flex flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white p-3 sm:p-5">
          <span className="mb-2 sm:mb-3 text-[10px] sm:text-[11px] font-semibold text-zinc-400">Site Sağlığı</span>
          <div className="relative h-20 w-20 sm:h-28 sm:w-28">
            <svg className="h-20 w-20 sm:h-28 sm:w-28 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#f0f0f0" strokeWidth="10" />
              <circle
                cx="60" cy="60" r="52" fill="none"
                stroke={hs.health_score >= 80 ? "#10B981" : hs.health_score >= 60 ? "#F59E0B" : "#EF4444"}
                strokeWidth="10"
                strokeDasharray={`${(hs.health_score / 100) * 327} 327`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl sm:text-3xl font-black ${hs.health_score >= 80 ? "text-emerald-600" : hs.health_score >= 60 ? "text-amber-500" : "text-red-500"}`}>
                {hs.health_score}
              </span>
            </div>
          </div>
          <span className="mt-2 text-[10px] text-zinc-400">/ 100 — {hs.health_score >= 80 ? "İyi" : hs.health_score >= 60 ? "Orta" : "Kötü"}</span>
        </div>

        {/* Üst sıra 3 kart */}
        <MetricCard
          title="Dizine Alınan Sayfa"
          value={cov.indexed_pages.toString()}
          subtitle={`${cov.not_indexed_pages} alınmadı`}
          subtitleColor="text-emerald-600"
          borderColor="border-l-emerald-500"
        />
        <MetricCard
          title="Kayıp Sayfa (404)"
          value={issues.find(i => i.title.includes("404"))?.count.toString() || "0"}
          subtitle={`-${(issues.find(i => i.title.includes("404"))?.count || 0) * 85} tık/ay kayıp`}
          subtitleColor="text-orange-500"
          borderColor="border-l-orange-500"
        />
        <MetricCard
          title="Çakışan Sayfa"
          value={issues.find(i => i.title.includes("Çakışan"))?.count.toString() || "0"}
          subtitle="Düzeltilmeli"
          subtitleColor="text-red-500"
          borderColor="border-l-red-500"
        />

        {/* Alt sıra 3 kart */}
        <MetricCard
          title="Site Hızı (Mobil)"
          value={hs.mobile_score.toString()}
          subtitle={`${hs.mobile_score >= 90 ? "Çok İyi" : hs.mobile_score >= 50 ? "İyi" : "Kötü"} • LCP ${mobileSpeed[0]?.value || "—"}`}
          subtitleColor={hs.mobile_score >= 50 ? "text-emerald-600" : "text-red-500"}
          borderColor="border-l-blue-500"
        />
        <div className="rounded-2xl border border-zinc-200 border-l-4 border-l-emerald-500 bg-white p-3 sm:p-4 flex flex-col justify-center">
          <span className="text-[10px] font-semibold text-zinc-400">Mobil Uyumluluk</span>
          <div className="mt-1 flex items-center gap-2">
            <span className={`text-base sm:text-xl font-black ${hs.mobile_friendly ? "text-emerald-600" : "text-red-500"}`}>
              {hs.mobile_friendly ? "✓ Geçti" : "✗ Başarısız"}
            </span>
          </div>
          <span className={`mt-1 text-[10px] ${hs.mobile_friendly ? "text-emerald-500" : "text-red-400"}`}>
            {hs.mobile_friendly ? "Tüm sayfalar uyumlu" : "Düzeltme gerekli"}
          </span>
        </div>
        <MetricCard
          title="Yıldız Kodu Eksik"
          value={hs.schema_missing.toString()}
          subtitle="CTR fırsatı"
          subtitleColor="text-orange-500"
          borderColor="border-l-amber-500"
        />
      </div>

      {/* ════════════════════════════════════════
          SİTE HIZI DETAYI
          ════════════════════════════════════════ */}
      <div className="rounded-2xl border border-zinc-200 bg-white">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-100 px-4 py-3 sm:px-5 sm:py-4">
          <div>
            <h3 className="text-sm font-bold text-zinc-900">Site Hızı Detayı</h3>
            <p className="mt-0.5 text-[10px] text-zinc-400">Sayfa hızı düştükçe Google&apos;da sıralama düşer ve ziyaretçi hemen çıkar</p>
          </div>
          <div className="flex rounded-lg border border-zinc-200 p-0.5">
            <button
              onClick={() => setSpeedTab("mobile")}
              className={`rounded-md px-3 py-1 text-[10px] font-bold transition ${
                speedTab === "mobile" ? "bg-brand text-white" : "text-zinc-500 hover:text-zinc-700"
              }`}
            >Mobil</button>
            <button
              onClick={() => setSpeedTab("desktop")}
              className={`rounded-md px-3 py-1 text-[10px] font-bold transition ${
                speedTab === "desktop" ? "bg-brand text-white" : "text-zinc-500 hover:text-zinc-700"
              }`}
            >Masaüstü</button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 sm:p-5">
          {activeSpeed.map((metric, i) => (
            <div key={i} className="rounded-xl border border-zinc-100 p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-zinc-500">{metric.label}</span>
                <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold ${
                  metric.status === "good" ? "bg-emerald-100 text-emerald-700" :
                  metric.status === "needs-improvement" ? "bg-amber-100 text-amber-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {metric.status === "good" ? "İyi" : metric.status === "needs-improvement" ? "Geliştirilmeli" : "Kötü"}
                </span>
              </div>
              <p className={`mt-2 text-xl font-black ${
                metric.status === "good" ? "text-emerald-600" :
                metric.status === "needs-improvement" ? "text-amber-500" :
                "text-red-500"
              }`}>{metric.value}</p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                <div className={`h-full rounded-full transition-all ${
                  metric.status === "good" ? "bg-emerald-500" :
                  metric.status === "needs-improvement" ? "bg-amber-500" :
                  "bg-red-500"
                }`} style={{ width: metric.status === "good" ? "85%" : metric.status === "needs-improvement" ? "55%" : "25%" }} />
              </div>
              <p className="mt-1.5 text-[9px] text-zinc-400">Hedef: {metric.target}</p>
            </div>
          ))}
          {activeSpeed.length === 0 && (
            <div className="col-span-3 py-8 text-center text-zinc-400 text-sm">
              Hız verisi henüz yok. &quot;Yenile&quot; butonuna tıklayarak PSI analizi başlatın.
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════
          TEKNİK SORUNLAR
          ════════════════════════════════════════ */}
      <div className="rounded-2xl border border-zinc-200 bg-white">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <h3 className="text-sm font-bold text-zinc-900">Teknik Sorunlar</h3>
          <p className="text-[10px] text-zinc-400">Her sorunun yanında ne demek olduğu ve nasıl düzeltileceği yazıyor</p>
        </div>

        <div className="divide-y divide-zinc-50">
          {issues.map((issue, i) => (
            <div key={i} className="flex items-start gap-3 sm:gap-4 px-4 py-3 sm:px-5 sm:py-4 transition hover:bg-zinc-50/50">
              <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm ${
                issue.severity === "critical" ? "bg-red-50 text-red-500" :
                issue.severity === "warning" ? "bg-amber-50 text-amber-500" :
                "bg-blue-50 text-blue-500"
              }`}>
                {issue.severity === "critical" ? "🚨" : issue.severity === "warning" ? "⚠️" : "ℹ️"}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-[13px] font-bold text-zinc-900">{issue.title}</h4>
                  <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold ${
                    issue.severity === "critical" ? "bg-red-100 text-red-700" :
                    issue.severity === "warning" ? "bg-amber-100 text-amber-700" :
                    "bg-blue-100 text-blue-700"
                  }`}>
                    {issue.severity === "critical" ? "Kritik" : issue.severity === "warning" ? "Uyarı" : "Bilgi"}
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
                  {issue.description}
                  {issue.impact && <> <strong className="text-zinc-700">{issue.impact}</strong></>}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {issue.actions.map((action, j) => (
                    <button
                      key={j}
                      onClick={() => fetchIssueDetails(mapTitleToTaskType(issue.title), issue.title + " — Detay")}
                      className={`rounded-lg px-3 py-1 text-[9px] font-bold transition ${
                        j === 0
                          ? "bg-brand text-white shadow-sm hover:bg-brand-dark"
                          : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                      }`}>{action}</button>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-zinc-500">{issue.count} sayfa</span>
              </div>
            </div>
          ))}

          {issues.length === 0 && (
            <div className="px-5 py-12 text-center">
              <span className="text-3xl">🎉</span>
              <p className="mt-2 text-sm font-bold text-emerald-600">Hiçbir teknik sorun tespit edilmedi!</p>
              <p className="mt-1 text-[11px] text-zinc-400">Siteniz teknik açıdan sağlıklı görünüyor.</p>
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════
          SCHEMA MARKUP DURUMU
          ════════════════════════════════════════ */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-zinc-900">Yapısal Veri (Schema) Durumu</h3>
            <p className="mt-0.5 text-[10px] text-zinc-400">Schema markup&apos;lar arama sonuçlarında yıldız, fiyat gibi zengin sonuçlar gösterir</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-[9px] font-bold ${
            hs.schema_missing > 10 ? "bg-red-100 text-red-700" : hs.schema_missing > 0 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
          }`}>
            {hs.schema_missing > 0 ? `${hs.schema_missing} sayfada eksik` : "Tamamı ekli"}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {schemas.map((schema, i) => (
            <div key={i} className={`rounded-xl border p-3.5 text-center transition ${
              schema.status === "ok" ? "border-emerald-200 bg-emerald-50/50" : "border-zinc-200 bg-white"
            }`}>
              <span className="text-lg">{schema.icon}</span>
              <p className="mt-1 text-[11px] font-bold text-zinc-900">{schema.label}</p>
              <p className={`mt-0.5 text-[9px] font-semibold ${
                schema.status === "ok" ? "text-emerald-600" : "text-zinc-400"
              }`}>
                {schema.status === "ok" ? "✓ Aktif" : "— Eksik"}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════
          DETAY PANELİ (Slide-over)
          ════════════════════════════════════════ */}
      {detailPanel.open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30" onClick={() => setDetailPanel(prev => ({ ...prev, open: false }))} />
          {/* Panel */}
          <div className="relative w-full sm:w-[480px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">{detailPanel.title}</h3>
                <p className="text-[10px] text-zinc-400">{detailPanel.items.length} kayıt bulundu</p>
              </div>
              <button
                onClick={() => setDetailPanel(prev => ({ ...prev, open: false }))}
                className="rounded-lg border border-zinc-200 px-2 py-1 text-[10px] font-bold text-zinc-500 transition hover:bg-zinc-50"
              >✕ Kapat</button>
            </div>

            {/* İçerik */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {detailPanel.loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-brand" />
                  <span className="ml-2 text-xs text-zinc-500">Yükleniyor...</span>
                </div>
              ) : detailPanel.items.length === 0 ? (
                <div className="py-16 text-center">
                  <span className="text-2xl">📭</span>
                  <p className="mt-2 text-sm font-semibold text-zinc-600">Kayıt Bulunamadı</p>
                  <p className="mt-1 text-[11px] text-zinc-400">Bu sorun türüne ait açık kayıt henüz bulunmuyor.</p>
                </div>
              ) : (
                detailPanel.items.map((item) => (
                  <div key={item.id} className="rounded-xl border border-zinc-100 p-4 transition hover:border-zinc-200 hover:shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold ${
                        item.priority === "critical" ? "bg-red-100 text-red-700" :
                        item.priority === "high" ? "bg-orange-100 text-orange-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>{item.priority}</span>
                      <span className="text-[9px] text-zinc-400">#{item.id}</span>
                    </div>
                    <h4 className="mt-2 text-[12px] font-bold text-zinc-900 leading-snug">{item.title}</h4>
                    <p className="mt-1 text-[10px] text-zinc-500 leading-relaxed">{item.description}</p>
                    {item.target_url && (
                      <a
                        href={item.target_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 block truncate rounded-lg bg-zinc-50 px-3 py-1.5 text-[10px] font-medium text-blue-600 transition hover:bg-blue-50"
                      >🔗 {item.target_url}</a>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   ALT BİLEŞENLER
   ═══════════════════════════════════════════ */

function MetricCard({ title, value, subtitle, subtitleColor, borderColor }: {
  title: string; value: string; subtitle: string; subtitleColor: string; borderColor: string;
}) {
  return (
    <div className={`rounded-2xl border border-zinc-200 border-l-4 ${borderColor} bg-white p-3 sm:p-4 flex flex-col justify-center`}>
      <span className="text-[9px] sm:text-[10px] font-semibold text-zinc-400">{title}</span>
      <p className="mt-1 text-xl sm:text-2xl font-black text-zinc-900">{value}</p>
      <span className={`mt-1 text-[9px] sm:text-[10px] font-medium ${subtitleColor}`}>{subtitle}</span>
    </div>
  );
}

function mapTitleToTaskType(title: string): string {
  if (title.includes("404")) return "404_error";
  if (title.includes("Çakışan") || title.includes("Duplicate")) return "cannibalization";
  if (title.includes("Dizine") || title.includes("index")) return "not_indexed";
  if (title.includes("Schema") || title.includes("Yıldız")) return "schema_missing";
  if (title.includes("LCP") || title.includes("Hız") || title.includes("Yavaş")) return "speed_issue";
  if (title.includes("Mobil")) return "speed_issue";
  return "unknown";
}

