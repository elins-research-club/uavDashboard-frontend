"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import {
  Activity,
  AlertCircle,
  Aperture,
  Atom,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  Flame,
  Globe,
  Grid,
  GripVertical,
  Layers,
  Loader2,
  Map as MapIcon,
  Mountain,
  Plus,
  RefreshCw,
  Shield,
  Sliders,
  Sparkles,
  Sprout,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import type { MapLayerItem } from "@/types/map";
import { detectLayer } from "@/app/dashboard/upload/upload-config";
import { cn } from "@/lib/utils";
import {
  EASE,
  ICON_STROKE,
  eyebrowClass,
  inputClass,
} from "@/app/dashboard/upload/upload-ui";

/* =========================================================
   TYPES
========================================================= */

interface LayerControlPanelProps {
  mapId?: string;
  layers: MapLayerItem[];

  onToggleVisibility: (layerId: string, visible: boolean) => void;

  onChangeOpacity: (layerId: string, opacity: number) => void;

  onLayerUploaded?: () => void;

  onDeleteLayer?: (layerId: string) => void;

  onRetryConvert?: (layerId: string) => void;

  onReorderLayers?: (newLayers: MapLayerItem[]) => Promise<void>;

  onSetBaseLayer?: (layerId: string) => Promise<void>;

  token?: string;

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
   Warna per tipe layer adalah penanda data (identitas jenis
   analisis), jadi tetap dipertahankan. Hanya ortho yang
   disesuaikan ke warna netral tema.
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
    bgSolid: "bg-[#171717]",
    bgTint: "bg-[#171717]/5",
    textColor: "text-[#171717]",
    borderColor: "border-[#171717]/25",
    gradient: "from-[#171717] via-[#858780] to-[#DCDDD8]",
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
   SHARED UI BITS
========================================================= */

const popMotion = {
  initial: { opacity: 0, y: -6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.2, ease: EASE },
} as const;

const popupClass =
  "absolute right-0 top-12 overflow-hidden border border-[#DCDDD8] bg-white shadow-md";

function PanelHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="border-b border-[#DCDDD8] px-4 py-3">
      <p className={eyebrowClass}>{eyebrow}</p>

      <p className="mt-1 text-xs font-bold text-[#171717]">{title}</p>

      {description && (
        <p className="mt-0.5 text-[10px] font-medium text-[#858780]">
          {description}
        </p>
      )}
    </div>
  );
}

function OptionRow({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex w-full items-center gap-2 border px-3 py-2.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#171717]/20",
        active
          ? "border-[#171717] bg-[#171717] text-white"
          : "border-[#DCDDD8] bg-white text-[#33332F] hover:bg-[#FAFAF8]"
      )}
    >
      <Icon className="h-3.5 w-3.5" />

      <span className="text-[10px] font-bold">{label}</span>

      {active && <span className="ml-auto text-[10px] font-bold">Aktif</span>}
    </button>
  );
}

/* =========================================================
   COMPONENT
========================================================= */

export default function LayerControlPanel({
  mapId,
  layers,
  onToggleVisibility,
  onChangeOpacity,
  onDeleteLayer,
  onRetryConvert,
  onLayerUploaded,
  onReorderLayers,
  onSetBaseLayer,
  token,
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /* Add-layer form state */
  const [showAddForm, setShowAddForm] = useState(false);
  const [addName, setAddName] = useState("");
  const [addType, setAddType] = useState("ortho");
  const [addFile, setAddFile] = useState<File | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [detectedInfo, setDetectedInfo] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragHandleIndex, setDragHandleIndex] = useState<number | null>(null);
  const [bakingProgress, setBakingProgress] = useState<Record<string, number>>(
    {}
  );

  /* Handle file selection with automatic layer detection from /upload engine */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setAddFile(file);
    setUploadError(null);
    if (!file) {
      setDetectedInfo(null);
      return;
    }

    setDetecting(true);
    try {
      const detected = await detectLayer(file);
      setAddType(detected.layer_type);
      setAddName(detected.name);
      setDetectedInfo(
        detected.detection_reason || `Terdeteksi: ${detected.name}`
      );
    } catch {
      const cleanName = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[_-]/g, " ");
      setAddName(cleanName);
      setDetectedInfo(null);
    } finally {
      setDetecting(false);
    }
  };

  /* Baking progress simulation for pending/processing layers */
  useEffect(() => {
    const bakingLayers = layers.filter(
      (l) =>
        l.conversion_status === "pending" ||
        l.conversion_status === "processing"
    );
    if (bakingLayers.length === 0) return;

    const interval = setInterval(() => {
      setBakingProgress((prev) => {
        const next = { ...prev };
        bakingLayers.forEach((layer) => {
          const current =
            next[layer.id] ??
            (layer.conversion_status === "processing" ? 30 : 15);
          if (current < 92) {
            const increment = Math.max(1, Math.floor((95 - current) / 6));
            next[layer.id] = Math.min(92, current + increment);
          }
        });
        return next;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [layers]);

  const LAYER_TYPES = [
    { value: "ortho", label: "Ortofoto (Ortho RGB)" },
    { value: "ndvi", label: "Indeks Vegetasi (NDVI)" },
    { value: "vari", label: "Indeks Vegetasi Visible (VARI)" },
    { value: "spectral", label: "Saluran Spektral Multi-band" },
    { value: "nitrogen", label: "Kandungan Nitrogen (N)" },
    { value: "phosphorus", label: "Kandungan Fosfor (P)" },
    { value: "kalium", label: "Kandungan Kalium (K)" },
    { value: "dsm", label: "Model Elevasi (DSM)" },
    { value: "custom", label: "Layer Tematik Kustom" },
  ];

  const handleUploadLayer = async () => {
    if (!mapId || !addFile || !addName.trim()) return;
    setUploading(true);
    setUploadError(null);
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";
      const fd = new FormData();
      fd.append("name", addName.trim());
      fd.append("layer_type", addType);
      fd.append("file", addFile);

      // Sinkronisasi parameter colormap & range nilai identik dengan engine /upload
      if (addType === "ndvi" || addType === "vari") {
        fd.append("color_map", "rdylgn");
        fd.append("min_value", "-1.0");
        fd.append("max_value", "1.0");
        fd.append("unit", "Indeks (-1 s/d 1)");
      } else if (addType === "nitrogen") {
        fd.append("color_map", "viridis");
        fd.append("min_value", "0.0");
        fd.append("max_value", "100.0");
        fd.append("unit", "ppm");
      } else if (addType === "phosphorus") {
        fd.append("color_map", "plasma");
        fd.append("min_value", "0.0");
        fd.append("max_value", "100.0");
        fd.append("unit", "ppm");
      } else if (addType === "kalium") {
        fd.append("color_map", "inferno");
        fd.append("min_value", "0.0");
        fd.append("max_value", "200.0");
        fd.append("unit", "ppm");
      } else if (addType === "dsm") {
        fd.append("color_map", "terrain");
        fd.append("unit", "meter");
      }

      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${baseUrl}/maps/${mapId}/layers`, {
        method: "POST",
        headers,
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { detail?: string }).detail || `Upload gagal (${res.status})`
        );
      }
      setShowAddForm(false);
      setAddName("");
      setAddType("ortho");
      setAddFile(null);
      setDetectedInfo(null);
      onLayerUploaded?.();
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload gagal");
    } finally {
      setUploading(false);
    }
  };

  const hasLayers = layers.length > 0;

  const activeCount = layers.filter((layer) => layer.is_visible).length;

  const isAllVisible = layers.length > 0 && layers.every((l) => l.is_visible);
  const isAllHidden = layers.length > 0 && layers.every((l) => !l.is_visible);

  /* Baca jenis layer apa saja yang tersedia pada peta saat ini secara dinamis */
  const availableTypes = useMemo(() => {
    const seen = new Set<string>();
    const result: { key: string; label: string }[] = [];

    // Jika ada layer dengan is_base_layer, sediakan opsi cepat 'Base'
    const hasBase = layers.some((l) => l.is_base_layer);
    if (hasBase) {
      result.push({ key: "__base__", label: "Base" });
      seen.add("__base__");
    }

    layers.forEach((layer) => {
      const typeKey = layer.layer_type.toLowerCase();
      if (!seen.has(typeKey)) {
        seen.add(typeKey);
        const cfg = LAYER_TYPE_CONFIG[typeKey];
        const shortLabel =
          typeKey === "ortho"
            ? "Ortho"
            : typeKey === "ndvi"
            ? "NDVI"
            : typeKey === "vari"
            ? "VARI"
            : typeKey === "dsm"
            ? "DSM"
            : typeKey === "spectral"
            ? "Spektral"
            : cfg?.label?.replace(/\s*\([^)]*\)/, "").trim() ||
              typeKey.toUpperCase();
        result.push({ key: typeKey, label: shortLabel });
      }
    });

    return result;
  }, [layers]);

  /* Deteksi tab mana yang saat ini sedang aktif */
  const activeTypeKey = useMemo(() => {
    if (isAllVisible) return "all";
    if (isAllHidden) return "none";

    const isOnlyBaseActive =
      layers.some((l) => l.is_base_layer && l.is_visible) &&
      layers.every((l) => (l.is_base_layer ? l.is_visible : !l.is_visible));
    if (isOnlyBaseActive) return "__base__";

    for (const { key } of availableTypes) {
      if (key === "__base__") continue;
      const isTypeActive =
        layers.some(
          (l) => l.layer_type.toLowerCase() === key && l.is_visible
        ) &&
        layers.every((l) =>
          l.layer_type.toLowerCase() === key ? l.is_visible : !l.is_visible
        );
      if (isTypeActive) return key;
    }

    return null;
  }, [isAllVisible, isAllHidden, availableTypes, layers]);

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
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setTypeDropdownOpen(false);
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

  const handleShowOnlyType = (key: string) => {
    if (key === "__base__") {
      layers.forEach((layer) => {
        onToggleVisibility(layer.id, layer.is_base_layer);
      });
      return;
    }
    layers.forEach((layer) => {
      const match = layer.layer_type.toLowerCase() === key.toLowerCase();
      onToggleVisibility(layer.id, match);
    });
  };

  /* =======================================================
     ICON BUTTON STYLE
  ======================================================= */

  const getIconButtonClass = (active = false) =>
    cn(
      "relative flex h-9 w-9 items-center justify-center border outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#171717]/20",
      active
        ? "border-[#171717] bg-[#171717] text-white"
        : "border-transparent text-[#33332F] hover:bg-[#F4F5F2] hover:text-[#171717]"
    );

  const closeAddForm = () => {
    setShowAddForm(false);
    setUploadError(null);
    setAddFile(null);
    setAddName("");
    setDetectedInfo(null);
    setTypeDropdownOpen(false);
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div ref={panelRef} className="absolute right-3 top-3 z-[1000]">
      {/* ===================================================
          TOOLBAR
      ==================================================== */}

      <div className="flex items-center gap-0.5 border border-[#DCDDD8] bg-white/95 p-1 backdrop-blur-md">
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={() => handlePanelToggle("basemap")}
          title="Basemap"
          aria-label="Basemap"
          aria-expanded={activePanel === "basemap"}
          className={getIconButtonClass(activePanel === "basemap")}
        >
          <Globe className="h-4 w-4" strokeWidth={ICON_STROKE} />
        </motion.button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={() => handlePanelToggle("terrain")}
          title="Mode 3D"
          aria-label="Mode 3D"
          aria-expanded={activePanel === "terrain"}
          className={getIconButtonClass(activePanel === "terrain")}
        >
          <Mountain className="h-4 w-4" strokeWidth={ICON_STROKE} />

          {terrainEnabled && (
            <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 bg-[#76B900]" />
          )}
        </motion.button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={() => handlePanelToggle("layers")}
          title="Layer Analisis"
          aria-label="Layer Analisis"
          aria-expanded={activePanel === "layers"}
          className={getIconButtonClass(activePanel === "layers")}
        >
          <Layers className="h-4 w-4" strokeWidth={ICON_STROKE} />

          {hasLayers && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center bg-[#76B900] px-1 text-[9px] font-bold tabular-nums text-[#171717]">
              {activeCount}
            </span>
          )}
        </motion.button>
      </div>

      <AnimatePresence>
        {/* ===================================================
            BASEMAP POPUP
        ==================================================== */}

        {activePanel === "basemap" && (
          <motion.div
            key="basemap"
            {...popMotion}
            className={cn(popupClass, "w-56")}
          >
            <PanelHeader
              eyebrow="Basemap"
              title="Tampilan dasar peta"
              description="Pilih tampilan dasar peta"
            />

            <div className="space-y-1.5 p-3">
              <OptionRow
                active={basemap === "satellite"}
                onClick={() => onChangeBasemap("satellite")}
                icon={Globe}
                label="Satelit"
              />

              <OptionRow
                active={basemap === "street"}
                onClick={() => onChangeBasemap("street")}
                icon={MapIcon}
                label="Jalan"
              />
            </div>
          </motion.div>
        )}

        {/* ===================================================
            TERRAIN POPUP
        ==================================================== */}

        {activePanel === "terrain" && (
          <motion.div
            key="terrain"
            {...popMotion}
            className={cn(popupClass, "w-56")}
          >
            <PanelHeader
              eyebrow="Terrain"
              title="Mode 3D"
              description="Tampilkan elevasi medan"
            />

            <div className="p-3">
              <button
                type="button"
                onClick={onToggleTerrain}
                role="switch"
                aria-checked={terrainEnabled}
                className={cn(
                  "flex w-full items-center justify-between border px-3 py-2.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#171717]/20",
                  terrainEnabled
                    ? "border-[#171717] bg-[#171717] text-white"
                    : "border-[#DCDDD8] bg-white text-[#33332F] hover:bg-[#FAFAF8]"
                )}
              >
                <span className="flex items-center gap-2">
                  <Mountain className="h-3.5 w-3.5" />

                  <span className="text-[10px] font-bold">3D Terrain</span>
                </span>

                <span
                  className={cn(
                    "relative h-5 w-9 border transition-colors",
                    terrainEnabled
                      ? "border-[#76B900] bg-[#76B900]"
                      : "border-[#DCDDD8] bg-[#DCDDD8]"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-3.5 w-3.5 bg-white transition-all",
                      terrainEnabled ? "left-[19px]" : "left-0.5"
                    )}
                  />
                </span>
              </button>
            </div>
          </motion.div>
        )}

        {/* ===================================================
            LAYER POPUP
        ==================================================== */}

        {activePanel === "layers" && (
          <motion.div
            key="layers"
            {...popMotion}
            className={cn(popupClass, "w-[min(430px,calc(100vw-24px))]")}
          >
            {/* HEADER */}

            <div className="flex items-center justify-between gap-3 border-b border-[#DCDDD8] px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-[#DCDDD8] bg-[#F4F5F2]">
                  <Layers
                    className="h-3.5 w-3.5 text-[#33332F]"
                    strokeWidth={ICON_STROKE}
                  />
                </span>

                <div className="min-w-0">
                  <p className={eyebrowClass}>Layers</p>

                  <h4 className="mt-0.5 truncate text-xs font-bold text-[#171717]">
                    Layer Analisis Lahan
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="border border-[#DCDDD8] bg-[#F4F5F2] px-2 py-1 text-[10px] font-bold tabular-nums text-[#33332F]">
                  {activeCount}/{layers.length}
                </span>

                {mapId && (
                  <motion.button
                    type="button"
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setShowAddForm((v) => !v);
                      setUploadError(null);
                    }}
                    title="Tambah layer ke peta ini"
                    aria-label="Tambah layer"
                    aria-expanded={showAddForm}
                    className={cn(
                      "flex items-center gap-1 border px-2.5 py-1 text-[10px] font-bold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#171717]/20",
                      showAddForm
                        ? "border-[#DCDDD8] bg-[#F4F5F2] text-[#171717]"
                        : "border-[#171717] bg-[#171717] text-white hover:bg-[#33332F]"
                    )}
                  >
                    <Plus className="h-3 w-3" strokeWidth={2.5} />
                    Tambah
                  </motion.button>
                )}

                <button
                  type="button"
                  onClick={() => setActivePanel(null)}
                  className="flex h-7 w-7 items-center justify-center border border-transparent text-[#858780] outline-none transition-colors hover:border-[#DCDDD8] hover:bg-[#F4F5F2] hover:text-[#171717] focus-visible:ring-2 focus-visible:ring-[#171717]/20"
                  title="Tutup"
                  aria-label="Tutup layer"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                </button>
              </div>
            </div>

            {/* =================================================
                ADD LAYER FORM
            ================================================== */}

            <AnimatePresence initial={false}>
              {showAddForm && mapId && (
                <motion.div
                  key="add-form"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.22, ease: EASE }}
                  className="space-y-3 border-b border-[#DCDDD8] bg-[#FAFAF8] p-4"
                >
                  {/* hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".tif,.tiff"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {/* File picker */}
                  <div>
                    <p className={cn(eyebrowClass, "mb-1.5")}>
                      Pilih file GeoTIFF
                    </p>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex w-full items-center justify-between gap-2 border border-dashed border-[#DCDDD8] bg-white px-3 py-2.5 text-[10px] outline-none transition-colors hover:border-[#CFCFC8] hover:bg-[#FAFAF8] focus-visible:ring-2 focus-visible:ring-[#171717]/20"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <Upload
                          className="h-3.5 w-3.5 shrink-0 text-[#858780]"
                          strokeWidth={ICON_STROKE}
                        />

                        {addFile ? (
                          <span className="truncate font-bold text-[#171717]">
                            {addFile.name}
                          </span>
                        ) : (
                          <span className="font-medium text-[#858780]">
                            Pilih file .tif / .tiff…
                          </span>
                        )}
                      </span>

                      {detecting && (
                        <span className="flex shrink-0 items-center gap-1 text-[10px] font-bold text-[#33332F]">
                          <Loader2 className="h-3 w-3 animate-spin" />{" "}
                          Deteksi...
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Auto detection info */}
                  {detectedInfo && (
                    <div className="flex items-center gap-1.5 border border-[#DCDDD8] bg-white px-2.5 py-2 text-[10px] font-bold text-[#33332F]">
                      <Sparkles
                        className="h-3 w-3 shrink-0 text-[#171717]"
                        strokeWidth={ICON_STROKE}
                      />

                      <span className="truncate">{detectedInfo}</span>
                    </div>
                  )}

                  {/* Name */}
                  <div>
                    <p className={cn(eyebrowClass, "mb-1.5")}>Nama layer</p>

                    <input
                      type="text"
                      value={addName}
                      onChange={(e) => setAddName(e.target.value)}
                      placeholder="mis. Indeks Vegetasi (NDVI)"
                      className={cn(inputClass, "h-9 py-0 text-[11px]")}
                    />
                  </div>

                  {/* Type - custom dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <p className={cn(eyebrowClass, "mb-1.5")}>Tipe layer</p>

                    <button
                      type="button"
                      onClick={() => setTypeDropdownOpen((prev) => !prev)}
                      aria-haspopup="listbox"
                      aria-expanded={typeDropdownOpen}
                      className="flex h-9 w-full items-center justify-between gap-2 border border-[#DCDDD8] bg-white px-3 text-[11px] font-bold text-[#171717] outline-none transition-colors hover:border-[#CFCFC8] focus:border-[#171717] focus:ring-2 focus:ring-[#171717]/10"
                    >
                      <span className="truncate">
                        {LAYER_TYPES.find((t) => t.value === addType)?.label ||
                          addType}
                      </span>

                      <motion.span
                        animate={{ rotate: typeDropdownOpen ? 180 : 0 }}
                        transition={{ duration: 0.22, ease: EASE }}
                        className="flex shrink-0"
                      >
                        <ChevronDown
                          className="h-3.5 w-3.5 text-[#6B6B66]"
                          strokeWidth={ICON_STROKE}
                        />
                      </motion.span>
                    </button>

                    <AnimatePresence>
                      {typeDropdownOpen && (
                        <motion.div
                          {...popMotion}
                          role="listbox"
                          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[160px] overflow-y-auto border border-[#DCDDD8] bg-white p-1 shadow-md"
                        >
                          {LAYER_TYPES.map((t) => {
                            const isSelected = t.value === addType;

                            return (
                              <button
                                key={t.value}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => {
                                  setAddType(t.value);
                                  setTypeDropdownOpen(false);
                                  if (
                                    !addName.trim() ||
                                    LAYER_TYPES.some((x) => x.label === addName)
                                  ) {
                                    setAddName(t.label);
                                  }
                                }}
                                className={cn(
                                  "flex h-8 w-full items-center justify-between px-2.5 text-left text-[11px] transition-colors",
                                  isSelected
                                    ? "bg-[#F4F5F2] font-bold text-[#171717]"
                                    : "font-medium text-[#6B6B66] hover:bg-[#FAFAF8] hover:text-[#171717]"
                                )}
                              >
                                <span className="truncate">{t.label}</span>

                                {isSelected && (
                                  <Check
                                    className="h-3 w-3 shrink-0 text-[#171717]"
                                    strokeWidth={2.5}
                                  />
                                )}
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Error */}
                  {uploadError && (
                    <p
                      role="alert"
                      className="flex items-center gap-1.5 text-[10px] font-bold text-red-600"
                    >
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {uploadError}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-0.5">
                    <motion.button
                      type="button"
                      whileHover={
                        uploading || detecting || !addFile || !addName.trim()
                          ? undefined
                          : { y: -1 }
                      }
                      whileTap={{ scale: 0.98 }}
                      onClick={handleUploadLayer}
                      disabled={
                        uploading || detecting || !addFile || !addName.trim()
                      }
                      className="flex flex-1 items-center justify-center gap-1.5 bg-[#171717] px-3 py-2 text-[10px] font-bold text-white outline-none transition-colors hover:bg-[#33332F] focus-visible:ring-2 focus-visible:ring-[#171717]/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#171717]"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />{" "}
                          Mengunggah…
                        </>
                      ) : (
                        <>
                          <Upload className="h-3 w-3" /> Upload & Baking Layer
                        </>
                      )}
                    </motion.button>

                    <button
                      type="button"
                      onClick={closeAddForm}
                      className="border border-[#DCDDD8] bg-white px-3 py-2 text-[10px] font-bold text-[#33332F] outline-none transition-colors hover:bg-[#FAFAF8] focus-visible:ring-2 focus-visible:ring-[#171717]/20"
                    >
                      Batal
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* =================================================
                NO LAYERS
            ================================================== */}

            {!hasLayers ? (
              <div className="flex min-h-[140px] items-center justify-center p-5">
                <div className="text-center">
                  <span className="mx-auto flex h-10 w-10 items-center justify-center border border-[#DCDDD8] bg-[#F4F5F2]">
                    <Layers
                      className="h-4 w-4 text-[#33332F]"
                      strokeWidth={ICON_STROKE}
                    />
                  </span>

                  <p className="mt-3 text-xs font-bold text-[#171717]">
                    Belum ada layer analisis
                  </p>

                  <p className="mt-1 text-[10px] font-medium text-[#858780]">
                    Dataset akan muncul di sini.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* =============================================
                    QUICK ACTIONS
                ============================================== */}

                <div className="border-b border-[#DCDDD8] px-4 py-3">
                  <div className="flex flex-wrap items-center gap-1 border border-[#DCDDD8] bg-[#F4F5F2] p-1">
                    {[
                      {
                        key: "all",
                        label: "Semua",
                        onClick: () => handleToggleAll(true),
                      },
                      ...availableTypes.map(({ key, label }) => ({
                        key,
                        label,
                        onClick: () => handleShowOnlyType(key),
                      })),
                      {
                        key: "none",
                        label: "Sembunyikan",
                        onClick: () => handleToggleAll(false),
                      },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={tab.onClick}
                        aria-pressed={activeTypeKey === tab.key}
                        className={cn(
                          "min-w-[50px] flex-1 px-2 py-1.5 text-center text-[10px] font-bold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#171717]/20",
                          activeTypeKey === tab.key
                            ? "bg-[#171717] text-white"
                            : "text-[#6B6B66] hover:bg-white hover:text-[#171717]"
                        )}
                      >
                        {tab.label}
                      </button>
                    ))}
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
                      bgSolid: "bg-[#6B6B66]",
                      bgTint: "bg-[#F4F5F2]",
                      textColor: "text-[#33332F]",
                      borderColor: "border-[#DCDDD8]",
                      gradient: "from-[#858780] to-[#DCDDD8]",
                    };

                    const isBaking =
                      layer.conversion_status === "pending" ||
                      layer.conversion_status === "processing";
                    const isFailed = layer.conversion_status === "failed";
                    const isPmtiles = Boolean(layer.pmtiles_url) && !isBaking;
                    const progressPct =
                      bakingProgress[layer.id] ??
                      (layer.conversion_status === "processing" ? 35 : 15);

                    return (
                      <div
                        key={layer.id}
                        draggable={
                          !isBaking &&
                          Boolean(onReorderLayers && layers.length > 1) &&
                          (dragHandleIndex === index || draggedIndex === index)
                        }
                        onDragStart={(e) => {
                          const target = e.target as HTMLElement;
                          if (
                            target.closest(
                              "input, button, select, [data-no-drag]"
                            )
                          ) {
                            e.preventDefault();
                            return;
                          }
                          setDraggedIndex(index);
                          e.dataTransfer.effectAllowed = "move";
                          e.dataTransfer.setData("text/plain", `${index}`);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                          if (dragOverIndex !== index) {
                            setDragOverIndex(index);
                          }
                        }}
                        onDragLeave={() => {
                          if (dragOverIndex === index) {
                            setDragOverIndex(null);
                          }
                        }}
                        onDrop={async (e) => {
                          e.preventDefault();
                          setDragOverIndex(null);
                          setDragHandleIndex(null);
                          if (draggedIndex === null || draggedIndex === index) {
                            setDraggedIndex(null);
                            return;
                          }
                          const updated = [...layers];
                          const [moved] = updated.splice(draggedIndex, 1);
                          updated.splice(index, 0, moved);
                          setDraggedIndex(null);
                          if (onReorderLayers) {
                            await onReorderLayers(updated);
                          }
                        }}
                        onDragEnd={() => {
                          setDraggedIndex(null);
                          setDragOverIndex(null);
                          setDragHandleIndex(null);
                        }}
                        className={cn(
                          "group/card relative border p-3 transition-colors duration-150",
                          draggedIndex === index
                            ? "border-dashed border-[#171717] bg-[#F4F5F2] opacity-40"
                            : dragOverIndex === index
                            ? "border-[#171717] bg-[#F4F5F2] ring-2 ring-[#171717]/15"
                            : isFailed
                            ? "border-red-300 bg-red-50/80"
                            : isBaking
                            ? "border-amber-200 bg-amber-50/50"
                            : layer.is_visible
                            ? "border-[#DCDDD8] bg-white hover:border-[#CFCFC8] hover:bg-[#FAFAF8]"
                            : "border-dashed border-[#DCDDD8] bg-[#FAFAF8] opacity-60"
                        )}
                      >
                        {/* =================================
                              HEADER
                          ================================== */}

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-1.5">
                            {/* DRAG HANDLE */}
                            {onReorderLayers &&
                              layers.length > 1 &&
                              !isBaking && (
                                <div
                                  title="Tahan dan geser (drag) untuk mengubah urutan layer"
                                  onMouseEnter={() => setDragHandleIndex(index)}
                                  onMouseLeave={() => {
                                    if (draggedIndex === null)
                                      setDragHandleIndex(null);
                                  }}
                                  onMouseDown={() => setDragHandleIndex(index)}
                                  className="flex h-7 w-4 shrink-0 cursor-grab items-center justify-center text-[#B0B1AB] transition-colors hover:text-[#33332F] active:cursor-grabbing"
                                >
                                  <GripVertical className="h-3.5 w-3.5" />
                                </div>
                              )}

                            {/* VISIBILITY */}
                            {isBaking ? (
                              <div
                                title="Layer sedang diproses (baking), belum tampil di peta"
                                className="flex h-7 w-7 shrink-0 cursor-not-allowed items-center justify-center text-amber-500/60"
                              >
                                <EyeOff
                                  className="h-4 w-4"
                                  strokeWidth={ICON_STROKE}
                                />
                              </div>
                            ) : isFailed ? (
                              <div
                                title="Baking gagal, layer tidak dapat ditampilkan"
                                className="flex h-7 w-7 shrink-0 cursor-not-allowed items-center justify-center border border-red-200 bg-red-100/60 text-red-500"
                              >
                                <AlertCircle className="h-3.5 w-3.5" />
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  onToggleVisibility(
                                    layer.id,
                                    !layer.is_visible
                                  )
                                }
                                title={
                                  layer.is_visible
                                    ? "Sembunyikan layer"
                                    : "Tampilkan layer"
                                }
                                aria-label={
                                  layer.is_visible
                                    ? "Sembunyikan layer"
                                    : "Tampilkan layer"
                                }
                                className={cn(
                                  "flex h-7 w-7 shrink-0 items-center justify-center border border-transparent outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#171717]/20",
                                  layer.is_visible
                                    ? "text-[#33332F] hover:border-[#DCDDD8] hover:bg-[#F4F5F2] hover:text-[#171717]"
                                    : "text-[#B0B1AB] hover:border-[#DCDDD8] hover:bg-[#F4F5F2] hover:text-[#6B6B66]"
                                )}
                              >
                                {layer.is_visible ? (
                                  <Eye
                                    className="h-4 w-4"
                                    strokeWidth={ICON_STROKE}
                                  />
                                ) : (
                                  <EyeOff
                                    className="h-4 w-4"
                                    strokeWidth={ICON_STROKE}
                                  />
                                )}
                              </button>
                            )}

                            {/* INFO */}
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold leading-tight text-[#171717]">
                                {layer.name}
                              </p>

                              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                <span
                                  className={`inline-flex items-center overflow-hidden border ${cfg.borderColor} bg-white`}
                                >
                                  <span
                                    className={`flex items-center justify-center ${cfg.bgSolid} px-1.5 py-1 text-white`}
                                  >
                                    <cfg.icon className="h-3 w-3" />
                                  </span>

                                  <span
                                    className={`${cfg.bgTint} px-2 py-1 text-[10px] font-bold tracking-tight ${cfg.textColor}`}
                                  >
                                    <span className="block max-w-[170px] truncate">
                                      {cfg.label}
                                    </span>
                                  </span>
                                </span>

                                {layer.is_base_layer ? (
                                  <span
                                    title="Base Layer utama (lapisan dasar aktif)"
                                    className="flex shrink-0 items-center gap-1 border border-[#171717] bg-[#171717] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                                  >
                                    <span className="h-1.5 w-1.5 bg-[#76B900]" />
                                    Base
                                  </span>
                                ) : (
                                  onSetBaseLayer &&
                                  !isBaking &&
                                  !isFailed && (
                                    <button
                                      type="button"
                                      onClick={() => onSetBaseLayer(layer.id)}
                                      title="Klik untuk mengubah layer ini menjadi Base Layer"
                                      className="shrink-0 border border-[#DCDDD8] bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#858780] outline-none transition-colors hover:border-[#171717] hover:text-[#171717] focus-visible:ring-2 focus-visible:ring-[#171717]/20"
                                    >
                                      Set Base
                                    </button>
                                  )
                                )}
                              </div>
                            </div>
                          </div>

                          {/* STATUS & CONTROLS */}
                          <div className="flex shrink-0 items-center gap-1.5">
                            {isBaking ? (
                              <span
                                title="Sedang mengonversi GeoTIFF ke format PMTiles"
                                className="inline-flex items-center gap-1.5 border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold tabular-nums text-amber-800"
                              >
                                <RefreshCw className="h-2.5 w-2.5 animate-spin text-amber-600 motion-reduce:animate-none" />
                                Bake {progressPct}%
                              </span>
                            ) : isFailed ? (
                              <span
                                title={
                                  layer.conversion_error ||
                                  "Konversi PMTiles gagal"
                                }
                                className="inline-flex items-center gap-1 border border-red-300 bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800"
                              >
                                <AlertCircle className="h-2.5 w-2.5 text-red-600" />
                                Gagal
                              </span>
                            ) : isPmtiles ? (
                              <span
                                title="Format Cloud-Native PMTiles v3 (Protomaps Tile Archive)"
                                className="inline-flex items-center overflow-hidden border border-[#2525C5]/30 bg-white transition-colors hover:border-[#2525C5]/60"
                              >
                                <span className="flex items-center justify-center bg-[#2525C5] py-1 pl-2 pr-1.5">
                                  <img
                                    src="/pmtiles-logo.png"
                                    alt="PMTiles Logo"
                                    className="h-4 w-4 rounded-full"
                                  />
                                </span>

                                <span className="bg-[#2525C5]/5 py-1 pl-1.5 pr-2.5 text-[10px] font-bold tracking-tight text-[#2222D4]">
                                  PMTiles
                                </span>
                              </span>
                            ) : (
                              <span
                                title="Standar Raster XYZ Tile"
                                className="inline-flex items-center gap-1 border border-[#DCDDD8] bg-[#F4F5F2] px-2 py-0.5 text-[10px] font-bold text-[#6B6B66]"
                              >
                                <Grid className="h-2.5 w-2.5 text-[#858780]" />
                                XYZ
                              </span>
                            )}

                            {onDeleteLayer && !layer.is_base_layer && (
                              <button
                                type="button"
                                onClick={() => onDeleteLayer(layer.id)}
                                title="Hapus layer"
                                aria-label="Hapus layer"
                                className="flex h-7 w-7 items-center justify-center border border-transparent text-[#B0B1AB] outline-none transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-[#171717]/20"
                              >
                                <Trash2
                                  className="h-3.5 w-3.5"
                                  strokeWidth={ICON_STROKE}
                                />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* =================================
                              BAKING PROGRESS
                          ================================== */}
                        {isBaking && (
                          <div
                            role="progressbar"
                            aria-label="Progres kompilasi PMTiles"
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={progressPct}
                            className="mt-2.5 h-1 w-full overflow-hidden bg-amber-100"
                          >
                            <div
                              className="h-full bg-[#171717] transition-[width] duration-300 motion-reduce:transition-none"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        )}

                        {/* =================================
                              ERROR BANNER
                          ================================== */}
                        {isFailed && (
                          <div className="mt-2.5 border border-red-200 bg-white/90 p-2 text-red-900">
                            <div className="flex items-start justify-between gap-1.5">
                              <div className="min-w-0 flex-1">
                                <p className="flex items-center gap-1 text-[10px] font-bold text-red-700">
                                  <AlertCircle className="h-3 w-3 shrink-0 text-red-600" />
                                  Baking Bermasalah
                                </p>

                                <p
                                  className="mt-0.5 line-clamp-2 text-[10px] font-medium text-red-600"
                                  title={layer.conversion_error || undefined}
                                >
                                  {layer.conversion_error ||
                                    "Gagal mengonversi file GeoTIFF ke PMTiles."}
                                </p>
                              </div>

                              {onRetryConvert && (
                                <button
                                  type="button"
                                  onClick={() => onRetryConvert(layer.id)}
                                  title="Kompilasi ulang layer"
                                  className="flex shrink-0 items-center gap-1 bg-red-600 px-2 py-1 text-[10px] font-bold text-white outline-none transition-colors hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-600/30"
                                >
                                  <RefreshCw className="h-2.5 w-2.5" /> Coba
                                  Lagi
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* =================================
                              OPACITY (aktif & tidak baking/failed)
                          ================================== */}

                        {!isBaking && !isFailed && layer.is_visible && (
                          <div
                            data-no-drag="true"
                            draggable={false}
                            onMouseDown={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                            className="mt-2.5 border-t border-[#DCDDD8] pt-2.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1 text-[10px] font-bold text-[#6B6B66]">
                                <Sliders className="h-2.5 w-2.5" />
                                Transparansi
                              </span>

                              <span className="text-[10px] font-bold tabular-nums text-[#171717]">
                                {Math.round(layer.default_opacity * 100)}%
                              </span>
                            </div>

                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.05"
                              value={layer.default_opacity}
                              aria-label={`Transparansi ${layer.name}`}
                              draggable={false}
                              onMouseDown={(e) => e.stopPropagation()}
                              onPointerDown={(e) => e.stopPropagation()}
                              onDragStart={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                              onChange={(e) =>
                                onChangeOpacity(
                                  layer.id,
                                  parseFloat(e.target.value)
                                )
                              }
                              className="mt-1.5 h-1 w-full cursor-pointer appearance-none bg-[#DCDDD8] accent-[#171717]"
                            />

                            {!layer.is_base_layer && (
                              <div className="mt-2">
                                <div
                                  className={`h-1 w-full bg-gradient-to-r ${cfg.gradient}`}
                                />

                                {layer.min_value !== undefined &&
                                  layer.max_value !== undefined && (
                                    <div className="mt-0.5 flex justify-between text-[10px] font-medium tabular-nums text-[#858780]">
                                      <span>{layer.min_value?.toFixed(2)}</span>

                                      <span>{layer.unit || "Indeks"}</span>
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

                <div className="border-t border-[#DCDDD8] bg-[#FAFAF8] px-4 py-2.5 text-center text-[10px] font-medium text-[#858780]">
                  Kelola dataset melalui menu{" "}
                  <span className="font-bold text-[#171717]">Upload Peta</span>.
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
