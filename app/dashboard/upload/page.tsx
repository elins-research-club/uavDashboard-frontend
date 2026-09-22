"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowUpRight,
  Calendar,
  Check,
  ChevronRight,
  Layers,
  Lock,
  MapPin,
  Pencil,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Upload,
  Wand2,
  Workflow,
  X,
} from "lucide-react";

import { useUserRole } from "@/context/UserRoleContext";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { ErrorDetailObject, GeoMetadata } from "@/types/map";

import {
  LAYER_TYPE_CONFIG,
  layerOptions,
  detectLayer,
  formatFileSize,
  type BatchFileItem,
  type ManualSlotItem,
} from "./upload-config";

import {
  batchErrors,
  createManualSlot,
  metadataChecklist,
  normalizeBatchBase,
} from "./upload-helpers";

import {
  ManualUploadFlow,
  UploadReview,
  type ReviewChecklistItem,
} from "./ManualUploadFlow";

import {
  ActionButton,
  EASE,
  ICON_STROKE,
  IconBox,
  SectionHeader,
  buttonClass,
  cardClass,
  eyebrowClass,
  fadeUp,
  inputClass,
} from "./upload-ui";

import { useUploadDraftStore } from "@/lib/stores/uploadDraftStore";
import { useBakingStatusStore } from "@/lib/stores/bakingStatusStore";
import { BakingStatusBanner } from "./BakingStatusBanner";

const MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024 * 1024;
const MAX_FILE_SIZE_LABEL = "3 GB";

/* ============================================================
   STEP RAIL
============================================================ */

function StepRail({
  currentStep,
  isSuccess,
}: {
  currentStep: number;
  isSuccess: boolean;
}) {
  const steps = [
    {
      label: "Upload layer",
      hint: "Pilih layer & file",
      icon: Upload,
    },
    {
      label: "Detail dataset",
      hint: "Judul, lokasi, tanggal",
      icon: Calendar,
    },
    {
      label: "Review & kirim",
      hint: "Periksa sebelum submit",
      icon: ShieldCheck,
    },
    {
      label: "Selesai",
      hint: "Dataset tersimpan",
      icon: Check,
    },
  ];

  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      transition={{ delay: 0.11 }}
      className={cardClass}
    >
      <div className="border-b border-[#DCDDD8] px-5 py-5">
        <SectionHeader
          eyebrow="Workflow"
          title="Alur Upload"
          description="Empat langkah dari file mentah hingga dataset tersimpan."
          icon={Workflow}
        />
      </div>

      <div className="p-5">
        <div className="relative">
          <div className="absolute bottom-5 left-4 top-5 w-px bg-[#DCDDD8]" />

          <ol className="space-y-5">
            {steps.map((step, index) => {
              const num = index + 1;
              const done = isSuccess || currentStep > num;
              const active = !isSuccess && currentStep === num;
              const Icon = step.icon;

              return (
                <motion.li
                  key={step.label}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.35,
                    delay: 0.14 + index * 0.06,
                    ease: EASE,
                  }}
                  aria-current={active ? "step" : undefined}
                  className="relative flex gap-3"
                >
                  <motion.span
                    whileHover={{ scale: 1.08, rotate: -4 }}
                    className={cn(
                      "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center border",
                      done
                        ? "border-[#171717] bg-[#171717] text-white"
                        : active
                        ? "border-[#171717] bg-white text-[#171717]"
                        : "border-[#DCDDD8] bg-[#F4F5F2] text-[#B0B1AB]"
                    )}
                  >
                    {done ? (
                      <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                    ) : (
                      <Icon className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
                    )}

                    {active && (
                      <span className="pointer-events-none absolute -inset-1 animate-pulse border border-[#171717]/30 motion-reduce:animate-none" />
                    )}
                  </motion.span>

                  <div className="min-w-0 pt-0.5">
                    <p
                      className={cn(
                        "text-xs font-bold",
                        active || done ? "text-[#171717]" : "text-[#858780]"
                      )}
                    >
                      {step.label}
                    </p>

                    <p className="mt-1 text-[10px] font-medium leading-4 text-[#858780]">
                      {step.hint}
                    </p>
                  </div>
                </motion.li>
              );
            })}
          </ol>
        </div>
      </div>
    </motion.section>
  );
}

/* ============================================================
   SYSTEM STATUS
============================================================ */

function SystemStatusPanel({
  fileCount,
  totalBytes,
  loading,
  uploadProgress,
  pmtilesStatus = "idle",
  pmtilesProgress = { completed: 0, total: 0 },
}: {
  fileCount: number;
  totalBytes: number;
  loading: boolean;
  uploadProgress: number;
  pmtilesStatus?: "idle" | "uploading" | "baking" | "ready";
  pmtilesProgress?: { completed: number; total: number };
  createdMapId?: string | null;
}) {
  const capPct = Math.min(100, (totalBytes / MAX_FILE_SIZE_BYTES) * 100);

  const totalMB = totalBytes / (1024 * 1024);
  const isBaking = pmtilesStatus === "baking";
  const isValidating = !isBaking && uploadProgress >= 99;
  const stageLabel = isBaking
    ? "2. Kompilasi PMTiles"
    : isValidating
    ? "1. Memeriksa berkas"
    : "1. Upload berkas";
  const progress = isBaking
    ? pmtilesProgress.total > 0
      ? Math.round((pmtilesProgress.completed / pmtilesProgress.total) * 100)
      : undefined
    : isValidating
    ? undefined
    : uploadProgress;

  const rows: { label: string; value: string; accent?: boolean }[] = [
    { label: "Files", value: String(fileCount) },
    {
      label: "Ukuran",
      value: `${totalMB.toFixed(1)} MB / ${MAX_FILE_SIZE_LABEL}`,
    },
  ];

  const rowsAfterBar: { label: string; value: string; accent?: boolean }[] = [
    { label: "Format", value: ".tif / .tiff" },
    { label: "Batas per file", value: MAX_FILE_SIZE_LABEL },
    { label: "Output", value: "PMTiles", accent: true },
  ];

  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      transition={{ delay: 0.17 }}
      className="relative border border-[#171717] bg-[#171717] p-5 text-white"
    >
      {/* Wireframe dekorasi: di-clip sendiri agar card tidak perlu overflow-hidden */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <svg
          aria-hidden="true"
          viewBox="0 0 260 180"
          className="absolute bottom-0 right-0 h-full w-[240px] opacity-70"
        >
          <g fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1">
            <path d="M70 38L150 18L218 44L140 68Z" />
            <path d="M70 38V105L140 130V68" />
            <path d="M140 68L218 44V108L140 130" />
            <path d="M100 62L164 44L205 58L142 78Z" />
          </g>
        </svg>
      </div>

      <div className="relative">
        <span className="inline-flex items-center gap-2 border border-white/15 bg-white/5 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.1em] text-white/75">
          <Layers className="h-3 w-3" strokeWidth={ICON_STROKE} />
          Engine
        </span>

        <h2 className="mt-5 text-base font-bold">AMX GeoStream Engine</h2>

        <p className="mt-1.5 max-w-sm text-xs font-medium leading-5 text-white/60">
          Validasi CRS dan kompilasi PMTiles berjalan otomatis setelah upload.
        </p>

        <div className="my-4 h-px bg-white/10" />

        <div className="space-y-2.5 text-xs font-medium">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <span className="text-white/45">{row.label}</span>
              <span className="tabular-nums text-white">{row.value}</span>
            </div>
          ))}

          <div className="h-1.5 overflow-hidden bg-white/10">
            <div
              className="h-full bg-[#76B900] transition-all"
              style={{ width: `${capPct}%` }}
            />
          </div>

          {rowsAfterBar.map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <span className="text-white/45">{row.label}</span>
              <span className={row.accent ? "text-[#76B900]" : "text-white"}>
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* Keep the live region mounted; announce stage changes, not every percent. */}
        <p
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {loading
            ? `${stageLabel}. Formulir dikunci selama proses berlangsung.`
            : ""}
        </p>

        {loading && (
          <div
            id="upload-engine-progress"
            className="mt-4 space-y-2 border-t border-white/10 pt-4"
          >
            <div className="flex items-center justify-between gap-2 text-[10px]">
              <span className="flex items-center gap-1.5 font-bold text-[#76B900]">
                <RefreshCw
                  className="h-3 w-3 shrink-0 animate-spin motion-reduce:animate-none"
                  strokeWidth={ICON_STROKE}
                  aria-hidden="true"
                />
                {stageLabel}
              </span>
              <span className="font-bold tabular-nums text-white">
                {isBaking
                  ? `${pmtilesProgress.completed}/${pmtilesProgress.total} layer`
                  : isValidating
                  ? "Menunggu server"
                  : `${uploadProgress}%`}
              </span>
            </div>

            <div
              role="progressbar"
              aria-label={stageLabel}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              aria-valuetext={
                progress === undefined ? "Menunggu respons server" : undefined
              }
              className="h-1.5 overflow-hidden bg-white/10"
            >
              <div
                className={`h-full bg-[#76B900] ${
                  progress === undefined
                    ? "animate-pulse motion-reduce:animate-none"
                    : "transition-[width] duration-300 motion-reduce:transition-none"
                }`}
                style={{
                  width: progress === undefined ? "100%" : `${progress}%`,
                }}
              />
            </div>

            <p className="text-[10px] font-medium leading-4 text-white/60">
              {isBaking
                ? "Membangun piramida ubin untuk render instan di peta."
                : isValidating
                ? "Menunggu pemeriksaan berkas oleh server."
                : "Mengirim berkas ke server."}{" "}
              Formulir dikunci selama proses berlangsung.
            </p>
          </div>
        )}
      </div>
    </motion.section>
  );
}

/* ============================================================
   FIELD LABEL
============================================================ */

function FieldLabel({
  children,
  required,
  htmlFor,
}: {
  children: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-xs font-bold text-[#171717]"
    >
      {children}

      {required && <span className="ml-1 font-medium text-[#B0B1AB]">*</span>}
    </label>
  );
}

/* ============================================================
   COLLAPSED SUMMARY
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
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      className="flex items-center justify-between gap-3 border border-[#DCDDD8] bg-[#FAFAF8] px-4 py-3.5"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-[#171717] text-white">
          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
        </span>

        <div className="min-w-0">
          <p className="text-xs font-bold text-[#171717]">{title}</p>

          <p className="mt-0.5 truncate text-[10px] font-medium tabular-nums text-[#858780]">
            {detail}
          </p>
        </div>
      </div>

      <ActionButton variant="secondary" size="sm" onClick={onEdit}>
        <Pencil className="h-3 w-3" strokeWidth={2} />
        Ubah
      </ActionButton>
    </motion.div>
  );
}

/* ============================================================
   LOCKED SECTION
============================================================ */

function LockedSection({ title, reason }: { title: string; reason: string }) {
  return (
    <div className="border border-dashed border-[#DCDDD8] bg-[#FAFAF8] px-4 py-5">
      <div className="flex items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-[#DCDDD8] bg-white text-[#B0B1AB]">
          <Lock className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
        </span>

        <div>
          <p className="text-xs font-bold text-[#858780]">{title}</p>

          <p className="mt-0.5 text-[10px] font-medium text-[#B0B1AB]">
            {reason}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   DETECTION STATUS
============================================================ */

function DetectionStatus({ item }: { item: BatchFileItem }) {
  if (item.detection_status === "reading") {
    return (
      <div className="mt-0.5 flex items-center gap-1.5">
        <RefreshCw
          className="h-2.5 w-2.5 animate-spin text-[#858780] motion-reduce:animate-none"
          strokeWidth={2}
        />

        <span className="text-[10px] font-medium text-[#858780]">
          Membaca metadata...
        </span>
      </div>
    );
  }

  if (item.detection_source === "metadata") {
    return (
      <div className="mt-0.5 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 bg-[#76B900]" />

        <span className="text-[10px] font-medium text-[#33332F]">
          Terdeteksi dari metadata
        </span>
      </div>
    );
  }

  if (item.detection_source === "raster-structure") {
    return (
      <div className="mt-0.5 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 bg-sky-500" />

        <span className="text-[10px] font-medium text-sky-700">
          Terdeteksi dari struktur raster
        </span>
      </div>
    );
  }

  if (item.detection_source === "filename") {
    return (
      <div className="mt-0.5 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 bg-amber-500" />

        <span className="text-[10px] font-medium text-amber-700">
          Terdeteksi dari nama file
        </span>
      </div>
    );
  }

  if ((item.detection_source as string) === "manual") {
    return (
      <div className="mt-0.5 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 bg-[#171717]" />

        <span className="text-[10px] font-medium text-[#33332F]">
          Dipilih manual
        </span>
      </div>
    );
  }

  return (
    <div className="mt-0.5 flex items-center gap-1.5">
      <span className="h-1.5 w-1.5 bg-red-500" />

      <span className="text-[10px] font-medium text-red-600">
        Tidak yakin · pilih manual
      </span>
    </div>
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function UploadPage() {
  const router = useRouter();
  const { user, hasPermission } = useUserRole();

  /* ------------------------------------------------------------
     DRAFT STATE (persisten lintas navigasi & reload — kecuali File
     mentah yang memang tidak bisa disimpan lewat localStorage)
  ------------------------------------------------------------ */

  const {
    uploadMode,
    setUploadMode,
    title,
    setTitle,
    location,
    setLocation,
    surveyDate,
    setSurveyDate,
    description,
    setDescription,
    lockedForFree,
    setLockedForFree,
    purchasable,
    setPurchasable,
    batchFiles,
    setBatchFiles,
    manualSlots,
    setManualSlots,
    expandedBatchItems,
    setExpandedBatchItems,
    editingFiles,
    setEditingFiles,
    editingDetails,
    setEditingDetails,
    filesConfirmed,
    setFilesConfirmed,
    detailsConfirmed,
    setDetailsConfirmed,
    resetDraft,
  } = useUploadDraftStore();

  const startBakingTracking = useBakingStatusStore((s) => s.startTracking);

  const [dragActive, setDragActive] = useState(false); // indikator drag sesaat, tidak perlu persist

  /* ------------------------------------------------------------
     SUBMIT
  ------------------------------------------------------------ */

  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pmtilesStatus, setPmtilesStatus] = useState<
    "idle" | "uploading" | "baking" | "ready"
  >("idle");
  const [pmtilesProgress, setPmtilesProgress] = useState<{
    completed: number;
    total: number;
  }>({ completed: 0, total: 0 });
  const [createdMapId, setCreatedMapId] = useState<string | null>(null);
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
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  /* ============================================================
     ROLE GUARD
  ============================================================ */

  useEffect(() => {
    if (user && !hasPermission("upload_map")) {
      router.push("/dashboard");
    }
  }, [user, router, hasPermission]);

  /* ============================================================
     MANUAL READINESS
  ============================================================ */

  const manualLayerErrors = manualSlots.map((slot) => {
    const errors: string[] = [];

    if (!slot.file) {
      errors.push("File belum dipilih.");
    }

    if (!slot.name.trim()) {
      errors.push("Nama layer wajib diisi.");
    }

    if (!slot.layer_type) {
      errors.push("Tipe layer belum dipilih.");
    }

    return errors;
  });

  const manualFiles = manualSlots
    .filter((slot) => slot.file)
    .map((slot) => slot.file as File);

  const manualFilesReady =
    manualSlots.length > 0 &&
    manualSlots.every(
      (slot) => Boolean(slot.file) && Boolean(slot.name.trim())
    );

  const detailReady =
    Boolean(title.trim()) && Boolean(location.trim()) && Boolean(surveyDate);

  const metaChecklist = metadataChecklist(title, location, surveyDate);

  const metadataStillReading =
    uploadMode === "batch" &&
    batchFiles.some((item) => item.detection_status === "reading");

  const submitErrors =
    uploadMode === "manual"
      ? [
          ...(manualSlots.length
            ? manualLayerErrors.flat()
            : ["Tambahkan minimal satu layer."]),
          ...(!title.trim() ? ["Judul peta wajib diisi."] : []),
          ...(!location.trim() ? ["Lokasi survei wajib diisi."] : []),
          ...(!surveyDate ? ["Tanggal survei wajib diisi."] : []),
        ]
      : batchErrors(batchFiles, title, location, surveyDate);

  const filesReady =
    uploadMode === "batch"
      ? batchFiles.length > 0 &&
        batchFiles.filter((item) => item.is_base).length === 1 &&
        !metadataStillReading &&
        batchFiles.every((item) => Boolean(item.name.trim()))
      : manualFilesReady;

  // Section berikutnya hanya terbuka setelah user MENEKAN tombol
  // "Lanjutkan...", bukan otomatis begitu data lengkap.
  const detailsUnlocked = filesConfirmed;
  const reviewUnlocked = filesConfirmed && detailsConfirmed;

  const currentStep = isSuccess
    ? 4
    : !filesConfirmed
    ? 1
    : !detailsConfirmed
    ? 2
    : 3;

  const showFilesEditor = editingFiles || !filesReady;

  const showDetailsEditor = editingDetails || !detailReady;

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
            ready: batchFiles.every((item) => Boolean(item.name.trim())),
          },
          ...metaChecklist,
        ]
      : [
          {
            label: "Minimal satu layer dipilih",
            ready: manualSlots.length > 0,
          },
          {
            label: "Semua layer memiliki file",
            ready:
              manualSlots.length > 0 &&
              manualSlots.every((slot) => Boolean(slot.file)),
          },
          {
            label: "Semua layer memiliki nama",
            ready:
              manualSlots.length > 0 &&
              manualSlots.every((slot) => Boolean(slot.name.trim())),
          },
          ...metaChecklist,
        ];

  const reviewFiles =
    uploadMode === "batch" ? batchFiles.map((item) => item.file) : manualFiles;

  const reviewTotalBytes = reviewFiles.reduce(
    (total, file) => total + file.size,
    0
  );

  const totalSizeMB = reviewTotalBytes / (1024 * 1024);

  /* ============================================================
     BATCH STATE UPDATE
  ============================================================ */

  const updateBatchLayerType = (id: string, layerType: string) => {
    setBatchFiles((prev): BatchFileItem[] => {
      const config = LAYER_TYPE_CONFIG[layerType];

      if (!config) {
        return prev;
      }

      let next: BatchFileItem[] = prev.map((item): BatchFileItem => {
        if (item.id !== id) {
          return item;
        }

        const isDefaultName =
          !item.name ||
          item.name === "Membaca metadata..." ||
          Object.values(LAYER_TYPE_CONFIG).some(
            (itemConfig) => itemConfig.defaultName === item.name
          );

        return {
          ...item,

          layer_type: layerType,

          name: isDefaultName ? config.defaultName : item.name,

          default_opacity: config.defaultOpacity,

          is_base: layerType === "ortho",

          detection_status: "detected",

          detection_source: "manual",

          detection_confidence: "high",

          detection_reason: "Tipe layer dipilih secara manual oleh pengguna.",
        };
      });

      if (layerType === "ortho") {
        next = next.map(
          (item): BatchFileItem => ({
            ...item,
            is_base: item.id === id,
          })
        );
      }

      return normalizeBatchBase(next);
    });
  };

  const handleUpdateBatchItem = (
    id: string,
    field: keyof BatchFileItem,
    value: any
  ) => {
    if (field === "layer_type") {
      updateBatchLayerType(id, String(value));

      return;
    }

    setBatchFiles((prev): BatchFileItem[] =>
      prev.map((item): BatchFileItem => {
        if (item.id !== id) {
          return item;
        }

        return {
          ...item,
          [field]: value,
        };
      })
    );
  };

  /* ============================================================
     FILE HANDLING
  ============================================================ */

  const processIncomingFiles = async (incoming: FileList | File[]) => {
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

    const newItems: BatchFileItem[] = validFiles.map((file, index) => ({
      id: `${Date.now()}-${index}-${Math.random()}`,
      file,
      name: "Membaca metadata...",
      layer_type: "custom",
      is_base: false,
      default_opacity: LAYER_TYPE_CONFIG.custom.defaultOpacity,
      detection_status: "reading",
    }));

    setBatchFiles((prev) => normalizeBatchBase([...prev, ...newItems]));

    const detectionResults = await Promise.all(
      newItems.map(async (item) => {
        try {
          const detected = await detectLayer(item.file);

          return {
            id: item.id,
            detected,
          };
        } catch {
          return {
            id: item.id,
            detected: {
              layer_type: "custom",
              name: LAYER_TYPE_CONFIG.custom.defaultName,
              is_base: false,
              default_opacity: LAYER_TYPE_CONFIG.custom.defaultOpacity,
              detection_source: "uncertain" as const,
              detection_confidence: "low" as const,
              detection_reason:
                "Tipe layer tidak dapat dibaca secara otomatis.",
            },
          };
        }
      })
    );

    setBatchFiles((prev) =>
      normalizeBatchBase(
        prev.map((item) => {
          const result = detectionResults.find((entry) => entry.id === item.id);

          if (!result) {
            return item;
          }

          const detected = result.detected;

          return {
            ...item,
            name: detected.name,
            layer_type: detected.layer_type,
            is_base: detected.is_base,
            default_opacity: detected.default_opacity,
            detection_status:
              detected.detection_confidence === "low"
                ? "uncertain"
                : "detected",
            detection_source: detected.detection_source,
            detection_confidence: detected.detection_confidence,
            detection_reason: detected.detection_reason,
          };
        })
      )
    );

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

    const messages: string[] = [];

    if (tooLarge.length) {
      messages.push(
        `${tooLarge.length} file melebihi ${MAX_FILE_SIZE_LABEL} dan dilewati`
      );
    }

    if (wrongFormatCount) {
      messages.push(`${wrongFormatCount} file bukan .tif/.tiff dan dilewati`);
    }

    setMessage(messages.length ? `${messages.join(", ")}.` : "");

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
      void processIncomingFiles(event.dataTransfer.files);
    }
  };

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files?.length) {
      void processIncomingFiles(event.target.files);
    }

    event.target.value = "";
  };

  const handleSetBaseLayer = (id: string) => {
    setBatchFiles((prev): BatchFileItem[] =>
      normalizeBatchBase(
        prev.map((item): BatchFileItem => {
          if (item.id === id) {
            return {
              ...item,

              is_base: true,

              layer_type: "ortho",

              default_opacity: 1,

              name:
                !item.name || item.name === "Membaca metadata..."
                  ? LAYER_TYPE_CONFIG.ortho.defaultName
                  : item.name,

              detection_status: "detected",

              detection_source: "manual",

              detection_confidence: "high",

              detection_reason:
                "Layer utama ditetapkan secara manual oleh pengguna.",
            };
          }

          return {
            ...item,
            is_base: false,
          };
        })
      )
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
     MANUAL MODE
  ============================================================ */

  const handleAddManualLayer = (layerType?: ManualSlotItem["layer_type"]) => {
    setManualSlots((prev) => {
      const slot = createManualSlot(crypto.randomUUID(), prev[prev.length - 1]);

      if (layerType && LAYER_TYPE_CONFIG[layerType]) {
        slot.layer_type = layerType;
        slot.default_opacity = LAYER_TYPE_CONFIG[layerType].defaultOpacity;

        const currentNameIsDefault =
          !slot.name ||
          Object.values(LAYER_TYPE_CONFIG).some(
            (config) => config.defaultName === slot.name
          );

        if (currentNameIsDefault) {
          slot.name = LAYER_TYPE_CONFIG[layerType].defaultName;
        }
      }

      return [...prev, slot];
    });

    setMessage("");
    setGeoError(null);
  };

  const handleRemoveManualLayer = (id: string) => {
    setManualSlots((prev) => prev.filter((slot) => slot.id !== id));
  };

  const handleUpdateManualLayer = <K extends keyof ManualSlotItem>(
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
     RESET
  ============================================================ */

  const resetForNewUpload = () => {
    setIsSuccess(false);
    setGeoSuccess(null);
    setMessage("");
    setGeoError(null);
    setPmtilesStatus("idle");
    setPmtilesProgress({ completed: 0, total: 0 });
    setCreatedMapId(null);

    resetDraft();
  };

  const switchUploadMode = (mode: "batch" | "manual") => {
    setUploadMode(mode);
    setMessage("");
    setGeoError(null);
    setEditingFiles(true);
    setFilesConfirmed(false);
    setDetailsConfirmed(false);
  };

  /* ============================================================
     SUBMIT
  ============================================================ */

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (loading || submitting.current) {
      return;
    }

    if (metadataStillReading) {
      setMessage("Tunggu hingga seluruh metadata GeoTIFF selesai dibaca.");
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
      if (!batchFiles.length) {
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
      if (!manualSlots.length) {
        setMessage("Tambahkan minimal satu layer.");
        return;
      }

      if (
        manualSlots.some(
          (slot) => !slot.file || !slot.name.trim() || !slot.layer_type
        )
      ) {
        setMessage("Lengkapi seluruh layer sebelum mengunggah.");
        return;
      }

      manualSlots.forEach((slot, index) => {
        if (!slot.file) {
          return;
        }

        filesToUpload.push(slot.file);

        layersConfigPayload.push({
          filename: slot.file.name,
          name: slot.name.trim() || `Layer ${index + 1}`,
          layer_type: slot.layer_type,
          default_opacity: slot.default_opacity,
          is_base: index === 0,
        });
      });
    }

    submitting.current = true;

    setLoading(true);
    setUploadProgress(0);
    setPmtilesStatus("uploading");
    setPmtilesProgress({ completed: 0, total: filesToUpload.length });
    setCreatedMapId(null);
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
          if (!total) {
            return;
          }

          const percentage = Math.round((loaded * 100) / total);

          setUploadProgress(percentage >= 100 ? 99 : percentage);
        },
      });

      setUploadProgress(100);
      const mapData = response.data;
      const mapId = mapData.id;
      const totalLayers = mapData.layers?.length || filesToUpload.length;
      setCreatedMapId(mapId);

      // Fase 2: Polling status kompilasi PMTiles riil
      setPmtilesStatus("baking");
      setPmtilesProgress({ completed: 0, total: totalLayers });

      const maxAttempts = 60; // 60 * 1.5s = 90 detik batas waktu polling
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (!isMounted.current) break;
        await new Promise((r) => setTimeout(r, 1500));
        if (!isMounted.current) break;

        try {
          const checkRes = await api.get(`/maps/${mapId}/layers`);
          const layers = checkRes.data;
          if (Array.isArray(layers) && layers.length > 0) {
            const completed = layers.filter(
              (l: any) => l.conversion_status === "completed"
            ).length;
            const failed = layers.filter(
              (l: any) => l.conversion_status === "failed"
            ).length;

            setPmtilesProgress({ completed, total: layers.length });

            if (completed + failed >= layers.length) {
              break;
            }
          }
        } catch {
          // Abaikan kesalahan sementara pada polling
        }
      }

      setPmtilesStatus("ready");
      setIsSuccess(true);

      setGeoSuccess({
        title: response.data.title,
        mapId: response.data.id,
        totalLayers: response.data.layers?.length || filesToUpload.length,
        metadata: response.data.geo_metadata,
      });

      // Mulai lacak proses baking PMTiles di background — status ini
      // bertahan lintas navigasi halaman DAN lintas reload browser,
      // sampai backend melaporkan completed/failed untuk semua layer.
      startBakingTracking(response.data.id, response.data.title, []);

      // Bersihkan draft form (file, metadata, konfirmasi step) supaya
      // siap untuk upload berikutnya.
      resetDraft();
    } catch (error: any) {
      setPmtilesStatus("idle");
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

  const modes = [
    { value: "batch" as const, label: "Mudah", icon: Wand2 },
    { value: "manual" as const, label: "Manual", icon: SlidersHorizontal },
  ];

  return (
    <main className="min-h-screen bg-[#F4F5F2] text-[#171717]">
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
        {/* ==================================================
            HEADER
        =================================================== */}

        <motion.header
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="relative mb-7"
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="mt-2 text-3xl font-bold tracking-[-0.05em] text-[#171717] sm:text-4xl">
                Unggah Dataset
              </h1>

              <p className="mt-2 max-w-2xl text-xs font-medium leading-5 text-[#6B6B66]">
                Tambahkan hasil survei Anda ke dalam peta.
              </p>
            </div>

            <div className="flex items-end gap-2 sm:gap-4">
              <div className="hidden border-l border-[#DCDDD8] pl-4 sm:block">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#858780]">
                  Upload Status
                </p>

                <div className="mt-1.5 flex items-center gap-2">
                  <motion.span
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{
                      duration: 1.8,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className={cn(
                      "h-1.5 w-1.5",
                      loading ? "bg-amber-500" : "bg-[#76B900]"
                    )}
                  />

                  <span className="text-xs font-bold text-[#33332F]">
                    {loading ? "Memproses" : "Available"}
                  </span>
                </div>
              </div>

              <motion.div
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2, ease: EASE }}
              >
                <Link
                  href="/dashboard/maps"
                  className={cn(buttonClass("primary"), "group")}
                >
                  Lihat Map
                  <ArrowUpRight
                    className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    strokeWidth={ICON_STROKE}
                  />
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.header>

        {/* Menunjukkan status baking PMTiles dari upload sebelumnya,
            bertahan lintas navigasi & reload halaman. */}
        <BakingStatusBanner
          suppressed={loading}
          uploadedDataset={isSuccess ? geoSuccess : null}
          onNewUpload={isSuccess ? resetForNewUpload : undefined}
        />

        <form onSubmit={handleSubmit} noValidate>
          <fieldset disabled={loading} className="min-w-0 border-0 p-0">
            <legend className="sr-only">Formulir upload dataset</legend>

            <AnimatePresence initial={false}>
              {!isSuccess && (geoError || message) && (
                <motion.section
                  key="upload-error"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  role="alert"
                  className="mb-4 border border-red-200 bg-red-50 p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-red-200 bg-white text-red-600">
                      <AlertCircle
                        className="h-4 w-4"
                        strokeWidth={ICON_STROKE}
                      />
                    </span>

                    <div className="min-w-0">
                      <p className="text-xs font-bold text-red-900">
                        {geoError?.message || message}
                      </p>

                      {geoError?.details?.missing_requirements && (
                        <ul className="mt-2 space-y-1 pl-4 text-xs font-medium leading-5 text-red-900">
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
                        <div className="mt-3 border border-red-200 bg-white/70 p-3">
                          <p className="text-xs font-medium leading-5 text-red-900">
                            <strong>Solusi GIS:</strong>{" "}
                            {geoError.details.solution}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            {!isSuccess && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.85fr)]">
                {/* ==================================================
                    RIGHT COLUMN (step rail + engine)
                =================================================== */}

                <aside className="lg:order-2">
                  <div className="space-y-4 lg:sticky lg:top-6">
                    <StepRail currentStep={currentStep} isSuccess={isSuccess} />

                    <SystemStatusPanel
                      fileCount={reviewFiles.length}
                      totalBytes={reviewTotalBytes}
                      loading={loading}
                      uploadProgress={uploadProgress}
                      pmtilesStatus={pmtilesStatus}
                      pmtilesProgress={pmtilesProgress}
                      createdMapId={createdMapId}
                    />
                  </div>
                </aside>

                {/* ==================================================
                    MAIN COLUMN
                =================================================== */}

                <div
                  aria-busy={loading}
                  className="min-w-0 space-y-4 lg:order-1"
                >
                  {/* Metode upload */}
                  <motion.section
                    initial="hidden"
                    animate="visible"
                    variants={fadeUp}
                    transition={{ delay: 0.05 }}
                    className={cn(
                      cardClass,
                      "flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                    )}
                  >
                    <div>
                      <p className={eyebrowClass}>Metode upload</p>

                      <p className="mt-1 text-xs font-medium leading-5 text-[#6B6B66]">
                        Mode Mudah cocok untuk upload otomatis, Manual untuk
                        memilih layer satu per satu.
                      </p>
                    </div>

                    <div
                      role="group"
                      aria-label="Metode upload"
                      className="inline-flex w-fit shrink-0 border border-[#DCDDD8] bg-[#F4F5F2] p-1"
                    >
                      {modes.map((mode) => {
                        const active = uploadMode === mode.value;
                        const ModeIcon = mode.icon;

                        return (
                          <button
                            key={mode.value}
                            type="button"
                            aria-pressed={active}
                            onClick={() => switchUploadMode(mode.value)}
                            className="relative inline-flex items-center gap-1.5 px-4 py-2 text-[10px] font-bold outline-none focus-visible:ring-2 focus-visible:ring-[#171717]/20"
                          >
                            {active && (
                              <motion.span
                                layoutId="upload-mode-pill"
                                transition={{ duration: 0.25, ease: EASE }}
                                className="absolute inset-0 bg-[#171717]"
                              />
                            )}

                            <span
                              className={cn(
                                "relative z-10 inline-flex items-center gap-1.5 transition-colors",
                                active
                                  ? "text-white"
                                  : "text-[#6B6B66] hover:text-[#171717]"
                              )}
                            >
                              <ModeIcon
                                className="h-3.5 w-3.5"
                                strokeWidth={ICON_STROKE}
                              />
                              {mode.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.section>

                  {/* ==================================================
                      STEP 1 — UPLOAD LAYER
                  =================================================== */}

                  {showFilesEditor ? (
                    <motion.section
                      initial="hidden"
                      animate="visible"
                      variants={fadeUp}
                      transition={{ delay: 0.08 }}
                      className={cardClass}
                    >
                      <div className="border-b border-[#DCDDD8] px-5 py-5 sm:px-6">
                        <SectionHeader
                          eyebrow="Langkah 01"
                          title="Upload layer"
                          icon={Upload}
                          description={
                            uploadMode === "batch"
                              ? "Pilih file hasil survei untuk dideteksi otomatis berdasarkan metadata, struktur raster, dan nama file."
                              : "Tambahkan layer sesuai kebutuhan. Tidak perlu upload ortho terlebih dahulu."
                          }
                        />
                      </div>

                      <div className="p-4 sm:p-5">
                        {uploadMode === "batch" && (
                          <div>
                            <div
                              onDragEnter={handleDrag}
                              onDragLeave={handleDrag}
                              onDragOver={handleDrag}
                              onDrop={handleDrop}
                              className={cn(
                                "flex min-h-[190px] flex-col items-center justify-center border-2 border-dashed px-5 py-7 text-center transition-colors duration-200",
                                dragActive
                                  ? "border-[#171717] bg-[#FAFAF8]"
                                  : "border-[#DCDDD8] bg-white hover:border-[#CFCFC8] hover:bg-[#FAFAF8]"
                              )}
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

                              <motion.div
                                animate={{ y: dragActive ? -4 : 0 }}
                                transition={{ duration: 0.22, ease: EASE }}
                              >
                                <IconBox icon={Upload} />
                              </motion.div>

                              <h3 className="mt-3 text-sm font-bold text-[#171717]">
                                Pilih file GeoTIFF
                              </h3>

                              <p className="mt-1 text-xs font-medium text-[#6B6B66]">
                                atau tarik file ke sini
                              </p>

                              <label
                                htmlFor="multiFileInput"
                                className={cn(
                                  buttonClass("primary"),
                                  "mt-3 cursor-pointer"
                                )}
                              >
                                Pilih File
                              </label>

                              <p className="mt-2 text-[10px] font-medium text-[#858780]">
                                .TIF / .TIFF · maks {MAX_FILE_SIZE_LABEL} per
                                file
                              </p>
                            </div>

                            {batchFiles.length > 0 && (
                              <div className="mt-4">
                                <div className="mb-2 flex items-center justify-between">
                                  <div>
                                    <p className="text-xs font-bold text-[#171717]">
                                      {batchFiles.length} file dipilih
                                    </p>

                                    <p className="text-[10px] font-medium tabular-nums text-[#858780]">
                                      {totalSizeMB.toFixed(1)} MB
                                    </p>
                                  </div>

                                  <ActionButton
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setBatchFiles([]);
                                      setExpandedBatchItems(new Set());
                                    }}
                                    className="hover:!bg-red-50 hover:!text-red-600"
                                  >
                                    Hapus semua
                                  </ActionButton>
                                </div>

                                <div className="max-h-[340px] overflow-y-auto border border-[#DCDDD8] bg-white">
                                  {batchFiles.map((item, index) => {
                                    const config =
                                      LAYER_TYPE_CONFIG[item.layer_type] ||
                                      LAYER_TYPE_CONFIG.custom;

                                    const expanded = expandedBatchItems.has(
                                      item.id
                                    );

                                    const uncertain =
                                      item.detection_source === "uncertain";

                                    return (
                                      <div
                                        key={item.id}
                                        className={
                                          index < batchFiles.length - 1
                                            ? "border-b border-[#DCDDD8]"
                                            : ""
                                        }
                                      >
                                        <div className="flex items-center gap-2.5 px-3 py-2.5">
                                          <span
                                            className={cn(
                                              "h-2 w-2 shrink-0",
                                              item.is_base
                                                ? "bg-[#171717]"
                                                : uncertain
                                                ? "bg-red-400"
                                                : "bg-[#DCDDD8]"
                                            )}
                                          />

                                          <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                              <span
                                                className={`border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${config.badgeClass}`}
                                              >
                                                {config.label}
                                              </span>

                                              {item.is_base && (
                                                <span className="border border-[#DCDDD8] bg-[#F4F5F2] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#33332F]">
                                                  utama
                                                </span>
                                              )}

                                              <span className="min-w-0 truncate text-[10px] font-medium text-[#858780]">
                                                {item.file.name}
                                              </span>
                                            </div>

                                            <div className="mt-1">
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
                                                disabled={
                                                  item.detection_status ===
                                                  "reading"
                                                }
                                                className="w-full max-w-sm border-0 bg-transparent p-0 text-xs font-bold text-[#171717] outline-none placeholder:text-[#B0B1AB] disabled:cursor-wait disabled:opacity-50"
                                                placeholder="Nama layer"
                                              />

                                              <DetectionStatus item={item} />

                                              {uncertain && (
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    toggleBatchItemExpanded(
                                                      item.id
                                                    )
                                                  }
                                                  className="mt-1.5 inline-flex items-center gap-1 border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-bold text-red-700 outline-none transition-colors hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-[#171717]/20"
                                                >
                                                  <Pencil
                                                    className="h-2.5 w-2.5"
                                                    strokeWidth={2}
                                                  />
                                                  Edit Deteksi
                                                </button>
                                              )}
                                            </div>
                                          </div>

                                          <span className="hidden shrink-0 text-[10px] font-medium tabular-nums text-[#858780] sm:block">
                                            {formatFileSize(item.file.size)}
                                          </span>

                                          <button
                                            type="button"
                                            aria-expanded={expanded}
                                            onClick={() =>
                                              toggleBatchItemExpanded(item.id)
                                            }
                                            className={cn(
                                              "flex h-7 w-7 shrink-0 items-center justify-center border outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#171717]/20",
                                              expanded
                                                ? "border-[#171717] bg-[#171717] text-white"
                                                : "border-[#DCDDD8] bg-white text-[#6B6B66] hover:bg-[#FAFAF8] hover:text-[#171717]"
                                            )}
                                            aria-label="Edit tipe dan pengaturan layer"
                                          >
                                            <SlidersHorizontal
                                              className="h-3.5 w-3.5"
                                              strokeWidth={ICON_STROKE}
                                            />
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleRemoveBatchItem(item.id)
                                            }
                                            className="flex h-7 w-7 shrink-0 items-center justify-center border border-transparent text-[#B0B1AB] outline-none transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-[#171717]/20"
                                            aria-label="Hapus layer"
                                          >
                                            <X
                                              className="h-3.5 w-3.5"
                                              strokeWidth={ICON_STROKE}
                                            />
                                          </button>
                                        </div>

                                        <AnimatePresence initial={false}>
                                          {expanded && (
                                            <motion.div
                                              initial={{
                                                height: 0,
                                                opacity: 0,
                                              }}
                                              animate={{
                                                height: "auto",
                                                opacity: 1,
                                              }}
                                              exit={{ height: 0, opacity: 0 }}
                                              transition={{
                                                duration: 0.28,
                                                ease: EASE,
                                              }}
                                              className="overflow-hidden"
                                            >
                                              <div className="border-t border-[#DCDDD8] bg-[#FAFAF8] px-3 py-3">
                                                <div className="mb-2 border border-[#DCDDD8] bg-white p-2.5">
                                                  <div className="mb-1.5 flex items-center justify-between gap-2">
                                                    <span className="text-[10px] font-bold text-[#171717]">
                                                      Tipe layer
                                                    </span>

                                                    {uncertain && (
                                                      <span className="border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
                                                        Perlu dipilih
                                                      </span>
                                                    )}
                                                  </div>

                                                  <select
                                                    value={item.layer_type}
                                                    disabled={
                                                      item.detection_status ===
                                                      "reading"
                                                    }
                                                    onChange={(event) =>
                                                      handleUpdateBatchItem(
                                                        item.id,
                                                        "layer_type",
                                                        event.target.value
                                                      )
                                                    }
                                                    className="w-full border border-[#DCDDD8] bg-white px-2.5 py-2 text-[10px] font-bold text-[#171717] outline-none transition-colors hover:border-[#CFCFC8] focus:border-[#171717] focus:ring-2 focus:ring-[#171717]/10 disabled:cursor-wait disabled:opacity-50"
                                                  >
                                                    {layerOptions.map(
                                                      (option) => (
                                                        <option
                                                          key={option.value}
                                                          value={option.value}
                                                        >
                                                          {option.label}
                                                        </option>
                                                      )
                                                    )}
                                                  </select>

                                                  <p className="mt-1.5 text-[10px] font-medium leading-4 text-[#858780]">
                                                    {uncertain
                                                      ? "Sistem belum yakin. Pilih tipe layer secara manual."
                                                      : "Anda dapat mengubah hasil deteksi kapan saja."}
                                                  </p>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2">
                                                  {!item.is_base && (
                                                    <ActionButton
                                                      variant="secondary"
                                                      size="sm"
                                                      disabled={
                                                        item.detection_status ===
                                                        "reading"
                                                      }
                                                      onClick={() =>
                                                        handleSetBaseLayer(
                                                          item.id
                                                        )
                                                      }
                                                    >
                                                      Jadikan utama
                                                    </ActionButton>
                                                  )}

                                                  <div className="flex min-w-[160px] flex-1 items-center gap-2">
                                                    <span className="text-[10px] font-bold text-[#171717]">
                                                      Opasitas
                                                    </span>

                                                    <input
                                                      type="range"
                                                      min="0"
                                                      max="1"
                                                      step="0.05"
                                                      value={
                                                        item.default_opacity
                                                      }
                                                      aria-label="Opasitas layer"
                                                      onChange={(event) =>
                                                        handleUpdateBatchItem(
                                                          item.id,
                                                          "default_opacity",
                                                          parseFloat(
                                                            event.target.value
                                                          )
                                                        )
                                                      }
                                                      className="w-full accent-[#171717]"
                                                    />

                                                    <span className="w-9 text-right text-[10px] font-bold tabular-nums text-[#171717]">
                                                      {Math.round(
                                                        item.default_opacity *
                                                          100
                                                      )}
                                                      %
                                                    </span>
                                                  </div>
                                                </div>

                                                {item.detection_reason && (
                                                  <div className="mt-2 border border-[#DCDDD8] bg-white px-2.5 py-2">
                                                    <p className="text-[10px] font-medium leading-4 text-[#858780]">
                                                      {item.detection_reason}
                                                    </p>
                                                  </div>
                                                )}
                                              </div>
                                            </motion.div>
                                          )}
                                        </AnimatePresence>
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
                            slots={manualSlots}
                            addLayer={handleAddManualLayer}
                            removeLayer={handleRemoveManualLayer}
                            updateLayer={handleUpdateManualLayer}
                            errors={manualLayerErrors}
                          />
                        )}

                        {filesReady && (
                          <div className="mt-5 flex justify-end border-t border-[#DCDDD8] pt-4">
                            <ActionButton
                              onClick={() => {
                                setEditingFiles(false);
                                setFilesConfirmed(true);
                              }}
                            >
                              Lanjutkan ke detail dataset
                              <ChevronRight
                                className="h-3.5 w-3.5"
                                strokeWidth={ICON_STROKE}
                              />
                            </ActionButton>
                          </div>
                        )}
                      </div>
                    </motion.section>
                  ) : (
                    <CollapsedSummary
                      title="Upload layer"
                      detail={`${
                        reviewFiles.length
                      } layer · ${totalSizeMB.toFixed(1)} MB`}
                      onEdit={() => setEditingFiles(true)}
                    />
                  )}

                  {/* ==================================================
                      STEP 2 — DETAIL DATASET
                  =================================================== */}

                  {!detailsUnlocked ? (
                    <LockedSection
                      title="Detail dataset"
                      reason="Selesaikan upload layer terlebih dahulu"
                    />
                  ) : showDetailsEditor ? (
                    <motion.section
                      initial="hidden"
                      animate="visible"
                      variants={fadeUp}
                      className={cardClass}
                    >
                      <div className="border-b border-[#DCDDD8] px-5 py-5 sm:px-6">
                        <SectionHeader
                          eyebrow="Langkah 02"
                          title="Detail dataset"
                          description="Tambahkan informasi dasar survei."
                          icon={Calendar}
                        />
                      </div>

                      <div className="p-4 sm:p-5">
                        <div className="space-y-4">
                          <div>
                            <FieldLabel required htmlFor="field-title">
                              Judul peta / sesi
                            </FieldLabel>

                            <input
                              id="field-title"
                              type="text"
                              value={title}
                              onChange={(event) => setTitle(event.target.value)}
                              required
                              placeholder="Contoh: Survei Perkebunan Paca - Blok A"
                              className={cn(inputClass, "h-9")}
                            />
                          </div>

                          <div>
                            <FieldLabel required htmlFor="field-location">
                              Lokasi survei
                            </FieldLabel>

                            <div className="mb-2 flex flex-wrap gap-1.5">
                              {locationPresets.map((preset) => {
                                const active = location === preset;

                                return (
                                  <motion.button
                                    key={preset}
                                    type="button"
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    transition={{ duration: 0.2, ease: EASE }}
                                    aria-pressed={active}
                                    onClick={() => {
                                      setLocation(preset);

                                      if (!title) {
                                        setTitle(`Survei Pertanian ${preset}`);
                                      }
                                    }}
                                    className={cn(
                                      "border px-2.5 py-1.5 text-[10px] font-bold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#171717]/20",
                                      active
                                        ? "border-[#171717] bg-[#171717] text-white"
                                        : "border-[#DCDDD8] bg-white text-[#6B6B66] hover:border-[#CFCFC8] hover:bg-[#FAFAF8] hover:text-[#171717]"
                                    )}
                                  >
                                    {preset.split(",")[0]}
                                  </motion.button>
                                );
                              })}
                            </div>

                            <div className="relative">
                              <MapPin
                                className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#858780]"
                                strokeWidth={ICON_STROKE}
                              />

                              <input
                                id="field-location"
                                type="text"
                                value={location}
                                onChange={(event) =>
                                  setLocation(event.target.value)
                                }
                                required
                                placeholder="Paca, Halmahera Utara"
                                className={cn(inputClass, "h-9 pl-10")}
                              />
                            </div>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <FieldLabel required htmlFor="field-date">
                                Tanggal penerbangan
                              </FieldLabel>

                              <div className="relative">
                                <Calendar
                                  className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#858780]"
                                  strokeWidth={ICON_STROKE}
                                />

                                <input
                                  id="field-date"
                                  type="date"
                                  value={surveyDate}
                                  onChange={(event) =>
                                    setSurveyDate(event.target.value)
                                  }
                                  required
                                  className={cn(inputClass, "h-9 pl-10")}
                                />
                              </div>
                            </div>

                            <div>
                              <FieldLabel htmlFor="field-description">
                                Deskripsi
                              </FieldLabel>

                              <input
                                id="field-description"
                                type="text"
                                value={description}
                                onChange={(event) =>
                                  setDescription(event.target.value)
                                }
                                placeholder="Opsional"
                                className={cn(inputClass, "h-9")}
                              />
                            </div>
                          </div>

                          <div className="border-t border-[#DCDDD8] pt-4">
                            <div className="mb-2 flex items-center gap-2">
                              <ShieldCheck
                                className="h-3.5 w-3.5 text-[#33332F]"
                                strokeWidth={ICON_STROKE}
                              />

                              <span className="text-xs font-bold text-[#171717]">
                                Pengaturan akses
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <label className="flex cursor-pointer items-center gap-2 border border-[#DCDDD8] bg-white px-3 py-2 transition-colors hover:bg-[#FAFAF8]">
                                <input
                                  type="checkbox"
                                  checked={lockedForFree}
                                  onChange={(event) =>
                                    setLockedForFree(event.target.checked)
                                  }
                                  className="h-3.5 w-3.5 accent-[#171717]"
                                />

                                <span className="text-[10px] font-bold text-[#33332F]">
                                  Batasi untuk member berbayar
                                </span>
                              </label>

                              <label className="flex cursor-pointer items-center gap-2 border border-[#DCDDD8] bg-white px-3 py-2 transition-colors hover:bg-[#FAFAF8]">
                                <input
                                  type="checkbox"
                                  checked={purchasable}
                                  onChange={(event) =>
                                    setPurchasable(event.target.checked)
                                  }
                                  className="h-3.5 w-3.5 accent-[#171717]"
                                />

                                <span className="text-[10px] font-bold text-[#33332F]">
                                  Izinkan pembelian satuan
                                </span>
                              </label>
                            </div>
                          </div>
                        </div>

                        {detailReady && (
                          <div className="mt-5 flex justify-end border-t border-[#DCDDD8] pt-4">
                            <ActionButton
                              onClick={() => {
                                setEditingDetails(false);
                                setDetailsConfirmed(true);
                              }}
                            >
                              Lanjutkan ke review
                              <ChevronRight
                                className="h-3.5 w-3.5"
                                strokeWidth={ICON_STROKE}
                              />
                            </ActionButton>
                          </div>
                        )}
                      </div>
                    </motion.section>
                  ) : (
                    <CollapsedSummary
                      title="Detail dataset"
                      detail={`${title} · ${location}`}
                      onEdit={() => setEditingDetails(true)}
                    />
                  )}

                  {/* ==================================================
                      STEP 3 — REVIEW & KIRIM
                  =================================================== */}

                  {!reviewUnlocked ? (
                    <LockedSection
                      title="Review & kirim"
                      reason="Lengkapi langkah upload layer dan detail dataset terlebih dahulu"
                    />
                  ) : (
                    <motion.section
                      initial="hidden"
                      animate="visible"
                      variants={fadeUp}
                      className={cardClass}
                    >
                      <div className="border-b border-[#DCDDD8] px-5 py-5 sm:px-6">
                        <SectionHeader
                          eyebrow="Langkah 03"
                          title="Review & kirim"
                          description="Periksa sebelum upload."
                          icon={ShieldCheck}
                          right={
                            submitErrors.length === 0 &&
                            !metadataStillReading ? (
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-[#171717] text-white">
                                <Check
                                  className="h-4 w-4"
                                  strokeWidth={2.5}
                                  aria-hidden="true"
                                />
                              </span>
                            ) : undefined
                          }
                        />
                      </div>

                      <div className="p-4 sm:p-5">
                        <div className="border border-[#DCDDD8] bg-white p-4">
                          <UploadReview
                            files={reviewFiles}
                            totalBytes={reviewTotalBytes}
                            checklist={reviewChecklist}
                            loading={loading}
                          />
                        </div>

                        <div className="mt-4">
                          {!loading &&
                            (metadataStillReading ? (
                              <div className="border border-amber-200 bg-amber-50 px-3.5 py-3">
                                <div className="flex items-center gap-2">
                                  <RefreshCw
                                    className="h-3.5 w-3.5 animate-spin text-amber-600 motion-reduce:animate-none"
                                    strokeWidth={ICON_STROKE}
                                  />

                                  <p className="text-xs font-bold text-amber-900">
                                    Sedang membaca metadata GeoTIFF...
                                  </p>
                                </div>
                              </div>
                            ) : submitErrors.length > 0 ? (
                              <div className="border border-[#DCDDD8] bg-[#F4F5F2] px-3.5 py-3">
                                <p className="text-[10px] font-medium leading-4 text-[#6B6B66]">
                                  Lengkapi bagian yang masih diperlukan sebelum
                                  upload.
                                </p>
                              </div>
                            ) : null)}

                          <ActionButton
                            type="submit"
                            disabled={
                              loading ||
                              metadataStillReading ||
                              submitErrors.length > 0
                            }
                            aria-describedby={
                              loading ? "upload-engine-progress" : undefined
                            }
                            className="mt-3 w-full py-3"
                          >
                            Validasi & Import
                            <ChevronRight
                              className="h-3.5 w-3.5"
                              strokeWidth={ICON_STROKE}
                              aria-hidden="true"
                            />
                          </ActionButton>
                        </div>
                      </div>
                    </motion.section>
                  )}
                </div>
              </div>
            )}

            {/* ==================================================
                FOOTER
            =================================================== */}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mt-4 flex items-center justify-between gap-4 px-1"
            >
              <p className="text-[10px] font-medium text-[#858780]">
                AMX GeoStream · Upload Center
              </p>

              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 bg-[#76B900]" />

                <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#858780]">
                  Dataset diperiksa otomatis
                </span>
              </div>
            </motion.div>
          </fieldset>
        </form>
      </div>
    </main>
  );
}
