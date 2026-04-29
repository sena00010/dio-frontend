"use client";

import { useEffect, useState, useRef } from "react";
import adminApi from "../../../lib/adminApi";
import {
  PencilSquareIcon,
  CheckBadgeIcon,
  ArrowPathIcon,
  LanguageIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

interface Prompt {
  id: number;
  prompt_key: string;
  title: string;
  description: string;
  content: string;
  variables: string; // JSON string array
  ai_provider: string;
  ai_model: string;
  is_active: boolean;
  updated_at: string;
  updated_by: string;
}

// Her prompt_key için uygulamada nerede kullanıldığını açıklayan harita
const PROMPT_USAGE_MAP: { [key: string]: { page: string; icon: string; detail: string } } = {
  // Ürün Görsel Stüdyosu
  product_studio_main: {
    page: "Ürün Görseli Stüdyosu",
    icon: "📸",
    detail: "Kullanıcı ürün fotoğrafı yükleyip 'Platform Görsellerini Üret' butonuna bastığında, her varyant (Beyaz, Krem, Koyu, Soft) için bu prompt render edilir ve seçilen AI modeline gönderilir.",
  },
  product_studio_edit: {
    page: "Ürün Görseli Stüdyosu → Görsel Edit API",
    icon: "✂️",
    detail: "OpenAI Image Edit API'ye gönderilen prompt. Ürün fotoğrafının arka planını değiştirmek için kullanılır. Buradaki model seçimi hangi API'nin çağrılacağını belirler.",
  },
  product_image_reference_analyzer: {
    page: "Ürün Görseli Stüdyosu → Görsel Analiz",
    icon: "🔍",
    detail: "Yüklenen ürün fotoğrafını analiz edip 'referenceSummary' oluşturur. Bu özet, diğer promptlara {{.referenceSummary}} değişkeni olarak aktarılır.",
  },
  // Reklam Stüdyosu
  creative_ad_main: {
    page: "Reklam Stüdyosu → Ana Kreatif",
    icon: "🎨",
    detail: "Story, Banner gibi platformlara özel reklam görseli üretimi. Kullanıcı 'Reklam Oluştur' dediğinde bu prompt kullanılır.",
  },
  // Kreatif İçerik
  creative_variant_generator: {
    page: "Kreatif Stüdyo → Varyant Üretici",
    icon: "✨",
    detail: "Sosyal medya paylaşımları için farklı açılardan içerik varyantları üretir.",
  },
  // Konu Önerileri
  ai_idea_generator: {
    page: "İçerik Yönetimi → Konu Önerileri",
    icon: "💡",
    detail: "Marka ve kampanya tipine göre sosyal medya konu önerileri üretir.",
  },
  ai_topic_suggestion: {
    page: "İçerik Yönetimi → Konu Önerileri",
    icon: "📝",
    detail: "Markaya özel sosyal medya konu önerileri üretir.",
  },
  // Marka
  brand_description: {
    page: "Firma ve Markalar → Marka Açıklaması",
    icon: "🏢",
    detail: "Marka bilgileri ve website içeriğinden otomatik marka açıklaması oluşturur.",
  },
};

const VARIABLE_DESCRIPTIONS: { [key: string]: string } = {
  companyName: "Şirketin/Markanın Adı",
  companySector: "Markanın Sektörü",
  categoryHint: "Ürünün Kategorisi",
  companyTargetAudience: "Markanın Hedef Kitlesi",
  companyToneOfVoice: "Markanın İletişim Tonu",
  brandColors: "Markanın Kurumsal Renkleri",
  brandContext: "Marka Özeti (Sektör, hedef kitle vb. toplu)",
  presetPlatform: "Tasarım Platformu (Trendyol, FB vb.)",
  presetWidth: "Tasarım Genişliği (px)",
  presetHeight: "Tasarım Yüksekliği (px)",
  presetName: "Varyant Adı (Beyaz Stüdyo A, Krem Notr B vb.)",
  presetBackground: "Arka Plan Stili (Beyaz, Krem, Koyu, Soft)",
  presetDesignNotes: "Varyanta Özel Tasarım Notu",
  referenceSummary: "Referans Görsel Analiz Özeti",
  inferSourceCreativeDirection: "Görselden Çıkarılan Yaratıcı Yön",
  inferPlatformCreativeRules: "Platforma Özel Tasarım Kuralları",
  inferVisualReferenceStyle: "Referans Estetik/Stil Bilgisi",
  copyHeadline: "Oluşturulan Reklam Başlığı",
  copySubHeadline: "Oluşturulan Alt Başlık",
  copyCTA: "Oluşturulan Eylem Çağrısı (CTA)",
  productHint: "Ürün Özeti",
  sceneDirective: "Sahne Kurulum Talimatı",
  categoryCreativeHint: "Kategoriye Özel Tasarım İpucu",
  presetFormatLabel: "Format Adı (Banner, Story vb.)",
  count: "Üretilecek İçerik Adedi",
  topic: "Kullanıcının Girdiği Ana Konu",
  platform: "Seçilen Sosyal Medya Platformu",
  campaignType: "Kampanya Türü",
  website: "Markanın Websitesi",
  siteContent: "Websitesinden Çıkarılan İçerik",
  sector: "Sektör",
  topicsStr: "Seçilen İçerik Konuları",
  emphasisDesc: "İçerikte Vurgulanacak Detaylar",
  platformsStr: "Paylaşım Yapılacak Sosyal Medyalar",
  formatsStr: "Tasarım Formatları",
  variantCount: "Üretilecek İçerik Adedi",
  currentMonth: "İçinde Bulunulan Ay",
  upcomingEvents: "Yaklaşan Özel Günler/Haftalar",
};

export default function AdminPrompts() {
  const [categories, setCategories] = useState<{ [key: string]: Prompt[] }>({});
  const [loading, setLoading] = useState(true);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editAiProvider, setEditAiProvider] = useState("");
  const [editAiModel, setEditAiModel] = useState("");
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchPrompts = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.get("/api/admin/prompts");
      setCategories(data.categories || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, []);

  const handleEdit = (p: Prompt) => {
    setSelectedPrompt(p);
    setEditContent(p.content);
    setEditAiProvider(p.ai_provider || "openai");
    setEditAiModel(p.ai_model || "gpt-4o-mini");
  };

  const handleInsertVar = (varName: string) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    
    // Değişkeni imlecin bulunduğu yere veya metnin sonuna ekle
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const textToInsert = `{{.${varName}}}`;

    // İçeriği güncelle
    const newContent = 
      editContent.substring(0, startPos) +
      textToInsert +
      editContent.substring(endPos);
      
    setEditContent(newContent);
    
    // İmleci eklenen yazının sonuna al ve focus'u geri dön
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(startPos + textToInsert.length, startPos + textToInsert.length);
    }, 0);
  };

  const handleTranslate = async () => {
    if (!editContent.trim()) return;
    setTranslating(true);
    try {
      const res = await adminApi.post("/api/admin/prompts/translate", {
        content: editContent,
      });
      if (res.data?.translated_content) {
        setEditContent(res.data.translated_content);
        showToast("Prompt başarıyla İngilizceye çevrildi!", "success");
      } else {
        showToast("Çeviri sonucu gelmedi.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Çeviri sırasında bir hata oluştu.", "error");
    } finally {
      setTranslating(false);
    }
  };

  const handleSave = async () => {
    if (!selectedPrompt) return;
    setSaving(true);
    try {
      await adminApi.put(`/api/admin/prompts/${selectedPrompt.prompt_key}`, {
        content: editContent,
        ai_provider: editAiProvider,
        ai_model: editAiModel,
      });
      showToast("Tebrikler! Prompt başarıyla kaydedildi.", "success");
      setSelectedPrompt(null);
      fetchPrompts();
    } catch (err) {
      showToast("Kaydedilirken hata oluştu!", "error");
    } finally {
      setSaving(false);
    }
  };

  const parsedVars = selectedPrompt?.variables
    ? JSON.parse(selectedPrompt.variables)
    : [];

  // Seçili prompt için kullanım bilgisi
  const usageInfo = selectedPrompt
    ? PROMPT_USAGE_MAP[selectedPrompt.prompt_key]
    : null;

  return (
    <div className="space-y-6">
      {/* TOAST BİLDİRİMİ */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 font-medium text-white ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
          {toast.type === 'success' ? <CheckBadgeIcon className="w-6 h-6" /> : null}
          {toast.message}
        </div>
      )}

      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sistem Promptları</h1>
          <p className="text-sm text-slate-500 mt-1">
            Yapay zeka modellerine giden sistem talimatlarını yönetin. Her prompt uygulama içinde farklı bir modülde kullanılır.
          </p>
        </div>
        <button
          onClick={fetchPrompts}
          className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-slate-500 hover:text-slate-900 transition"
          title="Yenile"
        >
          <ArrowPathIcon className="w-5 h-5" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12 text-slate-500">Yükleniyor...</div>
      ) : Object.keys(categories).length === 0 ? (
        <div className="bg-white border border-gray-200 shadow-sm p-12 text-center rounded-2xl">
          <p className="text-slate-500">Henüz hiç prompt bulunamadı.</p>
          <button
            onClick={async () => {
               await adminApi.post("/api/admin/prompts/seed");
               fetchPrompts();
            }}
            className="mt-4 px-4 py-2 bg-rose-600 rounded-lg text-white font-medium hover:bg-rose-500"
          >
            Varsayılanları Yükle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            {Object.keys(categories).map((catName) => (
              <div
                key={catName}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4"
              >
                <h2 className="text-sm font-semibold text-rose-500 uppercase tracking-wider mb-3">
                  {catName}
                </h2>
                <div className="space-y-2">
                  {categories[catName].map((p) => {
                    const usage = PROMPT_USAGE_MAP[p.prompt_key];
                    return (
                      <button
                        key={p.id}
                        onClick={() => handleEdit(p)}
                        className={`w-full text-left p-3 rounded-lg flex items-start space-x-3 transition-colors ${
                          selectedPrompt?.id === p.id
                            ? "bg-rose-50 border border-rose-100"
                            : "bg-transparent hover:bg-gray-50 border border-transparent"
                        }`}
                      >
                        <PencilSquareIcon
                          className={`w-5 h-5 shrink-0 mt-0.5 ${
                            selectedPrompt?.id === p.id
                              ? "text-rose-500"
                              : "text-slate-400"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <div
                            className={`font-medium ${
                              selectedPrompt?.id === p.id
                                ? "text-rose-600"
                                : "text-slate-700"
                            }`}
                          >
                            {p.title}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                            {p.description}
                          </div>
                          {usage && (
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <span className="text-xs">{usage.icon}</span>
                              <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                                {usage.page}
                              </span>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-2">
            {selectedPrompt ? (
              <div className="bg-white flex flex-col rounded-2xl border border-gray-200 shadow-sm h-full max-h-[80vh]">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center shrink-0">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {selectedPrompt.title}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {selectedPrompt.description}
                    </p>
                  </div>
                  <CheckBadgeIcon
                    className={`w-6 h-6 ${
                      selectedPrompt.is_active
                        ? "text-emerald-500"
                        : "text-slate-300"
                    }`}
                  />
                </div>

                <div className="p-6 bg-gray-50 flex-1 overflow-y-auto">
                  {/* KULLANIM BİLGİSİ — Bu prompt nerede kullanılır? */}
                  {usageInfo && (
                    <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl mb-6">
                      <InformationCircleIcon className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-blue-700">
                            {usageInfo.icon} Kullanıldığı Sayfa: {usageInfo.page}
                          </span>
                        </div>
                        <p className="text-xs text-blue-600 leading-relaxed">
                          {usageInfo.detail}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* AI Konfigürasyonu Alanı — bu prompt için hangi model kullanılsın */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-white border border-gray-200 rounded-xl">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-2">
                        Servis Sağlayıcı
                      </label>
                      <select
                        value={editAiProvider}
                        onChange={(e) => {
                          const newProv = e.target.value;
                          setEditAiProvider(newProv);
                          if (newProv === "openai") setEditAiModel("gpt-4.1");
                          else if (newProv === "gemini") setEditAiModel("gemini-2.5-flash");
                        }}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-rose-500"
                      >
                        <option value="openai">OpenAI</option>
                        <option value="gemini">Google Gemini</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-2">
                        Sürüm Kodu (Model)
                      </label>
                      <select
                        value={editAiModel}
                        onChange={(e) => setEditAiModel(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-rose-500 cursor-pointer"
                      >
                        {editAiProvider === "openai" ? (
                          <>
                            <optgroup label="🔥 Flagship">
                              <option value="gpt-5.5">GPT-5.5 (En Güçlü)</option>
                              <option value="gpt-5.5-pro">GPT-5.5 Pro</option>
                            </optgroup>
                            <optgroup label="⚡ Üretim (Production)">
                              <option value="gpt-4.1">GPT-4.1</option>
                              <option value="gpt-4.1-mini">GPT-4.1 Mini</option>
                              <option value="gpt-4.1-nano">GPT-4.1 Nano (En Hızlı)</option>
                            </optgroup>
                            <optgroup label="🧠 Reasoning (o serisi)">
                              <option value="o3">o3</option>
                              <option value="o3-mini">o3-mini</option>
                              <option value="o1">o1</option>
                            </optgroup>
                            <optgroup label="🖼️ Görsel Üretim">
                              <option value="gpt-image-2">GPT Image 2 (Yeni ✓)</option>
                              <option value="dall-e-3">DALL-E 3 (Mayıs 2026 emekli)</option>
                              <option value="dall-e-2">DALL-E 2 (Mayıs 2026 emekli)</option>
                            </optgroup>
                            <optgroup label="📦 Legacy">
                              <option value="gpt-4o">GPT-4o</option>
                              <option value="gpt-4o-mini">GPT-4o Mini</option>
                              <option value="gpt-4-turbo">GPT-4 Turbo</option>
                            </optgroup>
                          </>
                        ) : (
                          <>
                            <optgroup label="🔥 Gemini 3 Serisi (En Yeni)">
                              <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Preview)</option>
                              <option value="gemini-3-flash-preview">Gemini 3 Flash (Preview)</option>
                              <option value="gemini-3.1-flash-lite-preview">Gemini 3.1 Flash-Lite (Preview)</option>
                            </optgroup>
                            <optgroup label="🍌 Nano Banana — Görsel Üretim">
                              <option value="gemini-3-pro-image-preview">Nano Banana Pro (4K, En İyi ✓)</option>
                              <option value="gemini-3.1-flash-image-preview">Nano Banana 2 (Hızlı ✓)</option>
                              <option value="gemini-2.5-flash-preview-image">Nano Banana (Stabil ✓)</option>
                            </optgroup>
                            <optgroup label="⚡ Gemini 2.5 Serisi (Stabil)">
                              <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                              <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash-Lite</option>
                            </optgroup>
                            <optgroup label="📦 Legacy (Deprecated)">
                              <option value="gemini-2.0-flash">Gemini 2.0 Flash ⚠️ Deprecated</option>
                            </optgroup>
                          </>
                        )}
                      </select>
                      {/* Görsel modeli uyarısı */}
                      {selectedPrompt.prompt_key.includes("studio") && 
                       editAiProvider === "gemini" && 
                       !editAiModel.includes("2.0-flash") && (
                        <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                          ⚠️ Bu prompt görsel üretiminde kullanılır. Görsel üretimi yapabilen bir model seçmeniz önerilir.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mb-4 flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                      Prompt İçeriği (Ana Talimat)
                    </label>
                    <button
                      onClick={handleTranslate}
                      disabled={translating}
                      className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 disabled:opacity-50 transition border border-indigo-500/20 rounded-lg text-xs font-medium"
                      title="Promotun değişkenlere dokunmadan İngilizceye çevrilmesi"
                    >
                      <LanguageIcon className="w-4 h-4" />
                      {translating ? "Çevriliyor..." : "İngilizceye Çevir (AI)"}
                    </button>
                  </div>
                  <textarea
                    ref={textareaRef}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full h-96 p-4 bg-gray-50 border mb-4 border-gray-200 rounded-xl text-slate-900 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
                  />

                  {parsedVars.length > 0 && (
                    <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-4">
                      <h4 className="text-orange-600 font-semibold mb-2">Esnek Değişkenler Sistemi Aktif!</h4>
                      <p className="text-sm text-slate-600 mb-3">
                        Kod içerisinde <b>{parsedVars.length}</b> adet özel değişken bulunuyor.
                        Aşağıdaki etiketlere tıklayarak kodunu kopyalayabilir ve metnin istediğiniz bir yerinde istediğiniz kadar kullanabilir ve sırasını değiştirebilirsiniz!
                      </p>
                      <div className="flex flex-col gap-2">
                        {parsedVars.map((v: string, i: number) => (
                          <div key={i} className="flex items-center gap-3 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                            <span
                              onClick={() => handleInsertVar(v)}
                              className="bg-orange-100 text-orange-600 px-3 py-1.5 rounded-md text-xs font-mono select-none cursor-pointer hover:bg-orange-200 transition shadow-sm w-[200px] text-center"
                              title="Tıklayarak prompt içeriğine ekleyin"
                            >
                              &#123;&#123;.{v}&#125;&#125;
                            </span>
                            <span className="text-sm font-medium text-slate-500">
                              {VARIABLE_DESCRIPTIONS[v] || "Genel Metin Değişkeni"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl shrink-0 flex justify-end gap-3">
                  <button
                    onClick={() => setSelectedPrompt(null)}
                    className="px-4 py-2 font-medium text-slate-500 hover:text-slate-900"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 bg-rose-600 text-white font-medium rounded-lg shadow-sm hover:bg-rose-500 disabled:opacity-50 transition"
                  >
                    {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center bg-white border border-gray-200 shadow-sm rounded-2xl h-full p-12 text-center text-slate-500">
                <PencilSquareIcon className="w-12 h-12 mb-4 text-slate-400" />
                <p className="text-lg font-medium mb-2">Düzenlemek için soldaki menüden bir prompt seçin.</p>
                <p className="text-sm text-slate-400">Her prompt&apos;un yanında hangi sayfada kullanıldığını gösteren etiket bulunur.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
