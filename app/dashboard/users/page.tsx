"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Search,
  ShieldCheck,
  Timer,
  UserX,
  Users,
} from "lucide-react";

import api from "@/lib/api";
import { useUserRole, type AuthUser } from "@/context/UserRoleContext";

/* ============================================================
   TYPES & CONSTANTS
============================================================ */

type Subscription = {
  tier: string;
  status: string;
  end_date?: string | null;
};

type UserRecord = AuthUser & {
  id: string;
  username: string;
  email: string;
  role: "god" | "admin" | "member" | string;
  is_protected?: boolean;
  permissions?: string[];
  created_at: string;
  subscription?: Subscription | null;
};

type SortKey =
  | "username"
  | "email"
  | "created_at"
  | "role"
  | "tier"
  | "status"
  | "remaining";

type SortDirection = "asc" | "desc";

type SubscriptionState = "active" | "expiring" | "free" | "expired";

const ICON_STROKE = 1.75;

const EASE = [0.22, 1, 0.36, 1] as const;

const PAGE_SIZE = 10;

const TIER_LABELS: Record<string, string> = {
  free: "Free",
  desa: "Desa",
  kecamatan: "Kecamatan",
};

const STATUS_LABELS: Record<SubscriptionState, string> = {
  active: "Aktif",
  expiring: "Hampir habis",
  free: "Free",
  expired: "Berakhir",
};

const STATUS_TEXT: Record<SubscriptionState, string> = {
  active: "text-[#55731E]",
  expiring: "text-[#8A6818]",
  free: "text-[#666861]",
  expired: "text-[#994A40]",
};

const STATUS_DOTS: Record<SubscriptionState, string> = {
  active: "bg-[#76B900]",
  expiring: "bg-[#C49A35]",
  free: "bg-[#A0A29B]",
  expired: "bg-[#C65D50]",
};

const COLUMNS: {
  key: SortKey;
  label: string;
}[] = [
  {
    key: "username",
    label: "User",
  },
  {
    key: "email",
    label: "Email",
  },
  {
    key: "created_at",
    label: "Terdaftar",
  },
  {
    key: "role",
    label: "Role",
  },
  {
    key: "tier",
    label: "Tier",
  },
  {
    key: "status",
    label: "Status",
  },
  {
    key: "remaining",
    label: "Sisa Langganan",
  },
];

/* ============================================================
   SMALL COMPONENTS
============================================================ */

function Avatar({ name }: { name: string }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#D9DED2] bg-[#F5F8F1] text-[10px] font-bold text-[#62763D]">
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}

function StateBadge({ state }: { state: SubscriptionState }) {
  return (
    <span
      className={`inline-flex items-center gap-2 border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.08em] ${
        STATUS_TEXT[state]
      } ${
        state === "active"
          ? "border-[#DCE7CC] bg-[#F5F8F1]"
          : state === "expiring"
          ? "border-[#E9DFC2] bg-[#FCFAF3]"
          : state === "expired"
          ? "border-[#EBD4D0] bg-[#FDF7F6]"
          : "border-[#E1E2DE] bg-[#F7F8F5]"
      }`}
    >
      <span className={`h-1.5 w-1.5 ${STATUS_DOTS[state]}`} />
      {STATUS_LABELS[state]}
    </span>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const isDesa = tier === "desa";
  const isKecamatan = tier === "kecamatan";

  return (
    <span
      className={`inline-flex items-center border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.08em] ${
        isKecamatan
          ? "border-[#E4D7B8] bg-[#FCF9F1] text-[#876A21]"
          : isDesa
          ? "border-[#DDE5D3] bg-[#F6F8F2] text-[#617A39]"
          : "border-[#E1E2DE] bg-[#F7F8F5] text-[#666861]"
      }`}
    >
      {TIER_LABELS[tier] || TIER_LABELS.free}
    </span>
  );
}

function RoleBadge({
  role,
  isProtected,
}: {
  role: string;
  isProtected: boolean;
}) {
  if (isProtected || role === "god") {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 border border-[#DCDDD8] bg-[#F4F5F2] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-[#33332F]">
          <ShieldCheck
            className="h-3 w-3 text-[#76B900]"
            strokeWidth={ICON_STROKE}
          />
          God
        </span>

        <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#A1A39C]">
          Protected
        </span>
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.08em] ${
        role === "admin"
          ? "border-[#DCE4D6] bg-[#F5F8F2] text-[#5F7444]"
          : "border-[#E1E2DE] bg-[#F7F8F5] text-[#666861]"
      }`}
    >
      {role === "admin" ? "Admin" : "Member"}
    </span>
  );
}

/* ============================================================
   SWEEP BUTTON
   ------------------------------------------------------------
   Hover: warna menyapu dari kiri ke kanan (transform-only,
   jadi tetap 60fps). Saat hover dilepas, warna keluar ke
   kanan, bukan mundur ke kiri, supaya terasa mengalir.
   Sama dengan yang dipakai di halaman Subscription.
============================================================ */

function SweepButton({
  children,
  onClick,
  disabled = false,
  ariaExpanded,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  ariaExpanded?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-expanded={ariaExpanded}
      className={`group/sweep relative inline-flex items-center justify-center overflow-hidden border border-[#D8DAD4] bg-white text-[#555750] outline-none transition-[border-color,transform] duration-300 focus-visible:ring-2 focus-visible:ring-[#76B900] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 ${
        disabled ? "" : "hover:border-[#171717] active:scale-[0.985]"
      } ${className}`}
    >
      {!disabled && (
        <span
          aria-hidden="true"
          className="absolute inset-0 origin-right scale-x-0 transform-gpu bg-[#171717] transition-transform duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform group-hover/sweep:origin-left group-hover/sweep:scale-x-100 motion-reduce:transition-none"
        />
      )}

      <span
        className={`relative z-10 inline-flex items-center justify-center gap-2 transition-colors duration-500 ease-out ${
          disabled ? "" : "group-hover/sweep:text-white"
        }`}
      >
        {children}
      </span>
    </button>
  );
}

/* ============================================================
   STAT CARD
   ------------------------------------------------------------
   Aksen kiri 3px tumbuh dari atas ke bawah saat hover / aktif,
   sama dengan strip overview di halaman Subscription.
============================================================ */

function StatCard({
  label,
  value,
  icon: Icon,
  iconClass,
  accent,
  active,
  onClick,
  delay,
}: {
  label: string;
  value: number;
  icon: typeof Users;
  iconClass: string;
  accent: string;
  active: boolean;
  onClick: () => void;
  delay: number;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      initial={{
        opacity: 0,
        y: 10,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.45,
        delay,
        ease: EASE,
      }}
      className={`group/stat relative min-h-[96px] overflow-hidden p-5 pl-6 text-left outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#767C6D]/40 ${
        active ? "bg-[#F7F8F5]" : "bg-white hover:bg-[#FAFBF9]"
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 w-[3px] origin-top transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${accent} ${
          active ? "scale-y-100" : "scale-y-0 group-hover/stat:scale-y-100"
        }`}
      />

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#969890]">
            {label}
          </p>

          <strong
            className={`mt-3 block text-[27px] font-bold tabular-nums tracking-[-0.045em] ${iconClass}`}
          >
            {value}
          </strong>
        </div>

        <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#E0E1DC] bg-[#F7F8F5]">
          <Icon className={`h-4 w-4 ${iconClass}`} strokeWidth={ICON_STROKE} />
        </span>
      </div>
    </motion.button>
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function UsersPage() {
  const router = useRouter();

  const { user, isLoading: authLoading, hasPermission } = useUserRole();

  const canManageUsers = hasPermission("manage_users");

  const [users, setUsers] = useState<UserRecord[]>([]);

  const [loading, setLoading] = useState(true);

  const [updatingId, setUpdatingId] = useState("");

  const [message, setMessage] = useState("");

  const [msgType, setMsgType] = useState<"success" | "error">("error");

  const [search, setSearch] = useState("");

  const [stateFilter, setStateFilter] = useState<SubscriptionState | null>(
    null
  );

  const [page, setPage] = useState(1);

  const [sortKey, setSortKey] = useState<SortKey>("created_at");

  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const [exportOpen, setExportOpen] = useState(false);

  /* ==========================================================
     DATA & GUARD
  ========================================================== */

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!canManageUsers) {
      router.replace("/dashboard");
      return;
    }

    let cancelled = false;

    setLoading(true);

    api
      .get<UserRecord[]>("/admin/users")
      .then(({ data }) => {
        if (cancelled) {
          return;
        }

        setUsers(data);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        setMessage(error.response?.data?.detail || "Gagal memuat daftar user.");
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [router, user, authLoading, canManageUsers]);

  /* ==========================================================
     HELPERS
  ========================================================== */

  const getState = (item: UserRecord): SubscriptionState => {
    const subscription = item.subscription;

    if (!subscription || subscription.tier === "free") {
      return "free";
    }

    const endDate = subscription.end_date
      ? new Date(subscription.end_date)
      : null;

    if (
      subscription.status === "expired" ||
      (endDate && endDate <= new Date())
    ) {
      return "expired";
    }

    if (endDate && endDate.getTime() - Date.now() <= 30 * 24 * 60 * 60 * 1000) {
      return "expiring";
    }

    return "active";
  };

  const remaining = (item: UserRecord) => {
    const subscription = item.subscription;

    if (!subscription || subscription.tier === "free") {
      return "Selamanya";
    }

    if (!subscription.end_date) {
      return "Tidak terbatas";
    }

    const days = Math.ceil(
      (new Date(subscription.end_date).getTime() - Date.now()) / 86400000
    );

    return days <= 0 ? "Berakhir" : `${days} hari`;
  };

  const showMessage = (text: string, type: "success" | "error") => {
    setMsgType(type);
    setMessage(text);

    window.setTimeout(() => {
      setMessage("");
    }, 3000);
  };

  /* ==========================================================
     DERIVED USERS
  ========================================================== */

  const sortedUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users
      .filter((item) =>
        `${item.username} ${item.email} ${item.role} ${
          item.subscription?.tier || "free"
        }`
          .toLowerCase()
          .includes(query)
      )
      .filter((item) => !stateFilter || getState(item) === stateFilter)
      .sort((first, second) => {
        const value = (item: UserRecord) => {
          if (sortKey === "status") {
            return getState(item);
          }

          if (sortKey === "remaining") {
            return remaining(item);
          }

          if (sortKey === "tier") {
            return item.subscription?.tier || "free";
          }

          return item[sortKey];
        };

        const result = String(value(first)).localeCompare(
          String(value(second)),
          "id",
          {
            numeric: true,
          }
        );

        return sortDirection === "asc" ? result : -result;
      });
  }, [users, search, stateFilter, sortKey, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / PAGE_SIZE));

  const visibleUsers = sortedUsers.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const stats = {
    active: users.filter((item) => getState(item) === "active").length,

    expiring: users.filter((item) => getState(item) === "expiring").length,

    free: users.filter((item) => getState(item) === "free").length,

    expired: users.filter((item) => getState(item) === "expired").length,
  };

  /* ==========================================================
     ACTIONS
  ========================================================== */

  const sortBy = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }

    setPage(1);
  };

  const toggleStateFilter = (state: SubscriptionState) => {
    setStateFilter((current) => (current === state ? null : state));

    setPage(1);
  };

  const updateRole = async (id: string, role: "admin" | "member") => {
    if (!canManageUsers) {
      showMessage(
        "Anda tidak memiliki permission untuk mengelola user.",
        "error"
      );
      return;
    }

    const target = users.find((item) => item.id === id);

    if (!target) {
      return;
    }

    if (target.is_protected || target.role === "god") {
      showMessage(
        "Akun God adalah protected account dan tidak dapat diubah.",
        "error"
      );
      return;
    }

    if (target.id === user?.id) {
      showMessage(
        "Role akun yang sedang digunakan tidak dapat diubah.",
        "error"
      );
      return;
    }

    setUpdatingId(id);

    try {
      const { data } = await api.patch<UserRecord>(`/admin/users/${id}/role`, {
        role,
      });

      setUsers((current) =>
        current.map((item) => (item.id === id ? data : item))
      );

      showMessage(`Role user berhasil diubah ke "${role}".`, "success");
    } catch (error: any) {
      showMessage(
        error.response?.data?.detail || "Role user gagal diubah.",
        "error"
      );
    } finally {
      setUpdatingId("");
    }
  };

  const exportExcel = () => {
    const rows = sortedUsers.map((item) => [
      item.username,
      item.email,
      item.role,
      item.subscription?.tier || "free",
      getState(item),
      remaining(item),
      new Date(item.created_at).toLocaleDateString("id-ID"),
    ]);

    const csv = [
      "Nama,Email,Role,Tier,Status,Sisa Langganan,Tanggal Daftar",
      ...rows.map((row) =>
        row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")
      ),
    ].join("\n");

    const link = document.createElement("a");

    const url = URL.createObjectURL(
      new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8",
      })
    );

    link.href = url;
    link.download = "daftar-user.csv";
    link.click();

    URL.revokeObjectURL(url);

    setExportOpen(false);
  };

  const exportPdf = () => {
    const rows = sortedUsers
      .map(
        (item) =>
          `<tr>
            <td>${item.username}</td>
            <td>${item.email}</td>
            <td>${item.role}</td>
            <td>${item.subscription?.tier || "free"}</td>
            <td>${getState(item)}</td>
            <td>${remaining(item)}</td>
          </tr>`
      )
      .join("");

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      return;
    }

    printWindow.document.write(
      `<html>
        <head>
          <title>Daftar User</title>

          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 24px;
              color: #171717;
            }

            h1 {
              font-size: 22px;
              margin-bottom: 20px;
            }

            table {
              border-collapse: collapse;
              width: 100%;
            }

            th,
            td {
              border: 1px solid #dcdcd8;
              padding: 8px;
              text-align: left;
              font-size: 12px;
            }

            th {
              background: #f1f3ee;
            }
          </style>
        </head>

        <body>
          <h1>Daftar User AMX UAV DaaS</h1>

          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Email</th>
                <th>Role</th>
                <th>Tier</th>
                <th>Status</th>
                <th>Sisa</th>
              </tr>
            </thead>

            <tbody>
              ${rows}
            </tbody>
          </table>
        </body>
      </html>`
    );

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();

    setExportOpen(false);
  };

  /* ==========================================================
     RENDER GUARDS
  ========================================================== */

  if (authLoading || !user || !canManageUsers) {
    return null;
  }

  /* ==========================================================
     STAT CARDS
  ========================================================== */

  const statCards = [
    {
      state: "active" as SubscriptionState,
      label: "Active Users",
      value: stats.active,
      icon: CircleCheck,
      iconClass: "text-[#5F7D29]",
      accent: "bg-[#76B900]",
    },

    {
      state: "expiring" as SubscriptionState,
      label: "Hampir Berakhir",
      value: stats.expiring,
      icon: Timer,
      iconClass: "text-[#8A6818]",
      accent: "bg-[#C49A35]",
    },

    {
      state: "free" as SubscriptionState,
      label: "User Free",
      value: stats.free,
      icon: Users,
      iconClass: "text-[#666861]",
      accent: "bg-[#A0A29B]",
    },

    {
      state: "expired" as SubscriptionState,
      label: "Langganan Berakhir",
      value: stats.expired,
      icon: UserX,
      iconClass: "text-[#994A40]",
      accent: "bg-[#C65D50]",
    },
  ];

  /* ==========================================================
     PAGE
  ========================================================== */

  return (
    <main className="min-h-screen bg-[#F4F5F2] text-[#151515]">
      <div className="mx-auto max-w-[1440px] px-5 py-7 sm:px-7 lg:px-10 lg:py-10">
        {/* ==================================================
            HEADER
        ================================================== */}

        <motion.header
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.5,
            ease: EASE,
          }}
          className="mb-8"
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-[34px] font-bold leading-[1.05] tracking-[-0.045em] text-[#111111] sm:text-[42px]">
                Manajemen <span className="text-[#171717]">User</span>
              </h1>

              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-[#767871]">
                Kelola akun, role, dan status subscription pengguna dari satu
                workspace.
              </p>
            </div>

            <div className="relative">
              <SweepButton
                onClick={() => setExportOpen(!exportOpen)}
                ariaExpanded={exportOpen}
                className="px-4 py-2.5 text-xs font-bold"
              >
                <Download className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                Export
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-300 ${
                    exportOpen ? "rotate-180" : ""
                  }`}
                  strokeWidth={ICON_STROKE}
                />
              </SweepButton>

              {exportOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Tutup menu export"
                    tabIndex={-1}
                    className="fixed inset-0 z-10 cursor-default"
                    onClick={() => setExportOpen(false)}
                  />

                  <motion.div
                    initial={{
                      opacity: 0,
                      y: -6,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      duration: 0.2,
                      ease: EASE,
                    }}
                    className="absolute right-0 z-20 mt-2 w-52 border border-[#DCDDD8] bg-white p-1 shadow-[0_18px_45px_rgba(0,0,0,0.08)]"
                  >
                    <button
                      type="button"
                      onClick={exportPdf}
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs font-semibold text-[#555750] transition-colors hover:bg-[#F7F8F5] hover:text-[#171717]"
                    >
                      <span className="flex h-7 w-7 items-center justify-center border border-[#E0E1DC] bg-[#F7F8F5]">
                        <FileText
                          className="h-3.5 w-3.5"
                          strokeWidth={ICON_STROKE}
                        />
                      </span>
                      PDF (Print)
                    </button>

                    <button
                      type="button"
                      onClick={exportExcel}
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs font-semibold text-[#555750] transition-colors hover:bg-[#F7F8F5] hover:text-[#171717]"
                    >
                      <span className="flex h-7 w-7 items-center justify-center border border-[#E0E1DC] bg-[#F7F8F5]">
                        <FileSpreadsheet
                          className="h-3.5 w-3.5"
                          strokeWidth={ICON_STROKE}
                        />
                      </span>
                      Excel (CSV)
                    </button>
                  </motion.div>
                </>
              )}
            </div>
          </div>
        </motion.header>

        {/* ==================================================
            STAT CARDS
        ================================================== */}

        <div className="mb-5 grid gap-px overflow-hidden border border-[#DCDDD8] bg-[#DCDDD8] sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card, index) => (
            <StatCard
              key={card.state}
              label={card.label}
              value={card.value}
              icon={card.icon}
              iconClass={card.iconClass}
              accent={card.accent}
              active={stateFilter === card.state}
              onClick={() => toggleStateFilter(card.state)}
              delay={index * 0.06}
            />
          ))}
        </div>

        {/* ==================================================
            TOAST
        ================================================== */}

        {message && (
          <motion.div
            initial={{
              opacity: 0,
              y: 8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className={`mb-5 flex items-center gap-3 border px-4 py-3 text-sm font-semibold ${
              msgType === "success"
                ? "border-[#D8DED0] bg-[#F6F8F2] text-[#5D7042]"
                : "border-[#E7D0CC] bg-[#FFF7F5] text-[#9B3E32]"
            }`}
          >
            {msgType === "success" ? (
              <CircleCheck
                className="h-4 w-4 shrink-0"
                strokeWidth={ICON_STROKE}
              />
            ) : (
              <CircleAlert
                className="h-4 w-4 shrink-0"
                strokeWidth={ICON_STROKE}
              />
            )}

            {message}
          </motion.div>
        )}

        {/* ==================================================
            TABLE
        ================================================== */}

        <motion.section
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.5,
            delay: 0.24,
            ease: EASE,
          }}
          className="overflow-hidden border border-[#DCDDD8] bg-white"
        >
          {/* TOOLBAR */}

          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E6E1] p-5">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#999B94]">
                  Directory
                </p>

                <h2 className="mt-1 text-base font-bold text-[#171717]">
                  Semua Pengguna
                </h2>
              </div>

              <span className="border border-[#E0E1DC] bg-[#F7F8F5] px-2.5 py-1 text-[9px] font-bold tabular-nums uppercase tracking-[0.08em] text-[#666861]">
                {sortedUsers.length}
              </span>

              {stateFilter && (
                <button
                  type="button"
                  onClick={() => toggleStateFilter(stateFilter)}
                  className="border border-[#DCDDD8] bg-white px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-[#666861] transition-colors duration-300 hover:border-[#171717] hover:bg-[#171717] hover:text-white"
                >
                  Filter: {STATUS_LABELS[stateFilter]} ×
                </button>
              )}
            </div>

            <div className="relative w-full sm:w-72">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#92948D]"
                strokeWidth={ICON_STROKE}
              />

              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Cari nama atau email..."
                className="h-10 w-full border border-[#DCDDD8] bg-[#FAFAF8] pl-10 pr-4 text-xs font-medium text-[#171717] outline-none transition-all placeholder:text-[#A0A29B] focus:border-[#BFC4B8] focus:bg-white focus:ring-4 focus:ring-black/[0.025]"
              />
            </div>
          </div>

          {/* BODY */}

          {loading ? (
            <div className="flex items-center justify-center gap-3 p-14 text-[#555750]">
              <Loader2 className="h-5 w-5 animate-spin" />

              <span className="text-sm font-medium">Memuat daftar user...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left">
                <thead className="border-b border-[#E5E6E1] bg-[#F8F9F6]">
                  <tr>
                    {COLUMNS.map(({ key, label }) => (
                      <th
                        key={key}
                        scope="col"
                        aria-sort={
                          sortKey === key
                            ? sortDirection === "asc"
                              ? "ascending"
                              : "descending"
                            : "none"
                        }
                        className="px-4 py-3"
                      >
                        <button
                          type="button"
                          onClick={() => sortBy(key)}
                          aria-label={`Urutkan berdasarkan ${label}`}
                          className="inline-flex items-center gap-1.5 px-1 py-0.5 outline-none focus-visible:ring-2 focus-visible:ring-[#767C6D]/30"
                        >
                          <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#8F918A]">
                            {label}
                          </span>

                          {sortKey === key ? (
                            sortDirection === "asc" ? (
                              <ArrowUpAZ
                                className="h-3.5 w-3.5 text-[#666861]"
                                strokeWidth={ICON_STROKE}
                              />
                            ) : (
                              <ArrowDownAZ
                                className="h-3.5 w-3.5 text-[#666861]"
                                strokeWidth={ICON_STROKE}
                              />
                            )
                          ) : (
                            <ArrowDownAZ
                              className="h-3.5 w-3.5 text-[#C0C2BC]"
                              strokeWidth={ICON_STROKE}
                            />
                          )}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#ECEDE9]">
                  {visibleUsers.map((item, index) => {
                    const state = getState(item);

                    const tier = item.subscription?.tier || "free";

                    const isSelf = item.id === user?.id;

                    const isProtected =
                      Boolean(item.is_protected) || item.role === "god";

                    const canEditRole =
                      canManageUsers && !isSelf && !isProtected;

                    return (
                      <motion.tr
                        key={item.id}
                        initial={{
                          opacity: 0,
                          y: 6,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        transition={{
                          duration: 0.35,
                          delay: Math.min(index, 10) * 0.03,
                          ease: EASE,
                        }}
                        className="group/row transition-colors duration-300 hover:bg-[#FAFBF9]"
                      >
                        {/* USER */}

                        <td className="relative px-4 py-4 before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:origin-top before:scale-y-0 before:bg-[#76B900] before:transition-transform before:duration-500 before:ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/row:before:scale-y-100">
                          <div className="flex items-center gap-3">
                            <Avatar name={item.username} />

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-[#171717]">
                                  {item.username}
                                </p>

                                {isProtected && (
                                  <ShieldCheck
                                    className="h-3.5 w-3.5 text-[#715F92]"
                                    strokeWidth={ICON_STROKE}
                                    aria-label="Protected account"
                                  />
                                )}
                              </div>

                              {isSelf && (
                                <span className="mt-1 inline-flex border border-[#DCE5D2] bg-[#F5F8F1] px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.08em] text-[#607A3B]">
                                  Anda
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* EMAIL */}

                        <td className="px-4 py-4 text-sm font-medium text-[#6F716B]">
                          {item.email}
                        </td>

                        {/* CREATED */}

                        <td className="px-4 py-4 text-sm font-medium tabular-nums text-[#6F716B]">
                          {new Date(item.created_at).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </td>

                        {/* ROLE */}

                        <td className="px-4 py-4">
                          {isProtected ? (
                            <RoleBadge role={item.role} isProtected={true} />
                          ) : (
                            <div className="flex items-center gap-2">
                              <select
                                value={item.role}
                                disabled={
                                  !canEditRole || updatingId === item.id
                                }
                                onChange={(event) =>
                                  updateRole(
                                    item.id,
                                    event.target.value as "admin" | "member"
                                  )
                                }
                                className="h-9 border border-[#DCDDD8] bg-white px-3 text-xs font-semibold text-[#555750] outline-none transition focus:border-[#BFC4B8] focus:ring-4 focus:ring-black/[0.025] disabled:cursor-not-allowed disabled:bg-[#F5F6F3] disabled:opacity-50"
                              >
                                <option value="member">Member</option>

                                <option value="admin">Admin</option>
                              </select>

                              {isSelf && (
                                <span className="text-[9px] font-medium text-[#A0A29B]">
                                  Akun aktif
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* TIER */}

                        <td className="px-4 py-4">
                          <TierBadge tier={tier} />
                        </td>

                        {/* STATUS */}

                        <td className="px-4 py-4">
                          <StateBadge state={state} />
                        </td>

                        {/* REMAINING */}

                        <td className="px-4 py-4">
                          <p className="text-sm font-semibold tabular-nums text-[#171717]">
                            {remaining(item)}
                          </p>

                          {item.subscription?.end_date && (
                            <p className="mt-0.5 text-xs font-medium tabular-nums text-[#92948D]">
                              s/d{" "}
                              {new Date(
                                item.subscription.end_date
                              ).toLocaleDateString("id-ID")}
                            </p>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}

                  {visibleUsers.length === 0 && (
                    <tr>
                      <td colSpan={COLUMNS.length} className="px-4 py-14">
                        <div className="mx-auto max-w-sm text-center">
                          <span className="mx-auto flex h-12 w-12 items-center justify-center border border-[#E0E1DC] bg-[#F7F8F5]">
                            <Search
                              className="h-5 w-5 text-[#777972]"
                              strokeWidth={ICON_STROKE}
                            />
                          </span>

                          <p className="mt-4 text-sm font-bold text-[#171717]">
                            User tidak ditemukan
                          </p>

                          <p className="mt-1 text-xs font-medium text-[#858780]">
                            Coba kata kunci lain atau hapus filter status.
                          </p>

                          {(search || stateFilter) && (
                            <SweepButton
                              onClick={() => {
                                setSearch("");

                                setStateFilter(null);

                                setPage(1);
                              }}
                              className="mt-4 px-4 py-2.5 text-xs font-bold"
                            >
                              Reset pencarian
                            </SweepButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ==================================================
              PAGINATION
          ================================================== */}

          {!loading && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E6E1] px-4 py-3.5">
              <span className="text-xs font-medium tabular-nums text-[#858780]">
                Menampilkan{" "}
                <strong className="text-[#171717]">
                  {sortedUsers.length ? (page - 1) * PAGE_SIZE + 1 : 0}–
                  {Math.min(page * PAGE_SIZE, sortedUsers.length)}
                </strong>{" "}
                dari{" "}
                <strong className="text-[#171717]">{sortedUsers.length}</strong>{" "}
                user
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  aria-label="Halaman sebelumnya"
                  className="flex h-9 w-9 items-center justify-center border border-[#DCDDD8] bg-white text-[#666861] outline-none transition-colors duration-300 hover:border-[#171717] hover:bg-[#171717] hover:text-white focus-visible:ring-2 focus-visible:ring-[#76B900] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#DCDDD8] disabled:hover:bg-white disabled:hover:text-[#666861]"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={ICON_STROKE} />
                </button>

                <span className="inline-flex h-9 items-center border border-[#DCDDD8] bg-[#F7F8F5] px-3 text-xs font-bold tabular-nums text-[#555750]">
                  {page} / {totalPages}
                </span>

                <button
                  type="button"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  aria-label="Halaman berikutnya"
                  className="flex h-9 w-9 items-center justify-center border border-[#DCDDD8] bg-white text-[#666861] outline-none transition-colors duration-300 hover:border-[#171717] hover:bg-[#171717] hover:text-white focus-visible:ring-2 focus-visible:ring-[#76B900] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#DCDDD8] disabled:hover:bg-white disabled:hover:text-[#666861]"
                >
                  <ChevronRight className="h-4 w-4" strokeWidth={ICON_STROKE} />
                </button>
              </div>
            </div>
          )}
        </motion.section>
      </div>
    </main>
  );
}
