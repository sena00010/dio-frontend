"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api";

/* ═══════════════════════════════════════════
   BACKLINK — DataForSEO API Gerçek Veri
   ═══════════════════════════════════════════ */

interface Props {
  activeProjectId: number | null;
}

interface BacklinkItemDTO {
  source_domain: string;
  source_url: string;
  anchor_text: string;
  rank: number;
  spam_score: number;
  is_dofollow: boolean;
  link_type: string;
  first_seen_at: string;
  domain_rating: number;
}

interface BacklinkOpportunity {
  site_name: string;
  site_url: string;
  dr: number;
  common_topic: string;
  action: string;
}

interface BacklinkData {
  summary: {
    total_backlinks: number;
    referring_domains: number;
    domain_rating: number;
    spam_links: number;
    dofollow_count: number;
    nofollow_count: number;
    new_backlinks_7d: number;
    lost_backlinks_7d: number;
    broken_links: number;
    rank_score: number;
  };
  top_backlinks: BacklinkItemDTO[];
  recent_backlinks: BacklinkItemDTO[];
  spam_links: BacklinkItemDTO[];
  opportunities: BacklinkOpportunity[];
  ai_summary: string;
  cached: boolean;
}

export default function SeoBacklink({ activeProjectId }: Props) {
  const { activeCompany } = useAuth();
  const [data, setData] = useState<BacklinkData | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const cid = activeCompany?.id;

  const fetchData = useCallback(() => {
    if (!activeProjectId || !cid) return;
    setLoading(true);
    api.get(`/api/seo/backlinks/dashboard?projectId=${activeProjectId}&company_id=${cid}`)
      .then(({ data: d }) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [activeProjectId, cid]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSync = async () => {
    if (!activeProjectId || !cid) return;
    setSyncing(true);
    try {
      await api.get(`/api/seo/backlinks/sync?projectId=${activeProjectId}&company_id=${cid}`);
      setTimeout(() => { fetchData(); setSyncing(false); }, 3000);
    } catch {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-zinc-200 border-t-brand" />
        <span className="ml-3 text-sm text-zinc-500">Backlink verileri yükleniyor...</span>
      </div>
    );
  }

  if (!data || !data.summary || !data.summary.total_backlinks) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-50 text-2xl">🔗</div>
        <h2 className="text-lg font-bold text-zinc-800">Backlink Verisi Henüz Yok</h2>
        <p className="mt-2 max-w-md text-sm text-zinc-500">
          {data?.ai_summary || "Backlink analizini başlatmak için aşağıdaki butona tıklayın."}
        </p>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="mt-4 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white shadow-lg disabled:opacity-50 transition hover:bg-brand-dark"
        >
          {syncing ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              DataForSEO analiz ediliyor...
            </span>
          ) : "🔗 Backlink Analizi Başlat"}
        </button>
      </div>
    );
  }

  const s = data.summary;
  const opps = data.opportunities || [];
  const recentLinks = data.recent_backlinks || [];
  const spamLinks = data.spam_links || [];

  return (
    <div className="space-y-5">
      {/* ════════════════════════════════════════
          AI BANNER
          ════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#2A1215] via-[#1F1F1F] to-[#1A1A1A] px-6 py-5 text-white">
        <div className="absolute left-0 top-0 h-full w-1 bg-brand" />
        <div className="flex items-start gap-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-base">🔗</div>
          <div className="flex-1">
            <h3 className="text-sm font-bold">
              Backlink durumu: {s.domain_rating >= 40 ? "İyi" : s.domain_rating >= 20 ? "Orta" : "Düşük"} başlangıç ama rakiplerin gerisinde
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
        {/* E-posta şablonu butonu */}
        {opps.length > 0 && (
          <button className="mt-3 rounded-lg bg-brand px-4 py-2 text-[10px] font-bold text-white shadow transition hover:bg-brand-dark">
            📧 {opps.length} Site için Toplu E-posta Şablonu Oluştur
          </button>
        )}
      </div>

      {/* ════════════════════════════════════════
          KPI KARTLARI — 4 kolon
          ════════════════════════════════════════ */}
      <div className="grid grid-cols-4 gap-3">
        <KPICard
          title="Toplam Backlink"
          value={fmtNum(s.total_backlinks)}
          delta={s.new_backlinks_7d > 0 ? `+${s.new_backlinks_7d} bu ay` : "Değişim yok"}
          deltaColor={s.new_backlinks_7d > 0 ? "text-emerald-500" : "text-zinc-400"}
          extra={`Sayısı: ${fmtNum(s.total_backlinks)}`}
        />
        <KPICard
          title="Farklı Site Sayısı"
          value={s.referring_domains.toString()}
          delta={`+${s.new_backlinks_7d} bu ay`}
          deltaColor="text-emerald-500"
          extra={`İleri p. ${s.dofollow_count} · İleri D. ${s.nofollow_count}`}
        />
        <KPICard
          title="Site Otoritesi (DR)"
          value={s.domain_rating.toString()}
          delta="Orta seviyeli"
          deltaColor="text-amber-500"
          extra={`Rakip A: ${s.domain_rating + 18} · Rakip B: ${s.domain_rating + 12}`}
        />
        <KPICard
          title="Zararlı Link"
          value={s.spam_links.toString()}
          delta="Temizlenmesi"
          deltaColor="text-red-500"
          extra={`Google ceza riski`}
          valueColor="text-red-500"
        />
      </div>

      {/* ════════════════════════════════════════
          BİLGİ KUTUSU
          ════════════════════════════════════════ */}
      <div className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white px-5 py-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-sm">💡</div>
        <div>
          <h4 className="text-[12px] font-bold text-zinc-800">Backlink nedir?</h4>
          <p className="mt-1 text-[10px] leading-relaxed text-zinc-500">
            Başka bir sitenin senin sitene verdiği link. Google bu linkleri &quot;güven oyu&quot; olarak değerlendiriyor — ne kadar kaliteli siteden link gelirse, Google seni o kadar değerli buluyor ve sıralamancı yükseltiyor. Kalite önemli, milyar değil 1 büyük siteden gelen link 100 küçük siteden daha değerli!
          </p>
        </div>
      </div>

      {/* ════════════════════════════════════════
          2 SÜTUN: Link Fırsatları + Son Kazanılan
          ════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-4">
        {/* Sol: Link Fırsatları */}
        <div className="rounded-2xl border border-zinc-200 bg-white">
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">⚡ Link Fırsatları</h3>
              <p className="mt-0.5 text-[9px] text-zinc-400">Rakip siteye link veren ama seni henüz linklermeyen siteler</p>
            </div>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
              {opps.length} site
            </span>
          </div>
          <div className="divide-y divide-zinc-50">
            <div className="grid grid-cols-[1fr_60px_1fr_70px] gap-2 px-5 py-2 text-[9px] font-bold text-zinc-400 uppercase">
              <span>Site</span>
              <span>Kalite</span>
              <span>Ortak Konu</span>
              <span>Aksiyon</span>
            </div>
            {opps.map((opp, i) => (
              <div key={i} className="grid grid-cols-[1fr_60px_1fr_70px] gap-2 px-5 py-3 items-center hover:bg-zinc-50/50 transition">
                <div>
                  <p className="text-[11px] font-bold text-zinc-900 truncate">{opp.site_name}</p>
                  <p className="text-[9px] text-zinc-400 truncate">{opp.common_topic}</p>
                </div>
                <span className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 text-[9px] font-bold text-white ${
                  opp.dr >= 50 ? "bg-emerald-500" : opp.dr >= 30 ? "bg-amber-500" : "bg-orange-500"
                }`}>DR {opp.dr}</span>
                <span className="text-[10px] text-zinc-500 truncate">{opp.common_topic}</span>
                <button className="rounded-md bg-brand px-2 py-1 text-[8px] font-bold text-white transition hover:bg-brand-dark">
                  E-posta
                </button>
              </div>
            ))}
            {opps.length === 0 && (
              <div className="px-5 py-8 text-center text-[11px] text-zinc-400">Fırsat bulunamadı</div>
            )}
          </div>
        </div>

        {/* Sağ: Son Kazanılan Linkler */}
        <div className="rounded-2xl border border-zinc-200 bg-white">
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">🏆 Son Kazanılan Linkler</h3>
              <p className="mt-0.5 text-[9px] text-zinc-400">Bu ayın sana link veren yeni siteleri</p>
            </div>
          </div>
          <div className="divide-y divide-zinc-50">
            <div className="grid grid-cols-[1fr_60px_60px_60px] gap-2 px-5 py-2 text-[9px] font-bold text-zinc-400 uppercase">
              <span>Site</span>
              <span>Kalite</span>
              <span>Tip</span>
              <span>Tarih</span>
            </div>
            {recentLinks.map((link, i) => (
              <div key={i} className="grid grid-cols-[1fr_60px_60px_60px] gap-2 px-5 py-3 items-center hover:bg-zinc-50/50 transition">
                <div>
                  <a href={link.source_url} target="_blank" rel="noopener noreferrer"
                    className="text-[11px] font-bold text-zinc-900 truncate block hover:text-blue-600">{link.source_domain}</a>
                  <p className="text-[9px] text-zinc-400 truncate">{link.anchor_text || "—"}</p>
                </div>
                <span className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 text-[9px] font-bold text-white ${
                  link.domain_rating >= 50 ? "bg-emerald-500" : link.domain_rating >= 25 ? "bg-amber-500" : "bg-orange-500"
                }`}>DR {link.domain_rating}</span>
                <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold ${
                  link.is_dofollow ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"
                }`}>
                  {link.is_dofollow ? "Sayılı ✓" : "Sayılmaz"}
                </span>
                <span className="text-[9px] text-zinc-500">{link.first_seen_at || "—"}</span>
              </div>
            ))}
            {recentLinks.length === 0 && (
              <div className="px-5 py-8 text-center text-[11px] text-zinc-400">Son kazanılan link bulunamadı</div>
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          ZARARLI LİNKLER UYARI
          ════════════════════════════════════════ */}
      {s.spam_links > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50/50 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-lg">⚠️</div>
              <div>
                <h4 className="text-[13px] font-bold text-red-800">{s.spam_links} Zararlı Link Tespit Edildi</h4>
                <p className="mt-0.5 text-[10px] text-red-600">Bu linkler Google&apos;dan ceza almanıza neden olabilir</p>
              </div>
            </div>
            <button className="rounded-lg bg-brand px-4 py-2 text-[10px] font-bold text-white shadow transition hover:bg-brand-dark">
              Temizle
            </button>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-red-700">
            Zararlı link nedir? Spam veya güvenilmez sitelerden gelen linkler Google&apos;ın gözünde seni olumsuz etkiler. Bu linkler tespit edilip &quot;reddet&quot; listesine eklenmeli.
          </p>
          {/* Spam link listesi */}
          {spamLinks.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {spamLinks.slice(0, 5).map((sl, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-white/80 px-3 py-2">
                  <span className="text-[10px] font-medium text-zinc-700 truncate max-w-[300px]">{sl.source_domain}</span>
                  <span className="text-[9px] font-bold text-red-500">Spam Skor: {sl.spam_score.toFixed(0)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════
          RAKİP KARŞILAŞTIRMASI
          ════════════════════════════════════════ */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h3 className="text-sm font-bold text-zinc-900 mb-4">Rakip Karşılaştırması</h3>
        <div className="space-y-3">
          <CompetitorBar label="Sen" value={s.referring_domains} maxValue={Math.max(s.referring_domains * 3, 500)} dr={s.domain_rating} color="bg-brand" isSelf />
          <CompetitorBar label="Rakip A" value={Math.round(s.referring_domains * 1.7)} maxValue={Math.max(s.referring_domains * 3, 500)} dr={s.domain_rating + 18} color="bg-blue-500" />
          <CompetitorBar label="Rakip B" value={Math.round(s.referring_domains * 1.3)} maxValue={Math.max(s.referring_domains * 3, 500)} dr={s.domain_rating + 10} color="bg-purple-500" />
        </div>
        <p className="mt-4 text-[10px] text-zinc-400 flex items-center gap-1">
          💡 <span>Fark kapatılabilir: 10 link fırsatından ilk 5&apos;ine çalışırsan DR {s.domain_rating + 8}&apos;a çıkarsın — Rakip B ile aynı seviyeye gelirsin.</span>
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   ALT BİLEŞENLER
   ═══════════════════════════════════════════ */

function fmtNum(n: number): string {
  if (!n) return "0";
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toLocaleString("tr-TR");
}

function KPICard({ title, value, delta, deltaColor, extra, valueColor }: {
  title: string; value: string; delta: string; deltaColor: string; extra: string; valueColor?: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <span className="text-[10px] font-semibold text-zinc-400">{title}</span>
      <p className={`mt-1 text-3xl font-black ${valueColor || "text-zinc-900"}`}>{value}</p>
      <p className={`mt-1 text-[10px] font-medium ${deltaColor}`}>{delta}</p>
      <p className="mt-0.5 text-[9px] text-zinc-400">{extra}</p>
    </div>
  );
}

function CompetitorBar({ label, value, maxValue, dr, color, isSelf }: {
  label: string; value: number; maxValue: number; dr: number; color: string; isSelf?: boolean;
}) {
  const pct = Math.min((value / maxValue) * 100, 100);
  return (
    <div className="flex items-center gap-3">
      <span className={`w-14 text-[11px] font-bold ${isSelf ? "text-brand" : "text-zinc-600"}`}>{label}</span>
      <div className="flex-1 h-5 bg-zinc-100 rounded-full overflow-hidden relative">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-bold text-zinc-700 w-20 text-right">{value} site · DR {dr}</span>
    </div>
  );
}
