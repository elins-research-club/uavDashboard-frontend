// Helper murni — tanpa dependensi runtime agar dapat diuji langsung dengan Node.
// Tipe dibuat struktural agar cocok dengan definisi di upload-config.ts.

export interface NamedFile {
    name: string;
    size: number;
}

export interface LayerLike {
    name: string;
    file: NamedFile | null;
    layer_type: string;
    default_opacity: number;
}

export interface BatchLike {
    id: string;
    file: NamedFile;
    name: string;
    layer_type: string;
    is_base: boolean;
    default_opacity: number;
}

/** Nilai default tipe (harus sinkron dengan LAYER_TYPE_CONFIG). */
export const LAYER_TYPE_DEFAULTS: Record<string, { defaultName: string; defaultOpacity: number }> = {
    ortho: { defaultName: "Citra Ortho RGB", defaultOpacity: 1 },
    ndvi: { defaultName: "Indeks Vegetasi (NDVI)", defaultOpacity: 0.85 },
    vari: { defaultName: "Indeks Vegetasi (VARI)", defaultOpacity: 0.85 },
    nitrogen: { defaultName: "Kandungan Nitrogen (N)", defaultOpacity: 0.75 },
    phosphorus: { defaultName: "Kandungan Fosfor (P)", defaultOpacity: 0.75 },
    kalium: { defaultName: "Kandungan Kalium (K)", defaultOpacity: 0.75 },
    dsm: { defaultName: "Model Elevasi (DSM)", defaultOpacity: 0.7 },
    spectral: { defaultName: "Saluran Multispektral", defaultOpacity: 0.8 },
    custom: { defaultName: "Layer Tematik", defaultOpacity: 0.8 },
};

export function fileError(file: NamedFile | null): string | null {
    if (!file) return "Pilih satu file GeoTIFF.";
    if (!/\.tiff?$/i.test(file.name)) return "Ekstensi harus .tif atau .tiff.";
    if (file.size === 0) return "File kosong (0 byte). Pilih file lain.";
    return null;
}

export function layerErrors(layer: LayerLike, base = false): string[] {
    const errors: string[] = [];
    if (!layer.name.trim()) errors.push("Nama layer wajib diisi.");
    const error = fileError(layer.file);
    if (error) errors.push(error);
    if (!LAYER_TYPE_DEFAULTS[layer.layer_type] || (base ? layer.layer_type !== "ortho" : layer.layer_type === "ortho"))
        errors.push("Tipe layer tidak sesuai perannya.");
    if (!Number.isFinite(layer.default_opacity) || layer.default_opacity < 0 || layer.default_opacity > 1)
        errors.push("Opasitas harus antara 0–100%.");
    return errors;
}

export interface ChecklistItem {
    label: string;
    ready: boolean;
}

export function metadataChecklist(title: string, location: string, date: string): ChecklistItem[] {
    const parsed = new Date(`${date}T00:00:00Z`);
    const validDate =
        /^\d{4}-\d{2}-\d{2}$/.test(date) &&
        !Number.isNaN(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === date;
    return [
        { label: "Judul survei terisi", ready: Boolean(title.trim()) },
        { label: "Lokasi survei terisi", ready: Boolean(location.trim()) },
        { label: "Tanggal survei valid", ready: validDate },
    ];
}

export interface ManualReadiness<F extends NamedFile, S extends LayerLike> {
    baseErrors: string[];
    slotErrors: string[][];
    metadata: ChecklistItem[];
    errors: string[];
    ready: boolean;
    files: F[];
    totalBytes: number;
}

export function manualReadiness<F extends NamedFile, S extends LayerLike>(
    baseFile: F | null,
    baseName: string,
    slots: S[],
    title: string,
    location: string,
    date: string
): ManualReadiness<F, S> {
    const baseErrors = layerErrors({ file: baseFile, name: baseName, layer_type: "ortho", default_opacity: 1 }, true);
    const slotErrors = slots.map((slot) => layerErrors(slot));
    const metadata = metadataChecklist(title, location, date);
    const errors = [
        ...baseErrors.map((e) => `Base: ${e}`),
        ...slotErrors.flatMap((errs, i) => errs.map((e) => `Layer analisis ${i + 1}: ${e}`)),
        ...metadata
            .filter((item) => !item.ready)
            .map((item) => item.label.replace("terisi", "wajib diisi").replace("valid", "harus valid")),
    ];
    const files = [baseFile, ...slots.map((s) => s.file)].filter((f): f is F => f !== null);
    return {
        baseErrors,
        slotErrors,
        metadata,
        errors,
        ready: errors.length === 0,
        files,
        totalBytes: files.reduce((sum, f) => sum + f.size, 0),
    };
}

/** Jaga agar batch selalu punya tepat satu base, dan base selalu bertipe ortho. */
export function normalizeBatchBase<T extends BatchLike>(items: T[]): T[] {
    if (!items.length) return items;
    const base =
        items.find((item) => item.is_base && item.layer_type === "ortho") ??
        items.find((item) => item.layer_type === "ortho") ??
        items[0];
    return items.map((item) =>
        item.id === base.id
            ? { ...item, is_base: true, layer_type: "ortho" }
            : { ...item, is_base: false }
    );
}

export function batchErrors<T extends BatchLike>(items: T[], title: string, location: string, date: string): string[] {
    const errors = metadataChecklist(title, location, date)
        .filter((item) => !item.ready)
        .map((item) => item.label);
    if (!items.length) errors.push("Pilih minimal satu file GeoTIFF.");
    if (
        items.filter((item) => item.is_base).length !== 1 ||
        items.some((item) => item.is_base && item.layer_type !== "ortho")
    )
        errors.push("Dataset harus memiliki tepat satu base Ortho.");
    items.forEach((item, index) => {
        const error = fileError(item.file);
        if (error) errors.push(`File ${index + 1}: ${error}`);
        if (!item.name.trim()) errors.push(`Nama layer ${index + 1} wajib diisi.`);
    });
    return errors;
}

export function createManualSlot<T extends LayerLike>(id: string, previous?: T): T {
    const layer_type = previous?.layer_type ?? "ndvi";
    const config = LAYER_TYPE_DEFAULTS[layer_type] ?? LAYER_TYPE_DEFAULTS.custom;
    return {
        id,
        layer_type,
        name: config.defaultName,
        default_opacity: config.defaultOpacity,
        file: null,
    } as unknown as T;
}
