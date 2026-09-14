"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Eye,
  Folder,
  Layers,
  Lock,
  MapPin,
  Pencil,
  RefreshCw,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Upload,
  Wand2,
  X,
} from "lucide-react";

import { useUserRole } from "@/context/UserRoleContext";
import api from "@/lib/api";
import { ErrorDetailObject, GeoMetadata } from "@/types/map";

import {
  LAYER_TYPE_CONFIG,
  layerOptions,
  autoDetectLayer,
  formatFileSize,
  type BatchFileItem,
  type ManualSlotItem,
} from "./upload-config";

import {
  batchErrors,
  createManualSlot,
  manualReadiness,
  metadataChecklist,
  normalizeBatchBase,
} from "./upload-helpers";

import {
  ManualUploadFlow,
  UploadReview,
  inputClass,
  type ReviewChecklistItem,
} from "./ManualUploadFlow";

const ICON_STROKE = 1.75;
const EASE = [0.22, 1, 0.36, 1] as const;

// Hard cap enforced client-side. NOTE: the backend endpoint (and any
// reverse proxy / storage layer in front of it) must accept request
// bodies up to this size as well, or large uploads will still fail
// server-side even though the client lets them through.
const MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024 * 1024; // 3 GB
const MAX_FILE_SIZE_LABEL = "3 GB";

/* ============================================================
   STEP RAIL — sticky sidebar guide showing the 4-step sequence
============================================================ */

function StepRail({
  currentStep,
  isSuccess,
}: {
  currentStep: number;
  isSuccess: boolean;
}) {
  const steps = [
    { label: "Upload file", hint: "Pilih file GeoTIFF", icon: Upload },
    { label: "Detail dataset", hint: "Judul, lokasi, tanggal", icon: Calendar },
    {
      label: "Review & kirim",
      hint: "Periksa sebelum submit",
      icon: ShieldCheck,
    },
    { label: "Selesai", hint: "Dataset tersimpan", icon: CheckCircle2 },
  ];

  return (
    <div className="rounded-lg border border-brand-800/10 bg-white p-4">
      <p className="mb-4 font-mono text-[10px] uppercase tracking-wide text-brand-800/40">
        Upload sequence
      </p>

      <ol>
        {steps.map((step, index) => {
          const num = index + 1;
          const done = isSuccess || currentStep > num;
          const active = !isSuccess && currentStep === num;
          const last = index === steps.length - 1;
          const Icon = step.icon;

          return (
            <li key={step.label} className="relative flex gap-3 pb-6 last:pb-0">
              {!last && (
                <span
                  className={`absolute left-[15px] top-8 h-full w-px ${
                    done ? "bg-brand-900" : "bg-brand-800/12"
                  }`}
                />
              )}

              <span
                className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                  done
                    ? "border-brand-900 bg-brand-900 text-white"
                    : active
                    ? "border-brand-600 bg-white text-brand-900"
                    : "border-brand-800/15 bg-white text-brand-800/30"
                }`}
              >
                {done ? (
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                ) : (
                  <Icon className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                )}

                {active && (
                  <span className="pointer-events-none absolute -inset-1 rounded-full border border-brand-600/40 animate-pulse" />
                )}
              </span>

              <div className="min-w-0 pt-0.5">
                <p
                  className={`text-xs font-bold ${
                    active || done ? "text-brand-900" : "text-brand-800/40"
                  }`}
                >
                  {step.label}
                </p>

                <p className="mt-0.5 text-[10px] font-medium text-brand-800/45">
                  {step.hint}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ============================================================
   SYSTEM STATUS PANEL — console-style live readout
============================================================ */

function SystemStatusPanel({
  fileCount,
  totalBytes,
  loading,
  uploadProgress,
}: {
  fileCount: number;
  totalBytes: number;
  loading: boolean;
  uploadProgress: number;
}) {
  const capPct = Math.min(100, (totalBytes / MAX_FILE_SIZE_BYTES) * 100);
  const totalMB = totalBytes / (1024 * 1024);

  return (
    <div className="rounded-lg bg-brand-900 p-4 text-white">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Layers className="h-3 w-3 text-brand-300" strokeWidth={2} />
          <span className="font-mono text-[10px] uppercase tracking-wide text-brand-300">
            Engine
          </span>
        </span>

        <span className="flex items-center gap-1.5">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              loading ? "animate-pulse bg-amber-400" : "bg-emerald-400"
            }`}
          />
          <span className="font-mono text-[10px] text-white/50">
            {loading ? "processing" : "idle"}
          </span>
        </span>
      </div>

      <p className="mt-1.5 text-xs font-bold">AMX GeoStream Engine</p>

      <div className="my-3.5 h-px bg-white/10" />

      <div className="space-y-2.5 font-mono text-[10px]">
        <div className="flex items-center justify-between">
          <span className="text-white/45">files</span>
          <span className="text-white">{fileCount}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-white/45">ukuran</span>
          <span className="text-white">
            {totalMB.toFixed(1)} MB / {MAX_FILE_SIZE_LABEL}
          </span>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-brand-300 transition-all"
            style={{ width: `${capPct}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-white/45">format</span>
          <span className="text-white">.tif / .tiff</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-white/45">batas per file</span>
          <span className="text-white">{MAX_FILE_SIZE_LABEL}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-white/45">output</span>
          <span className="text-brand-300">PMTiles</span>
        </div>
      </div>

      {loading && (
        <div className="mt-3.5 border-t border-white/10 pt-3">
          <div className="mb-1 flex items-center justify-between font-mono text-[10px]">
            <span className="text-white/45">upload</span>
            <span className="text-white">{uploadProgress}%</span>
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-white transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   SECTION TITLE
============================================================ */

function SectionTitle({
  number,
  title,
  description,
  right,
}: {
  number?: number;
  title: string;
  description?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2.5">
          {number !== undefined && (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-900 text-[9px] font-bold text-white">
              {number}
            </span>
          )}

          <h2 className="text-base font-bold tracking-[-0.02em] text-brand-900">
            {title}
          </h2>
        </div>

        {description && (
          <p className="mt-1 text-[11px] font-medium leading-4 text-brand-800/60">
            {description}
          </p>
        )}
      </div>

      {right}
    </div>
  );
}

/* ============================================================
   FIELD LABEL
============================================================ */

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="mb-1.5 block text-[11px] font-bold text-brand-900">
      {children}

      {required && (
        <span className="ml-1 font-medium text-brand-800/40">*</span>
      )}
    </label>
  );
}

/* ============================================================
   COLLAPSED SUMMARY — a completed step, tucked out of the way
============================================================ */

function CollapsedSummary({
  title,
  detail,
  onEdit,
}: {
  title: string;
  detail: string;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-3.5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
        </span>

        <div className="min-w-0">
          <p className="text-xs font-bold text-brand-900">{title}</p>
          <p className="mt-0.5 truncate font-mono text-[10px] text-brand-800/55">
            {detail}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onEdit}
        className="inline-flex shrink-0 items-center gap-1 rounded-md border border-brand-800/15 bg-white px-2.5 py-1.5 text-[10px] font-bold text-brand-800/70 transition hover:border-brand-800/25 hover:text-brand-900"
      >
        <Pencil className="h-3 w-3" strokeWidth={2} />
        Ubah
      </button>
    </div>
  );
}

/* ============================================================
   LOCKED SECTION — a step the user can't reach yet
============================================================ */

function LockedSection({ title, reason }: { title: string; reason: string }) {
  return (
    <div className="rounded-lg border border-dashed border-brand-800/15 bg-brand-50/30 px-4 py-5">
      <div className="flex items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-brand-800/15 bg-white text-brand-800/30">
          <Lock className="h-3.5 w-3.5" strokeWidth={1.75} />
        </span>

        <div>
          <p className="text-xs font-bold text-brand-800/50">{title}</p>
          <p className="mt-0.5 text-[10px] font-medium text-brand-800/40">
            {reason}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PAGE
============================================================ */

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
  const [expandedBatchItems, setExpandedBatchItems] = useState<Set<string>>(
    new Set()
  );

  // Manual
  const [manualBaseFile, setManualBaseFile] = useState<File | null>(null);

  const [manualBaseName, setManualBaseName] = useState("Citra Ortho RGB Utama");

  const [manualSlots, setManualSlots] = useState<ManualSlotItem[]>([]);

  // Guided-flow UI state — which step is expanded for editing right now.
  // A step auto-expands again if it becomes incomplete, so users can't
  // get stuck behind a collapsed card that no longer satisfies its step.
  const [editingFiles, setEditingFiles] = useState(true);
  const [editingDetails, setEditingDetails] = useState(true);

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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const readiness = manualReadiness(
    manualBaseFile,
    manualBaseName,
    manualSlots,
    title,
    location,
    surveyDate
  );

  const submitErrors =
    uploadMode === "manual"
      ? readiness.errors
      : batchErrors(batchFiles, title, location, surveyDate);

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/dashboard");
    }
  }, [user, router]);

  const metaChecklist = metadataChecklist(title, location, surveyDate);

  const filesReady =
    uploadMode === "batch"
      ? batchFiles.length > 0 &&
        batchFiles.filter((item) => item.is_base).length === 1 &&
        batchFiles.every((item) => item.name.trim())
      : !readiness.baseErrors.length;

  const detailReady =
    Boolean(title.trim()) && Boolean(location.trim()) && Boolean(surveyDate);

  const currentStep = isSuccess ? 4 : !filesReady ? 1 : !detailReady ? 2 : 3;

  const showFilesEditor = editingFiles || !filesReady;
  const showDetailsEditor = editingDetails || !detailReady;
  const detailsUnlocked = filesReady;
  const reviewUnlocked = filesReady && detailReady;

  const reviewChecklist: ReviewChecklistItem[] =
    uploadMode === "batch"
      ? [
          {
            label: "File GeoTIFF dipilih",
            ready: batchFiles.length > 0,
          },
          {
            label: "Layer utama dipilih",
            ready: batchFiles.filter((item) => item.is_base).length === 1,
          },
          {
            label: "Nama layer lengkap",
            ready: batchFiles.every((item) => item.name.trim()),
          },
          ...metaChecklist,
        ]
      : [
          {
            label: "Layer utama lengkap",
            ready: !readiness.baseErrors.length,
          },
          {
            label: readiness.slotErrors.length
              ? "Layer analisis lengkap"
              : "Tidak ada layer analisis",
            ready: readiness.slotErrors.every((errors) => !errors.length),
          },
          ...readiness.metadata,
        ];

  const reviewFiles =
    uploadMode === "batch"
      ? batchFiles.map((item) => item.file)
      : readiness.files;

  const reviewTotalBytes = reviewFiles.reduce(
    (total, file) => total + file.size,
    0
  );

  const totalSizeMB = reviewTotalBytes / (1024 * 1024);

  /* ============================================================
     FILE HANDLING
  ============================================================ */

  const processIncomingFiles = (incoming: FileList | File[]) => {
    if (loading || submitting.current) {
      return;
    }

    const candidates = Array.from(incoming);

    const isTiff = (file: File) => {
      const lowerName = file.name.toLowerCase();
      return lowerName.endsWith(".tif") || lowerName.endsWith(".tiff");
    };

    const rightFormat = candidates.filter(isTiff);
    const wrongFormatCount = candidates.length - rightFormat.length;

    const tooLarge = rightFormat.filter(
      (file) => file.size > MAX_FILE_SIZE_BYTES
    );
    const validFiles = rightFormat.filter(
      (file) => file.size <= MAX_FILE_SIZE_BYTES
    );

    if (!validFiles.length) {
      if (tooLarge.length) {
        setMessage(
          `${tooLarge.length} file melebihi batas ${MAX_FILE_SIZE_LABEL} per file dan tidak ditambahkan.`
        );
      } else {
        setMessage("Hanya file .tif atau .tiff yang didukung.");
      }
      return;
    }

    const newItems = validFiles.map((file, index) => {
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

    setBatchFiles((prev) => normalizeBatchBase([...prev, ...newItems]));

    if (!title) {
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

    if (tooLarge.length || wrongFormatCount) {
      const parts: string[] = [];

      if (tooLarge.length) {
        parts.push(
          `${tooLarge.length} file melebihi ${MAX_FILE_SIZE_LABEL} dan dilewati`
        );
      }

      if (wrongFormatCount) {
        parts.push(`${wrongFormatCount} file bukan .tif/.tiff dan dilewati`);
      }

      setMessage(`${parts.join(", ")}.`);
    } else {
      setMessage("");
    }

    setGeoError(null);
  };

  const handleDrag = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (event.type === "dragenter" || event.type === "dragover") {
      setDragActive(true);
    }

    if (event.type === "dragleave") {
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
        if (item.id !== id) {
          return item;
        }

        const updated = {
          ...item,
          [field]: value,
        };

        if (field === "layer_type") {
          const config = LAYER_TYPE_CONFIG[value as string];

          if (config) {
            updated.default_opacity = config.defaultOpacity;

            const isDefaultName = Object.values(LAYER_TYPE_CONFIG).some(
              (configItem) => configItem.defaultName === item.name
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
    setBatchFiles((prev) =>
      normalizeBatchBase(prev.filter((item) => item.id !== id))
    );

    setExpandedBatchItems((prev) => {
      const next = new Set(prev);

      next.delete(id);

      return next;
    });
  };

  const toggleBatchItemExpanded = (id: string) => {
    setExpandedBatchItems((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  /* ============================================================
     MANUAL
  ============================================================ */

  const handleAddManualSlot = () => {
    setManualSlots((prev) => [
      ...prev,
      createManualSlot(crypto.randomUUID(), prev[prev.length - 1]),
    ]);
  };

  const handleRemoveManualSlot = (id: string) => {
    setManualSlots((prev) => prev.filter((slot) => slot.id !== id));
  };

  const handleUpdateManualSlot = <K extends keyof ManualSlotItem>(
    id: string,
    field: K,
    value: ManualSlotItem[K]
  ) => {
    setManualSlots((prev) =>
      prev.map((slot) => {
        if (slot.id !== id) {
          return slot;
        }

        const updated = {
          ...slot,
          [field]: value,
        };

        if (field === "layer_type") {
          const config = LAYER_TYPE_CONFIG[value as string];

          if (config) {
            updated.default_opacity = config.defaultOpacity;

            const isDefaultName = Object.values(LAYER_TYPE_CONFIG).some(
              (configItem) => configItem.defaultName === slot.name
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

  /* ============================================================
     RESET (after a successful upload)
  ============================================================ */

  const resetForNewUpload = () => {
    setIsSuccess(false);
    setGeoSuccess(null);
    setMessage("");
    setGeoError(null);
    setTitle("");
    setLocation("");
    setDescription("");
    setSurveyDate(new Date().toISOString().split("T")[0]);
    setLockedForFree(false);
    setPurchasable(false);
    setEditingFiles(true);
    setEditingDetails(true);
  };

  /* ============================================================
     SUBMIT
  ============================================================ */

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (loading || submitting.current) {
      return;
    }

    if (submitErrors.length) {
      setIsSuccess(false);

      setMessage(submitErrors.join(" "));

      return;
    }

    let filesToUpload: File[] = [];

    let layersConfigPayload: any[] = [];

    if (uploadMode === "batch") {
      if (batchFiles.length === 0) {
        setMessage("Silakan pilih minimal satu file.");

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
        setMessage("Layer utama wajib diunggah.");

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
        if (!slot.file) {
          throw new Error("Slot analisis belum lengkap.");
        }

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

    filesToUpload.forEach((file) => formData.append("files", file));

    try {
      const response = await api.post("/maps/batch", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },

        onUploadProgress: ({ loaded, total }) => {
          if (!total) {
            return;
          }

          const percentage = Math.round((loaded * 100) / total);

          setUploadProgress(percentage >= 100 ? 99 : percentage);
        },
      });

      setUploadProgress(100);

      setIsSuccess(true);

      setGeoSuccess({
        title: response.data.title,

        mapId: response.data.id,

        totalLayers: response.data.layers?.length || filesToUpload.length,

        metadata: response.data.geo_metadata,
      });

      setBatchFiles([]);
      setManualBaseFile(null);
      setManualSlots([]);
      setExpandedBatchItems(new Set());
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
            : "Upload gagal. Silakan periksa file dan koneksi server."
        );
      }

      setIsSuccess(false);
      setGeoSuccess(null);
    } finally {
      submitting.current = false;

      setLoading(false);
    }
  };

  const locationPresets = [
    "Paca, Halmahera Utara",
    "Tobelo, Halmahera Utara",
    "Galela, Halmahera Utara",
    "Kao Barat, Halmahera Utara",
  ];

  return (
    <main className="bg-page min-h-screen text-brand-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* =====================================================
            HEADER
        ===================================================== */}
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="micro-label">Input Data</p>

            <h1 className="mt-2 text-2xl font-bold tracking-[-0.035em] text-brand-900 sm:text-3xl">
              Unggah <span className="text-brand-600">Dataset</span>
            </h1>

            <p className="mt-1.5 text-xs font-medium text-brand-800/60">
              Tambahkan hasil survei Anda ke dalam peta.
            </p>
          </div>

          <Link href="/dashboard/maps" className="btn-brand w-fit">
            <Eye className="h-3.5 w-3.5" strokeWidth={1.75} />
            Lihat Map
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
          </Link>
        </header>

        <form onSubmit={handleSubmit} noValidate aria-busy={loading}>
          <fieldset disabled={loading} className="border-0 p-0">
            <legend className="sr-only">Formulir upload dataset</legend>

            {/* =================================================
                STATUS
            ================================================= */}

            {!isSuccess && (geoError || message) && (
              <motion.section
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: EASE }}
                className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-red-600">
                    <AlertCircle className="h-4 w-4" />
                  </span>

                  <div className="min-w-0">
                    <p className="text-xs font-bold text-red-900">
                      {geoError?.message || message}
                    </p>

                    {geoError?.details?.missing_requirements && (
                      <ul className="mt-2 space-y-1 pl-4 text-[11px] leading-4 text-red-900">
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
                      <div className="mt-3 rounded-2xl bg-white/70 p-3">
                        <p className="text-[11px] leading-4 text-red-900">
                          <strong>Solusi GIS:</strong>{" "}
                          {geoError.details.solution}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.section>
            )}

            {isSuccess && geoSuccess && (
              <motion.section
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: EASE }}
                className="mb-4 rounded-lg border border-brand-800/15 bg-brand-50 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-900 text-brand-300">
                      <CheckCircle2 className="h-5 w-5" />
                    </span>

                    <div>
                      <p className="micro-label">Upload Berhasil</p>

                      <h3 className="mt-1 text-sm font-bold text-brand-900">
                        {geoSuccess.title}
                      </h3>

                      <p className="mt-0.5 text-[11px] font-medium text-brand-800/60">
                        {geoSuccess.totalLayers} layer tersimpan.
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={resetForNewUpload}
                      className="inline-flex items-center gap-1.5 rounded-full border border-brand-800/15 bg-white px-4 py-2.5 text-xs font-bold text-brand-800/70 transition hover:border-brand-800/25 hover:text-brand-900"
                    >
                      Upload dataset lain
                    </button>

                    <Link
                      href={`/dashboard/maps?id=${geoSuccess.mapId}`}
                      className="btn-brand"
                    >
                      Buka di Map Viewer
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </motion.section>
            )}

            {!isSuccess && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                {/* ===============================================
                    GUIDE RAIL (sticky)
                =============================================== */}

                <aside className="lg:col-span-4 lg:order-2">
                  <div className="space-y-4 lg:sticky lg:top-6">
                    <StepRail currentStep={currentStep} isSuccess={isSuccess} />

                    <SystemStatusPanel
                      fileCount={reviewFiles.length}
                      totalBytes={reviewTotalBytes}
                      loading={loading}
                      uploadProgress={uploadProgress}
                    />
                  </div>
                </aside>

                {/* ===============================================
                    MAIN GUIDED FLOW
                =============================================== */}

                <div className="space-y-4 lg:col-span-8 lg:order-1">
                  {/* Upload method toggle */}
                  <div className="flex flex-col gap-3 rounded-lg border border-brand-800/10 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-bold text-brand-900">
                        Metode upload
                      </p>

                      <p className="mt-0.5 text-[10px] font-medium text-brand-800/50">
                        Mode Mudah disarankan untuk sebagian besar survei
                      </p>
                    </div>

                    <div className="inline-flex w-fit rounded-md border border-brand-800/12 bg-brand-50/50 p-1">
                      <button
                        type="button"
                        onClick={() => {
                          setUploadMode("batch");
                          setMessage("");
                          setGeoError(null);
                          setEditingFiles(true);
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-[5px] px-4 py-2 text-[10px] font-bold transition ${
                          uploadMode === "batch"
                            ? "bg-brand-900 text-white shadow-card"
                            : "text-brand-800/60 hover:text-brand-900"
                        }`}
                      >
                        <Wand2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                        Mudah
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setUploadMode("manual");
                          setMessage("");
                          setGeoError(null);
                          setEditingFiles(true);
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-[5px] px-4 py-2 text-[10px] font-bold transition ${
                          uploadMode === "manual"
                            ? "bg-brand-900 text-white shadow-card"
                            : "text-brand-800/60 hover:text-brand-900"
                        }`}
                      >
                        <SlidersHorizontal
                          className="h-3.5 w-3.5"
                          strokeWidth={1.75}
                        />
                        Manual
                      </button>
                    </div>
                  </div>

                  {/* ---------------------------------------------
                      STEP 1 — UPLOAD FILE
                  --------------------------------------------- */}

                  {showFilesEditor ? (
                    <motion.section
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, ease: EASE }}
                      className="rounded-lg border border-brand-800/10 bg-white p-5"
                    >
                      <SectionTitle
                        number={1}
                        title="Upload file"
                        description={
                          uploadMode === "batch"
                            ? "Pilih file hasil survei Anda."
                            : "Susun layer secara manual."
                        }
                      />

                      {uploadMode === "batch" && (
                        <div>
                          <div
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            className={`flex min-h-[190px] flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-7 text-center transition ${
                              dragActive
                                ? "border-brand-600 bg-brand-50"
                                : "border-brand-800/15 bg-white hover:border-brand-800/25 hover:bg-brand-50/20"
                            }`}
                          >
                            <input
                              ref={fileInputRef}
                              id="multiFileInput"
                              type="file"
                              multiple
                              accept=".tif,.tiff"
                              className="hidden"
                              onChange={handleFileInputChange}
                            />

                            <span className="icon-ring h-11 w-11 bg-brand-50">
                              <Upload
                                className="h-5 w-5 text-brand-700"
                                strokeWidth={1.75}
                              />
                            </span>

                            <h3 className="mt-3 text-sm font-bold text-brand-900">
                              Pilih file GeoTIFF
                            </h3>

                            <p className="mt-1 text-[10px] font-medium text-brand-800/55">
                              atau tarik file ke sini
                            </p>

                            <label
                              htmlFor="multiFileInput"
                              className="btn-brand mt-3 cursor-pointer"
                            >
                              <Folder className="h-3.5 w-3.5" />
                              Pilih File
                            </label>

                            <p className="mt-2 font-mono text-2xs font-medium text-brand-800/40">
                              .TIF / .TIFF · maks {MAX_FILE_SIZE_LABEL} per file
                            </p>
                          </div>

                          {batchFiles.length > 0 && (
                            <div className="mt-4">
                              <div className="mb-2 flex items-center justify-between">
                                <div>
                                  <p className="text-[11px] font-bold text-brand-900">
                                    {batchFiles.length} file dipilih
                                  </p>

                                  <p className="font-mono text-2xs font-medium text-brand-800/50">
                                    {totalSizeMB.toFixed(1)} MB
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setBatchFiles([]);
                                    setExpandedBatchItems(new Set());
                                  }}
                                  className="text-2xs font-bold text-brand-800/55 transition hover:text-red-600"
                                >
                                  Hapus semua
                                </button>
                              </div>

                              <div className="max-h-[240px] overflow-y-auto rounded-lg border border-brand-800/10 bg-white">
                                {batchFiles.map((item, index) => {
                                  const config =
                                    LAYER_TYPE_CONFIG[item.layer_type] ||
                                    LAYER_TYPE_CONFIG.custom;

                                  const expanded = expandedBatchItems.has(
                                    item.id
                                  );

                                  return (
                                    <div
                                      key={item.id}
                                      className={
                                        index < batchFiles.length - 1
                                          ? "border-b border-brand-800/8"
                                          : ""
                                      }
                                    >
                                      <div className="flex items-center gap-2.5 px-3 py-2.5">
                                        <span
                                          className={`h-2 w-2 shrink-0 rounded-full ${
                                            item.is_base
                                              ? "bg-brand-500"
                                              : "bg-brand-800/20"
                                          }`}
                                        />

                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center gap-1.5">
                                            <span
                                              className={`rounded border px-1.5 py-0.5 font-mono text-2xs font-bold uppercase tracking-wide ${config.badgeClass}`}
                                            >
                                              {config.label}
                                            </span>

                                            {item.is_base && (
                                              <span className="rounded border border-brand-600/25 bg-brand-50 px-1.5 py-0.5 font-mono text-2xs font-bold uppercase tracking-wide text-brand-700">
                                                utama
                                              </span>
                                            )}

                                            <span className="truncate font-mono text-2xs text-brand-800/45">
                                              {item.file.name}
                                            </span>
                                          </div>

                                          <input
                                            type="text"
                                            value={item.name}
                                            aria-label="Nama layer"
                                            onChange={(event) =>
                                              handleUpdateBatchItem(
                                                item.id,
                                                "name",
                                                event.target.value
                                              )
                                            }
                                            className="mt-1 w-full max-w-sm border-0 bg-transparent p-0 text-[10px] font-bold text-brand-900 outline-none placeholder:text-brand-800/25"
                                            placeholder="Nama layer"
                                          />
                                        </div>

                                        <span className="hidden font-mono text-2xs font-medium text-brand-800/45 sm:block">
                                          {formatFileSize(item.file.size)}
                                        </span>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            toggleBatchItemExpanded(item.id)
                                          }
                                          className="icon-ring h-7 w-7 shrink-0"
                                        >
                                          <Settings2
                                            className="h-3.5 w-3.5"
                                            strokeWidth={1.75}
                                          />
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleRemoveBatchItem(item.id)
                                          }
                                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-brand-800/30 transition hover:bg-red-50 hover:text-red-600"
                                        >
                                          <X
                                            className="h-3.5 w-3.5"
                                            strokeWidth={1.75}
                                          />
                                        </button>
                                      </div>

                                      {expanded && (
                                        <div className="border-t border-brand-800/8 bg-brand-50/50 px-3 py-2.5">
                                          <div className="flex flex-wrap items-center gap-2">
                                            <select
                                              value={item.layer_type}
                                              onChange={(event) =>
                                                handleUpdateBatchItem(
                                                  item.id,
                                                  "layer_type",
                                                  event.target.value
                                                )
                                              }
                                              className="rounded-lg border border-brand-800/10 bg-white px-2.5 py-1.5 text-2xs font-bold text-brand-900 outline-none"
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
                                                className="rounded-lg border border-brand-800/10 bg-white px-2.5 py-1.5 text-2xs font-bold text-brand-800"
                                              >
                                                Jadikan utama
                                              </button>
                                            )}

                                            <div className="flex min-w-[160px] flex-1 items-center gap-2">
                                              <span className="text-2xs text-brand-800/50">
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
                                                    parseFloat(
                                                      event.target.value
                                                    )
                                                  )
                                                }
                                                className="w-full accent-brand-900"
                                              />

                                              <span className="w-8 text-right font-mono text-2xs font-bold">
                                                {Math.round(
                                                  item.default_opacity * 100
                                                )}
                                                %
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

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

                      {filesReady && (
                        <div className="mt-5 flex justify-end border-t border-brand-800/8 pt-4">
                          <button
                            type="button"
                            onClick={() => setEditingFiles(false)}
                            className="btn-brand"
                          >
                            Lanjutkan ke detail dataset
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </motion.section>
                  ) : (
                    <CollapsedSummary
                      title="Upload file"
                      detail={`${
                        reviewFiles.length
                      } file · ${totalSizeMB.toFixed(1)} MB`}
                      onEdit={() => setEditingFiles(true)}
                    />
                  )}

                  {/* ---------------------------------------------
                      STEP 2 — DATASET DETAILS
                  --------------------------------------------- */}

                  {!detailsUnlocked ? (
                    <LockedSection
                      title="Detail dataset"
                      reason="Selesaikan upload file terlebih dahulu"
                    />
                  ) : showDetailsEditor ? (
                    <motion.section
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, ease: EASE }}
                      className="rounded-lg border border-brand-800/10 bg-white p-5"
                    >
                      <SectionTitle
                        number={2}
                        title="Detail dataset"
                        description="Tambahkan informasi dasar survei."
                      />

                      <div className="space-y-4">
                        <div>
                          <FieldLabel required>Judul peta / sesi</FieldLabel>

                          <input
                            id="field-title"
                            type="text"
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            required
                            placeholder="Contoh: Survei Perkebunan Paca - Blok A"
                            className={`${inputClass} h-9 text-xs text-brand-900 placeholder:text-brand-800/30 focus:border-brand-600 focus:ring-brand-600/20`}
                          />
                        </div>

                        <div>
                          <FieldLabel required>Lokasi survei</FieldLabel>

                          <div className="mb-2 flex flex-wrap gap-1.5">
                            {locationPresets.map((preset) => {
                              const active = location === preset;

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
                                  className={`rounded-full border px-2.5 py-1.5 text-2xs font-bold transition ${
                                    active
                                      ? "border-brand-900 bg-brand-900 text-white"
                                      : "border-brand-800/10 bg-white text-brand-800/60 hover:border-brand-800/20 hover:text-brand-900"
                                  }`}
                                >
                                  {preset.split(",")[0]}
                                </button>
                              );
                            })}
                          </div>

                          <div className="relative">
                            <MapPin className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-800/35" />

                            <input
                              id="field-location"
                              type="text"
                              value={location}
                              onChange={(event) =>
                                setLocation(event.target.value)
                              }
                              required
                              placeholder="Paca, Halmahera Utara"
                              className={`${inputClass} h-9 pl-10 text-xs text-brand-900 placeholder:text-brand-800/30 focus:border-brand-600 focus:ring-brand-600/20`}
                            />
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <FieldLabel required>
                              Tanggal penerbangan
                            </FieldLabel>

                            <div className="relative">
                              <Calendar className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-800/35" />

                              <input
                                id="field-date"
                                type="date"
                                value={surveyDate}
                                onChange={(event) =>
                                  setSurveyDate(event.target.value)
                                }
                                required
                                className={`${inputClass} h-9 pl-10 text-xs text-brand-900 focus:border-brand-600 focus:ring-brand-600/20`}
                              />
                            </div>
                          </div>

                          <div>
                            <FieldLabel>Deskripsi</FieldLabel>

                            <input
                              id="field-description"
                              type="text"
                              value={description}
                              onChange={(event) =>
                                setDescription(event.target.value)
                              }
                              placeholder="Opsional"
                              className={`${inputClass} h-9 text-xs text-brand-900 placeholder:text-brand-800/30 focus:border-brand-600 focus:ring-brand-600/20`}
                            />
                          </div>
                        </div>

                        <div className="border-t border-brand-800/8 pt-3.5">
                          <div className="mb-2 flex items-center gap-2">
                            <ShieldCheck
                              className="h-3.5 w-3.5 text-brand-600"
                              strokeWidth={1.75}
                            />

                            <span className="text-xs font-bold text-brand-900">
                              Pengaturan akses
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-brand-800/8 bg-white px-3 py-2">
                              <input
                                type="checkbox"
                                checked={lockedForFree}
                                onChange={(event) =>
                                  setLockedForFree(event.target.checked)
                                }
                                className="h-3.5 w-3.5 rounded border-brand-800/20 text-brand-900 focus:ring-brand-600"
                              />

                              <span className="text-2xs font-medium text-brand-800/65">
                                Batasi untuk member berbayar
                              </span>
                            </label>

                            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-brand-800/8 bg-white px-3 py-2">
                              <input
                                type="checkbox"
                                checked={purchasable}
                                onChange={(event) =>
                                  setPurchasable(event.target.checked)
                                }
                                className="h-3.5 w-3.5 rounded border-brand-800/20 text-brand-900 focus:ring-brand-600"
                              />

                              <span className="text-2xs font-medium text-brand-800/65">
                                Izinkan pembelian satuan
                              </span>
                            </label>
                          </div>
                        </div>
                      </div>

                      {detailReady && (
                        <div className="mt-5 flex justify-end border-t border-brand-800/8 pt-4">
                          <button
                            type="button"
                            onClick={() => setEditingDetails(false)}
                            className="btn-brand"
                          >
                            Lanjutkan ke review
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </motion.section>
                  ) : (
                    <CollapsedSummary
                      title="Detail dataset"
                      detail={`${title} · ${location}`}
                      onEdit={() => setEditingDetails(true)}
                    />
                  )}

                  {/* ---------------------------------------------
                      STEP 3 — REVIEW & SUBMIT
                  --------------------------------------------- */}

                  {!reviewUnlocked ? (
                    <LockedSection
                      title="Review & kirim"
                      reason="Lengkapi langkah upload file dan detail dataset terlebih dahulu"
                    />
                  ) : (
                    <motion.section
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, ease: EASE }}
                      className="rounded-lg border border-brand-800/10 bg-white p-5"
                    >
                      <SectionTitle
                        number={3}
                        title="Review & kirim"
                        description="Periksa sebelum upload."
                        right={
                          submitErrors.length === 0 && (
                            <span className="icon-ring h-8 w-8 bg-brand-50 text-brand-600">
                              <Check className="h-4 w-4" strokeWidth={2} />
                            </span>
                          )
                        }
                      />

                      <div className="rounded-lg border border-brand-800/8 bg-white p-4">
                        <UploadReview
                          files={reviewFiles}
                          totalBytes={reviewTotalBytes}
                          checklist={reviewChecklist}
                          loading={loading}
                        />
                      </div>

                      <div className="mt-4">
                        {submitErrors.length > 0 ? (
                          <div className="rounded-lg bg-brand-50 px-3.5 py-3">
                            <p className="text-[10px] font-medium leading-4 text-brand-800/60">
                              Lengkapi bagian yang masih diperlukan sebelum
                              upload.
                            </p>
                          </div>
                        ) : (
                          <div className="rounded-lg bg-brand-50 px-3.5 py-3">
                            <div className="flex items-center gap-2">
                              <CheckCircle2
                                className="h-3.5 w-3.5 text-brand-600"
                                strokeWidth={2}
                              />

                              <p className="text-xs font-bold text-brand-900">
                                Dataset siap diunggah.
                              </p>
                            </div>
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={loading || submitErrors.length > 0}
                          className={`mt-3 flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-xs font-bold transition ${
                            submitErrors.length === 0
                              ? "bg-brand-900 text-white shadow-card hover:-translate-y-0.5 hover:bg-brand-800 hover:shadow-card-hover"
                              : "cursor-not-allowed bg-brand-800/8 text-brand-800/30"
                          }`}
                        >
                          {loading ? (
                            <>
                              <RefreshCw
                                className="h-3.5 w-3.5 animate-spin"
                                strokeWidth={1.75}
                              />
                              {uploadProgress >= 99
                                ? "Memeriksa..."
                                : "Mengunggah..."}
                            </>
                          ) : (
                            <>
                              Validasi & Import
                              <ChevronRight
                                className="h-3.5 w-3.5"
                                strokeWidth={2}
                              />
                            </>
                          )}
                        </button>
                      </div>
                    </motion.section>
                  )}
                </div>
              </div>
            )}

            {/* =================================================
                FOOTER
            ================================================= */}

            <div className="flex items-center justify-center gap-1.5 py-6 text-2xs font-medium text-brand-800/40">
              <ShieldCheck className="h-3 w-3" strokeWidth={1.75} />
              Dataset diperiksa otomatis sebelum disimpan.
            </div>
          </fieldset>
        </form>
      </div>
    </main>
  );
}
