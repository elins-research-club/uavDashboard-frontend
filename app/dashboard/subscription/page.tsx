"use client";

import { useEffect, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { motion } from "framer-motion";
import { useUserRole } from "@/context/UserRoleContext";
import api from "@/lib/api";

import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Crown,
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
  badgeBg: string;
  badgeText: string;
  icon: ReactNode;
  label: string;
  orbTint: string;
};

const tierStyles: Record<string, TierStyle> = {
  free: {
    badgeBg: "bg-brand-50",
    badgeText: "text-brand-800",
    icon: <Star className="h-3.5 w-3.5" strokeWidth={1.75} />,
    label: "Free",
    orbTint: "#8cc7a5",
  },

  desa: {
    badgeBg: "bg-[#e7efc4]",
    badgeText: "text-[#4a5f0e]",
    icon: <Zap className="h-3.5 w-3.5" strokeWidth={1.75} />,
    label: "Desa",
    orbTint: "#91b928",
  },

  kecamatan: {
    badgeBg: "bg-[#fbe8c2]",
    badgeText: "text-[#8a5a06]",
    icon: <Crown className="h-3.5 w-3.5" strokeWidth={1.75} />,
    label: "Kecamatan",
    orbTint: "#d99a2b",
  },
};

/* ============================================================
   ORB
============================================================ */

function PlanOrb({ tint, dark = false }: { tint: string; dark?: boolean }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute -right-8 -top-8 h-28 w-28"
    >
      <div
        className={`absolute -inset-5 rounded-full blur-xl ${
          dark ? "opacity-20" : "opacity-30"
        }`}
        style={{
          background: `${tint}35`,
        }}
      />

      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle at 32% 28%, #ffffffcc 0%, ${tint}40 42%, ${tint}5c 72%, ${tint}73 100%)`,
          boxShadow: `inset -5px -7px 12px ${tint}33, inset 3px 4px 8px rgba(255,255,255,0.75), 0 8px 18px ${tint}25`,
        }}
      />

      <div className="absolute left-[18%] top-[14%] h-4 w-4 rounded-full bg-white/90 blur-[3px]" />
    </div>
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
        y: 12,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{
        y: -3,
      }}
      className="glass p-5 transition-shadow duration-300 hover:shadow-card-hover"
    >
      <div className="flex items-center gap-3">
        <span className="icon-ring h-10 w-10 flex-shrink-0">
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </span>

        <div className="min-w-0">
          <p className="text-sm font-bold text-brand-900">{title}</p>

          <p className="mt-0.5 text-xs font-medium text-brand-800/55">
            {description}
          </p>
        </div>
      </div>
    </motion.div>
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
   PAGE
============================================================ */

export default function SubscriptionPage() {
  const { user, refreshCurrentUser } = useUserRole();

  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);

  const [subscription, setSubscription] = useState<Subscription | null>(null);

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

      /*
       * Jangan pakai Promise.all di sini.
       * Kalau satu endpoint gagal, kita ingin tahu
       * endpoint mana yang sebenarnya rusak.
       */

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
      <main className="min-h-screen bg-page text-brand-900">
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="flex items-center gap-3 text-brand-800">
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
    <main className="min-h-screen bg-page text-brand-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* HEADER */}

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
              <h1 className="mt-4 text-3xl font-bold tracking-[-0.04em] text-brand-900 sm:text-4xl">
                Kelola <span className="text-brand-600">langganan</span> Anda
              </h1>

              <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-brand-800/60">
                Pilih paket yang sesuai dengan kebutuhan pemetaan, analisis, dan
                kapasitas data lahan Anda.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="liquid-badge px-4 py-2 text-xs font-bold text-brand-800">
                <Gem className="h-3.5 w-3.5" strokeWidth={1.75} />
                Paket {currentTierLabel}
              </span>

              <span className="rounded-full border border-brand-800/10 bg-white/70 px-4 py-2 text-xs font-bold text-brand-800/60 shadow-sm">
                Billing Bulanan
              </span>
            </div>
          </div>
        </motion.header>

        {/* ERROR */}

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
            className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-600"
          >
            <AlertCircle
              className="mt-0.5 h-4 w-4 flex-shrink-0"
              strokeWidth={1.75}
            />

            <span className="flex-1">{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="text-red-400 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}

        {/* SUCCESS */}

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
            className="mb-5 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium text-green-700"
          >
            <CheckCircle2
              className="mt-0.5 h-4 w-4 flex-shrink-0"
              strokeWidth={1.75}
            />

            <span className="flex-1">{success}</span>

            <button
              type="button"
              onClick={() => setSuccess("")}
              className="text-green-400 hover:text-green-600"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}

        {/* CURRENT SUBSCRIPTION */}

        <section className="mb-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-white bg-white p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Status
              </p>

              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    subscription?.status === "active"
                      ? "bg-green-500"
                      : "bg-gray-300"
                  }`}
                />

                <p className="text-lg font-bold capitalize text-brand-900">
                  {subscription?.status === "active" ? "Active" : "Free"}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white bg-white p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Siklus Billing
              </p>

              <p className="mt-2 text-lg font-bold capitalize text-brand-900">
                {subscription?.billing_cycle || "monthly"}
              </p>
            </div>

            <div className="rounded-2xl border border-white bg-white p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Cakupan
              </p>

              <p className="mt-2 text-lg font-bold text-brand-900">
                {currentScope ? currentScope.label : "Publik / Free"}
              </p>

              {currentScope?.value && (
                <p className="mt-1 truncate text-xs font-medium text-brand-800/45">
                  {currentScope.value}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-white bg-white p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Berlaku Hingga
              </p>

              <p className="mt-2 text-lg font-bold text-brand-900">
                {subscription?.end_date
                  ? formatDate(subscription.end_date)
                  : "-"}
              </p>
            </div>
          </div>
        </section>

        {/* REFRESH */}

        <div className="mb-5 flex justify-end">
          <button
            type="button"
            onClick={refreshSubscription}
            disabled={actionLoading === "refresh"}
            className="inline-flex items-center gap-2 rounded-full border border-brand-800/10 bg-white px-4 py-2.5 text-xs font-bold text-brand-800 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {actionLoading === "refresh" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Perbarui Status
          </button>
        </div>

        {/* PENDING ORDER */}

        {pendingOrder && (
          <section className="mb-6">
            <div className="rounded-3xl border border-[#e0edb7] bg-[#f7f9e9] p-5 shadow-sm">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e0edb7] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#4a5f0e]">
                    <CreditCard className="h-3 w-3" />
                    Pembayaran Pending
                  </span>

                  <h2 className="mt-3 text-base font-extrabold text-brand-900">
                    {normalizeTier(pendingOrder.tier) === "desa"
                      ? "Tier Desa"
                      : "Tier Kecamatan"}
                  </h2>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-medium text-brand-800/55">
                    <span>{formatPrice(pendingOrder.amount)} / bulan</span>

                    <span className="h-1 w-1 rounded-full bg-brand-800/20" />

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
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-800 px-5 py-3 text-xs font-bold text-white transition hover:bg-brand-700"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Buka Pembayaran
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={resumePendingOrder}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-800 px-5 py-3 text-xs font-bold text-white transition hover:bg-brand-700"
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      Lihat Order
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={actionLoading === "cancel"}
                    onClick={handleCancelPendingOrder}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-800/10 bg-white px-5 py-3 text-xs font-bold text-brand-800 transition hover:bg-brand-50 disabled:opacity-50"
                  >
                    {actionLoading === "cancel" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <X className="h-3.5 w-3.5" />
                    )}
                    Batalkan
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* PRICING */}

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
            className="glass mb-8 px-6 py-16 text-center"
          >
            <span className="icon-ring mx-auto h-12 w-12">
              <Gem className="h-5 w-5" strokeWidth={1.75} />
            </span>

            <h2 className="mt-4 text-base font-bold text-brand-900">
              Paket belum tersedia
            </h2>

            <p className="mx-auto mt-1.5 max-w-md text-xs font-medium leading-5 text-brand-800/55">
              Belum ada konfigurasi paket yang tersedia dari server.
            </p>
          </motion.section>
        ) : (
          <section className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
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
                    duration: 0.5,
                    delay: index * 0.07 + 0.06,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className={`group relative flex min-h-[520px] flex-col overflow-hidden rounded-3xl p-6 transition-shadow duration-300 ${
                    isPopular
                      ? "bg-brand-800 text-white shadow-card-hover"
                      : "glass text-brand-900 hover:shadow-card-hover"
                  }`}
                >
                  <PlanOrb tint={style.orbTint} dark={isPopular} />

                  <div className="relative mb-7 flex items-center justify-between gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold ${
                        isPopular
                          ? "bg-[#91b928] text-brand-900"
                          : `${style.badgeBg} ${style.badgeText}`
                      }`}
                    >
                      {style.icon}

                      {style.label}
                    </span>

                    {isPopular ? (
                      <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-2xs font-bold uppercase tracking-[0.14em] text-white">
                        Pilihan Populer
                      </span>
                    ) : isCurrent ? (
                      <span className="rounded-full bg-brand-50 px-3 py-1.5 text-2xs font-bold uppercase tracking-[0.14em] text-brand-700">
                        Aktif
                      </span>
                    ) : hasPendingForPlan ? (
                      <span className="rounded-full bg-[#f7e8bd] px-3 py-1.5 text-2xs font-bold uppercase tracking-[0.14em] text-[#8a5a06]">
                        Pending
                      </span>
                    ) : null}
                  </div>

                  <div className="relative">
                    <p
                      className={`micro-label ${
                        isPopular ? "text-white/50" : ""
                      }`}
                    >
                      Paket
                    </p>

                    <h2
                      className={`mt-1 text-2xl font-bold tracking-[-0.035em] ${
                        isPopular ? "text-white" : "text-brand-900"
                      }`}
                    >
                      {plan.name}
                    </h2>

                    <p
                      className={`mt-2 max-w-sm text-xs font-medium leading-5 ${
                        isPopular ? "text-white/65" : "text-brand-800/60"
                      }`}
                    >
                      {plan.description}
                    </p>
                  </div>

                  <div className="relative mt-7">
                    <p
                      className={`micro-label ${
                        isPopular ? "text-white/50" : ""
                      }`}
                    >
                      Harga / Bulan
                    </p>

                    <div className="mt-1 flex items-end gap-2">
                      <span
                        className={`text-3xl font-bold tracking-[-0.04em] ${
                          isPopular ? "text-white" : "text-brand-900"
                        }`}
                      >
                        {formatPrice(plan.price)}
                      </span>

                      {plan.price > 0 && (
                        <span
                          className={`mb-1 text-xs font-semibold ${
                            isPopular ? "text-white/50" : "text-brand-800/50"
                          }`}
                        >
                          per bulan
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    className={`relative my-6 border-t ${
                      isPopular ? "border-white/12" : "border-brand-800/10"
                    }`}
                  />

                  <div className="relative flex-1">
                    <p
                      className={`micro-label ${
                        isPopular ? "text-white/50" : ""
                      }`}
                    >
                      Fitur Termasuk
                    </p>

                    <ul className="mt-4 space-y-3">
                      {(plan.features || []).map((feature, featureIndex) => (
                        <li
                          key={`${feature}-${featureIndex}`}
                          className="flex items-start gap-3"
                        >
                          <span
                            className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
                              isPopular
                                ? "bg-white/10 text-[#91b928]"
                                : "bg-brand-50 text-brand-700"
                            }`}
                          >
                            <CheckCircle2
                              className="h-3.5 w-3.5"
                              strokeWidth={1.9}
                            />
                          </span>

                          <span
                            className={`text-xs font-medium leading-5 ${
                              isPopular ? "text-white/80" : "text-brand-900"
                            }`}
                          >
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="relative mt-8">
                    {isCurrent ? (
                      <button
                        type="button"
                        disabled
                        className={`w-full cursor-not-allowed rounded-full border px-5 py-3 text-xs font-bold ${
                          isPopular
                            ? "border-white/15 bg-white/5 text-white/50"
                            : "border-brand-800/10 bg-brand-50 text-brand-800/45"
                        }`}
                      >
                        Paket Anda Saat Ini
                      </button>
                    ) : tier === "free" ? (
                      <button
                        type="button"
                        disabled
                        className="w-full cursor-not-allowed rounded-full border border-brand-800/10 bg-brand-50 px-5 py-3 text-xs font-bold text-brand-800/45"
                      >
                        Paket Gratis
                      </button>
                    ) : hasPendingForPlan ? (
                      <button
                        type="button"
                        onClick={() => resumePendingOrder()}
                        className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-xs font-bold transition ${
                          isPopular
                            ? "bg-white text-brand-900 hover:bg-[#dfeeb1]"
                            : "bg-brand-800 text-white hover:bg-brand-700"
                        }`}
                      >
                        Kelola Pembayaran
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={Boolean(pendingOrder)}
                        onClick={() => openCheckoutModal(plan)}
                        className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-45 ${
                          isPopular
                            ? "bg-white text-brand-900 hover:bg-[#dfeeb1]"
                            : "bg-brand-800 text-white hover:bg-brand-700"
                        }`}
                      >
                        {pendingOrder
                          ? "Selesaikan Order Pending"
                          : "Upgrade Sekarang"}

                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </motion.article>
              );
            })}
          </section>
        )}

        {/* TRUST */}

        <section className="mb-8">
          <motion.div
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
              delay: 0.22,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mb-5 flex items-center gap-2.5"
          >
            <span className="icon-ring h-9 w-9">
              <Shield className="h-4 w-4" strokeWidth={1.75} />
            </span>

            <div>
              <p className="micro-label">Kepercayaan</p>

              <h2 className="text-base font-bold tracking-[-0.02em] text-brand-900">
                Dirancang untuk penggunaan nyata
              </h2>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <TrustCard
              icon={Shield}
              title="Pembayaran Aman"
              description="Transaksi melalui Midtrans"
              delay={0.26}
            />

            <TrustCard
              icon={MapPin}
              title="Akses Geografis"
              description="Data sesuai cakupan subscription"
              delay={0.3}
            />

            <TrustCard
              icon={Headphones}
              title="Dukungan Aktif"
              description="Bantuan saat dibutuhkan"
              delay={0.34}
            />

            <TrustCard
              icon={Users}
              title="Fleksibel"
              description="Paket dapat disesuaikan"
              delay={0.38}
            />
          </div>
        </section>

        {/* FAQ */}

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
            delay: 0.42,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="glass p-6 sm:p-7"
        >
          <div className="mb-6 flex items-center gap-2.5">
            <span className="icon-ring h-9 w-9">
              <Building2 className="h-4 w-4" strokeWidth={1.75} />
            </span>

            <div>
              <p className="micro-label">Help Center</p>

              <h2 className="text-base font-bold tracking-[-0.02em] text-brand-900">
                Pertanyaan Umum
              </h2>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
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
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.45,
                  delay: 0.46 + index * 0.04,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="rounded-2xl border border-brand-800/8 bg-white/55 p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="icon-ring mt-0.5 h-8 w-8 flex-shrink-0">
                    <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </span>

                  <div>
                    <h3 className="text-xs font-bold text-brand-900">
                      {faq.q}
                    </h3>

                    <p className="mt-1.5 text-xs font-medium leading-5 text-brand-800/60">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <p className="mt-5 text-center text-2xs font-medium text-brand-800/35">
          Harga dan fitur mengikuti konfigurasi paket terbaru dari server.
        </p>
      </div>

      {/* CHECKOUT MODAL */}

      {selectedPlan && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-900/35 p-4 backdrop-blur-sm">
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.97,
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
            className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_30px_90px_-25px_rgba(18,60,40,0.45)]"
          >
            <div className="flex items-start justify-between gap-4 border-b border-brand-800/8 px-6 py-5">
              <div>
                <p className="micro-label">Checkout Subscription</p>

                <h2 className="mt-1 text-xl font-bold tracking-[-0.03em] text-brand-900">
                  {selectedPlan.name}
                </h2>

                <p className="mt-1 text-sm font-medium text-brand-800/55">
                  {formatPrice(selectedPlan.price)} / bulan
                </p>
              </div>

              <button
                type="button"
                onClick={closeCheckoutModal}
                disabled={actionLoading === "checkout"}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-800/60 transition hover:bg-brand-100 hover:text-brand-900 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-brand-800/45">
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
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      checkoutForm.scopeType === "village" &&
                      normalizeTier(selectedPlan.tier) === "desa"
                        ? "border-brand-800 bg-brand-800/5 text-brand-900"
                        : "border-gray-200 bg-white text-gray-500"
                    }`}
                  >
                    <p className="text-xs font-bold">Desa</p>

                    <p className="mt-0.5 text-[11px] text-gray-400">
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
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      checkoutForm.scopeType === "district" &&
                      normalizeTier(selectedPlan.tier) === "kecamatan"
                        ? "border-brand-800 bg-brand-800/5 text-brand-900"
                        : "border-gray-200 bg-white text-gray-500"
                    }`}
                  >
                    <p className="text-xs font-bold">Kecamatan</p>

                    <p className="mt-0.5 text-[11px] text-gray-400">
                      district_id
                    </p>
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="subscription-scope-id"
                  className="text-xs font-bold uppercase tracking-wider text-brand-800/45"
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
                  className="mt-2 w-full rounded-2xl border border-brand-800/10 bg-white px-4 py-3 text-sm font-medium text-brand-900 outline-none transition placeholder:text-gray-300 focus:border-brand-800/30 focus:ring-4 focus:ring-brand-800/5"
                />
              </div>

              <div className="rounded-2xl bg-page p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-medium text-brand-800/55">
                    Total pembayaran
                  </span>

                  <span className="text-lg font-bold text-brand-900">
                    {formatPrice(selectedPlan.price)}
                  </span>
                </div>

                <p className="mt-1 text-2xs text-brand-800/40">
                  Billing bulanan
                </p>
              </div>

              {pendingOrder?.external_order_id && pendingPaymentUrl ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={openSavedPayment}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-800 px-5 py-3.5 text-xs font-bold text-white transition hover:bg-brand-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Buka Pembayaran
                  </button>

                  <button
                    type="button"
                    onClick={handleCancelPendingOrder}
                    disabled={actionLoading === "cancel"}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-800/10 bg-white px-5 py-3.5 text-xs font-bold text-brand-800 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                    Batalkan
                  </button>
                </div>
              ) : pendingOrder?.external_order_id ? (
                <button
                  type="button"
                  onClick={handleCancelPendingOrder}
                  disabled={actionLoading === "cancel"}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-800 px-5 py-3.5 text-xs font-bold text-white disabled:opacity-50"
                >
                  {actionLoading === "cancel" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                  Batalkan Order & Buat Baru
                </button>
              ) : (
                <button
                  type="button"
                  disabled={actionLoading === "checkout"}
                  onClick={handleCheckout}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-800 px-5 py-3.5 text-xs font-bold text-white transition hover:bg-brand-700 disabled:opacity-50"
                >
                  {actionLoading === "checkout" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Menyiapkan Pembayaran...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Lanjut ke Pembayaran
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
}
