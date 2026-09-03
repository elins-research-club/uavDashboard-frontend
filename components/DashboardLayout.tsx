"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import { Search, Menu, X, ArrowUpRight, Leaf } from "lucide-react";
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

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.push("/login");
      setIsLoading(false);
      return;
    }

    Promise.all([api.get("/users/me"), api.get("/subscriptions/current")])
      .then(([profileResponse, subscriptionResponse]) => {
        setAuthenticatedUser({
          ...profileResponse.data,
          tier: subscriptionResponse.data.tier,
        });

        setIsAuthenticated(true);
      })
      .catch(() => {
        localStorage.removeItem("token");
        router.push("/login");
      })
      .finally(() => setIsLoading(false));
  }, [router, setAuthenticatedUser]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#123c28]/10 border-t-[#123c28] animate-spin" />

          <p className="text-xs font-medium tracking-wide text-[#123c28]/45">
            Memuat platform...
          </p>
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
          className="fixed inset-0 z-40 bg-[#123c28]/25 backdrop-blur-[2px] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
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
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-out lg:hidden ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar />
      </div>

      {/* =====================================================
          MAIN AREA
      ====================================================== */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white">
        {/* ===================================================
            TOP NAVBAR
        ==================================================== */}
        <header className="flex-shrink-0 bg-white px-3 pt-3 sm:px-5">
          <div className="flex h-[58px] items-center justify-between rounded-full border border-[#123c28]/10 bg-white px-2.5 shadow-[0_8px_30px_rgba(18,60,40,0.04)]">
            {/* -------------------------------------------------
                LEFT
            -------------------------------------------------- */}
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {/* Mobile menu */}
              <button
                type="button"
                aria-label={isSidebarOpen ? "Tutup menu" : "Buka menu"}
                onClick={() => setIsSidebarOpen((value) => !value)}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#123c28] text-white transition hover:bg-[#1a5134] lg:hidden"
              >
                {isSidebarOpen ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Menu className="h-4 w-4" />
                )}
              </button>

              {/* Mobile brand */}
              <div className="flex items-center gap-2 pl-1 lg:hidden">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#123c28]">
                  <Leaf className="h-3.5 w-3.5 text-white" />
                </div>

                <div className="hidden leading-none sm:block">
                  <p className="text-[10px] font-black tracking-[0.18em]">
                    UAV
                  </p>

                  <p className="mt-0.5 text-[7px] tracking-[0.25em] text-[#123c28]/35">
                    DAAS PLATFORM
                  </p>
                </div>
              </div>

              {/* Search */}
              <div className="hidden min-w-0 flex-1 md:block">
                <div className="relative max-w-lg">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#123c28]/25" />

                  <input
                    type="text"
                    placeholder="Cari peta, analisis..."
                    className="h-10 w-full rounded-full border border-[#123c28]/8 bg-[#f7f8f4] pl-11 pr-4 text-xs text-[#123c28] outline-none transition placeholder:text-[#123c28]/25 hover:border-[#123c28]/15 focus:border-[#123c28]/20 focus:bg-white"
                  />
                </div>
              </div>

              {/* Small mobile title */}
              <div className="min-w-0 md:hidden">
                <p className="truncate text-xs font-semibold text-[#123c28]">
                  UAV Dashboard
                </p>

                <p className="truncate text-[9px] text-[#123c28]/35">
                  Field Intelligence
                </p>
              </div>
            </div>

            {/* -------------------------------------------------
                RIGHT
            -------------------------------------------------- */}
            <div className="flex items-center gap-2 pl-2">
              {/* Search icon on small screens */}
              <button
                type="button"
                aria-label="Cari"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#123c28]/10 bg-white text-[#123c28]/50 transition hover:bg-[#f4f6ef] md:hidden"
              >
                <Search className="h-4 w-4" />
              </button>

              {/* User */}
              <div className="hidden items-center gap-3 border-l border-[#123c28]/8 pl-3 sm:flex">
                <div className="text-right">
                  <p className="max-w-[140px] truncate text-[11px] font-semibold text-[#123c28]">
                    {user?.username || "Pengguna"}
                  </p>

                  <p className="mt-0.5 text-[9px] capitalize text-[#123c28]/40">
                    {userPlan}
                  </p>
                </div>

                <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#123c28] text-[10px] font-bold text-white">
                  {userInitials}

                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#91b928]" />
                </div>

                <ArrowUpRight className="h-3.5 w-3.5 text-[#123c28]/20" />
              </div>

              {/* Mobile avatar */}
              <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#123c28] text-[10px] font-bold text-white sm:hidden">
                {userInitials}

                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#91b928]" />
              </div>
            </div>
          </div>
        </header>

        {/* ===================================================
            PAGE CONTENT
        ==================================================== */}
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
