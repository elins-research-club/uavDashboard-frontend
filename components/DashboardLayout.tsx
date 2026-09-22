"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Sidebar from "./Sidebar";
import MobileBottomNav from "./MobileBottomNav";
import api from "@/lib/api";
import { useUserRole } from "@/context/UserRoleContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
        setLoadError(
          "Koneksi ke server backend memakan waktu terlalu lama. Pastikan server backend aktif di port 8001."
        );
        setIsLoading(false);
      }
    }, 12000);

    Promise.all([api.get("/users/me"), api.get("/subscriptions/current")])
      .then(([profileResponse, subscriptionResponse]) => {
        if (!isMounted) return;

        setAuthenticatedUser({
          ...profileResponse.data,
          tier: subscriptionResponse.data.tier,
          subscription: subscriptionResponse.data,
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

  /* ============================================================
     LOADING
  ============================================================ */

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
          className="h-20 w-20 select-none rounded-2xl object-contain sm:h-24 sm:w-24"
          style={{
            animation: "pulseScale 1.6s ease-in-out infinite",
          }}
        />
      </div>
    );
  }

  /* ============================================================
     LOAD ERROR
  ============================================================ */

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f8f4] p-4">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-lg">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
            <span className="text-xl font-bold">!</span>
          </div>

          <h2 className="text-base font-bold text-[#123c28]">
            Gagal Memuat Platform
          </h2>

          <p className="mt-2 text-xs leading-relaxed text-gray-600">
            {loadError}
          </p>

          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setLoadError(null);
                setIsLoading(true);
                window.location.reload();
              }}
              className="rounded-full bg-[#123c28] px-4 py-2 text-xs font-bold text-white shadow transition hover:bg-[#1a5134]"
            >
              Coba Lagi
            </button>

            <button
              type="button"
              onClick={() => {
                localStorage.removeItem("token");
                window.location.href = "/login";
              }}
              className="rounded-full border border-[#123c28]/20 bg-white px-4 py-2 text-xs font-bold text-[#123c28] transition hover:bg-gray-50"
            >
              Login Ulang
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ============================================================
     AUTH GUARD
  ============================================================ */

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F5F2] text-[#151515]">
      {/* ========================================================
          DESKTOP SIDEBAR
          ======================================================== */}

      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* ========================================================
          MAIN AREA
          ======================================================== */}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#F4F5F2]">
        <main
          className="
            min-h-0
            flex-1
            overflow-y-auto
            bg-[#F4F5F2]
            pb-[88px]
            lg:pb-0
          "
        >
          {children}
        </main>
      </div>

      {/* ========================================================
          MOBILE BOTTOM NAV
          ======================================================== */}

      <MobileBottomNav />
    </div>
  );
}
