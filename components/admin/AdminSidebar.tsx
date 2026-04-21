"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Square3Stack3DIcon,
  BeakerIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  ArrowLeftStartOnRectangleIcon,
} from "@heroicons/react/24/outline";

export default function AdminSidebar() {
  const pathname = usePathname();

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: Square3Stack3DIcon },
    { name: "Sistem Promptları", href: "/admin/prompts", icon: BeakerIcon },
    { name: "AI Modelleri", href: "/admin/ai-models", icon: Cog6ToothIcon },
    { name: "Yöneticiler", href: "/admin/users", icon: UserGroupIcon },
  ];

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    window.location.href = "/admin/login";
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 text-slate-900 flex flex-col h-screen">
      <div className="p-6">
        <h1 className="text-xl font-bold tracking-wider text-rose-500">
          DIO ADMIN
        </h1>
        <p className="text-xs text-slate-500 mt-1">Sistem Yönetim Paneli</p>
      </div>

      <nav className="flex-1 px-4 mt-6 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? "bg-rose-50 text-rose-600 border border-rose-100"
                  : "text-slate-500 hover:text-slate-900 hover:bg-gray-50 border border-transparent"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-4 py-2 w-full text-left rounded-xl transition-colors"
        >
          <ArrowLeftStartOnRectangleIcon className="w-5 h-5" />
          <span className="font-medium text-sm">Çıkış Yap</span>
        </button>
      </div>
    </div>
  );
}
