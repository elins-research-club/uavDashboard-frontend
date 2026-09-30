"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

import {
  ArrowDownAZ,
  ArrowUpAZ,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Search,
  ShieldCheck,
  UserRoundX,
  UsersRound,
  CircleAlert,
  UserCheck,
  X,
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

type StatVisual = "bars" | "ring" | "line";

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
  active: "text-[#4F6E16]",
  expiring: "text-[#8A6818]",
  free: "text-[#666861]",
  expired: "text-[#98483F]",
};

const STATUS_BORDER: Record<SubscriptionState, string> = {
  active: "border-[#B7CB8E]",
  expiring: "border-[#D9C79A]",
  free: "border-[#D6D7D2]",
  expired: "border-[#D8B5AF]",
};

const STATUS_DOTS: Record<SubscriptionState, string> = {
  active: "bg-[#76A61C]",
  expiring: "bg-[#C59A32]",
  free: "bg-[#858780]",
  expired: "bg-[#B85147]",
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
    <motion.span
      initial={{
        opacity: 0,
        scale: 0.92,
      }}
      animate={{
        opacity: 1,
        scale: 1,
      }}
      whileHover={{
        scale: 1.04,
      }}
      transition={{
        duration: 0.28,
        ease: EASE,
      }}
      className="
        flex h-9 w-9 shrink-0
        items-center justify-center
        border border-[#D7DAD3]
        bg-white
        text-[10px] font-bold
        text-[#3F4C2A]
      "
    >
      {name.slice(0, 2).toUpperCase()}
    </motion.span>
  );
}

function StateBadge({ state }: { state: SubscriptionState }) {
  const isActive = state === "active";

  return (
    <motion.span
      whileHover={{
        y: -1,
      }}
      transition={{
        duration: 0.18,
      }}
      className={`
        inline-flex items-center gap-2
        border
        bg-white
        px-2.5 py-1
        text-[9px]
        font-bold
        uppercase
        tracking-[0.08em]
        ${STATUS_TEXT[state]}
        ${STATUS_BORDER[state]}
      `}
    >
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        {isActive && (
          <span
            className="
              absolute inset-0
              animate-ping
              rounded-full
              bg-[#76A61C]
              opacity-40
            "
          />
        )}

        <span
          className={`
            relative h-1.5 w-1.5
            rounded-full
            ${STATUS_DOTS[state]}
          `}
        />
      </span>

      {STATUS_LABELS[state]}
    </motion.span>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const isDesa = tier === "desa";
  const isKecamatan = tier === "kecamatan";

  return (
    <motion.span
      whileHover={{
        y: -1,
      }}
      transition={{
        duration: 0.18,
      }}
      className={`
        inline-flex items-center
        border
        bg-white
        px-2.5 py-1
        text-[9px]
        font-bold
        uppercase
        tracking-[0.08em]
        ${
          isKecamatan
            ? "border-[#D8C695] text-[#7C601B]"
            : isDesa
            ? "border-[#BED09A] text-[#55701D]"
            : "border-[#D6D7D2] text-[#666861]"
        }
      `}
    >
      {TIER_LABELS[tier] || TIER_LABELS.free}
    </motion.span>
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
        <motion.span
          whileHover={{
            y: -1,
          }}
          className="
            inline-flex items-center gap-1.5
            border border-[#171717]
            bg-white
            px-2.5 py-1
            text-[9px]
            font-bold
            uppercase
            tracking-[0.08em]
            text-[#171717]
          "
        >
          <ShieldCheck
            className="h-3 w-3 text-[#6E5C88]"
            strokeWidth={ICON_STROKE}
          />
          Super Admin
        </motion.span>

        <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#A0A29B]">
          Protected
        </span>
      </div>
    );
  }

  return (
    <motion.span
      whileHover={{
        y: -1,
      }}
      className={`
        inline-flex items-center
        border
        bg-white
        px-2.5 py-1
        text-[9px]
        font-bold
        uppercase
        tracking-[0.08em]
        ${
          role === "admin"
            ? "border-[#B7C89A] text-[#506B18]"
            : "border-[#D6D7D2] text-[#666861]"
        }
      `}
    >
      {role === "admin" ? "Admin" : "Member"}
    </motion.span>
  );
}

/* ============================================================
   SWEEP BUTTON
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
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-expanded={ariaExpanded}
      whileHover={
        disabled
          ? undefined
          : {
              y: -1,
            }
      }
      whileTap={
        disabled
          ? undefined
          : {
              scale: 0.985,
            }
      }
      className={`
        group/sweep
        relative
        inline-flex
        items-center
        justify-center
        overflow-hidden
        border border-[#D2D5CD]
        bg-white
        text-[#555750]
        outline-none
        transition-all
        duration-300
        focus-visible:ring-2
        focus-visible:ring-[#77B901]/40
        focus-visible:ring-offset-2
        ${disabled ? "cursor-not-allowed opacity-40" : "hover:border-[#171717]"}
        ${className}
      `}
    >
      {!disabled && (
        <span
          aria-hidden="true"
          className="
            absolute inset-0
            origin-right
            scale-x-0
            bg-[#171717]
            transition-transform
            duration-[600ms]
            ease-[cubic-bezier(0.22,1,0.36,1)]
            group-hover/sweep:origin-left
            group-hover/sweep:scale-x-100
            motion-reduce:transition-none
          "
        />
      )}

      <span
        className={`
          relative z-10
          inline-flex items-center justify-center gap-2
          transition-colors duration-500
          ${!disabled ? "group-hover/sweep:text-white" : ""}
        `}
      >
        {children}
      </span>
    </motion.button>
  );
}

/* ============================================================
   STAT VISUAL — BARS
============================================================ */

function StatMiniBars({
  percentage,
  active,
}: {
  percentage: number;
  active: boolean;
}) {
  const heights = [28, 40, 34, 52, 44, 64, 58, 76, 70, 88, 82, 100];

  const visibleBars = Math.max(
    2,
    Math.round((percentage / 100) * heights.length)
  );

  return (
    <div className="flex h-11 items-end gap-[2px]">
      {heights.map((height, index) => {
        const visible = index < visibleBars;

        return (
          <motion.span
            key={index}
            initial={{
              height: 0,
            }}
            animate={{
              height: `${visible ? height : 10}%`,
            }}
            transition={{
              duration: 0.45,
              delay: index * 0.025,
              ease: EASE,
            }}
            className={`
              w-[3px]
              rounded-[1px]
              transition-colors duration-500
              ${
                visible
                  ? active
                    ? "bg-[#DDF2A8]"
                    : "bg-[#77B901]"
                  : active
                  ? "bg-white/10"
                  : "bg-[#E9ECE5]"
              }
            `}
          />
        );
      })}
    </div>
  );
}

/* ============================================================
   STAT VISUAL — RING
============================================================ */

function StatMiniRing({
  percentage,
  active,
}: {
  percentage: number;
  active: boolean;
}) {
  const radius = 17;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative h-11 w-11">
      <svg viewBox="0 0 40 40" className="h-full w-full -rotate-90">
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          stroke={active ? "rgba(255,255,255,0.12)" : "#E9ECE5"}
          strokeWidth="4.5"
        />

        <motion.circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          stroke={active ? "#DDF2A8" : "#77B901"}
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{
            strokeDashoffset: circumference,
          }}
          animate={{
            strokeDashoffset:
              circumference - (percentage / 100) * circumference,
          }}
          transition={{
            duration: 0.75,
            ease: EASE,
          }}
        />
      </svg>

      <span
        className={`
          absolute inset-0
          flex items-center justify-center
          text-[8px]
          font-bold
          tabular-nums
          transition-colors duration-300
          ${active ? "text-white" : "text-[#666861]"}
        `}
      >
        {percentage}%
      </span>
    </div>
  );
}

/* ============================================================
   STAT VISUAL — LINE
============================================================ */

function StatMiniLine({ active }: { percentage: number; active: boolean }) {
  const points = [30, 33, 31, 40, 36, 48, 44, 57, 53, 72, 68, 88];

  const path = points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * 76 + 2;

      const y = 46 - (point / 100) * 36;

      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const lastY = 46 - (points[points.length - 1] / 100) * 36;

  return (
    <div className="relative h-11 w-[78px]">
      <svg viewBox="0 0 82 50" className="h-full w-full">
        <path
          d={path}
          fill="none"
          stroke={active ? "#DDF2A8" : "#77B901"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <motion.circle
          cx="78"
          cy={lastY}
          r="2.4"
          initial={{
            opacity: 0,
            scale: 0,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          transition={{
            delay: 0.45,
            duration: 0.25,
          }}
          fill={active ? "#DDF2A8" : "#77B901"}
        />
      </svg>
    </div>
  );
}

/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  label,
  value,
  total,
  icon: Icon,
  valueClass,
  accent,
  active,
  onClick,
  delay,
}: {
  label: string;
  value: number;
  total: number;
  icon: typeof CheckCircle2;
  valueClass: string;
  accent: string;
  active: boolean;
  onClick: () => void;
  delay: number;
}) {
  const percentage = total > 0 ? Number(((value / total) * 100).toFixed(1)) : 0;

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
      whileHover={{
        y: -3,
      }}
      whileTap={{
        scale: 0.985,
      }}
      transition={{
        duration: 0.42,
        delay,
        ease: EASE,
      }}
      className="
        group/stat
        relative
        min-h-[116px]
        overflow-hidden
        text-left
        outline-none
        focus-visible:ring-2
        focus-visible:ring-inset
        focus-visible:ring-[#77B901]/40
      "
    >
      {/* ==================================================
          BACKGROUND
      ================================================== */}

      <motion.div
        initial={false}
        animate={{
          backgroundColor: active ? "#77B901" : "#FFFFFF",
        }}
        transition={{
          duration: 0.5,
          ease: EASE,
        }}
        className="absolute inset-0"
      />

      {/* Active moving glow */}
      <motion.div
        initial={false}
        animate={{
          opacity: active ? 1 : 0,
          scale: active ? 1 : 0.65,
          x: active ? 0 : 20,
        }}
        transition={{
          duration: 0.65,
          ease: EASE,
        }}
        className="
          pointer-events-none
          absolute
          -right-8
          -top-10
          h-32
          w-32
          rounded-full
          bg-[#DDF2A8]/25
          blur-3xl
        "
      />

      {/* ==================================================
          LEFT ACTIVE BAR
      ================================================== */}

      <motion.span
        initial={false}
        animate={{
          scaleY: active ? 1 : 0,
        }}
        transition={{
          duration: 0.45,
          ease: EASE,
        }}
        className={`
          absolute
          inset-y-0
          left-0
          w-[4px]
          origin-top
          ${active ? "bg-[#DDF2A8]" : accent}
        `}
      />

      {/* ==================================================
          CONTENT
      ================================================== */}

      <div className="relative z-10 flex h-full items-start justify-between gap-4 px-5 py-4">
        {/* ==================================================
            LEFT CONTENT
        ================================================== */}

        <div className="min-w-0">
          {/* LABEL */}
          <motion.p
            animate={{
              x: active ? 1 : 0,
              opacity: active ? 1 : 0.95,
            }}
            transition={{
              duration: 0.3,
              ease: EASE,
            }}
            className={`
              text-[9px]
              font-bold
              uppercase
              tracking-[0.16em]
              transition-colors duration-400
              ${active ? "text-white/80" : "text-[#858780]"}
            `}
          >
            {label}
          </motion.p>

          {/* VALUE */}
          <motion.div
            key={value}
            initial={{
              opacity: 0,
              y: 6,
              scale: 0.94,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            transition={{
              duration: 0.35,
              ease: EASE,
            }}
            className={`
              mt-1
              text-[34px]
              font-bold
              leading-none
              tracking-[-0.06em]
              tabular-nums
              transition-colors duration-400
              sm:text-[38px]
              ${active ? "text-white" : valueClass}
            `}
          >
            {value}
          </motion.div>

          {/* PERCENTAGE */}
          <motion.div
            animate={{
              opacity: active ? 1 : 0.8,
              y: active ? 0 : 1,
            }}
            transition={{
              duration: 0.35,
              ease: EASE,
            }}
            className="
              mt-1.5
              flex
              items-center
              gap-1.5
            "
          >
            <span
              className={`
                text-[10px]
                font-bold
                tabular-nums
                transition-colors duration-400
                ${active ? "text-[#E4F5B7]" : "text-[#6F716B]"}
              `}
            >
              {percentage}%
            </span>

            <span
              className={`
                text-[8px]
                font-medium
                transition-colors duration-400
                ${active ? "text-white/55" : "text-[#A0A29B]"}
              `}
            >
              dari seluruh user
            </span>
          </motion.div>
        </div>

        {/* ==================================================
            SINGLE ICON
        ================================================== */}

        <motion.div
          className="
            relative
            mt-1
            flex
            h-12
            w-12
            shrink-0
            items-center
            justify-center
          "
          whileHover={{
            scale: 1.14,
            rotate: -8,
          }}
          whileTap={{
            scale: 0.9,
            rotate: 8,
          }}
          transition={{
            type: "spring",
            stiffness: 420,
            damping: 16,
          }}
        >
          {/* OUTER BURST */}
          <motion.span
            initial={false}
            animate={{
              scale: active ? 1 : 0.5,
              opacity: active ? 1 : 0,
              rotate: active ? 180 : 0,
            }}
            transition={{
              duration: 0.65,
              ease: EASE,
            }}
            className="
              absolute
              inset-0
              rounded-full
              border
              border-[#DDF2A8]/40
            "
          />

          {/* SECOND BURST */}
          <motion.span
            initial={false}
            animate={{
              scale: active ? 1.35 : 0.5,
              opacity: active ? 0.35 : 0,
              rotate: active ? -120 : 0,
            }}
            transition={{
              duration: 0.8,
              ease: EASE,
            }}
            className="
              absolute
              inset-[7px]
              rounded-full
              border
              border-[#E4F5B7]/30
            "
          />

          {/* GLOW */}
          <motion.span
            initial={false}
            animate={{
              scale: active ? 1.2 : 0.6,
              opacity: active ? 1 : 0,
            }}
            transition={{
              duration: 0.45,
              ease: EASE,
            }}
            className="
              absolute
              inset-[5px]
              rounded-full
              bg-[#DDF2A8]/25
              blur-md
            "
          />

          {/* ICON CONTAINER */}
          <motion.span
            initial={false}
            animate={{
              backgroundColor: active ? "rgba(255,255,255,0.12)" : "#F4F6F0",
              borderColor: active ? "rgba(228,245,183,0.28)" : "#E1E4DC",
              scale: active ? 1.12 : 1,
              rotate: active ? 0 : -4,
            }}
            transition={{
              duration: 0.45,
              ease: EASE,
            }}
            className="
              relative
              z-10
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              border
            "
          >
            <motion.div
              initial={false}
              animate={{
                rotate: active ? 360 : 0,
                scale: active ? 1.1 : 1,
              }}
              transition={{
                rotate: {
                  duration: 0.7,
                  ease: EASE,
                },
                scale: {
                  duration: 0.35,
                  ease: EASE,
                },
              }}
            >
              <Icon
                className={`
                  h-[21px]
                  w-[21px]
                  transition-colors duration-400
                  ${active ? "text-[#E4F5B7]" : valueClass}
                `}
                strokeWidth={1.9}
              />
            </motion.div>
          </motion.span>
        </motion.div>
      </div>

      {/* ==================================================
          FOOTER
      ================================================== */}

      <motion.div
        initial={false}
        animate={{
          backgroundColor: active ? "rgba(0,0,0,0.07)" : "#FBFCFA",
          borderColor: active ? "rgba(255,255,255,0.10)" : "#ECEDE9",
        }}
        transition={{
          duration: 0.45,
          ease: EASE,
        }}
        className="
          relative
          z-10
          flex
          h-8
          items-center
          justify-between
          border-t
          px-5
        "
      >
        <motion.span
          animate={{
            x: active ? 2 : 0,
          }}
          transition={{
            duration: 0.3,
            ease: EASE,
          }}
          className={`
            text-[8px]
            font-semibold
            sm:text-[9px]
            ${active ? "text-white/75" : "text-[#6F716B]"}
          `}
        >
          {active ? "Filter aktif" : "Lihat pengguna"}
        </motion.span>

        <motion.span
          whileHover={{
            x: 4,
          }}
          transition={{
            duration: 0.2,
          }}
          className={`
            text-[13px]
            leading-none
            transition-colors duration-400
            ${active ? "text-[#E4F5B7]" : "text-[#777A73]"}
          `}
        >
          →
        </motion.span>
      </motion.div>

      {/* ==================================================
          ACTIVE FLASH LINE
      ================================================== */}

      <motion.span
        initial={false}
        animate={{
          scaleX: active ? 1 : 0,
          opacity: active ? 1 : 0,
        }}
        transition={{
          duration: 0.55,
          ease: EASE,
        }}
        className="
          absolute
          bottom-0
          left-5
          h-[2px]
          w-10
          origin-left
          bg-[#E4F5B7]
        "
      />
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

        setMsgType("error");
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
    }, 3200);
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
        "Akun Super Admin adalah protected account dan tidak dapat diubah.",
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

    showMessage("Data user berhasil diekspor.", "success");
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
              background: #f4f5f2;
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

    showMessage("Dokumen berhasil disiapkan.", "success");
  };

  /* ==========================================================
     GUARD
  ========================================================== */

  if (authLoading || !user || !canManageUsers) {
    return null;
  }
  const statCards = [
    {
      state: "active" as SubscriptionState,
      label: "Active Users",
      value: stats.active,
      icon: CheckCircle2,
      valueClass: "text-[#4F6E16]",
      accent: "bg-[#91B928]",
    },
    {
      state: "expiring" as SubscriptionState,
      label: "Hampir Berakhir",
      value: stats.expiring,
      icon: Clock3,
      valueClass: "text-[#876516]",
      accent: "bg-[#C59A32]",
    },
    {
      state: "free" as SubscriptionState,
      label: "User Free",
      value: stats.free,
      icon: UsersRound,
      valueClass: "text-[#5F625C]",
      accent: "bg-[#858780]",
    },
    {
      state: "expired" as SubscriptionState,
      label: "Langganan Berakhir",
      value: stats.expired,
      icon: UserRoundX,
      valueClass: "text-[#98483F]",
      accent: "bg-[#B85147]",
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
            y: 10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.45,
            ease: EASE,
          }}
          className="mb-7"
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-[32px] font-bold leading-none tracking-[-0.045em] text-[#111111] sm:text-[40px]">
                Manajemen User
              </h1>

              <p className="mt-3 max-w-xl text-[11px] font-medium leading-5 text-[#777972] sm:text-xs">
                Kelola identitas, role, subscription, dan akses pengguna dalam
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
                      y: -5,
                      scale: 0.98,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                    }}
                    transition={{
                      duration: 0.2,
                      ease: EASE,
                    }}
                    className="
                      absolute right-0 z-20 mt-2
                      w-52
                      border border-[#DCDDD8]
                      bg-white
                      p-1
                      shadow-[0_16px_40px_rgba(0,0,0,0.09)]
                    "
                  >
                    <button
                      type="button"
                      onClick={exportPdf}
                      className="
                        flex w-full items-center gap-3
                        px-3 py-2.5
                        text-left
                        transition-colors
                        hover:bg-[#F5F6F3]
                      "
                    >
                      <span className="flex h-8 w-8 items-center justify-center border border-[#DCDDD8] bg-white">
                        <FileText
                          className="h-3.5 w-3.5 text-[#555750]"
                          strokeWidth={ICON_STROKE}
                        />
                      </span>

                      <span>
                        <span className="block text-[11px] font-bold text-[#171717]">
                          PDF
                        </span>

                        <span className="mt-0.5 block text-[9px] font-medium text-[#969890]">
                          Print document
                        </span>
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={exportExcel}
                      className="
                        flex w-full items-center gap-3
                        px-3 py-2.5
                        text-left
                        transition-colors
                        hover:bg-[#F5F6F3]
                      "
                    >
                      <span className="flex h-8 w-8 items-center justify-center border border-[#DCDDD8] bg-white">
                        <FileSpreadsheet
                          className="h-3.5 w-3.5 text-[#555750]"
                          strokeWidth={ICON_STROKE}
                        />
                      </span>

                      <span>
                        <span className="block text-[11px] font-bold text-[#171717]">
                          CSV
                        </span>

                        <span className="mt-0.5 block text-[9px] font-medium text-[#969890]">
                          Spreadsheet export
                        </span>
                      </span>
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
        <motion.div
          initial={{
            opacity: 0,
            y: 8,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.42,
            delay: 0.08,
            ease: EASE,
          }}
          className="
    mb-5
    grid
    overflow-hidden
    border border-[#DCDDD8]
    bg-[#DCDDD8]
    sm:grid-cols-2
    xl:grid-cols-4
  "
        >
          {statCards.map((card, index) => (
            <StatCard
              key={card.state}
              label={card.label}
              value={card.value}
              total={users.length}
              icon={card.icon}
              valueClass={card.valueClass}
              accent={card.accent}
              active={stateFilter === card.state}
              onClick={() => toggleStateFilter(card.state)}
              delay={index * 0.05}
            />
          ))}
        </motion.div>

        {/* ==================================================
            MESSAGE
        ================================================== */}

        <AnimatePresence mode="wait">
          {message && (
            <motion.div
              key={`${msgType}-${message}`}
              initial={{
                opacity: 0,
                y: -6,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -5,
              }}
              transition={{
                duration: 0.22,
                ease: EASE,
              }}
              className={`
                mb-5
                flex items-start gap-3
                border
                bg-white
                px-4 py-3.5
                shadow-[0_8px_25px_rgba(0,0,0,0.03)]
                ${
                  msgType === "success"
                    ? "border-[#C5D7A7] text-[#4F6E16]"
                    : "border-[#DFC1BC] text-[#93443A]"
                }
              `}
            >
              <span
                className={`
                  mt-0.5
                  flex h-7 w-7 shrink-0
                  items-center justify-center
                  border
                  bg-white
                  ${
                    msgType === "success"
                      ? "border-[#D4E0BE]"
                      : "border-[#E5CEC9]"
                  }
                `}
              >
                {msgType === "success" ? (
                  <UserCheck
                    className="h-3.5 w-3.5"
                    strokeWidth={ICON_STROKE}
                  />
                ) : (
                  <CircleAlert
                    className="h-3.5 w-3.5"
                    strokeWidth={ICON_STROKE}
                  />
                )}
              </span>

              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-[11px] font-bold">
                  {msgType === "success"
                    ? "Perubahan berhasil"
                    : "Tidak dapat melanjutkan"}
                </p>

                <p className="mt-0.5 text-[10px] font-medium leading-4 text-[#73746E] sm:text-[11px]">
                  {message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setMessage("")}
                className="
                  mt-0.5
                  flex h-6 w-6
                  shrink-0
                  items-center justify-center
                  text-[#9A9B95]
                  transition-colors
                  hover:text-[#171717]
                "
                aria-label="Tutup notifikasi"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ==================================================
            TABLE
        ================================================== */}

        <motion.section
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
            delay: 0.18,
            ease: EASE,
          }}
          className="
            overflow-hidden
            border border-[#DCDDD8]
            bg-white
            shadow-[0_12px_35px_rgba(0,0,0,0.035)]
          "
        >
          {/* TOOLBAR */}

          <div className="border-b border-[#E5E6E1] p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#969890]">
                      Directory
                    </p>
                  </div>

                  <h2 className="text-base font-bold tracking-[-0.02em] text-[#171717]">
                    Semua Pengguna
                  </h2>
                </div>

                <motion.span
                  key={sortedUsers.length}
                  initial={{
                    opacity: 0,
                    scale: 0.9,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}
                  className="
                    border
                    border-[#DCDDD8]
                    bg-white
                    px-2.5 py-1
                    text-[9px]
                    font-bold
                    tabular-nums
                    tracking-[0.08em]
                    text-[#666861]
                  "
                >
                  {sortedUsers.length}
                </motion.span>

                {stateFilter && (
                  <motion.button
                    initial={{
                      opacity: 0,
                      scale: 0.94,
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                    }}
                    type="button"
                    onClick={() => toggleStateFilter(stateFilter)}
                    className="
                      inline-flex items-center gap-1.5
                      border border-[#B7CB8E]
                      bg-white
                      px-2.5 py-1
                      text-[9px]
                      font-bold
                      uppercase
                      tracking-[0.08em]
                      text-[#55721D]
                      transition-colors
                      hover:border-[#171717]
                      hover:text-[#171717]
                    "
                  >
                    {STATUS_LABELS[stateFilter]}

                    <X className="h-3 w-3" strokeWidth={2} />
                  </motion.button>
                )}
              </div>

              <div className="relative w-full lg:w-[330px]">
                <Search
                  className="
                    pointer-events-none
                    absolute left-3.5 top-1/2
                    h-3.5 w-3.5
                    -translate-y-1/2
                    text-[#92948D]
                  "
                  strokeWidth={ICON_STROKE}
                />

                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Cari nama, email, role..."
                  className="
                    h-10 w-full
                    border border-[#DCDDD8]
                    bg-white
                    pl-10 pr-10
                    text-[11px]
                    font-medium
                    text-[#171717]
                    outline-none
                    transition-all
                    duration-300
                    placeholder:text-[#A0A29B]
                    focus:border-[#171717]
                    focus:ring-4
                    focus:ring-[#77B901]/10
                  "
                />

                <AnimatePresence>
                  {search && (
                    <motion.button
                      initial={{
                        opacity: 0,
                        scale: 0.8,
                      }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                      }}
                      exit={{
                        opacity: 0,
                        scale: 0.8,
                      }}
                      type="button"
                      aria-label="Bersihkan pencarian"
                      onClick={() => {
                        setSearch("");
                        setPage(1);
                      }}
                      className="
                        absolute right-2 top-1/2
                        flex h-6 w-6
                        -translate-y-1/2
                        items-center justify-center
                        text-[#92948D]
                        transition-colors
                        hover:text-[#171717]
                      "
                    >
                      <X className="h-3 w-3" strokeWidth={2} />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* TABLE */}

          {loading ? (
            <div className="p-5 sm:p-6">
              <div className="space-y-2">
                {Array.from({
                  length: 7,
                }).map((_, index) => (
                  <motion.div
                    key={index}
                    initial={{
                      opacity: 0,
                    }}
                    animate={{
                      opacity: [0.45, 0.9, 0.45],
                    }}
                    transition={{
                      duration: 1.3,
                      repeat: Infinity,
                      delay: index * 0.06,
                    }}
                    className="
                        h-14
                        bg-[#F0F1ED]
                      "
                  />
                ))}
              </div>

              <div className="flex items-center justify-center gap-2 py-6 text-[#666861]">
                <Loader2 className="h-4 w-4 animate-spin" />

                <span className="text-[11px] font-semibold">
                  Memuat daftar user...
                </span>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left">
                <thead className="border-b border-[#E4E5E1] bg-[#F8F9F6]">
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
                        className="px-4 py-3.5"
                      >
                        <button
                          type="button"
                          onClick={() => sortBy(key)}
                          className="
                              inline-flex items-center gap-1.5
                              px-1 py-0.5
                              outline-none
                              transition-colors
                              hover:text-[#171717]
                              focus-visible:ring-2
                              focus-visible:ring-[#77B901]/40
                            "
                        >
                          <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#7E817A]">
                            {label}
                          </span>

                          {sortKey === key ? (
                            sortDirection === "asc" ? (
                              <ArrowUpAZ
                                className="h-3.5 w-3.5 text-[#171717]"
                                strokeWidth={ICON_STROKE}
                              />
                            ) : (
                              <ArrowDownAZ
                                className="h-3.5 w-3.5 text-[#171717]"
                                strokeWidth={ICON_STROKE}
                              />
                            )
                          ) : (
                            <ArrowDownAZ
                              className="h-3.5 w-3.5 text-[#C1C3BD]"
                              strokeWidth={ICON_STROKE}
                            />
                          )}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#ECEDE9]">
                  <AnimatePresence initial={false}>
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
                            y: 5,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          transition={{
                            duration: 0.3,
                            delay: Math.min(index, 10) * 0.025,
                            ease: EASE,
                          }}
                          className="
                              group/row
                              transition-colors
                              duration-300
                              hover:bg-[#FBFCFA]
                            "
                        >
                          {/* USER */}

                          <td
                            className="
                                relative
                                px-4 py-4
                                before:absolute
                                before:inset-y-0
                                before:left-0
                                before:w-[2px]
                                before:origin-top
                                before:scale-y-0
                                before:bg-[#77B901]
                                before:transition-transform
                                before:duration-400
                                before:ease-[cubic-bezier(0.22,1,0.36,1)]
                                group-hover/row:before:scale-y-100
                              "
                          >
                            <div className="flex items-center gap-3">
                              <Avatar name={item.username} />

                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-bold text-[#171717]">
                                    {item.username}
                                  </p>

                                  {isProtected && (
                                    <motion.div
                                      animate={{
                                        y: [0, -1.5, 0],
                                      }}
                                      transition={{
                                        duration: 2.8,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                      }}
                                    >
                                      <ShieldCheck
                                        className="h-3.5 w-3.5 text-[#6E5C88]"
                                        strokeWidth={ICON_STROKE}
                                        aria-label="Protected account"
                                      />
                                    </motion.div>
                                  )}
                                </div>

                                {isSelf && (
                                  <span
                                    className="
                                        mt-1
                                        inline-flex
                                        border border-[#BED09A]
                                        bg-white
                                        px-2 py-0.5
                                        text-[8px]
                                        font-bold
                                        uppercase
                                        tracking-[0.08em]
                                        text-[#55701D]
                                      "
                                  >
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
                                  className="
                                      h-9
                                      border
                                      border-[#D6D8D3]
                                      bg-white
                                      px-3
                                      text-xs
                                      font-semibold
                                      text-[#555750]
                                      outline-none
                                      transition-all
                                      focus:border-[#171717]
                                      focus:ring-4
                                      focus:ring-[#77B901]/10
                                      disabled:cursor-not-allowed
                                      disabled:bg-[#F4F5F2]
                                      disabled:opacity-50
                                    "
                                >
                                  <option value="member">Member</option>

                                  <option value="admin">Admin</option>
                                </select>

                                {updatingId === item.id && (
                                  <Loader2
                                    className="
                                        h-3.5 w-3.5
                                        animate-spin
                                        text-[#77B901]
                                      "
                                  />
                                )}

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
                  </AnimatePresence>

                  {visibleUsers.length === 0 && (
                    <tr>
                      <td colSpan={COLUMNS.length} className="px-4 py-14">
                        <motion.div
                          initial={{
                            opacity: 0,
                            y: 6,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          transition={{
                            duration: 0.3,
                            ease: EASE,
                          }}
                          className="mx-auto max-w-sm text-center"
                        >
                          <motion.span
                            animate={{
                              y: [0, -2, 0],
                            }}
                            transition={{
                              duration: 2.6,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                            className="
                              mx-auto
                              flex h-11 w-11
                              items-center justify-center
                              border border-[#DCDDD8]
                              bg-white
                              text-[#737770]
                            "
                          >
                            <Search
                              className="h-5 w-5"
                              strokeWidth={ICON_STROKE}
                            />
                          </motion.span>

                          <p className="mt-4 text-sm font-bold text-[#171717]">
                            User tidak ditemukan
                          </p>

                          <p className="mt-1 text-xs font-medium leading-5 text-[#858780]">
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
                        </motion.div>
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
            <div
              className="
                flex flex-wrap
                items-center justify-between
                gap-3
                border-t border-[#E5E6E1]
                px-4 py-3.5
              "
            >
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
                <motion.button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  whileHover={
                    page === 1
                      ? undefined
                      : {
                          y: -1,
                        }
                  }
                  whileTap={
                    page === 1
                      ? undefined
                      : {
                          scale: 0.96,
                        }
                  }
                  aria-label="Halaman sebelumnya"
                  className="
                    flex h-9 w-9
                    items-center justify-center
                    border border-[#D6D8D3]
                    bg-white
                    text-[#666861]
                    outline-none
                    transition-colors
                    duration-300
                    hover:border-[#171717]
                    hover:bg-[#171717]
                    hover:text-white
                    focus-visible:ring-2
                    focus-visible:ring-[#77B901]
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                  "
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={ICON_STROKE} />
                </motion.button>

                <motion.span
                  key={page}
                  initial={{
                    opacity: 0.5,
                    y: 2,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  className="
                    inline-flex h-9
                    items-center
                    border border-[#171717]
                    bg-white
                    px-3
                    text-xs
                    font-bold
                    tabular-nums
                    text-[#171717]
                  "
                >
                  {page} / {totalPages}
                </motion.span>

                <motion.button
                  type="button"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  whileHover={
                    page === totalPages
                      ? undefined
                      : {
                          y: -1,
                        }
                  }
                  whileTap={
                    page === totalPages
                      ? undefined
                      : {
                          scale: 0.96,
                        }
                  }
                  aria-label="Halaman berikutnya"
                  className="
                    flex h-9 w-9
                    items-center justify-center
                    border border-[#D6D8D3]
                    bg-white
                    text-[#666861]
                    outline-none
                    transition-colors
                    duration-300
                    hover:border-[#171717]
                    hover:bg-[#171717]
                    hover:text-white
                    focus-visible:ring-2
                    focus-visible:ring-[#77B901]
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                  "
                >
                  <ChevronRight className="h-4 w-4" strokeWidth={ICON_STROKE} />
                </motion.button>
              </div>
            </div>
          )}
        </motion.section>

        {/* ==================================================
            FOOTER
        ================================================== */}

        <motion.div
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          transition={{
            delay: 0.45,
            duration: 0.35,
          }}
          className="
            mt-4
            flex items-center
            justify-between gap-3
            text-[9px]
            font-semibold
            uppercase
            tracking-[0.13em]
            text-[#9A9C95]
          "
        >
          <span>User access · Role based</span>

          <span>AMX UAV DaaS</span>
        </motion.div>
      </div>
    </main>
  );
}
