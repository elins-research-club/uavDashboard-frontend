"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useMemo } from "react";
import { useUserRole } from "@/context/UserRoleContext";
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
  Lock,
  X,
  Crown,
} from "lucide-react";
import Link from "next/link";

// Dynamic import for Map component to prevent SSR issues with Leaflet
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

interface MapData {
  id: string;
  title: string;
  location: string;
  survey_date: string;
  map_type: string;
  description?: string;
  file_size: number;
  file_format: string;
  locked_for_free: boolean;
  purchasable: boolean;
  created_at: string;
}

export default function MapsPage() {
  const { user } = useUserRole();
  const [maps, setMaps] = useState<MapData[]>([]);
  const [selectedLayer, setSelectedLayer] = useState("");
  const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    api
      .get("/maps")
      .then(({ data }) => {
        const mapList: MapData[] = data.maps ?? [];
        setMaps(mapList);
        setSelectedLayer(mapList[0]?.id || "");
      })
      .catch((requestError: { response?: { data?: { detail?: string } } }) =>
        setError(requestError.response?.data?.detail || "Gagal memuat peta.")
      )
      .finally(() => setLoading(false));
  }, []);

  const isAdmin = user?.role === "admin";

  const mapLayers = maps.map((map) => ({
    id: map.id,
    name: map.title,
    location: map.location,
    date: new Date(map.survey_date).toLocaleDateString("id-ID"),
    color: map.map_type === "NDVI" ? "bg-green-500" : "bg-blue-500",
    locked: map.locked_for_free && (!isAdmin && user?.tier === "free"),
    format: map.file_format,
    size: (map.file_size / 1024 / 1024).toFixed(2),
  }));

  const selectedMap = mapLayers.find((l) => l.id === selectedLayer);

  const mapTools = [
    { icon: <ZoomIn className="w-4 h-4" />, label: "Zoom In" },
    { icon: <ZoomOut className="w-4 h-4" />, label: "Zoom Out" },
    { icon: <Maximize2 className="w-4 h-4" />, label: "Full Screen" },
    { icon: <Share2 className="w-4 h-4" />, label: "Share" },
  ];

  const analysisTools = [
    { id: "ndvi", label: "NDVI", locked: false },
    { id: "npk", label: "NPK (Kesuburan)", locked: !isAdmin && user?.tier === "free" },
    { id: "hyper", label: "Hiperspektral", locked: !isAdmin && (user?.tier === "free" || user?.tier === "desa") },
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
                Layer Peta
              </button>
              
              <div className="h-6 w-px bg-gray-300 mx-1"></div>
              
              {/* Analysis Tools */}
              <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
                {analysisTools.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => {
                      if (tool.locked) {
                        triggerToast(`Akses Premium: Upgrade paket Anda untuk membuka ${tool.label}`);
                      } else {
                        triggerToast(`${tool.label} Layer diaktifkan`);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                      tool.locked
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-transparent"
                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 shadow-sm"
                    }`}
                  >
                    {tool.locked && <Lock className="w-3 h-3" />}
                    {tool.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (!isAdmin && user?.tier === "free") {
                    triggerToast("Fitur Export Resolusi Tinggi hanya tersedia untuk paket Desa & Kecamatan.");
                  } else {
                    triggerToast("Memproses export...");
                  }
                }}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors border ${
                  !isAdmin && user?.tier === "free"
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    : "bg-gray-900 text-white hover:bg-gray-800 border-gray-900 shadow-sm"
                }`}
              >
                {!isAdmin && user?.tier === "free" ? <Lock className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                Export
              </button>

              <div className="h-6 w-px bg-gray-300 mx-1"></div>

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
                  {loading && (
                    <div className="flex items-center gap-2 py-4 justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                      <p className="text-xs text-gray-500">Memuat peta...</p>
                    </div>
                  )}
                  {!loading && error && (
                    <p className="text-xs text-red-600 py-2">{error}</p>
                  )}
                  {!loading && !error && mapLayers.length === 0 && (
                    <div className="text-center py-6">
                      <MapIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-500">
                        Belum ada peta. Upload peta pertama Anda!
                      </p>
                    </div>
                  )}
                  {mapLayers.map((layer) => (
                    <div
                      key={layer.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedLayer === layer.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      } ${layer.locked ? "opacity-60 bg-gray-50 border-gray-200" : ""}`}
                      onClick={() => {
                        if (layer.locked) {
                          triggerToast("Peta ini terkunci untuk Member Free. Silakan Upgrade Tier Anda.");
                        } else {
                          setSelectedLayer(layer.id);
                        }
                      }}
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
                              <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex-shrink-0">
                                Pro
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{layer.date}</p>
                          <p className="text-xs text-gray-400 truncate">
                            {layer.location}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Layer Info */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-700 leading-relaxed">
                      <span className="font-semibold">Tip:</span> Klik layer
                      untuk mengaktifkan tampilan di peta
                    </p>
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
                      {selectedMap
                        ? `Layer Aktif: ${selectedMap.name}`
                        : "Pilih layer dari panel kiri"}
                    </span>
                  </div>
                  {selectedMap && (
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>.{selectedMap.format?.toUpperCase() || "UNKNOWN"}</span>
                      <span>|</span>
                      <span>{selectedMap.size} MB</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="h-[600px] w-full bg-gray-100 relative">
                {useMemo(() => (
                  <Map
                    mapId={selectedMap?.id}
                    token={typeof window !== "undefined" ? localStorage.getItem("token") || undefined : undefined}
                    mapFormat={selectedMap?.format}
                    mapTitle={selectedMap?.name}
                    mapLocation={selectedMap?.location}
                  />
                ), [selectedMap?.id, selectedMap?.format, selectedMap?.name, selectedMap?.location])}
              </div>

              {/* Map Footer */}
              <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <div className="flex items-center gap-4">
                    <span>
                      {maps.length} peta tersimpan
                    </span>
                    {selectedMap && (
                      <>
                        <span>•</span>
                        <span>Survey: {selectedMap.date}</span>
                      </>
                    )}
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 font-medium">
                    Lihat Metadata
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      {toastMessage && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="relative bg-gray-900 p-6 flex flex-col items-center text-center">
              <button
                onClick={() => setToastMessage("")}
                className="absolute top-4 right-4 p-1.5 bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="w-14 h-14 bg-gray-800 rounded-full flex items-center justify-center mb-4 border-4 border-gray-700">
                <Lock className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Akses Terkunci</h3>
              <p className="text-sm text-gray-300">Fitur Premium Khusus Pelanggan</p>
            </div>

            {/* Modal Body */}
            <div className="p-6 text-center">
              <p className="text-gray-700 font-medium mb-6">
                {toastMessage}
              </p>
              
              <div className="flex flex-col gap-3">
                <Link
                  href="/dashboard/subscription"
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-colors shadow-md hover:shadow-lg"
                >
                  <Crown className="w-4 h-4 text-amber-400" />
                  Lihat Paket Langganan
                </Link>
                <button
                  onClick={() => setToastMessage("")}
                  className="w-full py-3 text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Mungkin Nanti
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
