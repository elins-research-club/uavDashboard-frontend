"use client";

import { useState } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Map,
  ArrowRight,
  Shield,
  Zap,
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
      // Backend uses Pydantic UserLogin schema — accepts JSON with { email, password }
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", data.access_token);
      window.location.href = "/dashboard";
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { detail?: string } } };
      setMessage(axiosError.response?.data?.detail || "Email atau password salah.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
              <Map className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-gray-900">
              UAV Platform
            </span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">
              Selamat Datang Kembali
            </h1>
            <p className="text-sm text-gray-600">
              Masukkan kredensial Anda untuk mengakses dashboard
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition text-gray-900"
                  placeholder="nama@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition text-gray-900"
                  placeholder="Masukkan password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                />
                <span className="text-xs text-gray-600">Ingat saya</span>
              </label>
              <a
                href="#"
                className="text-xs font-medium text-gray-900 hover:text-gray-700"
              >
                Lupa password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Memproses...
                </>
              ) : (
                <>
                  Login
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {message && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
                {message}
              </div>
            )}
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-gray-50 text-gray-500">atau</span>
            </div>
          </div>

          {/* Register Link */}
          <p className="text-center text-xs text-gray-600 mt-6">
            Belum punya akun?{" "}
            <a
              href="/register"
              className="font-medium text-gray-900 hover:text-gray-700"
            >
              Daftar sekarang
            </a>
          </p>
        </div>
      </div>

      {/* Right Side - Info */}
      <div className="hidden lg:flex lg:flex-1 bg-gray-900 p-12 items-center justify-center">
        <div className="max-w-md">
          <h2 className="text-3xl font-semibold text-white mb-4">
            Platform Pemetaan UAV Terpadu
          </h2>
          <p className="text-gray-300 mb-8 leading-relaxed">
            Akses data pemetaan UAV Anda, kelola proyek dengan mudah, dan
            tingkatkan produktivitas dengan dashboard interaktif real-time.
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-white mb-1">Akses Cepat</p>
                <p className="text-sm text-gray-400">
                  Dashboard interaktif dengan data real-time
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-white mb-1">Aman & Terpercaya</p>
                <p className="text-sm text-gray-400">
                  Data terenkripsi dengan standar keamanan tinggi
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                <Map className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-white mb-1">Analisis Mendalam</p>
                <p className="text-sm text-gray-400">
                  Tools analisis geospasial yang komprehensif
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-10 border-t border-gray-800">
            <p className="text-xs text-gray-500 mb-2">Dipercaya oleh</p>
            <p className="text-2xl font-semibold text-white">
              10,000+ Pengguna
            </p>
            <p className="text-xs text-gray-400 mt-1">
              dari berbagai sektor pertanian
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
