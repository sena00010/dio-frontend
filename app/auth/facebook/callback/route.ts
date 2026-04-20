import { NextRequest, NextResponse } from "next/server";

/**
 * Facebook/Meta OAuth2 Callback Proxy
 * 
 * Facebook callback'ini backend'e server-side fetch ile iletir.
 * Redirect yerine fetch kullanılır çünkü production'da backend ve frontend
 * aynı domain'de çalışır (app.dijitalisortagi.com).
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // Backend'in internal callback endpoint'ine server-side istek at
  const backendURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const callbackURL = `${backendURL}/api/meta/auth/callback?${searchParams.toString()}`;
  
  try {
    // Backend'e server-side fetch — redirect'leri takip etme
    const response = await fetch(callbackURL, { redirect: "manual" });
    
    // Backend redirect dönerse (başarılı flow), o URL'e kullanıcıyı yönlendir
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (location) {
        return NextResponse.redirect(location);
      }
    }
    
    // Backend hata dönerse, frontend dashboard'a yönlendir
    const frontendURL = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";
    return NextResponse.redirect(`${frontendURL}/?meta_error=callback_failed#dashboard`);
  } catch (error) {
    // Ağ hatası
    const frontendURL = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";
    return NextResponse.redirect(`${frontendURL}/?meta_error=network_error#dashboard`);
  }
}
