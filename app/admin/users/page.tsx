"use client";

import { useState } from "react";
import adminApi from "../../../lib/adminApi";
import { UserPlusIcon } from "@heroicons/react/24/outline";

export default function AdminUsersPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await adminApi.post("/api/admin/register", {
        full_name: fullName,
        email,
        password,
      });

      setSuccess("Yönetici başarıyla oluşturuldu.");
      setFullName("");
      setEmail("");
      setPassword("");
    } catch (err: any) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Yönetici oluşturulurken bir hata meydana geldi.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-full max-w-2xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm shrink-0">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <UserPlusIcon className="w-8 h-8 text-rose-500" />
          Yeni Yönetici Ekle
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Sisteme yeni bir yönetici (admin) tanımlayın.
        </p>
      </div>

      <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
        <form onSubmit={handleRegister} className="space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-sm">
              {success}
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">
              Ad Soyad
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-slate-900 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all font-medium"
              placeholder="Sena Yılmaz"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">
              E-posta Adresi
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-slate-900 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all font-medium"
              placeholder="admin@dio.com"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">
              Parola
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-slate-900 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all font-medium"
              placeholder="En az 8 karakter, 1 büyük, 1 küçük harf ve rakam"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-white font-semibold transition-all bg-rose-600 hover:bg-rose-500 active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:hover:bg-rose-600"
          >
            {loading ? "Kaydediliyor..." : "Yeni Yönetici Oluştur"}
          </button>
        </form>
      </div>
    </div>
  );
}
