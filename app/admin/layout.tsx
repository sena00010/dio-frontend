"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthed, setIsAuthed] = useState(true);

  useEffect(() => {
    setIsClient(true);
    // Auth check — useEffect içinde yapılmalı (render sırasında router.replace çağırmamak için)
    if (pathname !== "/admin/login" && pathname !== "/admin/register" && !localStorage.getItem("admin_token")) {
      setIsAuthed(false);
      router.replace("/admin/login");
    }
  }, [pathname, router]);

  // Yol değiştiğinde mobil menüyü kapat
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Login/Register sayfasıysa sidebar gösterme
  if (pathname === "/admin/login" || pathname === "/admin/register") {
    return <div className="min-h-screen bg-gray-50">{children}</div>;
  }

  // Auth yönlendirmesi bekleniyor
  if (!isClient || !isAuthed) {
    return <div className="min-h-screen bg-gray-50" />;
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-slate-900 selection:bg-rose-500/30 overflow-hidden">
      
      {/* Masaüstü Sidebar */}
      <div className="hidden md:flex">
        <AdminSidebar />
      </div>

      {/* Mobil Menü Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" 
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex w-64 max-w-xs flex-1 flex-col bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-4 shadow-sm">
              <button
                type="button"
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
              </button>
            </div>
            <AdminSidebar />
          </div>
        </div>
      )}

      {/* Ana İçerik */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobil Topbar */}
        <div className="md:hidden flex items-center justify-between bg-white border-b border-gray-200 p-4 shrink-0 shadow-sm z-40">
          <h1 className="text-lg font-bold tracking-wider text-rose-500">DIO</h1>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-1 rounded-md text-slate-500 hover:bg-gray-100 focus:outline-none"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50 relative">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
