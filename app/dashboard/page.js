"use client";

import { useState } from "react";
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
  CheckCircle2,
  Download,
} from "lucide-react";

const dummyUserData = {
  username: "Kades Sriharjo",
  tier: "Free",
  mapsAvailable: 5,
  mapsUsed: 2,
};

const dummyMapLayers = [
  {
    id: "map1",
    name: "Peta Vegetasi (Jan 2024)",
    isLocked: false,
    description: "Data vegetasi dari drone A.",
    date: "15 Jan 2024",
    size: "45 MB",
    type: "NDVI",
  },
  {
    id: "map2",
    name: "Peta NPK (Jan 2024)",
    isLocked: true,
    description: "Analisis NPK. Upgrade untuk membuka.",
    date: "20 Jan 2024",
    size: "38 MB",
    type: "Soil Analysis",
  },
  {
    id: "map3",
    name: "Peta Kontur Lahan (Feb 2024)",
    isLocked: false,
    description: "Data topografi dasar.",
    date: "05 Feb 2024",
    size: "52 MB",
    type: "Topography",
  },
  {
    id: "map4",
    name: "Peta Kesuburan Tanah (Mei 2024)",
    isLocked: true,
    description: "Data kesuburan. Upgrade untuk membuka.",
    date: "10 Mei 2024",
    size: "41 MB",
    type: "Fertility",
  },
];

export default function DashboardHomePage() {
  const [user] = useState(dummyUserData);
  const [layers] = useState(dummyMapLayers);

  const stats = [
    {
      title: "Total Peta",
      value: user.mapsUsed,
      subtitle: `dari ${user.mapsAvailable} tersedia`,
      icon: <MapPin className="w-5 h-5" />,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-100",
    },
    {
      title: "Paket Tier",
      value: user.tier,
      subtitle: "Upgrade untuk lebih",
      icon: <Award className="w-5 h-5" />,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-100",
    },
    {
      title: "Aktivitas",
      value: "12",
      subtitle: "aksi bulan ini",
      icon: <TrendingUp className="w-5 h-5" />,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-100",
    },
    {
      title: "Penyimpanan",
      value: "176 MB",
      subtitle: "dari 500 MB",
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
            Selamat Datang, {user.username}
          </h1>
          <p className="text-sm text-gray-600">
            Anda menggunakan paket{" "}
            <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
              {user.tier}
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
            <button className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors whitespace-nowrap">
              Lihat Paket
              <ArrowRight className="w-4 h-4" />
            </button>
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
            <button className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700">
              Lihat Semua
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {layers.map((layer) => (
              <div
                key={layer.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {layer.name}
                      </h3>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded border border-gray-200">
                        {layer.type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-3">
                      {layer.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{layer.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5" />
                        <span>{layer.size}</span>
                      </div>
                    </div>
                  </div>

                  <div className="ml-4">
                    {layer.isLocked ? (
                      <button className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-amber-600 transition-colors">
                        <Lock className="w-3.5 h-3.5" />
                        Upgrade
                      </button>
                    ) : (
                      <button className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                        Lihat Peta
                      </button>
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
              <h3 className="text-base font-semibold text-gray-900">
                Aktivitas Terkini
              </h3>
            </div>
            <div className="space-y-4">
              {[
                {
                  action: "Upload peta baru",
                  time: "2 jam lalu",
                  icon: <FileText className="w-4 h-4" />,
                  color: "text-blue-600 bg-blue-50",
                },
                {
                  action: "Analisis NPK selesai",
                  time: "5 jam lalu",
                  icon: <CheckCircle2 className="w-4 h-4" />,
                  color: "text-green-600 bg-green-50",
                },
                {
                  action: "Laporan diunduh",
                  time: "1 hari lalu",
                  icon: <Download className="w-4 h-4" />,
                  color: "text-purple-600 bg-purple-50",
                },
              ].map((activity, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div
                    className={`p-1.5 rounded ${activity.color} flex items-center justify-center`}
                  >
                    {activity.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.action}
                    </p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
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
