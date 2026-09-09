"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useUserRole } from "@/context/UserRoleContext";
import {
  LayoutDashboard,
  Map,
  CreditCard,
  Upload,
  LogOut,
  Settings,
  HelpCircle,
  Users,
  ShieldCheck,
  Drone,
  Leaf,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

type MenuItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUserRole();

  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const isActive = (path: string) => pathname === path;

  const mainMenuItems: MenuItem[] = [
    {
      href: "/dashboard",
      label: "Ringkasan",
      icon: <LayoutDashboard size={18} strokeWidth={1.8} />,
    },
    {
      href: "/dashboard/maps",
      label: "Peta Saya",
      icon: <Map size={18} strokeWidth={1.8} />,
    },
    {
      href: "/dashboard/subscription",
      label: "Langganan",
      icon: <CreditCard size={18} strokeWidth={1.8} />,
    },
  ];

  const adminMenuItems: MenuItem[] =
    user?.role === "admin"
      ? [
          {
            href: "/dashboard/users",
            label: "Manajemen User",
            icon: <Users size={18} strokeWidth={1.8} />,
          },
          {
            href: "/dashboard/admin",
            label: "Admin Panel",
            icon: <ShieldCheck size={18} strokeWidth={1.8} />,
          },
          {
            href: "/dashboard/upload",
            label: "Upload Peta",
            icon: <Upload size={18} strokeWidth={1.8} />,
          },
        ]
      : [];

  const settingsMenuItems: MenuItem[] = [
    {
      href: "/dashboard/settings",
      label: "Pengaturan",
      icon: <Settings size={18} strokeWidth={1.8} />,
    },
    {
      href: "/dashboard/help",
      label: "Bantuan",
      icon: <HelpCircle size={18} strokeWidth={1.8} />,
    },
  ];

  const tierLabel =
    user?.tier === "kecamatan"
      ? "Enterprise"
      : user?.tier === "desa"
      ? "Koperasi Desa"
      : "Kelompok Tani";

  const userInitials = (user?.username || "Pengguna").slice(0, 2).toUpperCase();

  /**
   * Menu item
   *
   * Design:
   * - tinggi kecil
   * - horizontal padding kecil
   * - no rounded card besar
   * - hover background tipis
   * - active background tipis dengan aksen hijau
   */
  const renderMenuItem = (item: MenuItem) => {
    const active = isActive(item.href);

    return (
      <Link
        key={item.href}
        href={item.href}
        title={collapsed ? item.label : undefined}
        className={`
          group relative flex h-10 items-center
          rounded-xl text-sm
          transition-colors duration-150
          ${collapsed ? "justify-center px-0" : "gap-3 px-3"}
          ${
            active
              ? "bg-[#edf3ed] text-[#123c28]"
              : "text-[#1f2933] hover:bg-[#f5f6f5]"
          }
        `}
      >
        {/* Active indicator */}
        {active && !collapsed && (
          <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[#5f8f38]" />
        )}

        <span
          className={`
            flex shrink-0 items-center justify-center
            ${
              active
                ? "text-[#123c28]"
                : "text-[#4b5563] group-hover:text-[#123c28]"
            }
          `}
        >
          {item.icon}
        </span>

        {!collapsed && (
          <span
            className={`
              truncate font-medium
              ${active ? "text-[#123c28]" : "text-[#374151]"}
            `}
          >
            {item.label}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside
      className={`
        flex h-screen flex-col
        border-r border-[#123c28]/10
        bg-white
        transition-[width] duration-200 ease-out
        ${collapsed ? "w-[68px]" : "w-[255px]"}
      `}
    >
      {/* =====================================================
    HEADER
====================================================== */}
      <div
        className={`
    flex h-[62px] shrink-0 items-center
    border-b border-[#123c28]/8
    ${collapsed ? "justify-center" : "justify-between px-4"}
  `}
      >
        {collapsed ? (
          /* =================================================
       COLLAPSED:
       Logo menjadi tombol expand
    ================================================== */
          <div className="group relative">
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              aria-label="Buka sidebar"
              className="
          relative flex h-10 w-10 items-center justify-center
          rounded-full
          bg-[#f1f2f0]
          text-[#123c28]
          transition-all duration-150
          hover:bg-[#e8ebe6]
        "
            >
              {/* Logo normal */}
              <Drone
                size={17}
                strokeWidth={1.9}
                className="
            transition-all duration-150
            group-hover:scale-0
            group-hover:opacity-0
          "
              />

              {/* Icon open saat hover */}
              <PanelLeftOpen
                size={18}
                strokeWidth={1.8}
                className="
            absolute
            scale-0 opacity-0
            transition-all duration-150
            group-hover:scale-100
            group-hover:opacity-100
          "
              />
            </button>

            {/* Tooltip / label */}
            <div
              className="
          pointer-events-none absolute
          left-[48px] top-1/2
          z-50
          -translate-y-1/2
          translate-x-[-4px]
          whitespace-nowrap
          rounded-xl
          bg-black
          px-4 py-2.5
          text-[13px] font-semibold
          text-white
          opacity-0
          shadow-lg
          transition-all duration-150
          group-hover:translate-x-0
          group-hover:opacity-100
        "
            >
              Buka sidebar
            </div>
          </div>
        ) : (
          /* =================================================
       EXPANDED
    ================================================== */
          <>
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div
                className="
            flex h-8 w-8 shrink-0 items-center justify-center
            rounded-lg bg-[#123c28]
          "
              >
                <Drone size={16} strokeWidth={2} className="text-white" />
              </div>

              <div className="leading-none">
                <p className="text-[13px] font-bold tracking-[0.06em] text-[#123c28]">
                  UAV
                </p>

                <p className="mt-1 text-[8px] font-semibold tracking-[0.16em] text-[#123c28]/55">
                  DAAS PLATFORM
                </p>
              </div>
            </Link>

            {/* Collapse button */}
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              title="Tutup sidebar"
              aria-label="Tutup sidebar"
              className="
          flex h-8 w-8 shrink-0 items-center justify-center
          rounded-lg
          text-[#6b7280]
          transition-colors
          hover:bg-[#f3f6ed]
          hover:text-[#123c28]
        "
            >
              <PanelLeftClose size={18} strokeWidth={1.7} />
            </button>
          </>
        )}
      </div>

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}
      <div className="flex-1 overflow-y-auto px-2 py-4">
        {/* =====================================================
            WORKSPACE
        ====================================================== */}
        {!collapsed && (
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9ca3af]">
            Workspace
          </p>
        )}

        <div className="space-y-0.5">{mainMenuItems.map(renderMenuItem)}</div>

        {/* =====================================================
            ADMINISTRATION
        ====================================================== */}
        {user?.role === "admin" && (
          <div className="mt-6 border-t border-[#123c28]/8 pt-5">
            {!collapsed && (
              <div className="mb-2 flex items-center justify-between px-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9ca3af]">
                  Administration
                </p>

                <span className="rounded-md bg-[#edf3ed] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-[#123c28]">
                  Admin
                </span>
              </div>
            )}

            <div className="space-y-0.5">
              {adminMenuItems.map(renderMenuItem)}
            </div>
          </div>
        )}

        {/* =====================================================
            PREFERENCES
        ====================================================== */}
        <div className="mt-6 border-t border-[#123c28]/8 pt-5">
          {!collapsed && (
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9ca3af]">
              Preferences
            </p>
          )}

          <div className="space-y-0.5">
            {settingsMenuItems.map(renderMenuItem)}
          </div>
        </div>
      </div>

      {/* =====================================================
          FOOTER / USER
      ====================================================== */}
      <div className="shrink-0 border-t border-[#123c28]/8 p-2">
        {/* User */}
        <div
          className={`
            flex items-center rounded-xl
            transition-colors hover:bg-[#f5f6f5]
            ${collapsed ? "justify-center px-0 py-2" : "gap-3 px-2 py-2"}
          `}
          title={collapsed ? user?.username || "Pengguna" : undefined}
        >
          {/* Avatar */}
          <div
            className="
              relative flex h-8 w-8 shrink-0
              items-center justify-center
              rounded-full
              bg-[#123c28]
              text-[10px] font-bold text-white
            "
          >
            {userInitials}

            <span
              className="
                absolute bottom-0 right-0
                h-2 w-2 rounded-full
                border-2 border-white
                bg-[#91b928]
              "
            />
          </div>

          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-[#1f2933]">
                {user?.username || "Pengguna"}
              </p>

              <div className="mt-0.5 flex items-center gap-1">
                {user?.role === "admin" ? (
                  <>
                    <ShieldCheck size={11} className="text-[#123c28]" />

                    <span className="truncate text-[10px] text-[#6b7280]">
                      Administrator
                    </span>
                  </>
                ) : (
                  <>
                    <Leaf size={11} className="text-[#5f8f38]" />

                    <span className="truncate text-[10px] text-[#6b7280]">
                      {tierLabel}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          title={collapsed ? "Logout" : undefined}
          className={`
            mt-1 flex h-10 w-full items-center
            rounded-xl
            text-sm
            text-[#6b7280]
            transition-colors
            hover:bg-red-50
            hover:text-red-600
            ${collapsed ? "justify-center px-0" : "gap-3 px-3"}
          `}
        >
          <LogOut size={18} strokeWidth={1.8} />

          {!collapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
