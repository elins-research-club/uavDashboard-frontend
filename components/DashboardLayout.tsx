"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import { Menu, X, ArrowUpRight, Leaf } from "lucide-react";
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
    const token = localStorage.getItem("token");

    if (!token) {
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
      .finally(() => {
        setIsLoading(false);
      });
  }, [router, setAuthenticatedUser]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div
            className="
              mx-auto mb-4
              h-10 w-10
              animate-spin
              rounded-full
              border-2
              border-[#123c28]/20
              border-t-[#123c28]
            "
          />

          <p className="text-xs font-semibold tracking-wide text-[#123c28]/80">
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
