"use client";
import { useState } from "react";
import {
  Menu,
  X,
  ChevronRight,
  MapPin,
  BarChart3,
  Users,
  CheckCircle,
  ArrowRight,
  Map,
  Shield,
  Zap,
  Target,
  TrendingUp,
  Award,
  Cloud,
  Layers,
  Leaf,
} from "lucide-react";

export default function UAVLandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: <Layers className="w-6 h-6" />,
      title: "Sensor Hiperspektral & LiDAR",
      description:
        "Teknologi sensor canggih untuk deteksi kesehatan tanaman, kualitas air, dan topografi lahan dengan akurasi tinggi.",
    },
    {
      icon: <Cloud className="w-6 h-6" />,
      title: "Platform Cloud Terintegrasi",
      description:
        "Sistem pemrosesan data berbasis cloud dengan dashboard interaktif untuk visualisasi dan analisis real-time.",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Model Bisnis Koperasi",
      description:
        "Layanan berlangganan melalui koperasi, memungkinkan akses teknologi PF yang terjangkau untuk petani kecil.",
    },
    {
      icon: <Leaf className="w-6 h-6" />,
      title: "Precision Farming",
      description:
        "Pengambilan keputusan berbasis data untuk optimasi penggunaan pupuk, air, dan deteksi dini hama penyakit.",
    },
  ];

  const services = [
    {
      title: "Pemetaan Vegetasi (NDVI)",
      description:
        "Analisis kesehatan tanaman dan estimasi hasil panen menggunakan indeks vegetasi NDVI dari sensor hiperspektral.",
      benefits: [
        "Deteksi dini stress tanaman",
        "Pemetaan variasi kesehatan lahan",
        "Rekomendasi pemupukan presisi",
      ],
    },
    {
      title: "Analisis Nutrisi Tanah (NPK)",
      description:
        "Pemetaan distribusi nitrogen, fosfor, dan kalium untuk rekomendasi pemupukan yang efisien dan tepat sasaran.",
      benefits: [
        "Peta distribusi N, P, K",
        "Rekomendasi dosis pupuk",
        "Efisiensi biaya pemupukan",
      ],
    },
    {
      title: "Pemetaan Topografi (LiDAR)",
      description:
        "Data elevasi dan kontur lahan untuk desain irigasi, identifikasi area rawan banjir, dan pola tanam optimal.",
      benefits: [
        "Model elevasi digital (DEM)",
        "Desain sistem irigasi",
        "Identifikasi zona risiko",
      ],
    },
  ];

  const pricingPlans = [
    {
      name: "Paket Kelompok Tani",
      price: "5-10 Juta",
      features: [
        "Cakupan lahan 10-20 hektar",
        "Analisis NDVI dasar",
        "Peta kesehatan tanaman",
        "Laporan bulanan",
        "Support via WhatsApp",
      ],
      cta: "Hubungi Koperasi",
      popular: false,
    },
    {
      name: "Paket Koperasi Desa",
      price: "Paket Musiman",
      features: [
        "Cakupan hingga 100 hektar",
        "Analisis NDVI + NPK",
        "Sensor hiperspektral penuh",
        "Dashboard web interaktif",
        "Laporan detail & rekomendasi",
        "Training penggunaan sistem",
        "Priority support",
      ],
      cta: "Konsultasi Gratis",
      popular: true,
    },
    {
      name: "Paket Enterprise",
      price: "Custom",
      features: [
        "Cakupan unlimited",
        "Semua sensor (Hiperspektral + LiDAR)",
        "API access untuk integrasi",
        "Custom dashboard",
        "Dedicated account manager",
        "SLA guarantee",
        "White-label option",
      ],
      cta: "Hubungi Tim",
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/99 backdrop-blur-lg z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-900 rounded flex items-center justify-center">
                <Map className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">
                UAV DaaS Platform
              </span>
            </div>

            <div className="hidden md:flex items-center gap-10">
              <a
                href="#beranda"
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Beranda
              </a>
              <a
                href="#layanan"
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Layanan
              </a>
              <a
                href="#harga"
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Harga
              </a>
              <a
                href="#tentang"
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Tentang
              </a>
              <a
                href="/login"
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Login
              </a>
              <a
                href="/register"
                className="bg-gray-900 text-white px-6 py-2.5 rounded text-sm font-semibold hover:bg-gray-800 transition-colors"
              >
                Daftar Sekarang
              </a>
            </div>

            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100">
            <div className="px-6 py-6 space-y-4">
              <a
                href="#beranda"
                className="block text-sm font-medium text-gray-700 py-2"
              >
                Beranda
              </a>
              <a
                href="#layanan"
                className="block text-sm font-medium text-gray-700 py-2"
              >
                Layanan
              </a>
              <a
                href="#harga"
                className="block text-sm font-medium text-gray-700 py-2"
              >
                Harga
              </a>
              <a
                href="#tentang"
                className="block text-sm font-medium text-gray-700 py-2"
              >
                Tentang
              </a>
              <a
                href="/login"
                className="block text-sm font-medium text-gray-700 py-2"
              >
                Login
              </a>
              <a
                href="/register"
                className="w-full bg-gray-900 text-white px-6 py-3 rounded block text-center text-sm font-semibold"
              >
                Daftar Sekarang
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="beranda" className="relative pt-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div>
              <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-900 px-4 py-2 rounded-full text-xs font-semibold mb-8 tracking-wide">
                <Target className="w-3.5 h-3.5" />
                DATA-AS-A-SERVICE UNTUK PRECISION FARMING
              </div>

              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
                Layanan Data UAV untuk Pertanian Presisi
              </h1>

              <p className="text-lg text-gray-600 mb-10 leading-relaxed">
                Platform berbasis UAV dengan sensor hiperspektral dan LiDAR
                untuk mendukung pengambilan keputusan pertanian yang tepat,
                terjangkau, dan berkelanjutan.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-16">
                <a
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-8 py-4 rounded text-sm font-semibold hover:bg-gray-800 transition-colors shadow-lg hover:shadow-xl"
                >
                  Bergabung dengan Koperasi
                  <ArrowRight className="w-4 h-4" />
                </a>
                <button className="inline-flex items-center justify-center border-2 border-gray-900 text-gray-900 px-8 py-4 rounded text-sm font-semibold hover:bg-gray-50 transition-colors">
                  Pelajari Lebih Lanjut
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-200">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Award className="w-5 h-5 text-gray-900" />
                    <p className="text-2xl font-bold text-gray-900">TKT 6-7</p>
                  </div>
                  <p className="text-xs text-gray-600 uppercase tracking-wide">
                    Tingkat Kesiapan Teknologi
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-5 h-5 text-gray-900" />
                    <p className="text-2xl font-bold text-gray-900">Koperasi</p>
                  </div>
                  <p className="text-xs text-gray-600 uppercase tracking-wide">
                    Model Bisnis Kolektif
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-5 h-5 text-gray-900" />
                    <p className="text-2xl font-bold text-gray-900">14 HKI</p>
                  </div>
                  <p className="text-xs text-gray-600 uppercase tracking-wide">
                    Perlindungan Kekayaan Intelektual
                  </p>
                </div>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1920&q=80"
                  alt="Precision farming dengan drone"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 w-48 h-48 bg-gray-100 rounded-2xl -z-10"></div>
              <div className="absolute -top-6 -right-6 w-48 h-48 bg-gray-900 rounded-2xl -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
              Teknologi Unggulan
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Inovasi teknologi untuk pertanian presisi yang inklusif
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-xl hover:shadow-lg transition-shadow border border-gray-100"
              >
                <div className="w-14 h-14 bg-gray-900 rounded-lg flex items-center justify-center text-white mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="layanan" className="py-24 px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
              Layanan Data Premium
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Analisis komprehensif untuk pengambilan keputusan berbasis data
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-8 border-2 border-gray-100 hover:border-gray-900 transition-all"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {service.title}
                </h3>
                <p className="text-sm text-gray-600 mb-8 leading-relaxed">
                  {service.description}
                </p>
                <ul className="space-y-4 mb-8">
                  {service.benefits.map((benefit, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 text-sm text-gray-700"
                    >
                      <CheckCircle className="w-5 h-5 text-gray-900 flex-shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
                <button className="text-sm text-gray-900 font-semibold flex items-center gap-2 hover:gap-3 transition-all">
                  Pelajari Lebih Lanjut
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="harga" className="py-24 px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
              Paket Langganan Fleksibel
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Model berlangganan per musim tanam untuk berbagai skala usaha
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`rounded-xl p-10 ${
                  plan.popular
                    ? "bg-gray-900 text-white shadow-2xl scale-105 border-2 border-gray-900"
                    : "bg-white border-2 border-gray-100"
                }`}
              >
                {plan.popular && (
                  <div className="bg-white text-gray-900 px-4 py-1.5 rounded-full text-xs font-bold inline-block mb-6 uppercase tracking-wide">
                    Paling Populer
                  </div>
                )}
                <h3
                  className={`text-xl font-bold mb-4 ${
                    plan.popular ? "text-white" : "text-gray-900"
                  }`}
                >
                  {plan.name}
                </h3>
                <div className="mb-8">
                  <span className="text-4xl font-bold">
                    {plan.price === "Custom" ? "Custom" : `Rp${plan.price}`}
                  </span>
                  {plan.price !== "Custom" && (
                    <span className="text-base font-normal">/musim</span>
                  )}
                </div>
                <ul className="space-y-4 mb-10">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm">
                      <CheckCircle
                        className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                          plan.popular ? "text-white" : "text-gray-900"
                        }`}
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  className={`w-full py-3.5 rounded-lg text-sm font-semibold transition-colors ${
                    plan.popular
                      ? "bg-white text-gray-900 hover:bg-gray-100"
                      : "bg-gray-900 text-white hover:bg-gray-800"
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partnership Section */}
      <section id="tentang" className="py-24 px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
              Kemitraan Strategis
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Kolaborasi riset sejak 2017 dengan rekam jejak terbukti
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: <Award />, label: "Kolaborasi", value: "8 Tahun" },
              { icon: <Shield />, label: "Paten Terdaftar", value: "1 UAV" },
              {
                icon: <BarChart3 />,
                label: "Publikasi Ilmiah",
                value: "3 Jurnal",
              },
              { icon: <Target />, label: "HKI Terdaftar", value: "14 Peta" },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="text-center bg-gray-50 rounded-xl p-8 border border-gray-100"
              >
                <div className="w-16 h-16 bg-gray-900 rounded-lg flex items-center justify-center text-white mx-auto mb-6">
                  {stat.icon}
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-2">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-600 font-medium">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 lg:px-8 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 tracking-tight">
            Siap Bergabung dengan Transformasi Digital Pertanian?
          </h2>
          <p className="text-lg mb-10 text-gray-300 max-w-2xl mx-auto">
            Dapatkan konsultasi gratis dan demo platform untuk koperasi Anda
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-gray-900 px-8 py-4 rounded text-sm font-semibold hover:bg-gray-100 transition-colors shadow-lg">
              Hubungi Tim Kami
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded text-sm font-semibold hover:bg-white hover:text-gray-900 transition-colors">
              Lihat Dokumentasi
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16 px-6 lg:px-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-white rounded flex items-center justify-center">
                  <Map className="w-5 h-5 text-gray-900" />
                </div>
                <span className="text-lg font-bold text-white">
                  UAV DaaS Platform
                </span>
              </div>
              <p className="text-sm leading-relaxed">
                Platform Data-as-a-Service berbasis UAV untuk mendukung
                precision farming di Indonesia secara inklusif dan
                berkelanjutan.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-wide">
                Layanan
              </h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Pemetaan NDVI
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Analisis NPK
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Topografi LiDAR
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-wide">
                Perusahaan
              </h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Tentang Kami
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Penelitian & Publikasi
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Kemitraan
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Kontak
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-wide">
                Kontak
              </h4>
              <ul className="space-y-3 text-sm">
                <li>Email: info@uavdaas.id</li>
                <li>Tel: +62 274 123 456</li>
                <li>Universitas Gadjah Mada</li>
                <li>Yogyakarta, Indonesia</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
            <p>
              &copy; 2024 UAV DaaS Platform | Program Hilirisasi Riset SINERGI.
              All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
