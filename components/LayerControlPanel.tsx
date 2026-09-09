"use client";

import React, { useState } from "react";
import {
  Layers,
  Eye,
  EyeOff,
  Sliders,
  Plus,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  X,
  Upload,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import type { MapLayerItem } from "@/types/map";

interface LayerControlPanelProps {
  mapId?: string;
  token?: string;
  layers: MapLayerItem[];
  onToggleVisibility: (layerId: string, visible: boolean) => void;
  onChangeOpacity: (layerId: string, opacity: number) => void;
  onLayerUploaded?: () => void;
  onDeleteLayer?: (layerId: string) => void;
  onRetryConvert?: (layerId: string) => void;
}

const LAYER_TYPE_CONFIG: Record<
  string,
  { label: string; badgeClass: string; gradient: string }
> = {
  ortho: {
    label: "Citra Ortho RGB",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    gradient: "from-emerald-600 via-green-500 to-lime-500",
  },
  ndvi: {
    label: "Indeks Vegetasi (NDVI)",
    badgeClass: "bg-lime-50 text-lime-700 border-lime-200",
    gradient: "from-red-500 via-amber-400 to-green-600",
  },
  vari: {
    label: "Indeks VARI",
    badgeClass: "bg-teal-50 text-teal-700 border-teal-200",
    gradient: "from-amber-500 via-teal-400 to-emerald-600",
  },
  spectral: {
    label: "Multispektral",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
    gradient: "from-blue-600 via-cyan-400 to-teal-400",
  },
  nitrogen: {
    label: "Hara Nitrogen (N)",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    gradient: "from-indigo-900 via-teal-600 to-amber-300",
  },
  phosphorus: {
    label: "Hara Fosfor (P)",
    badgeClass: "bg-orange-50 text-orange-700 border-orange-200",
    gradient: "from-purple-900 via-pink-600 to-orange-400",
  },
  kalium: {
    label: "Hara Kalium (K)",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    gradient: "from-black via-rose-700 to-yellow-300",
  },
  dsm: {
    label: "Elevasi Permukaan (DSM)",
    badgeClass: "bg-stone-50 text-stone-700 border-stone-200",
    gradient: "from-stone-800 via-stone-400 to-stone-100",
  },
};

export default function LayerControlPanel({
  mapId,
  token,
  layers,
  onToggleVisibility,
  onChangeOpacity,
  onLayerUploaded,
  onDeleteLayer,
  onRetryConvert,
}: LayerControlPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload Form State
  const [uploadName, setUploadName] = useState("");
  const [uploadType, setUploadType] = useState("ndvi");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadOpacity, setUploadOpacity] = useState(0.85);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (!mapId || layers.length === 0) {
    return null;
  }

  const activeCount = layers.filter((l) => l.is_visible).length;

  const handleToggleAll = (visible: boolean) => {
    layers.forEach((l) => onToggleVisibility(l.id, visible));
  };

  const handleShowOnlyBase = () => {
    layers.forEach((l) => {
      onToggleVisibility(l.id, l.is_base_layer);
    });
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapId || !uploadFile) return;

    setIsUploading(true);
    setUploadError(null);

    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

    const formData = new FormData();
    formData.append("name", uploadName || `${uploadType.toUpperCase()} Layer`);
    formData.append("layer_type", uploadType);
    formData.append("default_opacity", uploadOpacity.toString());
    formData.append("file", uploadFile);

    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(`${baseUrl}/maps/${mapId}/layers`, {
        method: "POST",
        headers,
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(
          errData?.detail?.message ||
            errData?.detail ||
            "Gagal mengunggah file layer."
        );
      }

      // Reset form & trigger refresh
      setShowUploadModal(false);
      setUploadName("");
      setUploadFile(null);
      if (onLayerUploaded) {
        onLayerUploaded();
      }
    } catch (err: any) {
      setUploadError(err.message || "Terjadi kesalahan upload.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      {/* TRIGGER BUTTON (Top Left or Right) */}
      <div className="absolute left-3 top-3 z-[1000]">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-xs font-bold shadow-xl backdrop-blur-xl transition ${
            isOpen
              ? "border-[#123c28] bg-[#123c28] text-white shadow-emerald-950/20"
              : "border-gray-200/80 bg-white/95 text-gray-800 hover:bg-gray-50"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Tumpukan Layer</span>
          <span
            className={`flex h-5 items-center justify-center rounded-full px-1.5 text-[10px] font-black ${
              isOpen
                ? "bg-white/20 text-white"
                : "bg-emerald-100 text-emerald-800"
            }`}
          >
            {activeCount}/{layers.length}
          </span>
        </button>

        {/* FLOATING LAYER DRAWER */}
        {isOpen && (
          <div className="mt-2 w-84 max-w-[calc(100vw-24px)] rounded-2xl border border-gray-200/90 bg-white/95 p-3.5 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
            {/* PANEL HEADER */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
              <div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                  <h4 className="text-xs font-bold text-gray-900">
                    Layer Analisis Lahan
                  </h4>
                </div>
                <p className="mt-0.5 text-[10px] text-gray-500">
                  Tumpuk & atur opasitas peta spektral
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* QUICK ACTIONS */}
            <div className="mt-2.5 flex items-center justify-between gap-1.5 rounded-xl bg-gray-50 p-1.5 text-[10px] font-semibold text-gray-600">
              <button
                type="button"
                onClick={() => handleToggleAll(true)}
                className="flex-1 rounded-md py-1 text-center hover:bg-white hover:text-gray-900 transition"
              >
                Semua Aktif
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={handleShowOnlyBase}
                className="flex-1 rounded-md py-1 text-center hover:bg-white hover:text-gray-900 transition"
              >
                Hanya Ortho
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={() => handleToggleAll(false)}
                className="flex-1 rounded-md py-1 text-center hover:bg-white hover:text-gray-900 transition"
              >
                Sembunyikan
              </button>
            </div>

            {/* LAYER LIST */}
            <div className="mt-3 max-h-72 space-y-2.5 overflow-y-auto pr-0.5">
              {layers.map((layer, idx) => {
                const cfg =
                  LAYER_TYPE_CONFIG[layer.layer_type.toLowerCase()] || {
                    label: layer.name,
                    badgeClass: "bg-slate-50 text-slate-700 border-slate-200",
                    gradient: "from-slate-600 to-slate-400",
                  };

                const isPmtiles = Boolean(layer.pmtiles_url);
                const isProcessing = layer.conversion_status === "processing";

                return (
                  <div
                    key={layer.id}
                    className={`rounded-xl border p-2.5 transition ${
                      layer.is_visible
                        ? "border-gray-200 bg-white shadow-sm"
                        : "border-dashed border-gray-200 bg-gray-50/60 opacity-60"
                    }`}
                  >
                    {/* LAYER ROW 1: HEADER & TOGGLE */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          type="button"
                          onClick={() =>
                            onToggleVisibility(layer.id, !layer.is_visible)
                          }
                          title={
                            layer.is_visible ? "Sembunyikan" : "Tampilkan"
                          }
                          className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border transition ${
                            layer.is_visible
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-gray-200 bg-gray-100 text-gray-400"
                          }`}
                        >
                          {layer.is_visible ? (
                            <Eye className="h-3.5 w-3.5" />
                          ) : (
                            <EyeOff className="h-3.5 w-3.5" />
                          )}
                        </button>

                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-gray-900 leading-tight">
                            {layer.name}
                          </p>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <span
                              className={`rounded border px-1.5 py-0.2 text-[9px] font-bold ${cfg.badgeClass}`}
                            >
                              {cfg.label}
                            </span>
                            {layer.is_base_layer && (
                              <span className="rounded bg-gray-100 px-1 text-[8px] font-bold text-gray-500">
                                BASE
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* BADGE PMTILES / DYNAMIC */}
                      <div className="flex items-center gap-1">
                        {isPmtiles ? (
                          <span
                            title="Streaming direct range request (PMTiles)"
                            className="flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[8px] font-black text-emerald-700 border border-emerald-200"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            PMTiles
                          </span>
                        ) : isProcessing ? (
                          <span className="flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[8px] font-bold text-amber-700 border border-amber-200">
                            <RefreshCw className="h-2.5 w-2.5 animate-spin" />
                            Bake...
                          </span>
                        ) : (
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[8px] font-bold text-gray-500">
                            XYZ
                          </span>
                        )}

                        {onDeleteLayer && !layer.is_base_layer && (
                          <button
                            type="button"
                            onClick={() => onDeleteLayer(layer.id)}
                            title="Hapus Layer"
                            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* OPACITY SLIDER (when visible) */}
                    {layer.is_visible && (
                      <div className="mt-2.5 border-t border-gray-100 pt-2">
                        <div className="flex items-center justify-between text-[10px] text-gray-500">
                          <span className="flex items-center gap-1 font-semibold">
                            <Sliders className="h-2.5 w-2.5 text-gray-400" />
                            Transparansi
                          </span>
                          <span className="font-bold text-gray-800">
                            {Math.round(layer.default_opacity * 100)}%
                          </span>
                        </div>

                        <div className="mt-1 flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={layer.default_opacity}
                            onChange={(e) =>
                              onChangeOpacity(layer.id, parseFloat(e.target.value))
                            }
                            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-[#123c28]"
                          />
                        </div>

                        {/* COLOR SCALE PREVIEW BAR (for non-ortho layers) */}
                        {!layer.is_base_layer && (
                          <div className="mt-1.5">
                            <div
                              className={`h-1.5 w-full rounded-full bg-gradient-to-r ${cfg.gradient}`}
                            />
                            {layer.min_value !== undefined &&
                              layer.max_value !== undefined && (
                                <div className="mt-0.5 flex justify-between text-[8px] text-gray-400">
                                  <span>{layer.min_value?.toFixed(2)}</span>
                                  <span>
                                    {layer.unit || "Indeks Nilai"}
                                  </span>
                                  <span>{layer.max_value?.toFixed(2)}</span>
                                </div>
                              )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ADD LAYER BUTTON */}
            <div className="mt-3 border-t border-gray-100 pt-2.5">
              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#123c28]/30 bg-emerald-50/50 py-2 text-xs font-bold text-[#123c28] hover:bg-emerald-50 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah Layer TIF (NDVI / NPK)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* UPLOAD LAYER MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                  <Upload className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Tambah Layer Peta TIF
                  </h3>
                  <p className="text-[10px] text-gray-500">
                    Unggah layer tematik baru untuk ditumpuk pada survei ini
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="mt-4 space-y-3.5">
              {uploadError && (
                <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-gray-700">
                  Tipe Layer Analisis
                </label>
                <select
                  value={uploadType}
                  onChange={(e) => {
                    setUploadType(e.target.value);
                    if (!uploadName) {
                      const opt = LAYER_TYPE_CONFIG[e.target.value];
                      if (opt) setUploadName(opt.label);
                    }
                  }}
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-900 focus:border-[#123c28] focus:outline-none"
                >
                  <option value="ndvi">Indeks Vegetasi (NDVI)</option>
                  <option value="nitrogen">Kandungan Hara Nitrogen (N)</option>
                  <option value="phosphorus">Kandungan Hara Fosfor (P)</option>
                  <option value="kalium">Kandungan Hara Kalium (K)</option>
                  <option value="spectral">Citra Multispektral</option>
                  <option value="vari">Indeks VARI</option>
                  <option value="dsm">Digital Surface Model (DSM)</option>
                  <option value="custom">Layer Lainnya</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700">
                  Nama Label Tampilan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Peta NDVI Minggu Ke-4"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-[#123c28] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700">
                  File GeoTIFF (.tif / .tiff)
                </label>
                <input
                  type="file"
                  accept=".tif,.tiff"
                  required
                  onChange={(e) =>
                    setUploadFile(e.target.files ? e.target.files[0] : null)
                  }
                  className="mt-1 w-full rounded-xl border border-dashed border-gray-300 p-2 text-xs text-gray-600 file:mr-2 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-2.5 file:py-1 file:text-xs file:font-bold file:text-[#123c28]"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-bold text-gray-700">
                  <span>Opasitas Awal</span>
                  <span>{Math.round(uploadOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={uploadOpacity}
                  onChange={(e) => setUploadOpacity(parseFloat(e.target.value))}
                  className="mt-1 w-full h-1.5 cursor-pointer appearance-none rounded-lg bg-gray-200 accent-[#123c28]"
                />
              </div>

              <div className="mt-5 flex gap-2 pt-2 border-t">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !uploadFile}
                  className="flex-1 rounded-xl bg-[#123c28] py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#0e2f20] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Mengunggah...
                    </>
                  ) : (
                    "Unggah & Tumpuk Layer"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
