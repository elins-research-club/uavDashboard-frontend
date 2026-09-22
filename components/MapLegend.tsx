"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
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

// Warna pada legenda adalah data ilmiah (skala klasifikasi), bukan dekorasi,
// sehingga nilainya tidak diubah.
const LEGEND_PRESETS: Record<string, LegendConfig> = {
  ndvi: {
    title: "Indeks Vegetasi (NDVI)",
    unit: "",
    description: "Klasifikasi Kesehatan Tanaman (Rahaldi et al., 2013)",
    gradient: VEGETATION_GRADIENT,
    segments: VEGETATION_SEGMENTS,
  },
  vari: {
    title: "Indeks VARI",
    unit: "",
    description: "Visible Atmospherically Resistant Index",
    gradient: VEGETATION_GRADIENT,
    segments: VEGETATION_SEGMENTS,
  },
  nitrogen: {
    title: "Kandungan Nitrogen (N)",
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
    title: "Kandungan Fosfor (P)",
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
    title: "Kandungan Kalium (K)",
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
    title: "Elevasi Permukaan (DSM)",
    unit: "mdpl",
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

interface MapLegendProps {
  layers: MapLayerItem[];
  gridEnabled?: boolean;
}

export default function MapLegend({
  layers,
  gridEnabled = false,
}: MapLegendProps) {
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);

  // Cari layer tematik yang aktif (terlihat dan bukan ortho visual)
  const visibleThematicLayers = useMemo(() => {
    return layers.filter(
      (l) => l.is_visible && l.layer_type?.toLowerCase() !== "ortho"
    );
  }, [layers]);

  // Tentukan layer mana yang ditampilkan di legend
  const currentLayer = useMemo(() => {
    if (visibleThematicLayers.length > 0) {
      if (activeLayerId) {
        const found = visibleThematicLayers.find((l) => l.id === activeLayerId);
        if (found) return found;
      }
      // Default: layer tematik teratas yang aktif
      return visibleThematicLayers[visibleThematicLayers.length - 1];
    }
    // Fallback: jika ada layer tematik di daftar layer (misal saat inisialisasi)
    const anyThematic = layers.filter(
      (l) => l.layer_type?.toLowerCase() !== "ortho"
    );
    if (anyThematic.length > 0) {
      return anyThematic[0];
    }
    return null;
  }, [visibleThematicLayers, layers, activeLayerId]);

  if (!currentLayer) {
    return null;
  }

  const layerTypeKey = currentLayer.layer_type?.toLowerCase() || "ndvi";
  const config = LEGEND_PRESETS[layerTypeKey] || {
    title: currentLayer.name || "Indeks Analisis Lahan",
    unit: currentLayer.unit || "Rentang Nilai",
    description: "Klasifikasi Lahan",
    gradient:
      "linear-gradient(to right, #fdd49e 0%, #74c476 50%, #006d2c 100%)",
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: EASE }}
      className="pointer-events-auto flex flex-col items-end"
      role="region"
      aria-label="Legenda Peta"
    >
      <div className="border border-[#DCDDD8] bg-white/95 p-3 backdrop-blur-md">
        {/* HEADER */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h4 className="truncate text-xs font-bold text-[#171717]">
              {config.title}
            </h4>

            {config.unit && (
              <p className="mt-0.5 text-[10px] font-medium text-[#858780]">
                {config.unit}
              </p>
            )}
          </div>

          {/* Multi-layer switcher jika ada lebih dari 1 layer tematik */}
          {visibleThematicLayers.length > 1 && (
            <select
              value={currentLayer.id}
              onChange={(e) => setActiveLayerId(e.target.value)}
              aria-label="Pilih Layer Legenda"
              className="border border-[#DCDDD8] bg-white px-1.5 py-1 text-[10px] font-bold text-[#33332F] outline-none transition-colors hover:border-[#CFCFC8] focus:border-[#171717]"
            >
              {visibleThematicLayers.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name || l.layer_type}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* GRADIENT BAR & TICKS */}
        <div className="mt-2.5">
          <div
            className="h-2.5 w-full min-w-[220px] max-w-[280px] border border-black/10 sm:min-w-[260px]"
            style={{ background: config.gradient }}
          />

          <div className="mt-1 flex w-full justify-between px-0.5 text-[10px] font-bold tabular-nums text-[#6B6B66]">
            {config.segments.map((seg, idx) => (
              <span
                key={idx}
                className="flex-1 truncate text-center"
                title={`${seg.label}: ${seg.valueRange}`}
              >
                {seg.tickValue}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
