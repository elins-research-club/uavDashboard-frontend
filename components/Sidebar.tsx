"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import styles from "./Sidebar.module.css";
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

    if (rect) {
      setPosition({
        left: rect.right + 12,
        top: rect.top + rect.height / 2,
      });
    }
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
            className={styles.tooltip}
            style={position}
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
  };

  const isCollapsed = collapsible && collapsed;

  const isActive = (path: string) => pathname === path;

  /* ==========================================================
     PERMISSIONS
  ========================================================== */

  const canManageUsers = hasPermission("manage_users");

  const canManageRoles = hasPermission("manage_roles");

  const canManagePricing = hasPermission("manage_pricing");

  const canUploadMaps = hasPermission("upload_map");

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

  const userInitials = (user?.username || "Pengguna").slice(0, 2).toUpperCase();

  const profileLabel = isGod
    ? `${user?.username || "God"} · God · Protected`
    : user?.role === "admin"
    ? `${user?.username || "Administrator"} · Administrator`
    : `${user?.username || "Pengguna"} · ${tierLabel}`;

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
        className={`${styles.item} ${active ? styles.active : ""}`}
      >
        {item.icon}

        {!isCollapsed && <span className={styles.label}>{item.label}</span>}
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
      <div aria-hidden className={styles.divider} />
    ) : (
      <p id={id} className={styles.sectionLabel}>
        {label}
      </p>
    );

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <aside
      className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ""}`}
    >
      {/* ==================================================
          HEADER
      =================================================== */}

      <div className={styles.header}>
        {isCollapsed ? (
          <SidebarTooltip label="Buka sidebar">
            <button
              type="button"
              onClick={() => toggleCollapsed(false)}
              aria-label="Buka sidebar"
              aria-expanded={false}
              className={`${styles.toggle} ${styles.expand}`}
            >
              <PanelLeftOpen size={18} strokeWidth={ICON_STROKE} />
            </button>
          </SidebarTooltip>
        ) : (
          <>
            <Link href="/dashboard" className={styles.brand}>
              <span className={styles.logo}>
                <Drone size={20} strokeWidth={ICON_STROKE} />
              </span>

              <span className={styles.brandCopy}>
                <strong>UAV</strong>

                <small>DAAS PLATFORM</small>
              </span>
            </Link>

            {collapsible && (
              <button
                type="button"
                onClick={() => toggleCollapsed(true)}
                aria-label="Tutup sidebar"
                aria-expanded={true}
                className={styles.toggle}
              >
                <PanelLeftClose size={18} strokeWidth={ICON_STROKE} />
              </button>
            )}
          </>
        )}
      </div>

      {/* ==================================================
          NAVIGATION
      =================================================== */}

      <nav aria-label="Navigasi utama" className={styles.nav}>
        {/* Workspace */}
        {renderSectionLabel("Workspace", "nav-workspace")}

        <ul
          aria-labelledby={isCollapsed ? undefined : "nav-workspace"}
          className={styles.list}
        >
          {mainMenuItems.map(renderMenuItem)}
        </ul>

        {/* Administration */}
        {showAdministration && (
          <div
            className={styles.section}
            style={{
              marginTop: 26,
            }}
          >
            {isCollapsed ? (
              <div aria-hidden className={styles.divider} />
            ) : (
              <div className={styles.sectionLabel}>
                <p id="nav-admin">Administration</p>

                <span className={styles.sectionBadge}>
                  {isGod ? "God" : "Admin"}
                </span>
              </div>
            )}

            <ul
              aria-labelledby={isCollapsed ? undefined : "nav-admin"}
              className={styles.list}
            >
              {adminMenuItems.map(renderMenuItem)}
            </ul>
          </div>
        )}

        {/* Preferences */}
        <div
          className={styles.section}
          style={{
            marginTop: 26,
          }}
        >
          {renderSectionLabel("Preferences", "nav-preferences")}

          <ul
            aria-labelledby={isCollapsed ? undefined : "nav-preferences"}
            className={styles.list}
          >
            {settingsMenuItems.map(renderMenuItem)}
          </ul>
        </div>
      </nav>

      {/* ==================================================
          FOOTER / USER
      =================================================== */}

      <div className={styles.footer}>
        <SidebarTooltip enabled={isCollapsed} label={profileLabel}>
          <Link
            href="/dashboard/settings"
            title={undefined}
            aria-label={isCollapsed ? profileLabel : undefined}
            className={styles.profile}
          >
            <span className={styles.avatar}>{userInitials}</span>

            {!isCollapsed && (
              <span className={styles.profileCopy}>
                <span className="block truncate text-xs font-semibold text-brand-900">
                  {user?.username || "Pengguna"}
                </span>

                <span className="mt-0.5 flex items-center gap-1">
                  {isGod ? (
                    <>
                      <ShieldCheck
                        size={11}
                        strokeWidth={ICON_STROKE}
                        className="shrink-0 text-violet-600"
                      />

                      <span className="truncate text-2xs font-bold text-violet-700">
                        God · Protected
                      </span>
                    </>
                  ) : user?.role === "admin" ? (
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
        </SidebarTooltip>
      </div>
    </aside>
  );
}
