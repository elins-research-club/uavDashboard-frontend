import { fromBlob } from "geotiff";

/* ============================================================
   DETECTION TYPES
============================================================ */

export type DetectionStatus = "reading" | "detected" | "uncertain" | "error";

export type DetectionSource =
  | "metadata"
  | "raster-structure"
  | "filename"
  | "manual"
  | "uncertain";

export type DetectionConfidence = "high" | "medium" | "low";

export interface LayerDetection {
  layer_type: string;
  name: string;
  is_base: boolean;
  default_opacity: number;

  detection_source: DetectionSource;
  detection_confidence: DetectionConfidence;
  detection_reason: string;
}

/* ============================================================
   BATCH / MANUAL TYPES
============================================================ */

export interface BatchFileItem {
  id: string;
  file: File;
  name: string;
  layer_type: string;
  is_base: boolean;
  default_opacity: number;

  detection_status?: DetectionStatus;
  detection_source?: DetectionSource;
  detection_confidence?: DetectionConfidence;
  detection_reason?: string;
}

export interface ManualSlotItem {
  id: string;
  name: string;
  layer_type: string;
  file: File | null;
  default_opacity: number;
}

/* ============================================================
   LAYER CONFIG
============================================================ */

export const LAYER_TYPE_CONFIG: Record<
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

  ph: {
    label: "Keasaman Tanah (pH)",
    badgeClass: "border-indigo-200 bg-indigo-50 text-indigo-800",
    defaultName: "Keasaman Tanah (pH)",
    defaultOpacity: 0.75,
  },

  moisture: {
    label: "Kelembapan Tanah",
    badgeClass: "border-cyan-200 bg-cyan-50 text-cyan-800",
    defaultName: "Kelembapan Tanah",
    defaultOpacity: 0.75,
  },

  corganic: {
    label: "Karbon Organik (C-Org)",
    badgeClass: "border-yellow-200 bg-yellow-50 text-yellow-800",
    defaultName: "Karbon Organik (C-Org)",
    defaultOpacity: 0.75,
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

export const layerOptions = [
  {
    value: "ortho",
    label: "Citra Ortho RGB",
  },

  {
    value: "ndvi",
    label: "NDVI (Vegetasi)",
  },

  {
    value: "nitrogen",
    label: "Nitrogen (N)",
  },

  {
    value: "phosphorus",
    label: "Fosfor (P)",
  },

  {
    value: "kalium",
    label: "Kalium (K)",
  },

];

export const manualLayerOptions = layerOptions.filter(
  (option) => option.value !== "ortho"
);

/* ============================================================
   DETECTION RESULT HELPER
============================================================ */

function createDetection(
  layerType: string,
  source: DetectionSource,
  confidence: DetectionConfidence,
  reason: string,
  customName?: string
): LayerDetection {
  const config = LAYER_TYPE_CONFIG[layerType] ?? LAYER_TYPE_CONFIG.custom;

  return {
    layer_type: layerType,

    name: customName ?? config.defaultName,

    is_base: layerType === "ortho",

    default_opacity: config.defaultOpacity,

    detection_source: source,

    detection_confidence: confidence,

    detection_reason: reason,
  };
}

/* ============================================================
   TIFF TAG READER
============================================================ */

/**
 * geotiff.js typings tidak mengekspos semua TIFF tag
 * sebagai parameter string pada getValue().
 *
 * Karena itu kita akses getValue melalui cast function.
 */
function readTiffTag(image: any, tag: string): unknown {
  try {
    const getValue = image?.fileDirectory?.getValue as unknown as
      | ((tag: string) => unknown)
      | undefined;

    if (!getValue) {
      return undefined;
    }

    return getValue.call(image.fileDirectory, tag);
  } catch {
    return undefined;
  }
}

/* ============================================================
   VALUE NORMALIZATION
============================================================ */

function metadataToText(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => metadataToText(item)).join(" ");
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function normalizeMetadataText(value: unknown): string {
  return metadataToText(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
}

/* ============================================================
   SEMANTIC METADATA DETECTION
============================================================ */

function findSemanticLayer(metadataText: string): LayerDetection | null {
  if (!metadataText) {
    return null;
  }

  /*
   * ==========================================================
   * NDVI
   * ==========================================================
   */

  if (
    /\bndvi\b/.test(metadataText) ||
    /normalized difference vegetation/.test(metadataText)
  ) {
    return createDetection(
      "ndvi",
      "metadata",
      "high",
      "Tipe layer ditemukan dari metadata GeoTIFF."
    );
  }

  /*
   * ==========================================================
   * VARI
   * ==========================================================
   */

  if (
    /\bvari\b/.test(metadataText) ||
    /visible atmospherically resistant index/.test(metadataText)
  ) {
    return createDetection(
      "vari",
      "metadata",
      "high",
      "Tipe layer ditemukan dari metadata GeoTIFF."
    );
  }

  /*
   * ==========================================================
   * DSM
   * ==========================================================
   */

  if (
    /\bdsm\b/.test(metadataText) ||
    /\bdem\b/.test(metadataText) ||
    /\bdtm\b/.test(metadataText) ||
    /digital surface model/.test(metadataText) ||
    /digital elevation model/.test(metadataText)
  ) {
    return createDetection(
      "dsm",
      "metadata",
      "high",
      "Data elevasi ditemukan dari metadata GeoTIFF."
    );
  }

  /*
   * ==========================================================
   * NITROGEN
   * ==========================================================
   */

  if (
    /\bnitrogen\b/.test(metadataText) ||
    /\btotal nitrogen\b/.test(metadataText) ||
    /\bn[_ ]?ppm\b/.test(metadataText)
  ) {
    return createDetection(
      "nitrogen",
      "metadata",
      "high",
      "Data nitrogen ditemukan dari metadata GeoTIFF."
    );
  }

  /*
   * ==========================================================
   * PHOSPHORUS
   * ==========================================================
   */

  if (
    /\bphosphorus\b/.test(metadataText) ||
    /\bphosphor\b/.test(metadataText) ||
    /\bfosfor\b/.test(metadataText) ||
    /\bphosphate\b/.test(metadataText) ||
    /\bp[_ ]?ppm\b/.test(metadataText)
  ) {
    return createDetection(
      "phosphorus",
      "metadata",
      "high",
      "Data fosfor ditemukan dari metadata GeoTIFF."
    );
  }

  /*
   * ==========================================================
   * KALIUM
   * ==========================================================
   */

  if (
    /\bpotassium\b/.test(metadataText) ||
    /\bkalium\b/.test(metadataText) ||
    /\bk[_ ]?ppm\b/.test(metadataText)
  ) {
    return createDetection(
      "kalium",
      "metadata",
      "high",
      "Data kalium ditemukan dari metadata GeoTIFF."
    );
  }

  /*
   * ==========================================================
   * PH
   * ==========================================================
   */

  if (
    /\bsoil ph\b/.test(metadataText) ||
    /\bkeasaman tanah\b/.test(metadataText) ||
    /\bacidity\b/.test(metadataText) ||
    /\bph\b/.test(metadataText)
  ) {
    return createDetection(
      "ph",
      "metadata",
      "high",
      "Data pH ditemukan dari metadata GeoTIFF."
    );
  }

  /*
   * ==========================================================
   * MOISTURE
   * ==========================================================
   */

  if (
    /\bsoil moisture\b/.test(metadataText) ||
    /\bmoisture\b/.test(metadataText) ||
    /\bkelembapan\b/.test(metadataText) ||
    /\bkelembaban\b/.test(metadataText) ||
    /\bwater content\b/.test(metadataText)
  ) {
    return createDetection(
      "moisture",
      "metadata",
      "high",
      "Data kelembapan ditemukan dari metadata GeoTIFF."
    );
  }

  /*
   * ==========================================================
   * C-ORGANIC
   * ==========================================================
   */

  if (
    /\borganic carbon\b/.test(metadataText) ||
    /\bsoil organic carbon\b/.test(metadataText) ||
    /\bcarbon organic\b/.test(metadataText) ||
    /\bc organic\b/.test(metadataText) ||
    /\bc[- ]?org\b/.test(metadataText) ||
    /\bcorganic\b/.test(metadataText) ||
    /\bocn\b/.test(metadataText)
  ) {
    return createDetection(
      "corganic",
      "metadata",
      "high",
      "Data karbon organik ditemukan dari metadata GeoTIFF."
    );
  }

  /*
   * ==========================================================
   * MULTISPECTRAL
   * ==========================================================
   */

  if (
    /\bmultispectral\b/.test(metadataText) ||
    /\bmultispektral\b/.test(metadataText) ||
    /\bspectral\b/.test(metadataText) ||
    /\bspektral\b/.test(metadataText) ||
    /\bnear infrared\b/.test(metadataText) ||
    /\bnir\b/.test(metadataText) ||
    /\bred edge\b/.test(metadataText)
  ) {
    return createDetection(
      "spectral",
      "metadata",
      "high",
      "Data multispektral ditemukan dari metadata GeoTIFF."
    );
  }

  /*
   * ==========================================================
   * ORTHO
   * ==========================================================
   */

  if (
    /\borthomosaic\b/.test(metadataText) ||
    /\borthophoto\b/.test(metadataText) ||
    /\borthophotograph\b/.test(metadataText) ||
    /\borthophotomap\b/.test(metadataText) ||
    /\bortho\b/.test(metadataText) ||
    /\brgb\b/.test(metadataText)
  ) {
    return createDetection(
      "ortho",
      "metadata",
      "high",
      "Citra ortho/RGB ditemukan dari metadata GeoTIFF."
    );
  }

  return null;
}

/* ============================================================
   FILENAME DETECTION
============================================================ */

/**
 * Deteksi berdasarkan nama file.
 *
 * Ini sengaja dijadikan fallback kuat setelah semantic metadata.
 * Jika nama file eksplisit menyebut jenis layer,
 * hasil tersebut dipercaya sebelum heuristic pixel.
 */
export function autoDetectLayer(filename: string): LayerDetection {
  const original = filename.replace(/\.[^/.]+$/, "").trim();

  /*
   * Normalisasi:
   *
   * "Hasil-Ortho Final"
   * ->
   * "hasil_ortho_final"
   */
  const fn = original.toLowerCase().replace(/[\s\-]+/g, "_");

  /*
   * Token utama nama file.
   */
  const tokens = fn
    .split(/[_./\\]+/)
    .map((token) => token.trim())
    .filter(Boolean);

  const hasToken = (values: string[]) =>
    values.some((value) => tokens.includes(value));

  const hasWord = (patterns: RegExp[]) =>
    patterns.some((pattern) => pattern.test(fn));

  /* ==========================================================
     ORTHO
  ========================================================== */

  if (
    hasToken([
      "ortho",
      "orthomosaic",
      "orthophoto",
      "orthophotomap",
      "orthomosaicrgb",
      "orthorgb",
    ]) ||
    hasWord([
      /\bortho\b/,
      /\borthomosaic\b/,
      /\borthophoto\b/,
      /\borthophotomap\b/,
    ])
  ) {
    return createDetection(
      "ortho",
      "filename",
      "high",
      "Tipe layer ditemukan dari keyword ortho yang eksplisit pada nama file."
    );
  }

  /*
   * RGB.
   *
   * RGB dianggap cukup kuat sebagai ortho,
   * kecuali nama file juga menunjukkan spectral/analysis.
   */

  if (
    hasToken(["rgb", "rgbmosaic", "rgbortho"]) &&
    !hasToken([
      "ndvi",
      "vari",
      "nir",
      "rededge",
      "red_edge",
      "spectral",
      "multispectral",
    ])
  ) {
    return createDetection(
      "ortho",
      "filename",
      "high",
      "Tipe layer ditemukan dari keyword RGB pada nama file."
    );
  }

  /* ==========================================================
     NDVI
  ========================================================== */

  if (hasToken(["ndvi", "ndvi1", "ndvi2"]) || hasWord([/\bndvi\b/])) {
    return createDetection(
      "ndvi",
      "filename",
      "high",
      "Tipe layer ditemukan dari keyword NDVI pada nama file."
    );
  }

  /* ==========================================================
     VARI
  ========================================================== */

  if (hasToken(["vari"]) || hasWord([/\bvari\b/])) {
    return createDetection(
      "vari",
      "filename",
      "high",
      "Tipe layer ditemukan dari keyword VARI pada nama file."
    );
  }

  /* ==========================================================
     DSM
  ========================================================== */

  if (
    hasToken([
      "dsm",
      "dem",
      "dtm",
      "elevasi",
      "elevation",
      "altitude",
      "height",
      "terrain",
      "surface",
      "surface_model",
    ]) ||
    hasWord([
      /\bdsm\b/,
      /\bdem\b/,
      /\bdtm\b/,
      /\belevasi\b/,
      /\belevation\b/,
      /\bterrain\b/,
    ])
  ) {
    return createDetection(
      "dsm",
      "filename",
      "high",
      "Tipe layer ditemukan dari keyword DSM/elevasi pada nama file."
    );
  }

  /* ==========================================================
     NITROGEN
  ========================================================== */

  if (
    hasToken([
      "nitrogen",
      "nitrat",
      "nitro",
      "n_ppm",
      "nppm",
      "tn",
      "totalnitrogen",
      "total_nitrogen",
    ]) ||
    hasWord([/\bnitrogen\b/, /\bnitrat\b/, /\btotal\s+nitrogen\b/])
  ) {
    return createDetection(
      "nitrogen",
      "filename",
      "medium",
      "Tipe nitrogen ditemukan dari nama file."
    );
  }

  /*
   * Huruf N sebagai token tunggal.
   *
   * Sengaja berada setelah "nitrogen"
   * dan keyword lengkap lainnya.
   */
  if (hasToken(["n"]) && !hasToken(["ndvi", "nir", "nitrogen"])) {
    return createDetection(
      "nitrogen",
      "filename",
      "low",
      "Tipe nitrogen diperkirakan dari token N pada nama file."
    );
  }

  /* ==========================================================
     PHOSPHORUS
  ========================================================== */

  if (
    hasToken([
      "phosphorus",
      "phosphor",
      "fosfor",
      "fosfat",
      "phosphate",
      "p_ppm",
      "pppm",
    ]) ||
    hasWord([
      /\bphosphorus\b/,
      /\bphosphor\b/,
      /\bfosfor\b/,
      /\bfosfat\b/,
      /\bphosphate\b/,
    ])
  ) {
    return createDetection(
      "phosphorus",
      "filename",
      "medium",
      "Tipe fosfor ditemukan dari nama file."
    );
  }

  /*
   * P sebagai token.
   */
  if (hasToken(["p"]) && !hasToken(["ph", "phosphorus"])) {
    return createDetection(
      "phosphorus",
      "filename",
      "low",
      "Tipe fosfor diperkirakan dari token P pada nama file."
    );
  }

  /* ==========================================================
     KALIUM
  ========================================================== */

  if (
    hasToken(["kalium", "potassium", "potasium", "k_ppm", "kppm"]) ||
    hasWord([/\bkalium\b/, /\bpotassium\b/, /\bpotasium\b/])
  ) {
    return createDetection(
      "kalium",
      "filename",
      "medium",
      "Tipe kalium ditemukan dari nama file."
    );
  }

  /*
   * K sebagai token.
   */
  if (hasToken(["k"])) {
    return createDetection(
      "kalium",
      "filename",
      "low",
      "Tipe kalium diperkirakan dari token K pada nama file."
    );
  }

  /* ==========================================================
     PH
  ========================================================== */

  if (
    hasToken(["ph", "soilph", "soil_ph", "ph_tanah", "keasaman", "acidity"]) ||
    hasWord([/\bph\b/, /\bkeasaman\b/, /\bacidity\b/])
  ) {
    return createDetection(
      "ph",
      "filename",
      "medium",
      "Tipe pH ditemukan dari nama file."
    );
  }

  /* ==========================================================
     MOISTURE
  ========================================================== */

  if (
    hasToken([
      "moisture",
      "soilmoisture",
      "soil_moisture",
      "kelembapan",
      "kelembaban",
      "water",
      "watercontent",
      "soilwater",
    ]) ||
    hasWord([
      /\bmoisture\b/,
      /\bkelembapan\b/,
      /\bkelembaban\b/,
      /\bwater\s+content\b/,
    ])
  ) {
    return createDetection(
      "moisture",
      "filename",
      "medium",
      "Tipe kelembapan ditemukan dari nama file."
    );
  }

  /* ==========================================================
     C-ORGANIC
  ========================================================== */

  if (
    hasToken([
      "corganic",
      "c_organic",
      "organiccarbon",
      "organic_carbon",
      "carbon",
      "corg",
      "c_org",
      "soc",
      "ocn",
    ]) ||
    hasWord([
      /\borganic\s+carbon\b/,
      /\bcarbon\s+organic\b/,
      /\bc[-_ ]?org\b/,
      /\bc[-_ ]?organic\b/,
      /\bocn\b/,
    ])
  ) {
    return createDetection(
      "corganic",
      "filename",
      "medium",
      "Tipe karbon organik ditemukan dari nama file."
    );
  }

  /* ==========================================================
     MULTISPECTRAL
  ========================================================== */

  if (
    hasToken([
      "spectral",
      "multispectral",
      "multispektral",
      "spektral",
      "nir",
      "nir1",
      "rededge",
      "red_edge",
      "rededge1",
      "rededge2",
    ]) ||
    hasWord([
      /\bmultispectral\b/,
      /\bmultispektral\b/,
      /\bspectral\b/,
      /\bspektral\b/,
      /\bnir\b/,
      /\bred\s*edge\b/,
    ])
  ) {
    return createDetection(
      "spectral",
      "filename",
      "medium",
      "Tipe multispektral ditemukan dari nama file."
    );
  }

  /* ==========================================================
     GENERIC ORTHO FALLBACK
  ========================================================== */

  if (
    hasToken([
      "citra",
      "foto",
      "mosaic",
      "mosaik",
      "imagery",
      "image",
      "aerial",
    ])
  ) {
    return createDetection(
      "ortho",
      "filename",
      "low",
      "Indikasi citra berasal dari nama file generik."
    );
  }

  /* ==========================================================
     UNKNOWN
  ========================================================== */

  const cleanName = original
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();

  return {
    layer_type: "custom",

    name: cleanName || LAYER_TYPE_CONFIG.custom.defaultName,

    is_base: false,

    default_opacity: LAYER_TYPE_CONFIG.custom.defaultOpacity,

    detection_source: "uncertain",

    detection_confidence: "low",

    detection_reason:
      "Tidak ditemukan keyword layer yang dikenali pada nama file.",
  };
}

/* ============================================================
   RASTER SAMPLE INSPECTION
============================================================ */

interface SingleBandStats {
  min: number;
  max: number;
  count: number;
  withinMinusOneOneRatio: number;
  positiveRatio: number;
  negativeRatio: number;
}

async function inspectSingleBandValues(
  image: any
): Promise<SingleBandStats | null> {
  try {
    const width = image.getWidth();

    const height = image.getHeight();

    /*
     * Hanya mengambil sample kecil.
     * Tidak membaca seluruh raster.
     */
    const sampleWidth = Math.min(128, width);

    const sampleHeight = Math.min(128, height);

    const left = Math.max(0, Math.floor((width - sampleWidth) / 2));

    const top = Math.max(0, Math.floor((height - sampleHeight) / 2));

    const right = Math.min(width, left + sampleWidth);

    const bottom = Math.min(height, top + sampleHeight);

    const rasters = await image.readRasters({
      window: [left, top, right, bottom],
      samples: [0],
    });

    const firstBand = rasters[0];

    if (!firstBand) {
      return null;
    }

    const values = Array.from(
      firstBand as
        | Float32Array
        | Float64Array
        | Int8Array
        | Int16Array
        | Int32Array
        | Uint8Array
        | Uint16Array
        | Uint32Array
    ).filter((value) => Number.isFinite(Number(value)));

    if (!values.length) {
      return null;
    }

    let min = Infinity;
    let max = -Infinity;

    let withinMinusOneOne = 0;
    let positiveValues = 0;
    let negativeValues = 0;

    for (const raw of values) {
      const value = Number(raw);

      min = Math.min(min, value);

      max = Math.max(max, value);

      if (value >= -1 && value <= 1) {
        withinMinusOneOne++;
      }

      if (value > 0) {
        positiveValues++;
      }

      if (value < 0) {
        negativeValues++;
      }
    }

    return {
      min,
      max,

      count: values.length,

      withinMinusOneOneRatio: withinMinusOneOne / values.length,

      positiveRatio: positiveValues / values.length,

      negativeRatio: negativeValues / values.length,
    };
  } catch {
    return null;
  }
}

/* ============================================================
   RASTER VALUE HEURISTIC
============================================================ */

function detectFromRasterValues(
  stats: SingleBandStats | null
): LayerDetection | null {
  if (!stats) {
    return null;
  }

  /*
   * ----------------------------------------------------------
   * NDVI-LIKE RANGE
   * ----------------------------------------------------------
   *
   * Ini hanya sinyal medium/low.
   * Jangan mengklaim bahwa semua raster -1..1 pasti NDVI.
   */

  if (
    stats.withinMinusOneOneRatio >= 0.98 &&
    stats.min >= -1.05 &&
    stats.max <= 1.05
  ) {
    return createDetection(
      "ndvi",
      "raster-structure",
      "low",
      "Nilai raster sangat dominan berada pada rentang -1 sampai 1, yang umum pada indeks vegetasi seperti NDVI."
    );
  }

  /*
   * ----------------------------------------------------------
   * DSM-LIKE RANGE
   * ----------------------------------------------------------
   *
   * Hanya indikasi lemah.
   */

  if (stats.min >= 0 && stats.max > 5) {
    return createDetection(
      "dsm",
      "raster-structure",
      "low",
      "Nilai raster menyerupai data elevasi non-negatif."
    );
  }

  return null;
}

/* ============================================================
   AUTOMATIC DETECTION
============================================================ */

export async function detectLayer(file: File): Promise<LayerDetection> {
  try {
    const tiff = await fromBlob(file);

    const image = await tiff.getImage();

    /*
     * ========================================================
     * 1. SEMANTIC METADATA
     * ========================================================
     */

    let gdalMetadata = "";

    try {
      const rawGdalMetadata = await image.getGDALMetadata();

      gdalMetadata = normalizeMetadataText(rawGdalMetadata);
    } catch {
      gdalMetadata = "";
    }

    const imageDescription = normalizeMetadataText(
      readTiffTag(image, "ImageDescription")
    );

    const software = normalizeMetadataText(readTiffTag(image, "Software"));

    const metadataText = [gdalMetadata, imageDescription, software]
      .filter(Boolean)
      .join(" ");

    const semanticDetection = findSemanticLayer(metadataText);

    if (semanticDetection) {
      return semanticDetection;
    }

    /*
     * ========================================================
     * 2. NAMA FILE
     * ========================================================
     *
     * Ini sengaja SEBELUM struktur raster.
     *
     * Kalau user menulis:
     * ortho_final.tif
     *
     * kita percaya keyword eksplisit itu.
     */

    const filenameDetection = autoDetectLayer(file.name);

    if (filenameDetection.detection_source === "filename") {
      return filenameDetection;
    }

    /*
     * ========================================================
     * 3. STRUKTUR RASTER
     * ========================================================
     */

    const samplesPerPixel = image.getSamplesPerPixel();

    const bitsPerSampleValue = readTiffTag(image, "BitsPerSample");

    const sampleFormatValue = readTiffTag(image, "SampleFormat");

    const photometric = readTiffTag(image, "PhotometricInterpretation");

    const bitsPerSample = Array.isArray(bitsPerSampleValue)
      ? bitsPerSampleValue[0]
      : bitsPerSampleValue;

    const sampleFormat = Array.isArray(sampleFormatValue)
      ? sampleFormatValue[0]
      : sampleFormatValue;

    /*
     * PhotometricInterpretation:
     *
     * 2 = RGB
     *
     * Kita hanya menyebut ortho berdasarkan struktur
     * jika memang raster RGB + 8-bit.
     */

    const isRgb =
      (samplesPerPixel === 3 || samplesPerPixel === 4) &&
      bitsPerSample === 8 &&
      (sampleFormat === undefined || sampleFormat === 1) &&
      Number(photometric) === 2;

    if (isRgb) {
      return createDetection(
        "ortho",
        "raster-structure",
        "medium",
        "Raster memiliki struktur RGB/RGBA 8-bit dengan PhotometricInterpretation RGB."
      );
    }

    /*
     * >4 band = kandidat multispectral.
     */

    if (samplesPerPixel > 4) {
      return createDetection(
        "spectral",
        "raster-structure",
        "medium",
        `Raster memiliki ${samplesPerPixel} band dan terindikasi sebagai data multispektral.`
      );
    }

    /*
     * ========================================================
     * 4. SINGLE-BAND FLOAT
     * ========================================================
     */

    if (samplesPerPixel === 1 && Number(sampleFormat) === 3) {
      const rasterStats = await inspectSingleBandValues(image);

      const rasterDetection = detectFromRasterValues(rasterStats);

      if (rasterDetection) {
        /*
         * Jangan langsung menganggap NDVI sebagai base.
         */
        return {
          ...rasterDetection,
          is_base: false,
        };
      }
    }

    /*
     * ========================================================
     * 5. FALLBACK CUSTOM / UNCERTAIN
     * ========================================================
     */

    const cleanName = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return {
      layer_type: "custom",

      name: cleanName || LAYER_TYPE_CONFIG.custom.defaultName,

      is_base: false,

      default_opacity: LAYER_TYPE_CONFIG.custom.defaultOpacity,

      detection_source: "uncertain",

      detection_confidence: "low",

      detection_reason:
        "Metadata, nama file, struktur raster, dan sample nilai belum cukup untuk menentukan tipe layer.",
    };
  } catch {
    /*
     * ========================================================
     * PARSER ERROR
     * ========================================================
     *
     * Kalau GeoTIFF tidak bisa diparse,
     * tetap coba nama file.
     */

    const fallback = autoDetectLayer(file.name);

    if (fallback.detection_source === "filename") {
      return {
        ...fallback,

        detection_reason:
          "Metadata GeoTIFF tidak dapat dibaca. Tipe layer berhasil ditentukan dari nama file.",
      };
    }

    return {
      ...fallback,

      detection_source: "uncertain",

      detection_confidence: "low",

      detection_reason:
        "GeoTIFF tidak dapat dibaca dan tipe layer tidak dapat ditentukan.",
    };
  }
}

/* ============================================================
   FILE SIZE
============================================================ */

export function formatFileSize(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
