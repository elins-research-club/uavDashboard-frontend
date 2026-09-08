"use client";

import { useState, useEffect, type ReactElement } from "react";
import { useUserRole } from "@/context/UserRoleContext";
import api from "@/lib/api";
import {
  Star,
  Zap,
  Crown,
  Shield,
  Users,
  Headphones,
  AlertCircle,
  Building2,
  CheckCircle2,
} from "lucide-react";

type PricingPlan = {
  tier: "free" | "desa" | "kecamatan" | string;
  price: number;
  features: string[];
  name: string;
  description: string;
  popular: boolean;
};

export default function SubscriptionPage() {
  const { user } = useUserRole();
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);

  useEffect(() => {
    api
      .get("/admin/plans")
      .then((res) => {
        // Sort plans by price
        const sortedPlans = [...res.data].sort((a, b) => a.price - b.price);

        // Add display properties based on tier
        const enrichedPlans = sortedPlans.map((plan) => {
          const isFree = plan.tier === "free";
          const isDesa = plan.tier === "desa";

          return {
            ...plan,
            name:
              plan.tier === "free"
                ? "Free"
                : plan.tier === "desa"
                ? "Tier Desa"
                : "Tier Kecamatan",
            description: isFree
              ? "Sempurna untuk memulai dan eksplorasi platform"
              : isDesa
              ? "Ideal untuk pemantauan level desa dan kelompok tani"
              : "Solusi lengkap untuk analisis agregat level kecamatan",
            popular: isDesa,
          };
        });
        setPricingPlans(enrichedPlans);
      })
      .catch(console.error);
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

  // Solid, tier-specific colors — no translucent overlays.
  const tierStyles: Record<
    string,
    {
      badgeBg: string;
      badgeText: string;
      ring: string;
      icon: ReactElement;
      label: string;
    }
  > = {
    free: {
      badgeBg: "bg-[#eef1ea]",
      badgeText: "text-[#4b5d52]",
      ring: "border-[#123c28]/15",
      icon: <Star className="h-4 w-4" />,
      label: "Free",
    },
    desa: {
      badgeBg: "bg-[#dfeeb1]",
      badgeText: "text-[#4a5f0e]",
      ring: "border-[#91b928]",
      icon: <Zap className="h-4 w-4" />,
      label: "Desa",
    },
    kecamatan: {
      badgeBg: "bg-[#fbe6bd]",
      badgeText: "text-[#8a5a06]",
      ring: "border-[#f0ad25]",
      icon: <Crown className="h-4 w-4" />,
      label: "Kecamatan",
    },
  };

  return (
    <main className="min-h-screen bg-white text-[#123c28]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* =====================================================
            TOP HEADER
        ====================================================== */}
        <header className="mb-8 text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#91b928]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#123c28]">
              UAV DaaS PLATFORM
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-[-0.04em] text-[#123c28] sm:text-4xl">
            Kelola <span className="text-[#1a5134]">Langganan</span> Anda
          </h1>

          <p className="mt-3 text-sm font-semibold text-[#4b5d52]">
            Status Anda saat ini:{" "}
            <span className="font-bold text-[#1a5134]">{currentTier}</span>
          </p>

          {/* Billing Toggle */}
          <div className="mt-6 inline-flex items-center gap-1 rounded-full border border-[#123c28]/15 bg-[#f7f8f4] p-1">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`rounded-full px-5 py-2 text-xs font-bold transition-colors ${
                billingCycle === "monthly"
                  ? "bg-[#123c28] text-white"
                  : "text-[#4b5d52] hover:text-[#123c28]"
              }`}
            >
              Bulanan
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-bold transition-colors ${
                billingCycle === "yearly"
                  ? "bg-[#123c28] text-white"
                  : "text-[#4b5d52] hover:text-[#123c28]"
              }`}
            >
              Tahunan
              <span className="rounded-full bg-[#91b928] px-1.5 py-0.5 text-[10px] font-bold text-[#123c28]">
                -20%
              </span>
            </button>
          </div>
        </header>

        {/* =====================================================
            PRICING CARDS
        ====================================================== */}
        {pricingPlans.length === 0 ? (
          <div className="mb-10 grid grid-cols-1 gap-5 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-96 animate-pulse rounded-[28px] border border-[#123c28]/15 bg-white p-6"
              >
                <div className="mb-4 h-10 w-10 rounded-xl bg-[#f3f6ed]" />
                <div className="mb-2 h-5 w-1/2 rounded bg-[#f3f6ed]" />
                <div className="mb-6 h-3 w-full rounded bg-[#f3f6ed]" />
                <div className="mb-6 h-9 w-3/4 rounded bg-[#f3f6ed]" />
                {[0, 1, 2, 3].map((j) => (
                  <div key={j} className="mb-3 h-3 rounded bg-[#f7f8f4]" />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="mb-10 grid gap-5 md:grid-cols-3">
            {pricingPlans.map((plan, index) => {
              const isCurrent = plan.name === currentTier;
              const isPopular = plan.popular;
              const style = tierStyles[plan.tier] || tierStyles.free;

              return (
                <div
                  key={index}
                  className={`flex flex-col rounded-[28px] p-7 transition-shadow ${
                    isPopular
                      ? "border-2 border-[#123c28] bg-[#123c28] text-white shadow-[0_16px_40px_rgba(18,60,40,0.18)]"
                      : "border border-[#123c28]/15 bg-white text-[#123c28] hover:shadow-[0_14px_40px_rgba(18,60,40,0.08)]"
                  }`}
                >
                  {/* Tier badge */}
                  <div className="mb-6 flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold ${
                        isPopular
                          ? "bg-[#91b928] text-[#123c28]"
                          : `${style.badgeBg} ${style.badgeText}`
                      }`}
                    >
                      {style.icon}
                      {style.label}
                    </span>
                    {isPopular && (
                      <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#123c28]">
                        Populer
                      </span>
                    )}
                  </div>

                  {/* Package name */}
                  <h3
                    className={`mb-1 text-xl font-bold tracking-[-0.02em] ${
                      isPopular ? "text-white" : "text-[#123c28]"
                    }`}
                  >
                    {plan.name}
                  </h3>
                  <p
                    className={`mb-6 text-xs font-medium ${
                      isPopular ? "text-[#c9dba5]" : "text-[#4b5d52]"
                    }`}
                  >
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div className="mb-6">
                    <p
                      className={`mb-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                        isPopular ? "text-[#c9dba5]" : "text-[#4b5d52]"
                      }`}
                    >
                      Harga / Bulan
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span
                        className={`text-3xl font-bold tracking-[-0.03em] ${
                          isPopular ? "text-white" : "text-[#123c28]"
                        }`}
                      >
                        {plan.tier === "kecamatan"
                          ? "Custom"
                          : plan.price === 0
                          ? "Gratis"
                          : `Rp ${(billingCycle === "yearly"
                              ? plan.price * 12 * 0.8
                              : plan.price
                            ).toLocaleString("id-ID")}`}
                      </span>
                      {plan.tier !== "kecamatan" && plan.price > 0 && (
                        <span
                          className={`text-sm font-semibold ${
                            isPopular ? "text-[#c9dba5]" : "text-[#4b5d52]"
                          }`}
                        >
                          {billingCycle === "yearly" ? "/tahun" : "/bulan"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Divider */}
                  <div
                    className={`mb-6 border-t ${
                      isPopular ? "border-white/25" : "border-[#123c28]/10"
                    }`}
                  />

                  {/* Features */}
                  <div className="mb-8 flex-1">
                    <p
                      className={`mb-3 text-[10px] font-bold uppercase tracking-[0.18em] ${
                        isPopular ? "text-[#c9dba5]" : "text-[#4b5d52]"
                      }`}
                    >
                      Fitur Termasuk
                    </p>
                    <ul className="space-y-2.5">
                      {plan.features.map((feature, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2.5 text-sm"
                        >
                          <CheckCircle2
                            className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                              isPopular ? "text-[#91b928]" : "text-[#1a5134]"
                            }`}
                          />
                          <span
                            className={`font-medium ${
                              isPopular ? "text-white" : "text-[#123c28]"
                            }`}
                          >
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  {isCurrent ? (
                    <button
                      className={`mt-auto w-full cursor-not-allowed rounded-full py-3 text-sm font-bold ${
                        isPopular
                          ? "border border-white/25 bg-white/0 text-white/70"
                          : "border border-[#123c28]/15 bg-[#f5f7f1] text-[#4b5d52]"
                      }`}
                      disabled
                    >
                      Paket Anda Saat Ini
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(plan.name)}
                      className={`mt-auto w-full rounded-full py-3 text-sm font-bold transition-colors ${
                        isPopular
                          ? "bg-white text-[#123c28] hover:bg-[#f0ad25] hover:text-white"
                          : "bg-[#123c28] text-white hover:bg-[#1a5134]"
                      }`}
                    >
                      {plan.tier === "free"
                        ? "Downgrade ke Free"
                        : plan.tier === "kecamatan"
                        ? "Hubungi Tim Sales"
                        : "Upgrade Sekarang"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* =====================================================
            TRUST INDICATORS
        ====================================================== */}
        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: <Shield className="h-5 w-5" />,
              title: "Pembayaran Aman",
              desc: "SSL Encrypted",
            },
            {
              icon: <Users className="h-5 w-5" />,
              title: "10K+ Pengguna",
              desc: "Trusted by many",
            },
            {
              icon: <Headphones className="h-5 w-5" />,
              title: "24/7 Support",
              desc: "Always here",
            },
            {
              icon: <AlertCircle className="h-5 w-5" />,
              title: "Cancel Anytime",
              desc: "No commitment",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="rounded-[24px] border border-[#123c28]/15 bg-white p-5 text-center"
            >
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#f3f6ed] text-[#123c28]">
                {item.icon}
              </div>
              <h3 className="mb-1 text-sm font-bold text-[#123c28]">
                {item.title}
              </h3>
              <p className="text-xs font-medium text-[#4b5d52]">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* =====================================================
            FAQ
        ====================================================== */}
        <section className="rounded-[28px] border border-[#123c28]/15 bg-white p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f3f6ed]">
              <Building2 className="h-4 w-4 text-[#123c28]" />
            </div>
            <h2 className="text-xl font-bold tracking-[-0.03em] text-[#123c28]">
              Pertanyaan Umum
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                q: "Bagaimana cara upgrade paket?",
                a: "Klik tombol 'Upgrade Sekarang' dan ikuti proses pembayaran yang mudah.",
              },
              {
                q: "Apakah bisa downgrade?",
                a: "Ya, Anda bisa downgrade kapan saja. Data akan tetap tersimpan.",
              },
              {
                q: "Metode pembayaran apa saja?",
                a: "Kami menerima transfer bank, e-wallet, dan kartu kredit.",
              },
              {
                q: "Apakah ada refund?",
                a: "Ya, kami menawarkan 30 hari money-back guarantee.",
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-[#123c28]/10 bg-[#fafbf8] p-4"
              >
                <h3 className="mb-1.5 text-sm font-bold text-[#123c28]">
                  {faq.q}
                </h3>
                <p className="text-xs font-medium leading-relaxed text-[#4b5d52]">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
