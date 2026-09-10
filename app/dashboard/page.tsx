"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { useUserRole } from "@/context/UserRoleContext";
import {
  MapPin,
  TrendingUp,
  Lock,
  Eye,
  Calendar,
  Award,
  ArrowRight,
  Database,
  FileText,
  BarChart3,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  Leaf,
  Search,
  X,
  Crown,
} from "lucide-react";

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

const formatSize = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

export default function DashboardHomePage() {
  const { user } = useUserRole();

  const [maps, setMaps] = useState<MapRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    api
      .get("/maps")
      .then(({ data }) => {
        setMaps(data.maps || []);
      })
      .catch((requestError) => {
        setError(
          requestError.response?.data?.detail || "Gagal memuat dashboard."
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const totalStorage = maps.reduce((total, map) => total + map.file_size, 0);

  const latestMaps = maps.slice(0, 4);

  const filteredMaps = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return latestMaps;
    }

    return maps
      .filter((map) => {
        return [map.title, map.location, map.description, map.map_type]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(query));
      })
      .slice(0, 4);
  }, [maps, latestMaps, searchQuery]);

  const username = user?.username || "Pengguna";
  const tier = user?.tier || "Free";

  const stats = [
    {
      title: "Total Peta",
      value: maps.length,
      subtitle: "peta tersimpan",
      icon: MapPin,
    },
    {
      title: "Paket Tier",
      value: tier,
      subtitle: "lihat benefit paket",
      icon: Award,
    },
    {
      title: "Aktivitas",
      value: latestMaps.length,
      subtitle: "upload terbaru",
      icon: TrendingUp,
    },
    {
      title: "Penyimpanan",
      value: formatSize(totalStorage),
      subtitle: "total file peta",
      icon: Database,
    },
  ];

  return (
    <main className="min-h-screen bg-white text-[#123c28]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* =====================================================
            TOP HEADER
        ====================================================== */}
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#123c28]/80">
                UAV Data-as-a-Service Platform
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-[-0.04em] text-[#123c28] sm:text-4xl">
              Selamat datang,
              <br className="sm:hidden" />{" "}
              <span className="text-[#1a5134]">{username}</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-full border border-[#123c28]/15 bg-[#f5f7f1] px-4 py-2.5">
              <div className="flex items-center gap-2">
                <Crown className="h-3.5 w-3.5 text-[#123c28]" />

                <span className="text-[11px] font-bold text-[#123c28]">
                  Paket {tier}
                </span>
              </div>
            </div>

            <Link
              href="/dashboard/maps"
              className="inline-flex items-center gap-2 rounded-full bg-[#123c28] px-5 py-2.5 text-[11px] font-semibold text-white transition hover:bg-[#1a5134]"
            >
              Kelola Peta Anda
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </header>

        {/* =====================================================
            STATS
        ====================================================== */}
        <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <motion.div
                key={stat.title}
                initial="rest"
                animate="rest"
                whileHover="hover"
                variants={{
                  rest: {
                    y: 0,
                  },
                  hover: {
                    y: -2,
                  },
                }}
                transition={{
                  duration: 0.2,
                  ease: "easeOut",
                }}
                className="group relative min-h-[112px] overflow-hidden rounded-[20px] border border-[#123c28]/10 bg-white px-4 py-4 transition-shadow duration-200 hover:shadow-[0_12px_30px_rgba(18,60,40,0.07)]"
              >
                {/* Background 3D icon */}
                <motion.div
                  variants={{
                    rest: {
                      rotate: 0,
                      scale: 1,
                      x: 8,
                      y: 8,
                      boxShadow:
                        "inset 6px 6px 12px rgba(255,255,255,0.8), inset -7px -7px 14px rgba(18,60,40,0.10)",
                    },
                    hover: {
                      rotate: -12,
                      scale: 1.12,
                      x: 2,
                      y: 2,
                      boxShadow:
                        "inset 10px 8px 16px rgba(255,255,255,0.9), inset -10px -10px 18px rgba(18,60,40,0.18), 0 10px 20px rgba(18,60,40,0.08)",
                    },
                  }}
                  transition={{
                    duration: 0.45,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="
    pointer-events-none
    absolute
    -bottom-6
    -right-5
    flex
    h-28
    w-28
    items-center
    justify-center
    rounded-full
    bg-[#f3f6ed]
  "
                >
                  {/* Highlight / light reflection */}
                  <motion.div
                    variants={{
                      rest: {
                        x: 0,
                        y: 0,
                        opacity: 0.35,
                        scale: 1,
                      },
                      hover: {
                        x: -5,
                        y: -5,
                        opacity: 0.75,
                        scale: 1.15,
                      },
                    }}
                    transition={{
                      duration: 0.4,
                      ease: "easeOut",
                    }}
                    className="
      pointer-events-none
      absolute
      left-4
      top-4
      h-8
      w-8
      rounded-full
      bg-white
      blur-md
    "
                  />
                </motion.div>

                {/* Content */}
                <div className="relative z-10 flex min-h-[80px] items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#123c28]/55">
                      {stat.title}
                    </p>

                    <p className="mt-1.5 truncate text-xl font-bold tracking-[-0.035em] text-[#123c28]">
                      {stat.value}
                    </p>

                    <p className="mt-0.5 text-[10px] font-semibold text-[#123c28]/55">
                      {stat.subtitle}
                    </p>
                  </div>

                  {/* Small foreground icon */}
                  <motion.div
                    variants={{
                      rest: {
                        x: 0,
                        rotate: 0,
                      },
                      hover: {
                        x: -3,
                        rotate: -5,
                      },
                    }}
                    transition={{
                      duration: 0.3,
                      ease: "easeOut",
                    }}
                    className="mr-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border bg-white text-[#123c28]/70"
                  >
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </section>

        {/* =====================================================
            UPGRADE / PLAN CARD
        ====================================================== */}
        <section className="mb-6 overflow-hidden rounded-[28px]">
          <div className="relative min-h-[260px] overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1650227128597-dbac6c5bd1b6?auto=format&fit=crop&w=1800&q=85"
              alt="Agricultural drone"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />

            <div className="absolute inset-0 bg-[#123c28]/25" />

            <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/20 to-transparent" />

            <div className="relative z-10 p-6 sm:p-8">
              <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
                <div className="max-w-2xl">
                  <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
                    <Leaf className="h-3.5 w-3.5 text-[#dfeeb1]" />
                    Subscription
                  </div>

                  <h2 className="max-w-xl text-2xl font-bold tracking-[-0.035em] text-white sm:text-3xl">
                    Tingkatkan pengalaman
                    <br className="hidden sm:block" />
                    dengan paket premium.
                  </h2>

                  <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-white/80">
                    Dapatkan kapasitas lebih besar, analisis yang lebih lengkap,
                    dan akses fitur premium untuk kebutuhan pertanian berbasis
                    data.
                  </p>
                </div>

                <Link
                  href="/dashboard/subscription"
                  className="inline-flex flex-shrink-0 items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-[#123c28] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#f5f7f1] hover:shadow-lg"
                >
                  Lihat Paket
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
MAP DATA
====================================================== */}

        <section className="mb-6">
          <div className="overflow-hidden rounded-[28px] border border-[#123c28]/10 bg-white shadow-sm">
            {/* ================= HEADER ================= */}
            <div className="border-b border-[#123c28]/10 bg-[#123c28] px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                {/* LEFT */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <MapPin className="h-6 w-6 text-white/80" />

                    <h2 className="text-2xl font-bold tracking-[-0.035em] text-white sm:text-[28px]">
                      Data Lahan Anda
                    </h2>
                  </div>
                </div>

                {/* RIGHT */}
                <div className="flex w-full lg:w-auto">
                  {/* SEARCH */}

                  <div className="relative w-full lg:w-[380px]">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#123c28]/40" />

                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Cari data peta Anda..."
                      className="h-9 w-full rounded-full border border-white/20 bg-white pl-10 pr-10 text-[11px] font-medium text-[#123c28] outline-none transition placeholder:text-[#123c28]/35 focus:border-white focus:ring-4 focus:ring-white/10"
                    />

                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        aria-label="Hapus pencarian"
                        className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-[#123c28]/40 transition hover:bg-[#f3f6ed] hover:text-[#123c28]"
                      >
                        {" "}
                        <X className="h-3 w-3" />{" "}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* ================= CONTENT ================= */}
            <div className="bg-white/70 px-5 sm:px-6">
              {/* Loading */}
              {isLoading && (
                <div className="divide-y divide-[#123c28]/20">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="min-h-[104px] animate-pulse">
                      <div className="flex min-h-[104px] items-stretch">
                        <div className="flex w-[56px] flex-shrink-0 flex-col items-center justify-center">
                          <div className="h-2 w-7 rounded bg-[#123c28]/10" />
                          <div className="mt-2 h-4 w-5 rounded bg-[#123c28]/10" />
                        </div>

                        <div className="flex-1 px-4 py-4">
                          <div className="h-4 w-1/3 rounded bg-[#123c28]/10" />
                          <div className="mt-2 h-3 w-1/2 rounded bg-[#123c28]/10" />
                          <div className="mt-4 h-3 w-2/3 rounded bg-[#123c28]/10" />
                        </div>

                        <div className="hidden w-[130px] md:block" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="py-5">
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
                    {error}
                  </div>
                </div>
              )}

              {/* No Data */}
              {!isLoading && !error && !maps.length && (
                <div className="py-6">
                  <div className="rounded-[20px] border border-dashed border-[#123c28]/20 bg-white px-6 py-14 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f3f6ed]">
                      <MapPin className="h-5 w-5 text-[#123c28]/60" />
                    </div>

                    <h3 className="mt-4 text-sm font-bold text-[#123c28]">
                      Belum ada peta tersimpan
                    </h3>

                    <p className="mx-auto mt-2 max-w-sm text-xs font-medium leading-5 text-[#123c28]/70">
                      Setelah data pemetaan tersedia, hasilnya akan muncul di
                      dashboard ini.
                    </p>

                    <Link
                      href="/dashboard/maps"
                      className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#123c28] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#1a5134]"
                    >
                      Kelola Peta
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              )}

              {/* Search Result Empty */}
              {!isLoading &&
                !error &&
                maps.length > 0 &&
                filteredMaps.length === 0 && (
                  <div className="py-6">
                    <div className="rounded-[20px] border border-dashed border-[#123c28]/20 bg-white px-6 py-14 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f3f6ed]">
                        <Search className="h-5 w-5 text-[#123c28]/55" />
                      </div>

                      <h3 className="mt-4 text-sm font-bold text-[#123c28]">
                        Data tidak ditemukan
                      </h3>

                      <p className="mx-auto mt-2 max-w-sm text-xs font-medium leading-5 text-[#123c28]/70">
                        Tidak ada dataset yang cocok dengan pencarian{" "}
                        <span className="font-bold">"{searchQuery}"</span>.
                      </p>

                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#123c28] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#1a5134]"
                      >
                        Reset Pencarian
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}

              {/* Maps */}
              {!isLoading && !error && filteredMaps.length > 0 && (
                <>
                  <div className="divide-y divide-[#123c28]/20">
                    {filteredMaps.slice(0, 4).map((layer, index) => (
                      <div
                        key={layer.id}
                        className="group -mx-5 px-5 transition-colors duration-200 hover:bg-[#f3f6ed] sm:-mx-6 sm:px-6"
                      >
                        <div className="flex min-h-[104px] items-stretch py-1">
                          {/* MAP NUMBER */}
                          <div className="flex w-[56px] flex-shrink-0 flex-col items-center justify-center">
                            <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-[#123c28]/40">
                              MAP
                            </span>

                            <span className="mt-1 text-lg font-bold leading-none tracking-[-0.04em] text-[#123c28]/35">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                          </div>

                          {/* MAIN CONTENT */}
                          <div className="min-w-0 flex-1 px-4 py-4">
                            <div className="flex min-w-0 flex-col gap-3">
                              {/* TITLE */}
                              <div className="flex min-w-0 items-center gap-2">
                                <h3 className="min-w-0 truncate text-sm font-bold text-[#123c28]">
                                  {layer.title}
                                </h3>

                                {layer.locked_for_free && (
                                  <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-[#fff3d9] px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.08em] text-[#a46800]">
                                    <Lock className="h-2.5 w-2.5" />
                                    Premium
                                  </span>
                                )}

                                {layer.map_type && (
                                  <span className="hidden flex-shrink-0 rounded-full bg-[#eef3e8] px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.08em] text-[#123c28] sm:inline-flex">
                                    {layer.map_type}
                                  </span>
                                )}
                              </div>

                              {/* DESCRIPTION */}
                              <p className="truncate text-xs font-medium text-[#123c28]/70">
                                {layer.description || layer.location}
                              </p>

                              {/* METADATA */}
                              <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 overflow-hidden text-[9px] font-semibold text-[#123c28]/60">
                                <div className="flex flex-shrink-0 items-center gap-1.5">
                                  <Calendar className="h-3 w-3" />

                                  <span>
                                    {new Date(
                                      layer.survey_date
                                    ).toLocaleDateString("id-ID")}
                                  </span>
                                </div>

                                <div className="flex flex-shrink-0 items-center gap-1.5">
                                  <Database className="h-3 w-3" />

                                  <span>{formatSize(layer.file_size)}</span>
                                </div>

                                <div className="flex min-w-0 items-center gap-1.5">
                                  <MapPin className="h-3 w-3 flex-shrink-0" />

                                  <span className="truncate">
                                    {layer.location}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* ACTION */}
                          <div className="flex w-[130px] flex-shrink-0 items-center justify-center pl-4 pr-1">
                            {layer.locked_for_free ? (
                              <Link
                                href="/dashboard/subscription"
                                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#D99A2B] px-3 py-2.5 text-[10px] font-bold text-white transition hover:bg-[#C68920]"
                              >
                                <Lock className="h-3 w-3" />
                                Upgrade
                              </Link>
                            ) : (
                              <Link
                                href="/dashboard/maps"
                                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#123c28] px-3 py-2.5 text-[10px] font-bold text-white transition hover:bg-[#1a5134]"
                              >
                                <Eye className="h-3 w-3" />
                                Lihat Peta
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* INFO */}

                  <div className="border-t border-[#123c28]/10 py-4">
                    <div className="flex flex-col gap-1 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
                      <p className="text-[10px] font-medium text-[#123c28]/50">
                        Dashboard menampilkan maksimal 4 data lahan.
                      </p>

                      <Link
                        href="/dashboard/maps"
                        className="inline-flex items-center justify-center gap-1.5 text-[10px] font-bold text-[#123c28] transition hover:text-[#1a5134]"
                      >
                        Lihat semua peta
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* =====================================================
            LOWER GRID
        ====================================================== */}
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          {/* Recent Activity */}
          <section className="rounded-[28px] border border-[#123c28]/12 bg-white p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f3f6ed]">
                    <Clock className="h-4 w-4 text-[#123c28]" />
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#123c28]/75">
                    ACTIVITY
                  </span>
                </div>

                <h3 className="text-xl font-bold tracking-[-0.03em] text-[#123c28]">
                  Upload Terbaru
                </h3>
              </div>

              <Link
                href="/dashboard/maps"
                className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#123c28]/80 hover:text-[#123c28]"
              >
                Semua
              </Link>
            </div>

            {latestMaps.length ? (
              <div className="space-y-4">
                {latestMaps.slice(0, 3).map((map) => (
                  <div key={map.id} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#f3f6ed]">
                      <FileText className="h-4 w-4 text-[#123c28]" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[#123c28]">
                        {map.title}
                      </p>

                      <p className="mt-1 text-[11px] font-medium text-[#123c28]/75">
                        {new Date(map.created_at).toLocaleDateString("id-ID")}
                      </p>
                    </div>

                    <ArrowUpRight className="h-4 w-4 text-[#123c28]/60" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm font-medium text-[#123c28]/75">
                Belum ada aktivitas.
              </p>
            )}
          </section>

          {/* Tips */}
          <section className="rounded-[28px] border border-[#123c28]/10 bg-[#f3f6ed] p-6">
            <div className="mb-6 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm">
                <BarChart3 className="h-4 w-4 text-[#123c28]" />
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#123c28]/75">
                  FIELD NOTES
                </p>

                <h3 className="mt-0.5 text-xl font-bold tracking-[-0.03em] text-[#123c28]">
                  Tips & Informasi
                </h3>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-[#123c28]/5 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#123c28] text-white">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>

                  <div>
                    <p className="text-xs font-bold text-[#123c28]">
                      Gunakan data secara berkala
                    </p>

                    <p className="mt-1 text-[11px] font-medium leading-5 text-[#123c28]/80">
                      Monitoring berkala membantu melihat perubahan kesehatan
                      tanaman dari waktu ke waktu.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#123c28]/5 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#dfeeb1]">
                    <Leaf className="h-3.5 w-3.5 text-[#123c28]" />
                  </div>

                  <div>
                    <p className="text-xs font-bold text-[#123c28]">
                      Optimalkan analisis
                    </p>

                    <p className="mt-1 text-[11px] font-medium leading-5 text-[#123c28]/80">
                      Gunakan layer NDVI, NPK dan topografi secara bersamaan
                      untuk mendapatkan gambaran lahan yang lebih lengkap.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* =====================================================
            BOTTOM MINI CTA
        ====================================================== */}
        <section className="mt-6 overflow-hidden rounded-[28px] border border-[#123c28]/15 bg-white p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#123c28]/75">
                READY FOR THE NEXT FLIGHT?
              </p>

              <h3 className="mt-2 text-2xl font-bold tracking-[-0.035em] text-[#123c28]">
                Kembangkan data lahan Anda.
              </h3>
            </div>

            <Link
              href="/dashboard/maps"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#123c28] px-6 py-3 text-xs font-semibold text-white transition hover:bg-[#1a5134]"
            >
              Buka Peta
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
