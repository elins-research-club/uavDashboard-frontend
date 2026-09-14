"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useUserRole } from "@/context/UserRoleContext";
import api from "@/lib/api";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Crown,
  Gem,
  Headphones,
  Shield,
  Star,
  Users,
  Zap,
} from "lucide-react";

type PricingPlan = {
  tier: "free" | "desa" | "kecamatan" | string;
  price: number;
  features: string[];
  name: string;
  description: string;
  popular: boolean;
};

type TierStyle = {
  badgeBg: string;
  badgeText: string;
  icon: React.ReactNode;
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
   ORB DECORATION
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
        style={{ background: `${tint}35` }}
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
  icon: React.ComponentType<{
    className?: string;
    strokeWidth?: number;
  }>;
  title: string;
  description: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -3 }}
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
   PAGE
============================================================ */
export default function SubscriptionPage() {
  const { user } = useUserRole();

  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setIsLoading(true);
    setError("");

    api
      .get("/admin/plans")
      .then((res) => {
        const sortedPlans = [...(res.data || [])].sort(
          (a, b) => a.price - b.price
        );

        const enrichedPlans = sortedPlans.map((plan) => {
          const isFree = plan.tier === "free";
          const isDesa = plan.tier === "desa";

          return {
            ...plan,
            name: isFree ? "Free" : isDesa ? "Tier Desa" : "Tier Kecamatan",
            description: isFree
              ? "Sempurna untuk memulai dan mengeksplorasi platform."
              : isDesa
              ? "Ideal untuk pemantauan level desa dan kelompok tani."
              : "Solusi lengkap untuk analisis agregat level kecamatan.",
            popular: isDesa,
          };
        });

        setPricingPlans(enrichedPlans);
      })
      .catch((requestError) => {
        setError(
          requestError.response?.data?.detail || "Gagal memuat paket langganan."
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const currentTier =
    (
      {
        free: "Free",
        desa: "Tier Desa",
        kecamatan: "Tier Kecamatan",
      } as Record<string, string>
    )[user?.tier ?? ""] || "Free";

  const handleUpgrade = (tierName: string) => {
    alert(
      `Anda memilih untuk upgrade ke ${tierName}. Fitur pembayaran akan segera hadir!`
    );
  };

  const getPlanPrice = (plan: PricingPlan) => {
    if (plan.tier === "kecamatan") {
      return "Custom";
    }

    if (plan.price === 0) {
      return "Gratis";
    }

    if (billingCycle === "yearly") {
      return `Rp ${(plan.price * 12 * 0.8).toLocaleString("id-ID")}`;
    }

    return `Rp ${plan.price.toLocaleString("id-ID")}`;
  };

  return (
    <main className="min-h-screen bg-page text-brand-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ==================================================
            HEADER
        =================================================== */}
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
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
                Paket {currentTier}
              </span>

              <div className="inline-flex items-center gap-1 rounded-full border border-brand-800/10 bg-white/70 p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => setBillingCycle("monthly")}
                  className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                    billingCycle === "monthly"
                      ? "bg-brand-800 text-white shadow-sm"
                      : "text-brand-800/60 hover:text-brand-900"
                  }`}
                >
                  Bulanan
                </button>

                <button
                  type="button"
                  onClick={() => setBillingCycle("yearly")}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                    billingCycle === "yearly"
                      ? "bg-brand-800 text-white shadow-sm"
                      : "text-brand-800/60 hover:text-brand-900"
                  }`}
                >
                  Tahunan
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      billingCycle === "yearly"
                        ? "bg-brand-100 text-brand-800"
                        : "bg-[#e0edb7] text-[#4a5f0e]"
                    }`}
                  >
                    -20%
                  </span>
                </button>
              </div>
            </div>
          </div>
        </motion.header>

        {/* ==================================================
            ERROR
        =================================================== */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-600"
          >
            <AlertCircle
              className="mt-0.5 h-4 w-4 flex-shrink-0"
              strokeWidth={1.75}
            />
            <span>{error}</span>
          </motion.div>
        )}

        {/* ==================================================
            PRICING
        =================================================== */}
        {isLoading ? (
          <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="glass min-h-[520px] animate-pulse p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div className="h-7 w-20 rounded-full bg-brand-800/10" />
                  <div className="h-6 w-16 rounded-full bg-brand-800/10" />
                </div>

                <div className="h-6 w-36 rounded bg-brand-800/10" />
                <div className="mt-3 h-10 w-full rounded bg-brand-800/10" />

                <div className="mt-7 h-12 w-48 rounded bg-brand-800/10" />

                <div className="my-6 border-t border-brand-800/10" />

                <div className="h-3 w-28 rounded bg-brand-800/10" />

                <div className="mt-5 space-y-3">
                  {[0, 1, 2, 3, 4].map((feature) => (
                    <div key={feature} className="flex gap-3">
                      <div className="h-4 w-4 rounded-full bg-brand-800/10" />
                      <div className="h-3 flex-1 rounded bg-brand-800/10" />
                    </div>
                  ))}
                </div>

                <div className="mt-8 h-11 w-full rounded-full bg-brand-800/10" />
              </div>
            ))}
          </section>
        ) : pricingPlans.length === 0 ? (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
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
              const isCurrent = plan.name === currentTier;
              const isPopular = plan.popular;
              const style = tierStyles[plan.tier] || tierStyles.free;

              return (
                <motion.article
                  key={`${plan.tier}-${index}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.07 + 0.06,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  whileHover={{ y: isCurrent ? -2 : -4 }}
                  className={`group relative flex min-h-[520px] flex-col overflow-hidden rounded-3xl p-6 transition-shadow duration-300 ${
                    isPopular
                      ? "bg-brand-800 text-white shadow-card-hover"
                      : "glass text-brand-900 hover:shadow-card-hover"
                  }`}
                >
                  <PlanOrb tint={style.orbTint} dark={isPopular} />

                  {/* TOP META */}
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
                    ) : null}
                  </div>

                  {/* NAME */}
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

                  {/* PRICE */}
                  <div className="relative mt-7">
                    <p
                      className={`micro-label ${
                        isPopular ? "text-white/50" : ""
                      }`}
                    >
                      {plan.tier === "kecamatan"
                        ? "Harga"
                        : billingCycle === "yearly"
                        ? "Harga / Tahun"
                        : "Harga / Bulan"}
                    </p>

                    <div className="mt-1 flex items-end gap-2">
                      <span
                        className={`text-3xl font-bold tracking-[-0.04em] ${
                          isPopular ? "text-white" : "text-brand-900"
                        }`}
                      >
                        {getPlanPrice(plan)}
                      </span>

                      {plan.tier !== "kecamatan" && plan.price > 0 && (
                        <span
                          className={`mb-1 text-xs font-semibold ${
                            isPopular ? "text-white/50" : "text-brand-800/50"
                          }`}
                        >
                          {billingCycle === "yearly"
                            ? "per tahun"
                            : "per bulan"}
                        </span>
                      )}
                    </div>

                    {billingCycle === "yearly" &&
                      plan.tier !== "kecamatan" &&
                      plan.price > 0 && (
                        <p
                          className={`mt-1 text-2xs font-medium ${
                            isPopular ? "text-white/45" : "text-brand-800/45"
                          }`}
                        >
                          Hemat 20% dengan pembayaran tahunan.
                        </p>
                      )}
                  </div>

                  {/* DIVIDER */}
                  <div
                    className={`relative my-6 border-t ${
                      isPopular ? "border-white/12" : "border-brand-800/10"
                    }`}
                  />

                  {/* FEATURES */}
                  <div className="relative flex-1">
                    <p
                      className={`micro-label ${
                        isPopular ? "text-white/50" : ""
                      }`}
                    >
                      Fitur Termasuk
                    </p>

                    <ul className="mt-4 space-y-3">
                      {plan.features.map((feature, featureIndex) => (
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

                  {/* CTA */}
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
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleUpgrade(plan.name)}
                        className={`group/cta inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 ${
                          isPopular
                            ? "bg-white text-brand-900 hover:bg-[#dfeeb1]"
                            : "bg-brand-800 text-white hover:bg-brand-700"
                        }`}
                      >
                        {plan.tier === "free"
                          ? "Downgrade ke Free"
                          : plan.tier === "kecamatan"
                          ? "Hubungi Tim Sales"
                          : "Upgrade Sekarang"}

                        <ArrowRight
                          className="h-3.5 w-3.5 transition-transform duration-200 group-hover/cta:translate-x-0.5"
                          strokeWidth={2}
                        />
                      </button>
                    )}
                  </div>
                </motion.article>
              );
            })}
          </section>
        )}

        {/* ==================================================
            TRUST
        =================================================== */}
        <section className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
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
              description="Transaksi terlindungi"
              delay={0.26}
            />

            <TrustCard
              icon={Users}
              title="10K+ Pengguna"
              description="Dipakai banyak pengguna"
              delay={0.3}
            />

            <TrustCard
              icon={Headphones}
              title="Dukungan Aktif"
              description="Bantuan saat dibutuhkan"
              delay={0.34}
            />

            <TrustCard
              icon={AlertCircle}
              title="Fleksibel"
              description="Paket dapat disesuaikan"
              delay={0.38}
            />
          </div>
        </section>

        {/* ==================================================
            FAQ
        =================================================== */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
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
                a: "Klik tombol upgrade pada paket yang diinginkan. Proses pembayaran akan tersedia saat sistem pembayaran diaktifkan.",
              },
              {
                q: "Apakah bisa downgrade?",
                a: "Ya. Anda dapat berpindah ke paket yang lebih rendah, sementara data yang sudah tersimpan tetap dipertahankan sesuai kebijakan paket.",
              },
              {
                q: "Metode pembayaran apa saja?",
                a: "Platform dapat mendukung transfer bank, e-wallet, dan metode pembayaran lain setelah modul pembayaran diaktifkan.",
              },
              {
                q: "Apakah ada refund?",
                a: "Kebijakan refund mengikuti ketentuan layanan yang berlaku pada saat transaksi dilakukan.",
              },
            ].map((faq, index) => (
              <motion.div
                key={faq.q}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.45,
                  delay: 0.46 + index * 0.04,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="rounded-2xl border border-brand-800/8 bg-white/55 p-4 transition-colors hover:bg-white/75"
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

        {/* ==================================================
            FOOTER NOTE
        =================================================== */}
        <p className="mt-5 text-center text-2xs font-medium text-brand-800/35">
          Harga dan fitur dapat berubah mengikuti konfigurasi paket terbaru.
        </p>
      </div>
    </main>
  );
}
