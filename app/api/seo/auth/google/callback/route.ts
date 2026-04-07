import { NextRequest, NextResponse } from "next/server";

/**
 * Google OAuth2 Callback Proxy
 * Google, tarayıcıyı http://localhost:3000/api/seo/auth/google/callback'e yönlendirir.
 * Bu route handler, code ve state parametrelerini Go backend'e (port 8080) iletir.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams.toString();

  // Go backend'e ilet
  const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/seo/auth/google/callback?${searchParams}`;

  try {
    const response = await fetch(backendUrl, {
      redirect: "manual", // Backend'in redirect'ini takip etme
    });

    // Go backend 307 redirect döner → frontend'e yönlendir
    const location = response.headers.get("location");
    if (location) {
      return NextResponse.redirect(location);
    }

    // Fallback: başarılı ama redirect yoksa ana sayfaya yönlendir
    return NextResponse.redirect("http://localhost:3000/?seo_connected=true");
  } catch (error) {
    console.error("OAuth callback proxy hatası:", error);
    return NextResponse.redirect("http://localhost:3000/?seo_error=true");
  }
}
