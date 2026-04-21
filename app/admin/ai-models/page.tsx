"use client";

import { useEffect, useState } from "react";
import adminApi from "../../../lib/adminApi";
import { CpuChipIcon, ArrowPathIcon, CheckBadgeIcon } from "@heroicons/react/24/outline";

interface AiModel {
  id: number;
  setting_key: string;
  title: string;
  description: string;
  model_name: string;
  provider: string;
  is_active: boolean;
}

export default function AdminAiModels() {
  const [categories, setCategories] = useState<{ [key: string]: AiModel[] }>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);

  // Düzenleme stateleri
  const [editValues, setEditValues] = useState<{ [key: string]: string }>({});
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchModels = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.get("/api/admin/ai-models");
      setCategories(data.categories || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const handleSave = async (m: AiModel) => {
    const newModel = editValues[`${m.setting_key}_model`] !== undefined ? editValues[`${m.setting_key}_model`] : m.model_name;
    const newProvider = editValues[`${m.setting_key}_provider`] !== undefined ? editValues[`${m.setting_key}_provider`] : m.provider;
    
    if (newModel === m.model_name && newProvider === m.provider) return;

    setSavingId(m.id);
    try {
      await adminApi.put(`/api/admin/ai-models/${m.setting_key}`, {
        model_name: newModel,
        provider: newProvider,
      });
      // Refresh
      await fetchModels();
      // Reset edit state for this item
      setEditValues((prev) => {
        const copy = { ...prev };
        delete copy[`${m.setting_key}_model`];
        delete copy[`${m.setting_key}_provider`];
        return copy;
      });
      showToast("Model başarıyla güncellendi!", "success");
    } catch (err) {
      showToast("Model kaydedilirken hata oluştu.", "error");
    } finally {
      setSavingId(null);
    }
  };

  const handleInputChange = (setting_key: string, field: 'model' | 'provider', value: string) => {
    setEditValues((prev) => ({ ...prev, [`${setting_key}_${field}`]: value }));
  };

  return (
    <div className="space-y-6 flex flex-col h-full relative">
      {/* TOAST BİLDİRİMİ */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 font-medium text-white ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
          {toast.type === 'success' ? <CheckBadgeIcon className="w-6 h-6" /> : null}
          {toast.message}
        </div>
      )}

      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-200 shadow-sm shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AI Sürüm Yönetimi</h1>
          <p className="text-sm text-slate-500 mt-1">
            Görsel, metin ve tasarım araçlarında kullanılan yapay zeka sürümlerini ve servis sağlayıcıları (OpenAI / Gemini) güncelleyin.
          </p>
        </div>
        <button
          onClick={fetchModels}
          className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-slate-500 hover:text-slate-900 transition"
          title="Yenile"
        >
          <ArrowPathIcon className="w-5 h-5" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12 text-slate-500">Yükleniyor...</div>
      ) : Object.keys(categories).length === 0 ? (
        <div className="bg-white border border-gray-200 shadow-sm p-12 text-center rounded-2xl shrink-0">
          <p className="text-slate-500">Henüz hiç AI Model ayarı bulunamadı.</p>
          <button
            onClick={async () => {
              await adminApi.post("/api/admin/ai-models/seed");
              fetchModels();
            }}
            className="mt-4 px-4 py-2 bg-rose-600 rounded-lg text-white font-medium hover:bg-rose-500"
          >
            Varsayılanları Yükle
          </button>
        </div>
      ) : (
        <div className="space-y-8 pb-10">
          {Object.keys(categories).map((catName) => (
            <div key={catName} className="space-y-4">
              <h2 className="text-sm font-semibold text-rose-500 uppercase tracking-wider pl-1 border-b border-gray-200 pb-2">
                {catName}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories[catName].map((m) => {
                  const currentModel = editValues[`${m.setting_key}_model`] !== undefined ? editValues[`${m.setting_key}_model`] : m.model_name;
                  const currentProvider = editValues[`${m.setting_key}_provider`] !== undefined ? editValues[`${m.setting_key}_provider`] : m.provider;

                  const isModified = currentModel !== m.model_name || currentProvider !== m.provider;

                  return (
                    <div
                      key={m.id}
                      className="bg-white border border-gray-200 shadow-sm rounded-xl p-5 flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="pr-4">
                          <h3 className="font-semibold text-slate-900">
                            {m.title}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1">
                            {m.description}
                          </p>
                        </div>
                        <CpuChipIcon className="w-8 h-8 text-slate-400 shrink-0" />
                      </div>

                      <div className="mt-auto pt-4 border-t border-gray-100 space-y-3">
                        <div className="flex gap-2 items-end">
                          <div className="w-1/3">
                            <label className="text-xs font-medium text-slate-500 block mb-1">
                              Servis Sağlayıcı
                            </label>
                            <select
                              value={currentProvider}
                              onChange={(e) => {
                                const newProv = e.target.value;
                                handleInputChange(m.setting_key, 'provider', newProv);
                                if (newProv === "openai") handleInputChange(m.setting_key, 'model', "gpt-4o");
                                else if (newProv === "gemini") handleInputChange(m.setting_key, 'model', "gemini-2.5-pro");
                              }}
                              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:border-rose-500"
                            >
                              <option value="openai">OpenAI</option>
                              <option value="gemini">Gemini API</option>
                            </select>
                          </div>
                          
                          <div className="flex-1 relative">
                            <label className="text-xs font-medium text-slate-500 block mb-1">
                              Model Sürüm Kodu
                            </label>
                            <select
                              value={currentModel}
                              onChange={(e) => handleInputChange(m.setting_key, 'model', e.target.value)}
                              className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-slate-900 outline-none transition-colors cursor-pointer ${
                                isModified
                                  ? "border-orange-500 focus:border-orange-500"
                                  : "border-gray-200 focus:border-rose-500"
                              }`}
                            >
                              {currentProvider === "openai" ? (
                                <>
                                  <optgroup label="Latest & Powerful">
                                    <option value="gpt-4.5-preview">gpt-4.5-preview</option>
                                    <option value="gpt-4o">gpt-4o</option>
                                    <option value="gpt-4o-mini">gpt-4o-mini</option>
                                  </optgroup>
                                  <optgroup label="Reasoning Models (o serisi)">
                                    <option value="o1">o1</option>
                                    <option value="o3-mini">o3-mini</option>
                                    <option value="o1-preview">o1-preview</option>
                                    <option value="o1-mini">o1-mini</option>
                                  </optgroup>
                                  <optgroup label="Legacy & Other">
                                    <option value="gpt-4-turbo">gpt-4-turbo</option>
                                    <option value="gpt-4">gpt-4</option>
                                    <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                                    <option value="dall-e-3">dall-e-3 (Görsel)</option>
                                    <option value="dall-e-2">dall-e-2 (Görsel)</option>
                                  </optgroup>
                                </>
                              ) : (
                                <>
                                  <optgroup label="Gemini 2.5 / 2.0 Serisi">
                                    <option value="gemini-2.5-pro">gemini-2.5-pro (Beta)</option>
                                    <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                                    <option value="gemini-2.0-pro-exp-0205">gemini-2.0-pro-exp</option>
                                    <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                                    <option value="gemini-2.0-flash-lite-preview-02-05">gemini-2.0-flash-lite</option>
                                    <option value="gemini-2.0-flash-thinking-exp-01-21">gemini-2.0-flash-thinking</option>
                                  </optgroup>
                                  <optgroup label="Gemini 1.5 Serisi">
                                    <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                                    <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                                    <option value="gemini-1.5-flash-8b">gemini-1.5-flash-8b</option>
                                  </optgroup>
                                  <optgroup label="Legacy">
                                    <option value="gemini-1.0-pro">gemini-1.0-pro</option>
                                    <option value="gemini-exp-1206">gemini-exp-1206</option>
                                  </optgroup>
                                </>
                              )}
                            </select>
                          </div>
                          
                          <button
                            onClick={() => handleSave(m)}
                            disabled={!isModified || savingId === m.id}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all h-[38px] shrink-0 ${
                              isModified
                                ? "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-500/20"
                                : "bg-gray-100 text-slate-400 cursor-not-allowed"
                            }`}
                          >
                            {savingId === m.id ? "..." : "Kaydet"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
