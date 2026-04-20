"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import api from "@/lib/api";

// ─── Types ──────────────────────────────────────────────
export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
}

export interface Company {
  id: number;
  name: string;
  sector: string;
  logo_url: string;
  brand_colors?: string;
  website?: string;
  content_language?: string;
  slogan?: string;
  description?: string;
  target_audience?: string;
  forbidden_words?: string;
  tone_of_voice?: string;
  social_media?: string;
  brand_type?: string;
  brand_font?: string;
  current_step: number;
  competitors?: { id?: number; name: string; website: string }[];
}

interface AuthState {
  user: User | null;
  company: Company | null;
  companies: Company[];
  activeCompany: Company | null;
  setActiveCompany: (company: Company) => void;
  loading: boolean;
  logout: () => void;
  refreshUser: () => Promise<void>;
  refreshCompanies: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  company: null,
  companies: [],
  activeCompany: null,
  setActiveCompany: () => {},
  loading: true,
  logout: () => {},
  refreshUser: async () => {},
  refreshCompanies: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

// ─── Public paths (no auth required) ────────────────────
const PUBLIC_PATHS = ["/auth/login", "/auth/register"];

// ─── Provider ───────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompany, setActiveCompanyState] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Fetch all companies ─────────────────
  const fetchCompanies = useCallback(async () => {
    try {
      const { data } = await api.get("/api/companies/me");
      const list: Company[] = data.companies || [];
      setCompanies(list);
      // Keep activeCompany if still valid, otherwise pick first
      setActiveCompanyState((prev) => {
        if (prev && list.find((c) => c.id === prev.id)) return prev;
        return list[0] || null;
      });
      // Legacy compat: set company to first
      setCompany(list[0] || null);
      return data;
    } catch {
      return null;
    }
  }, []);

  // ── Set active company ──────────────────
  const setActiveCompany = useCallback((c: Company) => {
    setActiveCompanyState(c);
    setCompany(c); // legacy compat
  }, []);

  // ── Fetch profile from backend ──────────
  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await api.get("/api/auth/me");
      setUser(data.user ?? null);

      // Populate companies from boot response
      const list: Company[] = data.companies || [];
      if (list.length > 0) {
        setCompanies(list);
        setActiveCompanyState((prev) => {
          if (prev && list.find((c) => c.id === prev.id)) return prev;
          return list[0];
        });
        setCompany(list[0]);
      } else if (data.company) {
        setCompany(data.company);
      }

      return data;
    } catch {
      setUser(null);
      setCompany(null);
      setCompanies([]);
      setActiveCompanyState(null);
      localStorage.removeItem("token");
      localStorage.removeItem("onboarding_completed");
      localStorage.removeItem("current_step");
      return null;
    }
  }, []);

  // ── Logout ──────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("onboarding_completed");
    localStorage.removeItem("current_step");
    setUser(null);
    setCompany(null);
    setCompanies([]);
    setActiveCompanyState(null);
    router.push("/auth/login");
  }, [router]);

  // ── Boot ────────────────────────────────
  useEffect(() => {
    async function boot() {
      const token = localStorage.getItem("token");
      const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

      if (!token) {
        setLoading(false);
        if (!isPublic && pathname !== "/onboarding") {
          router.push("/auth/login");
        }
        return;
      }

      const data = await fetchProfile();
      setLoading(false);

      if (!data) {
        if (!isPublic) router.push("/auth/login");
        return;
      }

      if (isPublic) {
        // Login/register sayfasında giriş yapmış kullanıcı
        const done = localStorage.getItem("onboarding_completed") === "true";
        if (done) router.push("/");
        else router.push("/onboarding");
        return;
      }

      // Dashboard'a erişmeye çalışan ama onboarding tamamlamamış
      if (pathname === "/" || pathname.startsWith("/dashboard")) {
        const done = localStorage.getItem("onboarding_completed") === "true";
        if (!done) {
          router.push("/onboarding");
          return;
        }
      }

      // Onboarding sayfasındayken ASLA yönlendirme yapma
    }

    boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        companies,
        activeCompany,
        setActiveCompany,
        loading,
        logout,
        refreshUser: fetchProfile,
        refreshCompanies: fetchCompanies,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
