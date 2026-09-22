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
  MoreHorizontal,
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
============================================================ */

export default function MobileBottomNav() {
  const pathname = usePathname();

  const { hasPermission, isGod } = useUserRole();

  const [isMoreOpen, setIsMoreOpen] = useState(false);

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

  /* ==========================================================
     CLOSE MORE ON ROUTE CHANGE
  ========================================================== */

  useEffect(() => {
    setIsMoreOpen(false);
  }, [pathname]);

  /* ==========================================================
     ESCAPE
  ========================================================== */

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMoreOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  /* ==========================================================
     PRIMARY ITEM
  ========================================================== */

  const renderPrimaryItem = (item: MenuItem) => {
    const active = isActive(item.href);

    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className="group flex min-w-0 flex-1 flex-col items-center justify-center"
      >
        <span className="relative flex h-9 w-12 items-center justify-center">
          {/* TOP ACTIVE LINE */}
          <span
            className={[
              "absolute top-0 h-0.5 transition-all duration-200",
              active ? "w-7 bg-[#76B900]" : "w-0 bg-transparent",
            ].join(" ")}
          />

          {/* ICON BOX */}
          <span
            className={[
              "flex h-8 w-8 items-center justify-center transition-all duration-200",
              active
                ? "bg-[#F1F6EB] text-[#76B900]"
                : "text-[#7E8179] group-hover:bg-white group-hover:text-[#4F514B]",
            ].join(" ")}
          >
            {item.icon}
          </span>
        </span>

        {/* LABEL */}
        <span
          className={[
            "mt-1 max-w-[72px] truncate text-[9px] font-semibold",
            active ? "text-[#171717]" : "text-[#858880]",
          ].join(" ")}
        >
          {item.label}
        </span>
      </Link>
    );
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <>
      {/* ======================================================
          MORE BACKDROP
      ====================================================== */}

      {isMoreOpen && (
        <button
          type="button"
          aria-label="Tutup menu"
          onClick={() => setIsMoreOpen(false)}
          className="fixed inset-0 z-[90] bg-black/10 lg:hidden"
        />
      )}

      {/* ======================================================
          MORE POPUP
      ====================================================== */}

      {isMoreOpen && (
        <div
          className="
            fixed
            bottom-[78px]
            right-3
            z-[100]
            w-[250px]
            border
            border-[#DCDDD8]
            bg-[#F8F9F6]
            p-2
            shadow-[0_12px_30px_rgba(0,0,0,0.08)]
            lg:hidden
          "
        >
          {/* HEADER */}
          <div className="mb-1 flex items-center justify-between px-2 py-2">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#999B94]">
                Menu
              </p>

              <p className="mt-0.5 text-[12px] font-bold text-[#171717]">
                Navigasi lainnya
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsMoreOpen(false)}
              aria-label="Tutup"
              className="
                flex
                h-8
                w-8
                items-center
                justify-center
                border
                border-transparent
                text-[#858880]
                transition-all
                hover:border-[#DCDDD8]
                hover:bg-white
                hover:text-[#171717]
              "
            >
              <X size={16} strokeWidth={1.8} />
            </button>
          </div>

          {/* MENU */}
          <div className="space-y-1">
            {moreItems.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMoreOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "group flex items-center gap-3 px-3 py-3",
                    "border transition-all duration-200",
                    active
                      ? "border-[#DDE3D3] bg-white"
                      : "border-transparent hover:border-[#E5E6E1] hover:bg-white",
                  ].join(" ")}
                >
                  {/* ICON */}
                  <span
                    className={[
                      "flex h-8 w-8 shrink-0 items-center justify-center",
                      active
                        ? "bg-[#F1F6EB] text-[#76B900]"
                        : "bg-[#F0F1EE] text-[#777A73]",
                    ].join(" ")}
                  >
                    {item.icon}
                  </span>

                  {/* LABEL */}
                  <span
                    className={[
                      "min-w-0 flex-1 truncate text-[11px] font-semibold",
                      active ? "text-[#171717]" : "text-[#656861]",
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
                        ? "text-[#76B900]"
                        : "text-[#B8BAB4] group-hover:translate-x-0.5 group-hover:text-[#76B900]",
                    ].join(" ")}
                  />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================
          BOTTOM NAV
      ====================================================== */}

      <nav
        aria-label="Navigasi mobile"
        className="
          fixed
          inset-x-0
          bottom-0
          z-[80]
          border-t
          border-[#DCDDD8]
          bg-[#F8F9F6]
          shadow-[0_-6px_20px_rgba(0,0,0,0.035)]
          lg:hidden
        "
        style={{
          paddingBottom: "max(0.45rem, env(safe-area-inset-bottom))",
        }}
      >
        <div className="mx-auto flex h-[68px] max-w-md items-stretch px-2">
          {primaryItems.map(renderPrimaryItem)}

          {/* ==================================================
              MORE
          ================================================== */}

          <button
            type="button"
            onClick={() => setIsMoreOpen((prev) => !prev)}
            aria-expanded={isMoreOpen}
            aria-label={isMoreOpen ? "Tutup menu lainnya" : "Buka menu lainnya"}
            className="group flex min-w-0 flex-1 flex-col items-center justify-center"
          >
            <span className="relative flex h-9 w-12 items-center justify-center">
              <span
                className={[
                  "absolute top-0 h-0.5 transition-all duration-200",
                  isMoreOpen ? "w-7 bg-[#76B900]" : "w-0",
                ].join(" ")}
              />

              <span
                className={[
                  "flex h-8 w-8 items-center justify-center transition-all duration-200",
                  isMoreOpen
                    ? "bg-[#F1F6EB] text-[#76B900]"
                    : "text-[#7E8179] group-hover:bg-white group-hover:text-[#4F514B]",
                ].join(" ")}
              >
                {isMoreOpen ? (
                  <X size={19} strokeWidth={ICON_STROKE} />
                ) : (
                  <MoreHorizontal size={19} strokeWidth={ICON_STROKE} />
                )}
              </span>
            </span>

            <span
              className={[
                "mt-1 text-[9px] font-semibold",
                isMoreOpen ? "text-[#171717]" : "text-[#858880]",
              ].join(" ")}
            >
              Lainnya
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
