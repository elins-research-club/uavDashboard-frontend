"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { useUserRole } from "@/context/UserRoleContext";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CircleCheck,
  Eye,
  Gem,
  HardDrive,
  Layers,
  Leaf,
  Lock,
  MapPin,
  MapPinned,
  Search,
  X,
} from "lucide-react";

/* ============================================================
   TYPES
============================================================ */

type MapRecord = {
  id: string;
  title: string;
  location: string;
  survey_date: string;
  map_type?: string;
  description?: string;
  file_size: number;
  locked_for_free: boolean;
  created_at: string;
};

type SubscriptionTierConfig = {
  key: string;
  label: string;
  shortLabel: string;
  description: string;
  heroTitle: string;
  heroDescription: string;
  heroCta: string;
  heroCtaHref: string;
  orbTint: string;
};

/* ============================================================
   HELPERS
============================================================ */

const formatSize = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

const formatStorageGB = (bytes: number) =>
  `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;

const normalizeTier = (tier?: string | null) => {
  return String(tier || "free").toLowerCase();
};

const getTierConfig = (tier?: string | null): SubscriptionTierConfig => {
  const normalizedTier = normalizeTier(tier);

  if (normalizedTier === "desa") {
    return {
      key: "desa",
      label: "Tier Desa",
      shortLabel: "Desa",
      description: "Akses data dalam cakupan satu desa.",
      heroTitle: "Kelola data lahan desa dengan analisis yang lebih lengkap.",
      heroDescription:
        "Gunakan akses layer dan analisis lahan untuk memantau kondisi area desa Anda secara lebih menyeluruh.",
      heroCta: "Kelola Langganan",
      heroCtaHref: "/dashboard/subscription",
      orbTint: "#91b928",
    };
  }

  if (normalizedTier === "kecamatan") {
    return {
      key: "kecamatan",
      label: "Tier Kecamatan",
      shortLabel: "Kecamatan",
      description: "Akses data dalam cakupan satu kecamatan.",
      heroTitle: "Kelola dan analisis data lahan pada skala kecamatan.",
      heroDescription:
        "Manfaatkan akses data yang lebih luas untuk melihat kondisi lahan dan analisis agregat dalam satu wilayah kecamatan.",
      heroCta: "Kelola Langganan",
      heroCtaHref: "/dashboard/subscription",
      orbTint: "#d99a2b",
    };
  }

  return {
    key: "free",
    label: "Free",
    shortLabel: "Free",
    description: "Akses dasar untuk melihat data peta publik.",
    heroTitle: "Tingkatkan pengalaman dengan paket premium.",
    heroDescription:
      "Dapatkan kapasitas lebih besar, analisis lengkap, dan akses layer data yang tersedia sesuai paket subscription Anda.",
    heroCta: "Lihat Paket",
    heroCtaHref: "/dashboard/subscription",
    orbTint: "#8cc7a5",
  };
};

/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  orbTint,
  delay = 0,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: React.ComponentType<{
    className?: string;
    strokeWidth?: number;
  }>;
  orbTint: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -3 }}
      className="group relative min-h-[124px] overflow-hidden rounded-3xl border border-brand-800/15 bg-white p-5 shadow-card transition-shadow duration-300 hover:border-brand-800/25 hover:shadow-card-hover"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-7 -right-7 h-24 w-24 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-[1.4]"
      >
        <div
          className="absolute -inset-4 rounded-full opacity-70 blur-lg transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background: `${orbTint}26`,
          }}
        />

        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle at 32% 28%, #ffffffcc 0%, ${orbTint}40 42%, ${orbTint}5c 72%, ${orbTint}73 100%)`,
            boxShadow: `inset -4px -6px 10px ${orbTint}33, inset 3px 4px 8px rgba(255,255,255,0.75), 0 6px 14px ${orbTint}2e`,
          }}
        />

        <div className="absolute left-[18%] top-[14%] h-4 w-4 rounded-full bg-white/90 blur-[3px]" />
      </div>

      <div className="relative flex h-full flex-col justify-between gap-4">
        <div className="flex items-center justify-between">
          <p className="micro-label">{label}</p>

          <span className="icon-ring h-9 w-9">
            <Icon className="h-4 w-4" strokeWidth={1.75} />
          </span>
        </div>

        <div className="min-w-0">
          <p className="truncate text-2xl font-bold tracking-[-0.03em] text-brand-900">
            {value}
          </p>

          <p className="mt-0.5 text-xs font-medium text-brand-800/60">{hint}</p>
        </div>
      </div>
    </motion.div>
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function DashboardHomePage() {
  const { user } = useUserRole();

  const [maps, setMaps] = useState<MapRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  /* ==========================================================
     TIER
  ========================================================== */

  const normalizedTier = normalizeTier(user?.tier);

  const tierConfig = getTierConfig(normalizedTier);

  const isFreeTier = normalizedTier === "free";

  const isPaidTier =
    normalizedTier === "desa" || normalizedTier === "kecamatan";

  /* ==========================================================
     LOAD MAPS
  ========================================================== */

  useEffect(() => {
    let mounted = true;

    api
      .get("/maps")
      .then(({ data }) => {
        if (!mounted) {
          return;
        }

        setMaps(data?.maps || []);
      })
      .catch((requestError) => {
        if (!mounted) {
          return;
        }

        console.error("Gagal memuat dashboard:", requestError);

        setError(
          requestError?.response?.data?.detail || "Gagal memuat dashboard."
        );
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  /* ==========================================================
     MAP STATS
  ========================================================== */

  const totalStorage = maps.reduce((total, map) => total + map.file_size, 0);

  const latestMaps = maps.slice(0, 4);

  const filteredMaps = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return latestMaps;
    }

    return maps
      .filter((map) =>
        [map.title, map.location, map.description, map.map_type]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(query))
      )
      .slice(0, 4);
  }, [maps, latestMaps, searchQuery]);

  /* ==========================================================
     USER
  ========================================================== */

  const username = user?.username || "Pengguna";

  /* ==========================================================
     STATS
  ========================================================== */

  const stats = [
    {
      label: "Total Peta",
      value: maps.length,
      hint: "peta tersedia untuk akun",
      icon: Layers,
      orbTint: "#2e7d54",
    },
    {
      label: "Paket Anda",
      value: tierConfig.shortLabel,
      hint: isPaidTier ? "subscription aktif" : "lihat benefit paket",
      icon: Gem,
      orbTint: tierConfig.orbTint,
    },
    {
      label: "Aktivitas",
      value: latestMaps.length,
      hint: "upload terbaru",
      icon: Activity,
      orbTint: "#5aa37b",
    },
    {
      label: "Penyimpanan",
      value: formatStorageGB(totalStorage),
      hint: "total file peta",
      icon: HardDrive,
      orbTint: "#8cc7a5",
    },
  ];

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <main className="min-h-screen bg-page text-brand-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ==================================================
            HEADER
        =================================================== */}

        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="mt-3 text-3xl font-bold tracking-[-0.035em] text-brand-900 sm:text-4xl">
              Selamat datang, <span className="text-brand-600">{username}</span>
            </h1>

            <p className="mt-1.5 max-w-xl text-sm font-medium text-brand-800/60">
              {isPaidTier
                ? `Anda sedang menggunakan ${tierConfig.label}. Pantau kesehatan lahan Anda dari satu tempat.`
                : "Pantau kesehatan lahan Anda dari satu tempat."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="liquid-badge px-4 py-2 text-xs font-bold text-brand-800">
              <Gem className="h-3.5 w-3.5" strokeWidth={1.75} />
              Paket {tierConfig.shortLabel}
            </span>

            <Link href="/dashboard/maps" className="btn-brand">
              Kelola Peta
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          </div>
        </header>

        {/* ==================================================
            BENTO GRID
        =================================================== */}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* ==================================================
              STATS
          =================================================== */}

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-12 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <StatCard key={stat.label} {...stat} delay={index * 0.06} />
            ))}
          </section>

          {/* ==================================================
              HERO
          =================================================== */}

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
              delay: 0.2,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative min-h-[280px] overflow-hidden rounded-3xl shadow-card lg:col-span-8"
          >
            <Image
              src="https://images.unsplash.com/photo-1650227128597-dbac6c5bd1b6?auto=format&fit=crop&w=1800&q=85"
              alt="Drone pertanian di atas lahan"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 66vw"
              className="object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-r from-brand-900/85 via-brand-900/50 to-brand-900/10" />

            <div className="relative flex h-full flex-col justify-between gap-6 p-6 sm:p-8">
              {/* TIER BADGE */}

              <span className="liquid-badge-dark self-start text-2xs font-bold uppercase text-white">
                <Leaf className="h-3 w-3" strokeWidth={1.75} />

                {isFreeTier ? "Subscription" : tierConfig.label}
              </span>

              {/* CONTENT */}

              <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div className="max-w-md">
                  <h2 className="text-2xl font-bold leading-tight tracking-[-0.03em] text-white sm:text-[28px]">
                    {tierConfig.heroTitle}
                  </h2>

                  <p className="mt-2 text-sm font-medium leading-6 text-white/75">
                    {tierConfig.heroDescription}
                  </p>
                </div>

                <Link
                  href={tierConfig.heroCtaHref}
                  className="inline-flex flex-shrink-0 items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-xs font-bold text-brand-900 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glass-lg"
                >
                  {tierConfig.heroCta}

                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </Link>
              </div>
            </div>
          </motion.section>

          {/* ==================================================
              ACTIVITY
          =================================================== */}

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
              delay: 0.26,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="glass flex flex-col p-6 lg:col-span-4 lg:row-span-2"
          >
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="icon-ring h-9 w-9">
                  <Activity className="h-4 w-4" strokeWidth={1.75} />
                </span>

                <div>
                  <p className="micro-label">Aktivitas</p>

                  <h3 className="text-base font-bold tracking-[-0.02em] text-brand-900">
                    Upload Terbaru
                  </h3>
                </div>
              </div>

              <Link
                href="/dashboard/maps"
                className="text-2xs font-bold uppercase text-brand-700 transition hover:text-brand-900"
              >
                Semua
              </Link>
            </div>

            {latestMaps.length ? (
              <ol className="relative flex-1 space-y-1 before:absolute before:bottom-2 before:left-[19px] before:top-2 before:w-px before:bg-brand-800/10">
                {latestMaps.slice(0, 4).map((map) => (
                  <li key={map.id} className="relative">
                    <Link
                      href="/dashboard/maps"
                      className="group flex items-center gap-3 rounded-2xl p-2 transition hover:bg-brand-50"
                    >
                      <span className="icon-ring relative z-10 h-9 w-9 flex-shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-0.5 group-hover:scale-105">
                        <MapPinned className="h-4 w-4" strokeWidth={1.75} />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-brand-900">
                          {map.title}
                        </span>

                        <span className="mt-0.5 block text-xs font-medium text-brand-800/55">
                          {new Date(map.created_at).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            }
                          )}
                        </span>
                      </span>

                      <ArrowUpRight
                        className="h-4 w-4 flex-shrink-0 text-brand-800/40 transition group-hover:translate-x-0.5 group-hover:text-brand-800"
                        strokeWidth={1.75}
                      />
                    </Link>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-brand-800/15 py-8 text-center text-xs font-medium text-brand-800/55">
                Belum ada aktivitas.
              </p>
            )}
          </motion.section>

          {/* ==================================================
              DATA LAHAN
          =================================================== */}

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
              delay: 0.32,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="glass overflow-hidden lg:col-span-8"
          >
            <div className="flex flex-col gap-4 border-b border-brand-800/8 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2.5">
                <span className="icon-ring h-9 w-9">
                  <MapPin className="h-4 w-4" strokeWidth={1.75} />
                </span>

                <div>
                  <p className="micro-label">Dataset</p>

                  <h3 className="text-base font-bold tracking-[-0.02em] text-brand-900">
                    Data Lahan Anda
                  </h3>
                </div>
              </div>

              <div className="relative w-full sm:w-[300px]">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-800/40"
                  strokeWidth={1.75}
                />

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Cari data peta..."
                  className="glass-input"
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Hapus pencarian"
                    className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-brand-800/40 transition hover:bg-brand-100 hover:text-brand-800"
                  >
                    <X className="h-3 w-3" strokeWidth={2} />
                  </button>
                )}
              </div>
            </div>

            <div className="px-2 py-2 sm:px-3">
              {/* LOADING */}

              {isLoading && (
                <div className="space-y-2 p-3">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="flex min-h-[76px] animate-pulse items-center gap-4 rounded-2xl bg-brand-50/60 p-4"
                    >
                      <div className="h-9 w-9 rounded-xl bg-brand-800/10" />

                      <div className="flex-1">
                        <div className="h-3.5 w-1/3 rounded bg-brand-800/10" />
                        <div className="mt-2 h-3 w-1/2 rounded bg-brand-800/10" />
                      </div>

                      <div className="h-8 w-24 rounded-full bg-brand-800/10" />
                    </div>
                  ))}
                </div>
              )}

              {/* ERROR */}

              {error && !isLoading && (
                <div className="m-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-600">
                  {error}
                </div>
              )}

              {/* EMPTY */}

              {!isLoading && !error && !maps.length && (
                <div className="m-3 rounded-2xl border border-dashed border-brand-800/15 px-6 py-12 text-center">
                  <span className="icon-ring mx-auto h-12 w-12">
                    <MapPin className="h-5 w-5" strokeWidth={1.75} />
                  </span>

                  <h4 className="mt-4 text-sm font-bold text-brand-900">
                    Belum ada peta tersimpan
                  </h4>

                  <p className="mx-auto mt-1.5 max-w-sm text-xs font-medium leading-5 text-brand-800/60">
                    Setelah data pemetaan tersedia, hasilnya akan muncul di
                    sini.
                  </p>

                  <Link href="/dashboard/maps" className="btn-brand mt-5">
                    Kelola Peta
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
                  </Link>
                </div>
              )}

              {/* SEARCH EMPTY */}

              {!isLoading &&
                !error &&
                maps.length > 0 &&
                filteredMaps.length === 0 && (
                  <div className="m-3 rounded-2xl border border-dashed border-brand-800/15 px-6 py-12 text-center">
                    <span className="icon-ring mx-auto h-12 w-12">
                      <Search className="h-5 w-5" strokeWidth={1.75} />
                    </span>

                    <h4 className="mt-4 text-sm font-bold text-brand-900">
                      Data tidak ditemukan
                    </h4>

                    <p className="mx-auto mt-1.5 max-w-sm text-xs font-medium leading-5 text-brand-800/60">
                      Tidak ada dataset yang cocok dengan{" "}
                      <span className="font-bold">
                        &ldquo;
                        {searchQuery}
                        &rdquo;
                      </span>
                      .
                    </p>

                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="btn-ghost mt-5"
                    >
                      Reset Pencarian
                      <X className="h-3.5 w-3.5" strokeWidth={2} />
                    </button>
                  </div>
                )}

              {/* DATA */}

              {!isLoading && !error && filteredMaps.length > 0 && (
                <ul className="space-y-1">
                  {filteredMaps.slice(0, 4).map((layer) => {
                    /*
                     * locked_for_free berarti map ini memang
                     * tidak tersedia untuk Free.
                     *
                     * Untuk user paid, backend seharusnya sudah
                     * memfilter map berdasarkan subscription.
                     */
                    const isLocked = layer.locked_for_free && isFreeTier;

                    return (
                      <li key={layer.id}>
                        <Link
                          href={
                            isLocked
                              ? "/dashboard/subscription"
                              : "/dashboard/maps"
                          }
                          className="group flex items-center gap-4 rounded-2xl p-3 transition hover:bg-brand-50"
                        >
                          <span className="icon-ring h-10 w-10 flex-shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-0.5 group-hover:scale-105">
                            {isLocked ? (
                              <Lock className="h-4 w-4" strokeWidth={1.75} />
                            ) : (
                              <MapPinned
                                className="h-4 w-4"
                                strokeWidth={1.75}
                              />
                            )}
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="flex min-w-0 items-center gap-2">
                              <span className="truncate text-sm font-bold text-brand-900">
                                {layer.title}
                              </span>

                              {isLocked && (
                                <span className="liquid-badge flex-shrink-0 px-2 py-0.5 !text-2xs font-bold uppercase text-amber-700">
                                  Premium
                                </span>
                              )}

                              {layer.map_type && (
                                <span className="liquid-badge hidden flex-shrink-0 px-2 py-0.5 !text-2xs font-bold uppercase text-brand-800 sm:inline-flex">
                                  {layer.map_type}
                                </span>
                              )}
                            </span>

                            <span className="mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-brand-800/55">
                              <span className="inline-flex items-center gap-1">
                                <CalendarDays
                                  className="h-3 w-3"
                                  strokeWidth={1.75}
                                />

                                {new Date(layer.survey_date).toLocaleDateString(
                                  "id-ID"
                                )}
                              </span>

                              <span className="inline-flex items-center gap-1">
                                <HardDrive
                                  className="h-3 w-3"
                                  strokeWidth={1.75}
                                />

                                {formatSize(layer.file_size)}
                              </span>

                              <span className="inline-flex min-w-0 items-center gap-1">
                                <MapPin
                                  className="h-3 w-3 flex-shrink-0"
                                  strokeWidth={1.75}
                                />

                                <span className="truncate">
                                  {layer.location}
                                </span>
                              </span>
                            </span>
                          </span>

                          <span
                            className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[11px] font-bold transition ${
                              isLocked
                                ? "bg-[#d99a2b] text-white group-hover:bg-[#c68920]"
                                : "bg-brand-800 text-white group-hover:bg-brand-700"
                            }`}
                          >
                            {isLocked ? (
                              <>
                                <Lock className="h-3 w-3" strokeWidth={2} />
                                Upgrade
                              </>
                            ) : (
                              <>
                                <Eye className="h-3 w-3" strokeWidth={2} />
                                Lihat
                              </>
                            )}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {!isLoading && !error && filteredMaps.length > 0 && (
              <div className="flex items-center justify-between border-t border-brand-800/8 px-6 py-3.5">
                <p className="text-xs font-medium text-brand-800/50">
                  Menampilkan maksimal 4 data lahan.
                </p>

                <Link
                  href="/dashboard/maps"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-800 transition hover:text-brand-600"
                >
                  Lihat semua
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
                </Link>
              </div>
            )}
          </motion.section>

          {/* ==================================================
              TIPS
          =================================================== */}

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
              delay: 0.38,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="glass p-6 lg:col-span-12"
          >
            <div className="mb-5 flex items-center gap-2.5">
              <span className="icon-ring h-9 w-9">
                <Leaf className="h-4 w-4" strokeWidth={1.75} />
              </span>

              <div>
                <p className="micro-label">Field Notes</p>

                <h3 className="text-base font-bold tracking-[-0.02em] text-brand-900">
                  Tips & Informasi
                </h3>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-2xl border border-brand-800/8 bg-white/60 p-4">
                <span className="icon-ring mt-0.5 h-8 w-8 flex-shrink-0 rounded-full text-brand-700">
                  <CircleCheck className="h-4 w-4" strokeWidth={1.75} />
                </span>

                <div>
                  <p className="text-xs font-bold text-brand-900">
                    Gunakan data secara berkala
                  </p>

                  <p className="mt-1 text-xs font-medium leading-5 text-brand-800/65">
                    Monitoring rutin membantu melihat perubahan kesehatan
                    tanaman dari waktu ke waktu.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-brand-800/8 bg-white/60 p-4">
                <span className="icon-ring mt-0.5 h-8 w-8 flex-shrink-0 rounded-full text-brand-700">
                  <Layers className="h-4 w-4" strokeWidth={1.75} />
                </span>

                <div>
                  <p className="text-xs font-bold text-brand-900">
                    Optimalkan analisis
                  </p>

                  <p className="mt-1 text-xs font-medium leading-5 text-brand-800/65">
                    Kombinasikan layer NDVI, NPK, dan topografi untuk gambaran
                    lahan yang lebih lengkap.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </main>
  );
}
