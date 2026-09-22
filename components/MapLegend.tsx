"use client";

import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp, Layers3 } from "lucide-react";

import type { MapLayerItem } from "@/types/map";
import { EASE } from "@/app/dashboard/upload/upload-ui";

interface LegendConfig {
  title: string;
  unit: string;
  description?: string;
  gradient: string;
  segments: Array<{
    color: string;
    label: string;
    valueRange: string;
    tickValue: string;
  }>;
}

const VEGETATION_GRADIENT =
  "linear-gradient(to right, #d73027 0%, #fc8d59 25%, #fee08b 55%, #1a9850 100%)";

const VEGETATION_SEGMENTS: LegendConfig["segments"] = [
  {
    color: "#d73027",
    label: "Non Vegetasi",
    valueRange: "< 0.11",
    tickValue: "< 0.11",
  },
  {
    color: "#fc8d59",
    label: "Rendah",
    valueRange: "0.11 - 0.22",
    tickValue: "0.22",
  },
  {
    color: "#fee08b",
    label: "Sedang",
    valueRange: "0.22 - 0.42",
    tickValue: "0.42",
  },
  {
    color: "#1a9850",
    label: "Tinggi",
    valueRange: "0.42 - 1.00",
    tickValue: "1.00",
  },
];

const LEGEND_PRESETS: Record<string, LegendConfig> = {
  ndvi: {
    title: "Indeks Vegetasi",
    unit: "NDVI",
    description: "Klasifikasi Kesehatan Tanaman (Rahaldi et al., 2013)",
    gradient: VEGETATION_GRADIENT,
    segments: VEGETATION_SEGMENTS,
  },

  vari: {
    title: "Indeks Vegetasi",
    unit: "VARI",
    description: "Visible Atmospherically Resistant Index",
    gradient: VEGETATION_GRADIENT,
    segments: VEGETATION_SEGMENTS,
  },

  nitrogen: {
    title: "Nitrogen",
    unit: "mg/kg",
    description: "Status Ketersediaan Unsur Hara N",
    gradient:
      "linear-gradient(to right, #fde725 0%, #21918c 50%, #440154 100%)",
    segments: [
      {
        color: "#fde725",
        label: "Defisit Rendah",
        valueRange: "< 35",
        tickValue: "< 35",
      },
      {
        color: "#21918c",
        label: "Optimal / Cukup",
        valueRange: "35 - 70",
        tickValue: "70",
      },
      {
        color: "#440154",
        label: "Tinggi / Berlebih",
        valueRange: "> 70",
        tickValue: "> 70",
      },
    ],
  },

  phosphorus: {
    title: "Fosfor",
    unit: "mg/kg",
    description: "Status Ketersediaan Unsur Hara P",
    gradient:
      "linear-gradient(to right, #fca35d 0%, #b63679 50%, #420a68 100%)",
    segments: [
      {
        color: "#fca35d",
        label: "Defisit Rendah",
        valueRange: "< 15",
        tickValue: "< 15",
      },
      {
        color: "#b63679",
        label: "Optimal / Cukup",
        valueRange: "15 - 30",
        tickValue: "30",
      },
      {
        color: "#420a68",
        label: "Tinggi",
        valueRange: "> 30",
        tickValue: "> 30",
      },
    ],
  },

  kalium: {
    title: "Kalium",
    unit: "mg/kg",
    description: "Status Ketersediaan Unsur Hara K",
    gradient:
      "linear-gradient(to right, #fe9f6d 0%, #de4968 50%, #65156e 100%)",
    segments: [
      {
        color: "#fe9f6d",
        label: "Defisit Rendah",
        valueRange: "< 80",
        tickValue: "< 80",
      },
      {
        color: "#de4968",
        label: "Optimal / Cukup",
        valueRange: "80 - 150",
        tickValue: "150",
      },
      {
        color: "#65156e",
        label: "Tinggi",
        valueRange: "> 150",
        tickValue: "> 150",
      },
    ],
  },

  dsm: {
    title: "Elevasi Permukaan",
    unit: "DSM · mdpl",
    description: "Model Permukaan Digital Lahan",
    gradient:
      "linear-gradient(to right, #3182bd 0%, #6baed6 25%, #9ecae1 50%, #c6dbef 75%, #eff3ff 100%)",
    segments: [
      {
        color: "#3182bd",
        label: "Rendah",
        valueRange: "Lembah / Bawah",
        tickValue: "Min",
      },
      {
        color: "#6baed6",
        label: "Sedang-Rendah",
        valueRange: "Lereng Bawah",
        tickValue: "",
      },
      {
        color: "#9ecae1",
        label: "Sedang",
        valueRange: "Rata-rata",
        tickValue: "Mid",
      },
      {
        color: "#c6dbef",
        label: "Sedang-Tinggi",
        valueRange: "Lereng Atas",
        tickValue: "",
      },
      {
        color: "#eff3ff",
        label: "Tinggi",
        valueRange: "Puncak / Atas",
        tickValue: "Maks",
      },
    ],
  },
};

const DEFAULT_LEGEND: LegendConfig = {
  title: "Analisis Lahan",
  unit: "Rentang Nilai",
  description: "Klasifikasi Lahan",
  gradient: "linear-gradient(to right, #fdd49e 0%, #74c476 50%, #006d2c 100%)",
  segments: [
    {
      color: "#fdd49e",
      label: "Rendah",
      valueRange: "Min",
      tickValue: "Min",
    },
    {
      color: "#74c476",
      label: "Sedang",
      valueRange: "Mid",
      tickValue: "Mid",
    },
    {
      color: "#006d2c",
      label: "Tinggi",
      valueRange: "Maks",
      tickValue: "Maks",
    },
  ],
};

interface MapLegendProps {
  layers: MapLayerItem[];
  gridEnabled?: boolean;
}

export default function MapLegend({
  layers,
  gridEnabled = false,
}: MapLegendProps) {
  const [open, setOpen] = useState(false);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);

  const visibleThematicLayers = useMemo(() => {
    return layers.filter(
      (layer) => layer.is_visible && layer.layer_type?.toLowerCase() !== "ortho"
    );
  }, [layers]);

  const currentLayer = useMemo(() => {
    if (visibleThematicLayers.length > 0) {
      if (activeLayerId) {
        const found = visibleThematicLayers.find(
          (layer) => String(layer.id) === String(activeLayerId)
        );

        if (found) {
          return found;
        }
      }

      return visibleThematicLayers[visibleThematicLayers.length - 1];
    }

    const anyThematic = layers.filter(
      (layer) => layer.layer_type?.toLowerCase() !== "ortho"
    );

    return anyThematic[0] || null;
  }, [visibleThematicLayers, layers, activeLayerId]);

  if (!currentLayer) {
    return null;
  }

  const layerTypeKey = currentLayer.layer_type?.toLowerCase() || "ndvi";

  const config =
    LEGEND_PRESETS[layerTypeKey] ||
    ({
      ...DEFAULT_LEGEND,
      title: currentLayer.name || DEFAULT_LEGEND.title,
      unit: currentLayer.unit || DEFAULT_LEGEND.unit,
    } satisfies LegendConfig);

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-2 z-40 flex justify-center px-2 sm:bottom-3"
      role="region"
      aria-label="Legenda Peta"
    >
      <div className="pointer-events-auto w-full max-w-[520px]">
        <AnimatePresence initial={false} mode="wait">
          {!open ? (
            <motion.button
              key="collapsed"
              type="button"
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: 10,
              }}
              transition={{
                duration: 0.18,
                ease: EASE,
              }}
              onClick={() => setOpen(true)}
              className="mx-auto flex h-10 items-center gap-2 border border-[#DCDDD8] bg-white/95 px-3 shadow-[0_10px_24px_rgba(0,0,0,0.09)] backdrop-blur-md outline-none transition-colors hover:border-[#BFC1BB] hover:bg-white focus-visible:ring-2 focus-visible:ring-[#76B900]/40"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center border border-[#E0E1DC] bg-[#F7F8F5]">
                <Layers3
                  className="h-3.5 w-3.5 text-[#555750]"
                  strokeWidth={1.8}
                />
              </span>

              <div className="min-w-0 text-left">
                <p className="truncate text-[10px] font-bold text-[#171717]">
                  {config.title}
                </p>

                <p className="truncate text-[8px] font-medium text-[#858780]">
                  {config.unit || "Legenda analisis"}
                  {gridEnabled ? " · Grid 10×10 m" : ""}
                </p>
              </div>

              <div
                className="ml-1 h-3 w-[120px] shrink-0 border border-black/10 sm:w-[180px]"
                style={{
                  background: config.gradient,
                }}
              />

              <ChevronUp
                className="h-3.5 w-3.5 shrink-0 text-[#777972]"
                strokeWidth={1.8}
              />
            </motion.button>
          ) : (
            <motion.div
              key="expanded"
              initial={{
                opacity: 0,
                y: 18,
                scale: 0.985,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: 18,
                scale: 0.985,
              }}
              transition={{
                duration: 0.2,
                ease: EASE,
              }}
              className="border border-[#DCDDD8] bg-white/95 shadow-[0_16px_36px_rgba(0,0,0,0.11)] backdrop-blur-md"
            >
              {/* HEADER */}
              <div className="flex items-center justify-between gap-3 border-b border-[#E7E8E3] px-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-[#E0E1DC] bg-[#F7F8F5]">
                    <Layers3
                      className="h-3.5 w-3.5 text-[#555750]"
                      strokeWidth={1.8}
                    />
                  </span>

                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-bold text-[#171717]">
                      {config.title}
                    </p>

                    <div className="mt-0.5 flex items-center gap-1.5">
                      {config.unit && (
                        <span className="text-[9px] font-semibold text-[#777972]">
                          {config.unit}
                        </span>
                      )}

                      {gridEnabled && (
                        <>
                          <span className="text-[8px] text-[#B0B1AB]">•</span>

                          <span className="text-[9px] font-semibold text-[#777972]">
                            Grid 10×10 m
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  {visibleThematicLayers.length > 1 && (
                    <select
                      value={String(currentLayer.id)}
                      onChange={(event) => setActiveLayerId(event.target.value)}
                      aria-label="Pilih Layer Legenda"
                      className="h-7 max-w-[145px] border border-[#DCDDD8] bg-[#FAFAF8] px-2 text-[9px] font-bold text-[#33332F] outline-none transition-colors hover:border-[#BFC1BB] focus:border-[#171717] focus:bg-white"
                    >
                      {visibleThematicLayers.map((layer) => (
                        <option key={String(layer.id)} value={String(layer.id)}>
                          {layer.name || layer.layer_type}
                        </option>
                      ))}
                    </select>
                  )}

                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    title="Sembunyikan legenda"
                    aria-label="Sembunyikan legenda"
                    className="flex h-7 w-7 items-center justify-center border border-[#DCDDD8] bg-[#FAFAF8] text-[#777972] outline-none transition-colors hover:bg-[#F2F3EF] hover:text-[#171717] focus-visible:ring-2 focus-visible:ring-[#76B900]/40"
                  >
                    <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.8} />
                  </button>
                </div>
              </div>

              {/* LEGEND BODY */}
              <div className="px-3 py-3">
                {config.description && (
                  <p className="mb-2 text-[9px] font-medium text-[#858780]">
                    {config.description}
                  </p>
                )}

                {/* GRADIENT */}
                <div
                  className="h-3 w-full border border-black/10"
                  style={{
                    background: config.gradient,
                  }}
                  aria-label={config.title}
                />

                {/* TICKS */}
                <div className="mt-1 flex w-full justify-between gap-2">
                  {config.segments.map((segment, index) => (
                    <span
                      key={`${segment.tickValue}-${index}`}
                      title={`${segment.label}: ${segment.valueRange}`}
                      className="min-w-0 flex-1 text-center text-[9px] font-bold tabular-nums text-[#666861]"
                    >
                      {segment.tickValue}
                    </span>
                  ))}
                </div>

                {/* LABELS */}
                <div className="mt-2 grid gap-1">
                  <div
                    className="grid gap-1"
                    style={{
                      gridTemplateColumns: `repeat(${config.segments.length}, minmax(0, 1fr))`,
                    }}
                  >
                    {config.segments.map((segment, index) => (
                      <div
                        key={`${segment.label}-${index}`}
                        className="min-w-0 border border-[#E7E8E3] bg-[#FAFAF8] px-1.5 py-1.5"
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className="h-2 w-2 shrink-0 border border-black/10"
                            style={{
                              backgroundColor: segment.color,
                            }}
                          />

                          <span className="truncate text-[8px] font-bold text-[#555750]">
                            {segment.label}
                          </span>
                        </div>

                        <span className="mt-0.5 block truncate text-[8px] font-medium text-[#999B94]">
                          {segment.valueRange}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
