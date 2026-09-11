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
  Eye,
  FileText,
  Folder,
  Layers,
  MapPin,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sliders,
  Cog,
  Trash2,
  Upload,
} from "lucide-react";

import { useUserRole } from "@/context/UserRoleContext";
import api from "@/lib/api";
import { ErrorDetailObject, GeoMetadata } from "@/types/map";
import { LAYER_TYPE_CONFIG, layerOptions, autoDetectLayer, formatFileSize, type BatchFileItem, type ManualSlotItem } from "./upload-config";
import { batchErrors, createManualSlot, manualReadiness, normalizeBatchBase } from "./upload-helpers";
import { ManualUploadFlow, ManualNavigation, UploadReview, UploadGuide, inputClass } from "./ManualUploadFlow";

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
          <h2 className="text-base font-bold text-[#123c28]">{title}</h2>

          {description && (
            <p className="mt-0.5 text-xs leading-relaxed text-[#123c28]">
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

  const [manualSlots, setManualSlots] = useState<ManualSlotItem[]>([]);

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

  const submitting = useRef(false);
  const readiness = manualReadiness(manualBaseFile, manualBaseName, manualSlots, title, location, surveyDate);
  const submitErrors = uploadMode === "manual" ? readiness.errors : batchErrors(batchFiles, title, location, surveyDate);

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
    if (loading || submitting.current) return;
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
      return normalizeBatchBase([...prev, ...newItems]);
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
      return normalizeBatchBase(prev.filter((item) => item.id !== id));
    });
  };

  // =========================================================
  // MANUAL MANAGEMENT
  // =========================================================

  const handleAddManualSlot = () => {
    setManualSlots((prev) => [...prev, createManualSlot(crypto.randomUUID(), prev[prev.length - 1])]);
  };

  const handleRemoveManualSlot = (id: string) => {
    setManualSlots((prev) => prev.filter((slot) => slot.id !== id));
  };

  const handleUpdateManualSlot = <K extends keyof ManualSlotItem,>(
    id: string,
    field: K,
    value: ManualSlotItem[K]
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
    if (loading || submitting.current) return;
    if (submitErrors.length) {
      setIsSuccess(false);
      setMessage(submitErrors.join(" "));
      return;
    }

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
        name: manualBaseName.trim(),
        layer_type: "ortho",
        default_opacity: 1,
        is_base: true,
      });

      manualSlots.forEach((slot) => {
        if (!slot.file) throw new Error("Slot analisis belum lengkap.");

        filesToUpload.push(slot.file);

        layersConfigPayload.push({
          filename: slot.file.name,
          name: slot.name.trim(),
          layer_type: slot.layer_type,
          default_opacity: slot.default_opacity,
          is_base: false,
        });
      });
    }

    submitting.current = true;
    setLoading(true);
    setUploadProgress(0);
    setMessage("");
    setIsSuccess(false);
    setGeoError(null);
    setGeoSuccess(null);

    const formData = new FormData();

    formData.append("title", title.trim());
    formData.append("location", location.trim());
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
      submitting.current = false;
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
    <main className="min-h-screen bg-white text-[#123c28]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* =====================================================
            HEADER
        ====================================================== */}

        <header className="mb-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-2xl font-bold tracking-tight text-[#123c28] sm:text-3xl">
                Unggah Dataset
              </h1>


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
              disabled={loading}
              aria-pressed={uploadMode === "batch"}
              onClick={() => {
                setUploadMode("batch");
                setMessage("");
                setGeoError(null);
              }}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition ${uploadMode === "batch"
                ? "bg-[#123c28] text-white shadow-md shadow-[#123c28]/10"
                : "text-[#123c28] hover:bg-[#f6f8f3]"
                }`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${uploadMode === "batch" ? "bg-white/10" : "bg-[#f3f6ed]"
                  }`}
              >
                <Layers className="h-4 w-4" />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-bold">Batch Otomatis</p>

                <p
                  className={`mt-0.5 text-xs leading-relaxed ${uploadMode === "batch"
                    ? "text-white/90"
                    : "text-[#123c28]"
                    }`}
                >
                  Deteksi tipe layer otomatis.
                </p>
              </div>
            </button>

            <button
              type="button"
              disabled={loading}
              aria-pressed={uploadMode === "manual"}
              onClick={() => {
                setUploadMode("manual");
                setMessage("");
                setGeoError(null);
              }}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition ${uploadMode === "manual"
                ? "bg-[#123c28] text-white shadow-md shadow-[#123c28]/10"
                : "text-[#123c28] hover:bg-[#f6f8f3]"
                }`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${uploadMode === "manual" ? "bg-white/10" : "bg-[#f3f6ed]"
                  }`}
              >
                <Sliders className="h-4 w-4" />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-bold">Manual</p>

                <p
                  className={`mt-0.5 text-xs leading-relaxed ${uploadMode === "manual"
                    ? "text-white/90"
                    : "text-[#123c28]"
                    }`}
                >
                  Atur setiap layer sendiri.
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
          noValidate
          aria-busy={loading}
          className="mx-auto max-w-6xl space-y-6"
        >
          {/* ===================================================
              LEFT CONTENT
          ==================================================== */}

          <fieldset disabled={loading} className="min-w-0 space-y-5 border-0 p-0">
            <legend className="sr-only">Formulir unggah dataset</legend>
            {uploadMode === "manual" && <ManualNavigation readiness={readiness} />}
            <UploadGuide />
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
                description="GeoTIFF (.tif / .tiff)"
                right={
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#eef3e8] px-2.5 py-1.5 text-xs font-bold text-[#123c28]">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#1a5134]" />
                    CRS diperiksa server
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
                    className={`rounded-2xl border-2 border-dashed px-5 py-10 text-center transition ${dragActive
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
                      Tarik file GeoTIFF ke sini
                    </h3>

                    <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-[#123c28]">
                      Pilih satu atau beberapa file.
                    </p>

                    <label
                      htmlFor="multiFileInput"
                      className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#123c28] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#1a5134]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Pilih File
                    </label>

                    <p className="mt-3 text-xs text-[#123c28]">
                      Hanya .TIF / .TIFF · CRS & metadata diperiksa server
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

                          <p className="mt-0.5 text-xs text-[#123c28]">
                            {batchFiles.length} file · {totalSizeMB.toFixed(1)}{" "}
                            MB
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setBatchFiles([])}
                          className="text-xs font-bold text-red-600 transition hover:text-red-700"
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
                              className={`rounded-2xl border p-3.5 ${item.is_base
                                ? "border-emerald-300/70 bg-emerald-50/40"
                                : "border-[#123c28]/10 bg-[#fbfcfa]"
                                }`}
                            >
                              <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                                <div className="min-w-0 flex-1">
                                  <div className="mb-2 flex flex-wrap items-center gap-1.5">
                                    <span
                                      className={`inline-flex rounded-full border px-2 py-1 text-xs font-bold ${config.badgeClass}`}
                                    >
                                      {config.label}
                                    </span>

                                    {item.is_base && (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-700 px-2 py-1 text-xs font-black text-white">
                                        <CheckCircle className="h-3 w-3" />
                                        BASE
                                      </span>
                                    )}

                                    <span className="text-xs font-medium text-[#123c28]">
                                      {formatFileSize(item.file.size)}
                                    </span>
                                  </div>

                                  <input
                                    type="text"
                                    aria-label="Nama layer"
                                    value={item.name}
                                    onChange={(event) =>
                                      handleUpdateBatchItem(
                                        item.id,
                                        "name",
                                        event.target.value
                                      )
                                    }
                                    placeholder="Nama layer..."
                                    className="w-full rounded-xl border border-[#123c28]/10 bg-white px-3 py-2 text-xs font-bold text-[#123c28] outline-none transition placeholder:text-[#123c28]/40 focus-visible:ring-2 focus-visible:ring-[#123c28] focus-visible:ring-offset-1"
                                  />

                                  <p className="mt-1.5 truncate text-xs text-[#123c28]">
                                    {item.file.name}
                                  </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                                  <select
                                    aria-label="Tipe layer"
                                    value={item.layer_type}
                                    onChange={(event) =>
                                      handleUpdateBatchItem(
                                        item.id,
                                        "layer_type",
                                        event.target.value
                                      )
                                    }
                                    className="rounded-xl border border-[#123c28]/10 bg-white px-3 py-2 text-xs font-bold text-[#123c28] outline-none"
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
                                      className="rounded-xl border border-[#123c28]/10 bg-white px-3 py-2 text-xs font-bold text-[#123c28] transition hover:bg-[#eef3e8]"
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
                                <span className="shrink-0 text-xs font-semibold text-[#123c28]">
                                  Opasitas
                                </span>

                                <input
                                  type="range"
                                  min="0"
                                  max="1"
                                  step="0.05"
                                  aria-label={`Opasitas ${item.name}`}
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

                                <span className="w-10 text-right text-xs font-bold text-[#123c28]">
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
                <ManualUploadFlow
                  disabled={loading}
                  readiness={readiness}
                  baseFile={manualBaseFile}
                  baseName={manualBaseName}
                  slots={manualSlots}
                  setBaseFile={setManualBaseFile}
                  setBaseName={setManualBaseName}
                  addSlot={handleAddManualSlot}
                  removeSlot={handleRemoveManualSlot}
                  updateSlot={handleUpdateManualSlot}
                />
              )}

              {/* =============================================
                  PROGRESS
              ============================================== */}

              {loading && (
                <div className="mt-5 rounded-2xl border border-[#123c28]/10 bg-[#f6f8f3] p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <RefreshCw className="h-3.5 w-3.5 shrink-0 animate-spin" />

                      <span className="truncate text-xs font-bold text-[#123c28]">
                        {uploadProgress >= 99
                          ? "Memvalidasi CRS, bounds spasial, dan metadata GeoTIFF..."
                          : "Mengunggah dataset..."}
                      </span>
                    </div>

                    <span className="shrink-0 text-xs font-bold">
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

            <section id="survey-metadata" tabIndex={-1} className="scroll-mt-6 rounded-3xl border border-[#123c28]/10 bg-white p-5 shadow-sm sm:p-6">
              <SectionHeader
                icon={<FileText className="h-4 w-4" />}
                title={uploadMode === "manual" ? "3. Detail survei" : "Detail survei"}
              />

              <div className="space-y-4">
                <div>
                  <label htmlFor="field-title" className="mb-1.5 block text-sm font-bold text-[#123c28]">
                    Judul Peta / Sesi <span className="font-normal">· wajib</span>
                  </label>

                  <input
                    id="field-title"
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    required
                    placeholder="Contoh: Survei Fotogrametri Perkebunan Paca - Blok A"
                    className="w-full rounded-xl border border-[#123c28]/10 bg-[#fbfcfa] px-3.5 py-3 text-xs font-bold text-[#123c28] outline-none transition placeholder:text-[#123c28]/40 focus-visible:ring-2 focus-visible:ring-[#123c28] focus-visible:ring-offset-1"
                  />
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <label htmlFor="field-location" className="block text-sm font-bold text-[#123c28]">
                      Lokasi Survei <span className="font-normal">· wajib</span>
                    </label>

                    <span className="text-xs font-bold text-[#1a5134]">
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
                          className={`rounded-full border px-2.5 py-1.5 text-xs font-bold transition ${location === preset
                            ? "border-[#123c28] bg-[#123c28] text-white"
                            : "border-[#123c28]/10 bg-white text-[#123c28] hover:bg-[#f3f6ed]"
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
                      id="field-location"
                      type="text"
                      value={location}
                      onChange={(event) => setLocation(event.target.value)}
                      required
                      placeholder="Paca, Halmahera Utara"
                      className="w-full rounded-xl border border-[#123c28]/10 bg-[#fbfcfa] py-3 pl-9 pr-3 text-xs font-bold text-[#123c28] outline-none focus-visible:ring-2 focus-visible:ring-[#123c28] focus-visible:ring-offset-1"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="field-date" className="mb-1.5 block text-sm font-bold text-[#123c28]">
                      Tanggal Penerbangan <span className="font-normal">· wajib</span>
                    </label>

                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#123c28]/25" />

                      <input
                        type="date"
                        id="field-date"
                        value={surveyDate}
                        onChange={(event) => setSurveyDate(event.target.value)}
                        required
                        className="w-full rounded-xl border border-[#123c28]/10 bg-[#fbfcfa] py-3 pl-9 pr-3 text-xs font-bold text-[#123c28] outline-none focus-visible:ring-2 focus-visible:ring-[#123c28] focus-visible:ring-offset-1"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="field-desc" className="mb-1.5 block text-sm font-bold text-[#123c28]">
                      Deskripsi <span className="font-normal">· opsional</span>
                    </label>

                    <input
                      id="field-desc"
                      type="text"
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Ketinggian 120m AGL, sensor multispektral..."
                      className="w-full rounded-xl border border-[#123c28]/10 bg-[#fbfcfa] px-3 py-3 text-xs text-[#123c28] outline-none placeholder:text-[#123c28]/25 focus-visible:ring-2 focus-visible:ring-[#123c28] focus-visible:ring-offset-1"
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
                        <span className="block text-xs font-bold text-[#123c28]">
                          Batasi untuk member berbayar
                        </span>

                        <span className="block text-xs leading-relaxed text-[#123c28]">
                          Sembunyikan dari member free.
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
                        <span className="block text-xs font-bold text-[#123c28]">
                          Izinkan pembelian satuan
                        </span>

                        <span className="block text-xs leading-relaxed text-[#123c28]">
                          Member dapat membeli akses dataset.
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
              <section role="alert" className="rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm">
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
                      <ul className="mt-2 space-y-1 pl-4 text-xs leading-relaxed text-red-900">
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
                        <p className="text-xs leading-relaxed text-red-900">
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
              <section role="status" className="rounded-3xl bg-[#123c28] p-5 text-white shadow-xl sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                    <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="inline-flex rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-black uppercase tracking-wide text-emerald-200">
                      Validasi Spasial Lolos
                    </span>

                    <h3 className="mt-2 text-base font-bold">
                      {geoSuccess.title}
                    </h3>

                    <p className="mt-1 text-xs leading-relaxed text-white">
                      {geoSuccess.totalLayers} layer berhasil disimpan dan
                      diproses menuju arsip PMTiles di background.
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href={`/dashboard/maps?id=${geoSuccess.mapId}`}
                        className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-black text-[#123c28] transition hover:bg-[#eef3e8]"
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
                        className="rounded-full border border-white/15 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/10"
                      >
                        Unggah Survei Lainnya
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            <section className="flex items-start gap-3 rounded-2xl border border-[#123c28]/10 bg-[#eef3e8] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#123c28] shadow-sm">
                <Cog className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold">AMX GeoStream Engine</h3>
                <p className="mt-1 text-sm leading-relaxed text-[#123c28]">
                  Mengubah GeoTIFF besar menjadi PMTiles agar peta dapat dimuat
                  bertahap melalui HTTP Range tanpa mengunduh seluruh dataset.
                </p>
              </div>
            </section>

            {/* =================================================
                SUBMIT
            ================================================== */}

            {uploadMode === "manual" ? <UploadReview readiness={readiness} loading={loading} /> : <p id="submit-readiness" role="status" className="text-sm">{loading ? "Unggah berjalan; formulir dikunci." : submitErrors.length ? submitErrors.join(" ") : "Dataset siap diunggah. CRS diperiksa server."}</p>}

            <button
              type="submit"
              disabled={loading || submitErrors.length > 0}
              aria-describedby="submit-readiness"
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
          </fieldset>

        </form>
      </div>
    </main>
  );
}
