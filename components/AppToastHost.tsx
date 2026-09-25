"use client";

/* ============================================================
   APP TOAST HOST

   Merender notifikasi in-app dari channel `amx:toast`
   (lihat lib/notify.ts). Dipasang sekali di DashboardLayout
   supaya notifikasi muncul di semua halaman dashboard.
============================================================ */

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { useCallback, useEffect, useId, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { subscribeToast, type ToastDetail, type ToastTone } from "@/lib/notify";

const EASE = [0.22, 1, 0.36, 1] as const;

const TONES: Record<
  ToastTone,
  { icon: ReactNode; className: string; iconClass: string }
> = {
  success: {
    icon: <CheckCircle2 className="h-4 w-4" strokeWidth={1.9} />,
    className: "border-[#BBF7D0] bg-[#F0FDF4]",
    iconClass: "text-[#16A34A]",
  },
  info: {
    icon: <Info className="h-4 w-4" strokeWidth={1.9} />,
    className: "border-[#BFDBFE] bg-[#EFF6FF]",
    iconClass: "text-[#1E40AF]",
  },
  error: {
    icon: <AlertCircle className="h-4 w-4" strokeWidth={1.9} />,
    className: "border-[#FECACA] bg-[#FEF2F2]",
    iconClass: "text-[#DC2626]",
  },
};

interface ToastItem extends ToastDetail {
  id: string;
  tone: ToastTone;
}

const DEFAULT_DURATION = 6500;

export default function AppToastHost() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const baseId = useId();

  const remove = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  useEffect(() => {
    let counter = 0;

    return subscribeToast((detail) => {
      counter += 1;

      const id = `${baseId}-${Date.now()}-${counter}`;

      const item: ToastItem = {
        ...detail,
        id,
        tone: detail.tone || "info",
      };

      setToasts((current) => [...current.slice(-3), item]);

      window.setTimeout(
        () => remove(id),
        detail.durationMs && detail.durationMs > 0
          ? detail.durationMs
          : DEFAULT_DURATION
      );
    });
  }, [baseId, remove]);

  return (
    <div
      aria-live="polite"
      aria-label="Notifikasi"
      className="pointer-events-none fixed bottom-24 right-3 z-[9998] flex w-[min(92vw,360px)] flex-col gap-2 sm:bottom-6 sm:right-5 lg:bottom-6"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const tone = TONES[toast.tone] || TONES.info;

          return (
            <motion.output
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.28, ease: EASE }}
              className={cn(
                "pointer-events-auto flex items-start gap-3 border p-3 shadow-[0_16px_40px_rgba(0,0,0,0.12)] backdrop-blur-sm",
                tone.className
              )}
            >
              <span className={cn("mt-0.5 shrink-0", tone.iconClass)}>
                {tone.icon}
              </span>

              <span className="min-w-0 flex-1">
                {toast.title && (
                  <span className="block text-[11px] font-bold text-[#171717]">
                    {toast.title}
                  </span>
                )}

                <span className="mt-0.5 block text-[11px] font-medium leading-[1.6] text-[#4B4D47]">
                  {toast.message}
                </span>
              </span>

              <button
                type="button"
                onClick={() => remove(toast.id)}
                aria-label="Tutup notifikasi"
                className="shrink-0 border border-transparent p-1 text-[#8A8C85] transition-colors hover:border-[#DCDDD8] hover:bg-white hover:text-[#171717]"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </motion.output>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
