"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle,
  CheckCircle2,
  Compass,
  Eye,
  FileText,
  Folder,
  Layers,
  MapPin,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sliders,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";

import { useUserRole } from "@/context/UserRoleContext";
import api from "@/lib/api";
import { ErrorDetailObject, GeoMetadata } from "@/types/map";

interface BatchFileItem {
  id: string;
  file: File;
  name: string;
  layer_type: string;
  is_base: boolean;
  default_opacity: number;
}

interface ManualSlotItem {
  id: string;
  name: string;
  layer_type: string;
  file: File | null;
  default_opacity: number;
}

const LAYER_TYPE_CONFIG: Record<
  string,
  {
    label: string;
    badgeClass: string;
    defaultName: string;
    defaultOpacity: number;
  }
> = {
  ortho: {
    label: "Citra Ortho RGB",
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-800",
    defaultName: "Citra Ortho RGB",
    defaultOpacity: 1,
  },
  ndvi: {
    label: "Indeks Vegetasi (NDVI)",
    badgeClass: "border-lime-200 bg-lime-50 text-lime-800",
    defaultName: "Indeks Vegetasi (NDVI)",
    defaultOpacity: 0.85,
  },
  vari: {
    label: "Indeks Vegetasi (VARI)",
    badgeClass: "border-teal-200 bg-teal-50 text-teal-800",
    defaultName: "Indeks Vegetasi (VARI)",
    defaultOpacity: 0.85,
  },
  nitrogen: {
    label: "Kandungan Nitrogen (N)",
    badgeClass: "border-violet-200 bg-violet-50 text-violet-800",
    defaultName: "Kandungan Nitrogen (N)",
    defaultOpacity: 0.75,
  },
  phosphorus: {
    label: "Kandungan Fosfor (P)",
    badgeClass: "border-amber-200 bg-amber-50 text-amber-800",
    defaultName: "Kandungan Fosfor (P)",
    defaultOpacity: 0.75,
  },
  kalium: {
    label: "Kandungan Kalium (K)",
    badgeClass: "border-rose-200 bg-rose-50 text-rose-800",
    defaultName: "Kandungan Kalium (K)",
    defaultOpacity: 0.75,
  },
  dsm: {
    label: "Model Elevasi (DSM)",
    badgeClass: "border-stone-200 bg-stone-100 text-stone-800",
    defaultName: "Model Elevasi (DSM)",
    defaultOpacity: 0.7,
  },
  spectral: {
    label: "Saluran Multispektral",
    badgeClass: "border-sky-200 bg-sky-50 text-sky-800",
    defaultName: "Saluran Multispektral",
    defaultOpacity: 0.8,
  },
  custom: {
    label: "Layer Tematik Kustom",
    badgeClass: "border-gray-200 bg-gray-100 text-gray-800",
    defaultName: "Layer Tematik",
    defaultOpacity: 0.8,
  },
};

const layerOptions = [
  { value: "ortho", label: "Citra Ortho RGB" },
  { value: "ndvi", label: "NDVI (Vegetasi)" },
  { value: "vari", label: "VARI" },
  { value: "nitrogen", label: "Nitrogen (N)" },
  { value: "phosphorus", label: "Fosfor (P)" },
  { value: "kalium", label: "Kalium (K)" },
  { value: "dsm", label: "DSM (Elevasi)" },
  { value: "spectral", label: "Multispektral" },
  { value: "custom", label: "Layer Kustom" },
];

const manualLayerOptions = layerOptions.filter(
  (option) => option.value !== "ortho"
);

function autoDetectLayer(filename: string) {
  const fn = filename.toLowerCase();

  const isToken = (token: string) =>
    new RegExp(`(^|[_\\-.])${token}([_\\-.]|$)`, "i").test(fn);

  if (/ortho|rgb|citra|foto|mosaic|mosaik/.test(fn)) {
    return {
      layer_type: "ortho",
      name: "Citra Ortho RGB",
      is_base: true,
      default_opacity: 1,
    };
  }

  if (fn.includes("ndvi")) {
    return {
      layer_type: "ndvi",
      name: "Indeks Vegetasi (NDVI)",
      is_base: false,
      default_opacity: 0.85,
    };
  }

  if (fn.includes("vari")) {
    return {
      layer_type: "vari",
      name: "Indeks Vegetasi (VARI)",
      is_base: false,
      default_opacity: 0.85,
    };
  }

  if (/nitrogen/.test(fn) || isToken("n") || fn.includes("n_ppm")) {
    return {
      layer_type: "nitrogen",
      name: "Kandungan Nitrogen (N)",
      is_base: false,
      default_opacity: 0.75,
    };
  }

  if (/phosphor|fosfor/.test(fn) || isToken("p") || fn.includes("p_ppm")) {
    return {
      layer_type: "phosphorus",
      name: "Kandungan Fosfor (P)",
      is_base: false,
      default_opacity: 0.75,
    };
  }

  if (/kalium|potassium/.test(fn) || isToken("k") || fn.includes("k_ppm")) {
    return {
      layer_type: "kalium",
      name: "Kandungan Kalium (K)",
      is_base: false,
      default_opacity: 0.75,
    };
  }

  if (/dsm|dem|elevasi|elevation|dtm/.test(fn)) {
    return {
      layer_type: "dsm",
      name: "Model Elevasi (DSM)",
      is_base: false,
      default_opacity: 0.7,
    };
  }

  if (/spectral|spektral|nir|rededge|red_edge|red-edge/.test(fn)) {
    return {
      layer_type: "spectral",
      name: "Saluran Multispektral",
      is_base: false,
      default_opacity: 0.8,
    };
  }

  const cleanName = filename
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();

  return {
    layer_type: "custom",
    name: cleanName || "Layer Tematik",
    is_base: false,
    default_opacity: 0.8,
  };
}

function formatFileSize(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function SectionHeader({
  icon,
  title,
  description,
  right,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f3f6ed] text-[#123c28]">
          {icon}
        </div>

        <div className="min-w-0">
          <h2 className="text-sm font-bold text-[#123c28]">{title}</h2>

          {description && (
            <p className="mt-0.5 text-[11px] leading-relaxed text-[#123c28]/55">
              {description}
            </p>
          )}
        </div>
      </div>

      {right}
    </div>
  );
}

export default function UploadPage() {
  const router = useRouter();
  const { user } = useUserRole();

  const [uploadMode, setUploadMode] = useState<"batch" | "manual">("batch");

  // Metadata
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [surveyDate, setSurveyDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [description, setDescription] = useState("");
  const [lockedForFree, setLockedForFree] = useState(false);
  const [purchasable, setPurchasable] = useState(false);

  // Batch
  const [batchFiles, setBatchFiles] = useState<BatchFileItem[]>([]);
  const [dragActive, setDragActive] = useState(false);

  // Manual
  const [manualBaseFile, setManualBaseFile] = useState<File | null>(null);
  const [manualBaseName, setManualBaseName] = useState("Citra Ortho RGB Utama");

  const [manualSlots, setManualSlots] = useState<ManualSlotItem[]>([
    {
      id: "slot-1",
      name: "Indeks Vegetasi (NDVI)",
      layer_type: "ndvi",
      file: null,
      default_opacity: 0.85,
    },
  ]);

  // Submit
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const [geoSuccess, setGeoSuccess] = useState<{
    title: string;
    mapId: string;
    totalLayers: number;
    metadata?: GeoMetadata;
  } | null>(null);

  const [geoError, setGeoError] = useState<ErrorDetailObject | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/dashboard");
    }
  }, [user, router]);

  // =========================================================
  // FILE HANDLING
  // =========================================================

  const processIncomingFiles = (incoming: FileList | File[]) => {
    const validFiles = Array.from(incoming).filter((file) => {
      const name = file.name.toLowerCase();
      return name.endsWith(".tif") || name.endsWith(".tiff");
    });

    if (validFiles.length === 0) {
      setMessage("Hanya file berekstensi .tif atau .tiff yang didukung.");
      return;
    }

    const newItems: BatchFileItem[] = validFiles.map((file, index) => {
      const detected = autoDetectLayer(file.name);

      return {
        id: `${Date.now()}-${index}-${Math.random()}`,
        file,
        name: detected.name,
        layer_type: detected.layer_type,
        is_base: detected.is_base,
        default_opacity: detected.default_opacity,
      };
    });

    setBatchFiles((prev) => {
      const combined = [...prev, ...newItems];

      if (combined.length > 0 && !combined.some((item) => item.is_base)) {
        combined[0].is_base = true;
      }

      return combined;
    });

    if (!title && validFiles.length > 0) {
      const firstClean = validFiles[0].name
        .replace(/\.[^/.]+$/, "")
        .replace(/[_-]/g, " ")
        .replace(/ortho|rgb|citra|ndvi|dsm/gi, "")
        .replace(/\s+/g, " ")
        .trim();

      if (firstClean) {
        setTitle(`Survei Fotogrametri ${firstClean}`);
      }
    }

    setMessage("");
    setGeoError(null);
  };

  const handleDrag = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (event.type === "dragenter" || event.type === "dragover") {
      setDragActive(true);
    } else if (event.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    setDragActive(false);

    if (event.dataTransfer.files?.length) {
      processIncomingFiles(event.dataTransfer.files);
    }
  };

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files?.length) {
      processIncomingFiles(event.target.files);
    }
  };

  // =========================================================
  // BATCH MANAGEMENT
  // =========================================================

  const handleSetBaseLayer = (id: string) => {
    setBatchFiles((prev) =>
      prev.map((item) => ({
        ...item,
        is_base: item.id === id,
        ...(item.id === id
          ? {
              layer_type: "ortho",
              default_opacity: 1,
            }
          : {}),
      }))
    );
  };

  const handleUpdateBatchItem = (
    id: string,
    field: keyof BatchFileItem,
    value: any
  ) => {
    setBatchFiles((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const updated = {
          ...item,
          [field]: value,
        };

        if (field === "layer_type") {
          const config = LAYER_TYPE_CONFIG[value as string];

          if (config) {
            updated.default_opacity = config.defaultOpacity;

            const isDefaultName = Object.values(LAYER_TYPE_CONFIG).some(
              (itemConfig) => {
                return itemConfig.defaultName === item.name;
              }
            );

            if (!item.name || isDefaultName) {
              updated.name = config.defaultName;
            }
          }
        }

        return updated;
      })
    );
  };

  const handleRemoveBatchItem = (id: string) => {
    setBatchFiles((prev) => {
      const filtered = prev.filter((item) => item.id !== id);

      if (filtered.length > 0 && !filtered.some((item) => item.is_base)) {
        filtered[0].is_base = true;
      }

      return filtered;
    });
  };

  // =========================================================
  // MANUAL MANAGEMENT
  // =========================================================

  const handleAddManualSlot = () => {
    setManualSlots((prev) => [
      ...prev,
      {
        id: `slot-${Date.now()}`,
        name: "Layer Analisis Tambahan",
        layer_type: "nitrogen",
        file: null,
        default_opacity: 0.75,
      },
    ]);
  };

  const handleRemoveManualSlot = (id: string) => {
    setManualSlots((prev) => prev.filter((slot) => slot.id !== id));
  };

  const handleUpdateManualSlot = (
    id: string,
    field: keyof ManualSlotItem,
    value: any
  ) => {
    setManualSlots((prev) =>
      prev.map((slot) => {
        if (slot.id !== id) return slot;

        const updated = {
          ...slot,
          [field]: value,
        };

        if (field === "layer_type") {
          const config = LAYER_TYPE_CONFIG[value as string];

          if (config) {
            updated.default_opacity = config.defaultOpacity;

            const isDefaultName = Object.values(LAYER_TYPE_CONFIG).some(
              (itemConfig) => {
                return itemConfig.defaultName === slot.name;
              }
            );

            if (!slot.name || isDefaultName) {
              updated.name = config.defaultName;
            }
          }
        }

        return updated;
      })
    );
  };

  // =========================================================
  // SUBMIT
  // =========================================================

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    let filesToUpload: File[] = [];
    let layersConfigPayload: any[] = [];

    if (uploadMode === "batch") {
      if (batchFiles.length === 0) {
        setMessage("Silakan pilih minimal 1 file GeoTIFF terlebih dahulu.");
        return;
      }

      filesToUpload = batchFiles.map((item) => item.file);

      layersConfigPayload = batchFiles.map((item, index) => ({
        filename: item.file.name,
        name: item.name || `Layer ${index + 1}`,
        layer_type: item.layer_type,
        default_opacity: item.default_opacity,
        is_base: item.is_base,
      }));
    } else {
      if (!manualBaseFile) {
        setMessage("Slot Base Layer (Citra Ortho Utama) wajib diunggah.");
        return;
      }

      filesToUpload.push(manualBaseFile);

      layersConfigPayload.push({
        filename: manualBaseFile.name,
        name: manualBaseName || "Citra Ortho RGB Utama",
        layer_type: "ortho",
        default_opacity: 1,
        is_base: true,
      });

      manualSlots.forEach((slot) => {
        if (!slot.file) return;

        filesToUpload.push(slot.file);

        layersConfigPayload.push({
          filename: slot.file.name,
          name: slot.name || slot.layer_type,
          layer_type: slot.layer_type,
          default_opacity: slot.default_opacity,
          is_base: false,
        });
      });
    }

    setLoading(true);
    setUploadProgress(0);
    setMessage("");
    setIsSuccess(false);
    setGeoError(null);
    setGeoSuccess(null);

    const formData = new FormData();

    formData.append("title", title);
    formData.append("location", location);
    formData.append("survey_date", surveyDate);

    if (description) {
      formData.append("description", description);
    }

    formData.append("locked_for_free", lockedForFree ? "true" : "false");

    formData.append("purchasable", purchasable ? "true" : "false");

    formData.append("layers_config", JSON.stringify(layersConfigPayload));

    filesToUpload.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const response = await api.post("/maps/batch", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },

        onUploadProgress: ({ loaded, total }) => {
          if (!total) return;

          const percentage = Math.round((loaded * 100) / total);

          setUploadProgress(percentage >= 100 ? 99 : percentage);
        },
      });

      setUploadProgress(100);
      setIsSuccess(true);

      setMessage("Upload dan validasi geospasial berhasil.");

      setGeoSuccess({
        title: response.data.title,
        mapId: response.data.id,
        totalLayers: response.data.layers?.length || filesToUpload.length,
        metadata: response.data.geo_metadata,
      });

      setBatchFiles([]);
      setManualBaseFile(null);
      setManualSlots([]);
    } catch (error: any) {
      const detail = error.response?.data?.detail;

      if (typeof detail === "object" && detail !== null) {
        setGeoError(detail);

        setMessage(detail.message || "Validasi geospasial ditolak.");
      } else {
        setGeoError(null);

        setMessage(
          typeof detail === "string" && detail.length
            ? detail
            : "Upload gagal. Silakan periksa kembali file dan koneksi server."
        );
      }

      setIsSuccess(false);
      setGeoSuccess(null);
    } finally {
      setLoading(false);
    }
  };

  const totalSizeMB =
    uploadMode === "batch"
      ? batchFiles.reduce((total, item) => total + item.file.size, 0) /
        (1024 * 1024)
      : (manualBaseFile?.size || 0) / (1024 * 1024) +
        manualSlots.reduce((total, item) => total + (item.file?.size || 0), 0) /
          (1024 * 1024);

  const locationPresets = [
    "Paca, Halmahera Utara",
    "Tobelo, Halmahera Utara",
    "Galela, Halmahera Utara",
    "Kao Barat, Halmahera Utara",
  ];

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#123c28]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* =====================================================
            HEADER
        ====================================================== */}

        <header className="mb-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#91b928]" />

                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#123c28]/60">
                  UAV DaaS · GIS Multi-Layer Ingestion
                </span>
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-[#123c28] sm:text-3xl">
                Pusat Unggah{" "}
                <span className="text-[#1a5134]">Dataset Geospasial</span>
              </h1>

              <p className="mt-2 max-w-2xl text-xs leading-relaxed text-[#123c28]/60 sm:text-sm">
                Kelola dataset hasil pemotretan drone menjadi katalog geospasial
                multi-layer dengan deteksi tipe layer dan validasi CRS otomatis.
              </p>
            </div>

            <Link
              href="/dashboard/maps"
              className="inline-flex w-fit items-center gap-2 rounded-full border border-[#123c28]/15 bg-white px-4 py-2.5 text-xs font-bold text-[#123c28] shadow-sm transition hover:border-[#123c28]/25 hover:bg-[#f3f6ed]"
            >
              <Eye className="h-4 w-4" />
              Buka Map Viewer
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </header>

        {/* =====================================================
            MODE SELECTOR
        ====================================================== */}

        <div className="mb-6 rounded-2xl border border-[#123c28]/10 bg-white p-1.5 shadow-sm">
          <div className="grid gap-1.5 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setUploadMode("batch");
                setMessage("");
                setGeoError(null);
              }}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition ${
                uploadMode === "batch"
                  ? "bg-[#123c28] text-white shadow-md shadow-[#123c28]/10"
                  : "text-[#123c28]/60 hover:bg-[#f6f8f3] hover:text-[#123c28]"
              }`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  uploadMode === "batch" ? "bg-white/10" : "bg-[#f3f6ed]"
                }`}
              >
                <Layers className="h-4 w-4" />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-bold">Multi-File Batch</p>

                <p
                  className={`mt-0.5 text-[10px] leading-relaxed ${
                    uploadMode === "batch"
                      ? "text-white/65"
                      : "text-[#123c28]/45"
                  }`}
                >
                  Auto-detect Ortho, NDVI, NPK, DSM, dan multispektral.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setUploadMode("manual");
                setMessage("");
                setGeoError(null);
              }}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition ${
                uploadMode === "manual"
                  ? "bg-[#123c28] text-white shadow-md shadow-[#123c28]/10"
                  : "text-[#123c28]/60 hover:bg-[#f6f8f3] hover:text-[#123c28]"
              }`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  uploadMode === "manual" ? "bg-white/10" : "bg-[#f3f6ed]"
                }`}
              >
                <Sliders className="h-4 w-4" />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-bold">Manual Per-Layer</p>

                <p
                  className={`mt-0.5 text-[10px] leading-relaxed ${
                    uploadMode === "manual"
                      ? "text-white/65"
                      : "text-[#123c28]/45"
                  }`}
                >
                  Tentukan base layer dan layer analisis secara terstruktur.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* =====================================================
            MAIN
        ====================================================== */}

        <form
          onSubmit={handleSubmit}
          className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]"
        >
          {/* ===================================================
              LEFT CONTENT
          ==================================================== */}

          <div className="min-w-0 space-y-5">
            {/* =================================================
                FILE INGESTION
            ================================================== */}

            <section className="rounded-3xl border border-[#123c28]/10 bg-white p-5 shadow-sm sm:p-6">
              <SectionHeader
                icon={<Upload className="h-4 w-4" />}
                title={
                  uploadMode === "batch"
                    ? "Unggah GeoTIFF Multi-Layer"
                    : "Susun Layer Fotogrametri"
                }
                description="Format yang didukung adalah GeoTIFF (.tif / .tiff) dengan referensi spasial valid."
                right={
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#eef3e8] px-2.5 py-1.5 text-[10px] font-bold text-[#123c28]">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#1a5134]" />
                    CRS Verification
                  </span>
                }
              />

              {/* =============================================
                  BATCH
              ============================================== */}

              {uploadMode === "batch" && (
                <div className="space-y-5">
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`rounded-2xl border-2 border-dashed px-5 py-10 text-center transition ${
                      dragActive
                        ? "border-[#123c28] bg-[#f3f6ed]"
                        : "border-[#123c28]/15 bg-[#fbfcfa] hover:border-[#123c28]/25"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="multiFileInput"
                      multiple
                      accept=".tif,.tiff"
                      className="hidden"
                      onChange={handleFileInputChange}
                    />

                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef3e8] text-[#123c28]">
                      <Folder className="h-6 w-6" />
                    </div>

                    <h3 className="mt-4 text-sm font-bold text-[#123c28]">
                      Tarik & lepas GeoTIFF di sini
                    </h3>

                    <p className="mx-auto mt-1 max-w-md text-[11px] leading-relaxed text-[#123c28]/50">
                      Atau pilih beberapa file sekaligus untuk diproses sebagai
                      satu sesi survei multi-layer.
                    </p>

                    <label
                      htmlFor="multiFileInput"
                      className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#123c28] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#1a5134]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Pilih File
                    </label>

                    <p className="mt-3 text-[10px] text-[#123c28]/40">
                      .TIF / .TIFF · Maks. 5 GB per file
                    </p>
                  </div>

                  {/* Batch list */}

                  {batchFiles.length > 0 && (
                    <div>
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h3 className="text-xs font-bold text-[#123c28]">
                            Layer Terdeteksi
                          </h3>

                          <p className="mt-0.5 text-[10px] text-[#123c28]/45">
                            {batchFiles.length} file · {totalSizeMB.toFixed(1)}{" "}
                            MB
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setBatchFiles([])}
                          className="text-[10px] font-bold text-red-600 transition hover:text-red-700"
                        >
                          Hapus Semua
                        </button>
                      </div>

                      <div className="max-h-[470px] space-y-2.5 overflow-y-auto pr-1">
                        {batchFiles.map((item) => {
                          const config =
                            LAYER_TYPE_CONFIG[item.layer_type] ||
                            LAYER_TYPE_CONFIG.custom;

                          return (
                            <div
                              key={item.id}
                              className={`rounded-2xl border p-3.5 ${
                                item.is_base
                                  ? "border-emerald-300/70 bg-emerald-50/40"
                                  : "border-[#123c28]/10 bg-[#fbfcfa]"
                              }`}
                            >
                              <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                                <div className="min-w-0 flex-1">
                                  <div className="mb-2 flex flex-wrap items-center gap-1.5">
                                    <span
                                      className={`inline-flex rounded-full border px-2 py-1 text-[9px] font-bold ${config.badgeClass}`}
                                    >
                                      {config.label}
                                    </span>

                                    {item.is_base && (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-700 px-2 py-1 text-[9px] font-black text-white">
                                        <CheckCircle className="h-3 w-3" />
                                        BASE
                                      </span>
                                    )}

                                    <span className="text-[9px] font-medium text-[#123c28]/40">
                                      {formatFileSize(item.file.size)}
                                    </span>
                                  </div>

                                  <input
                                    type="text"
                                    value={item.name}
                                    onChange={(event) =>
                                      handleUpdateBatchItem(
                                        item.id,
                                        "name",
                                        event.target.value
                                      )
                                    }
                                    placeholder="Nama layer..."
                                    className="w-full rounded-xl border border-[#123c28]/10 bg-white px-3 py-2 text-xs font-bold text-[#123c28] outline-none transition placeholder:text-[#123c28]/25 focus:border-[#123c28]/30"
                                  />

                                  <p className="mt-1.5 truncate text-[10px] text-[#123c28]/40">
                                    {item.file.name}
                                  </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                                  <select
                                    value={item.layer_type}
                                    onChange={(event) =>
                                      handleUpdateBatchItem(
                                        item.id,
                                        "layer_type",
                                        event.target.value
                                      )
                                    }
                                    className="rounded-xl border border-[#123c28]/10 bg-white px-3 py-2 text-[10px] font-bold text-[#123c28] outline-none"
                                  >
                                    {layerOptions.map((option) => (
                                      <option
                                        key={option.value}
                                        value={option.value}
                                      >
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>

                                  {!item.is_base && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleSetBaseLayer(item.id)
                                      }
                                      className="rounded-xl border border-[#123c28]/10 bg-white px-3 py-2 text-[10px] font-bold text-[#123c28] transition hover:bg-[#eef3e8]"
                                    >
                                      Set Base
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoveBatchItem(item.id)
                                    }
                                    className="flex h-9 w-9 items-center justify-center rounded-xl text-red-600 transition hover:bg-red-50"
                                    title="Hapus layer"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div className="mt-3 flex items-center gap-3 border-t border-[#123c28]/10 pt-3">
                                <span className="shrink-0 text-[10px] font-semibold text-[#123c28]/50">
                                  Opasitas
                                </span>

                                <input
                                  type="range"
                                  min="0"
                                  max="1"
                                  step="0.05"
                                  value={item.default_opacity}
                                  onChange={(event) =>
                                    handleUpdateBatchItem(
                                      item.id,
                                      "default_opacity",
                                      parseFloat(event.target.value)
                                    )
                                  }
                                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-[#123c28]"
                                />

                                <span className="w-10 text-right text-[10px] font-bold text-[#123c28]">
                                  {Math.round(item.default_opacity * 100)}%
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* =============================================
                  MANUAL
              ============================================== */}

              {uploadMode === "manual" && (
                <div className="space-y-4">
                  {/* Base */}

                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-700 text-[10px] font-black text-white">
                          1
                        </span>

                        <div>
                          <p className="text-xs font-bold text-[#123c28]">
                            Base Layer · Ortho RGB
                          </p>

                          <p className="text-[10px] text-[#123c28]/45">
                            Wajib menjadi layer dasar visualisasi.
                          </p>
                        </div>
                      </div>

                      <span className="rounded-full bg-emerald-700 px-2 py-1 text-[9px] font-black uppercase text-white">
                        Wajib
                      </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-[10px] font-bold text-[#123c28]/65">
                          Nama Tampilan
                        </label>

                        <input
                          type="text"
                          value={manualBaseName}
                          onChange={(event) =>
                            setManualBaseName(event.target.value)
                          }
                          className="w-full rounded-xl border border-[#123c28]/10 bg-white px-3 py-2.5 text-xs font-bold text-[#123c28] outline-none focus:border-[#123c28]/30"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-[10px] font-bold text-[#123c28]/65">
                          File GeoTIFF
                        </label>

                        <input
                          type="file"
                          accept=".tif,.tiff"
                          onChange={(event) => {
                            if (event.target.files?.[0]) {
                              setManualBaseFile(event.target.files[0]);
                            }
                          }}
                          className="block w-full text-[10px] text-[#123c28]/60 file:mr-2 file:rounded-xl file:border-0 file:bg-[#123c28] file:px-3 file:py-2 file:text-[10px] file:font-bold file:text-white hover:file:bg-[#1a5134]"
                        />
                      </div>
                    </div>

                    {manualBaseFile && (
                      <div className="mt-3 flex items-center justify-between rounded-xl bg-white/75 px-3 py-2.5">
                        <span className="max-w-[75%] truncate text-[10px] font-medium text-[#123c28]/60">
                          {manualBaseFile.name}
                        </span>

                        <span className="text-[10px] font-bold text-[#123c28]">
                          {formatFileSize(manualBaseFile.size)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Additional slots */}

                  <div className="rounded-2xl border border-[#123c28]/10 bg-[#fbfcfa] p-4">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-bold text-[#123c28]">
                          Layer Analisis Tambahan
                        </p>

                        <p className="mt-0.5 text-[10px] text-[#123c28]/45">
                          Tambahkan indeks vegetasi, kandungan hara, DSM, atau
                          layer kustom.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddManualSlot}
                        className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#123c28]/15 bg-white px-3.5 py-2 text-[10px] font-bold text-[#123c28] transition hover:bg-[#eef3e8]"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Tambah Layer
                      </button>
                    </div>

                    <div className="space-y-3">
                      {manualSlots.map((slot, index) => {
                        const config =
                          LAYER_TYPE_CONFIG[slot.layer_type] ||
                          LAYER_TYPE_CONFIG.custom;

                        return (
                          <div
                            key={slot.id}
                            className="rounded-2xl border border-[#123c28]/10 bg-white p-3.5"
                          >
                            <div className="mb-3 flex items-center justify-between gap-3">
                              <div className="flex min-w-0 items-center gap-2">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#eef3e8] text-[10px] font-bold text-[#123c28]">
                                  {index + 2}
                                </span>

                                <span
                                  className={`truncate rounded-full border px-2 py-1 text-[9px] font-bold ${config.badgeClass}`}
                                >
                                  {config.label}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemoveManualSlot(slot.id)}
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-red-600 transition hover:bg-red-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                              <div>
                                <label className="mb-1.5 block text-[10px] font-bold text-[#123c28]/55">
                                  Tipe Layer
                                </label>

                                <select
                                  value={slot.layer_type}
                                  onChange={(event) =>
                                    handleUpdateManualSlot(
                                      slot.id,
                                      "layer_type",
                                      event.target.value
                                    )
                                  }
                                  className="w-full rounded-xl border border-[#123c28]/10 bg-[#fbfcfa] px-3 py-2.5 text-[10px] font-bold text-[#123c28] outline-none"
                                >
                                  {manualLayerOptions.map((option) => (
                                    <option
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="mb-1.5 block text-[10px] font-bold text-[#123c28]/55">
                                  Nama Tampilan
                                </label>

                                <input
                                  type="text"
                                  value={slot.name}
                                  onChange={(event) =>
                                    handleUpdateManualSlot(
                                      slot.id,
                                      "name",
                                      event.target.value
                                    )
                                  }
                                  className="w-full rounded-xl border border-[#123c28]/10 bg-[#fbfcfa] px-3 py-2.5 text-xs font-bold text-[#123c28] outline-none focus:border-[#123c28]/30"
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <label className="mb-1.5 block text-[10px] font-bold text-[#123c28]/55">
                                  File TIF / TIFF
                                </label>

                                <input
                                  type="file"
                                  accept=".tif,.tiff"
                                  onChange={(event) => {
                                    if (event.target.files?.[0]) {
                                      handleUpdateManualSlot(
                                        slot.id,
                                        "file",
                                        event.target.files[0]
                                      );
                                    }
                                  }}
                                  className="block w-full text-[10px] text-[#123c28]/50 file:mr-2 file:rounded-xl file:border-0 file:bg-[#123c28] file:px-3 file:py-2 file:text-[10px] file:font-bold file:text-white"
                                />
                              </div>
                            </div>

                            <div className="mt-3 flex items-center gap-3 border-t border-[#123c28]/10 pt-3">
                              <span className="shrink-0 text-[10px] font-semibold text-[#123c28]/50">
                                Opasitas
                              </span>

                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={slot.default_opacity}
                                onChange={(event) =>
                                  handleUpdateManualSlot(
                                    slot.id,
                                    "default_opacity",
                                    parseFloat(event.target.value)
                                  )
                                }
                                className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-[#123c28]"
                              />

                              <span className="w-10 text-right text-[10px] font-bold text-[#123c28]">
                                {Math.round(slot.default_opacity * 100)}%
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      {manualSlots.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-[#123c28]/10 px-4 py-8 text-center">
                          <Layers className="mx-auto h-6 w-6 text-[#123c28]/20" />

                          <p className="mt-2 text-[11px] font-semibold text-[#123c28]/45">
                            Belum ada layer tambahan
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* =============================================
                  PROGRESS
              ============================================== */}

              {loading && (
                <div className="mt-5 rounded-2xl border border-[#123c28]/10 bg-[#f6f8f3] p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <RefreshCw className="h-3.5 w-3.5 shrink-0 animate-spin" />

                      <span className="truncate text-[10px] font-bold text-[#123c28]">
                        {uploadProgress >= 99
                          ? "Memvalidasi CRS, bounds spasial, dan metadata GeoTIFF..."
                          : "Mengunggah dataset..."}
                      </span>
                    </div>

                    <span className="shrink-0 text-[10px] font-bold">
                      {uploadProgress}%
                    </span>
                  </div>

                  <div className="h-1.5 overflow-hidden rounded-full bg-[#123c28]/10">
                    <div
                      className="h-full rounded-full bg-[#123c28] transition-all duration-300"
                      style={{
                        width: `${uploadProgress}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </section>

            {/* =================================================
                METADATA
            ================================================== */}

            <section className="rounded-3xl border border-[#123c28]/10 bg-white p-5 shadow-sm sm:p-6">
              <SectionHeader
                icon={<FileText className="h-4 w-4" />}
                title="Informasi Sesi Survei"
                description="Metadata yang digunakan untuk katalog, identifikasi lahan, dan pengaturan akses dataset."
              />

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-[#123c28]/55">
                    Judul Peta / Sesi
                  </label>

                  <input
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    required
                    placeholder="Contoh: Survei Fotogrametri Perkebunan Paca - Blok A"
                    className="w-full rounded-xl border border-[#123c28]/10 bg-[#fbfcfa] px-3.5 py-3 text-xs font-bold text-[#123c28] outline-none transition placeholder:text-[#123c28]/25 focus:border-[#123c28]/30"
                  />
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <label className="block text-[10px] font-bold uppercase tracking-wide text-[#123c28]/55">
                      Lokasi Survei
                    </label>

                    <span className="text-[9px] font-bold text-[#1a5134]">
                      Preset Halmahera Utara
                    </span>
                  </div>

                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {locationPresets.map((preset) => {
                      const shortName = preset.split(",")[0];

                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setLocation(preset);

                            if (!title) {
                              setTitle(`Survei Pertanian ${preset}`);
                            }
                          }}
                          className={`rounded-full border px-2.5 py-1.5 text-[9px] font-bold transition ${
                            location === preset
                              ? "border-[#123c28] bg-[#123c28] text-white"
                              : "border-[#123c28]/10 bg-white text-[#123c28]/60 hover:bg-[#f3f6ed]"
                          }`}
                        >
                          {shortName}
                        </button>
                      );
                    })}
                  </div>

                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#123c28]/25" />

                    <input
                      type="text"
                      value={location}
                      onChange={(event) => setLocation(event.target.value)}
                      required
                      placeholder="Paca, Halmahera Utara"
                      className="w-full rounded-xl border border-[#123c28]/10 bg-[#fbfcfa] py-3 pl-9 pr-3 text-xs font-bold text-[#123c28] outline-none focus:border-[#123c28]/30"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-[#123c28]/55">
                      Tanggal Penerbangan
                    </label>

                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#123c28]/25" />

                      <input
                        type="date"
                        value={surveyDate}
                        onChange={(event) => setSurveyDate(event.target.value)}
                        required
                        className="w-full rounded-xl border border-[#123c28]/10 bg-[#fbfcfa] py-3 pl-9 pr-3 text-xs font-bold text-[#123c28] outline-none focus:border-[#123c28]/30"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-[#123c28]/55">
                      Deskripsi
                    </label>

                    <input
                      type="text"
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Ketinggian 120m AGL, sensor multispektral..."
                      className="w-full rounded-xl border border-[#123c28]/10 bg-[#fbfcfa] px-3 py-3 text-xs text-[#123c28] outline-none placeholder:text-[#123c28]/25 focus:border-[#123c28]/30"
                    />
                  </div>
                </div>

                <div className="border-t border-[#123c28]/10 pt-4">
                  <div className="space-y-3">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={lockedForFree}
                        onChange={(event) =>
                          setLockedForFree(event.target.checked)
                        }
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#123c28] focus:ring-[#123c28]"
                      />

                      <div>
                        <span className="block text-[11px] font-bold text-[#123c28]">
                          Kunci akses Member Free
                        </span>

                        <span className="block text-[10px] leading-relaxed text-[#123c28]/45">
                          Dataset hanya dapat diakses oleh tier berbayar.
                        </span>
                      </div>
                    </label>

                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={purchasable}
                        onChange={(event) =>
                          setPurchasable(event.target.checked)
                        }
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#123c28] focus:ring-[#123c28]"
                      />

                      <div>
                        <span className="block text-[11px] font-bold text-[#123c28]">
                          Aktifkan pembelian satuan
                        </span>

                        <span className="block text-[10px] leading-relaxed text-[#123c28]/45">
                          Member dapat membeli akses dataset secara
                          pay-per-view.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </section>

            {/* =================================================
                ERROR
            ================================================== */}

            {!isSuccess && (geoError || message) && (
              <section className="rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-red-600">
                    <AlertCircle className="h-4.5 w-4.5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-red-900">
                      {geoError?.message ||
                        message ||
                        "Validasi Geospasial Ditolak"}
                    </p>

                    {geoError?.details?.missing_requirements && (
                      <ul className="mt-2 space-y-1 pl-4 text-[10px] leading-relaxed text-red-800">
                        {geoError.details.missing_requirements.map(
                          (requirement, index) => (
                            <li key={index} className="list-disc">
                              {requirement}
                            </li>
                          )
                        )}
                      </ul>
                    )}

                    {geoError?.details?.solution && (
                      <div className="mt-3 rounded-xl border border-red-100 bg-white/70 p-3">
                        <p className="text-[10px] leading-relaxed text-red-900">
                          <strong>Solusi GIS:</strong>{" "}
                          {geoError.details.solution}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* =================================================
                SUCCESS
            ================================================== */}

            {isSuccess && geoSuccess && (
              <section className="rounded-3xl bg-[#123c28] p-5 text-white shadow-xl sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                    <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="inline-flex rounded-full bg-emerald-500/15 px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-emerald-300">
                      Validasi Spasial Lolos
                    </span>

                    <h3 className="mt-2 text-base font-bold">
                      {geoSuccess.title}
                    </h3>

                    <p className="mt-1 text-[11px] leading-relaxed text-white/65">
                      {geoSuccess.totalLayers} layer berhasil disimpan dan
                      diproses menuju arsip PMTiles di background.
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href={`/dashboard/maps?id=${geoSuccess.mapId}`}
                        className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[10px] font-black text-[#123c28] transition hover:bg-[#eef3e8]"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Buka di Map Viewer
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          setIsSuccess(false);
                          setGeoSuccess(null);
                        }}
                        className="rounded-full border border-white/15 px-4 py-2.5 text-[10px] font-bold text-white transition hover:bg-white/10"
                      >
                        Unggah Survei Lainnya
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* =================================================
                SUBMIT
            ================================================== */}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#123c28] px-5 py-4 text-xs font-bold text-white shadow-lg shadow-[#123c28]/10 transition hover:bg-[#1a5134] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Memproses Dataset...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Validasi & Unggah Dataset
                </>
              )}
            </button>
          </div>

          {/* ===================================================
              RIGHT SIDEBAR
          ==================================================== */}

          <aside className="space-y-5">
            {/* ===============================================
                GUIDANCE
            ================================================ */}

            <section className="rounded-3xl border border-[#123c28]/10 bg-white p-5 shadow-sm sm:p-6">
              <SectionHeader
                icon={<Compass className="h-4 w-4" />}
                title="Panduan Layer GIS"
                description="Struktur layer yang direkomendasikan untuk dataset UAV."
              />

              <div className="space-y-2.5">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/45 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-emerald-900">
                      01 · Base Ortho RGB
                    </span>

                    <span className="rounded-full bg-white/70 px-2 py-1 text-[8px] font-bold text-emerald-700">
                      BASE
                    </span>
                  </div>

                  <p className="mt-1.5 text-[10px] leading-relaxed text-emerald-800/80">
                    Citra mosaik visual utama dengan band merah, hijau, dan
                    biru.
                  </p>
                </div>

                <div className="rounded-2xl border border-lime-200 bg-lime-50/45 p-3">
                  <span className="text-[10px] font-bold text-lime-900">
                    02 · NDVI / VARI
                  </span>

                  <p className="mt-1.5 text-[10px] leading-relaxed text-lime-800/80">
                    Menunjukkan kondisi dan kepadatan vegetasi berdasarkan
                    analisis spektral.
                  </p>
                </div>

                <div className="rounded-2xl border border-violet-200 bg-violet-50/45 p-3">
                  <span className="text-[10px] font-bold text-violet-900">
                    03 · NPK
                  </span>

                  <p className="mt-1.5 text-[10px] leading-relaxed text-violet-800/80">
                    Layer kandungan Nitrogen, Fosfor, dan Kalium untuk analisis
                    pertanian presisi.
                  </p>
                </div>

                <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-3">
                  <span className="text-[10px] font-bold text-stone-900">
                    04 · DSM
                  </span>

                  <p className="mt-1.5 text-[10px] leading-relaxed text-stone-800/80">
                    Model elevasi permukaan untuk melihat topografi dan
                    ketinggian vegetasi.
                  </p>
                </div>

                <div className="rounded-2xl border border-sky-200 bg-sky-50/45 p-3">
                  <span className="text-[10px] font-bold text-sky-900">
                    05 · Multispektral
                  </span>

                  <p className="mt-1.5 text-[10px] leading-relaxed text-sky-800/80">
                    Saluran spektral seperti NIR dan Red Edge untuk kebutuhan
                    analisis lanjutan.
                  </p>
                </div>
              </div>
            </section>

            {/* ===============================================
                GEOSTREAM
            ================================================ */}

            <section className="rounded-3xl border border-[#123c28]/10 bg-[#f3f6ed] p-5 sm:p-6">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm">
                  <Sparkles className="h-4 w-4 text-[#123c28]" />
                </div>

                <div>
                  <h3 className="text-xs font-bold text-[#123c28]">
                    AMX GeoStream™
                  </h3>

                  <p className="text-[9px] text-[#123c28]/45">
                    Streaming-ready geospatial engine
                  </p>
                </div>
              </div>

              <p className="text-[10px] leading-relaxed text-[#123c28]/70">
                Dataset orthomosaic dan multispektral berukuran besar diproses
                menjadi struktur spasial terindeks untuk kebutuhan visualisasi
                multi-layer.
              </p>

              <div className="mt-4 flex items-center justify-between rounded-xl bg-white/70 px-3 py-2.5">
                <span className="text-[9px] font-bold text-[#123c28]/55">
                  Engine Status
                </span>

                <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  AMX Stream Core · HTTP 206
                </span>
              </div>
            </section>

            {/* ===============================================
                WORKFLOW INFO
            ================================================ */}

            <section className="rounded-3xl border border-[#123c28]/10 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#123c28]" />

                <h3 className="text-xs font-bold text-[#123c28]">
                  Alur Validasi
                </h3>
              </div>

              <div className="space-y-3">
                {[
                  "File GeoTIFF diterima server",
                  "Header dan metadata spasial diperiksa",
                  "CRS dan spatial bounds divalidasi",
                  "Layer didaftarkan ke dataset",
                  "Konversi PMTiles berjalan di background",
                ].map((step, index) => (
                  <div key={step} className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#f3f6ed] text-[8px] font-black text-[#123c28]">
                      {index + 1}
                    </span>

                    <p className="text-[10px] leading-relaxed text-[#123c28]/55">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </form>
      </div>
    </main>
  );
}
