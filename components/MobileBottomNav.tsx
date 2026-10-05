"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Map,
  CreditCard,
  Upload,
  Settings,
  HelpCircle,
  Users,
  ShieldCheck,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";

import { useUserRole } from "@/context/UserRoleContext";

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

const ICON_STROKE = 1.8;

/* ============================================================
   COMPONENT

   Mobile-only navigation.

   Desktop (lg and above) is untouched because this component
   is completely hidden with lg:hidden.

   Mobile / tablet:
   - compact hamburger button at top-left
   - drawer slides from the left
   - backdrop closes drawer
   - Escape closes drawer
   - active route is highlighted
============================================================ */

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { hasPermission, isGod } = useUserRole();

  const [isOpen, setIsOpen] = useState(false);

  /* ==========================================================
     PERMISSIONS
  ========================================================== */

  const canManageUsers = isGod || hasPermission("manage_users");
  const canManageRoles = isGod || hasPermission("manage_roles");
  const canManagePricing = isGod || hasPermission("manage_pricing");
  const canUploadMaps = isGod || hasPermission("upload_map");

  /* ==========================================================
     ACTIVE
  ========================================================== */

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  /* ==========================================================
     PRIMARY MENU
  ========================================================== */

  const primaryItems: MenuItem[] = useMemo(() => {
    const items: MenuItem[] = [
      {
        href: "/dashboard",
        label: "Ringkasan",
        icon: <LayoutDashboard size={19} strokeWidth={ICON_STROKE} />,
      },
      {
        href: "/dashboard/maps",
        label: "Peta",
        icon: <Map size={19} strokeWidth={ICON_STROKE} />,
      },
      {
        href: "/dashboard/subscription",
        label: "Langganan",
        icon: <CreditCard size={19} strokeWidth={ICON_STROKE} />,
      },
    ];

    if (canUploadMaps) {
      items.push({
        href: "/dashboard/upload",
        label: "Upload",
        icon: <Upload size={19} strokeWidth={ICON_STROKE} />,
      });
    } else {
      items.push({
        href: "/dashboard/settings",
        label: "Pengaturan",
        icon: <Settings size={19} strokeWidth={ICON_STROKE} />,
      });
    }

    return items;
  }, [canUploadMaps]);

  /* ==========================================================
     MORE MENU
  ========================================================== */

  const moreItems: MenuItem[] = useMemo(() => {
    const items: MenuItem[] = [];

    if (canManageUsers) {
      items.push({
        href: "/dashboard/users",
        label: "Manajemen User",
        icon: <Users size={18} strokeWidth={ICON_STROKE} />,
      });
    }

    if (canManageRoles || canManagePricing) {
      items.push({
        href: "/dashboard/admin",
        label: "Admin Panel",
        icon: <ShieldCheck size={18} strokeWidth={ICON_STROKE} />,
      });
    }

    items.push({
      href: "/dashboard/settings",
      label: "Pengaturan",
      icon: <Settings size={18} strokeWidth={ICON_STROKE} />,
    });

    items.push({
      href: "/dashboard/help",
      label: "Bantuan",
      icon: <HelpCircle size={18} strokeWidth={ICON_STROKE} />,
    });

    return items;
  }, [canManageUsers, canManageRoles, canManagePricing]);

  const allItems = useMemo(
    () => [...primaryItems, ...moreItems],
    [primaryItems, moreItems]
  );

  /* ==========================================================
     CLOSE ON ROUTE CHANGE
  ========================================================== */

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  /* ==========================================================
     ESCAPE + BODY LOCK
  ========================================================== */

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      {/* ======================================================
          MOBILE HAMBURGER BUTTON
          Visible only below lg.
      ======================================================= */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Buka menu navigasi"
        aria-expanded={isOpen}
        className={[
          "fixed left-3 top-3 z-[120] lg:hidden",
          "flex h-11 w-11 items-center justify-center",
          "border border-[#DCDDD8] bg-white/95 text-[#171717]",
          "shadow-[0_10px_26px_rgba(0,0,0,0.10)] backdrop-blur-md",
          "outline-none transition-all duration-200",
          "hover:border-[#171717] hover:bg-[#171717] hover:text-white",
          "active:scale-95",
          isOpen ? "pointer-events-none opacity-0" : "opacity-100",
        ].join(" ")}
      >
        <Menu size={19} strokeWidth={ICON_STROKE} />
      </button>

      {/* ======================================================
          BACKDROP
      ======================================================= */}
      <div
        aria-hidden={!isOpen}
        onClick={() => setIsOpen(false)}
        className={[
          "fixed inset-0 z-[125] bg-black/20 backdrop-blur-[2px] lg:hidden",
          "transition-opacity duration-250",
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        ].join(" ")}
      />

      {/* ======================================================
          DRAWER
      ======================================================= */}
      <aside
        aria-label="Navigasi mobile"
        aria-hidden={!isOpen}
        className={[
          "fixed inset-y-0 left-0 z-[130] flex w-[min(86vw,320px)] flex-col",
          "border-r border-[#DCDDD8] bg-[#F8F9F6] shadow-[12px_0_36px_rgba(0,0,0,0.10)]",
          "lg:hidden",
          "transform transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          isOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {/* ====================================================
            HEADER
        ===================================================== */}
        <div
          className="flex shrink-0 items-center justify-between border-b border-[#E5E6E1] px-4 py-4"
          style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
        >
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#999B94]">
              UAV DaaS
            </p>
            <p className="mt-0.5 text-[14px] font-bold tracking-[-0.03em] text-[#171717]">
              Navigasi
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Tutup menu navigasi"
            className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#DCDDD8] bg-white text-[#777972] outline-none transition-colors hover:border-[#171717] hover:bg-[#171717] hover:text-white"
          >
            <X size={17} strokeWidth={ICON_STROKE} />
          </button>
        </div>

        {/* ====================================================
            QUICK NAV
        ===================================================== */}
        <div className="shrink-0 border-b border-[#E7E8E3] px-3 py-3">
          <p className="mb-2 px-2 text-[8px] font-bold uppercase tracking-[0.16em] text-[#999B94]">
            Utama
          </p>

          <div className="space-y-1">
            {primaryItems.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "group flex items-center gap-3 border px-3 py-3 transition-all duration-200",
                    active
                      ? "border-[#DDE3D3] bg-white shadow-[0_4px_14px_rgba(0,0,0,0.035)]"
                      : "border-transparent text-[#656861] hover:border-[#E5E6E1] hover:bg-white",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "flex h-9 w-9 shrink-0 items-center justify-center",
                      active
                        ? "bg-[#F1F6EB] text-[#76B900]"
                        : "bg-[#F0F1EE] text-[#777A73]",
                    ].join(" ")}
                  >
                    {item.icon}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span
                      className={[
                        "block truncate text-[11px] font-bold",
                        active ? "text-[#171717]" : "text-[#656861]",
                      ].join(" ")}
                    >
                      {item.label}
                    </span>

                    {active && (
                      <span className="mt-0.5 block text-[8px] font-medium uppercase tracking-[0.08em] text-[#76B900]">
                        Aktif
                      </span>
                    )}
                  </span>

                  <ChevronRight
                    size={15}
                    strokeWidth={1.7}
                    className={[
                      "shrink-0 transition-transform duration-200",
                      active
                        ? "text-[#76B900]"
                        : "text-[#B8BAB4] group-hover:translate-x-0.5 group-hover:text-[#76B900]",
                    ].join(" ")}
                  />
                </Link>
              );
            })}
          </div>
        </div>

        {/* ====================================================
            OTHER NAVIGATION
        ===================================================== */}
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 overscroll-contain">
          <p className="mb-2 px-2 text-[8px] font-bold uppercase tracking-[0.16em] text-[#999B94]">
            Lainnya
          </p>

          <div className="space-y-1">
            {moreItems.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "group flex items-center gap-3 border px-3 py-3 transition-all duration-200",
                    active
                      ? "border-[#DDE3D3] bg-white"
                      : "border-transparent hover:border-[#E5E6E1] hover:bg-white",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "flex h-9 w-9 shrink-0 items-center justify-center",
                      active
                        ? "bg-[#F1F6EB] text-[#76B900]"
                        : "bg-[#F0F1EE] text-[#777A73]",
                    ].join(" ")}
                  >
                    {item.icon}
                  </span>

                  <span
                    className={[
                      "min-w-0 flex-1 truncate text-[11px] font-semibold",
                      active ? "text-[#171717]" : "text-[#656861]",
                    ].join(" ")}
                  >
                    {item.label}
                  </span>

                  <ChevronRight
                    size={15}
                    strokeWidth={1.7}
                    className="shrink-0 text-[#B8BAB4] transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-[#76B900]"
                  />
                </Link>
              );
            })}
          </div>

          {/* Small route hint */}
          <div className="mt-5 border-t border-[#E7E8E3] px-2 pt-4">
            <p className="text-[9px] font-medium leading-4 text-[#A0A19B]">
              Pilih menu untuk berpindah halaman. Drawer otomatis menutup
              setelah navigasi.
            </p>
          </div>
        </div>

        {/* ====================================================
            ACTIVE ROUTE FOOTER
        ===================================================== */}
        <div
          className="shrink-0 border-t border-[#E5E6E1] p-3"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <div className="flex items-center gap-2 border border-[#DCDDD8] bg-white px-3 py-2.5">
            <span className="h-2 w-2 shrink-0 bg-[#76B900]" />
            <span className="min-w-0 flex-1 truncate text-[9px] font-bold uppercase tracking-[0.10em] text-[#555750]">
              {allItems.find((item) => isActive(item.href))?.label ||
                "Dashboard"}
            </span>
            <span className="text-[8px] font-semibold text-[#A0A19B]">
              AKTIF
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
