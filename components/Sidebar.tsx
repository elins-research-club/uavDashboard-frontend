"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useUserRole } from "@/context/UserRoleContext";
import {
  LayoutDashboard,
  Map,
  CreditCard,
  Upload,
  LogOut,
  ChevronRight,
  Settings,
  HelpCircle,
  Users,
  ShieldCheck,
  Activity,
  Leaf,
  ArrowUpRight,
} from "lucide-react";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUserRole();

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const isActive = (path: string) => pathname === path;

  const mainMenuItems = [
    {
      href: "/dashboard",
      label: "Ringkasan",
      description: "Overview dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      href: "/dashboard/maps",
      label: "Peta Saya",
      description: "Data & pemetaan",
      icon: <Map className="h-4 w-4" />,
    },
    {
      href: "/dashboard/subscription",
      label: "Langganan",
      description: "Paket layanan",
      icon: <CreditCard className="h-4 w-4" />,
    },
  ];

  const adminMenuItems = [
    ...(user?.role === "admin"
      ? [
          {
            href: "/dashboard/users",
            label: "Manajemen User",
            description: "Kelola pengguna",
            icon: <Users className="h-4 w-4" />,
          },
          {
            href: "/dashboard/admin",
            label: "Admin Panel",
            description: "RBAC & sistem",
            icon: <ShieldCheck className="h-4 w-4" />,
          },
          {
            href: "/dashboard/upload",
            label: "Upload Peta",
            description: "Tambah data baru",
            icon: <Upload className="h-4 w-4" />,
          },
        ]
      : []),
  ];

  const bottomMenuItems = [
    {
      href: "/dashboard/settings",
      label: "Pengaturan",
      icon: <Settings className="h-4 w-4" />,
    },
    {
      href: "/dashboard/help",
      label: "Bantuan",
      icon: <HelpCircle className="h-4 w-4" />,
    },
  ];

  const tierLabel =
    user?.tier === "kecamatan"
      ? "Enterprise"
      : user?.tier === "desa"
      ? "Koperasi Desa"
      : "Kelompok Tani";

  const userInitials = (user?.username || "Pengguna").slice(0, 2).toUpperCase();

  return (
    <aside className="flex h-screen w-[270px] flex-col border-r border-[#123c28]/10 bg-white">
      {/* =====================================================
          LOGO / BRAND
      ====================================================== */}
      <div className="px-5 pb-5 pt-5">
        <Link
          href="/dashboard"
          className="group flex items-center gap-3 rounded-2xl px-2 py-2 transition hover:bg-[#f4f6ef]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#123c28] transition group-hover:bg-[#1b5135]">
            <Map className="h-4.5 w-4.5 text-white" />
          </div>

          <div className="leading-none">
            <p className="text-[13px] font-black tracking-[0.16em] text-[#123c28]">
              UAV
            </p>

            <p className="mt-1 text-[8px] font-medium tracking-[0.24em] text-[#123c28]/40">
              DAAS PLATFORM
            </p>
          </div>
        </Link>
      </div>

      {/* =====================================================
          STATUS
      ====================================================== */}
      <div className="px-5 pb-3">
        <div className="flex items-center justify-between rounded-2xl border border-[#123c28]/8 bg-[#f7f8f4] px-3.5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <span className="block h-2 w-2 rounded-full bg-[#91b928]" />
              <span className="absolute inset-0 animate-ping rounded-full bg-[#91b928]/40" />
            </div>

            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#123c28]/35">
                SYSTEM
              </p>

              <p className="mt-0.5 text-[10px] font-semibold text-[#123c28]/70">
                Platform aktif
              </p>
            </div>
          </div>

          <Activity className="h-3.5 w-3.5 text-[#123c28]/25" />
        </div>
      </div>

      {/* =====================================================
          NAVIGATION
      ====================================================== */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {/* Main */}
        <div className="pt-4">
          <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.22em] text-[#123c28]/30">
            Workspace
          </p>

          <div className="space-y-1">
            {mainMenuItems.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative flex items-center gap-3 rounded-2xl px-3 py-3 transition-all ${
                    active
                      ? "bg-[#123c28] text-white shadow-[0_8px_20px_rgba(18,60,40,0.12)]"
                      : "text-[#123c28]/65 hover:bg-[#f3f6ed] hover:text-[#123c28]"
                  }`}
                >
                  {/* Active indicator */}
                  {active && (
                    <span className="absolute bottom-2 left-0 top-2 w-0.5 rounded-full bg-white" />
                  )}

                  <div
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition ${
                      active
                        ? "bg-white/10 text-white"
                        : "bg-[#f5f7f1] text-[#123c28]/60 group-hover:bg-white"
                    }`}
                  >
                    {item.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-xs font-semibold ${
                        active ? "text-white" : "text-[#123c28]/75"
                      }`}
                    >
                      {item.label}
                    </p>

                    <p
                      className={`mt-0.5 truncate text-[9px] ${
                        active ? "text-white/40" : "text-[#123c28]/30"
                      }`}
                    >
                      {item.description}
                    </p>
                  </div>

                  {active && (
                    <ChevronRight className="h-3.5 w-3.5 text-white/55" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* ===================================================
            ADMIN
        ==================================================== */}
        {user?.role === "admin" && (
          <div className="mt-7 border-t border-[#123c28]/8 pt-6">
            <div className="mb-2 flex items-center justify-between px-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#123c28]/30">
                Administration
              </p>

              <span className="rounded-full bg-[#f0f3ea] px-2 py-1 text-[8px] font-bold uppercase tracking-[0.12em] text-[#123c28]/45">
                Admin
              </span>
            </div>

            <div className="space-y-1">
              {adminMenuItems.map((item) => {
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group relative flex items-center gap-3 rounded-2xl px-3 py-3 transition-all ${
                      active
                        ? "bg-[#123c28] text-white shadow-[0_8px_20px_rgba(18,60,40,0.12)]"
                        : "text-[#123c28]/65 hover:bg-[#f3f6ed] hover:text-[#123c28]"
                    }`}
                  >
                    {active && (
                      <span className="absolute bottom-2 left-0 top-2 w-0.5 rounded-full bg-white" />
                    )}

                    <div
                      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${
                        active
                          ? "bg-white/10"
                          : "bg-[#f5f7f1] group-hover:bg-white"
                      }`}
                    >
                      {item.icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-xs font-semibold ${
                          active ? "text-white" : "text-[#123c28]/75"
                        }`}
                      >
                        {item.label}
                      </p>

                      <p
                        className={`mt-0.5 truncate text-[9px] ${
                          active ? "text-white/40" : "text-[#123c28]/30"
                        }`}
                      >
                        {item.description}
                      </p>
                    </div>

                    {active && (
                      <ChevronRight className="h-3.5 w-3.5 text-white/55" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ===================================================
            SETTINGS
        ==================================================== */}
        <div className="mt-7 border-t border-[#123c28]/8 pt-6">
          <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.22em] text-[#123c28]/30">
            Preferences
          </p>

          <div className="space-y-1">
            {bottomMenuItems.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-xs font-medium transition ${
                    active
                      ? "bg-[#f3f6ed] text-[#123c28]"
                      : "text-[#123c28]/55 hover:bg-[#f7f8f4] hover:text-[#123c28]"
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                      active ? "bg-white" : "bg-[#f7f8f4]"
                    }`}
                  >
                    {item.icon}
                  </div>

                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* =====================================================
          USER CARD
      ====================================================== */}
      <div className="border-t border-[#123c28]/10 p-3">
        <div className="rounded-[22px] bg-[#f4f6ef] p-3">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#123c28] text-xs font-bold text-white">
              {userInitials}

              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#f4f6ef] bg-[#91b928]" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-[#123c28]">
                {user?.username || "Pengguna"}
              </p>

              <div className="mt-1 flex items-center gap-1.5">
                {user?.role === "admin" ? (
                  <>
                    <ShieldCheck className="h-3 w-3 text-[#123c28]/50" />

                    <span className="text-[9px] font-semibold text-[#123c28]/50">
                      Administrator
                    </span>
                  </>
                ) : (
                  <>
                    <Leaf className="h-3 w-3 text-[#123c28]/50" />

                    <span className="truncate text-[9px] font-semibold text-[#123c28]/50">
                      {tierLabel}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* account info */}
          <div className="mt-3 flex items-center justify-between rounded-xl bg-white px-3 py-2.5">
            <div>
              <p className="text-[8px] uppercase tracking-[0.15em] text-[#123c28]/25">
                Account
              </p>

              <p className="mt-0.5 text-[10px] font-semibold capitalize text-[#123c28]/65">
                {user?.role === "admin"
                  ? "Admin Access"
                  : `${user?.tier || "free"} Tier`}
              </p>
            </div>

            <ArrowUpRight className="h-3.5 w-3.5 text-[#123c28]/25" />
          </div>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          className="mt-2 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-xs font-medium text-[#123c28]/45 transition hover:bg-[#faf5f4] hover:text-[#a3483c]"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f7f8f4]">
            <LogOut className="h-4 w-4" />
          </div>

          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
