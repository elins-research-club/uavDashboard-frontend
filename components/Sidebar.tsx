"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useUserRole } from "@/context/UserRoleContext";
import {
  LayoutDashboard,
  Map,
  CreditCard,
  Upload,
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

const COLLAPSE_STORAGE_KEY = "sidebar:collapsed";
const ICON_STROKE = 1.75;

/** Label tier — satu sumber kebenaran, dipakai konsisten di seluruh app. */
export const getTierLabel = (tier?: string) => {
  if (tier === "kecamatan") return "Enterprise";
  if (tier === "desa") return "Koperasi Desa";
  return "Kelompok Tani";
};

export default function Sidebar({
  collapsible = true,
}: {
  /** Mobile drawer sebaiknya selalu expanded — set false di sana. */
  collapsible?: boolean;
}) {
  const pathname = usePathname();
  const { user } = useUserRole();

  const [collapsed, setCollapsed] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  /* Persist preferensi collapse (sejalan dengan pola localStorage di /settings) */
  useEffect(() => {
    if (!collapsible) return;
    const stored = localStorage.getItem(COLLAPSE_STORAGE_KEY);
    if (stored === "true") setCollapsed(true);
    setIsHydrated(true);
  }, [collapsible]);

  const toggleCollapsed = (next: boolean) => {
    setCollapsed(next);
    localStorage.setItem(COLLAPSE_STORAGE_KEY, String(next));
  };

  const isCollapsed = collapsible && collapsed;

  const isActive = (path: string) => pathname === path;

  const mainMenuItems: MenuItem[] = [
    {
      href: "/dashboard",
      label: "Ringkasan",
      icon: <LayoutDashboard size={18} strokeWidth={ICON_STROKE} />,
    },
    {
      href: "/dashboard/maps",
      label: "Peta Saya",
      icon: <Map size={18} strokeWidth={ICON_STROKE} />,
    },
    {
      href: "/dashboard/subscription",
      label: "Langganan",
      icon: <CreditCard size={18} strokeWidth={ICON_STROKE} />,
    },
  ];

  const adminMenuItems: MenuItem[] =
    user?.role === "admin"
      ? [
        {
          href: "/dashboard/users",
          label: "Manajemen User",
          icon: <Users size={18} strokeWidth={ICON_STROKE} />,
        },
        {
          href: "/dashboard/admin",
          label: "Admin Panel",
          icon: <ShieldCheck size={18} strokeWidth={ICON_STROKE} />,
        },
        {
          href: "/dashboard/upload",
          label: "Upload Peta",
          icon: <Upload size={18} strokeWidth={ICON_STROKE} />,
        },
      ]
      : [];

  const settingsMenuItems: MenuItem[] = [
    {
      href: "/dashboard/settings",
      label: "Pengaturan",
      icon: <Settings size={18} strokeWidth={ICON_STROKE} />,
    },
    {
      href: "/dashboard/help",
      label: "Bantuan",
      icon: <HelpCircle size={18} strokeWidth={ICON_STROKE} />,
    },
  ];

  const tierLabel = getTierLabel(user?.tier);
  const userInitials = (user?.username || "Pengguna").slice(0, 2).toUpperCase();

  /* ============================================================
     MENU ITEM
     - Active: glass tipis + accent bar (tetap tampil saat collapsed)
     - Collapsed: tooltip custom (brand-900), bukan title bawaan browser
     - Fokus keyboard terlihat jelas
  ============================================================ */
  const renderMenuItem = (item: MenuItem) => {
    const active = isActive(item.href);

    return (
      <li key={item.href} className="group/item relative">
        <Link
          href={item.href}
          aria-current={active ? "page" : undefined}
          className={`
            relative flex h-10 items-center rounded-xl text-xs font-medium
            outline-none transition-all duration-200
            focus-visible:ring-2 focus-visible:ring-brand-600/40
            ${isCollapsed ? "justify-center px-0" : "gap-3 px-3"}
            ${active
              ? "bg-brand-100/80 font-semibold text-brand-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
              : "text-brand-900/70 hover:bg-white/70 hover:text-brand-900"
            }
          `}
        >
          {/* Accent bar — tampil di kedua mode agar state selalu terbaca */}
          {active && (
            <span
              aria-hidden
              className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-600"
            />
          )}

          <span
            className={`flex shrink-0 items-center justify-center transition-colors ${active ? "text-brand-700" : "text-brand-900/55"
              }`}
          >
            {item.icon}
          </span>

          {!isCollapsed && <span className="truncate">{item.label}</span>}
        </Link>

        {/* Tooltip saat collapsed */}
        {isCollapsed && (
          <span
            role="tooltip"
            className="
              pointer-events-none absolute left-[52px] top-1/2 z-50
              -translate-y-1/2 translate-x-[-4px] whitespace-nowrap
              rounded-lg bg-brand-900 px-3 py-1.5 text-xs font-semibold text-white
              opacity-0 shadow-glass transition-all duration-150
              group-hover/item:translate-x-0 group-hover/item:opacity-100
            "
          >
            {item.label}
          </span>
        )}
      </li>
    );
  };

  /* Section header — saat collapsed diganti divider agar grouping tetap terbaca */
  const renderSectionLabel = (label: string, id: string) =>
    isCollapsed ? (
      <div aria-hidden className="mx-3 mb-2 h-px bg-brand-800/10" />
    ) : (
      <p id={id} className="micro-label mb-2 px-3">
        {label}
      </p>
    );

  return (
    <aside
      className={`
        flex h-screen flex-col border-r border-brand-800/10
        bg-white/80 backdrop-blur-xl
        transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
        ${isCollapsed ? "w-[68px]" : "w-[255px]"}
        ${isHydrated || !collapsible ? "" : "opacity-100"}
      `}
    >
      {/* ==================================================
          HEADER
      =================================================== */}
      <div
        className={`flex h-[62px] shrink-0 items-center border-b border-brand-800/8 ${isCollapsed ? "justify-center" : "justify-between px-4"
          }`}
      >
        {isCollapsed ? (
          <div className="group/logo relative">
            <button
              type="button"
              onClick={() => toggleCollapsed(false)}
              aria-label="Buka sidebar"
              className="
                icon-ring relative h-10 w-10 rounded-full outline-none
                transition-all duration-200
                focus-visible:ring-2 focus-visible:ring-brand-600/40
              "
            >
              <Drone
                size={17}
                strokeWidth={ICON_STROKE}
                className="transition-all duration-200 group-hover/logo:scale-0 group-hover/logo:opacity-0"
              />
              <PanelLeftOpen
                size={18}
                strokeWidth={ICON_STROKE}
                className="absolute scale-0 opacity-0 transition-all duration-200 group-hover/logo:scale-100 group-hover/logo:opacity-100"
              />
            </button>

            <span
              role="tooltip"
              className="
                pointer-events-none absolute left-[52px] top-1/2 z-50
                -translate-y-1/2 translate-x-[-4px] whitespace-nowrap
                rounded-lg bg-brand-900 px-3 py-1.5 text-xs font-semibold text-white
                opacity-0 shadow-glass transition-all duration-150
                group-hover/logo:translate-x-0 group-hover/logo:opacity-100
              "
            >
              Buka sidebar
            </span>
          </div>
        ) : (
          <>
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-800">
                <Drone size={16} strokeWidth={2} className="text-white" />
              </span>

              <span className="leading-none">
                <span className="block text-[13px] font-bold tracking-[0.06em] text-brand-900">
                  UAV
                </span>
                <span className="mt-1 block text-2xs font-semibold text-brand-800/55">
                  DAAS PLATFORM
                </span>
              </span>
            </Link>

            {collapsible && (
              <button
                type="button"
                onClick={() => toggleCollapsed(true)}
                aria-label="Tutup sidebar"
                className="
                  flex h-8 w-8 shrink-0 items-center justify-center rounded-lg
                  text-brand-800/50 outline-none transition-colors
                  hover:bg-brand-100 hover:text-brand-900
                  focus-visible:ring-2 focus-visible:ring-brand-600/40
                "
              >
                <PanelLeftClose size={18} strokeWidth={ICON_STROKE} />
              </button>
            )}
          </>
        )}
      </div>

      {/* ==================================================
          NAVIGASI
      =================================================== */}
      <nav
        aria-label="Navigasi utama"
        className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-4"
      >
        {/* Workspace */}
        {renderSectionLabel("Workspace", "nav-workspace")}
        <ul
          aria-labelledby={isCollapsed ? undefined : "nav-workspace"}
          className="space-y-0.5"
        >
          {mainMenuItems.map(renderMenuItem)}
        </ul>

        {/* Administration */}
        {user?.role === "admin" && (
          <div className="mt-6 border-t border-brand-800/8 pt-5">
            {isCollapsed ? (
              <div aria-hidden className="mx-3 mb-2 h-px bg-brand-800/10" />
            ) : (
              <div className="mb-2 flex items-center justify-between px-3">
                <p id="nav-admin" className="micro-label">
                  Administration
                </p>
                <span className="liquid-badge px-2 py-0.5 text-2xs font-bold uppercase text-brand-800">
                  Admin
                </span>
              </div>
            )}

            <ul
              aria-labelledby={isCollapsed ? undefined : "nav-admin"}
              className="space-y-0.5"
            >
              {adminMenuItems.map(renderMenuItem)}
            </ul>
          </div>
        )}

        {/* Preferences */}
        <div className="mt-6 border-t border-brand-800/8 pt-5">
          {renderSectionLabel("Preferences", "nav-preferences")}
          <ul
            aria-labelledby={isCollapsed ? undefined : "nav-preferences"}
            className="space-y-0.5"
          >
            {settingsMenuItems.map(renderMenuItem)}
          </ul>
        </div>
      </nav>

      {/* ==================================================
          FOOTER / USER
          Interaktif → diarahkan ke /dashboard/settings
          (logout tetap eksklusif di halaman settings)
      =================================================== */}
      <div className="shrink-0 border-t border-brand-800/8 p-2">
        <div className="group/user relative">
          <Link
            href="/dashboard/settings"
            title={undefined}
            className={`
              flex items-center rounded-xl outline-none transition-colors
              hover:bg-white/70 focus-visible:ring-2 focus-visible:ring-brand-600/40
              ${isCollapsed ? "justify-center px-0 py-2" : "gap-3 px-2 py-2"}
            `}
          >
            <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-800 text-2xs font-bold text-white">
              {userInitials}
              <span
                aria-hidden
                className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand-400"
              />
            </span>

            {!isCollapsed && (
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold text-brand-900">
                  {user?.username || "Pengguna"}
                </span>

                <span className="mt-0.5 flex items-center gap-1">
                  {user?.role === "admin" ? (
                    <>
                      <ShieldCheck
                        size={11}
                        strokeWidth={ICON_STROKE}
                        className="shrink-0 text-brand-700"
                      />
                      <span className="truncate text-2xs font-medium text-brand-800/60">
                        Administrator
                      </span>
                    </>
                  ) : (
                    <>
                      <Leaf
                        size={11}
                        strokeWidth={ICON_STROKE}
                        className="shrink-0 text-brand-500"
                      />
                      <span className="truncate text-2xs font-medium text-brand-800/60">
                        {tierLabel}
                      </span>
                    </>
                  )}
                </span>
              </span>
            )}
          </Link>

          {isCollapsed && (
            <span
              role="tooltip"
              className="
                pointer-events-none absolute bottom-1/2 left-[52px] z-50
                translate-x-[-4px] translate-y-1/2 whitespace-nowrap
                rounded-lg bg-brand-900 px-3 py-1.5 text-xs font-semibold text-white
                opacity-0 shadow-glass transition-all duration-150
                group-hover/user:translate-x-0 group-hover/user:opacity-100
              "
            >
              {user?.username || "Pengguna"} · {tierLabel}
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}
