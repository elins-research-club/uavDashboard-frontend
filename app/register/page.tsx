"use client";

import { useState } from "react";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Map,
  ArrowRight,
  ArrowUpRight,
  Shield,
  Zap,
  Clock,
  CheckCircle2,
  ScanLine,
  Activity,
  Database,
  Leaf,
} from "lucide-react";
import api from "@/lib/api";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setIsSuccess(false);

    try {
      const { data } = await api.post("/auth/register", {
        username,
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
        axiosError.response?.data?.detail ||
          "Registrasi gagal. Silakan coba lagi."
      );

      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = (pass: string) => {
    if (pass.length === 0) {
      return {
        strength: 0,
        text: "",
      };
    }

    if (pass.length < 6) {
      return {
        strength: 1,
        text: "Lemah",
      };
    }

    if (pass.length < 10) {
      return {
        strength: 2,
        text: "Sedang",
      };
    }

    return {
      strength: 3,
      text: "Kuat",
    };
  };

  const strength = passwordStrength(password);

  return (
    <main className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      {/* =====================================================
          TOP NAVIGATION
      ====================================================== */}
      <header className="fixed left-0 right-0 top-0 z-50 px-3 pt-3 sm:px-5">
        <nav className="mx-auto flex h-[58px] max-w-7xl items-center justify-between rounded-full border border-black/10 bg-white/95 px-3 shadow-2xl shadow-black/20 backdrop-blur-xl">
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
              Sudah punya akun?
            </span>

            <a
              href="/login"
              className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-[11px] font-semibold text-white transition hover:bg-neutral-800"
            >
              Login
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </nav>
      </header>

      {/* =====================================================
          MAIN REGISTER CONTAINER
      ====================================================== */}
      <section className="min-h-screen px-3 pb-3 pt-24 sm:px-5">
        <div className="mx-auto grid min-h-[calc(100vh-108px)] max-w-7xl overflow-hidden rounded-[30px] border border-white/10 bg-[#0d0d0d] sm:rounded-[38px] lg:grid-cols-[1.05fr_0.95fr]">
          {/* =================================================
              LEFT — PRODUCT / BRAND PANEL
          ================================================== */}
          <div className="relative hidden overflow-hidden lg:block">
            <div className="absolute inset-0 bg-[#111111]" />

            {/* subtle technical grid */}
            <div
              className="absolute inset-0 opacity-[0.12]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
                backgroundSize: "55px 55px",
              }}
            />

            <div className="absolute left-[10%] top-[12%] h-80 w-80 rounded-full bg-white/[0.045] blur-3xl" />

            <div className="absolute bottom-[5%] right-[5%] h-96 w-96 rounded-full bg-white/[0.04] blur-3xl" />

            <div className="relative flex h-full flex-col justify-between p-8 xl:p-12">
              {/* Top status */}
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2">
                  <Activity className="h-3.5 w-3.5 text-white/50" />

                  <span className="text-[9px] uppercase tracking-[0.2em] text-white/35">
                    Build your field intelligence
                  </span>
                </div>

                <div className="rounded-full border border-white/10 px-3 py-2 text-[9px] uppercase tracking-[0.18em] text-white/25">
                  UAV DaaS
                </div>
              </div>

              {/* Visual */}
              <div className="relative flex flex-1 items-center justify-center py-10">
                {/* rings */}
                <div className="absolute h-[400px] w-[400px] rounded-full border border-white/[0.07]" />
                <div className="absolute h-[300px] w-[300px] rounded-full border border-white/[0.06]" />
                <div className="absolute h-[210px] w-[210px] rounded-full border border-white/[0.05]" />

                {/* central dashboard */}
                <div className="relative z-10 w-[300px] rounded-[28px] border border-white/10 bg-[#171717] p-5 shadow-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[8px] uppercase tracking-[0.2em] text-white/25">
                        NEW PROJECT
                      </p>

                      <p className="mt-1 text-xs font-semibold">
                        Field Intelligence
                      </p>
                    </div>

                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-black">
                      <ScanLine className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-white/[0.07] bg-[#202020] p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[8px] text-white/25">COVERAGE</p>

                        <p className="mt-1 text-lg font-semibold">120 ha</p>
                      </div>

                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06]">
                        <Database className="h-3.5 w-3.5 text-white/50" />
                      </div>
                    </div>

                    <div className="mt-5 h-24 overflow-hidden rounded-xl bg-[#151515]">
                      <div
                        className="h-full w-full opacity-50"
                        style={{
                          backgroundImage:
                            "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
                          backgroundSize: "20px 20px",
                        }}
                      />

                      <div className="relative -mt-24 grid h-24 grid-cols-6 gap-1 p-3">
                        {Array.from({ length: 24 }).map((_, index) => (
                          <div
                            key={index}
                            className={`rounded-sm ${
                              index % 4 === 0
                                ? "bg-white/25"
                                : "bg-white/[0.05]"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-white/[0.035] p-3">
                      <p className="text-[8px] text-white/25">NDVI</p>

                      <p className="mt-1 text-sm font-semibold">0.82</p>
                    </div>

                    <div className="rounded-xl bg-white/[0.035] p-3">
                      <p className="text-[8px] text-white/25">STATUS</p>

                      <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold">
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        Ready
                      </p>
                    </div>
                  </div>
                </div>

                {/* left floating card */}
                <div className="absolute left-[2%] top-[27%] rounded-2xl border border-white/10 bg-[#181818]/90 px-4 py-3 backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white">
                      <Leaf className="h-3.5 w-3.5 text-black" />
                    </div>

                    <div>
                      <p className="text-[8px] uppercase tracking-[0.16em] text-white/25">
                        Analysis
                      </p>

                      <p className="mt-0.5 text-xs font-semibold">NDVI ready</p>
                    </div>
                  </div>
                </div>

                {/* right floating card */}
                <div className="absolute bottom-[26%] right-0 rounded-2xl border border-white/10 bg-[#181818]/90 px-4 py-3 backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white">
                      <Zap className="h-3.5 w-3.5 text-black" />
                    </div>

                    <div>
                      <p className="text-[8px] uppercase tracking-[0.16em] text-white/25">
                        Platform
                      </p>

                      <p className="mt-0.5 text-xs font-semibold">Connected</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/25">
                  START YOUR JOURNEY
                </p>

                <h2 className="mt-4 max-w-xl text-4xl font-semibold leading-[1.04] tracking-[-0.045em] xl:text-5xl">
                  Bangun sistem
                  <br />
                  pertanian yang lebih
                  <br />
                  terhubung.
                </h2>

                <p className="mt-5 max-w-md text-sm leading-6 text-white/35">
                  Daftar dan mulai gunakan platform UAV untuk memetakan,
                  memahami dan mengoptimalkan lahan Anda.
                </p>

                <div className="mt-7 flex flex-wrap gap-2">
                  {["NDVI", "NPK", "LiDAR", "Cloud"].map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[9px] font-medium text-white/40"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* =================================================
              RIGHT — REGISTER FORM
          ================================================== */}
          <div className="flex items-center justify-center px-6 py-12 sm:px-10 lg:px-12 xl:px-20">
            <div className="w-full max-w-md">
              {/* Heading */}
              <div className="mb-8">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />

                  <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-white/55">
                    Create Account
                  </span>
                </div>

                <h1 className="text-4xl font-semibold leading-[1.05] tracking-[-0.045em] text-white sm:text-5xl">
                  Buat akun
                  <br />
                  <span className="text-white/35">baru.</span>
                </h1>

                <p className="mt-5 max-w-sm text-sm leading-6 text-white/40">
                  Daftarkan akun Anda untuk mulai mengakses dashboard UAV DaaS
                  dan mengelola data pertanian secara terintegrasi.
                </p>
              </div>

              {/* =================================================
                  FORM
              ================================================== */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username */}
                <div>
                  <label
                    htmlFor="username"
                    className="mb-2.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40"
                  >
                    Username
                  </label>

                  <div className="group relative">
                    <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25 transition group-focus-within:text-white/60" />

                    <input
                      id="username"
                      type="text"
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Nama pengguna"
                      className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.035] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/20 hover:border-white/20 focus:border-white/30 focus:bg-white/[0.055]"
                      required
                    />
                  </div>
                </div>

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
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 karakter"
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

                  {/* Password strength */}
                  {password && (
                    <div className="mt-3">
                      <div className="flex gap-1.5">
                        {[1, 2, 3].map((level) => (
                          <div
                            key={level}
                            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                              level <= strength.strength
                                ? "bg-white"
                                : "bg-white/10"
                            }`}
                          />
                        ))}
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[9px] uppercase tracking-[0.15em] text-white/25">
                          Password strength
                        </span>

                        {strength.text && (
                          <span
                            className={`text-[10px] font-semibold ${
                              strength.strength === 1
                                ? "text-red-300"
                                : strength.strength === 2
                                ? "text-yellow-200"
                                : "text-white"
                            }`}
                          >
                            {strength.text}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Terms */}
                <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                  <input
                    id="terms"
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-white/20 bg-white/5 accent-white"
                    required
                  />

                  <label
                    htmlFor="terms"
                    className="text-[11px] leading-5 text-white/35"
                  >
                    Saya menyetujui{" "}
                    <a
                      href="#"
                      className="font-semibold text-white/70 transition hover:text-white"
                    >
                      Syarat & Ketentuan
                    </a>{" "}
                    dan{" "}
                    <a
                      href="#"
                      className="font-semibold text-white/70 transition hover:text-white"
                    >
                      Kebijakan Privasi
                    </a>
                    .
                  </label>
                </div>

                {/* Message */}
                {message && (
                  <div
                    className={`flex items-start gap-3 rounded-2xl border px-4 py-3.5 text-xs leading-5 ${
                      isSuccess
                        ? "border-white/15 bg-white/[0.05] text-white/75"
                        : "border-red-400/15 bg-red-400/[0.06] text-red-300"
                    }`}
                  >
                    {isSuccess ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    ) : (
                      <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-red-400" />
                    )}

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
                      Mendaftar...
                    </>
                  ) : (
                    <>
                      Buat Akun
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

              {/* Login */}
              <p className="text-center text-xs text-white/35">
                Sudah punya akun?{" "}
                <a
                  href="/login"
                  className="font-semibold text-white transition hover:text-white/65"
                >
                  Login di sini
                </a>
              </p>

              {/* Security */}
              <div className="mt-9 flex items-center justify-center gap-2 text-[9px] uppercase tracking-[0.16em] text-white/20">
                <Shield className="h-3.5 w-3.5" />
                Secure account creation
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
