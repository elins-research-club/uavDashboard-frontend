"use client";

import { Check, CircleAlert, Info, X } from "lucide-react";

import { subscribeToast, type ToastDetail, type ToastTone } from "@/lib/notify";

import { useCallback, useEffect, useState } from "react";

/* ============================================================
   TYPES
============================================================ */

type ToastItem = ToastDetail & {
  id: string;
  createdAt: number;
};

const DEFAULT_DURATION = 4500;

/* ============================================================
   CONFETTI
============================================================ */

const CONFETTI = [
  {
    left: "8%",
    top: "12%",
    tx: "-18px",
    ty: "-18px",
    rotate: "-28deg",
    color: "#91B928",
    delay: "0ms",
    size: 5,
  },
  {
    left: "15%",
    top: "4%",
    tx: "-12px",
    ty: "-26px",
    rotate: "18deg",
    color: "#123C28",
    delay: "35ms",
    size: 4,
  },
  {
    left: "24%",
    top: "0%",
    tx: "-6px",
    ty: "-30px",
    rotate: "-14deg",
    color: "#C8D79B",
    delay: "75ms",
    size: 5,
  },
  {
    left: "34%",
    top: "2%",
    tx: "-4px",
    ty: "-24px",
    rotate: "22deg",
    color: "#91B928",
    delay: "20ms",
    size: 4,
  },
  {
    left: "46%",
    top: "0%",
    tx: "0px",
    ty: "-34px",
    rotate: "-12deg",
    color: "#123C28",
    delay: "55ms",
    size: 5,
  },
  {
    left: "57%",
    top: "2%",
    tx: "4px",
    ty: "-27px",
    rotate: "26deg",
    color: "#B8CC70",
    delay: "95ms",
    size: 4,
  },
  {
    left: "68%",
    top: "0%",
    tx: "8px",
    ty: "-31px",
    rotate: "-20deg",
    color: "#91B928",
    delay: "40ms",
    size: 5,
  },
  {
    left: "78%",
    top: "5%",
    tx: "13px",
    ty: "-25px",
    rotate: "16deg",
    color: "#123C28",
    delay: "80ms",
    size: 4,
  },
  {
    left: "88%",
    top: "12%",
    tx: "20px",
    ty: "-16px",
    rotate: "-24deg",
    color: "#C8D79B",
    delay: "110ms",
    size: 5,
  },

  {
    left: "4%",
    top: "45%",
    tx: "-28px",
    ty: "0px",
    rotate: "22deg",
    color: "#123C28",
    delay: "35ms",
    size: 4,
  },
  {
    left: "1%",
    top: "68%",
    tx: "-24px",
    ty: "10px",
    rotate: "-30deg",
    color: "#91B928",
    delay: "75ms",
    size: 5,
  },
  {
    left: "97%",
    top: "45%",
    tx: "28px",
    ty: "0px",
    rotate: "-18deg",
    color: "#123C28",
    delay: "60ms",
    size: 4,
  },
  {
    left: "99%",
    top: "68%",
    tx: "25px",
    ty: "12px",
    rotate: "32deg",
    color: "#B8CC70",
    delay: "100ms",
    size: 5,
  },

  {
    left: "15%",
    top: "91%",
    tx: "-14px",
    ty: "23px",
    rotate: "-18deg",
    color: "#91B928",
    delay: "65ms",
    size: 4,
  },
  {
    left: "32%",
    top: "98%",
    tx: "-7px",
    ty: "27px",
    rotate: "28deg",
    color: "#123C28",
    delay: "90ms",
    size: 5,
  },
  {
    left: "50%",
    top: "100%",
    tx: "0px",
    ty: "30px",
    rotate: "-20deg",
    color: "#91B928",
    delay: "120ms",
    size: 4,
  },
  {
    left: "69%",
    top: "98%",
    tx: "7px",
    ty: "27px",
    rotate: "24deg",
    color: "#C8D79B",
    delay: "75ms",
    size: 5,
  },
  {
    left: "86%",
    top: "91%",
    tx: "16px",
    ty: "22px",
    rotate: "-26deg",
    color: "#123C28",
    delay: "110ms",
    size: 4,
  },
];

/* ============================================================
   HELPERS
============================================================ */

function createToastId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getToastIcon(tone: ToastTone) {
  switch (tone) {
    case "success":
      return Check;

    case "error":
      return CircleAlert;

    case "info":
    default:
      return Info;
  }
}

/* ============================================================
   TOAST CONFETTI
============================================================ */

function ToastConfetti() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -inset-5 z-0 overflow-visible"
    >
      {CONFETTI.map((piece, index) => (
        <span
          key={index}
          className="absolute animate-amx-toast-confetti"
          style={{
            left: piece.left,
            top: piece.top,
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            borderRadius: index % 3 === 0 ? "9999px" : "2px",
            animationDelay: piece.delay,
            ["--toast-tx" as string]: piece.tx,
            ["--toast-ty" as string]: piece.ty,
            ["--toast-rotate" as string]: piece.rotate,
          }}
        />
      ))}
    </div>
  );
}

/* ============================================================
   SINGLE TOAST
============================================================ */

function ToastCard({
  toast,
  onClose,
}: {
  toast: ToastItem;
  onClose: () => void;
}) {
  const tone = toast.tone || "info";

  const Icon = getToastIcon(tone);

  const isSuccess = tone === "success";
  const isError = tone === "error";

  const duration = toast.durationMs ?? DEFAULT_DURATION;

  return (
    <div
      className={[
        "relative w-full max-w-[420px]",
        "animate-amx-toast-enter",
        "transition-all duration-200",
      ].join(" ")}
    >
      {/* ================================================
          CONFETTI
      ================================================= */}

      {isSuccess && toast.confetti !== false && <ToastConfetti />}

      {/* ================================================
          CARD
      ================================================= */}

      <div
        className={[
          "relative z-10 overflow-hidden",
          "border",
          "bg-[#F8F9F6]",
          "shadow-[0_18px_45px_rgba(18,60,40,0.14)]",
          "backdrop-blur-xl",
          isSuccess
            ? "border-[#C7D5A2]"
            : isError
            ? "border-[#E3C7C7]"
            : "border-[#DCDDD8]",
        ].join(" ")}
      >
        {/* TOP ACCENT */}

        <div
          className={[
            "absolute inset-x-0 top-0 h-[2px]",
            isSuccess
              ? "bg-[#91B928]"
              : isError
              ? "bg-[#B84A4A]"
              : "bg-[#7A7D75]",
          ].join(" ")}
        />

        <div className="flex items-start gap-3 px-4 py-3.5 sm:px-4.5 sm:py-4">
          {/* ============================================
              ICON
          ============================================ */}

          <div
            className={[
              "mt-0.5 flex h-9 w-9 shrink-0",
              "items-center justify-center",
              "border",
              isSuccess
                ? "border-[#D1DEB0] bg-[#EAF1DD] text-[#123C28]"
                : isError
                ? "border-[#E8D0D0] bg-[#F8EAEA] text-[#8F3434]"
                : "border-[#DDDED9] bg-[#EFF0ED] text-[#555750]",
            ].join(" ")}
          >
            <Icon className="h-4 w-4" strokeWidth={2.3} />
          </div>

          {/* ============================================
              CONTENT
          ============================================ */}

          <div className="min-w-0 flex-1 pt-0.5">
            {toast.title && (
              <p
                className={[
                  "pr-6",
                  "text-[12px] font-bold",
                  "tracking-[-0.01em]",
                  isSuccess ? "text-[#123C28]" : "text-[#171717]",
                ].join(" ")}
              >
                {toast.title}
              </p>
            )}

            <p
              className={[
                "mt-0.5 pr-3",
                "text-[11px]",
                "font-medium",
                "leading-[1.55]",
                isError ? "text-[#755959]" : "text-[#666761]",
              ].join(" ")}
            >
              {toast.message}
            </p>
          </div>

          {/* ============================================
              CLOSE
          ============================================ */}

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup notifikasi"
            className={[
              "mt-0.5 shrink-0",
              "flex h-6 w-6 items-center justify-center",
              "text-[#A0A19A]",
              "transition-colors",
              "hover:text-[#171717]",
            ].join(" ")}
          >
            <X className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>

        {/* ================================================
            PROGRESS
        ================================================= */}

        <div className="h-[2px] w-full bg-[#E9EAE5]">
          <div
            className={[
              "h-full origin-left animate-amx-toast-progress",
              isSuccess
                ? "bg-[#91B928]"
                : isError
                ? "bg-[#B84A4A]"
                : "bg-[#858780]",
            ].join(" ")}
            style={{
              animationDuration: `${duration}ms`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   HOST
============================================================ */

export function AppToastHost() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const [leaving, setLeaving] = useState<Set<string>>(new Set());

  /* ----------------------------------------------------------
     ADD
  ---------------------------------------------------------- */

  useEffect(() => {
    const unsubscribe = subscribeToast((detail) => {
      const toast: ToastItem = {
        ...detail,
        id: createToastId(),
        createdAt: Date.now(),
      };

      setToasts((current) => [...current.slice(-3), toast]);
    });

    return unsubscribe;
  }, []);

  /* ----------------------------------------------------------
     REMOVE
  ---------------------------------------------------------- */

  const removeToast = useCallback((id: string) => {
    setLeaving((current) => {
      const next = new Set(current);
      next.add(id);
      return next;
    });

    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));

      setLeaving((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }, 220);
  }, []);

  /* ----------------------------------------------------------
     AUTO DISMISS
  ---------------------------------------------------------- */

  useEffect(() => {
    if (!toasts.length) {
      return;
    }

    const timers = toasts.map((toast) => {
      const duration = toast.durationMs ?? DEFAULT_DURATION;

      const elapsed = Date.now() - toast.createdAt;

      const remaining = Math.max(duration - elapsed, 0);

      return window.setTimeout(() => {
        removeToast(toast.id);
      }, remaining);
    });

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [toasts, removeToast]);

  if (!toasts.length) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className={[
        "pointer-events-none fixed z-[10000]",
        "bottom-4 left-3 right-3",
        "sm:bottom-5 sm:left-auto sm:right-5",
        "flex flex-col items-stretch gap-3",
        "sm:w-[420px]",
      ].join(" ")}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={
            leaving.has(toast.id)
              ? "pointer-events-none animate-amx-toast-exit"
              : "pointer-events-auto"
          }
        >
          <ToastCard toast={toast} onClose={() => removeToast(toast.id)} />
        </div>
      ))}
    </div>
  );
}

export default AppToastHost;
