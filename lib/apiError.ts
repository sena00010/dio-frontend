// API hatasından kullanıcıya gösterilecek mesajı çıkarır
export function getApiError(err: unknown, fallback = "Bir hata oluştu. Lütfen tekrar deneyin."): string {
  const e = err as { response?: { status?: number; data?: { error?: string; message?: string } }; message?: string };
  if (e?.response?.data?.error) return e.response.data.error;
  if (e?.response?.data?.message) return e.response.data.message;
  if (e?.response?.status === 504 || e?.response?.status === 502) return "Sunucu yanıt vermekte gecikti. Lütfen biraz sonra tekrar deneyin.";
  if (e?.message === "Network Error") return "Bağlantı kurulamadı. İnternet bağlantınızı kontrol edin.";
  return fallback;
}
