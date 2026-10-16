"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDownTrayIcon, FilmIcon, SparklesIcon } from "@heroicons/react/24/outline";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/Toast";
import { getApiError } from "@/lib/apiError";

// İçerikten otomatik kısa video: senaryo → sahne görselleri → Türkçe seslendirme → alt yazılı MP4

type Video = {
  id: number; title: string; brief: string; duration_sec: number; format: string; voice: string;
  status: "queued" | "running" | "done" | "failed"; stage: string; progress: number;
  language?: string; subtitles?: boolean; source_url?: string;
  video_url: string; thumb_url: string; error: string; created_at: string;
};
type PostLite = { id: number; title: string; content: string };

const DURATIONS = [15, 30, 60, 90];
const LANGUAGES: [string, string][] = [["tr", "Türkçe"], ["en", "English"], ["de", "Deutsch"], ["fr", "Français"], ["es", "Español"], ["ar", "العربية"], ["ru", "Русский"], ["az", "Azərbaycanca"], ["nl", "Nederlands"], ["it", "Italiano"]];
const API = process.env.NEXT_PUBLIC_API_URL || "";
const abs = (u?: string) => (!u ? "" : u.startsWith("/") ? `${API}${u}` : u);

export default function VideoScreen() {
  const { activeCompany } = useAuth();
  const toast = useToast();
  const [brief, setBrief] = useState("");
  const [duration, setDuration] = useState(60);
  const [custom, setCustom] = useState("");
  const [format, setFormat] = useState<"9:16" | "1:1">("9:16");
  const [voice, setVoice] = useState<"kadin" | "erkek" | "yok">("kadin");
  const [pronunciation, setPronunciation] = useState("");
  const [source, setSource] = useState<"text" | "link">("text");
  const [link, setLink] = useState("");
  const [language, setLanguage] = useState("tr");
  const [subtitles, setSubtitles] = useState(true);
  const [intro, setIntro] = useState(true);
  const [posts, setPosts] = useState<PostLite[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [creating, setCreating] = useState(false);
  const [playing, setPlaying] = useState<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    if (!activeCompany) return;
    try {
      const { data } = await api.get(`/api/protected/videos?company_id=${activeCompany.id}`);
      setVideos(data.videos || []);
    } catch { /* liste boş kalır */ }
  }, [activeCompany]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!activeCompany) return;
    api.get(`/api/protected/posts?company_id=${activeCompany.id}`)
      .then(({ data }) => setPosts((data.posts || data || []).slice(0, 20)))
      .catch(() => setPosts([]));
  }, [activeCompany]);

  // Üretimde olan varsa 4 sn'de bir yenile
  const anyRunning = videos.some(v => v.status === "queued" || v.status === "running");
  useEffect(() => {
    if (anyRunning && !pollRef.current) pollRef.current = setInterval(load, 4000);
    if (!anyRunning && pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  }, [anyRunning, load]);

  const finalDuration = custom ? Math.min(180, Math.max(10, Number(custom) || 60)) : duration;

  const create = async () => {
    if (!activeCompany) return;
    if (source === "link" && !/^https?:\/\/\S+\.\S+/.test(link.trim())) {
      toast.error("Geçerli bir web adresi girin (https:// ile başlayan).");
      return;
    }
    if (source === "text" && brief.trim().length < 10) {
      toast.error("Videonun anlatacağı içeriği en az bir cümleyle yazın.");
      return;
    }
    setCreating(true);
    try {
      await api.post("/api/protected/videos", {
        company_id: activeCompany.id, brief, duration_sec: finalDuration, format, voice, pronunciation,
        language, subtitles, intro, source_url: source === "link" ? link.trim() : "",
      });
      toast.success("Video hazırlanıyor. Bu sayfadan ilerlemesini takip edebilirsiniz.");
      setBrief(""); setLink("");
      load();
    } catch (err) {
      toast.error(getApiError(err, "Video başlatılamadı."));
    } finally {
      setCreating(false);
    }
  };

  const chip = (on: boolean) => `rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${on ? "border-brand bg-brand-soft text-brand" : "border-line bg-white text-zinc-600 hover:border-zinc-300"}`;
  const scenes = Math.max(3, Math.round(finalDuration / 5));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Video Oluştur</h1>
        <p className="mt-1 text-sm text-muted">İçeriğinizi yazın ya da bir link verin; DIO senaryoyu yazsın, sahne görsellerini üretsin, seçtiğiniz dilde seslendirsin ve markanıza özel videoyu hazırlasın.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* Form */}
        <section className="card space-y-5 p-5">
          <div className="flex rounded-xl bg-zinc-100 p-1" role="tablist" aria-label="İçerik kaynağı">
            {([["text", "Metinden"], ["link", "Linkten"]] as const).map(([v, l]) => (
              <button key={v} type="button" role="tab" aria-selected={source === v} onClick={() => setSource(v)}
                className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${source === v ? "bg-white text-foreground shadow-sm" : "text-muted"}`}>{l}</button>
            ))}
          </div>

          {source === "link" && (
            <div>
              <label htmlFor="video-link" className="mb-1.5 block text-sm font-semibold">Sayfa linki</label>
              <input id="video-link" type="url" value={link} onChange={e => setLink(e.target.value)} placeholder="https://ornek.com/urun-ya-da-blog-yazisi"
                className="w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand" />
              <p className="mt-1 text-[11px] text-muted">DIO sayfadaki içeriği okur ve videoyu ona göre kurgular. Aşağıya ek not da yazabilirsiniz.</p>
            </div>
          )}

          <div>
            <label htmlFor="video-brief" className="mb-1.5 block text-sm font-semibold">{source === "link" ? "Ek not (isteğe bağlı)" : "Video ne anlatsın?"}</label>
            <textarea id="video-brief" value={brief} onChange={e => setBrief(e.target.value)} rows={source === "link" ? 3 : 5}
              placeholder="Örn: Kahve dükkânımızın yeni sezon menüsü — 3 imza içeceğimiz, taze kavrulmuş çekirdek ve hafta sonu %10 indirim."
              className="w-full rounded-xl border border-line px-3.5 py-3 text-sm outline-none focus:border-brand" />
            {posts.length > 0 && (
              <select aria-label="Gönderiden doldur" value="" onChange={e => { const p = posts.find(x => String(x.id) === e.target.value); if (p) setBrief(`${p.title}\n\n${p.content}`); }}
                className="mt-2 w-full rounded-lg border border-line bg-white px-3 py-2 text-xs text-zinc-600 outline-none">
                <option value="">Ya da mevcut bir gönderiden doldurun…</option>
                {posts.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            )}
          </div>

          <div>
            <p className="mb-1.5 text-sm font-semibold">Süre</p>
            <div className="flex flex-wrap items-center gap-1.5">
              {DURATIONS.map(d => <button key={d} type="button" className={chip(!custom && duration === d)} onClick={() => { setDuration(d); setCustom(""); }}>{d} sn</button>)}
              <input type="number" min={10} max={180} value={custom} onChange={e => setCustom(e.target.value)} placeholder="Özel (sn)"
                aria-label="Özel süre (saniye)" className={`w-24 rounded-lg border px-2.5 py-1.5 text-xs outline-none ${custom ? "border-brand" : "border-line"}`} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 text-sm font-semibold">Format</p>
              <div className="flex gap-1.5">
                <button type="button" className={chip(format === "9:16")} onClick={() => setFormat("9:16")}>Dikey 9:16 · Reels/TikTok</button>
                <button type="button" className={chip(format === "1:1")} onClick={() => setFormat("1:1")}>Kare 1:1</button>
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-sm font-semibold">Seslendirme</p>
              <div className="flex gap-1.5">
                {([["kadin", "Kadın sesi"], ["erkek", "Erkek sesi"], ["yok", "Sessiz"]] as const).map(([v, l]) => (
                  <button key={v} type="button" className={chip(voice === v)} onClick={() => setVoice(v)}>{l}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="video-lang" className="mb-1.5 block text-sm font-semibold">Video dili</label>
              <select id="video-lang" value={language} onChange={e => setLanguage(e.target.value)}
                className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand">
                {LANGUAGES.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
              </select>
              <p className="mt-1 text-[11px] text-muted">Senaryo bu dilde yazılır, ana dili gibi seslendirilir.</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold">Seçenekler</p>
              {([["Altyazı", subtitles, setSubtitles, "Ekranda kısa yazılar"], ["Marka girişi", intro, setIntro, "Başta logolu açılış + köşede logo"]] as const).map(([label, on, set, hint]) => (
                <label key={label} className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-line px-3 py-2">
                  <span><span className="block text-xs font-semibold">{label}</span><span className="block text-[11px] text-muted">{hint}</span></span>
                  <input type="checkbox" checked={on} onChange={e => set(e.target.checked)} className="h-4 w-4 accent-[var(--brand)]" />
                </label>
              ))}
            </div>
          </div>

          {voice !== "yok" && (
            <div>
              <label htmlFor="video-pron" className="mb-1.5 block text-sm font-semibold">Telaffuz <span className="font-normal text-muted">(isteğe bağlı)</span></label>
              <input id="video-pron" value={pronunciation} onChange={e => setPronunciation(e.target.value)}
                placeholder="Örn: İNKA=İnka, DIO=Dio"
                className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand" />
              <p className="mt-1 text-[11px] text-muted">Seslendirmede yanlış okunan marka/kelime varsa nasıl okunacağını yazın.</p>
            </div>
          )}

          <div className="rounded-xl bg-zinc-50 px-4 py-3 text-xs text-muted">
            ~{scenes} sahne · {finalDuration} sn · her sahne için AI görsel{voice !== "yok" ? `, ${LANGUAGES.find(l => l[0] === language)?.[1]} seslendirme` : ""} {subtitles ? " ve marka renginde altyazı" : ", altyazısız"}{intro ? ", logolu marka girişi" : ""}. Seslendirme sakin tempoda olduğu için süre birkaç saniye değişebilir. Hazırlanması genelde 1-3 dakika sürer.
          </div>

          <button type="button" onClick={create} disabled={creating || !activeCompany}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-dark disabled:opacity-60">
            <SparklesIcon className="h-5 w-5" /> {creating ? "Başlatılıyor…" : `${finalDuration} saniyelik videoyu oluştur`}
          </button>
        </section>

        {/* Videolar */}
        <section className="card p-5">
          <h2 className="mb-4 text-base font-bold">Videolarınız</h2>
          {videos.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl border border-dashed border-line py-14 text-center">
              <FilmIcon className="h-10 w-10 text-zinc-300" />
              <p className="mt-3 text-sm font-medium">Henüz video yok</p>
              <p className="mt-1 text-xs text-muted">İlk videonuzu soldan oluşturun.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {videos.map(v => (
                <li key={v.id} className="rounded-xl border border-line p-3">
                  <div className="flex gap-3">
                    <div className={`relative shrink-0 overflow-hidden rounded-lg bg-zinc-100 ${v.format === "1:1" ? "h-20 w-20" : "h-28 w-16"}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {v.thumb_url && <img src={abs(v.thumb_url)} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-semibold">{v.title}</p>
                      <p className="mt-0.5 text-[11px] text-muted">{v.duration_sec} sn · {v.format} · {v.voice === "yok" ? "Sessiz" : v.voice === "erkek" ? "Erkek sesi" : "Kadın sesi"}{v.language && v.language !== "tr" ? ` · ${LANGUAGES.find(l => l[0] === v.language)?.[1] || v.language}` : ""}{v.subtitles === false ? " · altyazısız" : ""}{v.source_url ? " · linkten" : ""}</p>
                      {(v.status === "queued" || v.status === "running") && (
                        <div className="mt-2">
                          <div className="mb-1 flex justify-between text-[11px] font-medium"><span>{v.stage}</span><span className="text-muted">%{v.progress}</span></div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100"><div className="h-full rounded-full bg-brand transition-all duration-700" style={{ width: `${v.progress}%` }} /></div>
                        </div>
                      )}
                      {v.status === "failed" && <p className="mt-2 text-[11px] text-red-600">Üretilemedi: {v.error || "bilinmeyen hata"}</p>}
                      {v.status === "done" && (
                        <div className="mt-2 flex gap-1.5">
                          <button type="button" onClick={() => setPlaying(playing === v.id ? null : v.id)} className="rounded-lg bg-brand px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-brand-dark">
                            {playing === v.id ? "Kapat" : "▶ İzle"}
                          </button>
                          <a href={abs(v.video_url)} download target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-[11px] font-semibold hover:bg-zinc-50">
                            <ArrowDownTrayIcon className="h-3.5 w-3.5" /> İndir (MP4)
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  {playing === v.id && v.status === "done" && (
                    <video src={abs(v.video_url)} controls autoPlay playsInline className={`mx-auto mt-3 rounded-xl bg-black ${v.format === "1:1" ? "w-full max-w-sm" : "max-h-[560px]"}`} />
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
