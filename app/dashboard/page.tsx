"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { useUserRole } from "@/context/UserRoleContext";
import { useFormatDate } from "@/lib/format";

import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  ChevronRight,
  CircleCheck,
  Clock3,
  Database,
  Eye,
  Gauge,
  Gem,
  HardDrive,
  Layers,
  Leaf,
  Lock,
  Map,
  MapPin,
  MapPinned,
  Search,
  ShieldCheck,
  Sprout,
  X,
  UploadCloud,
  type LucideIcon,
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
      heroTitle: "Insight lahan lebih lengkap untuk skala desa.",
      heroDescription:
        "Pantau kondisi lahan, data spasial, dan perkembangan wilayah dari satu workspace.",
      heroCta: "Kelola Langganan",
      heroCtaHref: "/dashboard/subscription",
    };
  }

  if (normalizedTier === "kecamatan") {
    return {
      key: "kecamatan",
      label: "Tier Kecamatan",
      shortLabel: "Kecamatan",
      description: "Akses data dalam cakupan satu kecamatan.",
      heroTitle: "Analisis data lahan pada skala kecamatan.",
      heroDescription:
        "Gunakan cakupan data yang lebih luas untuk memahami kondisi lahan dan pola wilayah secara agregat.",
      heroCta: "Kelola Langganan",
      heroCtaHref: "/dashboard/subscription",
    };
  }

  return {
    key: "free",
    label: "Free",
    shortLabel: "Free",
    description: "Akses dasar untuk melihat data peta publik.",
    heroTitle: "Bangun workflow pemetaan yang lebih terukur.",
    heroDescription:
      "Upgrade untuk mendapatkan kapasitas lebih besar, layer tambahan, dan analisis yang lebih lengkap.",
    heroCta: "Lihat Paket",
    heroCtaHref: "/dashboard/subscription",
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
  accent = false,
  delay = 0,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: LucideIcon;
  accent?: boolean;
  delay?: number;
}) {
  return (
    <motion.article
      initial={{
        opacity: 0,
        y: 8,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      whileHover={{
        y: -2,
      }}
      transition={{
        duration: 0.4,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="
        group
        border
        border-[#DCDDD8]
        bg-white
        p-3.5
        transition-all
        duration-300
        hover:border-[#BFC2BA]
        hover:shadow-[0_12px_35px_rgba(0,0,0,0.05)]
        sm:p-5
      "
    >
      <div className="flex items-start justify-between gap-2 sm:gap-4">
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-[#8A8C85] sm:text-[11px] sm:tracking-[0.14em]">
            {label}
          </p>

          <p className="mt-2.5 truncate text-[21px] font-bold tracking-[-0.04em] text-[#161616] sm:mt-4 sm:text-[26px]">
            {value}
          </p>

          <p className="mt-1 truncate text-[10px] font-medium text-[#858780] sm:text-xs">
            {hint}
          </p>
        </div>

        <span
          className={[
            "flex h-8 w-8 shrink-0 items-center justify-center border sm:h-10 sm:w-10",
            accent
              ? "border-[#D9E5CC] bg-[#F6F9F2] text-[#5C7E2A]"
              : "border-[#E4E5E1] bg-[#F7F7F5] text-[#555750]",
          ].join(" ")}
        >
          <Icon
            className="h-[15px] w-[15px] sm:h-[17px] sm:w-[17px]"
            strokeWidth={1.8}
          />
        </span>
      </div>
    </motion.article>
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

  const formatDate = useFormatDate();

  /* ============================================================
     TIER
  ============================================================ */

  const normalizedTier = normalizeTier(user?.tier);

  const tierConfig = getTierConfig(normalizedTier);

  const isFreeTier = normalizedTier === "free";

  const isPaidTier =
    normalizedTier === "desa" || normalizedTier === "kecamatan";

  /* ============================================================
     LOAD MAPS
  ============================================================ */

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

  /* ============================================================
     MAP STATS
  ============================================================ */

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

  /* ============================================================
     USER
  ============================================================ */

  const username = user?.username || "Pengguna";

  /* ============================================================
     STATS
  ============================================================ */

  const stats = [
    {
      label: "Total Peta",
      value: maps.length,
      hint: "dataset tersedia",
      icon: Layers,
    },
    {
      label: "Paket",
      value: tierConfig.shortLabel,
      hint: isPaidTier ? "subscription aktif" : "lihat benefit",
      icon: Gem,
    },
    {
      label: "Terbaru",
      value: latestMaps.length,
      hint: "upload terakhir",
      icon: Activity,
    },
    {
      label: "Storage",
      value: formatStorageGB(totalStorage),
      hint: "total ukuran file",
      icon: HardDrive,
    },
  ];

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <main className="min-h-screen bg-[#F4F5F2] text-[#151515]">
      <div
        className="
          mx-auto
          max-w-[1440px]
          px-3
          py-5
          sm:px-5
          sm:py-7
          lg:px-10
          lg:py-10
        "
      >
        {/* ====================================================
            HEADER
        ==================================================== */}

        <header className="mb-6 sm:mb-8 lg:mb-9">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <h1
                className="
                  max-w-3xl
                  text-[27px]
                  font-bold
                  leading-[1.08]
                  tracking-[-0.045em]
                  text-[#111111]
                  sm:text-[34px]
                  lg:text-[42px]
                "
              >
                Selamat datang,{" "}
                <span className="text-[#171717]">{username}</span>
              </h1>

              <p
                className="
                  mt-2.5
                  max-w-4xl
                  text-[12px]
                  font-medium
                  leading-5
                  text-[#767871]
                  sm:mt-3
                  sm:text-sm
                  sm:leading-6
                "
              >
                {isPaidTier
                  ? `Anda sedang menggunakan ${tierConfig.label}. Pantau data dan kesehatan lahan Anda dari satu workspace.`
                  : "Pantau data spasial, aktivitas pemetaan, dan kondisi lahan Anda dari satu tempat."}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 border border-[#D8DAD4] bg-white px-2.5 py-2 text-[9px] font-bold uppercase tracking-[0.08em] text-[#595B55] sm:gap-2 sm:px-3.5 sm:py-2.5 sm:text-[11px]">
                <Gem
                  className="h-3 w-3 text-[#666861] sm:h-3.5 sm:w-3.5"
                  strokeWidth={1.8}
                />
                {tierConfig.shortLabel}
              </span>

              <Link
                href="/dashboard/maps"
                className="
                  inline-flex
                  items-center
                  gap-1.5
                  bg-[#171717]
                  px-3.5
                  py-2
                  text-[10px]
                  font-bold
                  text-white
                  transition-all
                  duration-200
                  hover:-translate-y-0.5
                  hover:bg-[#2B2B2B]
                  focus-visible:outline-none
                  focus-visible:ring-4
                  focus-visible:ring-[#76B900]/20
                  sm:gap-2
                  sm:px-4
                  sm:py-2.5
                  sm:text-xs
                "
              >
                Kelola Peta
                <ArrowUpRight
                  className="h-3 w-3 sm:h-3.5 sm:w-3.5"
                  strokeWidth={2}
                />
              </Link>
            </div>
          </div>
        </header>

        {/* ====================================================
            STATS
        ==================================================== */}

        <section
          className="
            mb-4
            grid
            grid-cols-2
            gap-px
            overflow-hidden
            border
            border-[#DCDDD8]
            bg-[#DCDDD8]
            lg:grid-cols-4
            lg:mb-5
          "
        >
          {stats.map((stat, index) => (
            <StatCard key={stat.label} {...stat} delay={index * 0.05} />
          ))}
        </section>

        {/* ====================================================
            MAIN GRID
        ==================================================== */}

        <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12">
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
              delay: 0.18,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="
              relative
              min-h-[280px]
              overflow-hidden
              bg-[#111111]
              sm:min-h-[320px]
              lg:col-span-8
              lg:min-h-[350px]
            "
          >
            <Image
              src="https://images.unsplash.com/photo-1650227128597-dbac6c5bd1b6?auto=format&fit=crop&w=1800&q=85"
              alt="Drone pertanian di atas lahan"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 66vw"
              className="object-cover opacity-55"
            />

            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/20" />

            <div
              className="
                relative
                flex
                h-full
                min-h-[280px]
                flex-col
                justify-between
                p-5
                sm:min-h-[320px]
                sm:p-7
                lg:min-h-[350px]
                lg:p-9
              "
            >
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 border border-white/10 bg-white/[0.06] px-2.5 py-1.5 text-[8px] font-bold uppercase tracking-[0.14em] text-white sm:gap-2 sm:px-3 sm:py-2 sm:text-[10px] sm:tracking-[0.15em]">
                  <Leaf
                    className="h-3 w-3 text-[#B6D08B] sm:h-3.5 sm:w-3.5"
                    strokeWidth={1.8}
                  />

                  {isFreeTier ? "Subscription" : tierConfig.label}
                </span>
              </div>

              <div className="max-w-2xl">
                <h2
                  className="
                    text-[25px]
                    font-bold
                    leading-[1.06]
                    tracking-[-0.045em]
                    text-white
                    sm:text-3xl
                    lg:text-[40px]
                  "
                >
                  {tierConfig.heroTitle}
                </h2>

                <p
                  className="
                    mt-3
                    max-w-xl
                    text-[11px]
                    font-medium
                    leading-5
                    text-white/65
                    sm:mt-4
                    sm:text-sm
                    sm:leading-6
                  "
                >
                  {tierConfig.heroDescription}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-2.5 sm:mt-7 sm:gap-3">
                  <Link
                    href={tierConfig.heroCtaHref}
                    className="
                      inline-flex
                      items-center
                      gap-1.5
                      bg-[#76B900]
                      px-3.5
                      py-2.5
                      text-[10px]
                      font-bold
                      text-black
                      transition-all
                      duration-200
                      hover:-translate-y-0.5
                      hover:bg-[#88D100]
                      sm:gap-2
                      sm:px-5
                      sm:py-3
                      sm:text-xs
                    "
                  >
                    {tierConfig.heroCta}

                    <ArrowRight
                      className="h-3 w-3 sm:h-3.5 sm:w-3.5"
                      strokeWidth={2}
                    />
                  </Link>

                  <Link
                    href="/dashboard/maps"
                    className="
                      inline-flex
                      items-center
                      gap-1.5
                      border
                      border-white/15
                      bg-white/[0.05]
                      px-3.5
                      py-2.5
                      text-[10px]
                      font-bold
                      text-white
                      transition-colors
                      hover:bg-white/10
                      sm:gap-2
                      sm:px-5
                      sm:py-3
                      sm:text-xs
                    "
                  >
                    Buka Peta
                    <Map
                      className="h-3 w-3 sm:h-3.5 sm:w-3.5"
                      strokeWidth={1.8}
                    />
                  </Link>
                </div>
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
              delay: 0.24,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="
              overflow-hidden
              border
              border-[#DCDDD8]
              bg-white
              lg:col-span-4
              lg:row-span-2
            "
          >
            <div className="border-b border-[#E6E7E2] px-4 py-4 sm:px-6 sm:py-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="mb-1.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-[#969890] sm:mb-2 sm:gap-2 sm:text-[10px]">
                    <Activity
                      className="h-3 w-3 text-[#767970] sm:h-3.5 sm:w-3.5"
                      strokeWidth={1.8}
                    />
                    Activity
                  </div>

                  <h3 className="text-base font-bold tracking-[-0.03em] text-[#171717] sm:text-lg">
                    Upload terbaru
                  </h3>
                </div>

                <Link
                  href="/dashboard/maps"
                  className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#777972] transition-colors hover:text-[#171717] sm:text-[10px]"
                >
                  Lihat Semua
                </Link>
              </div>
            </div>

            <div className="p-2 sm:p-3">
              {latestMaps.length ? (
                <ol className="divide-y divide-[#ECEDE9]">
                  {latestMaps.map((map, index) => (
                    <li key={map.id}>
                      <Link
                        href="/dashboard/maps"
                        className="group flex gap-2.5 px-2.5 py-3.5 transition-colors hover:bg-[#F7F8F5] sm:gap-3 sm:px-3 sm:py-4"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-[#E0E1DD] bg-[#FAFAF8] text-[#666861] sm:h-9 sm:w-9">
                          {index === 0 ? (
                            <UploadCloud
                              className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                              strokeWidth={1.7}
                            />
                          ) : index === 1 ? (
                            <MapPinned
                              className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                              strokeWidth={1.7}
                            />
                          ) : index === 2 ? (
                            <Database
                              className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                              strokeWidth={1.7}
                            />
                          ) : (
                            <Layers
                              className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                              strokeWidth={1.7}
                            />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] font-bold text-[#1A1A1A] sm:text-sm">
                            {map.title}
                          </p>

                          <div className="mt-1 flex items-center gap-1.5 text-[9px] font-medium text-[#92948D] sm:gap-2 sm:text-[11px]">
                            <Clock3
                              className="h-2.5 w-2.5 sm:h-3 sm:w-3"
                              strokeWidth={1.7}
                            />

                            {formatDate(map.created_at)}
                          </div>
                        </div>

                        <ChevronRight
                          className="mt-1 h-3.5 w-3.5 shrink-0 text-[#B1B3AD] transition-transform group-hover:translate-x-0.5 group-hover:text-[#171717] sm:h-4 sm:w-4"
                          strokeWidth={1.8}
                        />
                      </Link>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="m-1 border border-dashed border-[#DCDDD8] px-4 py-9 text-center sm:m-3 sm:px-5 sm:py-10">
                  <Activity
                    className="mx-auto h-5 w-5 text-[#B1B3AD]"
                    strokeWidth={1.7}
                  />

                  <p className="mt-3 text-xs font-semibold text-[#777972]">
                    Belum ada aktivitas.
                  </p>
                </div>
              )}
            </div>
          </motion.section>

          {/* ==================================================
              DATASET
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
              delay: 0.3,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="
              overflow-hidden
              border
              border-[#DCDDD8]
              bg-white
              lg:col-span-8
            "
          >
            <div className="border-b border-[#E5E6E1] px-4 py-4 sm:px-6 sm:py-5">
              <div className="flex flex-col gap-3 sm:gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#E0E1DC] bg-[#F8F9F6] sm:h-10 sm:w-10">
                    <MapPin
                      className="h-3.5 w-3.5 text-[#6E7169] sm:h-4 sm:w-4"
                      strokeWidth={1.8}
                    />
                  </div>

                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#999B94] sm:text-[10px]">
                      Dataset
                    </p>

                    <h3 className="mt-0.5 text-base font-bold tracking-[-0.03em] text-[#171717] sm:mt-1 sm:text-lg">
                      Data lahan Anda
                    </h3>
                  </div>
                </div>

                <div className="relative w-full xl:w-[310px]">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#92948D]"
                    strokeWidth={1.7}
                  />

                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Cari data peta..."
                    aria-label="Cari data peta"
                    className="
                      h-9
                      w-full
                      border
                      border-[#DCDDD8]
                      bg-[#FAFAF8]
                      pl-9
                      pr-9
                      text-[11px]
                      font-medium
                      text-[#1B1B1B]
                      outline-none
                      transition-all
                      placeholder:text-[#A0A29B]
                      focus:border-[#BFC4B8]
                      focus:bg-white
                      focus:ring-4
                      focus:ring-black/[0.025]
                      sm:h-10
                      sm:pl-10
                      sm:pr-10
                      sm:text-xs
                    "
                  />

                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      aria-label="Hapus pencarian"
                      className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center text-[#92948D] hover:text-[#171717]"
                    >
                      <X className="h-3 w-3" strokeWidth={2} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="p-2 sm:p-3">
              {/* LOADING */}

              {isLoading && (
                <div
                  role="status"
                  aria-live="polite"
                  aria-busy="true"
                  className="space-y-2"
                >
                  <span className="sr-only">Memuat data lahan…</span>

                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="
                        flex
                        min-h-[70px]
                        animate-pulse
                        items-center
                        gap-3
                        border
                        border-[#ECEDE9]
                        bg-[#FAFAF8]
                        p-3
                        motion-reduce:animate-none
                        sm:min-h-[82px]
                        sm:gap-4
                        sm:p-4
                      "
                    >
                      <div className="h-9 w-9 bg-[#E8E9E4] sm:h-10 sm:w-10" />

                      <div className="flex-1">
                        <div className="h-3.5 w-1/3 bg-[#E6E7E2]" />

                        <div className="mt-2 h-3 w-1/2 bg-[#ECEDE9]" />
                      </div>

                      <div className="h-7 w-16 bg-[#E8E9E4] sm:h-8 sm:w-20" />
                    </div>
                  ))}
                </div>
              )}

              {/* ERROR */}

              {error && !isLoading && (
                <div className="border border-[#E7D0CC] bg-[#FFF7F5] px-4 py-3.5 text-[11px] font-medium text-[#9B3E32] sm:px-5 sm:py-4 sm:text-sm">
                  {error}
                </div>
              )}

              {/* EMPTY */}

              {!isLoading && !error && !maps.length && (
                <div className="border border-dashed border-[#DCDDD8] px-5 py-11 text-center sm:px-6 sm:py-14">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center border border-[#E1E2DD] bg-[#F8F9F6] sm:h-12 sm:w-12">
                    <Map
                      className="h-4 w-4 text-[#777972] sm:h-5 sm:w-5"
                      strokeWidth={1.7}
                    />
                  </div>

                  <h4 className="mt-3 text-[13px] font-bold text-[#1B1B1B] sm:mt-4 sm:text-sm">
                    Belum ada peta tersimpan
                  </h4>

                  <p className="mx-auto mt-1.5 max-w-sm text-[11px] font-medium leading-5 text-[#858780] sm:mt-2 sm:text-xs">
                    Setelah data pemetaan tersedia, dataset Anda akan muncul di
                    sini.
                  </p>

                  <Link
                    href="/dashboard/maps"
                    className="mt-4 inline-flex items-center gap-1.5 bg-[#171717] px-3.5 py-2.5 text-[10px] font-bold text-white hover:bg-[#2B2B2B] sm:mt-5 sm:gap-2 sm:px-4 sm:text-xs"
                  >
                    Kelola Peta
                    <ArrowRight
                      className="h-3 w-3 sm:h-3.5 sm:w-3.5"
                      strokeWidth={2}
                    />
                  </Link>
                </div>
              )}

              {/* SEARCH EMPTY */}

              {!isLoading &&
                !error &&
                maps.length > 0 &&
                filteredMaps.length === 0 && (
                  <div className="border border-dashed border-[#DCDDD8] px-5 py-11 text-center sm:px-6 sm:py-14">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center border border-[#E1E2DD] bg-[#F8F9F6] sm:h-12 sm:w-12">
                      <Search
                        className="h-4 w-4 text-[#777972] sm:h-5 sm:w-5"
                        strokeWidth={1.7}
                      />
                    </div>

                    <h4 className="mt-3 text-[13px] font-bold text-[#1B1B1B] sm:mt-4 sm:text-sm">
                      Data tidak ditemukan
                    </h4>

                    <p className="mx-auto mt-1.5 max-w-sm text-[11px] font-medium leading-5 text-[#858780] sm:mt-2 sm:text-xs">
                      Tidak ada dataset yang cocok dengan{" "}
                      <span className="font-bold text-[#555750]">
                        “{searchQuery}”
                      </span>
                      .
                    </p>

                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="mt-4 inline-flex items-center gap-1.5 border border-[#D7D8D3] bg-white px-3.5 py-2.5 text-[10px] font-bold text-[#42443F] hover:bg-[#F7F7F5] sm:mt-5 sm:gap-2 sm:px-4 sm:text-xs"
                    >
                      Reset Pencarian
                      <X
                        className="h-3 w-3 sm:h-3.5 sm:w-3.5"
                        strokeWidth={2}
                      />
                    </button>
                  </div>
                )}

              {/* DATA */}

              {!isLoading && !error && filteredMaps.length > 0 && (
                <ul className="divide-y divide-[#ECEDE9]">
                  {filteredMaps.slice(0, 4).map((layer, index) => {
                    const isLocked = layer.locked_for_free && isFreeTier;

                    return (
                      <li key={layer.id}>
                        <Link
                          href={
                            isLocked
                              ? "/dashboard/subscription"
                              : "/dashboard/maps"
                          }
                          className="
                                group
                                flex
                                items-center
                                gap-2.5
                                px-2
                                py-4
                                transition-colors
                                hover:bg-[#F8F9F6]
                                sm:gap-5
                                sm:px-3
                                sm:py-5
                              "
                        >
                          {/* NUMBER */}

                          <span className="w-5 shrink-0 text-right font-mono text-[10px] font-bold tracking-[0.08em] text-[#A2A49D] transition-colors group-hover:text-[#666861] sm:w-8 sm:text-xs">
                            {String(index + 1).padStart(2, "0")}
                          </span>

                          {/* CONTENT */}

                          <span className="min-w-0 flex-1">
                            <span className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                              <span className="truncate text-[12px] font-bold tracking-[-0.01em] text-[#171717] sm:text-sm">
                                {layer.title}
                              </span>

                              {isLocked && (
                                <span className="inline-flex shrink-0 items-center border border-[#E8D9B6] bg-[#FFF9EA] px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-[0.1em] text-[#906D16] sm:px-2 sm:py-1 sm:text-[9px]">
                                  Premium
                                </span>
                              )}

                              {layer.map_type && (
                                <span className="hidden shrink-0 border border-[#E2E3DE] bg-[#FAFAF8] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-[#7F817A] sm:inline-flex">
                                  {layer.map_type}
                                </span>
                              )}
                            </span>

                            <span className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[9px] font-medium text-[#92948D] sm:gap-x-4 sm:text-[11px]">
                              <span className="inline-flex items-center gap-1">
                                <CalendarDays
                                  className="h-2.5 w-2.5 sm:h-3 sm:w-3"
                                  strokeWidth={1.7}
                                />

                                {new Date(layer.survey_date).toLocaleDateString(
                                  "id-ID"
                                )}
                              </span>

                              <span className="hidden items-center gap-1 sm:inline-flex">
                                <HardDrive
                                  className="h-3 w-3"
                                  strokeWidth={1.7}
                                />

                                {formatSize(layer.file_size)}
                              </span>

                              <span className="hidden min-w-0 items-center gap-1 sm:inline-flex">
                                <MapPin
                                  className="h-3 w-3 shrink-0"
                                  strokeWidth={1.7}
                                />

                                <span className="truncate">
                                  {layer.location}
                                </span>
                              </span>
                            </span>
                          </span>

                          {/* ACTION */}

                          <span
                            className={[
                              "hidden shrink-0 items-center gap-1.5 border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.08em] sm:inline-flex",
                              isLocked
                                ? "border-[#D8C58C] bg-[#FFF9EA] text-[#876713]"
                                : "border-[#DCDDD8] bg-white text-[#4B4D47] group-hover:border-[#BFC4B8] group-hover:text-[#171717]",
                            ].join(" ")}
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

                          <ChevronRight
                            className="h-3.5 w-3.5 shrink-0 text-[#B5B7B0] transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-[#171717] sm:h-4 sm:w-4"
                            strokeWidth={1.8}
                          />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {!isLoading && !error && filteredMaps.length > 0 && (
              <div className="flex items-center justify-between border-t border-[#E7E8E3] px-4 py-3.5 sm:px-6 sm:py-4">
                <p className="text-[9px] font-medium text-[#92948D] sm:text-[11px]">
                  Menampilkan maksimal 4 data lahan.
                </p>

                <Link
                  href="/dashboard/maps"
                  className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.08em] text-[#65675F] transition-colors duration-200 hover:text-[#171717] sm:gap-1.5 sm:text-[11px]"
                >
                  Lihat semua
                  <ArrowRight
                    className="h-2.5 w-2.5 sm:h-3 sm:w-3"
                    strokeWidth={2}
                  />
                </Link>
              </div>
            )}
          </motion.section>

          {/* ==================================================
              INSIGHT STRIP
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
              delay: 0.36,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="
              overflow-hidden
              border
              border-[#DCDDD8]
              bg-white
              lg:col-span-12
            "
          >
            <div className="grid lg:grid-cols-[1.1fr_2fr]">
              <div className="border-b border-[#E6E7E2] p-4 sm:p-6 lg:border-b-0 lg:border-r">
                <div className="mb-2 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-[#969890] sm:mb-3 sm:gap-2 sm:text-[10px]">
                  <Gauge
                    className="h-3 w-3 text-[#777972] sm:h-3.5 sm:w-3.5"
                    strokeWidth={1.8}
                  />
                  Field intelligence
                </div>

                <h3 className="max-w-sm text-xl font-bold tracking-[-0.04em] text-[#151515] sm:text-2xl">
                  Data yang baik menghasilkan keputusan yang lebih baik.
                </h3>

                <p className="mt-2.5 max-w-lg text-[11px] font-medium leading-5 text-[#858780] sm:mt-3 sm:text-xs">
                  Gunakan data spasial secara konsisten untuk memahami perubahan
                  lahan dari waktu ke waktu.
                </p>
              </div>

              <div className="grid sm:grid-cols-2">
                {/* MONITORING */}

                <div className="border-b border-[#E6E7E2] p-4 sm:border-r sm:p-6">
                  <div className="flex items-start gap-2.5 sm:gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-[#E0E1DC] bg-[#F7F8F5] sm:h-9 sm:w-9">
                      <CircleCheck
                        className="h-3.5 w-3.5 text-[#666861] sm:h-4 sm:w-4"
                        strokeWidth={1.8}
                      />
                    </div>

                    <div>
                      <p className="text-[12px] font-bold text-[#1A1A1A] sm:text-sm">
                        Monitoring berkala
                      </p>

                      <p className="mt-1 text-[10px] font-medium leading-5 text-[#858780] sm:mt-1.5 sm:text-xs">
                        Bandingkan kondisi lahan secara rutin untuk melihat
                        perubahan lebih awal.
                      </p>
                    </div>
                  </div>
                </div>

                {/* LAYER */}

                <div className="border-b border-[#E6E7E2] p-4 sm:p-6">
                  <div className="flex items-start gap-2.5 sm:gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-[#E0E1DC] bg-[#F7F8F5] sm:h-9 sm:w-9">
                      <Sprout
                        className="h-3.5 w-3.5 text-[#666861] sm:h-4 sm:w-4"
                        strokeWidth={1.8}
                      />
                    </div>

                    <div>
                      <p className="text-[12px] font-bold text-[#1A1A1A] sm:text-sm">
                        Optimalkan layer
                      </p>

                      <p className="mt-1 text-[10px] font-medium leading-5 text-[#858780] sm:mt-1.5 sm:text-xs">
                        Kombinasikan NDVI, NPK, dan topografi untuk insight yang
                        lebih lengkap.
                      </p>
                    </div>
                  </div>
                </div>

                {/* TREND */}

                <div className="border-b border-[#E6E7E2] p-4 sm:border-b-0 sm:border-r sm:p-6">
                  <div className="flex items-start gap-2.5 sm:gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-[#E0E1DC] bg-[#F7F8F5] sm:h-9 sm:w-9">
                      <BarChart3
                        className="h-3.5 w-3.5 text-[#666861] sm:h-4 sm:w-4"
                        strokeWidth={1.8}
                      />
                    </div>

                    <div>
                      <p className="text-[12px] font-bold text-[#1A1A1A] sm:text-sm">
                        Gunakan tren
                      </p>

                      <p className="mt-1 text-[10px] font-medium leading-5 text-[#858780] sm:mt-1.5 sm:text-xs">
                        Jangan hanya melihat satu snapshot, gunakan data
                        historis untuk konteks.
                      </p>
                    </div>
                  </div>
                </div>

                {/* DATA */}

                <div className="p-4 sm:p-6">
                  <div className="flex items-start gap-2.5 sm:gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-[#E0E1DC] bg-[#F7F8F5] sm:h-9 sm:w-9">
                      <ShieldCheck
                        className="h-3.5 w-3.5 text-[#666861] sm:h-4 sm:w-4"
                        strokeWidth={1.8}
                      />
                    </div>

                    <div>
                      <p className="text-[12px] font-bold text-[#1A1A1A] sm:text-sm">
                        Data tetap terorganisir
                      </p>

                      <p className="mt-1 text-[10px] font-medium leading-5 text-[#858780] sm:mt-1.5 sm:text-xs">
                        Simpan dataset secara konsisten agar workflow pemetaan
                        tetap rapi.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </main>
  );
}
