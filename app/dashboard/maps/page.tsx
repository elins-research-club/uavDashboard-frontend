"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import {
  Map as MapIcon,
  Layers,
  Download,
  Share2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Settings,
  Filter,
  Calendar,
  Info,
} from "lucide-react";

// Dynamic import for Map component to prevent SSR issues
const Map = dynamic(() => import("@/components/MapDisplay"), {
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-3"></div>
        <p className="text-sm text-gray-600">Memuat peta...</p>
      </div>
    </div>
  ),
  ssr: false,
});

export default function MapsPage() {
  const [maps, setMaps] = useState([]);
  const [selectedLayer, setSelectedLayer] = useState("");
  const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/maps")
      .then(({ data }) => {
        setMaps(data.maps);
        setSelectedLayer(data.maps[0]?.id || "");
      })
      .catch((requestError) => setError(requestError.response?.data?.detail || "Gagal memuat peta."))
      .finally(() => setLoading(false));
  }, []);

  const mapLayers = maps.map((map) => ({
    id: map.id,
    name: map.title,
    date: new Date(map.survey_date).toLocaleDateString("id-ID"),
    color: map.map_type === "NDVI" ? "bg-green-500" : "bg-blue-500",
    locked: map.locked_for_free,
  }));

  const mapTools = [
    {
      icon: <ZoomIn className="w-4 h-4" />,
      label: "Zoom In",
      action: "zoomIn",
    },
    {
      icon: <ZoomOut className="w-4 h-4" />,
      label: "Zoom Out",
      action: "zoomOut",
    },
    {
      icon: <Maximize2 className="w-4 h-4" />,
      label: "Full Screen",
      action: "fullscreen",
    },
    {
      icon: <Download className="w-4 h-4" />,
      label: "Export",
      action: "export",
    },
    { icon: <Share2 className="w-4 h-4" />, label: "Share", action: "share" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <MapIcon className="w-5 h-5 text-gray-600" />
            <h1 className="text-2xl font-semibold text-gray-900">
              Peta & Analisis Geospasial
            </h1>
          </div>
          <p className="text-sm text-gray-600">
            Kelola dan analisis data geospasial lahan pertanian Anda
          </p>
        </div>

        {/* Map Controls Bar */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsLayerPanelOpen(!isLayerPanelOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors border border-gray-200"
              >
                <Layers className="w-4 h-4" />
                Layer
              </button>
              <button className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors border border-gray-200">
                <Filter className="w-4 h-4" />
                Filter
              </button>
              <button className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors border border-gray-200">
                <Calendar className="w-4 h-4" />
                Periode
              </button>
            </div>

            <div className="flex items-center gap-2">
              {mapTools.map((tool, idx) => (
                <button
                  key={idx}
                  className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors border border-gray-200"
                  title={tool.label}
                >
                  {tool.icon}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-4">
          {/* Layer Panel */}
          {isLayerPanelOpen && (
            <div className="col-span-12 lg:col-span-3">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Layer Peta
                  </h3>
                  <Settings className="w-4 h-4 text-gray-500" />
                </div>

                <div className="space-y-2">
                  {loading && <p className="text-xs text-gray-500">Memuat peta...</p>}
                  {!loading && !mapLayers.length && <p className="text-xs text-gray-500">Belum ada peta.</p>}
                  {error && <p className="text-xs text-red-600">{error}</p>}
                  {mapLayers.map((layer) => (
                    <div
                      key={layer.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedLayer === layer.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      } ${layer.locked ? "opacity-60" : ""}`}
                      onClick={() =>
                        !layer.locked && setSelectedLayer(layer.id)
                      }
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-3 h-3 rounded-sm ${layer.color} mt-0.5 flex-shrink-0`}
                        ></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-xs font-medium text-gray-900 truncate">
                              {layer.name}
                            </h4>
                            {layer.locked && (
                              <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                Pro
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{layer.date}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Layer Info */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-700 leading-relaxed">
                        <span className="font-semibold">Tip:</span> Klik layer
                        untuk mengaktifkan tampilan di peta
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Map Container */}
          <div
            className={`${
              isLayerPanelOpen ? "col-span-12 lg:col-span-9" : "col-span-12"
            }`}
          >
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              {/* Map Header */}
              <div className="border-b border-gray-200 px-4 py-3 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs font-medium text-gray-700">
                      Layer Aktif:{" "}
                      {mapLayers.find((l) => l.id === selectedLayer)?.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>Zoom: 15</span>
                    <span>|</span>
                    <span>Lat: -7.8753, Lng: 110.4262</span>
                  </div>
                </div>
              </div>

              {/* Map Display */}
              <div className="h-[600px] w-full bg-gray-100">
                <Map />
              </div>

              {/* Map Footer */}
              <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <div className="flex items-center gap-4">
                    <span>Sumber: Drone Survey 2024</span>
                    <span>•</span>
                    <span>Resolusi: 5cm/pixel</span>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 font-medium">
                    Lihat Metadata
                  </button>
                </div>
              </div>
            </div>

            {/* Map Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
              {[
                {
                  label: "Total Area",
                  value: "45.2 Ha",
                  color: "bg-blue-50 border-blue-100 text-blue-700",
                },
                {
                  label: "Vegetasi Sehat",
                  value: "89%",
                  color: "bg-green-50 border-green-100 text-green-700",
                },
                {
                  label: "Perlu Perhatian",
                  value: "8%",
                  color: "bg-amber-50 border-amber-100 text-amber-700",
                },
                {
                  label: "Area Kritis",
                  value: "3%",
                  color: "bg-red-50 border-red-100 text-red-700",
                },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  className={`${stat.color} rounded-lg p-4 border`}
                >
                  <p className="text-xs font-medium mb-1">{stat.label}</p>
                  <p className="text-xl font-semibold">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Informasi Layer
            </h3>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span>Tanggal Survey:</span>
                <span className="font-medium text-gray-900">15 Jan 2024</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span>Drone Model:</span>
                <span className="font-medium text-gray-900">
                  DJI Phantom 4 RTK
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span>Resolusi:</span>
                <span className="font-medium text-gray-900">5 cm/pixel</span>
              </div>
              <div className="flex justify-between py-2">
                <span>Format Data:</span>
                <span className="font-medium text-gray-900">GeoTIFF</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Rekomendasi
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs text-gray-700 leading-relaxed">
                  <span className="font-semibold text-blue-900">Analisis:</span>{" "}
                  Kondisi vegetasi secara keseluruhan baik dengan NDVI rata-rata
                  0.72
                </p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-xs text-gray-700 leading-relaxed">
                  <span className="font-semibold text-amber-900">
                    Perhatian:
                  </span>{" "}
                  Area sektor B3 menunjukkan penurunan indeks vegetasi
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
