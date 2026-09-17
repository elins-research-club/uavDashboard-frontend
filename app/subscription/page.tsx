"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  MapPin,
  Crown,
  Loader2,
  ShieldCheck,
  CreditCard,
  ArrowRight,
  X,
  AlertCircle,
  Clock3,
  RefreshCw,
} from "lucide-react";

import DashboardLayout from "../../components/DashboardLayout";
import { useUserRole } from "../../context/UserRoleContext";
import api from "../../lib/api";

/* ============================================================
   TYPES
============================================================ */

type Plan = {
  name: string;
  price: number;
  frequency: string;
  description: string;
  features: string[];
  storage_gb: number;
  popular: boolean;
};

type Subscription = {
  tier?: string | null;
  status?: string | null;
  scope_type?: string | null;
  village_id?: string | null;
  district_id?: string | null;
  billing_cycle?: string | null;
  start_date?: string | null;
  end_date?: string | null;
};

type PendingOrder = {
  id: string;
  user_id: string;
  tier: string;
  scope_type: string | null;
  village_id: string | null;
  district_id: string | null;
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

type ScopeType = "village" | "district";

type PlanMeta = {
  icon: typeof ShieldCheck;
  accent: string;
  border: string;
};

/* ============================================================
   PLAN META
============================================================ */

const PLAN_META: Record<string, PlanMeta> = {
  free: {
    icon: ShieldCheck,
    accent: "bg-slate-100 text-slate-700",
    border: "border-slate-200",
  },

  desa: {
    icon: MapPin,
    accent: "bg-[#123c28]/10 text-[#123c28]",
    border: "border-[#123c28]/20",
  },

  kecamatan: {
    icon: Crown,
    accent: "bg-[#91b928]/15 text-[#496400]",
    border: "border-[#91b928]/40",
  },
};

/* ============================================================
   HELPERS
============================================================ */

function normalizeTier(value: string | null | undefined) {
  return String(value || "free")
    .trim()
    .toLowerCase();
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

function formatScope(subscription: Subscription | null) {
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

function formatOrderTier(tier: string) {
  const normalized = normalizeTier(tier);

  if (normalized === "desa") {
    return "Desa";
  }

  if (normalized === "kecamatan") {
    return "Kecamatan";
  }

  return normalized;
}

/* ============================================================
   PAGE
============================================================ */

export default function SubscriptionPage() {
  const {
    userRole,
    user,
    isLoading: roleLoading,
    refreshCurrentUser,
  } = useUserRole();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(null);

  const [loading, setLoading] = useState(true);

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const [scopeType, setScopeType] = useState<ScopeType>("village");

  const [scopeValue, setScopeValue] = useState("");

  /* ----------------------------------------------------------
     LOAD DATA
  ---------------------------------------------------------- */

  useEffect(() => {
    if (roleLoading) {
      return;
    }

    if (!userRole || userRole === "guest") {
      return;
    }

    let mounted = true;

    async function loadSubscriptionData() {
      try {
        setLoading(true);
        setError("");
        setSuccess("");

        const [plansResponse, subscriptionResponse, ordersResponse] =
          await Promise.all([
            api.get("/subscriptions/plans"),
            api.get("/subscriptions/current"),
            api.get("/subscription-orders"),
          ]);

        if (!mounted) {
          return;
        }

        setPlans(Array.isArray(plansResponse.data) ? plansResponse.data : []);

        setSubscription(subscriptionResponse.data || null);

        const orders = Array.isArray(ordersResponse.data?.orders)
          ? ordersResponse.data.orders
          : [];

        const latestPendingOrder =
          orders.find((order: PendingOrder) => order.status === "pending") ||
          null;

        setPendingOrder(latestPendingOrder);
      } catch (err: any) {
        console.error("Gagal memuat subscription:", err);

        if (!mounted) {
          return;
        }

        if (err?.response?.status === 401) {
          localStorage.removeItem("token");

          window.location.href = "/login";

          return;
        }

        setError(
          err?.response?.data?.detail ||
            "Gagal memuat informasi subscription. Pastikan backend aktif di port 8001."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadSubscriptionData();

    return () => {
      mounted = false;
    };
  }, [roleLoading, userRole]);

  /* ----------------------------------------------------------
     CURRENT TIER
  ---------------------------------------------------------- */

  const currentTier = useMemo(() => {
    const subscriptionIsActive = subscription?.status === "active";

    if (subscriptionIsActive) {
      return normalizeTier(subscription?.tier);
    }

    return "free";
  }, [subscription]);

  /* ----------------------------------------------------------
     CURRENT SCOPE
  ---------------------------------------------------------- */

  const currentScope = useMemo(
    () => formatScope(subscription?.status === "active" ? subscription : null),
    [subscription]
  );

  /* ----------------------------------------------------------
     OPEN CHECKOUT
  ---------------------------------------------------------- */

  const openPlan = (plan: Plan) => {
    const tier = normalizeTier(plan.name);

    if (tier === "free") {
      return;
    }

    if (user?.role === "admin" || user?.role === "god") {
      setError("Admin dan God tidak dapat membeli subscription.");

      return;
    }

    setError("");
    setSuccess("");

    setSelectedPlan(plan);

    if (tier === "desa") {
      setScopeType("village");
    } else {
      setScopeType("district");
    }

    setScopeValue("");
  };

  /* ----------------------------------------------------------
     CLOSE CHECKOUT
  ---------------------------------------------------------- */

  const closePlan = () => {
    if (actionLoading) {
      return;
    }

    setSelectedPlan(null);
    setScopeValue("");
    setError("");
  };

  /* ----------------------------------------------------------
     CREATE ORDER
  ---------------------------------------------------------- */

  const createOrderAndCheckout = async (plan: Plan) => {
    const tier = normalizeTier(plan.name);

    if (tier !== "desa" && tier !== "kecamatan") {
      return;
    }

    const requiredScopeType: ScopeType =
      tier === "desa" ? "village" : "district";

    const trimmedScope = scopeValue.trim();

    if (!trimmedScope) {
      setError(
        tier === "desa"
          ? "village_id wajib diisi untuk paket Desa."
          : "district_id wajib diisi untuk paket Kecamatan."
      );

      return;
    }

    if (user?.role === "admin" || user?.role === "god") {
      setError("Admin dan God tidak dapat membeli subscription.");

      return;
    }

    try {
      setActionLoading("checkout");

      setError("");
      setSuccess("");

      let orderId = pendingOrder?.id || null;

      /*
       * Kalau ada pending order yang cocok,
       * lanjutkan order tersebut.
       */
      const pendingMatchesPlan =
        pendingOrder && normalizeTier(pendingOrder.tier) === tier;

      if (pendingOrder && pendingMatchesPlan) {
        orderId = pendingOrder.id;
      }

      /*
       * Kalau tidak ada pending order
       * yang cocok, buat order baru.
       */
      if (!orderId) {
        const payload = {
          tier,
          scope_type: requiredScopeType,
          village_id: requiredScopeType === "village" ? trimmedScope : null,
          district_id: requiredScopeType === "district" ? trimmedScope : null,
          billing_cycle: "monthly",
        };

        const orderResponse = await api.post("/subscription-orders", payload);

        orderId = orderResponse.data?.id;

        if (!orderId) {
          throw new Error("Backend tidak mengembalikan order_id.");
        }

        setPendingOrder(orderResponse.data);
      }

      /*
       * Buat transaksi Midtrans.
       */
      const checkoutResponse = await api.post(
        `/subscription-orders/${orderId}/checkout`
      );

      const checkout = checkoutResponse.data;

      if (!checkout?.redirect_url) {
        throw new Error("Midtrans tidak mengembalikan redirect_url.");
      }

      /*
       * Redirect ke halaman pembayaran Midtrans.
       */
      window.location.assign(checkout.redirect_url);
    } catch (err: any) {
      console.error("Gagal membuat checkout:", err);

      const detail = err?.response?.data?.detail;

      if (err?.response?.status === 409) {
        setError(
          detail ||
            "Anda masih memiliki order pending. Selesaikan atau batalkan order tersebut terlebih dahulu."
        );
      } else {
        setError(
          detail || err?.message || "Gagal membuat transaksi pembayaran."
        );
      }
    } finally {
      setActionLoading(null);
    }
  };

  /* ----------------------------------------------------------
     CANCEL PENDING ORDER
  ---------------------------------------------------------- */

  const cancelPendingOrder = async () => {
    if (!pendingOrder?.id) {
      return;
    }

    try {
      setActionLoading("cancel");

      setError("");
      setSuccess("");

      await api.post(`/subscription-orders/${pendingOrder.id}/cancel`);

      setPendingOrder(null);

      setSuccess("Order pending berhasil dibatalkan.");
    } catch (err: any) {
      console.error("Gagal membatalkan order:", err);

      setError(err?.response?.data?.detail || "Gagal membatalkan order.");
    } finally {
      setActionLoading(null);
    }
  };

  /* ----------------------------------------------------------
     REFRESH SUBSCRIPTION
  ---------------------------------------------------------- */

  const refreshSubscription = async () => {
    try {
      setActionLoading("refresh");

      setError("");
      setSuccess("");

      const [subscriptionResponse, ordersResponse] = await Promise.all([
        api.get("/subscriptions/current"),
        api.get("/subscription-orders"),
      ]);

      const nextSubscription = subscriptionResponse.data || null;

      const orders = Array.isArray(ordersResponse.data?.orders)
        ? ordersResponse.data.orders
        : [];

      const nextPendingOrder =
        orders.find((order: PendingOrder) => order.status === "pending") ||
        null;

      setSubscription(nextSubscription);

      setPendingOrder(nextPendingOrder);

      await refreshCurrentUser();

      setSuccess("Status subscription berhasil diperbarui.");
    } catch (err: any) {
      console.error("Gagal refresh subscription:", err);

      setError(
        err?.response?.data?.detail || "Gagal memperbarui status subscription."
      );
    } finally {
      setActionLoading(null);
    }
  };

  /* ----------------------------------------------------------
     LOADING
  ---------------------------------------------------------- */

  if (roleLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="flex items-center gap-3 text-[#123c28]">
            <Loader2 className="h-5 w-5 animate-spin" />

            <span className="text-sm font-medium">
              Memuat informasi subscription...
            </span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!userRole || userRole === "guest") {
    return null;
  }

  /* ----------------------------------------------------------
     RENDER
  ---------------------------------------------------------- */

  return (
    <DashboardLayout>
      <div className="min-h-full bg-[#f7f8f4]">
        {/* =====================================================
            HEADER
        ====================================================== */}

        <section className="px-4 pb-6 pt-5 sm:px-6 sm:pb-8 sm:pt-7 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_18px_50px_-25px_rgba(18,60,40,0.35)] backdrop-blur-xl sm:p-7 lg:p-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#123c28]/10 bg-[#123c28]/5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#123c28]">
                    <Crown size={13} />
                    Subscription
                  </div>

                  <h1 className="text-2xl font-extrabold tracking-tight text-[#123c28] sm:text-3xl lg:text-4xl">
                    Pilih Paket Data Anda
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500 sm:text-base">
                    Kelola tingkat layanan dan cakupan akses data UAV sesuai
                    kebutuhan wilayah Anda.
                  </p>
                </div>

                <div className="rounded-2xl border border-[#123c28]/10 bg-[#123c28]/5 px-4 py-3 sm:min-w-[230px]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#123c28]/60">
                    Paket Saat Ini
                  </p>

                  <p className="mt-1 text-lg font-extrabold capitalize text-[#123c28]">
                    {currentTier}
                  </p>

                  {currentScope && (
                    <p className="mt-1 text-xs text-[#123c28]/70">
                      {currentScope.label}: {currentScope.value}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            ERROR / SUCCESS
        ====================================================== */}

        {(error || success) && (
          <section className="px-4 pb-3 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              {error && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

                  <span className="flex-1">{error}</span>

                  <button
                    type="button"
                    onClick={() => setError("")}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {success && (
                <div className="mt-2 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  <Check className="mt-0.5 h-4 w-4 shrink-0" />

                  <span className="flex-1">{success}</span>

                  <button
                    type="button"
                    onClick={() => setSuccess("")}
                    className="text-green-600 hover:text-green-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* =====================================================
            CURRENT SUBSCRIPTION
        ====================================================== */}

        <section className="px-4 pb-5 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white bg-white p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Status
                </p>

                <div className="mt-2 flex items-center gap-2">
                  <p className="text-lg font-bold capitalize text-[#123c28]">
                    {subscription?.status === "active" ? "Active" : "Free"}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white bg-white p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Siklus Billing
                </p>

                <p className="mt-2 text-lg font-bold capitalize text-[#123c28]">
                  {subscription?.status === "active"
                    ? subscription?.billing_cycle || "monthly"
                    : "monthly"}
                </p>
              </div>

              <div className="rounded-2xl border border-white bg-white p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Cakupan
                </p>

                <p className="mt-2 text-lg font-bold text-[#123c28]">
                  {currentScope ? currentScope.label : "Publik / Free"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            PENDING ORDER
        ====================================================== */}

        {pendingOrder && (
          <section className="px-4 pb-5 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <div className="rounded-3xl border border-[#91b928]/35 bg-[#f4f8df] p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#91b928]/20 text-[#496400]">
                      <Clock3 className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-sm font-extrabold text-[#123c28]">
                        Ada pembayaran yang belum selesai
                      </p>

                      <p className="mt-1 text-xs leading-5 text-[#123c28]/65">
                        Order {formatOrderTier(pendingOrder.tier)} sebesar{" "}
                        {formatPrice(pendingOrder.amount)} masih berstatus
                        pending.
                      </p>

                      <p className="mt-1 text-[11px] text-[#123c28]/50">
                        Order ID: {pendingOrder.id}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      disabled={actionLoading !== null}
                      onClick={() => {
                        const matchingPlan = plans.find(
                          (plan) =>
                            normalizeTier(plan.name) ===
                            normalizeTier(pendingOrder.tier)
                        );

                        if (!matchingPlan) {
                          setError(
                            "Paket untuk order pending tidak ditemukan."
                          );

                          return;
                        }

                        if (normalizeTier(pendingOrder.tier) === "desa") {
                          setScopeType("village");

                          setScopeValue(pendingOrder.village_id || "");
                        } else {
                          setScopeType("district");

                          setScopeValue(pendingOrder.district_id || "");
                        }

                        setSelectedPlan(matchingPlan);
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#123c28] px-4 py-3 text-xs font-bold text-white transition hover:bg-[#1a5134] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <CreditCard className="h-4 w-4" />
                      Lanjutkan Pembayaran
                    </button>

                    <button
                      type="button"
                      disabled={actionLoading !== null}
                      onClick={cancelPendingOrder}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#123c28]/15 bg-white px-4 py-3 text-xs font-bold text-[#123c28] transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {actionLoading === "cancel" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                      Batalkan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* =====================================================
            PLAN CARDS
        ====================================================== */}

        <section className="px-4 pb-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            {plans.length === 0 ? (
              <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center">
                <p className="text-sm text-gray-500">
                  Belum ada paket subscription yang tersedia.
                </p>
              </div>
            ) : (
              <div className="grid items-stretch gap-5 lg:grid-cols-3">
                {plans.map((plan) => {
                  const tier = normalizeTier(plan.name);

                  const meta = PLAN_META[tier] || PLAN_META.free;

                  const Icon = meta.icon;

                  const isCurrent = tier === currentTier;

                  const isAdmin =
                    user?.role === "admin" || user?.role === "god";

                  return (
                    <div
                      key={plan.name}
                      className={[
                        "relative flex flex-col overflow-hidden rounded-3xl border bg-white p-5 shadow-sm transition-all duration-300 sm:p-6",
                        meta.border,
                        isCurrent
                          ? "shadow-[0_20px_55px_-25px_rgba(18,60,40,0.45)]"
                          : "hover:-translate-y-1 hover:shadow-xl",
                      ].join(" ")}
                    >
                      {plan.popular && (
                        <div className="absolute right-4 top-4 rounded-full bg-[#91b928] px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white">
                          Populer
                        </div>
                      )}

                      {isCurrent && (
                        <div className="absolute left-4 top-4 rounded-full bg-[#123c28] px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white">
                          Paket Saat Ini
                        </div>
                      )}

                      <div className="mb-6">
                        <div
                          className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${meta.accent}`}
                        >
                          <Icon size={22} />
                        </div>

                        <h2 className="text-xl font-extrabold text-[#123c28]">
                          {plan.name}
                        </h2>

                        <p className="mt-1 min-h-[42px] text-sm leading-relaxed text-gray-500">
                          {plan.description}
                        </p>
                      </div>

                      <div className="mb-6">
                        <div className="flex items-end gap-1">
                          <span className="text-3xl font-extrabold tracking-tight text-[#123c28]">
                            {formatPrice(plan.price)}
                          </span>

                          {plan.price > 0 && (
                            <span className="pb-1 text-xs text-gray-400">
                              {plan.frequency}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mb-6 flex-1">
                        <div className="mb-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Fitur
                        </div>

                        <div className="space-y-3">
                          {(plan.features || []).map(
                            (feature, featureIndex) => (
                              <div
                                key={`${feature}-${featureIndex}`}
                                className="flex items-start gap-2.5"
                              >
                                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#123c28]/8 text-[#123c28]">
                                  <Check size={12} strokeWidth={3} />
                                </span>

                                <span className="text-sm leading-relaxed text-gray-600">
                                  {feature}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      <div className="border-t border-gray-100 pt-5">
                        <div className="mb-3 flex items-center justify-between text-xs">
                          <span className="text-gray-400">Storage</span>

                          <span className="font-bold text-[#123c28]">
                            {plan.storage_gb
                              ? `${plan.storage_gb} GB`
                              : "Tidak ada"}
                          </span>
                        </div>

                        {isCurrent ? (
                          <button
                            type="button"
                            disabled
                            className="w-full cursor-default rounded-2xl bg-[#123c28] px-4 py-3 text-sm font-bold text-white"
                          >
                            Paket Aktif
                          </button>
                        ) : tier === "free" ? (
                          <button
                            type="button"
                            disabled
                            className="w-full cursor-not-allowed rounded-2xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm font-bold text-gray-400"
                          >
                            Paket Gratis
                          </button>
                        ) : isAdmin ? (
                          <button
                            type="button"
                            disabled
                            className="w-full cursor-not-allowed rounded-2xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm font-bold text-gray-400"
                          >
                            Tidak Tersedia untuk Admin
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openPlan(plan)}
                            className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#123c28] px-4 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[#1a5134]"
                          >
                            Upgrade Sekarang
                            <ArrowRight
                              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                              strokeWidth={2}
                            />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* =====================================================
            REFRESH
        ====================================================== */}

        <section className="px-4 pb-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex justify-center">
              <button
                type="button"
                disabled={actionLoading !== null}
                onClick={refreshSubscription}
                className="inline-flex items-center gap-2 rounded-full border border-[#123c28]/10 bg-white px-4 py-2.5 text-xs font-bold text-[#123c28] shadow-sm transition hover:bg-[#123c28]/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionLoading === "refresh" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Perbarui Status Subscription
              </button>
            </div>
          </div>
        </section>

        {/* =====================================================
            NOTE
        ====================================================== */}

        <section className="px-4 pb-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-2xl border border-[#123c28]/10 bg-[#123c28]/5 p-4 text-xs leading-relaxed text-[#123c28]/75 sm:p-5">
              <strong className="text-[#123c28]">Catatan:</strong> pembayaran
              dilakukan melalui Midtrans. Setelah pembayaran berhasil dan
              webhook diterima backend, subscription akan aktif sesuai cakupan
              wilayah yang dipilih.
            </div>
          </div>
        </section>

        {/* =====================================================
            CHECKOUT PANEL
        ====================================================== */}

        {selectedPlan && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#123c28]/35 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/70 bg-white shadow-[0_30px_100px_-30px_rgba(18,60,40,0.5)]">
              <div className="border-b border-gray-100 p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#123c28]/45">
                      Checkout Subscription
                    </p>

                    <h2 className="mt-1 text-xl font-extrabold tracking-tight text-[#123c28]">
                      {selectedPlan.name}
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      {formatPrice(selectedPlan.price)} {selectedPlan.frequency}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={actionLoading !== null}
                    onClick={closePlan}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-700 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-5 p-5 sm:p-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Cakupan Wilayah
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={
                        normalizeTier(selectedPlan.name) === "kecamatan"
                      }
                      onClick={() => setScopeType("village")}
                      className={[
                        "rounded-2xl border px-4 py-3 text-left transition",
                        scopeType === "village"
                          ? "border-[#123c28] bg-[#123c28]/5 text-[#123c28]"
                          : "border-gray-200 bg-white text-gray-500",
                        normalizeTier(selectedPlan.name) === "kecamatan"
                          ? "cursor-not-allowed opacity-40"
                          : "hover:border-[#123c28]/30",
                      ].join(" ")}
                    >
                      <p className="text-xs font-bold">Desa</p>

                      <p className="mt-0.5 text-[11px]">village_id</p>
                    </button>

                    <button
                      type="button"
                      disabled={normalizeTier(selectedPlan.name) === "desa"}
                      onClick={() => setScopeType("district")}
                      className={[
                        "rounded-2xl border px-4 py-3 text-left transition",
                        scopeType === "district"
                          ? "border-[#123c28] bg-[#123c28]/5 text-[#123c28]"
                          : "border-gray-200 bg-white text-gray-500",
                        normalizeTier(selectedPlan.name) === "desa"
                          ? "cursor-not-allowed opacity-40"
                          : "hover:border-[#123c28]/30",
                      ].join(" ")}
                    >
                      <p className="text-xs font-bold">Kecamatan</p>

                      <p className="mt-0.5 text-[11px]">district_id</p>
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="subscription-scope"
                    className="text-xs font-bold uppercase tracking-wider text-gray-400"
                  >
                    {scopeType === "village" ? "Village ID" : "District ID"}
                  </label>

                  <input
                    id="subscription-scope"
                    type="text"
                    value={scopeValue}
                    onChange={(event) => setScopeValue(event.target.value)}
                    placeholder={
                      scopeType === "village"
                        ? "Contoh: pagergunung"
                        : "Contoh: pangandaran"
                    }
                    className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-[#123c28] outline-none transition placeholder:text-gray-300 focus:border-[#123c28]/35 focus:ring-4 focus:ring-[#123c28]/5"
                  />

                  <p className="mt-2 text-[11px] leading-5 text-gray-400">
                    Gunakan ID wilayah yang sama dengan nilai{" "}
                    {scopeType === "village" ? "village_id" : "district_id"}{" "}
                    pada data peta.
                  </p>
                </div>

                <div className="rounded-2xl bg-[#f7f8f4] p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Total</span>

                    <span className="text-lg font-extrabold text-[#123c28]">
                      {formatPrice(selectedPlan.price)}
                    </span>
                  </div>

                  <p className="mt-1 text-[11px] text-gray-400">
                    Billing bulanan
                  </p>
                </div>

                <button
                  type="button"
                  disabled={actionLoading !== null}
                  onClick={() => createOrderAndCheckout(selectedPlan)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#123c28] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#1a5134] disabled:cursor-not-allowed disabled:opacity-50"
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
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
