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
  Plane,
} from "lucide-react";

export default function UAVLandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: <Plane className="w-8 h-8" />,
      title: "Pemetaan Udara Presisi",
      description:
        "Teknologi drone canggih untuk pemetaan lahan dengan akurasi tinggi dan resolusi detail.",
    },
    {
      icon: <MapPin className="w-8 h-8" />,
      title: "Analisis Geospasial",
      description:
        "Data geospasial komprehensif untuk perencanaan dan pengambilan keputusan yang tepat.",
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Monitoring Real-time",
      description:
        "Pantau kondisi lahan secara real-time dengan dashboard interaktif dan laporan otomatis.",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Tim Profesional",
      description:
        "Didukung oleh tim ahli bersertifikat dengan pengalaman lebih dari 500 proyek.",
    },
  ];

  const services = [
    {
      title: "Pemetaan Pertanian",
      description:
        "Analisis vegetasi, kesehatan tanaman, dan rekomendasi pemupukan berbasis data drone.",
      benefits: ["NDVI Mapping", "Soil Analysis", "Yield Prediction"],
    },
    {
      title: "Survei Topografi",
      description:
        "Data kontur presisi untuk proyek konstruksi, infrastruktur, dan perencanaan wilayah.",
      benefits: ["3D Modeling", "Volume Calculation", "DEM/DTM"],
    },
    {
      title: "Inspeksi Aset",
      description:
        "Inspeksi visual menara, jembatan, dan infrastruktur dengan aman dan efisien.",
      benefits: ["High-res Imaging", "Thermal Inspection", "Damage Detection"],
    },
  ];

  const pricingPlans = [
    {
      name: "Free",
      price: "0",
      features: [
        "5 peta per bulan",
        "Resolusi standar",
        "Basic analytics",
        "Email support",
      ],
      cta: "Mulai Gratis",
      popular: false,
    },
    {
      name: "Professional",
      price: "499K",
      features: [
        "50 peta per bulan",
        "Resolusi tinggi",
        "Advanced analytics",
        "Priority support",
        "Export unlimited",
        "Custom branding",
      ],
      cta: "Mulai Sekarang",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      features: [
        "Unlimited maps",
        "Highest resolution",
        "AI-powered insights",
        "Dedicated support",
        "API access",
        "Custom integration",
        "SLA guarantee",
      ],
      cta: "Hubungi Kami",
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Plane className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">AgroMap</span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#beranda"
                className="text-gray-700 hover:text-blue-600 transition"
              >
                Beranda
              </a>
              <a
                href="#layanan"
                className="text-gray-700 hover:text-blue-600 transition"
              >
                Layanan
              </a>
              <a
                href="#harga"
                className="text-gray-700 hover:text-blue-600 transition"
              >
                Harga
              </a>
              <a
                href="#tentang"
                className="text-gray-700 hover:text-blue-600 transition"
              >
                Tentang
              </a>
              <a
                href="/login"
                className="text-gray-700 hover:text-blue-600 transition"
              >
                Login
              </a>
              <a
                href="/register"
                className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition"
              >
                Mulai Gratis
              </a>
            </div>

            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-4 py-4 space-y-3">
              <a href="#beranda" className="block text-gray-700">
                Beranda
              </a>
              <a href="#layanan" className="block text-gray-700">
                Layanan
              </a>
              <a href="#harga" className="block text-gray-700">
                Harga
              </a>
              <a href="#tentang" className="block text-gray-700">
                Tentang
              </a>
              <a href="/login/page.js" className="block text-gray-700">
                Login
              </a>
              <a
                href="/register/page.js"
                className="w-full bg-blue-600 text-white px-6 py-2 rounded-full block text-center"
              >
                Mulai Gratis
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="beranda" className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                🚁 Platform Pemetaan UAV Terdepan
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Transformasi Data Udara Menjadi
                <span className="text-blue-600"> Insight Bisnis</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Solusi pemetaan drone profesional untuk pertanian, konstruksi,
                dan survei lahan dengan teknologi terkini.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="/register/page.js"
                  className="bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
                >
                  Coba Sekarang <ArrowRight className="w-5 h-5" />
                </a>
                <button className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-full text-lg font-medium hover:border-blue-600 hover:text-blue-600 transition">
                  Lihat Demo
                </button>
              </div>
              <div className="mt-12 flex items-center gap-8">
                <div>
                  <p className="text-3xl font-bold text-gray-900">500+</p>
                  <p className="text-gray-600">Proyek Selesai</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">50K+</p>
                  <p className="text-gray-600">Hektar Dipetakan</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">98%</p>
                  <p className="text-gray-600">Kepuasan Klien</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-3xl blur-3xl opacity-20"></div>
              <img
                src="https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&q=80"
                alt="Drone mapping"
                className="relative rounded-3xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Kenapa Memilih Kami?
            </h2>
            <p className="text-xl text-gray-600">
              Teknologi terdepan dengan layanan terpercaya
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl hover:bg-blue-50 transition group"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-4 group-hover:bg-blue-600 group-hover:text-white transition">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section
        id="layanan"
        className="py-20 px-4 bg-gradient-to-b from-white to-blue-50"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Layanan Kami
            </h2>
            <p className="text-xl text-gray-600">
              Solusi komprehensif untuk berbagai kebutuhan pemetaan
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition"
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {service.title}
                </h3>
                <p className="text-gray-600 mb-6">{service.description}</p>
                <ul className="space-y-3 mb-6">
                  {service.benefits.map((benefit, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-2 text-gray-700"
                    >
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      {benefit}
                    </li>
                  ))}
                </ul>
                <button className="text-blue-600 font-medium flex items-center gap-2 hover:gap-3 transition-all">
                  Pelajari Lebih Lanjut <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="harga" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Paket Harga Fleksibel
            </h2>
            <p className="text-xl text-gray-600">
              Pilih paket yang sesuai dengan kebutuhan Anda
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`rounded-2xl p-8 ${
                  plan.popular
                    ? "bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-2xl scale-105"
                    : "bg-white border-2 border-gray-200"
                }`}
              >
                {plan.popular && (
                  <div className="bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-bold inline-block mb-4">
                    PALING POPULER
                  </div>
                )}
                <h3
                  className={`text-2xl font-bold mb-2 ${
                    plan.popular ? "text-white" : "text-gray-900"
                  }`}
                >
                  {plan.name}
                </h3>
                <div className="mb-6">
                  <span className="text-5xl font-bold">
                    {plan.price === "Custom" ? "" : "Rp"}
                    {plan.price}
                  </span>
                  {plan.price !== "Custom" && (
                    <span className="text-lg">/bulan</span>
                  )}
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle
                        className={`w-5 h-5 ${
                          plan.popular ? "text-yellow-400" : "text-green-500"
                        }`}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  className={`w-full py-3 rounded-full font-medium transition ${
                    plan.popular
                      ? "bg-white text-blue-600 hover:bg-gray-100"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                  onClick={() =>
                    (window.location.href =
                      plan.name === "Enterprise" ? "#" : "/register/page.js")
                  }
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-cyan-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Siap Memulai Proyek Anda?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Dapatkan konsultasi gratis dan demo platform kami hari ini
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-4 rounded-full text-lg font-medium hover:bg-gray-100 transition">
              Hubungi Kami
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-white hover:text-blue-600 transition">
              Lihat Portfolio
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Plane className="w-8 h-8 text-blue-400" />
              <span className="text-2xl font-bold text-white">AgroMap</span>
            </div>
            <p className="text-gray-400">
              Platform pemetaan UAV profesional untuk transformasi data udara
              menjadi insight bisnis.
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Produk</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="hover:text-blue-400">
                  Pemetaan Pertanian
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-400">
                  Survei Topografi
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-400">
                  Inspeksi Aset
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Perusahaan</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="hover:text-blue-400">
                  Tentang Kami
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-400">
                  Tim
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-400">
                  Karir
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-400">
                  Kontak
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Kontak</h4>
            <ul className="space-y-2 text-gray-400">
              <li>Email: info@agromap.id</li>
              <li>Tel: +62 812 3456 7890</li>
              <li>Yogyakarta, Indonesia</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-800 text-center text-gray-500">
          <p>&copy; 2024 AgroMap. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
