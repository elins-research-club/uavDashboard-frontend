"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
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
  Search,
  Timer,
  UserX,
  Users,
} from "lucide-react";
import api from "@/lib/api";
import { useUserRole } from "@/context/UserRoleContext";

/* ============================================================
   TYPES & CONSTANTS
============================================================ */

type Subscription = {
  tier: string;
  status: string;
  end_date?: string | null;
};

type UserRecord = {
  id: string;
  username: string;
  email: string;
  role: "admin" | "member";
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

const TIER_OPTIONS = ["free", "desa", "kecamatan"] as const;
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

/* Warna aksen badge — glass-nya dari .liquid-badge,
   di sini hanya menentukan warna teks + dot indikator. */
const STATUS_ACCENTS: Record<SubscriptionState, string> = {
  active: "text-emerald-700",
  expiring: "text-amber-700",
  free: "text-slate-600",
  expired: "text-red-700",
};
const STATUS_DOTS: Record<SubscriptionState, string> = {
  active: "bg-emerald-500",
  expiring: "bg-amber-500",
  free: "bg-slate-400",
  expired: "bg-red-500",
};
const TIER_ACCENTS: Record<string, string> = {
  free: "text-brand-800/70",
  desa: "text-emerald-800",
  kecamatan: "text-amber-700",
};

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "username", label: "User" },
  { key: "email", label: "Email" },
  { key: "created_at", label: "Terdaftar" },
  { key: "role", label: "Role" },
  { key: "tier", label: "Tier" },
  { key: "status", label: "Status" },
  { key: "remaining", label: "Sisa Langganan" },
];

/* ============================================================
   KOMPONEN KECIL — avatar, badge, stat card
============================================================ */

function Avatar({ name }: { name: string }) {
  return (
    <span className="icon-ring h-9 w-9 flex-shrink-0 rounded-full text-xs font-bold text-brand-800">
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}

function StateBadge({ state }: { state: SubscriptionState }) {
  return (
    <span
      className={`liquid-badge px-2.5 py-1 text-2xs font-bold uppercase tracking-wide ${STATUS_ACCENTS[state]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOTS[state]}`} />
      {STATUS_LABELS[state]}
    </span>
  );
}

function TierBadge({ tier }: { tier: string }) {
  return (
    <span
      className={`liquid-badge px-2.5 py-1 text-2xs font-bold uppercase tracking-wide ${TIER_ACCENTS[tier] || TIER_ACCENTS.free
        }`}
    >
      {TIER_LABELS[tier] || TIER_LABELS.free}
    </span>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  iconClass,
  orbTint,
  active,
  onClick,
  delay,
}: {
  label: string;
  value: number;
  icon: typeof Users;
  iconClass: string;
  orbTint: string;
  active: boolean;
  onClick: () => void;
  delay: number;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: EASE }}
      className={`group relative min-h-[112px] overflow-hidden rounded-3xl border p-4 text-left shadow-card transition-all duration-300 outline-none hover:-translate-y-0.5 hover:shadow-card-hover focus-visible:ring-2 focus-visible:ring-brand-600/40 ${active
          ? "border-brand-600/40 bg-white"
          : "border-brand-800/15 bg-white/80 backdrop-blur-xl hover:border-brand-800/25"
        }`}
    >
      {/* Orb dekoratif — 3 layer, pola sama dengan StatCard dashboard */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-6 -right-6 h-20 w-20 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-[1.35]"
      >
        <div
          className="absolute -inset-3 rounded-full opacity-60 blur-lg"
          style={{ background: `${orbTint}26` }}
        />
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle at 32% 28%, #ffffffcc 0%, ${orbTint}40 42%, ${orbTint}5c 72%, ${orbTint}73 100%)`,
            boxShadow: `inset -4px -6px 10px ${orbTint}33, inset 3px 4px 8px rgba(255,255,255,0.75), 0 6px 14px ${orbTint}2e`,
          }}
        />
        <div className="absolute left-[18%] top-[14%] h-3.5 w-3.5 rounded-full bg-white/90 blur-[3px]" />
      </div>

      <div className="relative flex h-full flex-col justify-between gap-3">
        <div className="flex items-center justify-between gap-2">
          <span className="micro-label">{label}</span>
          <span className="icon-ring h-8 w-8 flex-shrink-0 rounded-full">
            <Icon
              className={`h-4 w-4 ${iconClass}`}
              strokeWidth={ICON_STROKE}
            />
          </span>
        </div>
        <strong
          className={`text-2xl font-bold tracking-tight ${iconClass}`}
        >
          {value}
        </strong>
      </div>
    </motion.button>
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function UsersPage() {
  const router = useRouter();
  const { user } = useUserRole();

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

  /* ---------- data & guard ---------- */

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.replace("/dashboard");
      return;
    }
    if (!user) return;

    api
      .get("/admin/users")
      .then(({ data }) => setUsers(data))
      .catch((error) =>
        setMessage(
          error.response?.data?.detail || "Gagal memuat daftar user."
        )
      )
      .finally(() => setLoading(false));
  }, [router, user]);

  /* ---------- helpers ---------- */

  const getState = (item: UserRecord): SubscriptionState => {
    const subscription = item.subscription;
    if (!subscription || subscription.tier === "free") return "free";
    const endDate = subscription.end_date
      ? new Date(subscription.end_date)
      : null;
    if (
      subscription.status === "expired" ||
      (endDate && endDate <= new Date())
    ) {
      return "expired";
    }
    if (
      endDate &&
      endDate.getTime() - Date.now() <= 30 * 24 * 60 * 60 * 1000
    ) {
      return "expiring";
    }
    return "active";
  };

  const remaining = (item: UserRecord) => {
    const subscription = item.subscription;
    if (!subscription || subscription.tier === "free") return "Selamanya";
    if (!subscription.end_date) return "Tidak terbatas";
    const days = Math.ceil(
      (new Date(subscription.end_date).getTime() - Date.now()) / 86400000
    );
    return days <= 0 ? "Berakhir" : `${days} hari`;
  };

  const showMessage = (text: string, type: "success" | "error") => {
    setMsgType(type);
    setMessage(text);
    window.setTimeout(() => setMessage(""), 3000);
  };

  /* ---------- derived ---------- */

  const sortedUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users
      .filter((item) =>
        `${item.username} ${item.email} ${item.role} ${item.subscription?.tier || "free"
          }`
          .toLowerCase()
          .includes(query)
      )
      .filter((item) => !stateFilter || getState(item) === stateFilter)
      .sort((first, second) => {
        const value = (item: UserRecord) => {
          if (sortKey === "status") return getState(item);
          if (sortKey === "remaining") return remaining(item);
          if (sortKey === "tier") return item.subscription?.tier || "free";
          return item[sortKey];
        };
        const result = String(value(first)).localeCompare(
          String(value(second)),
          "id",
          { numeric: true }
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

  /* ---------- actions ---------- */

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

  const updateRole = async (id: string, role: UserRecord["role"]) => {
    setUpdatingId(id);
    try {
      const { data } = await api.patch(`/admin/users/${id}/role`, { role });
      setUsers((current) =>
        current.map((item) => (item.id === id ? data : item))
      );
      showMessage(`Role user berhasil diubah ke "${role}"`, "success");
    } catch (error: any) {
      showMessage(
        error.response?.data?.detail || "Role user gagal diubah.",
        "error"
      );
    } finally {
      setUpdatingId("");
    }
  };

  const updateTier = async (id: string, tier: string) => {
    setUpdatingId(`${id}-tier`);
    try {
      await api.patch(`/admin/users/${id}/tier`, { tier });
      setUsers((current) =>
        current.map((item) =>
          item.id === id
            ? {
              ...item,
              subscription: {
                ...(item.subscription || {}),
                tier,
                status: "active",
              },
            }
            : item
        )
      );
      showMessage(
        `Tier subscription berhasil diubah ke "${TIER_LABELS[tier] || tier}"`,
        "success"
      );
    } catch (error: any) {
      showMessage(
        error.response?.data?.detail || "Gagal mengubah tier.",
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
    link.href = URL.createObjectURL(
      new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })
    );
    link.download = "daftar-user.csv";
    link.click();
    URL.revokeObjectURL(link.href);
    setExportOpen(false);
  };

  const exportPdf = () => {
    const rows = sortedUsers
      .map(
        (item) =>
          `<tr><td>${item.username}</td><td>${item.email}</td><td>${item.role}</td><td>${item.subscription?.tier || "free"
          }</td><td>${getState(item)}</td><td>${remaining(item)}</td></tr>`
      )
      .join("");

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(
      `<html><head><title>Daftar User</title><style>body{font-family:Arial;padding:24px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#eef3e8}</style></head><body><h1>Daftar User AMX UAV DaaS</h1><table><thead><tr><th>Nama</th><th>Email</th><th>Role</th><th>Tier</th><th>Status</th><th>Sisa</th></tr></thead><tbody>${rows}</tbody></table></body></html>`
    );
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
    setExportOpen(false);
  };

  /* ---------- guard render ---------- */

  if (user?.role !== "admin") return null;

  const statCards = [
    {
      state: "active" as SubscriptionState,
      label: "Active Users",
      value: stats.active,
      icon: CircleCheck,
      iconClass: "text-emerald-700",
      orbTint: "#2e7d54",
    },
    {
      state: "expiring" as SubscriptionState,
      label: "Hampir Berakhir",
      value: stats.expiring,
      icon: Timer,
      iconClass: "text-amber-700",
      orbTint: "#d99a2b",
    },
    {
      state: "free" as SubscriptionState,
      label: "User Free",
      value: stats.free,
      icon: Users,
      iconClass: "text-slate-600",
      orbTint: "#94a3b8",
    },
    {
      state: "expired" as SubscriptionState,
      label: "Langganan Berakhir",
      value: stats.expired,
      icon: UserX,
      iconClass: "text-red-700",
      orbTint: "#dc4c4c",
    },
  ];

  return (
    <main className="bg-page min-h-screen text-brand-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ================= HEADER ================= */}
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="micro-label">Admin & Kontrol Akses</p>
            <h1 className="mt-3 text-3xl font-bold tracking-[-0.035em] text-brand-900 sm:text-4xl">
              Manajemen <span className="text-brand-600">User</span>
            </h1>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setExportOpen(!exportOpen)}
              aria-expanded={exportOpen}
              className="btn-ghost"
            >
              <Download className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
              Export
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-300 ${exportOpen ? "rotate-180" : ""
                  }`}
                strokeWidth={ICON_STROKE}
              />
            </button>

            {exportOpen && (
              <>
                <button
                  type="button"
                  aria-label="Tutup menu export"
                  tabIndex={-1}
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setExportOpen(false)}
                />
                <div className="absolute right-0 z-20 mt-2 w-52 rounded-2xl border border-white/60 bg-white/90 p-1.5 shadow-glass-lg backdrop-blur-xl">
                  <button
                    type="button"
                    onClick={exportPdf}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-brand-800 transition hover:bg-brand-50"
                  >
                    <span className="icon-ring h-7 w-7 rounded-full">
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
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-brand-800 transition hover:bg-brand-50"
                  >
                    <span className="icon-ring h-7 w-7 rounded-full">
                      <FileSpreadsheet
                        className="h-3.5 w-3.5"
                        strokeWidth={ICON_STROKE}
                      />
                    </span>
                    Excel (CSV)
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* ================= STAT CARDS ================= */}
        <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card, index) => (
            <StatCard
              key={card.state}
              {...card}
              active={stateFilter === card.state}
              onClick={() => toggleStateFilter(card.state)}
              delay={index * 0.06}
            />
          ))}
        </div>

        {/* ================= TOAST ================= */}
        {message && (
          <div
            role="status"
            className={`mb-5 flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-card backdrop-blur-xl ${msgType === "success"
                ? "border-emerald-200/70 bg-emerald-50/80 text-emerald-800"
                : "border-red-200/70 bg-red-50/80 text-red-700"
              }`}
          >
            {msgType === "success" ? (
              <CircleCheck
                className="h-4 w-4 flex-shrink-0"
                strokeWidth={ICON_STROKE}
              />
            ) : (
              <CircleAlert
                className="h-4 w-4 flex-shrink-0"
                strokeWidth={ICON_STROKE}
              />
            )}
            {message}
          </div>
        )}

        {/* ================= TABLE ================= */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.24, ease: EASE }}
          className="glass overflow-hidden"
        >
          {/* toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-800/8 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-base font-bold">Semua Pengguna</h2>
              <span className="liquid-badge px-2.5 py-1 text-2xs font-bold text-brand-800">
                {sortedUsers.length}
              </span>
              {stateFilter && (
                <button
                  type="button"
                  onClick={() => toggleStateFilter(stateFilter)}
                  className="liquid-badge px-2.5 py-1 text-2xs font-bold uppercase text-emerald-800 transition hover:bg-white/60"
                >
                  Filter: {STATUS_LABELS[stateFilter]} ✕
                </button>
              )}
            </div>

            <div className="relative w-full sm:w-72">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-800/35"
                strokeWidth={ICON_STROKE}
              />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Cari nama atau email..."
                className="glass-input !rounded-xl"
              />
            </div>
          </div>

          {/* body */}
          {loading ? (
            <div className="flex flex-col items-center gap-3 p-12 text-brand-800/60">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand-800/15 border-t-brand-700" />
              <p className="text-sm font-semibold">Memuat daftar user...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left">
                <thead className="border-b border-brand-800/10 bg-white/60">
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
                          className="inline-flex items-center gap-1.5 rounded-lg px-1 py-0.5 outline-none transition focus-visible:ring-2 focus-visible:ring-brand-600/40"
                        >
                          <span className="micro-label">{label}</span>
                          {sortKey === key ? (
                            sortDirection === "asc" ? (
                              <ArrowUpAZ
                                className="h-3.5 w-3.5 text-brand-600"
                                strokeWidth={ICON_STROKE}
                              />
                            ) : (
                              <ArrowDownAZ
                                className="h-3.5 w-3.5 text-brand-600"
                                strokeWidth={ICON_STROKE}
                              />
                            )
                          ) : (
                            <ArrowDownAZ
                              className="h-3.5 w-3.5 text-brand-800/25"
                              strokeWidth={ICON_STROKE}
                            />
                          )}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-brand-800/8">
                  {visibleUsers.map((item) => {
                    const state = getState(item);
                    const tier = item.subscription?.tier || "free";
                    const isSelf = item.id === user?.id;

                    return (
                      <tr
                        key={item.id}
                        className="transition-colors hover:bg-white/70"
                      >
                        {/* user */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={item.username} />
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-brand-900">
                                {item.username}
                              </p>
                              {isSelf && (
                                <span className="liquid-badge mt-1 px-2 py-0.5 text-2xs font-bold uppercase text-emerald-800">
                                  Anda
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* email */}
                        <td className="px-4 py-4 text-sm font-medium text-brand-800/80">
                          {item.email}
                        </td>

                        {/* terdaftar */}
                        <td className="px-4 py-4 text-sm font-medium text-brand-800/80">
                          {new Date(item.created_at).toLocaleDateString(
                            "id-ID",
                            { day: "numeric", month: "short", year: "numeric" }
                          )}
                        </td>

                        {/* role */}
                        <td className="px-4 py-4">
                          <select
                            value={item.role}
                            disabled={updatingId === item.id || isSelf}
                            onChange={(event) =>
                              updateRole(
                                item.id,
                                event.target.value as UserRecord["role"]
                              )
                            }
                            className="rounded-full border border-brand-800/15 bg-white/80 px-3 py-2 text-xs font-semibold text-brand-800 outline-none backdrop-blur-sm transition focus:border-brand-700/40 focus:ring-4 focus:ring-brand-700/10 disabled:opacity-50"
                          >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>

                        {/* tier */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <TierBadge tier={tier} />
                            <select
                              value={tier}
                              disabled={updatingId === `${item.id}-tier`}
                              onChange={(event) =>
                                updateTier(item.id, event.target.value)
                              }
                              className="rounded-full border border-brand-800/15 bg-white/80 px-3 py-2 text-xs font-semibold text-brand-800 outline-none backdrop-blur-sm transition focus:border-brand-700/40 focus:ring-4 focus:ring-brand-700/10 disabled:opacity-50"
                            >
                              {TIER_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                  {TIER_LABELS[option]}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>

                        {/* status */}
                        <td className="px-4 py-4">
                          <StateBadge state={state} />
                        </td>

                        {/* sisa langganan */}
                        <td className="px-4 py-4">
                          <p className="text-sm font-semibold text-brand-900">
                            {remaining(item)}
                          </p>
                          {item.subscription?.end_date && (
                            <p className="mt-0.5 text-xs font-medium text-brand-800/55">
                              s/d{" "}
                              {new Date(
                                item.subscription.end_date
                              ).toLocaleDateString("id-ID")}
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {visibleUsers.length === 0 && (
                    <tr>
                      <td colSpan={COLUMNS.length} className="px-4 py-12">
                        <div className="mx-auto max-w-sm text-center">
                          <span className="icon-ring mx-auto h-12 w-12 rounded-full">
                            <Search
                              className="h-5 w-5"
                              strokeWidth={ICON_STROKE}
                            />
                          </span>
                          <p className="mt-3 text-sm font-bold text-brand-900">
                            User tidak ditemukan
                          </p>
                          <p className="mt-1 text-xs font-medium text-brand-800/60">
                            Coba kata kunci lain atau hapus filter status.
                          </p>
                          {(search || stateFilter) && (
                            <button
                              type="button"
                              onClick={() => {
                                setSearch("");
                                setStateFilter(null);
                                setPage(1);
                              }}
                              className="btn-ghost mt-4"
                            >
                              Reset pencarian
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* pagination */}
          {!loading && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-brand-800/8 px-4 py-3.5">
              <span className="text-xs font-medium text-brand-800/60">
                Menampilkan{" "}
                <strong className="text-brand-900">
                  {sortedUsers.length
                    ? (page - 1) * PAGE_SIZE + 1
                    : 0}
                  –{Math.min(page * PAGE_SIZE, sortedUsers.length)}
                </strong>{" "}
                dari{" "}
                <strong className="text-brand-900">{sortedUsers.length}</strong>{" "}
                user
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  aria-label="Halaman sebelumnya"
                  className="icon-ring h-9 w-9 rounded-full outline-none transition hover:bg-white/70 focus-visible:ring-2 focus-visible:ring-brand-600/40 disabled:opacity-40 disabled:hover:bg-white/40"
                >
                  <ChevronLeft
                    className="h-4 w-4"
                    strokeWidth={ICON_STROKE}
                  />
                </button>

                <span className="liquid-badge px-3 py-1.5 text-xs font-bold text-brand-800">
                  {page} / {totalPages}
                </span>

                <button
                  type="button"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  aria-label="Halaman berikutnya"
                  className="icon-ring h-9 w-9 rounded-full outline-none transition hover:bg-white/70 focus-visible:ring-2 focus-visible:ring-brand-600/40 disabled:opacity-40 disabled:hover:bg-white/40"
                >
                  <ChevronRight
                    className="h-4 w-4"
                    strokeWidth={ICON_STROKE}
                  />
                </button>
              </div>
            </div>
          )}
        </motion.section>
      </div>
    </main>
  );
}
