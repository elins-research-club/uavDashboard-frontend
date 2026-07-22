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
    api.get("/maps")
      .then(({ data }) => setMaps(data.maps))
      .catch((requestError) => setError(requestError.response?.data?.detail || "Gagal memuat dashboard."))
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
      icon: <MapPin className="w-5 h-5" />,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-100",
    },
    {
      title: "Paket Tier",
      value: tier,
      subtitle: "Upgrade untuk lebih",
      icon: <Award className="w-5 h-5" />,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-100",
    },
    {
      title: "Aktivitas",
      value: latestMaps.length,
      subtitle: "upload terbaru",
      icon: <TrendingUp className="w-5 h-5" />,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-100",
    },
    {
      title: "Penyimpanan",
      value: formatSize(totalStorage),
      subtitle: "total file peta",
      icon: <Database className="w-5 h-5" />,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-100",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Selamat Datang, {username}
          </h1>
          <p className="text-sm text-gray-600">
            Anda menggunakan paket{" "}
            <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
              {tier}
            </span>
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`bg-white rounded-lg border ${stat.borderColor} p-5 hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-md ${stat.bgColor}`}>
                  <div className={stat.color}>{stat.icon}</div>
                </div>
              </div>
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                {stat.title}
              </h3>
              <p className="text-2xl font-semibold text-gray-900 mb-0.5">
                {stat.value}
              </p>
              <p className="text-xs text-gray-500">{stat.subtitle}</p>
            </div>
          ))}
        </div>

        {/* Upgrade Banner */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-blue-50 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  Tingkatkan Pengalaman Anda
                </h2>
                <p className="text-sm text-gray-600">
                  Upgrade ke tier yang lebih tinggi untuk akses fitur premium
                  dan analisis mendalam
                </p>
              </div>
            </div>
            <Link href="/dashboard/subscription" className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors whitespace-nowrap">
              Lihat Paket
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Maps List */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Data Lahan Anda
              </h2>
              <p className="text-xs text-gray-500">
                Kelola dan pantau data lahan pertanian
              </p>
            </div>
            <Link href="/dashboard/maps" className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700">
              Lihat Semua
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {isLoading && <p className="text-sm text-gray-500">Memuat data peta...</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}
            {!isLoading && !error && !latestMaps.length && (
              <p className="text-sm text-gray-500">Belum ada peta tersimpan.</p>
            )}
            {latestMaps.map((layer) => (
              <div
                key={layer.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {layer.title}
                      </h3>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded border border-gray-200">
                        {layer.map_type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-3">
                      {layer.description || layer.location}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(layer.survey_date).toLocaleDateString("id-ID")}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5" />
                        <span>{formatSize(layer.file_size)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="ml-4">
                    {layer.locked_for_free ? (
                      <button className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-amber-600 transition-colors">
                        <Lock className="w-3.5 h-3.5" />
                        Upgrade
                      </button>
                    ) : (
                      <Link href="/dashboard/maps" className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                        Lihat Peta
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity & Tips */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-gray-600" />
              <h3 className="text-base font-semibold text-gray-900">Upload Terbaru</h3>
            </div>
            <div className="space-y-4">
              {latestMaps.slice(0, 3).map((map) => (
                <div key={map.id} className="flex items-start gap-3">
                  <div
                    className="p-1.5 rounded text-blue-600 bg-blue-50 flex items-center justify-center"
                  >
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {map.title}
                    </p>
                    <p className="text-xs text-gray-500">{new Date(map.created_at).toLocaleDateString("id-ID")}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-gray-600" />
              <h3 className="text-base font-semibold text-gray-900">
                Tips & Informasi
              </h3>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs text-gray-700 leading-relaxed">
                  <span className="font-semibold text-blue-900">Tips:</span>{" "}
                  Upload peta di pagi hari untuk pemrosesan lebih cepat dan
                  efisien
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                <p className="text-xs text-gray-700 leading-relaxed">
                  <span className="font-semibold text-green-900">Info:</span>{" "}
                  Format TIFF memberikan kualitas terbaik untuk analisis data
                  pertanian
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
