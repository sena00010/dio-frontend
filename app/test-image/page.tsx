"use client";

import React, { useState } from 'react';

export default function TestImagePage() {
  const [prompt, setPrompt] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!imagePreview) {
      setError("Lütfen önce bir görsel yükleyin.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/test-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt || "Bu görselin benzerini oluştur",
          imageBase64: imagePreview
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Bir hata oluştu");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-5xl w-full space-y-8">
        <h1 className="text-4xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 tracking-tight">
          AI Görsel Üretim Testi (Gemini vs ChatGPT)
        </h1>
        <p className="text-center text-gray-400 text-lg">
          Bir görsel yükleyin ve isteğinizi yazın. Aynı anda hem Gemini (Imagen) hem de ChatGPT (DALL-E) ile görsel üretilecektir.
        </p>

        <div className="bg-gray-900 p-6 md:p-8 rounded-3xl shadow-2xl border border-gray-800 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
              1. Görsel Yükle (Referans için)
            </label>
            <div className="relative group max-w-xl mx-auto">
              <input 
                type="file" 
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="bg-gray-800 border-2 border-dashed border-gray-700 hover:border-blue-500 rounded-2xl p-8 flex flex-col items-center justify-center transition-all">
                {imagePreview ? (
                  <div className="space-y-4 flex flex-col items-center w-full">
                    <img src={imagePreview} alt="Preview" className="h-48 object-cover rounded-xl shadow-lg border border-gray-600" />
                    <p className="text-sm text-blue-400 font-medium group-hover:text-blue-300">Görseli değiştirmek için tıkla</p>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <div className="mx-auto w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center group-hover:bg-blue-600/20 transition-colors">
                      <svg className="w-6 h-6 text-gray-400 group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    </div>
                    <p className="text-gray-400 font-medium">Görsel yüklemek için tıkla veya sürükle</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
              2. Ne İstiyorsunuz? (Prompt)
            </label>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Örn: Bu görseli cyberpunk tarzında yeniden hayal et..."
              className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 outline-none resize-none transition-all"
              rows={3}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !imagePreview}
            className={`w-full py-4 rounded-2xl font-bold text-lg text-white transition-all shadow-xl flex items-center justify-center gap-2 ${
              loading || !imagePreview 
              ? 'bg-gray-800 border border-gray-700 text-gray-500 cursor-not-allowed' 
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 hover:scale-[1.01]'
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Üretiliyor (Hem Gemini hem ChatGPT çalışıyor)...
              </>
            ) : (
              '✨ İki Yapay Zeka İle Görsel Üret'
            )}
          </button>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500/50 text-red-200 p-4 rounded-2xl backdrop-blur-sm">
            <strong className="block mb-1">Hata oluştu:</strong> {error}
          </div>
        )}

        {result && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gray-900 p-6 md:p-8 rounded-3xl shadow-2xl border border-gray-800 space-y-4">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                Arka Planda Kullanılan Detaylı Prompt (Gemini Vision Tarafından Hazırlandı):
              </h3>
              <p className="bg-gray-800/50 border border-gray-700/50 p-4 rounded-xl text-sm text-gray-300 italic">
                {result.enhancedPrompt}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Gemini (Imagen) Kartı */}
              <div className="bg-gray-900 p-6 md:p-8 rounded-3xl shadow-2xl border border-blue-900/50 space-y-4 flex flex-col">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 border-b border-gray-800 pb-4">
                  Gemini (Imagen) Çıktısı
                </h2>
                
                <div className="flex-1 flex flex-col items-center justify-center">
                  {result.gemini?.imageUrl ? (
                    <div className="relative group rounded-2xl overflow-hidden shadow-2xl border border-gray-700 w-full">
                      <img src={result.gemini.imageUrl} alt="Gemini Generated" className="w-full aspect-square object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                        <a 
                          href={result.gemini.imageUrl} 
                          download="gemini-image.jpg"
                          className="bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                        >
                          İndir
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-red-900/20 border border-red-800 text-red-300 p-6 rounded-2xl w-full text-center">
                      <svg className="w-12 h-12 mx-auto mb-3 text-red-500 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                      <strong className="block mb-2 text-red-400">Üretim Başarısız</strong>
                      <p className="text-sm opacity-80">{result.gemini?.error || "Bilinmeyen bir hata oluştu"}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* ChatGPT (DALL-E) Kartı */}
              <div className="bg-gray-900 p-6 md:p-8 rounded-3xl shadow-2xl border border-green-900/50 space-y-4 flex flex-col">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 border-b border-gray-800 pb-4">
                  ChatGPT (DALL-E 2) Çıktısı
                </h2>
                
                <div className="flex-1 flex flex-col items-center justify-center">
                  {result.openai?.imageUrl ? (
                    <div className="relative group rounded-2xl overflow-hidden shadow-2xl border border-gray-700 w-full">
                      <img src={result.openai.imageUrl} alt="ChatGPT Generated" className="w-full aspect-square object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                        <a 
                          href={result.openai.imageUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                        >
                          Yeni Sekmede Aç
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-red-900/20 border border-red-800 text-red-300 p-6 rounded-2xl w-full text-center">
                      <svg className="w-12 h-12 mx-auto mb-3 text-red-500 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                      <strong className="block mb-2 text-red-400">Üretim Başarısız</strong>
                      <p className="text-sm opacity-80">{result.openai?.error || "Bilinmeyen bir hata oluştu"}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
