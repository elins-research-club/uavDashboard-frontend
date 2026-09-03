"use client";

import { useState, useEffect } from "react";
import { useUserRole } from "@/context/UserRoleContext";
import api from "@/lib/api";
import {
  Check,
  Star,
  Zap,
  Crown,
  Shield,
  Users,
  Headphones,
  AlertCircle,
  Building2,
  ChevronRight,
  CheckCircle,
} from "lucide-react";

export default function SubscriptionPage() {
  const { user } = useUserRole();
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [pricingPlans, setPricingPlans] = useState([]);
  
  useEffect(() => {
    api.get("/admin/plans").then((res) => {
      // Sort plans by price
      const sortedPlans = res.data.sort((a, b) => a.price - b.price);
      
      // Add visual properties based on tier
      const enrichedPlans = sortedPlans.map((plan) => {
        const isFree = plan.tier === "free";
        const isKecamatan = plan.tier === "kecamatan";
        const isDesa = plan.tier === "desa";
        
        return {
          ...plan,
          name: plan.tier === "free" ? "Free" : plan.tier === "desa" ? "Tier Desa" : "Tier Kecamatan",
          description: isFree 
            ? "Sempurna untuk memulai dan eksplorasi platform" 
            : isDesa 
            ? "Ideal untuk pemantauan level desa dan kelompok tani" 
            : "Solusi lengkap untuk analisis agregat level kecamatan",
          icon: isKecamatan ? <Crown className="w-6 h-6" /> : isDesa ? <Zap className="w-6 h-6" /> : <Star className="w-6 h-6" />,
          color: isKecamatan ? "text-purple-600" : isDesa ? "text-blue-600" : "text-gray-600",
          bgColor: isKecamatan ? "bg-purple-50" : isDesa ? "bg-blue-50" : "bg-gray-50",
          borderColor: isKecamatan ? "border-purple-200" : isDesa ? "border-blue-200" : "border-gray-200",
          popular: isDesa,
        };
      });
      setPricingPlans(enrichedPlans);
    }).catch(console.error);
  }, []);

  const currentTier = ({
    free: "Free",
    desa: "Tier Desa",
    kecamatan: "Tier Kecamatan",
  } as Record<string, string>)[user?.tier] || "Free";

  const handleUpgrade = (tierName) => {
    alert(
      `Anda memilih untuk upgrade ke ${tierName}. Fitur pembayaran akan segera hadir!`
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-medium mb-4 border border-blue-100">
            <Building2 className="w-3.5 h-3.5" />
            Pilih Paket Terbaik Untuk Anda
          </div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-3">
            Kelola Langganan Anda
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            Status Anda saat ini:{" "}
            <span className="font-semibold text-blue-600">
              {currentTier}
            </span>
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-2 bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === "monthly"
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Bulanan
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === "yearly"
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Tahunan
              <span className="ml-1.5 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded border border-green-200">
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        {pricingPlans.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-lg p-6 bg-white border border-gray-200 animate-pulse shadow-sm h-96">
                <div className="w-12 h-12 bg-gray-200 rounded-lg mb-4" />
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-full mb-6" />
                <div className="h-10 bg-gray-200 rounded w-3/4 mb-6" />
                {[0, 1, 2, 3].map((j) => (
                  <div key={j} className="h-4 bg-gray-100 rounded mb-3" />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {pricingPlans.map((plan, index) => {
              const isCurrent = plan.name === currentTier;
              const isPopular = plan.popular;
              const tierBadgeStyle: Record<string, string> = {
                free: "bg-gray-100 text-gray-600 border border-gray-200",
                desa: "bg-blue-50 text-blue-700 border border-blue-200",
                kecamatan: "bg-purple-50 text-purple-700 border border-purple-200",
              };
              const tierIcon: Record<string, string> = {
                free: "🗂️",
                desa: "🏘️",
                kecamatan: "👑",
              };

              return (
                <div
                  key={index}
                  className={`rounded-2xl p-8 flex flex-col bg-white border shadow-sm transition-shadow hover:shadow-md ${
                    isPopular
                      ? "border-gray-900 ring-2 ring-gray-900 ring-offset-2"
                      : "border-gray-200"
                  }`}
                >
                  {/* Tier badge */}
                  <div className="flex items-center justify-between mb-6">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                        tierBadgeStyle[plan.tier] || "bg-gray-100 text-gray-600 border border-gray-200"
                      }`}
                    >
                      <span>{tierIcon[plan.tier] || "📦"}</span>
                      <span className="capitalize">{plan.tier}</span>
                    </span>
                    {isPopular && (
                      <span className="bg-gray-900 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                        Populer
                      </span>
                    )}
                  </div>

                  {/* Package name */}
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{plan.name}</h3>

                  {/* Price */}
                  <div className="mb-6">
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                      Harga / Bulan
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-gray-900">
                        {plan.tier === "kecamatan"
                          ? "Custom"
                          : plan.price === 0
                          ? "Gratis"
                          : `Rp ${(billingCycle === "yearly" ? plan.price * 12 * 0.8 : plan.price).toLocaleString("id-ID")}`}
                      </span>
                      {plan.tier !== "kecamatan" && plan.price > 0 && (
                        <span className="text-sm font-medium text-gray-600">
                          {billingCycle === "yearly" ? "/tahun" : "/bulan"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-100 mb-6" />

                  {/* Features */}
                  <div className="flex-1 mb-8">
                    <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
                      Fitur Termasuk
                    </p>
                    <ul className="space-y-2.5">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-sm">
                          <CheckCircle
                            className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-600"
                            aria-hidden="true"
                          />
                          <span className="text-gray-800 font-medium">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  {isCurrent ? (
                    <button
                      className="w-full py-3 rounded-xl text-sm font-semibold text-gray-500 bg-gray-100 border border-gray-200 cursor-not-allowed mt-auto"
                      disabled
                    >
                      Paket Anda Saat Ini
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(plan.name)}
                      className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 mt-auto ${
                        isPopular
                          ? "bg-gray-900 text-white hover:bg-gray-800"
                          : "bg-gray-100 text-gray-800 hover:bg-gray-200"
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

        {/* Trust Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          {[
            {
              icon: <Shield className="w-5 h-5" />,
              title: "Pembayaran Aman",
              desc: "SSL Encrypted",
            },
            {
              icon: <Users className="w-5 h-5" />,
              title: "10K+ Pengguna",
              desc: "Trusted by many",
            },
            {
              icon: <Headphones className="w-5 h-5" />,
              title: "24/7 Support",
              desc: "Always here",
            },
            {
              icon: <AlertCircle className="w-5 h-5" />,
              title: "Cancel Anytime",
              desc: "No commitment",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-lg p-5 text-center border border-gray-200"
            >
              <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center mx-auto mb-3 text-gray-600 border border-gray-200">
                {item.icon}
              </div>
              <h3 className="font-semibold text-sm text-gray-900 mb-1">
                {item.title}
              </h3>
              <p className="text-xs text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            Pertanyaan Umum
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
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
                className="p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <h3 className="font-semibold text-sm text-gray-900 mb-2">
                  {faq.q}
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
