"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  FileText,
  HelpCircle,
  Layers,
  Plus,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Upload,
} from "lucide-react";

import {
  LAYER_TYPE_CONFIG,
  manualLayerOptions,
  formatFileSize,
  type ManualSlotItem,
} from "./upload-config";

import { fileError } from "./upload-helpers";

import {
  ActionButton,
  EASE,
  ICON_STROKE,
  IconBox,
  cardClass,
  eyebrowClass,
  inputClass,
} from "./upload-ui";

import { cn } from "@/lib/utils";

// Tetap diekspor dari sini agar import lama (`inputClass` dari ManualUploadFlow) tidak rusak.
export { inputClass };

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024 * 1024;
const MAX_FILE_SIZE_LABEL = "3 GB";

const dropdownMotion = {
  initial: { opacity: 0, y: -4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: 0.18, ease: EASE },
} as const;

/* -------------------------------------------------------------------------- */
/* Compact file picker                                                        */
/* -------------------------------------------------------------------------- */

function MiniDropzone({
  id,
  file,
  onChange,
  disabled,
}: {
  id: string;
  file: File | null;
  onChange: (file: File | null) => void;
  disabled: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [selectionError, setSelectionError] = useState("");

  const error = selectionError || fileError(file);

  const capacityPct = file
    ? Math.min(100, (file.size / MAX_FILE_SIZE_BYTES) * 100)
    : 0;

  const select = (files: File[]) => {
    if (disabled || !files.length) {
      return;
    }

    if (files.length !== 1) {
      setSelectionError("Pilih satu file untuk layer ini.");
      onChange(null);
      return;
    }

    const [candidate] = files;

    const isTiff = /\.(tif|tiff)$/i.test(candidate.name);

    if (!isTiff) {
      setSelectionError("Hanya file .tif atau .tiff yang didukung.");
      onChange(null);
      return;
    }

    if (candidate.size > MAX_FILE_SIZE_BYTES) {
      setSelectionError(
        `Ukuran file (${formatFileSize(
          candidate.size
        )}) melebihi batas ${MAX_FILE_SIZE_LABEL}.`
      );
      onChange(null);
      return;
    }

    setSelectionError("");
    onChange(candidate);
  };

  return (
    <div>
      <div
        className={cn(
          "relative overflow-hidden border border-dashed p-3 transition-colors duration-200",
          dragging
            ? "border-[#171717] bg-[#FAFAF8]"
            : file
            ? "border-[#CFCFC8] bg-[#FAFAF8]"
            : "border-[#DCDDD8] bg-white hover:bg-[#FAFAF8]"
        )}
        onDragOver={(event) => {
          event.preventDefault();

          if (!disabled) {
            setDragging(true);
          }
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);

          select(Array.from(event.dataTransfer.files));
        }}
      >
        <input
          ref={input}
          id={id}
          type="file"
          accept=".tif,.tiff"
          disabled={disabled}
          className="hidden"
          onChange={(event) => {
            select(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
          aria-label="Pilih file GeoTIFF"
        />

        {!file ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => input.current?.click()}
            className="flex w-full items-center gap-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-[#171717]/20 disabled:cursor-not-allowed"
          >
            <IconBox icon={Upload} size="sm" />

            <span className="min-w-0 flex-1">
              <span className="block text-xs font-bold text-[#171717]">
                Pilih file GeoTIFF
              </span>

              <span className="mt-0.5 block text-[10px] font-medium text-[#858780]">
                .tif / .tiff · maks {MAX_FILE_SIZE_LABEL}
              </span>
            </span>

            <span className="shrink-0 bg-[#171717] px-3 py-2 text-[10px] font-bold text-white">
              Pilih file
            </span>
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <IconBox icon={FileText} size="sm" />

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-[#171717]">
                {file.name}
              </p>

              <p className="mt-0.5 text-[10px] font-medium tabular-nums text-[#858780]">
                {formatFileSize(file.size)}
              </p>

              <div className="mt-1.5 h-1 overflow-hidden bg-[#DCDDD8]/60">
                <div
                  className="h-full bg-[#171717]"
                  style={{ width: `${capacityPct}%` }}
                />
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                disabled={disabled}
                onClick={() => input.current?.click()}
                className="border border-[#DCDDD8] bg-white px-2.5 py-1.5 text-[10px] font-bold text-[#33332F] outline-none transition-colors hover:border-[#CFCFC8] hover:bg-[#FAFAF8] focus-visible:ring-2 focus-visible:ring-[#171717]/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Ganti
              </button>

              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  setSelectionError("");
                  onChange(null);
                }}
                className="flex h-8 w-8 items-center justify-center border border-transparent text-[#B0B1AB] outline-none transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-[#171717]/20 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Hapus file"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
              </button>
            </div>
          </div>
        )}

        {!file && (
          <p className="mt-2 pl-11 text-[10px] font-medium text-[#B0B1AB]">
            Tarik file langsung ke area ini juga bisa.
          </p>
        )}
      </div>

      <p
        aria-live="polite"
        className={cn(
          "mt-1.5 flex items-center gap-1.5 text-[10px] font-semibold",
          error ? "text-red-600" : "text-[#858780]"
        )}
      >
        {error ? (
          <>
            <AlertCircle
              className="h-3.5 w-3.5 shrink-0"
              strokeWidth={ICON_STROKE}
              aria-hidden="true"
            />
            {error}
          </>
        ) : (
          <>
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 shrink-0 bg-[#76B900]"
            />
            CRS diperiksa otomatis setelah unggah
          </>
        )}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Custom layer type select                                                   */
/* -------------------------------------------------------------------------- */

function LayerTypeSelect({
  value,
  onChange,
  disabled,
}: {
  value: ManualSlotItem["layer_type"];
  onChange: (value: ManualSlotItem["layer_type"]) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);

  const currentOption =
    manualLayerOptions.find((option) => option.value === value) ??
    manualLayerOptions[0];

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-9 w-full items-center justify-between gap-2 border border-[#DCDDD8] bg-white px-3 text-xs font-bold text-[#171717] outline-none transition-colors hover:border-[#CFCFC8] focus:border-[#171717] focus:ring-2 focus:ring-[#171717]/10 disabled:cursor-not-allowed disabled:opacity-60"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="min-w-0 truncate">
          {currentOption?.label ?? "Pilih jenis layer"}
        </span>

        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
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
        {open && (
          <motion.div
            {...dropdownMotion}
            className="absolute left-0 right-0 top-[calc(100%+3px)] z-50 overflow-hidden border border-[#DCDDD8] bg-white shadow-md"
          >
            <div role="listbox" className="max-h-[180px] overflow-y-auto p-1">
              {manualLayerOptions.map((option) => {
                const active = option.value === value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      onChange(option.value as ManualSlotItem["layer_type"]);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 px-2.5 py-2 text-left text-[10px] font-bold transition-colors",
                      active
                        ? "bg-[#F4F5F2] text-[#171717]"
                        : "text-[#6B6B66] hover:bg-[#FAFAF8] hover:text-[#171717]"
                    )}
                    role="option"
                    aria-selected={active}
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {option.label}
                    </span>

                    {active && (
                      <Check
                        className="h-3 w-3 shrink-0 text-[#171717]"
                        strokeWidth={2.5}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* New layer picker                                                           */
/* -------------------------------------------------------------------------- */

function LayerTypePicker({
  onSelect,
  disabled,
}: {
  onSelect: (value: ManualSlotItem["layer_type"]) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative border border-[#DCDDD8] bg-white p-2.5">
      <p className={cn(eyebrowClass, "mb-1.5")}>Jenis layer</p>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        className="flex h-9 w-full items-center justify-between gap-2 border border-[#DCDDD8] bg-white px-3 text-xs font-medium text-[#858780] outline-none transition-colors hover:border-[#CFCFC8] focus:border-[#171717] focus:ring-2 focus:ring-[#171717]/10 disabled:cursor-not-allowed disabled:opacity-60"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">Pilih jenis layer...</span>

        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
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
        {open && (
          <motion.div
            {...dropdownMotion}
            className="absolute left-2.5 right-2.5 top-[calc(100%-0.5rem)] z-50 overflow-hidden border border-[#DCDDD8] bg-white shadow-md"
          >
            <div role="listbox" className="max-h-[180px] overflow-y-auto p-1">
              {manualLayerOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    onSelect(option.value as ManualSlotItem["layer_type"]);
                    setOpen(false);
                  }}
                  className="flex w-full items-center px-2.5 py-2 text-left text-[10px] font-bold text-[#6B6B66] transition-colors hover:bg-[#FAFAF8] hover:text-[#171717]"
                  role="option"
                  aria-selected={false}
                >
                  <span className="truncate">{option.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="mt-1.5 text-[10px] font-medium text-[#B0B1AB]">
        Pilih tipe peta yang ingin ditambahkan.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Manual upload flow                                                         */
/* -------------------------------------------------------------------------- */

export function ManualUploadFlow({
  slots,
  addLayer,
  removeLayer,
  updateLayer,
  disabled,
  errors,
}: {
  slots: ManualSlotItem[];
  addLayer: (layerType?: ManualSlotItem["layer_type"]) => void;
  removeLayer: (id: string) => void;
  updateLayer: <K extends keyof ManualSlotItem>(
    id: string,
    field: K,
    value: ManualSlotItem[K]
  ) => void;
  disabled: boolean;
  errors: string[][];
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const handlePickLayer = (layerType: ManualSlotItem["layer_type"]) => {
    addLayer(layerType);
    setPickerOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* HEADER / ADD LAYER */}

      <div className="border border-[#DCDDD8] bg-[#FAFAF8] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <IconBox icon={Layers} />

            <div className="min-w-0">
              <p className="text-xs font-bold text-[#171717]">Layer analisis</p>

              <p className="mt-1 text-xs font-medium leading-5 text-[#6B6B66]">
                Tambahkan ortho, NDVI, VARI, DSM, N/P/K, atau layer custom tanpa
                urutan wajib.
              </p>
            </div>
          </div>

          <ActionButton
            disabled={disabled}
            className="shrink-0"
            onClick={() => setPickerOpen((value) => !value)}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
            Tambah layer
          </ActionButton>
        </div>

        <AnimatePresence initial={false}>
          {pickerOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: EASE }}
              className="overflow-visible"
            >
              <div className="pt-3">
                <LayerTypePicker
                  disabled={disabled}
                  onSelect={handlePickLayer}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* EMPTY STATE */}

      {!slots.length && (
        <div className="flex flex-col items-center justify-center border border-dashed border-[#DCDDD8] bg-white px-5 py-10 text-center">
          <IconBox icon={Plus} />

          <p className="mt-3 text-sm font-bold text-[#171717]">
            Belum ada layer
          </p>

          <p className="mt-1 max-w-sm text-xs font-medium leading-5 text-[#6B6B66]">
            Pilih <strong className="text-[#171717]">Tambah layer</strong> lalu
            tentukan jenis peta yang ingin dimasukkan.
          </p>

          <ActionButton
            variant="secondary"
            disabled={disabled}
            onClick={() => setPickerOpen(true)}
            className="mt-4"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
            Tambah layer pertama
          </ActionButton>
        </div>
      )}

      {/* LAYER LIST */}

      {slots.length > 0 && (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {slots.map((slot, index) => {
              const config =
                LAYER_TYPE_CONFIG[slot.layer_type] || LAYER_TYPE_CONFIG.custom;

              const slotErrors = errors[index] ?? [];

              return (
                <motion.article
                  key={slot.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  className={cn(cardClass, "p-4")}
                >
                  {/* Header */}

                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-[#171717] text-[10px] font-bold text-white">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${config.badgeClass}`}
                          >
                            {config.label}
                          </span>

                          {index === 0 && (
                            <span className="border border-[#DCDDD8] bg-[#F4F5F2] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#33332F]">
                              utama
                            </span>
                          )}
                        </div>

                        <p className="mt-0.5 text-[10px] font-medium text-[#858780]">
                          Layer {index + 1}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      aria-label={`Hapus layer ${index + 1}`}
                      className="flex h-8 w-8 shrink-0 items-center justify-center border border-transparent text-[#B0B1AB] outline-none transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-[#171717]/20 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => removeLayer(slot.id)}
                      disabled={disabled}
                    >
                      <Trash2
                        className="h-3.5 w-3.5"
                        strokeWidth={ICON_STROKE}
                      />
                    </button>
                  </div>

                  {/* Type + name */}

                  <div className="grid gap-3 md:grid-cols-[170px_minmax(0,1fr)]">
                    <label className="block space-y-1.5">
                      <span className={cn(eyebrowClass, "block")}>
                        Tipe layer
                      </span>

                      <LayerTypeSelect
                        value={slot.layer_type}
                        disabled={disabled}
                        onChange={(value) =>
                          updateLayer(slot.id, "layer_type", value)
                        }
                      />
                    </label>

                    <label className="block space-y-1.5">
                      <span className={cn(eyebrowClass, "block")}>
                        Nama layer
                      </span>

                      <input
                        required
                        value={slot.name}
                        aria-invalid={!slot.name.trim()}
                        onChange={(event) =>
                          updateLayer(slot.id, "name", event.target.value)
                        }
                        className={cn(inputClass, "h-9")}
                        disabled={disabled}
                      />
                    </label>
                  </div>

                  {/* File */}

                  <div className="mt-3">
                    <MiniDropzone
                      id={`file-${slot.id}`}
                      file={slot.file}
                      onChange={(file) => updateLayer(slot.id, "file", file)}
                      disabled={disabled}
                    />
                  </div>

                  {/* Opacity */}

                  <div className="mt-3 flex items-center gap-3 border border-[#DCDDD8] bg-[#F4F5F2] px-3 py-2.5">
                    <SlidersHorizontal
                      className="h-3.5 w-3.5 shrink-0 text-[#6B6B66]"
                      strokeWidth={ICON_STROKE}
                      aria-hidden="true"
                    />

                    <span className="shrink-0 text-[10px] font-bold text-[#171717]">
                      Opasitas
                    </span>

                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={slot.default_opacity}
                      aria-label={`Opasitas layer ${index + 1}`}
                      aria-valuetext={`${Math.round(
                        slot.default_opacity * 100
                      )} persen`}
                      onChange={(event) =>
                        updateLayer(
                          slot.id,
                          "default_opacity",
                          Number(event.target.value)
                        )
                      }
                      className="min-w-0 flex-1 accent-[#171717]"
                      disabled={disabled}
                    />

                    <span className="w-11 shrink-0 border border-[#DCDDD8] bg-white px-2 py-1 text-center text-[10px] font-bold tabular-nums text-[#171717]">
                      {Math.round(slot.default_opacity * 100)}%
                    </span>
                  </div>

                  {/* Validation */}

                  <div
                    aria-live="polite"
                    className={cn(
                      "mt-2 flex items-center gap-1.5 text-[10px] font-semibold",
                      slotErrors.length ? "text-red-600" : "text-[#6B6B66]"
                    )}
                  >
                    {slotErrors.length ? (
                      <>
                        <AlertCircle
                          className="h-3.5 w-3.5 shrink-0"
                          strokeWidth={ICON_STROKE}
                          aria-hidden="true"
                        />
                        <span>{slotErrors.join(" ")}</span>
                      </>
                    ) : (
                      <>
                        <span
                          aria-hidden="true"
                          className="h-1.5 w-1.5 shrink-0 bg-[#76B900]"
                        />
                        <span>Layer lengkap.</span>
                      </>
                    )}
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ADD MORE */}

      {slots.length > 0 && (
        <div className="flex justify-center pt-1">
          <ActionButton
            variant="secondary"
            disabled={disabled}
            onClick={() => setPickerOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={ICON_STROKE} />
            Tambah layer lagi
          </ActionButton>
        </div>
      )}

      {slots.length > 0 && (
        <p className="flex items-center justify-center gap-1.5 text-center text-[10px] font-medium text-[#858780]">
          <span aria-hidden="true" className="h-1.5 w-1.5 bg-[#76B900]" />
          Layer pertama menjadi layer utama secara teknis. Tidak harus berupa
          ortho.
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Upload review                                                              */
/* -------------------------------------------------------------------------- */

export interface ReviewFile {
  name: string;
  size: number;
}

export interface ReviewChecklistItem {
  label: string;
  ready: boolean;
}

export function UploadReview({
  files,
  totalBytes,
  checklist,
  loading,
}: {
  files: ReviewFile[];
  totalBytes: number;
  checklist: ReviewChecklistItem[];
  loading: boolean;
}) {
  const ready = checklist.every((item) => item.ready);

  return (
    <section id="upload-review" tabIndex={-1} className="scroll-mt-6">
      <div className="mb-4 flex items-start gap-3">
        <IconBox icon={ShieldCheck} />

        <div className="min-w-0">
          <p className={eyebrowClass}>Langkah akhir</p>

          <h2 className="mt-1 text-base font-bold tracking-[-0.02em] text-[#171717]">
            Tinjau sebelum mengunggah
          </h2>

          <p className="mt-1 text-xs font-medium tabular-nums text-[#6B6B66]">
            {files.length} file · {formatFileSize(totalBytes)} total
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="border border-[#DCDDD8] bg-[#FAFAF8] p-2.5">
          <ul
            className="max-h-44 space-y-1 overflow-y-auto pr-1"
            aria-label="Daftar file"
          >
            {files.map((file, index) => (
              <li
                key={index}
                className="flex items-center gap-2 border border-[#DCDDD8] bg-white px-3 py-2 text-[10px]"
              >
                <FileText
                  className="h-3.5 w-3.5 shrink-0 text-[#33332F]"
                  strokeWidth={ICON_STROKE}
                  aria-hidden="true"
                />

                <span className="min-w-0 flex-1 truncate font-bold text-[#171717]">
                  {file.name}
                </span>

                <span className="shrink-0 font-medium tabular-nums text-[#858780]">
                  {formatFileSize(file.size)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4">
        <p className={cn(eyebrowClass, "mb-2")}>Kesiapan upload</p>

        <ul
          className="space-y-2 border border-[#DCDDD8] bg-white p-3.5 text-xs font-bold text-[#171717]"
          aria-label="Checklist kesiapan"
          aria-live="polite"
        >
          {checklist.map((item) => (
            <li key={item.label} className="flex items-start gap-2.5">
              {item.ready ? (
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center bg-[#171717] text-white"
                >
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                </span>
              ) : (
                <span
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 shrink-0 border border-[#DCDDD8] bg-[#F4F5F2]"
                />
              )}

              <span
                className={cn("leading-5", !item.ready && "text-[#858780]")}
              >
                {item.label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {!loading && (
        <div
          id="submit-readiness"
          role="status"
          className={cn(
            "mt-4 flex items-center gap-2 border px-3.5 py-3 text-[10px] font-bold",
            ready
              ? "border-[#76B900]/40 bg-[#F3F9E4] text-[#33332F]"
              : "border-[#DCDDD8] bg-[#F4F5F2] text-[#6B6B66]"
          )}
        >
          <motion.span
            aria-hidden="true"
            animate={ready ? { scale: [1, 1.15, 1] } : { scale: 1 }}
            transition={
              ready
                ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.2 }
            }
            className={cn(
              "h-1.5 w-1.5 shrink-0",
              ready ? "bg-[#76B900]" : "bg-[#B0B1AB]"
            )}
          />
          {ready
            ? "Dataset siap diunggah"
            : "Lengkapi bagian yang masih diperlukan"}
        </div>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Upload guide                                                               */
/* -------------------------------------------------------------------------- */

export function UploadGuide() {
  const [open, setOpen] = useState(false);

  const points: {
    icon: typeof FileText;
    text: React.ReactNode;
  }[] = [
    {
      icon: FileText,
      text: (
        <>
          <strong className="text-[#171717]">GeoTIFF (.tif/.tiff)</strong>{" "}
          adalah raster hasil pengolahan drone seperti Pix4D atau DroneDeploy.
          Ukuran maksimum{" "}
          <strong className="text-[#171717]">{MAX_FILE_SIZE_LABEL}</strong> per
          file.
        </>
      ),
    },
    {
      icon: Layers,
      text: (
        <>
          <strong className="text-[#171717]">Ortho</strong> = foto dasar ·{" "}
          <strong className="text-[#171717]">NDVI/VARI</strong> = vegetasi ·{" "}
          <strong className="text-[#171717]">N/P/K</strong> = hara ·{" "}
          <strong className="text-[#171717]">DSM</strong> = elevasi.
        </>
      ),
    },
    {
      icon: ShieldCheck,
      text: "CRS dan metadata diperiksa otomatis oleh server setelah unggah.",
    },
    {
      icon: RefreshCw,
      text: "Peta diproses ke PMTiles di background dan dapat membutuhkan beberapa saat.",
    },
  ];

  return (
    <div
      className={cn(
        "overflow-hidden border transition-colors duration-200",
        open
          ? "border-[#CFCFC8] bg-[#FAFAF8]"
          : "border-[#DCDDD8] bg-white hover:bg-[#FAFAF8]"
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls="upload-guide-panel"
        id="upload-guide-button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-3 p-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-[#171717]/20"
      >
        <IconBox icon={HelpCircle} size="sm" />

        <span className="min-w-0 flex-1">
          <span className="block text-xs font-bold text-[#171717]">
            Panduan singkat
          </span>

          <span className="mt-0.5 block text-[10px] font-medium text-[#858780]">
            Format dan proses data
          </span>
        </span>

        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.22, ease: EASE }}
          className="flex h-7 w-7 shrink-0 items-center justify-center border border-[#DCDDD8] bg-white"
        >
          <ChevronDown
            className="h-3.5 w-3.5 text-[#6B6B66]"
            strokeWidth={ICON_STROKE}
          />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id="upload-guide-panel"
            role="region"
            aria-labelledby="upload-guide-button"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="overflow-hidden"
          >
            <ul className="space-y-2 border-t border-[#DCDDD8] p-4">
              {points.map((point, index) => {
                const Icon = point.icon;

                return (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.35,
                      delay: index * 0.06,
                      ease: EASE,
                    }}
                    className="flex items-start gap-3 border border-[#DCDDD8] bg-white px-3 py-2.5"
                  >
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center border border-[#DCDDD8] bg-[#F4F5F2] text-[#33332F]">
                      <Icon
                        className="h-3.5 w-3.5"
                        strokeWidth={ICON_STROKE}
                        aria-hidden="true"
                      />
                    </span>

                    <span className="text-xs font-medium leading-5 text-[#6B6B66]">
                      {point.text}
                    </span>
                  </motion.li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
