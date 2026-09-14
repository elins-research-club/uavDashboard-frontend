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
  Trash2,
  Upload,
} from "lucide-react";

import {
  LAYER_TYPE_CONFIG,
  manualLayerOptions,
  formatFileSize,
  type ManualSlotItem,
} from "./upload-config";

import { fileError, type manualReadiness } from "./upload-helpers";

// Keep in sync with the cap enforced in UploadPage.tsx's batch flow.
const MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024 * 1024; // 3 GB
const MAX_FILE_SIZE_LABEL = "3 GB";

export const inputClass =
  "w-full rounded-lg border border-brand-800/10 bg-white px-3.5 py-2.5 text-xs font-semibold text-brand-900 outline-none transition placeholder:text-brand-800/30 hover:border-brand-800/20 focus:border-brand-600/30 focus:ring-2 focus:ring-brand-600/10";

const buttonClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-brand-800/10 px-3.5 py-2 text-xs font-bold text-brand-900 transition hover:-translate-y-0.5 hover:border-brand-800/20 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:pointer-events-none disabled:opacity-50";

type Readiness = ReturnType<typeof manualReadiness>;

/* -------------------------------------------------------------------------- */
/* Manual sub navigation                                                      */
/* -------------------------------------------------------------------------- */

export function ManualSubNav({ readiness }: { readiness: Readiness }) {
  const items: [string, string, string][] = [
    [
      "manual-base",
      "Layer dasar",
      readiness.baseErrors.length ? "Belum lengkap" : "Lengkap",
    ],
    [
      "manual-analysis",
      "Layer analisis",
      !readiness.slotErrors.length
        ? "Opsional · belum ditambahkan"
        : readiness.slotErrors.some((errors) => errors.length)
        ? "Perlu dilengkapi"
        : "Semua lengkap",
    ],
  ];

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {items.map(([id, label, status], index) => {
        const ready =
          index === 0
            ? !readiness.baseErrors.length
            : readiness.slotErrors.length > 0 &&
              !readiness.slotErrors.some((errors) => errors.length);

        return (
          <a
            key={id}
            href={`#${id}`}
            className="group flex items-center gap-3 rounded-lg border border-brand-800/10 bg-white/70 px-3.5 py-3 transition hover:-translate-y-0.5 hover:border-brand-800/15 hover:bg-white"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-900 text-xs font-black text-white shadow-sm">
              {index + 1}
            </span>

            <span className="min-w-0 flex-1">
              <strong className="block truncate text-xs font-bold text-brand-900">
                {label}
              </strong>

              <span
                className={`mt-0.5 block text-2xs font-semibold ${
                  ready ? "text-emerald-600" : "text-brand-800/50"
                }`}
              >
                {status}
              </span>
            </span>

            <ChevronDown
              className="h-4 w-4 shrink-0 -rotate-90 text-brand-800/30 transition-transform group-hover:text-brand-800/60"
              aria-hidden="true"
            />
          </a>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Mini dropzone                                                              */
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
    if (disabled || !files.length) return;

    if (files.length !== 1) {
      setSelectionError("Pilih hanya satu file untuk slot ini.");
      onChange(null);
      return;
    }

    const [candidate] = files;

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
        className={`relative overflow-hidden rounded-lg border border-dashed p-4 transition ${
          dragging
            ? "border-brand-600 bg-brand-600/5"
            : file
            ? "border-brand-600/15 bg-brand-50/40"
            : "border-brand-800/12 bg-brand-50/25"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          select(Array.from(e.dataTransfer.files));
        }}
      >
        <input
          ref={input}
          id={id}
          type="file"
          accept=".tif,.tiff"
          disabled={disabled}
          className="hidden"
          onChange={(e) => {
            select(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
          aria-label="Pilih file GeoTIFF"
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="icon-ring flex h-10 w-10 shrink-0 items-center justify-center bg-white">
              <Upload className="h-4 w-4 text-brand-900" aria-hidden="true" />
            </span>

            <div className="min-w-0">
              <p className="text-xs font-bold text-brand-900">
                {file ? "GeoTIFF terpilih" : "Unggah GeoTIFF"}
              </p>

              <p className="mt-0.5 font-mono text-2xs font-medium text-brand-800/50">
                .tif / .tiff · maks {MAX_FILE_SIZE_LABEL}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={disabled}
            aria-describedby={`${id}-feedback`}
            onClick={() => input.current?.click()}
            className={`${buttonClass} shrink-0 bg-brand-900 text-white hover:border-brand-900 hover:bg-brand-600`}
          >
            <Upload className="h-3.5 w-3.5" aria-hidden="true" />
            {file ? "Ganti file" : "Pilih file"}
          </button>
        </div>

        {!file && (
          <p className="mt-3 text-2xs font-medium text-brand-800/45">
            atau tarik file langsung ke area ini
          </p>
        )}

        {file && (
          <div className="mt-3 rounded-lg border border-brand-800/8 bg-white px-3 py-2.5">
            <div className="flex items-center gap-3">
              <span className="icon-ring flex h-8 w-8 shrink-0 items-center justify-center bg-brand-50">
                <FileText
                  className="h-3.5 w-3.5 text-brand-600"
                  aria-hidden="true"
                />
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-brand-900">
                  {file.name}
                </p>

                <p className="mt-0.5 font-mono text-2xs font-medium text-brand-800/45">
                  {formatFileSize(file.size)}
                </p>
              </div>

              <button
                type="button"
                disabled={disabled}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-brand-800/40 transition hover:bg-red-50 hover:text-red-600"
                aria-label="Hapus file dari slot"
                onClick={() => {
                  setSelectionError("");
                  onChange(null);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-2 h-1 overflow-hidden rounded-full bg-brand-800/8">
              <div
                className="h-full rounded-full bg-brand-600/60"
                style={{ width: `${capacityPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <p
        id={`${id}-feedback`}
        aria-live="polite"
        className={`mt-2 flex items-center gap-1.5 text-2xs font-semibold ${
          error ? "text-red-600" : "text-brand-800/50"
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
/* Manual upload flow                                                         */
/* -------------------------------------------------------------------------- */

export function ManualUploadFlow({
  baseFile,
  baseName,
  slots,
  setBaseFile,
  setBaseName,
  addSlot,
  removeSlot,
  updateSlot,
  disabled,
  readiness,
}: {
  baseFile: File | null;
  baseName: string;
  slots: ManualSlotItem[];
  setBaseFile: (file: File | null) => void;
  setBaseName: (name: string) => void;
  addSlot: () => void;
  removeSlot: (id: string) => void;
  updateSlot: <K extends keyof ManualSlotItem>(
    id: string,
    field: K,
    value: ManualSlotItem[K]
  ) => void;
  disabled: boolean;
  readiness: Readiness;
}) {
  return (
    <div className="space-y-4">
      <ManualSubNav readiness={readiness} />

      {/* Base layer */}
      <section
        id="manual-base"
        tabIndex={-1}
        className="scroll-mt-6 rounded-lg border border-brand-800/8 bg-white/60 p-4 sm:p-5"
      >
        <div className="mb-4 flex items-start gap-3">
          <span className="icon-ring flex h-9 w-9 shrink-0 items-center justify-center bg-brand-50">
            <Layers className="h-4 w-4 text-brand-900" aria-hidden="true" />
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-brand-900">Layer dasar</h3>
            </div>

            <p className="mt-1 flex items-center gap-1.5 text-2xs font-medium text-brand-800/50">
              <ShieldCheck
                className="h-3.5 w-3.5 shrink-0 text-brand-600"
                aria-hidden="true"
              />
              Foto dasar area survei · mosaic drone
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="base-name"
              className="mb-1.5 block text-2xs font-bold uppercase tracking-[0.12em] text-brand-800/55"
            >
              Nama layer
            </label>

            <input
              id="base-name"
              required
              value={baseName}
              onChange={(e) => setBaseName(e.target.value)}
              aria-invalid={!baseName.trim()}
              aria-describedby="base-name-error"
              className={inputClass}
            />

            <p
              id="base-name-error"
              className={`mt-1.5 text-2xs font-semibold ${
                !baseName.trim() ? "text-red-600" : "text-transparent"
              }`}
              aria-live="polite"
            >
              {!baseName.trim()
                ? "Nama layer wajib diisi."
                : "Nama layer valid"}
            </p>
          </div>

          <MiniDropzone
            id="base-file"
            file={baseFile}
            onChange={setBaseFile}
            disabled={disabled}
          />
        </div>
      </section>

      {/* Analysis layers */}
      <section id="manual-analysis" tabIndex={-1} className="scroll-mt-6">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-brand-900">
                Layer analisis tambahan
              </h3>
            </div>

            <p className="mt-1 text-2xs font-medium text-brand-800/50">
              NDVI, VARI, DSM, N/P/K, dan layer analisis lainnya
            </p>
          </div>

          <button
            type="button"
            className="btn-ghost min-h-9 px-3.5 text-2xs"
            onClick={addSlot}
            disabled={disabled}
          >
            <Plus className="h-3.5 w-3.5" />
            Tambah layer
          </button>
        </div>

        {!slots.length && (
          <div className="flex items-center gap-3 rounded-lg border border-dashed border-brand-800/10 bg-brand-50/30 px-4 py-4">
            <span className="icon-ring flex h-9 w-9 shrink-0 items-center justify-center bg-white">
              <Layers
                className="h-4 w-4 text-brand-800/50"
                aria-hidden="true"
              />
            </span>

            <div>
              <p className="text-xs font-bold text-brand-900">
                Belum ada layer tambahan
              </p>

              <p className="mt-0.5 text-2xs font-medium text-brand-800/45">
                Dataset tetap bisa diunggah tanpa layer analisis.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {slots.map((slot, index) => (
            <article
              key={slot.id}
              className="rounded-lg border border-brand-800/8 bg-white/60 p-4"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-900 text-2xs font-black text-white">
                    {index + 1}
                  </span>

                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-brand-900">
                      Layer analisis {index + 1}
                    </h4>

                    <span
                      className={`mt-1.5 inline-flex rounded border px-2 py-1 font-mono text-2xs font-bold uppercase tracking-wide ${
                        LAYER_TYPE_CONFIG[slot.layer_type].badgeClass
                      }`}
                    >
                      {LAYER_TYPE_CONFIG[slot.layer_type].label}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  aria-label={`Hapus layer analisis ${index + 1}`}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-brand-800/35 transition hover:bg-red-50 hover:text-red-600"
                  onClick={() => removeSlot(slot.id)}
                  disabled={disabled}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1.5 text-2xs font-bold text-brand-900">
                  <span className="block uppercase tracking-[0.1em] text-brand-800/50">
                    Tipe layer
                  </span>

                  <select
                    value={slot.layer_type}
                    onChange={(e) =>
                      updateSlot(slot.id, "layer_type", e.target.value)
                    }
                    className={inputClass}
                    disabled={disabled}
                  >
                    {manualLayerOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1.5 text-2xs font-bold text-brand-900">
                  <span className="block uppercase tracking-[0.1em] text-brand-800/50">
                    Nama layer
                  </span>

                  <input
                    required
                    value={slot.name}
                    aria-invalid={!slot.name.trim()}
                    onChange={(e) =>
                      updateSlot(slot.id, "name", e.target.value)
                    }
                    className={inputClass}
                    disabled={disabled}
                  />
                </label>
              </div>

              <div className="mt-3">
                <MiniDropzone
                  id={`file-${slot.id}`}
                  file={slot.file}
                  onChange={(file) => updateSlot(slot.id, "file", file)}
                  disabled={disabled}
                />
              </div>

              <label className="mt-3 block rounded-lg bg-brand-50/60 px-3.5 py-3.5 text-2xs font-bold text-brand-900">
                <span className="mb-2.5 flex items-center justify-between gap-3">
                  <span>Opasitas awal</span>

                  <span className="rounded-full bg-white px-2 py-1 font-mono text-brand-600">
                    {Math.round(slot.default_opacity * 100)}%
                  </span>
                </span>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={slot.default_opacity}
                  aria-valuetext={`${Math.round(
                    slot.default_opacity * 100
                  )} persen`}
                  onChange={(e) =>
                    updateSlot(
                      slot.id,
                      "default_opacity",
                      Number(e.target.value)
                    )
                  }
                  className="w-full accent-brand-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600"
                  disabled={disabled}
                />
              </label>

              <p
                aria-live="polite"
                className={`mt-2.5 text-2xs font-semibold ${
                  readiness.slotErrors[index]?.length
                    ? "text-red-600"
                    : "text-emerald-600"
                }`}
              >
                {readiness.slotErrors[index]?.length
                  ? readiness.slotErrors[index].join(" ")
                  : "Layer lengkap."}
              </p>
            </article>
          ))}
        </div>
      </section>
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
        <span className="icon-ring flex h-9 w-9 shrink-0 items-center justify-center bg-brand-50">
          <ShieldCheck className="h-4 w-4 text-brand-900" aria-hidden="true" />
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
        <div className="rounded-lg border border-brand-800/8 bg-brand-50/30 p-2.5">
          <ul
            className="max-h-44 space-y-1 overflow-y-auto pr-1"
            aria-label="Daftar file"
          >
            {files.map((file, index) => (
              <li
                key={index}
                className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-2xs"
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
          className="space-y-2 rounded-lg border border-brand-800/8 bg-white/70 p-3.5 text-xs font-semibold text-brand-900"
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
        className={`mt-4 flex items-center gap-2 rounded-lg px-3.5 py-3 text-2xs font-bold ${
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
        <span className="icon-ring flex h-8 w-8 shrink-0 items-center justify-center bg-brand-50">
          <HelpCircle className="h-4 w-4 text-brand-900" aria-hidden="true" />
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
            className="flex items-start gap-3 rounded-xl bg-brand-50/45 px-3 py-2.5"
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
