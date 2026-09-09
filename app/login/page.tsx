"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Map,
  ArrowRight,
  ArrowUpRight,
  Shield,
  ScanLine,
  Activity,
} from "lucide-react";
import api from "@/lib/api";

const REMEMBER_EMAIL_KEY = "uav_remember_email";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  /* =========================================
     LOAD REMEMBERED EMAIL
  ========================================== */
  useEffect(() => {
    const rememberedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);

    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  /* =========================================
     LOGIN
  ========================================== */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const { data } = await api.post("/auth/login", {
        email,
        password,
      });

      /* Remember email */
      if (rememberMe) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, email);
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY);
      }

      /* Save token */
      localStorage.setItem("token", data.access_token);

      window.location.href = "/dashboard";
    } catch (error: unknown) {
      const axiosError = error as {
        response?: {
          data?: {
            detail?: string | { msg?: string }[];
          };
        };
      };

      const detail = axiosError.response?.data?.detail;

      const errorMsg =
        typeof detail === "string"
          ? detail
          : Array.isArray(detail) && detail[0]?.msg
          ? detail[0].msg
          : "Email atau password salah.";

      setMessage(errorMsg);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      {/* ==============================
          NAVBAR
      =============================== */}
      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3">
        <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full border border-black/10 bg-white/95 px-3 shadow-xl backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-2.5 pl-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black">
              <Map className="h-4 w-4 text-white" />
            </div>

            <div className="hidden sm:block">
              <p className="text-[11px] font-black tracking-[0.2em] text-black">
                UAV
              </p>

              <p className="text-[7px] font-medium tracking-[0.25em] text-black/40">
                DAAS PLATFORM
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <span className="hidden text-[10px] text-black/40 sm:block">
              Belum punya akun?
            </span>

            <a
              href="/register"
              className="inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-2.5 text-[10px] font-semibold text-white transition hover:bg-neutral-800"
            >
              Daftar
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </nav>
      </header>

      {/* ==============================
          MAIN
      =============================== */}
      <section className="min-h-screen px-3 pb-3 pt-20 sm:px-4">
        <div className="mx-auto grid min-h-[calc(100vh-92px)] max-w-6xl overflow-hidden rounded-[28px] border border-white/10 bg-[#101010] lg:grid-cols-[0.9fr_1.1fr]">
          {/* ==============================
              LOGIN
          =============================== */}
          <div className="flex items-center px-6 py-10 sm:px-10 lg:px-12">
            <div className="w-full max-w-sm">
              {/* INTRO */}
              <div className="mb-7">
                <h1 className="text-4xl font-semibold leading-[1] tracking-[-0.05em] sm:text-[42px]">
                  Selamat datang
                  <br />
                  <span className="text-white/30">kembali.</span>
                </h1>

                <p className="mt-4 max-w-sm text-xs leading-5 text-white/35">
                  Masuk ke dashboard UAV DaaS untuk mengelola proyek,
                  penerbangan, dan analisis lahan Anda.
                </p>
              </div>

              {/* FORM */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* EMAIL */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-[9px] font-semibold uppercase tracking-[0.18em] text-white/40"
                  >
                    Email
                  </label>

                  <div className="group relative">
                    <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25 transition group-focus-within:text-white/60" />

                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@email.com"
                      required
                      className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.035] pl-11 pr-4 text-xs text-white outline-none transition placeholder:text-white/20 hover:border-white/20 focus:border-white/30 focus:bg-white/[0.055]"
                    />
                  </div>
                </div>

                {/* PASSWORD */}
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-[9px] font-semibold uppercase tracking-[0.18em] text-white/40"
                  >
                    Password
                  </label>

                  <div className="group relative">
                    <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25 transition group-focus-within:text-white/60" />

                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan password"
                      required
                      className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.035] pl-11 pr-11 text-xs text-white outline-none transition placeholder:text-white/20 hover:border-white/20 focus:border-white/30 focus:bg-white/[0.055]"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={
                        showPassword
                          ? "Sembunyikan password"
                          : "Tampilkan password"
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 transition hover:text-white/70"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* OPTIONS */}
                <div className="flex items-center justify-between">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-3.5 w-3.5 cursor-pointer accent-white"
                    />

                    <span className="text-[11px] text-white/35">
                      Ingat saya
                    </span>
                  </label>

                  <a
                    href="/forgot-password"
                    className="text-[11px] text-white/40 transition hover:text-white"
                  >
                    Lupa password?
                  </a>
                </div>

                {/* ERROR */}
                {message && (
                  <div className="rounded-xl border border-red-400/15 bg-red-400/[0.06] px-3.5 py-3 text-[11px] leading-4 text-red-300">
                    {message}
                  </div>
                )}

                {/* SUBMIT */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-5 text-xs font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      Login ke Dashboard
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>

              {/* REGISTER */}
              <p className="mt-7 text-center text-[11px] text-white/30">
                Belum mempunyai akun?{" "}
                <a
                  href="/register"
                  className="font-semibold text-white transition hover:text-white/60"
                >
                  Daftar sekarang
                </a>
              </p>

              {/* SECURITY */}
              <div className="mt-7 flex items-center justify-center gap-2 text-[8px] uppercase tracking-[0.16em] text-white/20">
                <Shield className="h-3 w-3" />
                Protected connection
              </div>
            </div>
          </div>

          {/* ==============================
              IMAGE PANEL
          =============================== */}
          <div className="relative hidden min-h-[600px] overflow-hidden lg:block">
            {/* UNSPLASH */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1800&q=85')",
              }}
            />

            {/* OVERLAY */}
            <div className="absolute inset-0 bg-black/55" />

            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/15 to-black/30" />

            {/* GRID */}
            <div
              className="absolute inset-0 opacity-[0.12]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)",
                backgroundSize: "45px 45px",
              }}
            />

            <div className="relative flex h-full flex-col justify-between p-7 xl:p-9">
              {/* TOP */}
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-3 py-2 backdrop-blur-md">
                  <Activity className="h-3 w-3 text-white/70" />

                  <span className="text-[8px] uppercase tracking-[0.18em] text-white/55">
                    UAV Intelligence Platform
                  </span>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/25 backdrop-blur-md">
                  <ArrowUpRight className="h-3.5 w-3.5 text-white/60" />
                </div>
              </div>

              {/* CENTER */}
              <div className="relative flex flex-1 items-center justify-center">
                {/* DASHBOARD CARD */}
                <div className="relative w-[260px] rounded-[22px] border border-white/15 bg-black/45 p-4 shadow-2xl backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[7px] uppercase tracking-[0.2em] text-white/35">
                        FIELD STATUS
                      </p>

                      <p className="mt-1 text-[11px] font-semibold text-white">
                        Monitoring Active
                      </p>
                    </div>

                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white">
                      <ScanLine className="h-3 w-3 text-black" />
                    </div>
                  </div>

                  {/* MAP */}
                  <div
                    className="relative mt-4 h-[125px] overflow-hidden rounded-xl bg-cover bg-center"
                    style={{
                      backgroundImage:
                        "url('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=900&q=80')",
                    }}
                  >
                    <div className="absolute inset-0 bg-black/35" />

                    <div
                      className="absolute inset-0 opacity-30"
                      style={{
                        backgroundImage:
                          "linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)",
                        backgroundSize: "20px 20px",
                      }}
                    />

                    <div className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/55 backdrop-blur">
                      <div className="h-2 w-2 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.9)]" />
                    </div>
                  </div>

                  {/* STATS */}
                  <div className="mt-3 grid grid-cols-3 gap-1.5">
                    <div className="rounded-lg bg-white/[0.06] px-2 py-2">
                      <p className="text-[7px] text-white/30">NDVI</p>
                      <p className="mt-0.5 text-xs font-semibold">0.82</p>
                    </div>

                    <div className="rounded-lg bg-white/[0.06] px-2 py-2">
                      <p className="text-[7px] text-white/30">AREA</p>
                      <p className="mt-0.5 text-xs font-semibold">120 ha</p>
                    </div>

                    <div className="rounded-lg bg-white/[0.06] px-2 py-2">
                      <p className="text-[7px] text-white/30">STATUS</p>
                      <p className="mt-0.5 text-xs font-semibold">Ready</p>
                    </div>
                  </div>
                </div>

                {/* FLOATING LABELS */}
                <div className="absolute bottom-[28%] left-[4%] rounded-xl border border-white/15 bg-black/45 px-3 py-2 backdrop-blur-xl">
                  <p className="text-[7px] uppercase tracking-[0.15em] text-white/30">
                    Processing
                  </p>

                  <p className="mt-1 text-[10px] font-semibold">Real-time</p>
                </div>

                <div className="absolute right-[3%] top-[28%] rounded-xl border border-white/15 bg-black/45 px-3 py-2 backdrop-blur-xl">
                  <p className="text-[7px] uppercase tracking-[0.15em] text-white/30">
                    System
                  </p>

                  <p className="mt-1 text-[10px] font-semibold">Connected</p>
                </div>
              </div>

              {/* BOTTOM */}
              <div className="max-w-md">
                <p className="text-[8px] font-semibold uppercase tracking-[0.28em] text-white/40">
                  FIELD INTELLIGENCE
                </p>

                <h2 className="mt-3 text-3xl font-semibold leading-[1.05] tracking-[-0.045em] xl:text-[38px]">
                  Data dari udara.
                  <br />
                  Keputusan lebih tepat.
                </h2>

                <p className="mt-3 max-w-sm text-[11px] leading-5 text-white/45">
                  Kelola pemetaan UAV, analisis NDVI, data topografi dan
                  informasi pertanian dalam satu platform.
                </p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {["NDVI", "NPK", "LiDAR", "Cloud Analytics"].map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-white/15 bg-black/25 px-2.5 py-1 text-[7px] font-medium text-white/55 backdrop-blur"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==============================
          FOOTER
      =============================== */}
      <footer className="px-4 py-4">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
          <p className="text-[8px] tracking-[0.12em] text-white/20">
            © 2026 UAV DaaS Platform. All rights reserved.
          </p>

          <div className="flex gap-4 text-[8px] text-white/20">
            <a href="#" className="transition hover:text-white/60">
              Privacy Policy
            </a>

            <a href="#" className="transition hover:text-white/60">
              Terms of Use
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
