import axios from "axios";

// ──────────────────────────────────────────────
// DIO Admin Panel API Yapılandırması
// Normal kullanıcı API'sinden bağımsız çalışır
// ──────────────────────────────────────────────

const adminApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
  headers: {
    "Content-Type": "application/json",
  },
});

// Ziyaret edilecek endpoint'e Admin JWT tokenını ekle
adminApi.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const adminToken = localStorage.getItem("admin_token");
      if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Eğer Admin yetkisi düşerse logine yönlendir
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("admin_token");
        window.location.href = "/admin/login";
      }
    }
    return Promise.reject(error);
  }
);

export default adminApi;
