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
        setLoadError("Waktu tunggu koneksi server habis. Silakan periksa jaringan Anda.");
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
        } else if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
          setLoadError("Koneksi ke server timeout. Silakan coba kembali.");
        } else if (typeof navigator !== "undefined" && !navigator.onLine) {
          setLoadError("Perangkat Anda offline. Periksa sambungan internet.");
        } else {
          setLoadError("Tidak dapat terhubung ke server UAV. Silakan coba lagi.");
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

        {/* Floating Minimal Card with depth */}
        <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-gray-200/80 bg-white/95 p-8 text-center shadow-[0_20px_50px_-12px_rgba(18,60,40,0.08),0_4px_16px_-2px_rgba(0,0,0,0.02)] backdrop-blur-xl transition-all sm:p-9">
          {/* Top highlight shimmer */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#123C28]/15 to-transparent" />

          {/* Ikon besar transparan tanpa bg */}
          <div className="mx-auto mb-5 flex items-center justify-center">
            <AlertCircle className="h-16 w-16 text-rose-500 stroke-[1.4] sm:h-20 sm:w-20" />
          </div>

          {/* Teks Minim */}
          <h2 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
            Koneksi Terputus
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-gray-500 sm:text-sm">
            {loadError || "Tidak dapat terhubung ke server UAV. Silakan coba lagi."}
          </p>

          {/* Tombol besar transparan tanpa bg */}
          <div className="mt-8 flex flex-col gap-2.5 w-full">
            <button
              type="button"
              onClick={() => {
                setLoadError(null);
                setIsLoading(true);
                window.location.reload();
              }}
              className="flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-[#123C28] bg-transparent text-sm font-bold text-[#123C28] transition-all duration-150 hover:bg-[#123C28]/5 active:scale-[0.98] cursor-pointer"
            >
              <RotateCw className="h-4 w-4" />
              <span>Coba Lagi</span>
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem("token");
                window.location.href = "/login";
              }}
              className="flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl border border-gray-300/80 bg-transparent text-sm font-semibold text-gray-600 transition-all duration-150 hover:border-gray-400 hover:text-gray-900 active:scale-[0.98] cursor-pointer"
            >
              <LogOut className="h-4 w-4 text-gray-400" />
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
