"use client";

import { useState } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Map,
  ArrowRight,
  ArrowUpRight,
  Shield,
  Zap,
  ScanLine,
  CheckCircle2,
  Activity,
} from "lucide-react";
import api from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { data } = await api.post("/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", data.access_token);
      window.location.href = "/dashboard";
    } catch (error: unknown) {
      const axiosError = error as {
        response?: {
          data?: {
            detail?: string;
          };
        };
      };

      setMessage(
        axiosError.response?.data?.detail || "Email atau password salah."
      );

      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      {/* =====================================================
          TOP BRAND BAR
      ====================================================== */}
      <header className="fixed left-0 right-0 top-0 z-50 px-3 pt-3 sm:px-5">
        <nav className="mx-auto flex h-[58px] max-w-7xl items-center justify-between rounded-full border border-black/10 bg-white/95 px-3 shadow-2xl shadow-black/20 backdrop-blur-xl">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3 pl-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black">
              <Map className="h-4 w-4 text-white" />
            </div>

            <div className="hidden leading-none sm:block">
              <p className="text-[12px] font-black tracking-[0.22em] text-black">
                UAV
              </p>

              <p className="mt-1 text-[8px] font-medium tracking-[0.28em] text-black/45">
                DAAS PLATFORM
              </p>
            </div>
          </a>

          <div className="flex items-center gap-2">
            <span className="hidden text-[11px] text-black/45 sm:block">
              Belum punya akun?
            </span>

            <a
              href="/register"
              className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-[11px] font-semibold text-white transition hover:bg-neutral-800"
            >
              Daftar Sekarang
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </nav>
      </header>

      {/* =====================================================
          MAIN
      ====================================================== */}
      <section className="min-h-screen px-3 pb-3 pt-24 sm:px-5">
        <div className="mx-auto grid min-h-[calc(100vh-108px)] max-w-7xl overflow-hidden rounded-[30px] border border-white/10 bg-[#0d0d0d] sm:rounded-[38px] lg:grid-cols-[0.9fr_1.1fr]">
          {/* ===================================================
              LEFT — LOGIN FORM
          ==================================================== */}
          <div className="flex items-center justify-center px-6 py-12 sm:px-10 lg:px-14 xl:px-20">
            <div className="w-full max-w-md">
              {/* Section label */}
              <div className="mb-8">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />

                  <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-white/55">
                    Secure Access
                  </span>
                </div>

                <h1 className="text-4xl font-semibold leading-[1.05] tracking-[-0.045em] text-white sm:text-5xl">
                  Selamat datang
                  <br />
                  <span className="text-white/35">kembali.</span>
                </h1>

                <p className="mt-5 max-w-sm text-sm leading-6 text-white/40">
                  Masuk ke dashboard UAV DaaS untuk mengelola proyek, memonitor
                  data penerbangan, dan melihat analisis lahan Anda.
                </p>
              </div>

              {/* =================================================
                  FORM
              ================================================== */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40"
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
                      className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.035] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/20 hover:border-white/20 focus:border-white/30 focus:bg-white/[0.055]"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40"
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
                      className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.035] pl-11 pr-12 text-sm text-white outline-none transition placeholder:text-white/20 hover:border-white/20 focus:border-white/30 focus:bg-white/[0.055]"
                      required
                    />

                    <button
                      type="button"
                      aria-label={
                        showPassword
                          ? "Sembunyikan password"
                          : "Tampilkan password"
                      }
                      onClick={() => setShowPassword((value) => !value)}
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

                {/* Options */}
                <div className="flex items-center justify-between">
                  <label className="flex cursor-pointer items-center gap-2.5">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-white/20 bg-white/5 accent-white"
                    />

                    <span className="text-xs text-white/40">Ingat saya</span>
                  </label>

                  <a
                    href="#"
                    className="text-xs font-medium text-white/55 transition hover:text-white"
                  >
                    Lupa password?
                  </a>
                </div>

                {/* Error */}
                {message && (
                  <div className="flex items-start gap-3 rounded-2xl border border-red-400/15 bg-red-400/[0.06] px-4 py-3.5 text-xs leading-5 text-red-300">
                    <div className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-red-400" />

                    <span>{message}</span>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      Login ke Dashboard
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="my-8 flex items-center gap-4">
                <div className="h-px flex-1 bg-white/10" />

                <span className="text-[9px] uppercase tracking-[0.18em] text-white/20">
                  atau
                </span>

                <div className="h-px flex-1 bg-white/10" />
              </div>

              {/* Register */}
              <p className="text-center text-xs text-white/35">
                Belum mempunyai akun?{" "}
                <a
                  href="/register"
                  className="font-semibold text-white transition hover:text-white/65"
                >
                  Daftar sekarang
                </a>
              </p>

              {/* Bottom status */}
              <div className="mt-10 flex items-center justify-center gap-2 text-[9px] uppercase tracking-[0.16em] text-white/20">
                <Shield className="h-3.5 w-3.5" />
                Protected connection
              </div>
            </div>
          </div>

          {/* ===================================================
              RIGHT — PRODUCT / BRAND PANEL
          ==================================================== */}
          <div className="relative hidden overflow-hidden lg:block">
            {/* Background */}
            <div className="absolute inset-0 bg-[#111111]" />

            {/* Decorative grid */}
            <div
              className="absolute inset-0 opacity-[0.12]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
                backgroundSize: "55px 55px",
              }}
            />

            {/* Glow */}
            <div className="absolute left-[20%] top-[20%] h-80 w-80 rounded-full bg-white/[0.045] blur-3xl" />
            <div className="absolute bottom-[10%] right-[5%] h-96 w-96 rounded-full bg-white/[0.035] blur-3xl" />

            <div className="relative flex h-full flex-col justify-between p-8 xl:p-12">
              {/* Top */}
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2 backdrop-blur-md">
                  <Activity className="h-3.5 w-3.5 text-white/60" />

                  <span className="text-[9px] uppercase tracking-[0.18em] text-white/40">
                    UAV Intelligence Platform
                  </span>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
                  <ArrowUpRight className="h-4 w-4 text-white/50" />
                </div>
              </div>

              {/* Center visual */}
              <div className="relative flex flex-1 items-center justify-center py-12">
                {/* Ring */}
                <div className="absolute h-[360px] w-[360px] rounded-full border border-white/[0.07]" />
                <div className="absolute h-[270px] w-[270px] rounded-full border border-white/[0.06]" />
                <div className="absolute h-[185px] w-[185px] rounded-full border border-white/[0.05]" />

                {/* Center card */}
                <div className="relative z-10 w-[285px] rounded-[28px] border border-white/10 bg-[#171717] p-5 shadow-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[8px] uppercase tracking-[0.2em] text-white/25">
                        FIELD STATUS
                      </p>

                      <p className="mt-1 text-xs font-semibold text-white">
                        Monitoring Active
                      </p>
                    </div>

                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white">
                      <ScanLine className="h-3.5 w-3.5 text-black" />
                    </div>
                  </div>

                  {/* Fake field visualization */}
                  <div className="relative mt-5 h-[150px] overflow-hidden rounded-2xl bg-[#202020]">
                    <div
                      className="absolute inset-0 opacity-50"
                      style={{
                        backgroundImage:
                          "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
                        backgroundSize: "22px 22px",
                      }}
                    />

                    {/* field blocks */}
                    <div className="absolute inset-5 grid grid-cols-4 gap-1 opacity-60">
                      {Array.from({ length: 24 }).map((_, i) => (
                        <div
                          key={i}
                          className={`rounded-sm ${
                            i % 5 === 0 ? "bg-white/35" : "bg-white/[0.07]"
                          }`}
                        />
                      ))}
                    </div>

                    {/* Drone indicator */}
                    <div className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/50">
                      <div className="h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,0.8)]" />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-white/[0.035] p-2.5">
                      <p className="text-[8px] text-white/25">NDVI</p>
                      <p className="mt-1 text-sm font-semibold">0.82</p>
                    </div>

                    <div className="rounded-xl bg-white/[0.035] p-2.5">
                      <p className="text-[8px] text-white/25">AREA</p>
                      <p className="mt-1 text-sm font-semibold">120 ha</p>
                    </div>

                    <div className="rounded-xl bg-white/[0.035] p-2.5">
                      <p className="text-[8px] text-white/25">STATUS</p>
                      <p className="mt-1 flex items-center gap-1 text-sm font-semibold">
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        Ready
                      </p>
                    </div>
                  </div>
                </div>

                {/* Floating left badge */}
                <div className="absolute left-[5%] top-[30%] rounded-2xl border border-white/10 bg-[#171717]/90 px-4 py-3 backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white">
                      <Zap className="h-3.5 w-3.5 text-black" />
                    </div>

                    <div>
                      <p className="text-[8px] uppercase tracking-[0.15em] text-white/25">
                        Processing
                      </p>

                      <p className="mt-0.5 text-xs font-semibold">Real-time</p>
                    </div>
                  </div>
                </div>

                {/* Floating right badge */}
                <div className="absolute bottom-[27%] right-[2%] rounded-2xl border border-white/10 bg-[#171717]/90 px-4 py-3 backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-white/65" />

                    <div>
                      <p className="text-[8px] uppercase tracking-[0.15em] text-white/25">
                        System
                      </p>

                      <p className="mt-0.5 text-xs font-semibold">Connected</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom */}
              <div className="max-w-lg">
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/25">
                  FIELD INTELLIGENCE
                </p>

                <h2 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-[-0.045em] text-white xl:text-5xl">
                  Data dari udara.
                  <br />
                  Keputusan lebih tepat.
                </h2>

                <p className="mt-5 max-w-md text-sm leading-6 text-white/35">
                  Kelola pemetaan UAV, analisis NDVI, data topografi dan
                  informasi pertanian dalam satu platform terintegrasi.
                </p>

                <div className="mt-7 flex flex-wrap gap-2">
                  {["NDVI", "NPK", "LiDAR", "Cloud Analytics"].map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[9px] font-medium text-white/45"
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

      {/* =====================================================
          FOOTER
      ====================================================== */}
      <footer className="px-5 py-5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
          <p className="text-[9px] tracking-[0.12em] text-white/20">
            © 2024 UAV DaaS Platform. All rights reserved.
          </p>

          <div className="flex gap-5 text-[9px] text-white/20">
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
