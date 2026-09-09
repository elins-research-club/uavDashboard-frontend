"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUserRole } from "@/context/UserRoleContext";
import {
  Upload,
  FileText,
  MapPin,
  Lock,
  CheckCircle,
  CheckCircle2,
  Database,
  Calendar,
  Info,
  X,
  Folder,
  AlertCircle,
  AlertTriangle,
  Compass,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Activity,
  ScanLine,
  Layers,
  Sliders,
  Plus,
  Trash2,
  Sparkles,
  Eye,
} from "lucide-react";
import api from "@/lib/api";
import { GeoMetadata, ErrorDetailObject } from "@/types/map";

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
  { label: string; badgeClass: string; defaultName: string; defaultOpacity: number }
> = {
  ortho: {
    label: "Citra Ortho RGB",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-300",
    defaultName: "Citra Ortho RGB",
    defaultOpacity: 1.0,
  },
  ndvi: {
    label: "Indeks Vegetasi (NDVI)",
    badgeClass: "bg-lime-50 text-lime-800 border-lime-300",
    defaultName: "Indeks Vegetasi (NDVI)",
    defaultOpacity: 0.85,
  },
  vari: {
    label: "Indeks Vegetasi (VARI)",
    badgeClass: "bg-teal-50 text-teal-800 border-teal-300",
    defaultName: "Indeks Vegetasi (VARI)",
    defaultOpacity: 0.85,
  },
  nitrogen: {
    label: "Kandungan Nitrogen (N)",
    badgeClass: "bg-violet-50 text-violet-800 border-violet-300",
    defaultName: "Kandungan Nitrogen (N)",
    defaultOpacity: 0.75,
  },
  phosphorus: {
    label: "Kandungan Fosfor (P)",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-300",
    defaultName: "Kandungan Fosfor (P)",
    defaultOpacity: 0.75,
  },
  kalium: {
    label: "Kandungan Kalium (K)",
    badgeClass: "bg-rose-50 text-rose-800 border-rose-300",
    defaultName: "Kandungan Kalium (K)",
    defaultOpacity: 0.75,
  },
  dsm: {
    label: "Model Elevasi (DSM)",
    badgeClass: "bg-stone-100 text-stone-800 border-stone-300",
    defaultName: "Model Elevasi (DSM)",
    defaultOpacity: 0.7,
  },
  spectral: {
    label: "Saluran Multispektral",
    badgeClass: "bg-sky-50 text-sky-800 border-sky-300",
    defaultName: "Saluran Multispektral",
    defaultOpacity: 0.8,
  },
  custom: {
    label: "Layer Tematik Kustom",
    badgeClass: "bg-gray-100 text-gray-800 border-gray-300",
    defaultName: "Layer Tematik",
    defaultOpacity: 0.8,
  },
};

function autoDetectLayer(filename: string): {
  layer_type: string;
  name: string;
  is_base: boolean;
  default_opacity: number;
} {
  const fn = filename.toLowerCase();

  if (/ortho|rgb|citra|foto|mosaic|mosaik/.test(fn)) {
    return {
      layer_type: "ortho",
      name: "Citra Ortho RGB",
      is_base: true,
      default_opacity: 1.0,
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
  if (/nitrogen|[\b_-]n[\b_\.\-]|n_ppm/.test(fn)) {
    return {
      layer_type: "nitrogen",
      name: "Kandungan Nitrogen (N)",
      is_base: false,
      default_opacity: 0.75,
    };
  }
  if (/phosphor|fosfor|[\b_-]p[\b_\.\-]|p_ppm/.test(fn)) {
    return {
      layer_type: "phosphorus",
      name: "Kandungan Fosfor (P)",
      is_base: false,
      default_opacity: 0.75,
    };
  }
  if (/kalium|potassium|[\b_-]k[\b_\.\-]|k_ppm/.test(fn)) {
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
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    layer_type: "custom",
    name: cleanName || "Layer Tematik",
    is_base: false,
    default_opacity: 0.8,
  };
}

export default function UploadPage() {
  const router = useRouter();
  const { user } = useUserRole();

  // Mode Selection: "batch" (Mode 1: Multi-file Auto) | "manual" (Mode 2: Slot Manual)
  const [uploadMode, setUploadMode] = useState<"batch" | "manual">("batch");

  // Common Survey Form States
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [surveyDate, setSurveyDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [description, setDescription] = useState("");
  const [lockedForFree, setLockedForFree] = useState(false);
  const [purchasable, setPurchasable] = useState(false);

  // Mode 1: Batch Files State
  const [batchFiles, setBatchFiles] = useState<BatchFileItem[]>([]);
  const [dragActive, setDragActive] = useState(false);

  // Mode 2: Manual Slots State
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

  // Submission & Progress State
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

  // Handle Drag & Drop for Mode 1
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processIncomingFiles = (incoming: FileList | File[]) => {
    const validFiles: File[] = [];
    Array.from(incoming).forEach((f) => {
      const ext = f.name.toLowerCase();
      if (ext.endsWith(".tif") || ext.endsWith(".tiff")) {
        validFiles.push(f);
      }
    });

    if (validFiles.length === 0) {
      setMessage("Hanya file berekstensi .tif atau .tiff yang didukung.");
      return;
    }

    const newItems: BatchFileItem[] = validFiles.map((file, idx) => {
      const auto = autoDetectLayer(file.name);
      return {
        id: `${Date.now()}-${idx}-${Math.random()}`,
        file,
        name: auto.name,
        layer_type: auto.layer_type,
        is_base: auto.is_base,
        default_opacity: auto.default_opacity,
      };
    });

    setBatchFiles((prev) => {
      const combined = [...prev, ...newItems];
      // Pastikan tepat ada satu base layer
      const hasBase = combined.some((it) => it.is_base);
      if (!hasBase && combined.length > 0) {
        combined[0].is_base = true;
      }
      return combined;
    });

    // Auto-suggest title jika belum terisi
    if (!title && validFiles.length > 0) {
      const firstClean = validFiles[0].name
        .replace(/\.[^/.]+$/, "")
        .replace(/[_-]/g, " ")
        .replace(/ortho|rgb|citra|ndvi|dsm/gi, "")
        .trim();
      if (firstClean) {
        setTitle(`Survei Fotogrametri ${firstClean}`);
      }
    }

    setMessage("");
    setGeoError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processIncomingFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processIncomingFiles(e.target.files);
    }
  };

  const handleSetBaseLayer = (id: string) => {
    setBatchFiles((prev) =>
      prev.map((item) => ({
        ...item,
        is_base: item.id === id,
        layer_type: item.id === id ? "ortho" : item.layer_type,
        default_opacity: item.id === id ? 1.0 : item.default_opacity,
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
        const updated = { ...item, [field]: value };
        if (field === "layer_type") {
          const cfg = LAYER_TYPE_CONFIG[value as string];
          if (cfg) {
            updated.default_opacity = cfg.defaultOpacity;
            if (
              !item.name ||
              Object.values(LAYER_TYPE_CONFIG).some((c) => c.defaultName === item.name)
            ) {
              updated.name = cfg.defaultName;
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
      if (filtered.length > 0 && !filtered.some((it) => it.is_base)) {
        filtered[0].is_base = true;
      }
      return filtered;
    });
  };

  // Mode 2: Slot Management
  const handleAddManualSlot = () => {
    const newId = `slot-${Date.now()}`;
    setManualSlots((prev) => [
      ...prev,
      {
        id: newId,
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
        const updated = { ...slot, [field]: value };
        if (field === "layer_type") {
          const cfg = LAYER_TYPE_CONFIG[value as string];
          if (cfg) {
            updated.default_opacity = cfg.defaultOpacity;
            if (
              !slot.name ||
              Object.values(LAYER_TYPE_CONFIG).some((c) => c.defaultName === slot.name)
            ) {
              updated.name = cfg.defaultName;
            }
          }
        }
        return updated;
      })
    );
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi file sesuai mode
    let filesToUpload: File[] = [];
    let layersConfigPayload: any[] = [];

    if (uploadMode === "batch") {
      if (batchFiles.length === 0) {
        setMessage("Silakan pilih minimal 1 file GeoTIFF terlebih dahulu.");
        return;
      }
      filesToUpload = batchFiles.map((item) => item.file);
      layersConfigPayload = batchFiles.map((item, idx) => ({
        filename: item.file.name,
        name: item.name || `Layer ${idx + 1}`,
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
        default_opacity: 1.0,
        is_base: true,
      });

      manualSlots.forEach((slot) => {
        if (slot.file) {
          filesToUpload.push(slot.file);
          layersConfigPayload.push({
            filename: slot.file.name,
            name: slot.name || slot.layer_type,
            layer_type: slot.layer_type,
            default_opacity: slot.default_opacity,
            is_base: false,
          });
        }
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
    if (description) formData.append("description", description);
    formData.append("locked_for_free", lockedForFree ? "true" : "false");
    formData.append("purchasable", purchasable ? "true" : "false");
    formData.append("layers_config", JSON.stringify(layersConfigPayload));

    filesToUpload.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const res = await api.post("/maps/batch", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: ({ loaded, total }) => {
          if (total) {
            const pct = Math.round((loaded * 100) / total);
            setUploadProgress(pct >= 100 ? 99 : pct);
          }
        },
      });

      setUploadProgress(100);
      setIsSuccess(true);
      setMessage(
        "Upload & Validasi Geospasial Berhasil! Seluruh layer telah didaftarkan dan sedang dikonversi ke PMTiles secara otomatis di background."
      );
      setGeoSuccess({
        title: res.data.title,
        mapId: res.data.id,
        totalLayers: res.data.layers?.length || filesToUpload.length,
        metadata: res.data.geo_metadata,
      });

      // Reset state
      setBatchFiles([]);
      setManualBaseFile(null);
      setManualSlots([]);
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      if (typeof detail === "object" && detail !== null) {
        setGeoError(detail);
        setMessage(detail.message || "Validasi Geospasial Ditolak");
      } else {
        setGeoError(null);
        setMessage(
          typeof detail === "string" && detail.length > 0
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

  const totalBatchSizeMB =
    uploadMode === "batch"
      ? batchFiles.reduce((acc, it) => acc + it.file.size, 0) / (1024 * 1024)
      : (manualBaseFile ? manualBaseFile.size : 0) / (1024 * 1024) +
        manualSlots.reduce((acc, it) => acc + (it.file ? it.file.size : 0), 0) /
          (1024 * 1024);

  return (
    <main className="min-h-screen bg-[#fafbf9] text-[#123c28]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* =====================================================
            TOP HEADER
        ====================================================== */}
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#123c28]/10 pb-5">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#91b928] animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#123c28]/75">
                UAV DaaS • GIS MULTI-LAYER INGESTION
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-[#123c28] sm:text-3xl">
              Pusat Unggah <span className="text-[#1a5134]">Dataset Geospasial</span>
            </h1>

            <p className="mt-1 text-xs font-medium text-[#123c28]/70">
              Unggah dataset foto udara fotogrametri drone dengan engine auto-detect layer
              (Ortho, NDVI, NPK, DSM) dan validasi proyeksi CRS terpadu.
            </p>
          </div>

          <Link
            href="/dashboard/maps"
            className="inline-flex items-center gap-2 rounded-full border border-[#123c28]/20 bg-white px-4 py-2 text-xs font-bold text-[#123c28] shadow-sm transition hover:bg-[#f3f6ed]"
          >
            <Eye className="h-4 w-4 text-[#1a5134]" />
            Buka Map Viewer
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </header>

        {/* =====================================================
            MODE SELECTOR TABS
        ====================================================== */}
        <div className="mb-6 rounded-2xl border border-[#123c28]/15 bg-white p-2 shadow-sm">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setUploadMode("batch");
                setMessage("");
              }}
              className={`flex items-center justify-center gap-2.5 rounded-xl px-4 py-3 text-xs font-bold transition-all ${
                uploadMode === "batch"
                  ? "bg-[#123c28] text-white shadow-md shadow-[#123c28]/20"
                  : "bg-transparent text-[#123c28]/70 hover:bg-[#f3f6ed] hover:text-[#123c28]"
              }`}
            >
              <Layers className="h-4 w-4" />
              <div className="text-left">
                <p className="leading-tight">Mode 1: Multi-File Batch (Otomatis)</p>
                <p className="text-[10px] font-normal opacity-80">
                  Drag & drop banyak file TIF sekaligus (Auto-detect Ortho, NDVI, NPK)
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setUploadMode("manual");
                setMessage("");
              }}
              className={`flex items-center justify-center gap-2.5 rounded-xl px-4 py-3 text-xs font-bold transition-all ${
                uploadMode === "manual"
                  ? "bg-[#123c28] text-white shadow-md shadow-[#123c28]/20"
                  : "bg-transparent text-[#123c28]/70 hover:bg-[#f3f6ed] hover:text-[#123c28]"
              }`}
            >
              <Sliders className="h-4 w-4" />
              <div className="text-left">
                <p className="leading-tight">Mode 2: Input Slot Per-Layer (Manual)</p>
                <p className="text-[10px] font-normal opacity-80">
                  Atur Base Ortho slot + slot layer tematik satu per satu secara terstruktur
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* =====================================================
            MAIN FORM & WORKSPACE
        ====================================================== */}
        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* =====================================================
                SECTION: FILE INGESTION AREA
            ====================================================== */}
            <section className="rounded-3xl border border-[#123c28]/15 bg-white p-5 sm:p-7 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f3f6ed] text-[#123c28]">
                    <Upload className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#123c28]">
                      {uploadMode === "batch"
                        ? "Pilih File GeoTIFF Multi-Layer"
                        : "Slot Layer Fotogrametri Terstruktur"}
                    </h2>
                    <p className="text-[11px] text-[#123c28]/65">
                      Format wajib: GeoTIFF (.tif/.tiff) berkoordinat spasial valid
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 rounded-full bg-[#eef3e8] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#123c28]">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#1a5134]" />
                  Auto CRS Verification
                </span>
              </div>

              {/* MODE 1: MULTI-FILE BATCH DROPZONE */}
              {uploadMode === "batch" && (
                <div className="space-y-4">
                  <div
                    className={`relative rounded-2xl border-2 border-dashed p-7 text-center transition-all ${
                      dragActive
                        ? "border-[#123c28] bg-[#f3f6ed]"
                        : "border-[#123c28]/25 bg-[#fafbf8] hover:border-[#123c28]/40"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
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

                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef3e8] text-[#123c28]">
                      <Folder className="h-6 w-6" />
                    </div>

                    <p className="text-sm font-bold text-[#123c28]">
                      Tarik & lepas file GeoTIFF Anda ke area ini
                    </p>
                    <p className="mt-1 text-xs text-[#123c28]/70">
                      Bisa langsung pilih banyak file sekaligus (Ortho RGB, NDVI, N, P, K, DSM, Spektral)
                    </p>

                    <div className="mt-4 flex items-center justify-center gap-3">
                      <label
                        htmlFor="multiFileInput"
                        className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#123c28] px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1a5134]"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Pilih File dari Komputer
                      </label>
                    </div>

                    <p className="mt-3 text-[11px] text-[#123c28]/55">
                      Ukuran maksimum: 5 GB per file • Auto-rescale nilai float32
                    </p>
                  </div>

                  {/* BATCH PREVIEW LIST */}
                  {batchFiles.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between border-b border-[#123c28]/10 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#123c28]">
                            Daftar Layer Terdeteksi ({batchFiles.length} file)
                          </span>
                          <span className="rounded-full bg-[#eef3e8] px-2 py-0.5 text-[10px] font-bold text-[#123c28]">
                            Total: {totalBatchSizeMB.toFixed(1)} MB
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setBatchFiles([])}
                          className="text-[11px] font-semibold text-red-600 hover:underline"
                        >
                          Hapus Semua
                        </button>
                      </div>

                      <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                        {batchFiles.map((item) => {
                          const cfg =
                            LAYER_TYPE_CONFIG[item.layer_type] ||
                            LAYER_TYPE_CONFIG.custom;

                          return (
                            <div
                              key={item.id}
                              className={`rounded-2xl border p-3.5 transition-all ${
                                item.is_base
                                  ? "border-emerald-500/60 bg-emerald-50/40 shadow-sm"
                                  : "border-[#123c28]/15 bg-[#fafbf8]"
                              }`}
                            >
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="space-y-1 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span
                                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${cfg.badgeClass}`}
                                    >
                                      {cfg.label}
                                    </span>

                                    {item.is_base && (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-700 px-2 py-0.5 text-[10px] font-black text-white">
                                        <CheckCircle className="h-3 w-3" />
                                        BASE LAYER
                                      </span>
                                    )}

                                    <span className="text-[10px] font-mono text-[#123c28]/60">
                                      {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={item.name}
                                      onChange={(e) =>
                                        handleUpdateBatchItem(
                                          item.id,
                                          "name",
                                          e.target.value
                                        )
                                      }
                                      placeholder="Nama tampilan layer..."
                                      className="w-full rounded-lg border border-[#123c28]/15 bg-white px-2.5 py-1 text-xs font-bold text-[#123c28] focus:border-[#123c28] focus:outline-none"
                                    />
                                  </div>

                                  <p className="text-[10px] font-medium text-[#123c28]/50 truncate max-w-sm">
                                    File asli: {item.file.name}
                                  </p>
                                </div>

                                <div className="flex items-center gap-3 self-end sm:self-center">
                                  {/* Type Dropdown */}
                                  <select
                                    value={item.layer_type}
                                    onChange={(e) =>
                                      handleUpdateBatchItem(
                                        item.id,
                                        "layer_type",
                                        e.target.value
                                      )
                                    }
                                    className="rounded-lg border border-[#123c28]/15 bg-white px-2 py-1 text-[11px] font-bold text-[#123c28] focus:outline-none"
                                  >
                                    <option value="ortho">Citra Ortho RGB</option>
                                    <option value="ndvi">NDVI (Vegetasi)</option>
                                    <option value="vari">VARI</option>
                                    <option value="nitrogen">Nitrogen (N)</option>
                                    <option value="phosphorus">Fosfor (P)</option>
                                    <option value="kalium">Kalium (K)</option>
                                    <option value="dsm">DSM (Elevasi)</option>
                                    <option value="spectral">Multispektral</option>
                                    <option value="custom">Layer Kustom</option>
                                  </select>

                                  {/* Set as Base Button */}
                                  {!item.is_base && (
                                    <button
                                      type="button"
                                      onClick={() => handleSetBaseLayer(item.id)}
                                      className="rounded-lg border border-[#123c28]/20 bg-white px-2.5 py-1 text-[10px] font-bold text-[#123c28] hover:bg-[#eef3e8]"
                                      title="Jadikan sebagai citra dasar peta"
                                    >
                                      Set Base
                                    </button>
                                  )}

                                  {/* Delete Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveBatchItem(item.id)}
                                    className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                                    title="Hapus file ini"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Opacity Slider per Layer */}
                              <div className="mt-2 flex items-center gap-2 border-t border-[#123c28]/10 pt-2 text-[10px]">
                                <span className="font-semibold text-[#123c28]/70">
                                  Opasitas Awal:
                                </span>
                                <input
                                  type="range"
                                  min="0"
                                  max="1"
                                  step="0.05"
                                  value={item.default_opacity}
                                  onChange={(e) =>
                                    handleUpdateBatchItem(
                                      item.id,
                                      "default_opacity",
                                      parseFloat(e.target.value)
                                    )
                                  }
                                  className="h-1.5 w-28 cursor-pointer appearance-none rounded-lg bg-gray-200 accent-[#123c28]"
                                />
                                <span className="font-mono font-bold text-[#123c28]">
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

              {/* MODE 2: MANUAL SLOT-BY-SLOT UPLOAD */}
              {uploadMode === "manual" && (
                <div className="space-y-4">
                  {/* Base Slot (Required) */}
                  <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/30 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-700 text-[10px] font-black text-white">
                          1
                        </span>
                        <span className="text-xs font-bold text-[#123c28]">
                          Slot Wajib: Citra Ortho RGB Utama (Base Layer)
                        </span>
                      </div>
                      <span className="rounded-full bg-emerald-700 px-2 py-0.5 text-[9px] font-black uppercase text-white">
                        Wajib
                      </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-[11px] font-bold text-[#123c28]/75 mb-1">
                          Nama Tampilan Base Layer:
                        </label>
                        <input
                          type="text"
                          value={manualBaseName}
                          onChange={(e) => setManualBaseName(e.target.value)}
                          className="w-full rounded-xl border border-[#123c28]/15 bg-white px-3 py-2 text-xs font-bold text-[#123c28]"
                          placeholder="Citra Ortho RGB Utama"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#123c28]/75 mb-1">
                          File GeoTIFF Ortho:
                        </label>
                        <input
                          type="file"
                          accept=".tif,.tiff"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setManualBaseFile(e.target.files[0]);
                            }
                          }}
                          className="w-full text-xs text-[#123c28] file:mr-2 file:rounded-lg file:border-0 file:bg-[#123c28] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[#1a5134]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Additional Slots */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#123c28]">
                        Slot Layer Analisis Tambahan ({manualSlots.length} slot)
                      </span>

                      <button
                        type="button"
                        onClick={handleAddManualSlot}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#123c28]/20 bg-white px-3 py-1.5 text-xs font-bold text-[#123c28] hover:bg-[#eef3e8]"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Tambah Slot Layer
                      </button>
                    </div>

                    {manualSlots.map((slot, index) => {
                      const cfg =
                        LAYER_TYPE_CONFIG[slot.layer_type] ||
                        LAYER_TYPE_CONFIG.custom;

                      return (
                        <div
                          key={slot.id}
                          className="rounded-2xl border border-[#123c28]/15 bg-[#fafbf8] p-3.5 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#123c28]/15 text-[10px] font-bold text-[#123c28]">
                                {index + 2}
                              </span>
                              <span
                                className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${cfg.badgeClass}`}
                              >
                                {cfg.label}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveManualSlot(slot.id)}
                              className="rounded p-1 text-red-600 hover:bg-red-50"
                              title="Hapus slot"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-3">
                            <div>
                              <label className="block text-[10px] font-bold text-[#123c28]/70 mb-1">
                                Tipe Layer:
                              </label>
                              <select
                                value={slot.layer_type}
                                onChange={(e) =>
                                  handleUpdateManualSlot(
                                    slot.id,
                                    "layer_type",
                                    e.target.value
                                  )
                                }
                                className="w-full rounded-xl border border-[#123c28]/15 bg-white px-2.5 py-1.5 text-xs font-bold text-[#123c28]"
                              >
                                <option value="ndvi">NDVI (Vegetasi)</option>
                                <option value="vari">VARI</option>
                                <option value="nitrogen">Nitrogen (N)</option>
                                <option value="phosphorus">Fosfor (P)</option>
                                <option value="kalium">Kalium (K)</option>
                                <option value="dsm">DSM (Elevasi)</option>
                                <option value="spectral">Multispektral</option>
                                <option value="custom">Kustom</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-[#123c28]/70 mb-1">
                                Label Tampilan:
                              </label>
                              <input
                                type="text"
                                value={slot.name}
                                onChange={(e) =>
                                  handleUpdateManualSlot(
                                    slot.id,
                                    "name",
                                    e.target.value
                                  )
                                }
                                className="w-full rounded-xl border border-[#123c28]/15 bg-white px-2.5 py-1.5 text-xs font-bold text-[#123c28]"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-[#123c28]/70 mb-1">
                                File TIF Layer:
                              </label>
                              <input
                                type="file"
                                accept=".tif,.tiff"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleUpdateManualSlot(
                                      slot.id,
                                      "file",
                                      e.target.files[0]
                                    );
                                  }
                                }}
                                className="w-full text-xs text-[#123c28] file:mr-2 file:rounded-lg file:border-0 file:bg-[#123c28] file:px-2.5 file:py-1 file:text-[11px] file:font-semibold file:text-white"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-1 text-[10px]">
                            <span className="font-semibold text-[#123c28]/70">
                              Opasitas Default:
                            </span>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.05"
                              value={slot.default_opacity}
                              onChange={(e) =>
                                handleUpdateManualSlot(
                                  slot.id,
                                  "default_opacity",
                                  parseFloat(e.target.value)
                                )
                              }
                              className="h-1.5 w-24 cursor-pointer appearance-none rounded-lg bg-gray-200 accent-[#123c28]"
                            />
                            <span className="font-mono font-bold text-[#123c28]">
                              {Math.round(slot.default_opacity * 100)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Progress Indicator */}
              {loading && (
                <div className="mt-5 rounded-2xl border border-[#123c28]/15 bg-[#f7f8f4] p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-bold text-[#123c28]">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#123c28]" />
                      {uploadProgress >= 99
                        ? "Memvalidasi CRS, Bounds Spasial, dan Header GeoTIFF..."
                        : `Mengunggah seluruh layer ke server (${uploadProgress}%)...`}
                    </span>
                    <span className="text-xs font-bold text-[#123c28]">
                      {uploadProgress}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#123c28]/10">
                    <div
                      className="h-2 rounded-full bg-[#123c28] transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </section>

            {/* =====================================================
                SECTION: METADATA SURVEI & PRESET HALMAHERA
            ====================================================== */}
            <section className="rounded-3xl border border-[#123c28]/15 bg-white p-5 sm:p-7 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f3f6ed] text-[#123c28]">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#123c28]">
                    Informasi Sesi Survei Drone
                  </h2>
                  <p className="text-[11px] text-[#123c28]/65">
                    Metadata geospasial untuk katalog dan identifikasi lahan
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#123c28]/80">
                    Judul Peta / Sesi Pemotretan:
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="Contoh: Survei Fotogrametri Perkebunan Paca - Blok A"
                    className="w-full rounded-xl border border-[#123c28]/15 bg-[#fafbf8] px-3.5 py-2.5 text-xs font-bold text-[#123c28] focus:border-[#123c28] focus:outline-none"
                  />
                </div>

                {/* Location with Halmahera Presets */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="block text-xs font-bold text-[#123c28]/80">
                      Lokasi / Wilayah Survei:
                    </label>
                    <span className="text-[10px] font-semibold text-[#1a5134]">
                      Preset Halmahera Utara:
                    </span>
                  </div>

                  {/* Preset Chips */}
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {[
                      "Paca, Halmahera Utara",
                      "Tobelo, Halmahera Utara",
                      "Galela, Halmahera Utara",
                      "Kao Barat, Halmahera Utara",
                    ].map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => {
                          setLocation(loc);
                          if (!title) {
                            setTitle(`Survei Pertanian ${loc}`);
                          }
                        }}
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-bold transition ${
                          location === loc
                            ? "border-[#123c28] bg-[#123c28] text-white"
                            : "border-[#123c28]/20 bg-white text-[#123c28] hover:bg-[#f3f6ed]"
                        }`}
                      >
                        {loc.split(",")[0]}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#123c28]/40" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                      placeholder="Paca, Halmahera Utara"
                      className="w-full rounded-xl border border-[#123c28]/15 bg-[#fafbf8] py-2.5 pl-9 pr-3 text-xs font-bold text-[#123c28] focus:border-[#123c28] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Survey Date & Description */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-[#123c28]/80">
                      Tanggal Penerbangan Drone:
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#123c28]/40" />
                      <input
                        type="date"
                        value={surveyDate}
                        onChange={(e) => setSurveyDate(e.target.value)}
                        required
                        className="w-full rounded-xl border border-[#123c28]/15 bg-[#fafbf8] py-2.5 pl-9 pr-3 text-xs font-bold text-[#123c28] focus:border-[#123c28] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-[#123c28]/80">
                      Catatan / Deskripsi Tambahan:
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Ketinggian 120m AGL, sensor multispektral..."
                      className="w-full rounded-xl border border-[#123c28]/15 bg-[#fafbf8] px-3.5 py-2.5 text-xs font-medium text-[#123c28] focus:border-[#123c28] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Monetization / Free Lock */}
                <div className="pt-2 border-t border-[#123c28]/10 space-y-2">
                  <label className="flex cursor-pointer items-center gap-2.5 text-xs font-semibold text-[#123c28]">
                    <input
                      type="checkbox"
                      checked={lockedForFree}
                      onChange={(e) => setLockedForFree(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-[#123c28] focus:ring-[#123c28]"
                    />
                    <span>Kunci akses untuk Member Free (Eksklusif Tier Berbayar)</span>
                  </label>

                  <label className="flex cursor-pointer items-center gap-2.5 text-xs font-semibold text-[#123c28]">
                    <input
                      type="checkbox"
                      checked={purchasable}
                      onChange={(e) => setPurchasable(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-[#123c28] focus:ring-[#123c28]"
                    />
                    <span>Sediakan opsi Pembelian Satuan (Pay-per-view)</span>
                  </label>
                </div>
              </div>
            </section>

            {/* ERROR CARD */}
            {!isSuccess && (geoError || message) && (
              <section className="rounded-3xl border border-red-200 bg-red-50/90 p-5 text-red-950 shadow-sm">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 space-y-2 text-xs">
                    <h4 className="text-sm font-bold text-red-900">
                      {geoError?.message || message || "Validasi Geospasial Ditolak"}
                    </h4>

                    {geoError?.details?.missing_requirements && (
                      <ul className="list-disc list-inside space-y-0.5 text-red-800">
                        {geoError.details.missing_requirements.map((req, i) => (
                          <li key={i}>{req}</li>
                        ))}
                      </ul>
                    )}

                    {geoError?.details?.solution && (
                      <p className="mt-2 rounded-xl bg-white/80 p-2.5 text-red-900 font-medium">
                        <strong>Solusi GIS:</strong> {geoError.details.solution}
                      </p>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* SUCCESS FEEDBACK CARD */}
            {isSuccess && geoSuccess && (
              <section className="rounded-3xl bg-[#123c28] p-6 text-white shadow-xl animate-in fade-in zoom-in duration-300">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white">
                    <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-300">
                        Validasi Spasial 100% Lolos
                      </span>
                      <h3 className="mt-1 text-lg font-bold">
                        {geoSuccess.title} Berhasil Diunggah!
                      </h3>
                      <p className="text-xs text-emerald-100/80">
                        Sebanyak <strong>{geoSuccess.totalLayers} layer</strong> berhasil disimpan dan
                        sedang dikonversi ke arsip piramida PMTiles di background.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <Link
                        href={`/dashboard/maps?id=${geoSuccess.mapId}`}
                        className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-black text-[#123c28] shadow-md transition hover:bg-[#eef3e8]"
                      >
                        <Eye className="h-4 w-4" />
                        Buka & Visualisasikan di Peta
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          setIsSuccess(false);
                          setGeoSuccess(null);
                        }}
                        className="rounded-full border border-white/25 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10"
                      >
                        Unggah Survei Lainnya
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#123c28] py-4 text-sm font-bold text-white shadow-lg transition hover:bg-[#1a5134] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Sedang Mengunggah & Memvalidasi Metadata Geospasial...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Validasi & Unggah Seluruh Layer
                </>
              )}
            </button>
          </div>

          {/* =====================================================
              SIDEBAR: GIS SPEC & INFO
          ====================================================== */}
          <div className="space-y-6">
            {/* GIS Guidance Card */}
            <section className="rounded-3xl border border-[#123c28]/15 bg-white p-5 sm:p-6 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f3f6ed] text-[#123c28]">
                  <Compass className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-[#123c28]">
                  Panduan Layer GIS
                </h3>
              </div>

              <div className="space-y-3 text-xs font-medium text-[#123c28]/80">
                <p className="text-[11px] leading-relaxed">
                  Dataset foto udara drone dari studio GIS (Pix4D, WebODM, Agisoft) diproses
                  menjadi layer terpisah:
                </p>

                <div className="space-y-2">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-2.5">
                    <span className="font-bold text-emerald-900 block">
                      1. Base Ortho RGB
                    </span>
                    <span className="text-[10px] text-emerald-800">
                      Citra foto mosaik visual nyata dengan band merah, hijau, biru (UInt8).
                    </span>
                  </div>

                  <div className="rounded-xl border border-lime-200 bg-lime-50/40 p-2.5">
                    <span className="font-bold text-lime-900 block">
                      2. Indeks Vegetasi (NDVI/VARI)
                    </span>
                    <span className="text-[10px] text-lime-800">
                      Peta kerapatan klorofil (Float32). Otomatis diwarnai palet RdYlGn.
                    </span>
                  </div>

                  <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-2.5">
                    <span className="font-bold text-violet-900 block">
                      3. Peta Hara NPK (N, P, K)
                    </span>
                    <span className="text-[10px] text-violet-800">
                      Distribusi kandungan unsur hara tanah/daun dari analisis spektral.
                    </span>
                  </div>

                  <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-2.5">
                    <span className="font-bold text-stone-900 block">
                      4. Model Elevasi (DSM)
                    </span>
                    <span className="text-[10px] text-stone-800">
                      Kontur tinggi tajuk pohon dan topografi lahan perkebunan.
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* PMTiles Streaming Performance Note */}
            <section className="rounded-3xl bg-[#f3f6ed] p-5 sm:p-6 border border-[#123c28]/10">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-sm text-[#123c28]">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-[#123c28]">
                  Teknologi AMX GeoStream™
                </h3>
              </div>

              <p className="text-xs text-[#123c28]/80 leading-relaxed">
                Platform ini ditenagai oleh <strong>AMX GeoStream Engine™</strong>, arsitektur
                <em>cloud-native geospatial</em> dengan protokol streaming <code>pmtiles://</code>.
                Dataset orthomosaic & multispektral skala gigabyte ditransformasi menjadi piramida
                spasial terindeks, sehingga visualisasi multi-layer dapat dijelajahi secara instan
                tanpa membebani memori browser ataupun RAM server.
              </p>

              <div className="mt-3 flex items-center justify-between rounded-xl bg-white/70 p-2.5 text-[11px] font-bold text-[#123c28]">
                <span>Status Engine:</span>
                <span className="inline-flex items-center gap-1 text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  AMX Stream Core (HTTP 206) Aktif
                </span>
              </div>
            </section>
          </div>
        </form>
      </div>
    </main>
  );
}
