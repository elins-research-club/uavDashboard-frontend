"use client";

import { useEffect, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { useUserRole } from "@/context/UserRoleContext";
import api from "@/lib/api";

import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Gem,
  Headphones,
  Loader2,
  MapPin,
  RefreshCw,
  Shield,
  Star,
  Users,
  X,
  Zap,
} from "lucide-react";

/* ============================================================
   TYPES
============================================================ */

type PricingPlan = {
  tier: string;
  price: number;
  features: string[];
  name: string;
  description: string;
  popular: boolean;
  frequency?: string;
  storage_gb?: number;
};

type Subscription = {
  id?: string;
  user_id?: string;
  tier?: string | null;
  status?: string | null;
  scope_type?: string | null;
  village_id?: string | null;
  district_id?: string | null;
  billing_cycle?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  created_at?: string | null;
};

type SubscriptionOrder = {
  id: string;
  user_id: string;
  tier: string;
  scope_type?: string | null;
  village_id?: string | null;
  district_id?: string | null;
  amount: number;
  billing_cycle: string;
  status: string;
  payment_method?: string | null;
  external_order_id?: string | null;
  paid_at?: string | null;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
};

type CheckoutForm = {
  scopeType: "village" | "district";
  scopeId: string;
};

/* ============================================================
   PLAN META
============================================================ */

type TierStyle = {
  icon: ReactNode;
  label: string;
};

const tierStyles: Record<string, TierStyle> = {
  free: {
    icon: <Star className="h-3.5 w-3.5" strokeWidth={1.8} />,
    label: "Free",
  },

  desa: {
    icon: <Zap className="h-3.5 w-3.5" strokeWidth={1.8} />,
    label: "Desa",
  },

  kecamatan: {
    icon: <Gem className="h-3.5 w-3.5" strokeWidth={1.8} />,
    label: "Kecamatan",
  },
};

/* ============================================================
   3D ISOMETRIC WIREFRAME BACKGROUND
   ------------------------------------------------------------
   - Geometri dihitung dari proyeksi isometrik sungguhan, jadi
     setiap blok punya 3 sisi (atas, kiri, kanan) yang konsisten.
   - viewBox dihitung otomatis dari isi scene, dan
     preserveAspectRatio "meet" menjaga proporsi (tidak gepeng).
   - vector-effect: non-scaling-stroke -> garis selalu tipis
     & tajam di ukuran layar berapa pun.
   - Lebar dibatasi per breakpoint agar rapi di mobile - desktop.
============================================================ */

type Block = {
  x: number; // posisi pada grid
  y: number;
  w: number; // lebar (sumbu x)
  d: number; // kedalaman (sumbu y)
  h: number; // tinggi
};

type SceneConfig = {
  grid: number;
  blocks: Block[];
};

/* Free: satu bangunan tunggal, sederhana */
/* Desa: klaster kecil, tinggi bervariasi */
/* Kecamatan: klaster lebih besar, terasa seperti kawasan */
const SCENE_CONFIGS: SceneConfig[] = [
  {
    grid: 4,
    blocks: [
      { x: 1, y: 1, w: 2, d: 2, h: 1.5 },
      { x: 3, y: 0, w: 1, d: 1, h: 0.8 },
      { x: 0, y: 3, w: 1, d: 1, h: 0.5 },
    ],
  },
  {
    grid: 5,
    blocks: [
      { x: 0, y: 0, w: 1, d: 2, h: 1.2 },
      { x: 2, y: 0, w: 1, d: 1, h: 2.2 },
      { x: 4, y: 0, w: 1, d: 1, h: 1.6 },
      { x: 0, y: 2, w: 1, d: 1, h: 0.5 },
      { x: 3, y: 2, w: 2, d: 1, h: 1 },
      { x: 1, y: 3, w: 2, d: 2, h: 0.7 },
    ],
  },
  {
    grid: 6,
    blocks: [
      { x: 0, y: 0, w: 2, d: 2, h: 1.4 },
      { x: 3, y: 0, w: 1, d: 1, h: 3 },
      { x: 5, y: 0, w: 1, d: 1, h: 0.8 },
      { x: 4, y: 1, w: 2, d: 2, h: 2 },
      { x: 2, y: 2, w: 2, d: 2, h: 1.1 },
      { x: 0, y: 3, w: 1, d: 2, h: 2.4 },
      { x: 4, y: 4, w: 2, d: 1, h: 1.6 },
      { x: 2, y: 5, w: 1, d: 1, h: 0.6 },
    ],
  },
];

const ISO_COS = Math.sqrt(3) / 2;
const ISO_UNIT = 40;

type BuiltScene = {
  viewBox: string;
  ratio: number;
  region: string;
  grid: string;
  floor: string;
  blocks: { top: string; left: string; right: string; levels: string }[];
};

function buildScene({ grid: n, blocks }: SceneConfig): BuiltScene {
  const xs: number[] = [];
  const ys: number[] = [];

  /* proyeksi isometrik: (x, y, z) -> "px py" */
  const P = (x: number, y: number, z = 0) => {
    const px = (x - y) * ISO_COS * ISO_UNIT;
    const py = ((x + y) * 0.5 - z) * ISO_UNIT;

    xs.push(px);
    ys.push(py);

    return `${px.toFixed(1)} ${py.toFixed(1)}`;
  };

  const face = (points: string[]) => `M${points.join(" L")} Z`;

  /* lantai + grid */
  let grid = "";

  for (let i = 0; i <= n; i++) {
    grid += `M${P(i, 0)} L${P(i, n)} M${P(0, i)} L${P(n, i)} `;
  }

  const floor = face([P(0, 0), P(n, 0), P(n, n), P(0, n)]);

  /* garis batas wilayah (putus-putus) */
  const m = 0.55;

  const region = face([P(-m, -m), P(n + m, -m), P(n + m, n + m), P(-m, n + m)]);

  /* blok, urut dari belakang ke depan (painter's algorithm) */
  const builtBlocks = [...blocks]
    .sort(
      (a, b) =>
        a.x + a.w / 2 + (a.y + a.d / 2) - (b.x + b.w / 2 + (b.y + b.d / 2))
    )
    .map(({ x, y, w, d, h }) => {
      const top = face([
        P(x, y, h),
        P(x + w, y, h),
        P(x + w, y + d, h),
        P(x, y + d, h),
      ]);

      const right = face([
        P(x + w, y, 0),
        P(x + w, y + d, 0),
        P(x + w, y + d, h),
        P(x + w, y, h),
      ]);

      const left = face([
        P(x, y + d, 0),
        P(x + w, y + d, 0),
        P(x + w, y + d, h),
        P(x, y + d, h),
      ]);

      /* garis lantai bangunan melintasi sisi kanan & kiri */
      let levels = "";

      for (let z = 0.5; z < h - 0.01; z += 0.5) {
        levels += `M${P(x + w, y, z)} L${P(x + w, y + d, z)} L${P(
          x,
          y + d,
          z
        )} `;
      }

      return { top, left, right, levels };
    });

  /* viewBox otomatis mengikuti isi scene */
  const pad = 6;
  const minX = Math.min(...xs) - pad;
  const minY = Math.min(...ys) - pad;
  const width = Math.max(...xs) - Math.min(...xs) + pad * 2;
  const height = Math.max(...ys) - Math.min(...ys) + pad * 2;

  return {
    viewBox: `${minX.toFixed(1)} ${minY.toFixed(1)} ${width.toFixed(
      1
    )} ${height.toFixed(1)}`,
    ratio: width / height,
    region,
    grid,
    floor,
    blocks: builtBlocks,
  };
}

const SCENES = SCENE_CONFIGS.map(buildScene);

const NON_SCALING = { vectorEffect: "non-scaling-stroke" as const };

function PlanGeometry({
  variant = 0,
  dark = false,
}: {
  variant?: number;
  dark?: boolean;
}) {
  const scene = SCENES[variant % SCENES.length];

  /* harus sama dengan warna background card agar sisi belakang tertutup */
  const surface = dark ? "#171717" : "#FFFFFF";

  const fade =
    "radial-gradient(120% 120% at 100% 0%, #000 35%, transparent 74%)";

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={scene.viewBox}
      preserveAspectRatio="xMaxYMin meet"
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        aspectRatio: scene.ratio,
        WebkitMaskImage: fade,
        maskImage: fade,
      }}
      className={`pointer-events-none absolute -right-3 -top-1 w-[74%] max-w-[380px] origin-top-right select-none transition-transform duration-700 ease-out group-hover:-translate-y-0.5 group-hover:scale-[1.03] sm:w-[58%] md:w-[46%] lg:w-[84%] ${
        dark ? "text-white opacity-[0.2]" : "text-black opacity-[0.13]"
      }`}
    >
      {/* batas wilayah */}
      <path
        d={scene.region}
        strokeDasharray="3 4"
        strokeOpacity={0.7}
        {...NON_SCALING}
      />

      {/* grid lantai */}
      <path d={scene.grid} strokeOpacity={0.5} {...NON_SCALING} />
      <path d={scene.floor} {...NON_SCALING} />

      {/* bangunan */}
      {scene.blocks.map((block, index) => (
        <g key={index}>
          {/* isi solid agar garis di belakang blok tidak tembus */}
          <path d={block.left} fill={surface} {...NON_SCALING} />
          <path d={block.right} fill={surface} {...NON_SCALING} />
          <path d={block.top} fill={surface} {...NON_SCALING} />

          {/* shading tipis biar terasa 3D */}
          <path
            d={block.left}
            fill="currentColor"
            fillOpacity={0.22}
            stroke="none"
          />
          <path
            d={block.right}
            fill="currentColor"
            fillOpacity={0.5}
            stroke="none"
          />

          {block.levels && (
            <path d={block.levels} strokeOpacity={0.55} {...NON_SCALING} />
          )}
        </g>
      ))}
    </svg>
  );
}

/* ============================================================
   TRUST CARD
============================================================ */

function TrustCard({
  icon: Icon,
  title,
  description,
  delay = 0,
}: {
  icon: ComponentType<{
    className?: string;
    strokeWidth?: number;
  }>;
  title: string;
  description: string;
  delay?: number;
}) {
  return (
    <motion.div
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
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{
        y: -2,
      }}
      className="group border border-[#DCDDD8] bg-white p-5 transition-all duration-300 hover:border-[#C8CAC4] hover:shadow-[0_12px_35px_rgba(0,0,0,0.05)]"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#E0E1DC] bg-[#F7F8F5]">
          <Icon className="h-4 w-4 text-[#666861]" strokeWidth={1.8} />
        </span>

        <div className="min-w-0">
          <p className="text-sm font-bold text-[#1A1A1A]">{title}</p>

          <p className="mt-1 text-xs font-medium leading-5 text-[#858780]">
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ============================================================
   SWEEP BUTTON
   ------------------------------------------------------------
   Hover: warna menyapu dari kiri ke kanan (transform-only,
   jadi tetap 60fps). Saat hover dilepas, warna keluar ke
   kanan, bukan mundur ke kiri, supaya terasa mengalir.
============================================================ */

function SweepButton({
  children,
  onClick,
  disabled = false,
  tone = "dark",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: "dark" | "light";
}) {
  const base =
    tone === "dark" ? "bg-[#171717] text-white" : "bg-white text-[#171717]";

  const textHover =
    tone === "dark" && !disabled ? "group-hover/sweep:text-[#0F1A00]" : "";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group/sweep relative inline-flex w-full items-center justify-center overflow-hidden px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.08em] outline-none transition-transform duration-200 focus-visible:ring-2 focus-visible:ring-[#76B900] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 ${
        disabled ? "" : "active:scale-[0.985]"
      } ${base}`}
    >
      {!disabled && (
        <span
          aria-hidden="true"
          className="absolute inset-0 origin-right scale-x-0 transform-gpu bg-[#76B900] transition-transform duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform group-hover/sweep:origin-left group-hover/sweep:scale-x-100 motion-reduce:transition-none"
        />
      )}

      <span
        className={`relative z-10 inline-flex items-center justify-center gap-2 transition-colors duration-500 ease-out ${textHover}`}
      >
        {children}
      </span>
    </button>
  );
}

/* ============================================================
   HELPERS
============================================================ */

function normalizeTier(tier?: string | null) {
  return String(tier || "free").toLowerCase();
}

function formatPrice(price: number) {
  if (!price || price === 0) {
    return "Gratis";
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price);
}

function formatDate(date?: string | null) {
  if (!date) {
    return "-";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function formatCountdown(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function formatScope(subscription?: Subscription | null) {
  if (!subscription?.scope_type) {
    return null;
  }

  if (subscription.scope_type === "village") {
    return {
      label: "Cakupan Desa",
      value: subscription.village_id || "Belum ditentukan",
    };
  }

  if (subscription.scope_type === "district") {
    return {
      label: "Cakupan Kecamatan",
      value: subscription.district_id || "Belum ditentukan",
    };
  }

  return null;
}

function getSavedMidtransUrl(orderId?: string | null) {
  if (!orderId || typeof window === "undefined") {
    return "";
  }

  return localStorage.getItem(`midtrans_redirect_url:${orderId}`) || "";
}

function saveMidtransUrl(orderId: string, redirectUrl: string) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(`midtrans_redirect_url:${orderId}`, redirectUrl);
}

function removeSavedMidtransUrl(orderId?: string | null) {
  if (!orderId || typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(`midtrans_redirect_url:${orderId}`);
}

function extractApiError(error: any, fallback: string) {
  return (
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

/* ============================================================
   MOTION VARIANTS
============================================================ */

const overviewContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.12,
    },
  },
};

const overviewItem: Variants = {
  hidden: {
    opacity: 0,
    y: 6,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

/* ============================================================
   PAGE
============================================================ */

export default function SubscriptionPage() {
  const { user, refreshCurrentUser } = useUserRole();

  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);

  const [subscription, setSubscription] = useState<Subscription | null>(null);

  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);

  const [pendingOrder, setPendingOrder] = useState<SubscriptionOrder | null>(
    null
  );

  const [pendingPaymentUrl, setPendingPaymentUrl] = useState("");

  const [isLoading, setIsLoading] = useState(true);

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);

  const [checkoutForm, setCheckoutForm] = useState<CheckoutForm>({
    scopeType: "village",
    scopeId: "",
  });

  /* ==========================================================
     LOAD PLANS
  ========================================================== */

  const loadPlans = async () => {
    try {
      const response = await api.get("/subscriptions/plans");

      const rawPlans = Array.isArray(response.data) ? response.data : [];

      const sortedPlans = [...rawPlans].sort(
        (a: PricingPlan, b: PricingPlan) => a.price - b.price
      );

      const enrichedPlans = sortedPlans.map((plan: any) => {
        const tier = normalizeTier(plan.tier);

        const isFree = tier === "free";
        const isDesa = tier === "desa";
        const isKecamatan = tier === "kecamatan";

        return {
          ...plan,
          tier,
          name:
            plan.name ||
            (isFree
              ? "Free"
              : isDesa
              ? "Tier Desa"
              : isKecamatan
              ? "Tier Kecamatan"
              : tier),
          description:
            plan.description ||
            (isFree
              ? "Sempurna untuk memulai dan mengeksplorasi platform."
              : isDesa
              ? "Ideal untuk pemantauan level desa dan kelompok tani."
              : "Solusi lengkap untuk analisis agregat level kecamatan."),
          popular: typeof plan.popular === "boolean" ? plan.popular : isDesa,
          frequency: plan.frequency || (isFree ? "/selamanya" : "/bulan"),
          features: Array.isArray(plan.features) ? plan.features : [],
        } as PricingPlan;
      });

      setPricingPlans(enrichedPlans);

      console.log("[Subscription] Plans berhasil dimuat:", enrichedPlans);
    } catch (error: any) {
      console.error("[Subscription] Gagal memuat plans:", error);

      throw new Error(
        `Gagal memuat /subscriptions/plans: ${extractApiError(
          error,
          "request gagal"
        )}`
      );
    }
  };

  /* ==========================================================
     LOAD CURRENT SUBSCRIPTION
  ========================================================== */

  const loadCurrentSubscription = async () => {
    try {
      const response = await api.get("/subscriptions/current");

      const data = response.data || null;

      setSubscription(data);

      console.log("[Subscription] Current subscription:", data);
    } catch (error: any) {
      console.error("[Subscription] Gagal memuat current subscription:", error);

      throw new Error(
        `Gagal memuat /subscriptions/current: ${extractApiError(
          error,
          "request gagal"
        )}`
      );
    }
  };

  /* ==========================================================
     LOAD ORDERS
  ========================================================== */

  const loadOrders = async () => {
    try {
      const response = await api.get("/subscription-orders");

      const orders = Array.isArray(response.data?.orders)
        ? response.data.orders
        : [];

      const pendingOrders = orders
        .filter((order: SubscriptionOrder) => order.status === "pending")
        .sort(
          (a: SubscriptionOrder, b: SubscriptionOrder) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

      const nextPendingOrder =
        pendingOrders.length > 0 ? pendingOrders[0] : null;

      setPendingOrder(nextPendingOrder);

      if (nextPendingOrder) {
        setPendingPaymentUrl(getSavedMidtransUrl(nextPendingOrder.id));
      } else {
        setPendingPaymentUrl("");
      }

      console.log("[Subscription] Orders berhasil dimuat:", orders);
    } catch (error: any) {
      console.error("[Subscription] Gagal memuat orders:", error);

      throw new Error(
        `Gagal memuat /subscription-orders: ${extractApiError(
          error,
          "request gagal"
        )}`
      );
    }
  };

  /* ==========================================================
     LOAD ALL DATA
  ========================================================== */

  const loadSubscriptionData = async () => {
    try {
      setIsLoading(true);
      setError("");

      await loadPlans();
      await loadCurrentSubscription();
      await loadOrders();
    } catch (error: any) {
      console.error("[Subscription] LOAD DATA ERROR:", error);

      setError(error?.message || "Gagal memuat informasi subscription.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  useEffect(() => {
    if (!subscription?.end_date || subscription.status !== "active") {
      setCountdownSeconds(null);
      return;
    }

    const updateCountdown = () => {
      const remaining = Math.max(
        0,
        Math.ceil((new Date(subscription.end_date!).getTime() - Date.now()) / 1000)
      );
      setCountdownSeconds(remaining);
    };

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [subscription]);

  /* ==========================================================
     CURRENT TIER
  ========================================================== */

  const currentTier =
    subscription?.status === "active"
      ? normalizeTier(subscription.tier)
      : "free";

  const currentTierLabel =
    currentTier === "desa"
      ? "Tier Desa"
      : currentTier === "kecamatan"
      ? "Tier Kecamatan"
      : "Free";

  const currentScope =
    subscription?.status === "active" ? formatScope(subscription) : null;

  const isActive = subscription?.status === "active";

  /* ==========================================================
     OPEN CHECKOUT
  ========================================================== */

  const openCheckoutModal = (plan: PricingPlan) => {
    const tier = normalizeTier(plan.tier);

    if (tier === "free") {
      return;
    }

    if (user?.role === "admin" || user?.role === "god") {
      setError("Admin dan God tidak dapat membeli subscription.");

      return;
    }

    if (pendingOrder) {
      const pendingTier = normalizeTier(pendingOrder.tier);

      if (pendingTier !== tier) {
        setError(
          `Anda masih memiliki order pending untuk ${
            pendingTier === "desa" ? "Tier Desa" : "Tier Kecamatan"
          }. Batalkan order tersebut terlebih dahulu.`
        );

        return;
      }
    }

    const defaultScopeType = tier === "desa" ? "village" : "district";

    const existingScopeId =
      pendingOrder && normalizeTier(pendingOrder.tier) === tier
        ? tier === "desa"
          ? pendingOrder.village_id || ""
          : pendingOrder.district_id || ""
        : "";

    setSelectedPlan(plan);

    setCheckoutForm({
      scopeType: defaultScopeType,
      scopeId: existingScopeId,
    });

    setError("");
    setSuccess("");
  };

  /* ==========================================================
     CLOSE CHECKOUT
  ========================================================== */

  const closeCheckoutModal = () => {
    if (actionLoading === "checkout") {
      return;
    }

    setSelectedPlan(null);

    setCheckoutForm({
      scopeType: "village",
      scopeId: "",
    });

    setError("");
  };

  /* ==========================================================
     PENDING MATCH
  ========================================================== */

  const pendingMatchesSelection = (
    tier: string,
    scopeType: "village" | "district",
    scopeId: string
  ) => {
    if (!pendingOrder) {
      return false;
    }

    if (normalizeTier(pendingOrder.tier) !== normalizeTier(tier)) {
      return false;
    }

    if (pendingOrder.scope_type !== scopeType) {
      return false;
    }

    if (scopeType === "village") {
      return pendingOrder.village_id === scopeId;
    }

    return pendingOrder.district_id === scopeId;
  };

  /* ==========================================================
     CHECKOUT
  ========================================================== */

  const handleCheckout = async () => {
    if (!selectedPlan) {
      return;
    }

    const tier = normalizeTier(selectedPlan.tier);

    const requiredScopeType = tier === "desa" ? "village" : "district";

    const trimmedScopeId = checkoutForm.scopeId.trim();

    if (!trimmedScopeId) {
      setError(
        tier === "desa" ? "Village ID wajib diisi." : "District ID wajib diisi."
      );

      return;
    }

    if (checkoutForm.scopeType !== requiredScopeType) {
      setError("Jenis cakupan tidak sesuai dengan paket.");

      return;
    }

    try {
      setActionLoading("checkout");

      setError("");
      setSuccess("");

      let order: SubscriptionOrder | null = null;

      if (pendingMatchesSelection(tier, requiredScopeType, trimmedScopeId)) {
        order = pendingOrder;
      }

      if (order?.external_order_id) {
        const savedUrl = getSavedMidtransUrl(order.id);

        if (savedUrl) {
          setSelectedPlan(null);
          window.location.assign(savedUrl);
          return;
        }

        setError(
          "Order ini sudah memiliki transaksi Midtrans, tetapi link pembayaran tidak tersimpan di browser ini. Batalkan order lalu buat order baru."
        );

        return;
      }

      if (!order) {
        if (pendingOrder) {
          setError(
            "Masih ada order pending. Selesaikan atau batalkan order tersebut terlebih dahulu."
          );

          return;
        }

        const payload = {
          tier,
          scope_type: requiredScopeType,
          village_id: requiredScopeType === "village" ? trimmedScopeId : null,
          district_id: requiredScopeType === "district" ? trimmedScopeId : null,
          billing_cycle: "monthly",
        };

        const orderResponse = await api.post("/subscription-orders", payload);

        order = orderResponse.data;

        if (!order?.id) {
          throw new Error("Backend tidak mengembalikan ID order.");
        }

        setPendingOrder(order);
      }

      const checkoutResponse = await api.post(
        `/subscription-orders/${order.id}/checkout`
      );

      const checkout = checkoutResponse.data;

      if (!checkout?.redirect_url) {
        throw new Error("Backend tidak mengembalikan redirect_url Midtrans.");
      }

      saveMidtransUrl(order.id, checkout.redirect_url);

      setPendingPaymentUrl(checkout.redirect_url);

      setSelectedPlan(null);

      window.location.assign(checkout.redirect_url);
    } catch (error: any) {
      console.error("[Subscription] Gagal checkout:", error);

      setError(extractApiError(error, "Gagal membuat transaksi pembayaran."));
    } finally {
      setActionLoading(null);
    }
  };

  /* ==========================================================
     OPEN SAVED PAYMENT
  ========================================================== */

  const openSavedPayment = () => {
    if (!pendingOrder) {
      return;
    }

    const savedUrl = getSavedMidtransUrl(pendingOrder.id);

    if (!savedUrl) {
      setError("Link pembayaran tidak tersedia di browser ini.");

      return;
    }

    setPendingPaymentUrl(savedUrl);

    window.location.assign(savedUrl);
  };

  /* ==========================================================
     RESUME PENDING
  ========================================================== */

  const resumePendingOrder = () => {
    if (!pendingOrder) {
      return;
    }

    const matchingPlan = pricingPlans.find(
      (plan) => normalizeTier(plan.tier) === normalizeTier(pendingOrder.tier)
    );

    if (!matchingPlan) {
      setError("Paket dari order pending tidak ditemukan.");

      return;
    }

    const tier = normalizeTier(pendingOrder.tier);

    setSelectedPlan(matchingPlan);

    setCheckoutForm({
      scopeType: tier === "desa" ? "village" : "district",

      scopeId:
        tier === "desa"
          ? pendingOrder.village_id || ""
          : pendingOrder.district_id || "",
    });

    setError("");
    setSuccess("");
  };

  /* ==========================================================
     CANCEL PENDING
  ========================================================== */

  const handleCancelPendingOrder = async () => {
    if (!pendingOrder?.id) {
      return;
    }

    try {
      setActionLoading("cancel");

      setError("");
      setSuccess("");

      await api.post(`/subscription-orders/${pendingOrder.id}/cancel`);

      removeSavedMidtransUrl(pendingOrder.id);

      setPendingOrder(null);
      setPendingPaymentUrl("");
      setSelectedPlan(null);

      await loadOrders();

      setSuccess("Order pending berhasil dibatalkan.");
    } catch (error: any) {
      console.error("[Subscription] Gagal cancel:", error);

      setError(extractApiError(error, "Gagal membatalkan order."));
    } finally {
      setActionLoading(null);
    }
  };

  /* ==========================================================
     SYNC PAYMENT
  ========================================================== */

  const refreshSubscription = async () => {
    try {
      setActionLoading("refresh");

      setError("");
      setSuccess("");

      if (pendingOrder?.id && pendingOrder.external_order_id) {
        const response = await api.post(
          `/subscription-orders/${pendingOrder.id}/sync-payment`
        );

        console.log("[Subscription] Sync payment:", response.data);

        if (response.data?.success) {
          removeSavedMidtransUrl(pendingOrder.id);

          setSuccess("Pembayaran berhasil dikonfirmasi.");
        } else {
          setSuccess(
            response.data?.message || "Status pembayaran belum berubah."
          );
        }
      }

      await loadSubscriptionData();
      await refreshCurrentUser();
    } catch (error: any) {
      console.error("[Subscription] Gagal sinkronisasi pembayaran:", error);

      setError(extractApiError(error, "Gagal mengecek status pembayaran."));
    } finally {
      setActionLoading(null);
    }
  };

  /* ==========================================================
     LOADING
  ========================================================== */

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#F4F5F2] text-[#151515]">
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="flex items-center gap-3 text-[#555750]">
            <Loader2 className="h-5 w-5 animate-spin" />

            <span className="text-sm font-medium">
              Memuat informasi subscription...
            </span>
          </div>
        </div>
      </main>
    );
  }

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <main className="min-h-screen bg-[#F4F5F2] text-[#151515]">
      <div className="mx-auto max-w-[1440px] px-5 py-7 sm:px-7 lg:px-10 lg:py-10">
        {/* ====================================================
            HEADER
        ==================================================== */}

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
            ease: [0.22, 1, 0.36, 1],
          }}
          className="mb-8"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="max-w-3xl text-[34px] font-bold leading-[1.05] tracking-[-0.045em] text-[#111111] sm:text-[42px]">
                Pilih paket yang <span className="text-[#171717]">sesuai</span>{" "}
                kebutuhan Anda.
              </h1>

            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 border border-[#D8DAD4] bg-white px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#595B55]">
                <Gem className="h-3.5 w-3.5 text-[#666861]" strokeWidth={1.8} />
                Paket {currentTierLabel}
              </span>

              <span className="inline-flex items-center border border-[#D8DAD4] bg-white px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#777972]">
                Billing Bulanan
              </span>
            </div>
          </div>
        </motion.header>

        {/* ====================================================
            ALERTS
        ==================================================== */}

        {error && (
          <motion.div
            initial={{
              opacity: 0,
              y: 8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="mb-5 flex items-start gap-3 border border-[#E7D0CC] bg-[#FFF7F5] px-5 py-4 text-sm font-medium text-[#9B3E32]"
          >
            <AlertCircle
              className="mt-0.5 h-4 w-4 shrink-0"
              strokeWidth={1.75}
            />

            <span className="flex-1">{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="text-[#C27B72] transition-colors hover:text-[#9B3E32]"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{
              opacity: 0,
              y: 8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="mb-5 flex items-start gap-3 border border-[#D8DDD0] bg-[#F7F9F4] px-5 py-4 text-sm font-medium text-[#5D664F]"
          >
            <CheckCircle2
              className="mt-0.5 h-4 w-4 shrink-0"
              strokeWidth={1.75}
            />

            <span className="flex-1">{success}</span>

            <button
              type="button"
              onClick={() => setSuccess("")}
              className="text-[#969D8A] hover:text-[#5D664F]"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}

        {/* ====================================================
            CURRENT SUBSCRIPTION (COMPACT, SQUARE)
        ==================================================== */}

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
            ease: [0.22, 1, 0.36, 1],
          }}
          aria-label="Ringkasan subscription"
          className="relative mb-5 overflow-hidden rounded-none border border-[#DCDDD8] bg-white"
        >
          {/* accent bar kiri: tumbuh dari atas ke bawah */}

          <motion.span
            aria-hidden="true"
            initial={{
              scaleY: 0,
            }}
            animate={{
              scaleY: 1,
            }}
            transition={{
              duration: 0.6,
              delay: 0.15,
              ease: [0.22, 1, 0.36, 1],
            }}
            style={{
              originY: 0,
            }}
            className={`absolute inset-y-0 left-0 w-[3px] ${
              isActive ? "bg-[#76B900]" : "bg-[#C5C7C1]"
            }`}
          />

          {/* garis tipis atas: menyapu dari kiri ke kanan */}

          {isActive && (
            <motion.span
              aria-hidden="true"
              initial={{
                scaleX: 0,
              }}
              animate={{
                scaleX: 1,
              }}
              transition={{
                duration: 0.9,
                delay: 0.2,
                ease: [0.22, 1, 0.36, 1],
              }}
              style={{
                originX: 0,
              }}
              className="absolute inset-x-0 top-0 h-px bg-[#76B900]/70"
            />
          )}

          <motion.div
            variants={overviewContainer}
            initial="hidden"
            animate="show"
            className="flex flex-wrap items-center py-4 pl-6 pr-5 lg:flex-nowrap"
          >
            {/* STATUS */}

            <motion.div variants={overviewItem} className="order-1 min-w-0">
              <p className="text-[11px] font-medium text-[#8A8C85]">
                Paket saat ini
              </p>

              <div className="mt-0.5 flex items-center gap-2.5">
                <p className="truncate text-sm font-semibold text-[#171717]">
                  {currentTierLabel}
                </p>

                <span
                  className={`inline-flex h-5 items-center rounded-none px-2 text-[10px] font-bold uppercase tracking-[0.12em] ${
                    isActive
                      ? "bg-[#76B900] text-[#0F1A00]"
                      : "bg-[#EEEFEA] text-[#666861]"
                  }`}
                >
                  {isActive ? "Aktif" : "Free"}
                </span>
              </div>
            </motion.div>

            {/* REFRESH */}

            <motion.button
              variants={overviewItem}
              type="button"
              onClick={refreshSubscription}
              disabled={actionLoading === "refresh"}
              aria-label="Perbarui status subscription"
              className="group order-2 ml-auto inline-flex h-8 items-center gap-1.5 rounded-none border border-[#DCDDD8] bg-white px-3 text-xs font-semibold text-[#3F413B] transition-colors duration-200 hover:border-[#171717] hover:bg-[#171717] hover:text-white disabled:cursor-not-allowed disabled:opacity-50 lg:order-3 lg:ml-6"
            >
              {actionLoading === "refresh" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw
                  className="h-3.5 w-3.5 transition-transform duration-500 group-hover:rotate-180"
                  strokeWidth={1.8}
                />
              )}
              Perbarui
            </motion.button>

            {/* DETAILS */}

            <dl className="order-3 mt-3 grid w-full grid-cols-2 gap-x-6 gap-y-3 border-t border-[#EEEFEA] pt-3 sm:grid-cols-3 lg:order-2 lg:ml-8 lg:mt-0 lg:w-auto lg:flex-1 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <motion.div variants={overviewItem} className="min-w-0">
                <dt className="text-[11px] font-medium text-[#8A8C85]">
                  Siklus billing
                </dt>

                <dd className="mt-0.5 truncate text-sm font-semibold text-[#171717]">
                  {subscription?.billing_cycle === "yearly"
                    ? "Tahunan"
                    : "Bulanan"}
                </dd>
              </motion.div>

              <motion.div
                variants={overviewItem}
                className="min-w-0 lg:border-l lg:border-[#EEEFEA] lg:pl-6"
              >
                <dt className="text-[11px] font-medium text-[#8A8C85]">
                  Cakupan
                </dt>

                <dd className="mt-0.5 truncate text-sm font-semibold text-[#171717]">
                  {currentScope
                    ? `${currentScope.label.replace("Cakupan ", "")} — ${currentScope.value}`
                    : "Publik"}
                </dd>
              </motion.div>

              <motion.div
                variants={overviewItem}
                className="min-w-0 lg:border-l lg:border-[#EEEFEA] lg:pl-6"
              >
                <dt className="text-[11px] font-medium text-[#8A8C85]">
                  Berlaku hingga
                </dt>

                <dd
                  className={`mt-0.5 truncate text-sm font-semibold tabular-nums ${
                    countdownSeconds !== null && countdownSeconds <= 86400
                      ? "bg-red-50 px-1 text-red-600"
                      : "text-[#171717]"
                  }`}
                >
                  {isActive && subscription?.end_date &&
                  countdownSeconds !== null &&
                  countdownSeconds !== null
                    ? countdownSeconds <= 86400
                      ? `Sisa ${formatCountdown(countdownSeconds)}`
                      : formatDate(subscription.end_date)
                    : "—"}
                </dd>
              </motion.div>
            </dl>
          </motion.div>
        </motion.section>

        {/* ====================================================
            PENDING ORDER
        ==================================================== */}

        {pendingOrder && (
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
            }}
            className="mb-6 overflow-hidden border border-[#DCDDD8] bg-white"
          >
            <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center border border-[#E1E2DD] bg-[#F7F8F5]">
                    <CreditCard
                      className="h-3.5 w-3.5 text-[#666861]"
                      strokeWidth={1.8}
                    />
                  </span>

                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#777972]">
                    Pembayaran Pending
                  </span>
                </div>

                <h2 className="text-lg font-bold tracking-[-0.025em] text-[#1A1A1A]">
                  {normalizeTier(pendingOrder.tier) === "desa"
                    ? "Tier Desa"
                    : "Tier Kecamatan"}
                </h2>

                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-medium text-[#73776A]">
                  <span>{formatPrice(pendingOrder.amount)} / bulan</span>

                  <span className="h-1 w-1 bg-[#B7BDB0]" />

                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" />

                    {pendingOrder.scope_type === "village"
                      ? pendingOrder.village_id || "-"
                      : pendingOrder.district_id || "-"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                {pendingPaymentUrl ? (
                  <button
                    type="button"
                    onClick={openSavedPayment}
                    className="inline-flex items-center justify-center gap-2 bg-[#171717] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#2B2B2B]"
                  >
                    <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.8} />
                    Buka Pembayaran
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={resumePendingOrder}
                    className="inline-flex items-center justify-center gap-2 bg-[#171717] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#2B2B2B]"
                  >
                    <CreditCard className="h-3.5 w-3.5" strokeWidth={1.8} />
                    Lihat Order
                  </button>
                )}

                <button
                  type="button"
                  disabled={actionLoading === "cancel"}
                  onClick={handleCancelPendingOrder}
                  className="inline-flex items-center justify-center gap-2 border border-[#DCDDD8] bg-white px-5 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[#555750] transition-colors hover:bg-[#F8F8F6] disabled:opacity-50"
                >
                  {actionLoading === "cancel" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <X className="h-3.5 w-3.5" strokeWidth={1.8} />
                  )}
                  Batalkan
                </button>
              </div>
            </div>
          </motion.section>
        )}

        {/* ====================================================
            PRICING
        ==================================================== */}

        <section className="mb-9">
          <div className="mb-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#999B94]">
              Pricing
            </p>

            <h2 className="mt-1 text-2xl font-bold tracking-[-0.04em] text-[#171717]">
              Pilih paket Anda
            </h2>

            <p className="mt-2 text-xs font-medium text-[#858780]">
              Setiap paket dirancang berdasarkan cakupan penggunaan dan
              kebutuhan data.
            </p>
          </div>

          {pricingPlans.length === 0 ? (
            <motion.section
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="border border-dashed border-[#DCDDD8] bg-white px-6 py-16 text-center"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center border border-[#E1E2DD] bg-[#F8F9F6]">
                <Gem className="h-5 w-5 text-[#777972]" strokeWidth={1.7} />
              </div>

              <h2 className="mt-4 text-base font-bold text-[#1B1B1B]">
                Paket belum tersedia
              </h2>

              <p className="mx-auto mt-2 max-w-md text-xs font-medium leading-5 text-[#858780]">
                Belum ada konfigurasi paket yang tersedia dari server.
              </p>
            </motion.section>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {pricingPlans.map((plan, index) => {
                const tier = normalizeTier(plan.tier);

                const isCurrent = tier === currentTier;

                const isPopular = plan.popular;

                const style = tierStyles[tier] || tierStyles.free;

                const hasPendingForPlan =
                  pendingOrder && normalizeTier(pendingOrder.tier) === tier;

                return (
                  <motion.article
                    key={`${tier}-${index}`}
                    initial={{
                      opacity: 0,
                      y: 12,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      duration: 0.45,
                      delay: index * 0.06,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className={`group relative flex min-h-[560px] flex-col overflow-hidden border transition-all duration-300 ${
                      isPopular
                        ? "border-[#171717] bg-[#171717] text-white shadow-[0_20px_45px_rgba(0,0,0,0.10)]"
                        : isCurrent
                        ? "border-[#C7CCC0] bg-white shadow-[0_12px_30px_rgba(0,0,0,0.045)]"
                        : "border-[#DCDDD8] bg-white shadow-[0_8px_25px_rgba(0,0,0,0.025)] hover:-translate-y-0.5 hover:border-[#C8CAC4] hover:shadow-[0_16px_35px_rgba(0,0,0,0.06)]"
                    }`}
                  >
                    {/* ==================================================
                          3D BACKGROUND
                      ================================================== */}

                    <PlanGeometry variant={index} dark={isPopular} />

                    {/* subtle top line */}

                    {isPopular && (
                      <div className="absolute inset-x-0 top-0 z-20 h-1 bg-[#76B900]" />
                    )}

                    {/* ==================================================
                          PLAN HEADER
                      ================================================== */}

                    <div className="relative z-10 p-6">
                      <div className="flex items-center justify-between gap-3">
                        <span
                          className={`inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] ${
                            isPopular ? "text-white/70" : "text-[#666861]"
                          }`}
                        >
                          {style.icon}

                          {style.label}
                        </span>

                        <div className="flex items-center gap-2">
                          {isPopular && (
                            <span className="border border-white/10 bg-white/[0.06] px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.1em] text-white">
                              Populer
                            </span>
                          )}

                          {isCurrent && (
                            <span
                              className={`px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.1em] ${
                                isPopular
                                  ? "border border-white/10 bg-white/[0.06] text-white"
                                  : "border border-[#E0E2DC] bg-[#F7F8F5] text-[#666861]"
                              }`}
                            >
                              Aktif
                            </span>
                          )}

                          {!isCurrent && hasPendingForPlan && (
                            <span className="border border-[#E8D9B6] bg-[#FFF9EA] px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.1em] text-[#906D16]">
                              Pending
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-9">
                        <p
                          className={`text-[10px] font-bold uppercase tracking-[0.16em] ${
                            isPopular ? "text-white/40" : "text-[#999B94]"
                          }`}
                        >
                          Paket
                        </p>

                        <h3
                          className={`mt-1.5 text-2xl font-bold tracking-[-0.04em] ${
                            isPopular ? "text-white" : "text-[#171717]"
                          }`}
                        >
                          {plan.name}
                        </h3>

                        <p
                          className={`mt-2 max-w-sm text-xs font-medium leading-5 ${
                            isPopular ? "text-white/55" : "text-[#858780]"
                          }`}
                        >
                          {plan.description}
                        </p>
                      </div>

                      <div className="mt-8">
                        <p
                          className={`text-[10px] font-bold uppercase tracking-[0.16em] ${
                            isPopular ? "text-white/40" : "text-[#999B94]"
                          }`}
                        >
                          Harga
                        </p>

                        <div className="mt-1 flex items-end gap-2">
                          <span
                            className={`text-3xl font-bold tracking-[-0.05em] ${
                              isPopular ? "text-white" : "text-[#171717]"
                            }`}
                          >
                            {formatPrice(plan.price)}
                          </span>

                          {plan.price > 0 && (
                            <span
                              className={`mb-1 text-xs font-medium ${
                                isPopular ? "text-white/40" : "text-[#999B94]"
                              }`}
                            >
                              / bulan
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ==================================================
                          DIVIDER
                      ================================================== */}

                    <div
                      className={`relative z-10 mx-6 border-t ${
                        isPopular ? "border-white/10" : "border-[#E7E8E3]"
                      }`}
                    />

                    {/* ==================================================
                          FEATURES
                      ================================================== */}

                    <div className="relative z-10 flex-1 p-6">
                      <p
                        className={`text-[10px] font-bold uppercase tracking-[0.16em] ${
                          isPopular ? "text-white/40" : "text-[#999B94]"
                        }`}
                      >
                        Fitur termasuk
                      </p>

                      <ul className="mt-5 space-y-3.5">
                        {(plan.features || []).map((feature, featureIndex) => (
                          <li
                            key={`${feature}-${featureIndex}`}
                            className="flex items-start gap-3"
                          >
                            <span
                              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center ${
                                isPopular
                                  ? "border border-white/10 bg-white/[0.06] text-white"
                                  : "border border-[#E0E1DC] bg-[#F7F8F5] text-[#666861]"
                              }`}
                            >
                              <CheckCircle2
                                className="h-3.5 w-3.5"
                                strokeWidth={1.9}
                              />
                            </span>

                            <span
                              className={`text-xs font-medium leading-5 ${
                                isPopular ? "text-white/75" : "text-[#4E504A]"
                              }`}
                            >
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* ==================================================
                          CTA
                      ================================================== */}

                    <div className="relative z-10 p-6 pt-0">
                      {isCurrent ? (
                        <button
                          type="button"
                          disabled
                          className={`w-full border px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.08em] ${
                            isPopular
                              ? "cursor-not-allowed border-white/10 bg-white/[0.05] text-white/35"
                              : "cursor-not-allowed border-[#E0E2DC] bg-[#F7F8F5] text-[#9A9C95]"
                          }`}
                        >
                          Paket Anda Saat Ini
                        </button>
                      ) : tier === "free" ? (
                        <button
                          type="button"
                          disabled
                          className="w-full cursor-not-allowed border border-[#E0E2DC] bg-[#F7F8F5] px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#9A9C95]"
                        >
                          Paket Gratis
                        </button>
                      ) : hasPendingForPlan ? (
                        <SweepButton
                          tone={isPopular ? "light" : "dark"}
                          onClick={resumePendingOrder}
                        >
                          Kelola Pembayaran
                          <ArrowRight
                            className="h-3.5 w-3.5 transition-transform duration-500 ease-out group-hover/sweep:translate-x-1"
                            strokeWidth={2}
                          />
                        </SweepButton>
                      ) : (
                        <SweepButton
                          tone={isPopular ? "light" : "dark"}
                          disabled={Boolean(pendingOrder)}
                          onClick={() => openCheckoutModal(plan)}
                        >
                          {pendingOrder
                            ? "Selesaikan Order Pending"
                            : "Upgrade Sekarang"}

                          <ArrowRight
                            className="h-3.5 w-3.5 transition-transform duration-500 ease-out group-hover/sweep:translate-x-1"
                            strokeWidth={2}
                          />
                        </SweepButton>
                      )}
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}
        </section>

        {/* ====================================================
            TRUST
        ==================================================== */}

        <section className="mb-9">
          <motion.div
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
            }}
            className="mb-5"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#999B94]">
              Platform
            </p>

            <h2 className="mt-1 text-xl font-bold tracking-[-0.03em] text-[#171717]">
              Dirancang untuk penggunaan nyata
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <TrustCard
              icon={Shield}
              title="Pembayaran Aman"
              description="Transaksi melalui Midtrans"
              delay={0.08}
            />

            <TrustCard
              icon={MapPin}
              title="Akses Geografis"
              description="Data sesuai cakupan subscription"
              delay={0.12}
            />

            <TrustCard
              icon={Headphones}
              title="Dukungan Aktif"
              description="Bantuan saat dibutuhkan"
              delay={0.16}
            />

            <TrustCard
              icon={Users}
              title="Fleksibel"
              description="Paket dapat disesuaikan"
              delay={0.2}
            />
          </div>
        </section>

        {/* ====================================================
            FAQ
        ==================================================== */}

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
          }}
          className="border border-[#DCDDD8] bg-white"
        >
          <div className="border-b border-[#E7E8E3] px-6 py-5">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#999B94]">
              <Building2
                className="h-3.5 w-3.5 text-[#777972]"
                strokeWidth={1.8}
              />
              Help Center
            </div>

            <h2 className="text-lg font-bold tracking-[-0.03em] text-[#171717]">
              Pertanyaan Umum
            </h2>
          </div>

          <div className="grid md:grid-cols-2">
            {[
              {
                q: "Bagaimana cara upgrade paket?",
                a: "Pilih paket, tentukan cakupan wilayah, lalu buat order dan lanjutkan ke pembayaran Midtrans.",
              },
              {
                q: "Kapan subscription menjadi aktif?",
                a: "Subscription aktif setelah pembayaran berhasil diverifikasi oleh backend.",
              },
              {
                q: "Bagaimana jika pembayaran belum selesai?",
                a: "Order tetap pending dan dapat dilanjutkan atau dibatalkan.",
              },
              {
                q: "Mengapa saya tidak bisa memilih paket lain?",
                a: "Satu order pending aktif dipertahankan agar transaksi tidak bertabrakan.",
              },
            ].map((faq, index) => (
              <motion.div
                key={faq.q}
                initial={{
                  opacity: 0,
                  y: 8,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.4,
                  delay: 0.22 + index * 0.04,
                }}
                className={`p-6 ${
                  index % 2 === 0 ? "md:border-r md:border-[#E7E8E3]" : ""
                } ${index < 2 ? "border-b border-[#E7E8E3]" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-[#E0E1DC] bg-[#F7F8F5]">
                    <CheckCircle2
                      className="h-3.5 w-3.5 text-[#666861]"
                      strokeWidth={1.75}
                    />
                  </span>

                  <div>
                    <h3 className="text-xs font-bold text-[#1A1A1A]">
                      {faq.q}
                    </h3>

                    <p className="mt-1.5 text-xs font-medium leading-5 text-[#858780]">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <p className="mt-5 text-center text-[10px] font-medium text-[#A1A39C]">
          Harga dan fitur mengikuti konfigurasi paket terbaru dari server.
        </p>
      </div>

      {/* ======================================================
          CHECKOUT MODAL
      ====================================================== */}

      {selectedPlan && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.98,
              y: 10,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            transition={{
              duration: 0.2,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="w-full max-w-lg overflow-hidden border border-[#DCDDD8] bg-white shadow-[0_30px_90px_-30px_rgba(0,0,0,0.35)]"
          >
            {/* MODAL HEADER */}

            <div className="flex items-start justify-between gap-4 border-b border-[#E6E7E2] px-6 py-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#999B94]">
                  Checkout Subscription
                </p>

                <h2 className="mt-1 text-xl font-bold tracking-[-0.03em] text-[#171717]">
                  {selectedPlan.name}
                </h2>

                <p className="mt-1 text-sm font-medium text-[#858780]">
                  {formatPrice(selectedPlan.price)} / bulan
                </p>
              </div>

              <button
                type="button"
                onClick={closeCheckoutModal}
                disabled={actionLoading === "checkout"}
                className="flex h-9 w-9 items-center justify-center border border-[#E0E1DC] bg-[#FAFAF8] text-[#777972] transition-colors hover:bg-[#F2F3EF] hover:text-[#171717] disabled:opacity-50"
              >
                <X className="h-4 w-4" strokeWidth={1.8} />
              </button>
            </div>

            <div className="space-y-5 px-6 py-6">
              {/* SCOPE */}

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#999B94]">
                  Cakupan Wilayah
                </p>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={normalizeTier(selectedPlan.tier) !== "desa"}
                    onClick={() =>
                      setCheckoutForm((current) => ({
                        ...current,
                        scopeType: "village",
                      }))
                    }
                    className={`border px-4 py-3 text-left transition ${
                      checkoutForm.scopeType === "village" &&
                      normalizeTier(selectedPlan.tier) === "desa"
                        ? "border-[#BFC4B8] bg-[#F7F8F5] text-[#171717]"
                        : "border-[#E1E2DD] bg-white text-[#999B94]"
                    }`}
                  >
                    <p className="text-xs font-bold">Desa</p>

                    <p className="mt-1 text-[10px] text-[#A0A29B]">
                      village_id
                    </p>
                  </button>

                  <button
                    type="button"
                    disabled={normalizeTier(selectedPlan.tier) !== "kecamatan"}
                    onClick={() =>
                      setCheckoutForm((current) => ({
                        ...current,
                        scopeType: "district",
                      }))
                    }
                    className={`border px-4 py-3 text-left transition ${
                      checkoutForm.scopeType === "district" &&
                      normalizeTier(selectedPlan.tier) === "kecamatan"
                        ? "border-[#BFC4B8] bg-[#F7F8F5] text-[#171717]"
                        : "border-[#E1E2DD] bg-white text-[#999B94]"
                    }`}
                  >
                    <p className="text-xs font-bold">Kecamatan</p>

                    <p className="mt-1 text-[10px] text-[#A0A29B]">
                      district_id
                    </p>
                  </button>
                </div>
              </div>

              {/* SCOPE ID */}

              <div>
                <label
                  htmlFor="subscription-scope-id"
                  className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#999B94]"
                >
                  {checkoutForm.scopeType === "village"
                    ? "Village ID"
                    : "District ID"}
                </label>

                <input
                  id="subscription-scope-id"
                  type="text"
                  value={checkoutForm.scopeId}
                  onChange={(event) =>
                    setCheckoutForm((current) => ({
                      ...current,
                      scopeId: event.target.value,
                    }))
                  }
                  placeholder={
                    checkoutForm.scopeType === "village"
                      ? "Contoh: Halmahera"
                      : "Contoh: Pangandaran"
                  }
                  className="mt-2 h-11 w-full border border-[#DCDDD8] bg-[#FAFAF8] px-4 text-sm font-medium text-[#171717] outline-none transition-all placeholder:text-[#A0A29B] focus:border-[#BFC4B8] focus:bg-white focus:ring-4 focus:ring-black/[0.03]"
                />
              </div>

              {/* TOTAL */}

              <div className="border border-[#E0E1DC] bg-[#F7F8F5] p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-medium text-[#858780]">
                    Total pembayaran
                  </span>

                  <span className="text-lg font-bold text-[#171717]">
                    {formatPrice(selectedPlan.price)}
                  </span>
                </div>

                <p className="mt-1 text-[10px] font-medium text-[#A0A29B]">
                  Billing bulanan
                </p>
              </div>

              {/* PAYMENT ACTION */}

              {pendingOrder?.external_order_id && pendingPaymentUrl ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={openSavedPayment}
                    className="inline-flex items-center justify-center gap-2 bg-[#171717] px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#2B2B2B]"
                  >
                    <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.8} />
                    Buka Pembayaran
                  </button>

                  <button
                    type="button"
                    onClick={handleCancelPendingOrder}
                    disabled={actionLoading === "cancel"}
                    className="inline-flex items-center justify-center gap-2 border border-[#DCDDD8] bg-white px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#555750] disabled:opacity-50"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={1.8} />
                    Batalkan
                  </button>
                </div>
              ) : pendingOrder?.external_order_id ? (
                <button
                  type="button"
                  onClick={handleCancelPendingOrder}
                  disabled={actionLoading === "cancel"}
                  className="inline-flex w-full items-center justify-center gap-2 bg-[#171717] px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.08em] text-white disabled:opacity-50"
                >
                  {actionLoading === "cancel" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <X className="h-3.5 w-3.5" strokeWidth={1.8} />
                  )}
                  Batalkan Order & Buat Baru
                </button>
              ) : (
                <SweepButton
                  tone="dark"
                  disabled={actionLoading === "checkout"}
                  onClick={handleCheckout}
                >
                  {actionLoading === "checkout" ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Menyiapkan Pembayaran...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-3.5 w-3.5" strokeWidth={1.8} />
                      Lanjut ke Pembayaran
                      <ArrowRight
                        className="h-3.5 w-3.5 transition-transform duration-500 ease-out group-hover/sweep:translate-x-1"
                        strokeWidth={2}
                      />
                    </>
                  )}
                </SweepButton>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
}
