"use client";

import React, { useState, useMemo } from "react";
import type { MapLayerItem } from "@/types/map";

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

const LEGEND_PRESETS: Record<string, LegendConfig> = {
  ndvi: {
    title: "Indeks Vegetasi (NDVI)",
    unit: "",
    description: "Klasifikasi Kesehatan Tanaman (Rahaldi et al., 2013)",
    gradient: "linear-gradient(to right, #d73027 0%, #fc8d59 25%, #fee08b 55%, #1a9850 100%)",
    segments: [
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
    ],
  },
  vari: {
    title: "Indeks VARI",
    unit: "",
    description: "Visible Atmospherically Resistant Index",
    gradient: "linear-gradient(to right, #d73027 0%, #fc8d59 25%, #fee08b 55%, #1a9850 100%)",
    segments: [
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
    ],
  },
  nitrogen: {
    title: "Kandungan Nitrogen (N)",
    unit: "mg/kg",
    description: "Status Ketersediaan Unsur Hara N",
    gradient: "linear-gradient(to right, #fde725 0%, #21918c 50%, #440154 100%)",
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
    gradient: "linear-gradient(to right, #fca35d 0%, #b63679 50%, #420a68 100%)",
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
    gradient: "linear-gradient(to right, #fe9f6d 0%, #de4968 50%, #65156e 100%)",
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
    gradient: "linear-gradient(to right, #3182bd 0%, #6baed6 25%, #9ecae1 50%, #c6dbef 75%, #eff3ff 100%)",
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

export default function MapLegend({ layers, gridEnabled = false }: MapLegendProps) {
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
    gradient: "linear-gradient(to right, #fdd49e 0%, #74c476 50%, #006d2c 100%)",
    segments: [
      { color: "#fdd49e", label: "Rendah", valueRange: "Min", tickValue: "Min" },
      { color: "#74c476", label: "Sedang", valueRange: "Mid", tickValue: "Mid" },
      { color: "#006d2c", label: "Tinggi", valueRange: "Maks", tickValue: "Maks" },
    ],
  };

  return (
    <div
      className="pointer-events-auto flex flex-col items-end transition-all duration-300"
      role="region"
      aria-label="Legenda Peta"
    >
      <div className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white/95 p-3 shadow-xl backdrop-blur-md ring-1 ring-black/5 transition-all duration-200 hover:shadow-2xl sm:p-3.5">
        {/* HEADER BAR (Tanpa icon dan tanpa tombol minimize) */}
        <div className="flex items-center justify-between gap-3">
          <div className="truncate">
            <h4 className="truncate text-[11px] font-bold tracking-tight text-gray-800 sm:text-xs">
              {config.title}
            </h4>
            {config.unit && (
              <p className="text-[9px] font-medium text-gray-400 sm:text-[10px]">
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
              className="rounded-md border border-gray-200 bg-gray-50/80 px-1.5 py-0.5 text-[9px] font-semibold text-gray-700 shadow-2xs outline-hidden hover:bg-gray-100 sm:text-[10px]"
            >
              {visibleThematicLayers.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name || l.layer_type}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* CONTENT: SMOOTH GRADIENT BAR & VALUE TICKS */}
        <div className="mt-2.5 pt-0.5">
          {/* CONTINUOUS GRADIENT COLOR BAR */}
          <div
            className="h-3 w-full min-w-[220px] max-w-[280px] rounded-full shadow-inner border border-black/10 sm:h-3.5 sm:min-w-[260px]"
            style={{ background: config.gradient }}
          />

          {/* NUMERIC TICK VALUES (Under the bar) */}
          <div className="mt-1 flex w-full justify-between px-0.5 text-[9px] font-bold font-mono text-gray-600 sm:text-[10px]">
            {config.segments.map((seg, idx) => (
              <span key={idx} className="text-center flex-1 truncate" title={`${seg.label}: ${seg.valueRange}`}>
                {seg.tickValue}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
