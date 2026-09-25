"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Sidebar from "./Sidebar";
import MobileBottomNav from "./MobileBottomNav";
import api from "@/lib/api";
import { useUserRole } from "@/context/UserRoleContext";
import SettingsEffects from "@/components/SettingsEffects";
import AppToastHost from "@/components/AppToastHost";
import { daysUntil } from "@/lib/settings-options";
import { getSettingsSnapshot } from "@/lib/stores/settingsStore";
import { notifySubscriptionReminder } from "@/lib/notify";

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
     SUBSCRIPTION REMINDER
     Pengingat sekali per sesi saat tanggal berakhir berada
     dalam jangka waktu yang dipilih di halaman Pengaturan.
  ============================================================ */

  const reminderSentRef = useRef(false);

  useEffect(() => {
    if (!user || reminderSentRef.current) {
      return;
    }

    const subscription = user.subscription;

    if (!subscription || subscription.status !== "active") {
      return;
    }

    const days = daysUntil(subscription.end_date);

    if (days === null) {
      return;
    }

    const settings = getSettingsSnapshot();

    if (days > settings.subscriptionLeadDays) {
      return;
    }

    reminderSentRef.current = true;

    notifySubscriptionReminder(days, subscription.tier || "paket Anda");
  }, [user]);

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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#eef2f7] to-[#f7f9fc] p-6">
        <div className="flex w-full max-w-sm flex-col items-center text-center">

          {/* ── Ilustrasi utama ── */}
          <div className="relative mb-6 flex items-end justify-center select-none">
            {/* Awan kiri */}
            <svg className="absolute -top-4 -left-6 opacity-60" width="48" height="28" viewBox="0 0 48 28" fill="none">
              <ellipse cx="24" cy="20" rx="18" ry="10" fill="#dce8f5"/>
              <ellipse cx="18" cy="17" rx="11" ry="9" fill="#dce8f5"/>
              <ellipse cx="32" cy="16" rx="9" ry="8" fill="#dce8f5"/>
            </svg>
            {/* Awan kanan kecil */}
            <svg className="absolute -top-2 right-0 opacity-40" width="32" height="18" viewBox="0 0 32 18" fill="none">
              <ellipse cx="16" cy="13" rx="12" ry="7" fill="#dce8f5"/>
              <ellipse cx="11" cy="11" rx="7" ry="6" fill="#dce8f5"/>
              <ellipse cx="22" cy="10" rx="6" ry="5" fill="#dce8f5"/>
            </svg>

            {/* Teks besar "500" */}
            <span
              className="text-[96px] font-black leading-none tracking-tighter text-[#123c28]/15"
              style={{ letterSpacing: "-0.04em" }}
            >
              500
            </span>

            {/* Karakter kecil berdiri di tengah angka */}
            <svg
              className="absolute bottom-2"
              width="42" height="72"
              viewBox="0 0 42 72"
              fill="none"
            >
              {/* Kepala */}
              <circle cx="21" cy="11" r="8" fill="#2563eb"/>
              {/* Mata kiri */}
              <circle cx="18" cy="10" r="1.2" fill="white"/>
              {/* Mata kanan */}
              <circle cx="24" cy="10" r="1.2" fill="white"/>
              {/* Badan */}
              <rect x="13" y="20" width="16" height="22" rx="5" fill="#2563eb"/>
              {/* Tangan kiri — sedang memegang clipboard */}
              <rect x="3" y="22" width="9" height="4" rx="2" fill="#1d4ed8"/>
              <rect x="2" y="18" width="10" height="14" rx="2" fill="#f59e0b"/>
              <line x1="5" y1="22" x2="10" y2="22" stroke="white" strokeWidth="1"/>
              <line x1="5" y1="25" x2="10" y2="25" stroke="white" strokeWidth="1"/>
              {/* Tangan kanan */}
              <rect x="30" y="22" width="9" height="4" rx="2" fill="#1d4ed8"/>
              {/* Kaki kiri */}
              <rect x="14" y="42" width="6" height="16" rx="3" fill="#1e3a8a"/>
              {/* Kaki kanan */}
              <rect x="22" y="42" width="6" height="16" rx="3" fill="#1e3a8a"/>
              {/* Sepatu kiri */}
              <ellipse cx="17" cy="58" rx="5" ry="3" fill="#111827"/>
              {/* Sepatu kanan */}
              <ellipse cx="25" cy="58" rx="5" ry="3" fill="#111827"/>
            </svg>
          </div>

          {/* ── Label error ── */}
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#123c28]/50">
            Error 500
          </p>

          {/* ── Judul ── */}
          <h2 className="mb-2 text-xl font-bold text-[#123c28]">
            Gagal Memuat Platform
          </h2>

          {/* ── Deskripsi ── */}
          <p className="mb-1 text-sm leading-relaxed text-gray-500">
            {loadError}
          </p>

          {/* ── Garis dekoratif ala referensi ── */}
          <div className="my-5 flex flex-col items-center gap-1.5">
            <div className="h-1 w-16 rounded-full bg-gray-200"/>
            <div className="h-1 w-10 rounded-full bg-gray-200"/>
          </div>

          {/* ── Tombol aksi ── */}
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setLoadError(null);
                setIsLoading(true);
                window.location.reload();
              }}
              className="rounded-full bg-[#123c28] px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-[#1a5134] active:scale-95"
            >
              Coba Lagi
            </button>

            <button
              type="button"
              onClick={() => {
                localStorage.removeItem("token");
                window.location.href = "/login";
              }}
              className="rounded-full border border-[#123c28]/25 bg-white px-6 py-2.5 text-sm font-bold text-[#123c28] shadow-sm transition hover:bg-[#f0f4f0] active:scale-95"
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

      {/* Preferensi tema/aksen/gerak + host toast global */}
      <SettingsEffects />
      <AppToastHost />
    </div>
  );
}
