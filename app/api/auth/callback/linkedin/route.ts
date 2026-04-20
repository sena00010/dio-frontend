import { NextRequest, NextResponse } from "next/server";

/**
 * LinkedIn OAuth2 Callback Proxy
 * 
 * LinkedIn Developer Portal'daki redirect URL'ler frontend domain'ine kayıtlıdır:
 *   - http://localhost:3000/api/auth/callback/linkedin
 *   - https://app.dijitalisortagi.com/api/auth/callback/linkedin
 * 
 * Bu route, LinkedIn'den gelen callback'i (code, state, error parametreleri ile)
 * backend'deki gerçek handler'a proxy eder.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // Tüm query parametrelerini backend'e ilet
  const backendURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const callbackURL = `${backendURL}/api/auth/callback/linkedin?${searchParams.toString()}`;
  
  // Backend'e redirect et — backend kendi işlemini yapıp frontend'e geri yönlendirecek
  return NextResponse.redirect(callbackURL);
}
