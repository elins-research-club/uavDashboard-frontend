"use client";

import { useRef, useState } from "react";
import { FileText, Plus, Trash2, Upload } from "lucide-react";
import { LAYER_TYPE_CONFIG, manualLayerOptions, formatFileSize, type ManualSlotItem } from "./upload-config";
import { fileError, type manualReadiness } from "./upload-helpers";

export const inputClass = "w-full rounded-xl border border-[#123c28]/20 bg-[#fbfcfa] px-3.5 py-3 text-sm text-[#123c28] outline-none focus-visible:ring-2 focus-visible:ring-[#123c28] focus-visible:ring-offset-2";
const buttonClass = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#123c28]/20 px-4 py-2 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#123c28] disabled:opacity-50";
type Readiness = ReturnType<typeof manualReadiness>;

function MiniDropzone({ id, file, onChange, disabled }: { id: string; file: File | null; onChange: (file: File | null) => void; disabled: boolean }) {
    const input = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);
    const [selectionError, setSelectionError] = useState("");
    const error = selectionError || fileError(file);
    const select = (files: File[]) => {
        if (disabled || !files.length) return;
        if (files.length !== 1) {
            setSelectionError("Pilih hanya satu file untuk slot ini.");
            onChange(null);
            return;
        }
        setSelectionError("");
        onChange(files[0]);
    };
    return <div>
        <p id={`${id}-label`} className="mb-2 text-sm font-bold">File GeoTIFF · wajib</p>
        <div className={`rounded-xl border-2 border-dashed p-4 ${dragging ? "border-[#123c28] bg-[#eef3e8]" : "border-[#123c28]/20 bg-[#f3f6ed]"}`}
            onDragOver={event => { event.preventDefault(); if (!disabled) setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={event => { event.preventDefault(); setDragging(false); select(Array.from(event.dataTransfer.files)); }}>
            <input ref={input} id={id} type="file" accept=".tif,.tiff" disabled={disabled} className="hidden" aria-labelledby={`${id}-label`} onChange={event => { select(Array.from(event.target.files ?? [])); event.target.value = ""; }} />
            <button type="button" disabled={disabled} aria-labelledby={`${id}-action ${id}-label`} aria-describedby={`${id}-feedback`} onClick={() => input.current?.click()} className={`${buttonClass} bg-[#123c28] text-white`}>
                <Upload className="h-4 w-4" aria-hidden="true" /><span id={`${id}-action`}>{file ? "Ganti file" : "Pilih file"}</span>
            </button>
            <span className="mt-2 block text-sm sm:ml-3 sm:inline">atau tarik satu file ke sini</span>
            {file && <div className="mt-3 flex min-w-0 items-start gap-2 rounded-lg bg-[#fbfcfa] p-3 text-sm"><FileText className="h-5 w-5 shrink-0" aria-hidden="true" /><span className="min-w-0 flex-1 break-all">{file.name}<strong className="mt-1 block">{formatFileSize(file.size)}</strong></span><button type="button" disabled={disabled} className={buttonClass} aria-label="Hapus file dari slot" onClick={() => { setSelectionError(""); onChange(null); }}><Trash2 className="h-4 w-4" /></button></div>}
        </div>
        <p id={`${id}-feedback`} aria-live="polite" className="mt-2 text-sm">{error ? `Perlu dilengkapi: ${error}` : "File dipilih; ekstensi dan ukuran tidak kosong sesuai. CRS diperiksa server setelah unggah."}</p>
    </div>;
}

export function ManualNavigation({ readiness }: { readiness: Readiness }) {
    const items = [
        ["manual-base", "Base Ortho", readiness.baseErrors.length ? "Belum lengkap" : "Lengkap"],
        ["manual-analysis", "Layer analisis", !readiness.slotErrors.length ? "Opsional · tidak ditambahkan" : readiness.slotErrors.some(errors => errors.length) ? "Perlu dilengkapi" : "Semua lengkap"],
        ["survey-metadata", "Detail survei", readiness.metadata.every(item => item.ready) ? "Lengkap" : "Belum lengkap"],
        ["upload-review", "Cek dataset", readiness.ready ? "Siap unggah" : "Belum siap"],
    ];
    return <nav aria-label="Navigasi bagian formulir Manual" className="grid grid-cols-2 gap-2 rounded-2xl bg-[#eef3e8] p-3 lg:grid-cols-4">
        {items.map(([id, label, status], index) => <a key={id} href={`#${id}`} className="rounded-xl bg-[#fbfcfa] p-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#123c28] hover:bg-[#f3f6ed]"><strong>{index + 1}. {label}</strong><span className="mt-1 block text-xs" aria-live="polite">{status}</span></a>)}
    </nav>;
}

export function ManualUploadFlow({ baseFile, baseName, slots, setBaseFile, setBaseName, addSlot, removeSlot, updateSlot, disabled, readiness }: {
    baseFile: File | null; baseName: string; slots: ManualSlotItem[];
    setBaseFile: (file: File | null) => void; setBaseName: (name: string) => void;
    addSlot: () => void; removeSlot: (id: string) => void;
    updateSlot: <K extends keyof ManualSlotItem>(id: string, field: K, value: ManualSlotItem[K]) => void;
    disabled: boolean; readiness: Readiness;
}) {
    return <div className="space-y-6">
        <section id="manual-base" tabIndex={-1} className="scroll-mt-6 rounded-2xl border border-[#123c28]/20 bg-[#f3f6ed] p-4 sm:p-5">
            <h3 className="text-base font-bold">1. Base Ortho RGB <span className="ml-2 rounded-full bg-[#123c28] px-2 py-1 text-xs text-white">Wajib</span></h3>
            <p className="mb-4 mt-2 text-sm">Satu citra utama sebagai dasar visualisasi. Layer analisis ditambahkan terpisah.</p>
            <label htmlFor="base-name" className="mb-2 block text-sm font-bold">Nama layer · wajib</label>
            <input id="base-name" required value={baseName} onChange={event => setBaseName(event.target.value)} aria-invalid={!baseName.trim()} aria-describedby="base-name-error" className={inputClass} />
            <p id="base-name-error" className="mb-4 mt-2 text-sm" aria-live="polite">{!baseName.trim() && "Nama layer wajib diisi."}</p>
            <MiniDropzone id="base-file" file={baseFile} onChange={setBaseFile} disabled={disabled} />
        </section>
        <section id="manual-analysis" tabIndex={-1} className="scroll-mt-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-base font-bold">2. Layer analisis <span className="text-sm font-normal">· Opsional</span></h3><p className="mt-1 text-sm">Slot yang ditambahkan harus lengkap atau dihapus.</p></div><button type="button" className={`${buttonClass} bg-[#123c28] text-white`} onClick={addSlot}><Plus className="h-4 w-4" />Tambah layer</button></div>
            {!slots.length && <p className="rounded-2xl border border-dashed border-[#123c28]/20 bg-[#fbfcfa] p-6 text-sm">Belum ada layer analisis. Dataset dapat diunggah hanya dengan Base Ortho dan detail survei.</p>}
            {slots.map((slot, index) => <article key={slot.id} className="space-y-4 rounded-2xl border border-[#123c28]/15 bg-[#fbfcfa] p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3"><div><h4 className="font-bold">Layer analisis {index + 1}</h4><span className={`mt-2 inline-flex rounded-full border px-2 py-1 text-xs font-bold ${LAYER_TYPE_CONFIG[slot.layer_type].badgeClass}`}>{LAYER_TYPE_CONFIG[slot.layer_type].label}</span></div><button type="button" aria-label={`Hapus layer analisis ${index + 1}`} className={buttonClass} onClick={() => removeSlot(slot.id)}><Trash2 className="h-4 w-4" /></button></div>
                <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 text-sm font-bold"><span className="block">Tipe layer</span><select value={slot.layer_type} onChange={event => updateSlot(slot.id, "layer_type", event.target.value)} className={inputClass}>{manualLayerOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                    <label className="space-y-2 text-sm font-bold"><span className="block">Nama layer · wajib</span><input required value={slot.name} aria-invalid={!slot.name.trim()} onChange={event => updateSlot(slot.id, "name", event.target.value)} className={inputClass} /></label>
                </div>
                <MiniDropzone id={`file-${slot.id}`} file={slot.file} onChange={file => updateSlot(slot.id, "file", file)} disabled={disabled} />
                <label className="block rounded-xl bg-[#eef3e8] p-4 text-sm font-bold"><span className="mb-3 flex justify-between"><span>Opasitas awal</span><span>{Math.round(slot.default_opacity * 100)}%</span></span><input type="range" min="0" max="1" step="0.05" value={slot.default_opacity} aria-valuetext={`${Math.round(slot.default_opacity * 100)} persen`} onChange={event => updateSlot(slot.id, "default_opacity", Number(event.target.value))} className="w-full accent-[#123c28] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#123c28]" /></label>
                <p aria-live="polite" className="text-sm">{readiness.slotErrors[index].length ? readiness.slotErrors[index].join(" ") : "Layer lengkap."}</p>
            </article>)}
        </section>
    </div>;
}

export function UploadReview({ readiness, loading }: { readiness: Readiness; loading: boolean }) {
    return <section id="upload-review" tabIndex={-1} className="scroll-mt-6 rounded-2xl border border-[#123c28]/15 bg-[#eef3e8] p-5">
        <h2 className="text-base font-bold">4. Cek dataset sebelum unggah</h2>
        <p className="mt-2 text-sm">{readiness.files.length} file dipilih · {formatFileSize(readiness.totalBytes)} total</p>
        <ul className="mt-3 space-y-2 text-sm">{readiness.files.map((file, index) => <li key={index} className="flex flex-wrap justify-between gap-2 rounded-lg bg-[#fbfcfa] p-2"><span className="min-w-0 break-all">{file.name}</span><span>{formatFileSize(file.size)}</span></li>)}</ul>
        <ul className="mt-4 space-y-2 text-sm" aria-label="Checklist kesiapan" aria-live="polite">{[
            { label: "Base Ortho lengkap", ready: !readiness.baseErrors.length },
            { label: readiness.slotErrors.length ? "Semua slot analisis lengkap" : "Analisis opsional tidak ditambahkan", ready: readiness.slotErrors.every(errors => !errors.length) },
            ...readiness.metadata,
        ].map(item => <li key={item.label}>{item.ready ? "✓" : "○"} {item.label} — {item.ready ? "Sesuai" : "Perlu dilengkapi"}</li>)}</ul>
        <p id="submit-readiness" role="status" className="mt-4 font-bold">{loading ? "Unggah sedang berjalan. Formulir dikunci sementara." : readiness.ready ? "Siap unggah. Validasi geospasial dilakukan oleh server." : "Belum siap unggah. Lengkapi bagian yang ditandai di atas."}</p>
    </section>;
}

export function UploadGuide() {
    return <details className="rounded-2xl border border-[#123c28]/15 bg-[#f3f6ed] p-5">
        <summary className="cursor-pointer text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#123c28]">Panduan layer dan proses unggah</summary>
        <div className="mt-4 space-y-3 text-sm leading-relaxed">
            <p><strong>Ortho RGB:</strong> citra visual dasar. <strong>NDVI / VARI:</strong> indeks vegetasi. <strong>Nitrogen, Fosfor, Kalium:</strong> layer kandungan hara. <strong>DSM:</strong> elevasi permukaan. <strong>Multispektral:</strong> saluran spektral. Pilih Kustom untuk layer tematik lainnya.</p>
            <p>Nama bawaan dan opasitas menyesuaikan tipe; nama yang sudah Anda ubah tetap dipertahankan.</p>
            <p>Browser hanya memeriksa ekstensi .tif / .tiff dan file tidak kosong, bukan isi raster atau CRS. Server memeriksa metadata dan referensi spasial setelah file diterima. Jika ditolak, ikuti rincian serta solusi GIS yang ditampilkan.</p>
            <p>Setelah layer disimpan, PMTiles diproses di background agar peta dapat dimuat bertahap melalui HTTP Range. Unggah selesai tidak berarti konversi PMTiles sudah selesai.</p>
        </div>
    </details>;
}
