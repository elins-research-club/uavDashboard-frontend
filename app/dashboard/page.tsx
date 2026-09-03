"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
  Activity,
  Leaf,
  ScanLine,
  MoreHorizontal,
} from "lucide-react";

type MapRecord = {
  id: string;
  title: string;
  location: string;
  survey_date: string;
  map_type: string;
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

  useEffect(() => {
    api
      .get("/maps")
      .then(({ data }) => setMaps(data.maps))
      .catch((requestError) =>
        setError(
          requestError.response?.data?.detail || "Gagal memuat dashboard."
        )
      )
      .finally(() => setIsLoading(false));
  }, []);

  const totalStorage = maps.reduce((total, map) => total + map.file_size, 0);

  const latestMaps = maps.slice(0, 4);
  const username = user?.username || "Pengguna";
  const tier = user?.tier || "Free";

  const stats = [
    {
      title: "Total Peta",
      value: maps.length,
      subtitle: "peta tersimpan",
      icon: <MapPin className="h-5 w-5" />,
    },
    {
      title: "Paket Tier",
      value: tier,
      subtitle: "lihat benefit paket",
      icon: <Award className="h-5 w-5" />,
    },
    {
      title: "Aktivitas",
      value: latestMaps.length,
      subtitle: "upload terbaru",
      icon: <TrendingUp className="h-5 w-5" />,
    },
    {
      title: "Penyimpanan",
      value: formatSize(totalStorage),
      subtitle: "total file peta",
      icon: <Database className="h-5 w-5" />,
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
              <span className="h-1.5 w-1.5 rounded-full bg-[#91b928]" />

              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#123c28]/40">
                UAV DaaS PLATFORM
              </span>
            </div>

            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[#123c28] sm:text-4xl">
              Selamat datang,
              <br className="sm:hidden" />{" "}
              <span className="text-[#123c28]/45">{username}</span>
            </h1>

            <p className="mt-3 text-sm text-[#123c28]/50">
              Pantau data lahan dan aktivitas pemetaan Anda dalam satu tempat.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-full border border-[#123c28]/10 bg-[#f5f7f1] px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#91b928]" />

                <span className="text-[11px] font-semibold text-[#123c28]/70">
                  Paket {tier}
                </span>
              </div>
            </div>

            <Link
              href="/dashboard/maps"
              className="inline-flex items-center gap-2 rounded-full bg-[#123c28] px-5 py-2.5 text-[11px] font-semibold text-white transition hover:bg-[#1a5134]"
            >
              Kelola Peta
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </header>

        {/* =====================================================
            QUICK STATUS
        ====================================================== */}
        <div className="mb-6 flex flex-wrap items-center gap-2 text-[10px] text-[#123c28]/40">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#123c28]/10 bg-white px-3 py-2">
            <Activity className="h-3.5 w-3.5" />
            Platform aktif
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-[#123c28]/10 bg-white px-3 py-2">
            <ScanLine className="h-3.5 w-3.5" />
            Data UAV terintegrasi
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-[#123c28]/10 bg-white px-3 py-2">
            <Leaf className="h-3.5 w-3.5" />
            Precision farming
          </div>
        </div>

        {/* =====================================================
            STATS
        ====================================================== */}
        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.title}
              className="group rounded-[24px] border border-[#123c28]/10 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_14px_40px_rgba(18,60,40,0.08)]"
            >
              <div className="mb-6 flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f3f6ed] text-[#123c28]">
                  {stat.icon}
                </div>

                <MoreHorizontal className="h-4 w-4 text-[#123c28]/20" />
              </div>

              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#123c28]/35">
                {stat.title}
              </p>

              <p className="mt-2 truncate text-2xl font-semibold tracking-[-0.03em] text-[#123c28]">
                {stat.value}
              </p>

              <p className="mt-1 text-xs text-[#123c28]/40">{stat.subtitle}</p>
            </div>
          ))}
        </section>

        {/* =====================================================
            UPGRADE / PLAN CARD
        ====================================================== */}
        <section className="mb-6 overflow-hidden rounded-[28px] bg-[#123c28] text-white">
          <div className="relative p-6 sm:p-8">
            {/* decorative circles */}
            <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full border border-white/10" />
            <div className="absolute -right-2 top-6 h-32 w-32 rounded-full border border-white/5" />

            <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-center">
              <div className="max-w-2xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-white/55">
                  <Award className="h-3.5 w-3.5" />
                  Subscription
                </div>

                <h2 className="text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
                  Tingkatkan pengalaman
                  <br className="hidden sm:block" /> dengan paket premium.
                </h2>

                <p className="mt-3 max-w-xl text-sm leading-6 text-white/50">
                  Dapatkan kapasitas lebih besar, analisis yang lebih lengkap,
                  dan akses fitur premium untuk kebutuhan pertanian berbasis
                  data.
                </p>
              </div>

              <Link
                href="/dashboard/subscription"
                className="inline-flex flex-shrink-0 items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-[#123c28] transition hover:bg-white/90"
              >
                Lihat Paket
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* =====================================================
            MAP DATA
        ====================================================== */}
        <section className="mb-6 rounded-[28px] border border-[#123c28]/10 bg-white p-5 sm:p-7">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f3f6ed]">
                  <MapPin className="h-4 w-4 text-[#123c28]" />
                </div>

                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#123c28]/35">
                  FIELD DATA
                </span>
              </div>

              <h2 className="text-2xl font-semibold tracking-[-0.035em]">
                Data Lahan Anda
              </h2>

              <p className="mt-1.5 text-xs text-[#123c28]/40">
                Kelola dan pantau data pemetaan pertanian Anda.
              </p>
            </div>

            <Link
              href="/dashboard/maps"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#123c28] transition hover:gap-3"
            >
              Lihat Semua
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* states */}
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="animate-pulse rounded-2xl border border-[#123c28]/5 bg-[#fafbf8] p-5"
                >
                  <div className="h-4 w-1/3 rounded bg-[#123c28]/5" />

                  <div className="mt-3 h-3 w-2/3 rounded bg-[#123c28]/5" />

                  <div className="mt-5 h-3 w-1/4 rounded bg-[#123c28]/5" />
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {!isLoading && !error && !latestMaps.length && (
            <div className="rounded-2xl border border-dashed border-[#123c28]/15 bg-[#fafbf8] px-6 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white">
                <MapPin className="h-5 w-5 text-[#123c28]/40" />
              </div>

              <h3 className="mt-4 text-sm font-semibold text-[#123c28]">
                Belum ada peta tersimpan
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-[#123c28]/40">
                Setelah data pemetaan tersedia, hasilnya akan muncul di
                dashboard ini.
              </p>

              <Link
                href="/dashboard/maps"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#123c28] px-5 py-2.5 text-xs font-semibold text-white"
              >
                Kelola Peta
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}

          {!isLoading && !error && latestMaps.length > 0 && (
            <div className="space-y-3">
              {latestMaps.map((layer) => (
                <div
                  key={layer.id}
                  className="group rounded-[22px] border border-[#123c28]/8 bg-[#fafbf8] p-4 transition hover:border-[#123c28]/15 hover:bg-white hover:shadow-[0_10px_30px_rgba(18,60,40,0.05)] sm:p-5"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-semibold text-[#123c28] sm:text-base">
                          {layer.title}
                        </h3>

                        <span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#123c28]/45">
                          {layer.map_type}
                        </span>
                      </div>

                      <p className="mt-2 max-w-2xl truncate text-xs text-[#123c28]/45 sm:text-sm">
                        {layer.description || layer.location}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] text-[#123c28]/40">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            {new Date(layer.survey_date).toLocaleDateString(
                              "id-ID"
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Database className="h-3.5 w-3.5" />
                          <span>{formatSize(layer.file_size)}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          <span className="max-w-[180px] truncate">
                            {layer.location}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      {layer.locked_for_free ? (
                        <Link
                          href="/dashboard/subscription"
                          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#f0ad25] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#df9b16] sm:w-auto"
                        >
                          <Lock className="h-3.5 w-3.5" />
                          Upgrade
                        </Link>
                      ) : (
                        <Link
                          href="/dashboard/maps"
                          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#123c28] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#1a5134] sm:w-auto"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Lihat Peta
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* =====================================================
            LOWER GRID
        ====================================================== */}
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          {/* Recent activity */}
          <section className="rounded-[28px] border border-[#123c28]/10 bg-white p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f3f6ed]">
                    <Clock className="h-4 w-4 text-[#123c28]" />
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#123c28]/35">
                    ACTIVITY
                  </span>
                </div>

                <h3 className="text-xl font-semibold tracking-[-0.03em]">
                  Upload Terbaru
                </h3>
              </div>

              <Link
                href="/dashboard/maps"
                className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#123c28]/40 hover:text-[#123c28]"
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
                      <p className="truncate text-sm font-semibold text-[#123c28]">
                        {map.title}
                      </p>

                      <p className="mt-1 text-[10px] text-[#123c28]/40">
                        {new Date(map.created_at).toLocaleDateString("id-ID")}
                      </p>
                    </div>

                    <ArrowUpRight className="h-4 w-4 text-[#123c28]/20" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#123c28]/40">Belum ada aktivitas.</p>
            )}
          </section>

          {/* Tips */}
          <section className="rounded-[28px] bg-[#f3f6ed] p-6">
            <div className="mb-6 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white">
                <BarChart3 className="h-4 w-4 text-[#123c28]" />
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#123c28]/35">
                  FIELD NOTES
                </p>

                <h3 className="mt-0.5 text-xl font-semibold tracking-[-0.03em]">
                  Tips & Informasi
                </h3>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl bg-white p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#123c28] text-white">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-[#123c28]">
                      Gunakan data secara berkala
                    </p>

                    <p className="mt-1 text-[11px] leading-5 text-[#123c28]/45">
                      Monitoring berkala membantu melihat perubahan kesehatan
                      tanaman dari waktu ke waktu.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#dfeeb1]">
                    <Leaf className="h-3.5 w-3.5 text-[#123c28]" />
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-[#123c28]">
                      Optimalkan analisis
                    </p>

                    <p className="mt-1 text-[11px] leading-5 text-[#123c28]/45">
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
        <section className="mt-6 overflow-hidden rounded-[28px] border border-[#123c28]/10 bg-white p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#123c28]/30">
                READY FOR THE NEXT FLIGHT?
              </p>

              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.035em]">
                Kembangkan data lahan Anda.
              </h3>

              <p className="mt-2 text-xs leading-5 text-[#123c28]/40">
                Jelajahi semua peta dan fitur analitik yang tersedia di
                platform.
              </p>
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
