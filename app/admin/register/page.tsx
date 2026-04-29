"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LockClosedIcon,
  UserIcon,
  EnvelopeIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import adminApi from "../../../lib/adminApi";

export default function AdminRegister() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Parolalar eşleşmiyor.");
      return;
    }
    if (password.length < 6) {
      setError("Parola en az 6 karakter olmalıdır.");
      return;
    }

    setLoading(true);

    try {
      const res = await adminApi.post("/api/admin/register", {
        first_name: firstName,
        last_name: lastName,
        email,
        password,
      });

      if (res.data.token) {
        localStorage.setItem("admin_token", res.data.token);
        router.push("/admin");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Kayıt başarısız. Lütfen bilgilerinizi kontrol edin."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white mb-2">
          DIO ADMIN
        </h2>
        <p className="text-sm text-slate-400">Yeni Admin Hesabı Oluştur</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 py-8 px-4 shadow-2xl shadow-rose-500/5 sm:rounded-2xl sm:px-10 border border-slate-800">
          <form className="space-y-5" onSubmit={handleRegister}>
            {/* Ad Soyad */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-slate-300">
                  Ad
                </label>
                <div className="mt-2 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    id="firstName"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="block w-full pl-10 bg-slate-950 border border-slate-800 rounded-xl shadow-sm py-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent sm:text-sm transition-all"
                    placeholder="Adınız"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-slate-300">
                  Soyad
                </label>
                <div className="mt-2 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    id="lastName"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="block w-full pl-10 bg-slate-950 border border-slate-800 rounded-xl shadow-sm py-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent sm:text-sm transition-all"
                    placeholder="Soyadınız"
                  />
                </div>
              </div>
            </div>

            {/* E-posta */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                E-posta Adresi
              </label>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 bg-slate-950 border border-slate-800 rounded-xl shadow-sm py-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent sm:text-sm transition-all"
                  placeholder="admin@dio.com"
                />
              </div>
            </div>

            {/* Parola */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                Parola
              </label>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 bg-slate-950 border border-slate-800 rounded-xl shadow-sm py-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent sm:text-sm transition-all"
                  placeholder="En az 6 karakter"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Parola Tekrar */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300">
                Parola Tekrar
              </label>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 bg-slate-950 border border-slate-800 rounded-xl shadow-sm py-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent sm:text-sm transition-all"
                  placeholder="Parolayı tekrar girin"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition"
                >
                  {showConfirm ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/50 p-3 rounded-lg flex items-start text-sm text-rose-400">
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? "Kayıt oluşturuluyor..." : "Hesap Oluştur"}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Zaten hesabın var mı?{" "}
              <Link
                href="/admin/login"
                className="font-semibold text-rose-400 hover:text-rose-300 transition"
              >
                Giriş Yap
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
