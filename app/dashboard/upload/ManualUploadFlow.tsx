"use client";

import { useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Circle,
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

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024 * 1024; // 3 GB
const MAX_FILE_SIZE_LABEL = "3 GB";

export const inputClass =
  "w-full rounded-lg border border-brand-800/15 bg-white px-3.5 py-2.5 text-xs font-semibold text-brand-900 outline-none transition placeholder:text-brand-800/30 hover:border-brand-800/20 focus:border-brand-600/30 focus:ring-2 focus:ring-brand-600/10";

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
        className={`relative overflow-hidden rounded-2xl border border-dashed p-3 transition ${
          dragging
            ? "border-brand-600 bg-brand-600/5"
            : file
            ? "border-brand-600/15 bg-brand-50/40"
            : "border-brand-800/15 bg-brand-50/25"
        }`}
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
            className="flex w-full items-center gap-3 rounded-md text-left"
          >
            <span className="icon-ring h-9 w-9 shrink-0">
              <Upload className="h-4 w-4" aria-hidden="true" />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block text-xs font-bold text-brand-900">
                Pilih file GeoTIFF
              </span>

              <span className="mt-0.5 block font-mono text-2xs font-medium text-brand-800/45">
                .tif / .tiff · maks {MAX_FILE_SIZE_LABEL}
              </span>
            </span>

            <span className="shrink-0 rounded-full bg-brand-900 px-3 py-2 text-2xs font-bold text-white">
              Pilih file
            </span>
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="icon-ring h-9 w-9 shrink-0 text-brand-600">
              <FileText className="h-4 w-4" aria-hidden="true" />
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-brand-900">
                {file.name}
              </p>

              <p className="mt-0.5 font-mono text-2xs font-medium text-brand-800/45">
                {formatFileSize(file.size)}
              </p>

              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-brand-800/8">
                <div
                  className="h-full rounded-full bg-brand-600/60"
                  style={{ width: `${capacityPct}%` }}
                />
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                disabled={disabled}
                onClick={() => input.current?.click()}
                className="rounded-full border border-brand-800/15 bg-white px-2.5 py-1.5 text-2xs font-bold text-brand-900 transition hover:border-brand-800/20"
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
                className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-800/35 transition hover:bg-red-50 hover:text-red-600"
                aria-label="Hapus file"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {!file && (
          <p className="mt-2 pl-12 text-2xs font-medium text-brand-800/40">
            Tarik file langsung ke area ini juga bisa.
          </p>
        )}
      </div>

      <p
        aria-live="polite"
        className={`mt-1.5 flex items-center gap-1.5 text-2xs font-semibold ${
          error ? "text-red-600" : "text-brand-800/45"
        }`}
      >
        {error ? (
          <>
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {error}
          </>
        ) : (
          <>
            <CheckCircle2
              className="h-3.5 w-3.5 shrink-0 text-emerald-600"
              aria-hidden="true"
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

  const currentConfig = currentOption
    ? LAYER_TYPE_CONFIG[currentOption.value] || LAYER_TYPE_CONFIG.custom
    : LAYER_TYPE_CONFIG.custom;

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-brand-800/15 bg-white px-3 text-xs font-semibold text-brand-900 outline-none transition hover:border-brand-800/20 focus:border-brand-600/30 focus:ring-2 focus:ring-brand-600/10"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="min-w-0 truncate">
          {currentOption?.label ?? "Pilih jenis layer"}
        </span>

        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-brand-800/35 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          strokeWidth={1.75}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+3px)] z-50 overflow-hidden rounded-lg border border-brand-800/15 bg-white shadow-lg">
          <div className="max-h-[180px] overflow-y-auto p-1">
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
                  className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-2xs font-semibold transition ${
                    active
                      ? "bg-brand-50 text-brand-900"
                      : "text-brand-800/70 hover:bg-brand-50/70 hover:text-brand-900"
                  }`}
                  role="option"
                  aria-selected={active}
                >
                  <span className="min-w-0 flex-1 truncate">
                    {option.label}
                  </span>

                  {active && (
                    <CheckCircle2
                      className="h-3 w-3 shrink-0 text-emerald-600"
                      strokeWidth={2}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
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
    <div className="relative rounded-lg border border-brand-800/15 bg-white p-2.5">
      <label className="mb-1.5 block text-2xs font-bold text-brand-800/50">
        Jenis layer
      </label>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-brand-800/15 bg-white px-3 text-xs font-semibold text-brand-800/45 outline-none transition hover:border-brand-800/20 focus:border-brand-600/30 focus:ring-2 focus:ring-brand-600/10"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">Pilih jenis layer...</span>

        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-brand-800/35 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          strokeWidth={1.75}
        />
      </button>

      {open && (
        <div className="absolute left-2.5 right-2.5 top-[calc(100%-0.5rem)] z-50 overflow-hidden rounded-lg border border-brand-800/15 bg-white shadow-lg">
          <div className="max-h-[180px] overflow-y-auto p-1">
            {manualLayerOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={disabled}
                onClick={() => {
                  onSelect(option.value as ManualSlotItem["layer_type"]);
                  setOpen(false);
                }}
                className="flex w-full items-center rounded-md px-2.5 py-2 text-left text-2xs font-semibold text-brand-800/70 transition hover:bg-brand-50 hover:text-brand-900"
                role="option"
              >
                <span className="truncate">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="mt-1 text-2xs font-medium text-brand-800/35">
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
      {/* ------------------------------------------------------------------ */}
      {/* HEADER / ADD LAYER                                                 */}
      {/* ------------------------------------------------------------------ */}

      <div className="rounded-2xl border border-brand-800/8 bg-brand-50/35 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-900 text-white">
              <Layers className="h-4 w-4" aria-hidden="true" />
            </span>

            <div className="min-w-0">
              <p className="text-xs font-bold text-brand-900">Layer analisis</p>

              <p className="mt-0.5 text-2xs font-medium leading-4 text-brand-800/50">
                Tambahkan ortho, NDVI, VARI, DSM, N/P/K, atau layer custom tanpa
                urutan wajib.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={disabled}
            className="btn-brand shrink-0"
            onClick={() => setPickerOpen((value) => !value)}
          >
            <Plus className="h-3.5 w-3.5" />
            Tambah layer
          </button>
        </div>

        {pickerOpen && (
          <div className="mt-3">
            <LayerTypePicker disabled={disabled} onSelect={handlePickLayer} />
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* EMPTY STATE                                                        */}
      {/* ------------------------------------------------------------------ */}

      {!slots.length && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-brand-800/15 bg-white px-5 py-10 text-center">
          <span className="icon-ring h-11 w-11 text-brand-800/45">
            <Plus className="h-5 w-5" />
          </span>

          <p className="mt-3 text-sm font-bold text-brand-900">
            Belum ada layer
          </p>

          <p className="mt-1 max-w-sm text-2xs font-medium leading-4 text-brand-800/45">
            Pilih <strong>Tambah layer</strong> lalu tentukan jenis peta yang
            ingin dimasukkan.
          </p>

          <button
            type="button"
            disabled={disabled}
            onClick={() => setPickerOpen(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-brand-800/15 bg-white px-4 py-2 text-2xs font-bold text-brand-900 transition hover:border-brand-800/20 hover:bg-brand-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Tambah layer pertama
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* LAYER LIST                                                         */}
      {/* ------------------------------------------------------------------ */}

      {slots.length > 0 && (
        <div className="space-y-3">
          {slots.map((slot, index) => {
            const config =
              LAYER_TYPE_CONFIG[slot.layer_type] || LAYER_TYPE_CONFIG.custom;

            const slotErrors = errors[index] ?? [];

            return (
              <article
                key={slot.id}
                className="rounded-2xl border border-brand-800/15 bg-white p-4 shadow-card"
              >
                {/* Header -------------------------------------------------- */}
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-900 text-xs font-bold text-white">
                      {index + 1}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`rounded border px-1.5 py-0.5 font-mono text-2xs font-bold uppercase tracking-wide ${config.badgeClass}`}
                        >
                          {config.label}
                        </span>

                        {index === 0 && (
                          <span className="rounded border border-brand-600/20 bg-brand-50 px-1.5 py-0.5 font-mono text-2xs font-bold uppercase tracking-wide text-brand-700">
                            utama
                          </span>
                        )}
                      </div>

                      <p className="mt-0.5 text-2xs font-medium text-brand-800/45">
                        Layer {index + 1}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-label={`Hapus layer ${index + 1}`}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-brand-800/30 transition hover:bg-red-50 hover:text-red-600"
                    onClick={() => removeLayer(slot.id)}
                    disabled={disabled}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Type + name -------------------------------------------- */}
                <div className="grid gap-3 md:grid-cols-[170px_minmax(0,1fr)]">
                  <label className="space-y-1.5 text-2xs font-bold text-brand-900">
                    <span className="block uppercase tracking-[0.1em] text-brand-800/50">
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

                  <label className="space-y-1.5 text-2xs font-bold text-brand-900">
                    <span className="block uppercase tracking-[0.1em] text-brand-800/50">
                      Nama layer
                    </span>

                    <input
                      required
                      value={slot.name}
                      aria-invalid={!slot.name.trim()}
                      onChange={(event) =>
                        updateLayer(slot.id, "name", event.target.value)
                      }
                      className={inputClass}
                      disabled={disabled}
                    />
                  </label>
                </div>

                {/* File ---------------------------------------------------- */}
                <div className="mt-3">
                  <MiniDropzone
                    id={`file-${slot.id}`}
                    file={slot.file}
                    onChange={(file) => updateLayer(slot.id, "file", file)}
                    disabled={disabled}
                  />
                </div>

                {/* Compact opacity ---------------------------------------- */}
                <div className="mt-3 flex items-center gap-3 rounded-lg bg-brand-50/60 px-3 py-2.5">
                  <SlidersHorizontal
                    className="h-3.5 w-3.5 shrink-0 text-brand-800/45"
                    strokeWidth={1.75}
                  />

                  <span className="shrink-0 text-2xs font-bold text-brand-900">
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
                    className="min-w-0 flex-1 accent-brand-900"
                    disabled={disabled}
                  />

                  <span className="w-10 shrink-0 rounded-full bg-white px-2 py-1 text-center font-mono text-2xs font-bold text-brand-600">
                    {Math.round(slot.default_opacity * 100)}%
                  </span>
                </div>

                {/* Validation --------------------------------------------- */}
                <div
                  aria-live="polite"
                  className={`mt-2 flex items-center gap-1.5 text-2xs font-semibold ${
                    slotErrors.length ? "text-red-600" : "text-emerald-600"
                  }`}
                >
                  {slotErrors.length ? (
                    <>
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{slotErrors.join(" ")}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      <span>Layer lengkap.</span>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* ADD MORE                                                           */}
      {/* ------------------------------------------------------------------ */}

      {slots.length > 0 && (
        <div className="flex justify-center pt-1">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setPickerOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-brand-800/15 bg-white px-4 py-2 text-2xs font-bold text-brand-800/65 transition hover:border-brand-800/20 hover:text-brand-900"
          >
            <Plus className="h-3.5 w-3.5" />
            Tambah layer lagi
          </button>
        </div>
      )}

      {slots.length > 0 && (
        <p className="flex items-center justify-center gap-1.5 text-center text-2xs font-medium text-brand-800/40">
          <CheckCircle2
            className="h-3 w-3 text-emerald-600"
            strokeWidth={1.75}
          />
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
        <span className="icon-ring h-9 w-9 shrink-0">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
        </span>

        <div className="min-w-0">
          <p className="micro-label">Langkah akhir</p>

          <h2 className="mt-0.5 text-sm font-bold text-brand-900">
            Tinjau sebelum mengunggah
          </h2>

          <p className="mt-1 font-mono text-2xs font-medium text-brand-800/50">
            {files.length} file · {formatFileSize(totalBytes)} total
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="rounded-2xl border border-brand-800/8 bg-brand-50/30 p-2.5">
          <ul
            className="max-h-44 space-y-1 overflow-y-auto pr-1"
            aria-label="Daftar file"
          >
            {files.map((file, index) => (
              <li
                key={index}
                className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-2xs"
              >
                <FileText
                  className="h-3.5 w-3.5 shrink-0 text-brand-600"
                  aria-hidden="true"
                />

                <span className="min-w-0 flex-1 truncate font-mono font-semibold text-brand-900">
                  {file.name}
                </span>

                <span className="shrink-0 font-mono font-medium text-brand-800/45">
                  {formatFileSize(file.size)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4">
        <p className="mb-2 text-2xs font-bold uppercase tracking-[0.12em] text-brand-800/45">
          Kesiapan upload
        </p>

        <ul
          className="space-y-2 rounded-2xl border border-brand-800/8 bg-white/70 p-3.5 text-xs font-semibold text-brand-900"
          aria-label="Checklist kesiapan"
          aria-live="polite"
        >
          {checklist.map((item) => (
            <li key={item.label} className="flex items-start gap-2.5">
              {item.ready ? (
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                  aria-hidden="true"
                />
              ) : (
                <Circle
                  className="mt-0.5 h-4 w-4 shrink-0 text-brand-800/20"
                  aria-hidden="true"
                />
              )}

              <span className="leading-5">{item.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div
        id="submit-readiness"
        role="status"
        className={`mt-4 flex items-center gap-2 rounded-2xl px-3.5 py-3 text-2xs font-bold ${
          loading
            ? "bg-brand-900 text-white"
            : ready
            ? "bg-emerald-50 text-emerald-700"
            : "bg-brand-50 text-brand-800/60"
        }`}
      >
        {loading ? (
          <>
            <RefreshCw
              className="h-3.5 w-3.5 shrink-0 animate-spin"
              aria-hidden="true"
            />
            Unggah berjalan · formulir dikunci
          </>
        ) : ready ? (
          <>
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Dataset siap diunggah
          </>
        ) : (
          <>
            <Circle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Lengkapi bagian yang masih diperlukan
          </>
        )}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Upload guide                                                               */
/* -------------------------------------------------------------------------- */

export function UploadGuide() {
  const points: {
    icon: React.ReactNode;
    text: React.ReactNode;
  }[] = [
    {
      icon: <FileText className="h-4 w-4" aria-hidden="true" />,
      text: (
        <>
          <strong>GeoTIFF (.tif/.tiff)</strong> adalah raster hasil pengolahan
          drone seperti Pix4D atau DroneDeploy. Ukuran maksimum{" "}
          <strong>{MAX_FILE_SIZE_LABEL}</strong> per file.
        </>
      ),
    },
    {
      icon: <Layers className="h-4 w-4" aria-hidden="true" />,
      text: (
        <>
          <strong>Ortho</strong> = foto dasar · <strong>NDVI/VARI</strong> =
          vegetasi · <strong>N/P/K</strong> = hara · <strong>DSM</strong> =
          elevasi.
        </>
      ),
    },
    {
      icon: <ShieldCheck className="h-4 w-4" aria-hidden="true" />,
      text: "CRS dan metadata diperiksa otomatis oleh server setelah unggah.",
    },
    {
      icon: <RefreshCw className="h-4 w-4" aria-hidden="true" />,
      text: "Peta diproses ke PMTiles di background dan dapat membutuhkan beberapa saat.",
    },
  ];

  return (
    <details className="glass group p-5">
      <summary className="flex cursor-pointer list-none items-center gap-3 text-xs font-bold text-brand-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600">
        <span className="icon-ring h-8 w-8 shrink-0">
          <HelpCircle className="h-4 w-4" aria-hidden="true" />
        </span>

        <span>
          <span className="block">Panduan singkat</span>

          <span className="mt-0.5 block text-2xs font-medium text-brand-800/45">
            Format dan proses data
          </span>
        </span>

        <ChevronDown
          className="ml-auto h-4 w-4 shrink-0 text-brand-800/35 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>

      <ul className="mt-4 space-y-2.5">
        {points.map((point, index) => (
          <li
            key={index}
            className="flex items-start gap-3 rounded-2xl bg-brand-50/45 px-3 py-2.5"
          >
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-brand-600">
              {point.icon}
            </span>

            <span className="text-2xs font-medium leading-5 text-brand-800/65">
              {point.text}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}
