"use client";

import React, { useEffect, useRef, useState } from "react";

import {
  Activity,
  Aperture,
  Atom,
  Eye,
  EyeOff,
  Flame,
  Globe,
  Grid,
  Layers,
  Map as MapIcon,
  Maximize2,
  Minimize2,
  Mountain,
  RefreshCw,
  Shield,
  Sliders,
  Sprout,
  Trash2,
  X,
} from "lucide-react";

import type { MapLayerItem } from "@/types/map";

/* =========================================================
   TYPES
========================================================= */

interface LayerControlPanelProps {
  mapId?: string;
  layers: MapLayerItem[];

  onToggleVisibility: (layerId: string, visible: boolean) => void;

  onChangeOpacity: (layerId: string, opacity: number) => void;

  onChangeColormap?: (layerId: string, colormap: string) => void;

  onLayerUploaded?: () => void;

  onDeleteLayer?: (layerId: string) => void;

  onRetryConvert?: (layerId: string) => void;

  /* Basemap */

  basemap: "satellite" | "street";

  onChangeBasemap: (basemap: "satellite" | "street") => void;

  /* 3D */

  terrainEnabled: boolean;

  onToggleTerrain: () => void;

  /* Fullscreen */

  isFullscreen?: boolean;

  onToggleFullscreen?: () => void;
}

/* =========================================================
   LAYER TYPE CONFIG
========================================================= */

interface LayerTypeMeta {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  bgSolid: string;
  bgTint: string;
  textColor: string;
  borderColor: string;
  gradient: string;
}

const LAYER_TYPE_CONFIG: Record<string, LayerTypeMeta> = {
  ortho: {
    label: "Citra Ortho RGB",
    icon: Aperture,
    bgSolid: "bg-emerald-700",
    bgTint: "bg-emerald-50/80",
    textColor: "text-emerald-900",
    borderColor: "border-emerald-700/25",
    gradient: "from-emerald-600 via-green-500 to-lime-500",
  },

  ndvi: {
    label: "Indeks Vegetasi (NDVI)",
    icon: Sprout,
    bgSolid: "bg-lime-700",
    bgTint: "bg-lime-50/80",
    textColor: "text-lime-950",
    borderColor: "border-lime-700/25",
    gradient: "from-red-500 via-amber-400 to-green-600",
  },

  vari: {
    label: "Indeks VARI",
    icon: Activity,
    bgSolid: "bg-teal-700",
    bgTint: "bg-teal-50/80",
    textColor: "text-teal-950",
    borderColor: "border-teal-700/25",
    gradient: "from-amber-500 via-teal-400 to-emerald-600",
  },

  spectral: {
    label: "Multispektral",
    icon: Layers,
    bgSolid: "bg-sky-700",
    bgTint: "bg-sky-50/80",
    textColor: "text-sky-950",
    borderColor: "border-sky-700/25",
    gradient: "from-blue-600 via-cyan-400 to-teal-400",
  },

  nitrogen: {
    label: "Hara Nitrogen (N)",
    icon: Atom,
    bgSolid: "bg-amber-600",
    bgTint: "bg-amber-50/80",
    textColor: "text-amber-950",
    borderColor: "border-amber-600/25",
    gradient: "from-indigo-900 via-teal-600 to-amber-300",
  },

  phosphorus: {
    label: "Hara Fosfor (P)",
    icon: Flame,
    bgSolid: "bg-orange-600",
    bgTint: "bg-orange-50/80",
    textColor: "text-orange-950",
    borderColor: "border-orange-600/25",
    gradient: "from-purple-900 via-pink-600 to-orange-400",
  },

  kalium: {
    label: "Hara Kalium (K)",
    icon: Shield,
    bgSolid: "bg-purple-700",
    bgTint: "bg-purple-50/80",
    textColor: "text-purple-950",
    borderColor: "border-purple-700/25",
    gradient: "from-black via-rose-700 to-yellow-300",
  },

  dsm: {
    label: "Elevasi Permukaan (DSM)",
    icon: Mountain,
    bgSolid: "bg-stone-700",
    bgTint: "bg-stone-100/80",
    textColor: "text-stone-900",
    borderColor: "border-stone-600/25",
    gradient: "from-stone-800 via-stone-400 to-stone-100",
  },
};

/* =========================================================
   COMPONENT
========================================================= */

export default function LayerControlPanel({
  mapId,
  layers,
  onToggleVisibility,
  onChangeOpacity,
  onChangeColormap,
  onDeleteLayer,
  basemap,
  onChangeBasemap,
  terrainEnabled,
  onToggleTerrain,
  isFullscreen = false,
  onToggleFullscreen,
}: LayerControlPanelProps) {
  const [activePanel, setActivePanel] = useState<
    "basemap" | "terrain" | "layers" | null
  >(null);

  const panelRef = useRef<HTMLDivElement | null>(null);

  const hasLayers = layers.length > 0;

  const activeCount = layers.filter((layer) => layer.is_visible).length;

  const isAllVisible =
    layers.length > 0 && layers.every((l) => l.is_visible);
  const isAllHidden =
    layers.length > 0 && layers.every((l) => !l.is_visible);
  const isOnlyBase =
    layers.length > 0 &&
    layers.some((l) => l.is_base_layer && l.is_visible) &&
    layers.every((l) => (l.is_base_layer ? l.is_visible : !l.is_visible));

  const activeTab: "all" | "ortho" | "none" | null = isAllVisible
    ? "all"
    : isOnlyBase
    ? "ortho"
    : isAllHidden
    ? "none"
    : null;

  /* =======================================================
     CLOSE OUTSIDE
  ======================================================= */

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setActivePanel(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  /* =======================================================
     TOGGLE PANEL
  ======================================================= */

  const handlePanelToggle = (panel: "basemap" | "terrain" | "layers") => {
    setActivePanel((current) => (current === panel ? null : panel));
  };

  /* =======================================================
     QUICK ACTIONS
  ======================================================= */

  const handleToggleAll = (visible: boolean) => {
    layers.forEach((layer) => {
      onToggleVisibility(layer.id, visible);
    });
  };

  const handleShowOnlyBase = () => {
    layers.forEach((layer) => {
      onToggleVisibility(layer.id, layer.is_base_layer);
    });
  };

  /* =======================================================
     ICON BUTTON STYLE
  ======================================================= */

  const getIconButtonClass = (active = false) => {
    return [
      "relative",
      "flex",
      "h-9",
      "w-9",
      "items-center",
      "justify-center",
      "rounded-xl",
      "border",
      "transition-all",
      "duration-150",

      active
        ? "border-[#123c28] bg-[#123c28] text-white shadow-sm"
        : "border-gray-200 bg-white text-gray-700 shadow-sm hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900",

      "active:scale-95",
    ].join(" ");
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div ref={panelRef} className="absolute right-3 top-3 z-[1000]">
      {/* ===================================================
          TOOLBAR
      ==================================================== */}

      <div className="flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-white p-1.5 shadow-lg">
        {/* =================================================
            FULLSCREEN
        ================================================== */}

        {onToggleFullscreen && (
          <button
            type="button"
            onClick={onToggleFullscreen}
            title={isFullscreen ? "Keluar layar penuh" : "Layar penuh"}
            aria-label={isFullscreen ? "Keluar layar penuh" : "Layar penuh"}
            className={getIconButtonClass()}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
        )}

        {/* =================================================
            BASEMAP
        ================================================== */}

        <button
          type="button"
          onClick={() => handlePanelToggle("basemap")}
          title="Basemap"
          aria-label="Basemap"
          className={getIconButtonClass(activePanel === "basemap")}
        >
          <Globe className="h-4 w-4" />
        </button>

        {/* =================================================
            TERRAIN
        ================================================== */}

        <button
          type="button"
          onClick={() => handlePanelToggle("terrain")}
          title="Mode 3D"
          aria-label="Mode 3D"
          className={getIconButtonClass(activePanel === "terrain")}
        >
          <Mountain className="h-4 w-4" />

          {terrainEnabled && (
            <span className="absolute right-[-1px] top-[-1px] h-2 w-2 rounded-full border border-white bg-emerald-500" />
          )}
        </button>

        {/* =================================================
            LAYERS
        ================================================== */}

        <button
          type="button"
          onClick={() => handlePanelToggle("layers")}
          title="Layer Analisis"
          aria-label="Layer Analisis"
          className={getIconButtonClass(activePanel === "layers")}
        >
          <Layers className="h-4 w-4" />

          {hasLayers && (
            <span className="absolute right-[-2px] top-[-2px] flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[7px] font-black text-white">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* ===================================================
          BASEMAP POPUP
      ==================================================== */}

      {activePanel === "basemap" && (
        <div className="absolute right-0 top-12 w-52 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
          {/* HEADER */}

          <div className="border-b border-gray-100 px-3.5 py-3">
            <p className="text-[11px] font-bold text-gray-900">Basemap</p>

            <p className="mt-0.5 text-[9px] text-gray-500">
              Pilih tampilan dasar peta
            </p>
          </div>

          {/* OPTIONS */}

          <div className="space-y-1 p-3">
            <button
              type="button"
              onClick={() => onChangeBasemap("satellite")}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left transition ${basemap === "satellite"
                  ? "bg-[#123c28] text-white"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
            >
              <Globe className="h-3.5 w-3.5" />

              <span className="text-[10px] font-semibold">Satelit</span>

              {basemap === "satellite" && (
                <span className="ml-auto text-[8px] font-bold">Aktif</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onChangeBasemap("street")}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left transition ${basemap === "street"
                  ? "bg-[#123c28] text-white"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
            >
              <MapIcon className="h-3.5 w-3.5" />

              <span className="text-[10px] font-semibold">Jalan</span>

              {basemap === "street" && (
                <span className="ml-auto text-[8px] font-bold">Aktif</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ===================================================
          TERRAIN POPUP
      ==================================================== */}

      {activePanel === "terrain" && (
        <div className="absolute right-0 top-12 w-52 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
          {/* HEADER */}

          <div className="border-b border-gray-100 px-3.5 py-3">
            <p className="text-[11px] font-bold text-gray-900">Mode 3D</p>

            <p className="mt-0.5 text-[9px] text-gray-500">
              Tampilkan elevasi medan
            </p>
          </div>

          {/* TOGGLE */}

          <div className="p-3">
            <button
              type="button"
              onClick={onToggleTerrain}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 transition ${terrainEnabled
                  ? "bg-[#123c28] text-white"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
            >
              <div className="flex items-center gap-2">
                <Mountain className="h-3.5 w-3.5" />

                <span className="text-[10px] font-semibold">3D Terrain</span>
              </div>

              <span
                className={`relative h-5 w-9 rounded-full transition ${terrainEnabled ? "bg-emerald-400" : "bg-gray-300"
                  }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition ${terrainEnabled ? "left-[18px]" : "left-0.5"
                    }`}
                />
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ===================================================
          LAYER POPUP
      ==================================================== */}

      {activePanel === "layers" && (
        <div className="absolute right-0 top-12 w-[min(430px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
          {/* HEADER */}

          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-emerald-600" />

                <h4 className="text-xs font-bold text-gray-900">
                  Layer Analisis Lahan
                </h4>
              </div>


            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-[9.5px] font-semibold text-gray-600 border border-gray-200/50">
                {activeCount}/{layers.length}
              </span>

              <button
                type="button"
                onClick={() => setActivePanel(null)}
                className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                title="Tutup"
                aria-label="Tutup layer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* =================================================
              NO LAYERS
          ================================================== */}

          {!mapId || !hasLayers ? (
            <div className="flex min-h-[180px] items-center justify-center p-5">
              <div className="text-center">
                <Layers className="mx-auto mb-2 h-5 w-5 text-gray-300" />

                <p className="text-[10px] font-semibold text-gray-600">
                  Belum ada layer analisis
                </p>

                <p className="mt-1 text-[9px] text-gray-400">
                  Dataset akan muncul di sini.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* =============================================
                  QUICK ACTIONS
              ============================================== */}

              <div className="border-b border-gray-100 px-4 py-3">
                <div className="flex rounded-xl bg-gray-100 p-1 border border-gray-200/50">
                  <button
                    type="button"
                    onClick={() => handleToggleAll(true)}
                    className={`flex-1 rounded-lg py-1.5 text-[10px] font-bold transition-all duration-150 outline-none ${
                      activeTab === "all"
                        ? "bg-[#123c28] text-white shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
                    }`}
                  >
                    Semua
                  </button>

                  <button
                    type="button"
                    onClick={handleShowOnlyBase}
                    className={`flex-1 rounded-lg py-1.5 text-[10px] font-bold transition-all duration-150 outline-none ${
                      activeTab === "ortho"
                        ? "bg-[#123c28] text-white shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
                    }`}
                  >
                    Ortho
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleAll(false)}
                    className={`flex-1 rounded-lg py-1.5 text-[10px] font-bold transition-all duration-150 outline-none ${
                      activeTab === "none"
                        ? "bg-[#123c28] text-white shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
                    }`}
                  >
                    Sembunyikan
                  </button>
                </div>
              </div>

              {/* =============================================
                  LAYER LIST
              ============================================== */}

              <div className="max-h-[60vh] space-y-2 overflow-y-auto p-3">
                {layers.map((layer, index) => {
                  const cfg = LAYER_TYPE_CONFIG[
                    layer.layer_type.toLowerCase()
                  ] || {
                    label: layer.name,
                    icon: Layers,
                    bgSolid: "bg-gray-600",
                    bgTint: "bg-gray-50/80",
                    textColor: "text-gray-800",
                    borderColor: "border-gray-300/40",
                    gradient: "from-gray-500 to-gray-300",
                  };

                  const isPmtiles = Boolean(layer.pmtiles_url);

                  const isProcessing = layer.conversion_status === "processing";

                  const rotation =
                    index % 3 === 0
                      ? "rotate-[0.2deg]"
                      : index % 3 === 1
                        ? "rotate-[-0.25deg]"
                        : "rotate-0";

                  return (
                    <div
                      key={layer.id}
                      className={`rounded-xl border p-2.5 transition-all duration-150 ${layer.is_visible
                          ? "border-gray-200 bg-white"
                          : "border-dashed border-gray-200 bg-gray-50 opacity-60"
                        } ${rotation} hover:rotate-0 hover:border-gray-300 hover:shadow-sm`}
                    >
                      {/* =================================
                            HEADER
                        ================================== */}

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2.5">
                          {/* MODERN GHOST EYE BUTTON */}
                          <button
                            type="button"
                            onClick={() =>
                              onToggleVisibility(layer.id, !layer.is_visible)
                            }
                            title={
                              layer.is_visible
                                ? "Sembunyikan layer"
                                : "Tampilkan layer"
                            }
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-150 active:scale-90 ${
                              layer.is_visible
                                ? "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                : "text-gray-300 hover:bg-gray-100 hover:text-gray-500"
                            }`}
                          >
                            {layer.is_visible ? (
                              <Eye className="h-4 w-4 stroke-[2.2]" />
                            ) : (
                              <EyeOff className="h-4 w-4 stroke-[1.8]" />
                            )}
                          </button>

                          {/* INFO */}
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-gray-900 leading-tight">
                              {layer.name}
                            </p>

                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              <span
                                className={`inline-flex items-center overflow-hidden rounded-full border ${cfg.borderColor} bg-white shadow-xs transition hover:shadow-sm`}
                              >
                                <span className={`flex items-center justify-center ${cfg.bgSolid} pl-2 pr-1.5 py-1 text-white`}>
                                  <cfg.icon className="h-3 w-3 stroke-[2.2]" />
                                </span>
                                <span className={`${cfg.bgTint} pl-1.5 pr-2.5 py-1 text-[9px] font-bold tracking-tight ${cfg.textColor}`}>
                                  <span className="max-w-[170px] truncate">{cfg.label}</span>
                                </span>
                              </span>

                              {layer.is_base_layer && (
                                <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[8.5px] font-bold tracking-wider text-gray-400 uppercase border border-gray-200/50">
                                  BASE
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* STATUS & CONTROLS */}
                        <div className="flex shrink-0 items-center gap-1.5">
                          {isPmtiles ? (
                            <span
                              title="Format Cloud-Native PMTiles v3 (Protomaps Tile Archive)"
                              className="inline-flex items-center overflow-hidden rounded-full border border-[#2525C5]/30 bg-white shadow-xs transition hover:border-[#2525C5]/60 hover:shadow-sm"
                            >
                              <span className="flex items-center justify-center bg-[#2525C5] pl-2 pr-1.5 py-1">
                                <img
                                  src="/pmtiles-logo.png"
                                  alt="PMTiles Logo"
                                  className="h-4 w-4 rounded-full"
                                />
                              </span>
                              <span className="bg-[#2525C5]/5 pl-1.5 pr-2.5 py-1 font-mono text-[9.5px] font-bold tracking-tight text-[#2222D4]">
                                PMTiles
                              </span>
                            </span>
                          ) : isProcessing ? (
                            <span
                              title="Sedang mengonversi GeoTIFF ke PMTiles"
                              className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-0.5 text-[9.5px] font-medium text-amber-700 border border-amber-200/60"
                            >
                              <RefreshCw className="h-2.5 w-2.5 animate-spin" />
                              Bake
                            </span>
                          ) : (
                            <span
                              title="Standar Raster XYZ Tile"
                              className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-[9px] font-medium text-gray-500 border border-gray-200/50"
                            >
                              <Grid className="h-2.5 w-2.5 text-gray-400" />
                              <span className="font-mono">XYZ</span>
                            </span>
                          )}

                          {onDeleteLayer && !layer.is_base_layer && (
                            <button
                              type="button"
                              onClick={() => onDeleteLayer(layer.id)}
                              title="Hapus layer"
                              className="rounded-lg p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-600 active:scale-95"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* =================================
                            OPACITY
                        ================================== */}

                      {layer.is_visible && (
                        <div className="mt-2.5 border-t border-gray-100 pt-2">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1 text-[8px] font-medium text-gray-500">
                              <Sliders className="h-2.5 w-2.5" />
                              Transparansi
                            </span>

                            <span className="text-[8px] font-bold text-gray-700">
                              {Math.round(layer.default_opacity * 100)}%
                            </span>
                          </div>

                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={layer.default_opacity}
                            onChange={(e) =>
                              onChangeOpacity(
                                layer.id,
                                parseFloat(e.target.value)
                              )
                            }
                            className="mt-1.5 h-1 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-[#123c28]"
                          />

                          {!layer.is_base_layer && (
                            <div className="mt-1.5">
                              <div
                                className={`h-1 w-full rounded-full bg-gradient-to-r ${cfg.gradient}`}
                              />

                              {layer.min_value !== undefined &&
                                layer.max_value !== undefined && (
                                  <div className="mt-0.5 flex justify-between text-[7px] text-gray-400">
                                    <span>{layer.min_value?.toFixed(2)}</span>

                                    <span>{layer.unit || "Indeks"}</span>

                                    <span>{layer.max_value?.toFixed(2)}</span>
                                  </div>
                                )}

                              {onChangeColormap && (
                                <div className="mt-2 flex items-center justify-between gap-1.5 pt-1 border-t border-gray-100">
                                  <span className="text-[7.5px] font-semibold text-gray-400">Palette:</span>
                                  <select
                                    value={layer.color_map || "rdylgn"}
                                    onChange={(e) => onChangeColormap(layer.id, e.target.value)}
                                    className="rounded border border-gray-200 bg-gray-50 px-1 py-0.5 text-[8px] font-medium text-gray-700 outline-none hover:border-gray-300"
                                  >
                                    <option value="rdylgn">Red-Yellow-Green (NDVI)</option>
                                    <option value="viridis">Viridis (Standard)</option>
                                    <option value="plasma">Plasma (Phosphorus)</option>
                                    <option value="inferno">Inferno (Kalium)</option>
                                    <option value="spectral">Spectral (Multispektral)</option>
                                    <option value="terrain">Terrain (Elevasi DSM)</option>
                                    <option value="turbo">Turbo (Kontras Tinggi)</option>
                                  </select>
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

              {/* FOOTER */}

              <div className="border-t border-gray-100 bg-gray-50 px-4 py-2 text-center text-[8px] text-gray-400">
                Kelola dataset melalui menu{" "}
                <span className="font-semibold text-emerald-700">
                  Upload Peta
                </span>
                .
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
