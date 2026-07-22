"use client";

import { useState } from "react";
import { useUserRole } from "@/context/UserRoleContext";
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
} from "lucide-react";

const pricingTiers = [
  {
    name: "Free",
    price: "0",
    frequency: "/selamanya",
    description: "Sempurna untuk memulai dan eksplorasi platform",
    icon: <Star className="w-6 h-6" />,
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    popular: false,
    features: [
      "Akses 2 Peta Dasar",
      "Analisis Vegetasi (terbatas)",
      "Dukungan Komunitas",
      "Storage 500 MB",
      "Export format PNG",
    ],
  },
  {
    name: "Tier Desa",
    price: "200.000",
    frequency: "/bulan",
    description: "Ideal untuk pemantauan level desa dan kelompok tani",
    icon: <Zap className="w-6 h-6" />,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    popular: true,
    features: [
      "Semua fitur Tier Free",
      "Akses Peta NPK Premium",
      "Analisis Kesuburan Tanah",
      "Laporan Bulanan Otomatis",
      "Storage 5 GB",
      "Export Multi-format",
      "Priority Support",
    ],
  },
  {
    name: "Tier Kecamatan",
    price: "1.000.000",
    frequency: "/bulan",
    description: "Solusi lengkap untuk analisis agregat level kecamatan",
    icon: <Crown className="w-6 h-6" />,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    popular: false,
    features: [
      "Semua fitur Tier Desa",
      "API Access Unlimited",
      "Perbandingan Antar-Desa",
      "Custom Dashboard",
      "Storage 50 GB",
      "White-label Report",
      "Dedicated Account Manager",
      "SLA 99.9% Uptime",
    ],
  },
];

export default function SubscriptionPage() {
  const { user } = useUserRole();
  const [billingCycle, setBillingCycle] = useState("monthly");
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {pricingTiers.map((tier) => {
            const isCurrent = tier.name === currentTier;

            return (
              <div
                key={tier.name}
                className={`relative bg-white rounded-lg border overflow-hidden transition-all hover:shadow-lg ${
                  tier.popular
                    ? "border-blue-500 shadow-md ring-2 ring-blue-100"
                    : "border-gray-200"
                }`}
              >
                {tier.popular && (
                  <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-1.5 text-xs font-semibold">
                    PALING POPULER
                  </div>
                )}

                <div className="p-6">
                  {/* Icon */}
                  <div
                    className={`w-12 h-12 ${tier.bgColor} rounded-lg flex items-center justify-center ${tier.color} mb-4 border ${tier.borderColor}`}
                  >
                    {tier.icon}
                  </div>

                  {/* Tier Name */}
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {tier.name}
                  </h2>
                  <p className="text-xs text-gray-600 mb-6 h-10 leading-relaxed">
                    {tier.description}
                  </p>

                  {/* Price */}
                  <div className="mb-6">
                    <span className="text-3xl font-bold text-gray-900">
                      {tier.price === "0" ? "Gratis" : `Rp${tier.price}`}
                    </span>
                    {tier.price !== "0" && (
                      <span className="text-sm text-gray-500 ml-1">
                        {tier.frequency}
                      </span>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-6">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <div className="flex-shrink-0 w-4 h-4 bg-green-100 rounded-full flex items-center justify-center mt-0.5 border border-green-200">
                          <Check className="w-2.5 h-2.5 text-green-600" />
                        </div>
                        <span className="text-xs text-gray-700 leading-relaxed">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  {isCurrent ? (
                    <button
                      className="w-full bg-gray-100 text-gray-500 font-medium py-3 px-4 rounded-lg text-sm cursor-not-allowed border border-gray-200"
                      disabled
                    >
                      Paket Anda Saat Ini
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(tier.name)}
                      className={`w-full font-medium py-3 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 ${
                        tier.popular
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-gray-900 text-white hover:bg-gray-800"
                      }`}
                    >
                      {tier.name === "Free"
                        ? "Downgrade ke Free"
                        : "Upgrade Sekarang"}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

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
