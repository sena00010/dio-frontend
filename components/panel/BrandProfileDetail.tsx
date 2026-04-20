"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { 
  BuildingOffice2Icon, PaintBrushIcon, MapPinIcon, LinkIcon, DocumentTextIcon, 
  SparklesIcon, PhotoIcon, PresentationChartLineIcon, UsersIcon, ShieldExclamationIcon,
  ChatBubbleLeftRightIcon
} from "@heroicons/react/24/outline";

interface BrandProfileDetailProps {
  brand: any;
  onBack: () => void;
  onEdit: () => void;
}

export default function BrandProfileDetail({ brand, onBack, onEdit }: BrandProfileDetailProps) {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"genel"|"icerikler"|"gorseller"|"seo">("genel");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!brand?.id) return;
    setLoading(true);
    api
      .get(`/api/protected/companies/${brand.id}/detail`)
      .then((res) => {
        setDetails(res.data);
      })
      .catch((err) => console.error("Detay yüklenemedi:", err))
      .finally(() => setLoading(false));
  }, [brand?.id]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-brand/20 border-t-brand" />
          <span className="text-sm font-medium text-slate-500 animate-pulse">Marka verileri derleniyor...</span>
        </div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="text-center py-20 text-muted">
        Veriler yüklenemedi veya marka bulunamadı.
        <br />
        <button onClick={onBack} className="mt-4 text-brand font-semibold underline">Geri Dön</button>
      </div>
    );
  }

  // Parse JSON data robustly
  const parsedTA = (() => { try { return JSON.parse(brand.target_audience || "{}"); } catch { return {}; } })();
  const parsedColors: string[] = (() => { try { return JSON.parse(brand.brand_colors || "[]"); } catch { return []; } })();
  const parsedSocials = (() => { try { return JSON.parse(brand.social_media || "{}"); } catch { return {}; } })();

  // Determine Connected Platforms
  const connectedPlatforms = Object.entries(parsedSocials)
    .filter(([_, url]) => url)
    .map(([platform]) => platform);

  // Time Formatter
  const timeAgo = (d: string) => {
    const ms = Date.now() - new Date(d).getTime();
    const m = Math.floor(ms / 60000);
    if (m < 60) return `${m} dk önce`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} saat önce`;
    return format(new Date(d), "d MMM", { locale: tr });
  };

  // Safe checks for empty arrays
  const ideas = details.ideas || [];
  const studios = details.studios || [];
  const adVariants = details.ad_variants || [];
  const briefs = details.briefs || [];
  const competitors = brand?.competitors || [];

  // Filter ideas
  const filteredIdeas = ideas.filter((idea: any) => 
    (idea.title && idea.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (idea.platform && idea.platform.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* ─── HEADER & NAIVGATION ─── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-5">
          <button onClick={onBack} className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-brand hover:text-white transition-colors shadow-sm">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          
          <div className="flex items-center gap-4">
            {brand.logo_url ? (
              <img src={`${process.env.NEXT_PUBLIC_API_URL}${brand.logo_url}`} alt={brand.name} className="h-20 w-20 rounded-2xl border-2 border-white shadow-xl object-cover bg-white" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-white shadow-xl text-3xl font-bold text-white tracking-widest">
                {brand.name[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{brand.name}</h1>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  <BuildingOffice2Icon className="w-3.5 h-3.5" />
                  {brand.sector || "Sektör Belirtilmedi"}
                </span>
                {brand.website && (
                  <a href={brand.website.startsWith('http') ? brand.website : `https://${brand.website}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-blue-50/80 px-3 py-1 text-xs font-semibold text-blue-700 hover:underline">
                    <LinkIcon className="w-3.5 h-3.5" />
                    {brand.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  </a>
                )}
                {brand.content_language && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 uppercase">
                    {brand.content_language}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <button onClick={onEdit} className="shrink-0 flex items-center justify-center rounded-xl bg-white border border-slate-200 px-6 py-2.5 text-sm font-extrabold text-slate-700 shadow-sm hover:shadow-md hover:bg-slate-50 transition-all">
          <PaintBrushIcon className="w-4 h-4 mr-2" /> Profili & Rakipleri Düzenle
        </button>
      </div>

      {/* ─── TABS ─── */}
      <div className="flex items-center justify-start overflow-x-auto border-b border-slate-200 no-scrollbar gap-8 px-2">
        <button onClick={()=>setActiveTab("genel")} className={`whitespace-nowrap pb-3 text-sm font-bold transition-colors ${activeTab === "genel" ? "text-brand border-b-2 border-brand" : "text-slate-400 hover:text-slate-800 border-b-2 border-transparent"}`}>Genel Bakış & Profil</button>
        <button onClick={()=>setActiveTab("icerikler")} className={`whitespace-nowrap pb-3 text-sm font-bold transition-colors ${activeTab === "icerikler" ? "text-brand border-b-2 border-brand" : "text-slate-400 hover:text-slate-800 border-b-2 border-transparent"}`}>İçerik Stratejisi ({details.total_ideas})</button>
        <button onClick={()=>setActiveTab("gorseller")} className={`whitespace-nowrap pb-3 text-sm font-bold transition-colors ${activeTab === "gorseller" ? "text-brand border-b-2 border-brand" : "text-slate-400 hover:text-slate-800 border-b-2 border-transparent"}`}>Reklam & Medya ({details.total_img_variants + details.total_ad_variants})</button>
        <button onClick={()=>setActiveTab("seo")} className={`whitespace-nowrap pb-3 text-sm font-bold transition-colors ${activeTab === "seo" ? "text-brand border-b-2 border-brand" : "text-slate-400 hover:text-slate-800 border-b-2 border-transparent"}`}>SEO & Rakipler ({competitors.length})</button>
      </div>

      {/* ─── TAB CONTENT: GENEL BAKIŞ ─── */}
      {activeTab === "genel" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {/* KPI CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: "SosyMedya Paylaşımı", val: details.total_posts || 0, trend: "Yayında" },
              { label: "SEO İçerik Briefi", val: details.total_briefs || 0, trend: "Hazır" },
              { label: "Varyant ve Reklamlar", val: details.total_img_variants + details.total_ad_variants, trend: "Stüdyoda" },
              { label: "Analiz Edilen Rakip", val: competitors.length, trend: "Takipte" },
            ].map(kpi => (
              <div key={kpi.label} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{kpi.label}</p>
                <div className="flex items-end justify-between">
                  <p className="text-4xl font-black text-slate-800">{kpi.val}</p>
                  <p className="text-xs font-semibold text-emerald-500 bg-emerald-50 px-2.5 py-1 rounded-md">{kpi.trend}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT COLUMN - BRAND PROFILE */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              {/* Slogan & Description */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-brand to-purple-500" />
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2 mb-4">
                  <DocumentTextIcon className="w-5 h-5 text-brand" /> Marka Kimliği
                </h3>
                
                {brand.slogan && (
                  <div className="mb-4">
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Motto / Slogan</p>
                    <p className="text-lg font-bold text-indigo-900 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 italic">&quot;{brand.slogan}&quot;</p>
                  </div>
                )}
                
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Hakkında & Vizyon</p>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    {brand.description || "Marka açıklaması veya vizyonu henüz sisteme eklenmemiş."}
                  </p>
                </div>
              </div>

              {/* Advanced Attributes */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-center items-start">
                  <ChatBubbleLeftRightIcon className="w-5 h-5 text-amber-500 mb-2" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Üslup / Tone</p>
                  <p className="text-sm font-bold text-slate-800 capitalize mt-0.5">{brand.tone_of_voice || "Standart"}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-center items-start">
                  <MapPinIcon className="w-5 h-5 text-sky-500 mb-2" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Marka Tipi</p>
                  <p className="text-sm font-bold text-slate-800 capitalize mt-0.5">{brand.brand_type || "Belirtilmemiş"}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-center items-start">
                  <PaintBrushIcon className="w-5 h-5 text-rose-500 mb-2" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Kurumsal Font</p>
                  <p className="text-sm font-bold text-slate-800 capitalize mt-0.5">{brand.brand_font || "Inter"}</p>
                </div>
                 <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-center items-start">
                  <LinkIcon className="w-5 h-5 text-emerald-500 mb-2" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Bağlı Platform</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{connectedPlatforms.length > 0 ? connectedPlatforms.length : "Yok"}</p>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN - TARGET & COLORS */}
            <div className="lg:col-span-4 flex flex-col gap-6">
               
               {/* Target Audience */}
               <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                 <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-4">
                    <UsersIcon className="w-4 h-4 text-emerald-500" /> Hedef Kitle
                 </h3>
                 {(!parsedTA.text && !parsedTA.genders?.length && !parsedTA.ages?.length) ? (
                   <p className="text-xs text-slate-500 italic">Spesifik bir kitle tanımlanmamış. Herkese hitap ediyor.</p>
                 ) : (
                   <div className="space-y-4">
                     {parsedTA.text && <p className="text-sm font-medium text-slate-700">{parsedTA.text}</p>}
                     
                     <div className="flex flex-col gap-2">
                       {parsedTA.genders?.length > 0 && (
                         <div className="flex items-center gap-2">
                           <span className="text-[10px] font-bold text-slate-400 w-16">CİNSİYET:</span>
                           <div className="flex flex-wrap gap-1.5">{parsedTA.genders.map((g:string, i:number)=>(<span key={i} className="bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded text-xs">{g}</span>))}</div>
                         </div>
                       )}
                       {parsedTA.ages?.length > 0 && (
                         <div className="flex items-center gap-2">
                           <span className="text-[10px] font-bold text-slate-400 w-16">YAŞ:</span>
                           <div className="flex flex-wrap gap-1.5">{parsedTA.ages.map((a:string, i:number)=>(<span key={i} className="bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded text-xs">{a}</span>))}</div>
                         </div>
                       )}
                     </div>
                   </div>
                 )}
               </div>

                {/* Colors */}
               <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                 <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-4">
                    <SparklesIcon className="w-4 h-4 text-brand" /> Kurumsal Renkler
                 </h3>
                 {parsedColors.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {parsedColors.map((c, i) => (
                        <div key={i} className="flex flex-col items-center gap-1.5">
                          <div className="w-12 h-12 rounded-xl shadow-lg border border-black/5 relative overflow-hidden group">
                             <div className="absolute inset-0" style={{backgroundColor: c}} />
                             <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />
                          </div>
                          <span className="text-[10px] font-bold font-mono text-slate-500 uppercase">{c}</span>
                        </div>
                      ))}
                    </div>
                 ) : (
                    <p className="text-xs text-slate-500 italic">Renk tanımlanmamış. Görseller standart tonlarda üretilir.</p>
                 )}
               </div>

               {/* Forbidden words */}
               {brand.forbidden_words && (
                  <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 shadow-sm">
                    <h3 className="text-xs font-black text-rose-900 uppercase tracking-widest flex items-center gap-2 mb-3">
                        <ShieldExclamationIcon className="w-4 h-4" /> Yasaklı Kelimeler
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {brand.forbidden_words.split(',').map((w: string)=>w.trim()).filter(Boolean).map((word: string, i: number)=>(
                        <span key={i} className="bg-rose-100 text-rose-800 font-bold px-2 py-1 rounded border border-rose-200 text-xs shadow-sm line-through decoration-rose-300">
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
               )}

            </div>
          </div>
        </div>
      )}

      {/* ─── TAB CONTENT: İÇERİKLER & SOSYAL MEDYA ─── */}
      {activeTab === "icerikler" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-black text-slate-800 tracking-tight">Oluşturulan Yapay Zeka İçerik Fikirleri</h2>
            <input 
              type="text" 
              placeholder="İçerik başlığı veya platform ara..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 text-sm border border-slate-200 rounded-full w-64 shadow-sm focus:ring-2 focus:ring-brand focus:border-brand outline-none"
            />
          </div>

          {filteredIdeas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredIdeas.map((idea: any) => (
                <div key={idea.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-3 border-b border-slate-100 pb-3">
                    <span className="text-xs font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{idea.platform}</span>
                    {idea.is_selected ? (
                       <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded">✓ Planlandı</span>
                    ) : (
                       <span className="text-[10px] font-bold text-slate-400">{timeAgo(idea.created_at)}</span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 line-clamp-2 leading-relaxed mb-2 min-h-[40px]">{idea.title}</h4>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                    <span className="text-[10px] font-bold text-slate-400 capitalize">{idea.campaign_type}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${idea.ai_score > 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>Skor: {idea.ai_score}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <div className="bg-slate-50 border border-dashed border-slate-300 rounded-3xl py-20 flex flex-col items-center justify-center text-center">
               <PresentationChartLineIcon className="w-12 h-12 text-slate-300 mb-4" />
               <p className="text-sm font-bold text-slate-500 mb-1">Hiç içerik bulunamadı</p>
               <p className="text-xs text-slate-400">DIO henüz bu marka için yeni nesil içerik stratejisi belirlememiş.</p>
             </div>
          )}
        </div>
      )}

      {/* ─── TAB CONTENT: REKLAM & MEDYA (Stüdyo + Ad Variants) ─── */}
      {activeTab === "gorseller" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-10">
          
          {/* Ad Variants First (More Impressive) */}
          <section>
            <h2 className="text-lg font-black text-slate-800 tracking-tight mb-4 flex items-center gap-2">
               <PhotoIcon className="w-5 h-5 text-indigo-500" /> Üretilen Reklam Setleri ve Metinli Görseller
            </h2>
            {adVariants.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {adVariants.map((ad: any) => (
                  <div key={ad.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm group hover:-translate-y-1 transition-all duration-300 hover:shadow-lg">
                    <div className="aspect-[4/5] bg-slate-100 relative">
                      {ad.preview_url ? (
                        <img src={ad.preview_url.startsWith('h') ? ad.preview_url : `${process.env.NEXT_PUBLIC_API_URL}${ad.preview_url}`} alt={ad.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">Görsel Yok</div>
                      )}
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-black text-white">{ad.platform}</div>
                    </div>
                    <div className="p-4">
                      <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 line-clamp-1">{ad.format_label}</p>
                      <h4 className="text-xs font-bold text-slate-800 line-clamp-2">{ad.headline || "Metin Eklenmemiş"}</h4>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
               <div className="bg-slate-50 border border-dashed border-slate-300 rounded-3xl py-12 flex flex-col items-center justify-center text-center">
                 <p className="text-sm font-bold text-slate-500">Henüz reklam setiniz yok</p>
               </div>
            )}
          </section>

          {/* Base Product Studios */}
          <section>
            <h2 className="text-lg font-black text-slate-800 tracking-tight mb-4">Temel Ürün Çekimleri (Stüdyo)</h2>
            {studios.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {studios.map((stu: any) => (
                  <div key={stu.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="aspect-square bg-slate-100 relative group">
                       {stu.source_image_url ? (
                          <img src={stu.source_image_url.startsWith('h') ? stu.source_image_url : `${process.env.NEXT_PUBLIC_API_URL}${stu.source_image_url}`} alt={stu.title} className="w-full h-full object-cover" />
                       ) : (
                          <div className="flex items-center justify-center w-full h-full text-zinc-300 text-xs">Resim Yok</div>
                       )}
                       <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <div className="text-center">
                           <span className="block text-xl font-black text-white">{stu.variant_count}</span>
                           <span className="text-[10px] font-bold text-slate-300 uppercase">Varyasyon</span>
                         </div>
                       </div>
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-bold text-slate-800 truncate">{stu.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{stu.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-300 rounded-3xl py-12 flex flex-col items-center justify-center text-center">
                 <p className="text-sm font-bold text-slate-500">Temel stüdyo gönderisi yok</p>
               </div>
            )}
          </section>

        </div>
      )}

      {/* ─── TAB CONTENT: SEO & RAKİPLER ─── */}
      {activeTab === "seo" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Competitors List */}
          <section>
             <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                  <span className="text-2xl">🎯</span> Kayıtlı Rakipler
                </h2>
                <button onClick={onEdit} className="text-xs font-bold text-brand hover:underline">Rakipleri Yönet</button>
             </div>
             {competitors.length > 0 ? (
               <div className="space-y-3">
                 {competitors.map((comp: any) => (
                   <div key={comp.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-1 transition hover:shadow-md">
                      <span className="text-sm font-black text-slate-800 uppercase tracking-wide">{comp.name}</span>
                      {comp.website && (
                         <a href={comp.website.startsWith('http') ? comp.website : `https://${comp.website}`} target="_blank" rel="noreferrer" className="text-xs font-semibold text-blue-500 flex items-center gap-1 w-fit hover:bg-blue-50 px-2 py-0.5 rounded -ml-2 transition">
                           <LinkIcon className="w-3 h-3" /> {comp.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                         </a>
                      )}
                   </div>
                 ))}
               </div>
             ) : (
               <div className="bg-slate-50 border border-dashed border-slate-300 rounded-3xl py-16 flex flex-col items-center justify-center text-center">
                 <p className="text-sm font-bold text-slate-500 mb-1">Rakip tanımlanmamış</p>
                 <p className="text-xs text-slate-400">Rakiplerinizi ekleyerek AI'nin analiz etmesini sağlayın.</p>
               </div>
             )}
          </section>

          {/* SEO Content Briefs */}
          <section>
             <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                  <DocumentTextIcon className="w-5 h-5 text-emerald-500" /> Web Kılavuzları & Briefler
                </h2>
             </div>
             {briefs.length > 0 ? (
               <div className="space-y-4 pr-1 max-h-[600px] overflow-y-auto no-scrollbar">
                  {briefs.map((b: any) => (
                    <div key={b.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm group">
                      <div className="flex justify-between items-start mb-2 border-b border-slate-100 pb-2">
                        <h3 className="text-sm font-bold text-slate-800 pr-4 leading-snug">{b.title}</h3>
                        <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded shrink-0">
                          {format(new Date(b.created_at), "d MMM", { locale: tr })}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-600 line-clamp-3 leading-relaxed mb-4">{b.content}</p>
                      
                      <button 
                        onClick={() => {
                            window.location.hash = "icerik-studyo";
                            localStorage.setItem("active_brief_fill", JSON.stringify({ title: b.title, content: b.content }));
                        }}
                        className="inline-flex w-full justify-center items-center gap-2 rounded-xl bg-slate-900 border-2 border-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-white hover:text-slate-900 transition-all"
                      >
                        <SparklesIcon className="w-4 h-4" /> İçerik Stüdyosuna Aktar
                      </button>
                    </div>
                  ))}
               </div>
             ) : (
               <div className="bg-slate-50 border border-dashed border-slate-300 rounded-3xl py-16 flex flex-col items-center justify-center text-center">
                 <p className="text-sm font-bold text-slate-500 mb-1">SEO Briefi bulunamadı</p>
                 <p className="text-xs text-slate-400">SEO stratejiniz olgunlaştıkça burada görünecektir.</p>
               </div>
             )}
          </section>

        </div>
      )}

    </div>
  );
}
