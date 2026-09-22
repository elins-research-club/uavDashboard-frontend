"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
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
  ChevronRight,
} from "lucide-react";

/* ============================================================
   TYPES
============================================================ */

type MenuItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

/* ============================================================
   CONSTANTS
============================================================ */

const COLLAPSE_STORAGE_KEY = "sidebar:collapsed";

const ICON_STROKE = 1.75;

/* ============================================================
   TIER LABEL
============================================================ */

export const getTierLabel = (tier?: string) => {
  if (tier === "kecamatan") {
    return "Enterprise";
  }

  if (tier === "desa") {
    return "Koperasi Desa";
  }

  return "Kelompok Tani";
};

/* ============================================================
   TOOLTIP
============================================================ */

function SidebarTooltip({
  label,
  children,
  enabled = true,
}: {
  label: string;
  children: ReactNode;
  enabled?: boolean;
}) {
  const id = useId();

  const anchor = useRef<HTMLDivElement>(null);

  const [position, setPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);

  const show = () => {
    if (!enabled) {
      return;
    }

    const rect = anchor.current?.getBoundingClientRect();

    if (!rect) {
      return;
    }

    setPosition({
      left: rect.right + 10,
      top: rect.top + rect.height / 2,
    });
  };

  useEffect(() => {
    const hide = () => setPosition(null);

    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        hide();
      }
    };

    window.addEventListener("resize", hide);
    window.addEventListener("scroll", hide, true);
    window.addEventListener("keydown", escape);

    return () => {
      window.removeEventListener("resize", hide);
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("keydown", escape);
    };
  }, []);

  return (
    <div
      ref={anchor}
      onMouseEnter={show}
      onMouseLeave={() => {
        if (!anchor.current?.contains(document.activeElement)) {
          setPosition(null);
        }
      }}
      onFocus={show}
      onBlur={() => setPosition(null)}
      onClick={() => setPosition(null)}
    >
      {children}

      {enabled &&
        position &&
        createPortal(
          <span
            id={id}
            role="tooltip"
            className="pointer-events-none fixed z-[9999] whitespace-nowrap border border-[#2B2B2B] bg-[#171717] px-3 py-2 text-[11px] font-semibold text-white shadow-[0_10px_30px_rgba(0,0,0,0.15)]"
            style={{
              left: position.left,
              top: position.top,
              transform: "translateY(-50%)",
            }}
          >
            {label}
          </span>,
          document.body
        )}
    </div>
  );
}

/* ============================================================
   SIDEBAR
============================================================ */

export default function Sidebar({
  collapsible = true,
}: {
  collapsible?: boolean;
}) {
  const pathname = usePathname();

  const { user, hasPermission, isGod } = useUserRole();

  const [collapsed, setCollapsed] = useState(false);

  /* ==========================================================
     COLLAPSE STORAGE
  ========================================================== */

  useEffect(() => {
    if (!collapsible) {
      return;
    }

    const stored = localStorage.getItem(COLLAPSE_STORAGE_KEY);

    if (stored === "true") {
      setCollapsed(true);
    }
  }, [collapsible]);

  const toggleCollapsed = (next: boolean) => {
    setCollapsed(next);

    localStorage.setItem(COLLAPSE_STORAGE_KEY, String(next));

    window.dispatchEvent(
      new CustomEvent("sidebar:toggle", {
        detail: {
          collapsed: next,
        },
      })
    );
  };
  const isCollapsed = collapsible && collapsed;

  const isActive = (path: string) => pathname === path;

  /* ==========================================================
     PERMISSIONS
  ========================================================== */

  const canManageUsers = isGod || hasPermission("manage_users");

  const canManageRoles = isGod || hasPermission("manage_roles");

  const canManagePricing = isGod || hasPermission("manage_pricing");

  const canUploadMaps = isGod || hasPermission("upload_map");

  /* ==========================================================
     MAIN MENU
  ========================================================== */

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

  /* ==========================================================
     ADMIN MENU
  ========================================================== */

  const adminMenuItems: MenuItem[] = [
    canManageUsers
      ? {
          href: "/dashboard/users",
          label: "Manajemen User",
          icon: <Users size={18} strokeWidth={ICON_STROKE} />,
        }
      : null,

    canManageRoles || canManagePricing
      ? {
          href: "/dashboard/admin",
          label: "Admin Panel",
          icon: <ShieldCheck size={18} strokeWidth={ICON_STROKE} />,
        }
      : null,

    canUploadMaps
      ? {
          href: "/dashboard/upload",
          label: "Upload Peta",
          icon: <Upload size={18} strokeWidth={ICON_STROKE} />,
        }
      : null,
  ].filter(Boolean) as MenuItem[];

  const showAdministration = adminMenuItems.length > 0;

  /* ==========================================================
     SETTINGS
  ========================================================== */

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

  /* ==========================================================
     PROFILE
  ========================================================== */

  const tierLabel = getTierLabel(
    user?.subscription?.tier ?? user?.tier ?? undefined
  );

  const userName = user?.username || "Pengguna";

  const userInitials = userName.slice(0, 2).toUpperCase();

  const profileLabel = isGod
    ? `${userName} · God · Protected`
    : user?.role === "admin"
    ? `${userName} · Administrator`
    : `${userName} · ${tierLabel}`;

  /* ==========================================================
     MENU ITEM RENDERER
  ========================================================== */

  const renderMenuItem = (item: MenuItem) => {
    const active = isActive(item.href);

    const link = (
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        aria-label={isCollapsed ? item.label : undefined}
        className={[
          "group relative flex items-center transition-all duration-200",
          isCollapsed
            ? "mx-auto h-11 w-11 justify-center"
            : "w-full px-3 py-2.5",
          active
            ? "border border-[#DDE3D3] bg-white text-[#76B900] shadow-[0_5px_18px_rgba(0,0,0,0.035)]"
            : "border border-transparent text-[#6F716B] hover:border-[#E5E6E1] hover:bg-white hover:text-[#171717]",
        ].join(" ")}
      >
        {/* ACTIVE INDICATOR */}

        {active && !isCollapsed && (
          <span
            className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 bg-[#76B900]"
            aria-hidden="true"
          />
        )}

        {/* ICON */}

        <span
          className={[
            "flex shrink-0 items-center justify-center transition-colors duration-200",
            active
              ? "text-[#76B900]"
              : "text-[#7E8179] group-hover:text-[#4F514B]",
          ].join(" ")}
        >
          {item.icon}
        </span>

        {/* LABEL */}

        {!isCollapsed && (
          <>
            <span
              className={[
                "ml-3 flex-1 truncate text-[12px] font-semibold transition-colors",
                active
                  ? "text-[#171717]"
                  : "text-[#666860] group-hover:text-[#171717]",
              ].join(" ")}
            >
              {item.label}
            </span>

            <ChevronRight
              size={14}
              strokeWidth={1.7}
              className={[
                "shrink-0 transition-all duration-200",
                active
                  ? "translate-x-0 text-[#76B900]"
                  : "text-[#B8BAB4] opacity-0 group-hover:translate-x-0.5 group-hover:opacity-100",
              ].join(" ")}
            />
          </>
        )}
      </Link>
    );

    return (
      <li key={item.href}>
        {isCollapsed ? (
          <SidebarTooltip label={item.label}>{link}</SidebarTooltip>
        ) : (
          link
        )}
      </li>
    );
  };

  /* ==========================================================
     SECTION LABEL
  ========================================================== */

  const renderSectionLabel = (label: string, id: string) =>
    isCollapsed ? (
      <div aria-hidden="true" className="mx-2 my-3 h-px bg-[#E0E1DD]" />
    ) : (
      <div
        id={id}
        className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.17em] text-[#999B94]"
      >
        {label}
      </div>
    );

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <aside
      className={[
        "sticky top-3 z-40 flex h-[calc(100vh-1.5rem)] shrink-0 flex-col overflow-hidden",
        "border border-[#DCDDD8] bg-[#F8F9F6]",
        "shadow-[0_8px_30px_rgba(0,0,0,0.04)]",
        "transition-[width,margin] duration-300",
        isCollapsed ? "ml-3 w-[76px]" : "ml-3 w-[258px]",
      ].join(" ")}
    >
      {/* ==================================================
          HEADER
      =================================================== */}

      <div
        className={[
          "flex h-[76px] shrink-0 items-center border-b border-[#E5E6E1]",
          isCollapsed ? "justify-center px-3" : "justify-between px-4",
        ].join(" ")}
      >
        {isCollapsed ? (
          <SidebarTooltip label="Buka sidebar">
            <button
              type="button"
              onClick={() => toggleCollapsed(false)}
              aria-label="Buka sidebar"
              aria-expanded={false}
              className="group flex h-10 w-10 items-center justify-center border border-[#DCDDD8] bg-white text-[#171717] shadow-[0_4px_14px_rgba(0,0,0,0.03)] transition-all duration-200 hover:border-[#C9CCC3] hover:bg-[#F7F8F5]"
            >
              {/* LOGO NORMAL */}

              <Drone
                size={19}
                strokeWidth={ICON_STROKE}
                className="transition-all duration-200 group-hover:hidden"
              />

              {/* OPEN ICON ON HOVER */}

              <PanelLeftOpen
                size={18}
                strokeWidth={ICON_STROKE}
                className="hidden transition-all duration-200 group-hover:block group-hover:text-[#76B900]"
              />
            </button>
          </SidebarTooltip>
        ) : (
          <>
            <Link
              href="/dashboard"
              className="group flex min-w-0 items-center gap-3 px-2 py-1.5"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#171717] text-white shadow-[0_6px_18px_rgba(0,0,0,0.08)] transition-transform duration-200 group-hover:-translate-y-0.5">
                <Drone size={19} strokeWidth={ICON_STROKE} />
              </span>

              <span className="min-w-0">
                <span className="block text-[13px] font-bold tracking-[-0.02em] text-[#171717]">
                  UAV
                </span>

                <span className="mt-0.5 block text-[8px] font-bold uppercase tracking-[0.16em] text-[#999B94]">
                  DAAS Platform
                </span>
              </span>
            </Link>

            {collapsible && (
              <button
                type="button"
                onClick={() => toggleCollapsed(true)}
                aria-label="Tutup sidebar"
                aria-expanded={true}
                className="flex h-9 w-9 shrink-0 items-center justify-center border border-transparent text-[#8A8C85] transition-all hover:border-[#DCDDD8] hover:bg-white hover:text-[#171717]"
              >
                <PanelLeftClose size={17} strokeWidth={ICON_STROKE} />
              </button>
            )}
          </>
        )}
      </div>

      {/* ==================================================
          NAVIGATION
      =================================================== */}

      <nav
        aria-label="Navigasi utama"
        className="flex-1 overflow-y-auto px-3 py-6"
      >
        {/* WORKSPACE */}

        {renderSectionLabel("Workspace", "nav-workspace")}

        <ul
          aria-labelledby={isCollapsed ? undefined : "nav-workspace"}
          className="space-y-1"
        >
          {mainMenuItems.map(renderMenuItem)}
        </ul>

        {/* ADMINISTRATION */}

        {showAdministration && (
          <div className="mt-7">
            {isCollapsed ? (
              <div aria-hidden="true" className="mx-2 my-3 h-px bg-[#E0E1DD]" />
            ) : (
              <div className="mb-2 flex items-center justify-between px-3">
                <p
                  id="nav-admin"
                  className="text-[9px] font-bold uppercase tracking-[0.17em] text-[#999B94]"
                >
                  Administration
                </p>

                <span className="border border-[#DCDDD8] bg-white px-1.5 py-1 text-[8px] font-bold uppercase tracking-[0.08em] text-[#858780]">
                  {isGod ? "God" : "Admin"}
                </span>
              </div>
            )}

            <ul
              aria-labelledby={isCollapsed ? undefined : "nav-admin"}
              className="space-y-1"
            >
              {adminMenuItems.map(renderMenuItem)}
            </ul>
          </div>
        )}

        {/* PREFERENCES */}

        <div className="mt-7">
          {renderSectionLabel("Preferences", "nav-preferences")}

          <ul
            aria-labelledby={isCollapsed ? undefined : "nav-preferences"}
            className="space-y-1"
          >
            {settingsMenuItems.map(renderMenuItem)}
          </ul>
        </div>
      </nav>

      {/* ==================================================
          FOOTER / USER
      =================================================== */}

      <div className="shrink-0 p-3">
        <SidebarTooltip enabled={isCollapsed} label={profileLabel}>
          <Link
            href="/dashboard/settings"
            aria-label={isCollapsed ? profileLabel : undefined}
            className={[
              "group flex items-center border border-[#DCDDD8] bg-white transition-all duration-200",
              "hover:border-[#C9CCC3] hover:shadow-[0_6px_20px_rgba(0,0,0,0.04)]",
              isCollapsed ? "mx-auto h-11 w-11 justify-center" : "px-3 py-2.5",
            ].join(" ")}
          >
            {/* AVATAR */}

            <span
              className={[
                "flex shrink-0 items-center justify-center border border-[#DCE4D4] bg-[#F3F7EF] font-bold text-[#5F8F13]",
                isCollapsed ? "h-9 w-9 text-[11px]" : "h-9 w-9 text-[10px]",
              ].join(" ")}
            >
              {userInitials}
            </span>

            {!isCollapsed && (
              <>
                <span className="ml-3 min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold text-[#171717]">
                    {userName}
                  </span>

                  <span className="mt-1 flex min-w-0 items-center gap-1.5">
                    {isGod ? (
                      <>
                        <ShieldCheck
                          size={11}
                          strokeWidth={ICON_STROKE}
                          className="shrink-0 text-[#76B900]"
                        />

                        <span className="truncate text-[9px] font-bold text-[#5F910D]">
                          God · Protected
                        </span>
                      </>
                    ) : user?.role === "admin" ? (
                      <>
                        <ShieldCheck
                          size={11}
                          strokeWidth={ICON_STROKE}
                          className="shrink-0 text-[#6E7169]"
                        />

                        <span className="truncate text-[9px] font-semibold text-[#777972]">
                          Administrator
                        </span>
                      </>
                    ) : (
                      <>
                        <Leaf
                          size={11}
                          strokeWidth={ICON_STROKE}
                          className="shrink-0 text-[#76B900]"
                        />

                        <span className="truncate text-[9px] font-semibold text-[#777972]">
                          {tierLabel}
                        </span>
                      </>
                    )}
                  </span>
                </span>

                <ChevronRight
                  size={14}
                  strokeWidth={1.7}
                  className="shrink-0 text-[#B4B6AF] transition-transform group-hover:translate-x-0.5 group-hover:text-[#76B900]"
                />
              </>
            )}
          </Link>
        </SidebarTooltip>
      </div>
    </aside>
  );
}
