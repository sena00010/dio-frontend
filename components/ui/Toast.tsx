"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

type ToastType = "success" | "error" | "info";
type ToastItem = { id: number; type: ToastType; message: string };
type ToastApi = { success: (m: string) => void; error: (m: string) => void; info: (m: string) => void };

const noop = () => {};
const ToastContext = createContext<ToastApi>({ success: noop, error: noop, info: noop });

export function useToast() {
  return useContext(ToastContext);
}

const STYLES: Record<ToastType, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-red-200 bg-red-50 text-red-800",
  info: "border-zinc-200 bg-white text-zinc-800",
};
const ICONS: Record<ToastType, string> = { success: "✓", error: "!", info: "i" };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts(t => t.filter(x => x.id !== id)), []);
  const push = useCallback((type: ToastType, message: string) => {
    const id = nextId.current++;
    setToasts(t => [...t.slice(-3), { id, type, message }]);
    setTimeout(() => dismiss(id), type === "error" ? 7000 : 4000);
  }, [dismiss]);

  const api = useMemo<ToastApi>(() => ({
    success: m => push("success", m),
    error: m => push("error", m),
    info: m => push("info", m),
  }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-4 sm:items-end">
        {toasts.map(t => (
          <div
            key={t.id}
            role={t.type === "error" ? "alert" : "status"}
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-lg animate-fade-in-up ${STYLES[t.type]}`}
          >
            <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-current/10 text-xs font-bold">{ICONS[t.type]}</span>
            <span className="flex-1 leading-snug">{t.message}</span>
            <button type="button" onClick={() => dismiss(t.id)} aria-label="Kapat" className="text-current/60 hover:text-current">×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
