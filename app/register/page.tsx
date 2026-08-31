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
  CheckCircle,
  Shield,
  Zap,
  Clock,
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
      const axiosError = error as { response?: { data?: { detail?: string } } };
      setMessage(axiosError.response?.data?.detail || "Registrasi gagal. Silakan coba lagi.");
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = (pass: string) => {
    if (pass.length === 0)
      return { strength: 0, text: "", color: "bg-gray-200" };
    if (pass.length < 6)
      return { strength: 1, text: "Lemah", color: "bg-red-500" };
    if (pass.length < 10)
      return { strength: 2, text: "Sedang", color: "bg-yellow-500" };
    return { strength: 3, text: "Kuat", color: "bg-green-500" };
  };

  const strength = passwordStrength(password);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Side - Info */}
      <div className="hidden lg:flex lg:flex-1 bg-gray-900 p-12 items-center justify-center">
        <div className="max-w-md">
          <h2 className="text-3xl font-semibold text-white mb-4">
            Mulai Perjalanan Digital Anda
          </h2>
          <p className="text-gray-300 mb-8 leading-relaxed">
            Bergabunglah dengan ribuan profesional yang sudah menggunakan
            platform kami untuk pemetaan UAV yang lebih efisien dan akurat.
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="font-medium text-white mb-1">
                  Gratis untuk Memulai
                </p>
                <p className="text-sm text-gray-400">
                  Tidak perlu kartu kredit untuk memulai
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-white mb-1">Setup Cepat</p>
                <p className="text-sm text-gray-400">
                  Mulai dalam hitungan menit
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="font-medium text-white mb-1">Data Aman</p>
                <p className="text-sm text-gray-400">
                  Enkripsi end-to-end untuk semua data
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="font-medium text-white mb-1">Support 24/7</p>
                <p className="text-sm text-gray-400">
                  Tim support siap membantu kapan saja
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-10 border-t border-gray-800">
            <p className="text-xs text-gray-500 mb-2">Dipercaya oleh</p>
            <p className="text-2xl font-semibold text-white">
              10,000+ Profesional
            </p>
            <p className="text-xs text-gray-400 mt-1">dari berbagai industri</p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
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
              Buat Akun Baru
            </h1>
            <p className="text-sm text-gray-600">
              Isi formulir di bawah untuk membuat akun
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition text-gray-900"
                  placeholder="Nama pengguna"
                  required
                />
              </div>
            </div>

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
                  placeholder="Min. 8 karakter"
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
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          level <= strength.strength
                            ? strength.color
                            : "bg-gray-200"
                        }`}
                      ></div>
                    ))}
                  </div>
                  {strength.text && (
                    <p className="text-xs text-gray-600">
                      Kekuatan password: {strength.text}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                className="w-4 h-4 mt-0.5 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                required
              />
              <label htmlFor="terms" className="text-xs text-gray-600">
                Saya menyetujui{" "}
                <a
                  href="#"
                  className="text-gray-900 hover:text-gray-700 font-medium"
                >
                  Syarat & Ketentuan
                </a>{" "}
                dan{" "}
                <a
                  href="#"
                  className="text-gray-900 hover:text-gray-700 font-medium"
                >
                  Kebijakan Privasi
                </a>
              </label>
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
                  Mendaftar...
                </>
              ) : (
                <>
                  Daftar Sekarang
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {message && (
              <div
                className={`${
                  isSuccess
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-red-50 border-red-200 text-red-700"
                } border px-3 py-2 rounded-lg text-xs flex items-start gap-2`}
              >
                {isSuccess && (
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                )}
                <span>{message}</span>
              </div>
            )}
          </form>

          {/* Login Link */}
          <p className="text-center text-xs text-gray-600 mt-6">
            Sudah punya akun?{" "}
            <a
              href="/login"
              className="font-medium text-gray-900 hover:text-gray-700"
            >
              Login di sini
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
