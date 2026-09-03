"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import {
  Menu,
  X,
  ArrowUpRight,
  ArrowRight,
  Check,
  Layers3,
  Cloud,
  Users,
  Leaf,
  Satellite,
  ScanLine,
  Sprout,
  Map,
  BarChart3,
  ShieldCheck,
  Gauge,
  Database,
  Cpu,
  ChevronDown,
  Target,
  Award,
  Zap,
} from "lucide-react";

type PricingPlan = {
  id: string;
  tier: string;
  price: number;
  features: string[];
  name: string;
  cta: string;
  popular: boolean;
};

const TIER_CONFIG: Record<
  string,
  { name: string; cta: string; popular: boolean }
> = {
  free: {
    name: "Paket Kelompok Tani",
    cta: "Hubungi Koperasi",
    popular: false,
  },
  desa: {
    name: "Paket Koperasi Desa",
    cta: "Konsultasi Gratis",
    popular: true,
  },
  kecamatan: {
    name: "Paket Enterprise",
    cta: "Hubungi Tim",
    popular: false,
  },
};

const imageUrls = {
  hero: "https://eu-images.contentstack.com/v3/assets/bltdd43779342bd9107/blt9fc36e8651c47281/6391d1dc14f3827b95faa533/Drone_20Soybeans_1.jpg",

  droneField:
    "https://ecdn6.globalso.com/public/img/2025-08-23/5005356818_1.png",

  crops:
    "https://www.alcimed.com/wp-content/uploads/2023/12/precision_agriculture_min-1.jpg",

  farmer:
    "https://static.wixstatic.com/media/211bbd_c3d1847e4f0c4088b353d436a81e928a~mv2.webp/v1/fill/w_980%2Ch_551%2Cal_c%2Cq_85%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/211bbd_c3d1847e4f0c4088b353d436a81e928a~mv2.webp",

  spraying:
    "https://q9.itc.cn/images01/20250911/8845dedb1b03455b8fde43de04c09709.jpeg",

  field:
    "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1920&q=85",
};

export default function UAVLandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);

  useEffect(() => {
    fetch("http://localhost:8000/api/admin/plans")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Gagal mengambil paket");
        }

        return res.json();
      })
      .then(
        (
          data: {
            id: string;
            tier: string;
            price: number;
            features: string[];
          }[]
        ) => {
          const order = ["free", "desa", "kecamatan"];

          const mapped: PricingPlan[] = data
            .map((plan) => ({
              ...plan,
              name: TIER_CONFIG[plan.tier]?.name || plan.tier,
              cta: TIER_CONFIG[plan.tier]?.cta || "Mulai Sekarang",
              popular: TIER_CONFIG[plan.tier]?.popular || false,
            }))
            .sort((a, b) => order.indexOf(a.tier) - order.indexOf(b.tier));

          setPricingPlans(mapped);
        }
      )
      .catch(() => {
        setPricingPlans([
          {
            id: "1",
            tier: "free",
            price: 0,
            features: [
              "Cakupan lahan 10–20 hektar",
              "Analisis NDVI dasar",
              "Peta kesehatan tanaman",
            ],
            name: "Paket Kelompok Tani",
            cta: "Hubungi Koperasi",
            popular: false,
          },
          {
            id: "2",
            tier: "desa",
            price: 500000,
            features: [
              "Cakupan hingga 100 hektar",
              "Analisis NDVI + NPK",
              "Dashboard web interaktif",
              "Priority support",
            ],
            name: "Paket Koperasi Desa",
            cta: "Konsultasi Gratis",
            popular: true,
          },
          {
            id: "3",
            tier: "kecamatan",
            price: 1500000,
            features: [
              "Cakupan unlimited",
              "Semua sensor",
              "API access",
              "Dedicated account manager",
            ],
            name: "Paket Enterprise",
            cta: "Hubungi Tim",
            popular: false,
          },
        ]);
      });
  }, []);

  const technologies = [
    {
      number: "01",
      title: "Sensor Hiperspektral",
      description:
        "Menangkap informasi spektral tanaman untuk mendeteksi perubahan kesehatan sebelum terlihat secara visual.",
      icon: <Layers3 className="h-5 w-5" />,
    },
    {
      number: "02",
      title: "LiDAR & Topografi",
      description:
        "Menghasilkan data elevasi dan kontur untuk memahami struktur lahan, drainase, dan risiko genangan.",
      icon: <ScanLine className="h-5 w-5" />,
    },
    {
      number: "03",
      title: "Cloud Analytics",
      description:
        "Data penerbangan diproses menjadi informasi yang mudah dipahami melalui dashboard berbasis cloud.",
      icon: <Cloud className="h-5 w-5" />,
    },
    {
      number: "04",
      title: "Precision Farming",
      description:
        "Mengubah data menjadi rekomendasi tindakan yang lebih tepat untuk pupuk, air, dan kesehatan tanaman.",
      icon: <Leaf className="h-5 w-5" />,
    },
  ];

  const services = [
    {
      index: "01",
      title: "Pemetaan Vegetasi",
      subtitle: "NDVI & Crop Health",
      description:
        "Pantau tingkat kehijauan dan kesehatan tanaman secara spasial untuk menemukan area yang membutuhkan perhatian.",
      image: imageUrls.crops,
      icon: <Sprout className="h-5 w-5" />,
      points: [
        "Deteksi stress tanaman",
        "Peta variasi kesehatan lahan",
        "Monitoring pertumbuhan",
      ],
    },
    {
      index: "02",
      title: "Analisis Nutrisi Tanah",
      subtitle: "Nitrogen, Phosphorus & Kalium",
      description:
        "Identifikasi variasi kebutuhan nutrisi dan gunakan data untuk menyusun strategi pemupukan yang lebih efisien.",
      image: imageUrls.spraying,
      icon: <Database className="h-5 w-5" />,
      points: [
        "Peta N, P dan K",
        "Rekomendasi dosis pupuk",
        "Efisiensi biaya operasional",
      ],
    },
    {
      index: "03",
      title: "Pemetaan Topografi",
      subtitle: "LiDAR & Digital Elevation",
      description:
        "Data elevasi beresolusi tinggi untuk mendukung irigasi, drainase, tata ruang dan identifikasi zona risiko.",
      image: imageUrls.droneField,
      icon: <Map className="h-5 w-5" />,
      points: [
        "Digital Elevation Model",
        "Analisis kontur lahan",
        "Identifikasi zona risiko",
      ],
    },
  ];

  const useCases = [
    {
      label: "01",
      title: "Monitoring Tanaman",
      text: "Pantau kondisi lahan secara berkala tanpa harus menyusuri seluruh area secara manual.",
    },
    {
      label: "02",
      title: "Optimasi Pupuk",
      text: "Distribusikan input sesuai kebutuhan lahan berdasarkan data spasial.",
    },
    {
      label: "03",
      title: "Manajemen Air",
      text: "Identifikasi pola elevasi dan kondisi lahan untuk membantu perencanaan irigasi.",
    },
    {
      label: "04",
      title: "Deteksi Risiko",
      text: "Temukan area yang berpotensi mengalami stress, genangan, atau masalah pertumbuhan.",
    },
  ];

  return (
    <main className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      {/* =========================================================
          NAVIGATION
      ========================================================== */}
      <header className="fixed left-0 right-0 top-0 z-50 px-3 pt-3 sm:px-5">
        <nav className="mx-auto flex h-[58px] max-w-7xl items-center justify-between rounded-full border border-black/10 bg-white/95 px-3 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <a href="#beranda" className="flex items-center gap-3 pl-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black">
              <Map className="h-4 w-4 text-white" />
            </div>

            <div className="hidden leading-none sm:block">
              <p className="text-[12px] font-black tracking-[0.22em] text-black">
                UAV
              </p>
              <p className="text-[9px] font-medium tracking-[0.28em] text-black/50">
                DaaS PLATFORM
              </p>
            </div>
          </a>

          <div className="hidden items-center gap-1 md:flex">
            {[
              ["Beranda", "#beranda"],
              ["Teknologi", "#teknologi"],
              ["Layanan", "#layanan"],
              ["Harga", "#harga"],
              ["Tentang", "#tentang"],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="rounded-full px-4 py-2 text-[12px] font-medium text-black/65 transition hover:bg-black/[0.06] hover:text-black"
              >
                {label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <a
              href="/login"
              className="rounded-full px-4 py-2 text-[12px] font-semibold text-black/70 transition hover:bg-black/[0.06] hover:text-black"
            >
              Login
            </a>

            <a
              href="/register"
              className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-[12px] font-semibold text-white transition hover:bg-neutral-800"
            >
              Daftar Sekarang
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>

          <button
            type="button"
            aria-label="Toggle navigation"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white md:hidden"
          >
            {mobileMenuOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </button>
        </nav>

        {mobileMenuOpen && (
          <div className="mx-auto mt-2 max-w-7xl overflow-hidden rounded-3xl border border-white/10 bg-neutral-950 shadow-2xl md:hidden">
            <div className="space-y-1 p-3">
              {[
                ["Beranda", "#beranda"],
                ["Teknologi", "#teknologi"],
                ["Layanan", "#layanan"],
                ["Harga", "#harga"],
                ["Tentang", "#tentang"],
              ].map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-2xl px-4 py-3 text-sm text-white/70 transition hover:bg-white/[0.06] hover:text-white"
                >
                  {label}
                </a>
              ))}

              <div className="grid grid-cols-2 gap-2 pt-2">
                <a
                  href="/login"
                  className="rounded-2xl border border-white/10 px-4 py-3 text-center text-sm"
                >
                  Login
                </a>

                <a
                  href="/register"
                  className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-black"
                >
                  Daftar
                </a>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* =========================================================
          HERO
      ========================================================== */}
      <section id="beranda" className="px-2 pb-3 pt-2 sm:px-4 sm:pt-4">
        <div className="relative mx-auto min-h-[760px] max-w-7xl overflow-hidden rounded-[30px] border border-white/10 sm:min-h-[710px] sm:rounded-[38px]">
          <img
            src={imageUrls.hero}
            alt="Drone monitoring area pertanian"
            className="absolute inset-0 h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/15 to-black/80" />

          <div className="absolute inset-x-0 bottom-0 p-7 sm:p-10 lg:p-14">
            <div className="max-w-4xl">
              <h1 className="max-w-4xl text-4xl font-semibold leading-[1.02] tracking-[-0.045em] sm:text-6xl lg:text-8xl">
                Data dari udara.
                <br />
                Keputusan lebih tepat.
              </h1>

              <p className="mt-6 max-w-2xl text-sm leading-6 text-white/75 sm:text-base">
                Platform berbasis UAV dengan sensor hiperspektral, LiDAR, dan
                cloud analytics untuk membantu petani dan koperasi memahami
                kondisi lahan secara lebih cepat, akurat, dan terukur.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:bg-white/90"
                >
                  Dapatkan Data Anda
                  <ArrowUpRight className="h-4 w-4" />
                </a>

                <a
                  href="#teknologi"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/10"
                >
                  Jelajahi Teknologi
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          MISSION
      ========================================================== */}
      <section className="px-5 py-28 sm:px-8 lg:py-40">
        <div className="mx-auto max-w-5xl text-center">
          <p className="mb-7 text-[10px] font-semibold uppercase tracking-[0.35em] text-white/35">
            OUR MISSION
          </p>

          <h2 className="text-3xl font-semibold leading-tight tracking-[-0.035em] sm:text-5xl lg:text-6xl">
            Membuat teknologi UAV
            <br />
            lebih dekat dengan petani.
          </h2>

          <p className="mx-auto mt-8 max-w-3xl text-sm leading-7 text-white/50 sm:text-base">
            Kami mengubah data udara yang kompleks menjadi informasi praktis
            yang dapat digunakan untuk memahami kesehatan tanaman, nutrisi
            tanah, kondisi topografi dan kebutuhan operasional pertanian.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-7xl overflow-hidden rounded-[30px] border border-white/10 bg-neutral-950">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
            <div className="relative min-h-[430px]">
              <img
                src={imageUrls.farmer}
                alt="Drone pada lahan pertanian"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

              <div className="absolute bottom-7 left-7 max-w-md">
                <p className="text-[10px] uppercase tracking-[0.25em] text-white/50">
                  FIELD INTELLIGENCE
                </p>
                <p className="mt-2 text-xl font-medium">
                  Satu penerbangan dapat menghasilkan gambaran menyeluruh
                  kondisi lahan.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-y divide-white/10">
              {[
                {
                  number: "01",
                  value: "NDVI",
                  label: "Vegetation analysis",
                },
                {
                  number: "02",
                  value: "NPK",
                  label: "Soil nutrient mapping",
                },
                {
                  number: "03",
                  value: "LiDAR",
                  label: "Terrain intelligence",
                },
                {
                  number: "04",
                  value: "CLOUD",
                  label: "Data processing",
                },
              ].map((item) => (
                <div
                  key={item.number}
                  className="flex min-h-[210px] flex-col justify-between p-6 sm:p-8"
                >
                  <span className="text-[10px] text-white/30">
                    {item.number}
                  </span>

                  <div>
                    <p className="text-2xl font-semibold tracking-tight">
                      {item.value}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-white/45">
                      {item.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
    TECHNOLOGY STACK
========================================================== */}
      <section
        id="teknologi"
        className="rounded-[34px] bg-[#f2f2f0] px-5 py-24 text-black sm:mx-3 sm:px-8 lg:py-32"
      >
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col justify-between gap-6 md:flex-row md:items-end"
          >
            <div>
              <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-black/35">
                TECHNOLOGY STACK
              </p>

              <h2 className="max-w-3xl text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">
                Teknologi untuk
                <br />
                memahami setiap hektar.
              </h2>
            </div>

            <p className="max-w-md text-sm leading-6 text-black/50">
              Empat lapisan data yang bekerja berurutan — dari penangkapan
              sinyal di udara hingga rekomendasi yang siap dieksekusi di lahan.
            </p>
          </motion.div>

          {/* =========================================================
        PIPELINE — disusun seperti profil kontur/elevasi,
        merepresentasikan alur data sekaligus tema topografi
    ========================================================== */}
          <div className="relative mt-24 sm:mt-32">
            {/* garis kontur penghubung, hanya tampil di desktop */}
            <svg
              viewBox="0 0 1000 100"
              preserveAspectRatio="none"
              className="pointer-events-none absolute inset-x-0 top-[86px] hidden h-[100px] w-full lg:block"
            >
              <motion.path
                d="M 125 24 L 375 76 L 625 24 L 875 76"
                fill="none"
                stroke="black"
                strokeOpacity="0.15"
                strokeWidth="1.5"
                strokeDasharray="3 7"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 1.4, ease: "easeInOut" }}
              />
            </svg>

            <motion.div
              variants={{
                hidden: {},
                visible: {
                  transition: { staggerChildren: 0.15, delayChildren: 0.1 },
                },
              }}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-4"
            >
              {technologies.map((technology, i) => (
                <motion.div
                  key={technology.number}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
                    },
                  }}
                  className={`relative flex flex-col ${
                    i % 2 === 0 ? "lg:-translate-y-6" : "lg:translate-y-9"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#3f4f2e] text-[10px] font-semibold text-white">
                      {technology.number}
                    </span>
                    <div className="h-px flex-1 bg-black/10 sm:hidden" />
                  </div>

                  <div className="mt-6 flex h-14 w-14 items-center justify-center rounded-full border border-black/15 bg-white text-black transition-colors group-hover:bg-black">
                    {technology.icon}
                  </div>

                  <h3 className="mt-6 text-xl font-semibold tracking-tight">
                    {technology.title}
                  </h3>

                  <p className="mt-3 max-w-[240px] text-sm leading-6 text-black/50">
                    {technology.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* =========================================================
        FROM DATA TO ACTION — panel editorial, bukan split 50/50
    ========================================================== */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative mt-24 min-h-[520px] overflow-hidden rounded-[28px] bg-black sm:min-h-[560px]"
          >
            <img
              src={imageUrls.droneField}
              alt="Drone pertanian"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10" />

            <ScanOverlay />

            {/* kartu statistik mengambang, memberi asimetri */}
            <div className="absolute left-6 top-6 max-w-[240px] rounded-2xl border border-white/15 bg-black/40 p-5 backdrop-blur-md sm:left-10 sm:top-10">
              <p className="text-3xl font-semibold tracking-tight text-white">
                4 layer
              </p>
              <p className="mt-1 text-xs leading-5 text-white/50">
                data terproses dari satu kali penerbangan drone
              </p>
            </div>

            <div className="absolute inset-x-0 bottom-0 p-8 sm:p-12 lg:p-14">
              <div className="max-w-xl">
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
                  FROM DATA TO ACTION
                </p>

                <h3 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Bukan hanya mengambil gambar.
                </h3>

                <p className="mt-4 max-w-md text-sm leading-6 text-white/50">
                  Setiap data penerbangan diproses menjadi layer informasi yang
                  dapat digunakan untuk menentukan langkah berikutnya.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* =========================================================
          SERVICES
      ========================================================== */}
      <section id="layanan" className="px-5 py-28 sm:px-8 lg:py-40">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/35">
              DATA SERVICES
            </p>

            <h2 className="text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">
              Data yang menjawab
              <br />
              pertanyaan di lapangan.
            </h2>

            <p className="mt-7 max-w-2xl text-sm leading-7 text-white/45 sm:text-base">
              Pilih layer data sesuai kebutuhan operasional lahan. Semua hasil
              dirancang untuk membantu pengambilan keputusan, bukan sekadar
              visualisasi.
            </p>
          </div>

          <div className="mt-16 space-y-5">
            {services.map((service) => (
              <article
                key={service.index}
                className="group overflow-hidden rounded-[30px] border border-white/10 bg-neutral-950"
              >
                <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
                  <div className="relative min-h-[360px] overflow-hidden lg:min-h-[470px]">
                    <img
                      src={service.image}
                      alt={service.title}
                      className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                    <div className="absolute left-6 top-6 flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3 py-2 text-[10px] uppercase tracking-[0.18em] backdrop-blur-md">
                      {service.icon}
                      {service.subtitle}
                    </div>

                    <span className="absolute bottom-6 left-6 text-[10px] tracking-[0.25em] text-white/45">
                      SERVICE {service.index}
                    </span>
                  </div>

                  <div className="flex flex-col justify-between p-7 sm:p-10 lg:p-12">
                    <div>
                      <h3 className="max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
                        {service.title}
                      </h3>

                      <p className="mt-5 max-w-xl text-sm leading-7 text-white/45 sm:text-base">
                        {service.description}
                      </p>
                    </div>

                    <div className="mt-12 grid gap-3">
                      {service.points.map((point) => (
                        <div
                          key={point}
                          className="flex items-center gap-3 border-t border-white/10 pt-3 text-sm text-white/75"
                        >
                          <Check className="h-4 w-4 text-white/50" />
                          {point}
                        </div>
                      ))}
                    </div>

                    <div className="mt-10">
                      <button className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-white transition hover:bg-white hover:text-black">
                        Pelajari layanan
                        <ArrowUpRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          USE CASES
      ========================================================== */}
      <section className="px-5 pb-28 sm:px-8 lg:pb-40">
        <div className="mx-auto max-w-7xl rounded-[34px] border border-white/10 bg-[#111111] p-7 sm:p-10 lg:p-14">
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/30">
                USE CASES
              </p>

              <h2 className="mt-5 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
                Dibangun untuk
                <br />
                kebutuhan nyata.
              </h2>

              <p className="mt-6 max-w-md text-sm leading-6 text-white/40">
                Sistem UAV bukan sekadar teknologi udara. Nilainya muncul ketika
                data dapat membantu menyelesaikan masalah operasional.
              </p>
            </div>

            <div className="divide-y divide-white/10">
              {useCases.map((useCase) => (
                <div
                  key={useCase.label}
                  className="grid grid-cols-[48px_1fr] gap-5 py-6 first:pt-0 last:pb-0 sm:grid-cols-[70px_1fr]"
                >
                  <span className="text-[10px] text-white/25">
                    {useCase.label}
                  </span>

                  <div>
                    <h3 className="text-xl font-medium">{useCase.title}</h3>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-white/40">
                      {useCase.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          IMAGE / PERFORMANCE SECTION
      ========================================================== */}
      <section className="px-5 pb-28 sm:px-8 lg:pb-40">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[34px] bg-[#0d0d0d]">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
            <div className="relative min-h-[500px]">
              <img
                src={imageUrls.field}
                alt="Lahan pertanian dari udara"
                className="absolute inset-0 h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-black/70 lg:bg-gradient-to-r lg:from-transparent lg:to-[#0d0d0d]" />
            </div>

            <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/30">
                WHY UAV DATA
              </p>

              <h2 className="mt-6 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
                Melihat lebih
                <br />
                banyak dalam sekali
                <br />
                penerbangan.
              </h2>

              <div className="mt-10 grid grid-cols-2 gap-4">
                {[
                  {
                    icon: <Satellite className="h-4 w-4" />,
                    value: "High-res",
                    label: "Aerial imagery",
                  },
                  {
                    icon: <Cpu className="h-4 w-4" />,
                    value: "Cloud",
                    label: "Data processing",
                  },
                  {
                    icon: <Zap className="h-4 w-4" />,
                    value: "Fast",
                    label: "Field turnaround",
                  },
                  {
                    icon: <BarChart3 className="h-4 w-4" />,
                    value: "Actionable",
                    label: "Decision support",
                  },
                ].map((item) => (
                  <div
                    key={item.value}
                    className="rounded-2xl border border-white/10 p-4"
                  >
                    <div className="text-white/50">{item.icon}</div>
                    <p className="mt-8 text-lg font-semibold">{item.value}</p>
                    <p className="mt-1 text-[11px] text-white/35">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          PRICING
      ========================================================== */}
      <section
        id="harga"
        className="rounded-[34px] bg-[#f2f2f0] px-5 py-28 text-black sm:mx-3 sm:px-8 lg:py-36"
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-black/35">
                PRICING
              </p>

              <h2 className="text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">
                Pilih skala layanan
                <br />
                yang sesuai.
              </h2>
            </div>

            <p className="max-w-md text-sm leading-6 text-black/45">
              Model berlangganan fleksibel untuk kelompok tani, koperasi desa,
              hingga kebutuhan enterprise.
            </p>
          </div>

          {pricingPlans.length === 0 ? (
            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-[470px] animate-pulse rounded-[28px] bg-white"
                />
              ))}
            </div>
          ) : (
            <div className="mt-14 grid gap-5 lg:grid-cols-3">
              {pricingPlans.map((plan) => {
                const isPopular = plan.popular;

                return (
                  <article
                    key={plan.id}
                    className={`relative flex min-h-[510px] flex-col rounded-[28px] border p-7 sm:p-9 ${
                      isPopular
                        ? "border-black bg-black text-white"
                        : "border-black/10 bg-white"
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute right-6 top-6 rounded-full bg-white px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-black">
                        Paling populer
                      </div>
                    )}

                    <div>
                      <p
                        className={`text-[10px] font-semibold uppercase tracking-[0.25em] ${
                          isPopular ? "text-white/40" : "text-black/35"
                        }`}
                      >
                        {plan.tier}
                      </p>

                      <h3 className="mt-5 text-2xl font-semibold tracking-tight">
                        {plan.name}
                      </h3>

                      <div className="mt-8 flex items-end gap-1">
                        <span className="text-4xl font-semibold tracking-tight">
                          {plan.tier === "kecamatan"
                            ? "Custom"
                            : plan.price === 0
                            ? "Gratis"
                            : `Rp ${plan.price.toLocaleString("id-ID")}`}
                        </span>

                        {plan.tier !== "kecamatan" && plan.price > 0 && (
                          <span
                            className={`pb-1.5 text-xs ${
                              isPopular ? "text-white/35" : "text-black/35"
                            }`}
                          >
                            /bulan
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      className={`my-8 border-t ${
                        isPopular ? "border-white/10" : "border-black/10"
                      }`}
                    />

                    <ul className="flex-1 space-y-4">
                      {plan.features.map((feature) => (
                        <li
                          key={feature}
                          className={`flex gap-3 text-sm ${
                            isPopular ? "text-white/70" : "text-black/65"
                          }`}
                        >
                          <Check
                            className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                              isPopular ? "text-white" : "text-black"
                            }`}
                          />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      className={`mt-10 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-semibold transition ${
                        isPopular
                          ? "bg-white text-black hover:bg-white/90"
                          : "bg-black text-white hover:bg-neutral-800"
                      }`}
                    >
                      {plan.cta}
                      <ArrowUpRight className="h-4 w-4" />
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* =========================================================
          ABOUT / PARTNERSHIP
      ========================================================== */}
      <section id="tentang" className="px-5 py-28 sm:px-8 lg:py-40">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-14 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/30">
                OUR EXPERTISE
              </p>

              <h2 className="mt-6 text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">
                Engineering
                <br />
                agriculture's
                <br />
                next layer.
              </h2>

              <p className="mt-8 max-w-md text-sm leading-7 text-white/45">
                Platform ini menggabungkan teknologi UAV, penginderaan jauh,
                cloud computing, dan analitik data untuk mendukung pertanian
                presisi di Indonesia.
              </p>

              <a
                href="/register"
                className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm transition hover:bg-white hover:text-black"
              >
                Mulai sekarang
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>

            <div>
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[28px] border border-white/10 bg-white/10">
                {[
                  {
                    icon: <Award />,
                    value: "8 Tahun",
                    label: "Kolaborasi riset",
                  },
                  {
                    icon: <ShieldCheck />,
                    value: "1 UAV",
                    label: "Paten terdaftar",
                  },
                  {
                    icon: <BarChart3 />,
                    value: "3 Jurnal",
                    label: "Publikasi ilmiah",
                  },
                  {
                    icon: <Target />,
                    value: "14 HKI",
                    label: "Kekayaan intelektual",
                  },
                ].map((stat) => (
                  <div key={stat.label} className="bg-[#101010] p-7 sm:p-9">
                    <div className="text-white/45">{stat.icon}</div>

                    <p className="mt-14 text-3xl font-semibold tracking-tight">
                      {stat.value}
                    </p>

                    <p className="mt-2 text-xs text-white/35">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div className="rounded-[28px] border border-white/10 bg-[#111111] p-7">
                  <Users className="h-5 w-5 text-white/50" />
                  <p className="mt-10 text-xl font-medium">
                    Model bisnis koperasi
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/35">
                    Membuka akses teknologi untuk kelompok tani dengan model
                    penggunaan kolektif.
                  </p>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-[#111111] p-7">
                  <Leaf className="h-5 w-5 text-white/50" />
                  <p className="mt-10 text-xl font-medium">
                    Pertanian berkelanjutan
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/35">
                    Membantu penggunaan input pertanian menjadi lebih tepat dan
                    terukur.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          CTA
      ========================================================== */}
      <section className="px-3 pb-3">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[34px] bg-white px-6 py-24 text-black sm:px-10 lg:px-16 lg:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-black/35">
              START WITH YOUR FIELD
            </p>

            <h2 className="mt-6 text-4xl font-semibold tracking-[-0.05em] sm:text-6xl lg:text-7xl">
              Saatnya membuat
              <br />
              data bekerja untuk lahan.
            </h2>

            <p className="mx-auto mt-7 max-w-2xl text-sm leading-7 text-black/45 sm:text-base">
              Konsultasikan kebutuhan UAV dan data pertanian untuk koperasi,
              kelompok tani, maupun organisasi skala enterprise.
            </p>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
              >
                Bergabung Sekarang
                <ArrowUpRight className="h-4 w-4" />
              </a>

              <a
                href="#harga"
                className="inline-flex items-center justify-center rounded-full border border-black/10 px-7 py-3.5 text-sm font-semibold transition hover:bg-black/[0.04]"
              >
                Lihat Paket
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FOOTER
      ========================================================== */}
      <footer className="px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-10 border-b border-white/10 pb-10 lg:flex-row">
            <div className="max-w-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black">
                  <Map className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-xs font-black tracking-[0.25em]">UAV</p>
                  <p className="text-[9px] tracking-[0.3em] text-white/35">
                    DAAS PLATFORM
                  </p>
                </div>
              </div>

              <p className="mt-6 text-sm leading-6 text-white/35">
                Platform Data-as-a-Service berbasis UAV untuk mendukung
                pertanian presisi yang inklusif, terukur dan berkelanjutan.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-12 sm:grid-cols-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-white/25">
                  Explore
                </p>

                <div className="mt-5 space-y-3 text-sm text-white/50">
                  <a
                    href="#beranda"
                    className="block transition hover:text-white"
                  >
                    Beranda
                  </a>
                  <a
                    href="#teknologi"
                    className="block transition hover:text-white"
                  >
                    Teknologi
                  </a>
                  <a
                    href="#layanan"
                    className="block transition hover:text-white"
                  >
                    Layanan
                  </a>
                  <a
                    href="#harga"
                    className="block transition hover:text-white"
                  >
                    Harga
                  </a>
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-white/25">
                  Account
                </p>

                <div className="mt-5 space-y-3 text-sm text-white/50">
                  <a
                    href="/login"
                    className="block transition hover:text-white"
                  >
                    Login
                  </a>
                  <a
                    href="/register"
                    className="block transition hover:text-white"
                  >
                    Daftar
                  </a>
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-white/25">
                  Contact
                </p>

                <div className="mt-5 space-y-3 text-sm text-white/50">
                  <p>info@uavdaas.id</p>
                  <p>+62 274 123 456</p>
                  <p>Yogyakarta, Indonesia</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-4 pt-7 text-[11px] text-white/25 sm:flex-row">
            <p>© 2024 UAV DaaS Platform. All rights reserved.</p>

            <div className="flex gap-5">
              <a href="#" className="transition hover:text-white">
                Privacy Policy
              </a>

              <a href="#" className="transition hover:text-white">
                Terms of Use
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

function ScanOverlay() {
  const waypoints = [
    { x: "18%", y: "28%" },
    { x: "62%", y: "20%" },
    { x: "40%", y: "58%" },
    { x: "78%", y: "66%" },
  ];

  return (
    <div className="pointer-events-none absolute inset-0">
      <motion.div
        initial={{ y: "-10%" }}
        animate={{ y: "110%" }}
        transition={{
          duration: 4.5,
          repeat: Infinity,
          ease: "linear",
          repeatDelay: 1,
        }}
        className="absolute inset-x-0 h-px bg-white/70 shadow-[0_0_12px_2px_rgba(255,255,255,0.5)]"
      />

      {waypoints.map((point, i) => (
        <motion.div
          key={i}
          className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/80"
          style={{ left: point.x, top: point.y }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: [0, 1, 1, 0.4], scale: [0.5, 1.2, 1, 1] }}
          transition={{
            duration: 2.5,
            delay: i * 0.6,
            repeat: Infinity,
            repeatDelay: waypoints.length * 0.6,
          }}
        >
          <span className="absolute inset-0 rounded-full border border-white/30" />
        </motion.div>
      ))}
    </div>
  );
}
