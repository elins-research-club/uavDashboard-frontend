"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import { Menu, X, ArrowUpRight, Leaf, AlertCircle, RotateCw, LogOut } from "lucide-react";
import api from "@/lib/api";
import { useUserRole } from "@/context/UserRoleContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { user, setAuthenticatedUser } = useUserRole();
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/login";
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const timeoutTimer = setTimeout(() => {
      if (isMounted && isLoading) {
        setLoadError("Koneksi ke server backend memakan waktu terlalu lama. Pastikan server backend aktif di port 8001.");
        setIsLoading(false);
      }
    }, 12000);

    Promise.all([api.get("/users/me"), api.get("/subscriptions/current")])
      .then(([profileResponse, subscriptionResponse]) => {
        if (!isMounted) return;
        setAuthenticatedUser({
          ...profileResponse.data,
          tier: subscriptionResponse.data.tier,
        });

        setIsAuthenticated(true);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Gagal memuat sesi:", err);
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
        } else {
          setLoadError(
            err.code === "ECONNABORTED" || err.message?.includes("timeout")
              ? "Koneksi ke backend timeout (port 8001 tidak merespon)."
              : "Gagal terhubung ke backend UAV DaaS. Silakan periksa koneksi server."
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          clearTimeout(timeoutTimer);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
      clearTimeout(timeoutTimer);
    };
  }, [setAuthenticatedUser]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <style>{`
          @keyframes pulseScale {
            0%, 100% {
              transform: scale(0.85);
              opacity: 0.8;
            }
            50% {
              transform: scale(1.08);
              opacity: 1;
            }
          }
        `}</style>
        <Image
          src="/logo.png"
          alt="UAV Dashboard"
          width={96}
          height={96}
          priority
          className="h-20 w-20 sm:h-24 sm:w-24 select-none object-contain rounded-2xl"
          style={{ animation: "pulseScale 1.6s ease-in-out infinite" }}
        />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fafbfa] p-4 sm:p-6 select-none">
        {/* Subtle atmospheric ambient glow */}
        <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-[#123C28]/[0.03] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-[#123C28]/[0.04] blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#123c28_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.025]" />

        {/* Floating Card with depth & glassmorphism */}
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-gray-200/80 bg-white/95 p-7 text-center shadow-[0_20px_50px_-12px_rgba(18,60,40,0.09),0_4px_16px_-2px_rgba(0,0,0,0.03)] backdrop-blur-xl transition-all sm:p-9">
          {/* Top highlight shimmer */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#123C28]/15 to-transparent" />
          <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 h-32 w-48 rounded-full bg-rose-500/[0.04] blur-2xl" />

          {/* Layered Status Icon */}
          <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-rose-500/[0.08] blur-md" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-200/70 bg-gradient-to-b from-white via-rose-50/50 to-rose-100/30 text-rose-500 shadow-[0_4px_12px_rgba(244,63,94,0.12)]">
              <AlertCircle className="h-6 w-6 stroke-[2.2]" />
            </div>
          </div>

          {/* Status Chip */}
          <div className="mx-auto mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-gray-200/70 bg-gray-50/90 px-2.5 py-0.5 text-[10.5px] font-semibold text-gray-500">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
            Koneksi Terputus
          </div>

          {/* Title & Description */}
          <h2 className="text-lg font-bold tracking-tight text-[#123C28] sm:text-xl">
            Gagal Memuat Platform
          </h2>
          <p className="mt-2 text-xs sm:text-[13px] leading-relaxed text-gray-500 max-w-xs mx-auto">
            {loadError}
          </p>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setLoadError(null);
                setIsLoading(true);
                window.location.reload();
              }}
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#123C28] px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-[0_4px_14px_rgba(18,60,40,0.25)] transition-all duration-200 hover:bg-[#1a5134] hover:shadow-[0_6px_20px_rgba(18,60,40,0.35)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] cursor-pointer"
            >
              <RotateCw className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-90" />
              <span>Coba Lagi</span>
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem("token");
                window.location.href = "/login";
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200/90 bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-gray-700 shadow-xs transition-all duration-200 hover:border-gray-300 hover:bg-gray-50/80 hover:text-gray-900 active:scale-[0.98] cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5 text-gray-400" />
              <span>Login Ulang</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const userInitials = (user?.username || "P").slice(0, 2).toUpperCase();

  const userPlan =
    user?.role === "admin" ? "Administrator" : `${user?.tier || "Free"} Plan`;

  return (
    <div className="flex h-screen overflow-hidden bg-white text-[#123c28]">
      {/* =====================================================
          MOBILE OVERLAY
      ====================================================== */}
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Tutup sidebar"
          onClick={() => setIsSidebarOpen(false)}
          className="
            fixed inset-0 z-40
            bg-[#123c28]/30
            backdrop-blur-[2px]
            lg:hidden
          "
        />
      )}

      {/* =====================================================
          DESKTOP SIDEBAR
      ====================================================== */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* =====================================================
          MOBILE SIDEBAR
      ====================================================== */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50
          transform
          transition-transform duration-300 ease-out
          lg:hidden
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <Sidebar />
      </div>

      {/* =====================================================
          MAIN AREA
      ====================================================== */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white">
        {/* ===================================================
            PAGE CONTENT
        ==================================================== */}
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
