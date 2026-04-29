import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt, imageBase64 } = await req.json();

    const OPENAI_API_KEY = "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";
    const GEMINI_API_KEY = "AIzaSyBqkCzlxApTNvcFrDFY_tJVUejjQtLbCW0";

    // remove data:image/jpeg;base64, if present
    const base64Data = imageBase64.split(',')[1] || imageBase64;
    const mimeType = imageBase64.match(/data:(.*?);base64/)?.[1] || "image/jpeg";

    // 1. Önce Gemini 2.5 Flash (Metin Modeli) ile görseli inceleyip promptu detaylandıralım (Opsiyonel ama iyi sonuç verir)
    let finalPrompt = prompt;
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      const geminiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: `Aşağıdaki görseli ve kullanıcının isteğini incele. Kullanıcı bu görsele dayanarak yeni bir görsel üretmek istiyor. Görsel üretimi için son derece detaylı bir İngilizce prompt yaz. Sadece İngilizce promptu ver.\n\nİstek: ${prompt}` },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data
                }
              }
            ]
          }]
        })
      });
      if (geminiRes.ok) {
        const geminiData = await geminiRes.json();
        finalPrompt = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || prompt;
      }
    } catch(e) {
      console.log("Prompt enhancement failed, using original.");
    }

    // 2. OpenAI DALL-E İle Görsel Üretimi
    let openaiResult = null;
    let openaiError = null;
    try {
      const openaiRes = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "dall-e-2", // Orta kalite
          prompt: finalPrompt.substring(0, 1000),
          n: 1,
          size: "512x512"
        })
      });

      if (!openaiRes.ok) {
        const errJson = await openaiRes.json();
        openaiError = errJson.error?.message || await openaiRes.text();
      } else {
        const openaiData = await openaiRes.json();
        openaiResult = openaiData.data[0].url;
      }
    } catch (e: any) {
      openaiError = e.message;
    }

    // 3. Gemini (Imagen) İle Görsel Üretimi
    let geminiImageResult = null;
    let geminiImageError = null;
    try {
      // Google API üzerinden Imagen çağrısı yapıyoruz (Not: Ücretsiz tier'da limitli olabilir)
      const imagenUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${GEMINI_API_KEY}`;
      const imagenRes = await fetch(imagenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [
            { prompt: finalPrompt.substring(0, 1000) }
          ],
          parameters: {
            sampleCount: 1
          }
        })
      });

      if (!imagenRes.ok) {
        const errJson = await imagenRes.json();
        geminiImageError = errJson.error?.message || await imagenRes.text();
      } else {
        const imagenData = await imagenRes.json();
        if (imagenData.predictions && imagenData.predictions[0] && imagenData.predictions[0].bytesBase64Encoded) {
           const mime = imagenData.predictions[0].mimeType || 'image/png';
           geminiImageResult = `data:${mime};base64,${imagenData.predictions[0].bytesBase64Encoded}`;
        } else {
           geminiImageError = "Bilinmeyen Gemini yanıtı alındı: " + JSON.stringify(imagenData);
        }
      }
    } catch (e: any) {
      geminiImageError = e.message;
    }

    return NextResponse.json({ 
      success: true, 
      enhancedPrompt: finalPrompt,
      openai: {
        imageUrl: openaiResult,
        error: openaiError
      },
      gemini: {
        imageUrl: geminiImageResult,
        error: geminiImageError
      }
    });

  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
