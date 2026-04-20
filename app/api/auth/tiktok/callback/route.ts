import { NextRequest, NextResponse } from "next/server";

/**
 * TikTok OAuth2 Callback Proxy
 * 
 * TikTok Developer Portal'daki redirect URL:
 *   - http://localhost:3000/api/auth/tiktok/callback
 * 
 * Bu route, TikTok'tan gelen callback'i (auth_code, state, error parametreleri ile)
 * backend'deki gerçek handler'a proxy eder.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // Tüm query parametrelerini backend'e ilet
  const backendURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const callbackURL = `${backendURL}/api/auth/tiktok/callback?${searchParams.toString()}`;
  
  // Backend'e redirect et — backend kendi işlemini yapıp frontend'e (dashboard'a) geri yönlendirecek
  return NextResponse.redirect(callbackURL);
}
