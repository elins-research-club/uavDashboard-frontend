"use client";

import React, { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Atom,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  CloudUpload,
  Database,
  Droplets,
  Eye,
  EyeOff,
  FileImage,
  FlaskConical,
  GripVertical,
  Image as ImageIcon,
  Layers3,
  Leaf,
  LockKeyhole,
  Map as MapIcon,
  MoreHorizontal,
  Mountain,
  RefreshCcw,
  Ruler,
  Satellite,
  Shield,
  Trash2,
  Upload,
  Waves,
  X,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";
import type { MapLayerItem } from "@/types/map";

type BasemapKey = "street" | "satellite";

export type LayerControlPanelProps = {
  mapId?: string | number;
  layers: MapLayerItem[];
  token?: string | null;

  basemap?: BasemapKey;
  onChangeBasemap?: (basemap: BasemapKey) => void;

  terrainEnabled?: boolean;
  onToggleTerrain?: () => void;

  /*
   * Tetap diterima agar kompatibel dengan MapDisplay.
   * Tidak lagi ditampilkan sebagai tombol fullscreen
   * di panel ini.
   */
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;

  onToggleVisibility: (layerId: string | number, visible?: boolean) => void;

  onChangeOpacity: (layerId: string | number, opacity: number) => void;

  onLayerUploaded?: () => Promise<void> | void;

  onDeleteLayer?: (layerId: string | number) => Promise<void> | void;

  onRetryConvert?: (layerId: string | number) => Promise<void> | void;

  /*
   * PENTING:
   * Tetap menerima seluruh array layer.
   */
  onReorderLayers?: (newLayers: MapLayerItem[]) => Promise<void> | void;

  onSetBaseLayer?: (layerId: string | number) => Promise<void> | void;

  gridEnabled?: boolean;
  onGridChange?: (enabled: boolean) => void;
};

type UploadLayerType =
  | "auto"
  | "ortho"
  | "ndvi"
  | "vari"
  | "nitrogen"
  | "phosphorus"
  | "kalium"
  | "dsm"
  | "ph"
  | "moisture"
  | "corganic"
  | "spectral"
  | "custom";

type LayerAccessMeta = {
  locked_for_free?: boolean | null;
  purchase_price?: number | null;
};

type LayerExtraMeta = {
  min_value?: number | null;
  max_value?: number | null;
  unit?: string | null;
};

type LayerTypeConfig = {
  label: string;
  shortLabel: string;
  accent: string;
  soft: string;
  icon: LucideIcon;
};

const LAYER_TYPE_CONFIG: Record<string, LayerTypeConfig> = {
  ortho: {
    label: "Orthomosaic",
    shortLabel: "ORTHO",
    accent: "#64748B",
    soft: "#F1F5F9",
    icon: ImageIcon,
  },

  ndvi: {
    label: "NDVI",
    shortLabel: "NDVI",
    accent: "#65A30D",
    soft: "#F0FDF4",
    icon: Leaf,
  },

  vari: {
    label: "VARI",
    shortLabel: "VARI",
    accent: "#0D9488",
    soft: "#F0FDFA",
    icon: Activity,
  },

  spectral: {
    label: "Spektral",
    shortLabel: "SPECTRAL",
    accent: "#0284C7",
    soft: "#F0F9FF",
    icon: Atom,
  },

  nitrogen: {
    label: "Nitrogen",
    shortLabel: "N",
    accent: "#4F46E5",
    soft: "#EEF2FF",
    icon: FlaskConical,
  },

  phosphorus: {
    label: "Fosfor",
    shortLabel: "P",
    accent: "#9333EA",
    soft: "#FAF5FF",
    icon: Atom,
  },

  kalium: {
    label: "Kalium",
    shortLabel: "K",
    accent: "#D97706",
    soft: "#FFFBEB",
    icon: FlaskConical,
  },

  dsm: {
    label: "DSM / Elevasi",
    shortLabel: "DSM",
    accent: "#78716C",
    soft: "#F5F5F4",
    icon: Mountain,
  },

  ph: {
    label: "pH Tanah",
    shortLabel: "pH",
    accent: "#E11D48",
    soft: "#FFF1F2",
    icon: FlaskConical,
  },

  moisture: {
    label: "Kelembapan",
    shortLabel: "MOIST",
    accent: "#2563EB",
    soft: "#EFF6FF",
    icon: Droplets,
  },

  corganic: {
    label: "C-Organik",
    shortLabel: "C-ORG",
    accent: "#65A30D",
    soft: "#F0FDF4",
    icon: Waves,
  },

  custom: {
    label: "Layer Kustom",
    shortLabel: "CUSTOM",
    accent: "#475569",
    soft: "#F8FAFC",
    icon: Layers3,
  },
};

const DEFAULT_LAYER_CONFIG: LayerTypeConfig = {
  label: "Layer",
  shortLabel: "LAYER",
  accent: "#475569",
  soft: "#F8FAFC",
  icon: Layers3,
};

const BASEMAPS: Record<
  BasemapKey,
  {
    label: string;
    shortLabel: string;
    icon: LucideIcon;
  }
> = {
  street: {
    label: "OpenStreetMap",
    shortLabel: "OSM",
    icon: MapIcon,
  },

  satellite: {
    label: "Satelit",
    shortLabel: "SAT",
    icon: Satellite,
  },
};

const panelMotion = {
  initial: {
    opacity: 0,
    x: -8,
  },

  animate: {
    opacity: 1,
    x: 0,
  },

  transition: {
    duration: 0.18,
    ease: [0.22, 1, 0.36, 1] as const,
  },
} as const;

const expandMotion = {
  initial: {
    height: 0,
    opacity: 0,
  },

  animate: {
    height: "auto",
    opacity: 1,
  },

  exit: {
    height: 0,
    opacity: 0,
  },

  transition: {
    duration: 0.16,
    ease: [0.22, 1, 0.36, 1] as const,
  },
} as const;

function getLayerKey(layer: MapLayerItem) {
  return String(layer.layer_type || "custom").toLowerCase();
}

function getLayerConfig(layer: MapLayerItem): LayerTypeConfig {
  const type = getLayerKey(layer);

  if (LAYER_TYPE_CONFIG[type]) {
    return LAYER_TYPE_CONFIG[type];
  }

  if (type.includes("nitrogen") || type === "n") {
    return LAYER_TYPE_CONFIG.nitrogen;
  }

  if (
    type.includes("phosphorus") ||
    type.includes("phosphate") ||
    type === "p"
  ) {
    return LAYER_TYPE_CONFIG.phosphorus;
  }

  if (type.includes("kalium") || type.includes("potassium") || type === "k") {
    return LAYER_TYPE_CONFIG.kalium;
  }

  if (type.includes("moisture")) {
    return LAYER_TYPE_CONFIG.moisture;
  }

  if (type.includes("organic")) {
    return LAYER_TYPE_CONFIG.corganic;
  }

  if (type.includes("spectral")) {
    return LAYER_TYPE_CONFIG.spectral;
  }

  if (type.includes("dsm") || type.includes("elevation")) {
    return LAYER_TYPE_CONFIG.dsm;
  }

  if (type.includes("ndvi")) {
    return LAYER_TYPE_CONFIG.ndvi;
  }

  if (type.includes("vari")) {
    return LAYER_TYPE_CONFIG.vari;
  }

  if (type.includes("ortho")) {
    return LAYER_TYPE_CONFIG.ortho;
  }

  return DEFAULT_LAYER_CONFIG;
}

function formatPrice(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatOpacity(value: number) {
  return `${Math.round(value * 100)}%`;
}

function normalizeOpacity(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 1;
  }

  return Math.min(1, Math.max(0, value));
}

function getConversionStatus(layer: MapLayerItem) {
  return String(layer.conversion_status || "")
    .trim()
    .toLowerCase();
}

function IconButton({
  children,
  title,
  active = false,
  disabled = false,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={[
        "group flex h-7 w-7 shrink-0 items-center justify-center border outline-none transition-all",
        "focus-visible:ring-2 focus-visible:ring-[#76B900]/40",
        active
          ? "border-[#171717] bg-[#171717] text-white"
          : "border-transparent bg-transparent text-[#686A64] hover:border-[#DCDDD8] hover:bg-[#F7F8F5] hover:text-[#171717]",
        disabled ? "cursor-not-allowed opacity-40" : "",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function TinyActionButton({
  children,
  title,
  onClick,
  disabled = false,
  danger = false,
}: {
  children: React.ReactNode;
  title: string;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={[
        "inline-flex h-7 items-center justify-center gap-1 border px-2 text-[9px] font-semibold outline-none transition-colors",
        "focus-visible:ring-2 focus-visible:ring-[#76B900]/40",
        disabled
          ? "cursor-not-allowed border-transparent text-[#B0B1AB]"
          : danger
          ? "border-[#E8D4CF] bg-[#FFF8F6] text-[#9B3E32] hover:border-[#D9B9B1] hover:bg-[#FFF4F1]"
          : "border-[#DCDDD8] bg-white text-[#555750] hover:border-[#171717] hover:bg-[#171717] hover:text-white",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default function LayerControlPanel({
  mapId,
  layers,
  token,
  basemap = "street",
  onChangeBasemap,
  terrainEnabled = false,
  onToggleTerrain,

  // Tetap diterima agar JSX MapDisplay tetap kompatibel.
  // Tidak dirender di UI panel.
  isFullscreen: _isFullscreen,
  onToggleFullscreen: _onToggleFullscreen,

  onToggleVisibility,
  onChangeOpacity,
  onLayerUploaded,
  onDeleteLayer,
  onRetryConvert,
  onReorderLayers,
  onSetBaseLayer,
}: LayerControlPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [panelOpen, setPanelOpen] = useState(true);

  const [expandedLayerId, setExpandedLayerId] = useState<
    string | number | null
  >(null);

  const [draggedLayerId, setDraggedLayerId] = useState<string | number | null>(
    null
  );

  const [dragOverLayerId, setDragOverLayerId] = useState<
    string | number | null
  >(null);

  const [reorderingId, setReorderingId] = useState<string | number | null>(
    null
  );

  const [uploadOpen, setUploadOpen] = useState(false);

  const [uploading, setUploading] = useState(false);

  const [uploadError, setUploadError] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [uploadName, setUploadName] = useState("");

  const [uploadLayerType, setUploadLayerType] =
    useState<UploadLayerType>("auto");

  const [uploadOpacity, setUploadOpacity] = useState(1);

  const [deleteTarget, setDeleteTarget] = useState<string | number | null>(
    null
  );

  const [deletingId, setDeletingId] = useState<string | number | null>(null);

  const [retryingId, setRetryingId] = useState<string | number | null>(null);

  const orderedLayers = useMemo(() => {
    return [...layers].sort((a, b) => {
      const aOrder = typeof a.display_order === "number" ? a.display_order : 0;

      const bOrder = typeof b.display_order === "number" ? b.display_order : 0;

      return aOrder - bOrder;
    });
  }, [layers]);

  const visibleLayerCount = orderedLayers.filter(
    (layer) => layer.is_visible
  ).length;

  const pendingCount = orderedLayers.filter((layer) => {
    const status = getConversionStatus(layer);

    return status === "pending" || status === "processing";
  }).length;

  const resolveBaseUrl = () =>
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";

  const resolveHeaders = () => {
    const headers: Record<string, string> = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  };

  const toggleExpanded = (layerId: string | number) => {
    setExpandedLayerId((current) =>
      String(current) === String(layerId) ? null : layerId
    );
  };

  const reorderLayers = async (fromIndex: number, toIndex: number) => {
    if (!onReorderLayers) {
      return;
    }

    if (
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= orderedLayers.length ||
      toIndex >= orderedLayers.length ||
      fromIndex === toIndex
    ) {
      return;
    }

    const nextLayers = [...orderedLayers];

    const [movedLayer] = nextLayers.splice(fromIndex, 1);

    if (!movedLayer) {
      return;
    }

    nextLayers.splice(toIndex, 0, movedLayer);

    try {
      setReorderingId(movedLayer.id);

      // Tetap array-based sesuai MapDisplay.
      await onReorderLayers(nextLayers);
    } finally {
      setReorderingId(null);
      setDraggedLayerId(null);
      setDragOverLayerId(null);
    }
  };

  const handleDragStart = (
    event: React.DragEvent<HTMLButtonElement>,
    layerId: string | number
  ) => {
    if (!onReorderLayers) {
      event.preventDefault();
      return;
    }

    setDraggedLayerId(layerId);

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(layerId));
  };

  const handleDragEnd = () => {
    setDraggedLayerId(null);
    setDragOverLayerId(null);
  };

  const handleDrop = async (
    event: React.DragEvent<HTMLDivElement>,
    targetLayerId: string | number
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (
      !onReorderLayers ||
      draggedLayerId === null ||
      String(draggedLayerId) === String(targetLayerId)
    ) {
      setDragOverLayerId(null);
      return;
    }

    const fromIndex = orderedLayers.findIndex(
      (layer) => String(layer.id) === String(draggedLayerId)
    );

    const toIndex = orderedLayers.findIndex(
      (layer) => String(layer.id) === String(targetLayerId)
    );

    setDragOverLayerId(null);

    if (fromIndex === -1 || toIndex === -1) {
      return;
    }

    await reorderLayers(fromIndex, toIndex);
  };

  const moveLayer = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= orderedLayers.length) {
      return;
    }

    await reorderLayers(index, targetIndex);
  };

  const handleDelete = async (layerId: string | number) => {
    if (!onDeleteLayer) {
      return;
    }

    try {
      setDeletingId(layerId);

      await onDeleteLayer(layerId);

      if (String(expandedLayerId) === String(layerId)) {
        setExpandedLayerId(null);
      }

      setDeleteTarget(null);
    } finally {
      setDeletingId(null);
    }
  };

  const handleRetry = async (layerId: string | number) => {
    if (!onRetryConvert) {
      return;
    }

    try {
      setRetryingId(layerId);

      await onRetryConvert(layerId);
    } finally {
      setRetryingId(null);
    }
  };

  const resetUploadForm = () => {
    setSelectedFile(null);
    setUploadName("");
    setUploadLayerType("auto");
    setUploadOpacity(1);
    setUploadError(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const closeUpload = () => {
    if (uploading) {
      return;
    }

    setUploadOpen(false);
    resetUploadForm();
  };

  const handleFileChange = (file: File | null) => {
    setUploadError(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const lower = file.name.toLowerCase();

    if (!lower.endsWith(".tif") && !lower.endsWith(".tiff")) {
      setSelectedFile(null);
      setUploadError("File harus berupa GeoTIFF (.tif atau .tiff).");
      return;
    }

    setSelectedFile(file);

    if (!uploadName.trim()) {
      setUploadName(file.name.replace(/\.(tif|tiff)$/i, ""));
    }
  };

  const handleUpload = async () => {
    if (!mapId) {
      setUploadError("Map ID tidak tersedia.");
      return;
    }

    if (!selectedFile) {
      setUploadError("Pilih file GeoTIFF terlebih dahulu.");
      return;
    }

    const name =
      uploadName.trim() || selectedFile.name.replace(/\.(tif|tiff)$/i, "");

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();

      formData.append("name", name);

      formData.append(
        "layer_type",
        uploadLayerType === "auto" ? "ortho" : uploadLayerType
      );

      formData.append("default_opacity", String(uploadOpacity));

      formData.append("display_order", String(orderedLayers.length));

      formData.append("file", selectedFile);

      const response = await fetch(`${resolveBaseUrl()}/maps/${mapId}/layers`, {
        method: "POST",
        headers: resolveHeaders(),
        body: formData,
      });

      if (!response.ok) {
        let message = `Upload gagal (${response.status}).`;

        try {
          const data = await response.json();

          if (typeof data?.detail === "string") {
            message = data.detail;
          }
        } catch {
          // ignore
        }

        throw new Error(message);
      }

      await onLayerUploaded?.();

      setUploadOpen(false);
      resetUploadForm();
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Gagal mengunggah layer."
      );
    } finally {
      setUploading(false);
    }
  };

  /*
   * =======================================================
   * MINIMIZED STATE
   * =======================================================
   */

  if (!panelOpen) {
    return (
      <motion.div
        {...panelMotion}
        className="pointer-events-auto absolute right-2 top-2 z-[60] sm:right-3 sm:top-3"
      >
        <button
          type="button"
          onClick={() => setPanelOpen(true)}
          title="Buka Layer Control"
          aria-label="Buka Layer Control"
          className="group flex h-10 items-center gap-2.5 border border-[#DCDDD8] bg-white/95 px-3 shadow-[0_10px_24px_rgba(0,0,0,0.08)] backdrop-blur-md outline-none transition-colors hover:border-[#171717] hover:bg-white focus-visible:ring-2 focus-visible:ring-[#76B900]/40"
        >
          <Layers3 className="h-4 w-4 text-[#171717]" strokeWidth={1.8} />

          <span className="text-[10px] font-bold tracking-[-0.01em] text-[#171717]">
            Layers
          </span>

          <span className="border border-[#E0E1DC] bg-[#F7F8F5] px-1.5 py-0.5 text-[9px] font-bold tabular-nums text-[#666861]">
            {orderedLayers.length}
          </span>

          <ChevronLeft
            className="h-3.5 w-3.5 text-[#999B94] transition-transform group-hover:translate-x-0.5"
            strokeWidth={1.8}
          />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.aside
      {...panelMotion}
      className="pointer-events-auto absolute right-2 top-2 z-[60] w-[300px] max-w-[calc(100%-16px)] sm:right-3 sm:top-3"
    >
      <div className="flex max-h-[62vh] flex-col overflow-hidden border border-[#DCDDD8] bg-white/95 shadow-[0_14px_34px_rgba(0,0,0,0.09)] backdrop-blur-md">
        {/* =================================================
            HEADER
        ================================================== */}
        <div className="shrink-0 border-b border-[#E7E8E3] bg-white">
          <div className="flex items-center justify-between gap-2 px-2.5 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-[#DCDDD8] bg-[#F7F8F5] text-[#171717]">
                <Layers3 className="h-3.5 w-3.5" strokeWidth={1.8} />
              </span>

              <div className="min-w-0">
                <p className="truncate text-[9px] font-bold uppercase tracking-[0.14em] text-[#999B94]">
                  Data Layers
                </p>

                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="text-[12px] font-bold tracking-[-0.02em] text-[#171717]">
                    Layer Control
                  </span>

                  <span className="border border-[#E0E1DC] bg-[#F7F8F5] px-1.5 py-0.5 text-[9px] font-bold tabular-nums text-[#666861]">
                    {orderedLayers.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {/* UPLOAD MAP */}
              <button
                type="button"
                onClick={() => {
                  setUploadOpen((current) => !current);
                  setUploadError(null);
                }}
                className={[
                  "inline-flex h-7 items-center gap-1.5 border px-2.5 text-[9px] font-bold outline-none transition-colors",
                  "focus-visible:ring-2 focus-visible:ring-[#76B900]/40",
                  uploadOpen
                    ? "border-[#171717] bg-[#171717] text-white"
                    : "border-[#DCDDD8] bg-white text-[#555750] hover:border-[#171717] hover:bg-[#171717] hover:text-white",
                ].join(" ")}
              >
                <Upload className="h-3 w-3" strokeWidth={2} />

                <span>Upload Map</span>
              </button>

              {/* MINIMIZE */}
              <IconButton
                title="Minimize Layer Control"
                onClick={() => {
                  setPanelOpen(false);
                  setUploadOpen(false);
                }}
              >
                <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.8} />
              </IconButton>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-[#F0F1ED] px-2.5 py-1.5">
            <div className="flex items-center gap-1.5">
              <span className="flex items-center gap-1 text-[9px] font-medium text-[#777972]">
                <span className="h-1.5 w-1.5 bg-[#76B900]" />
                {visibleLayerCount} aktif
              </span>

              {pendingCount > 0 && (
                <span className="flex items-center gap-1 border border-[#EDE5CE] bg-[#FFFBEF] px-1.5 py-0.5 text-[9px] font-semibold text-[#806D3D]">
                  <RefreshCcw className="h-2.5 w-2.5" strokeWidth={1.8} />
                  {pendingCount} proses
                </span>
              )}
            </div>

            {onReorderLayers && orderedLayers.length > 1 && (
              <span className="text-[9px] font-medium text-[#A0A19B]">
                Seret untuk urutkan
              </span>
            )}
          </div>
        </div>

        {/* =================================================
            UPLOAD
        ================================================== */}
        <AnimatePresence initial={false}>
          {uploadOpen && (
            <motion.div
              key="upload"
              {...expandMotion}
              className="shrink-0 overflow-hidden border-b border-[#E7E8E3]"
            >
              <div className="space-y-2 bg-[#FAFAF8] p-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center gap-2 border border-dashed border-[#C9CBC5] bg-white px-2 py-2 text-left outline-none transition-colors hover:border-[#76B900] hover:bg-[#FCFFF8] focus-visible:ring-2 focus-visible:ring-[#76B900]/30"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-[#E0E1DC] bg-[#F7F8F5] text-[#555750]">
                    {selectedFile ? (
                      <FileImage className="h-3.5 w-3.5" strokeWidth={1.8} />
                    ) : (
                      <CloudUpload className="h-3.5 w-3.5" strokeWidth={1.8} />
                    )}
                  </span>

                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-bold text-[#171717]">
                      {selectedFile ? selectedFile.name : "Pilih GeoTIFF"}
                    </p>

                    <p className="mt-0.5 text-[9px] font-medium text-[#8B8D86]">
                      {selectedFile
                        ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`
                        : ".tif / .tiff"}
                    </p>
                  </div>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".tif,.tiff,image/tiff"
                  className="hidden"
                  onChange={(event) =>
                    handleFileChange(event.target.files?.[0] || null)
                  }
                />

                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <label
                      htmlFor="layer-upload-name"
                      className="mb-1 block text-[9px] font-semibold text-[#858780]"
                    >
                      Nama
                    </label>

                    <input
                      id="layer-upload-name"
                      type="text"
                      value={uploadName}
                      onChange={(event) => setUploadName(event.target.value)}
                      placeholder="Nama layer"
                      className="h-7 w-full border border-[#DCDDD8] bg-white px-2 text-[10px] font-medium text-[#171717] outline-none transition-colors placeholder:text-[#B0B1AB] focus:border-[#B9C3AC] focus:ring-2 focus:ring-[#76B900]/10"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="layer-upload-type"
                      className="mb-1 block text-[9px] font-semibold text-[#858780]"
                    >
                      Tipe
                    </label>

                    <select
                      id="layer-upload-type"
                      value={uploadLayerType}
                      onChange={(event) =>
                        setUploadLayerType(
                          event.target.value as UploadLayerType
                        )
                      }
                      className="h-7 w-full border border-[#DCDDD8] bg-white px-2 text-[10px] font-medium text-[#171717] outline-none transition-colors focus:border-[#B9C3AC] focus:ring-2 focus:ring-[#76B900]/10"
                    >
                      <option value="auto">Auto detect</option>
                      <option value="ortho">Orthomosaic</option>
                      <option value="ndvi">NDVI</option>
                      <option value="vari">VARI</option>
                      <option value="nitrogen">Nitrogen</option>
                      <option value="phosphorus">Fosfor</option>
                      <option value="kalium">Kalium</option>
                      <option value="dsm">DSM</option>
                      <option value="ph">pH</option>
                      <option value="moisture">Moisture</option>
                      <option value="corganic">C-Organik</option>
                      <option value="spectral">Spektral</option>
                      <option value="custom">Kustom</option>
                    </select>
                  </div>
                </div>

                <div className="border border-[#E0E1DC] bg-white px-2 py-1.5">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[9px] font-semibold text-[#858780]">
                      Opacity awal
                    </span>

                    <span className="text-[9px] font-bold tabular-nums text-[#555750]">
                      {formatOpacity(uploadOpacity)}
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={uploadOpacity}
                    onChange={(event) =>
                      setUploadOpacity(Number(event.target.value))
                    }
                    className="h-1 w-full cursor-pointer appearance-none bg-[#DCDDD8] accent-[#171717]"
                  />
                </div>

                {uploadError && (
                  <div className="border border-[#E7D0CC] bg-[#FFF7F5] px-2 py-1.5 text-[9px] font-medium leading-4 text-[#9B3E32]">
                    {uploadError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-1">
                  <TinyActionButton
                    title="Batalkan upload"
                    onClick={closeUpload}
                    disabled={uploading}
                  >
                    <X className="h-2.5 w-2.5" strokeWidth={2} />
                    Batal
                  </TinyActionButton>

                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={uploading}
                    className="inline-flex h-7 items-center justify-center gap-1.5 bg-[#171717] px-2.5 text-[9px] font-bold uppercase tracking-[0.06em] text-white outline-none transition-colors hover:bg-[#76B900] hover:text-[#101700] focus-visible:ring-2 focus-visible:ring-[#76B900]/40 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {uploading ? (
                      <>
                        <RefreshCcw
                          className="h-2.5 w-2.5 animate-spin"
                          strokeWidth={1.9}
                        />
                        Uploading
                      </>
                    ) : (
                      <>
                        <Upload className="h-2.5 w-2.5" strokeWidth={2} />
                        Upload
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* =================================================
            BASemap SECTION
        ================================================== */}
        <div className="shrink-0 border-b border-[#E7E8E3] bg-white px-2 py-1.5">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#999B94]">
              Basemap
            </span>

            <span className="text-[8px] font-medium text-[#B0B1AB]">
              {basemap === "satellite" ? "Satelit" : "OpenStreetMap"}
            </span>
          </div>

          <div className="flex gap-1">
            {(Object.keys(BASEMAPS) as BasemapKey[]).map((key) => {
              const BaseIcon = BASEMAPS[key].icon;

              const isActive = basemap === key;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onChangeBasemap?.(key)}
                  title={BASEMAPS[key].label}
                  aria-pressed={isActive}
                  className={[
                    "flex h-8 min-w-0 flex-1 items-center justify-center gap-1.5 border px-2 text-[9px] font-semibold outline-none transition-all",
                    "focus-visible:ring-2 focus-visible:ring-[#76B900]/30",
                    isActive
                      ? "border-[#171717] bg-[#171717] text-white"
                      : "border-[#DCDDD8] bg-[#FAFAF8] text-[#666861] hover:border-[#BFC1BB] hover:bg-white hover:text-[#171717]",
                  ].join(" ")}
                >
                  <BaseIcon
                    className="h-3.5 w-3.5 shrink-0"
                    strokeWidth={1.8}
                  />

                  <span className="truncate">{BASEMAPS[key].label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* =================================================
            TERRAIN / 3D
        ================================================== */}
        {onToggleTerrain && (
          <div className="shrink-0 border-b border-[#E7E8E3] bg-[#FAFAF8] px-2 py-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-[#DCDDD8] bg-white text-[#78716C]">
                  <Mountain className="h-3.5 w-3.5" strokeWidth={1.8} />
                </span>

                <div className="min-w-0">
                  <p className="text-[9px] font-bold text-[#171717]">
                    Terrain 3D
                  </p>

                  <p className="truncate text-[8px] font-medium text-[#999B94]">
                    Elevasi permukaan medan
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onToggleTerrain}
                aria-pressed={terrainEnabled}
                className={[
                  "relative h-6 w-11 shrink-0 border outline-none transition-colors",
                  "focus-visible:ring-2 focus-visible:ring-[#76B900]/40",
                  terrainEnabled
                    ? "border-[#171717] bg-[#171717]"
                    : "border-[#DCDDD8] bg-white",
                ].join(" ")}
              >
                <span
                  className={[
                    "absolute top-1/2 h-4 w-4 -translate-y-1/2 transition-transform",
                    terrainEnabled
                      ? "translate-x-0 bg-[#76B900]"
                      : "-translate-x-4 bg-[#B0B1AB]",
                  ].join(" ")}
                />
              </button>
            </div>
          </div>
        )}

        {/* =================================================
            LAYER LIST
        ================================================== */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5">
          {orderedLayers.length === 0 ? (
            <div className="border border-dashed border-[#DCDDD8] bg-[#FAFAF8] px-3 py-5 text-center">
              <div className="mx-auto flex h-8 w-8 items-center justify-center border border-[#E0E1DC] bg-white text-[#989A93]">
                <Layers3 className="h-4 w-4" strokeWidth={1.7} />
              </div>

              <p className="mt-2 text-[10px] font-bold text-[#555750]">
                Belum ada layer
              </p>

              <p className="mx-auto mt-0.5 max-w-[190px] text-[9px] font-medium leading-4 text-[#A0A19B]">
                Tambahkan GeoTIFF untuk menampilkan data raster di peta.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {orderedLayers.map((layer, index) => {
                const config = getLayerConfig(layer);

                const TypeIcon = config.icon;

                const status = getConversionStatus(layer);

                const isProcessing =
                  status === "pending" || status === "processing";

                const isFailed = status === "failed" || status === "error";

                const isExpanded = String(expandedLayerId) === String(layer.id);

                const isDragging =
                  draggedLayerId !== null &&
                  String(draggedLayerId) === String(layer.id);

                const isDropTarget =
                  dragOverLayerId !== null &&
                  String(dragOverLayerId) === String(layer.id);

                const opacity = normalizeOpacity(layer.default_opacity);

                const accessMeta = layer as MapLayerItem & LayerAccessMeta;

                const extraMeta = layer as MapLayerItem & LayerExtraMeta;

                const price = formatPrice(accessMeta.purchase_price);

                return (
                  <div
                    key={String(layer.id)}
                    onDragOver={(event) => {
                      if (!onReorderLayers) {
                        return;
                      }

                      event.preventDefault();

                      event.dataTransfer.dropEffect = "move";

                      if (String(dragOverLayerId) !== String(layer.id)) {
                        setDragOverLayerId(layer.id);
                      }
                    }}
                    onDragLeave={(event) => {
                      const currentTarget = event.currentTarget;

                      if (
                        event.relatedTarget &&
                        currentTarget.contains(event.relatedTarget as Node)
                      ) {
                        return;
                      }

                      setDragOverLayerId(null);
                    }}
                    onDrop={(event) => handleDrop(event, layer.id)}
                    className={[
                      "relative overflow-hidden border bg-white transition-all",
                      isDragging ? "z-20 scale-[0.985] opacity-45" : "",
                      isDropTarget
                        ? "border-[#171717] shadow-[0_0_0_2px_rgba(118,185,0,0.16)]"
                        : "border-[#E0E1DC]",
                    ].join(" ")}
                  >
                    {/* COLOR IDENTITY */}
                    <div
                      className="absolute inset-y-0 left-0 w-[3px]"
                      style={{
                        backgroundColor: config.accent,
                      }}
                    />

                    {/* MAIN ROW */}
                    <div className="flex min-w-0 items-center gap-1.5 pl-2 pr-1.5 py-1.5">
                      {onReorderLayers ? (
                        <button
                          type="button"
                          draggable
                          onDragStart={(event) =>
                            handleDragStart(event, layer.id)
                          }
                          onDragEnd={handleDragEnd}
                          title="Tarik untuk mengubah urutan"
                          aria-label={`Ubah urutan ${layer.name}`}
                          className="flex h-6 w-5 shrink-0 cursor-grab items-center justify-center text-[#A0A19B] outline-none transition-colors hover:text-[#171717] active:cursor-grabbing"
                        >
                          <GripVertical
                            className="h-3.5 w-3.5"
                            strokeWidth={1.8}
                          />
                        </button>
                      ) : (
                        <span className="w-5 shrink-0" />
                      )}

                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center border"
                        style={{
                          borderColor: `${config.accent}35`,
                          backgroundColor: config.soft,
                          color: config.accent,
                        }}
                      >
                        <TypeIcon className="h-3.5 w-3.5" strokeWidth={1.8} />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggleExpanded(layer.id)}
                            className="min-w-0 truncate text-left text-[10px] font-bold text-[#171717] outline-none hover:underline"
                            title={layer.name}
                          >
                            {layer.name}
                          </button>

                          {layer.is_base_layer && (
                            <span className="shrink-0 border border-[#D9E5C4] bg-[#F5FAEE] px-1 py-0.5 text-[8px] font-bold uppercase tracking-[0.04em] text-[#5A7A1D]">
                              Base
                            </span>
                          )}
                        </div>

                        <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
                          <span
                            className="truncate text-[8px] font-bold uppercase tracking-[0.08em]"
                            style={{
                              color: config.accent,
                            }}
                          >
                            {config.shortLabel}
                          </span>

                          <span className="text-[8px] text-[#B0B1AB]">•</span>

                          <span className="shrink-0 text-[8px] font-medium tabular-nums text-[#898B84]">
                            {formatOpacity(opacity)}
                          </span>
                        </div>
                      </div>

                      {isProcessing ? (
                        <span
                          className="flex h-6 shrink-0 items-center border border-[#EDE5CE] bg-[#FFFBEF] px-1.5 text-[#806D3D]"
                          title="Layer sedang diproses"
                        >
                          <RefreshCcw
                            className="h-2.5 w-2.5 animate-spin"
                            strokeWidth={1.8}
                          />
                        </span>
                      ) : isFailed ? (
                        <span
                          className="flex h-6 shrink-0 items-center border border-[#E8D4CF] bg-[#FFF7F5] px-1.5 text-[8px] font-bold text-[#9B3E32]"
                          title={layer.conversion_error || "Konversi gagal"}
                        >
                          !
                        </span>
                      ) : null}

                      <IconButton
                        title={
                          layer.is_visible
                            ? "Sembunyikan layer"
                            : "Tampilkan layer"
                        }
                        onClick={() =>
                          onToggleVisibility(layer.id, !layer.is_visible)
                        }
                        active={Boolean(layer.is_visible)}
                      >
                        {layer.is_visible ? (
                          <Eye className="h-3.5 w-3.5" strokeWidth={1.8} />
                        ) : (
                          <EyeOff className="h-3.5 w-3.5" strokeWidth={1.8} />
                        )}
                      </IconButton>

                      <IconButton
                        title={
                          isExpanded
                            ? "Tutup detail layer"
                            : "Buka detail layer"
                        }
                        onClick={() => toggleExpanded(layer.id)}
                        active={isExpanded}
                      >
                        {isExpanded ? (
                          <ChevronDown
                            className="h-3.5 w-3.5"
                            strokeWidth={1.8}
                          />
                        ) : (
                          <MoreHorizontal
                            className="h-3.5 w-3.5"
                            strokeWidth={1.8}
                          />
                        )}
                      </IconButton>
                    </div>

                    {/* OPACITY */}
                    <div className="border-t border-[#F0F1ED] px-2 py-1.5">
                      <div className="flex items-center gap-2">
                        <span className="shrink-0 text-[8px] font-semibold uppercase tracking-[0.05em] text-[#A0A19B]">
                          Opacity
                        </span>

                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={opacity}
                          disabled={isProcessing}
                          onChange={(event) =>
                            onChangeOpacity(
                              layer.id,
                              Number(event.target.value)
                            )
                          }
                          className="h-1 min-w-0 flex-1 cursor-pointer appearance-none bg-[#DCDDD8] accent-[#171717] disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={`Opacity ${layer.name}`}
                        />

                        <span className="w-7 shrink-0 text-right text-[8px] font-bold tabular-nums text-[#666861]">
                          {formatOpacity(opacity)}
                        </span>
                      </div>
                    </div>

                    {/* DETAIL */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          key={`detail-${String(layer.id)}`}
                          {...expandMotion}
                          className="overflow-hidden border-t border-[#E7E8E3]"
                        >
                          <div className="space-y-1.5 bg-[#FAFAF8] p-1.5">
                            {/* TYPE + ACCESS */}
                            <div className="grid grid-cols-2 gap-1">
                              <div className="border border-[#E0E1DC] bg-white p-1.5">
                                <span className="block text-[8px] font-semibold uppercase tracking-[0.05em] text-[#A0A19B]">
                                  Tipe
                                </span>

                                <div className="mt-0.5 flex items-center gap-1">
                                  <span
                                    className="h-1.5 w-1.5 shrink-0"
                                    style={{
                                      backgroundColor: config.accent,
                                    }}
                                  />

                                  <span className="truncate text-[9px] font-bold text-[#171717]">
                                    {config.label}
                                  </span>
                                </div>
                              </div>

                              <div className="border border-[#E0E1DC] bg-white p-1.5">
                                <span className="block text-[8px] font-semibold uppercase tracking-[0.05em] text-[#A0A19B]">
                                  Akses
                                </span>

                                {accessMeta.locked_for_free ? (
                                  <div className="mt-0.5 flex min-w-0 items-center gap-1">
                                    <LockKeyhole
                                      className="h-2.5 w-2.5 shrink-0 text-[#8A7A57]"
                                      strokeWidth={1.8}
                                    />

                                    <span className="truncate text-[9px] font-bold text-[#70644D]">
                                      Terbatas
                                    </span>
                                  </div>
                                ) : (
                                  <div className="mt-0.5 flex items-center gap-1">
                                    <Check
                                      className="h-2.5 w-2.5 shrink-0 text-[#669E00]"
                                      strokeWidth={2}
                                    />

                                    <span className="text-[9px] font-bold text-[#587600]">
                                      Tersedia
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {accessMeta.locked_for_free && price && (
                              <div className="flex items-center gap-1.5 border border-[#E8E5E0] bg-white px-2 py-1.5">
                                <Shield
                                  className="h-3 w-3 shrink-0 text-[#8A7A57]"
                                  strokeWidth={1.8}
                                />

                                <span className="text-[8px] font-medium text-[#70644D]">
                                  Akses berlangganan
                                </span>

                                <span className="ml-auto text-[9px] font-bold tabular-nums text-[#555750]">
                                  {price}
                                </span>
                              </div>
                            )}

                            {(extraMeta.min_value != null ||
                              extraMeta.max_value != null ||
                              extraMeta.unit) && (
                              <div className="border border-[#E0E1DC] bg-white p-1.5">
                                <div className="grid grid-cols-3 gap-1.5">
                                  <div>
                                    <span className="block text-[8px] font-semibold text-[#A0A19B]">
                                      Min
                                    </span>

                                    <span className="mt-0.5 block text-[9px] font-bold tabular-nums text-[#171717]">
                                      {extraMeta.min_value ?? "-"}
                                    </span>
                                  </div>

                                  <div className="border-x border-[#E7E8E3] px-1.5">
                                    <span className="block text-[8px] font-semibold text-[#A0A19B]">
                                      Max
                                    </span>

                                    <span className="mt-0.5 block text-[9px] font-bold tabular-nums text-[#171717]">
                                      {extraMeta.max_value ?? "-"}
                                    </span>
                                  </div>

                                  <div>
                                    <span className="block text-[8px] font-semibold text-[#A0A19B]">
                                      Unit
                                    </span>

                                    <span className="mt-0.5 block truncate text-[9px] font-bold text-[#171717]">
                                      {extraMeta.unit || "-"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {isFailed && layer.conversion_error && (
                              <div className="border border-[#E8D4CF] bg-[#FFF7F5] px-2 py-1.5">
                                <span className="block text-[8px] font-semibold uppercase tracking-[0.04em] text-[#B15A4C]">
                                  Error konversi
                                </span>

                                <p className="mt-0.5 text-[8px] font-medium leading-3.5 text-[#874136]">
                                  {layer.conversion_error}
                                </p>
                              </div>
                            )}

                            <div className="flex items-center justify-between gap-1 border border-[#E0E1DC] bg-white p-1">
                              <div className="flex items-center gap-px">
                                <IconButton
                                  title="Naik satu urutan"
                                  disabled={
                                    index === 0 || reorderingId !== null
                                  }
                                  onClick={() => moveLayer(index, "up")}
                                >
                                  <ChevronLeft
                                    className="h-3 w-3 rotate-90"
                                    strokeWidth={1.8}
                                  />
                                </IconButton>

                                <span className="min-w-[20px] text-center text-[8px] font-bold tabular-nums text-[#888A83]">
                                  {index + 1}
                                </span>

                                <IconButton
                                  title="Turun satu urutan"
                                  disabled={
                                    index === orderedLayers.length - 1 ||
                                    reorderingId !== null
                                  }
                                  onClick={() => moveLayer(index, "down")}
                                >
                                  <ChevronRight
                                    className="h-3 w-3 rotate-90"
                                    strokeWidth={1.8}
                                  />
                                </IconButton>
                              </div>

                              <div className="flex items-center gap-1">
                                {onSetBaseLayer && (
                                  <TinyActionButton
                                    title={
                                      layer.is_base_layer
                                        ? "Layer ini sudah menjadi base layer"
                                        : "Jadikan base layer"
                                    }
                                    disabled={
                                      layer.is_base_layer ||
                                      reorderingId !== null
                                    }
                                    onClick={() => onSetBaseLayer(layer.id)}
                                  >
                                    <CircleDot
                                      className="h-2.5 w-2.5"
                                      strokeWidth={1.8}
                                    />

                                    {layer.is_base_layer ? "Base" : "Set Base"}
                                  </TinyActionButton>
                                )}

                                {isFailed && onRetryConvert && (
                                  <TinyActionButton
                                    title="Coba konversi ulang"
                                    disabled={retryingId !== null}
                                    onClick={() => handleRetry(layer.id)}
                                  >
                                    <RefreshCcw
                                      className={[
                                        "h-2.5 w-2.5",
                                        retryingId === layer.id
                                          ? "animate-spin"
                                          : "",
                                      ].join(" ")}
                                      strokeWidth={1.8}
                                    />
                                    Retry
                                  </TinyActionButton>
                                )}

                                {onDeleteLayer && (
                                  <TinyActionButton
                                    title="Hapus layer"
                                    danger
                                    disabled={deletingId !== null}
                                    onClick={() => setDeleteTarget(layer.id)}
                                  >
                                    <Trash2
                                      className="h-2.5 w-2.5"
                                      strokeWidth={1.8}
                                    />
                                    Hapus
                                  </TinyActionButton>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* DELETE CONFIRMATION */}
                    <AnimatePresence initial={false}>
                      {String(deleteTarget) === String(layer.id) && (
                        <motion.div
                          key={`delete-${String(layer.id)}`}
                          initial={{
                            opacity: 0,
                            height: 0,
                          }}
                          animate={{
                            opacity: 1,
                            height: "auto",
                          }}
                          exit={{
                            opacity: 0,
                            height: 0,
                          }}
                          transition={{
                            duration: 0.14,
                            ease: [0.22, 1, 0.36, 1] as const,
                          }}
                          className="overflow-hidden border-t border-[#E8D4CF]"
                        >
                          <div className="flex items-center gap-2 bg-[#FFF7F5] px-2 py-1.5">
                            <Trash2
                              className="h-3 w-3 shrink-0 text-[#9B3E32]"
                              strokeWidth={1.8}
                            />

                            <span className="min-w-0 flex-1 text-[8px] font-medium leading-3.5 text-[#874136]">
                              Hapus layer ini?
                            </span>

                            <button
                              type="button"
                              onClick={() => setDeleteTarget(null)}
                              disabled={deletingId === layer.id}
                              className="h-6 border border-[#DCDDD8] bg-white px-2 text-[8px] font-bold text-[#666861] hover:bg-[#F7F8F5]"
                            >
                              Batal
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(layer.id)}
                              disabled={deletingId === layer.id}
                              className="inline-flex h-6 items-center gap-1 bg-[#9B3E32] px-2 text-[8px] font-bold text-white hover:bg-[#803127] disabled:opacity-50"
                            >
                              {deletingId === layer.id ? (
                                <RefreshCcw
                                  className="h-2.5 w-2.5 animate-spin"
                                  strokeWidth={1.8}
                                />
                              ) : (
                                <Trash2
                                  className="h-2.5 w-2.5"
                                  strokeWidth={1.8}
                                />
                              )}
                              Hapus
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* =================================================
            FOOTER
        ================================================== */}
        {orderedLayers.length > 0 && (
          <div className="shrink-0 border-t border-[#E7E8E3] bg-[#FAFAF8] px-2.5 py-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-1">
                <Database
                  className="h-2.5 w-2.5 shrink-0 text-[#999B94]"
                  strokeWidth={1.8}
                />

                <span className="truncate text-[8px] font-medium text-[#999B94]">
                  Urutan atas → bawah mengikuti stack peta
                </span>
              </div>

              {onReorderLayers && (
                <span className="shrink-0 text-[8px] font-bold text-[#76B900]">
                  DnD
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.aside>
  );
}
